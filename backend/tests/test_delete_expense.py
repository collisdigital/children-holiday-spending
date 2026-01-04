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

@asynccontextmanager
async def mock_lifespan(app: FastAPI):
    yield

@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with TestingSessionLocal() as session:
        yield session
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    original_lifespan = app.router.lifespan_context
    app.router.lifespan_context = mock_lifespan
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
    app.router.lifespan_context = original_lifespan

@pytest.mark.asyncio
async def test_delete_expense(client, db_session):
    # Setup: Create Child and Expense
    child = Child(name="DeleteTestChild")
    db_session.add(child)
    await db_session.commit()
    await db_session.refresh(child)

    # Create Expense
    create_resp = await client.post(
        "/expenses",
        json={"amount": 50.0, "description": "To Delete", "date": "2023-11-01T12:00:00", "child_id": child.id},
        headers={"X-Admin-PIN": "1122"}
    )
    assert create_resp.status_code == 200
    expense_id = create_resp.json()["id"]

    # Verify expense exists
    get_resp = await client.get(f"/children/{child.id}/expenses")
    assert get_resp.status_code == 200
    expenses = get_resp.json()
    assert len(expenses) == 1
    assert expenses[0]["id"] == expense_id

    # Test Delete
    delete_resp = await client.delete(
        f"/expenses/{expense_id}",
        headers={"X-Admin-PIN": "1122"}
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "success"

    # Verify expense is gone
    get_resp_after = await client.get(f"/children/{child.id}/expenses")
    expenses_after = get_resp_after.json()
    assert len(expenses_after) == 0

@pytest.mark.asyncio
async def test_delete_expense_not_found(client):
    # Test delete non-existent expense
    delete_resp = await client.delete(
        "/expenses/99999",
        headers={"X-Admin-PIN": "1122"}
    )
    assert delete_resp.status_code == 404

@pytest.mark.asyncio
async def test_delete_expense_invalid_pin(client):
    delete_resp = await client.delete(
        "/expenses/1",
        headers={"X-Admin-PIN": "WRONG"}
    )
    assert delete_resp.status_code == 401
