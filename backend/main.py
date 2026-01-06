from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

import crud
import schemas
from config import settings
from database import engine, get_db

CHILDREN_NAMES = ["Xav", "Emma", "Frankie", "Zoe"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database
    # In development/sandbox without migration run, we might need to create tables.
    # However, standard practice is to rely on alembic or pre-start script.
    # For sandbox verification where we run uvicorn directly, we ensure tables exist.
    from database import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        for name in CHILDREN_NAMES:
            child = await crud.get_child_by_name(session, name)
            if not child:
                print(f"Seeding child: {name}")
                await crud.create_child(session, schemas.ChildCreate(name=name))
    yield
    # Shutdown

app = FastAPI(title="Holiday Spending Tracker", lifespan=lifespan)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencies
def verify_admin_pin(x_admin_pin: str = Header(None)):
    if x_admin_pin != settings.ADMIN_PIN:
        raise HTTPException(status_code=401, detail="Invalid Admin PIN")
    return x_admin_pin

@app.get("/children", response_model=List[schemas.Child])
async def read_children(db: AsyncSession = Depends(get_db)):
    children = await crud.get_children(db)
    return children

@app.get("/children/{child_id}/expenses", response_model=List[schemas.Expense])
async def read_child_expenses(child_id: int, db: AsyncSession = Depends(get_db)):
    child = await crud.get_child(db, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    expenses = await crud.get_expenses_by_child(db, child_id)
    return expenses

@app.get("/children/{child_id}/total", response_model=schemas.ChildSpendSummary)
async def read_child_total(child_id: int, db: AsyncSession = Depends(get_db)):
    child = await crud.get_child(db, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    # crud returns a dict matching the schema
    summary = await crud.get_child_total_expense(db, child_id)
    return summary

@app.post("/expenses", response_model=schemas.Expense, dependencies=[Depends(verify_admin_pin)])
async def create_expense(expense: schemas.ExpenseCreate, db: AsyncSession = Depends(get_db)):
    child = await crud.get_child(db, expense.child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return await crud.create_expense(db, expense)

@app.put("/expenses/{expense_id}", response_model=schemas.Expense, dependencies=[Depends(verify_admin_pin)])
async def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: AsyncSession = Depends(get_db)):
    db_expense = await crud.update_expense(db, expense_id, expense)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@app.delete("/expenses/{expense_id}", dependencies=[Depends(verify_admin_pin)])
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    success = await crud.delete_expense(db, expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"status": "success", "id": expense_id}

@app.post("/verify-pin")
async def check_pin(x_admin_pin: str = Header(None)):
    verify_admin_pin(x_admin_pin)
    return {"status": "ok"}
