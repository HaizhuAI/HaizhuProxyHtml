from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---- auth ----
class RegisterIn(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=32)
    password: str = Field(min_length=6, max_length=128)
    invite_code: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    username: str
    role: str
    invite_code: str
    invited_by: str | None
    balance_mb: float
    traffic_used_mb: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    token: str
    user: UserOut


# ---- console ----
class RedeemIn(BaseModel):
    code: str


class RedeemOut(BaseModel):
    added: float
    balance: float


class NodeOut(BaseModel):
    id: str
    name: str
    region: str
    host: str
    port: int
    protocol: str
    tls: bool
    network: str = "tcp"
    path: str = ""
    sni: str = ""
    flow: str = ""
    security: str = "tls"
    reality_pbk: str = ""
    reality_sid: str = ""
    traffic_in_mb: float
    traffic_out_mb: float
    status: str
    note: str | None
    added_at: datetime

    class Config:
        from_attributes = True


class UsageOut(BaseModel):
    balance: float
    used: float
    total: float
    active_nodes: int
    today_in: float
    today_out: float
    series: list[dict]


class InviteOut(BaseModel):
    code: str
    total: int
    active: int
    bonus_per_invite: float


class ProfileIn(BaseModel):
    username: str | None = None
    password: str | None = None


# ---- admin ----
class NodeIn(BaseModel):
    name: str
    region: str = "HK"
    host: str
    port: int = 443
    protocol: str = "vless"
    tls: bool = True
    network: str = "tcp"
    path: str = ""
    sni: str = ""
    flow: str = ""
    security: str = "tls"
    reality_pbk: str = ""
    reality_sid: str = ""
    note: str | None = None


class CdkGenIn(BaseModel):
    count: int = Field(default=10, ge=1, le=500)
    traffic_mb: float = Field(ge=1)
    expires_days: int = 0
    send_to_email: bool = False
    recipient_email: str | None = None


class CdkOut(BaseModel):
    id: str
    code: str
    traffic_mb: float
    status: str
    used_by: str | None
    used_at: datetime | None
    expires_at: datetime | None
    batch: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ShopIn(BaseModel):
    name: str
    url: str
    enabled: bool = True
    description: str | None = None


class ShopOut(BaseModel):
    id: str
    name: str
    url: str
    enabled: bool
    description: str | None

    class Config:
        from_attributes = True


class TelegramIn(BaseModel):
    enabled: bool = False
    bot_token: str = ""
    bot_username: str = ""
    chat_id: str = ""
    widget_title: str = "Haizhu 客服"
    welcome_message: str = ""
    placeholder: str = ""


class TelegramOut(BaseModel):
    enabled: bool
    bot_token_masked: str
    bot_username: str
    chat_id: str
    widget_title: str
    welcome_message: str
    placeholder: str


class ApiKeyIn(BaseModel):
    name: str
    scopes: list[str] = ["traffic:read"]


class ApiKeyOut(BaseModel):
    id: str
    name: str
    key: str = ""
    scopes: list[str]
    enabled: bool
    created_at: datetime
    last_used_at: datetime | None

    class Config:
        from_attributes = True


class ApiKeyCreated(BaseModel):
    id: str
    name: str
    key: str  # plaintext, shown once
    scopes: list[str]


class SettingsOut(BaseModel):
    register_enabled: bool
    invite_required: bool
    invite_bonus_mb: int
    new_user_bonus_mb: int
    site_name: str
    maintenance: bool


class DashboardOut(BaseModel):
    users: int
    nodes: int
    online_nodes: int
    cdks_issued: int
    cdks_used: int
    traffic_today_mb: float
    revenue_ref: float

class SmtpIn(BaseModel):
    enabled: bool = False
    host: str = ""
    port: int = 587
    username: str = ""
    password: str = ""
    sender: str = ""
    use_tls: bool = True
    use_ssl: bool = False


class SmtpOut(BaseModel):
    enabled: bool
    host: str
    port: int
    username: str
    password_masked: str
    sender: str
    use_tls: bool
    use_ssl: bool


class ConsoleNodesOut(BaseModel):
    nodes: list[NodeOut]
    sub_url: str
    clash_url: str

class NodeImportIn(BaseModel):
    text: str
    region_default: str = "HK"


class NodeImportOut(BaseModel):
    created: list[NodeOut]
    failed: list[dict]


class TrafficItemOut(BaseModel):
    ts: datetime
    node_name: str
    bytes_in: float
    bytes_out: float


class TrafficPageOut(BaseModel):
    total: int
    items: list[TrafficItemOut]
