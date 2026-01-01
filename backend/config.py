from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Default to SQLite for local development in sandbox
    DATABASE_URL: str = "sqlite+aiosqlite:///./holiday_tracker.db"
    ADMIN_PIN: str = "1122"

    class Config:
        env_file = ".env"

settings = Settings()
