"""
services/voucher_service.py — Nghiệp vụ Mã Khuyến Mãi & Voucher
"""

from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.voucher import Voucher
from schemas.voucher import VoucherCreate, VoucherApplyResponse


class VoucherService:
    @staticmethod
    def list_vouchers(db: Session, active_only: bool = True) -> List[Voucher]:
        q = db.query(Voucher)
        if active_only:
            now = datetime.now()
            q = q.filter(Voucher.is_active == True, Voucher.start_date <= now, Voucher.end_date >= now)
        return q.all()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Voucher]:
        return db.query(Voucher).filter(Voucher.code == code.upper().strip()).first()

    @staticmethod
    def apply_voucher(db: Session, code: str, order_amount: int) -> VoucherApplyResponse:
        v = VoucherService.get_by_code(db, code)
        if not v:
            return VoucherApplyResponse(is_valid=False, discount_amount=0, message="Mã giảm giá không tồn tại")

        now = datetime.now()
        # Đảm bảo start_date và end_date đồng nhất kiểu datetime
        start = v.start_date.replace(tzinfo=None) if hasattr(v.start_date, 'tzinfo') and v.start_date.tzinfo else v.start_date
        end = v.end_date.replace(tzinfo=None) if hasattr(v.end_date, 'tzinfo') and v.end_date.tzinfo else v.end_date
        if not v.is_active or start > now or end < now:
            return VoucherApplyResponse(is_valid=False, discount_amount=0, message="Mã giảm giá đã hết hạn sử dụng")

        if v.usage_count >= v.usage_limit:
            return VoucherApplyResponse(is_valid=False, discount_amount=0, message="Mã giảm giá đã hết lượt sử dụng")

        if order_amount < v.min_order_value:
            return VoucherApplyResponse(
                is_valid=False,
                discount_amount=0,
                message=f"Đơn hàng cần tối thiểu {v.min_order_value:,}đ để áp dụng voucher này"
            )

        # Tính số tiền giảm
        discount = 0
        if v.voucher_type == "percent":
            discount = int(order_amount * (v.discount_value / 100))
            if v.max_discount_amount and discount > v.max_discount_amount:
                discount = v.max_discount_amount
        elif v.voucher_type in ("fixed", "freeship"):
            discount = v.discount_value

        return VoucherApplyResponse(
            is_valid=True,
            discount_amount=min(discount, order_amount),
            message=f"Áp dụng thành công mã {v.code}, giảm {discount:,}đ",
            voucher=v
        )


voucher_service = VoucherService()
