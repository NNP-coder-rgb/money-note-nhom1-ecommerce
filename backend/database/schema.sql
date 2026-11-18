-- ============================================================================
-- DỰ ÁN: HYBRID.STORE — HỆ THỐNG CƠ SỞ DỮ LIỆU SÀN TMĐT HYBRID TOÀN DIỆN
-- MÔ HÌNH: Brand Mall (B2C Mới 100%) & Chợ C2C (Like New Tuyển Chọn Kiểm Định)
-- TƯƠNG THÍCH: SQLite 3 / PostgreSQL / MySQL 8+ (ANSI SQL Standard)
-- CẬP NHẬT: Chuẩn hóa ERD (T31) — Bổ sung & hoàn thiện escrows, disputes, offers
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- PHẦN 1: QUẢN LÝ TÀI KHOẢN, PHÂN QUYỀN (RBAC) & ĐỊNH DANH (KYC CCCD)
-- ============================================================================

-- Bảng 1: users (Người dùng cốt lõi)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,                         -- UUID định danh duy nhất
    email VARCHAR(120) NOT NULL UNIQUE,                 -- Email đăng nhập
    phone VARCHAR(15) NOT NULL UNIQUE,                  -- Số điện thoại (10 số Việt Nam)
    password_hash VARCHAR(255) NOT NULL,                -- Mật khẩu mã hóa (bcrypt/argon2)
    full_name VARCHAR(100) NOT NULL,                    -- Họ và tên đầy đủ
    role VARCHAR(20) NOT NULL DEFAULT 'buyer'           -- Phân quyền
        CHECK (role IN ('buyer', 'seller', 'admin', 'inspector')),
    avatar_url TEXT DEFAULT '',                         -- Ảnh đại diện
    is_active BOOLEAN NOT NULL DEFAULT 1,               -- Trạng thái hoạt động
    email_verified BOOLEAN NOT NULL DEFAULT 0,          -- Đã xác thực email
    phone_verified BOOLEAN NOT NULL DEFAULT 0,          -- Đã xác thực OTP điện thoại
    vip_points INTEGER NOT NULL DEFAULT 1500,           -- Điểm thưởng VIP tích lũy
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 2: kyc_verifications (Hồ sơ xác thực Căn cước công dân gắn chip)
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,                -- 1 người dùng - 1 hồ sơ KYC
    id_card_number VARCHAR(12) NOT NULL UNIQUE,         -- Số CCCD 12 số
    full_name_on_card VARCHAR(100) NOT NULL,            -- Họ tên trên thẻ
    date_of_birth DATE NOT NULL,                        -- Ngày sinh
    gender VARCHAR(10) CHECK (gender IN ('Nam', 'Nữ', 'Khác')),
    permanent_address TEXT NOT NULL,                    -- Nơi thường trú
    front_image_url TEXT NOT NULL,                      -- Ảnh mặt trước CCCD
    back_image_url TEXT NOT NULL,                       -- Ảnh mặt sau CCCD
    selfie_image_url TEXT DEFAULT '',                   -- Ảnh chân dung sinh trắc học
    status VARCHAR(20) NOT NULL DEFAULT 'pending'       -- Trạng thái duyệt
        CHECK (status IN ('unverified', 'pending', 'approved', 'rejected')),
    rejection_reason TEXT DEFAULT '',                   -- Lý do từ chối nếu có
    reviewed_by VARCHAR(36) DEFAULT NULL,               -- Admin kiểm duyệt
    reviewed_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng 3: user_addresses (Sổ địa chỉ giao nhận đa cấp)
CREATE TABLE IF NOT EXISTS user_addresses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,               -- Tên người nhận
    phone VARCHAR(15) NOT NULL,                         -- Số điện thoại nhận hàng
    province VARCHAR(60) NOT NULL,                      -- Tỉnh / Thành phố
    district VARCHAR(60) NOT NULL,                      -- Quận / Huyện
    ward VARCHAR(60) NOT NULL,                          -- Phường / Xã
    street_address TEXT NOT NULL,                       -- Địa chỉ chi tiết (Số nhà, tên đường)
    full_address TEXT NOT NULL,                         -- Địa chỉ ghép hoàn chỉnh
    address_type VARCHAR(20) DEFAULT 'home'             -- Phân loại: 'home' (Nhà riêng) | 'office' (Văn phòng)
        CHECK (address_type IN ('home', 'office')),
    is_default BOOLEAN NOT NULL DEFAULT 0,              -- Địa chỉ mặc định
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 4: bank_accounts (Tài khoản ngân hàng liên kết Napas 24/7)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    bank_code VARCHAR(20) NOT NULL,                     -- VCB, TCB, MB, VPB, ICB...
    bank_name VARCHAR(100) NOT NULL,                    -- Ngân hàng Ngoại Thương (Vietcombank)
    account_number VARCHAR(30) NOT NULL,                -- Số tài khoản / Số thẻ
    account_holder VARCHAR(100) NOT NULL,               -- Tên chủ thẻ (Viết hoa không dấu)
    is_default BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PHẦN 2: DANH MỤC, THƯƠNG HIỆU & SẢN PHẨM HYBRID (MALL + C2C)
