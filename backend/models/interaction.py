"""
models/interaction.py — SQLAlchemy ORM Models cho Đánh Giá, Yêu Thích & Thông Báo
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class ProductReview(Base):
    """Bảng product_reviews — Đánh giá chất lượng sản phẩm & Huy hiệu Verified Buyer."""
    __tablename__ = "product_reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 - 5 sao
    comment = Column(Text, nullable=False)
    has_photo = Column(Boolean, default=False, nullable=False)
    is_verified_buyer = Column(Boolean, default=True, nullable=False)
    seller_reply = Column(Text, default="")
    seller_replied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
    order = relationship("Order")


class Wishlist(Base):
    """Bảng wishlists — Danh sách sản phẩm yêu thích của người dùng."""
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_user_product_wishlist"),
    )

    user = relationship("User", back_populates="wishlists")
    product = relationship("Product")


class Notification(Base):
    """Bảng notifications — Trung tâm thông báo người dùng đa kênh."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # 'order', 'promo', 'dispute', 'system'
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    link_url = Column(Text, default="")
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="notifications")