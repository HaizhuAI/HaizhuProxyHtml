"""Central settings — env driven, sane defaults for local demo."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "HaizhuProxy API"
    version: str = "1.0.0"
    secret_key: str = "hz-dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24 * 7  # 7 days
    database_url: str = "sqlite:///./data/haizhu.db"
    cors_origins: list[str] = ["*"]

    # registration / invite
    register_enabled: bool = True
    invite_required: bool = False
    invite_bonus_mb: int = 1024
    new_user_bonus_mb: int = 0

    # login rate limit
    login_max_failures: int = 5
    login_lock_minutes: int = 15

    # telegram (admin overrides in DB)
    telegram_test_chat_id: str = ""

    # traffic
    traffic_metric_interval_s: int = 60

    class Config:
        env_file = ".env"
        env_prefix = "HZ_"


settings = Settings()
