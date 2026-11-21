-- ============================================================================
-- DỰ ÁN: HYBRID.STORE — BỘ DỮ LIỆU MẪU CHUẨN PRODUCTION (12 BẢNG)
-- TƯƠNG THÍCH: SQLite 3 / PostgreSQL / MySQL (ANSI SQL Standard)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NẠP TÀI KHOẢN NGƯỜI DÙNG (users: Admin, Seller, Buyer kèm CCCD & Ngân hàng & Ví)
-- ----------------------------------------------------------------------------
INSERT INTO users (
    id, email, phone, password_hash, full_name, username, role, avatar_url,
    membership_title, bio, is_active, email_verified, phone_verified, vip_points,
    id_card_number, card_full_name, dob, gender, permanent_address,
    front_image_url, back_image_url, kyc_status,
    bank_code, bank_name, bank_account_number, bank_account_holder,
    wallet_balance, locked_balance, total_withdrawn,
    wishlist_ids, notifications_json
) VALUES
-- Tài khoản 1: MASTER ADMIN QUYỀN LỰC
(
    'u-admin-01', 'admin@hybrid.store', '0909999999',
    '$2b$12$KIXHau8aGZ5.1J82b6pP4.a44FhD/8t02j0u3wK6Z6M8w8A5p4bE2', -- hash của 'admin123'
    'Ban Quản Trị Hệ Thống', 'root_admin', 'admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'ROOT SUPER ADMIN', 'Điều hành toàn diện 20 phân hệ, quản trị ký quỹ và phân xử trọng tài.',
    1, 1, 1, 99999,
    '001090008888', 'BAN QUẢN TRỊ HYBRID STORE', '1990-01-01', 'Nam', 'Trụ sở Hybrid Store, Tầng 38 Landmark 81, TP. Hồ Chí Minh',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'approved',
    'TCB', 'Techcombank', '19038888888888', 'HYBRID STORE ESCROW MASTER',
    500000000, 25000000, 150000000,
    '[]',
    '[{"id":"notif-adm-01","type":"system","title":"Hệ thống trực tuyến 99.99%","message":"Khởi chạy thành công kiến trúc 12 bảng database chuẩn.","is_read":true,"created_at":"2026-11-18 08:00:00"}]'
),
-- Tài khoản 2: NGƯỜI BÁN CHUYÊN NGHIỆP (TOP SELLER C2C)
(
    'u-seller-01', 'binh@sneakers.vn', '0987654321',
    '$2b$12$e8V9gE1sPZ018k8W2kP4.eZ4Y8j1K0M4k7b9W0p6A2k8p3Z1u5bE1', -- hash của 'password123'
    'Nguyễn Huy Bình', 'huybinh_sneakers', 'seller',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'TOP SELLER C2C', 'Chuyên đồ công nghệ & Sneaker chính hãng. Cam kết hàng tuyển chọn 100% kiểm định kỹ thuật.',
    1, 1, 1, 4850,
    '079095012345', 'NGUYỄN HUY BÌNH', '1995-05-12', 'Nam', 'Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'approved',
    'VCB', 'Vietcombank', '0071000999999', 'NGUYEN HUY BINH',
    14500000, 2400000, 48000000,
    '["prod-tech-01"]',
    '[{"id":"notif-sel-01","type":"order","title":"Có đơn hàng mới cần chuẩn bị","message":"Khách Nguyễn Ngọc Phúc vừa đặt hàng iPhone 15 Pro Max.","is_read":false,"created_at":"2026-11-18 08:15:00"}]'
),
-- Tài khoản 3: KHÁCH HÀNG MUA SẮM (VIP BUYER)
(
    'u-buyer-01', 'phuc@hybrid.store', '0901234567',
    '$2b$12$e8V9gE1sPZ018k8W2kP4.eZ4Y8j1K0M4k7b9W0p6A2k8p3Z1u5bE1', -- hash của 'password123'
    'Nguyễn Ngọc Phúc', 'nguyenphuc2306', 'buyer',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    'VIP BUYER', 'Đam mê sưu tầm Sneaker Hypebeast và thiết bị công nghệ âm thanh hi-tech.',
    1, 1, 1, 1500,
    '001202008849', 'NGUYỄN NGỌC PHÚC', '1994-09-18', 'Nam', 'Căn hộ Landmark 81, Vinhomes Central Park, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    'approved',
    'TCB', 'Techcombank', '19036888888888', 'NGUYEN NGOC PHUC',
    3200000, 0, 12000000,
    '["prod-tech-01", "prod-sneaker-01"]',
    '[{"id":"notif-buy-01","type":"promo","title":"Ưu đãi Freeship 0đ toàn quốc","message":"Áp mã FREESHIP cho đơn hàng từ 0đ hôm nay.","is_read":false,"created_at":"2026-11-18 08:30:00"}]'
);

