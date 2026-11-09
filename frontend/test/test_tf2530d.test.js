/**
 * test_tf2530d.test.js — Bộ kiểm thử tự động Node.js cho Task TF2530D
 * Kiểm thử toàn diện utils.js:
 * 1. Các hàm tiện ích cũ (formatCurrency, formatDate, toast, openModal, confirm)
 * 2. startCountdown (cập nhật, tự dừng, gọi onEnd 1 lần, xử lý thời gian đã hết)
 * 3. renderStars (0, 2.5, 3, 4.5, 5, an toàn với giá trị ngoại lệ)
 * 4. filterProducts (đơn điều kiện, đa điều kiện, không đổi mảng gốc)
 * 5. sortProducts (tăng dần, giảm dần, chuỗi tiếng Việt, không đổi mảng gốc)
 * 6. paginate (chia trang, clamp page, totalPages, mảng rỗng)
 * 7. LUỒNG CATALOG TOÀN DIỆN: Lọc -> Sắp xếp -> Phân trang
 */

const assert = require("assert");
const path = require("path");
const fs = require("fs");

const utilsPath = path.join(__dirname, "../js/utils.js");
assert(fs.existsSync(utilsPath), "File frontend/js/utils.js phải tồn tại!");

const Utils = require(utilsPath);
const {
  formatCurrency,
  formatDate,
  toast,
  openModal,
  closeModal,
  confirm,
  startCountdown,
  renderStars,
  filterProducts,
  sortProducts,
  paginate,
  escapeHtml,
  getUsedDiscountPercent,
} = Utils;

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${desc}`);
    console.error(`    -> ${err.message}`);
  }
}

// BỘ DỮ LIỆU SẢN PHẨM MẪU CHUẨN CATALOG SÀN THƯƠNG MẠI ĐIỆN TỬ
const SAMPLE_PRODUCTS = [
  {
    id: "f1",
    name: "Aurora Techwear Puffer Jacket",
    category: "fashion",
    type: "c2c",
    cond: 98,
    price: 2850000,
    rating: 4.8,
    flash: false,
    seller: "Việt Dũng",
  },
  {
    id: "f2",
    name: "Áo Khoác Bomber Cyberpunk J1A-GT",
    category: "fashion",
    type: "mall",
    cond: 100,
    price: 4690000,
    off: 15,
    rating: 4.9,
    flash: true,
    seller: "Acronym Studio",
  },
  {
    id: "f3",
    name: "Áo Khoác Denim Japanese Selvedge",
    category: "fashion",
    type: "c2c",
    cond: 95,
    price: 1450000,
    rating: 4.5,
    flash: false,
    seller: "Bảo Trâm",
  },
  {
    id: "f4",
    name: "Áo Hoodie Heavyweight Boxy Fit",
    category: "fashion",
    type: "mall",
    cond: 100,
    price: 1290000,
    rating: 4.7,
    flash: false,
    seller: "Fog Essentials",
  },
  {
    id: "s1",
    name: "Nike Air Jordan 1 High Travis Scott",
    category: "sneakers",
    type: "c2c",
    cond: 96,
    price: 24500000,
    rating: 5.0,
    flash: false,
    seller: "Huy Hoàng",
  },
  {
    id: "s2",
    name: "Yeezy Boost 350 V2 Zebra",
    category: "sneakers",
    type: "c2c",
    cond: 92,
    price: 5200000,
    rating: 4.6,
    flash: false,
    seller: "Tuấn Anh",
  },
  {
    id: "s3",
    name: "New Balance 990v6 Made in USA",
    category: "sneakers",
    type: "mall",
    cond: 100,
    price: 6490000,
    rating: 4.9,
    flash: false,
    seller: "New Balance Mall",
  },
  {
    id: "t1",
    name: "MacBook Pro 14 M3 Pro 18GB/512GB",
    category: "tech",
    type: "c2c",
    cond: 99,
    price: 43500000,
    rating: 4.9,
    flash: false,
    seller: "Minh Quân",
  },
  {
    id: "t2",
    name: "Tai nghe Sony WH-1000XM5 Chống Ồn",
    category: "tech",
    type: "mall",
    cond: 100,
    price: 6490000,
    off: 20,
    rating: 4.8,
    flash: true,
    seller: "Sony Vietnam Mall",
  },
  {
    id: "t3",
    name: "Bàn Phím Cơ Custom Nhôm CNC QK75N",
    category: "tech",
    type: "c2c",
    cond: 97,
    price: 4200000,
    rating: 4.7,
    flash: false,
    seller: "Khánh Duy",
  },
  {
    id: "t4",
    name: "iPhone 16 Pro Max 256GB Desert Titanium",
    category: "tech",
    type: "mall",
    cond: 100,
    price: 34490000,
    rating: 5.0,
    flash: false,
    seller: "Apple Flagship Store",
  },
  {
    id: "a1",
    name: "Máy hút bụi không dây Dyson V12 Slim",
    category: "appliances",
    type: "mall",
    cond: 100,
    price: 14990000,
    off: 10,
    rating: 4.8,
    flash: true,
    seller: "Dyson Official",
  },
];

console.log("\n==================================================");
console.log("KIỂM THỬ TỰ ĐỘNG TASK TF2530D — UTILS.JS");
console.log("==================================================\n");

// ---------------------------------------------------------------------------
console.log("--- PHẦN 1: Kiểm thử các hàm tiện ích cũ ---");

it("formatCurrency định dạng đúng VNĐ và số nguyên", () => {
  assert.strictEqual(formatCurrency(2850000), "2.850.000₫");
  assert.strictEqual(formatCurrency(0), "0₫");
  assert.strictEqual(formatCurrency("15000000"), "15.000.000₫");
  assert.strictEqual(formatCurrency(null), "0₫");
  assert.strictEqual(formatCurrency(undefined), "0₫");
  assert.strictEqual(formatCurrency("abc"), "0₫");
});

it("formatDate định dạng chuẩn ngày tháng DD/MM/YYYY", () => {
  const d = new Date(2026, 10, 9, 14, 30, 0); // Tháng 11
  assert.strictEqual(formatDate(d), "09/11/2026");
  assert.strictEqual(formatDate(d, "YYYY-MM-DD"), "2026-11-09");
  assert.strictEqual(formatDate(d, "DD/MM/YYYY HH:mm"), "09/11/2026 14:30");
  assert.strictEqual(formatDate(null), "");
  assert.strictEqual(formatDate("invalid"), "");
});

it("toast, openModal, closeModal, confirm hoạt động an toàn khi không có DOM (Node.js)", () => {
  assert.strictEqual(toast("Xin chào"), null);
  assert.strictEqual(typeof openModal, "function");
  assert.strictEqual(typeof closeModal, "function");
  assert.strictEqual(typeof confirm, "function");

  // Kiểm tra confirm trả về Promise
  const res = confirm("Bạn có chắc không?");
  assert(res instanceof Promise);
});

// ---------------------------------------------------------------------------
console.log("\n--- PHẦN 2: Kiểm thử renderStars ---");

it("renderStars xử lý chính xác các mốc điểm 0, 2.5, 3, 4.5, 5 và biểu tượng nửa sao trực quan", () => {
  assert.strictEqual(renderStars(5), "★★★★★", "5 sao phải là 5 sao đầy");
  assert.strictEqual(renderStars(4.5), "★★★★⯨", "4.5 sao phải là 4 sao đầy và 1 sao nửa trực quan ⯨ (không phải phân số ½)");
  assert.strictEqual(renderStars(3), "★★★☆☆", "3 sao phải là 3 sao đầy và 2 sao rỗng");
  assert.strictEqual(renderStars(2.5), "★★⯨☆☆", "2.5 sao phải là 2 sao đầy, 1 sao nửa ⯨, 2 sao rỗng");
  assert.strictEqual(renderStars(0), "☆☆☆☆☆", "0 sao phải là 5 sao rỗng");
});

it("renderStars an toàn với giá trị ngoại lệ (null, NaN, âm, vượt ngưỡng)", () => {
  assert.strictEqual(renderStars(null), "☆☆☆☆☆");
  assert.strictEqual(renderStars(undefined), "☆☆☆☆☆");
  assert.strictEqual(renderStars(-2), "☆☆☆☆☆");
  assert.strictEqual(renderStars(10), "★★★★★");
  assert.strictEqual(renderStars("invalid"), "☆☆☆☆☆");
});

it("renderStars hỗ trợ xuất định dạng HTML khi có tùy chọn html", () => {
  const html = renderStars(4.5, { html: true });
  assert(html.includes("rating"));
  assert(html.includes("star_half"));
  assert(html.includes("4.5 / 5 sao"));
});

// ---------------------------------------------------------------------------
console.log("\n--- PHẦN 3: Kiểm thử filterProducts ---");

it("filterProducts lọc đúng với 1 điều kiện (category)", () => {
  const result = filterProducts(SAMPLE_PRODUCTS, { category: "fashion" });
  assert.strictEqual(result.length, 4);
  result.forEach((p) => assert.strictEqual(p.category, "fashion"));
});

it("filterProducts lọc đúng với 1 điều kiện (khoảng giá minPrice/maxPrice)", () => {
  const result = filterProducts(SAMPLE_PRODUCTS, { minPrice: 5000000, maxPrice: 15000000 });
  assert(result.length > 0);
  result.forEach((p) => {
    assert(p.price >= 5000000, `Giá ${p.price} phải >= 5.000.000`);
    assert(p.price <= 15000000, `Giá ${p.price} phải <= 15.000.000`);
  });
});

it("filterProducts lọc theo từ khóa tìm kiếm (keyword)", () => {
  const result = filterProducts(SAMPLE_PRODUCTS, { keyword: "jordan" });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "s1");
});

it("filterProducts lọc kết hợp nhiều điều kiện (AND logic)", () => {
  const result = filterProducts(SAMPLE_PRODUCTS, {
    category: "tech",
    type: "mall",
    flash: true,
  });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "t2");
  assert.strictEqual(result[0].name, "Tai nghe Sony WH-1000XM5 Chống Ồn");
});

it("filterProducts không làm thay đổi mảng ban đầu và trả toàn bộ khi criteria rỗng", () => {
  const originalLength = SAMPLE_PRODUCTS.length;
  const originalFirst = SAMPLE_PRODUCTS[0].id;
  const filtered = filterProducts(SAMPLE_PRODUCTS, {});
  assert.strictEqual(SAMPLE_PRODUCTS.length, originalLength);
  assert.strictEqual(SAMPLE_PRODUCTS[0].id, originalFirst);
  assert.strictEqual(filtered.length, originalLength);
  assert.notStrictEqual(filtered, SAMPLE_PRODUCTS, "Phải trả về mảng mới");
});

// ---------------------------------------------------------------------------
console.log("\n--- PHẦN 4: Kiểm thử sortProducts ---");

it("sortProducts sắp xếp giá tăng dần (price-asc)", () => {
  const sorted = sortProducts(SAMPLE_PRODUCTS, "price-asc");
  assert.strictEqual(sorted.length, SAMPLE_PRODUCTS.length);
  for (let i = 0; i < sorted.length - 1; i++) {
    assert(sorted[i].price <= sorted[i + 1].price);
  }
});

it("sortProducts sắp xếp giá giảm dần (price-desc)", () => {
  const sorted = sortProducts(SAMPLE_PRODUCTS, "price-desc");
  assert.strictEqual(sorted.length, SAMPLE_PRODUCTS.length);
  for (let i = 0; i < sorted.length - 1; i++) {
    assert(sorted[i].price >= sorted[i + 1].price);
  }
});

it("sortProducts sắp xếp đánh giá sao cao nhất (rating-desc)", () => {
  const sorted = sortProducts(SAMPLE_PRODUCTS, "rating-desc");
  for (let i = 0; i < sorted.length - 1; i++) {
    assert(sorted[i].rating >= sorted[i + 1].rating);
  }
});

it("sortProducts sắp xếp tên A-Z (name-asc) tiếng Việt chuẩn", () => {
  const sorted = sortProducts(SAMPLE_PRODUCTS, "name-asc");
  for (let i = 0; i < sorted.length - 1; i++) {
    const cmp = String(sorted[i].name).localeCompare(String(sorted[i + 1].name), "vi");
    assert(cmp <= 0, `"${sorted[i].name}" phải đứng trước "${sorted[i + 1].name}"`);
  }
});

it("sortProducts không thay đổi mảng gốc và xử lý trường hợp không tồn tại an toàn", () => {
  const firstIdBefore = SAMPLE_PRODUCTS[0].id;
  sortProducts(SAMPLE_PRODUCTS, "price-desc");
  assert.strictEqual(SAMPLE_PRODUCTS[0].id, firstIdBefore);

  const fallbackSorted = sortProducts(SAMPLE_PRODUCTS, "non_existing_field");
  assert.strictEqual(fallbackSorted.length, SAMPLE_PRODUCTS.length);
});

// ---------------------------------------------------------------------------
console.log("\n--- PHẦN 5: Kiểm thử paginate ---");

it("paginate trả về đúng cấu trúc { items, page, totalPages, total }", () => {
  const res = paginate(SAMPLE_PRODUCTS, 1, 4);
  assert.strictEqual(typeof res, "object");
  assert.strictEqual(res.total, 12);
  assert.strictEqual(res.totalPages, 3);
  assert.strictEqual(res.page, 1);
  assert.strictEqual(res.items.length, 4);
  assert.strictEqual(res.items[0].id, "f1");
});

it("paginate tính đúng trang thứ 2 và trang cuối cùng", () => {
  const page2 = paginate(SAMPLE_PRODUCTS, 2, 5);
  assert.strictEqual(page2.page, 2);
  assert.strictEqual(page2.items.length, 5);
  assert.strictEqual(page2.items[0].id, "s2");

  const page3 = paginate(SAMPLE_PRODUCTS, 3, 5);
  assert.strictEqual(page3.page, 3);
  assert.strictEqual(page3.items.length, 2); // 12 - 10 = 2 phần tử
});

it("paginate tự động clamp trang ngoài giới hạn và xử lý danh sách rỗng", () => {
  const clampHigh = paginate(SAMPLE_PRODUCTS, 999, 4);
  assert.strictEqual(clampHigh.page, 3);
  assert.strictEqual(clampHigh.items.length, 4);

  const clampLow = paginate(SAMPLE_PRODUCTS, -5, 4);
  assert.strictEqual(clampLow.page, 1);

  const emptyRes = paginate([], 1, 10);
  assert.strictEqual(emptyRes.total, 0);
  assert.strictEqual(emptyRes.totalPages, 1);
  assert.strictEqual(emptyRes.page, 1);
  assert.strictEqual(emptyRes.items.length, 0);

  const invalidList = paginate(null, 1, 10);
  assert.strictEqual(invalidList.total, 0);
  assert.strictEqual(invalidList.items.length, 0);
});

// ---------------------------------------------------------------------------
console.log("\n--- PHẦN 6: Kiểm thử LUỒNG CATALOG TOÀN DIỆN (Lọc -> Sắp xếp -> Phân trang) ---");

it("Luồng Catalog: Lọc đồ C2C -> Sắp xếp giá tăng dần -> Phân trang trang 1 (size 3)", () => {
  // Bước 1: Lọc
  const filtered = filterProducts(SAMPLE_PRODUCTS, { type: "c2c" });
  assert.strictEqual(filtered.length, 6, "Có đúng 6 sản phẩm C2C");

  // Bước 2: Sắp xếp
  const sorted = sortProducts(filtered, "price-asc");
  assert.strictEqual(sorted.length, 6);
  assert.strictEqual(sorted[0].price, 1450000, "Sản phẩm rẻ nhất là Denim f3");
  assert.strictEqual(sorted[5].price, 43500000, "Sản phẩm đắt nhất là MacBook t1");

  // Bước 3: Phân trang trang 1
  const paginatedPage1 = paginate(sorted, 1, 3);
  assert.strictEqual(paginatedPage1.total, 6);
  assert.strictEqual(paginatedPage1.totalPages, 2);
  assert.strictEqual(paginatedPage1.page, 1);
  assert.strictEqual(paginatedPage1.items.length, 3);
  assert.deepStrictEqual(
    paginatedPage1.items.map((i) => i.id),
    ["f3", "f1", "t3"],
    "Thứ tự ID trang 1 phải khớp 3 sản phẩm giá thấp nhất"
  );

  // Phân trang trang 2
  const paginatedPage2 = paginate(sorted, 2, 3);
  assert.strictEqual(paginatedPage2.page, 2);
  assert.strictEqual(paginatedPage2.items.length, 3);
  assert.deepStrictEqual(
    paginatedPage2.items.map((i) => i.id),
    ["s2", "s1", "t1"],
    "Thứ tự ID trang 2 phải khớp 3 sản phẩm tiếp theo"
  );
});

it("Luồng Catalog: Lọc đồ Tech có đánh giá >= 4.8 -> Sắp xếp đánh giá cao nhất -> Phân trang", () => {
  const filtered = filterProducts(SAMPLE_PRODUCTS, { category: "tech", minRating: 4.8 });
  assert.strictEqual(filtered.length, 3, "Có 3 sản phẩm tech rating >= 4.8");

  const sorted = sortProducts(filtered, "rating-desc");
  assert.strictEqual(sorted[0].rating, 5.0, "Sản phẩm đầu là iPhone 16 Pro Max 5.0 sao");

  const paginated = paginate(sorted, 1, 2);
  assert.strictEqual(paginated.totalPages, 2);
  assert.strictEqual(paginated.items.length, 2);
  assert.strictEqual(paginated.items[0].id, "t4");
});

// ---------------------------------------------------------------------------
console.log("\n--- PHẦN 7: Kiểm thử startCountdown (Bất đồng bộ) ---");

it("startCountdown xử lý thời gian đã hết ngay khi khởi tạo (endsAt <= 0)", () => {
  let endCalled = 0;
  const mockEl = { textContent: "" };
  const ctrl = startCountdown(-5, mockEl, () => {
    endCalled++;
  });

  assert.strictEqual(endCalled, 1, "onEnd phải được gọi đúng 1 lần khi thời gian đã hết");
  assert.strictEqual(mockEl.textContent, "00:00:00", "Phải hiển thị thời gian bằng 0");
  assert.strictEqual(ctrl.getRemaining(), 0);
  assert.strictEqual(ctrl.intervalId, null, "Không được tạo interval thừa");
});

it("startCountdown tự động dừng interval cũ khi khởi tạo countdown mới trên cùng element", () => {
  const mockEl = { textContent: "" };
  const ctrl1 = startCountdown(10, mockEl);
  const oldIntervalId = ctrl1.intervalId;
  assert(oldIntervalId !== null);

  const ctrl2 = startCountdown(5, mockEl);
  // ctrl1 phải bị dừng
  assert.strictEqual(ctrl1.intervalId, null, "Interval cũ phải được dừng");
  ctrl2.stop();
});

total++;
(function testCountdownSequence() {
  const mockEl = { textContent: "" };
  const sequence = [];
  let endCalled = 0;

  // Bắt đầu đếm ngược 10 giây
  const ctrl = startCountdown(10, mockEl, () => {
    endCalled++;
  });

  // 1. Khi khởi tạo: phải hiển thị 00:00:10 (số 10)
  sequence.push(mockEl.textContent);

  // 2. Sau ~1 giây: phải hiển thị 00:00:09 (số 9)
  setTimeout(() => {
    sequence.push(mockEl.textContent);
  }, 1050);

  // 3. Sau ~2 giây: phải hiển thị 00:00:08 (số 8)
  setTimeout(() => {
    sequence.push(mockEl.textContent);

    try {
      assert.strictEqual(sequence[0], "00:00:10", "Thời điểm khởi tạo t=0 phải là 00:00:10");
      assert.strictEqual(sequence[1], "00:00:09", "Thời điểm t=1s phải là 00:00:09 (không được nhảy qua)");
      assert.strictEqual(sequence[2], "00:00:08", "Thời điểm t=2s phải là 00:00:08");
      console.log(`  \x1b[32m✔ PASS:\x1b[0m Countdown 10 giây hiển thị lần lượt ${sequence.join(" → ")}`);
      passed++;
    } catch (err) {
      console.error(`  \x1b[31m✘ FAIL:\x1b[0m Countdown sequence test: ${err.message}`);
    }

    // Dừng controller 10s này để dọn dẹp
    ctrl.stop();

    // Tiếp tục kiểm tra kết thúc ở 0 và onEnd chạy 1 lần
    testCountdownEnd();
  }, 2100);

  function testCountdownEnd() {
    total++;
    let endCount = 0;
    const endMockEl = { textContent: "" };

    const endCtrl = startCountdown(1, endMockEl, () => {
      endCount++;
    });

    setTimeout(() => {
      try {
        assert.strictEqual(endCount, 1, "onEnd callback phải được gọi đúng 1 lần");
        assert.strictEqual(endMockEl.textContent, "00:00:00", "Thời gian kết thúc phải là 00:00:00");
        assert.strictEqual(endCtrl.intervalId, null, "intervalId phải được dọn dẹp null khi kết thúc");
        console.log("  \x1b[32m✔ PASS:\x1b[0m Countdown kết thúc chính xác ở 0 và onEnd chỉ chạy một lần duy nhất");
        passed++;
      } catch (err) {
        console.error(`  \x1b[31m✘ FAIL:\x1b[0m Countdown end test: ${err.message}`);
      }
      finish();
    }, 1250);
  }
})();

function finish() {
  console.log("\n==================================================");
  console.log(`TỔNG KẾT: ${passed}/${total} TESTS ĐẠT (PASS)`);
  console.log("==================================================\n");
  if (passed !== total) {
    process.exit(1);
  }
}
