"""
models/dispute.py — SQLAlchemy ORM Models cho Phòng Trọng Tài Khiếu Nại 3 Bên
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class Dispute(Base):
    """Bảng disputes — Hồ sơ vụ việc khiếu nại tranh chấp 3 bên."""
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dispute_code = Column(String(40), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    requested_refund = Column(BigInteger, nullable=False)
    approved_refund = Column(BigInteger, default=0, nullable=False)
    status = Column(String(30), default="pending", nullable=False, index=True)  # 'pending', 'in_arbitration', 'resolved', 'closed'
    arbitrator_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_decision_summary = Column(Text, default="")
    solution_code = Column(String(30), default="")  # 'full_refund', 'partial_refund', 'reject_claim'
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    order = relationship("Order", back_populates="dispute")
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
    arbitrator = relationship("User", foreign_keys=[arbitrator_admin_id])
    evidences = relationship("DisputeEvidence", back_populates="dispute", cascade="all, delete-orphan")
    messages = relationship("DisputeMessage", back_populates="dispute", cascade="all, delete-orphan", order_by="DisputeMessage.created_at")


class DisputeEvidence(Base):
    """Bảng dispute_evidences — Bằng chứng ảnh, video 4K mở hộp đồng kiểm."""
    __tablename__ = "dispute_evidences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    media_url = Column(Text, nullable=False)
    media_type = Column(String(20), default="image", nullable=False)  # 'image', 'video', 'pdf'
    title = Column(String(150), nullable=False)
    file_size_kb = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    dispute = relationship("Dispute", back_populates="evidences")
    uploader = relationship("User")


class DisputeMessage(Base):
    """Bảng dispute_messages — Nhật ký chat đối thoại 3 bên trong phòng khiếu nại."""
    __tablename__ = "dispute_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_role = Column(String(20), nullable=False)  # 'buyer', 'seller', 'admin', 'system'
    message_text = Column(Text, nullable=False)
    attachment_url = Column(Text, default="")
    created_at = Column(DateTime, default=func.now(), nullable=False)

    dispute = relationship("Dispute", back_populates="messages")
    sender = relationship("User")
