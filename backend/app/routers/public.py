"""Public (unauthenticated) data for the landing page."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Node, ShopEntry

router = APIRouter(prefix="/api/public", tags=["public"])

REGIONS = [
    {"code": "HK", "name": "Hong Kong", "flag": "🇭🇰", "continent": "Asia", "latency_ms": 42, "uptime": 99.98, "protocols": ["vless", "trojan", "shadowsocks"]},
    {"code": "JP", "name": "Tokyo", "flag": "🇯🇵", "continent": "Asia", "latency_ms": 68, "uptime": 99.95, "protocols": ["vmess", "vless", "trojan"]},
    {"code": "SG", "name": "Singapore", "flag": "🇸🇬", "continent": "Asia", "latency_ms": 76, "uptime": 99.97, "protocols": ["vless", "trojan"]},
    {"code": "KR", "name": "Seoul", "flag": "🇰🇷", "continent": "Asia", "latency_ms": 54, "uptime": 99.90, "protocols": ["vmess", "vless"]},
    {"code": "US", "name": "Los Angeles", "flag": "🇺🇸", "continent": "North America", "latency_ms": 148, "uptime": 99.93, "protocols": ["vless", "trojan", "shadowsocks"]},
    {"code": "US-EWR", "name": "New Jersey", "flag": "🇺🇸", "continent": "North America", "latency_ms": 198, "uptime": 99.91, "protocols": ["vmess", "vless", "trojan"]},
    {"code": "DE", "name": "Frankfurt", "flag": "🇩🇪", "continent": "Europe", "latency_ms": 205, "uptime": 99.96, "protocols": ["vless", "trojan"]},
    {"code": "GB", "name": "London", "flag": "🇬🇧", "continent": "Europe", "latency_ms": 218, "uptime": 99.89, "protocols": ["vless", "shadowsocks"]},
    {"code": "NL", "name": "Amsterdam", "flag": "🇳🇱", "continent": "Europe", "latency_ms": 212, "uptime": 99.94, "protocols": ["vmess", "vless", "trojan"]},
    {"code": "FR", "name": "Paris", "flag": "🇫🇷", "continent": "Europe", "latency_ms": 224, "uptime": 99.87, "protocols": ["vless", "trojan"]},
    {"code": "AU", "name": "Sydney", "flag": "🇦🇺", "continent": "Oceania", "latency_ms": 176, "uptime": 99.92, "protocols": ["vless", "trojan"]},
    {"code": "BR", "name": "São Paulo", "flag": "🇧🇷", "continent": "South America", "latency_ms": 268, "uptime": 99.85, "protocols": ["vless"]},
    {"code": "ZA", "name": "Johannesburg", "flag": "🇿🇦", "continent": "Africa", "latency_ms": 289, "uptime": 99.80, "protocols": ["vless"]},
]

PLANS = [
    {"id": "p1", "name": "Starter", "traffic_mb": 10240, "price": 12, "duration_days": 30, "features": ["10 GB 流量", "2 个并发设备", "全节点可用", "标准优先级"], "popular": False},
    {"id": "p2", "name": "Pro", "traffic_mb": 51200, "price": 35, "duration_days": 30, "features": ["50 GB 流量", "5 个并发设备", "全节点可用", "高优先级路由", "Telegram 工单优先"], "popular": True},
    {"id": "p3", "name": "Max", "traffic_mb": 204800, "price": 99, "duration_days": 30, "features": ["200 GB 流量", "不限设备数", "全节点可用", "专属线路", "API 访问"], "popular": False},
]


@router.get("/regions")
def regions():
    return REGIONS


@router.get("/plans")
def plans():
    return PLANS


@router.get("/shops")
def shops(db: Session = Depends(get_db)):
    rows = db.query(ShopEntry).filter(ShopEntry.enabled.is_(True)).all()
    return [{"id": s.id, "name": s.name, "url": s.url, "enabled": True, "description": s.description} for s in rows]


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    from ..models import Cdk, Node, User
    return {
        "users": db.query(func.count(User.id)).scalar() or 0,
        "nodes": db.query(func.count(Node.id)).scalar() or 0,
        "online_nodes": db.query(func.count(Node.id)).filter(Node.status == "online").scalar() or 0,
        "cdks_used": db.query(func.count(Cdk.id)).filter(Cdk.status == "used").scalar() or 0,
    }
