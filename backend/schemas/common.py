"""
schemas/common.py — Cấu hình Response Schema Tiêu Chuẩn Cho Toàn Bộ API
Đảm bảo định dạng phản hồi đồng nhất (Standard JSON Envelope) cho Client/Frontend.
"""

from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class BaseResponse(BaseModel, Generic[T]):
    """Cấu trúc phản hồi đơn bản ghi chuẩn."""
    success: bool = Field(default=True, description="Trạng thái thực thi API")
    message: str = Field(default="Thao tác thành công", description="Thông điệp hiển thị cho người dùng")
    data: Optional[T] = Field(default=None, description="Dữ liệu chính trả về")


class PaginatedResponse(BaseModel, Generic[T]):
    """Cấu trúc phản hồi danh sách có phân trang."""
    success: bool = Field(default=True, description="Trạng thái thực thi API")
    message: str = Field(default="Lấy danh sách thành công", description="Thông điệp thông báo")
    data: List[T] = Field(default_factory=list, description="Danh sách các bản ghi")
    total: int = Field(default=0, description="Tổng số bản ghi trong CSDL")
    page: int = Field(default=1, description="Trang hiện tại")
    limit: int = Field(default=20, description="Số lượng mục trên mỗi trang")
