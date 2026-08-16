from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def auto_migrate() -> None:
    """Add newly introduced columns to existing SQLite tables (idempotent)."""
    if not settings.database_url.startswith("sqlite"):
        return
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    def add_column(table: str, col: str, ddl: str) -> None:
        if table in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns(table)}
            if col not in cols:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}"))
    add_column("users", "uuid", "VARCHAR(36) DEFAULT ''")
    add_column("users", "sub_token", "VARCHAR(64) DEFAULT ''")
    add_column("nodes", "network", "VARCHAR(16) DEFAULT 'tcp'")
    add_column("nodes", "path", "VARCHAR(255) DEFAULT ''")
    add_column("nodes", "sni", "VARCHAR(255) DEFAULT ''")
    add_column("nodes", "flow", "VARCHAR(64) DEFAULT ''")
    add_column("nodes", "security", "VARCHAR(16) DEFAULT 'tls'")
    add_column("nodes", "reality_pbk", "VARCHAR(255) DEFAULT ''")
    add_column("nodes", "reality_sid", "VARCHAR(64) DEFAULT ''")


auto_migrate()
