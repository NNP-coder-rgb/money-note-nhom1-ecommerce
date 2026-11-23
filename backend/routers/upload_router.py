"""
routers/upload_router.py — API Tiếp nhận và Lưu trữ File/Ảnh/Video 4K thực tế
"""

import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status

from schemas.common import BaseResponse

router = APIRouter(prefix="/upload", tags=["Storage & Media (Tải lên ảnh, video 4K & tài liệu)"])

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "webp", "gif", "svg",
    "mp4", "mov", "mkv", "avi", "webm",
    "pdf", "doc", "docx"
}


def get_safe_filename(original_filename: str) -> str:
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Định dạng tệp '.{ext}' không được hỗ trợ. Chỉ chấp nhận ảnh, video (mp4, mov...) hoặc tài liệu."
        )
    unique_prefix = uuid.uuid4().hex[:12]
    safe_name = f"{unique_prefix}_{original_filename.replace(' ', '_')}"
    return safe_name


@router.post(
    "/",
    response_model=BaseResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Tải lên 1 tệp tin (Ảnh sản phẩm, CCCD, Video mở hộp 4K)"
)
async def upload_single_file(file: UploadFile = File(...)):
    safe_name = get_safe_filename(file.filename)
    dest_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_kb = round(os.path.getsize(dest_path) / 1024, 1)
    file_url = f"/uploads/{safe_name}"

    return BaseResponse[dict](
        success=True,
        message="Tải lên tệp thành công",
        data={
            "url": file_url,
            "filename": safe_name,
            "original_name": file.filename,
            "size_kb": file_size_kb,
            "content_type": file.content_type
        }
    )


@router.post(
    "/multiple",
    response_model=BaseResponse[List[dict]],
    status_code=status.HTTP_201_CREATED,
    summary="Tải lên nhiều ảnh/video cùng lúc"
)
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    uploaded = []
    for f in files:
        safe_name = get_safe_filename(f.filename)
        dest_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)
        uploaded.append({
            "url": f"/uploads/{safe_name}",
            "filename": safe_name,
            "original_name": f.filename,
            "size_kb": round(os.path.getsize(dest_path) / 1024, 1)
        })

    return BaseResponse[List[dict]](
        success=True,
        message=f"Đã tải lên thành công {len(uploaded)} tệp",
        data=uploaded
    )
