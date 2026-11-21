/**
 * components.test.js — Kiểm tra toàn bộ UI Components trong components.js
 * Chạy bằng: node frontend/test/components.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// 1. Nạp mock data để kiểm thử trực tiếp trên dữ liệu thật của dự án
const mockDataPath = path.resolve(__dirname, "../js/mock_data.js");
const mockDataCode = fs.readFileSync(mockDataPath, "utf8");
const evalMock = new Function(
  mockDataCode.replace(/\bconst\b/g, "var") +
    "\nreturn { PRODUCTS, CATEGORIES };"
);
const { PRODUCTS } = evalMock();

// 2. Nạp utils.js và components.js
const Utils = require("../js/utils.js");
global.Utils = Utils;
const Components = require("../js/components.js");

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

console.log("\n========================================================");
console.log("KIỂM THỬ BỘ UI COMPONENTS (COMPONENTS.JS) — HYBRID.STORE");
console.log("Tasks: [FE] T13 (Header 3 biến thể) & [FE] T14 (Footer, Breadcrumb, ProductCard)");
console.log("========================================================\n");

/* ---------------- 1. KIỂM THỬ ĐƯỜNG DẪN TƯƠNG ĐỐI ---------------- */
console.log("--- 1. KIỂM THỬ TỰ ĐỘNG ĐỊNH TUYẾN ĐƯỜNG DẪN (BASE PATH) ---");

it("detectBasePath trả về customPath nếu được truyền vào", () => {
  assert.strictEqual(Components.detectBasePath("../../"), "../../");
  assert.strictEqual(Components.detectBasePath(""), "");
});

it("resolveUrl xử lý chính xác URL gốc và URL con", () => {
  assert.strictEqual(Components.resolveUrl("index.html", ""), "index.html");
  assert.strictEqual(Components.resolveUrl("index.html", "../../"), "../../index.html");
  assert.strictEqual(Components.resolveUrl("https://example.com", "../../"), "https://example.com");
  assert.strictEqual(Components.resolveUrl("#section", "../../"), "#section");
});

/* ---------------- 2. KIỂM THỬ TASK T13: HEADER 3 BIẾN THỂ ---------------- */
console.log("\n--- 2. TASK [FE] T13: HEADER BA BIẾN THỂ ---");

it("Header Biến thể 1: MARKETPLACE có đầy đủ Logo, Tìm kiếm, Đăng bán, Giỏ hàng và Theme Toggle", () => {
  const html = Components.Header.createHTML({
    variant: Components.Header.MARKETPLACE,
    basePath: "",
  });
  assert(html.includes("site-header--marketplace"), "Phải có class site-header--marketplace");
  assert(html.includes("HYBRID"), "Phải có thương hiệu HYBRID");
  assert(html.includes('id="headerSearchInput"'), "Phải có ô tìm kiếm headerSearchInput");
  assert(html.includes("Đăng Bán Đồ Cũ"), "Phải có nút Đăng Bán Đồ Cũ");
  assert(html.includes('id="themeToggleBtn"'), "Phải có nút themeToggleBtn");
  assert(html.includes('id="cartCount"'), "Phải có badge cartCount");
  assert(!html.includes("ký quỹ") && !html.includes("escrow"), "Tuyệt đối không chứa ký quỹ");
});

it("Header Biến thể 2: MINIMAL (Checkout/Auth/Cart) tinh giản không chứa thanh tìm kiếm rườm rà", () => {
  const html = Components.Header.createHTML({
    variant: Components.Header.MINIMAL,
    title: "THANH TOÁN AN TOÀN",
    basePath: "../../",
  });
  assert(html.includes("site-header--minimal"), "Phải có class site-header--minimal");
  assert(html.includes("THANH TOÁN AN TOÀN"), "Phải hiển thị tiêu đề THANH TOÁN AN TOÀN");
  assert(html.includes("Đồng kiểm 100%"), "Phải có cam kết đồng kiểm");
  assert(html.includes("Napas 24/7"), "Phải có phương thức Napas 24/7");
  assert(!html.includes('id="headerSearchInput"'), "Header Minimal không được chứa thanh tìm kiếm");
});

