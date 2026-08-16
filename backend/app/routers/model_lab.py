"""OpenAI-compatible API model discovery, health testing, and chat proxy."""
from __future__ import annotations

import time
from typing import Any, Literal
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/api/model-lab", tags=["model-lab"])


class ApiConnection(BaseModel):
    base_url: str = Field(min_length=4, max_length=2048)
    api_key: str = Field(default="", max_length=8192)
    timeout_seconds: float = Field(default=30, ge=2, le=180)

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Base URL 必须是有效的 HTTP/HTTPS 地址")
        return value


class ProbeRequest(ApiConnection):
    model: str = Field(min_length=1, max_length=512)
    prompt: str = Field(default="Reply with exactly: OK", max_length=4000)


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=100000)


class ChatRequest(ApiConnection):
    model: str = Field(min_length=1, max_length=512)
    messages: list[ChatMessage] = Field(min_length=1, max_length=100)
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=1, le=100000)


def endpoint(base_url: str, path: str) -> str:
    base = base_url.rstrip("/")
    if base.endswith("/v1"):
        return f"{base}{path}"
    return f"{base}/v1{path}"


def headers(api_key: str) -> dict[str, str]:
    result = {"Accept": "application/json", "Content-Type": "application/json"}
    if api_key:
        result["Authorization"] = f"Bearer {api_key}"
    return result


def upstream_error(exc: Exception) -> HTTPException:
    if isinstance(exc, httpx.TimeoutException):
        return HTTPException(504, "上游 API 请求超时")
    if isinstance(exc, httpx.HTTPStatusError):
        detail: Any
        try:
            detail = exc.response.json()
        except ValueError:
            detail = exc.response.text[:1000]
        return HTTPException(exc.response.status_code, {"upstream": detail})
    return HTTPException(502, f"无法连接上游 API: {exc}")


@router.post("/models")
async def discover_models(payload: ApiConnection):
    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=payload.timeout_seconds, follow_redirects=True) as client:
            response = await client.get(endpoint(payload.base_url, "/models"), headers=headers(payload.api_key))
            response.raise_for_status()
            body = response.json()
    except Exception as exc:
        raise upstream_error(exc) from exc
    models = body.get("data", body if isinstance(body, list) else [])
    normalized = sorted(
        [{"id": str(item.get("id", "")), "owned_by": item.get("owned_by", "unknown")} for item in models if isinstance(item, dict) and item.get("id")],
        key=lambda item: item["id"],
    )
    return {"models": normalized, "count": len(normalized), "latency_ms": round((time.perf_counter() - started) * 1000)}


async def run_chat(payload: ChatRequest) -> dict[str, Any]:
    body: dict[str, Any] = {
        "model": payload.model,
        "messages": [message.model_dump() for message in payload.messages],
        "temperature": payload.temperature,
        "stream": False,
    }
    if payload.max_tokens is not None:
        body["max_tokens"] = payload.max_tokens
    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=payload.timeout_seconds, follow_redirects=True) as client:
            response = await client.post(endpoint(payload.base_url, "/chat/completions"), headers=headers(payload.api_key), json=body)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        raise upstream_error(exc) from exc
    choices = data.get("choices") or []
    content = ""
    if choices:
        content = choices[0].get("message", {}).get("content", "")
    return {
        "content": content,
        "model": data.get("model", payload.model),
        "usage": data.get("usage"),
        "latency_ms": round((time.perf_counter() - started) * 1000),
        "raw": data,
    }


@router.post("/probe")
async def probe_model(payload: ProbeRequest):
    result = await run_chat(ChatRequest(
        base_url=payload.base_url,
        api_key=payload.api_key,
        timeout_seconds=payload.timeout_seconds,
        model=payload.model,
        messages=[ChatMessage(role="user", content=payload.prompt)],
        temperature=0,
        max_tokens=16,
    ))
    return {"ok": True, **result}


@router.post("/chat")
async def chat(payload: ChatRequest):
    return await run_chat(payload)
