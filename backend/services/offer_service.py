"""
services/offer_service.py — Nghiệp vụ Đàm Phán Trả Giá C2C 24h
"""

from typing import List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from models.offer import ProductOffer
from models.catalog import Product
from schemas.offer import OfferCreate, OfferAction


class OfferService:
    @staticmethod
    def get_by_id(db: Session, offer_id: int) -> Optional[ProductOffer]:
        return db.query(ProductOffer).filter(ProductOffer.id == offer_id).first()

    @staticmethod
    def get_offers_by_user(db: Session, user_id: int, role: str = "all") -> List[ProductOffer]:
        q = db.query(ProductOffer)
        if role == "buyer":
            q = q.filter(ProductOffer.buyer_id == user_id)
        elif role == "seller":
            q = q.filter(ProductOffer.seller_id == user_id)
        else:
            q = q.filter((ProductOffer.buyer_id == user_id) | (ProductOffer.seller_id == user_id))
        return q.order_by(ProductOffer.created_at.desc()).all()

    @staticmethod
    def create_offer(db: Session, buyer_id: int, offer_in: OfferCreate) -> ProductOffer:
        product = db.query(Product).filter(Product.id == offer_in.product_id).first()
        if not product:
            raise ValueError("Không tìm thấy sản phẩm yêu cầu")
        if not product.allow_offers:
            raise ValueError("Sản phẩm này không hỗ trợ đàm phán trả giá")

        discount_pct = int(round((1 - (offer_in.offered_price / product.selling_price)) * 100))
        now = datetime.now()
        offer = ProductOffer(
            product_id=product.id,
            buyer_id=buyer_id,
            seller_id=product.seller_id,
            original_price=product.selling_price,
            offered_price=offer_in.offered_price,
            discount_pct=discount_pct,
            buyer_message=offer_in.buyer_message,
            status="pending",
            expires_at=now + timedelta(hours=24)
        )
        db.add(offer)
        db.commit()
        db.refresh(offer)
        return offer

    @staticmethod
    def respond_offer(db: Session, offer_id: int, seller_id: int, action_in: OfferAction) -> ProductOffer:
        offer = db.query(ProductOffer).filter(ProductOffer.id == offer_id, ProductOffer.seller_id == seller_id).first()
        if not offer:
            raise ValueError("Không tìm thấy yêu cầu trả giá hoặc bạn không có quyền xử lý")

        if action_in.action == "accept":
            offer.status = "accepted"
        elif action_in.action == "reject":
            offer.status = "rejected"
        elif action_in.action == "counter":
            offer.status = "countered"
            offer.counter_price = action_in.counter_price

        if action_in.seller_note:
            offer.seller_note = action_in.seller_note

        db.commit()
        db.refresh(offer)
        return offer


offer_service = OfferService()
