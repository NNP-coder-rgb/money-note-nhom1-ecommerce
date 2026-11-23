"""
models/product.py — SQLAlchemy ORM Model cho Bảng Sản Phẩm (products)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class Product(Base):
    """Bảng lưu trữ thông tin sản phẩm (chính hãng Brand Mall và đồ cũ C2C)."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="Mã sản phẩm tự tăng")
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="Mã người bán sở hữu")
    name = Column(String(255), nullable=False, index=True, comment="Tên sản phẩm hiển thị")
    slug = Column(String(255), unique=True, index=True, nullable=False, comment="Đường dẫn thân thiện SEO")
    sku = Column(String(50), unique=True, nullable=True, comment="Mã SKU kho hàng")
    product_type = Column(String(20), default="c2c", nullable=False, comment="Loại hàng: mall hoặc c2c")
    condition_pct = Column(Integer, default=100, nullable=False, comment="Tình trạng phần trăm mới (50-100%)")
    original_price = Column(BigInteger, nullable=False, comment="Giá gốc niêm yết (VNĐ)")
    selling_price = Column(BigInteger, nullable=False, index=True, comment="Giá bán thực tế (VNĐ)")
    stock_quantity = Column(Integer, default=1, nullable=False, comment="Số lượng tồn kho khả dụng")
    thumbnail_url = Column(Text, nullable=False, comment="Ảnh bìa đại diện sản phẩm")
    description = Column(Text, nullable=True, comment="Mô tả chi tiết sản phẩm")
    is_active = Column(Boolean, default=True, nullable=False, comment="Trạng thái mở bán")
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Mối quan hệ ORM
    seller = relationship("User", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

    def __repr__(self):
        return f"<Product id={self.id} name='{self.name}' price={self.selling_price}>"
