"""
schemas/interaction.py — Pydantic Schemas Cho Đánh Giá, Yêu Thích & Thông Báo
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReviewCreate(BaseModel):
    product_id: int
    order_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=2)
    has_photo: bool = False


class ReviewReplyRequest(BaseModel):
    seller_reply: str = Field(..., min_length=2)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    user_id: int
    order_id: Optional[int] = None
    rating: int
    comment: str
    has_photo: bool
    is_verified_buyer: bool
    seller_reply: Optional[str] = ""
    seller_replied_at: Optional[datetime] = None
    created_at: datetime


class WishlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product_id: int
    created_at: datetime


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    title: str
    message: str
    link_url: Optional[str] = ""
    is_read: bool
    created_at: datetime
