from contextlib import asynccontextmanager

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from models import Child

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine_test,
    class_=AsyncSession,
    expire_on_commit=False
)

# Mock lifespan to prevent main DB connection
@asynccontextmanager
async def mock_lifespan(app: FastAPI):
    yield

@pytest_asyncio.fixture(scope="function")
async def db_session():
    # Create tables
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Session
    async with TestingSessionLocal() as session:
        yield session

    # Actually StaticPool keeps data as long as engine is alive.
    # We should probably recreate the engine or drop tables.
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    # Override get_db
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Override lifespan
    original_lifespan = app.router.lifespan_context
    app.router.lifespan_context = mock_lifespan

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    # Restore
    app.dependency_overrides.clear()
    app.router.lifespan_context = original_lifespan

@pytest.mark.asyncio
async def test_create_expense_categories(client, db_session):
    # Create child
    child = Child(name="TestChild")
    db_session.add(child)
    await db_session.commit()
    await db_session.refresh(child)

    # 1. Create Default (Cash)
    resp = await client.post(
        "/expenses",
        json={"amount": 10.0, "description": "Candy", "date": "2023-10-01T12:00:00", "child_id": child.id},
        headers={"X-Admin-PIN": "1122"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["category"] == "cash"

    # 2. Create Card
    resp = await client.post(
        "/expenses",
        json={
            "amount": 20.0,
            "description": "Toy",
            "date": "2023-10-01T12:00:00",
            "child_id": child.id,
            "category": "card"
        },
        headers={"X-Admin-PIN": "1122"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["category"] == "card"

    # 3. Create Cash Explicitly
    resp = await client.post(
        "/expenses",
        json={
            "amount": 5.0,
            "description": "Gum",
            "date": "2023-10-01T12:00:00",
            "child_id": child.id,
            "category": "cash"
        },
        headers={"X-Admin-PIN": "1122"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["category"] == "cash"

@pytest.mark.asyncio
async def test_get_totals_breakdown(client, db_session):
    child = Child(name="TotalsChild")
    db_session.add(child)
    await db_session.commit()
    await db_session.refresh(child)

    # Add expenses
    # Cash: 10 + 5 = 15
    await client.post(
        "/expenses",
        json={
            "amount": 10.0,
            "description": "C1",
            "date": "2023-01-01T10:00:00",
            "child_id": child.id,
            "category": "cash"
        },
        headers={"X-Admin-PIN": "1122"}
    )
    await client.post(
        "/expenses",
        json={
            "amount": 5.0,
            "description": "C2",
            "date": "2023-01-01T10:00:00",
            "child_id": child.id,
            "category": "cash"
        },
        headers={"X-Admin-PIN": "1122"}
    )
    # Card: 20 = 20
    await client.post(
        "/expenses",
        json={
            "amount": 20.0,
            "description": "CD1",
            "date": "2023-01-01T10:00:00",
            "child_id": child.id,
            "category": "card"
        },
        headers={"X-Admin-PIN": "1122"}
    )

    # Get Totals
    resp = await client.get(f"/children/{child.id}/total")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["child_id"] == child.id
    assert data["total_amount"] == 35.0
    assert data["total_cash"] == 15.0
    assert data["total_card"] == 20.0
