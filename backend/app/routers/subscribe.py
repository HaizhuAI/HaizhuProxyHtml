"""Public subscription endpoints — 导入节点即分发.

v2rayN / Clash (mihomo) / sing-box 等客户端直接用 URL 拉取，无需登录。
"""

import base64

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..services.subscription import build_clash_yaml, build_subscription, ensure_user_identity

router = APIRouter(prefix="/api/sub", tags=["subscribe"])


def _user(db: Session, token: str) -> User:
    user = db.query(User).filter(User.sub_token == token).first()
    if not user:
        raise HTTPException(404, "订阅不存在或已失效")
    ensure_user_identity(db, user)
    return user


@router.get("/{token}")
def sub_index(token: str):
    return Response(status_code=302, headers={"Location": f"/api/sub/{token}/v2ray"})


@router.get("/{token}/v2ray")
def sub_v2ray(token: str, db: Session = Depends(get_db)):
    user = _user(db, token)
    payload = base64.b64encode(build_subscription(db, user).encode()).decode()
    return Response(
        content=payload,
        media_type="text/plain; charset=utf-8",
        headers={
            "profile-update-interval": "24",
            "Cache-Control": "no-store",
            "Subscription-Userinfo": (
                f"upload=0; download={int(user.traffic_used_mb * 1024 * 1024)}; "
                f"total={int((user.balance_mb + user.traffic_used_mb) * 1024 * 1024)}; expire=0"
            ),
        },
    )


@router.get("/{token}/clash")
def sub_clash(token: str, db: Session = Depends(get_db)):
    user = _user(db, token)
    return Response(
        content=build_clash_yaml(db, user),
        media_type="text/yaml; charset=utf-8",
        headers={"Cache-Control": "no-store"},
    )
