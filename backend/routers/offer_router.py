"""
routers/offer_router.py — API Endpoints Đàm Phán Trả Giá C2C 24h
"""

from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse
from schemas.offer import OfferCreate, OfferAction, OfferResponse
from services.offer_service import offer_service

router = APIRouter(prefix="/offers", tags=["Offers & Bargain (Đàm phán trả giá 24h)"])


@router.post(
    "/",
    response_model=BaseResponse[OfferResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Gửi đề xuất trả giá C2C (Có hiệu lực 24 giờ)"
)
def create_offer(
    offer_in: OfferCreate,
    buyer_id: int = Query(..., description="ID người mua đưa ra đề xuất trả giá"),
    db: Session = Depends(get_db)
):
    try:
        offer = offer_service.create_offer(db, buyer_id=buyer_id, offer_in=offer_in)
        return BaseResponse[OfferResponse](
            success=True,
            message="Gửi đề xuất trả giá thành công! Người bán có 24h để phản hồi.",
            data=offer
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/",
    response_model=BaseResponse[List[OfferResponse]],
    summary="Lấy danh sách các đề xuất trả giá của người dùng"
)
def get_user_offers(
    user_id: int = Query(..., description="ID người dùng"),
    role: Annotated[str, Query(description="Vai trò: buyer, seller hoặc all")] = "all",
    db: Session = Depends(get_db)
):
    offers = offer_service.get_offers_by_user(db, user_id=user_id, role=role)
    return BaseResponse[List[OfferResponse]](
        success=True,
        message="Lấy danh sách trả giá thành công",
        data=offers
    )


@router.get(
    "/{offer_id}",
    response_model=BaseResponse[OfferResponse],
    summary="Chi tiết một đề xuất trả giá"
)
def get_offer_detail(offer_id: int, db: Session = Depends(get_db)):
    offer = offer_service.get_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy yêu cầu trả giá")
    return BaseResponse[OfferResponse](
        success=True,
        message="Lấy thông tin trả giá thành công",
        data=offer
    )


@router.post(
    "/{offer_id}/respond",
    response_model=BaseResponse[OfferResponse],
    summary="Người bán phản hồi trả giá (Chấp nhận / Từ chối / Đưa ra mức giá phản hồi Counter)"
)
def respond_offer(
    offer_id: int,
    action_in: OfferAction,
    seller_id: int = Query(..., description="ID người bán thực hiện phản hồi"),
    db: Session = Depends(get_db)
):
    try:
        offer = offer_service.respond_offer(db, offer_id=offer_id, seller_id=seller_id, action_in=action_in)
        return BaseResponse[OfferResponse](
            success=True,
            message=f"Đã phản hồi yêu cầu trả giá thành công: {action_in.action.upper()}",
            data=offer
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
