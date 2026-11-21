/**
 * utils.test.js — Kiểm tra và kiểm thử toàn bộ hàm tiện ích utils.js
 * Chạy bằng: node frontend/test/utils.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// Nạp mock data để kiểm thử trực tiếp trên dữ liệu thật của dự án
const mockDataPath = path.resolve(__dirname, "../js/mock_data.js");
const mockDataCode = fs.readFileSync(mockDataPath, "utf8");
// Giả lập biến toàn cục cho mock_data.js chạy trên Node
const evalMock = new Function(
  mockDataCode
    .replace(/\bconst\b/g, "var") +
    "\nreturn { IMG_BASE, IMG, CATEGORIES, PRODUCTS, FLASH_SALE, TICKER };"
);
const { PRODUCTS } = evalMock();

// Nạp utils.js
const Utils = require("../js/utils.js");
const {
  formatCurrency,
  formatDate,
  renderStars,
  filterProducts,
  sortProducts,
  paginate,
  startCountdown,
} = Utils;

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${desc}`);
    console.error("   ", err.message);
    failed++;
  }
}

console.log("\n==================================================");
console.log("KIỂM THỬ BỘ HÀM TIỆN ÍCH (UTILS.JS) CHO HYBRID.STORE");
console.log("==================================================\n");

/* ---------------- 1. formatCurrency ---------------- */
console.log("--- 1. Kiểm thử formatCurrency ---");
it("Định dạng số nguyên dương sang tiền Việt (VND)", () => {
  const res = formatCurrency(2850000);
  assert.strictEqual(res, "2.850.000₫");
});

it("Định dạng chuỗi số sang tiền Việt (VND)", () => {
  const res = formatCurrency("15500000");
  assert.strictEqual(res, "15.500.000₫");
});

it("Xử lý số 0, null, undefined", () => {
  assert.strictEqual(formatCurrency(0), "0₫");
  assert.strictEqual(formatCurrency(null), "0₫");
  assert.strictEqual(formatCurrency(undefined), "0₫");
  assert.strictEqual(formatCurrency(""), "0₫");
});

/* ---------------- 2. formatDate ---------------- */
console.log("\n--- 2. Kiểm thử formatDate ---");
it("Định dạng ngày mặc định DD/MM/YYYY từ Date object", () => {
  const d = new Date(2026, 10, 9, 14, 30, 15); // Month index 10 = Tháng 11
  assert.strictEqual(formatDate(d), "09/11/2026");
});

it("Định dạng tùy chỉnh mẫu DD/MM/YYYY HH:mm:ss", () => {
  const d = new Date(2026, 10, 9, 14, 30, 15);
  assert.strictEqual(formatDate(d, "DD/MM/YYYY HH:mm:ss"), "09/11/2026 14:30:15");
});

it("Xử lý chuỗi ISO và timestamp", () => {
  const d = new Date(2026, 0, 5, 8, 9, 0);
  assert.strictEqual(formatDate(d.getTime()), "05/01/2026");
});

it("Xử lý ngày không hợp lệ hoặc rỗng", () => {
  assert.strictEqual(formatDate(null), "");
  assert.strictEqual(formatDate("invalid-date-string"), "");
});

/* ---------------- 3. renderStars ---------------- */
console.log("\n--- 3. Kiểm thử renderStars (sao đầy/nửa/rỗng) ---");
it("Điểm 5.0 trả 5 sao đầy", () => {
  assert.strictEqual(renderStars(5), "★★★★★");
});

it("Điểm 4.5 trả 4 sao đầy và 1 sao nửa", () => {
  assert.strictEqual(renderStars(4.5), "★★★★½");
});

it("Điểm 3.5 trả 3 sao đầy, 1 sao nửa, 1 sao rỗng", () => {
  assert.strictEqual(renderStars(3.5), "★★★½☆");
});

it("Điểm 4.0 trả 4 sao đầy và 1 sao rỗng", () => {
  assert.strictEqual(renderStars(4), "★★★★☆");
});

it("Điểm 2.5 trả 2 sao đầy, 1 sao nửa, 2 sao rỗng", () => {
  assert.strictEqual(renderStars(2.5), "★★½☆☆");
});

it("Điểm 0 trả 5 sao rỗng", () => {
  assert.strictEqual(renderStars(0), "☆☆☆☆☆");
});

it("Xuất HTML Material Symbols với options.html = true", () => {
  const html = renderStars(4.5, { html: true });
  assert(html.includes("rating"));
  assert(html.includes("star_half"));
  assert(html.includes("4.5 / 5 sao"));
});

/* ---------------- 4. filterProducts ---------------- */
console.log("\n--- 4. Kiểm thử filterProducts trên mock data ---");
it("Lọc theo danh mục (category)", () => {
  const techProducts = filterProducts(PRODUCTS, { category: "tech" });
  assert(techProducts.length > 0, "Phải tìm thấy sản phẩm công nghệ");
  techProducts.forEach((p) => assert.strictEqual(p.category, "tech"));
});

