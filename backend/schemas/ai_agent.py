"""
schemas/ai_agent.py — Schema DTO cho AI Agent Trợ Lý Ảo HYBRID.STORE
Định nghĩa cấu trúc dữ liệu yêu cầu & phản hồi của trợ lý ảo AI.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AiChatRequest(BaseModel):
    """Dữ liệu yêu cầu gửi tin nhắn tới AI Agent"""
    message: str = Field(..., min_length=1, description="Nội dung câu hỏi của người dùng")
    session_id: Optional[str] = Field(None, description="Mã phiên hội thoại để duy trì ngữ cảnh")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Lịch sử các tin nhắn trước: [{'role': 'user'|'model', 'content': '...'}]")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Ngữ cảnh bổ sung: user role, trang hiện tại, v.v.")


class AiActionSuggestion(BaseModel):
    """Gợi ý hành động nhanh đi kèm câu trả lời của AI"""
    label: str = Field(..., description="Nhãn hiển thị trên nút bấm gợi ý")
    url: Optional[str] = Field(None, description="Đường dẫn điều hướng trang (nếu có)")
    query: Optional[str] = Field(None, description="Câu hỏi tiếp theo khi người dùng bấm vào")
    type: str = Field(default="link", description="Loại gợi ý: 'link' | 'query' | 'action'")


class AiProductCard(BaseModel):
    """Thẻ sản phẩm gợi ý do AI đề xuất"""
    id: str = Field(..., description="ID sản phẩm")
    name: str = Field(..., description="Tên sản phẩm")
    price: float = Field(..., description="Giá bán hiện tại (VNĐ)")
    old_price: Optional[float] = Field(None, description="Giá gốc hàng mới 100%")
    img: Optional[str] = Field(None, description="Đường dẫn ảnh sản phẩm")
    type: str = Field(default="mall", description="Phân loại: 'mall' hoặc 'c2c'")
    cond: Optional[int] = Field(None, description="Độ mới (%) đối với hàng C2C")
    badge: Optional[str] = Field(None, description="Huy hiệu hiển thị")
    url: str = Field(..., description="Đường dẫn chi tiết sản phẩm")


class AiChatResponse(BaseModel):
    """Dữ liệu phản hồi từ AI Agent"""
    reply: str = Field(..., description="Nội dung câu trả lời của AI Agent")
    intent: str = Field(default="GENERAL", description="Ý định câu hỏi được phân loại")
    suggested_actions: List[AiActionSuggestion] = Field(default=[], description="Danh sách nút gợi ý hành động tiếp theo")
    actions: Optional[List[AiActionSuggestion]] = Field(default=None, description="Tương thích cho suggested_actions")
    products: Optional[List[AiProductCard]] = Field(default=[], description="Danh sách sản phẩm được AI đề xuất")
    session_id: str = Field(..., description="ID phiên hội thoại")
    engine: str = Field(default="hybrid-agent-v1", description="Engine xử lý: 'gemini-pro' | 'gemini-flash' | 'expert-rag-agent'")

    def model_post_init(self, __context: Any) -> None:
        """Đồng bộ hai trường actions và suggested_actions để tương thích mọi client"""
        if not self.actions and self.suggested_actions:
            self.actions = self.suggested_actions
        elif not self.suggested_actions and self.actions:
            self.suggested_actions = self.actions
