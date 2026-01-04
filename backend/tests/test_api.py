# Use file-based SQLite for testing to avoid memory/loop issues
import os
from contextlib import asynccontextmanager

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app

TEST_DB_FILE = "./test.db"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

engine_test = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test, class_=AsyncSession)

# Mock lifespan
@asynccontextmanager
async def mock_lifespan(app):
    yield
app.router.lifespan_context = mock_lifespan

# Dependency override
async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(scope="function")
async def db_session():
    # Clean up before
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    await engine_test.dispose()
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

@pytest_asyncio.fixture(scope="function")
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

@pytest.mark.asyncio
async def test_full_flow(client, db_session):
    # 1. Seed Child
    from models import Child
    child = Child(name="TestChild")
    db_session.add(child)
    await db_session.commit()
    await db_session.refresh(child)

    # 2. Create Expense
    response = await client.post(
        "/expenses",
        json={"amount": 50.0, "description": "Gift", "date": "2023-10-27T10:00:00", "child_id": child.id},
        headers={"X-Admin-PIN": "1122"}
    )
    assert response.status_code == 200

    # 3. Get Expense
    response = await client.get(f"/children/{child.id}/expenses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["amount"] == 50.0

    # 4. Auth Check
    response = await client.post(
        "/expenses",
        json={"amount": 50.0, "description": "Gift", "date": "2023-10-27T10:00:00", "child_id": child.id},
    )
    assert response.status_code == 401