-- ----------------------------------------------------------------------------
-- 2. NẠP SỔ ĐỊA CHỈ GIAO NHẬN (user_addresses)
-- ----------------------------------------------------------------------------
INSERT INTO user_addresses (
    id, user_id, recipient_name, phone, province, district, ward,
    street_address, full_address, address_type, is_default
) VALUES
(
    'addr-01', 'u-buyer-01', 'Nguyễn Ngọc Phúc', '0901234567',
    'Thành phố Hồ Chí Minh', 'Quận Bình Thạnh', 'Phường 22',
    'Căn hộ L81-2804, Tòa Landmark 81, Vinhomes Central Park, 720A Điện Biên Phủ',
    'Căn hộ L81-2804, Tòa Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, Thành phố Hồ Chí Minh',
    'home', 1
),
(
    'addr-02', 'u-seller-01', 'Kho Hàng Huy Bình Sneakers', '0987654321',
    'Thành phố Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé',
    'Số 45 Lê Duẩn, Tòa nhà Kumho Asiana',
    'Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
    'office', 1
);

-- ----------------------------------------------------------------------------
-- 3. NẠP DANH MỤC NGÀNH HÀNG (categories)
-- ----------------------------------------------------------------------------
INSERT INTO categories (id, slug, name, icon, display_order, is_active) VALUES
('cat-tech', 'tech', 'Đồ Điện Tử & Hi-Tech', 'laptop_mac', 1, 1),
('cat-sneakers', 'sneakers', 'Giày Sneaker Hypebeast', 'steps', 2, 1),
('cat-audio', 'audio', 'Tai Nghe & Âm Thanh', 'headphones', 3, 1),
('cat-fashion', 'fashion', 'Thời Trang & Phụ Kiện', 'checkroom', 4, 1),
('cat-lifestyle', 'lifestyle', 'Gia Dụng & Lifestyle', 'home_iot_device', 5, 1),
('cat-watch', 'watch', 'Đồng Hồ & Smartwatch', 'watch', 6, 1),
('cat-accessories', 'accessories', 'Phụ Kiện Điện Tử', 'cable', 7, 1),
('cat-gaming', 'gaming', 'Gaming Gear & Bàn Phím', 'sports_esports', 8, 1);

