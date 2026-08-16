"""P2 cdk: admin generate → user redeem → balance → revoke semantics"""
import uuid

from tests.conftest import client  # noqa


def _admin_token(c):
    r = c.post("/api/auth/login", json={"email": "admin@haizhu.dev", "password": "admin123456"})
    assert r.status_code == 200
    return r.json()["token"]


def _new_user(c):
    email = f"cdk{uuid.uuid4().hex[:8]}@test.dev"
    r = c.post("/api/auth/register", json={"email": email, "username": "cdkuser", "password": "pass123456"})
    return r.json()


def test_cdk_generate_and_redeem(client):
    token = _admin_token(client)
    r = client.post("/api/admin/cdks/generate", json={"count": 3, "traffic_mb": 5120, "expires_days": 30},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201, r.text
    cdks = r.json()
    assert len(cdks) == 3
    assert all(c["status"] == "unused" for c in cdks)
    assert all(c["code"].startswith("HZ-") for c in cdks)

    # redeem with a fresh user
    user = _new_user(client)
    before = user["user"]["balance_mb"]
    rr = client.post("/api/console/redeem", json={"code": cdks[0]["code"]},
                     headers={"Authorization": f"Bearer {user['token']}"})
    assert rr.status_code == 200, rr.text
    assert rr.json()["added"] == 5120
    assert rr.json()["balance"] == before + 5120

    # double redeem fails
    rr2 = client.post("/api/console/redeem", json={"code": cdks[0]["code"]},
                      headers={"Authorization": f"Bearer {user['token']}"})
    assert rr2.status_code == 400
    assert "已被使用" in rr2.json()["detail"]


def test_cdk_revoke(client):
    token = _admin_token(client)
    r = client.post("/api/admin/cdks/generate", json={"count": 1, "traffic_mb": 1024},
                    headers={"Authorization": f"Bearer {token}"})
    cdk = r.json()[0]
    rr = client.post(f"/api/admin/cdks/{cdk['id']}/revoke", headers={"Authorization": f"Bearer {token}"})
    assert rr.status_code == 200
    assert rr.json()["status"] == "revoked"
    user = _new_user(client)
    rede = client.post("/api/console/redeem", json={"code": cdk["code"]},
                       headers={"Authorization": f"Bearer {user['token']}"})
    assert rede.status_code == 400
    assert "撤回" in rede.json()["detail"]


def test_bad_cdk_format(client):
    user = _new_user(client)
    r = client.post("/api/console/redeem", json={"code": "NOT-A-CDK"},
                    headers={"Authorization": f"Bearer {user['token']}"})
    assert r.status_code == 400
