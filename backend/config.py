from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Default to SQLite for local development in sandbox
    DATABASE_URL: str = "sqlite+aiosqlite:///./holiday_tracker.db"
    ADMIN_PIN: str = "1122"

    class Config:
        env_file = ".env"

settings = Settings()

# Fix for Render's postgres:// URL scheme which SQLAlchemy might not like with asyncpg,
# or might default to psycopg2 if not specified.
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif settings.DATABASE_URL.startswith("postgresql://") and "asyncpg" not in settings.DATABASE_URL:
     # If it's just postgresql://, force asyncpg
     settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
