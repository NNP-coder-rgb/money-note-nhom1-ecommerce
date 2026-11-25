"""
schemas/dispute.py — Pydantic Schemas Cho Phòng Trọng Tài Khiếu Nại 3 Bên
Task T41: Ký quỹ escrow & Trọng tài tranh chấp (Chu Đình Minh)
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DisputeEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dispute_id: int
    uploaded_by_user_id: int
    media_url: str
    media_type: str
    title: str
    created_at: datetime


class DisputeMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dispute_id: int
    sender_id: int
    sender_role: str
    message_text: str
    attachment_url: Optional[str] = ""
    created_at: datetime


class DisputeCreate(BaseModel):
    order_id: int
    reason: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=10)
    requested_refund: int = Field(..., gt=0)
    evidence_urls: List[str] = Field(default_factory=list)


class DisputeMessageCreate(BaseModel):
    message_text: str = Field(..., min_length=1)
    attachment_url: Optional[str] = ""


class DisputeResolveRequest(BaseModel):
    solution_code: str = Field(..., description="full_refund, partial_refund, hoặc reject_claim")
    approved_refund: int = 0
    admin_decision_summary: str = Field(..., min_length=5)


class DisputeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dispute_code: str
    order_id: int
    buyer_id: int
    seller_id: int
    reason: str
    description: str
    requested_refund: int
    approved_refund: int
    status: str
    arbitrator_admin_id: Optional[int] = None
    admin_decision_summary: Optional[str] = ""
    solution_code: Optional[str] = ""
    evidences: List[DisputeEvidenceResponse] = Field(default_factory=list)
    messages: List[DisputeMessageResponse] = Field(default_factory=list)
    created_at: datetime
