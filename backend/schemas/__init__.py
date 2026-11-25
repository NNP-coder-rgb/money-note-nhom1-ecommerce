"""
schemas/__init__.py — Tập hợp và xuất toàn bộ Pydantic Request & Response Schemas
"""

from schemas.common import BaseResponse, PaginatedResponse
from schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse, UserLogin,
    KYCVerificationCreate, KYCVerificationResponse,
    UserAddressCreate, UserAddressResponse,
    BankAccountCreate, BankAccountResponse
)
from schemas.catalog import (
    CategoryResponse, BrandResponse,
    ProductBase, ProductCreate, ProductUpdate, ProductResponse, ProductDetailResponse,
    ProductSpecResponse, ProductImageResponse
)
from schemas.offer import OfferCreate, OfferAction, OfferResponse
from schemas.voucher import VoucherCreate, VoucherResponse, VoucherApplyRequest, VoucherApplyResponse
from schemas.order import (
    OrderItemCreate, OrderItemResponse,
    OrderCreate, OrderUpdate, OrderResponse,
    OrderParcelResponse, OrderTrackingResponse
)
from schemas.escrow import EscrowWalletResponse, EscrowTransactionResponse, WithdrawalRequest
from schemas.dispute import (
    DisputeCreate, DisputeMessageCreate, DisputeResolveRequest,
    DisputeResponse, DisputeEvidenceResponse, DisputeMessageResponse
)
from schemas.interaction import (
    ReviewCreate, ReviewReplyRequest, ReviewResponse,
    WishlistResponse, NotificationResponse
)
from schemas.admin import AdminStatsResponse
from schemas.ai_agent import (
    AiChatRequest, AiActionSuggestion, AiProductCard, AiChatResponse
)

__all__ = [
    "BaseResponse",
    "PaginatedResponse",
    # User
    "UserBase", "UserCreate", "UserUpdate", "UserResponse", "UserLogin",
    "KYCVerificationCreate", "KYCVerificationResponse",
    "UserAddressCreate", "UserAddressResponse",
    "BankAccountCreate", "BankAccountResponse",
    # Catalog
    "CategoryResponse", "BrandResponse",
    "ProductBase", "ProductCreate", "ProductUpdate", "ProductResponse", "ProductDetailResponse",
    "ProductSpecResponse", "ProductImageResponse",
    # Offer
    "OfferCreate", "OfferAction", "OfferResponse",
    # Voucher
    "VoucherCreate", "VoucherResponse", "VoucherApplyRequest", "VoucherApplyResponse",
    # Order
    "OrderItemCreate", "OrderItemResponse",
    "OrderCreate", "OrderUpdate", "OrderResponse",
    "OrderParcelResponse", "OrderTrackingResponse",
    # Escrow
    "EscrowWalletResponse", "EscrowTransactionResponse", "WithdrawalRequest",
    # Dispute
    "DisputeCreate", "DisputeMessageCreate", "DisputeResolveRequest",
    "DisputeResponse", "DisputeEvidenceResponse", "DisputeMessageResponse",
    # Interaction
    "ReviewCreate", "ReviewReplyRequest", "ReviewResponse",
    "WishlistResponse", "NotificationResponse",
    # Admin
    "AdminStatsResponse",
]
