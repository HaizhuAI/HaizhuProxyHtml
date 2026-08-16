"""Telegram Bot gateway — sendMessage via Bot API, webhook endpoint reserved."""
import httpx

TELEGRAM_API = "https://api.telegram.org"


def send_message(bot_token: str, chat_id: str, text: str, timeout: float = 8.0) -> dict:
    url = f"{TELEGRAM_API}/bot{bot_token}/sendMessage"
    resp = httpx.post(
        url,
        json={"chat_id": chat_id, "text": text, "disable_web_page_preview": True},
        timeout=timeout,
    )
    resp.raise_for_status()
    return resp.json()


def get_me(bot_token: str) -> dict:
    resp = httpx.post(f"{TELEGRAM_API}/bot{bot_token}/getMe", timeout=8.0)
    resp.raise_for_status()
    return resp.json()


def set_webhook(bot_token: str, url: str) -> dict:
    resp = httpx.post(f"{TELEGRAM_API}/bot{bot_token}/setWebhook", json={"url": url}, timeout=8.0)
    resp.raise_for_status()
    return resp.json()
