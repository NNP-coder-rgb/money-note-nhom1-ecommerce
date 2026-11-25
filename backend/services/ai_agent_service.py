"""
services/ai_agent_service.py — AI Agent Service Thông Minh Cho Trợ Lý Ảo HYBRID.STORE
Hỗ trợ Dual-Engine:
1. Gemini Generative AI (nếu có cấu hình GEMINI_API_KEY)
2. Intelligent Expert Semantic Engine (hoạt động độc lập 100% với kho tri thức chuyên sâu)
"""

import os
import re
import json
import uuid
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

from schemas.ai_agent import (
    AiChatRequest, AiChatResponse, AiActionSuggestion, AiProductCard
)

# Danh mục tri thức mẫu các sản phẩm tiêu biểu trên sàn để AI Agent tư vấn
RECOMMENDED_CATALOG = [
    {
        "id": "t2",
        "name": "Apple iPhone 15 Pro Max 256GB Titan Tự Nhiên (VN/A)",
        "price": 29990000,
        "old_price": 34990000,
        "type": "mall",
        "category": "phone",
        "img": "assets/images/products/dien-thoai-smartphone-flagship.png",
        "badge": "CHÍNH HÃNG MALL",
        "desc": "Flagship đỉnh cao chip A17 Pro, khung viền Titan siêu nhẹ, camera tiềm vọng 5x.",
        "url": "pages/shop/product_detail.html?id=t2"
    },
    {
        "id": "t1",
        "name": "Apple MacBook Pro 16 inch M3 Max (36GB RAM / 1TB SSD Space Black)",
        "price": 54990000,
        "old_price": 68990000,
        "type": "mall",
        "category": "laptop",
        "img": "assets/images/products/may-tinh-laptop-mong-nhe.png",
        "badge": "BRAND MALL 100%",
        "desc": "Cỗ máy đồ họa tối thượng chip M3 Max 16 nhân, màn hình Liquid Retina XDR 120Hz ProMotion.",
        "url": "pages/shop/product_detail.html?id=t1"
    },
    {
        "id": "t4",
        "name": "Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5 Chính Hãng",
        "price": 7490000,
        "old_price": 8990000,
        "type": "mall",
        "category": "audio",
        "img": "assets/images/products/tai-nghe-sony-wh-ch520.png",
        "badge": "CHÍNH HÃNG SONY",
        "desc": "Chống ồn chủ động ANC đỉnh cao, thời lượng pin 30h, âm thanh Hi-Res Audio không dây.",
        "url": "pages/shop/product_detail.html?id=t4"
    },
    {
        "id": "s2",
        "name": "Giày Sneaker Air Jordan 1 Retro High OG 'Chicago Lost & Found'",
        "price": 4250000,
        "old_price": 6500000,
        "type": "c2c",
        "cond": 99,
        "category": "fashion",
        "img": "assets/images/products/giay-the-thao-nam-sneaker-de-day.png",
        "badge": "LIKE NEW 99%",
        "desc": "Đã qua kiểm định soi da, đường chỉ và đế giày, full phụ kiện dây sơ cua và tem kiểm định Lab.",
        "url": "pages/shop/product_detail.html?id=s2"
    },
    {
        "id": "w9",
        "name": "Đồng Hồ Thông Minh Apple Watch Ultra 2 GPS + Cellular 49mm",
        "price": 19490000,
        "old_price": 21990000,
        "type": "mall",
        "category": "watch",
        "img": "assets/images/products/dong-ho-thong-minh-smartwatch.png",
        "badge": "BRAND MALL MỚI 100%",
        "desc": "Vỏ Titan siêu bền bỉ, màn hình độ sáng 3000 nits, định vị GPS kép chuyên dụng thể thao mạo hiểm.",
        "url": "pages/shop/product_detail.html?id=w9"
    },
    {
        "id": "w5",
        "name": "Balo Thời Trang Cao Cấp Chống Nước Có Ngăn Laptop 15.6 Inch",
        "price": 890000,
        "old_price": 1250000,
        "type": "mall",
        "category": "accessories",
        "img": "assets/images/products/balo-thoi-trang-chong-nuoc.png",
        "badge": "MARK RYDEN MALL",
        "desc": "Vải Oxford 900D chống thấm nước, đệm lưng thoáng khí chống gù, tích hợp cổng sạc USB.",
        "url": "pages/shop/product_detail.html?id=w5"
    }
]


