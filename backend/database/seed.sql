-- ============================================================================
-- DỰ ÁN: HYBRID.STORE — DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- MÔ TẢ: Nạp danh mục, thương hiệu, tài khoản, ví ký quỹ, voucher, sản phẩm,
--        đơn hàng và dữ liệu mẫu đầy đủ cho escrows, disputes, offers (ERD T31)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. DANH MỤC NGÀNH HÀNG (CATEGORIES)
INSERT OR IGNORE INTO categories (id, slug, name, icon, display_order) VALUES
('cat_tech', 'tech', 'Đồ Điện Tử & Hi-Tech', 'devices', 1),
('cat_audio', 'audio', 'Âm Thanh & Tai Nghe', 'headphones', 2),
('cat_gaming', 'gaming', 'Gaming Gear & Phím Cơ', 'sports_esports', 3),
('cat_sneakers', 'sneakers', 'Giày Sneaker Tuyển Chọn', 'steps', 4),
('cat_fashion', 'fashion', 'Thời Trang Cyberpunk', 'apparel', 5),
('cat_appliances', 'appliances', 'Gia Dụng Thông Minh', 'coffee_maker', 6),
('cat_watches', 'watches', 'Đồng Hồ & Phụ Kiện', 'watch', 7),
('cat_camera', 'camera', 'Máy Ảnh & Quay Chụp', 'photo_camera', 8);

-- 2. THƯƠNG HIỆU CHÍNH HÃNG (BRANDS)
INSERT OR IGNORE INTO brands (id, slug, name, logo_url, is_official_mall) VALUES
('br_apple', 'apple', 'Apple Official', 'assets/images/brands/apple.png', 1),
('br_sony', 'sony', 'Sony Flagship Store', 'assets/images/brands/sony.png', 1),
('br_dyson', 'dyson', 'Dyson Official Mall', 'assets/images/brands/dyson.png', 1),
('br_nike', 'nike', 'Nike Authentic', 'assets/images/brands/nike.png', 1),
('br_samsung', 'samsung', 'Samsung Brand Store', 'assets/images/brands/samsung.png', 1),
('br_dell', 'dell', 'Dell Technologies', 'assets/images/brands/dell.png', 1),
('br_nintendo', 'nintendo', 'Nintendo Official', 'assets/images/brands/nintendo.png', 1);