it("Header Biến thể 3: DASHBOARD (Kênh Người Bán & Master Admin) có nút sidebar toggle và badge portal", () => {
  const htmlSeller = Components.Header.createHTML({
    variant: Components.Header.DASHBOARD,
    portalType: "seller",
    basePath: "../../",
  });
  assert(htmlSeller.includes("site-header--dashboard"), "Phải có class site-header--dashboard");
  assert(htmlSeller.includes("KÊNH NGƯỜI BÁN"), "Phải có badge KÊNH NGƯỜI BÁN");
  assert(htmlSeller.includes('id="sidebarToggleBtn"'), "Phải có nút mở sidebar mobile");
  assert(htmlSeller.includes("Đăng Bán Món Mới"), "Người bán có nút Đăng Bán Món Mới");

  const htmlAdmin = Components.Header.createHTML({
    variant: Components.Header.DASHBOARD,
    portalType: "admin",
    basePath: "../../",
  });
  assert(htmlAdmin.includes("MASTER ADMIN"), "Admin phải có badge MASTER ADMIN");
  assert(htmlAdmin.includes(".SYSTEM"), "Admin phải có đuôi .SYSTEM");
  assert(htmlAdmin.includes("HỆ THỐNG ONLINE 99.99%"), "Phải có trạng thái hệ thống");
});

/* ---------------- 3. KIỂM THỬ TASK T14: FOOTER CHUNG ---------------- */
console.log("\n--- 3. TASK [FE] T14: FOOTER CHUNG ---");

it("Footer có cấu trúc 4 cột chuẩn responsive và hiển thị 3 showroom kỹ thuật", () => {
  const html = Components.Footer.createHTML({ basePath: "" });
  assert(html.includes("footer-grid"), "Phải có grid footer-grid");
  assert(html.includes("Keangnam Landmark 72"), "Phải có Showroom Hà Nội");
  assert(html.includes("Tòa FPT Complex"), "Phải có Showroom Đà Nẵng");
  assert(html.includes("Bitexco Financial Tower"), "Phải có Showroom TP.HCM");
  assert(html.includes("pages/info/terms_of_service.html"), "Phải có link Điều khoản dịch vụ trong pages/info/");
  assert(html.includes("pages/info/privacy_policy.html"), "Phải có link Chính sách bảo mật trong pages/info/");
  assert(html.includes("pages/info/warranty_policy.html"), "Phải có link Chính sách bảo hành trong pages/info/");
  assert(html.includes("pages/info/return_policy.html"), "Phải có link Chính sách đổi trả trong pages/info/");
  assert(html.includes("Napas 24/7"), "Phải có Napas 24/7");
  assert(html.includes("COD Đồng Kiểm 100%"), "Phải có COD Đồng Kiểm 100%");
  assert(!html.includes("ký quỹ") && !html.includes("escrow"), "Tuyệt đối không chứa ký quỹ");
  assert(!html.includes("admin_system.html"), "Footer công khai tuyệt đối không chứa link sang Master Admin");
  assert(!html.includes("Master Admin"), "Footer công khai không chứa text Master Admin");
});

/* ---------------- 4. KIỂM THỬ TASK T14: BREADCRUMB ---------------- */
console.log("\n--- 4. TASK [FE] T14: BREADCRUMB ARIA & SEO ---");

