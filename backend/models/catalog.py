"""
models/catalog.py — SQLAlchemy ORM Models cho Danh Mục, Thương Hiệu, Sản Phẩm Hybrid
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class Category(Base):
    """Bảng categories — Danh mục ngành hàng."""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slug = Column(String(60), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    icon = Column(String(40), default="category")
    tone = Column(String(20), default="primary")
    badge = Column(String(50), default="")
    desc = Column(Text, default="")
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    products = relationship("Product", back_populates="category")


class Brand(Base):
    """Bảng brands — Thương hiệu chính hãng phân phối."""
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slug = Column(String(60), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    logo_url = Column(Text, default="")
    is_official_mall = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    products = relationship("Product", back_populates="brand")


class Product(Base):
    """Bảng products — Sản phẩm trung tâm (Brand Mall Mới 100% & Chợ C2C Like New)."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(50), unique=True, nullable=True)
    name = Column(String(255), nullable=False, index=True)
    short_name = Column(String(120), nullable=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_type = Column(String(20), default="c2c", nullable=False, index=True)  # 'mall' | 'c2c'
    condition_pct = Column(Integer, default=100, nullable=False)  # 50 - 100%
    condition_label = Column(String(60), default="Mới 100%")
    original_price = Column(BigInteger, nullable=False)
    selling_price = Column(BigInteger, nullable=False, index=True)
    stock_quantity = Column(Integer, default=1, nullable=False)
    thumbnail_url = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    accessories_included = Column(Text, default="")
    warranty_months = Column(Integer, default=12, nullable=False)
    warranty_policy_note = Column(Text, default="")
    inspection_passed = Column(Boolean, default=True, nullable=False)
    inspection_score = Column(Float, default=9.8)
    allow_offers = Column(Boolean, default=False, nullable=False)
    is_flash_sale = Column(Boolean, default=False, nullable=False)
    flash_sale_end = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0, nullable=False)
    sales_count = Column(Integer, default=0, nullable=False)
    rating_average = Column(Float, default=5.0, nullable=False)
    rating_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    seller = relationship("User", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order")
    specs = relationship("ProductSpec", back_populates="product", cascade="all, delete-orphan", order_by="ProductSpec.display_order")
    offers = relationship("ProductOffer", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("ProductReview", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    """Bảng product_images — Thư viện ảnh sản phẩm."""
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    is_cover = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    product = relationship("Product", back_populates="images")


class ProductSpec(Base):
    """Bảng product_specs — Thông số kỹ thuật chi tiết của thiết bị."""
    __tablename__ = "product_specs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    group_name = Column(String(60), default="Cấu hình chung")
    spec_key = Column(String(80), nullable=False)
    spec_value = Column(Text, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="specs")