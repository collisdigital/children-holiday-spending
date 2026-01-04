from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    expenses = relationship("Expense", back_populates="child")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, default="cash", nullable=False, server_default="cash")
    date = Column(DateTime, default=datetime.utcnow)
    child_id = Column(Integer, ForeignKey("children.id"))

    child = relationship("Child", back_populates="expenses")