-- ============================================================================

-- Bảng 5: categories (Cây danh mục ngành hàng)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(60) NOT NULL UNIQUE,                   -- tech, sneakers, fashion, audio...
    name VARCHAR(100) NOT NULL,                         -- Đồ Điện Tử & Hi-Tech, Giày Sneaker...
    icon VARCHAR(40) DEFAULT 'category',                -- Material Symbol Icon name
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 6: brands (Thương hiệu chính hãng)
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(60) NOT NULL UNIQUE,                   -- apple, sony, dyson, nike...
    name VARCHAR(100) NOT NULL,
    logo_url TEXT DEFAULT '',
    is_official_mall BOOLEAN NOT NULL DEFAULT 0,        -- Có gian hàng Flagship Mall
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 7: products (Bảng sản phẩm trung tâm)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(40) UNIQUE,                             -- Mã kho nội bộ (vd: HYB-TECH-001)
    name VARCHAR(255) NOT NULL,                         -- Tên đầy đủ
    short_name VARCHAR(120),                            -- Tên hiển thị gọn trên mobile
    slug VARCHAR(255) NOT NULL,                         -- Đường dẫn thân thiện SEO
    category_id VARCHAR(36) NOT NULL,
    brand_id VARCHAR(36),
    seller_id VARCHAR(36) NOT NULL,                     -- Mall Owner (Admin) hoặc Người bán C2C
    product_type VARCHAR(10) NOT NULL DEFAULT 'mall'    -- 'mall' (Hàng mới 100%) | 'c2c' (Đồ cũ tuyển chọn)
        CHECK (product_type IN ('mall', 'c2c')),
    condition_pct INTEGER DEFAULT 100                   -- Độ mới % (100 = Brand New; 95-99 = Like New)
        CHECK (condition_pct BETWEEN 50 AND 100),
    condition_label VARCHAR(60) DEFAULT 'Mới 100%',     -- 'MỚI 100% NGUYÊN SEAL' | 'LIKE NEW 99%'
    original_price BIGINT NOT NULL,                     -- Giá niêm yết ban đầu (VND)
    selling_price BIGINT NOT NULL,                      -- Giá bán thực tế hiện tại (VND)
    stock_quantity INTEGER NOT NULL DEFAULT 1,          -- Số lượng tồn (hàng C2C thường = 1)
    thumbnail_url TEXT NOT NULL,                        -- Ảnh đại diện sản phẩm
    description TEXT,                                   -- Bài viết mô tả chi tiết / tình trạng
    accessories_included TEXT DEFAULT '',               -- Phụ kiện đi kèm (Hộp, Cáp sạc, Giấy tờ...)
    warranty_months INTEGER NOT NULL DEFAULT 12,        -- Số tháng bảo hành (Mall: 12-24, C2C: 3-6)
    warranty_policy_note TEXT DEFAULT '',               -- Ghi chú chính sách bảo hành
    inspection_passed BOOLEAN NOT NULL DEFAULT 1,       -- Đã vượt qua 15 bước kiểm định kỹ thuật
    inspection_score REAL DEFAULT 9.8,                  -- Điểm số kiểm định kỹ thuật (thang 10)
    allow_offers BOOLEAN NOT NULL DEFAULT 0,            -- Cho phép người mua trả giá (C2C)
    is_flash_sale BOOLEAN NOT NULL DEFAULT 0,           -- Sản phẩm đang chạy Flash Sale
    flash_sale_end DATETIME DEFAULT NULL,               -- Thời điểm kết thúc đếm ngược
    view_count INTEGER NOT NULL DEFAULT 0,              -- Lượt xem
    sales_count INTEGER NOT NULL DEFAULT 0,             -- Số lượng đã bán
    rating_average REAL NOT NULL DEFAULT 5.0,           -- Điểm đánh giá trung bình
    rating_count INTEGER NOT NULL DEFAULT 0,            -- Tổng số lượt đánh giá
    status VARCHAR(20) NOT NULL DEFAULT 'active'        -- 'active', 'sold_out', 'hidden', 'draft'
        CHECK (status IN ('active', 'sold_out', 'hidden', 'draft')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Bảng 8: product_images (Bộ sưu tập hình ảnh thực tế đa góc)
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    is_cover BOOLEAN NOT NULL DEFAULT 0,                -- Ảnh đại diện
    display_order INTEGER NOT NULL DEFAULT 0,           -- Thứ tự xuất hiện trong gallery
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng 9: product_specs (Bảng thông số kỹ thuật chi tiết theo thiết bị)
CREATE TABLE IF NOT EXISTS product_specs (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    spec_key VARCHAR(80) NOT NULL,                      -- Vi xử lý, Màn hình, Dung lượng pin...
    spec_value TEXT NOT NULL,                           -- Apple M3 Pro, 6.7 inch OLED 120Hz...
    group_name VARCHAR(60) DEFAULT 'Cấu hình chung',
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================================
-- PHẦN 3: KHUYẾN MÃI, MÃ GIẢM GIÁ (VOUCHER / COUPON ENGINE)
-- ============================================================================

-- Bảng 10: vouchers (Kho phiếu ưu đãi)
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,                   -- FREESHIP, HYBRID50, VIP100...
    title VARCHAR(120) NOT NULL,
    voucher_type VARCHAR(20) NOT NULL                   -- 'percent' (giảm %) | 'fixed' (giảm tiền) | 'freeship'
        CHECK (voucher_type IN ('percent', 'fixed', 'freeship')),
    discount_value BIGINT NOT NULL,                     -- % (vd: 10) hoặc số tiền (vd: 50.000)
    min_order_value BIGINT NOT NULL DEFAULT 0,          -- Đơn hàng tối thiểu để áp dụng
    max_discount_amount BIGINT DEFAULT NULL,            -- Mức giảm tối đa (nếu là %)
    usage_limit INTEGER DEFAULT 1000,                   -- Giới hạn số lượt dùng toàn sàn
    usage_count INTEGER NOT NULL DEFAULT 0,             -- Số lượt đã dùng thực tế
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PHẦN 4: ĐƠN HÀNG, ĐA KIỆN HÀNG (MULTI-VENDOR OMS) & HÀNH TRÌNH VẬN ĐƠN
-- ============================================================================

-- Bảng 11: orders (Hóa đơn mua sắm trung tâm)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,             -- Mã đơn hiển thị (vd: ORD-20261108-9841)
    buyer_id VARCHAR(36) NOT NULL,
    subtotal BIGINT NOT NULL,                           -- Tổng tiền hàng trước giảm giá
    shipping_fee BIGINT NOT NULL DEFAULT 0,             -- Phí vận chuyển
    discount_amount BIGINT NOT NULL DEFAULT 0,          -- Tiền giảm giá qua voucher
    total_amount BIGINT NOT NULL,                       -- Tổng tiền thanh toán cuối cùng
    voucher_id VARCHAR(36) DEFAULT NULL,
    payment_method VARCHAR(20) NOT NULL                 -- Phương thức thanh toán
        CHECK (payment_method IN ('COD', 'VIETQR', 'CARD', 'NAPAS_ESCROW')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'held_in_escrow')),
    shipping_method VARCHAR(30) NOT NULL DEFAULT 'standard'
        CHECK (shipping_method IN ('standard', 'express_2h')),
    -- Snapshot địa chỉ giao hàng tại thời điểm đặt (tránh bị thay đổi khi user sửa sổ địa chỉ)
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(15) NOT NULL,
    shipping_address TEXT NOT NULL,
    buyer_note TEXT DEFAULT '',
    -- Xuất hóa đơn VAT doanh nghiệp nếu khách yêu cầu
    vat_requested BOOLEAN NOT NULL DEFAULT 0,
    vat_company_name VARCHAR(150) DEFAULT '',
    vat_tax_code VARCHAR(30) DEFAULT '',
    vat_company_address TEXT DEFAULT '',
    -- Trạng thái đơn hàng tổng quát
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'disputed')),
    step_index INTEGER NOT NULL DEFAULT 1               -- 1: Đặt đơn, 2: Bàn giao, 3: Đang phát, 4: Đã nhận & Đánh giá
        CHECK (step_index BETWEEN 1 AND 4),
    completed_at DATETIME DEFAULT NULL,
    cancelled_at DATETIME DEFAULT NULL,
    cancel_reason TEXT DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL
);

