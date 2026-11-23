"""
routers/dispute_router.py — API Endpoints Phòng Trọng Tài Khiếu Nại 3 Bên (Disputes & Tripartite Arbitration)
"""

from typing import List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.common import BaseResponse, PaginatedResponse
from schemas.dispute import (
    DisputeCreate, DisputeMessageCreate, DisputeResolveRequest,
    DisputeResponse, DisputeMessageResponse, DisputeEvidenceResponse
)
from services.dispute_service import dispute_service

router = APIRouter(prefix="/disputes", tags=["Disputes & Arbitration (Phòng trọng tài khiếu nại 3 bên)"])


@router.post(
    "/",
    response_model=BaseResponse[DisputeResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Mở hồ sơ khiếu nại đơn hàng (Kích hoạt phòng trọng tài 3 bên)"
)
def create_dispute(
    dispute_in: DisputeCreate,
    buyer_id: int = Query(..., description="ID người mua khiếu nại"),
    db: Session = Depends(get_db)
):
    dispute = dispute_service.create_dispute(db, buyer_id=buyer_id, data=dispute_in)
    return BaseResponse[DisputeResponse](
        success=True,
        message="Mở hồ sơ khiếu nại thành công! Phiên trọng tài 3 bên đã được kích hoạt.",
        data=dispute
    )


@router.get(
    "/",
    response_model=PaginatedResponse[DisputeResponse],
    summary="Lấy danh sách các vụ khiếu nại"
)
def get_disputes(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    user_id: Annotated[Optional[int], Query(description="Lọc theo người dùng")] = None,
    role: Annotated[Optional[str], Query(description="buyer, seller hoặc admin")] = None,
    status_filter: Annotated[Optional[str], Query(alias="status", description="Lọc theo trạng thái")] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    disputes, total = dispute_service.list_disputes(
        db,
        user_id=user_id,
        role=role,
        status_filter=status_filter,
        skip=skip,
        limit=limit
    )
    return PaginatedResponse[DisputeResponse](
        success=True,
        message="Lấy danh sách khiếu nại thành công",
        data=disputes,
        total=total,
        page=page,
        limit=limit
    )


@router.get(
    "/{identifier}",
    response_model=BaseResponse[DisputeResponse],
    summary="Chi tiết phòng trọng tài (Kèm lịch sử chat 3 bên và video/ảnh bằng chứng)"
)
def get_dispute_room(identifier: str, db: Session = Depends(get_db)):
    dispute = dispute_service.get_detail(db, identifier)
    if not dispute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy vụ việc khiếu nại '{identifier}'"
        )
    return BaseResponse[DisputeResponse](
        success=True,
        message="Lấy chi tiết phòng trọng tài thành công",
        data=dispute
    )


@router.post(
    "/{dispute_id}/messages",
    response_model=BaseResponse[DisputeMessageResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Gửi tin nhắn đối thoại trong phòng trọng tài 3 bên"
)
def send_dispute_message(
    dispute_id: int,
    msg_in: DisputeMessageCreate,
    sender_id: int = Query(..., description="ID người gửi"),
    sender_role: str = Query(..., description="Vai trò: buyer, seller hoặc admin"),
    db: Session = Depends(get_db)
):
    msg = dispute_service.send_message(
        db,
        dispute_id=dispute_id,
        sender_id=sender_id,
        sender_role=sender_role,
        data=msg_in
    )
    return BaseResponse[DisputeMessageResponse](
        success=True,
        message="Gửi tin nhắn thành công",
        data=msg
    )


@router.post(
    "/{dispute_id}/evidence",
    response_model=BaseResponse[DisputeEvidenceResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Tải lên bằng chứng bổ sung (Ảnh chụp hoặc video 4K mở hộp)"
)
def upload_evidence(
    dispute_id: int,
    media_url: str = Query(..., description="URL file đa phương tiện bằng chứng"),
    media_type: str = Query("image", description="image hoặc video"),
    title: str = Query("Bằng chứng mở hộp", description="Tiêu đề bằng chứng"),
    user_id: int = Query(..., description="ID người tải lên"),
    db: Session = Depends(get_db)
):
    ev = dispute_service.add_evidence(
        db,
        dispute_id=dispute_id,
        user_id=user_id,
        media_url=media_url,
        media_type=media_type,
        title=title
    )
    return BaseResponse[DisputeEvidenceResponse](
        success=True,
        message="Thêm bằng chứng thành công",
        data=ev
    )


@router.post(
    "/{dispute_id}/resolve",
    response_model=BaseResponse[DisputeResponse],
    summary="Phán quyết trọng tài viên (Chỉ dành cho Admin/Arbitrator)"
)
def resolve_dispute(
    dispute_id: int,
    resolve_in: DisputeResolveRequest,
    admin_id: int = Query(..., description="ID trọng tài viên Admin đưa ra phán quyết"),
    db: Session = Depends(get_db)
):
    dispute = dispute_service.resolve_dispute(
        db,
        dispute_id=dispute_id,
        admin_id=admin_id,
        data=resolve_in
    )
    return BaseResponse[DisputeResponse](
        success=True,
        message="Phán quyết trọng tài đã được ban hành và cập nhật vào sổ cái tài chính",
        data=dispute
    )
