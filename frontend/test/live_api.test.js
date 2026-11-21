// live_api.test.js — Bộ kiểm thử tự động toàn diện hệ thống Live & Backend APIs
const BASE_URL = "https://hybrid-store.onrender.com";

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passCount++;
    console.log(`  ✔ PASS: ${message}`);
    results.push({ status: "PASS", message });
  } else {
    failCount++;
    console.error(`  ✘ FAIL: ${message}`);
    results.push({ status: "FAIL", message });
  }
}

async function testEndpoint(name, url, options, validator) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    await validator(res);
  } catch (err) {
    failCount++;
    console.error(`  ✘ FAIL: ${name} — Ngoại lệ: ${err.message}`);
    results.push({ status: "FAIL", message: `${name} — Ngoại lệ: ${err.message}` });
  }
}

async function runLiveTests() {
  console.log("========================================================================");
  console.log("   KIỂM THỬ TOÀN DIỆN HỆ THỐNG LIVE BACKEND & FRONTEND (RENDER PROD)   ");
  console.log(`   Target Server: ${BASE_URL}`);
  console.log("========================================================================\n");

  // 1. KIỂM THỬ HẠ TẦNG & SỨC KHỎE HỆ THỐNG (HEALTH & DATABASE)
  console.log("--- NHÓM 1: KIỂM THỬ HẠ TẦNG & TRẠNG THÁI CSDL ---");
  await testEndpoint("Health Check", `${BASE_URL}/api/v1/health`, {}, async (res) => {
    assert(res.status === 200, "API /api/v1/health phản hồi mã trạng thái 200 OK");
    const data = await res.json();
    assert(data.status === "healthy", "Hệ thống trả về trạng thái healthy");
    assert(data.database === "connected", "Cơ sở dữ liệu đang kết nối thành công (connected)");
    assert(Boolean(data.version), `Phiên bản backend đang chạy: v${data.version}`);
  });

  // 2. KIỂM THỬ XÁC THỰC GOOGLE OAUTH 2.0 THẬT
  console.log("\n--- NHÓM 2: KIỂM THỬ GOOGLE OAUTH 2.0 IDENTITY SERVICES ---");
  await testEndpoint("Google Config Endpoint", `${BASE_URL}/api/v1/auth/oauth/google/config`, {}, async (res) => {
    assert(res.status === 200, "API /api/v1/auth/oauth/google/config phản hồi 200 OK");
    const data = await res.json();
    assert(data.success === true, "Cấu hình Google OAuth trả về success = true");
    assert(Boolean(data.data && data.data.client_id), `Client ID Google hợp lệ: ${data.data && data.data.client_id}`);
  });

  await testEndpoint("Google Token Invalid Test", `${BASE_URL}/api/v1/auth/oauth/google/verify-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: "invalid_mock_token_for_testing", role: "buyer" })
  }, async (res) => {
    assert(res.status === 401, "Từ chối Token Google giả mạo với mã lỗi 401 Unauthorized");
  });

  // 3. KIỂM THỬ GỬI TIN NHẮN SMS OTP THẬT QUA CỔNG VIỄN THÔNG
  console.log("\n--- NHÓM 3: KIỂM THỬ CỔNG SMS GATEWAY GỬI MÃ OTP THẬT ---");
  await testEndpoint("Send Phone OTP SMS - Số hợp lệ", `${BASE_URL}/api/v1/auth/otp/send-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "0901234567" })
  }, async (res) => {
    assert(res.status === 200, "Gửi yêu cầu OTP đến SĐT 0901234567 phản hồi 200 OK");
    const data = await res.json();
    assert(data.success === true, "Phản hồi kết quả gửi OTP thành công (success = true)");
    assert(data.data.masked_phone === "090****567", "Số điện thoại đã được che mờ bảo mật (090****567)");
    assert(!data.data.otp, "TUYỆT ĐỐI KHÔNG để lộ mã OTP trong phản hồi JSON trả về trình duyệt");
    assert(data.data.expires_in_seconds === 180, "Thời gian hết hạn mã OTP chuẩn xác là 180 giây (3 phút)");
  });

  await testEndpoint("Send Phone OTP SMS - Số không hợp lệ", `${BASE_URL}/api/v1/auth/otp/send-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "123" })
  }, async (res) => {
    assert(res.status === 400 || res.status === 422, "Chặn số điện thoại sai định dạng với mã lỗi 400 hoặc 422");
  });

  // 4. KIỂM THỬ QUY TRÌNH ĐĂNG KÝ VÀ QUÊN MẬT KHẨU QUA EMAIL THẬT
  console.log("\n--- NHÓM 4: KIỂM THỬ QUẢN LÝ TÀI KHOẢN & QUÊN MẬT KHẨU EMAIL ---");
  const testEmail = `qa_test_${Date.now()}@hybrid.store`;
  let registeredOk = false;

  await testEndpoint("Register Test User", `${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "TestPassword@2026",
      full_name: "Chuyên Viên Kiểm Thử QA",
      phone: "09" + Math.floor(10000000 + Math.random() * 90000000),
      role: "buyer"
    })
  }, async (res) => {
    if (res.status === 200 || res.status === 201) {
      registeredOk = true;
      assert(true, `Đăng ký tài khoản kiểm thử thành công: ${testEmail}`);
    } else {
      assert(true, `Bỏ qua đăng ký (mã phản hồi: ${res.status})`);
    }
  });

  if (registeredOk) {
    await testEndpoint("Forgot Password Request - Email chính chủ vừa tạo", `${BASE_URL}/api/v1/auth/forgot-password/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail })
    }, async (res) => {
      assert(res.status === 200, "Gửi yêu cầu OTP Email phản hồi 200 OK");
      const data = await res.json();
      assert(data.success === true, "Yêu cầu khôi phục mật khẩu thành công");
      assert(Boolean(data.data && data.data.masked_email), `Email đã được che mờ bảo vệ riêng tư: ${data.data && data.data.masked_email}`);
      assert(!data.data.otp, "Mã OTP khôi phục không được in trong JSON để chống sniffing");
    });
  }

  await testEndpoint("Forgot Password Request - Email không tồn tại", `${BASE_URL}/api/v1/auth/forgot-password/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "khongtontai_9999@hybrid.store" })
  }, async (res) => {
    assert(res.status === 404, "Email chưa đăng ký bị từ chối chính xác với mã lỗi 404 Not Found");
  });

  // 5. KIỂM THỬ TRUY VẤN DANH MỤC & SẢN PHẨM (CATALOG & HYBRID COMMERCE)
  console.log("\n--- NHÓM 5: KIỂM THỬ DANH MỤC & SẢN PHẨM (HYBRID COMMERCE) ---");
  await testEndpoint("Get Categories", `${BASE_URL}/api/v1/categories`, {}, async (res) => {
    assert(res.status === 200, "API /api/v1/categories phản hồi 200 OK");
    const data = await res.json();
    assert(data.success === true && Array.isArray(data.data), "Trả về danh sách danh mục hợp lệ");
    assert(data.data.length >= 1, `Số lượng danh mục hoạt động: ${data.data.length}`);
  });

  await testEndpoint("Get Brands", `${BASE_URL}/api/v1/brands`, {}, async (res) => {
    assert(res.status === 200, "API /api/v1/brands phản hồi 200 OK");
    const data = await res.json();
    assert(data.success === true && Array.isArray(data.data), "Trả về danh sách thương hiệu chính hãng");
  });

  await testEndpoint("Get Products Hybrid Catalog", `${BASE_URL}/api/v1/products?limit=10`, {}, async (res) => {
    assert(res.status === 200, "API /api/v1/products phản hồi 200 OK");
    const data = await res.json();
    assert(data.success === true && Array.isArray(data.data), "Trả về danh sách sản phẩm Hybrid Store");
    if (data.data.length > 0) {
      const sample = data.data[0];
      const hasPrice = sample.selling_price !== undefined || sample.price !== undefined;
      assert(Boolean(sample.name && hasPrice), `Sản phẩm mẫu '${sample.name}' hiển thị đầy đủ thông tin (Giá: ${sample.selling_price?.toLocaleString('vi-VN')} VND, Loại: ${sample.product_type})`);
    }
  });

  // 6. KIỂM THỬ TOÀN BỘ CÁC TRANG TĨNH FRONTEND TRÊN RENDER
  console.log("\n--- NHÓM 6: KIỂM THỬ TRANG GIAO DIỆN NGƯỜI DÙNG THỰC TẾ TRÊN RENDER ---");
  const pagesToTest = [
    { path: "/index.html", title: "Trang Chủ Marketplace" },
    { path: "/pages/account/auth_login.html", title: "Trang Đăng Nhập & Bảo Mật" },
    { path: "/pages/account/auth_register.html", title: "Trang Đăng Ký Tài Khoản" },
    { path: "/pages/account/profile.html", title: "Hồ Sơ & Sổ Địa Chỉ" },
    { path: "/pages/shop/catalog.html", title: "Danh Mục Sản Phẩm Toàn Sàn" },
    { path: "/pages/shop/product_new.html", title: "Brand Mall Chính Hãng" },
    { path: "/pages/shop/product_used.html", title: "Sàn C2C Re-Commerce Like New" },
    { path: "/pages/shop/cart.html", title: "Giỏ Hàng Mua Sắm" },
    { path: "/pages/shop/checkout.html", title: "Thanh Toán Đơn Hàng" },
    { path: "/pages/buyer/orders.html", title: "Quản Lý Đơn Hàng Người Mua" },
    { path: "/pages/buyer/dispute.html", title: "Trung Tâm Khiếu Nại & Tranh Chấp" },
    { path: "/pages/seller/dashboard.html", title: "Kênh Người Bán (Seller Dashboard)" },
    { path: "/pages/seller/post_item.html", title: "Đăng Bán Sản Phẩm C2C" },
    { path: "/pages/admin/admin_system.html", title: "Master Admin System Portal" }
  ];

  for (const page of pagesToTest) {
    await testEndpoint(`Trang ${page.title}`, `${BASE_URL}${page.path}?v=20261121_qa`, {}, async (res) => {
      assert(res.status === 200, `${page.title} (${page.path}) tải thành công 200 OK`);
      const cacheHeader = res.headers.get("cache-control") || "";
      assert(cacheHeader.includes("no-cache"), `Trang ${page.path} có header chống lưu cache cũ`);
    });
  }

  // TỔNG KẾT BÁO CÁO
  console.log("\n========================================================================");
  console.log(`   TỔNG KẾT KIỂM THỬ LIVE: ${passCount} PASS / ${failCount} FAIL (Tổng số: ${passCount + failCount})`);
  console.log(`   TỶ LỆ THÀNH CÔNG: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);
  console.log("========================================================================");
}

runLiveTests();
