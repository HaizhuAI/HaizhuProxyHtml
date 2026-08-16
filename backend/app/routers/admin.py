import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.security import hash_api_key, new_api_key
from ..db import get_db
from ..deps import require_admin
from ..models import ApiKey, Cdk, Node, Setting, ShopEntry, SmtpConfig, TelegramConfig, TrafficLog, User
from ..schemas import (
    ApiKeyCreated, ApiKeyIn, ApiKeyOut, CdkGenIn, CdkOut, DashboardOut,
    NodeImportIn, NodeImportOut, NodeIn, NodeOut, SettingsOut, ShopIn, ShopOut,
    SmtpIn, SmtpOut, TelegramIn, TelegramOut,
)
from ..services.cdk import generate_cdks
from ..services.import_nodes import import_nodes
from ..services.mailer import send_email
from ..services.settings import get_bool_setting, get_setting, set_setting
from ..services.telegram import get_me, send_message

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _mask_token(token: str) -> str:
    if len(token) <= 8:
        return "*" * len(token)
    return f"{token[:4]}{'*' * 10}{token[-4:]}"


# ---------- dashboard ----------
@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    traffic = (
        db.query(func.coalesce(func.sum(TrafficLog.bytes_in + TrafficLog.bytes_out), 0))
        .filter(TrafficLog.ts >= today)
        .scalar()
        or 0
    )
    return DashboardOut(
        users=db.query(func.count(User.id)).scalar() or 0,
        nodes=db.query(func.count(Node.id)).scalar() or 0,
        online_nodes=db.query(func.count(Node.id)).filter(Node.status == "online").scalar() or 0,
        cdks_issued=db.query(func.count(Cdk.id)).scalar() or 0,
        cdks_used=db.query(func.count(Cdk.id)).filter(Cdk.status == "used").scalar() or 0,
        traffic_today_mb=round(traffic / 1024 / 1024, 1),
        revenue_ref=round((db.query(func.count(Cdk.id)).filter(Cdk.status == "used").scalar() or 0) * 1.5, 2),
    )


# ---------- nodes ----------
@router.get("/nodes", response_model=list[NodeOut])
def list_nodes(db: Session = Depends(get_db)):
    return [NodeOut.model_validate(n) for n in db.query(Node).order_by(Node.added_at.desc()).all()]


@router.post("/nodes", response_model=NodeOut, status_code=201)
def create_node(body: NodeIn, db: Session = Depends(get_db)):
    node = Node(
        id=str(uuid.uuid4()), name=body.name, region=body.region.upper(), host=body.host,
        port=body.port, protocol=body.protocol.lower(), tls=body.tls,
        network=body.network, path=body.path, sni=body.sni, flow=body.flow,
        security=body.security, reality_pbk=body.reality_pbk, reality_sid=body.reality_sid,
        note=body.note,
    )
    db.add(node)
    db.commit()
    return NodeOut.model_validate(node)


@router.post("/nodes/import", response_model=NodeImportOut, status_code=201)
def bulk_import_nodes(body: NodeImportIn, db: Session = Depends(get_db)):
    """批量导入：share 链接（vless/vmess/trojan/ss）或简单行格式，解析后直接落库。"""
    created, failed = import_nodes(db, body.text, body.region_default or "HK")
    return NodeImportOut(created=[NodeOut.model_validate(n) for n in created], failed=failed)


@router.delete("/nodes/{node_id}", status_code=204)
def delete_node(node_id: str, db: Session = Depends(get_db)):
    node = db.get(Node, node_id)
    if not node:
        raise HTTPException(404, "节点不存在")
    db.delete(node)
    db.commit()


@router.post("/nodes/{node_id}/probe", response_model=NodeOut)
def probe_node(node_id: str, db: Session = Depends(get_db)):
    node = db.get(Node, node_id)
    if not node:
        raise HTTPException(404, "节点不存在")
    node.status = "online"
    db.commit()
    return NodeOut.model_validate(node)


# ---------- cdks ----------
@router.get("/cdks", response_model=list[CdkOut])
def list_cdks(db: Session = Depends(get_db)):
    return [CdkOut.model_validate(c) for c in db.query(Cdk).order_by(Cdk.created_at.desc()).limit(500).all()]


@router.get("/cdks/export.csv")
def export_cdks_csv(db: Session = Depends(get_db)):
    """CDK batch export as CSV for delivery / bookkeeping."""
    import csv
    import io
    from fastapi.responses import Response as FastResponse
    rows = db.query(Cdk).order_by(Cdk.created_at.desc()).all()
    buf = io.StringIO()
    buf.write("\ufeff")  # BOM so Excel opens UTF-8 correctly
    w = csv.writer(buf)
    w.writerow(["code", "traffic_mb", "status", "used_by", "used_at", "expires_at", "batch", "created_at"])
    for c in rows:
        w.writerow([
            c.code, c.traffic_mb, c.status, c.used_by or "",
            c.used_at.isoformat() if c.used_at else "",
            c.expires_at.isoformat() if c.expires_at else "",
            c.batch or "", c.created_at.isoformat() if c.created_at else "",
        ])
    return FastResponse(
        content=buf.getvalue().encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=haizhu-cdks.csv"},
    )