class AiAgentService:
    """Service điều phối AI Agent tương tác và tư vấn khách hàng"""

    @staticmethod
    def _call_gemini_api(prompt: str, history: List[Dict[str, str]] = None) -> Optional[str]:
        """Gọi Google Gemini 1.5 Flash API nếu có API key"""
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

        system_instruction = (
            "Bạn là 'HYBRID AI Assistant 24/7' - Trợ lý ảo AI chính thức của sàn thương mại điện tử HYBRID.STORE.\n"
            "Mục tiêu của bạn: Tư vấn mua sắm, giải đáp thắc mắc về Brand Mall (hàng mới 100%) và Chợ Đồ Cũ Like New (tiết kiệm đến 50%).\n"
            "Đặc trưng nổi bật của HYBRID.STORE cần luôn nhớ và giải thích khi được hỏi:\n"
            "1. Quy trình kiểm định 15 bước tại phòng Lab độc lập: Ngoại quan, Màn hình, Pin/Mainboard, Stress-test nhiệt độ, Tem niêm phong Hologram.\n"
            "2. Quỹ ký quỹ Escrow 48h: Khách nhận hàng được mở hộp đồng kiểm 100%, ưng ý mới xác nhận. Tiền giữ an toàn 48h mới giải ngân cho người bán.\n"
            "3. Tính năng Trả Giá (Offer): Khách được đề xuất giảm tối đa 20% với người bán đồ cũ.\n"
            "4. Chính sách bảo hành: Hàng mới BH hãng 12-24 tháng (hoàn 500% nếu giả); Đồ cũ BH 6 tháng phần cứng + 1 đổi 1 trong 15 ngày.\n"
            "5. Vận chuyển hỏa tốc 120 phút qua Viettel Post / GHTK. Thanh toán VietQR Napas 24/7 khớp lệnh 3 giây.\n"
            "Phong cách: Thân thiện, tôn trọng, súc tích, chuyên nghiệp bằng Tiếng Việt. Đưa ra lời khuyên thực tế theo ngân sách."
        )

        contents = []
        if history:
            for item in history[-4:]:
                role = "user" if item.get("role") in ["user", "human"] else "model"
                contents.append({"role": role, "parts": [{"text": item.get("content", "")}]})

        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 600,
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=6.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception as e:
            print(f"⚠️ [AiAgentService] Gemini API call skipped or timed out: {e}")
            return None

        return None

    @classmethod
    def chat(cls, req: AiChatRequest) -> AiChatResponse:
        """Xử lý yêu cầu trò chuyện từ người dùng thông qua AI Agent"""
        user_msg = (req.message or "").strip()
        session_id = req.session_id or f"session_{uuid.uuid4().hex[:12]}"
        lower_msg = user_msg.lower()

        # 1. Trích xuất ý định (Intent Recognition) & thực thể (Entities)
        matched_products = cls._detect_product_recommendations(lower_msg)
        intent = cls._classify_intent(lower_msg)

        # 2. Thử gọi Gemini AI nếu có key
        gemini_reply = cls._call_gemini_api(user_msg, req.history)
        if gemini_reply:
            actions = cls._build_actions_for_intent(intent, matched_products)
            return AiChatResponse(
                reply=gemini_reply,
                intent=intent,
                suggested_actions=actions,
                products=matched_products,
                session_id=session_id,
                engine="gemini-1.5-flash"
            )

        # 3. Fallback sang Intelligent Expert Semantic Engine (RAG nội bộ chuẩn xác 100%)
        expert_reply, actions = cls._expert_semantic_reply(lower_msg, intent, matched_products)

        return AiChatResponse(
            reply=expert_reply,
            intent=intent,
            suggested_actions=actions,
            products=matched_products,
            session_id=session_id,
            engine="expert-rag-agent"
        )

    @classmethod
    def _classify_intent(cls, text: str) -> str:
        """Phân loại ý định của người dùng bằng NLP từ khóa & ngữ cảnh"""
        if any(w in text for w in ["15 bước", "kiểm định", "phòng lab", "thẩm định", "test máy", "chứng chỉ", "zin"]):
            return "FAQ_INSPECTION"
        if any(w in text for w in ["ký quỹ", "escrow", "giữ tiền", "lừa đảo", "an toàn", "đồng kiểm", "bóc hộp", "mở hộp"]):
            return "FAQ_ESCROW"
        if any(w in text for w in ["trả giá", "thương lượng", "mặc cả", "offer", "giảm giá"]):
            return "FAQ_OFFER"
        if any(w in text for w in ["bảo hành", "đổi trả", "hoàn tiền", "1 đổi 1", "lỗi", "hỏng"]):
            return "FAQ_WARRANTY"
        if any(w in text for w in ["vận chuyển", "giao hàng", "shipper", "hỏa tốc", "mấy ngày", "phí ship"]):
            return "FAQ_SHIPPING"
        if any(w in text for w in ["thanh toán", "napas", "vietqr", "chuyển khoản", "quẹt thẻ", "cod"]):
            return "FAQ_PAYMENT"
        if any(w in text for w in ["đăng bán", "bán đồ cũ", "thanh lý", "kênh người bán", "c2c"]):
            return "FAQ_SELLER"
        if any(w in text for w in ["đơn hàng", "tra cứu", "đang ở đâu", "kiểm tra đơn"]):
            return "ORDER_TRACKING"
        if any(w in text for w in ["khiếu nại", "tranh chấp", "tố cáo", "hàng giả", "không đúng mô tả"]):
            return "DISPUTE_SUPPORT"
        if any(w in text for w in ["tư vấn", "gợi ý", "nên mua", "tầm giá", "triệu", "iphone", "macbook", "laptop", "tai nghe", "giày"]):
            return "PRODUCT_RECOMMENDATION"

        return "GENERAL"

    @classmethod
    def _detect_product_recommendations(cls, text: str) -> List[AiProductCard]:
        """Tìm kiếm sản phẩm phù hợp trong kho dựa trên nhu cầu & ngân sách"""
        results = []

        # Nhận diện tầm giá bằng regex: ví dụ '15 triệu', '20tr', 'dưới 10tr', '30tr'
        budget_max = None
        price_match = re.search(r'(\d+)\s*(?:triệu|tr|củ)', text)
        if price_match:
            budget_max = int(price_match.group(1)) * 1000000

        # Lọc theo danh mục
        wants_phone = any(w in text for w in ["iphone", "điện thoại", "smartphone", "máy cũ", "ios"])
        wants_laptop = any(w in text for w in ["macbook", "laptop", "máy tính", "đồ họa", "code", "làm việc"])
        wants_audio = any(w in text for w in ["tai nghe", "sony", "chống ồn", "âm thanh", "loa"])
        wants_fashion = any(w in text for w in ["giày", "sneaker", "jordan", "nike", "thời trang"])
        wants_watch = any(w in text for w in ["đồng hồ", "apple watch", "watch", "ultra"])

        for item in RECOMMENDED_CATALOG:
            matched = False
            cat = item.get("category")
            if wants_phone and cat == "phone":
                matched = True
            elif wants_laptop and cat == "laptop":
                matched = True
            elif wants_audio and cat == "audio":
                matched = True
            elif wants_fashion and cat == "fashion":
                matched = True
            elif wants_watch and cat == "watch":
                matched = True
            elif not (wants_phone or wants_laptop or wants_audio or wants_fashion or wants_watch):
                # Nếu hỏi chung chung về mua sắm
                if any(w in text for w in ["gợi ý", "sản phẩm hot", "bán chạy", "khuyến mãi", "like new"]):
                    matched = True

            # Kiểm tra ngân sách nếu có
            if matched and budget_max:
                if item["price"] > budget_max * 1.25:  # Cho phép dung sai 25%
                    matched = False

            if matched:
                results.append(
                    AiProductCard(
                        id=item["id"],
                        name=item["name"],
                        price=float(item["price"]),
                        old_price=float(item["old_price"]) if item.get("old_price") else None,
                        img=item.get("img"),
                        type=item.get("type", "mall"),
                        cond=item.get("cond"),
                        badge=item.get("badge"),
                        url=item["url"]
                    )
                )

        return results[:3]  # Lấy tối đa 3 sản phẩm phù hợp nhất

    @classmethod
    def _build_actions_for_intent(cls, intent: str, products: List[AiProductCard]) -> List[AiActionSuggestion]:
        """Tạo danh sách nút hành động gợi ý theo ý định"""
        actions = []
        if intent == "FAQ_INSPECTION":
            actions.append(AiActionSuggestion(label="🔍 Xem 15 Bước Kiểm Định", url="pages/info/about.html"))
            actions.append(AiActionSuggestion(label="📱 Xem Đồ Cũ Like New", url="pages/shop/catalog.html?type=c2c"))
        elif intent == "FAQ_ESCROW":
            actions.append(AiActionSuggestion(label="🛡️ Tìm Hiểu Quỹ Ký Quỹ", url="pages/info/warranty_policy.html"))
            actions.append(AiActionSuggestion(label="📦 Tra Cứu Đơn Hàng", url="pages/buyer/orders.html"))
        elif intent == "FAQ_OFFER":
            actions.append(AiActionSuggestion(label="🤝 Thử Trả Giá Ngay", url="pages/shop/catalog.html?type=c2c"))
            actions.append(AiActionSuggestion(label="📋 Hướng Dẫn Mua Bán C2C", url="pages/info/terms_of_service.html"))
        elif intent == "FAQ_WARRANTY":
            actions.append(AiActionSuggestion(label="🛡️ Chính Sách Bảo Hành", url="pages/info/warranty_policy.html"))
            actions.append(AiActionSuggestion(label="🔄 Chính Sách Đổi Trả", url="pages/info/return_policy.html"))
        elif intent == "FAQ_SELLER":
            actions.append(AiActionSuggestion(label="🚀 Đăng Bán Món Mới", url="pages/seller/post_item.html"))
            actions.append(AiActionSuggestion(label="📊 Vào Kênh Người Bán", url="pages/seller/dashboard.html"))
        elif intent == "ORDER_TRACKING":
            actions.append(AiActionSuggestion(label="🚚 Quản Lý Đơn Mua", url="pages/buyer/orders.html"))
        elif intent == "DISPUTE_SUPPORT":
            actions.append(AiActionSuggestion(label="⚖️ Vào Phòng Phân Xử 3 Bên", url="pages/buyer/dispute.html"))
        elif products:
            for p in products[:2]:
                actions.append(AiActionSuggestion(label=f"👉 Xem {p.name[:24]}...", url=p.url))
            actions.append(AiActionSuggestion(label="🛍️ Xem Tất Cả Sản Phẩm", url="pages/shop/catalog.html"))
        else:
            actions.append(AiActionSuggestion(label="📱 Điện Thoại Like New", query="Tư vấn iPhone Like New"))
            actions.append(AiActionSuggestion(label="💻 Laptop M3 Đồ Họa", query="Tư vấn MacBook làm đồ họa"))
            actions.append(AiActionSuggestion(label="🔍 Quy Trình Kiểm Định", query="Giải thích 15 bước kiểm định"))

        return actions

    @classmethod
    def _expert_semantic_reply(cls, text: str, intent: str, products: List[AiProductCard]) -> tuple[str, List[AiActionSuggestion]]:
        """Tạo câu trả lời từ kho tri thức nội bộ của HYBRID.STORE"""
        actions = cls._build_actions_for_intent(intent, products)

        if intent == "FAQ_INSPECTION":
            reply = (
                "🔬 **Quy trình kiểm định kỹ thuật 15 bước độc lập tại Lab HYBRID.STORE:**\n"
                "Mọi sản phẩm đồ cũ Like New khi đăng bán bắt buộc phải qua 4 giai đoạn thẩm định nghiêm ngặt:\n"
                "1. **Ngoại quan & Thẩm mỹ (5 bước):** Soi kính hiển vi vết xước, cấn viền kim loại, độ nứt kính, ốc vít nguyên bản chưa từng mở.\n"
                "2. **Phần cứng & Linh kiện (5 bước):** Đo chu kỳ sạc & dung lượng pin thực tế bằng máy chuyên dụng; kiểm tra điểm chết màn hình OLED; test cảm biến Face ID / Vân tay và mainboard zin 100%.\n"
                "3. **Tính năng vận hành (3 bước):** Chạy stress-test tải nặng đo nhiệt độ hoạt động, kiểm tra kết nối sóng Wifi/4G/Bluetooth/NFC và micro/loa đàm thoại.\n"
                "4. **Niêm phong & Đóng gói (2 bước):** Dán tem bảo hành Hologram vỡ chống tháo mở và kích hoạt chứng chỉ số kiểm định trên hệ thống."
            )
            return reply, actions

        if intent == "FAQ_ESCROW":
            reply = (
                "🛡️ **Cơ chế Quỹ Ký Quỹ Escrow 48H bảo vệ tiền của bạn tuyệt đối:**\n"
                "• Khi bạn thanh toán (VietQR hoặc COD), số tiền **chưa chuyển cho người bán ngay** mà được sàn HYBRID tạm giữ an toàn trong Quỹ Ký Quỹ Escrow.\n"
                "• **Đồng kiểm 100%:** Khi shipper giao hàng tới, bạn được quyền bóc hộp kiểm tra máy trước mặt shipper.\n"
                "• Bạn có **48 giờ trải nghiệm test máy**. Sau 48 giờ nếu bạn hài lòng và bấm 'Nghiệm Thu', tiền mới được giải ngân về ví người bán. Nếu máy có lỗi, bạn được bấm 'Yêu Cầu Khiếu Nại' để nhận lại 100% tiền."
            )
            return reply, actions

        if intent == "FAQ_OFFER":
            reply = (
                "🤝 **Tính năng Thương Lượng Trả Giá (Offer) với người bán đồ cũ:**\n"
                "• Tại trang chi tiết sản phẩm Like New, bạn chỉ cần bấm nút **[Trả Giá Với Người Bán]**.\n"
                "• Bạn có thể đề xuất mức giá mong muốn (tối đa giảm đến 20% so với giá niêm yết).\n"
                "• Người bán sẽ nhận được thông báo tức thì và có **24 giờ** để Chấp Thuận, Từ Chối hoặc Đề Xuất Mức Giá Đối Ứng (Counter-Offer).\n"
                "• Khi người bán đồng ý, bạn sẽ nhận được thông báo để chốt đơn với mức giá ưu đãi đó!"
            )
            return reply, actions

        if intent == "FAQ_WARRANTY":
            reply = (
                "🛡️ **Chính sách bảo hành và cam kết chất lượng tại HYBRID.STORE:**\n"
                "• **Brand Mall (Hàng mới 100%):** Kích hoạt bảo hành điện tử chính hãng 12 – 24 tháng toàn quốc tại các trung tâm ủy quyền (Apple Care, Samsung, Sony...). Cam kết bồi thường 500% giá trị nếu phát hiện hàng giả.\n"
                "• **Chợ Đồ Cũ Like New:** Bảo hành toàn diện 6 tháng phần cứng trực tiếp từ HYBRID. Bao test **1 đổi 1 trong 15 ngày đầu tiên** nếu có bất kỳ lỗi phần cứng nào từ nhà sản xuất."
            )
            return reply, actions

        if intent == "FAQ_SHIPPING":
            reply = (
                "🚚 **Chính sách giao nhận & vận chuyển hỏa tốc:**\n"
                "• **Hỏa tốc 120 phút:** Áp dụng cho các đơn hàng nội thành Hà Nội và TP. Hồ Chí Minh qua đối tác Viettel Post Express.\n"
                "• **Giao hàng tiêu chuẩn toàn quốc:** 1 – 3 ngày làm việc.\n"
                "• **Miễn phí vận chuyển (Freeship):** Áp dụng cho đơn hàng từ 500.000₫ hoặc khi thu thập mã Freeship tại giỏ hàng."
            )
            return reply, actions

        if intent == "FAQ_PAYMENT":
            reply = (
                "💳 **Các phương thức thanh toán an toàn tại HYBRID.STORE:**\n"
                "1. **Chuyển khoản Napas 24/7:** Quét mã VietQR tự động khớp lệnh thanh toán trong 3 giây, hoàn toàn miễn phí giao dịch.\n"
                "2. **Thẻ quốc tế & nội địa:** Hỗ trợ thẻ ATM nội địa, thẻ tín dụng/ghi nợ Visa, Mastercard, JCB bảo mật chuẩn PCI-DSS.\n"
                "3. **Thanh toán tiền mặt COD:** Nhận hàng, đồng kiểm mở hộp cùng bưu tá rồi mới thanh toán tiền."
            )
            return reply, actions

        if intent == "FAQ_SELLER":
            reply = (
                "📦 **Hướng dẫn đăng bán đồ cũ lên sàn HYBRID.STORE:**\n"
                "1. **Đăng nhập & Xác thực CCCD:** Vào mục Hồ sơ để định danh eKYC Căn cước công dân gắn chip để đảm bảo môi trường mua bán uy tín.\n"
                "2. **AI Listing Studio:** Chụp 4 ảnh thực tế sản phẩm (mặt trước, sau, góc cạnh, tem imei). AI của sàn sẽ tự động quét, phân tích độ mới (%) và đề xuất giá thanh lý tối ưu.\n"
                "3. **Gửi máy về Lab:** Gửi máy qua bưu tá miễn phí về 1 trong 3 Lab kiểm định (Hà Nội, Đà Nẵng, TP.HCM). Sau khi chuyên viên dán tem niêm phong, tin đăng bán sẽ được đưa lên trang chủ!"
            )
            return reply, actions

        if intent == "ORDER_TRACKING":
            reply = (
                "📦 **Tra cứu đơn hàng của bạn:**\n"
                "Bạn có thể vào trang **[Quản Lý Đơn Mua]** để xem lộ trình bưu tá theo thời gian thực (Đang lấy hàng, Đang test Lab, Đang giao, Đã hoàn tất) và tải biên bản đồng kiểm kỹ thuật số."
            )
            return reply, actions

        if intent == "DISPUTE_SUPPORT":
            reply = (
                "⚖️ **Trung tâm phân xử 3 bên & Bảo vệ quyền lợi người tiêu dùng:**\n"
                "Nếu sản phẩm nhận được không đúng như mô tả hoặc gặp sự cố phần cứng:\n"
                "1. Bạn hãy bấm **'Yêu Cầu Khiếu Nại / Trả Hàng'** trong chi tiết đơn hàng trong vòng 48h kể từ khi nhận.\n"
                "2. Tiền trong Quỹ Escrow sẽ lập tức bị đóng băng để bảo toàn 100% tiền cho bạn.\n"
                "3. Ban trọng tài kỹ thuật của sàn sẽ vào phân xử và đưa ra phán quyết trong vòng tối đa 48h (SLA đếm ngược)."
            )
            return reply, actions

        if products:
            prod_names = ", ".join([f"**{p.name}** ({int(p.price):,}₫)" for p in products])
            reply = (
                f"Dựa trên yêu cầu của bạn, tôi xin gợi ý một số sản phẩm tối ưu nhất đang có mặt trên sàn:\n"
                f"{prod_names}.\n\n"
                f"Tất cả sản phẩm Like New đều đã qua 15 bước kiểm định nghiêm ngặt tại phòng Lab của sàn và được bảo vệ bởi Quỹ Ký Quỹ Escrow 48h. Bạn hãy bấm vào thẻ sản phẩm bên dưới để xem chi tiết nhé!"
            )
            return reply, actions

        # Trả lời câu hỏi tổng quát
        reply = (
            "Chào bạn! 👋 Tôi là **HYBRID AI Agent 24/7** — Trợ lý ảo tư vấn thông minh của sàn HYBRID.STORE.\n\n"
            "Tôi có thể hỗ trợ bạn:\n"
            "• 🔍 Tìm kiếm & gợi ý sản phẩm phù hợp ngân sách (iPhone, MacBook, Sony, Jordan...)\n"
            "• 🔬 Giải thích quy trình kiểm định 15 bước phòng Lab\n"
            "• 🛡️ Cách thức hoạt động của Quỹ Ký Quỹ Escrow 48h & đồng kiểm\n"
            "• 🤝 Hướng dẫn trả giá đồ cũ với người bán (Offer)\n"
            "• 🚚 Tra cứu đơn hàng, chính sách bảo hành 1 đổi 1 & đổi trả\n\n"
            "Bạn đang quan tâm đến sản phẩm nào hoặc cần giải đáp thắc mắc gì cứ hỏi tôi nhé! 😊"
        )
        return reply, actions
