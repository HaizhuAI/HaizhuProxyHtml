from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.security import create_access_token, hash_password, verify_password
from ..db import get_db
from ..deps import get_current_user
from ..models import Invite, LoginAttempt, User
from ..schemas import LoginIn, RegisterIn, SessionOut, UserOut
from ..services.cdk import random_invite_code
from ..services.settings import get_bool_setting, get_setting

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: User) -> SessionOut:
    return SessionOut(token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/register", response_model=SessionOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if not get_bool_setting(db, "register_enabled", settings.register_enabled):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "注册已关闭")
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "该邮箱已被注册")

    invite_code = body.invite_code.strip().upper()
    inviter: User | None = None
    if invite_code:
        inviter = db.query(User).filter(User.invite_code == invite_code).first()
        if not inviter:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "邀请码无效")
    elif get_bool_setting(db, "invite_required", settings.invite_required):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "当前需要邀请码才能注册")

    import secrets
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        uuid=str(uuid.uuid4()),
        sub_token=secrets.token_urlsafe(24),
        email=body.email.lower(),
        username=body.username.strip(),
        password_hash=hash_password(body.password),
        role="user",
        invite_code=random_invite_code(),
        invited_by=inviter.invite_code if inviter else None,
        balance_mb=float(get_setting(db, "new_user_bonus_mb", str(settings.new_user_bonus_mb)) or 0),
    )
    db.add(user)

    if inviter:
        bonus = float(get_setting(db, "invite_bonus_mb", str(settings.invite_bonus_mb)) or 0)
        db.add(Invite(id=str(uuid.uuid4()), inviter_id=inviter.id, invitee_id=user.id, bonus_mb=bonus))
        inviter.balance_mb += bonus
        user.balance_mb += bonus  # 双向奖励：被邀请人同样到账
    db.commit()
    return _user_out(user)


@router.post("/login", response_model=SessionOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    attempt = db.query(LoginAttempt).filter(LoginAttempt.email == email).first()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if attempt and attempt.locked_until and attempt.locked_until > now:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "失败次数过多，请稍后再试")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(body.password, user.password_hash):
        if attempt is None:
            attempt = LoginAttempt(email=email)
            db.add(attempt)
        attempt.failed = (attempt.failed or 0) + 1
        if attempt.failed >= settings.login_max_failures:
            attempt.locked_until = now + timedelta(minutes=settings.login_lock_minutes)
            attempt.failed = 0
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "邮箱或密码不正确")

    if user.status != "active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "账户已被封禁")
    if attempt:
        attempt.failed = 0
        attempt.locked_until = None
        db.commit()
    return _user_out(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
