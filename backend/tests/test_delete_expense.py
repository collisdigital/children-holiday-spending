import pytest
from models import Child

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
