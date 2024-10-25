# app/models.py

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    username: str
    email: str
    company: Optional[str] = None
    token: str
    is_admin: bool = False

class UserCreate(BaseModel):
    username: str
    email: str
    company: Optional[str] = None

class Message(BaseModel):
    sender: str  # 'user' or 'bot'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ItemSelection(BaseModel):
    podium: int  # Podium number from 1 to 5
    item_name: str
    item_price: float
    quantity: int

class Item(BaseModel):
    podium: int
    item_name: str
    item_price: float
    quantity: int

class GameResult(BaseModel):
    items: List[Item]
    total_price: float
    time_taken: float

class LeaderboardEntry(BaseModel):
    username: str
    score: float
    total_price: float
    time_taken: float
    timestamp: datetime

class GameResultInput(BaseModel):
    items: List[ItemSelection]
    total_price: float
    time_taken: float