-- ----------------------------------------------------------------------------
-- 4. NẠP SẢN PHẨM HYBRID (products: Brand Mall Mới 100% & Chợ C2C Tuyển Chọn)
-- ----------------------------------------------------------------------------
INSERT INTO products (
    id, sku, name, short_name, slug, category_id, seller_id, brand_name, is_official_mall,
    product_type, condition_pct, condition_label, original_price, selling_price,
    stock_quantity, thumbnail_url, description, accessories_included,
    warranty_months, warranty_policy_note, inspection_passed, inspection_score,
    allow_offers, is_flash_sale, flash_sale_end, view_count, sales_count,
    rating_average, rating_count, status, images, specs
) VALUES
-- Món 1: Flagship Brand Mall - iPhone 15 Pro Max
(
    'prod-tech-01', 'HYB-IP15PM-256',
    'Apple iPhone 15 Pro Max 256GB - Titan Tự Nhiên (Chính Hãng VN/A)',
    'iPhone 15 Pro Max 256GB', 'apple-iphone-15-pro-max-256gb-titan',
    'cat-tech', 'u-admin-01', 'Apple', 1,
    'mall', 100, 'MỚI 100% NGUYÊN SEAL', 34990000, 29890000,
    45, 'assets/images/ip15-1.jpg',
    'Siêu phẩm Flagship mạnh nhất của Apple với khung viền Titan chuẩn hàng không vũ trụ, chip A17 Pro 3nm đồ họa đẳng cấp console, nút Action Button và hệ thống camera 5x tiềm vọng chuyên nghiệp.',
    'Hộp nguyên seal, Cáp USB-C bện dù 1m, Que chọc SIM, Sách HDSD',
    12, 'Bảo hành chính hãng Apple Care 12 tháng 1 đổi 1 trong 30 ngày', 1, 10.0,
    0, 1, '2026-11-20 23:59:59', 18420, 312,
    4.9, 128, 'active',
    '["assets/images/ip15-1.jpg", "assets/images/ip15-2.jpg", "assets/images/ip15-3.jpg", "assets/images/ip15-4.jpg"]',
    '{"Màn hình":"6.7 inch Super Retina XDR OLED 120Hz ProMotion","Vi xử lý":"Apple A17 Pro (3nm) 6 nhân","RAM":"8 GB","Bộ nhớ trong":"256 GB NVMe","Camera chính":"48 MP + 12 MP (Ultra Wide) + 12 MP (5x Telephoto)","Pin & Sạc":"4.422 mAh, Sạc nhanh 20W, MagSafe 15W","Chất liệu":"Khung Titan Grade 5, Mặt lưng kính mờ nhám Ceramic Shield"}'
),
-- Món 2: Hàng cũ C2C tuyển chọn Like New - MacBook Pro M3
(
    'prod-tech-02', 'HYB-MBP14-M3',
    'Apple MacBook Pro 14 inch M3 Pro (18GB RAM / 512GB SSD) - Space Black',
    'MacBook Pro 14 M3 Pro', 'macbook-pro-14-m3-pro-space-black-like-new',
    'cat-tech', 'u-seller-01', 'Apple', 0,
    'c2c', 98, 'LIKE NEW 98% (SẠC 18 LẦN)', 49990000, 41500000,
    1, 'assets/images/mbp-1.jpg',
    'Máy cá nhân dùng lướt văn phòng, pin hoàn hảo 100% dung lượng. Đã vượt qua 15 bước kiểm định nghiêm ngặt tại Phòng Lab Hybrid Store: Màn hình không điểm chết, phím không bóng, loa trong trẻo.',
    'Fullbox trùng series, Củ sạc 70W Type-C Zin, Cáp MagSafe 3 bện đen nguyên bản',
    6, 'Bảo hành trách nhiệm shop 6 tháng, bao test đổi trả 7 ngày', 1, 9.8,
    1, 0, NULL, 9210, 1,
    5.0, 14, 'active',
    '["assets/images/mbp-1.jpg", "assets/images/mbp-2.jpg", "assets/images/mbp-3.jpg"]',
    '{"Màn hình":"14.2 inch Liquid Retina XDR 120Hz Extreme Dynamic Range","Vi xử lý":"Apple M3 Pro (11-core CPU, 14-core GPU)","RAM":"18 GB Unified Memory","Ổ cứng":"512 GB SSD siêu tốc 5000MB/s","Pin":"Pin 70Wh, thời lượng 18 tiếng, sạc 18 chu kỳ","Trọng lượng":"1.61 kg, Vỏ nhôm nguyên khối Space Black"}'
),
-- Món 3: Flagship Brand Mall - Tai nghe chống ồn Sony WH-1000XM5
(
    'prod-audio-01', 'HYB-SONY-XM5',
    'Tai Nghe Chụp Tai Chống Ồn Không Dây Sony WH-1000XM5 - Đen Nhám',
    'Sony WH-1000XM5', 'tai-nghe-sony-wh-1000xm5-black',
    'cat-audio', 'u-admin-01', 'Sony', 1,
    'mall', 100, 'MỚI 100% NGUYÊN SEAL', 8990000, 7290000,
    30, 'assets/images/xm5-1.jpg',
    'Đỉnh cao chống ồn chủ động ANC với vi xử lý kép V1 và QN1. Hỗ trợ âm thanh độ phân giải cao Hi-Res Audio Wireless LDAC, thời lượng pin 30 giờ liên tục và đàm thoại AI lọc tạp âm chuẩn phòng thu.',
    'Hộp đựng du lịch cao cấp, Cáp âm thanh 3.5mm, Cáp sạc USB-C',
    12, 'Bảo hành điện tử chính hãng Sony Việt Nam 12 tháng', 1, 9.9,
    0, 1, '2026-11-20 23:59:59', 12300, 185,
    4.8, 86, 'active',
    '["assets/images/xm5-1.jpg", "assets/images/xm5-2.jpg", "assets/images/xm5-3.jpg"]',
    '{"Driver":"30 mm chất liệu sợi carbon tổng hợp","Tần số phản hồi":"4 Hz - 40.000 Hz","Thời lượng pin":"30 giờ (bật ANC), 40 giờ (tắt ANC)","Công nghệ chống ồn":"Auto NC Optimizer 8 microphones","Kết nối":"Bluetooth 5.2, Multipoint Connection kết nối 2 thiết bị cùng lúc"}'
),
-- Món 4: Hàng C2C Sưu Tầm - Giày Air Jordan 1 Retro High OG Chicago
(
    'prod-sneaker-01', 'HYB-AJ1-CHI',
    'Giày Nike Air Jordan 1 Retro High OG Lost & Found (Chicago 2022) - Size 42',
    'Jordan 1 Lost & Found', 'nike-air-jordan-1-retro-lost-and-found-chicago',
    'cat-sneakers', 'u-seller-01', 'Nike', 0,
    'c2c', 99, 'LIKE NEW 99% PASS LƯỚT', 12500000, 9800000,
    1, 'assets/images/jordan-1.jpg',
    'Phiên bản huyền thoại Chicago phối màu kinh điển 1985. Da nứt cổ điển đặc trưng, đế vàng ngả màu vintage nguyên bản. Giày mua từ Nike SNKRS kèm hóa đơn đối chiếu, bao check legit trọn đời.',
    'Hộp carton vintage vàng nắp cam, Hóa đơn mua hàng thập niên 80s, Dây giày dự phòng đen/trắng',
    3, 'Bảo đảm hàng chính hãng trọn đời. Đền gấp 10 lần nếu phát hiện Fake.', 1, 9.9,
    1, 0, NULL, 15400, 2,
    5.0, 32, 'active',
    '["assets/images/jordan-1.jpg", "assets/images/jordan-2.jpg", "assets/images/jordan-3.jpg"]',
    '{"Kích thước (Size)":"42 EU // 8.5 US // 26.5 cm","Chất liệu":"Da thật cao cấp xử lý hiệu ứng Cracked Leather","Màu sắc":"Varsity Red / Black / Sail / Muslin","Mã phối màu":"DZ5485-612","Xuất xứ":"Gia công chính hãng Nike Việt Nam"}'
),
-- Món 5: Brand Mall - Máy Hút Bụi Cầm Tay Dyson V15 Detect
(
    'prod-life-01', 'HYB-DYS-V15',
    'Máy Hút Bụi Cầm Tay Không Dây Dyson V15 Detect Absolute Extra',
    'Dyson V15 Detect Extra', 'may-hut-bui-dyson-v15-detect-absolute-extra',
    'cat-lifestyle', 'u-admin-01', 'Dyson', 1,
    'mall', 100, 'MỚI 100% NGUYÊN KIỆN', 23990000, 19490000,
    20, 'assets/images/dyson-1.jpg',
    'Công nghệ laser chiếu sáng bụi ẩn siêu vi trên sàn cứng. Cảm biến Piezo đếm hạt bụi thời gian thực hiển thị trên màn hình LCD, lực hút siêu mạnh 240 AW với động cơ Dyson Hyperdymium.',
    'Đầu hút Fluffy Optic laser, Đầu Digital Motorbar gỡ rối, 6 đầu phụ kiện, Đế sạc treo tường',
    24, 'Bảo hành chính hãng Dyson Việt Nam 2 năm tại nhà', 1, 10.0,
    0, 0, NULL, 6420, 68,
    4.9, 41, 'active',
    '["assets/images/dyson-1.jpg", "assets/images/dyson-2.jpg"]',
    '{"Lực hút tối đa":"240 AW (Air Watts)","Thời lượng pin":"Lên tới 60 phút hoạt động liên tục","Dung tích hộp chứa bụi":"0.77 Lít","Trọng lượng thân máy":"3.0 kg","Màng lọc HEPA":"Lọc 99.99% bụi mịn kích thước tới 0.3 micromet"}'
);

