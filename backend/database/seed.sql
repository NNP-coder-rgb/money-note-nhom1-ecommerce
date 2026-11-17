-- ============================================================================
-- DỰ ÁN: HYBRID.STORE — DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- MÔ TẢ: Nạp danh mục, thương hiệu, tài khoản quản trị/người bán/người mua, ví ký quỹ, voucher và sản phẩm mẫu
-- ============================================================================

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
('u_seller_01', 'seller@hybrid.store', '0912345678', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Việt Dũng Store', 'seller', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 1, 1, 1, 5400),
('u_buyer_01', 'buyer@hybrid.store', '0987654321', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Trần Thu Trang', 'buyer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', 1, 1, 1, 2500);

-- 4. HỒ SƠ KYC CCCD CỦA NGƯỜI BÁN
INSERT OR IGNORE INTO kyc_verifications (id, user_id, id_card_number, full_name_on_card, date_of_birth, gender, permanent_address, front_image_url, back_image_url, status, reviewed_by, reviewed_at) VALUES
('kyc_01', 'u_seller_01', '001095012345', 'NGUYỄN VIỆT DŨNG', '1995-10-15', 'Nam', 'Số 28, Ngõ 102 Mễ Trì Hạ, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'assets/images/kyc/cccd_front.jpg', 'assets/images/kyc/cccd_back.jpg', 'approved', 'u_admin_01', CURRENT_TIMESTAMP);

-- 5. SỔ ĐỊA CHỈ GIAO NHẬN (USER_ADDRESSES)
INSERT OR IGNORE INTO user_addresses (id, user_id, recipient_name, phone, province, district, ward, street_address, full_address, address_type, is_default) VALUES
('addr_01', 'u_buyer_01', 'Trần Thu Trang', '0987654321', 'Hà Nội', 'Quận Nam Từ Liêm', 'Phường Mễ Trì', 'Tầng 12, Tòa Keangnam Landmark 72, Đường Phạm Hùng', 'Tầng 12, Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'office', 1),
('addr_02', 'u_seller_01', 'Nguyễn Việt Dũng', '0912345678', 'Hà Nội', 'Quận Cầu Giấy', 'Phường Dịch Vọng Hậu', 'Số 18 Phố Duy Tân', 'Số 18 Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 'office', 1);

-- 6. TÀI KHOẢN NGÂN HÀNG LIÊN KẾT (BANK_ACCOUNTS)
INSERT OR IGNORE INTO bank_accounts (id, user_id, bank_code, bank_name, account_number, account_holder, is_default) VALUES
('bank_01', 'u_seller_01', 'VCB', 'Ngân hàng Ngoại Thương Việt Nam (Vietcombank)', '0011004329988', 'NGUYEN VIET DUNG', 1),
('bank_02', 'u_buyer_01', 'TCB', 'Ngân hàng Kỹ Thương (Techcombank)', '19034567890123', 'TRAN THU TRANG', 1);

-- 7. VÍ KÝ QUỸ ĐẢM BẢO GIAO DỊCH (ESCROW_WALLETS)
INSERT OR IGNORE INTO escrow_wallets (id, user_id, available_balance, locked_balance, total_withdrawn) VALUES
('w_admin_01', 'u_admin_01', 1250000000, 45000000, 320000000),
('w_seller_01', 'u_seller_01', 34500000, 21990000, 85000000),
('w_buyer_01', 'u_buyer_01', 5000000, 0, 0);

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

-- Sản phẩm C2C Like New Tuyển Chọn
('c01', 'HYB-C2C-001', 'iPhone 15 Pro Max 256GB Titan Tự Nhiên (Like New 99%)', 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb-titan-99', 'cat_tech', 'br_apple', 'u_seller_01', 'c2c', 99, 'LIKE NEW 99% MỚI', 29990000, 21990000, 1, 'assets/images/products/iphone-15-pro-max.png', 'Máy người dùng nâng cấp lên đời, pin 98%, nguyên bản 100% chưa qua sửa chữa, đã vượt qua 15 bước kiểm định nghiêm ngặt.', 'Cáp sạc bọc dù zin theo máy, Giấy chứng nhận kiểm định Hybrid 15 bước', 6, 1, 9.8, 1, 0, NULL, 'active'),
('c02', 'HYB-C2C-002', 'Máy Chơi Game Nintendo Switch OLED Model White (Like New 98%)', 'Nintendo Switch OLED', 'nintendo-switch-oled-white-98', 'cat_gaming', 'br_nintendo', 'u_seller_01', 'c2c', 98, 'LIKE NEW 98% MỚI', 8500000, 5800000, 1, 'assets/images/products/nintendo-switch-oled.png', 'Màn hình OLED 7 inch rực rỡ không điểm chết, Joy-Con nhạy bén không trôi analog, thân máy đẹp keng không trầy xước.', 'Dock xuất TV, Củ sạc zin, Cáp HDMI tốc độ cao, Grip tay cầm', 3, 1, 9.7, 1, 1, '2026-12-31 23:59:59', 'active');

-- 10. BỘ SƯU TẬP ẢNH SẢN PHẨM (PRODUCT_IMAGES)
INSERT OR IGNORE INTO product_images (id, product_id, image_url, is_cover, display_order) VALUES
('img_m01_1', 'm01', 'assets/images/products/ao-khoac-bomber.png', 1, 1),
('img_m02_1', 'm02', 'assets/images/products/dyson-v12.png', 1, 1),
('img_m03_1', 'm03', 'assets/images/products/sony-wh1000xm5.png', 1, 1),
('img_c01_1', 'c01', 'assets/images/products/iphone-15-pro-max.png', 1, 1),
('img_c02_1', 'c02', 'assets/images/products/nintendo-switch-oled.png', 1, 1);

-- 11. THÔNG SỐ KỸ THUẬT (PRODUCT_SPECS)
INSERT OR IGNORE INTO product_specs (id, product_id, spec_key, spec_value, group_name, display_order) VALUES
('spec_c01_1', 'c01', 'Màn hình', '6.7 inch Super Retina XDR OLED 120Hz ProMotion', 'Hiển thị', 1),
('spec_c01_2', 'c01', 'Vi xử lý', 'Apple A17 Pro tiến trình 3nm siêu mạnh mẽ', 'Hiệu năng', 2),
('spec_c01_3', 'c01', 'Dung lượng Pin', 'Tình trạng thực tế 98% (Chu kỳ sạc 45 lần)', 'Pin & Nguồn', 3),
('spec_c01_4', 'c01', 'Camera sau', '48MP Chính + 12MP Siêu rộng + 12MP Tele 5x quang học', 'Quang học', 4);
