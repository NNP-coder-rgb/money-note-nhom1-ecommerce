"""
schemas/catalog.py — Pydantic Schemas Cho Danh Mục, Thương Hiệu và Sản Phẩm
Nguyen Tien Dat
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    icon: Optional[str] = "category"
    tone: Optional[str] = "primary"
    badge: Optional[str] = ""
    desc: Optional[str] = ""
    display_order: int = 0
    is_active: bool = True


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    logo_url: Optional[str] = ""
    is_official_mall: bool = False


class ProductSpecResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group_name: Optional[str] = "Cấu hình chung"
    spec_key: str
    spec_value: str
    display_order: int = 0


class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    is_cover: bool = False
    display_order: int = 0


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Tên sản phẩm")
    short_name: Optional[str] = None
    slug: str = Field(..., description="Đường dẫn SEO")
    sku: Optional[str] = None
    category_id: int
    brand_id: Optional[int] = None
    product_type: str = Field(default="c2c", description="Loại sản phẩm: mall hoặc c2c")
    condition_pct: int = Field(default=100, ge=50, le=100, description="Tình trạng % (50-100%)")
    condition_label: Optional[str] = "Mới 100%"
    original_price: int = Field(..., gt=0)
    selling_price: int = Field(..., gt=0)
    stock_quantity: int = Field(default=1, ge=0)
    thumbnail_url: str
    description: Optional[str] = None
    accessories_included: Optional[str] = ""
    warranty_months: int = 12
    warranty_policy_note: Optional[str] = ""
    inspection_passed: bool = True
    inspection_score: float = 9.8
    allow_offers: bool = False
    is_flash_sale: bool = False


class ProductCreate(ProductBase):
    seller_id: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    selling_price: Optional[int] = None
    original_price: Optional[int] = None
    stock_quantity: Optional[int] = None
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    condition_pct: Optional[int] = None
    is_active: Optional[bool] = None
    is_flash_sale: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    seller_id: int
    view_count: int = 0
    sales_count: int = 0
    rating_average: float = 5.0
    rating_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class ProductDetailResponse(ProductResponse):
    category: Optional[CategoryResponse] = None
    brand: Optional[BrandResponse] = None
    images: List[ProductImageResponse] = Field(default_factory=list)
    specs: List[ProductSpecResponse] = Field(default_factory=list)