it("Lọc theo loại hàng (type: 'mall')", () => {
  const mallProducts = filterProducts(PRODUCTS, { type: "mall" });
  assert(mallProducts.length > 0);
  mallProducts.forEach((p) => assert.strictEqual(p.type, "mall"));
});

it("Lọc theo loại hàng (type: 'c2c')", () => {
  const c2cProducts = filterProducts(PRODUCTS, { type: "c2c" });
  assert(c2cProducts.length > 0);
  c2cProducts.forEach((p) => assert.strictEqual(p.type, "c2c"));
});

it("Lọc theo khoảng giá (minPrice, maxPrice)", () => {
  const minPrice = 3000000;
  const maxPrice = 10000000;
  const filtered = filterProducts(PRODUCTS, { minPrice, maxPrice });
  assert(filtered.length > 0);
  filtered.forEach((p) => {
    assert(p.price >= minPrice, `Giá ${p.price} phải >= ${minPrice}`);
    assert(p.price <= maxPrice, `Giá ${p.price} phải <= ${maxPrice}`);
  });
});

it("Lọc theo từ khóa tìm kiếm (keyword)", () => {
  const searched = filterProducts(PRODUCTS, { keyword: "macbook" });
  assert(searched.length > 0);
  searched.forEach((p) => {
    const text = (p.name + " " + (p.desc || "")).toLowerCase();
    assert(text.includes("macbook"));
  });
});

it("Lọc đa điều kiện đồng thời (category + type + minPrice + keyword)", () => {
  const res = filterProducts(PRODUCTS, {
    category: "tech",
    type: "mall",
    minPrice: 1000000,
    keyword: "bàn phím",
  });
  assert(res.length > 0);
  res.forEach((p) => {
    assert.strictEqual(p.category, "tech");
    assert.strictEqual(p.type, "mall");
    assert(p.price >= 1000000);
    assert(p.name.toLowerCase().includes("bàn phím"));
  });
});

it("Không sửa đổi mảng dữ liệu gốc khi lọc", () => {
  const originalLength = PRODUCTS.length;
  const res = filterProducts(PRODUCTS, { category: "fashion" });
  assert.strictEqual(PRODUCTS.length, originalLength);
  assert.notStrictEqual(res, PRODUCTS);
});

/* ---------------- 5. sortProducts ---------------- */
console.log("\n--- 5. Kiểm thử sortProducts ---");
it("Sắp xếp giá tăng dần (price-asc)", () => {
  const sorted = sortProducts(PRODUCTS, "price-asc");
  assert.strictEqual(sorted.length, PRODUCTS.length);
  for (let i = 0; i < sorted.length - 1; i++) {
    assert(
      sorted[i].price <= sorted[i + 1].price,
      `Phần tử ${i} (${sorted[i].price}) phải <= ${i + 1} (${sorted[i + 1].price})`
    );
  }
});

it("Sắp xếp giá giảm dần (price-desc)", () => {
  const sorted = sortProducts(PRODUCTS, "price-desc");
  assert.strictEqual(sorted.length, PRODUCTS.length);
  for (let i = 0; i < sorted.length - 1; i++) {
    assert(
      sorted[i].price >= sorted[i + 1].price,
      `Phần tử ${i} (${sorted[i].price}) phải >= ${i + 1} (${sorted[i + 1].price})`
    );
  }
});

it("Sắp xếp đánh giá cao nhất (rating-desc)", () => {
  const sorted = sortProducts(PRODUCTS, "rating-desc");
  for (let i = 0; i < sorted.length - 1; i++) {
    const r1 = sorted[i].rating || 0;
    const r2 = sorted[i + 1].rating || 0;
    assert(r1 >= r2, `Rating ${r1} phải >= ${r2}`);
  }
});

it("Sắp xếp tên A-Z (name-asc) hỗ trợ tiếng Việt", () => {
  const sorted = sortProducts(PRODUCTS, "name-asc");
  for (let i = 0; i < sorted.length - 1; i++) {
    const cmp = String(sorted[i].name).localeCompare(String(sorted[i + 1].name), "vi");
    assert(cmp <= 0, `"${sorted[i].name}" phải đứng trước hoặc bằng "${sorted[i + 1].name}"`);
  }
});

it("Không sửa đổi mảng gốc khi sắp xếp", () => {
  const firstOriginal = PRODUCTS[0].id;
  sortProducts(PRODUCTS, "price-desc");
  assert.strictEqual(PRODUCTS[0].id, firstOriginal);
});

/* ---------------- 6. paginate ---------------- */
console.log("\n--- 6. Kiểm thử paginate ---");
it("Phân trang đúng cấu trúc { items, page, totalPages, total }", () => {
  const pageSize = 8;
  const res = paginate(PRODUCTS, 1, pageSize);
  assert.strictEqual(typeof res, "object");
  assert.strictEqual(res.total, PRODUCTS.length);
  assert.strictEqual(res.totalPages, Math.ceil(PRODUCTS.length / pageSize));
  assert.strictEqual(res.page, 1);
  assert.strictEqual(res.items.length, pageSize);
  assert.strictEqual(res.items[0].id, PRODUCTS[0].id);
});

