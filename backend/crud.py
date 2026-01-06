from datetime import timezone

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

import schemas
from models import Child, Expense
from currencies import RATES_TO_GBP, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY


async def get_child_by_name(db: AsyncSession, name: str):
    result = await db.execute(select(Child).filter(Child.name == name))
    return result.scalars().first()

async def create_child(db: AsyncSession, child: schemas.ChildCreate):
    db_child = Child(name=child.name)
    db.add(db_child)
    await db.commit()
    await db.refresh(db_child)
    return db_child

async def get_children(db: AsyncSession):
    result = await db.execute(select(Child))
    return result.scalars().all()

async def get_child(db: AsyncSession, child_id: int):
    result = await db.execute(select(Child).filter(Child.id == child_id))
    return result.scalars().first()

async def get_expenses_by_child(db: AsyncSession, child_id: int):
    result = await db.execute(select(Expense).filter(Expense.child_id == child_id).order_by(Expense.date.desc()))
    return result.scalars().all()

async def get_child_total_expense(db: AsyncSession, child_id: int):
    # Fetch all expenses for the child
    expenses = await get_expenses_by_child(db, child_id)

    currency_totals = {}

    # Initialize supported currencies
    for curr in SUPPORTED_CURRENCIES:
        currency_totals[curr] = {"total": 0.0, "cash": 0.0, "card": 0.0}

    grand_total_gbp = 0.0

    for expense in expenses:
        curr = expense.currency or DEFAULT_CURRENCY
        if curr not in currency_totals:
            # Handle unexpected currencies if any, though schema/model default enforces supported ones mostly
            currency_totals[curr] = {"total": 0.0, "cash": 0.0, "card": 0.0}

        amount = expense.amount
        category = expense.category or "cash"

        currency_totals[curr]["total"] += amount
        if category == "cash":
            currency_totals[curr]["cash"] += amount
        elif category == "card":
            currency_totals[curr]["card"] += amount

        # Convert to GBP
        rate = RATES_TO_GBP.get(curr, 0.0)
        grand_total_gbp += amount * rate

    return {
        "child_id": child_id,
        "grand_total_gbp": grand_total_gbp,
        "currency_totals": currency_totals,
    }

async def create_expense(db: AsyncSession, expense: schemas.ExpenseCreate):
    # Ensure date is naive UTC for PostgreSQL TIMESTAMP WITHOUT TIME ZONE
    if expense.date.tzinfo is not None:
        expense.date = expense.date.astimezone(timezone.utc).replace(tzinfo=None)

    db_expense = Expense(**expense.model_dump())
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

async def delete_expense(db: AsyncSession, expense_id: int):
    result = await db.execute(select(Expense).filter(Expense.id == expense_id))
    db_expense = result.scalars().first()
    if db_expense:
        await db.delete(db_expense)
        await db.commit()
    return db_expense

async def update_expense(db: AsyncSession, expense_id: int, expense_update: schemas.ExpenseUpdate):
    result = await db.execute(select(Expense).filter(Expense.id == expense_id))
    db_expense = result.scalars().first()
    if not db_expense:
        return None

    update_data = expense_update.model_dump(exclude_unset=True)
    if 'date' in update_data and update_data['date'] is not None:
        if update_data['date'].tzinfo is not None:
            update_data['date'] = update_data['date'].astimezone(timezone.utc).replace(tzinfo=None)

    for key, value in update_data.items():
        setattr(db_expense, key, value)

    await db.commit()
    await db.refresh(db_expense)
    return db_expense
