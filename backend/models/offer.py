"""
models/offer.py — SQLAlchemy ORM Model cho Phân Hệ Trả Giá C2C (24 Giờ)
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class ProductOffer(Base):
    """Bảng product_offers — Lịch sử đàm phán trả giá giữa Người mua & Người bán."""
    __tablename__ = "product_offers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_price = Column(BigInteger, nullable=False)
    offered_price = Column(BigInteger, nullable=False)
    discount_pct = Column(Integer, nullable=False)
    buyer_message = Column(Text, default="")
    seller_note = Column(Text, default="")
    status = Column(String(20), default="pending", nullable=False, index=True)  # 'pending', 'accepted', 'rejected', 'countered', 'expired'
    counter_price = Column(BigInteger, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    product = relationship("Product", back_populates="offers")
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