-- Bảng 12: order_parcels (Tách kiện hàng theo từng Seller / Nhà kho)
CREATE TABLE IF NOT EXISTS order_parcels (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,                     -- Chủ gian hàng xuất kiện này
    parcel_code VARCHAR(30) NOT NULL UNIQUE,            -- Mã kiện hàng riêng biệt
    parcel_type VARCHAR(20) NOT NULL                    -- 'mall_warehouse' | 'c2c_seller'
        CHECK (parcel_type IN ('mall_warehouse', 'c2c_seller')),
    carrier_name VARCHAR(60) NOT NULL,                  -- 'VNPost Nhanh Toàn Quốc', 'Bưu Tá Hỏa Tốc HYBRID'
    tracking_code VARCHAR(40) NOT NULL UNIQUE,          -- Mã bưu phẩm VNPOST-123456
    shipping_fee BIGINT NOT NULL DEFAULT 0,
    estimated_delivery VARCHAR(80),                     -- Dự kiến giao sau 2-3 ngày
    status VARCHAR(20) NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'ready_for_pickup', 'in_transit', 'delivered', 'returned')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Bảng 13: order_items (Chi tiết từng món hàng trong đơn)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    parcel_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,                 -- Tên snapshot tại thời điểm mua
    product_type VARCHAR(10) NOT NULL,                  -- 'mall' hoặc 'c2c'
    condition_pct INTEGER DEFAULT 100,                  -- Độ mới snapshot
    unit_price BIGINT NOT NULL,                         -- Đơn giá tại thời điểm mua
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price BIGINT NOT NULL,                        -- unit_price * quantity
    variant_info VARCHAR(100) DEFAULT '',               -- Size M, Titan Tự Nhiên 256GB...
    thumbnail_url TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (parcel_id) REFERENCES order_parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Bảng 14: order_tracking_events (Nhật ký hành trình bưu kiện thời gian thực)