it("Breadcrumb sinh đúng cấu trúc nav, ol, li và aria-current trên mục cuối cùng", () => {
  const items = [
    { label: "Trang Chủ", url: "index.html" },
    { label: "Điện Thoại & Tablet", url: "pages/shop/catalog.html?category=dien-thoai" },
    { label: "iPhone 15 Pro Max 256GB" },
  ];
  const html = Components.Breadcrumb.createHTML(items, { basePath: "" });
  assert(html.includes('aria-label="Đường dẫn trang"'), "Phải có aria-label chuẩn WAI-ARIA");
  assert(html.includes('<ol class="breadcrumb">'), "Phải có ol.breadcrumb");
  assert(html.includes('href="index.html"'), "Mục đầu có liên kết");
  assert(html.includes('aria-current="page"'), "Mục cuối phải có aria-current='page'");
  assert(html.includes("iPhone 15 Pro Max 256GB"), "Hiển thị tên sản phẩm");
});

/* ---------------- 5. KIỂM THỬ TASK T14: RENDER PRODUCT CARD ---------------- */
console.log("\n--- 5. TASK [FE] T14: RENDER PRODUCT CARD ---");

it("ProductCard cho hàng Brand Mall (Hàng mới 100%) hiển thị đúng giá, sao, nút Thêm giỏ và Mua ngay", () => {
  const mallProduct = PRODUCTS.find((p) => p.type === "mall");
  assert(mallProduct, "Phải tìm thấy ít nhất 1 sản phẩm Mall");

  const cardHtml = Components.ProductCard.createHTML(mallProduct, { basePath: "" });
  assert(cardHtml.includes('data-type="mall"'), "Phải có data-type='mall'");
  assert(cardHtml.includes(mallProduct.id), "Phải có id sản phẩm");
  assert(cardHtml.includes("product_new.html"), "Link dẫn về product_new.html");
  assert(cardHtml.includes('data-action="add-cart"'), "Phải có nút data-action='add-cart'");
  assert(cardHtml.includes('data-action="buy"'), "Phải có nút data-action='buy'");
  assert(!cardHtml.includes('data-action="offer"'), "Hàng Mall mới không có nút Trả giá");
});

it("ProductCard cho hàng C2C Like New hiển thị độ mới %, thanh tiến trình và đủ 3 nút (Thêm giỏ, Mua ngay, Trả giá full-width)", () => {
  const c2cProduct = PRODUCTS.find((p) => p.type === "c2c");
  assert(c2cProduct, "Phải tìm thấy ít nhất 1 sản phẩm C2C");

  const cardHtml = Components.ProductCard.createHTML(c2cProduct, { basePath: "" });
  assert(cardHtml.includes('data-type="c2c"'), "Phải có data-type='c2c'");
  assert(cardHtml.includes(c2cProduct.id), "Phải có id sản phẩm");
  assert(cardHtml.includes("product_used.html"), "Link dẫn về product_used.html");
  assert(cardHtml.includes('data-action="add-cart"'), "Phải có nút data-action='add-cart'");
  assert(cardHtml.includes('data-action="buy"'), "Phải có nút data-action='buy'");
  assert(cardHtml.includes('data-action="offer"'), "Phải có nút data-action='offer'");
  assert(cardHtml.includes("Trả Giá Với Người Bán"), "Phải có nhãn Trả Giá Với Người Bán");
  assert(cardHtml.includes("progress-bar"), "Phải có thanh tiến trình độ mới");
});

/* ---------------- 6. KIỂM THỬ SHORTCUT VÀ TÍNH TƯƠNG THÍCH ---------------- */
console.log("\n--- 6. KIỂM THỬ SHORTCUTS & API CONVENIENCE ---");

it("Components cung cấp các hàm shortcut renderHeader, renderFooter, renderBreadcrumb, renderProductCard", () => {
  assert(typeof Components.renderHeader === "function");
  assert(typeof Components.renderFooter === "function");
  assert(typeof Components.renderBreadcrumb === "function");
  assert(typeof Components.renderProductCard === "function");
  assert(typeof Components.initAuto === "function");
});