-- 3. TÀI KHOẢN MẪU (USERS)
-- Mật khẩu mặc định: 'Hybrid@2026' (đã hash bcrypt chuẩn)
INSERT OR IGNORE INTO users (id, email, phone, password_hash, full_name, role, avatar_url, is_active, email_verified, phone_verified, vip_points) VALUES
('u_admin_01', 'admin@hybrid.store', '0901000999', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Hà Quang Minh', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', 1, 1, 1, 99999),
('u_admin_02', 'arbitrator@hybrid.store', '0901000888', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Trần Minh Đức (Trọng Tài Sàn)', 'admin', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', 1, 1, 1, 50000),
('u_inspector_01', 'inspector@hybrid.store', '0901000777', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Đỗ Trọng Nghĩa (KTV-082)', 'inspector', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', 1, 1, 1, 12000),
('u_seller_01', 'seller@hybrid.store', '0912345678', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Việt Dũng Store', 'seller', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 1, 1, 1, 5400),
('u_buyer_01', 'buyer@hybrid.store', '0987654321', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Trần Thu Trang', 'buyer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', 1, 1, 1, 2500),
('u_buyer_02', 'phuc.nguyen@hybrid.store', '0912888999', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Nguyễn Ngọc Phúc', 'buyer', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', 1, 1, 1, 4200),
('u_buyer_03', 'quanghuy@hybrid.store', '0936112233', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Lê Quang Huy', 'buyer', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200', 1, 1, 1, 1800);

-- 4. HỒ SƠ KYC CCCD CỦA NGƯỜI BÁN
INSERT OR IGNORE INTO kyc_verifications (id, user_id, id_card_number, full_name_on_card, date_of_birth, gender, permanent_address, front_image_url, back_image_url, status, reviewed_by, reviewed_at) VALUES
('kyc_01', 'u_seller_01', '001095012345', 'NGUYỄN VIỆT DŨNG', '1995-10-15', 'Nam', 'Số 28, Ngõ 102 Mễ Trì Hạ, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'assets/images/kyc/cccd_front.jpg', 'assets/images/kyc/cccd_back.jpg', 'approved', 'u_admin_01', CURRENT_TIMESTAMP);

-- 5. SỔ ĐỊA CHỈ GIAO NHẬN (USER_ADDRESSES)
INSERT OR IGNORE INTO user_addresses (id, user_id, recipient_name, phone, province, district, ward, street_address, full_address, address_type, is_default) VALUES
('addr_01', 'u_buyer_01', 'Trần Thu Trang', '0987654321', 'Hà Nội', 'Quận Nam Từ Liêm', 'Phường Mễ Trì', 'Tầng 12, Tòa Keangnam Landmark 72, Đường Phạm Hùng', 'Tầng 12, Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'office', 1),
('addr_02', 'u_seller_01', 'Nguyễn Việt Dũng', '0912345678', 'Hà Nội', 'Quận Cầu Giấy', 'Phường Dịch Vọng Hậu', 'Số 18 Phố Duy Tân', 'Số 18 Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 'office', 1),
('addr_03', 'u_buyer_02', 'Nguyễn Ngọc Phúc', '0912888999', 'Hà Nội', 'Quận Nam Từ Liêm', 'Phường Mễ Trì', 'Tầng 18, Tòa Keangnam Landmark 72, Đường Phạm Hùng', 'Tầng 18, Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'office', 1),
('addr_04', 'u_buyer_03', 'Lê Quang Huy', '0936112233', 'TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', 'Số 45 Đường Lê Duẩn', 'Số 45 Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'home', 1);

-- 6. TÀI KHOẢN NGÂN HÀNG LIÊN KẾT (BANK_ACCOUNTS)
INSERT OR IGNORE INTO bank_accounts (id, user_id, bank_code, bank_name, account_number, account_holder, is_default) VALUES
('bank_01', 'u_seller_01', 'VCB', 'Ngân hàng Ngoại Thương Việt Nam (Vietcombank)', '0011004329988', 'NGUYEN VIET DUNG', 1),
('bank_02', 'u_buyer_01', 'TCB', 'Ngân hàng Kỹ Thương (Techcombank)', '19034567890123', 'TRAN THU TRANG', 1),
('bank_03', 'u_buyer_02', 'MB', 'Ngân hàng Quân Đội (MB Bank)', '09128889996868', 'NGUYEN NGOC PHUC', 1),
('bank_04', 'u_buyer_03', 'VPB', 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)', '234567890123', 'LE QUANG HUY', 1);

-- 7. VÍ KÝ QUỸ ĐẢM BẢO GIAO DỊCH (ESCROW_WALLETS)
INSERT OR IGNORE INTO escrow_wallets (id, user_id, available_balance, locked_balance, total_withdrawn) VALUES
('w_admin_01', 'u_admin_01', 1250000000, 45000000, 320000000),
('w_seller_01', 'u_seller_01', 34500000, 26990000, 85000000),
('w_buyer_01', 'u_buyer_01', 5000000, 0, 0),
('w_buyer_02', 'u_buyer_02', 2000000, 0, 0),
('w_buyer_03', 'u_buyer_03', 8500000, 0, 0);

-- 8. KHO VOUCHER KHUYẾN MÃI (VOUCHERS)
INSERT OR IGNORE INTO vouchers (id, code, title, voucher_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, start_date, end_date, is_active) VALUES
('v_free', 'FREESHIP', 'Miễn phí 100% cước giao hàng toàn quốc', 'freeship', 0, 0, 45000, 5000, 240, '2026-01-01', '2026-12-31', 1),
('v_50k', 'HYBRID50', 'Giảm 50.000₫ cho đơn hàng từ 500.000₫', 'fixed', 50000, 500000, 50000, 2000, 115, '2026-01-01', '2026-12-31', 1),
('v_welcome', 'WELCOME', 'Ưu đãi 10% cho khách hàng mới', 'percent', 10, 300000, 200000, 10000, 890, '2026-01-01', '2026-12-31', 1),
('v_vip100', 'VIP100', 'Giảm 100.000₫ đặc quyền thành viên VIP', 'fixed', 100000, 1000000, 100000, 500, 42, '2026-01-01', '2026-12-31', 1);

-- 9. SẢN PHẨM MẪU (PRODUCTS)
INSERT OR IGNORE INTO products (id, sku, name, short_name, slug, category_id, brand_id, seller_id, product_type, condition_pct, condition_label, original_price, selling_price, stock_quantity, thumbnail_url, description, accessories_included, warranty_months, inspection_passed, inspection_score, allow_offers, is_flash_sale, flash_sale_end, status) VALUES
-- Sản phẩm Mall B2C
('m01', 'HYB-MALL-001', 'Áo Khoác Bomber Cyberpunk J1A-GT Multi-Pocket', 'Bomber Cyberpunk J1A-GT', 'ao-khoac-bomber-cyberpunk-j1a-gt', 'cat_fashion', 'br_nike', 'u_admin_01', 'mall', 100, 'HÀNG MỚI 100% NGUYÊN SEAL', 5200000, 4690000, 15, 'assets/images/products/ao-khoac-bomber.png', 'Áo khoác phong cách tương lai công nghệ với chất liệu vải Gore-Tex 3 lớp chống nước tuyệt đối, tích hợp 12 ngăn chứa đồ công nghệ tiện lợi.', 'Hộp đựng chống ẩm, Thẻ bảo hành chính hãng, Dây đeo phong cách Sling', 12, 1, 10.0, 0, 1, '2026-12-31 23:59:59', 'active'),
('m02', 'HYB-MALL-002', 'Máy Hút Bụi Cầm Tay Không Dây Dyson V12 Detect Slim', 'Dyson V12 Detect Slim', 'may-hut-bui-dyson-v12-detect-slim', 'cat_appliances', 'br_dyson', 'u_admin_01', 'mall', 100, 'HÀNG MỚI 100% NGUYÊN SEAL', 19990000, 16990000, 8, 'assets/images/products/dyson-v12.png', 'Đầu hút laser phát hiện bụi bẩn siêu vi, lực hút xoáy 150AW cực mạnh, thời lượng pin 60 phút liên tục.', 'Bộ 5 đầu hút chuyên dụng, Giá treo tường tích hợp sạc, Củ sạc nhanh', 24, 1, 10.0, 0, 0, NULL, 'active'),
('m03', 'HYB-MALL-003', 'Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5', 'Sony WH-1000XM5', 'tai-nghe-sony-wh-1000xm5', 'cat_audio', 'br_sony', 'u_admin_01', 'mall', 100, 'HÀNG MỚI 100% NGUYÊN SEAL', 8990000, 7490000, 20, 'assets/images/products/sony-wh1000xm5.png', 'Chống ồn chủ động đỉnh cao số 1 thế giới với bộ xử lý kép V1 + QN1, đàm thoại 8 micro khử tiếng ồn.', 'Bao da cao cấp, Cáp âm thanh 3.5mm mạ vàng, Cáp sạc Type-C', 12, 1, 10.0, 0, 1, '2026-12-31 23:59:59', 'active'),

-- Sản phẩm C2C Like New Tuyển Chọn (hỗ trợ trả giá Offers)
('c01', 'HYB-C2C-001', 'iPhone 15 Pro Max 256GB Titan Tự Nhiên (Like New 99%)', 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb-titan-99', 'cat_tech', 'br_apple', 'u_seller_01', 'c2c', 99, 'LIKE NEW 99% MỚI', 29990000, 21990000, 1, 'assets/images/products/iphone-15-pro-max.png', 'Máy người dùng nâng cấp lên đời, pin 98%, nguyên bản 100% chưa qua sửa chữa, đã vượt qua 15 bước kiểm định nghiêm ngặt.', 'Cáp sạc bọc dù zin theo máy, Giấy chứng nhận kiểm định Hybrid 15 bước', 6, 1, 9.8, 1, 0, NULL, 'active'),
('c02', 'HYB-C2C-002', 'Máy Chơi Game Nintendo Switch OLED Model White (Like New 98%)', 'Nintendo Switch OLED', 'nintendo-switch-oled-white-98', 'cat_gaming', 'br_nintendo', 'u_seller_01', 'c2c', 98, 'LIKE NEW 98% MỚI', 8500000, 5800000, 1, 'assets/images/products/nintendo-switch-oled.png', 'Màn hình OLED 7 inch rực rỡ không điểm chết, Joy-Con nhạy bén không trôi analog, thân máy đẹp keng không trầy xước.', 'Dock xuất TV, Củ sạc zin, Cáp HDMI tốc độ cao, Grip tay cầm', 3, 1, 9.7, 1, 1, '2026-12-31 23:59:59', 'active'),
('c03', 'HYB-C2C-003', 'Body Máy Ảnh Sony Alpha A7 Mark IV Fullbox (Like New 99%)', 'Sony Alpha A7 Mark IV', 'sony-alpha-a7-mark-iv-fullbox-99', 'cat_camera', 'br_sony', 'u_seller_01', 'c2c', 99, 'LIKE NEW 99% MỚI', 45900000, 37800000, 1, 'assets/images/products/images (10).jpg', 'Body Sony A7M4 chụp dưới 3.500 shot, cảm biến sạch không điểm chết, fullbox chính hãng Sony Việt Nam.', 'Pin NP-FZ100 zin, Dây đeo Sony, Cáp Type-C, Hộp và sách hướng dẫn', 6, 1, 9.9, 1, 0, NULL, 'active'),
('c04', 'HYB-C2C-004', 'Giày Sneaker Chunky Sole Hypebeast Size 42 (Like New 95%)', 'Sneaker Chunky Sole 95%', 'giay-sneaker-chunky-sole-hypebeast-95', 'cat_sneakers', 'br_nike', 'u_seller_01', 'c2c', 95, 'LIKE NEW 95% MỚI', 3800000, 2250000, 1, 'assets/images/products/giay-the-thao-nam-sneaker-de-day.png', 'Giày chính hãng đã qua kiểm định UV tem giày, đế còn mới 95%, đã vệ sinh spa khử khuẩn trước khi niêm phong.', 'Hộp gốc, Dây giày dự phòng, Thẻ check legit Hybrid', 3, 1, 9.5, 1, 0, NULL, 'active');

-- 10. BỘ SƯU TẬP ẢNH SẢN PHẨM (PRODUCT_IMAGES)
INSERT OR IGNORE INTO product_images (id, product_id, image_url, is_cover, display_order) VALUES
('img_m01_1', 'm01', 'assets/images/products/ao-khoac-bomber.png', 1, 1),
('img_m02_1', 'm02', 'assets/images/products/dyson-v12.png', 1, 1),
('img_m03_1', 'm03', 'assets/images/products/sony-wh1000xm5.png', 1, 1),
('img_c01_1', 'c01', 'assets/images/products/iphone-15-pro-max.png', 1, 1),
('img_c02_1', 'c02', 'assets/images/products/nintendo-switch-oled.png', 1, 1),
('img_c03_1', 'c03', 'assets/images/products/images (10).jpg', 1, 1),
('img_c04_1', 'c04', 'assets/images/products/giay-the-thao-nam-sneaker-de-day.png', 1, 1);

-- 11. THÔNG SỐ KỸ THUẬT (PRODUCT_SPECS)
INSERT OR IGNORE INTO product_specs (id, product_id, spec_key, spec_value, group_name, display_order) VALUES
('spec_c01_1', 'c01', 'Màn hình', '6.7 inch Super Retina XDR OLED 120Hz ProMotion', 'Hiển thị', 1),
('spec_c01_2', 'c01', 'Vi xử lý', 'Apple A17 Pro tiến trình 3nm siêu mạnh mẽ', 'Hiệu năng', 2),
('spec_c01_3', 'c01', 'Dung lượng Pin', 'Tình trạng thực tế 98% (Chu kỳ sạc 45 lần)', 'Pin & Nguồn', 3),
('spec_c01_4', 'c01', 'Camera sau', '48MP Chính + 12MP Siêu rộng + 12MP Tele 5x quang học', 'Quang học', 4);

-- 12. ĐƠN HÀNG MẪU (ORDERS, ORDER_PARCELS, ORDER_ITEMS, ORDER_TRACKING_EVENTS)
INSERT OR IGNORE INTO orders (id, order_code, buyer_id, subtotal, shipping_fee, discount_amount, total_amount, voucher_id, payment_method, payment_status, shipping_method, recipient_name, recipient_phone, shipping_address, buyer_note, status, step_index, completed_at, cancelled_at, cancel_reason, created_at, updated_at) VALUES
('ord_01', 'ORD-20261108-9841', 'u_buyer_02', 21990000, 0, 500000, 21490000, 'v_vip100', 'NAPAS_ESCROW', 'held_in_escrow', 'express_2h', 'Nguyễn Ngọc Phúc', '0912888999', 'Tầng 18, Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'Yêu cầu đồng kiểm cùng bưu tá trước khi nhận máy', 'disputed', 4, NULL, NULL, '', '2026-11-08 09:00:00', '2026-11-08 15:30:00'),
('ord_02', 'ORD-20261105-7720', 'u_buyer_01', 2250000, 0, 0, 2250000, 'v_free', 'NAPAS_ESCROW', 'paid', 'standard', 'Trần Thu Trang', '0987654321', 'Tầng 12, Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'Giao giờ hành chính', 'completed', 4, '2026-11-12 15:20:00', NULL, '', '2026-11-05 09:15:00', '2026-11-12 15:20:00'),
('ord_03', 'ORD-20261114-8832', 'u_buyer_01', 5500000, 0, 0, 5500000, 'v_free', 'VIETQR', 'held_in_escrow', 'express_2h', 'Trần Thu Trang', '0987654321', 'Tầng 12, Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'Đơn chốt từ thương lượng trả giá OFF-20261113-03', 'shipping', 3, NULL, NULL, '', '2026-11-14 08:15:00', '2026-11-15 10:00:00'),
('ord_04', 'ORD-20261102-6610', 'u_buyer_03', 7490000, 0, 0, 7490000, 'v_free', 'NAPAS_ESCROW', 'refunded', 'standard', 'Lê Quang Huy', '0936112233', 'Số 45 Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Đóng gói chống sốc kỹ', 'cancelled', 4, NULL, '2026-11-04 14:25:00', 'Hộp sản phẩm móp nặng khi vận chuyển — hoàn tiền 100% theo phán quyết tranh chấp', '2026-11-02 10:00:00', '2026-11-04 14:25:00'),
('ord_05', 'ORD-20261110-7105', 'u_buyer_03', 4690000, 0, 0, 4690000, NULL, 'CARD', 'paid', 'standard', 'Lê Quang Huy', '0936112233', 'Số 45 Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', '', 'completed', 4, '2026-11-12 16:30:00', NULL, '', '2026-11-10 11:20:00', '2026-11-12 16:30:00'),
('ord_06', 'ORD-20261116-9012', 'u_buyer_02', 16990000, 0, 0, 16990000, NULL, 'NAPAS_ESCROW', 'held_in_escrow', 'standard', 'Nguyễn Ngọc Phúc', '0912888999', 'Tầng 18, Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'Gọi trước khi giao 15 phút', 'disputed', 4, NULL, NULL, '', '2026-11-16 09:00:00', '2026-11-18 10:15:00');

INSERT OR IGNORE INTO order_parcels (id, order_id, seller_id, parcel_code, parcel_type, carrier_name, tracking_code, shipping_fee, estimated_delivery, status, created_at) VALUES
('pcl_01', 'ord_01', 'u_seller_01', 'PCL-9841-01', 'c2c_seller', 'VNPost Hỏa Tốc', 'VNPOST-HN-884920', 0, 'Trong ngày 08/11/2026', 'delivered', '2026-11-08 10:00:00'),
('pcl_02', 'ord_02', 'u_seller_01', 'PCL-7720-01', 'c2c_seller', 'VNPost Hỏa Tốc', 'VNPOST-HY-112349', 0, '07/11/2026', 'delivered', '2026-11-05 11:00:00'),
('pcl_03', 'ord_03', 'u_seller_01', 'PCL-8832-01', 'c2c_seller', 'GHTK Siêu Tốc 2H', 'GHTK-HN-992140', 0, '16/11/2026', 'in_transit', '2026-11-14 09:30:00'),
('pcl_04', 'ord_04', 'u_admin_01', 'PCL-6610-01', 'mall_warehouse', 'VNPost Nhanh Toàn Quốc', 'VNPOST-HCM-661022', 0, '04/11/2026', 'returned', '2026-11-02 12:00:00'),
('pcl_05', 'ord_05', 'u_admin_01', 'PCL-7105-01', 'mall_warehouse', 'Viettel Post Express', 'VTPOST-HCM-710588', 0, '12/11/2026', 'delivered', '2026-11-10 13:00:00'),
('pcl_06', 'ord_06', 'u_admin_01', 'PCL-9012-01', 'mall_warehouse', 'VNPost Nhanh Toàn Quốc', 'VNPOST-HN-901244', 0, '18/11/2026', 'delivered', '2026-11-16 11:00:00');

INSERT OR IGNORE INTO order_items (id, order_id, parcel_id, product_id, product_name, product_type, condition_pct, unit_price, quantity, total_price, variant_info, thumbnail_url) VALUES
('oi_01', 'ord_01', 'pcl_01', 'c01', 'iPhone 15 Pro Max 256GB Titan Tự Nhiên (Like New 99%)', 'c2c', 99, 21990000, 1, 21990000, 'Titan Tự Nhiên • 256GB', 'assets/images/products/iphone-15-pro-max.png'),
('oi_02', 'ord_02', 'pcl_02', 'c04', 'Giày Sneaker Chunky Sole Hypebeast Size 42 (Like New 95%)', 'c2c', 95, 2250000, 1, 2250000, 'Size 42 • Trắng/Xám', 'assets/images/products/giay-the-thao-nam-sneaker-de-day.png'),
('oi_03', 'ord_03', 'pcl_03', 'c02', 'Máy Chơi Game Nintendo Switch OLED Model White (Like New 98%)', 'c2c', 98, 5500000, 1, 5500000, 'OLED White • Giá chốt Offer', 'assets/images/products/nintendo-switch-oled.png'),
('oi_04', 'ord_04', 'pcl_04', 'm03', 'Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5', 'mall', 100, 7490000, 1, 7490000, 'Màu Đen • Nguyên Seal', 'assets/images/products/sony-wh1000xm5.png'),
('oi_05', 'ord_05', 'pcl_05', 'm01', 'Áo Khoác Bomber Cyberpunk J1A-GT Multi-Pocket', 'mall', 100, 4690000, 1, 4690000, 'Size L • All Black', 'assets/images/products/ao-khoac-bomber.png'),
('oi_06', 'ord_06', 'pcl_06', 'm02', 'Máy Hút Bụi Cầm Tay Không Dây Dyson V12 Detect Slim', 'mall', 100, 16990000, 1, 16990000, 'Bản Quốc Tế • 5 Đầu Hút', 'assets/images/products/dyson-v12.png');

INSERT OR IGNORE INTO order_tracking_events (id, parcel_id, status_title, status_description, location, shipper_name, shipper_phone, event_time) VALUES
('trk_01', 'pcl_01', 'Đã niêm phong tem QR & rời kho kiểm định', 'KTV-082 Đỗ Trọng Nghĩa đã dán tem màng vỡ QR-HYBRID-884920 và bàn giao VNPost', 'Trung tâm kiểm định HYBRID Cầu Giấy, HN', 'Hoàng Văn Thắng', '0918223344', '2026-11-08 11:30:15'),
('trk_02', 'pcl_01', 'Đã giao & lập biên bản đồng kiểm tại chỗ', 'Khách hàng mở hộp đồng kiểm cùng bưu tá, phát hiện vết cấn 1.5mm và yêu cầu mở tranh chấp', 'Keangnam Landmark 72, Nam Từ Liêm, HN', 'Hoàng Văn Thắng', '0918223344', '2026-11-08 15:20:00'),
('trk_03', 'pcl_03', 'Đang trung chuyển tới bưu cục phát', 'Bưu kiện đã rời kho phân loại Cầu Giấy, dự kiến giao trong 2 giờ', 'Bưu cục Nam Từ Liêm, HN', 'Nguyễn Văn Hùng', '0919556677', '2026-11-15 09:45:00');

-- ============================================================================
-- 13. DỮ LIỆU MẪU BẢNG OFFERS (THƯƠNG LƯỢNG & TRẢ GIÁ C2C — ĐỦ 6 TRẠNG THÁI)
-- ============================================================================
INSERT OR IGNORE INTO offers (id, offer_code, product_id, buyer_id, seller_id, order_id, original_price, offered_price, counter_price, final_agreed_price, discount_pct, buyer_message, seller_note, status, expires_at, responded_at, created_at, updated_at) VALUES
-- 1. pending: Chờ người bán phản hồi
('off_01', 'OFF-20261117-01', 'c03', 'u_buyer_03', 'u_seller_01', NULL, 37800000, 34000000, NULL, NULL, 10, 'Em qua xem máy trực tiếp tại showroom lấy luôn trong chiều nay ạ, bác bớt chút lộc lá cho em nhé!', '', 'pending', '2026-11-19 18:00:00', NULL, '2026-11-17 18:00:00', '2026-11-17 18:00:00'),
-- 2. countered: Người bán đề nghị mức giá mới (counter-offer)
('off_02', 'OFF-20261117-02', 'c01', 'u_buyer_01', 'u_seller_01', NULL, 21990000, 20500000, 21200000, NULL, 7, 'Bác để em tròn 20.5 triệu em cọc chuyển khoản Escrow luôn tối nay bác nhé!', 'Máy pin 98% đã test 15 bước, mình hỗ trợ giảm tối đa còn 21.2 triệu kèm miễn phí ship hỏa tốc nhé bạn.', 'countered', '2026-11-19 20:00:00', '2026-11-17 20:15:00', '2026-11-17 19:30:00', '2026-11-17 20:15:00'),
-- 3. accepted: Đã chốt giá thành công & sinh đơn hàng ord_03
('off_03', 'OFF-20261113-03', 'c02', 'u_buyer_01', 'u_seller_01', 'ord_03', 5800000, 5500000, NULL, 5500000, 5, 'Mình đặt cọc thanh toán VietQR ngay nếu shop chốt 5.5 triệu nhé.', 'Ok chốt giá 5.500.000₫ cho bạn, hệ thống đã tạo đơn hàng ORD-20261114-8832!', 'accepted', '2026-11-14 14:00:00', '2026-11-13 15:10:00', '2026-11-13 14:00:00', '2026-11-13 15:10:00'),
-- 4. rejected: Người bán từ chối vì giá thấp
('off_04', 'OFF-20261112-04', 'c01', 'u_buyer_03', 'u_seller_01', NULL, 21990000, 15000000, NULL, NULL, 32, 'Shop để mình 15 triệu được không?', 'Cảm ơn bạn quan tâm, mức giá này thấp hơn nhiều so với giá nhập kiểm định nên shop không thể chốt ạ.', 'rejected', '2026-11-13 10:00:00', '2026-11-12 11:00:00', '2026-11-12 10:00:00', '2026-11-12 11:00:00'),
-- 5. expired: Quá hạn 24h chưa có phản hồi
('off_05', 'OFF-20261110-05', 'c02', 'u_buyer_02', 'u_seller_01', NULL, 5800000, 5200000, NULL, NULL, 10, '5.2 triệu mình qua lấy trong ngày mai nhé shop.', '', 'expired', '2026-11-11 09:00:00', NULL, '2026-11-10 09:00:00', '2026-11-11 09:00:05'),
-- 6. cancelled: Người mua chủ động rút đề nghị
('off_06', 'OFF-20261111-06', 'c04', 'u_buyer_03', 'u_seller_01', NULL, 2250000, 1950000, NULL, NULL, 13, 'Đôi này 1tr950 được không shop ơi?', '', 'cancelled', '2026-11-12 16:00:00', NULL, '2026-11-11 16:00:00', '2026-11-11 16:45:00');

-- ============================================================================
-- 14. DỮ LIỆU MẪU BẢNG ESCROWS & ESCROW_TRANSACTIONS (ĐỦ CÁC TRẠNG THÁI KÝ QUỸ)
-- ============================================================================
INSERT OR IGNORE INTO escrows (id, escrow_code, order_id, buyer_id, seller_id, seller_wallet_id, amount, platform_fee, net_payout_amount, refunded_amount, payment_channel, bank_reference_code, status, hold_reason, held_at, auto_release_at, frozen_at, released_at, refunded_at, created_at, updated_at) VALUES
-- 1. frozen: Đóng băng 21.490.000₫ chờ phân xử tranh chấp DSP-20261108-01
('esc_01', 'ESC-20261108-9841', 'ord_01', 'u_buyer_02', 'u_seller_01', 'w_seller_01', 21490000, 644700, 0, 0, 'NAPAS_ESCROW', 'NAPAS-20261108-984101', 'frozen', 'Đóng băng theo hồ sơ tranh chấp DSP-20261108-01 (vết cấn viền camera 1.5mm)', '2026-11-08 09:02:00', '2026-11-15 15:20:00', '2026-11-08 15:35:00', NULL, NULL, '2026-11-08 09:00:00', '2026-11-08 15:35:00'),
-- 2. released: Đã giải ngân cho người bán sau khi người mua xác nhận nhận hàng
('esc_02', 'ESC-20261105-7720', 'ord_02', 'u_buyer_01', 'u_seller_01', 'w_seller_01', 2250000, 67500, 2182500, 0, 'NAPAS_ESCROW', 'NAPAS-20261105-772002', 'released', '', '2026-11-05 09:16:00', '2026-11-12 15:20:00', NULL, '2026-11-12 15:20:00', NULL, '2026-11-05 09:15:00', '2026-11-12 15:20:00'),
-- 3. holding: Đang tạm giữ an toàn trong lúc vận chuyển đơn hàng chốt từ Offer
('esc_03', 'ESC-20261114-8832', 'ord_03', 'u_buyer_01', 'u_seller_01', 'w_seller_01', 5500000, 165000, 0, 0, 'VIETQR', 'VIETQR-20261114-883203', 'holding', 'Tạm giữ 7 ngày bảo vệ người mua trong quá trình giao nhận & đồng kiểm', '2026-11-14 08:17:00', '2026-11-23 08:17:00', NULL, NULL, NULL, '2026-11-14 08:15:00', '2026-11-14 08:17:00'),
-- 4. refunded: Đã hoàn tiền 100% cho người mua sau khi khiếu nại được chấp thuận
('esc_04', 'ESC-20261102-6610', 'ord_04', 'u_buyer_03', 'u_admin_01', 'w_admin_01', 7490000, 0, 0, 7490000, 'NAPAS_ESCROW', 'NAPAS-REF-20261104-6610', 'refunded', 'Hoàn tiền 100% theo phán quyết DSP-20261102-02', '2026-11-02 10:02:00', '2026-11-09 10:02:00', '2026-11-03 18:00:00', NULL, '2026-11-04 14:25:00', '2026-11-02 10:00:00', '2026-11-04 14:25:00'),
-- 5. partially_refunded: Hoàn 500.000₫ cho người mua & giải ngân 4.049.300₫ cho người bán (phí sàn 140.700₫)
('esc_05', 'ESC-20261110-7105', 'ord_05', 'u_buyer_03', 'u_admin_01', 'w_admin_01', 4690000, 140700, 4049300, 500000, 'CARD', 'CARD-PART-20261112-7105', 'partially_refunded', 'Hoàn một phần 500.000₫ (thiếu dây đeo Sling) theo phán quyết DSP-20261110-03', '2026-11-10 11:22:00', '2026-11-17 11:22:00', '2026-11-11 14:00:00', '2026-11-12 16:20:00', '2026-11-12 16:15:00', '2026-11-10 11:20:00', '2026-11-12 16:20:00'),
-- 6. frozen (vụ mới mở pending): Đang tạm khóa chờ xử lý khiếu nại DSP-20261118-04
('esc_06', 'ESC-20261116-9012', 'ord_06', 'u_buyer_02', 'u_admin_01', 'w_admin_01', 16990000, 509700, 0, 0, 'NAPAS_ESCROW', 'NAPAS-20261116-901206', 'frozen', 'Tự động đóng băng khi người mua mở khiếu nại DSP-20261118-04', '2026-11-16 09:05:00', '2026-11-25 09:05:00', '2026-11-18 10:15:00', NULL, NULL, '2026-11-16 09:00:00', '2026-11-18 10:15:00');

INSERT OR IGNORE INTO escrow_transactions (id, wallet_id, escrow_id, order_id, transaction_code, transaction_type, amount, balance_after, memo, bank_reference_code, status, created_at) VALUES
('tx_01', 'w_seller_01', 'esc_01', 'ord_01', 'TX-ESC-2026-0001', 'hold_order', 21490000, 34500000, 'Tạm giữ ký quỹ đơn hàng ORD-20261108-9841 (iPhone 15 Pro Max)', 'NAPAS-20261108-984101', 'completed', '2026-11-08 09:02:00'),
('tx_02', 'w_seller_01', 'esc_01', 'ord_01', 'TX-ESC-2026-0002', 'freeze_dispute', -21490000, 34500000, 'Đóng băng khoản ký quỹ ORD-20261108-9841 do tranh chấp DSP-20261108-01', 'DSP-LOCK-9841', 'completed', '2026-11-08 15:35:00'),
('tx_03', 'w_seller_01', 'esc_02', 'ord_02', 'TX-ESC-2026-0003', 'release_payout', 2182500, 34500000, 'Giải ngân tiền hàng sau phí sàn 3% đơn ORD-20261105-7720', 'ESCROW-REL-99214', 'completed', '2026-11-12 15:20:00'),
('tx_04', 'w_seller_01', 'esc_03', 'ord_03', 'TX-ESC-2026-0004', 'hold_order', 5500000, 34500000, 'Tạm giữ ký quỹ VietQR đơn ORD-20261114-8832 (Nintendo Switch OLED)', 'VIETQR-20261114-883203', 'completed', '2026-11-14 08:17:00'),
('tx_05', 'w_buyer_03', 'esc_04', 'ord_04', 'TX-ESC-2026-0005', 'refund_buyer', 7490000, 8500000, 'Hoàn tiền 100% đơn ORD-20261102-6610 theo phán quyết DSP-20261102-02', 'NAPAS-REF-20261104-6610', 'completed', '2026-11-04 14:25:00'),
('tx_06', 'w_buyer_03', 'esc_05', 'ord_05', 'TX-ESC-2026-0006', 'refund_buyer', 500000, 9000000, 'Hoàn một phần 500.000₫ đơn ORD-20261110-7105 theo phán quyết DSP-20261110-03', 'CARD-PART-20261112-7105', 'completed', '2026-11-12 16:15:00');

-- ============================================================================
-- 15. DỮ LIỆU MẪU BẢNG DISPUTES, DISPUTE_EVIDENCES & DISPUTE_MESSAGES
-- ============================================================================
INSERT OR IGNORE INTO disputes (id, dispute_code, order_id, escrow_id, buyer_id, seller_id, reason_category, reason, description, requested_refund, approved_refund, status, priority, arbitrator_admin_id, admin_decision_summary, solution_code, sla_deadline_at, resolved_at, created_at, updated_at) VALUES
-- 1. in_arbitration: Hồ sơ trọng điểm khớp trang dispute.html (#DSP-20261108-01)
('dsp_01', 'DSP-20261108-01', 'ord_01', 'esc_01', 'u_buyer_02', 'u_seller_01', 'not_as_described', 'Ngoại quan viền camera có vết cấn 1.5mm không đúng cam kết Like New 99%', 'Khách hàng mở hộp đồng kiểm dưới sự chứng kiến của bưu tá VNPost Hoàng Văn Thắng. Tem màng vỡ QR-HYBRID-884920 nguyên vẹn nhưng viền camera góc trên bên phải có vết cấn 1.5mm sâu 0.15mm. Máy chưa kích hoạt, yêu cầu hoàn tiền 100% hoặc đổi máy khác.', 21490000, 0, 'in_arbitration', 'high', 'u_admin_01', 'Trọng tài đã xác minh video mở hộp 4K và biên bản đồng kiểm VNPost. Đang chờ các bên ký duyệt phương án hòa giải.', '', '2026-11-10 15:30:00', NULL, '2026-11-08 15:30:00', '2026-11-08 17:00:00'),
-- 2. closed: Đã hoàn tất hoàn tiền 100% và đóng hồ sơ
('dsp_02', 'DSP-20261102-02', 'ord_04', 'esc_04', 'u_buyer_03', 'u_admin_01', 'damaged_in_transit', 'Hộp tai nghe Sony WH-1000XM5 bị móp nặng và rách seal khi giao', 'Khi nhận kiện hàng từ đơn vị vận chuyển, góc hộp bị va đập mạnh làm biến dạng hộp cứng và bung seal niêm phong nhà sản xuất.', 7490000, 7490000, 'closed', 'high', 'u_admin_02', 'Phê duyệt hoàn tiền 100% (7.490.000₫) qua Napas 24/7 và thu hồi hàng về kho Mall miễn phí.', 'full_refund', '2026-11-05 18:00:00', '2026-11-04 14:20:00', '2026-11-03 18:00:00', '2026-11-04 14:25:00'),
-- 3. resolved: Đã ra phán quyết hoàn một phần (partial_refund)
('dsp_03', 'DSP-20261110-03', 'ord_05', 'esc_05', 'u_buyer_03', 'u_admin_01', 'missing_accessories', 'Thiếu dây đeo phong cách Sling đi kèm áo khoác Bomber', 'Áo khoác đúng size và chất lượng tốt nhưng trong hộp thiếu dây đeo Sling như mô tả phụ kiện đi kèm.', 1000000, 500000, 'resolved', 'normal', 'u_admin_02', 'Hai bên đồng thuận phương án hoàn tiền một phần 500.000₫, người mua giữ lại sản phẩm.', 'partial_refund', '2026-11-13 14:00:00', '2026-11-12 16:00:00', '2026-11-11 14:00:00', '2026-11-12 16:20:00'),
-- 4. pending: Hồ sơ mới tạo, chờ người bán phản hồi
('dsp_04', 'DSP-20261118-04', 'ord_06', 'esc_06', 'u_buyer_02', 'u_admin_01', 'missing_accessories', 'Thiếu 01 đầu hút khe hẹp trong bộ 5 đầu hút Dyson V12', 'Mở hộp kiểm tra thấy có 4 đầu hút thay vì 5 đầu hút như mô tả. Đề nghị shop gửi bù đầu hút hoặc hỗ trợ hoàn tiền chênh lệch.', 1500000, 0, 'pending', 'normal', NULL, '', '', '2026-11-20 10:15:00', NULL, '2026-11-18 10:15:00', '2026-11-18 10:15:00');

INSERT OR IGNORE INTO dispute_evidences (id, dispute_id, uploaded_by_user_id, media_url, media_type, title, file_size_kb, created_at) VALUES
('evd_01', 'dsp_01', 'u_buyer_02', 'https://cdn.hybrid.store/disputes/dsp_01/unbox_4k_dong_kiem.mp4', 'video', 'Video mở hộp 4K đồng kiểm cùng bưu tá VNPost', 48200, '2026-11-08 15:31:00'),
('evd_02', 'dsp_01', 'u_buyer_02', 'https://cdn.hybrid.store/disputes/dsp_01/IMG_MACRO_08112026.jpg', 'image', 'Ảnh chụp macro vết cấn viền camera 1.5mm', 4350, '2026-11-08 15:32:00'),
('evd_03', 'dsp_01', 'u_buyer_02', 'https://cdn.hybrid.store/disputes/dsp_01/BB-DK-884920-VNPOST.pdf', 'pdf', 'Biên bản đồng kiểm BB-DK-884920/VNPOST có chữ ký 2 bên', 620, '2026-11-08 15:33:00'),
('evd_04', 'dsp_01', 'u_seller_01', 'https://cdn.hybrid.store/disputes/dsp_01/pre_ship_qr_seal_884920.jpg', 'image', 'Ảnh chụp sản phẩm trước khi dán tem niêm phong QR tại kho', 3120, '2026-11-08 16:05:00'),
('evd_05', 'dsp_04', 'u_buyer_02', 'https://cdn.hybrid.store/disputes/dsp_04/dyson_box_accessories.jpg', 'image', 'Ảnh chụp thực tế 4 đầu hút nhận được trong hộp Dyson V12', 2890, '2026-11-18 10:16:00');

INSERT OR IGNORE INTO dispute_messages (id, dispute_id, sender_id, sender_role, message_text, attachment_url, created_at) VALUES
('msg_01', 'dsp_01', 'u_buyer_02', 'buyer', 'Mình đã mở hộp đồng kiểm cùng bưu tá và quay video 4K. Viền camera có vết cấn 1.5mm không đúng mô tả Like New 99%. Mong sàn hỗ trợ hoàn tiền 100%.', 'https://cdn.hybrid.store/disputes/dsp_01/IMG_MACRO_08112026.jpg', '2026-11-08 15:35:00'),
('msg_02', 'dsp_01', 'u_seller_01', 'seller', 'Chào bạn Phúc, shop thành thật xin lỗi về sơ suất kiểm tra ngoại quan. Shop sẵn sàng hỗ trợ phương án Hoàn tiền 100% hoặc đổi máy Like New 99.9% khác trong 24h ạ.', '', '2026-11-08 16:10:00'),
('msg_03', 'dsp_01', 'u_admin_01', 'admin', 'Trọng tài sàn đã đóng băng khoản ký quỹ 21.490.000₫ (ESC-20261108-9841) và xác nhận video đồng kiểm hợp lệ. Mời hai bên chọn phương án hòa giải và ký biên bản điện tử.', '', '2026-11-08 16:45:00');
