"""
test_escrow.py — Kiểm thử Ví Ký Quỹ Escrow, Khóa Concurrency và Rút tiền
"""

import pytest
from core.database import SessionLocal
from models.user import User
from services.escrow_service import escrow_service
from schemas.escrow import WithdrawalRequest
from routers.escrow_router import get_user_wallet, request_withdrawal
from fastapi import HTTPException


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_get_or_create_wallet_service(db):
    """Kiểm tra khởi tạo và lấy thông tin ví ký quỹ."""
    seller = db.query(User).filter(User.role == "seller").first()
    assert seller is not None

    wallet = escrow_service.get_or_create_wallet(db, user_id=seller.id)
    assert wallet.user_id == seller.id
    assert wallet.available_balance >= 0


def test_escrow_hold_and_release_lifecycle(db):
    """Kiểm tra chu trình tạm giữ (Hold) và giải ngân (Release) tiền đơn hàng."""
    from models.order import Order
    seller = db.query(User).filter(User.role == "seller").first()
    order = db.query(Order).first()
    order_id = order.id if order else None
    wallet = escrow_service.get_or_create_wallet(db, user_id=seller.id)
    initial_available = wallet.available_balance
    initial_locked = wallet.locked_balance

    # 1. Tạm giữ 500,000 VND
    hold_tx = escrow_service.hold_order_funds(db, seller_id=seller.id, order_id=order_id, amount=500000)
    assert hold_tx.transaction_type == "hold_order"
    assert wallet.locked_balance == initial_locked + 500000

    # 2. Giải ngân 500,000 VND khi người mua hoàn tất
    pay_tx = escrow_service.release_payout(db, seller_id=seller.id, order_id=order_id, amount=500000)
    assert pay_tx.transaction_type == "release_payout"
    assert wallet.locked_balance == initial_locked
    assert wallet.available_balance == initial_available + 500000


def test_withdrawal_insufficient_balance_rejected(db):
    """Rút tiền vượt quá số dư khả dụng phải ném lỗi ValueError."""
    seller = db.query(User).filter(User.role == "seller").first()
    with pytest.raises(ValueError) as exc:
        escrow_service.request_withdrawal(
            db,
            user_id=seller.id,
            amount=99999999999,  # Vượt số dư
            bank_account_id=1
        )
    assert "không đủ" in str(exc.value)


def test_withdrawal_negative_amount_rejected(db):
    """Rút số tiền âm hoặc bằng 0 phải bị từ chối."""
    seller = db.query(User).filter(User.role == "seller").first()
    with pytest.raises(ValueError) as exc:
        escrow_service.request_withdrawal(
            db,
            user_id=seller.id,
            amount=-10000,
            bank_account_id=1
        )
    assert "phải lớn hơn 0" in str(exc.value)


def test_router_escrow_wallet_unauthorized(db):
    """Truy vấn ví khi không truyền user_id hoặc token phải ném lỗi 401."""
    with pytest.raises(HTTPException) as exc:
        get_user_wallet(user_id=None, current_user=None, db=db)
    assert exc.value.status_code == 401
