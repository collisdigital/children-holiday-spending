import pytest
from models import Child

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
