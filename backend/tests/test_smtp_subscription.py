"""SMTP config + send-on-generate + subscription distribution."""
import base64
import uuid

from tests.conftest import client  # noqa


def _admin(client):
    r = client.post("/api/auth/login", json={"email": "admin@haizhu.dev", "password": "admin123456"})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _register(client):
    email = f"sub{uuid.uuid4().hex[:8]}@test.dev"
    r = client.post("/api/auth/register", json={
        "email": email, "username": "subber", "password": "pass123456", "invite_code": "",
    })
    assert r.status_code == 201, r.text
    return r.json()["token"]


def test_smtp_crud_and_mask(client):
    h = _admin(client)
    r = client.get("/api/admin/smtp", headers=h)
    assert r.status_code == 200
    assert r.json()["password_masked"] == ""

    r = client.post("/api/admin/smtp", json={
        "enabled": True, "host": "smtp.example.com", "port": 587,
        "username": "noreply@example.com", "password": "s3cret!",
        "sender": "noreply@example.com", "use_tls": True, "use_ssl": False,
    }, headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["host"] == "smtp.example.com"
    assert body["password_masked"] != "s3cret!"
    assert "s3cret!" not in body["password_masked"]
    assert body["enabled"] is True

    # masked round-trip must not overwrite password
    r = client.post("/api/admin/smtp", json={
        "enabled": True, "host": "smtp.example.com", "port": 587,
        "username": "noreply@example.com", "password": body["password_masked"],
        "sender": "noreply@example.com", "use_tls": True, "use_ssl": False,
    }, headers=h)
    assert r.status_code == 200
    assert r.json()["password_masked"] == body["password_masked"]


def test_smtp_test_sends(client, monkeypatch):
    sent = {}

    class FakeSMTP:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def ehlo(self):  # noqa
            pass

        def starttls(self):  # noqa
            pass

        def login(self, u, pw):  # noqa
            sent["user"] = u
            sent["pw"] = pw

        def send_message(self, msg):  # noqa
            sent["msg"] = msg

    import smtplib
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)

    h = _admin(client)
    r = client.post("/api/admin/smtp/test", headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["delivered"] is True
    assert sent["user"] == "noreply@example.com"
    assert sent["pw"] == "s3cret!"
    assert "HaizhuProxy SMTP" in sent["msg"]["Subject"]


def test_gen_cdk_send_to_email(client, monkeypatch):
    sent = {}

    class FakeSMTP:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def ehlo(self):  # noqa
            pass

        def starttls(self):  # noqa
            pass

        def login(self, *a):  # noqa
            pass

        def send_message(self, msg):  # noqa
            sent["msg"] = msg

    import smtplib
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)

    h = _admin(client)
    # self-contained: ensure smtp config exists (no cross-test dependency)
    client.post("/api/admin/smtp", json={
        "enabled": True, "host": "smtp.example.com", "port": 587,
        "username": "noreply@example.com", "password": "s3cret!",
        "sender": "noreply@example.com", "use_tls": True, "use_ssl": False,
    }, headers=h)
    r = client.post("/api/admin/cdks/generate", json={
        "count": 2, "traffic_mb": 5120, "expires_days": 30,
        "send_to_email": True, "recipient_email": "buyer@example.com",
    }, headers=h)
    assert r.status_code == 201, r.text
    codes = [c["code"] for c in r.json()]
    assert len(codes) == 2
    assert all(c.startswith("HZ-") for c in codes)
    # email contains both codes (multipart walk)
    html = ""
    for part in sent["msg"].walk():
        if part.get_content_type() == "text/html":
            html = part.get_payload(decode=True).decode("utf-8", "ignore")
    assert codes[0] in html and codes[1] in html
    assert sent["msg"]["To"] == "buyer@example.com"

    # missing recipient -> 400, cdk still not returned
    r = client.post("/api/admin/cdks/generate", json={
        "count": 1, "traffic_mb": 1024, "send_to_email": True,
    }, headers=h)
    assert r.status_code == 400


def test_subscription_distribution(client):
    token = _register(client)

    # console returns sub urls
    r = client.get("/api/console/nodes", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["nodes"]) >= 1
    assert body["sub_url"].endswith("/v2ray")
    assert body["clash_url"].endswith("/clash")
    sub_token = body["sub_url"].split("/")[-2]

    # v2ray subscription: base64 → vless links with per-user uuid
    r = client.get(f"/api/sub/{sub_token}/v2ray")
    assert r.status_code == 200
    text = base64.b64decode(r.text).decode()
    lines = [l for l in text.splitlines() if l.strip()]
    assert len(lines) >= 1
    assert any(l.startswith("vless://") or l.startswith("vmess://") or l.startswith("trojan://") or l.startswith("ss://") for l in lines)
    assert r.headers.get("Subscription-Userinfo", "").startswith("upload=0; download=")

    # clash yaml
    r = client.get(f"/api/sub/{sub_token}/clash")
    assert r.status_code == 200
    assert "proxies:" in r.text
    assert "mixed-port: 7890" in r.text

    # index redirects
    r = client.get(f"/api/sub/{sub_token}", follow_redirects=False)
    assert r.status_code == 302
    assert r.headers["location"] == f"/api/sub/{sub_token}/v2ray"

    # unknown token -> 404
    assert client.get("/api/sub/does-not-exist/v2ray").status_code == 404


def test_subscription_uuid_stable_per_user(client):
    """Same user, two fetches → same uuid in share links."""
    token = _register(client)
    r = client.get("/api/console/nodes", headers={"Authorization": f"Bearer {token}"})
    sub_token = r.json()["sub_url"].split("/")[-2]
    t1 = base64.b64decode(client.get(f"/api/sub/{sub_token}/v2ray").text).decode()
    t2 = base64.b64decode(client.get(f"/api/sub/{sub_token}/v2ray").text).decode()
    uid1 = [l for l in t1.splitlines() if l.startswith("vless://")][0].split("@")[0].replace("vless://", "")
    uid2 = [l for l in t2.splitlines() if l.startswith("vless://")][0].split("@")[0].replace("vless://", "")
    assert uid1 == uid2 and len(uid1) == 36
