"""
routers/escrow_router.py — API Endpoints Ví Ký Quỹ Escrow & Sổ Cái 24/7
Task T41: Ký quỹ escrow & Trọng tài tranh chấp (Chu Đình Minh)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_optional_current_user
from models.user import User
from schemas.common import BaseResponse
from schemas.escrow import EscrowWalletResponse, EscrowTransactionResponse, WithdrawalRequest
from services.escrow_service import escrow_service
from models.escrow import EscrowTransaction

router = APIRouter(prefix="/escrow", tags=["Escrow & Financial Ledger (Ví ký quỹ & Sổ cái 24/7)"])


@router.get(
    "/wallet",
    response_model=BaseResponse[EscrowWalletResponse],
    summary="Lấy thông tin số dư Ví Ký Quỹ Escrow (Khả dụng & Tạm giữ)"
)
def get_user_wallet(
    user_id: Optional[int] = Query(None, description="Tùy chọn ID người dùng"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    target_id = current_user.id if current_user else user_id
    if not target_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Yêu cầu đăng nhập để xem thông tin ví")
    wallet = escrow_service.get_wallet(db, user_id=target_id)
    return BaseResponse[EscrowWalletResponse](
        success=True,
        message="Lấy thông tin ví ký quỹ thành công",
        data=wallet
    )


@router.get(
    "/transactions",
    response_model=BaseResponse[List[EscrowTransactionResponse]],
    summary="Lấy lịch sử giao dịch sổ cái 24/7 của ví"
)
def get_wallet_transactions(
    user_id: Optional[int] = Query(None, description="Tùy chọn ID người dùng"),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    target_id = current_user.id if current_user else user_id
    if not target_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Yêu cầu đăng nhập để xem lịch sử giao dịch")
    wallet = escrow_service.get_wallet(db, user_id=target_id)
    txs = (
        db.query(EscrowTransaction)
        .filter(EscrowTransaction.wallet_id == wallet.id)
        .order_by(EscrowTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return BaseResponse[List[EscrowTransactionResponse]](
        success=True,
        message="Lấy lịch sử giao dịch thành công",
        data=txs
    )


@router.post(
    "/withdraw",
    response_model=BaseResponse[EscrowTransactionResponse],
    summary="Tạo yêu cầu rút tiền về tài khoản ngân hàng liên kết"
)
def request_withdrawal(
    req: WithdrawalRequest,
    user_id: Optional[int] = Query(None, description="Tùy chọn ID người dùng"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    target_id = current_user.id if current_user else user_id
    if not target_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Yêu cầu đăng nhập để rút tiền")
    try:
        tx = escrow_service.request_withdrawal(
            db,
            user_id=target_id,
            amount=req.amount,
            bank_account_id=req.bank_account_id,
            note=req.note or ""
        )
        return BaseResponse[EscrowTransactionResponse](
            success=True,
            message="Tạo lệnh rút tiền thành công! Tiền sẽ được chuyển về tài khoản ngân hàng trong 5 phút.",
            data=tx
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
