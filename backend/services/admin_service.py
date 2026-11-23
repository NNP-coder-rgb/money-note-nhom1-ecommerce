"""
services/admin_service.py — Xử lý nghiệp vụ Bảng điều khiển Quản trị & Phê duyệt eKYC C06
"""

from typing import List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from models.user import User, KYCVerification
from models.catalog import Product
from models.order import Order
from models.dispute import Dispute
from models.escrow import EscrowWallet
from schemas.admin import AdminStatsResponse


class AdminService:
    @staticmethod
    def get_dashboard_stats(db: Session) -> AdminStatsResponse:
        total_users = db.query(User).count()
        total_products = db.query(Product).count()
        total_orders = db.query(Order).count()
        
        gmv_val = db.query(func.sum(Order.total_amount)).filter(Order.status != "cancelled").scalar()
        total_gmv = int(gmv_val or 0)

        pending_kyc = db.query(KYCVerification).filter(KYCVerification.status == "pending").count()
        active_disputes = db.query(Dispute).filter(Dispute.status.in_(["pending", "in_arbitration"])).count()
        
        tvl_val = db.query(func.sum(EscrowWallet.locked_balance)).scalar()
        escrow_tvl = int(tvl_val or 0)

        return AdminStatsResponse(
            total_users=total_users,
            total_products=total_products,
            total_orders=total_orders,
            total_gmv=total_gmv,
            pending_kyc_count=pending_kyc,
            active_disputes_count=active_disputes,
            escrow_tvl=escrow_tvl
        )

    @staticmethod
    def list_pending_kyc(
        db: Session,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[KYCVerification], int]:
        q = db.query(KYCVerification).filter(KYCVerification.status == "pending")
        total = q.count()
        items = q.order_by(KYCVerification.submitted_at.asc()).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def review_kyc(
        db: Session,
        kyc_id: int,
        admin_id: int,
        approved: bool,
        rejection_reason: str = ""
    ) -> KYCVerification:
        kyc = db.query(KYCVerification).filter(KYCVerification.id == kyc_id).first()
        if not kyc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ eKYC")

        kyc.status = "verified" if approved else "rejected"
        kyc.rejection_reason = rejection_reason if not approved else ""
        kyc.verified_by = admin_id
        kyc.verified_at = datetime.now()

        # Cập nhật cờ xác thực của User
        if kyc.user:
            kyc.user.is_verified = approved

        db.commit()
        db.refresh(kyc)
        return kyc


admin_service = AdminService()
