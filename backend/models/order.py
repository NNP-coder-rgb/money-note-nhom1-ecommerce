"""
models/order.py — SQLAlchemy ORM Models cho Đơn Hàng, Tách Kiện Multi-Vendor & Vận Đơn
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class Order(Base):
    """Bảng orders — Hóa đơn mua sắm trung tâm & Xuất hóa đơn VAT."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_code = Column(String(40), unique=True, index=True, nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subtotal = Column(BigInteger, nullable=False)
    shipping_fee = Column(BigInteger, default=0, nullable=False)
    discount_amount = Column(BigInteger, default=0, nullable=False)
    total_amount = Column(BigInteger, nullable=False)
    voucher_id = Column(Integer, ForeignKey("vouchers.id", ondelete="SET NULL"), nullable=True)
    payment_method = Column(String(30), default="COD", nullable=False)  # 'COD', 'VIETQR', 'CARD', 'ESCROW'
    payment_status = Column(String(20), default="unpaid", nullable=False)  # 'unpaid', 'paid', 'refunded', 'held_in_escrow'
    shipping_method = Column(String(30), default="standard", nullable=False)
    recipient_name = Column(String(100), nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    shipping_address = Column(Text, nullable=False)
    buyer_note = Column(Text, default="")
    vat_requested = Column(Boolean, default=False, nullable=False)
    vat_company_name = Column(String(150), default="")
    vat_tax_code = Column(String(30), default="")
    status = Column(String(30), default="pending", nullable=False, index=True)  # 'pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'
    step_index = Column(Integer, default=1, nullable=False)  # 1: Đặt đơn, 2: Bàn giao, 3: Đang phát, 4: Đã nhận
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancel_reason = Column(Text, default="")
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    buyer = relationship("User", back_populates="orders")
    voucher = relationship("Voucher", back_populates="orders")
    parcels = relationship("OrderParcel", back_populates="order", cascade="all, delete-orphan")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    dispute = relationship("Dispute", back_populates="order", uselist=False)


class OrderParcel(Base):
    """Bảng order_parcels — Tách kiện hàng Multi-Vendor theo từng Shop & Lộ trình bưu tá."""
    __tablename__ = "order_parcels"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parcel_code = Column(String(40), unique=True, index=True, nullable=False)
    carrier_name = Column(String(60), default="Giao Hàng Nhanh (GHN)", nullable=False)
    tracking_code = Column(String(50), unique=True, index=True, nullable=False)
    shipping_fee = Column(BigInteger, default=0, nullable=False)
    estimated_delivery = Column(String(80), nullable=True)
    status = Column(String(20), default="processing", nullable=False)  # 'processing', 'in_transit', 'delivered'
    created_at = Column(DateTime, default=func.now(), nullable=False)

    order = relationship("Order", back_populates="parcels")
    seller = relationship("User")
    items = relationship("OrderItem", back_populates="parcel", cascade="all, delete-orphan")
    tracking_events = relationship("OrderTrackingEvent", back_populates="parcel", cascade="all, delete-orphan")


class OrderItem(Base):
    """Bảng order_items — Chi tiết từng sản phẩm trong đơn và kiện hàng."""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    parcel_id = Column(Integer, ForeignKey("order_parcels.id", ondelete="CASCADE"), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    product_type = Column(String(20), default="c2c", nullable=False)
    condition_pct = Column(Integer, default=100)
    unit_price = Column(BigInteger, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    total_price = Column(BigInteger, nullable=False)
    variant_info = Column(String(100), default="")
    thumbnail_url = Column(Text, default="")

    order = relationship("Order", back_populates="items")
    parcel = relationship("OrderParcel", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class OrderTrackingEvent(Base):
    """Bảng order_tracking_events — Nhật ký hành trình bưu kiện thời gian thực."""
    __tablename__ = "order_tracking_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    parcel_id = Column(Integer, ForeignKey("order_parcels.id", ondelete="CASCADE"), nullable=False, index=True)
    status_title = Column(String(120), nullable=False)
    status_description = Column(Text, nullable=False)
    location = Column(String(120), nullable=False)
    shipper_name = Column(String(80), default="")
    shipper_phone = Column(String(20), default="")
    event_time = Column(DateTime, default=func.now(), nullable=False)

    parcel = relationship("OrderParcel", back_populates="tracking_events")