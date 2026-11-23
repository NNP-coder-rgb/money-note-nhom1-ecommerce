"""
services/__init__.py — Tập hợp và xuất toàn bộ Services xử lý nghiệp vụ theo kiến trúc phân tầng
"""

from services.auth_service import auth_service, AuthService, user_service
from services.catalog_service import catalog_service, CatalogService, product_service
from services.offer_service import offer_service, OfferService
from services.voucher_service import voucher_service, VoucherService
from services.order_service import order_service, OrderService
from services.escrow_service import escrow_service, EscrowService
from services.dispute_service import dispute_service, DisputeService
from services.interaction_service import interaction_service, InteractionService
from services.admin_service import admin_service, AdminService

__all__ = [
    "auth_service",
    "AuthService",
    "user_service",
    "catalog_service",
    "CatalogService",
    "product_service",
    "offer_service",
    "OfferService",
    "voucher_service",
    "VoucherService",
    "order_service",
    "OrderService",
    "escrow_service",
    "EscrowService",
    "dispute_service",
    "DisputeService",
    "interaction_service",
    "InteractionService",
    "admin_service",
    "AdminService",
]
