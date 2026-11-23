"""
services/interaction_service.py — Xử lý nghiệp vụ Đánh giá sản phẩm, Danh sách yêu thích & Thông báo đa kênh
"""

from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from models.interaction import ProductReview, Wishlist, Notification
from models.catalog import Product
from schemas.interaction import ReviewCreate, ReviewReplyRequest


class InteractionService:
    # --- ĐÁNH GIÁ SẢN PHẨM (PRODUCT REVIEWS) ---
    @staticmethod
    def create_review(db: Session, user_id: int, data: ReviewCreate) -> ProductReview:
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sản phẩm")

        review = ProductReview(
            product_id=data.product_id,
            order_id=data.order_id,
            user_id=user_id,
            rating=data.rating,
            comment=data.comment,
            has_photo=data.has_photo,
            is_verified_buyer=True,
            created_at=datetime.now()
        )
        db.add(review)

        # Cập nhật số sao trung bình của sản phẩm
        all_reviews = db.query(ProductReview).filter(ProductReview.product_id == data.product_id).all()
        ratings = [r.rating for r in all_reviews] + [data.rating]
        product.review_count = len(ratings)
        product.rating = round(sum(ratings) / len(ratings), 1)

        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def reply_review(db: Session, review_id: int, seller_id: int, data: ReviewReplyRequest) -> ProductReview:
        review = db.query(ProductReview).filter(ProductReview.id == review_id).first()
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đánh giá")

        review.seller_reply = data.seller_reply
        review.seller_replied_at = datetime.now()
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def get_product_reviews(
        db: Session,
        product_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[ProductReview], int]:
        q = db.query(ProductReview).filter(ProductReview.product_id == product_id)
        total = q.count()
        reviews = q.order_by(ProductReview.created_at.desc()).offset(skip).limit(limit).all()
        return reviews, total

    # --- DANH SÁCH YÊU THÍCH (WISHLIST) ---
    @staticmethod
    def get_user_wishlist(db: Session, user_id: int) -> List[Wishlist]:
        return (
            db.query(Wishlist)
            .filter(Wishlist.user_id == user_id)
            .order_by(Wishlist.created_at.desc())
            .all()
        )

    @staticmethod
    def toggle_wishlist(db: Session, user_id: int, product_id: int) -> Tuple[bool, str]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sản phẩm")

        existing = (
            db.query(Wishlist)
            .filter(Wishlist.user_id == user_id, Wishlist.product_id == product_id)
            .first()
        )
        if existing:
            db.delete(existing)
            db.commit()
            return False, "Đã xóa sản phẩm khỏi danh sách yêu thích"
        else:
            item = Wishlist(user_id=user_id, product_id=product_id, created_at=datetime.now())
            db.add(item)
            db.commit()
            return True, "Đã lưu sản phẩm vào danh sách yêu thích"

    # --- THÔNG BÁO (NOTIFICATIONS) ---
    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 30
    ) -> Tuple[List[Notification], int]:
        q = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            q = q.filter(Notification.is_read == False)
        total = q.count()
        notifs = q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        return notifs, total

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> bool:
        notif = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notif:
            return False
        notif.is_read = True
        db.commit()
        return True

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .update({"is_read": True})
        )
        db.commit()
        return count

    @staticmethod
    def send_notification(
        db: Session,
        user_id: int,
        notif_type: str,
        title: str,
        message: str,
        link_url: str = ""
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=notif_type,
            title=title,
            message=message,
            link_url=link_url,
            is_read=False,
            created_at=datetime.now()
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif


interaction_service = InteractionService()
