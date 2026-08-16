"""Seed admin account + demo data. Run: python -m app.seed"""
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from .core.security import hash_password
from .db import Base, SessionLocal, engine
from .models import ApiKey, Cdk, Invite, Node, ShopEntry, TelegramConfig, TrafficLog, User

ADMIN_EMAIL = "admin@haizhu.dev"
ADMIN_PASSWORD = "admin123456"

NODES = [
    ("HK-01 · BGP", "HK", "hk01.haizhu.dev", 443, "vless", True, "online"),
    ("HK-02 · CN2", "HK", "hk02.haizhu.dev", 443, "trojan", True, "online"),
    ("JP-01 · IGP", "JP", "jp01.haizhu.dev", 443, "vmess", True, "online"),
    ("JP-02 · SoftBank", "JP", "jp02.haizhu.dev", 8443, "vless", True, "degraded", "晚高峰限速"),
    ("SG-01 · WS", "SG", "sg01.haizhu.dev", 443, "vless", True, "online", None, "ws", "/sg-ws", "cdn.haizhu.dev", "xtls-rprx-vision", "tls"),
    ("US-01 · Reality", "US", "us01.haizhu.dev", 443, "vless", True, "online", None, "tcp", "", "", "xtls-rprx-vision", "reality", "REALITY_PUBLIC_KEY_PLACEHOLDER", "abcdef0123456789"),
    ("US-02 · EWR", "US-EWR", "us02.haizhu.dev", 443, "vmess", True, "online", None, "ws", "/ewr-ws", "cdn.haizhu.dev"),
    ("DE-01 · gRPC", "DE", "de01.haizhu.dev", 443, "vless", True, "online", None, "grpc", "hz-grpc", "", "xtls-rprx-vision", "tls"),
    ("GB-01 · London", "GB", "gb01.haizhu.dev", 443, "shadowsocks", False, "offline"),
    ("AU-01 · Sydney", "AU", "au01.haizhu.dev", 443, "vless", True, "online"),
]


def seed():
    Base.metadata.create_all(engine)
    db = SessionLocal()

    if db.query(User).filter(User.email == ADMIN_EMAIL).first():
        print("already seeded, skip")
        db.close()
        return

    admin = User(
        id=str(uuid.uuid4()), uuid=str(uuid.uuid4()), sub_token=secrets.token_urlsafe(24),
        email=ADMIN_EMAIL, username="operator",
        password_hash=hash_password(ADMIN_PASSWORD), role="admin",
        invite_code="HZ-ADMIN-01", balance_mb=204800,
    )
    db.add(admin)
    db.commit()

    user2 = User(
        id=str(uuid.uuid4()), uuid=str(uuid.uuid4()), sub_token=secrets.token_urlsafe(24),
        email="neo@example.com", username="neo_wong",
        password_hash=hash_password("user123456"), role="user",
        invite_code="HZ-8F2A1C", invited_by=admin.invite_code, balance_mb=40960, traffic_used_mb=12730,
    )
    db.add(user2)
    db.add(Invite(id=str(uuid.uuid4()), inviter_id=admin.id, invitee_id=user2.id, bonus_mb=1024))
    db.commit()

    for row in NODES:
        name, region, host, port, proto, tls, status = row[:7]
        note = row[7] if len(row) > 7 else None
        network = row[8] if len(row) > 8 else "tcp"
        path = row[9] if len(row) > 9 else ""
        sni = row[10] if len(row) > 10 else ""
        flow = row[11] if len(row) > 11 else ""
        security = row[12] if len(row) > 12 else ("tls" if tls else "none")
        pbk = row[13] if len(row) > 13 else ""
        sid = row[14] if len(row) > 14 else ""
        db.add(Node(
            id=str(uuid.uuid4()), name=name, region=region, host=host, port=port,
            protocol=proto, tls=tls, status=status, network=network, path=path,
            sni=sni, flow=flow, security=security, reality_pbk=pbk, reality_sid=sid,
            traffic_in_mb=100 + hash(name) % 40000, traffic_out_mb=120 + hash(name) % 42000,
            note=note,
        ))
    db.commit()

    cdk = Cdk(id=str(uuid.uuid4()), code="HZ-DEMO-0001-0001", traffic_mb=10240, status="unused", batch="B-DEMO")
    db.add(cdk)
    db.commit()

    db.add(ShopEntry(id=str(uuid.uuid4()), name="官方商城 · 国际站", url="https://shop.haizhu.dev", enabled=True, description="主商城，支持 USDT / 信用卡 / 本地支付"))
    db.add(ShopEntry(id=str(uuid.uuid4()), name="备用商城 · 镜像", url="https://mirror.haizhu.dev", enabled=True, description="主商城不可达时使用"))
    db.commit()

    db.add(TelegramConfig(enabled=False, bot_token="", bot_username="@HaizhuSupportBot", chat_id="-1002345678901", widget_title="Haizhu 客服", welcome_message="你好，我是 HaizhuProxy 在线客服 🤖 下单 / 节点 / 卡密问题都可以直接问我。", placeholder="输入消息，按 Enter 发送…"))
    db.commit()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for i in range(14):
        day = now - timedelta(days=i)
        db.add(TrafficLog(user_id=user2.id, node_id="n1", bytes_in=(400 + i * 13) * 1024 * 1024, bytes_out=(430 + i * 15) * 1024 * 1024, ts=day))
    db.commit()

    db.close()
    print(f"seeded. admin: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print("demo cdk: HZ-DEMO-0001-0001 (10 GB)")
    print("demo user: neo@example.com / user123456")


if __name__ == "__main__":
    seed()
