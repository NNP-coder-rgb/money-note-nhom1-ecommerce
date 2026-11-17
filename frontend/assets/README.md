# Cấu Trúc Thư Mục Tài Nguyên (Assets) — HYBRID.STORE

Thư mục `assets` chứa toàn bộ hình ảnh, biểu trưng, logo, huy hiệu chứng nhận và icon vector của hệ thống sàn thương mại điện tử **HYBRID.STORE**.

---

## 📁 Sơ Đồ Cấu Trúc Thư Mục

```text
frontend/assets/
├── README.md                   # Hướng dẫn quy chuẩn tài nguyên
├── fonts/                      # Phông chữ cục bộ (.woff2, .woff)
│   └── README.md
├── icons/                      # Biểu tượng SVG giao diện dùng chung
│   ├── bell.svg                # Chuông thông báo
│   ├── cart.svg                # Giỏ hàng
│   ├── handshake.svg           # Trả giá / Thương lượng
│   ├── heart.svg               # Yêu thích (Wishlist)
│   ├── qr-code.svg             # Mã QR
│   ├── search.svg              # Kính lúp tìm kiếm
│   ├── shield-check.svg        # Khiên bảo mật
│   ├── star.svg                # Đánh giá sao
│   ├── truck.svg               # Vận chuyển / Giao hàng
│   └── user.svg                # Người dùng / Tài khoản
└── images/                     # Hình ảnh đồ họa & Huy hiệu hệ thống
    ├── avatars/                # Ảnh đại diện mẫu
    │   ├── default-avatar.svg  # Avatar mặc định người mua
    │   └── seller-avatar.svg   # Avatar người bán đã xác thực CCCD
    ├── badges/                 # Huy hiệu kiểm định & chứng nhận
    │   ├── c2c-badge.svg       # Huy hiệu C2C Like New 99%
    │   ├── iso-security.svg    # Huy hiệu ISO 27001 / SOC 2
    │   ├── mall-badge.svg      # Huy hiệu Official Mall 100%
    │   └── verified-badge.svg  # Huy hiệu Verified Citizen (Đã eKYC)
    ├── banners/                # Banner quảng bá & sự kiện
    │   ├── flash-sale-banner.svg # Banner Flash Sale 48H
    │   └── hero-banner.svg     # Banner trang chủ chính
    ├── logo/                   # Nhận diện thương hiệu sàn
    │   ├── favicon.svg         # Favicon vector
    │   ├── logo-icon.svg       # Biểu tượng khối Token (Cyber Violet)
    │   └── logo.svg            # Logo đầy đủ HYBRID.STORE
    ├── payment/                # Cổng & Phương thức thanh toán
    │   ├── cod.svg             # COD Đồng Kiểm 100%
    │   ├── mastercard.svg      # Cổng thẻ quốc tế Mastercard
    │   ├── napas247.svg        # Cổng Napas 24/7 chính thức
    │   ├── vietqr.svg          # Mã chuẩn ngân hàng VietQR
    │   └── visa.svg            # Thẻ quốc tế Visa
    └── products/               # Ảnh vector mẫu 4 ngành hàng
        ├── audio-sample.svg    # Hi-Tech Audio Lab
        ├── phone-sample.svg    # Smartphone & Tech C2C
        ├── smarthome-sample.svg # Smart Living IoT
        └── sneakers-sample.svg # Sneakers Hypebeast
```

---

## 🚀 Hướng Dẫn Sử Dụng Trong Dự Án

### 1. Nhúng Logo Trong HTML:
```html
<img src="../../assets/images/logo/logo.svg" alt="HYBRID.STORE Logo" width="180" height="36" />
```

### 2. Nhúng Cổng Thanh Toán Napas 24/7 & VietQR:
```html
<img src="../../assets/images/payment/vietqr.svg" alt="VietQR" width="90" />
<img src="../../assets/images/payment/napas247.svg" alt="Napas 24/7" width="90" />
```

### 3. Nhúng Huy Hiệu Xác Thực & Bảo Mật:
```html
<img src="../../assets/images/badges/verified-badge.svg" alt="Verified Citizen" />
<img src="../../assets/images/badges/c2c-badge.svg" alt="C2C Like New 99%" />
```

### 4. Nhúng Biểu Tượng Icon Vector:
```html
<img src="../../assets/icons/handshake.svg" alt="Trả giá" width="20" height="20" />
```

---

## 🎨 Quy Chuẩn Màu Sắc Thương Hiệu
- **Cyber Violet (Chính):** `#8b5cf6` / `#7c3aed`
- **Neon Cyan (Phụ):** `#06b6d4` / `#22d3ee`
- **Success Green:** `#10b981`
- **Dark Surface:** `#0a0a16` / `#121124` / `#1e1e2d`
