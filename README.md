# HYBRID.STORE — Nền Tảng Thương Mại Điện Tử Hybrid Thế Hệ Mới

> **HYBRID.STORE** là giải pháp sàn thương mại điện tử đa mô hình tiên phong tại Việt Nam, tích hợp hoàn hảo giữa **B2C Official Mall** (hàng chính hãng 100%) và **C2C Pre-owned Marketplace** (thị trường đồ cũ/pass đồ được kiểm định Lab AI & chuyên viên thẩm định độc lập).

---

## 🌟 1. Điểm Khác Biệt Cốt Lõi (Core Value Proposition)

1. **Mô hình Hybrid B2C & C2C Song Hành**:
   - Khách hàng có thể vừa mua sản phẩm mới 100% nguyên seal từ các thương hiệu Mall uy tín, vừa săn đồ pass, đồ second-hand tuyển chọn với giá tiết kiệm từ 30% đến 70%.
2. **Cơ Chế Kiểm Định Lab & AI Thẩm Định (Lab Inspection)**:
   - Các sản phẩm C2C giá trị cao (iPhone, MacBook, Máy ảnh, Sneakers Hype, Đồng hồ) đều trải qua quy trình kiểm tra phần cứng, vi mạch, pin thực tế và chiếu tia UV soi tem giày trước khi niêm phong giao đến tay người mua.
3. **Bảo Vệ Người Mua Bằng Ký Quỹ An Toàn (Zero-Escrow Protection)**:
   - Tiền thanh toán của người mua được sàn giữ tạm thời trong tài khoản ký quỹ (Escrow). Người bán chỉ nhận được tiền giải ngân vào Ví điện tử sau khi người mua xác nhận đã nhận đúng hàng và hài lòng, hoặc sau 48h kiểm tra không phát sinh khiếu nại.
4. **Phòng Phân Xử Tranh Chấp 3 Bên (Tri-party Dispute Resolution Room)**:
   - Khi phát sinh sự cố giao nhận hoặc sản phẩm không đúng mô tả, hệ thống kích hoạt phòng phân xử trực tuyến giữa **Người Mua — Người Bán — Trọng Tài Sàn** với đầy đủ nhật ký trao đổi, tải lên video unbox/ảnh thực tế và quyền phán quyết hoàn tiền minh bạch.
5. **Thương Lượng Trả Giá Trực Tiếp (Make an Offer)**:
   - Người mua có thể gửi đề xuất giá cho sản phẩm C2C; người bán có thể Chấp nhận (Accept), Từ chối (Reject) hoặc Đưa ra giá thương lượng ngược lại (Counter-offer) trong tích tắc.

---

## 📂 2. Cấu Trúc Dự Án & Bản Đồ 21 Trang Giao Diện

