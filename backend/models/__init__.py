"""
models/__init__.py — Tập hợp và xuất toàn bộ 23 Models SQLAlchemy ORM
Đáp ứng 100% các tính năng nghiệp vụ của giao diện người dùng.
"""

from core.database import Base
from models.user import User, KYCVerification, UserAddress, BankAccount
from models.catalog import Category, Brand, Product, ProductImage, ProductSpec
from models.offer import ProductOffer
from models.voucher import Voucher
from models.order import Order, OrderParcel, OrderItem, OrderTrackingEvent
from models.escrow import EscrowWallet, EscrowTransaction
from models.dispute import Dispute, DisputeEvidence, DisputeMessage
from models.interaction import ProductReview, Wishlist, Notification

__all__ = [
    "Base",
    # 1. Người dùng & eKYC
    "User",
    "KYCVerification",
    "UserAddress",
    "BankAccount",

    # 2. Danh mục & Sản phẩm Hybrid
    "Category",
    "Brand",
    "Product",
    "ProductImage",
    "ProductSpec",

    # 3. Trả giá C2C 24h
    "ProductOffer",

    # 4. Voucher & Khuyến mãi
    "Voucher",

    # 5. Đơn hàng & Tách kiện Multi-Vendor
    "Order",
    "OrderParcel",
    "OrderItem",
    "OrderTrackingEvent",

    # 6. Ví Ký Quỹ Escrow & Sổ cái 24/7
    "EscrowWallet",
    "EscrowTransaction",

    # 7. Phòng Trọng tài Khiếu nại 3 Bên
    "Dispute",
    "DisputeEvidence",
    "DisputeMessage",

    # 8. Tương tác & Thông báo
    "ProductReview",
    "Wishlist",
    "Notification",
]
