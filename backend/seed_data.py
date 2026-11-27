"""
seed_data.py — Nạp Dữ Liệu Khởi Tạo Chuẩn Mẫu (Seed Data) Thông Qua SQLAlchemy ORM
Tạo và liên kết toàn bộ 23 Bảng qua Python thuần & SQLAlchemy Session — 100% không dùng raw SQL.
Cách chạy:
    cd backend
    python seed_data.py
"""

import os
import sys
from datetime import datetime, timezone, timedelta, date

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from core.database import engine, Base, SessionLocal, DB_PATH
from core.security import hash_password
from models import (
    User, KYCVerification, UserAddress, BankAccount,
    Category, Brand, Product, ProductImage, ProductSpec,
    ProductOffer, Voucher,
    Order, OrderParcel, OrderItem, OrderTrackingEvent,
    EscrowWallet, EscrowTransaction,
    Dispute, DisputeEvidence, DisputeMessage,
    ProductReview, Wishlist, Notification
)


def seed(drop_existing: bool = True):
    print("=" * 68)
    print("🌱 BẮT ĐẦU NẠP DỮ LIỆU SEED DATA QUA PYTHON & SQLALCHEMY ORM")
    print(f"📁 Database: {DB_PATH}")
    print("=" * 68)

    # 1. Làm sạch và tạo mới toàn bộ 23 bảng
    if drop_existing:
        print("🔨 Đang làm mới toàn bộ cấu trúc bảng...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:

        # ==============================================================
        # 1. USERS & E-KYC & ADDRESSES & BANK ACCOUNTS
        # ==============================================================
        print("👤 1. Tạo Users, eKYC, Sổ địa chỉ & Tài khoản ngân hàng...")
        admin = User(
            email="admin@hybridstore.vn",
            phone="0900000001",
            password_hash=hash_password("admin123456"),
            full_name="Quản Trị Viên Hệ Thống (Admin)",
            username="admin",
            role="admin",
            avatar_url="assets/images/products/set-nam-techwear-all-black.png",
            membership_title="ADMIN MASTER",
            bio="Quản trị viên cấp cao phụ trách vận hành và trọng tài sàn TMĐT Hybrid Store.",
            is_active=True,
            loyalty_points=5000
        )

        inspector = User(
            email="inspector@hybridstore.vn",
            phone="0900000002",
            password_hash=hash_password("inspect123456"),
            full_name="Kiểm Định Viên Trung Tâm Quốc Gia",
            username="inspector",
            role="inspector",
            avatar_url="assets/images/products/may-anh-ky-thuat-so-mirrorless.png",
            membership_title="SENIOR INSPECTOR",
            bio="Kiểm định viên phụ trách soi kính lúp, đo pin và niêm phong hàng C2C.",
            is_active=True,
            loyalty_points=2000
        )

        seller_techzone = User(
            email="techzone@hybridstore.vn",
            phone="0900000003",
            password_hash=hash_password("seller123456"),
            full_name="TechZone Official Store",
            username="techzone",
            role="seller",
            avatar_url="assets/images/products/may-tinh-laptop-mong-nhe.png",
            membership_title="OFFICIAL MALL",
            bio="Phân phối chính hãng Apple, Samsung, Sony 100% Brand Mall bảo hành toàn quốc.",
            shop_name="TechZone Official Mall",
            is_active=True,
            loyalty_points=12000
        )

        seller_minh = User(
            email="minhhoang@gmail.com",
            phone="0912345678",
            password_hash=hash_password("minh123456"),
            full_name="Trần Minh Hoàng",
            username="minhhoang",
            role="seller",
            avatar_url="assets/images/products/dien-thoai-smartphone-flagship.png",
            membership_title="PRO SELLER",
            bio="Chuyên hàng công nghệ lướt 99% nguyên bản zin áp suất, hỗ trợ kiểm định tận mắt.",
            shop_name="Minh Hoàng C2C Tech",
            is_active=True,
            loyalty_points=3500
        )

        buyer_tuan = User(
            email="tuananh@gmail.com",
            phone="0988888888",
            password_hash=hash_password("tuan123456"),
            full_name="Nguyễn Tuấn Anh",
            username="tuananh",
            role="buyer",
            avatar_url="assets/images/products/dong-ho-thong-minh-smartwatch.png",
            membership_title="VIP BUYER",
            bio="Tín đồ công nghệ yêu thích đồ hi-tech và săn deal giá hời.",
            is_active=True,
            loyalty_points=1850
        )

        user_phuc = User(
            email="nguyenphuc230607@gmail.com",
            phone="0912345679",
            password_hash=hash_password("phuc123456"),
            full_name="Nguyễn Phúc",
            username="nguyenphuc",
            role="buyer",
            avatar_url="assets/images/products/dong-ho-thong-minh-smartwatch.png",
            membership_title="VIP BUYER",
            bio="Tài khoản kiểm thử chính chủ HYBRID.STORE",
            is_active=True,
            loyalty_points=2000
        )

        db.add_all([admin, inspector, seller_techzone, seller_minh, buyer_tuan, user_phuc])
        db.flush()

        # eKYC cho Seller Minh
        kyc_minh = KYCVerification(
            user_id=seller_minh.id,
            id_card_number="001098012345",
            full_name_on_card="TRẦN MINH HOÀNG",
            date_of_birth=date(1995, 10, 24),
            gender="Nam",
            permanent_address="Số 88 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội",
            front_image_url="assets/images/products/images.jpg",
            back_image_url="assets/images/products/images (1).jpg",
            selfie_image_url="assets/images/products/images (4).jpg",
            face_match_score=99.2,
            status="approved",
            reviewed_by=inspector.id,
            reviewed_at=datetime.now() - timedelta(days=30)
        )
        db.add(kyc_minh)

        # Sổ địa chỉ giao hàng
        addr_tuan1 = UserAddress(
            user_id=buyer_tuan.id,
            recipient_name="Nguyễn Tuấn Anh",
            phone="0988888888",
            province="Thành phố Hà Nội",
            district="Quận Cầu Giấy",
            ward="Phường Dịch Vọng Hậu",
            street_address="Toà nhà FPT Tower, Số 10 Phạm Văn Bạch",
            full_address="Toà nhà FPT Tower, Số 10 Phạm Văn Bạch, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội",
            is_default=True,
            address_type="office"
        )
        addr_tuan2 = UserAddress(
            user_id=buyer_tuan.id,
            recipient_name="Nguyễn Tuấn Anh (Nhà riêng)",
            phone="0988888888",
            province="Thành phố Hà Nội",
            district="Quận Nam Từ Liêm",
            ward="Phường Mỹ Đình 1",
            street_address="Căn hộ 1208, Toà CT1 Sudico Mỹ Đình",
            full_address="Căn hộ 1208, Toà CT1 Sudico Mỹ Đình, P. Mỹ Đình 1, Q. Nam Từ Liêm, Hà Nội",
            is_default=False,
            address_type="home"
        )
        db.add_all([addr_tuan1, addr_tuan2])

        # Tài khoản ngân hàng Napas
        bank_minh = BankAccount(
            user_id=seller_minh.id,
            bank_code="TCB",
            bank_name="Techcombank",
            account_number="19034567890123",
            account_holder="TRAN MINH HOANG",
            is_default=True
        )
        bank_techzone = BankAccount(
            user_id=seller_techzone.id,
            bank_code="VCB",
            bank_name="Vietcombank",
            account_number="0011004567890",
            account_holder="CTY CP CONG NGHE TECHZONE",
            is_default=True
        )
        db.add_all([bank_minh, bank_techzone])
        db.flush()

        # ==============================================================
        # 2. CATEGORIES & BRANDS
        # ==============================================================
        print("📦 2. Tạo Danh mục ngành hàng và Thương hiệu chính hãng...")
        categories_map = {}
        cats_data = [
            ("tech", "Điện Thoại & Laptop Flagship", "devices", "tertiary", "HYBRID TECH", "Flagship Apple, Samsung & Laptop đồ hoạ mỏng nhẹ", 1),
            ("audio", "Âm Thanh & Tai Nghe Hi-Res", "headphones", "accent", "HI-FI AUDIO", "Tai nghe Sony WH-1000XM5, loa bluetooth bass trầm", 2),
            ("gaming", "Gaming Gear & Bàn Phím Cơ", "sports_esports", "primary", "ESPORTS READY", "Bàn phím cơ AULA F75, chuột gaming không dây", 3),
            ("camera", "Máy Ảnh & Thiết Bị Quay Chụp", "photo_camera", "purple", "PHOTO & CINEMA", "Máy ảnh Mirrorless Sony, lens tele và gimbal chống rung", 4),
            ("watches", "Đồng Hồ & Phụ Kiện Cao Cấp", "watch", "cyan", "LUXURY TIME", "Đồng hồ cơ Automatic, smartwatch thể thao GPS", 5),
            ("appliances", "Đồ Gia Dụng Thông Minh", "home_mini", "warning", "SMART HOME", "Nồi chiên không dầu Philips, máy hút bụi cầm tay Dyson", 6),
            ("sneakers", "Sneakers & Giày Dép Hype", "steps", "secondary", "OFFICIAL SEAL", "Giày thể thao nam nữ sneaker đế dày phong cách streetwear", 7),
            ("fashion", "Thời Trang & Streetwear Mall", "checkroom", "primary", "MALL NEW 100%", "Set đồ techwear, áo jacket blazer runway nam cao cấp", 8),
        ]
        for slug, name, icon, tone, badge, desc, order in cats_data:
            cat = Category(
                slug=slug,
                name=name,
                icon=icon,
                tone=tone,
                badge=badge,
                desc=desc,
                display_order=order,
                is_active=True
            )
            db.add(cat)
            categories_map[slug] = cat

        brands_map = {}
        brands_data = [
            ("apple", "Apple", "assets/images/products/may-tinh-laptop-mong-nhe.png", True),
            ("samsung", "Samsung", "assets/images/products/dien-thoai-smartphone-flagship.png", True),
            ("sony", "Sony", "assets/images/products/tai-nghe-sony-wh-ch520.png", True),
            ("logitech", "Logitech G", "assets/images/products/chuot-logitech-g-pro-x-superlight-pink.png", True),
            ("razer", "Razer", "assets/images/products/tai-nghe-razer-blackshark-v2-gold.png", True),
            ("dyson", "Dyson", "assets/images/products/may-hut-bui-cam-tay.png", True),
            ("nike", "Nike", "assets/images/products/giay-the-thao-nam-fashion-3-mau.png", True),
            ("philips", "Philips", "assets/images/products/noi-chien-khong-dau.png", True),
        ]
        for slug, name, logo, is_mall in brands_data:
            brand = Brand(slug=slug, name=name, logo_url=logo, is_official_mall=is_mall)
            db.add(brand)
            brands_map[slug] = brand

        db.flush()

        # ==============================================================
        # 3. PRODUCTS, IMAGES & SPECS
        # ==============================================================
        print("📱 3. Tạo Sản phẩm Hybrid Store (Mall New 100% & C2C Like New 99%)...")
        
        # P1: iPhone 15 Pro Max (Mall New)
        p1 = Product(
            sku="SKU-IP15PM-256-TN",
            name="iPhone 15 Pro Max 256GB Titan Tự Nhiên - Brand Mall New 100%",
            short_name="iPhone 15 Pro Max 256GB Titan",
            slug="iphone-15-pro-max-256gb-titan-tu-nhien",
            category_id=categories_map["tech"].id,
            brand_id=brands_map["apple"].id,
            seller_id=seller_techzone.id,
            product_type="mall",
            condition_pct=100,
            condition_label="Mới 100% Nguyên Seal",
            original_price=34990000,
            selling_price=29490000,
            stock_quantity=25,
            thumbnail_url="assets/images/products/dien-thoai-smartphone-flagship.png",
            description="iPhone 15 Pro Max thiết kế khung titan chuẩn hàng không vũ trụ, chip A17 Pro cực mạnh, camera tiềm vọng zoom 5x quang học.",
            warranty_months=12,
            warranty_policy_note="Bảo hành 1 đổi 1 trong 30 ngày tại trung tâm bảo hành Apple uỷ quyền toàn quốc.",
            inspection_passed=True,
            inspection_score=10.0,
            allow_offers=False,
            is_flash_sale=True,
            flash_sale_end=datetime.now() + timedelta(hours=14),
            sales_count=182,
            rating_average=4.9,
            rating_count=64
        )

        # P2: MacBook Pro M3 (C2C Like New 99%)
        p2 = Product(
            sku="SKU-MBP14-M3-99",
            name="MacBook Pro 14 inch M3 Pro (18GB/512GB) Space Black - Like New 99%",
            short_name="MacBook Pro 14 M3 Pro",
            slug="macbook-pro-14-m3-pro-space-black-like-new",
            category_id=categories_map["tech"].id,
            brand_id=brands_map["apple"].id,
            seller_id=seller_minh.id,
            product_type="c2c",
            condition_pct=99,
            condition_label="Like New 99% Pin 98%",
            original_price=49990000,
            selling_price=39800000,
            stock_quantity=1,
            thumbnail_url="assets/images/products/may-tinh-laptop-mong-nhe.png",
            description="Máy cá nhân dùng giữ gìn, bàn phím không bóng, sạc 24 lần. Đã qua kiểm định 28 bước C06.",
            accessories_included="Sạc zin 70W MagSafe 3, cáp bện theo máy, hộp trùng serial",
            warranty_months=6,
            warranty_policy_note="Bảo hành sàn Hybrid Store bao test 15 ngày hoàn tiền nếu phát hiện lỗi phần cứng.",
            inspection_passed=True,
            inspection_score=9.9,
            allow_offers=True,
            is_flash_sale=False,
            sales_count=1,
            rating_average=5.0,
            rating_count=12
        )

        # P3: Sony WH-1000XM5 (Mall New)
        p3 = Product(
            sku="SKU-SONY-XM5-SLV",
            name="Tai nghe chống ồn không dây Sony WH-1000XM5 Bạc - Chính hãng Sony Mall",
            short_name="Sony WH-1000XM5 Bạc",
            slug="tai-nghe-sony-wh-1000xm5-bac-chinh-hang",
            category_id=categories_map["audio"].id,
            brand_id=brands_map["sony"].id,
            seller_id=seller_techzone.id,
            product_type="mall",
            condition_pct=100,
            condition_label="Mới 100% Nguyên Seal",
            original_price=8990000,
            selling_price=6790000,
            stock_quantity=40,
            thumbnail_url="assets/images/products/tai-nghe-sony-wh-ch520.png",
            description="Chống ồn chủ động đỉnh cao với 2 bộ xử lý và 8 micro, màng loa carbon 30mm, thời lượng pin 30h.",
            warranty_months=12,
            warranty_policy_note="Bảo hành điện tử chính hãng Sony Việt Nam 12 tháng.",
            inspection_passed=True,
            inspection_score=10.0,
            allow_offers=False,
            is_flash_sale=True,
            flash_sale_end=datetime.now() + timedelta(hours=8),
            sales_count=95,
            rating_average=4.8,
            rating_count=38
        )

        # P4: Máy ảnh Sony Alpha A7 IV (C2C Like New)
        p4 = Product(
            sku="SKU-SONY-A7M4-BODY",
            name="Body máy ảnh Sony Alpha A7 IV (ILCE-7M4) - C2C Like New 98% 3k Shot",
            short_name="Sony A7 IV Body Like New",
            slug="body-may-anh-sony-alpha-a7-iv-like-new",
            category_id=categories_map["camera"].id,
            brand_id=brands_map["sony"].id,
            seller_id=seller_minh.id,
            product_type="c2c",
            condition_pct=98,
            condition_label="Like New 98% 3200 shot",
            original_price=54900000,
            selling_price=41500000,
            stock_quantity=1,
            thumbnail_url="assets/images/products/may-anh-ky-thuat-so-mirrorless.png",
            description="Cảm biến full-frame Exmor R 33MP, quay 4K 60p 10-bit, hệ thống lấy nét mắt thời gian thực AI.",
            accessories_included="Pin zin FZ100, dây đeo, sạc cáp, thẻ nhớ SDXC 128GB V60",
            warranty_months=6,
            warranty_policy_note="Bảo hành cảm biến và màn trập 6 tháng tại trung tâm đối tác kiểm định.",
            inspection_passed=True,
            inspection_score=9.7,
            allow_offers=True,
            is_flash_sale=False,
            sales_count=0,
            rating_average=5.0,
            rating_count=5
        )

        db.add_all([p1, p2, p3, p4])
        db.flush()

        # Thêm ảnh sản phẩm
        images = [
            ProductImage(product_id=p1.id, image_url="assets/images/products/dien-thoai-smartphone-flagship.png", is_cover=True, display_order=0),
            ProductImage(product_id=p1.id, image_url="assets/images/products/may-tinh-laptop-mong-nhe.png", is_cover=False, display_order=1),
            ProductImage(product_id=p2.id, image_url="assets/images/products/may-tinh-laptop-mong-nhe.png", is_cover=True, display_order=0),
            ProductImage(product_id=p3.id, image_url="assets/images/products/tai-nghe-sony-wh-ch520.png", is_cover=True, display_order=0),
            ProductImage(product_id=p4.id, image_url="assets/images/products/may-anh-ky-thuat-so-mirrorless.png", is_cover=True, display_order=0),
        ]
        db.add_all(images)

        # Thông số kỹ thuật (Specs)
        specs = [
            ProductSpec(product_id=p1.id, group_name="Cấu hình", spec_key="Màn hình", spec_value="6.7 inch Super Retina XDR OLED 120Hz"),
            ProductSpec(product_id=p1.id, group_name="Cấu hình", spec_key="Vi xử lý", spec_value="Apple A17 Pro 3nm"),
            ProductSpec(product_id=p1.id, group_name="Cấu hình", spec_key="Bộ nhớ trong", spec_value="256 GB NVMe"),
            ProductSpec(product_id=p2.id, group_name="Hiệu năng", spec_key="CPU", spec_value="Apple M3 Pro 11-core CPU, 14-core GPU"),
            ProductSpec(product_id=p2.id, group_name="Hiệu năng", spec_key="RAM & SSD", spec_value="18GB Unified Memory / 512GB SSD"),
        ]
        db.add_all(specs)
        db.flush()

        # ==============================================================
        # 4. OFFERS (ĐÀM PHÁN TRẢ GIÁ C2C 24H)
        # ==============================================================
        print("🤝 4. Tạo Đề xuất Trả giá C2C 24h...")
        offer1 = ProductOffer(
            product_id=p2.id,
            buyer_id=buyer_tuan.id,
            seller_id=seller_minh.id,
            original_price=p2.selling_price,
            offered_price=37500000,
            discount_pct=6,
            buyer_message="Em Tuấn Anh nhiệt tình lấy trong ngày, anh bớt em 37tr5 em qua chốt luôn ạ!",
            status="pending",
            expires_at=datetime.now() + timedelta(hours=22)
        )
        db.add(offer1)

        # ==============================================================
        # 5. VOUCHERS & KHUYẾN MÃI
        # ==============================================================
        print("🎟️ 5. Tạo Mã Giảm Giá & Voucher...")
        vouchers = [
            Voucher(
                code="FREESHIP50",
                title="Miễn phí vận chuyển toàn quốc 50.000đ",
                voucher_type="freeship",
                discount_value=50000,
                min_order_value=300000,
                usage_limit=1000,
                usage_count=42,
                start_date=datetime.now() - timedelta(days=5),
                end_date=datetime.now() + timedelta(days=30),
                is_active=True
            ),
            Voucher(
                code="HYBRID10",
                title="Giảm 10% tối đa 500k cho đơn từ 2 triệu",
                voucher_type="percent",
                discount_value=10,
                min_order_value=2000000,
                max_discount_amount=500000,
                usage_limit=500,
                usage_count=88,
                start_date=datetime.now() - timedelta(days=3),
                end_date=datetime.now() + timedelta(days=20),
                is_active=True
            ),
            Voucher(
                code="TECH100K",
                title="Giảm ngay 100.000đ đơn công nghệ",
                voucher_type="fixed",
                discount_value=100000,
                min_order_value=1000000,
                usage_limit=300,
                usage_count=19,
                start_date=datetime.now() - timedelta(days=2),
                end_date=datetime.now() + timedelta(days=15),
                is_active=True
            ),
        ]
        db.add_all(vouchers)
        db.flush()

        # ==============================================================
        # 6. ORDERS & SPLIT PARCELS & GHN TRACKING
        # ==============================================================
        print("📦 6. Tạo Đơn hàng Multi-Vendor, Tách Kiện & Hành trình GHN...")
        order1 = Order(
            order_code="ORD-928374",
            buyer_id=buyer_tuan.id,
            subtotal=p1.selling_price,
            shipping_fee=35000,
            discount_amount=500000,
            total_amount=p1.selling_price + 35000 - 500000,
            payment_method="VIETQR",
            payment_status="paid",
            shipping_method="ghn_express",
            recipient_name=buyer_tuan.full_name,
            recipient_phone=buyer_tuan.phone,
            shipping_address=addr_tuan1.full_address,
            buyer_note="Giao giờ hành chính giúp em ạ",
            status="completed",
            step_index=4,
            completed_at=datetime.now() - timedelta(days=1)
        )
        db.add(order1)
        db.flush()

        parcel1 = OrderParcel(
            order_id=order1.id,
            seller_id=seller_techzone.id,
            parcel_code="PKG-TECH-01",
            carrier_name="Giao Hàng Nhanh (GHN)",
            tracking_code="GHN982736412VN",
            shipping_fee=35000,
            estimated_delivery="18/11/2026",
            status="delivered"
        )
        db.add(parcel1)
        db.flush()

        item1 = OrderItem(
            order_id=order1.id,
            parcel_id=parcel1.id,
            product_id=p1.id,
            product_name=p1.name,
            product_type="mall",
            condition_pct=100,
            unit_price=p1.selling_price,
            quantity=1,
            total_price=p1.selling_price,
            thumbnail_url=p1.thumbnail_url
        )
        db.add(item1)

        tracking_events = [
            OrderTrackingEvent(parcel_id=parcel1.id, status_title="Đơn hàng được khởi tạo", status_description="Người mua đã thanh toán thành công qua cổng VietQR.", location="Hà Nội", event_time=datetime.now() - timedelta(days=3)),
            OrderTrackingEvent(parcel_id=parcel1.id, status_title="Người bán đã bàn giao", status_description="Kiện hàng đã rời kho TechZone Official Mall.", location="Kho Phúc Diễn, Bắc Từ Liêm", event_time=datetime.now() - timedelta(days=2)),
            OrderTrackingEvent(parcel_id=parcel1.id, status_title="Đang giao hàng", status_description="Shipper GHN đang trên đường giao tới bạn.", location="Cầu Giấy, Hà Nội", event_time=datetime.now() - timedelta(days=1)),
            OrderTrackingEvent(parcel_id=parcel1.id, status_title="Giao hàng thành công", status_description="Người nhận đã kiểm tra ngoại quan và ký nhận an toàn.", location="FPT Tower, Cầu Giấy", event_time=datetime.now() - timedelta(days=1, hours=-2)),
        ]
        db.add_all(tracking_events)

        # ==============================================================
        # 7. ESCROW WALLET & SỔ CÁI 24/7
        # ==============================================================
        print("💰 7. Tạo Ví Ký Quỹ Escrow & Sổ cái tài chính...")
        wallet_techzone = EscrowWallet(
            user_id=seller_techzone.id,
            available_balance=58980000,
            locked_balance=0,
            total_withdrawn=25000000
        )
        wallet_minh = EscrowWallet(
            user_id=seller_minh.id,
            available_balance=15200000,
            locked_balance=39800000,
            total_withdrawn=10000000
        )
        wallet_tuan = EscrowWallet(
            user_id=buyer_tuan.id,
            available_balance=2500000,
            locked_balance=0,
            total_withdrawn=0
        )
        db.add_all([wallet_techzone, wallet_minh, wallet_tuan])
        db.flush()

        tx1 = EscrowTransaction(
            wallet_id=wallet_techzone.id,
            order_id=order1.id,
            transaction_code="TX-PAY-882312",
            transaction_type="release_payout",
            amount=order1.total_amount,
            balance_after=wallet_techzone.available_balance,
            memo=f"Giải ngân doanh thu đơn hàng #{order1.order_code} vào số dư khả dụng",
            status="completed"
        )
        db.add(tx1)

        # ==============================================================
        # 8. DISPUTES & ARBITRATION (PHÒNG TRỌNG TÀI KHIẾU NẠI 3 BÊN)
        # ==============================================================
        print("⚖️ 8. Tạo Hồ sơ Khiếu nại Trọng tài 3 bên & Bằng chứng 4K...")
        dispute1 = Dispute(
            dispute_code="DSP-20261118-9941",
            order_id=order1.id,
            buyer_id=buyer_tuan.id,
            seller_id=seller_techzone.id,
            reason="Hàng có dấu hiệu bị móp méo hộp ngoài vận chuyển",
            description="Tôi nhận kiện hàng thì hộp bên ngoài bị móp góc, tôi đã quay video 4K mở hộp đồng kiểm có mặt shipper.",
            requested_refund=500000,
            approved_refund=0,
            status="in_arbitration",
            arbitrator_admin_id=admin.id,
            created_at=datetime.now() - timedelta(hours=10)
        )
        db.add(dispute1)
        db.flush()

        evidence1 = DisputeEvidence(
            dispute_id=dispute1.id,
            uploaded_by_user_id=buyer_tuan.id,
            media_url="assets/images/products/images.jpg",
            media_type="image",
            title="Ảnh chụp vết móp góc hộp khi nhận từ shipper GHN",
            file_size_kb=2450
        )
        evidence2 = DisputeEvidence(
            dispute_id=dispute1.id,
            uploaded_by_user_id=buyer_tuan.id,
            media_url="assets/images/products/images (1).jpg",
            media_type="video",
            title="Video 4K quá trình bóc băng keo niêm phong",
            file_size_kb=15800
        )
        db.add_all([evidence1, evidence2])

        messages = [
            DisputeMessage(dispute_id=dispute1.id, sender_id=buyer_tuan.id, sender_role="buyer", message_text="Kính gửi Trọng tài viên và Người bán, hộp máy bị cấn góc tôi xin yêu cầu hỗ trợ đổi hộp hoặc voucher 500k."),
            DisputeMessage(dispute_id=dispute1.id, sender_id=seller_techzone.id, sender_role="seller", message_text="Chào bạn, TechZone đã bọc 3 lớp bóng khí, có thể do va đập vận chuyển. Máy bên trong nguyên seal vẫn an toàn tuyệt đối."),
            DisputeMessage(dispute_id=dispute1.id, sender_id=admin.id, sender_role="admin", message_text="Trọng tài viên đang xem xét video unboxing. Đề nghị bên vận chuyển GHN cung cấp biên bản giao nhận trước 17h hôm nay."),
        ]
        db.add_all(messages)

        # ==============================================================
        # 9. REVIEWS, WISHLIST & NOTIFICATIONS
        # ==============================================================
        print("⭐ 9. Tạo Đánh giá Verified Buyer, Yêu thích & Thông báo...")
        rev1 = ProductReview(
            product_id=p1.id,
            order_id=order1.id,
            user_id=buyer_tuan.id,
            rating=5,
            comment="Hàng chính hãng chuẩn VN/A, máy bóc seal thơm phức, màn 120Hz mượt mà. Sàn Hybrid Store giao cực nhanh!",
            has_photo=True,
            is_verified_buyer=True,
            seller_reply="TechZone xin chân thành cảm ơn quý khách Tuấn Anh! Chúc quý khách trải nghiệm tuyệt vời cùng siêu phẩm titan!",
            seller_replied_at=datetime.now() - timedelta(hours=5)
        )
        db.add(rev1)

        wish1 = Wishlist(user_id=buyer_tuan.id, product_id=p2.id)
        wish2 = Wishlist(user_id=buyer_tuan.id, product_id=p3.id)
        db.add_all([wish1, wish2])

        notifs = [
            Notification(user_id=buyer_tuan.id, type="order", title="Đơn hàng giao thành công", message=f"Đơn hàng #{order1.order_code} đã được giao thành công. Vui lòng đánh giá để nhận 500 Xu!", link_url="pages/buyer/orders.html"),
            Notification(user_id=buyer_tuan.id, type="dispute", title="Cập nhật phiên trọng tài", message=f"Trọng tài viên đã gửi phản hồi trong vụ việc {dispute1.dispute_code}.", link_url="pages/buyer/dispute.html"),
            Notification(user_id=buyer_tuan.id, type="promo", title="Flash Sale nửa đêm", message="Hàng loạt phụ kiện Apple giảm đến 40% chỉ trong 2 tiếng duy nhất!", link_url="pages/shop/catalog.html"),
        ]
        db.add_all(notifs)

        # Hoàn tất Commit
        db.commit()
        print("=" * 68)
        print("🎉 NẠP SEED DATA THÀNH CÔNG 100% VÀO CSDL QUA SQLALCHEMY!")
        print(f"   - Users: 5 tài khoản (admin, inspector, 2 sellers, 1 buyer)")
        print(f"   - Categories: {len(cats_data)} danh mục ngành hàng")
        print(f"   - Brands: {len(brands_data)} thương hiệu chính hãng")
        print(f"   - Products: 4 sản phẩm mẫu chuẩn specs, ảnh, flash sale")
        print(f"   - Offers: 1 đề xuất trả giá C2C 24h")
        print(f"   - Vouchers: {len(vouchers)} mã freeship & giảm giá")
        print(f"   - Orders: 1 đơn hàng multi-vendor tách kiện và tracking GHN")
        print(f"   - Escrow Wallets: 3 ví ký quỹ số cái 24/7")
        print(f"   - Disputes: 1 phòng trọng tài 3 bên với video 4K unboxing")
        print(f"   - Reviews: 1 đánh giá 5 sao kèm phản hồi của seller")
        print(f"   - Notifications: 3 thông báo đa kênh")
        print("=" * 68)

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi nạp dữ liệu: {e}")
        raise e
    finally:
        db.close()


def auto_seed_if_empty():
    """Tự động kiểm tra và nạp dữ liệu khởi tạo nếu CSDL đang rỗng."""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        cat_count = db.query(Category).count()
        if user_count == 0 or cat_count == 0:
            print("🌱 [AutoSeed] Phát hiện CSDL chưa có dữ liệu mẫu. Đang tự động nạp...")
            seed(drop_existing=False)
            print("✅ [AutoSeed] Đã nạp dữ liệu mẫu ban đầu thành công!")
        else:
            print(f"ℹ️ [AutoSeed] CSDL đã sẵn sàng với {user_count} người dùng và {cat_count} danh mục.")
    except Exception as e:
        print(f"⚠️ [AutoSeed] Bỏ qua nạp dữ liệu tự động: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