```
Store-management/
├── README.md                      # Tài liệu tổng quan kiến trúc và hướng dẫn dự án
├── backend/                       # Cấu trúc API & xử lý nghiệp vụ máy chủ
└── frontend/                      # Toàn bộ giao diện người dùng (Client Web App)
    ├── index.html                 # Trang chủ (Hero Banner, Flash Sale, Danh mục, Lab Preview)
    ├── assets/
    │   ├── css/                   # Hệ thống Style (style.css, components, responsive, dark/light)
    │   ├── images/
    │   │   ├── banners/           # Banner vector nội bộ offline (hero-banner.svg, v.v.)
    │   │   └── products/          # Kho 100+ ảnh sản phẩm PNG chất lượng cao
    │   └── fonts/                 # Bộ font chữ tối ưu tốc độ tải
    ├── js/
    │   ├── app.js                 # Điều phối ứng dụng, phím tắt toàn cục, sync giỏ hàng, theme
    │   ├── utils.js               # Thư viện tiện ích (format tiền tệ, validate, toast, modal, storage)
    │   ├── components.js          # Thư viện component UMD (Header 3 biến thể, Footer, Breadcrumb, Card)
    │   ├── mock_data.js           # 130 sản phẩm mẫu thuộc 8 ngành hàng, flash sale, danh mục
    │   ├── catalog.js             # Logic bộ lọc đa năng, tìm kiếm, phân trang và alias URL
    │   ├── product-detail.js      # Logic chi tiết sản phẩm động, kiểm định lab, trả giá
    │   ├── cart.js                # Quản lý giỏ hàng, mã giảm giá, tính phí vận chuyển
    │   └── auth.js / login.js     # Đăng nhập, đăng ký, eKYC và xác thực bảo mật
    ├── pages/
    │   ├── shop/                  # Cụm mua sắm người tiêu dùng
    │   │   ├── catalog.html       # Danh mục sản phẩm, bộ lọc nâng cao
    │   │   ├── product_new.html   # Chi tiết sản phẩm Mới / B2C Mall (Dynamic theo ?id=...)
    │   │   ├── product_used.html  # Chi tiết sản phẩm C2C Đã qua sử dụng (Phiếu Lab, Trả giá)
    │   │   ├── cart.html          # Giỏ hàng mua sắm
    │   │   ├── checkout.html      # Thanh toán COD / Chuyển khoản QR Napas 24/7
    │   │   └── order_tracking.html# Theo dõi trạng thái đơn hàng thời gian thực
    │   ├── account/               # Cụm thông tin & quản lý đơn mua
    │   │   ├── profile.html       # Hồ sơ cá nhân & bảo mật tài khoản
    │   │   ├── addresses.html     # Sổ địa chỉ nhận hàng
    │   │   ├── orders.html        # Lịch sử đơn hàng của tôi
    │   │   ├── order_detail.html  # Chi tiết đơn mua & hóa đơn điện tử
    │   │   ├── wishlist.html      # Danh sách sản phẩm yêu thích
    │   │   ├── notifications.html # Trung tâm thông báo hệ thống
    │   │   └── dispute.html       # Phòng giải quyết tranh chấp 3 bên
    │   ├── seller/                # Cụm người bán hàng C2C & Shop
    │   │   ├── dashboard.html     # Tổng quan bán hàng, danh sách tin, duyệt trả giá, rút tiền ví
    │   │   ├── post_item.html     # Đăng tin bán C2C kéo thả ảnh, AI gợi ý giá thông minh
    │   │   ├── orders.html        # Quản lý đơn hàng cần giao
    │   │   ├── inventory.html     # Quản lý tồn kho hàng hóa
    │   │   └── settlement.html    # Lịch sử đối soát và rút tiền doanh thu
    │   ├── admin/                 # Bảng điều khiển quản trị sàn
    │   │   └── admin_system.html  # Giám sát giao dịch, duyệt tranh chấp, phòng chống gian lận
    │   └── auth/                  # Cụm xác thực người dùng
    │       ├── login.html         # Đăng nhập tài khoản
    │       └── register.html      # Đăng ký tài khoản
    └── test/                      # Bộ kiểm thử tự động (Unit Test Suites)
        ├── utils.test.js          # 43 test cases kiểm tra utils.js
        └── components.test.js     # 10 test cases kiểm tra components.js
```

---

## 🏷️ 3. Danh Mục Ngành Hàng Phân Biệt: Đồ Mới (Mall) & Đồ Cũ (C2C)

Hệ thống phân tách chuyên sâu 2 bộ danh mục riêng biệt với hơn 130 sản phẩm mẫu chất lượng cao:

### 🛍️ Bảng Danh Mục Sàn Đồ Mới (Brand Mall 100% Nguyên Seal)
| Mã (`id`) | Tên Ngành Hàng Mall | Biểu Tượng | Điểm Nhấn Đặc Quyền Mall |
|:---|:---|:---:|:---|
| `fashion` | Thời Trang Mall Thiết Kế | `checkroom` | Đổi trả 7 ngày, áo khoác, blazer, sơ mi thiết kế nguyên tag |
| `sneakers` | Sneakers Brand New Box | `steps` | Hàng chính hãng nguyên hộp full phụ kiện, bảo hành 12 tháng |
| `tech` | Đồ Điện Tử & Hi-Tech New Seal | `devices` | iPhone, MacBook nguyên seal FPT/VNA, bảo hành hãng 12-24T |
| `appliances` | Gia Dụng Thông Minh New Seal | `coffee_maker` | Máy hút bụi Dyson, máy pha cà phê mới 100%, bảo hành tận nhà |
| `audio` | Âm Thanh & Tai Nghe Hi-Fi Mới | `headphones` | Tai nghe Sony XM5, AirPods Pro mới 100%, 1 đổi 1 trong 30 ngày |
| `gaming` | Gaming Gear Pro Mall | `sports_esports` | Bàn phím cơ Aula F75, chuột Razer Pro mới 100% nguyên hộp |
| `watches` | Đồng Hồ & Phụ Kiện Mall | `watch` | Đồng hồ cơ Seiko, smartwatch thể thao, thẻ bảo hành quốc tế |
| `camera` | Máy Ảnh & Quay Chụp Mall | `photo_camera` | Body Sony Alpha, Fuji mirrorless mới 100% bảo hành 24 tháng |

