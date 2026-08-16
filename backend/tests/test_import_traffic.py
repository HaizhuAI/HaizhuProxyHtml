"""P12/P13: bulk node import parser + user traffic detail page."""
import base64
import uuid
from datetime import datetime, timedelta, timezone

from tests.conftest import client  # noqa


def _admin(client):
    r = client.post("/api/auth/login", json={"email": "admin@haizhu.dev", "password": "admin123456"})
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _reg(client):
    email = f"it{uuid.uuid4().hex[:8]}@test.dev"
    r = client.post("/api/auth/register", json={
        "email": email, "username": "it", "password": "pass123456", "invite_code": "",
    })
    return r.json()["token"]


def test_bulk_import_share_links(client):
    h = _admin(client)
    text = "\n".join([
        "vless://abc-123@imp1.test.dev:443?encryption=none&security=reality&type=ws&path=%2Fray&host=cdn.x.com&flow=xtls-rprx-vision&pbk=PBK1&sid=aa11#IMP-1",
        "vmess://" + base64.urlsafe_b64encode(b'{"v":"2","ps":"IMP-2","add":"imp2.test.dev","port":"443","id":"u2","aid":"0","net":"ws","path":"/jw","host":"cdn.x.com","tls":"tls"}').decode().rstrip("="),
        "trojan://pass@imp3.test.dev:443?security=tls&type=grpc&serviceName=svc#IMP-3",
        "ss://YWVzLTI1Ni1nY206cGFzcw==@imp4.test.dev:443#IMP-4",
        "IMP-5|imp5.test.dev:8443|vless|US|tls",
        "garbage line not a link",
    ])
    r = client.post("/api/admin/nodes/import", json={"text": text, "region_default": "HK"}, headers=h)
    assert r.status_code == 201, r.text
    body = r.json()
    assert len(body["created"]) == 5, body
    assert len(body["failed"]) == 1
    assert body["failed"][0]["reason"] == "无法识别的格式"
    by_name = {n["name"]: n for n in body["created"]}
    assert by_name["IMP-1"]["security"] == "reality"
    assert by_name["IMP-1"]["network"] == "ws"
    assert by_name["IMP-1"]["path"] == "/ray"
    assert by_name["IMP-1"]["reality_pbk"] == "PBK1"
    assert by_name["IMP-2"]["protocol"] == "vmess"
    assert by_name["IMP-3"]["network"] == "grpc"
    assert by_name["IMP-4"]["protocol"] == "shadowsocks"
    assert by_name["IMP-5"]["region"] == "US"


def test_bulk_import_dedup_and_duplicate_ignored(client):
    h = _admin(client)
    text = "DUP-1|dup1.test.dev:443|vless|HK|tls\nDUP-1|dup1.test.dev:443|vless|HK|tls"
    r = client.post("/api/admin/nodes/import", json={"text": text}, headers=h)
    assert len(r.json()["created"]) == 1  # second identical line deduped in one call


def test_imported_nodes_flow_into_subscription(client):
    h = _admin(client)
    client.post("/api/admin/nodes/import", json={
        "text": "vless://abc@imp6.test.dev:443?security=reality&pbk=PBK6&sid=66#IMP-6", "region_default": "SG",
    }, headers=h)
    token = _reg(client)
    r = client.get("/api/console/nodes", headers={"Authorization": f"Bearer {token}"})
    sub_token = r.json()["sub_url"].split("/")[-2]
    import base64 as b64
    txt = b64.b64decode(client.get(f"/api/sub/{sub_token}/v2ray").text).decode()
    assert "IMP-6" in txt and "security=reality" in txt and "pbk=PBK6" in txt


def test_console_traffic_detail(client):
    token = _reg(client)
    h = {"Authorization": f"Bearer {token}"}
    # seed user has logs; register fresh user has none → write one via DB? use public path:
    # admin creates node, then no logs for fresh user — assert empty page shape first
    r = client.get("/api/console/traffic?page=1&page_size=5", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "total" in body and "items" in body
    assert body["total"] >= 0

    # existing seed user has 14 daily logs
    login = client.post("/api/auth/login", json={"email": "neo@example.com", "password": "user123456"})
    th = {"Authorization": f"Bearer {login.json()['token']}"}
    r = client.get("/api/console/traffic?page=1&page_size=3", headers=th)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 14
    assert len(body["items"]) == 3
    it = body["items"][0]
    assert it["bytes_in"] > 0 and it["bytes_out"] > 0
    assert it["node_name"]
    # paging
    r2 = client.get("/api/console/traffic?page=2&page_size=10", headers=th)
    assert r2.status_code == 200
    assert len(r2.json()["items"]) == 4
