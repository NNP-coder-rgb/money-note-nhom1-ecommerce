"""
schemas/admin.py — Pydantic Schemas Cho Trang Quản Trị Hệ Thống (Admin Portal)
"""

from pydantic import BaseModel, Field


class AdminStatsResponse(BaseModel):
    total_users: int = Field(default=0, description="Tổng số người dùng")
    total_products: int = Field(default=0, description="Tổng số sản phẩm đăng bán")
    total_orders: int = Field(default=0, description="Tổng số đơn đặt hàng")
    total_gmv: int = Field(default=0, description="Tổng doanh số toàn sàn (VNĐ)")
    pending_kyc_count: int = Field(default=0, description="Số lượng hồ sơ eKYC chờ duyệt")
    active_disputes_count: int = Field(default=0, description="Số lượng khiếu nại đang phân xử")
    escrow_tvl: int = Field(default=0, description="Tổng số tiền đang tạm giữ trong Escrow")
