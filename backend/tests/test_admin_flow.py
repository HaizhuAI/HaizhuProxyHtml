"""P3 admin: RBAC, nodes, shops, api-keys, telegram config, settings"""
import uuid

from tests.conftest import client  # noqa


def _token(c, email="admin@haizhu.dev", pwd="admin123456"):
    return c.post("/api/auth/login", json={"email": email, "password": pwd}).json()["token"]


def test_admin_rbac(client):
    email = f"rbac{uuid.uuid4().hex[:8]}@test.dev"
    user = client.post("/api/auth/register", json={"email": email, "username": "rbac", "password": "pass123456"}).json()
    r = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {user['token']}"})
    assert r.status_code == 403
    r2 = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {_token(client)}"})
    assert r2.status_code == 200
    assert "users" in r2.json()


def test_node_crud(client):
    token = _token(client)
    r = client.post("/api/admin/nodes", json={"name": "TEST-01", "region": "hk", "host": "t1.haizhu.dev", "port": 443, "protocol": "vless", "tls": True},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201, r.text
    node_id = r.json()["id"]
    assert r.json()["region"] == "HK"  # normalized
    lst = client.get("/api/admin/nodes", headers={"Authorization": f"Bearer {token}"})
    assert any(n["id"] == node_id for n in lst.json())
    d = client.delete(f"/api/admin/nodes/{node_id}", headers={"Authorization": f"Bearer {token}"})
    assert d.status_code == 204


def test_shop_crud(client):
    token = _token(client)
    r = client.post("/api/admin/shops", json={"name": "测试商城", "url": "https://shop.test.dev", "enabled": True},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    sid = r.json()["id"]
    p = client.patch(f"/api/admin/shops/{sid}", json={"name": "测试商城2", "url": "https://shop2.test.dev", "enabled": False},
                     headers={"Authorization": f"Bearer {token}"})
    assert p.status_code == 200 and p.json()["enabled"] is False
    d = client.delete(f"/api/admin/shops/{sid}", headers={"Authorization": f"Bearer {token}"})
    assert d.status_code == 204


def test_api_key_lifecycle(client):
    token = _token(client)
    r = client.post("/api/admin/api-keys", json={"name": "测试", "scopes": ["nodes:read", "traffic:read"]},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    plain = r.json()["key"]
    assert plain.startswith("hz_")
    # key is stored hashed: list shows masked
    lst = client.get("/api/admin/api-keys", headers={"Authorization": f"Bearer {token}"})
    assert all("*" in k["key"] for k in lst.json())
    d = client.delete(f"/api/admin/api-keys/{r.json()['id']}", headers={"Authorization": f"Bearer {token}"})
    assert d.status_code == 204


def test_telegram_config_masking(client):
    token = _token(client)
    r = client.post("/api/admin/telegram", json={"enabled": True, "bot_token": "123456:ABC-DEF-SECRET", "bot_username": "@t", "chat_id": "-1001", "widget_title": "客服", "welcome_message": "hi", "placeholder": "say"},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    assert "SECRET" not in r.json()["bot_token_masked"]
    assert r.json()["bot_token_masked"].startswith("1234")


def test_settings_patch(client):
    token = _token(client)
    r = client.patch("/api/admin/settings", json={"invite_bonus_mb": 2048}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["invite_bonus_mb"] == 2048
    # restore
    client.patch("/api/admin/settings", json={"invite_bonus_mb": 1024}, headers={"Authorization": f"Bearer {token}"})


def test_public_endpoints(client):
    assert client.get("/api/public/regions").status_code == 200
    assert client.get("/api/public/plans").status_code == 200
    assert client.get("/api/health").json()["status"] == "ok"
