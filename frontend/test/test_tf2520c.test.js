/**
 * test_tf2520c.test.js — Kiểm thử tự động Node.js cho Task TF2520C
 * Đối chiếu chi tiết 11 tiêu chí nghiệm thu của đề bài.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("==================================================");
console.log("KIỂM THỬ TỰ ĐỘNG TASK TF2520C — PRODUCT CARD & MODAL");
console.log("==================================================\n");

const baseCssPath = path.join(__dirname, "../css/base.css");
const modalJsPath = path.join(__dirname, "../js/modal.js");
const testHtmlPath = path.join(__dirname, "test_tf2520c.html");

const baseCss = fs.readFileSync(baseCssPath, "utf-8");
const modalJs = fs.readFileSync(modalJsPath, "utf-8");
const testHtml = fs.readFileSync(testHtmlPath, "utf-8");

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✔ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✘ FAIL: ${desc}`);
    console.error(`    -> ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
console.log("--- 1. Kiểm tra File & Cấu trúc cơ bản ---");
it("Tồn tại đầy đủ 3 file cần thiết trong repository", () => {
  assert(fs.existsSync(baseCssPath), "base.css phải tồn tại");
  assert(fs.existsSync(modalJsPath), "modal.js phải tồn tại");
  assert(fs.existsSync(testHtmlPath), "test_tf2520c.html phải tồn tại");
});

// ---------------------------------------------------------------------------
console.log("\n--- 2. Tiêu chí 1: Cả ba card sử dụng CHUNG 1 CẤU TRÚC HTML ---");
it("Các card (flash, new, used) trong HTML có cấu trúc các thẻ con giống hệt nhau", () => {
  // Trích xuất cấu trúc innerHTML của 3 card
  function extractCardStructure(html, cardId) {
    const regex = new RegExp(`<article[^>]*id="${cardId}"[^>]*>([\\s\\S]*?)<\\/article>`, "i");
    const match = html.match(regex);
    assert(match, `Không tìm thấy card với id="${cardId}"`);
    // Lấy chuỗi các tag con theo thứ tự
    const tags = Array.from(match[1].matchAll(/<([a-z0-9]+)([^>]*)>/gi)).map(m => {
      const tag = m[1].toLowerCase();
      const classMatch = m[2].match(/class="([^"]*)"/i);
      const classes = classMatch ? classMatch[1].split(/\s+/).filter(c => !c.startsWith("product-card--")).sort().join(".") : "";
      return `${tag}${classes ? "." + classes : ""}`;
    });
    return tags.join(" > ");
  }

  const structFlash = extractCardStructure(testHtml, "cardFlash");
  const structNew = extractCardStructure(testHtml, "cardNew");
  const structUsed = extractCardStructure(testHtml, "cardUsed");

  assert.strictEqual(structFlash, structNew, "Card Flash và Card New phải có cùng cây cấu trúc HTML");
  assert.strictEqual(structNew, structUsed, "Card New và Card Used phải có cùng cây cấu trúc HTML");
});

// ---------------------------------------------------------------------------
console.log("\n--- 3. Tiêu chí 2 & BEM: Modifier điều khiển ẩn/hiện bằng CSS ---");
it("base.css có đủ 3 modifier classes và cơ chế ẩn/hiện thành phần", () => {
  assert(baseCss.includes(".product-card--flash"), "Phải có modifier .product-card--flash");
  assert(baseCss.includes(".product-card--new"), "Phải có modifier .product-card--new");
  assert(baseCss.includes(".product-card--used"), "Phải có modifier .product-card--used");
  
  // Kiểm tra cơ chế mặc định ẩn
  assert(baseCss.includes("display: none"), "Phải có quy tắc display: none để ẩn các trường đặc thù");
  // Kiểm tra từng modifier bật lại
  assert(baseCss.includes(".product-card.product-card--flash .badge-flash"), "Flash sale phải hiện badge-flash");
  assert(baseCss.includes(".product-card.product-card--new .badge-mall"), "Hàng mới phải hiện badge-mall");
  assert(baseCss.includes(".product-card.product-card--used .badge-used-cond"), "Đồ cũ phải hiện badge-used-cond");
});

// ---------------------------------------------------------------------------
console.log("\n--- 4. Tiêu chí 3: Biến thể Flash Sale ---");
it("Flash Sale có nhãn Flash Sale / giảm giá và giá cũ gạch ngang", () => {
  assert(baseCss.includes(".badge-flash"), "Có class .badge-flash");
  assert(baseCss.includes(".price-old"), "Có class .price-old");
  assert(baseCss.includes("line-through"), "Giá cũ phải có thuộc tính text-decoration: line-through");
  assert(testHtml.includes("badge-flash"), "HTML có thẻ badge-flash");
  assert(testHtml.includes("price-old"), "HTML có thẻ price-old");
});

// ---------------------------------------------------------------------------
console.log("\n--- 5. Tiêu chí 4: Biến thể Hàng Mới ---");
it("Hàng mới có số sao, lượt đánh giá và nhãn chính hãng", () => {
  assert(baseCss.includes(".badge-mall"), "Có style cho badge-mall (Chính Hãng)");
  assert(baseCss.includes(".product-meta-new"), "Có class .product-meta-new");
  assert(testHtml.includes("product-stars"), "HTML có chứa product-stars");
  assert(testHtml.includes("product-reviews"), "HTML có chứa product-reviews");
  assert(testHtml.includes("badge-mall"), "HTML có chứa badge-mall");
});

// ---------------------------------------------------------------------------
console.log("\n--- 6. Tiêu chí 5: Biến thể Đồ Cũ ---");
it("Đồ cũ có chip tình trạng 95%, xác minh, kiểm định và địa điểm", () => {
  assert(baseCss.includes(".product-meta-used"), "Có class .product-meta-used");
  assert(baseCss.includes(".chip-status"), "Có class .chip-status");
  assert(baseCss.includes(".chip-verified"), "Có class .chip-verified");
  assert(baseCss.includes(".chip-inspected"), "Có class .chip-inspected");
  assert(baseCss.includes(".seller-location"), "Có class .seller-location");
  assert(testHtml.includes("95%"), "HTML có chip tình trạng 95%");
  assert(testHtml.includes("xác minh"), "HTML có thông tin xác minh");
  assert(testHtml.includes("kiểm định"), "HTML có thông tin kiểm định");
  assert(testHtml.includes("Hà Nội"), "HTML có thông tin địa điểm");
});

// ---------------------------------------------------------------------------
console.log("\n--- 7. Tiêu chí 6: Mỗi card có đúng ba nút chức năng ---");
it("Mỗi card có đúng 3 nút: nút chính, Trả giá, Mua ngay và layout responsive", () => {
  ["cardFlash", "cardNew", "cardUsed"].forEach((cardId) => {
    const cardHtmlMatch = testHtml.match(new RegExp(`<article[^>]*id="${cardId}"[\\s\\S]*?<\\/article>`, "i"))[0];
    const actionsMatch = cardHtmlMatch.match(/<div class="product-actions">([\s\S]*?)<\/div>/i)[1];
    const buttons = actionsMatch.match(/<button[\s\S]*?<\/button>/gi);
    assert.strictEqual(buttons.length, 3, `${cardId} phải có đúng 3 nút`);
    assert(actionsMatch.includes("btn-action-main"), `${cardId} phải có nút chính`);
    assert(actionsMatch.includes("btn-action-offer"), `${cardId} phải có nút Trả giá`);
    assert(actionsMatch.includes("btn-action-buy"), `${cardId} phải có nút Mua ngay`);
  });

  // Kiểm tra CSS responsive
  assert(baseCss.includes("@media (max-width: 420px)"), "CSS phải có media query cho mobile");
});

// ---------------------------------------------------------------------------
console.log("\n--- 8. Tiêu chí 7 & 8: Hệ thống Modal 3 kích thước và Modal Trả giá ---");
it("Modal có đủ 3 kích thước sm, md, lg và Modal Trả giá dùng modal-lg", () => {
  assert(baseCss.includes(".modal-sm"), "Có class .modal-sm");
  assert(baseCss.includes(".modal-md"), "Có class .modal-md");
  assert(baseCss.includes(".modal-lg"), "Có class .modal-lg");
  assert(baseCss.includes("backdrop-filter: blur(6px)"), "Backdrop phải có blur");
  assert(baseCss.includes(".modal-head"), "Modal phải có .modal-head");
  assert(baseCss.includes(".modal-body"), "Modal phải có .modal-body");
  assert(baseCss.includes(".modal-foot"), "Modal phải có .modal-foot");

  // Kiểm tra #offerModal dùng .modal-lg
  assert(testHtml.includes('id="offerModal"'), "Phải có modal #offerModal");
  assert(testHtml.match(/<div[^>]*id="offerModal"[\s\S]*?<div class="modal modal-lg"/i), "#offerModal phải dùng class modal-lg");
});

// ---------------------------------------------------------------------------
console.log("\n--- 9. Tiêu chí 9 & 10: Xử lý Modal bằng JavaScript (Esc, Lock Scroll) ---");
it("modal.js xử lý đóng mở, phím Esc và khóa cuộn body.modal-open", () => {
  assert(modalJs.includes("openModal"), "modal.js phải có hàm openModal");
  assert(modalJs.includes("closeModal"), "modal.js phải có hàm closeModal");
  assert(modalJs.includes("modal-open"), "modal.js phải thêm/xóa class modal-open cho body");
  assert(modalJs.includes('"Escape"'), "modal.js phải bắt sự kiện phím Escape");

  // Giả lập môi trường DOM tối giản để test logic modal.js
  const mockClassList = (initial = []) => {
    const classes = new Set(initial);
    return {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toArray: () => Array.from(classes)
    };
  };

  const mockBackdrop = {
    classList: mockClassList(["modal-backdrop"]),
    querySelector: () => null,
  };

  const mockDocument = {
    body: { classList: mockClassList() },
    getElementById: (id) => (id === "testModal" ? mockBackdrop : null),
    querySelectorAll: (sel) => (mockBackdrop.classList.contains("is-open") ? [mockBackdrop] : []),
    addEventListener: () => {}
  };

  const mockWindow = {};

  // Chạy logic trong sandbox
  const vm = require("vm");
  const ctx = vm.createContext({ window: mockWindow, document: mockDocument, console });
  vm.runInContext(modalJs, ctx);

  assert(mockWindow.Modal, "Phải export window.Modal");
  // Test mở modal
  mockWindow.Modal.open("testModal");
  assert(mockBackdrop.classList.contains("is-open"), "Mở modal phải thêm is-open");
  assert(mockDocument.body.classList.contains("modal-open"), "Mở modal phải thêm modal-open cho body");

  // Test đóng modal
  mockWindow.Modal.close("testModal");
  assert(!mockBackdrop.classList.contains("is-open"), "Đóng modal phải gỡ is-open");
  assert(!mockDocument.body.classList.contains("modal-open"), "Đóng modal phải gỡ modal-open khỏi body");
});

// ---------------------------------------------------------------------------
console.log("\n--- 10. Tiêu chí 11: Khung ảnh vuông 1:1 và Responsive ---");
it("Product media có tỉ lệ 1:1 và bố cục card linh hoạt", () => {
  assert(baseCss.includes("aspect-ratio: 1 / 1"), "Ảnh phải có aspect-ratio: 1 / 1");
  assert(baseCss.includes("object-fit: cover"), "Ảnh phải có object-fit: cover");
});

console.log("\n==================================================");
console.log(`TỔNG KẾT: ${passed}/${total} TESTS ĐẠT (PASS)`);
console.log("==================================================");