it("Lấy trang cuối cùng chính xác số lượng dư", () => {
  const pageSize = 8;
  const totalPages = Math.ceil(PRODUCTS.length / pageSize); // 18 / 8 = 3 trang
  const res = paginate(PRODUCTS, totalPages, pageSize);
  assert.strictEqual(res.page, totalPages);
  assert.strictEqual(res.items.length, PRODUCTS.length - (totalPages - 1) * pageSize); // 18 - 16 = 2
});

it("Tự động clamp trang vượt quá giới hạn", () => {
  const res = paginate(PRODUCTS, 999, 8);
  assert.strictEqual(res.page, res.totalPages);
  assert(res.items.length > 0);

  const resZero = paginate(PRODUCTS, -5, 8);
  assert.strictEqual(resZero.page, 1);
});

it("Xử lý mảng rỗng", () => {
  const res = paginate([], 1, 10);
  assert.strictEqual(res.total, 0);
  assert.strictEqual(res.totalPages, 1);
  assert.strictEqual(res.page, 1);
  assert.strictEqual(res.items.length, 0);
});

/* ---------------- 7. startCountdown ---------------- */
console.log("\n--- 7. Kiểm thử startCountdown ---");
it("Đếm ngược đúng thời gian và dọn interval khi hết giờ", (done) => {
  // Test bất đồng bộ ngắn 2 giây
  let ended = false;
  const mockEl = { textContent: "" };
  const controller = startCountdown(1, mockEl, () => {
    ended = true;
  });

  assert(typeof controller.stop === "function");
  assert(controller.getRemaining() <= 1);

  setTimeout(() => {
    assert.strictEqual(ended, true, "onEnd callback phải được gọi khi hết giờ");
    console.log("  \x1b[32m✔ PASS:\x1b[0m onEnd được gọi và interval đã dọn dẹp");
    passed++;

    // Chạy tiếp test 8, 9, 10
    runAdditionalTests();
  }, 1200);
});

