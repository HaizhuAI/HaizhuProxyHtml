"""P9/P10/P11: protocol params in subscriptions, user probe, csv export."""
import base64
import csv
import io
import uuid

from tests.conftest import client  # noqa


def _admin(client):
    r = client.post("/api/auth/login", json={"email": "admin@haizhu.dev", "password": "admin123456"})
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _reg(client):
    email = f"pr{uuid.uuid4().hex[:8]}@test.dev"
    r = client.post("/api/auth/register", json={
        "email": email, "username": "pr", "password": "pass123456", "invite_code": "",
    })
    return r.json()["token"]


def test_node_create_with_advanced_params(client):
    h = _admin(client)
    r = client.post("/api/admin/nodes", json={
        "name": "TEST-Reality", "region": "US", "host": "r1.test.dev", "port": 443,
        "protocol": "vless", "tls": True, "network": "tcp", "path": "",
        "sni": "www.microsoft.com", "flow": "xtls-rprx-vision", "security": "reality",
        "reality_pbk": "PBK_ABC", "reality_sid": "0123456789abcdef",
    }, headers=h)
    assert r.status_code == 201, r.text
    n = r.json()
    assert n["security"] == "reality"
    assert n["flow"] == "xtls-rprx-vision"
    assert n["reality_pbk"] == "PBK_ABC"


def test_subscription_reality_ws_grpc_links(client):
    token = _reg(client)
    # add one node of each transport
    h = _admin(client)
    cases = [
        ("R-Node", "vless", "tcp", "", "www.microsoft.com", "xtls-rprx-vision", "reality", "PBK_X", "aa11bb22"),
        ("W-Node", "vless", "ws", "/ray", "cdn.test.dev", "", "tls", "", ""),
        ("G-Node", "vless", "grpc", "hz-grpc", "", "xtls-rprx-vision", "tls", "", ""),
    ]
    for name, proto, net, path, sni, flow, sec, pbk, sid in cases:
        client.post("/api/admin/nodes", json={
            "name": name, "region": "US", "host": f"{name.lower()}.test.dev", "port": 443,
            "protocol": proto, "tls": True, "network": net, "path": path, "sni": sni,
            "flow": flow, "security": sec, "reality_pbk": pbk, "reality_sid": sid,
        }, headers=h)

    r = client.get("/api/console/nodes", headers={"Authorization": f"Bearer {token}"})
    sub_token = r.json()["sub_url"].split("/")[-2]
    txt = base64.b64decode(client.get(f"/api/sub/{sub_token}/v2ray").text).decode()
    rlink = [l for l in txt.splitlines() if "R-Node" in l][0]
    wlink = [l for l in txt.splitlines() if "W-Node" in l][0]
    glink = [l for l in txt.splitlines() if "G-Node" in l][0]
    assert "security=reality" in rlink
    assert "pbk=PBK_X" in rlink and "sid=aa11bb22" in rlink
    assert "flow=xtls-rprx-vision" in rlink
    assert "type=ws&path=/ray&host=cdn.test.dev" in wlink
    assert "type=grpc&serviceName=hz-grpc" in glink

    # clash yaml includes reality opts
    y = client.get(f"/api/sub/{sub_token}/clash").text
    assert "reality-opts" in y
    assert "public-key: \"PBK_X\"" in y
    assert "ws-opts" in y


def test_user_probe_unreachable(client):
    token = _reg(client)
    h = {"Authorization": f"Bearer {token}"}
    # create a node pointing at a closed port
    ah = _admin(client)
    r = client.post("/api/admin/nodes", json={
        "name": "Dead", "region": "ZZ", "host": "127.0.0.1", "port": 1,
        "protocol": "vless", "tls": False,
    }, headers=ah)
    nid = r.json()["id"]
    r = client.post(f"/api/console/probe/{nid}", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["reachable"] is False
    assert body["latency_ms"] is None


def test_user_probe_reachable(client, monkeypatch):
    import socket
    token = _reg(client)
    h = {"Authorization": f"Bearer {token}"}
    ah = _admin(client)
    r = client.post("/api/admin/nodes", json={
        "name": "Alive", "region": "ZZ", "host": "127.0.0.1", "port": 9,
        "protocol": "vless", "tls": False,
    }, headers=ah)
    nid = r.json()["id"]

    def fake_connect(addr, timeout=3):
        assert addr == ("127.0.0.1", 9)
        raise OSError  # not reachable here; success path via monkeypatch below

    # success path: patch to return fast
    class FakeSock:
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    monkeypatch.setattr(socket, "create_connection", lambda addr, timeout=3: FakeSock())
    r = client.post(f"/api/console/probe/{nid}", headers=h)
    assert r.status_code == 200
    assert r.json()["reachable"] is True
    assert r.json()["latency_ms"] is not None


def test_cdk_csv_export(client):
    h = _admin(client)
    r = client.get("/api/admin/cdks/export.csv", headers=h)
    assert r.status_code == 200, r.text
    assert "text/csv" in r.headers["content-type"]
    assert "attachment" in r.headers["content-disposition"]
    data = r.content.decode("utf-8-sig")
    rows = list(csv.reader(io.StringIO(data)))
    assert rows[0] == ["code", "traffic_mb", "status", "used_by", "used_at", "expires_at", "batch", "created_at"]
    assert any(row[0].startswith("HZ-") for row in rows[1:])
