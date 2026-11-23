"""
schemas/voucher.py — Pydantic Schemas Cho Khuyến Mãi & Voucher
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VoucherCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=30)
    title: str
    voucher_type: str = Field(default="fixed", description="fixed, percent, freeship")
    discount_value: int
    min_order_value: int = 0
    max_discount_amount: Optional[int] = None
    usage_limit: int = 1000
    start_date: datetime
    end_date: datetime


class VoucherResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title: str
    voucher_type: str
    discount_value: int
    min_order_value: int
    max_discount_amount: Optional[int] = None
    usage_limit: int
    usage_count: int
    start_date: datetime
    end_date: datetime
    is_active: bool


class VoucherApplyRequest(BaseModel):
    code: str
    order_amount: int


class VoucherApplyResponse(BaseModel):
    is_valid: bool
    discount_amount: int
    message: str
    voucher: Optional[VoucherResponse] = None
