"""
routers/voucher_router.py — API Endpoints Mã Giảm Giá & Voucher
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse
from schemas.voucher import VoucherResponse, VoucherApplyRequest, VoucherApplyResponse
from services.voucher_service import voucher_service

router = APIRouter(prefix="/vouchers", tags=["Vouchers & Promotions (Mã giảm giá & Khuyến mãi)"])


@router.get(
    "/",
    response_model=BaseResponse[List[VoucherResponse]],
    summary="Lấy danh sách mã giảm giá đang kích hoạt"
)
def get_vouchers(
    active_only: bool = Query(True, description="Chỉ lấy voucher còn hạn sử dụng"),
    db: Session = Depends(get_db)
):
    vouchers = voucher_service.list_vouchers(db, active_only=active_only)
    return BaseResponse[List[VoucherResponse]](
        success=True,
        message="Lấy danh sách mã giảm giá thành công",
        data=vouchers
    )


@router.post(
    "/apply",
    response_model=BaseResponse[VoucherApplyResponse],
    summary="Kiểm tra và áp dụng mã voucher cho giỏ hàng"
)
def apply_voucher(
    req: VoucherApplyRequest,
    db: Session = Depends(get_db)
):
    result = voucher_service.apply_voucher(db, code=req.code, order_amount=req.order_amount)
    return BaseResponse[VoucherApplyResponse](
        success=result.is_valid,
        message=result.message,
        data=result
    )
