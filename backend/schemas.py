from datetime import datetime
from typing import Optional, Dict

from pydantic import BaseModel, ConfigDict


# Child Schemas
class ChildBase(BaseModel):
    name: str

class ChildCreate(ChildBase):
    pass

class Child(ChildBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Expense Schemas
class ExpenseBase(BaseModel):
    amount: float
    description: str
    category: str = "cash"
    currency: str = "EUR"
    date: datetime
    child_id: int

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    currency: Optional[str] = None
    date: Optional[datetime] = None
    child_id: Optional[int] = None

class Expense(ExpenseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Responses
class ChildWithTotal(Child):
    total_expenses: float

class CurrencyTotal(BaseModel):
    total: float
    cash: float
    card: float

class ChildSpendSummary(BaseModel):
    child_id: int
    grand_total_gbp: float
    currency_totals: Dict[str, CurrencyTotal]
