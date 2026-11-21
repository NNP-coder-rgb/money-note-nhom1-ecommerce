-- ============================================================================
-- DỰ ÁN: HYBRID.STORE — HỆ THỐNG CƠ SỞ DỮ LIỆU SÀN TMĐT HYBRID (12 BẢNG TINH GỌN)
-- MÔ HÌNH: Brand Mall (B2C Mới 100%) & Chợ C2C (Like New Tuyển Chọn Kiểm Định)
-- KIẾN TRÚC: Pragmatic Denormalization (Relational + JSON Document Fields)
-- TƯƠNG THÍCH: SQLite 3 / PostgreSQL / MySQL (ANSI SQL Standard)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- BẢNG 1: users (Người dùng, Phân quyền RBAC, Định danh eKYC, Ngân hàng & Ví ký quỹ)
-- Gộp từ: users + kyc_verifications + bank_accounts + escrow_wallets
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,                         -- UUID định danh duy nhất
    email VARCHAR(120) NOT NULL UNIQUE,                 -- Email đăng nhập
    phone VARCHAR(15) NOT NULL UNIQUE,                  -- SĐT 10 số Việt Nam
    password_hash VARCHAR(255) NOT NULL,                -- Mật khẩu mã hóa bcrypt
    full_name VARCHAR(100) NOT NULL,                    -- Họ và tên đầy đủ
    username VARCHAR(60) UNIQUE,                        -- Tên tài khoản định danh
    role VARCHAR(20) NOT NULL DEFAULT 'buyer'           -- Phân quyền
        CHECK (role IN ('buyer', 'seller', 'admin', 'inspector')),
    avatar_url TEXT DEFAULT '',                         -- Ảnh đại diện
    membership_title VARCHAR(50) DEFAULT 'VIP BUYER',   -- Danh hiệu thành viên
    bio TEXT DEFAULT '',                                -- Giới thiệu bản thân / Shop
    is_active BOOLEAN NOT NULL DEFAULT 1,               -- Trạng thái hoạt động
    email_verified BOOLEAN NOT NULL DEFAULT 0,
    phone_verified BOOLEAN NOT NULL DEFAULT 0,
    vip_points INTEGER NOT NULL DEFAULT 1500,           -- Điểm thưởng tích lũy

    -- PHÂN HỆ ĐỊNH DANH CCCD GẮN CHIP (eKYC LEVEL 2)
    id_card_number VARCHAR(12) UNIQUE,                  -- Số CCCD 12 số
    card_full_name VARCHAR(100),                        -- Họ tên in trên thẻ
    dob DATE,                                           -- Ngày tháng năm sinh
    gender VARCHAR(10) CHECK (gender IN ('Nam', 'Nữ', 'Khác', NULL)),
    permanent_address TEXT,                             -- Nơi thường trú
    front_image_url TEXT,                               -- Ảnh mặt trước CCCD
    back_image_url TEXT,                                -- Ảnh mặt sau CCCD
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
        CHECK (kyc_status IN ('unverified', 'pending', 'approved', 'rejected')),
    rejection_reason TEXT DEFAULT '',
    reviewed_at DATETIME DEFAULT NULL,

    -- PHÂN HỆ TÀI KHOẢN NGÂN HÀNG LIÊN KẾT (NAPAS 24/7)
    bank_code VARCHAR(20) DEFAULT '',                   -- VCB, TCB, MB, VPB...
    bank_name VARCHAR(100) DEFAULT '',                  -- Vietcombank, Techcombank...
    bank_account_number VARCHAR(30) DEFAULT '',         -- Số tài khoản
    bank_account_holder VARCHAR(100) DEFAULT '',        -- Tên chủ thẻ

    -- PHÂN HỆ VÍ TIỀN KÝ QUỸ (ESCROW FINTECH WALLET)
    wallet_balance BIGINT NOT NULL DEFAULT 0,           -- Số dư khả dụng có thể rút (VND)
    locked_balance BIGINT NOT NULL DEFAULT 0,           -- Tiền tạm giữ trong các đơn hàng mở
    total_withdrawn BIGINT NOT NULL DEFAULT 0,          -- Lũy kế số tiền đã rút về ngân hàng

    -- TƯƠNG TÁC NGƯỜI DÙNG: DANH SÁCH YÊU THÍCH & HỘP THƯ THÔNG BÁO (JSON)
    wishlist_ids TEXT DEFAULT '[]',                     -- Mảng ID sản phẩm đã thích: ["p1", "p2"]
    notifications_json TEXT DEFAULT '[]',               -- Mảng thông báo: [{"id":"n1","title":"...","read":false}]

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BẢNG 2: user_addresses (Sổ địa chỉ giao nhận hàng đa cấp)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_addresses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,               -- Tên người nhận
    phone VARCHAR(15) NOT NULL,                         -- Số điện thoại nhận
    province VARCHAR(60) NOT NULL,                      -- Tỉnh / Thành phố
    district VARCHAR(60) NOT NULL,                      -- Quận / Huyện
    ward VARCHAR(60) NOT NULL,                          -- Phường / Xã
    street_address TEXT NOT NULL,                       -- Số nhà, tên đường
    full_address TEXT NOT NULL,                         -- Địa chỉ ghép hoàn chỉnh
    address_type VARCHAR(20) DEFAULT 'home'             -- 'home' (Nhà riêng) | 'office' (Văn phòng)
        CHECK (address_type IN ('home', 'office')),
    is_default BOOLEAN NOT NULL DEFAULT 0,              -- Địa chỉ mặc định
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- BẢNG 3: categories (Cây danh mục ngành hàng)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(60) NOT NULL UNIQUE,                   -- tech, sneakers, fashion, audio...
    name VARCHAR(100) NOT NULL,                         -- Đồ Điện Tử, Sneaker Hypebeast...
    icon VARCHAR(40) DEFAULT 'category',                -- Material Symbol Icon name
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BẢNG 4: products (Sản phẩm Hybrid: Brand Mall Mới 100% & Chợ C2C Tuyển Chọn)
-- Gộp từ: products + brands + product_images (JSON) + product_specs (JSON)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(40) UNIQUE,                             -- Mã sản phẩm nội bộ (vd: HYB-TECH-001)
    name VARCHAR(255) NOT NULL,                         -- Tên đầy đủ
    short_name VARCHAR(120),                            -- Tên ngắn hiển thị mobile
    slug VARCHAR(255) NOT NULL,                         -- Đường dẫn thân thiện SEO
    category_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,                     -- Mall Owner (Admin) hoặc Người bán C2C
    brand_name VARCHAR(100) NOT NULL,                   -- Hãng: Apple, Sony, Dyson, Nike...
    is_official_mall BOOLEAN NOT NULL DEFAULT 0,        -- Hàng Flagship Mall chính hãng
    product_type VARCHAR(10) NOT NULL DEFAULT 'mall'    -- 'mall' (Mới 100%) | 'c2c' (Đồ cũ tuyển chọn)
        CHECK (product_type IN ('mall', 'c2c')),
    condition_pct INTEGER DEFAULT 100                   -- Độ mới % (100 = Brand New; 95-99 = Like New)
        CHECK (condition_pct BETWEEN 50 AND 100),
    condition_label VARCHAR(60) DEFAULT 'Mới 100%',     -- 'MỚI 100% NGUYÊN SEAL' | 'LIKE NEW 99%'
    original_price BIGINT NOT NULL,                     -- Giá niêm yết ban đầu (VND)
    selling_price BIGINT NOT NULL,                      -- Giá bán thực tế hiện tại (VND)
    stock_quantity INTEGER NOT NULL DEFAULT 1,          -- Số lượng tồn kho
    thumbnail_url TEXT NOT NULL,                        -- Ảnh đại diện chính
    description TEXT,                                   -- Bài viết mô tả / tình trạng thực tế
    accessories_included TEXT DEFAULT '',               -- Phụ kiện đi kèm máy
    warranty_months INTEGER NOT NULL DEFAULT 12,        -- Số tháng bảo hành (Mall: 12-24, C2C: 3-6)
    warranty_policy_note TEXT DEFAULT '',               -- Ghi chú chính sách bảo hành
    inspection_passed BOOLEAN NOT NULL DEFAULT 1,       -- Đạt 15 bước kiểm định kỹ thuật
    inspection_score REAL DEFAULT 9.8,                  -- Điểm số kiểm định kỹ thuật (thang 10)
    allow_offers BOOLEAN NOT NULL DEFAULT 0,            -- Cho phép người mua trả giá (C2C)
    is_flash_sale BOOLEAN NOT NULL DEFAULT 0,           -- Đang chạy Flash Sale đếm ngược
    flash_sale_end DATETIME DEFAULT NULL,
    view_count INTEGER NOT NULL DEFAULT 0,
    sales_count INTEGER NOT NULL DEFAULT 0,
    rating_average REAL NOT NULL DEFAULT 5.0,           -- Điểm đánh giá trung bình
    rating_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active'        -- 'active', 'sold_out', 'hidden', 'draft'
        CHECK (status IN ('active', 'sold_out', 'hidden', 'draft')),

    -- CÁC TRƯỜNG DỮ LIỆU ĐA TẦNG DẠNG JSON (EMBEDDED DOCUMENTS)
    images TEXT NOT NULL DEFAULT '[]',                  -- Mảng ảnh: ["url1.jpg", "url2.jpg", "url3.jpg"]
    specs TEXT NOT NULL DEFAULT '{}',                   -- Thông số kỹ thuật: {"Chip":"M3 Pro","RAM":"18GB"}

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================================================
-- BẢNG 5: product_offers (Thương lượng & Trả giá sản phẩm cũ C2C 24h)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_offers (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    original_price BIGINT NOT NULL,                     -- Giá niêm yết lúc trả
    offered_price BIGINT NOT NULL,                      -- Mức giá người mua đề xuất
    discount_pct INTEGER NOT NULL,                      -- Tỉ lệ giảm % (vd: -12%)
    buyer_message TEXT DEFAULT '',                      -- Lời nhắn người mua
    seller_note TEXT DEFAULT '',                        -- Phản hồi người bán
    status VARCHAR(20) NOT NULL DEFAULT 'pending'       -- Trạng thái
        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expires_at DATETIME NOT NULL,                       -- Tự động hết hạn sau 24h
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- BẢNG 6: vouchers (Kho mã ưu đãi, phiếu giảm giá & mã Freeship toàn sàn)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,                   -- FREESHIP, HYBRID50, VIP100...
    title VARCHAR(120) NOT NULL,
    voucher_type VARCHAR(20) NOT NULL                   -- 'percent' | 'fixed' | 'freeship'
        CHECK (voucher_type IN ('percent', 'fixed', 'freeship')),
    discount_value BIGINT NOT NULL,                     -- % (vd: 10) hoặc số tiền (vd: 50000)
    min_order_value BIGINT NOT NULL DEFAULT 0,          -- Giá trị đơn tối thiểu
    max_discount_amount BIGINT DEFAULT NULL,            -- Mức giảm tối đa nếu là %
    usage_limit INTEGER DEFAULT 1000,                   -- Giới hạn số lượt dùng
    usage_count INTEGER NOT NULL DEFAULT 0,             -- Số lượt đã dùng thực tế
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BẢNG 7: orders (Hóa đơn mua sắm trung tâm & Xuất VAT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,             -- Mã hiển thị (vd: HYB-8492)
    buyer_id VARCHAR(36) NOT NULL,
    subtotal BIGINT NOT NULL,                           -- Tổng tiền hàng trước giảm
    shipping_fee BIGINT NOT NULL DEFAULT 0,             -- Phí vận chuyển
    discount_amount BIGINT NOT NULL DEFAULT 0,          -- Tiền giảm qua voucher
    total_amount BIGINT NOT NULL,                       -- Tổng tiền thanh toán cuối cùng
    voucher_id VARCHAR(36) DEFAULT NULL,
    payment_method VARCHAR(20) NOT NULL                 -- Phương thức thanh toán
        CHECK (payment_method IN ('COD', 'VIETQR', 'CARD', 'NAPAS_ESCROW')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'held_in_escrow')),
    shipping_method VARCHAR(30) NOT NULL DEFAULT 'standard'
        CHECK (shipping_method IN ('standard', 'express_2h')),

    -- SNAPSHOT ĐỊA CHỈ NHẬN TẠI THỜI ĐIỂM ĐẶT (BẢO VỆ DỮ LIỆU)
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(15) NOT NULL,
    shipping_address TEXT NOT NULL,
    buyer_note TEXT DEFAULT '',

    -- HÓA ĐƠN VAT DOANH NGHIỆP
    vat_requested BOOLEAN NOT NULL DEFAULT 0,
    vat_company_name VARCHAR(150) DEFAULT '',
    vat_tax_code VARCHAR(30) DEFAULT '',
    vat_company_address TEXT DEFAULT '',

    -- TIẾN ĐỘ ĐƠN HÀNG 4 BƯỚC CHUẨN
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'disputed')),
    step_index INTEGER NOT NULL DEFAULT 1               -- 1: Đặt đơn, 2: Bàn giao, 3: Đang phát, 4: Đã nhận
        CHECK (step_index BETWEEN 1 AND 4),
    completed_at DATETIME DEFAULT NULL,
    cancelled_at DATETIME DEFAULT NULL,
    cancel_reason TEXT DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL
);

