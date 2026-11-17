# Quản Lý Phông Chữ (Fonts) — HYBRID.STORE

Thư mục này dùng để lưu trữ các tệp font cục bộ (offline) dạng `.woff2` hoặc `.woff`.

## Các phông chữ tiêu chuẩn được sàn sử dụng:
1. **Plus Jakarta Sans**: Phông chữ chính (Body & Heading) mang phong cách hiện đại, thanh lịch.
2. **JetBrains Mono**: Phông chữ cố định chiều rộng (Monospace) hiển thị tiền tệ VNĐ, mã OTP, mã đơn hàng, ngày giờ.
3. **Material Symbols Outlined**: Bộ biểu tượng giao diện Google Material Icon.

## Cách nhúng:
Hiện tại dự án đang nhúng trực tiếp qua Google Fonts CDN trong file `frontend/css/base.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```
Khi muốn chuyển sang chế độ hoàn toàn ngoại tuyến (offline), tải các tệp `.woff2` tương ứng đặt vào thư mục này và khai báo `@font-face` trong `base.css`.
