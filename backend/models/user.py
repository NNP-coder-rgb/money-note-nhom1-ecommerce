"""
models/user.py — SQLAlchemy ORM Models cho Phân Hệ Người Dùng, eKYC, Địa Chỉ & Ngân Hàng
Nguyễn Khả Minh Đức
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class User(Base):
    """Bảng users — Tài khoản người dùng (Buyer, Seller, Admin, Inspector)."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    username = Column(String(60), unique=True, nullable=True)
    role = Column(String(20), default="buyer", nullable=False)  # 'buyer', 'seller', 'admin', 'inspector'
    avatar_url = Column(Text, nullable=True)
    membership_title = Column(String(50), default="VIP BUYER")
    bio = Column(Text, nullable=True)
    shop_name = Column(String(100), nullable=True)
    shop_rating = Column(Float, default=5.0)
    loyalty_points = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    kyc = relationship("KYCVerification", foreign_keys="[KYCVerification.user_id]", back_populates="user", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("UserAddress", back_populates="user", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="user", cascade="all, delete-orphan")
    wallet = relationship("EscrowWallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    products = relationship("Product", back_populates="seller", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="buyer", cascade="all, delete-orphan")
    reviews = relationship("ProductReview", back_populates="user", cascade="all, delete-orphan")
    wishlists = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class KYCVerification(Base):
    """Bảng kyc_verifications — Hồ sơ xác thực CCCD gắn chip chuẩn C06."""
    __tablename__ = "kyc_verifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    id_card_number = Column(String(20), unique=True, nullable=False)
    full_name_on_card = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(10), default="Nam")
    permanent_address = Column(Text, nullable=True)
    front_image_url = Column(Text, nullable=False)
    back_image_url = Column(Text, nullable=False)
    selfie_image_url = Column(Text, nullable=True)
    face_match_score = Column(Float, default=99.0)
    status = Column(String(20), default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id], back_populates="kyc")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class UserAddress(Base):
    """Bảng user_addresses — Sổ địa chỉ giao hàng."""
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    province = Column(String(60), nullable=False)
    district = Column(String(60), nullable=False)
    ward = Column(String(60), nullable=False)
    street_address = Column(Text, nullable=False)
    full_address = Column(Text, nullable=False)
    address_type = Column(String(20), default="home")  # 'home', 'office'
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="addresses")


class BankAccount(Base):
    """Bảng bank_accounts — Tài khoản ngân hàng liên kết Napas 24/7."""
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_code = Column(String(20), nullable=False)  # VCB, TCB, MB, VPB...
    bank_name = Column(String(100), nullable=False)
    account_number = Column(String(30), nullable=False)
    account_holder = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="bank_accounts")
