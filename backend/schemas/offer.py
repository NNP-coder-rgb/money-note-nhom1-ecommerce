"""
schemas/offer.py — Pydantic Schemas Cho Đàm Phán Trả Giá C2C 24h
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class OfferCreate(BaseModel):
    product_id: int
    offered_price: int = Field(..., gt=0, description="Mức giá người mua đề xuất")
    buyer_message: Optional[str] = Field(default="", description="Lời nhắn gửi người bán")


class OfferAction(BaseModel):
    action: str = Field(..., description="accept, reject, hoặc counter")
    counter_price: Optional[int] = Field(default=None, description="Giá người bán đề xuất ngược lại")
    seller_note: Optional[str] = Field(default="", description="Lời phản hồi của người bán")


class OfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    buyer_id: int
    seller_id: int
    original_price: int
    offered_price: int
    discount_pct: int
    buyer_message: Optional[str] = None
    seller_note: Optional[str] = None
    status: str
    counter_price: Optional[int] = None
    expires_at: datetime
    created_at: datetime
