"""
schemas/order.py — Pydantic Schemas Cho Đơn Hàng & Vận Đơn Multi-Vendor
Nguyễn Tiến Hùng
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class OrderItemCreate(BaseModel):
    product_id: int
    product_name: str
    product_type: Optional[str] = "c2c"
    condition_pct: Optional[int] = 100
    unit_price: int
    quantity: int = Field(default=1, ge=1)
    thumbnail_url: Optional[str] = ""


class OrderItemResponse(OrderItemCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: int


class OrderTrackingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parcel_id: int
    status_title: str
    status_description: str
    location: str
    shipper_name: Optional[str] = ""
    event_time: datetime


class OrderParcelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    seller_id: int
    parcel_code: str
    carrier_name: str
    tracking_code: str
    shipping_fee: int
    status: str
    items: List[OrderItemResponse] = Field(default_factory=list)
    tracking_events: List[OrderTrackingResponse] = Field(default_factory=list)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    shipping_fee: int = Field(default=0, ge=0)
    payment_method: str = Field(default="COD", description="COD, VIETQR, CARD, ESCROW")
    shipping_method: str = "standard"
    recipient_name: str = Field(..., min_length=2)
    recipient_phone: str = Field(..., min_length=9)
    shipping_address: str = Field(..., min_length=5)
    buyer_note: Optional[str] = ""
    voucher_code: Optional[str] = None
    vat_requested: bool = False
    vat_company_name: Optional[str] = ""
    vat_tax_code: Optional[str] = ""


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    cancel_reason: Optional[str] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_code: str
    buyer_id: int
    subtotal: int
    shipping_fee: int
    discount_amount: int
    total_amount: int
    payment_method: str
    payment_status: str
    status: str
    step_index: int
    recipient_name: str
    recipient_phone: str
    shipping_address: str
    buyer_note: Optional[str] = ""
    items: List[OrderItemResponse] = Field(default_factory=list)
    parcels: List[OrderParcelResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
