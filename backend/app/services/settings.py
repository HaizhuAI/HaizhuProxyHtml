from sqlalchemy.orm import Session

from ..models import Setting


def get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.get(Setting, key)
    return row.value if row else default


def set_setting(db: Session, key: str, value: str) -> None:
    row = db.get(Setting, key)
    if row:
        row.value = value
    else:
        db.add(Setting(key=key, value=value))
    db.commit()


def get_bool_setting(db: Session, key: str, default: bool) -> bool:
    return get_setting(db, key, "true" if default else "false").lower() in ("1", "true", "yes", "on")
