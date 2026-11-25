"""
routers/ai_agent_router.py — APIRouter Cho AI Agent Trợ Lý Ảo HYBRID.STORE
Cung cấp endpoint /api/v1/ai/chat và /api/v1/ai/suggestions cho giao diện LiveChat.
"""

import os
from fastapi import APIRouter, status
from schemas.ai_agent import AiChatRequest, AiChatResponse, AiActionSuggestion
from services.ai_agent_service import AiAgentService

router = APIRouter(prefix="/ai", tags=["AI Agent Assistant"])


@router.post(
    "/chat",
    response_model=AiChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Trò chuyện và nhận tư vấn từ AI Agent HYBRID.STORE"
)
async def chat_with_ai(request: AiChatRequest):
    """
    Endpoint tiếp nhận câu hỏi của khách hàng, phân loại ý định,
    truy vấn tri thức quy chuẩn sàn (15 bước kiểm định, Escrow, Trả giá, Bảo hành)
    và gợi ý sản phẩm phù hợp ngân sách.
    """
    return AiAgentService.chat(request)


@router.get(
    "/suggestions",
    response_model=list[AiActionSuggestion],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách các câu hỏi gợi ý nhanh phổ biến"
)
async def get_quick_suggestions():
    """Trả về danh sách câu hỏi gợi ý nhanh theo xu hướng người dùng quan tâm"""
    return [
        AiActionSuggestion(label="🔬 15 Bước Kiểm Định Lab", query="Giải thích chi tiết 15 bước kiểm định đồ cũ"),
        AiActionSuggestion(label="🛡️ Quỹ Ký Quỹ Escrow 48H", query="Quỹ ký quỹ Escrow 48h hoạt động thế nào?"),
        AiActionSuggestion(label="📱 Tư Vấn iPhone Like New", query="Tư vấn iPhone Like New tầm giá 15 - 20 triệu"),
        AiActionSuggestion(label="🤝 Cách Trả Giá Người Bán", query="Làm thế nào để trả giá sản phẩm với người bán?"),
        AiActionSuggestion(label="📦 Tra Cứu Đơn Hàng", url="pages/buyer/orders.html"),
        AiActionSuggestion(label="🚀 Đăng Bán Đồ Cũ", url="pages/seller/post_item.html")
    ]


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    summary="Kiểm tra trạng thái hoạt động của AI Agent Engine"
)
async def get_ai_status():
    """Kiểm tra xem AI Agent đang chạy Engine nào (Gemini API hoặc Expert RAG)"""
    has_gemini = bool(os.getenv("GEMINI_API_KEY", "").strip())
    return {
        "ok": True,
        "engine": "gemini-1.5-flash" if has_gemini else "expert-rag-agent",
        "has_external_llm": has_gemini,
        "features": [
            "15-step Lab Inspection Knowledge",
            "Escrow 48H Protection Knowledge",
            "C2C Offer Negotiation",
            "Budget Product Recommender",
            "Warranty & Return Consultation",
            "Order Tracking & Dispute Guidance"
        ]
    }
