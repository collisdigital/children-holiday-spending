import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from contextlib import asynccontextmanager
from fastapi import FastAPI

from database import Base, get_db
from main import app

@pytest_asyncio.fixture(scope="function")
async def db_engine():
    """
    Creates a fresh in-memory SQLite database for each test.
    Using function scope ensures that the engine and its connection pool
    are tied to the current test's event loop, preventing 'loop closed' errors
    and preserving isolation.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    """
    Creates a new database session for a test.
    """
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """
    Creates a TestClient that uses the overridden database session.
    Also mocks the lifespan to prevent connecting to the real database.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    @asynccontextmanager
    async def mock_lifespan(app: FastAPI):
        yield

    original_lifespan = app.router.lifespan_context
    app.router.lifespan_context = mock_lifespan

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    app.router.lifespan_context = original_lifespan
