"""Subscription generation — node import → instantly distributable.

Generates standard share links (vless/vmess/trojan/shadowsocks) per user UUID,
with tls / reality / ws / grpc transport parameters, plus Base64 v2ray
subscription and a Clash-compatible (mihomo) YAML profile.
"""
import base64
import json
import uuid as uuid_mod

from sqlalchemy.orm import Session

from ..models import Node, User

PASSWORD = "hz-proxy-pass"  # ss/trojan password; per-user derivation is a prod hardening step
FP = "chrome"               # reality fingerprint


def _sec(node: Node) -> str:
    if node.security == "reality":
        return "reality"
    if node.security == "none":
        return "none"
    return "tls" if node.tls else "none"


def _sni(node: Node) -> str:
    return node.sni or node.host


def _transport(node: Node) -> str:
    """Query-string transport params for share links."""
    net = node.network or "tcp"
    if net == "ws":
        return f"&type=ws&path={node.path or '/'}&host={_sni(node)}"
    if net == "grpc":
        svc = node.path or "grpc"
        return f"&type=grpc&serviceName={svc}"
    return "&type=tcp"


def _reality(node: Node) -> str:
    if _sec(node) != "reality":
        return ""
    return f"&pbk={node.reality_pbk}&sid={node.reality_sid or ''}&fp={FP}&spx=%2F"


def _flow(node: Node) -> str:
    return f"&flow={node.flow}" if node.flow else ""


def _node_share(node: Node, user: User) -> str:
    uid = user.uuid or str(uuid_mod.uuid4())
    sec = _sec(node)
    sni = _sni(node)
    frag = node.name.replace(" ", "%20")
    if node.protocol == "vless":
        params = f"encryption=none&security={sec}{_reality(node)}{_flow(node)}{_transport(node)}&sni={sni}"
        return f"vless://{uid}@{node.host}:{node.port}?{params}#{frag}"
    if node.protocol == "vmess":
        payload = {
            "v": "2", "ps": node.name, "add": node.host, "port": str(node.port), "id": uid,
            "aid": "0", "scy": "auto",
            "net": node.network or "tcp",
            "type": "none",
            "host": sni,
            "path": node.path or "/",
            "tls": "tls" if sec != "none" else "",
        }
        return "vmess://" + base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    if node.protocol == "trojan":
        params = f"security={sec}{_flow(node)}{_transport(node)}&sni={sni}"
        return f"trojan://{uid}@{node.host}:{node.port}?{params}#{frag}"
    # shadowsocks
    raw = f"aes-256-gcm:{PASSWORD}"
    b64 = base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")
    return f"ss://{b64}@{node.host}:{node.port}#{frag}"


def build_subscription(db: Session, user: User, include_offline: bool = False) -> str:
    nodes = db.query(Node).all() if include_offline else db.query(Node).filter(Node.status != "offline").all()
    return "\n".join(_node_share(n, user) for n in nodes)


def build_subscription_base64(db: Session, user: User) -> str:
    text = build_subscription(db, user)
    return base64.b64encode(text.encode()).decode()


def build_clash_yaml(db: Session, user: User) -> str:
    """Clash-compatible profile (mihomo supports vless/vmess/trojan/ss + ws/grpc/reality)."""
    nodes = db.query(Node).filter(Node.status != "offline").all()
    proxies = []
    for n in nodes:
        uid = user.uuid
        sni = _sni(n)
        sec = _sec(n)
        net = n.network or "tcp"
        path = n.path or ("/" if net == "ws" else "grpc")
        if n.protocol == "vless":
            p = {"name": n.name, "type": "vless", "server": n.host, "port": n.port, "uuid": uid,
                 "network": net, "tls": sec != "none", "servername": sni if sec != "none" else None,
                 "client-fingerprint": FP if sec == "reality" else None, "path": path}
            if sec == "reality":
                p["reality-opts"] = {"public-key": n.reality_pbk, "short-id": n.reality_sid or ""}
            if n.flow:
                p["flow"] = n.flow
            proxies.append(p)
        elif n.protocol == "vmess":
            proxies.append({"name": n.name, "type": "vmess", "server": n.host, "port": n.port, "uuid": uid,
                            "alterId": 0, "cipher": "auto", "network": net, "path": path,
                            "tls": sec != "none", "servername": sni if sec != "none" else None})
        elif n.protocol == "trojan":
            p = {"name": n.name, "type": "trojan", "server": n.host, "port": n.port, "password": uid,
                 "network": net, "path": path, "sni": sni, "tls": sec != "none"}
            if n.flow:
                p["flow"] = n.flow
            proxies.append(p)
        elif n.protocol == "shadowsocks":
            proxies.append({"name": n.name, "type": "ss", "server": n.host, "port": n.port,
                            "cipher": "aes-256-gcm", "password": PASSWORD})
    lines = ["mixed-port: 7890", "mode: rule", "log-level: info", "", "proxies:"]
    for p in proxies:
        parts = []
        for k, v in p.items():
            if v is None:
                continue
            if k == "reality-opts":
                parts.append("    reality-opts:")
                parts.append(f"      public-key: {json.dumps(v['public-key'])}")
                parts.append(f"      short-id: {json.dumps(v['short-id'])}")
            elif k == "path" and p.get("network") in ("ws", "grpc"):
                # emitted as ws-opts / grpc-opts below, skip bare path
                continue
            elif k in ("name", "type", "server", "servername", "password", "uuid", "cipher", "client-fingerprint"):
                parts.append(f"    {k}: {json.dumps(v)}")
            else:
                parts.append(f"    {k}: {json.dumps(v) if isinstance(v, str) else v}")
        if p.get("network") == "ws":
            parts.append("    ws-opts:")
            parts.append(f"      path: {json.dumps(p.get('path') or '/')}")
        elif p.get("network") == "grpc":
            parts.append("    grpc-opts:")
            parts.append(f"      grpc-service-name: {json.dumps(p.get('path') or 'grpc')}")
        lines.append("  - " + ",\n".join(parts))
    lines.append("")
    lines.append("rules:")
    lines.append("  - GEOIP,CN,DIRECT")
    lines.append("  - MATCH,Proxy")
    return "\n".join(lines)


def ensure_user_identity(db: Session, user: User) -> tuple[str, str]:
    """Lazily assign per-user UUID + subscription token (legacy rows / import)."""
    import secrets
    import uuid as uuid_mod
    if not user.uuid:
        user.uuid = str(uuid_mod.uuid4())
    if not user.sub_token:
        user.sub_token = secrets.token_urlsafe(24)
    db.commit()
    return user.uuid, user.sub_token