### ♻️ Bảng Danh Mục Chợ Đồ Cũ Tuyển Chọn (C2C Pre-Owned / Like New Thẩm Định)
| Mã (`id`) | Tên Ngành Hàng Đồ Cũ | Biểu Tượng | Tiêu Chuẩn Thẩm Định Lab AI & Tiết Kiệm |
|:---|:---|:---:|:---|
| `tech` | Điện Thoại & Laptop Pass Cũ | `devices` | Đã test vi mạch, pin thực tế >85%, Like New 95%-99%, rẻ hơn 30-50% |
| `sneakers` | Sneakers 2Hand Soi Đèn UV | `steps` | Soi tia UV tem giày, đế nguyên gai, khử khuẩn & bảo quản Lab |
| `fashion` | Thời Trang Vintage & Pass Đồ | `checkroom` | Đồ streetwear, hoodie mặc 1-2 lần chụp ảnh pass lại giá siêu hời |
| `audio` | Tai Nghe & Loa Cũ Like New | `headphones` | Test màng loa không rè, kiểm tra chống ồn ANC & pin tai nghe |
| `gaming` | Gaming Gear Cũ (Pass Lại) | `sports_esports` | Bàn phím custom, chuột gaming lướt, test switch & mắt đọc |
| `camera` | Máy Ảnh & Lens Cũ (Check Shot) | `photo_camera` | Đo số shot, cảm biến sensor sạch sẽ, lens không mốc rễ |
| `appliances` | Gia Dụng Cũ Tiết Kiệm | `coffee_maker` | Máy hút bụi, máy pha cafe pass lại, kiểm tra động cơ & màng lọc |
| `watches` | Đồng Hồ & Phụ Kiện Lướt | `watch` | Kiểm định máy cơ chính xác, đo độ chống nước, ví da vintage |

---

## 🎨 4. Bảng Màu Thiết Kế (Design System & Color Tokens)

Giao diện áp dụng phong cách thiết kế hiện đại kết hợp hơi thở Cyberpunk tinh tế:

- **Primary Violet**: `#8b5cf6` (Nhận diện thương hiệu chính, nút tương tác chủ đạo)
- **Secondary Cyan**: `#06b6d4` (Điểm nhấn công nghệ, tính năng kiểm định Lab)
- **Success Green**: `#10b981` (Tình trạng Like New 99%, thanh toán thành công, chứng chỉ hợp lệ)
- **Warning Amber**: `#f59e0b` (Cảnh báo, trạng thái đang chờ xử lý, chờ duyệt trả giá)
- **Danger Red**: `#ef4444` (Khuyến mãi Flash Sale, báo hủy đơn, tranh chấp nghiêm trọng)
- **Dark Mode Background**: `#0b0f19` / `#111827` (Độ tương phản cao, êm mắt khi dùng ban đêm)

---

## ⌨️ 5. Phím Tắt Toàn Cục (Global Shortcuts)

- `/` hoặc `Ctrl + K`: Đưa trỏ chuột ngay vào thanh tìm kiếm toàn sàn.
- `Alt + T` hoặc `Ctrl + J`: Bật/Tắt chế độ giao diện Sáng (Clean) / Tối (Cyber Dark).
- `Escape`: Đóng nhanh các cửa sổ Modal, hộp thoại xem ảnh hoặc menu trượt.

---

## 🧪 6. Hướng Dẫn Chạy Kiểm Thử (Unit Testing)

Dự án sở hữu bộ test tự động độc lập chạy trực tiếp trên Node.js mà không cần cài thêm thư viện bên ngoài:

```bash
# Kiểm thử thư viện tiện ích (43 bài test)
node frontend/test/utils.test.js

# Kiểm thử thư viện UI Components (10 bài test)
node frontend/test/components.test.js
```

**Kết quả kiểm thử mục tiêu:** `53/53 tests PASSED (100%)`.

---

## 🚀 7. Triển Khai & Khởi Chạy Nhanh

Vì toàn bộ mã nguồn sử dụng chuẩn Web tiêu chuẩn (Standard HTML5 / CSS3 / ES6+ JavaScript), bạn có thể chạy dự án ngay lập tức bằng bất kỳ máy chủ HTTP tĩnh nào:

- **Cách 1: Sử dụng VS Code Live Server**: Mở thư mục `Store-management/frontend` và nhấp `Go Live`.
- **Cách 2: Sử dụng Python HTTP Server**:
  ```bash
  cd frontend
  python -m http.server 3000
  ```
  Truy cập: `http://localhost:3000/index.html`
- **Cách 3: Mở trực tiếp**: Nhấp đúp vào `frontend/index.html` trên trình duyệt web bất kỳ. Toàn bộ hình ảnh, biểu tượng và chức năng đều hoạt động mượt mà kể cả khi không có kết nối Internet!
