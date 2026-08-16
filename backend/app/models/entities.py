from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(64), index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16), default="user")
    invite_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    invited_by: Mapped[str | None] = mapped_column(String(32), nullable=True)
    uuid: Mapped[str] = mapped_column(String(36), default="", index=True)      # 节点身份 UUID
    sub_token: Mapped[str] = mapped_column(String(64), default="", index=True)  # 订阅鉴权 token
    balance_mb: Mapped[float] = mapped_column(Float, default=0)
    traffic_used_mb: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(16), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    region: Mapped[str] = mapped_column(String(16), index=True)
    host: Mapped[str] = mapped_column(String(255))
    port: Mapped[int] = mapped_column(Integer, default=443)
    protocol: Mapped[str] = mapped_column(String(32), default="vless")
    tls: Mapped[bool] = mapped_column(Boolean, default=True)
    network: Mapped[str] = mapped_column(String(16), default="tcp")   # tcp / ws / grpc
    path: Mapped[str] = mapped_column(String(255), default="")        # ws path / grpc serviceName
    sni: Mapped[str] = mapped_column(String(255), default="")         # SNI / ws host, fallback host
    flow: Mapped[str] = mapped_column(String(64), default="")         # xtls-rprx-vision etc
    security: Mapped[str] = mapped_column(String(16), default="tls")  # none / tls / reality
    reality_pbk: Mapped[str] = mapped_column(String(255), default="")  # reality public key
    reality_sid: Mapped[str] = mapped_column(String(64), default="")   # reality short id
    traffic_in_mb: Mapped[float] = mapped_column(Float, default=0)
    traffic_out_mb: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(16), default="online")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Cdk(Base):
    __tablename__ = "cdks"
    __table_args__ = (UniqueConstraint("code", name="uq_cdk_code"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(32), index=True)
    traffic_mb: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(16), default="unused", index=True)
    used_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    batch: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ShopEntry(Base):
    __tablename__ = "shops"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    url: Mapped[str] = mapped_column(String(512))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class TelegramConfig(Base):
    __tablename__ = "telegram_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    bot_token: Mapped[str] = mapped_column(String(255), default="")
    bot_username: Mapped[str] = mapped_column(String(64), default="")
    chat_id: Mapped[str] = mapped_column(String(64), default="")
    widget_title: Mapped[str] = mapped_column(String(64), default="Haizhu 客服")
    welcome_message: Mapped[str] = mapped_column(Text, default="你好，我是 HaizhuProxy 在线客服 🤖")
    placeholder: Mapped[str] = mapped_column(String(128), default="输入消息，按 Enter 发送…")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    scopes: Mapped[str] = mapped_column(Text, default="traffic:read")  # comma separated
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TrafficLog(Base):
    __tablename__ = "traffic_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    node_id: Mapped[str] = mapped_column(String(36), index=True)
    bytes_in: Mapped[float] = mapped_column(Float, default=0)
    bytes_out: Mapped[float] = mapped_column(Float, default=0)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class Invite(Base):
    __tablename__ = "invites"
    __table_args__ = (UniqueConstraint("invitee_id", name="uq_invitee"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    inviter_id: Mapped[str] = mapped_column(String(36), index=True)
    invitee_id: Mapped[str] = mapped_column(String(36))
    bonus_mb: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SmtpConfig(Base):
    __tablename__ = "smtp_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    host: Mapped[str] = mapped_column(String(255), default="")
    port: Mapped[int] = mapped_column(Integer, default=587)
    username: Mapped[str] = mapped_column(String(255), default="")
    password: Mapped[str] = mapped_column(String(255), default="")
    sender: Mapped[str] = mapped_column(String(255), default="")
    use_tls: Mapped[bool] = mapped_column(Boolean, default=True)   # STARTTLS
    use_ssl: Mapped[bool] = mapped_column(Boolean, default=False)  # SSL/465
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="")


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    failed: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
