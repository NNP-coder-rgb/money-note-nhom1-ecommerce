"""
routers/admin_router.py — API Endpoints Quản Trị Hệ Thống, Thống Kê & Phê Duyệt eKYC C06
"""

from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse, PaginatedResponse
from schemas.admin import AdminStatsResponse
from schemas.user import KYCVerificationResponse
from services.admin_service import admin_service

router = APIRouter(prefix="/admin", tags=["Admin Portal (Quản trị hệ thống & Phê duyệt eKYC)"])


@router.get(
    "/stats",
    response_model=BaseResponse[AdminStatsResponse],
    summary="Lấy số liệu thống kê tổng quan toàn sàn (GMV, Đơn hàng, Escrow TVL, Khiếu nại)"
)
def get_system_stats(db: Session = Depends(get_db)):
    stats_data = admin_service.get_dashboard_stats(db)
    return BaseResponse[AdminStatsResponse](
        success=True,
        message="Lấy số liệu thống kê hệ thống thành công",
        data=stats_data
    )


@router.get(
    "/ekyc/pending",
    response_model=PaginatedResponse[KYCVerificationResponse],
    summary="Lấy danh sách hồ sơ eKYC CCCD đang chờ phê duyệt"
)
def get_pending_ekyc_list(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    items, total = admin_service.list_pending_kyc(db, skip=skip, limit=limit)
    return PaginatedResponse[KYCVerificationResponse](
        success=True,
        message="Lấy danh sách hồ sơ eKYC chờ duyệt thành công",
        data=items,
        total=total,
        page=page,
        limit=limit
    )


@router.post(
    "/ekyc/{kyc_id}/review",
    response_model=BaseResponse[KYCVerificationResponse],
    summary="Phê duyệt hoặc từ chối hồ sơ định danh CCCD"
)
def review_ekyc(
    kyc_id: int,
    approved: bool = Query(..., description="True nếu phê duyệt, False nếu từ chối"),
    rejection_reason: str = Query("", description="Lý do từ chối nếu không duyệt"),
    admin_id: int = Query(..., description="ID quản trị viên thực hiện phê duyệt"),
    db: Session = Depends(get_db)
):
    kyc = admin_service.review_kyc(
        db,
        kyc_id=kyc_id,
        admin_id=admin_id,
        approved=approved,
        rejection_reason=rejection_reason
    )
    return BaseResponse[KYCVerificationResponse](
        success=True,
        message="Hồ sơ đã được phê duyệt thành công" if approved else "Đã từ chối hồ sơ định danh",
        data=kyc
    )
