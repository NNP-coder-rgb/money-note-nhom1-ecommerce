"""
routers/__init__.py — Tập hợp và xuất toàn bộ APIRouter của Hệ thống theo kiến trúc phân tầng
Tất cả các router phân hệ sẽ được gắn vào api_router chính và nạp vào FastAPI với tiền tố /api/v1.
"""

from fastapi import APIRouter

from routers.auth_router import router as auth_router
from routers.user_router import router as user_router
from routers.catalog_router import router as catalog_router
from routers.offer_router import router as offer_router
from routers.voucher_router import router as voucher_router
from routers.order_router import router as order_router
from routers.escrow_router import router as escrow_router
from routers.dispute_router import router as dispute_router
from routers.interaction_router import router as interaction_router
from routers.admin_router import router as admin_router
from routers.upload_router import router as upload_router

# Router chính tổng hợp toàn bộ các phân hệ API
api_router = APIRouter()

# Đăng ký các router con vào API Router V1
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(catalog_router)
api_router.include_router(offer_router)
api_router.include_router(voucher_router)
api_router.include_router(order_router)
api_router.include_router(escrow_router)
api_router.include_router(dispute_router)
api_router.include_router(interaction_router)
api_router.include_router(admin_router)
api_router.include_router(upload_router)

__all__ = [
    "api_router",
    "auth_router",
    "user_router",
    "catalog_router",
    "offer_router",
    "voucher_router",
    "order_router",
    "escrow_router",
    "dispute_router",
    "interaction_router",
    "admin_router",
    "upload_router",
]
