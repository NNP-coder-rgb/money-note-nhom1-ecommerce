"""
routers/interaction_router.py — API Endpoints Đánh Giá, Yêu Thích & Trung Tâm Thông Báo
"""

from typing import List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse, PaginatedResponse
from schemas.interaction import (
    ReviewCreate, ReviewReplyRequest, ReviewResponse,
    WishlistResponse, NotificationResponse
)
from services.interaction_service import interaction_service

router = APIRouter(tags=["Interactions (Đánh giá, Yêu thích & Thông báo)"])


# ==============================================================
# ĐÁNH GIÁ SẢN PHẨM (REVIEWS)
# ==============================================================
@router.post(
    "/reviews",
    response_model=BaseResponse[ReviewResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Đăng đánh giá sản phẩm (Kèm xếp hạng 1-5 sao và huy hiệu Người mua đã xác thực)"
)
def create_review(
    review_in: ReviewCreate,
    user_id: int = Query(..., description="ID người đánh giá"),
    db: Session = Depends(get_db)
):
    review = interaction_service.create_review(db, user_id=user_id, data=review_in)
    return BaseResponse[ReviewResponse](
        success=True,
        message="Đăng đánh giá sản phẩm thành công",
        data=review
    )


@router.post(
    "/reviews/{review_id}/reply",
    response_model=BaseResponse[ReviewResponse],
    summary="Người bán phản hồi đánh giá của khách hàng"
)
def reply_review(
    review_id: int,
    reply_in: ReviewReplyRequest,
    seller_id: int = Query(..., description="ID người bán"),
    db: Session = Depends(get_db)
):
    review = interaction_service.reply_review(db, review_id=review_id, seller_id=seller_id, data=reply_in)
    return BaseResponse[ReviewResponse](
        success=True,
        message="Phản hồi đánh giá thành công",
        data=review
    )


@router.get(
    "/products/{product_id}/reviews",
    response_model=PaginatedResponse[ReviewResponse],
    summary="Lấy danh sách đánh giá của sản phẩm"
)
def get_product_reviews(
    product_id: int,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    reviews, total = interaction_service.get_product_reviews(db, product_id=product_id, skip=skip, limit=limit)
    return PaginatedResponse[ReviewResponse](
        success=True,
        message="Lấy danh sách đánh giá thành công",
        data=reviews,
        total=total,
        page=page,
        limit=limit
    )


# ==============================================================
# DANH SÁCH YÊU THÍCH (WISHLIST)
# ==============================================================
@router.get(
    "/wishlist",
    response_model=BaseResponse[List[WishlistResponse]],
    summary="Lấy danh sách sản phẩm yêu thích của người dùng"
)
def get_user_wishlist(
    user_id: int = Query(..., description="ID người dùng"),
    db: Session = Depends(get_db)
):
    items = interaction_service.get_user_wishlist(db, user_id=user_id)
    return BaseResponse[List[WishlistResponse]](
        success=True,
        message="Lấy danh sách yêu thích thành công",
        data=items
    )


@router.post(
    "/wishlist/toggle",
    response_model=BaseResponse[dict],
    summary="Thêm hoặc xóa sản phẩm khỏi danh sách yêu thích"
)
def toggle_wishlist(
    product_id: int = Query(..., description="ID sản phẩm"),
    user_id: int = Query(..., description="ID người dùng"),
    db: Session = Depends(get_db)
):
    is_saved, msg = interaction_service.toggle_wishlist(db, user_id=user_id, product_id=product_id)
    return BaseResponse[dict](
        success=True,
        message=msg,
        data={"is_saved": is_saved, "product_id": product_id}
    )


# ==============================================================
# THÔNG BÁO ĐA KÊNH (NOTIFICATIONS)
# ==============================================================
@router.get(
    "/notifications",
    response_model=PaginatedResponse[NotificationResponse],
    summary="Lấy danh sách thông báo của người dùng"
)
def get_user_notifications(
    user_id: int = Query(..., description="ID người dùng"),
    unread_only: bool = Query(False, description="Chỉ lấy thông báo chưa đọc"),
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    notifs, total = interaction_service.get_user_notifications(
        db,
        user_id=user_id,
        unread_only=unread_only,
        skip=skip,
        limit=limit
    )
    return PaginatedResponse[NotificationResponse](
        success=True,
        message="Lấy danh sách thông báo thành công",
        data=notifs,
        total=total,
        page=page,
        limit=limit
    )


@router.put(
    "/notifications/{notification_id}/read",
    response_model=BaseResponse[dict],
    summary="Đánh dấu một thông báo đã đọc"
)
def mark_notification_read(
    notification_id: int,
    user_id: int = Query(..., description="ID người dùng"),
    db: Session = Depends(get_db)
):
    success = interaction_service.mark_as_read(db, notification_id=notification_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thông báo")
    return BaseResponse[dict](success=True, message="Đã đánh dấu đã đọc", data={"id": notification_id})


@router.put(
    "/notifications/read-all",
    response_model=BaseResponse[dict],
    summary="Đánh dấu tất cả thông báo là đã đọc"
)
def mark_all_notifications_read(
    user_id: int = Query(..., description="ID người dùng"),
    db: Session = Depends(get_db)
):
    count = interaction_service.mark_all_as_read(db, user_id=user_id)
    return BaseResponse[dict](
        success=True,
        message=f"Đã đánh dấu {count} thông báo là đã đọc",
        data={"updated_count": count}
    )
