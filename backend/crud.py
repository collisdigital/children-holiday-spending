from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from models import Child, Expense
import schemas

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
    result = await db.execute(select(func.sum(Expense.amount)).filter(Expense.child_id == child_id))
    total = result.scalar()
    return total if total else 0.0

async def create_expense(db: AsyncSession, expense: schemas.ExpenseCreate):
    db_expense = Expense(**expense.model_dump())
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

async def update_expense(db: AsyncSession, expense_id: int, expense_update: schemas.ExpenseUpdate):
    result = await db.execute(select(Expense).filter(Expense.id == expense_id))
    db_expense = result.scalars().first()
    if not db_expense:
        return None

    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)

    await db.commit()
    await db.refresh(db_expense)
    return db_expense
