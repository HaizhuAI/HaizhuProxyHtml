from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Cdk, Invite, Node, TrafficLog, User
from ..schemas import ConsoleNodesOut, InviteOut, NodeOut, ProfileIn, RedeemIn, RedeemOut, TrafficItemOut, TrafficPageOut, UserOut, UsageOut
from ..services.cdk import redeem_cdk
from ..services.settings import get_setting
from ..services.subscription import ensure_user_identity

router = APIRouter(prefix="/api/console", tags=["console"])


@router.get("/usage", response_model=UsageOut)
def usage(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_agg = (
        db.query(
            func.coalesce(func.sum(TrafficLog.bytes_in), 0),
            func.coalesce(func.sum(TrafficLog.bytes_out), 0),
        )
        .filter(TrafficLog.user_id == user.id, TrafficLog.ts >= today)
        .one()
    )
    series: list[dict] = []
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        nxt = day + timedelta(days=1)
        agg = (
            db.query(
                func.coalesce(func.sum(TrafficLog.bytes_in), 0),
                func.coalesce(func.sum(TrafficLog.bytes_out), 0),
            )
            .filter(TrafficLog.user_id == user.id, TrafficLog.ts >= day, TrafficLog.ts < nxt)
            .one()
        )
        series.append({
            "ts": day.date().isoformat(),
            "in": round((agg[0] or 0) / 1024 / 1024, 1),
            "out": round((agg[1] or 0) / 1024 / 1024, 1),
        })
    active_nodes = db.query(func.count(Node.id)).filter(Node.status == "online").scalar() or 0
    return UsageOut(
        balance=user.balance_mb,
        used=user.traffic_used_mb,
        total=user.balance_mb + user.traffic_used_mb,
        active_nodes=active_nodes,
        today_in=round((day_agg[0] or 0) / 1024 / 1024, 1),
        today_out=round((day_agg[1] or 0) / 1024 / 1024, 1),
        series=series,
    )


@router.post("/redeem", response_model=RedeemOut)
def redeem(body: RedeemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        added, balance = redeem_cdk(db, body.code, user)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return RedeemOut(added=added, balance=balance)


@router.get("/nodes", response_model=ConsoleNodesOut)
def my_nodes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    nodes = db.query(Node).filter(Node.status != "offline").all()
    uid, token = ensure_user_identity(db, user)
    return ConsoleNodesOut(
        nodes=[NodeOut.model_validate(n) for n in nodes],
        sub_url=f"/api/sub/{token}/v2ray",
        clash_url=f"/api/sub/{token}/clash",
    )


@router.get("/traffic", response_model=TrafficPageOut)
def my_traffic(page: int = 1, page_size: int = 20, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """流量明细（分页）：时间 / 节点 / 入出流量。"""
    page = max(1, page)
    page_size = min(100, max(1, page_size))
    q = db.query(TrafficLog).filter(TrafficLog.user_id == user.id)
    total = q.count()
    rows = (
        q.order_by(TrafficLog.ts.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    name_map = {n.id: n.name for n in db.query(Node).all()}
    items = [
        TrafficItemOut(
            ts=row.ts.replace(tzinfo=None) if row.ts.tzinfo else row.ts,
            node_name=name_map.get(row.node_id, "未知节点"),
            bytes_in=row.bytes_in, bytes_out=row.bytes_out,
        )
        for row in rows
    ]
    return TrafficPageOut(total=total, items=items)


@router.post("/probe/{node_id}")
def probe_node(node_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User-side latency probe: TCP connect timing (no custom host allowed)."""
    import socket
    import time
    node = db.get(Node, node_id)
    if not node:
        raise HTTPException(404, "节点不存在")
    t0 = time.perf_counter()
    try:
        with socket.create_connection((node.host, node.port), timeout=3):
            latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {"node_id": node.id, "name": node.name, "host": node.host, "port": node.port,
                "latency_ms": latency_ms, "reachable": True}
    except OSError:
        return {"node_id": node.id, "name": node.name, "host": node.host, "port": node.port,
                "latency_ms": None, "reachable": False}


@router.get("/invite", response_model=InviteOut)
def invite_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invites = db.query(Invite).filter(Invite.inviter_id == user.id).all()
    active = sum(1 for i in invites if db.get(User, i.invitee_id) and db.get(User, i.invitee_id).status == "active")
    bonus = float(get_setting(db, "invite_bonus_mb", "1024") or 0)
    return InviteOut(code=user.invite_code, total=len(invites), active=active, bonus_per_invite=bonus)


@router.patch("/profile", response_model=UserOut)
def update_profile(body: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.username is not None:
        user.username = body.username.strip() or user.username
    if body.password:
        from ..core.security import hash_password
        user.password_hash = hash_password(body.password)
    db.commit()
    return UserOut.model_validate(user)
