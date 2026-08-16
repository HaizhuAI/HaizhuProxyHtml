from unittest.mock import AsyncMock, patch

import httpx


def response(method, url, status, payload):
    request = httpx.Request(method, url)
    return httpx.Response(status, json=payload, request=request)


def test_discover_models(client):
    mocked = AsyncMock(return_value=response("GET", "https://example.test/v1/models", 200, {"data": [{"id": "model-b"}, {"id": "model-a", "owned_by": "lab"}]}))
    with patch("httpx.AsyncClient.get", mocked):
        res = client.post("/api/model-lab/models", json={"base_url": "https://example.test", "api_key": "secret", "timeout_seconds": 10})
    assert res.status_code == 200
    assert [item["id"] for item in res.json()["models"]] == ["model-a", "model-b"]


def test_probe_model(client):
    body = {"model": "model-a", "choices": [{"message": {"content": "OK"}}], "usage": {"total_tokens": 3}}
    mocked = AsyncMock(return_value=response("POST", "https://example.test/v1/chat/completions", 200, body))
    with patch("httpx.AsyncClient.post", mocked):
        res = client.post("/api/model-lab/probe", json={"base_url": "https://example.test/v1", "api_key": "secret", "model": "model-a"})
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert res.json()["content"] == "OK"


def test_rejects_invalid_url(client):
    res = client.post("/api/model-lab/models", json={"base_url": "file:///etc/passwd", "api_key": ""})
    assert res.status_code == 422
