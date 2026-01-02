from fastapi import FastAPI, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

import crud
import models
import schemas
from database import get_db, engine
from config import settings

CHILDREN_NAMES = ["Xav", "Emma", "Frankie", "Zoe"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database
    # We need to make sure tables exist first.
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

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

@app.get("/children/{child_id}/total")
async def read_child_total(child_id: int, db: AsyncSession = Depends(get_db)):
    child = await crud.get_child(db, child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    total = await crud.get_child_total_expense(db, child_id)
    return {"child_id": child_id, "total_amount": total}

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

@app.post("/verify-pin")
async def check_pin(x_admin_pin: str = Header(None)):
    verify_admin_pin(x_admin_pin)
    return {"status": "ok"}
