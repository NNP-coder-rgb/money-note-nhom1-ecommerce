"""
schemas/product.py — Pydantic Schemas Cho Đối Tượng Sản Phẩm (Product)
Nguyen Tien Dat
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Tên sản phẩm")
    slug: str = Field(..., description="Đường dẫn SEO")
    sku: Optional[str] = Field(default=None, description="Mã kho SKU")
    product_type: str = Field(default="c2c", description="Loại sản phẩm: mall hoặc c2c")
    condition_pct: int = Field(default=100, ge=50, le=100, description="Tình trạng phần trăm mới (50-100%)")
    original_price: int = Field(..., gt=0, description="Giá niêm yết ban đầu")
    selling_price: int = Field(..., gt=0, description="Giá bán thực tế")
    stock_quantity: int = Field(default=1, ge=0, description="Số lượng tồn kho")
    thumbnail_url: str = Field(..., description="Ảnh đại diện sản phẩm")
    description: Optional[str] = Field(default=None, description="Mô tả chi tiết")


class ProductCreate(ProductBase):
    seller_id: int = Field(..., description="Mã người bán sở hữu")


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    original_price: Optional[int] = None
    selling_price: Optional[int] = None
    stock_quantity: Optional[int] = None
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    seller_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
