"""Node bulk import — parse share links (vless/vmess/trojan/ss) & simple rows into Node dicts."""
import base64
import json
import re
import urllib.parse

PROTOCOLS = {"vless", "vmess", "trojan", "shadowsocks", "ss"}


def _b64safe_decode(s: str) -> str:
    pad = "=" * (-len(s) % 4)
    try:
        return base64.urlsafe_b64decode(s + pad).decode("utf-8", "ignore")
    except Exception:
        return ""


def parse_share_line(line: str) -> dict | None:
    """Parse one share link / simple row. Returns node field dict or None."""
    line = line.strip()
    if not line:
        return None
    low = line.lower()

    # ---- simple row: name|host:port|protocol|region|tls  (or name|host|port|...) ----
    if "|" in line and "://" not in line:
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 3:
            name, host, *rest = parts
            port = 443
            protocol = "vless"
            region = "HK"
            tls = True
            if ":" in host:
                h, p = host.rsplit(":", 1)
                if p.isdigit():
                    host, port = h, int(p)
            if len(rest) >= 1 and rest[0]:
                protocol = rest[0].replace("ss", "shadowsocks").lower()
            if len(rest) >= 2 and rest[1]:
                region = rest[1].upper()
            if len(rest) >= 3:
                tls = rest[2].lower() in ("1", "true", "tls", "yes", "y")
            if protocol not in PROTOCOLS:
                protocol = "vless"
            return {"name": name, "host": host, "port": port, "protocol": protocol,
                    "region": region, "tls": tls, "network": "tcp", "path": "", "sni": "",
                    "flow": "", "security": "tls" if tls else "none",
                    "reality_pbk": "", "reality_sid": ""}

    # ---- share links ----
    scheme = low.split("://", 1)[0] if "://" in line else ""
    if scheme == "vless":
        return _parse_vless(line)
    if scheme == "vmess":
        return _parse_vmess(line)
    if scheme == "trojan":
        return _parse_trojan(line)
    if scheme in ("ss", "shadowsocks"):
        return _parse_ss(line)
    return None


def _parse_vless(line: str) -> dict:
    m = re.match(r"^vless://([^@]+)@([^:]+):(\d+)(\?[^#]*)?(#.*)?$", line)
    if not m:
        return None
    uid, host, port, query, frag = m.groups()
    q = urllib.parse.parse_qs((query or "").lstrip("?"))
    sec = (q.get("security") or ["tls"])[0]
    net = (q.get("type") or ["tcp"])[0]
    path = (q.get("path") or [""])[0]
    sni = (q.get("sni") or q.get("host") or [""])[0]
    flow = (q.get("flow") or [""])[0]
    pbk = (q.get("pbk") or [""])[0]
    sid = (q.get("sid") or [""])[0]
    name = (frag or "").lstrip("#") or f"{host}:{port}"
    return {
        "name": urllib.parse.unquote(name), "host": host, "port": int(port),
        "protocol": "vless", "region": "HK", "tls": sec != "none",
        "network": net if net in ("tcp", "ws", "grpc") else "tcp",
        "path": path, "sni": sni, "flow": flow,
        "security": sec if sec in ("none", "tls", "reality") else "tls",
        "reality_pbk": pbk, "reality_sid": sid,
    }


def _parse_vmess(line: str) -> dict:
    body = line.split("://", 1)[1].split("#", 1)[0]
    raw = _b64safe_decode(body)
    try:
        d = json.loads(raw)
    except Exception:
        return None
    try:
        port = int(d.get("port", 443))
    except Exception:
        port = 443
    tls = str(d.get("tls", "")).lower() in ("tls", "true", "1")
    net = d.get("net", "tcp") or "tcp"
    return {
        "name": d.get("ps") or f"{d.get('add','')}:{port}", "host": d.get("add", ""),
        "port": port, "protocol": "vmess", "region": "HK", "tls": tls,
        "network": net if net in ("tcp", "ws", "grpc") else "tcp",
        "path": d.get("path", "") or "", "sni": d.get("host", "") or "",
        "flow": "", "security": "tls" if tls else "none", "reality_pbk": "", "reality_sid": "",
    }


def _parse_trojan(line: str) -> dict:
    m = re.match(r"^trojan://([^@]+)@([^:]+):(\d+)(\?[^#]*)?(#.*)?$", line)
    if not m:
        return None
    _, host, port, query, frag = m.groups()
    q = urllib.parse.parse_qs((query or "").lstrip("?"))
    net = (q.get("type") or ["tcp"])[0]
    path = (q.get("path") or [""])[0]
    sni = (q.get("sni") or q.get("host") or [""])[0]
    flow = (q.get("flow") or [""])[0]
    name = (frag or "").lstrip("#") or f"{host}:{port}"
    return {
        "name": urllib.parse.unquote(name), "host": host, "port": int(port),
        "protocol": "trojan", "region": "HK", "tls": True,
        "network": net if net in ("tcp", "ws", "grpc") else "tcp",
        "path": path, "sni": sni, "flow": flow,
        "security": "tls", "reality_pbk": "", "reality_sid": "",
    }


def _parse_ss(line: str) -> dict:
    body = line.split("://", 1)[1].split("#", 1)
    payload, frag = body[0], (body[1] if len(body) > 1 else "")
    # ss://base64(method:password)@host:port  (new format)
    if "@" in payload:
        userinfo, hostport = payload.rsplit("@", 1)
        try:
            decoded = _b64safe_decode(userinfo)
            if ":" not in decoded:
                decoded = userinfo  # plain method:password
        except Exception:
            decoded = userinfo
        method, _, password = decoded.partition(":")
    else:
        # ss://method:password@host:port (old format) — payload is method:password@host:port
        decoded = payload
        method, _, password = decoded.partition(":")
        hostport = decoded.split("@", 1)[1] if "@" in decoded else ""
    host, _, port_s = hostport.rpartition(":")
    try:
        port = int(port_s)
    except Exception:
        return None
    if not host or not method:
        return None
    return {
        "name": urllib.parse.unquote(frag) or f"{host}:{port}", "host": host, "port": port,
        "protocol": "shadowsocks", "region": "HK", "tls": False,
        "network": "tcp", "path": "", "sni": "", "flow": "",
        "security": "none", "reality_pbk": "", "reality_sid": "",
    }


def import_nodes(db, text: str, region_default: str = "HK") -> tuple[list, list[dict]]:
    """Parse text block, create & commit nodes. Returns (created Node rows, failed [{line, reason}])."""
    import uuid as uuid_mod
    from ..models import Node
    created: list[Node] = []
    failed: list[dict] = []
    seen = set()
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        node = parse_share_line(line)
        if not node:
            failed.append({"line": line[:120], "reason": "无法识别的格式"})
            continue
        key = (node["host"], node["port"], node["protocol"])
        if key in seen:
            continue
        seen.add(key)
        node["region"] = node.get("region") or region_default.upper()
        row = Node(id=str(uuid_mod.uuid4()), **node)
        db.add(row)
        created.append(row)
    db.commit()
    return created, failed
