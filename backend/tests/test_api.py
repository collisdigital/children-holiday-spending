import pytest
from models import Child

@pytest.mark.asyncio
async def test_full_flow(client, db_session):
    # 1. Seed Child
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
