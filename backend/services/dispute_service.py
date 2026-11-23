"""
services/dispute_service.py — Xử lý nghiệp vụ Phòng Trọng Tài Khiếu Nại 3 Bên (Disputes & Arbitration)
"""

import random
import string
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status

from models.dispute import Dispute, DisputeEvidence, DisputeMessage
from models.order import Order
from schemas.dispute import DisputeCreate, DisputeMessageCreate, DisputeResolveRequest


def generate_dispute_code() -> str:
    now_str = datetime.now().strftime("%Y%m%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"DSP-{now_str}-{suffix}"


class DisputeService:
    @staticmethod
    def get_by_id(db: Session, dispute_id: int) -> Optional[Dispute]:
        return db.query(Dispute).filter(Dispute.id == dispute_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Dispute]:
        return db.query(Dispute).filter(Dispute.dispute_code == code).first()

    @staticmethod
    def get_detail(db: Session, identifier: str) -> Optional[Dispute]:
        if identifier.isdigit():
            dispute = db.query(Dispute).filter(Dispute.id == int(identifier)).first()
            if dispute:
                return dispute
        return db.query(Dispute).filter(Dispute.dispute_code == identifier).first()

    @staticmethod
    def list_disputes(
        db: Session,
        user_id: Optional[int] = None,
        role: Optional[str] = None,
        status_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dispute], int]:
        q = db.query(Dispute)
        if user_id:
            if role == "buyer":
                q = q.filter(Dispute.buyer_id == user_id)
            elif role == "seller":
                q = q.filter(Dispute.seller_id == user_id)
            elif role == "admin":
                q = q.filter(or_(Dispute.arbitrator_admin_id == user_id, Dispute.arbitrator_admin_id == None))
            else:
                q = q.filter(or_(Dispute.buyer_id == user_id, Dispute.seller_id == user_id))

        if status_filter:
            q = q.filter(Dispute.status == status_filter)

        total = q.count()
        disputes = q.order_by(Dispute.created_at.desc()).offset(skip).limit(limit).all()
        return disputes, total

    @staticmethod
    def create_dispute(db: Session, buyer_id: int, data: DisputeCreate) -> Dispute:
        order = db.query(Order).filter(Order.id == data.order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn hàng cần khiếu nại")

        if order.buyer_id != buyer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không phải người mua của đơn hàng này")

        # Kiểm tra xem đơn hàng đã từng mở khiếu nại chưa
        existing = db.query(Dispute).filter(Dispute.order_id == data.order_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Đơn hàng này đã có vụ khiếu nại đang xử lý ({existing.dispute_code})"
            )

        # Lấy seller_id từ kiện hàng hoặc đơn hàng
        seller_id = order.parcels[0].seller_id if order.parcels else 1

        dispute = Dispute(
            dispute_code=generate_dispute_code(),
            order_id=data.order_id,
            buyer_id=buyer_id,
            seller_id=seller_id,
            reason=data.reason,
            description=data.description,
            requested_refund=data.requested_refund,
            status="in_arbitration",
            created_at=datetime.now()
        )
        db.add(dispute)
        db.commit()
        db.refresh(dispute)

        # Thêm các bằng chứng nếu có
        for url in data.evidence_urls:
            evidence = DisputeEvidence(
                dispute_id=dispute.id,
                uploaded_by_user_id=buyer_id,
                media_url=url,
                media_type="video" if url.endswith((".mp4", ".mov", ".mkv")) else "image",
                title=f"Bằng chứng mở hộp do người mua cung cấp",
                file_size_kb=1024
            )
            db.add(evidence)

        # Thêm tin nhắn khởi tạo phiên trọng tài
        sys_msg = DisputeMessage(
            dispute_id=dispute.id,
            sender_id=buyer_id,
            sender_role="system",
            message_text=f"Phòng trọng tài 3 bên đã được kích hoạt cho vụ việc {dispute.dispute_code}. Hệ thống đã đóng băng số tiền thanh toán của đơn hàng để bảo vệ quyền lợi đôi bên.",
            created_at=datetime.now()
        )
        db.add(sys_msg)

        buyer_initial_msg = DisputeMessage(
            dispute_id=dispute.id,
            sender_id=buyer_id,
            sender_role="buyer",
            message_text=f"[Lý do: {data.reason}] {data.description}",
            created_at=datetime.now()
        )
        db.add(buyer_initial_msg)

        # Cập nhật trạng thái đơn hàng sang dispute
        order.status = "disputed"
        db.commit()
        db.refresh(dispute)
        return dispute

    @staticmethod
    def send_message(
        db: Session,
        dispute_id: int,
        sender_id: int,
        sender_role: str,
        data: DisputeMessageCreate
    ) -> DisputeMessage:
        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phòng trọng tài")

        if dispute.status in ("resolved", "closed"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vụ việc đã được phán quyết, không thể gửi thêm tin nhắn")

        msg = DisputeMessage(
            dispute_id=dispute.id,
            sender_id=sender_id,
            sender_role=sender_role,
            message_text=data.message_text,
            attachment_url=data.attachment_url or "",
            created_at=datetime.now()
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def add_evidence(
        db: Session,
        dispute_id: int,
        user_id: int,
        media_url: str,
        media_type: str = "image",
        title: str = "Bằng chứng bổ sung"
    ) -> DisputeEvidence:
        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy vụ khiếu nại")

        evidence = DisputeEvidence(
            dispute_id=dispute.id,
            uploaded_by_user_id=user_id,
            media_url=media_url,
            media_type=media_type,
            title=title
        )
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        return evidence

    @staticmethod
    def resolve_dispute(
        db: Session,
        dispute_id: int,
        admin_id: int,
        data: DisputeResolveRequest
    ) -> Dispute:
        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy vụ khiếu nại")

        dispute.status = "resolved"
        dispute.solution_code = data.solution_code
        dispute.approved_refund = data.approved_refund
        dispute.admin_decision_summary = data.admin_decision_summary
        dispute.arbitrator_admin_id = admin_id
        dispute.resolved_at = datetime.now()

        # Thêm tin nhắn phán quyết của Admin
        decision_label = {
            "full_refund": "Hoàn tiền 100% cho người mua",
            "partial_refund": f"Hoàn tiền một phần ({data.approved_refund:,} VNĐ)",
            "reject_claim": "Bác bỏ khiếu nại, giải ngân cho người bán"
        }.get(data.solution_code, data.solution_code)

        sys_msg = DisputeMessage(
            dispute_id=dispute.id,
            sender_id=admin_id,
            sender_role="admin",
            message_text=f"⚖️ PHÁN QUYẾT TRỌNG TÀI VIÊN: {decision_label}. Nội dung: {data.admin_decision_summary}",
            created_at=datetime.now()
        )
        db.add(sys_msg)

        # Cập nhật trạng thái đơn hàng
        if dispute.order:
            dispute.order.status = "refunded" if "refund" in data.solution_code else "completed"

        db.commit()
        db.refresh(dispute)
        return dispute


dispute_service = DisputeService()