@router.post("/cdks/generate", response_model=list[CdkOut], status_code=201)
def gen_cdks(body: CdkGenIn, db: Session = Depends(get_db)):
    cdks = generate_cdks(db, body.count, body.traffic_mb, body.expires_days)
    if body.send_to_email:
        recipient = (body.recipient_email or "").strip()
        if not recipient or "@" not in recipient:
            raise HTTPException(400, "开启邮件发送时必须填写有效收件邮箱")
        from ..services.mailer import send_cdk_email
        try:
            send_cdk_email(db, recipient, [c.code for c in cdks], body.traffic_mb)
        except Exception as e:
            raise HTTPException(502, f"卡密已生成，但邮件发送失败: {e}")
    return [CdkOut.model_validate(c) for c in cdks]


@router.post("/cdks/{cdk_id}/revoke", response_model=CdkOut)
def revoke_cdk(cdk_id: str, db: Session = Depends(get_db)):
    cdk = db.get(Cdk, cdk_id)
    if not cdk:
        raise HTTPException(404, "卡密不存在")
    cdk.status = "revoked"
    db.commit()
    return CdkOut.model_validate(cdk)


# ---------- users ----------
@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).limit(500).all()
    return [
        {
            "id": u.id, "email": u.email, "username": u.username, "role": u.role,
            "invite_code": u.invite_code, "invited_by": u.invited_by,
            "balance_mb": u.balance_mb, "traffic_used_mb": u.traffic_used_mb,
            "status": u.status, "created_at": u.created_at,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/status")
def set_user_status(user_id: str, body: dict, db: Session = Depends(get_db)):
    status = body.get("status")
    if status not in ("active", "banned"):
        raise HTTPException(400, "status 必须是 active 或 banned")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "用户不存在")
    if user.role == "admin":
        raise HTTPException(400, "不能封禁管理员")
    user.status = status
    db.commit()
    return {"id": user.id, "status": user.status}


# ---------- shops ----------
@router.get("/shops", response_model=list[ShopOut])
def list_shops(db: Session = Depends(get_db)):
    return [ShopOut.model_validate(s) for s in db.query(ShopEntry).all()]


@router.post("/shops", response_model=ShopOut, status_code=201)
def create_shop(body: ShopIn, db: Session = Depends(get_db)):
    shop = ShopEntry(id=str(uuid.uuid4()), name=body.name, url=body.url, enabled=body.enabled, description=body.description)
    db.add(shop)
    db.commit()
    return ShopOut.model_validate(shop)


@router.patch("/shops/{shop_id}", response_model=ShopOut)
def update_shop(shop_id: str, body: ShopIn, db: Session = Depends(get_db)):
    shop = db.get(ShopEntry, shop_id)
    if not shop:
        raise HTTPException(404, "商城不存在")
    shop.name, shop.url, shop.enabled, shop.description = body.name, body.url, body.enabled, body.description
    db.commit()
    return ShopOut.model_validate(shop)


@router.delete("/shops/{shop_id}", status_code=204)
def delete_shop(shop_id: str, db: Session = Depends(get_db)):
    shop = db.get(ShopEntry, shop_id)
    if not shop:
        raise HTTPException(404, "商城不存在")
    db.delete(shop)
    db.commit()


# ---------- telegram ----------
def _tg_row(db: Session) -> TelegramConfig:
    row = db.query(TelegramConfig).first()
    if not row:
        row = TelegramConfig()
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("/telegram", response_model=TelegramOut)
def get_telegram(db: Session = Depends(get_db)):
    row = _tg_row(db)
    return TelegramOut(
        enabled=row.enabled, bot_token_masked=_mask_token(row.bot_token) if row.bot_token else "",
        bot_username=row.bot_username, chat_id=row.chat_id, widget_title=row.widget_title,
        welcome_message=row.welcome_message, placeholder=row.placeholder,
    )


@router.post("/telegram", response_model=TelegramOut)
def save_telegram(body: TelegramIn, db: Session = Depends(get_db)):
    row = _tg_row(db)
    # keep old token if masked value submitted unchanged
    if body.bot_token and "*" not in body.bot_token:
        row.bot_token = body.bot_token.strip()
    row.enabled = body.enabled
    row.bot_username = body.bot_username.strip()
    row.chat_id = body.chat_id.strip()
    row.widget_title = body.widget_title
    row.welcome_message = body.welcome_message
    row.placeholder = body.placeholder
    db.commit()
    return TelegramOut(
        enabled=row.enabled, bot_token_masked=_mask_token(row.bot_token) if row.bot_token else "",
        bot_username=row.bot_username, chat_id=row.chat_id, widget_title=row.widget_title,
        welcome_message=row.welcome_message, placeholder=row.placeholder,
    )


@router.post("/telegram/test")
def test_telegram(db: Session = Depends(get_db)):
    row = _tg_row(db)
    if not row.bot_token or not row.chat_id:
        raise HTTPException(400, "请先填写 Bot Token 与 Chat ID")
    try:
        me = get_me(row.bot_token)
        send_message(row.bot_token, row.chat_id, "✅ HaizhuProxy Bot 配置测试成功 — " + datetime.now(timezone.utc).replace(tzinfo=None).isoformat())
        return {"delivered": True, "bot": me.get("result", {}).get("username", ""), "message": "测试消息已发送"}
    except Exception as e:
        raise HTTPException(502, f"发送失败: {e}")


# ---------- api keys ----------
@router.get("/api-keys", response_model=list[ApiKeyOut])
def list_api_keys(db: Session = Depends(get_db)):
    keys = db.query(ApiKey).order_by(ApiKey.created_at.desc()).all()
    return [
        ApiKeyOut(
            id=k.id, name=k.name, key=_mask_token(k.key_hash[:12]), scopes=k.scopes.split(","),
            enabled=k.enabled, created_at=k.created_at, last_used_at=k.last_used_at,
        )
        for k in keys
    ]


@router.post("/api-keys", response_model=ApiKeyCreated, status_code=201)
def create_api_key(body: ApiKeyIn, db: Session = Depends(get_db)):
    plain = new_api_key()
    key = ApiKey(
        id=str(uuid.uuid4()), name=body.name, key_hash=hash_api_key(plain),
        scopes=",".join(body.scopes or ["traffic:read"]),
    )
    db.add(key)
    db.commit()
    return ApiKeyCreated(id=key.id, name=key.name, key=plain, scopes=body.scopes or ["traffic:read"])


@router.delete("/api-keys/{key_id}", status_code=204)
def delete_api_key(key_id: str, db: Session = Depends(get_db)):
    key = db.get(ApiKey, key_id)
    if not key:
        raise HTTPException(404, "密钥不存在")
    db.delete(key)
    db.commit()


# ---------- settings ----------
@router.get("/settings", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return SettingsOut(
        register_enabled=get_bool_setting(db, "register_enabled", True),
        invite_required=get_bool_setting(db, "invite_required", False),
        invite_bonus_mb=int(get_setting(db, "invite_bonus_mb", "1024") or 0),
        new_user_bonus_mb=int(get_setting(db, "new_user_bonus_mb", "0") or 0),
        site_name=get_setting(db, "site_name", "HaizhuProxy"),
        maintenance=get_bool_setting(db, "maintenance", False),
    )


@router.patch("/settings", response_model=SettingsOut)
def patch_settings(body: dict, db: Session = Depends(get_db)):
    mapping = {
        "register_enabled": "register_enabled",
        "invite_required": "invite_required",
        "maintenance": "maintenance",
        "site_name": "site_name",
        "invite_bonus_mb": "invite_bonus_mb",
        "new_user_bonus_mb": "new_user_bonus_mb",
    }
    for k, v in body.items():
        if k in mapping and v is not None:
            set_setting(db, mapping[k], "true" if isinstance(v, bool) else str(v))
    return get_settings(db)


# ---------- smtp ----------
def _smtp_row(db: Session) -> SmtpConfig:
    row = db.query(SmtpConfig).first()
    if not row:
        row = SmtpConfig()
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _smtp_out(row: SmtpConfig) -> SmtpOut:
    return SmtpOut(
        enabled=row.enabled, host=row.host, port=row.port, username=row.username,
        password_masked=_mask_token(row.password) if row.password else "",
        sender=row.sender, use_tls=row.use_tls, use_ssl=row.use_ssl,
    )


@router.get("/smtp", response_model=SmtpOut)
def get_smtp_cfg(db: Session = Depends(get_db)):
    return _smtp_out(_smtp_row(db))


@router.post("/smtp", response_model=SmtpOut)
def save_smtp(body: SmtpIn, db: Session = Depends(get_db)):
    row = _smtp_row(db)
    if body.password and "*" not in body.password:
        row.password = body.password.strip()
    row.enabled = body.enabled
    row.host = body.host.strip()
    row.port = body.port or 587
    row.username = body.username.strip()
    row.sender = body.sender.strip()
    row.use_tls = body.use_tls
    row.use_ssl = body.use_ssl
    db.commit()
    return _smtp_out(row)


@router.post("/smtp/test")
def test_smtp(db: Session = Depends(get_db)):
    row = _smtp_row(db)
    if not row.enabled or not row.host or not row.sender:
        raise HTTPException(400, "请先启用 SMTP 并填写服务器与发件人")
    try:
        send_email(
            db, row.sender,
            "HaizhuProxy SMTP 测试",
            "<p style='color:#3fd9b4;font-family:monospace'>✅ HaizhuProxy SMTP 配置测试成功</p>",
            "HaizhuProxy SMTP 配置测试成功",
        )
        return {"delivered": True, "message": f"测试邮件已发送到 {row.sender}"}
    except Exception as e:
        raise HTTPException(502, f"发送失败: {e}")