-- ----------------------------------------------------------------------------
-- 5. NẠP ĐỀ XUẤT TRẢ GIÁ C2C (product_offers)
-- ----------------------------------------------------------------------------
INSERT INTO product_offers (
    id, product_id, buyer_id, seller_id, original_price, offered_price,
    discount_pct, buyer_message, seller_note, status, expires_at
) VALUES (
    'offer-01', 'prod-tech-02', 'u-buyer-01', 'u-seller-01',
    41500000, 39000000, 6,
    'Mình qua tận nơi lấy máy trong chiều nay được không shop? Bớt chút lộc may mắn nhé.',
    'Shop đồng ý mức giá 39.000.000₫. Bạn hãy hoàn tất thanh toán trước khi phiên hết hạn nhé.',
    'accepted', '2026-11-19 18:00:00'
);

-- ----------------------------------------------------------------------------
-- 6. NẠP MÃ ƯU ĐÃI, VOUCHER (vouchers)
-- ----------------------------------------------------------------------------
INSERT INTO vouchers (
    id, code, title, voucher_type, discount_value, min_order_value,
    max_discount_amount, usage_limit, usage_count, start_date, end_date, is_active
) VALUES
('vouch-01', 'FREESHIP', 'Miễn Phí Vận Chuyển Hỏa Tốc Toàn Quốc', 'freeship', 50000, 0, 50000, 10000, 842, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
('vouch-02', 'HYBRID50', 'Giảm 50.000₫ Cho Đơn Hàng Mua Sắm Từ 500k', 'fixed', 50000, 500000, 50000, 5000, 321, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
('vouch-03', 'VIP100', 'Đặc Quyền Hội Viên VIP: Giảm 100.000₫ Đơn Từ 2 Triệu', 'fixed', 100000, 2000000, 100000, 2000, 142, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1);

-- ----------------------------------------------------------------------------
-- 7. NẠP HÓA ĐƠN ĐƠN HÀNG (orders)
-- ----------------------------------------------------------------------------
INSERT INTO orders (
    id, order_code, buyer_id, subtotal, shipping_fee, discount_amount, total_amount,
    voucher_id, payment_method, payment_status, shipping_method,
    recipient_name, recipient_phone, shipping_address, buyer_note,
    vat_requested, vat_company_name, vat_tax_code, vat_company_address,
    status, step_index, completed_at
) VALUES (
    'ord-8492', 'HYB-8492', 'u-buyer-01',
    39690000, 0, 50000, 39640000,
    'vouch-02', 'NAPAS_ESCROW', 'held_in_escrow', 'express_2h',
    'Nguyễn Ngọc Phúc', '0901234567',
    'Căn hộ L81-2804, Tòa Landmark 81, Vinhomes Central Park, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    'Giao giờ hành chính, gọi điện trước 15 phút giúp mình.',
    1, 'CÔNG TY TNHH CÔNG NGHỆ & ĐẦU TƯ SỐ VIỆT NAM', '0316888999', 'Tòa Landmark 81, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    'shipping', 3, NULL
);

-- ----------------------------------------------------------------------------
-- 8. NẠP KIỆN HÀNG MULTI-VENDOR VỚI LỘ TRÌNH TRACKING JSON (order_parcels)
-- ----------------------------------------------------------------------------
INSERT INTO order_parcels (
    id, order_id, seller_id, parcel_code, parcel_type, carrier_name, tracking_code,
    shipping_fee, estimated_delivery, status, tracking_events
) VALUES (
    'parcel-8492-01', 'ord-8492', 'u-admin-01',
    'PKG-8492-MALL', 'mall_warehouse', 'Bưu Tá Hỏa Tốc HYBRID', 'VNPOST-889922',
    0, 'Hôm nay (Giao trước 17:30)', 'in_transit',
    '[{"time":"2026-11-18 09:00:00","status":"Xác nhận đơn hàng","description":"Kho Flagship Mall đã tiếp nhận đơn và in phiếu đóng gói.","location":"Tổng kho Mall Tân Bình, TP.HCM"},{"time":"2026-11-18 10:30:00","status":"Kiểm định xuất kho","description":"Hoàn tất quét mã Barcode ICAO & đối chiếu số IMEI.","location":"Trạm kiểm định xuất hàng"},{"time":"2026-11-18 11:45:00","status":"Đang phát hàng hỏa tốc","description":"Bưu tá Nguyễn Văn Hùng (0912 345 678) đang trên đường phát hỏa tốc.","location":"Quận Bình Thạnh, TP.HCM"}]'
);

-- ----------------------------------------------------------------------------
-- 9. NẠP CHI TIẾT MÓN HÀNG TRONG ĐƠN (order_items)
-- ----------------------------------------------------------------------------
INSERT INTO order_items (
    id, order_id, parcel_id, product_id, product_name, product_type, condition_pct,
    unit_price, quantity, total_price, variant_info, thumbnail_url
) VALUES
(
    'item-01', 'ord-8492', 'parcel-8492-01', 'prod-tech-01',
    'Apple iPhone 15 Pro Max 256GB - Titan Tự Nhiên', 'mall', 100,
    29890000, 1, 29890000, 'Titan Tự Nhiên, 256GB', 'assets/images/ip15-1.jpg'
),
(
    'item-02', 'ord-8492', 'parcel-8492-01', 'prod-sneaker-01',
    'Giày Nike Air Jordan 1 Retro High OG Chicago', 'c2c', 99,
    9800000, 1, 9800000, 'Size 42 EU / 8.5 US', 'assets/images/jordan-1.jpg'
);

-- ----------------------------------------------------------------------------
-- 10. NẠP LỊCH SỬ BIẾN ĐỘNG VÍ KÝ QUỸ (escrow_transactions)
-- ----------------------------------------------------------------------------
INSERT INTO escrow_transactions (
    id, user_id, order_id, transaction_code, transaction_type,
    amount, balance_after, memo, bank_reference_code, status
) VALUES
(
    'tx-01', 'u-buyer-01', 'ord-8492', 'TX-ESC-2026-8801',
    'hold_order', -39640000, 3200000,
    'Tạm giữ tiền thanh toán Napas Escrow đơn hàng HYB-8492 (Đồng kiểm khi nhận)',
    'NP2026111888992201', 'completed'
),
(
    'tx-02', 'u-seller-01', NULL, 'TX-ESC-2026-8802',
    'withdrawal', -5000000, 14500000,
    'Rút tiền ký quỹ doanh thu bán đồ cũ về tài khoản Vietcombank 0071000999999',
    'VCB-FT2611180012', 'completed'
);

-- ----------------------------------------------------------------------------
-- 11. NẠP PHÒNG TRANH CHẤP KÈM BẰNG CHỨNG & CHAT LOG JSON (disputes)
-- ----------------------------------------------------------------------------
INSERT INTO disputes (
    id, dispute_code, order_id, buyer_id, seller_id, reason, description,
    requested_refund, approved_refund, status, arbitrator_admin_id,
    admin_decision_summary, solution_code, resolved_at, evidences, messages
) VALUES (
    'dsp-01', 'DSP-2026-001', 'ord-8492', 'u-buyer-01', 'u-seller-01',
    'Hàng có vết cấn nhỏ ở góc máy không đúng mô tả',
    'Mình nhận máy và đồng kiểm cùng bưu tá, phát hiện góc dưới bên phải có vết xước dăm 2mm chưa nêu trong bài đăng. Đề xuất hỗ trợ giảm trừ 500.000₫.',
    500000, 500000, 'in_arbitration', 'u-admin-01',
    'Admin đã xem video mở hộp và biên bản đồng kiểm bưu tá. Đề xuất hai bên thống nhất phương án hoàn tiền một phần 500.000₫ từ ví ký quỹ.',
    'partial_refund', NULL,
    '[{"url":"https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80","type":"image","title":"Ảnh chụp vết xước thực tế góc máy"},{"url":"https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4","type":"video","title":"Video mở hộp đồng kiểm bưu tá VNPost"}]',
    '[{"sender_role":"buyer","text":"Chào shop và admin, mình gửi kèm ảnh và video mở hộp đồng kiểm lúc nhận hàng.","time":"2026-11-18 10:00:00"},{"sender_role":"seller","text":"Dạ em chào anh Phúc, có thể trong quá trình vận chuyển bưu kiện bị xóc nhẹ. Shop đồng ý trừ 500k gửi lại anh ạ.","time":"2026-11-18 10:15:00"},{"sender_role":"admin","text":"Admin xác nhận hai bên đã đạt thỏa thuận. Sàn sẽ hoàn 500.000₫ về ví của bạn Phúc và giải ngân phần còn lại cho shop.","time":"2026-11-18 10:30:00"}]'
);

-- ----------------------------------------------------------------------------
-- 12. NẠP ĐÁNH GIÁ NGƯỜI MUA THẬT (product_reviews)
-- ----------------------------------------------------------------------------
INSERT INTO product_reviews (
    id, product_id, order_id, user_id, rating, comment, has_photo,
    is_verified_buyer, seller_reply, seller_replied_at
) VALUES
(
    'rev-01', 'prod-tech-01', 'ord-8492', 'u-buyer-01', 5,
    'Hàng Brand Mall nguyên seal chuẩn chỉ! Giao hỏa tốc 2 tiếng đúng giờ, bưu tá nhiệt tình cho đồng kiểm thoải mái trước khi nhận.',
    1, 1, 'Cảm ơn bạn Phúc đã luôn tin tưởng và đồng hành cùng Flagship Mall chính hãng của Hybrid Store!',
    '2026-11-18 11:30:00'
),
(
    'rev-02', 'prod-tech-02', NULL, 'u-buyer-01', 5,
    'MacBook M3 Pro like new đẹp keng không tì vết. Pin 100% sạc ít lần đúng như shop cam kết. Rất an tâm khi có biên bản kiểm định 15 bước.',
    0, 1, 'Cảm ơn quý khách đã tin chọn sản phẩm tuyển chọn tại shop!',
    '2026-11-18 11:45:00'
);
