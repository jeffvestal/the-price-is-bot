# app/schemas.py

from pydantic import BaseModel, Field
from typing import Optional, List

class Podium(BaseModel):
    podium: int = Field(..., description="Podium number.")
    item_name: str = Field(..., description="Name of the grocery item.")
    item_price: float = Field(..., description="Price of a single unit of the item.")
    quantity: int = Field(..., description="Number of units of the item placed on the podium.")
    total_price: float = Field(..., description="Total price for the item (item_price * quantity).")

class AssistantResponse(BaseModel):
    podiums: List[Podium] = Field(..., description="List of podium items.")
    overall_total: float = Field(..., description="Cumulative total price of all selected items.")
    other_info: Optional[str] = Field(None, description="Additional information or instructions.")
    proposed_solution: bool = Field(..., description="Indicate if this response contains a proposed solution (True) or not (False).")
