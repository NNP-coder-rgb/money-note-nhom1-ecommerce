"""
test_orders.py — Kiểm thử tự động Khởi tạo Đơn hàng, Phân rã Kiện & Lịch trình
"""

import pytest
from core.database import SessionLocal
from models.user import User
from services.order_service import order_service
from schemas.order import OrderCreate, OrderItemCreate
from routers.order_router import create_order
from fastapi import HTTPException


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_create_order_service_success(db):
    """Tạo đơn hàng thông qua order_service thành công."""
    buyer = db.query(User).filter(User.role == "buyer").first()
    assert buyer is not None

    order_in = OrderCreate(
        shipping_address="123 Cầu Giấy, Hà Nội",
        shipping_phone="0988888888",
        recipient_name="Người Mua Test",
        recipient_phone="0988888888",
        payment_method="cod",
        items=[
            OrderItemCreate(
                product_id=1,
                product_name="iPhone 15 Pro Max 256GB",
                unit_price=29990000,
                quantity=1
            )
        ]
    )
    order = order_service.create_order(db, buyer_id=buyer.id, order_in=order_in)
    assert order.id is not None
    assert order.order_code.startswith("ORD-")
    assert order.buyer_id == buyer.id
    assert order.payment_status == "unpaid"


def test_create_order_unauthorized_fails(db):
    """Endpoint tạo đơn hàng khi không có người mua phải ném lỗi 401."""
    order_in = OrderCreate(
        shipping_address="Hà Nội",
        shipping_phone="0912345678",
        recipient_name="Test",
        recipient_phone="0912345678",
        items=[
            OrderItemCreate(
                product_id=1,
                product_name="iPhone 15 Pro Max",
                unit_price=100000,
                quantity=1
            )
        ]
    )
    with pytest.raises(HTTPException) as exc:
        create_order(order_in=order_in, buyer_id=None, current_user=None, db=db)
    assert exc.value.status_code == 401
