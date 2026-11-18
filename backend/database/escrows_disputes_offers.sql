-- ============================================================================
-- TASK [TF257E6]: Dựa trên ERD đã chốt (T31), viết phần CREATE TABLE
--                 escrows, disputes, offers, trạng thái, ràng buộc & dữ liệu mẫu
-- DỰ ÁN:          HYBRID.STORE (Sàn TMĐT Brand Mall B2C & Chợ C2C Like New)
-- HỆ QUẢN TRỊ:    MySQL 8.0+ / MySQL Workbench / MariaDB 10.4+ (XAMPP)
-- CÁCH CHẠY:      Mở file này trong MySQL Workbench (hoặc phpMyAdmin -> Import)
--                 và bấm Execute (Ctrl + Shift + Enter) để tạo DB + bảng + dữ liệu mẫu.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS hybrid_store
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hybrid_store;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- PHẦN 0: CÁC BẢNG CHA LIÊN QUAN THEO ERD T31 (TẠO SẴN ĐỂ CHẠY ĐỘC LẬP TRÊN MYSQL)
-- (users, products, orders, escrow_wallets là khóa ngoại mà 3 bảng chính tham chiếu)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('buyer', 'seller', 'admin', 'inspector') NOT NULL DEFAULT 'buyer',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(40) UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(120),
    seller_id VARCHAR(36) NOT NULL,
    product_type ENUM('mall', 'c2c') NOT NULL DEFAULT 'c2c',
    condition_pct INT NOT NULL DEFAULT 100 CHECK (condition_pct BETWEEN 50 AND 100),
    original_price BIGINT NOT NULL CHECK (original_price > 0),
    selling_price BIGINT NOT NULL CHECK (selling_price > 0),
    allow_offers TINYINT(1) NOT NULL DEFAULT 1,
    status ENUM('active', 'sold_out', 'hidden', 'draft') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    buyer_id VARCHAR(36) NOT NULL,
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
    shipping_fee BIGINT NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    payment_method ENUM('COD', 'VIETQR', 'CARD', 'NAPAS_ESCROW') NOT NULL DEFAULT 'NAPAS_ESCROW',
    payment_status ENUM('unpaid', 'paid', 'refunded', 'held_in_escrow') NOT NULL DEFAULT 'unpaid',
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(15) NOT NULL,
    shipping_address TEXT NOT NULL,
    status ENUM('pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'disputed') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS escrow_wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    available_balance BIGINT NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
    locked_balance BIGINT NOT NULL DEFAULT 0 CHECK (locked_balance >= 0),
    total_withdrawn BIGINT NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_escrow_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHẦN 1: BẢNG OFFERS (THƯƠNG LƯỢNG & TRẢ GIÁ SẢN PHẨM C2C)
-- ============================================================================
-- Trạng thái (status):
--   'pending'   : Người mua vừa gửi trả giá, chờ người bán phản hồi
--   'countered' : Người bán gửi mức giá đề nghị lại (counter_price)
--   'accepted'  : Hai bên chốt giá (final_agreed_price), tạo đơn hàng (order_id)
--   'rejected'  : Người bán từ chối đề nghị
--   'expired'   : Quá thời hạn (expires_at) chưa được xử lý
--   'cancelled' : Người mua chủ động hủy đề nghị
-- ============================================================================
CREATE TABLE IF NOT EXISTS offers (
    id VARCHAR(36) PRIMARY KEY,
    offer_code VARCHAR(30) NOT NULL UNIQUE,              -- Mã đề nghị (vd: OFF-20261117-01)
    product_id VARCHAR(36) NOT NULL,                     -- Sản phẩm C2C được trả giá
    buyer_id VARCHAR(36) NOT NULL,                       -- Người mua gửi đề nghị
    seller_id VARCHAR(36) NOT NULL,                      -- Người bán sở hữu sản phẩm
    order_id VARCHAR(36) NULL DEFAULT NULL,              -- Đơn hàng phát sinh khi chốt giá
    original_price BIGINT NOT NULL                       -- Giá niêm yết lúc trả giá (VND)
        CHECK (original_price > 0),
    offered_price BIGINT NOT NULL                        -- Giá người mua đề xuất (VND)
        CHECK (offered_price > 0),
    counter_price BIGINT NULL DEFAULT NULL               -- Giá người bán đề nghị lại (VND)
        CHECK (counter_price IS NULL OR counter_price > 0),
    final_agreed_price BIGINT NULL DEFAULT NULL          -- Giá chốt cuối cùng khi accepted (VND)
        CHECK (final_agreed_price IS NULL OR final_agreed_price > 0),
    discount_pct TINYINT UNSIGNED NOT NULL               -- Tỉ lệ giảm % (tối đa 50%)
        CHECK (discount_pct BETWEEN 0 AND 50),
    buyer_message VARCHAR(500) NOT NULL DEFAULT '',      -- Lời nhắn của người mua
    seller_note VARCHAR(500) NOT NULL DEFAULT '',        -- Phản hồi của người bán
    status ENUM('pending', 'countered', 'accepted', 'rejected', 'expired', 'cancelled')
        NOT NULL DEFAULT 'pending',
    expires_at DATETIME NOT NULL,                        -- Thời hạn hiệu lực (mặc định +24 giờ)
    responded_at DATETIME NULL DEFAULT NULL,             -- Thời điểm người bán phản hồi
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ràng buộc nghiệp vụ (CHECK Constraints)
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

    -- Khóa ngoại (Foreign Keys — dùng ON DELETE RESTRICT để tương thích CHECK của MySQL 8.0)
    CONSTRAINT fk_offers_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_offers_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE RESTRICT,
    CONSTRAINT fk_offers_seller  FOREIGN KEY (seller_id)  REFERENCES users(id)    ON DELETE RESTRICT,
    CONSTRAINT fk_offers_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE SET NULL,

    -- Chỉ mục tối ưu truy vấn (Indexes)
    INDEX idx_offers_product_status (product_id, status),
    INDEX idx_offers_buyer_status   (buyer_id, status),
    INDEX idx_offers_seller_status  (seller_id, status),
    INDEX idx_offers_status_expires (status, expires_at),
    INDEX idx_offers_order          (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHẦN 2: BẢNG ESCROWS (KÝ QUỸ ĐẢM BẢO GIAO DỊCH THEO TỪNG ĐƠN HÀNG)
-- ============================================================================
-- Trạng thái (status):
--   'pending_deposit'    : Chờ người mua nạp tiền vào quỹ ký quỹ
--   'holding'            : Đang tạm giữ an toàn (chờ giao hàng & đồng kiểm)
--   'frozen'             : Đang đóng băng do có hồ sơ tranh chấp (Dispute)
--   'released'           : Đã giải ngân cho người bán (sau khi trừ phí sàn)
--   'refunded'           : Đã hoàn tiền 100% cho người mua
--   'partially_refunded' : Hoàn một phần cho người mua, giải ngân phần còn lại
--   'cancelled'          : Đã hủy trước khi nạp tiền
-- ============================================================================
CREATE TABLE IF NOT EXISTS escrows (
    id VARCHAR(36) PRIMARY KEY,
    escrow_code VARCHAR(40) NOT NULL UNIQUE,             -- Mã hợp đồng ký quỹ (vd: ESC-20261108-9841)
    order_id VARCHAR(36) NOT NULL UNIQUE,                -- 1 đơn hàng tối đa 1 hợp đồng ký quỹ
    buyer_id VARCHAR(36) NOT NULL,                       -- Người mua nộp tiền ký quỹ
    seller_id VARCHAR(36) NOT NULL,                      -- Người bán thụ hưởng khi giải ngân
    seller_wallet_id VARCHAR(36) NULL DEFAULT NULL,      -- Ví ký quỹ của người bán
    amount BIGINT NOT NULL                               -- Tổng số tiền ký quỹ (VND)
        CHECK (amount > 0),
    platform_fee BIGINT NOT NULL DEFAULT 0               -- Phí dịch vụ sàn (VND)
        CHECK (platform_fee >= 0),
    net_payout_amount BIGINT NOT NULL DEFAULT 0          -- Tiền thực nhận của người bán (VND)
        CHECK (net_payout_amount >= 0),
    refunded_amount BIGINT NOT NULL DEFAULT 0            -- Tiền hoàn trả cho người mua (VND)
        CHECK (refunded_amount >= 0),
    payment_channel ENUM('NAPAS_ESCROW', 'VIETQR', 'CARD', 'WALLET')
        NOT NULL DEFAULT 'NAPAS_ESCROW',
    bank_reference_code VARCHAR(60) NOT NULL DEFAULT '', -- Mã đối soát Napas/VietQR
    status ENUM(
        'pending_deposit',
        'holding',
        'frozen',
        'released',
        'refunded',
        'partially_refunded',
        'cancelled'
    ) NOT NULL DEFAULT 'pending_deposit',
    hold_reason VARCHAR(500) NOT NULL DEFAULT '',        -- Lý do tạm giữ / đóng băng
    held_at DATETIME NULL DEFAULT NULL,                  -- Thời điểm bắt đầu giữ tiền
    auto_release_at DATETIME NULL DEFAULT NULL,          -- Hạn tự động giải ngân nếu không khiếu nại
    frozen_at DATETIME NULL DEFAULT NULL,                -- Thời điểm đóng băng do tranh chấp
    released_at DATETIME NULL DEFAULT NULL,              -- Thời điểm giải ngân cho người bán
    refunded_at DATETIME NULL DEFAULT NULL,              -- Thời điểm hoàn tiền cho người mua
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ràng buộc nghiệp vụ & cân đối dòng tiền (CHECK Constraints)
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

    -- Khóa ngoại (Foreign Keys)
    CONSTRAINT fk_escrows_order  FOREIGN KEY (order_id)         REFERENCES orders(id)         ON DELETE RESTRICT,
    CONSTRAINT fk_escrows_buyer  FOREIGN KEY (buyer_id)         REFERENCES users(id)          ON DELETE RESTRICT,
    CONSTRAINT fk_escrows_seller FOREIGN KEY (seller_id)        REFERENCES users(id)          ON DELETE RESTRICT,
    CONSTRAINT fk_escrows_wallet FOREIGN KEY (seller_wallet_id) REFERENCES escrow_wallets(id) ON DELETE SET NULL,

    -- Chỉ mục tối ưu truy vấn (Indexes)
    INDEX idx_escrows_buyer_status       (buyer_id, status),
    INDEX idx_escrows_seller_status      (seller_id, status),
    INDEX idx_escrows_status_autorelease (status, auto_release_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHẦN 3: BẢNG DISPUTES (HỒ SƠ KHIẾU NẠI & PHÂN XỬ TRANH CHẤP 3 BÊN)
-- ============================================================================
-- Trạng thái (status):
--   'pending'          : Người mua vừa mở khiếu nại, chờ người bán phản hồi
--   'seller_responded' : Người bán đã giải trình / đề xuất hòa giải
--   'in_arbitration'   : Trọng tài sàn đang phân xử 3 bên
--   'resolved'         : Đã chốt phán quyết, đang thi hành hoàn tiền/đổi trả
--   'rejected'         : Bác bỏ khiếu nại (không đủ căn cứ)
--   'closed'           : Đã thi hành xong phán quyết và đóng hồ sơ
--   'withdrawn'        : Người mua tự rút khiếu nại
-- ============================================================================
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(36) PRIMARY KEY,
    dispute_code VARCHAR(30) NOT NULL UNIQUE,            -- Mã hồ sơ tranh chấp (vd: DSP-20261108-01)
    order_id VARCHAR(36) NOT NULL UNIQUE,                -- 1 đơn hàng tối đa 1 hồ sơ tranh chấp
    escrow_id VARCHAR(36) NULL DEFAULT NULL,             -- Giao dịch ký quỹ bị đóng băng liên quan
    buyer_id VARCHAR(36) NOT NULL,                       -- Bên khiếu nại (Người mua)
    seller_id VARCHAR(36) NOT NULL,                      -- Bên bị khiếu nại (Người bán)
    reason_category ENUM(
        'not_as_described',
        'damaged_in_transit',
        'missing_accessories',
        'counterfeit',
        'defective_hardware',
        'not_received',
        'other'
    ) NOT NULL DEFAULT 'not_as_described',
    reason VARCHAR(150) NOT NULL,                        -- Tiêu đề tóm tắt lý do khiếu nại
    description TEXT NOT NULL,                           -- Tường trình chi tiết của người mua
    requested_refund BIGINT NOT NULL                     -- Số tiền yêu cầu hoàn (VND)
        CHECK (requested_refund >= 0),
    approved_refund BIGINT NOT NULL DEFAULT 0            -- Số tiền Trọng tài duyệt hoàn (VND)
        CHECK (approved_refund >= 0),
    status ENUM(
        'pending',
        'seller_responded',
        'in_arbitration',
        'resolved',
        'rejected',
        'closed',
        'withdrawn'
    ) NOT NULL DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    arbitrator_admin_id VARCHAR(36) NULL DEFAULT NULL,   -- Trọng tài viên / Admin phụ trách
    admin_decision_summary TEXT NULL,                    -- Biên bản tóm tắt phán quyết trọng tài
    solution_code ENUM(
        '',
        'full_refund',
        'partial_refund',
        'exchange_1_to_1',
        'voucher_compensation',
        'reject_claim'
    ) NOT NULL DEFAULT '',
    sla_deadline_at DATETIME NULL DEFAULT NULL,          -- Hạn chót SLA phản hồi/phán quyết (48h)
    resolved_at DATETIME NULL DEFAULT NULL,              -- Thời điểm ra phán quyết
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ràng buộc nghiệp vụ & tính trung lập trọng tài (CHECK Constraints)
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

    -- Khóa ngoại (Foreign Keys)
    CONSTRAINT fk_disputes_order      FOREIGN KEY (order_id)            REFERENCES orders(id)  ON DELETE RESTRICT,
    CONSTRAINT fk_disputes_escrow     FOREIGN KEY (escrow_id)           REFERENCES escrows(id) ON DELETE SET NULL,
    CONSTRAINT fk_disputes_buyer      FOREIGN KEY (buyer_id)            REFERENCES users(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_disputes_seller     FOREIGN KEY (seller_id)           REFERENCES users(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_disputes_arbitrator FOREIGN KEY (arbitrator_admin_id) REFERENCES users(id)   ON DELETE RESTRICT,

    -- Chỉ mục tối ưu truy vấn (Indexes)
    INDEX idx_disputes_escrow     (escrow_id),
    INDEX idx_disputes_buyer      (buyer_id),
    INDEX idx_disputes_seller     (seller_id),
    INDEX idx_disputes_queue      (status, priority, sla_deadline_at),
    INDEX idx_disputes_arbitrator (arbitrator_admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PHẦN 4: DỮ LIỆU MẪU (SEED DATA CHUẨN MYSQL — DÙNG INSERT IGNORE)
-- ============================================================================

-- 4.1. Dữ liệu bảng cha tối thiểu (users, escrow_wallets, products, orders)
INSERT IGNORE INTO users (id, email, phone, password_hash, full_name, role) VALUES
('u_admin_01',  'admin@hybrid.store',       '0901000999', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Hà Quang Minh', 'admin'),
('u_admin_02',  'arbitrator@hybrid.store',  '0901000888', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Trần Minh Đức (Trọng Tài Sàn)', 'admin'),
('u_seller_01', 'seller@hybrid.store',      '0912345678', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Việt Dũng Store', 'seller'),
('u_buyer_01',  'buyer@hybrid.store',       '0987654321', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Trần Thu Trang', 'buyer'),
('u_buyer_02',  'phuc.nguyen@hybrid.store', '0912888999', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Nguyễn Ngọc Phúc', 'buyer'),
('u_buyer_03',  'quanghuy@hybrid.store',    '0936112233', '$2b$12$K8yXbT.a9m8A3vH1v0bEfeZtUq7WvJ8eK1LmX9oP0qR2sT4uV6wWy', 'Lê Quang Huy', 'buyer');

INSERT IGNORE INTO escrow_wallets (id, user_id, available_balance, locked_balance, total_withdrawn) VALUES
('w_admin_01',  'u_admin_01',  1250000000, 45000000, 320000000),
('w_seller_01', 'u_seller_01',   34500000, 26990000,  85000000),
('w_buyer_01',  'u_buyer_01',     5000000,        0,         0),
('w_buyer_02',  'u_buyer_02',     2000000,        0,         0),
('w_buyer_03',  'u_buyer_03',     8500000,        0,         0);

INSERT IGNORE INTO products (id, sku, name, short_name, seller_id, product_type, condition_pct, original_price, selling_price, allow_offers, status) VALUES
('m01', 'HYB-MALL-001', 'Áo Khoác Bomber Cyberpunk J1A-GT Multi-Pocket', 'Bomber Cyberpunk J1A-GT', 'u_admin_01', 'mall', 100, 5200000, 4690000, 0, 'active'),
('m02', 'HYB-MALL-002', 'Máy Hút Bụi Cầm Tay Không Dây Dyson V12 Detect Slim', 'Dyson V12 Detect Slim', 'u_admin_01', 'mall', 100, 19990000, 16990000, 0, 'active'),
('m03', 'HYB-MALL-003', 'Tai Nghe Chống Ồn Không Dây Sony WH-1000XM5', 'Sony WH-1000XM5', 'u_admin_01', 'mall', 100, 8990000, 7490000, 0, 'active'),
('c01', 'HYB-C2C-001',  'iPhone 15 Pro Max 256GB Titan Tự Nhiên (Like New 99%)', 'iPhone 15 Pro Max 256GB', 'u_seller_01', 'c2c', 99, 29990000, 21990000, 1, 'active'),
('c02', 'HYB-C2C-002',  'Máy Chơi Game Nintendo Switch OLED Model White (Like New 98%)', 'Nintendo Switch OLED', 'u_seller_01', 'c2c', 98, 8500000, 5800000, 1, 'active'),
('c03', 'HYB-C2C-003',  'Body Máy Ảnh Sony Alpha A7 Mark IV Fullbox (Like New 99%)', 'Sony Alpha A7 Mark IV', 'u_seller_01', 'c2c', 99, 45900000, 37800000, 1, 'active'),
('c04', 'HYB-C2C-004',  'Giày Sneaker Chunky Sole Hypebeast Size 42 (Like New 95%)', 'Sneaker Chunky Sole 95%', 'u_seller_01', 'c2c', 95, 3800000, 2250000, 1, 'active');

INSERT IGNORE INTO orders (id, order_code, buyer_id, subtotal, shipping_fee, discount_amount, total_amount, payment_method, payment_status, recipient_name, recipient_phone, shipping_address, status, created_at) VALUES
('ord_01', 'ORD-20261108-9841', 'u_buyer_02', 21990000, 0, 500000, 21490000, 'NAPAS_ESCROW', 'held_in_escrow', 'Nguyễn Ngọc Phúc', '0912888999', 'Tầng 18, Tòa Keangnam Landmark 72, Nam Từ Liêm, Hà Nội', 'disputed',  '2026-11-08 09:00:00'),
('ord_02', 'ORD-20261105-7720', 'u_buyer_01',  2250000, 0,      0,  2250000, 'NAPAS_ESCROW', 'paid',           'Trần Thu Trang',   '0987654321', 'Tầng 12, Tòa Keangnam Landmark 72, Nam Từ Liêm, Hà Nội', 'completed', '2026-11-05 09:15:00'),
('ord_03', 'ORD-20261114-8832', 'u_buyer_01',  5500000, 0,      0,  5500000, 'VIETQR',       'held_in_escrow', 'Trần Thu Trang',   '0987654321', 'Tầng 12, Tòa Keangnam Landmark 72, Nam Từ Liêm, Hà Nội', 'shipping',  '2026-11-14 08:15:00'),
('ord_04', 'ORD-20261102-6610', 'u_buyer_03',  7490000, 0,      0,  7490000, 'NAPAS_ESCROW', 'refunded',       'Lê Quang Huy',     '0936112233', 'Số 45 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',       'cancelled', '2026-11-02 10:00:00'),
('ord_05', 'ORD-20261110-7105', 'u_buyer_03',  4690000, 0,      0,  4690000, 'CARD',         'paid',           'Lê Quang Huy',     '0936112233', 'Số 45 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',       'completed', '2026-11-10 11:20:00'),
('ord_06', 'ORD-20261116-9012', 'u_buyer_02', 16990000, 0,      0, 16990000, 'NAPAS_ESCROW', 'held_in_escrow', 'Nguyễn Ngọc Phúc', '0912888999', 'Tầng 18, Tòa Keangnam Landmark 72, Nam Từ Liêm, Hà Nội', 'disputed',  '2026-11-16 09:00:00');

-- 4.2. Dữ liệu mẫu bảng OFFERS (phủ đủ 6 trạng thái)
INSERT IGNORE INTO offers (id, offer_code, product_id, buyer_id, seller_id, order_id, original_price, offered_price, counter_price, final_agreed_price, discount_pct, buyer_message, seller_note, status, expires_at, responded_at, created_at, updated_at) VALUES
('off_01', 'OFF-20261117-01', 'c03', 'u_buyer_03', 'u_seller_01', NULL,     37800000, 34000000, NULL,     NULL,     10, 'Em qua xem máy trực tiếp tại showroom lấy luôn trong chiều nay ạ, bác bớt chút lộc lá cho em nhé!', '', 'pending', '2026-11-19 18:00:00', NULL, '2026-11-17 18:00:00', '2026-11-17 18:00:00'),
('off_02', 'OFF-20261117-02', 'c01', 'u_buyer_01', 'u_seller_01', NULL,     21990000, 20500000, 21200000, NULL,      7, 'Bác để em tròn 20.5 triệu em cọc chuyển khoản Escrow luôn tối nay bác nhé!', 'Máy pin 98% đã test 15 bước, mình hỗ trợ giảm tối đa còn 21.2 triệu kèm miễn phí ship hỏa tốc nhé bạn.', 'countered', '2026-11-19 20:00:00', '2026-11-17 20:15:00', '2026-11-17 19:30:00', '2026-11-17 20:15:00'),
('off_03', 'OFF-20261113-03', 'c02', 'u_buyer_01', 'u_seller_01', 'ord_03',  5800000,  5500000, NULL,      5500000,  5, 'Mình đặt cọc thanh toán VietQR ngay nếu shop chốt 5.5 triệu nhé.', 'Ok chốt giá 5.500.000đ cho bạn, hệ thống đã tạo đơn hàng ORD-20261114-8832!', 'accepted', '2026-11-14 14:00:00', '2026-11-13 15:10:00', '2026-11-13 14:00:00', '2026-11-13 15:10:00'),
('off_04', 'OFF-20261112-04', 'c01', 'u_buyer_03', 'u_seller_01', NULL,     21990000, 15000000, NULL,     NULL,     32, 'Shop để mình 15 triệu được không?', 'Cảm ơn bạn quan tâm, mức giá này thấp hơn nhiều so với giá nhập kiểm định nên shop không thể chốt ạ.', 'rejected', '2026-11-13 10:00:00', '2026-11-12 11:00:00', '2026-11-12 10:00:00', '2026-11-12 11:00:00'),
('off_05', 'OFF-20261110-05', 'c02', 'u_buyer_02', 'u_seller_01', NULL,      5800000,  5200000, NULL,     NULL,     10, '5.2 triệu mình qua lấy trong ngày mai nhé shop.', '', 'expired', '2026-11-11 09:00:00', NULL, '2026-11-10 09:00:00', '2026-11-11 09:00:05'),
('off_06', 'OFF-20261111-06', 'c04', 'u_buyer_03', 'u_seller_01', NULL,      2250000,  1950000, NULL,     NULL,     13, 'Đôi này 1tr950 được không shop ơi?', '', 'cancelled', '2026-11-12 16:00:00', NULL, '2026-11-11 16:00:00', '2026-11-11 16:45:00');

-- 4.3. Dữ liệu mẫu bảng ESCROWS (phủ các trạng thái: frozen, released, holding, refunded, partially_refunded)
INSERT IGNORE INTO escrows (id, escrow_code, order_id, buyer_id, seller_id, seller_wallet_id, amount, platform_fee, net_payout_amount, refunded_amount, payment_channel, bank_reference_code, status, hold_reason, held_at, auto_release_at, frozen_at, released_at, refunded_at, created_at, updated_at) VALUES
('esc_01', 'ESC-20261108-9841', 'ord_01', 'u_buyer_02', 'u_seller_01', 'w_seller_01', 21490000, 644700,       0,       0, 'NAPAS_ESCROW', 'NAPAS-20261108-984101',  'frozen',             'Đóng băng theo hồ sơ tranh chấp DSP-20261108-01 (vết cấn viền camera 1.5mm)', '2026-11-08 09:02:00', '2026-11-15 15:20:00', '2026-11-08 15:35:00', NULL,                  NULL,                  '2026-11-08 09:00:00', '2026-11-08 15:35:00'),
('esc_02', 'ESC-20261105-7720', 'ord_02', 'u_buyer_01', 'u_seller_01', 'w_seller_01',  2250000,  67500, 2182500,       0, 'NAPAS_ESCROW', 'NAPAS-20261105-772002',  'released',           '',                                                                            '2026-11-05 09:16:00', '2026-11-12 15:20:00', NULL,                  '2026-11-12 15:20:00', NULL,                  '2026-11-05 09:15:00', '2026-11-12 15:20:00'),
('esc_03', 'ESC-20261114-8832', 'ord_03', 'u_buyer_01', 'u_seller_01', 'w_seller_01',  5500000, 165000,       0,       0, 'VIETQR',       'VIETQR-20261114-883203', 'holding',            'Tạm giữ 7 ngày bảo vệ người mua trong quá trình giao nhận & đồng kiểm',        '2026-11-14 08:17:00', '2026-11-23 08:17:00', NULL,                  NULL,                  NULL,                  '2026-11-14 08:15:00', '2026-11-14 08:17:00'),
('esc_04', 'ESC-20261102-6610', 'ord_04', 'u_buyer_03', 'u_admin_01',  'w_admin_01',   7490000,      0,       0, 7490000, 'NAPAS_ESCROW', 'NAPAS-REF-20261104-6610','refunded',           'Hoàn tiền 100% theo phán quyết DSP-20261102-02',                              '2026-11-02 10:02:00', '2026-11-09 10:02:00', '2026-11-03 18:00:00', NULL,                  '2026-11-04 14:25:00', '2026-11-02 10:00:00', '2026-11-04 14:25:00'),
('esc_05', 'ESC-20261110-7105', 'ord_05', 'u_buyer_03', 'u_admin_01',  'w_admin_01',   4690000, 140700, 4049300,  500000, 'CARD',         'CARD-PART-20261112-7105','partially_refunded', 'Hoàn một phần 500.000đ (thiếu dây đeo Sling) theo phán quyết DSP-20261110-03','2026-11-10 11:22:00', '2026-11-17 11:22:00', '2026-11-11 14:00:00', '2026-11-12 16:20:00', '2026-11-12 16:15:00', '2026-11-10 11:20:00', '2026-11-12 16:20:00'),
('esc_06', 'ESC-20261116-9012', 'ord_06', 'u_buyer_02', 'u_admin_01',  'w_admin_01',  16990000, 509700,       0,       0, 'NAPAS_ESCROW', 'NAPAS-20261116-901206',  'frozen',             'Tự động đóng băng khi người mua mở khiếu nại DSP-20261118-04',                '2026-11-16 09:05:00', '2026-11-25 09:05:00', '2026-11-18 10:15:00', NULL,                  NULL,                  '2026-11-16 09:00:00', '2026-11-18 10:15:00');

-- 4.4. Dữ liệu mẫu bảng DISPUTES (phủ các trạng thái: in_arbitration, closed, resolved, pending)
INSERT IGNORE INTO disputes (id, dispute_code, order_id, escrow_id, buyer_id, seller_id, reason_category, reason, description, requested_refund, approved_refund, status, priority, arbitrator_admin_id, admin_decision_summary, solution_code, sla_deadline_at, resolved_at, created_at, updated_at) VALUES
('dsp_01', 'DSP-20261108-01', 'ord_01', 'esc_01', 'u_buyer_02', 'u_seller_01', 'not_as_described',    'Ngoại quan viền camera có vết cấn 1.5mm không đúng cam kết Like New 99%', 'Khách hàng mở hộp đồng kiểm dưới sự chứng kiến của bưu tá VNPost Hoàng Văn Thắng. Tem màng vỡ QR-HYBRID-884920 nguyên vẹn nhưng viền camera góc trên bên phải có vết cấn 1.5mm. Yêu cầu hoàn tiền 100% hoặc đổi máy khác.', 21490000,       0, 'in_arbitration', 'high',   'u_admin_01', 'Trọng tài đã xác minh video mở hộp 4K và biên bản đồng kiểm VNPost. Đang chờ các bên ký duyệt phương án hòa giải.', '',               '2026-11-10 15:30:00', NULL,                  '2026-11-08 15:30:00', '2026-11-08 17:00:00'),
('dsp_02', 'DSP-20261102-02', 'ord_04', 'esc_04', 'u_buyer_03', 'u_admin_01',  'damaged_in_transit',  'Hộp tai nghe Sony WH-1000XM5 bị móp nặng và rách seal khi giao',         'Khi nhận kiện hàng từ đơn vị vận chuyển, góc hộp bị va đập mạnh làm biến dạng hộp cứng và bung seal niêm phong nhà sản xuất.',                                                                                                 7490000, 7490000, 'closed',         'high',   'u_admin_02', 'Phê duyệt hoàn tiền 100% (7.490.000đ) qua Napas 24/7 và thu hồi hàng về kho Mall miễn phí.',                       'full_refund',    '2026-11-05 18:00:00', '2026-11-04 14:20:00', '2026-11-03 18:00:00', '2026-11-04 14:25:00'),
('dsp_03', 'DSP-20261110-03', 'ord_05', 'esc_05', 'u_buyer_03', 'u_admin_01',  'missing_accessories', 'Thiếu dây đeo phong cách Sling đi kèm áo khoác Bomber',                  'Áo khoác đúng size và chất lượng tốt nhưng trong hộp thiếu dây đeo Sling như mô tả phụ kiện đi kèm.',                                                                                                                          1000000,  500000, 'resolved',       'normal', 'u_admin_02', 'Hai bên đồng thuận phương án hoàn tiền một phần 500.000đ, người mua giữ lại sản phẩm.',                            'partial_refund', '2026-11-13 14:00:00', '2026-11-12 16:00:00', '2026-11-11 14:00:00', '2026-11-12 16:20:00'),
('dsp_04', 'DSP-20261118-04', 'ord_06', 'esc_06', 'u_buyer_02', 'u_admin_01',  'missing_accessories', 'Thiếu 01 đầu hút khe hẹp trong bộ 5 đầu hút Dyson V12',                  'Mở hộp kiểm tra thấy có 4 đầu hút thay vì 5 đầu hút như mô tả. Đề nghị shop gửi bù đầu hút hoặc hỗ trợ hoàn tiền chênh lệch.',                                                                                                 1500000,       0, 'pending',        'normal', NULL,         NULL,                                                                                                               '',               '2026-11-20 10:15:00', NULL,                  '2026-11-18 10:15:00', '2026-11-18 10:15:00');

-- ============================================================================
-- PHẦN 5: TRUY VẤN KIỂM TRA NHANH SAU KHI CHẠY (VERIFICATION QUERIES)
-- ============================================================================
SELECT e.escrow_code, o.order_code, e.status, e.amount, e.platform_fee, e.net_payout_amount, e.refunded_amount
FROM escrows e
JOIN orders o ON o.id = e.order_id
ORDER BY e.id;

SELECT d.dispute_code, o.order_code, e.escrow_code, d.status, d.priority, d.requested_refund, d.approved_refund, d.solution_code
FROM disputes d
JOIN orders o ON o.id = d.order_id
LEFT JOIN escrows e ON e.id = d.escrow_id
ORDER BY d.id;

SELECT f.offer_code, p.short_name, f.status, f.original_price, f.offered_price, f.counter_price, f.final_agreed_price, f.discount_pct
FROM offers f
JOIN products p ON p.id = f.product_id
ORDER BY f.id;