/* ---------------- 7. KIỂM THỬ CÁC COMPONENT NÂNG CAO (ADVANCED CRO) ---------------- */
console.log("\n--- 7. KIỂM THỬ CÁC UI COMPONENT NÂNG CAO (DRAWER CART, SEARCH, MOBILE NAV, NOTIFS, LIVE CHAT) ---");

it("DrawerCart: Sinh mã HTML giỏ hàng trượt với backdrop, thanh freeship, tổng tiền và nút checkout", () => {
  assert.ok(Components.DrawerCart, "Phải có Components.DrawerCart");
  const html = Components.DrawerCart.createHTML({ basePath: "" });
  assert(html.includes('id="drawerCart"'), "Phải có aside id='drawerCart'");
  assert(html.includes('id="drawerCartBackdrop"'), "Phải có backdrop id='drawerCartBackdrop'");
  assert(html.includes('id="drawerCartBody"'), "Phải có body giỏ hàng id='drawerCartBody'");
  assert(html.includes("Thanh Toán Nhanh"), "Phải có nút Thanh Toán Nhanh");
  assert(html.includes("Freeship"), "Phải có thông điệp freeship");
});

it("DrawerWishlist: Sinh mã HTML danh sách yêu thích trượt với backdrop và liên kết quản lý", () => {
  assert.ok(Components.DrawerWishlist, "Phải có Components.DrawerWishlist");
  const html = Components.DrawerWishlist.createHTML({ basePath: "" });
  assert(html.includes('id="drawerWishlist"'), "Phải có aside id='drawerWishlist'");
  assert(html.includes('id="drawerWishlistBackdrop"'), "Phải có backdrop id='drawerWishlistBackdrop'");
  assert(html.includes('id="drawerWishlistBody"'), "Phải có body id='drawerWishlistBody'");
  assert(html.includes("Quản Lý Tất Cả Trong Hồ Sơ"), "Có nút liên kết đến Hồ sơ cá nhân");
});

it("AutocompleteSearch: Tạo dropdown với tìm kiếm gần đây, xu hướng và kết quả gợi ý trực tiếp", () => {
  assert.ok(Components.AutocompleteSearch, "Phải có Components.AutocompleteSearch");

  // Khi chưa gõ: Hiển thị từ khóa xu hướng
  const emptyHtml = Components.AutocompleteSearch.createDropdownHTML("");
  assert(emptyHtml.includes("Từ Khóa Xu Hướng"), "Hiển thị tiêu đề Từ Khóa Xu Hướng");
  assert(emptyHtml.includes("iPhone 15 Pro Max"), "Hiển thị từ khóa xu hướng hot");

  // Khi gõ từ khóa khớp
  global.window = { PRODUCTS };
  const queryHtml = Components.AutocompleteSearch.createDropdownHTML("iPhone");
  assert(queryHtml.includes("search-prod-item"), "Phải có các mục sản phẩm khớp");
  assert(queryHtml.includes("Xem tất cả kết quả"), "Phải có link xem tất cả kết quả trong catalog");
});

it("MobileBottomNav: Sinh thanh điều hướng di động 5 mục thiết yếu kèm badge giỏ hàng", () => {
  assert.ok(Components.MobileBottomNav, "Phải có Components.MobileBottomNav");
  const html = Components.MobileBottomNav.createHTML({ basePath: "" });
  assert(html.includes('id="mobileBottomNav"'), "Phải có nav id='mobileBottomNav'");
  assert(html.includes("Trang Chủ"), "Có nút Trang Chủ");
  assert(html.includes("Cửa Hàng"), "Có nút Cửa Hàng");
  assert(html.includes("Đăng Bán"), "Có nút Đăng Bán nổi bật");
  assert(html.includes("Giỏ Hàng"), "Có nút Giỏ Hàng");
  assert(html.includes("Tài Khoản"), "Có nút Tài Khoản");
  assert(html.includes('id="bottomNavCartCount"'), "Có badge số lượng giỏ hàng");
});