-- ============================================================================
-- BẢNG 8: order_parcels (Tách kiện hàng Multi-Vendor theo từng Shop & Lộ trình bưu tá)
-- Gộp từ: order_parcels + order_tracking_events (JSON)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_parcels (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,                     -- Shop xuất kiện này
    parcel_code VARCHAR(30) NOT NULL UNIQUE,            -- Mã kiện hàng riêng biệt
    parcel_type VARCHAR(20) NOT NULL                    -- 'mall_warehouse' | 'c2c_seller'
        CHECK (parcel_type IN ('mall_warehouse', 'c2c_seller')),
    carrier_name VARCHAR(60) NOT NULL,                  -- 'VNPost Nhanh Toàn Quốc', 'Bưu Tá Hỏa Tốc HYBRID'
    tracking_code VARCHAR(40) NOT NULL UNIQUE,          -- Mã bưu phẩm VNPOST-123456
    shipping_fee BIGINT NOT NULL DEFAULT 0,
    estimated_delivery VARCHAR(80),                     -- Dự kiến giao sau 2-3 ngày
    status VARCHAR(20) NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'ready_for_pickup', 'in_transit', 'delivered', 'returned')),

    -- LỘ TRÌNH VẬN ĐƠN BƯU TÁ DẠNG JSON TIMELINE
    tracking_events TEXT NOT NULL DEFAULT '[]',         -- [{"time":"...","status":"...","location":"..."}]

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================================================
-- BẢNG 9: order_items (Chi tiết từng món hàng trong kiện hàng)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    parcel_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,                 -- Tên snapshot lúc mua
    product_type VARCHAR(10) NOT NULL,                  -- 'mall' hoặc 'c2c'
    condition_pct INTEGER DEFAULT 100,                  -- Độ mới snapshot
    unit_price BIGINT NOT NULL,                         -- Đơn giá snapshot
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price BIGINT NOT NULL,                        -- unit_price * quantity
    variant_info VARCHAR(100) DEFAULT '',               -- Size M, Titan Tự Nhiên...
    thumbnail_url TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (parcel_id) REFERENCES order_parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ============================================================================
