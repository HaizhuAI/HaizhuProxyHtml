"""P1 auth: register (with invite) → login → me → rate limit"""
import uuid

from tests.conftest import client  # noqa


def _register(c, email, username, password="pass123456", invite=""):
    return c.post("/api/auth/register", json={
        "email": email, "username": username, "password": password, "invite_code": invite,
    })


def test_register_and_login(client):
    email = f"u{uuid.uuid4().hex[:8]}@test.dev"
    r = _register(client, email, "alice")
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["token"]
    assert body["user"]["role"] == "user"
    assert body["user"]["invite_code"].startswith("HZ-")

    r = client.post("/api/auth/login", json={"email": email, "password": "pass123456"})
    assert r.status_code == 200, r.text

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_duplicate_email_conflict(client):
    email = f"dup{uuid.uuid4().hex[:8]}@test.dev"
    assert _register(client, email, "bob").status_code == 201
    assert _register(client, email, "bob2").status_code == 409


def test_invalid_invite_rejected(client):
    email = f"inv{uuid.uuid4().hex[:8]}@test.dev"
    r = _register(client, email, "carol", invite="HZ-NOPE-0000")
    assert r.status_code == 400
    assert "邀请码无效" in r.json()["detail"]


def test_invite_bonus_flow(client):
    email = f"host{uuid.uuid4().hex[:8]}@test.dev"
    host = _register(client, email, "host").json()["user"]
    email2 = f"guest{uuid.uuid4().hex[:8]}@test.dev"
    r = _register(client, email2, "guest", invite=host["invite_code"])
    assert r.status_code == 201, r.text
    # host got bonus
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {r.json()['token']}"})
    # guest sees invite chain
    assert me.json()["invited_by"] == host["invite_code"]


def test_login_rate_limit(client):
    email = f"lock{uuid.uuid4().hex[:8]}@test.dev"
    _register(client, email, "locked")
    for _ in range(5):
        client.post("/api/auth/login", json={"email": email, "password": "wrong-pass"})
    r = client.post("/api/auth/login", json={"email": email, "password": "wrong-pass"})
    assert r.status_code == 429