CREATE TABLE IF NOT EXISTS order_tracking_events (
    id VARCHAR(36) PRIMARY KEY,
    parcel_id VARCHAR(36) NOT NULL,
    status_title VARCHAR(120) NOT NULL,                 -- Nhập kho trung chuyển, Bưu tá đang phát...
    status_description TEXT NOT NULL,                   -- Chi tiết địa điểm bưu cục / biển số xe
    location VARCHAR(120) NOT NULL,                     -- Trung tâm khai thác Nam Từ Liêm, HN...
    shipper_name VARCHAR(80) DEFAULT '',                -- Bưu tá: Nguyễn Văn Hùng
    shipper_phone VARCHAR(20) DEFAULT '',               -- SĐT Hotline liên hệ bưu tá
    event_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parcel_id) REFERENCES order_parcels(id) ON DELETE CASCADE
);

-- ============================================================================
-- PHẦN 5: THƯƠNG LƯỢNG & TRẢ GIÁ C2C (OFFERS — CHUẨN HÓA THEO ERD T31)
-- ============================================================================

-- Bảng 15: offers (Lịch sử thương lượng & trả giá giữa Người mua & Người bán C2C)
CREATE TABLE IF NOT EXISTS offers (
    id VARCHAR(36) PRIMARY KEY,
    offer_code VARCHAR(30) NOT NULL UNIQUE,             -- Mã đề nghị (vd: OFF-20261117-01)
    product_id VARCHAR(36) NOT NULL,                    -- Sản phẩm C2C được trả giá
    buyer_id VARCHAR(36) NOT NULL,                      -- Người mua gửi đề nghị
    seller_id VARCHAR(36) NOT NULL,                     -- Người bán sở hữu sản phẩm
    order_id VARCHAR(36) DEFAULT NULL,                  -- Đơn hàng phát sinh sau khi chốt giá
    original_price BIGINT NOT NULL                      -- Giá niêm yết tại thời điểm trả giá (VND)
        CHECK (original_price > 0),
    offered_price BIGINT NOT NULL                       -- Mức giá người mua đề xuất (VND)
        CHECK (offered_price > 0),
    counter_price BIGINT DEFAULT NULL                   -- Mức giá người bán đề nghị lại (Counter-offer)
        CHECK (counter_price IS NULL OR counter_price > 0),
    final_agreed_price BIGINT DEFAULT NULL              -- Giá chốt cuối cùng khi hai bên đồng thuận
        CHECK (final_agreed_price IS NULL OR final_agreed_price > 0),
    discount_pct INTEGER NOT NULL                       -- Tỉ lệ giảm % so với giá niêm yết (0% - 50%)
        CHECK (discount_pct BETWEEN 0 AND 50),
    buyer_message TEXT DEFAULT '',                      -- Lời nhắn của người mua
    seller_note TEXT DEFAULT '',                        -- Phản hồi của người bán
    status VARCHAR(20) NOT NULL DEFAULT 'pending'       -- Trạng thái thương lượng
        CHECK (status IN ('pending', 'countered', 'accepted', 'rejected', 'expired', 'cancelled')),
    expires_at DATETIME NOT NULL,                       -- Thời hạn hiệu lực (mặc định +24h)
    responded_at DATETIME DEFAULT NULL,                 -- Thời điểm người bán phản hồi
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_offers_distinct_parties
        CHECK (buyer_id <> seller_id),
    CONSTRAINT chk_offers_price_bounds
        CHECK (offered_price <= original_price AND offered_price * 2 >= original_price),
    CONSTRAINT chk_offers_counter_bounds
        CHECK (counter_price IS NULL OR (counter_price > offered_price AND counter_price <= original_price)),
    CONSTRAINT chk_offers_final_bounds
        CHECK (final_agreed_price IS NULL OR (final_agreed_price >= offered_price AND final_agreed_price <= original_price)),
    CONSTRAINT chk_offers_countered_requires_price
        CHECK (status <> 'countered' OR (counter_price IS NOT NULL AND responded_at IS NOT NULL)),
    CONSTRAINT chk_offers_accepted_requires_final
        CHECK (status <> 'accepted' OR (final_agreed_price IS NOT NULL AND responded_at IS NOT NULL)),
    CONSTRAINT chk_offers_rejected_requires_ts
        CHECK (status <> 'rejected' OR responded_at IS NOT NULL),
    CONSTRAINT chk_offers_expiry_valid
        CHECK (expires_at > created_at),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- ============================================================================
-- PHẦN 6: KÝ QUỸ ESCROW & DÒNG TIỀN ĐẢM BẢO GIAO DỊCH 24/7 (THEO ERD T31)
-- ============================================================================

-- Bảng 16: escrow_wallets (Ví tài khoản ký quỹ của người dùng & người bán)
CREATE TABLE IF NOT EXISTS escrow_wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    available_balance BIGINT NOT NULL DEFAULT 0         -- Số dư khả dụng có thể rút (VND)
        CHECK (available_balance >= 0),
    locked_balance BIGINT NOT NULL DEFAULT 0            -- Số tiền đang tạm giữ trong các đơn hàng mở
        CHECK (locked_balance >= 0),
    total_withdrawn BIGINT NOT NULL DEFAULT 0           -- Lũy kế số tiền đã rút về ngân hàng
        CHECK (total_withdrawn >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 17: escrows (Hợp đồng ký quỹ trung gian theo từng đơn hàng — chuẩn ERD T31)
CREATE TABLE IF NOT EXISTS escrows (
    id VARCHAR(36) PRIMARY KEY,
    escrow_code VARCHAR(40) NOT NULL UNIQUE,            -- Mã hợp đồng ký quỹ (vd: ESC-20261108-9841)
    order_id VARCHAR(36) NOT NULL UNIQUE,               -- 1 đơn hàng có tối đa 1 bản ghi ký quỹ
    buyer_id VARCHAR(36) NOT NULL,                      -- Người mua nộp tiền ký quỹ
    seller_id VARCHAR(36) NOT NULL,                     -- Người bán thụ hưởng khi giải ngân
    seller_wallet_id VARCHAR(36) DEFAULT NULL,          -- Ví ký quỹ của người bán
    amount BIGINT NOT NULL                              -- Tổng số tiền ký quỹ (VND)
        CHECK (amount > 0),
    platform_fee BIGINT NOT NULL DEFAULT 0              -- Phí dịch vụ sàn (VND)
        CHECK (platform_fee >= 0),
    net_payout_amount BIGINT NOT NULL DEFAULT 0         -- Số tiền thực nhận giải ngân cho người bán
        CHECK (net_payout_amount >= 0),
    refunded_amount BIGINT NOT NULL DEFAULT 0           -- Số tiền hoàn trả cho người mua (nếu có)
        CHECK (refunded_amount >= 0),
    payment_channel VARCHAR(30) NOT NULL DEFAULT 'NAPAS_ESCROW'
        CHECK (payment_channel IN ('NAPAS_ESCROW', 'VIETQR', 'CARD', 'WALLET')),
    bank_reference_code VARCHAR(60) DEFAULT '',         -- Mã đối soát cổng thanh toán Napas/VietQR
    status VARCHAR(25) NOT NULL DEFAULT 'pending_deposit'
        CHECK (status IN (
            'pending_deposit',                          -- Chờ người mua chuyển tiền vào quỹ
            'holding',                                  -- Đang tạm giữ an toàn (chờ giao & đồng kiểm)
            'frozen',                                   -- Đang đóng băng do phát sinh tranh chấp
            'released',                                 -- Đã giải ngân cho người bán
            'refunded',                                 -- Đã hoàn tiền 100% cho người mua
            'partially_refunded',                       -- Hoàn 1 phần cho người mua, giải ngân phần còn lại
            'cancelled'                                 -- Hủy trước khi nạp tiền ký quỹ
        )),
    hold_reason TEXT DEFAULT '',                        -- Ghi chú lý do tạm giữ / đóng băng
    held_at DATETIME DEFAULT NULL,                      -- Thời điểm tiền vào quỹ ký quỹ
    auto_release_at DATETIME DEFAULT NULL,              -- Hạn tự động giải ngân nếu không khiếu nại
    frozen_at DATETIME DEFAULT NULL,                    -- Thời điểm đóng băng khi mở tranh chấp
    released_at DATETIME DEFAULT NULL,                  -- Thời điểm giải ngân cho người bán
    refunded_at DATETIME DEFAULT NULL,                  -- Thời điểm hoàn tiền cho người mua
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_escrows_distinct_parties
        CHECK (buyer_id <> seller_id),
    CONSTRAINT chk_escrows_fee_lte_amount
        CHECK (platform_fee <= amount),
    CONSTRAINT chk_escrows_refund_lte_amount
        CHECK (refunded_amount <= amount),
    CONSTRAINT chk_escrows_balance_invariant
        CHECK (net_payout_amount + platform_fee + refunded_amount <= amount),
    CONSTRAINT chk_escrows_holding_ts
        CHECK (status <> 'holding' OR held_at IS NOT NULL),
    CONSTRAINT chk_escrows_frozen_ts
        CHECK (status <> 'frozen' OR frozen_at IS NOT NULL),
    CONSTRAINT chk_escrows_released_payout
        CHECK (status <> 'released' OR (released_at IS NOT NULL AND net_payout_amount > 0)),
    CONSTRAINT chk_escrows_full_refund
        CHECK (status <> 'refunded' OR (refunded_at IS NOT NULL AND refunded_amount = amount AND net_payout_amount = 0)),
    CONSTRAINT chk_escrows_partial_refund
        CHECK (status <> 'partially_refunded' OR (refunded_at IS NOT NULL AND refunded_amount > 0 AND refunded_amount < amount)),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_wallet_id) REFERENCES escrow_wallets(id) ON DELETE SET NULL
);

-- Bảng 18: escrow_transactions (Sổ cái biến động số dư ký quỹ)
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    escrow_id VARCHAR(36) DEFAULT NULL,                 -- Tham chiếu hợp đồng ký quỹ tương ứng
    order_id VARCHAR(36) DEFAULT NULL,
    transaction_code VARCHAR(40) NOT NULL UNIQUE,       -- TX-ESC-2026-XXXX
    transaction_type VARCHAR(20) NOT NULL               -- Loại giao dịch
        CHECK (transaction_type IN ('deposit', 'hold_order', 'freeze_dispute', 'release_payout', 'refund_buyer', 'withdrawal')),
    amount BIGINT NOT NULL                              -- Số tiền biến động (+/-), khác 0
        CHECK (amount <> 0),
    balance_after BIGINT NOT NULL                       -- Số dư khả dụng sau khi giao dịch thành công
        CHECK (balance_after >= 0),
    memo TEXT NOT NULL,                                 -- Nội dung khớp lệnh
    bank_reference_code VARCHAR(50) DEFAULT '',         -- Mã chuẩn chi Napas/VietQR
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES escrow_wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (escrow_id) REFERENCES escrows(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- ============================================================================
-- PHẦN 7: PHÒNG TRỌNG TÀI TRANH CHẤP 3 BÊN (DISPUTES — CHUẨN HÓA THEO ERD T31)
-- ============================================================================

-- Bảng 19: disputes (Hồ sơ vụ việc khiếu nại & phân xử tranh chấp)
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(36) PRIMARY KEY,
    dispute_code VARCHAR(30) NOT NULL UNIQUE,           -- Mã hồ sơ tranh chấp (vd: DSP-20261108-01)
    order_id VARCHAR(36) NOT NULL UNIQUE,               -- 1 đơn hàng chỉ có 1 hồ sơ tranh chấp chính thức
    escrow_id VARCHAR(36) DEFAULT NULL,                 -- Giao dịch ký quỹ bị đóng băng liên quan
    buyer_id VARCHAR(36) NOT NULL,                      -- Bên khiếu nại (Người mua)
    seller_id VARCHAR(36) NOT NULL,                     -- Bên bị khiếu nại (Người bán)
    reason_category VARCHAR(40) NOT NULL DEFAULT 'not_as_described'
        CHECK (reason_category IN (
            'not_as_described',                         -- Hàng không đúng mô tả / cam kết Like New
            'damaged_in_transit',                       -- Hư hại / cấn móp trong quá trình vận chuyển
            'missing_accessories',                      -- Thiếu phụ kiện / hộp / giấy kiểm định
            'counterfeit',                              -- Nghi vấn hàng giả / không chính hãng
            'defective_hardware',                       -- Lỗi phần cứng / không hoạt động
            'not_received',                             -- Chưa nhận được hàng dù báo đã giao
            'other'                                     -- Lý do khác
        )),
    reason VARCHAR(150) NOT NULL,                       -- Tiêu đề tóm tắt lý do khiếu nại
    description TEXT NOT NULL,                          -- Tường trình chi tiết của người mua
    requested_refund BIGINT NOT NULL                    -- Số tiền người mua yêu cầu hoàn (VND)
        CHECK (requested_refund >= 0),
    approved_refund BIGINT NOT NULL DEFAULT 0           -- Số tiền Trọng tài phê duyệt hoàn (VND)
        CHECK (approved_refund >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'       -- Trạng thái vòng đời giải quyết
        CHECK (status IN (
            'pending',                                  -- Mới tạo, chờ người bán phản hồi
            'seller_responded',                         -- Người bán đã giải trình / đề xuất hòa giải
            'in_arbitration',                           -- Đang phân xử 3 bên có Trọng tài sàn
            'resolved',                                 -- Đã chốt phán quyết, chờ/đang thi hành
            'rejected',                                 -- Bác bỏ khiếu nại (không đủ căn cứ)
            'closed',                                   -- Đã hoàn tất thi hành và đóng hồ sơ
            'withdrawn'                                 -- Người mua chủ động rút khiếu nại
        )),
    priority VARCHAR(15) NOT NULL DEFAULT 'normal'      -- Mức độ ưu tiên xử lý SLA
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    arbitrator_admin_id VARCHAR(36) DEFAULT NULL,       -- Trọng tài viên / Admin phụ trách
    admin_decision_summary TEXT DEFAULT '',             -- Biên bản tóm tắt phán quyết trọng tài
    solution_code VARCHAR(30) NOT NULL DEFAULT ''       -- Phương án phán quyết cuối cùng
        CHECK (solution_code IN (
            '',
            'full_refund',                              -- Hoàn tiền 100% & thu hồi hàng
            'partial_refund',                           -- Hoàn tiền một phần, người mua giữ hàng
            'exchange_1_to_1',                          -- Đổi máy / sản phẩm 1:1 khác
            'voucher_compensation',                     -- Bồi thường voucher & giữ sản phẩm
            'reject_claim'                              -- Từ chối yêu cầu, giải ngân cho người bán
        )),
    sla_deadline_at DATETIME DEFAULT NULL,              -- Hạn chót SLA xử lý (thường +48h)
    resolved_at DATETIME DEFAULT NULL,                  -- Thời điểm ra phán quyết
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_disputes_distinct_parties
        CHECK (buyer_id <> seller_id),
    CONSTRAINT chk_disputes_arbitrator_neutral
        CHECK (arbitrator_admin_id IS NULL OR (arbitrator_admin_id <> buyer_id AND arbitrator_admin_id <> seller_id)),
    CONSTRAINT chk_disputes_approved_lte_requested
        CHECK (approved_refund <= requested_refund),
    CONSTRAINT chk_disputes_resolved_consistency
        CHECK (status NOT IN ('resolved', 'closed') OR (resolved_at IS NOT NULL AND solution_code <> '')),
    CONSTRAINT chk_disputes_rejected_consistency
        CHECK (status <> 'rejected' OR (resolved_at IS NOT NULL AND solution_code = 'reject_claim' AND approved_refund = 0)),
    CONSTRAINT chk_disputes_refund_solution_amount
        CHECK (solution_code NOT IN ('full_refund', 'partial_refund') OR approved_refund > 0),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (escrow_id) REFERENCES escrows(id) ON DELETE SET NULL,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (arbitrator_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng 20: dispute_evidences (Bằng chứng ảnh, video mở hộp đồng kiểm)
CREATE TABLE IF NOT EXISTS dispute_evidences (
    id VARCHAR(36) PRIMARY KEY,
    dispute_id VARCHAR(36) NOT NULL,
    uploaded_by_user_id VARCHAR(36) NOT NULL,           -- Bên tải lên (Người mua hoặc Người bán)
    media_url TEXT NOT NULL,                            -- Đường dẫn ảnh / video
    media_type VARCHAR(20) NOT NULL DEFAULT 'image'     -- 'image' | 'video' | 'pdf'
        CHECK (media_type IN ('image', 'video', 'pdf')),
    title VARCHAR(150) NOT NULL,                        -- Video mở hộp, Ảnh góc cấn máy, Biên bản đồng kiểm...
    file_size_kb INTEGER DEFAULT 0 CHECK (file_size_kb >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 21: dispute_messages (Nhật ký trao đổi 3 bên trực tiếp trong phòng khiếu nại)
CREATE TABLE IF NOT EXISTS dispute_messages (
    id VARCHAR(36) PRIMARY KEY,
    dispute_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    sender_role VARCHAR(20) NOT NULL                    -- 'buyer', 'seller', 'admin', 'system'
        CHECK (sender_role IN ('buyer', 'seller', 'admin', 'system')),
    message_text TEXT NOT NULL,
    attachment_url TEXT DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PHẦN 8: ĐÁNH GIÁ, DANH SÁCH YÊU THÍCH & HỆ THỐNG THÔNG BÁO
-- ============================================================================

-- Bảng 22: product_reviews (Đánh giá chất lượng từ người mua thực tế)
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) DEFAULT NULL,                  -- Liên kết với đơn hàng mua thật
    user_id VARCHAR(36) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    has_photo BOOLEAN NOT NULL DEFAULT 0,
    is_verified_buyer BOOLEAN NOT NULL DEFAULT 1,       -- Huy hiệu "Đã mua hàng"
    seller_reply TEXT DEFAULT '',                       -- Phản hồi của người bán
    seller_replied_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 23: wishlists (Danh sách sản phẩm yêu thích)
CREATE TABLE IF NOT EXISTS wishlists (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id),                       -- 1 user không lưu trùng 1 sản phẩm
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Bảng 24: notifications (Trung tâm thông báo cá nhân đa kênh)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL                           -- 'order', 'promo', 'dispute', 'system'
        CHECK (type IN ('order', 'promo', 'dispute', 'system')),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT DEFAULT '',                           -- Đường dẫn điều hướng khi click
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PHẦN 9: CHỈ MỤC TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN (INDEXES)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(selling_price);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Indexes cho bảng offers
CREATE INDEX IF NOT EXISTS idx_offers_product_status ON offers(product_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_status ON offers(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_seller_status ON offers(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_status_expires ON offers(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_offers_order ON offers(order_id);

-- Indexes cho bảng escrows & escrow_transactions
CREATE INDEX IF NOT EXISTS idx_escrows_buyer_status ON escrows(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_escrows_seller_status ON escrows(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_escrows_status_autorelease ON escrows(status, auto_release_at);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_wallet ON escrow_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_escrow ON escrow_transactions(escrow_id);

-- Indexes cho bảng disputes, dispute_evidences, dispute_messages
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow ON disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_buyer ON disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_seller ON disputes(seller_id);
CREATE INDEX IF NOT EXISTS idx_disputes_queue ON disputes(status, priority, sla_deadline_at);
CREATE INDEX IF NOT EXISTS idx_disputes_arbitrator ON disputes(arbitrator_admin_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidences_dispute ON dispute_evidences(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
