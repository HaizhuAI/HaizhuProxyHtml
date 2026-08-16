"""SMTP mailer — stdlib only, HTML + plain multipart."""
import smtplib
from email.header import Header
from email.message import EmailMessage
from email.utils import formataddr

from sqlalchemy.orm import Session

from ..models import SmtpConfig


def get_smtp(db: Session) -> SmtpConfig | None:
    row = db.query(SmtpConfig).first()
    if not row:
        row = SmtpConfig()
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _connect(cfg: SmtpConfig):
    if cfg.use_ssl:
        server = smtplib.SMTP_SSL(cfg.host, cfg.port or 465, timeout=12)
    else:
        server = smtplib.SMTP(cfg.host, cfg.port or 587, timeout=12)
        server.ehlo()
        if cfg.use_tls:
            server.starttls()
            server.ehlo()
    if cfg.username:
        server.login(cfg.username, cfg.password)
    return server


def send_email(db: Session, to_addr: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Send one email. Returns True on success, raises on failure."""
    cfg = get_smtp(db)
    if not cfg.enabled or not cfg.host or not cfg.sender:
        raise RuntimeError("SMTP 未配置或未启用")
    msg = EmailMessage()
    msg["From"] = formataddr((str(Header("HaizhuProxy", "utf-8")), cfg.sender))
    msg["To"] = to_addr
    msg["Subject"] = subject  # str only: py3.12 headerregistry rejects Header objects here
    msg.set_content(text_body or "请使用支持 HTML 的客户端查看本邮件。")
    msg.add_alternative(html_body, subtype="html")
    with _connect(cfg) as server:
        server.send_message(msg)
    return True


def send_cdk_email(db: Session, to_addr: str, codes: list[str], traffic_mb: float) -> bool:
    rows = "".join(f"<tr><td style='padding:10px 14px;border:1px solid #223046;border-radius:8px;font-family:monospace;color:#3fd9b4;letter-spacing:.05em'>{c}</td></tr>" for c in codes)
    html = f"""<!doctype html><html><body style="margin:0;background:#05070a;padding:32px;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;background:#0c1017;border:1px solid #223046;border-radius:14px;padding:28px">
<div style="color:#3fd9b4;font-size:13px;letter-spacing:.2em;text-transform:uppercase">HaizhuProxy</div>
<h1 style="color:#eef3f8;font-size:20px;margin:14px 0 6px">你的卡密已到账</h1>
<p style="color:#9fb0c3;font-size:13.5px;line-height:1.7;margin:0 0 18px">共 {len(codes)} 张，合计 {traffic_mb/1024:g} GB 流量。登录控制台 → 卡密兑换，输入以下任意一张卡密即可到账。</p>
<table style="border-collapse:collapse">{rows}</table>
<p style="color:#5c6b7e;font-size:12px;margin-top:18px">• 卡密不区分大小写，请勿泄露给他人<br/>• 未兑换的卡密永久有效（或按批次有效期）</p>
</div></div></body></html>"""
    return send_email(db, to_addr, f"HaizhuProxy 卡密 {len(codes)} 张 · {traffic_mb/1024:g} GB", html,
                      "\n".join(["HaizhuProxy 卡密："] + codes))