it("NotificationCenter: Sinh dropdown trung tâm thông báo đa tab (Đơn hàng, Khuyến mãi, Hệ thống)", () => {
  assert.ok(Components.NotificationCenter, "Phải có Components.NotificationCenter");
  const html = Components.NotificationCenter.createHTML({ basePath: "" });
  assert(html.includes('id="notifDropdown"'), "Phải có dropdown id='notifDropdown'");
  assert(html.includes("Trung Tâm Thông Báo"), "Tiêu đề Trung Tâm Thông Báo");
  assert(html.includes("notif-tab"), "Có các tab phân loại thông báo");
  assert(html.includes("Đã đọc tất cả"), "Có nút Đã đọc tất cả");
});

it("LiveChat: Sinh widget hỗ trợ trực tuyến 24/7 và phản hồi thông minh quy trình 15 bước", () => {
  assert.ok(Components.LiveChat, "Phải có Components.LiveChat");
  const html = Components.LiveChat.createHTML();
  assert(html.includes('id="liveChatWidget"'), "Phải có widget id='liveChatWidget'");
  assert(html.includes('id="liveChatFloatingBtn"'), "Phải có nút nổi liveChatFloatingBtn");
  assert(html.includes('id="liveChatWindow"'), "Phải có cửa sổ chat liveChatWindow");
  assert(html.includes("HYBRID Assistant"), "Có trợ lý AI HYBRID Assistant");

  // Kiểm thử câu trả lời tự động cho quy trình 15 bước
  const reply15 = Components.LiveChat.getBotReply("15 bước kiểm định phần cứng");
  assert(reply15.includes("15 bước"), "Trả lời chi tiết về 15 bước kiểm định");
  assert(reply15.includes("IMEI"), "Bao gồm kiểm tra IMEI");

  // Kiểm thử câu trả lời tự động cho bảo hành
  const replyWarr = Components.LiveChat.getBotReply("Chính sách bảo hành");
  assert(replyWarr.includes("Bảo hành"), "Trả lời chính sách bảo hành");
});

/* ---------------- 8. KIỂM THỬ THEME TOGGLE VÀ CHỐNG DOUBLE-TOGGLE ---------------- */
console.log("\n--- 8. KIỂM THỬ THEME TOGGLE VÀ CHỐNG GỌI ĐÚP (DOUBLE TOGGLE) ---");