-- BẢNG 10: escrow_transactions (Sổ cái biến động dòng tiền Ví Ký Quỹ Escrow 24/7)
-- ============================================================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,                       -- Người dùng sở hữu biến động
    order_id VARCHAR(36) DEFAULT NULL,                  -- Đơn hàng liên quan (nếu có)
    transaction_code VARCHAR(40) NOT NULL UNIQUE,       -- TX-ESC-2026-XXXX
    transaction_type VARCHAR(20) NOT NULL               -- Loại biến động
        CHECK (transaction_type IN ('deposit', 'hold_order', 'release_payout', 'refund_buyer', 'withdrawal')),
    amount BIGINT NOT NULL,                             -- Số tiền biến động (+/-)
    balance_after BIGINT NOT NULL,                      -- Số dư sau biến động
    memo TEXT NOT NULL,                                 -- Nội dung khớp lệnh giao dịch
    bank_reference_code VARCHAR(50) DEFAULT '',         -- Mã chuẩn chi Napas/VietQR
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- ============================================================================
-- BẢNG 11: disputes (Phòng trọng tài tranh chấp 3 bên, Bằng chứng mở hộp & Chat log)
-- Gộp từ: disputes + dispute_evidences (JSON) + dispute_messages (JSON)
-- ============================================================================
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(36) PRIMARY KEY,
    dispute_code VARCHAR(30) NOT NULL UNIQUE,           -- DSP-2026-001
    order_id VARCHAR(36) NOT NULL UNIQUE,               -- 1 đơn hàng chỉ có 1 vụ việc
    buyer_id VARCHAR(36) NOT NULL,                      -- Người mua khiếu nại
    seller_id VARCHAR(36) NOT NULL,                     -- Người bán bị khiếu nại
    reason VARCHAR(150) NOT NULL,                       -- Lý do: Hàng không đúng mô tả, máy lỗi...
    description TEXT NOT NULL,                          -- Tường trình chi tiết của người mua
    requested_refund BIGINT NOT NULL,                   -- Số tiền yêu cầu hoàn
    approved_refund BIGINT DEFAULT 0,                   -- Số tiền Admin duyệt hoàn
    status VARCHAR(30) NOT NULL DEFAULT 'pending'       -- Trạng thái vụ việc
        CHECK (status IN ('pending', 'seller_responded', 'in_arbitration', 'resolved', 'closed')),
    arbitrator_admin_id VARCHAR(36) DEFAULT NULL,       -- Admin phụ trách phán quyết
    admin_decision_summary TEXT DEFAULT '',             -- Tóm tắt phán quyết trọng tài
    solution_code VARCHAR(30) DEFAULT ''                -- 'full_refund' | 'partial_refund' | 'reject_claim'
        CHECK (solution_code IN ('', 'full_refund', 'partial_refund', 'reject_claim')),
    resolved_at DATETIME DEFAULT NULL,

    -- BẰNG CHỨNG MỞ HỘP ĐỒNG KIỂM DẠNG JSON
    evidences TEXT NOT NULL DEFAULT '[]',               -- [{"url":"...","type":"video","title":"..."}]

    -- NHẬT KÝ TRAO ĐỔI PHÒNG TRỌNG TÀI 3 BÊN (CHAT LOG JSON)
    messages TEXT NOT NULL DEFAULT '[]',                -- [{"sender_role":"buyer","text":"...","time":"..."}]

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (arbitrator_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- BẢNG 12: product_reviews (Đánh giá người mua thực tế & Huy hiệu Verified Buyer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) DEFAULT NULL,                  -- Đơn hàng đã mua
    user_id VARCHAR(36) NOT NULL,                       -- Người mua đánh giá
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    has_photo BOOLEAN NOT NULL DEFAULT 0,
    is_verified_buyer BOOLEAN NOT NULL DEFAULT 1,       -- Huy hiệu "Đã mua hàng thật"
    seller_reply TEXT DEFAULT '',                       -- Shop phản hồi
    seller_replied_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- CHỈ MỤC TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN (INDEXES)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(selling_price);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_parcel ON order_items(parcel_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_offers_product ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON product_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON product_offers(seller_id);

CREATE INDEX IF NOT EXISTS idx_escrow_user ON escrow_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
