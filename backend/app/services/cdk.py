import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..core.security import new_cdk_code
from ..models import Cdk, User


def generate_cdks(db: Session, count: int, traffic_mb: float, expires_days: int = 0) -> list[Cdk]:
    batch = f"B-{datetime.now(timezone.utc).strftime('%Y-%m')}"
    items: list[Cdk] = []
    seen: set[str] = set()
    existing = {c.code for c in db.query(Cdk.code).all()}
    while len(items) < count:
        code = new_cdk_code()
        if code in seen or code in existing:
            continue
        seen.add(code)
        items.append(Cdk(
            id=str(uuid.uuid4()),
            code=code,
            traffic_mb=traffic_mb,
            status="unused",
            batch=batch,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=expires_days) if expires_days > 0 else None,
        ))
    db.add_all(items)
    db.commit()
    for c in items:
        db.refresh(c)
    return items


def redeem_cdk(db: Session, code: str, user: User) -> tuple[float, float]:
    normalized = code.strip().upper()
    cdk = db.query(Cdk).filter(Cdk.code == normalized).first()
    if not cdk:
        raise ValueError("卡密不存在")
    if cdk.status == "used":
        raise ValueError("卡密已被使用")
    if cdk.status == "revoked":
        raise ValueError("卡密已被撤回")
    if cdk.status == "expired" or (cdk.expires_at and cdk.expires_at < datetime.now(timezone.utc).replace(tzinfo=None)):
        cdk.status = "expired"
        db.commit()
        raise ValueError("卡密已过期")
    cdk.status = "used"
    cdk.used_by = user.username
    cdk.used_at = datetime.now(timezone.utc)
    user.balance_mb += cdk.traffic_mb
    db.commit()
    return cdk.traffic_mb, user.balance_mb


def random_invite_code() -> str:
    return f"HZ-{secrets.token_hex(3).upper()}"
