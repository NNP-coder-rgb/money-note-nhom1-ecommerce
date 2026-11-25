"""
routers/order_router.py — API Endpoints Quản Lý Đơn Hàng & Vận Chuyển GHN
Nguyễn Tiến Hùng
"""

from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse, PaginatedResponse
from schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderTrackingResponse
from services.order_service import order_service
from models.order import OrderTrackingEvent, OrderParcel

router = APIRouter(prefix="/orders", tags=["Orders & Shipping (Đơn hàng & Vận chuyển)"])


@router.get(
    "/",
    response_model=PaginatedResponse[OrderResponse],
    summary="Lấy danh sách đơn hàng có phân trang"
)
def get_orders(
    page: Annotated[int, Query(ge=1, description="Số thứ tự trang")] = 1,
    limit: Annotated[int, Query(ge=1, le=100, description="Số đơn mỗi trang")] = 20,
    buyer_id: Annotated[Optional[int], Query(description="Lọc theo người mua")] = None,
    seller_id: Annotated[Optional[int], Query(description="Lọc theo người bán")] = None,
    status_filter: Annotated[Optional[str], Query(alias="status", description="Lọc theo trạng thái đơn hàng")] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    orders, total = order_service.get_orders(
        db,
        buyer_id=buyer_id,
        seller_id=seller_id,
        status=status_filter,
        skip=skip,
        limit=limit
    )
    return PaginatedResponse[OrderResponse](
        success=True,
        message="Lấy danh sách đơn hàng thành công",
        data=orders,
        total=total,
        page=page,
        limit=limit
    )


@router.get(
    "/{identifier}",
    response_model=BaseResponse[OrderResponse],
    summary="Chi tiết đơn hàng theo ID hoặc mã đơn (ORD-XXXX)"
)
def get_order(identifier: str, db: Session = Depends(get_db)):
    order = order_service.get_by_id_or_code(db, identifier)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy đơn hàng '{identifier}'")
    return BaseResponse[OrderResponse](
        success=True,
        message="Lấy chi tiết đơn hàng thành công",
        data=order
    )


@router.post(
    "/",
    response_model=BaseResponse[OrderResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Khởi tạo đơn hàng mới (Hỗ trợ Multi-vendor split parcels, GHN tracking)"
)
def create_order(
    order_in: OrderCreate,
    buyer_id: int = Query(..., description="ID người mua thực hiện đặt hàng"),
    db: Session = Depends(get_db)
):
    order = order_service.create_order(db, buyer_id=buyer_id, order_in=order_in)
    return BaseResponse[OrderResponse](
        success=True,
        message="Đặt đơn hàng thành công",
        data=order
    )


@router.put(
    "/{order_id}/status",
    response_model=BaseResponse[OrderResponse],
    summary="Cập nhật trạng thái đơn hàng hoặc thanh toán"
)
def update_order_status(
    order_id: int,
    order_in: OrderUpdate,
    db: Session = Depends(get_db)
):
    order = order_service.update_order_status(db, order_id=order_id, order_in=order_in)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn hàng cần cập nhật")
    return BaseResponse[OrderResponse](
        success=True,
        message="Cập nhật trạng thái đơn hàng thành công",
        data=order
    )


@router.get(
    "/{order_id}/tracking",
    response_model=BaseResponse[List[OrderTrackingResponse]],
    summary="Lấy dòng thời gian hành trình vận chuyển GHN của đơn hàng"
)
def get_order_tracking(order_id: int, db: Session = Depends(get_db)):
    order = order_service.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn hàng")

    parcel_ids = [p.id for p in order.parcels]
    events = (
        db.query(OrderTrackingEvent)
        .filter(OrderTrackingEvent.parcel_id.in_(parcel_ids))
        .order_by(OrderTrackingEvent.event_time.asc())
        .all()
    )
    return BaseResponse[List[OrderTrackingResponse]](
        success=True,
        message="Lấy thông tin hành trình vận chuyển thành công",
        data=events
    )


@router.post(
    "/{order_id}/cancel",
    response_model=BaseResponse[OrderResponse],
    summary="Hủy đơn hàng"
)
def cancel_order(
    order_id: int,
    reason: str = Query("Người mua hủy đơn", description="Lý do hủy đơn"),
    db: Session = Depends(get_db)
):
    order_in = OrderUpdate(status="cancelled", cancel_reason=reason)
    order = order_service.update_order_status(db, order_id=order_id, order_in=order_in)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn hàng cần hủy")
    return BaseResponse[OrderResponse](
        success=True,
        message="Hủy đơn hàng thành công",
        data=order
    )