it("Header.bindEvents gắn sự kiện click cho #themeToggleBtn, chặn stopPropagation và chuyển đổi giao diện chính xác", () => {
  let localStorageStore = { hybrid_theme: "dark" };
  global.localStorage = {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => {
      localStorageStore[k] = String(v);
    },
  };

  const listeners = {};
  const mockButton = {
    id: "themeToggleBtn",
    dataset: {},
    attributes: {},
    style: {},
    classList: {
      remove: function () {},
      add: function () {},
      toggle: function () {},
    },
    setAttribute: function (k, v) {
      this.attributes[k] = v;
    },
    getAttribute: function (k) {
      return this.attributes[k];
    },
    querySelector: function () {
      return { textContent: "light_mode" };
    },
    addEventListener: function (evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
  };

  const docListeners = {};
  global.document = {
    createElement: function (tag) {
      return {
        tag: tag,
        style: {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {} },
        setAttribute: function () {},
        appendChild: function () {},
        querySelector: function () {
          return { addEventListener: function () {}, classList: { add: function () {} } };
        },
        innerHTML: "",
      };
    },
    getElementById: function (id) {
      if (id === "themeToggleBtn") return mockButton;
      return null;
    },
    querySelectorAll: function (selector) {
      if (selector && selector.includes("themeToggleBtn")) return [mockButton];
      return [];
    },
    documentElement: {
      setAttribute: function (k, v) {
        this[k] = v;
      },
      getAttribute: function (k) {
        return this[k] || "dark";
      },
      classList: {
        toggle: function () {},
      },
    },
    body: {
      appendChild: function () {},
      classList: {
        toggle: function () {},
        contains: function () {
          return false;
        },
      },
    },
    addEventListener: function (evt, fn) {
      docListeners[evt] = docListeners[evt] || [];
      docListeners[evt].push(fn);
    },
  };

  // Khởi tạo Theme trong utils
  Utils.Theme.set("dark");
  assert.strictEqual(Utils.Theme.get(), "dark");

  // Gắn sự kiện qua Components.Header.bindEvents
  Components.Header.bindEvents();
  assert.strictEqual(mockButton.dataset.bound, "true", "Nút phải được đánh dấu dataset.bound = 'true'");
  assert(listeners.click && listeners.click.length > 0, "Nút phải có click event listener");

  // Giả lập click lần 1: Dark -> Light
  let stoppedPropagation = false;
  let preventedDefault = false;
  const mockEvent1 = {
    preventDefault: () => {
      preventedDefault = true;
    },
    stopPropagation: () => {
      stoppedPropagation = true;
    },
  };
  listeners.click[0](mockEvent1);

  assert.strictEqual(preventedDefault, true, "Phải gọi e.preventDefault()");
  assert.strictEqual(stoppedPropagation, true, "Phải gọi e.stopPropagation() để không bubble lên document");
  assert.strictEqual(Utils.Theme.get(), "light", "Sau click 1, theme phải là 'light'");
  assert.strictEqual(global.localStorage.getItem("hybrid_theme"), "light", "Storage phải lưu 'light'");

  // Giả lập click lần 2: Light -> Dark
  const mockEvent2 = {
    preventDefault: () => {},
    stopPropagation: () => {},
  };
  listeners.click[0](mockEvent2);
  assert.strictEqual(Utils.Theme.get(), "dark", "Sau click 2, theme phải là 'dark'");
  assert.strictEqual(global.localStorage.getItem("hybrid_theme"), "dark", "Storage phải lưu 'dark'");
});

it("Sự kiện click nổi bọt lên document bị chặn gọi đúp nếu nút đã gắn dataset.bound = 'true'", () => {
  let localStorageStore = { hybrid_theme: "light" };
  global.localStorage = {
    getItem: (k) => localStorageStore[k] || null,
    setItem: (k, v) => {
      localStorageStore[k] = String(v);
    },
  };

  const mockBoundBtn = {
    id: "themeToggleBtn",
    dataset: { bound: "true" },
    classList: { contains: () => false },
    closest: function (sel) {
      if (sel.includes("themeToggleBtn")) return this;
      return null;
    },
  };

  Utils.Theme.set("light");
  assert.strictEqual(Utils.Theme.get(), "light");

  // Giả lập sự kiện nổi bọt lên document click listener trong utils.js
  // Nếu không có 'if (btn.dataset.bound === "true") return;' thì theme sẽ bị đổi sang dark
  let clickHandlers = [];
  const origDocAddListener = global.document.addEventListener;
  global.document.addEventListener = function (evt, fn) {
    if (evt === "click") clickHandlers.push(fn);
  };

  Utils.Theme.init();

  // Kích hoạt handler
  assert(clickHandlers.length > 0, "Phải có click handler trong utils.js");
  const docClickEvent = {
    target: mockBoundBtn,
    preventDefault: () => {},
  };
  clickHandlers[clickHandlers.length - 1](docClickEvent);

  // Theme vẫn phải giữ nguyên là 'light', không bị đổi sang 'dark'
  assert.strictEqual(
    Utils.Theme.get(),
    "light",
    "Theme phải giữ nguyên 'light', không bị toggle đúp do click nổi bọt"
  );
  assert.strictEqual(global.localStorage.getItem("hybrid_theme"), "light");
});

console.log("\n========================================================");
console.log(`KẾT QUẢ KIỂM THỬ: ${passed} / ${passed + failed} PASS`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
}
