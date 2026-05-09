from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    amount: float
    type: str # "income" or "expense"
    category: str
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    date: Optional[datetime] = None # Allows passing a specific date, otherwise defaults

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True

# --- Budget Schemas ---
class BudgetBase(BaseModel):
    category: str
    amount: float
    month: str # "YYYY-MM"

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount: Optional[float] = None

class BudgetResponse(BudgetBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationBase(BaseModel):
    message: str
    type: str

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True
