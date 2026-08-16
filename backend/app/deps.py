from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .core.security import decode_token, hash_api_key
from .db import get_db
from .models import ApiKey, User


def get_current_user(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> User:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "缺少 Bearer Token")
    user_id = decode_token(authorization.split(" ", 1)[1].strip())
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token 无效或已过期")
    user = db.get(User, user_id)
    if not user or user.status != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "账户不存在或已被封禁")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "需要管理员权限")
    return user


def require_api_key(x_api_key: str = Header(default=""), db: Session = Depends(get_db)) -> None:
    if not x_api_key:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "缺少 X-API-Key")
    row = db.query(ApiKey).filter(ApiKey.key_hash == hash_api_key(x_api_key)).first()
    if not row or not row.enabled:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "API Key 无效或已停用")
    from datetime import datetime
    row.last_used_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
