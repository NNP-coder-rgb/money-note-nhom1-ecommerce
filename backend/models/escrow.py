"""
models/escrow.py — SQLAlchemy ORM Models cho Ví Ký Quỹ Escrow & Sổ Cái Biến Động 24/7
"""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class EscrowWallet(Base):
    """Bảng escrow_wallets — Ví tài khoản ký quỹ bảo vệ giao dịch."""
    __tablename__ = "escrow_wallets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    available_balance = Column(BigInteger, default=0, nullable=False)  # Số dư khả dụng rút (VND)
    locked_balance = Column(BigInteger, default=0, nullable=False)     # Tạm giữ trong các đơn hàng mở
    total_withdrawn = Column(BigInteger, default=0, nullable=False)    # Lũy kế số tiền đã rút
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("EscrowTransaction", back_populates="wallet", cascade="all, delete-orphan", order_by="EscrowTransaction.created_at.desc()")


class EscrowTransaction(Base):
    """Bảng escrow_transactions — Sổ cái đối soát tài chính."""
    __tablename__ = "escrow_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_id = Column(Integer, ForeignKey("escrow_wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_code = Column(String(50), unique=True, index=True, nullable=False)
    transaction_type = Column(String(30), nullable=False)  # 'deposit', 'hold_order', 'release_payout', 'refund_buyer', 'withdrawal'
    amount = Column(BigInteger, nullable=False)
    balance_after = Column(BigInteger, nullable=False)
    memo = Column(Text, nullable=False)
    status = Column(String(20), default="completed", nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    wallet = relationship("EscrowWallet", back_populates="transactions")
    order = relationship("Order")