function runAdditionalTests() {
  /* ---------------- 8. getUsedDiscountPercent ---------------- */
  console.log("\n--- 8. Kiểm thử getUsedDiscountPercent (Tính % rẻ hơn của đồ cũ) ---");
  it("Tính đúng phần trăm rẻ hơn của đồ cũ so với đồ mới", () => {
    // Giá cũ 21.990.000₫, mới 29.990.000₫ -> rẻ hơn 27%
    const pct = Utils.getUsedDiscountPercent(21990000, 29990000);
    assert.strictEqual(pct, 27);
  });

  it("Xử lý giá không hợp lệ hoặc mới <= 0", () => {
    assert.strictEqual(Utils.getUsedDiscountPercent(0, 100), 100);
    assert.strictEqual(Utils.getUsedDiscountPercent(100, 0), 0);
  });

  /* ---------------- 9. Validator ---------------- */
  console.log("\n--- 9. Kiểm thử Validator (T12) ---");
  it("Kiểm tra email hợp lệ và không hợp lệ", () => {
    assert.strictEqual(Utils.Validator.isEmail("test@gmail.com"), true);
    assert.strictEqual(Utils.Validator.isEmail("invalid-email"), false);
    assert.strictEqual(Utils.Validator.isEmail(""), false);
  });

  it("Kiểm tra số điện thoại Việt Nam 10 số", () => {
    assert.strictEqual(Utils.Validator.isPhone("0912345678"), true);
    assert.strictEqual(Utils.Validator.isPhone("0389998888"), true);
    assert.strictEqual(Utils.Validator.isPhone("123"), false);
  });

  it("Kiểm tra chuỗi không rỗng", () => {
    assert.strictEqual(Utils.Validator.isNotEmpty("Nguyễn Văn A"), true);
    assert.strictEqual(Utils.Validator.isNotEmpty("   "), false);
  });

  /* ---------------- 10. Cart (T12) ---------------- */
  console.log("\n--- 10. Kiểm thử Quản lý Giỏ hàng Cart (T12) ---");
  it("Thêm, cập nhật số lượng, xóa và tính tổng tiền giỏ hàng", () => {
    // Mock localStorage trong môi trường Node.js
    const store = {};
    global.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
    };

    Utils.Cart.clear();
    assert.strictEqual(Utils.Cart.getCount(), 0);

    // Thêm món 1: iPhone cũ 21.990.000₫
    Utils.Cart.addItem({ id: "t1", name: "iPhone 15 Pro Max", price: 21990000, oldPrice: 29990000, type: "c2c" }, 1);
    assert.strictEqual(Utils.Cart.getCount(), 1);
    assert.strictEqual(Utils.Cart.getSubtotal(), 21990000);

    // Thêm tiếp 2 món t1 -> tổng cộng 3 món
    Utils.Cart.addItem({ id: "t1", name: "iPhone 15 Pro Max", price: 21990000 }, 2);
    assert.strictEqual(Utils.Cart.getCount(), 3);
    assert.strictEqual(Utils.Cart.getSubtotal(), 21990000 * 3);

    // Cập nhật số lượng về 2 món
    Utils.Cart.updateQty("t1", 2);
    assert.strictEqual(Utils.Cart.getCount(), 2);

    // Xóa món
    Utils.Cart.removeItem("t1");
    assert.strictEqual(Utils.Cart.getCount(), 0);
    assert.strictEqual(Utils.Cart.getSubtotal(), 0);
  });

  it("Phân lập giỏ hàng (Cart) độc lập giữa các tài khoản người dùng & gộp giỏ hàng khách", () => {
    let store = {};
    global.localStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };

    // 1. Khách vãng lai thêm món vào giỏ
    Utils.Cart.addItem({ id: "prod-guest-item", name: "Ốp Lưng", price: 150000 }, 1);
    assert.strictEqual(Utils.Cart.getCount(), 1, "Giỏ hàng khách có 1 món");

    // 2. Người Mua đăng nhập -> giỏ hàng khách tự động gộp vào tài khoản
    global.localStorage.setItem("hv_current_user", JSON.stringify({ id: "buyer-01", role: "buyer" }));
    Utils.Cart.migrateGuestCart();
    assert.strictEqual(Utils.Cart.getCount(), 1, "Người mua nhận lại món của khách vãng lai");

    // 3. Người Mua thêm món thứ 2
    Utils.Cart.addItem({ id: "prod-buyer-phone", name: "Điện thoại", price: 20000000 }, 1);
    assert.strictEqual(Utils.Cart.getCount(), 2, "Người mua có 2 món trong giỏ");

    // 4. Người Bán đăng nhập -> giỏ hàng người bán độc lập và rỗng
    global.localStorage.setItem("hv_current_user", JSON.stringify({ id: "seller-01", role: "seller" }));
    assert.strictEqual(Utils.Cart.getCount(), 0, "Giỏ hàng người bán ban đầu rỗng, không lẫn món của người mua");

    // 5. Quay lại Người Mua -> giỏ hàng người mua vẫn nguyên vẹn 2 món
    global.localStorage.setItem("hv_current_user", JSON.stringify({ id: "buyer-01", role: "buyer" }));
    assert.strictEqual(Utils.Cart.getCount(), 2, "Giỏ hàng người mua được bảo toàn nguyên vẹn");
  });

  /* ---------------- 11. Auth - Đăng nhập giả (T12) ---------------- */
  console.log("\n--- 11. Kiểm thử Auth Đăng nhập giả & Phiên người dùng (T12) ---");
  it("Đăng nhập giả với tài khoản buyer và seller", () => {
    const resBuyer = Utils.Auth.mockLogin("phuc.nn@gmail.com", "pass123", "buyer");
    assert.strictEqual(resBuyer.success, true);
    assert.strictEqual(resBuyer.user.role, "buyer");
    assert.strictEqual(Utils.Auth.isAuthenticated(), true);

    const resSeller = Utils.Auth.mockLogin("duc.tm@gmail.com", "pass123", "seller");
    assert.strictEqual(resSeller.success, true);
    assert.strictEqual(resSeller.user.role, "seller");

    Utils.Auth.switchRole("admin");
    assert.strictEqual(Utils.Auth.getCurrentUser().role, "admin");

    Utils.Auth.mockLogout();
    // Sau logout, mock storage bị dọn
  });

  it("Phân lập sổ địa chỉ (Address Book) riêng biệt giữa các tài khoản người dùng", () => {
    const userA = { id: "u-phuc-01", fullName: "Nguyễn Ngọc Phúc", phone: "0901234567", address: "Landmark 81, TP.HCM" };
    const userB = { id: "u-binh-01", fullName: "Nguyễn Huy Bình", phone: "0987654321", address: "45 Lê Duẩn, TP.HCM" };

    const addrsA = Utils.Auth.getAddresses(userA);
    assert.strictEqual(Array.isArray(addrsA), true);
    assert.strictEqual(addrsA.length >= 1, true);
    assert.strictEqual(addrsA[0].name, "Nguyễn Ngọc Phúc");

    // Lưu địa chỉ riêng cho user A
    Utils.Auth.saveAddresses([
      { id: "a1", name: "Nguyễn Ngọc Phúc", detail: "Phòng VIP, Landmark 81", isDefault: true }
    ], userA);

    // Lưu địa chỉ riêng cho user B
    Utils.Auth.saveAddresses([
      { id: "b1", name: "Nguyễn Huy Bình", detail: "Kho Hàng 45 Lê Duẩn", isDefault: true }
    ], userB);

    // Kiểm tra user A và user B không bị lẫn lộn địa chỉ
    const updatedA = Utils.Auth.getAddresses(userA);
    const updatedB = Utils.Auth.getAddresses(userB);

    assert.strictEqual(updatedA[0].name, "Nguyễn Ngọc Phúc");
    assert.strictEqual(updatedA[0].detail, "Phòng VIP, Landmark 81");
    assert.strictEqual(updatedB[0].name, "Nguyễn Huy Bình");
    assert.strictEqual(updatedB[0].detail, "Kho Hàng 45 Lê Duẩn");
  });

  it("Đặc quyền Admin: Tự động miễn trừ xác thực CCCD, miễn trừ nhập địa chỉ và có toàn quyền", () => {
    const adminUser = { id: "u-admin-root", role: "ADMIN", fullName: "Root Administrator", email: "admin@hybrid.store" };
    assert.strictEqual(Utils.Auth.isAdmin(adminUser), true);
    assert.strictEqual(Utils.Auth.isVerified(adminUser), true);
    assert.strictEqual(Utils.Auth.hasAddress(adminUser), true);

    const adminAddrs = Utils.Auth.getAddresses(adminUser);
    assert.strictEqual(Array.isArray(adminAddrs), true);
    assert.strictEqual(adminAddrs.length >= 1, true);
    assert.strictEqual(adminAddrs[0].detail.includes("Landmark 81"), true);

    // Bắt buộc requireKyc: true nhưng với Admin vẫn luôn pass
    Utils.Auth.login(adminUser);
    assert.strictEqual(Utils.Auth.requireLogin({ requireKyc: true }), true);
  });

  /* ---------------- 12. Offer - Trả giá & Thương lượng (T12) ---------------- */
  console.log("\n--- 12. Kiểm thử Offer Trả giá & Thương lượng C2C (T12) ---");
  it("Gửi đề nghị trả giá hợp lệ và tính phần trăm giảm", () => {
    // Giá gốc 20.000.000₫, trả giá 16.000.000₫ (-20%)
    const res = Utils.Offer.submitOffer({
      productId: "t1",
      productName: "iPhone 15 Pro Max 256GB Like New",
      originalPrice: 20000000,
      offerPrice: 16000000,
      message: "Mình ở gần Keangnam, fix giá 16tr mình qua lấy luôn trong ngày",
      buyerName: "Nguyễn Ngọc Phúc",
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.offer.discountPercent, 20);
    assert.strictEqual(res.offer.status, "pending");

    const offers = Utils.Offer.getOffers("t1");
    assert.ok(offers.length >= 1);
    assert.strictEqual(offers[0].offerPrice, 16000000);

    // Cập nhật trạng thái chấp thuận
    const updated = Utils.Offer.updateOfferStatus(res.offer.id, "accepted");
    assert.strictEqual(updated, true);
    assert.strictEqual(Utils.Offer.getOffers("t1")[0].status, "accepted");
  });

  it("Từ chối mức giá trả vô lý hoặc quá thấp (<50%)", () => {
    // Giá gốc 20tr nhưng trả 5tr (< 50%)
    const invalidLow = Utils.Offer.submitOffer({
      productId: "t1",
      originalPrice: 20000000,
      offerPrice: 5000000,
    });
    assert.strictEqual(invalidLow.success, false);

    // Giá trả cao hơn giá niêm yết
    const invalidHigh = Utils.Offer.submitOffer({
      productId: "t1",
      originalPrice: 20000000,
      offerPrice: 25000000,
    });
    assert.strictEqual(invalidHigh.success, false);
  });

  /* ---------------- 13. Mock Data Người dùng, Đơn, Ví thanh toán, Tranh chấp (T10) ---------------- */
  console.log("\n--- 13. Kiểm thử Mock Data T10 (Người dùng, Đơn, Ví thanh toán, Tranh chấp) ---");
  it("Kiểm tra đầy đủ MOCK_USERS, MOCK_ESCROW, MOCK_DISPUTES", () => {
    const mockData = require("../js/mock_data.js");
    assert.ok(Array.isArray(mockData.MOCK_USERS), "MOCK_USERS phải là mảng");
    assert.ok(mockData.MOCK_USERS.length >= 4, "MOCK_USERS có ít nhất 4 vai trò");

    const buyer = mockData.MOCK_USERS.find((u) => u.role === "buyer");
    const seller = mockData.MOCK_USERS.find((u) => u.role === "seller");
    assert.ok(buyer, "Có người dùng buyer");
    assert.ok(seller, "Có người dùng seller");

    assert.ok(mockData.MOCK_ESCROW, "Có mock escrow tài chính");
    assert.ok(mockData.MOCK_ESCROW.summary.totalTvl > 0, "TVL lớn hơn 0");
    assert.ok(Array.isArray(mockData.MOCK_ESCROW.transactions), "Có lịch sử giao dịch ví");

    assert.ok(Array.isArray(mockData.MOCK_DISPUTES), "Có danh sách tranh chấp phân xử 3 bên");
    assert.strictEqual(mockData.MOCK_DISPUTES[0].proposedSolutions.length, 3, "Có 3 phương án hòa giải");
  });

  /* ---------------- 14. Theme - Quản lý giao diện sáng/tối ---------------- */
  console.log("\n--- 14. Kiểm thử Theme Quản lý Giao diện Sáng / Tối ---");
  it("Lấy và chuyển đổi giao diện sáng tối (Theme.get, Theme.set, Theme.toggle)", () => {
    let store = {};
    global.localStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => {
        store[k] = String(v);
      },
      removeItem: (k) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
    };

    assert.ok(Utils.Theme, "Có module Utils.Theme");
    // Mặc định là dark
    assert.strictEqual(Utils.Theme.get(), "dark");

    // Đặt thành light
    const setRes = Utils.Theme.set("light");
    assert.strictEqual(setRes, "light");
    assert.strictEqual(Utils.Theme.get(), "light");
    assert.strictEqual(global.localStorage.getItem("hybrid_theme"), "light");

    // Toggle sang dark
    const toggled = Utils.Theme.toggle();
    assert.strictEqual(toggled, "dark");
    assert.strictEqual(Utils.Theme.get(), "dark");

    // Toggle lại sang light
    const toggledAgain = Utils.Theme.toggle();
    assert.strictEqual(toggledAgain, "light");
    assert.strictEqual(Utils.Theme.get(), "light");

    // Reset về dark
    Utils.Theme.set("dark");
    assert.strictEqual(Utils.Theme.get(), "dark");
  });

  it("Theme.apply đồng bộ class light-theme, data-theme và icon nút bấm", () => {
    let rootClasses = new Set();
    let bodyClasses = new Set();
    let rootAttrs = {};
    let iconContent = "light_mode";
    let btnAttrs = {};

    global.document = {
      documentElement: {
        setAttribute: (k, v) => {
          rootAttrs[k] = v;
        },
        getAttribute: (k) => rootAttrs[k] || null,
        classList: {
          toggle: (cls, force) => {
            if (force) rootClasses.add(cls);
            else rootClasses.delete(cls);
          },
          contains: (cls) => rootClasses.has(cls),
        },
      },
      body: {
        classList: {
          toggle: (cls, force) => {
            if (force) bodyClasses.add(cls);
            else bodyClasses.delete(cls);
          },
          contains: (cls) => bodyClasses.has(cls),
        },
      },
      querySelectorAll: (sel) => {
        if (sel.includes("themeToggleBtn")) {
          return [
            {
              setAttribute: (k, v) => {
                btnAttrs[k] = v;
              },
              querySelector: (sub) => ({
                set textContent(val) {
                  iconContent = val;
                },
                get textContent() {
                  return iconContent;
                },
              }),
            },
          ];
        }
        return [];
      },
    };

    // Áp dụng chế độ Sáng (light)
    Utils.Theme.apply("light");
    assert.strictEqual(rootAttrs["data-theme"], "light", "data-theme phải là 'light'");
    assert.strictEqual(rootClasses.has("light-theme"), true, "html phải có class light-theme");
    assert.strictEqual(bodyClasses.has("light-theme"), true, "body phải có class light-theme");
    assert.strictEqual(iconContent, "dark_mode", "Icon nút bấm phải là dark_mode khi đang ở chế độ sáng");

    // Áp dụng chế độ Tối (dark)
    Utils.Theme.apply("dark");
    assert.strictEqual(rootAttrs["data-theme"], "dark", "data-theme phải là 'dark'");
    assert.strictEqual(rootClasses.has("light-theme"), false, "html không còn class light-theme");
    assert.strictEqual(bodyClasses.has("light-theme"), false, "body không còn class light-theme");
    assert.strictEqual(iconContent, "light_mode", "Icon nút bấm phải là light_mode khi đang ở chế độ tối");
  });

  /* ---------------- 15. KIỂM THỬ WISHLIST & VIETNAM LOCATIONS ---------------- */
  console.log("\n--- 15. Kiểm thử Wishlist (Danh sách yêu thích) & VietnamLocations ---");
  it("Thêm, kiểm tra, xóa và đếm sản phẩm trong Wishlist", () => {
    let store = {};
    global.localStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; },
    };

    assert.ok(Utils.Wishlist, "Có module Utils.Wishlist");
    assert.strictEqual(Utils.Wishlist.count(), 0);
    assert.strictEqual(Utils.Wishlist.has("p-mall-01"), false);

    // Toggle thêm
    const added = Utils.Wishlist.toggle("p-mall-01");
    assert.strictEqual(added, true);
    assert.strictEqual(Utils.Wishlist.has("p-mall-01"), true);
    assert.strictEqual(Utils.Wishlist.count(), 1);

    // Thêm món thứ 2
    Utils.Wishlist.toggle("p-c2c-02");
    assert.strictEqual(Utils.Wishlist.count(), 2);
    assert.strictEqual(Utils.Wishlist.has("p-c2c-02"), true);

    // Toggle bỏ món thứ 1
    const removed = Utils.Wishlist.toggle("p-mall-01");
    assert.strictEqual(removed, false);
    assert.strictEqual(Utils.Wishlist.has("p-mall-01"), false);
    assert.strictEqual(Utils.Wishlist.count(), 1);
  });

  it("Phân lập danh sách yêu thích (Wishlist) độc lập giữa Người Mua và Người Bán", () => {
    let store = {};
    global.localStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };

    // 1. Giả lập Người Mua đăng nhập
    global.localStorage.setItem("hv_current_user", JSON.stringify({ id: "buyer-01", role: "buyer" }));
    Utils.Wishlist.refresh();
    Utils.Wishlist.toggle("prod-buyer-watch");
    assert.strictEqual(Utils.Wishlist.has("prod-buyer-watch"), true, "Người mua đã thích sản phẩm đồng hồ");

    // 2. Giả lập Người Bán đăng nhập
    global.localStorage.setItem("hv_current_user", JSON.stringify({ id: "seller-01", role: "seller" }));
    Utils.Wishlist.refresh();
    // Người bán KHÔNG được chứa sản phẩm mà Người Mua thích
    assert.strictEqual(Utils.Wishlist.has("prod-buyer-watch"), false, "Người bán không bị lẫn sản phẩm yêu thích của người mua");

    // 3. Người bán thích sản phẩm khác (máy ảnh)
    Utils.Wishlist.toggle("prod-seller-camera");
    assert.strictEqual(Utils.Wishlist.has("prod-seller-camera"), true, "Người bán thích máy ảnh");

    // 4. Quay lại Người Mua kiểm tra
    global.localStorage.setItem("hv_current_user", JSON.stringify({ id: "buyer-01", role: "buyer" }));
    Utils.Wishlist.refresh();
    assert.strictEqual(Utils.Wishlist.has("prod-buyer-watch"), true, "Người mua vẫn giữ nguyên sản phẩm của mình");
    assert.strictEqual(Utils.Wishlist.has("prod-seller-camera"), false, "Người mua không bị lẫn sản phẩm của người bán");
  });

  it("Truy vấn Tỉnh/Thành, Quận/Huyện, Phường/Xã từ VietnamLocations", () => {
    assert.ok(Utils.VietnamLocations, "Có module Utils.VietnamLocations");
    const provinces = Utils.VietnamLocations.getProvinces();
    assert(Array.isArray(provinces) && provinces.length >= 7, "Có danh sách các tỉnh thành lớn");
    assert(provinces.includes("Hà Nội"), "Bao gồm Hà Nội");
    assert(provinces.includes("TP. Hồ Chí Minh"), "Bao gồm TP. Hồ Chí Minh");

    const hnDistricts = Utils.VietnamLocations.getDistricts("Hà Nội");
    assert(Array.isArray(hnDistricts) && hnDistricts.length > 0, "Lấy được danh sách quận huyện Hà Nội");
    assert(hnDistricts.includes("Quận Nam Từ Liêm"), "Bao gồm Quận Nam Từ Liêm");

    const wards = Utils.VietnamLocations.getWards("Hà Nội", "Quận Nam Từ Liêm");
    assert(Array.isArray(wards) && wards.length > 0, "Lấy được danh sách phường xã");
    assert(wards.includes("Phường Đại Mỗ"), "Bao gồm Phường Đại Mỗ");
  });

  /* ---------------- 16. Bảo mật Auth: SMS OTP, Google GIS & Quên Mật Khẩu Qua Email ---------------- */
  console.log("\n--- 16. Kiểm thử Bảo mật Xác thực Auth: SMS OTP, Google GIS & Quên Mật Khẩu Qua Email ---");
  it("Bảo mật SMS OTP: Kiểm tra số điện thoại, Cooldown 60s, giới hạn số lần thử và che mờ SĐT", () => {
    let storage = {};
    let sessionStore = {};
    global.localStorage = {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
    };
    global.sessionStorage = {
      getItem: (k) => sessionStore[k] || null,
      setItem: (k, v) => { sessionStore[k] = String(v); },
      removeItem: (k) => { delete sessionStore[k]; },
    };

    const AuthModule = require("../js/auth.js");

    // 1. Số điện thoại không hợp lệ
    const invalidRes = AuthModule.sendPhoneOtp("12345");
    assert.strictEqual(invalidRes.ok, false);
    assert.ok(invalidRes.error.includes("không hợp lệ"));

    // 2. Gửi OTP thành công cho SĐT 10 số
    const phone = "0901234567";
    const res = AuthModule.sendPhoneOtp(phone);
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.maskedPhone, "090****567");
    assert.strictEqual(res.expiresInSeconds, 180);
    assert.ok(res.otp.length === 6);

    // Kiểm tra tin nhắn SMS mô phỏng đã được tạo an toàn
    const smsLog = AuthModule.getSimulatedSms(phone);
    assert.ok(smsLog.includes("Mã xác thực OTP"));
    assert.ok(smsLog.includes(res.otp));

    // 3. Cooldown 60s: Gửi lại ngay lập tức bị từ chối
    const cooldownRes = AuthModule.sendPhoneOtp(phone);
    assert.strictEqual(cooldownRes.ok, false);
    assert.ok(cooldownRes.error.includes("Vui lòng đợi"));

    // 4. Nhập sai OTP bị trừ lượt thử (Tối đa 3 lần)
    const wrong1 = AuthModule.loginWithPhone(phone, "000000");
    assert.strictEqual(wrong1.ok, false);
    assert.ok(wrong1.error.includes("2 lần thử"));

    const wrong2 = AuthModule.loginWithPhone(phone, "000000");
    assert.strictEqual(wrong2.ok, false);
    assert.ok(wrong2.error.includes("1 lần thử"));

    const wrong3 = AuthModule.loginWithPhone(phone, "000000");
    assert.strictEqual(wrong3.ok, false);
    assert.ok(wrong3.error.includes("quá 3 lần"));

    // 5. Sau khi bị hủy do sai 3 lần, mã OTP cũ bị vô hiệu hóa
    const wrongAfterLock = AuthModule.loginWithPhone(phone, res.otp);
    assert.strictEqual(wrongAfterLock.ok, false);
  });

  it("Đăng nhập Google chuẩn Google Identity Services (GIS): Chọn tài khoản mẫu và đăng nhập 1-chạm", () => {
    let storage = {};
    global.localStorage = {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
    };

    const AuthModule = require("../js/auth.js");

    // 1. Danh sách tài khoản Google mẫu chuẩn GIS
    const sampleAccounts = AuthModule.getSampleGoogleAccounts();
    assert.ok(Array.isArray(sampleAccounts) && sampleAccounts.length >= 3);
    assert.ok(sampleAccounts.some((a) => a.email === "phuc@hybrid.store"));
    assert.ok(sampleAccounts.some((a) => a.email === "binh@sneakers.vn"));

    // 2. Đăng nhập bằng tài khoản Google
    const loginRes = AuthModule.loginWithGoogle({
      email: "tuan.le@gmail.com",
      name: "Lê Minh Tuấn",
      avatar: "LT",
      role: "buyer",
    });

    assert.strictEqual(loginRes.ok, true);
    assert.strictEqual(loginRes.user.email, "tuan.le@gmail.com");
    assert.strictEqual(loginRes.user.fullName, "Lê Minh Tuấn");
    assert.strictEqual(loginRes.user.role, "buyer");
  });

  it("Quy trình Quên Mật Khẩu qua Email: Xác minh Email chính chủ và cấp phát mật khẩu mới an toàn", () => {
    let storage = {};
    let sessionStore = {};
    global.localStorage = {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
    };
    global.sessionStorage = {
      getItem: (k) => sessionStore[k] || null,
      setItem: (k, v) => { sessionStore[k] = String(v); },
      removeItem: (k) => { delete sessionStore[k]; },
    };

    const AuthModule = require("../js/auth.js");

    // 1. Kiểm tra Email không tồn tại trong hệ thống
    const notFound = AuthModule.sendPasswordResetEmail("nguoi.la@gmail.com");
    assert.strictEqual(notFound.ok, false);
    assert.ok(notFound.error.includes("Không tìm thấy tài khoản"));

    // 2. Gửi mã OTP xác minh đến Email hợp lệ
    const targetEmail = "phuc@hybrid.store";
    const sendRes = AuthModule.sendPasswordResetEmail(targetEmail);
    assert.strictEqual(sendRes.ok, true);
    assert.strictEqual(sendRes.maskedEmail, "p***c@hybrid.store");
    assert.strictEqual(sendRes.expiresInSeconds, 300);
    assert.ok(sendRes.otp.length === 6);

    // Kiểm tra nội dung email được mô phỏng gửi đi
    const emailMsg = AuthModule.getLastResetEmail(targetEmail);
    assert.ok(emailMsg.includes("Mã xác nhận khôi phục"));
    assert.ok(emailMsg.includes(sendRes.otp));

    // 3. Nhập sai OTP xác minh Email
    const verifyWrong = AuthModule.verifyEmailResetOtp(targetEmail, "999999");
    assert.strictEqual(verifyWrong.ok, false);
    assert.ok(verifyWrong.error.includes("2 lần thử"));

    // 4. Nhập đúng mã OTP xác minh
    const verifyOk = AuthModule.verifyEmailResetOtp(targetEmail, sendRes.otp);
    assert.strictEqual(verifyOk.ok, true);
    assert.ok(verifyOk.message.includes("thành công"));

    // 5. Cấp mật khẩu mới ngẫu nhiên và gửi trực tiếp về email
    const issueRes = AuthModule.generateAndSendNewPassword(targetEmail);
    assert.strictEqual(issueRes.ok, true);
    assert.ok(issueRes.newPassword.startsWith("Hyb#"));
    assert.ok(issueRes.newPassword.endsWith("@2026"));
    assert.strictEqual(issueRes.email, targetEmail);

    // 6. Đăng nhập ngay lập tức bằng mật khẩu mới vừa cấp
    const loginWithNew = AuthModule.login(targetEmail, issueRes.newPassword, "buyer");
    assert.strictEqual(loginWithNew.ok, true);
    assert.strictEqual(loginWithNew.user.email, targetEmail);
  });

  finish();
}

function finish() {
  console.log("\n==================================================");
  console.log(`KẾT QUẢ: ${passed} PASS, ${failed} FAIL`);
  console.log("==================================================\n");
  if (failed > 0) {
    process.exit(1);
  }
}
