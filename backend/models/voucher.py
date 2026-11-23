"""
models/voucher.py — SQLAlchemy ORM Model cho Phân Hệ Khuyến Mãi & Voucher
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class Voucher(Base):
    """Bảng vouchers — Kho phiếu giảm giá toàn sàn."""
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(120), nullable=False)
    voucher_type = Column(String(20), nullable=False)  # 'percent', 'fixed', 'freeship'
    discount_value = Column(BigInteger, nullable=False)
    min_order_value = Column(BigInteger, default=0, nullable=False)
    max_discount_amount = Column(BigInteger, nullable=True)
    usage_limit = Column(Integer, default=1000)
    usage_count = Column(Integer, default=0, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    orders = relationship("Order", back_populates="voucher")
