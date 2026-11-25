/**
 * catalog.js — Quản lý toàn bộ tính năng Lọc, Sắp xếp, Phân trang và Đếm ngược của Catalog
 * Sử dụng trực tiếp bộ hàm tiện ích utils.js trên dữ liệu PRODUCTS từ mock_data.js
 */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Kiểm tra phụ thuộc bắt buộc
  if (typeof Utils === "undefined") {
    console.error("[catalog.js] Thiếu thư viện js/utils.js");
    return;
  }
  if (typeof PRODUCTS === "undefined") {
    console.error("[catalog.js] Thiếu dữ liệu PRODUCTS từ js/mock_data.js");
    return;
  }

  /* ---------------- TRẠNG THÁI CATALOG ---------------- */
  const urlParams = new URLSearchParams(window.location.search);
  const rawCat = (urlParams.get("cat") || urlParams.get("category") || "all").toLowerCase();
  const catAliases = {
    "all": "all",
    "fashion": "fashion",
    "thoi-trang": "fashion",
    "apparel": "fashion",
    "sneakers": "sneakers",
    "giay": "sneakers",
    "giay-dep": "sneakers",
    "shoes": "sneakers",
    "tech": "tech",
    "dien-thoai": "tech",
    "laptop": "tech",
    "electronics": "tech",
    "appliances": "appliances",
    "gia-dung": "appliances",
    "home": "appliances",
    "audio": "audio",
    "am-thanh": "audio",
    "tai-nghe": "audio",
    "gaming": "gaming",
    "ban-phim": "gaming",
    "chuot": "gaming",
    "watches": "watches",
    "dong-ho": "watches",
    "phu-kien": "watches",
    "camera": "camera",
    "may-anh": "camera",
  };
  const initialCategory = catAliases[rawCat] || rawCat;
  const initialKeyword = urlParams.get("q") || "";
  const initialType = urlParams.get("type") || "all";

  const state = {
    filters: {
      keyword: initialKeyword,
      category: initialCategory,
      type: initialType,
      minPrice: null,
      maxPrice: null,
      minRating: null,
      minCond: null,
    },
    sortKey: "default",
    page: 1,
    pageSize: typeof window !== "undefined" && window.innerWidth <= 768 ? 6 : 18, // 6 sản phẩm chuẩn di động (3 hàng x 2 cột), 18 sản phẩm trên desktop
  };

  /* ---------------- THAM CHIẾU DOM ---------------- */
  const dom = {
    grid: $("#catalogGrid"),
    countText: $("#catalogCountText"),
    activeFilters: $("#activeFilters"),
    clearAllBtn: $("#clearAllFiltersBtn"),
    mobileToggleBtn: $("#mobileFilterToggleBtn"),
    mobileFilterCount: $("#mobileFilterCount"),
    mobileFilterBtnText: $("#mobileFilterBtnText"),
    mobileToolbarCount: $("#mobileToolbarCountText"),
    viewModeGrid: $("#viewModeGrid"),
    viewModeCompact: $("#viewModeCompact"),
    subnavLinks: $$("#catalogSubnav a"),
    paginationBar: $("#paginationBar"),
    sortSelect: $("#sortSelect"),
    pageSizeSelect: $("#pageSizeSelect"),
    resetBtn: $("#resetFilterBtn"),
    // Filter inputs
    keywordInput: $("#filterKeyword"),
    minPriceInput: $("#filterMinPrice"),
    maxPriceInput: $("#filterMaxPrice"),
    applyPriceBtn: $("#applyPriceBtn"),
    quickPriceBtns: $$(".price-tag"),
    categoryRadios: $$("input[name='filterCategory']"),
    typeRadios: $$("input[name='filterType']"),
    ratingRadios: $$("input[name='filterRating']"),
    condRadios: $$("input[name='filterCond']"),
    // Flash sale countdown
    sidebarCountdown: $("#sidebarCountdown"),
    // Header cart
    cartCount: $("#cartCount"),
    headerSearch: $("#headerSearchInput"),
    avatarBtn: $("#avatarBtn"),
  };

  /* ---------------- QUẢN LÝ TÀI KHOẢN & AVATAR ---------------- */
  function setupAvatar() {
    const avatarBtn = dom.avatarBtn;
    if (!avatarBtn) return;
    const user = typeof Auth !== "undefined" ? Auth.current() : null;
    if (user) {
      const initials = (user.fullName || "User")
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      avatarBtn.textContent = initials;
      avatarBtn.title = user.fullName;
    }

    const btnHeaderPost = $("#btnHeaderPost");
    if (btnHeaderPost) {
      btnHeaderPost.addEventListener("click", (e) => {
        if (!Auth.current()) {
          e.preventDefault();
          Auth.ensureLogin(() => {
            window.location.href = "../seller/post_item.html";
          }, {
            title: "Đăng Bán Đồ Cũ",
            message: "Vui lòng đăng nhập tài khoản người bán để đăng tin bán đồ cũ.",
            returnUrl: "../seller/post_item.html"
          });
        }
      });
    }
  }

  /* ---------------- GIỎ HÀNG ---------------- */
  function syncCartBadge() {
    if (typeof Utils !== "undefined" && Utils.Cart) {
      Utils.Cart.syncBadge("#cartCount");
    } else {
      try {
        const n = parseInt(localStorage.getItem("hv_cart_count"), 10) || 0;
        if (dom.cartCount) {
          dom.cartCount.textContent = n;
          dom.cartCount.classList.toggle("hidden", n === 0);
        }
      } catch (e) {}
    }
  }
  syncCartBadge();

  /* ---------------- TIỆN ÍCH TẠO THẺ SẢN PHẨM ---------------- */
  function createProductCardHTML(p) {
    if (typeof Components !== "undefined" && typeof Components.renderProductCard === "function") {
      return Components.renderProductCard(p);
    }
    const isMall = p.type === "mall";
    const title = p.short || p.name;
    const formattedPrice = Utils.formatCurrency(p.price);
    const formattedOldPrice = p.oldPrice ? Utils.formatCurrency(p.oldPrice) : "";
    const starsHtml = Utils.renderStars(p.rating || 4.5, { html: true });
    const starsText = Utils.renderStars(p.rating || 4.5);

    if (isMall) {
      return (
        '<article class="product-card" data-id="' +
        p.id +
        '">' +
        '<div class="product-media">' +
        '<a href="product_new.html?id=' + p.id + '">' +
        '<img src="' +
        (window.resolveAssetUrl ? window.resolveAssetUrl(p.img) : p.img) +
        '" alt="' +
        title +
        '" loading="lazy">' +
        '</a>' +
        '<div class="product-tags">' +
        '<span class="badge badge-solid">' +
        p.badge +
        "</span>" +
        (p.off ? '<span class="badge badge-success">-' + p.off + "%</span>" : "") +
        "</div>" +
        (p.tag ? '<span class="media-tag">' + p.tag + "</span>" : "") +
        "</div>" +
        '<div class="product-body">' +
        '<span class="product-cat text-primary">' +
        (p.sub || "CHÍNH HÃNG MALL") +
        "</span>" +
        '<h3 class="product-name line-clamp-2" title="' +
        p.name +
        '">' +
        '<a href="product_new.html?id=' + p.id + '" class="text-hover-primary">' +
        p.name +
        '</a>' +
        "</h3>" +
        '<div class="stars-container">' +
        starsHtml +
        "</div>" +
        '<div class="product-price mt-2">' +
        '<span class="price">' +
        formattedPrice +
        "</span>" +
        (formattedOldPrice ? '<span class="price-old">' + formattedOldPrice + "</span>" : "") +
        "</div>" +
        "</div>" +
        '<div class="product-actions">' +
        '<button class="btn btn-outlined btn-sm" type="button" data-action="add-cart" data-id="' +
        p.id +
        '" title="Thêm vào giỏ hàng"><span class="material-symbols-outlined icon-sm">add_shopping_cart</span> Thêm Vào Giỏ</button>' +
        '<button class="btn btn-primary btn-sm" type="button" data-action="buy" data-id="' +
        p.id +
        '"><span class="material-symbols-outlined icon-sm">bolt</span> Mua Ngay</button>' +
        "</div>" +
        "</article>"
      );
    }

    // Hàng C2C Đồ cũ / đã qua sử dụng
    const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const savedAmount = p.oldPrice ? p.oldPrice - p.price : 0;
    const badgeCls = p.limited ? "badge badge-limited" : "badge badge-solid-secondary";
    return (
      '<article class="product-card" data-id="' +
      p.id +
      '">' +
      '<div class="product-media">' +
      '<a href="product_used.html?id=' + p.id + '">' +
      '<img src="' +
      (window.resolveAssetUrl ? window.resolveAssetUrl(p.img) : p.img) +
      '" alt="' +
      title +
      '" loading="lazy">' +
      '</a>' +
      '<div class="product-tags">' +
      '<span class="' +
      badgeCls +
      '">' +
      (p.badge || "ĐỒ CŨ LIKE NEW") +
      "</span>" +
      (discount > 0 ? '<span class="badge badge-success">Rẻ hơn đồ mới ' + discount + '%</span>' : '') +
      '<span class="badge badge-secondary">' +
      (p.condText || p.cond + "% Mới") +
      "</span>" +
      "</div>" +
      (p.tag ? '<span class="media-tag">' + p.tag + "</span>" : "") +
      "</div>" +
      '<div class="product-body">' +
      '<div class="cond">' +
      '<div class="progress-label"><span>' +
      (p.condPrefix || "Độ mới") +
      ": <strong>" +
      (p.condLabel || p.cond + "%") +
      "</strong></span>" +
      '<strong class="text-secondary">' +
      p.cond +
      "%</strong></div>" +
      '<div class="progress progress-secondary" style="--value:' +
      p.cond +
      '%"><div class="progress-bar"></div></div>' +
      "</div>" +
      '<div class="product-meta mt-1">' +
      '<span class="material-symbols-outlined icon-sm text-secondary">verified</span>' +
      '<span class="truncate">' +
      (p.seller || p.sellerName || "Người bán uy tín") +
      "</span>" +
      "</div>" +
      '<h3 class="product-name line-clamp-2" title="' +
      p.name +
      '">' +
      '<a href="product_used.html?id=' + p.id + '" class="text-hover-primary">' +
      p.name +
      '</a>' +
      "</h3>" +
      '<div class="product-price mt-2">' +
      '<span class="price">' +
      formattedPrice +
      "</span>" +
      (formattedOldPrice ? '<span class="price-old" title="Giá hàng mới 100%">Giá mới: ' + formattedOldPrice + '</span>' : '') +
      "</div>" +
      (discount > 0 ? '<div class="text-xs text-success fw-600 mt-1">Tiết kiệm ' + discount + '% (' + Utils.formatCurrency(savedAmount) + ') so với mua mới</div>' : '') +
      "</div>" +
      '<div class="product-actions c2c-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">' +
      '<button class="btn btn-outlined btn-sm" type="button" data-action="add-cart" data-id="' +
      p.id +
      '" title="Thêm vào giỏ hàng"><span class="material-symbols-outlined icon-sm">add_shopping_cart</span> Thêm Vào Giỏ</button>' +
      '<button class="btn btn-primary btn-sm" type="button" data-action="buy" data-id="' +
      p.id +
      '"><span class="material-symbols-outlined icon-sm">bolt</span> Mua Ngay</button>' +
      '<button class="btn btn-secondary btn-sm btn-offer-c2c" type="button" data-action="offer" data-id="' +
      p.id +
      '" style="grid-column: 1 / -1; width: 100%;" title="Thương lượng đề xuất giá khác với người bán"><span class="material-symbols-outlined icon-sm">price_change</span> Thương Lượng Trả Giá</button>' +
      "</div>" +
      "</article>"
    );
  }

  /* ---------------- RENDER ACTIVE FILTER CHIPS ---------------- */
  function renderActiveFilterChips() {
    if (!dom.activeFilters) return;
    const chips = [];

    if (state.filters.keyword) {
      chips.push({
        label: 'Từ khóa: "' + state.filters.keyword + '"',
        clear: () => {
          state.filters.keyword = "";
          if (dom.keywordInput) dom.keywordInput.value = "";
          if (dom.headerSearch) dom.headerSearch.value = "";
          render();
        },
      });
    }

    if (state.filters.category && state.filters.category !== "all") {
      const catNames = {
        fashion: "Thời Trang",
        sneakers: "Sneakers",
        tech: "Đồ Điện Tử",
        appliances: "Gia Dụng",
        audio: "Âm Thanh",
        gaming: "Gaming Gear",
        watches: "Đồng Hồ",
        camera: "Máy Ảnh",
      };
      chips.push({
        label: "Ngành: " + (catNames[state.filters.category] || state.filters.category),
        clear: () => {
          state.filters.category = "all";
          syncFilterInputs();
          render();
        },
      });
    }

    if (state.filters.type && state.filters.type !== "all") {
      chips.push({
        label: "Loại: " + (state.filters.type === "mall" ? "Hàng Mới 100%" : "Đồ Cũ / Like New"),
        clear: () => {
          state.filters.type = "all";
          syncFilterInputs();
          render();
        },
      });
    }

    if (state.filters.minPrice != null || state.filters.maxPrice != null) {
      let priceLabel = "Giá: ";
      if (state.filters.minPrice && state.filters.maxPrice) {
        priceLabel += Utils.formatCurrency(state.filters.minPrice) + " - " + Utils.formatCurrency(state.filters.maxPrice);
      } else if (state.filters.minPrice) {
        priceLabel += "≥ " + Utils.formatCurrency(state.filters.minPrice);
      } else {
        priceLabel += "≤ " + Utils.formatCurrency(state.filters.maxPrice);
      }
      chips.push({
        label: priceLabel,
        clear: () => {
          state.filters.minPrice = null;
          state.filters.maxPrice = null;
          if (dom.minPriceInput) dom.minPriceInput.value = "";
          if (dom.maxPriceInput) dom.maxPriceInput.value = "";
          dom.quickPriceBtns.forEach((b) => b.classList.remove("active"));
          render();
        },
      });
    }

    if (state.filters.minRating != null) {
      chips.push({
        label: "Đánh giá ≥ " + state.filters.minRating + "★",
        clear: () => {
          state.filters.minRating = null;
          syncFilterInputs();
          render();
        },
      });
    }

    if (state.filters.minCond != null) {
      chips.push({
        label: "Độ mới ≥ " + state.filters.minCond + "%",
        clear: () => {
          state.filters.minCond = null;
          syncFilterInputs();
          render();
        },
      });
    }

    dom.activeFilters.innerHTML = chips
      .map(
        (c, idx) =>
          '<span class="active-filter-chip">' +
          c.label +
          '<button type="button" data-chip-idx="' +
          idx +
          '" title="Xóa điều kiện">&times;</button>' +
          "</span>"
      )
      .join("");

    $$("#activeFilters button[data-chip-idx]").forEach((btn) => {
      const idx = Number(btn.dataset.chipIdx);
      btn.addEventListener("click", () => chips[idx].clear());
    });

    if (dom.clearAllBtn) {
      dom.clearAllBtn.classList.toggle("hidden", chips.length === 0);
    }
    if (dom.mobileFilterCount) {
      dom.mobileFilterCount.textContent = chips.length;
    }
  }

  /* ---------------- RENDER THANH PHÂN TRANG ---------------- */
  function renderPagination(paginated) {
    if (!dom.paginationBar) return;

    if (paginated.total === 0) {
      dom.paginationBar.innerHTML = "";
      return;
    }

    const { page, totalPages, total, size, items } = paginated;
    const startItem = (page - 1) * size + 1;
    const endItem = startItem + items.length - 1;

    let buttonsHtml = "";

    // Nút Trước
    buttonsHtml +=
      '<button type="button" class="page-btn" data-page="' +
      (page - 1) +
      '"' +
      (page <= 1 ? " disabled" : "") +
      '><span class="material-symbols-outlined icon-sm">chevron_left</span></button>';

    // Các nút số trang
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= page - 1 && p <= page + 1)
      ) {
        buttonsHtml +=
          '<button type="button" class="page-btn' +
          (p === page ? " active" : "") +
          '" data-page="' +
          p +
          '">' +
          p +
          "</button>";
      } else if (
        (p === page - 2 && page > 3) ||
        (p === page + 2 && page < totalPages - 2)
      ) {
        buttonsHtml += '<span class="page-btn" style="border:none;background:none;pointer-events:none;">...</span>';
      }
    }

    // Nút Sau
    buttonsHtml +=
      '<button type="button" class="page-btn" data-page="' +
      (page + 1) +
      '"' +
      (page >= totalPages ? " disabled" : "") +
      '><span class="material-symbols-outlined icon-sm">chevron_right</span></button>';

    dom.paginationBar.innerHTML =
      '<div class="pagination-info">' +
      "Hiển thị <strong>" +
      startItem +
      " - " +
      endItem +
      "</strong> trong <strong>" +
      total +
      "</strong> sản phẩm" +
      "</div>" +
      '<div class="pagination">' +
      buttonsHtml +
      "</div>";

    // Gắn sự kiện click đổi trang
    $$("button[data-page]", dom.paginationBar).forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetPage = Number(btn.dataset.page);
        if (targetPage >= 1 && targetPage <= totalPages && targetPage !== page) {
          state.page = targetPage;
          render();
          const targetEl = $("#catalogMainTop");
          if (targetEl) targetEl.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  /* ---------------- HÀM RENDER CHÍNH (LỌC, SẮP XẾP, PHÂN TRANG) ---------------- */
  function render() {
    try {
      // BƯỚC 1: LỌC ĐA ĐIỀU KIỆN bằng filterProducts
    const filtered = Utils.filterProducts(PRODUCTS, state.filters);

    // BƯỚC 2: SẮP XẾP bằng sortProducts
    const sorted = Utils.sortProducts(filtered, state.sortKey);

    // BƯỚC 3: PHÂN TRANG bằng paginate
    const paginated = Utils.paginate(sorted, state.page, state.pageSize);
    state.page = paginated.page; // đồng bộ lại nếu page bị clamp

    // BƯỚC 4: RENDER DANH SÁCH SẢN PHẨM
    if (dom.grid) {
      if (paginated.items.length === 0) {
        dom.grid.innerHTML =
          '<div class="empty-state">' +
          '<div class="empty-state-icon"><span class="material-symbols-outlined">inventory_2</span></div>' +
          '<h3 class="empty-state-title">Không tìm thấy sản phẩm nào</h3>' +
          '<p class="empty-state-desc">Hãy thử thay đổi khoảng giá, xóa từ khóa tìm kiếm hoặc chọn danh mục khác.</p>' +
          '<button type="button" class="btn btn-primary btn-sm mt-3" id="emptyResetBtn">' +
          '<span class="material-symbols-outlined icon-sm">restart_alt</span> Xóa Toàn Bộ Bộ Lọc' +
          "</button>" +
          "</div>";
        const emptyBtn = $("#emptyResetBtn");
        if (emptyBtn) emptyBtn.addEventListener("click", resetAllFilters);
      } else {
        dom.grid.innerHTML = paginated.items.map(createProductCardHTML).join("");
      }
    }

    // BƯỚC 5: CẬP NHẬT SỐ LƯỢNG KẾT QUẢ
    if (dom.countText) {
      dom.countText.innerHTML =
        "Tìm thấy <strong>" +
        paginated.total +
        "</strong> sản phẩm" +
        (paginated.totalPages > 1
          ? " (Trang " + paginated.page + "/" + paginated.totalPages + ")"
          : "");
    }
    if (dom.mobileToolbarCount) {
      dom.mobileToolbarCount.textContent = paginated.total + " sản phẩm";
    }
    // Cập nhật trạng thái active trên subnav
    if (dom.subnavLinks && dom.subnavLinks.length) {
      dom.subnavLinks.forEach((link) => {
        link.classList.toggle("active", link.dataset.cat === state.filters.category);
      });
    }

    // BƯỚC 6: RENDER CHIPS VÀ THANH PHÂN TRANG
    renderActiveFilterChips();
    renderPagination(paginated);
    } catch (err) {
      console.error("[CATALOG RENDER ERROR]", err);
      if (dom.countText) {
        dom.countText.textContent = "Có lỗi xảy ra khi tải sản phẩm.";
      }
    }
  }

  /* ---------------- ĐỒNG BỘ INPUT VỚI STATE ---------------- */
  function syncFilterInputs() {
    if (dom.keywordInput) dom.keywordInput.value = state.filters.keyword || "";
    if (dom.headerSearch) dom.headerSearch.value = state.filters.keyword || "";

    dom.categoryRadios.forEach((r) => {
      r.checked = r.value === state.filters.category;
    });

    dom.typeRadios.forEach((r) => {
      r.checked = r.value === state.filters.type;
    });

    dom.ratingRadios.forEach((r) => {
      if (state.filters.minRating == null) {
        r.checked = r.value === "all";
      } else {
        r.checked = String(r.value) === String(state.filters.minRating);
      }
    });

    dom.condRadios.forEach((r) => {
      if (state.filters.minCond == null) {
        r.checked = r.value === "all";
      } else {
        r.checked = String(r.value) === String(state.filters.minCond);
      }
    });

    if (dom.minPriceInput)
      dom.minPriceInput.value = state.filters.minPrice != null ? state.filters.minPrice : "";
    if (dom.maxPriceInput)
      dom.maxPriceInput.value = state.filters.maxPrice != null ? state.filters.maxPrice : "";
    if (dom.pageSizeSelect) {
      dom.pageSizeSelect.value = String(state.pageSize);
    }
  }

  function resetAllFilters() {
    state.filters = {
      keyword: "",
      category: "all",
      type: "all",
      minPrice: null,
      maxPrice: null,
      minRating: null,
      minCond: null,
    };
    state.page = 1;
    dom.quickPriceBtns.forEach((b) => b.classList.remove("active"));
    syncFilterInputs();
    render();
    Utils.toast("Đã đặt lại toàn bộ bộ lọc về mặc định", "info");
  }

  /* ---------------- KHỞI TẠO VÀ CHUYỂN ĐỔI CHUYÊN TRANG ĐỒ MỚI VS ĐỒ CŨ ---------------- */
  function initTypeTabCounts() {
    const all = PRODUCTS.length;
    const mall = PRODUCTS.filter((p) => p.type === "mall").length;
    const c2c = PRODUCTS.filter((p) => p.type === "c2c").length;
    const tabAll = $("#tabCountAll");
    if (tabAll) tabAll.textContent = all;
    const tabMall = $("#tabCountMall");
    if (tabMall) tabMall.textContent = mall;
    const tabC2c = $("#tabCountC2c");
    if (tabC2c) tabC2c.textContent = c2c;
  }

  function renderSubnav(type) {
    const subnav = $("#catalogSubnav");
    if (!subnav) return;
    const list = type === "mall"
      ? (typeof CATEGORIES_MALL !== "undefined" ? CATEGORIES_MALL : CATEGORIES)
      : (type === "c2c" ? (typeof CATEGORIES_C2C !== "undefined" ? CATEGORIES_C2C : CATEGORIES) : CATEGORIES);
    const allLabel = type === "mall" ? "Tất Cả Hàng Mới" : (type === "c2c" ? "Tất Cả Đồ Cũ" : "Tất Cả Ngành Hàng");

    subnav.innerHTML =
      '<a href="catalog.html?type=' + type + '" class="' + (state.filters.category === "all" ? "active" : "") + '" data-cat="all">' +
      '<span class="status-dot"></span>' + allLabel +
      '</a>' +
      list.map((c) =>
        '<a href="catalog.html?type=' + type + '&cat=' + c.id + '" class="' + (state.filters.category === c.id ? "active" : "") + '" data-cat="' + c.id + '">' +
        '<span class="material-symbols-outlined icon-sm text-' + c.tone + '">' + c.icon + '</span>' + (c.chip || c.tile || c.title) +
        '</a>'
      ).join("");

    // Gắn sự kiện click cho các link subnav vừa tạo
    $$("#catalogSubnav a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const cat = a.dataset.cat || "all";
        state.filters.category = cat;
        state.page = 1;
        syncFilterInputs();
        render();
        $$("#catalogSubnav a").forEach((l) => l.classList.toggle("active", l === a));
        try {
          const url = new URL(window.location.href);
          if (cat === "all") {
            url.searchParams.delete("cat");
          } else {
            url.searchParams.set("cat", cat);
          }
          window.history.pushState({ cat }, "", url.toString());
        } catch (err) {}
      });
    });
  }

  function renderSidebarCategories(type) {
    const container = $("#filterCategoryOptions");
    if (!container) return;
    const list = type === "mall"
      ? (typeof CATEGORIES_MALL !== "undefined" ? CATEGORIES_MALL : CATEGORIES)
      : (type === "c2c" ? (typeof CATEGORIES_C2C !== "undefined" ? CATEGORIES_C2C : CATEGORIES) : CATEGORIES);

    const totalCount = type === "mall"
      ? PRODUCTS.filter((p) => p.type === "mall").length
      : (type === "c2c" ? PRODUCTS.filter((p) => p.type === "c2c").length : PRODUCTS.length);

    const labelEl = $("#filterCategoryLabel");
    if (labelEl) {
      labelEl.textContent = type === "mall"
        ? "Ngành Hàng Đồ Mới (Brand Mall)"
        : (type === "c2c" ? "Ngành Hàng Đồ Cũ (Like New)" : "Ngành Hàng");
    }

    container.innerHTML =
      '<label class="filter-radio-item">' +
      '<input type="radio" name="filterCategory" value="all" ' + (state.filters.category === "all" ? "checked" : "") + ' />' +
      '<span>Tất Cả Ngành Hàng</span>' +
      '<span class="filter-item-count">' + totalCount + '</span>' +
      '</label>' +
      list.map((c) => {
        const count = PRODUCTS.filter((p) => {
          const matchCat = p.category === c.id;
          const matchType = type === "all" ? true : p.type === type;
          return matchCat && matchType;
        }).length;
        return (
          '<label class="filter-radio-item">' +
          '<input type="radio" name="filterCategory" value="' + c.id + '" ' + (state.filters.category === c.id ? "checked" : "") + ' />' +
          '<span>' + (c.chip || c.tile || c.title) + '</span>' +
          '<span class="filter-item-count">' + count + '</span>' +
          '</label>'
        );
      }).join("");

    // Cập nhật lại dom.categoryRadios và sự kiện
    dom.categoryRadios = $$("input[name='filterCategory']", container);
    dom.categoryRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          state.filters.category = e.target.value;
          state.page = 1;
          render();
          $$("#catalogSubnav a").forEach((a) => {
            a.classList.toggle("active", a.dataset.cat === state.filters.category);
          });
          try {
            const url = new URL(window.location.href);
            if (state.filters.category === "all") {
              url.searchParams.delete("cat");
            } else {
              url.searchParams.set("cat", state.filters.category);
            }
            window.history.pushState({ cat: state.filters.category }, "", url.toString());
          } catch (err) {}
        }
      });
    });
  }

  function updateHeroSpotlight(type) {
    const titleEl = $(".catalog-hero-title");
    const descEl = $(".catalog-hero-desc");
    if (!titleEl || !descEl) return;
    if (type === "mall") {
      titleEl.innerHTML = "Sàn Hàng Mới 100% Chính Hãng (Brand Mall)";
      descEl.innerHTML = "Trung tâm phân phối chính thức từ các thương hiệu hàng đầu: <strong>100% nguyên seal nguyên hộp FPT/VNA</strong>, bảo hành chính hãng 12 - 24 tháng, đổi trả 7 ngày miễn phí và đồng kiểm mở hộp cùng shipper.";
    } else if (type === "c2c") {
      titleEl.innerHTML = "Chợ Đồ Cũ & Pass Đồ Like New Thẩm Định Kỹ Thuật";
      descEl.innerHTML = "Thị trường đồ cũ tuyển chọn 95% - 99%: <strong>Đã kiểm định vi mạch, pin thực tế và chiếu đèn UV tem giày</strong>. Tiết kiệm từ 30% đến 50% so với mua mới, hỗ trợ trả giá trực tiếp với người bán đã eKYC.";
    } else {
      titleEl.innerHTML = "Siêu Thị Công Nghệ & Thời Trang Tuyển Chọn";
      descEl.innerHTML = "Trải nghiệm mua sắm thông minh: <strong>100% Brand Mall chính hãng nguyên seal</strong> song hành cùng <strong>Chợ Đồ Cũ Like New kiểm định kỹ thuật 15 bước</strong>. Kiểm tra mở hộp cùng shipper trước khi trả tiền, hoàn tiền 100% tức thì qua Napas 24/7.";
    }
  }

  function applyType(newType, updateUrl) {
    state.filters.type = newType;
    state.page = 1;

    // 1. Cập nhật nút tabs
    $$("#catalogTypeTabs .type-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === newType);
    });

    // 2. Cập nhật radio sidebar
    dom.typeRadios.forEach((r) => {
      r.checked = r.value === newType;
    });

    // 3. Cập nhật subnav & sidebar categories tương ứng
    renderSubnav(newType);
    renderSidebarCategories(newType);

    // 4. Ẩn/Hiện nhóm lọc độ mới (Mall không cần lọc độ mới)
    const condGroup = $("#condFilterGroup");
    if (condGroup) {
      condGroup.style.display = newType === "mall" ? "none" : "";
    }

    // 5. Cập nhật Tiêu đề Spotlight Hero
    updateHeroSpotlight(newType);

    // 6. Cập nhật Breadcrumb
    const breadcrumbCurrent = document.querySelector(".catalog-breadcrumb span:last-child");
    if (breadcrumbCurrent) {
      if (newType === "mall") {
        breadcrumbCurrent.textContent = "Sàn Đồ Mới 100% (Brand Mall)";
      } else if (newType === "c2c") {
        breadcrumbCurrent.textContent = "Chợ Đồ Cũ & Pass Đồ Like New (C2C)";
      } else {
        breadcrumbCurrent.textContent = "Khám Phá Danh Mục Sản Phẩm";
      }
    }

    // 7. Cập nhật URL
    if (updateUrl) {
      try {
        const url = new URL(window.location.href);
        if (newType === "all") {
          url.searchParams.delete("type");
        } else {
          url.searchParams.set("type", newType);
        }
        window.history.replaceState({ type: newType }, "", url.toString());
      } catch (err) {}
    }

    render();
  }

  /* ---------------- GẮN CÁC SỰ KIỆN LỌC & SẮP XẾP ---------------- */
  function setupFilterEvents() {
    // 1. Tìm kiếm theo từ khóa
    let searchDebounce = null;
    function handleSearch(val) {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.filters.keyword = val.trim();
        state.page = 1;
        render();
      }, 250);
    }

    if (dom.keywordInput) {
      dom.keywordInput.addEventListener("input", (e) => handleSearch(e.target.value));
    }
    if (dom.headerSearch) {
      dom.headerSearch.addEventListener("input", (e) => {
        if (dom.keywordInput) dom.keywordInput.value = e.target.value;
        handleSearch(e.target.value);
      });
    }

    // 2. Ngành hàng (Category)
    dom.categoryRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          state.filters.category = e.target.value;
          state.page = 1;
          render();
          try {
            const url = new URL(window.location.href);
            if (state.filters.category === "all") {
              url.searchParams.delete("cat");
            } else {
              url.searchParams.set("cat", state.filters.category);
            }
            window.history.pushState({ cat: state.filters.category }, "", url.toString());
          } catch (err) {}
        }
      });
    });

    // 2b. Điều hướng subnav ngành hàng (Chuyển mượt mà không load lại trang)
    if (dom.subnavLinks && dom.subnavLinks.length) {
      dom.subnavLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const cat = link.dataset.cat || "all";
          state.filters.category = cat;
          state.page = 1;
          syncFilterInputs();
          render();
          try {
            const url = new URL(window.location.href);
            if (cat === "all") {
              url.searchParams.delete("cat");
            } else {
              url.searchParams.set("cat", cat);
            }
            window.history.pushState({ cat }, "", url.toString());
          } catch (err) {}
        });
      });
    }

    // Lắng nghe nút Back / Forward trên trình duyệt
    window.addEventListener("popstate", () => {
      try {
        const params = new URLSearchParams(window.location.search);
        state.filters.category = params.get("cat") || "all";
        state.filters.keyword = params.get("q") || "";
        const newType = params.get("type") || "all";
        applyType(newType, false);
      } catch (err) {}
    });

    // 3. Loại hàng (Type: Mall / C2C / All)
    dom.typeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          applyType(e.target.value, true);
        }
      });
    });

    // 3b. Tab chuyển đổi Sàn Đồ Mới vs Chợ Đồ Cũ (Grand Type Tabs)
    $$("#catalogTypeTabs .type-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type || "all";
        applyType(type, true);
      });
    });

    // 4. Khoảng giá nhập tay
    if (dom.applyPriceBtn) {
      dom.applyPriceBtn.addEventListener("click", () => {
        const min = dom.minPriceInput.value ? Number(dom.minPriceInput.value) : null;
        const max = dom.maxPriceInput.value ? Number(dom.maxPriceInput.value) : null;
        if (min != null && max != null && min > max) {
          Utils.toast("Giá tối thiểu không được lớn hơn giá tối đa", "warning");
          return;
        }
        state.filters.minPrice = min;
        state.filters.maxPrice = max;
        state.page = 1;
        dom.quickPriceBtns.forEach((b) => b.classList.remove("active"));
        render();
      });
    }

    // 5. Nút giá nhanh (Dưới 5tr, 5-15tr, Trên 15tr)
    dom.quickPriceBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const isActive = btn.classList.contains("active");
        dom.quickPriceBtns.forEach((b) => b.classList.remove("active"));

        if (isActive) {
          state.filters.minPrice = null;
          state.filters.maxPrice = null;
          if (dom.minPriceInput) dom.minPriceInput.value = "";
          if (dom.maxPriceInput) dom.maxPriceInput.value = "";
        } else {
          btn.classList.add("active");
          const min = btn.dataset.min ? Number(btn.dataset.min) : null;
          const max = btn.dataset.max ? Number(btn.dataset.max) : null;
          state.filters.minPrice = min;
          state.filters.maxPrice = max;
          if (dom.minPriceInput) dom.minPriceInput.value = min != null ? min : "";
          if (dom.maxPriceInput) dom.maxPriceInput.value = max != null ? max : "";
        }
        state.page = 1;
        render();
      });
    });

    // 6. Đánh giá (Rating)
    dom.ratingRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          state.filters.minRating = e.target.value === "all" ? null : Number(e.target.value);
          state.page = 1;
          render();
        }
      });
    });

    // 7. Độ mới (Condition C2C)
    dom.condRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          state.filters.minCond = e.target.value === "all" ? null : Number(e.target.value);
          state.page = 1;
          render();
        }
      });
    });

    // 8. Đặt lại bộ lọc
    if (dom.resetBtn) {
      dom.resetBtn.addEventListener("click", resetAllFilters);
    }

    // 9. Sắp xếp (Sort)
    if (dom.sortSelect) {
      dom.sortSelect.addEventListener("change", (e) => {
        state.sortKey = e.target.value;
        state.page = 1;
        render();
      });
    }

    // 10. Số lượng hiển thị mỗi trang (Page Size)
    if (dom.pageSizeSelect) {
      dom.pageSizeSelect.addEventListener("change", (e) => {
        state.pageSize = Number(e.target.value) || (window.innerWidth <= 768 ? 6 : 18);
        state.page = 1;
        render();
      });
    }
  }

  /* ---------------- XỬ LÝ CLICK SỰ KIỆN TRÊN CARD ---------------- */
  let currentOfferProduct = null;
  function setupProductCardEvents() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const product = PRODUCTS.find((p) => p.id === id);
      if (!product) return;

      const title = product.short || product.name;

      if (action === "add-cart") {
        if (!Auth.ensureLogin((user) => {
          Utils.Cart.addItem(product, 1);
        }, {
          title: "Đăng Nhập Mua Hàng",
          message: 'Vui lòng đăng nhập tài khoản để thêm "' + title + '" vào giỏ hàng.',
        })) {
          return;
        }
      } else if (action === "buy") {
        if (!Auth.ensureLogin((user) => {
          Utils.Cart.addItem(product, 1);
          window.location.href = "cart.html";
        }, {
          title: "Đăng Nhập Mua Hàng",
          message: 'Vui lòng đăng nhập tài khoản để mua ngay "' + title + '".',
          returnUrl: "cart.html"
        })) {
          return;
        }
      } else if (action === "offer") {
        if (!Auth.ensureLogin((user) => {
          currentOfferProduct = product;
          const pTitle = $("#offerProduct");
          const pSeller = $("#offerSeller");
          const pCond = $("#offerCond");
          const pPrice = $("#offerCurrent");
          const pInput = $("#offerPrice");

          if (pTitle) pTitle.textContent = title;
          if (pSeller) pSeller.textContent = product.sellerName || product.seller || "-";
          if (pCond) pCond.textContent = (product.cond || 99) + "%";
          if (pPrice) pPrice.textContent = Utils.formatCurrency(product.price);
          if (pInput)
            pInput.value = Math.round(product.price * 0.95).toLocaleString("vi-VN");

          Utils.openModal("offerModal");
        }, {
          title: "Yêu Cầu Đăng Nhập",
          message: 'Vui lòng đăng nhập tài khoản để gửi đề nghị trả giá cho "' + title + '".',
        })) {
          return;
        }
      }
    });

    // Form trả giá
    const offerForm = $("#offerForm");
    if (offerForm) {
      offerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const priceInput = $("#offerPrice");
        const value = parseInt(String(priceInput.value || "").replace(/\D/g, ""), 10) || 0;
        if (value <= 0) {
          Utils.toast("Vui lòng nhập mức giá đề xuất hợp lệ!", "error");
          return;
        }

        Utils.closeModal("offerModal");
        Utils.toast(
          'Đã gửi đề xuất trả giá ' +
            Utils.formatCurrency(value) +
            ' cho "' +
            (currentOfferProduct ? currentOfferProduct.short || currentOfferProduct.name : "sản phẩm") +
            '"!',
          "success"
        );
      });
    }

    // Modal close buttons
    $$("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const backdrop = btn.closest(".modal-backdrop");
        if (backdrop) Utils.closeModal(backdrop);
      });
    });

    // Click backdrop to close
    $$(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) Utils.closeModal(backdrop);
      });
    });

    // Quick discount buttons in offer modal
    $$("[data-quick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!currentOfferProduct) return;
        const percent = Number(btn.dataset.quick);
        const newPrice = Math.round(currentOfferProduct.price * (1 + percent / 100));
        const input = $("#offerPrice");
        if (input) input.value = newPrice.toLocaleString("vi-VN");
      });
    });
  }

  /* ---------------- KHỞI TẠO ĐẾM NGƯỢC FLASH SALE 48 GIỜ ---------------- */
  function setupCountdown() {
    if (!dom.sidebarCountdown) return;
    // Đếm ngược 48 giờ ưu đãi flash sale
    const countdown48h = 48 * 3600;
    Utils.startCountdown(countdown48h, dom.sidebarCountdown, () => {
      dom.sidebarCountdown.innerHTML =
        '<span class="badge badge-success">Đợt ưu đãi mới đã bắt đầu</span>';
    });
  }

  /* ---------------- CUỘN NGANG KÉO THẢ CHO SUBNAV ---------------- */
  function enableHorizontalDrag(el) {
    if (!el) return;
    el.addEventListener("wheel", (e) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    el.addEventListener("mousedown", (e) => {
      isDown = true;
      hasDragged = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
      if (el) el.style.cursor = "default";
    });

    el.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) hasDragged = true;
      el.scrollLeft = scrollLeft - walk;
    });

    el.addEventListener("click", (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  /* ---------------- KHỞI CHẠY ---------------- */
  /* ---------------- TÍNH TOÁN DỮ LIỆU ĐẾM SỐ LƯỢNG CHO SIDEBAR ---------------- */
  function updateSidebarCounts() {
    const counts = {
      'cat-all': PRODUCTS.length,
      'cat-fashion': PRODUCTS.filter((p) => p.category === 'fashion').length,
      'cat-sneakers': PRODUCTS.filter((p) => p.category === 'sneakers').length,
      'cat-tech': PRODUCTS.filter((p) => p.category === 'tech').length,
      'cat-appliances': PRODUCTS.filter((p) => p.category === 'appliances').length,
      'cat-audio': PRODUCTS.filter((p) => p.category === 'audio').length,
      'cat-gaming': PRODUCTS.filter((p) => p.category === 'gaming').length,
      'cat-watches': PRODUCTS.filter((p) => p.category === 'watches').length,
      'cat-camera': PRODUCTS.filter((p) => p.category === 'camera').length,
      'type-all': PRODUCTS.length,
      'type-mall': PRODUCTS.filter((p) => p.type === 'mall').length,
      'type-c2c': PRODUCTS.filter((p) => p.type === 'c2c').length,
      'cond-all': PRODUCTS.filter((p) => p.type === 'c2c').length,
      'cond-98': PRODUCTS.filter((p) => p.type === 'c2c' && (p.cond || 0) >= 98).length,
      'cond-95': PRODUCTS.filter((p) => p.type === 'c2c' && (p.cond || 0) >= 95).length,
      'cond-90': PRODUCTS.filter((p) => p.type === 'c2c' && (p.cond || 0) >= 90).length,
    };

    $$('[data-count-key]').forEach((el) => {
      const key = el.dataset.countKey;
      if (counts[key] !== undefined) {
        el.textContent = counts[key];
      }
    });
  }

  /* ---------------- XỬ LÝ DRAWER BỘ LỌC CHO MOBILE ---------------- */
  function setupMobileFilter() {
    if (!dom.mobileToggleBtn) return;
    const sidebar = $('.filter-sidebar');
    dom.mobileToggleBtn.addEventListener('click', () => {
      if (!sidebar) return;
      const isOpen = sidebar.classList.toggle('is-open');
      dom.mobileToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (dom.mobileFilterBtnText) {
        dom.mobileFilterBtnText.textContent = isOpen ? 'Đóng Bộ Lọc' : 'Mở Bộ Lọc Tìm Kiếm';
      }
    });
  }

  /* ---------------- XỬ LÝ CHUYỂN ĐỔI CHẾ ĐỘ XEM (LƯỚI / TINH GỌN) ---------------- */
  function setupViewMode() {
    const grid = dom.grid;
    if (!grid) return;
    const saved = localStorage.getItem('hybrid_catalog_view') || 'grid';

    function setMode(mode) {
      if (mode === 'compact') {
        grid.classList.add('compact-view');
        if (dom.viewModeGrid) dom.viewModeGrid.classList.remove('active');
        if (dom.viewModeCompact) dom.viewModeCompact.classList.add('active');
        try { localStorage.setItem('hybrid_catalog_view', 'compact'); } catch (e) {}
      } else {
        grid.classList.remove('compact-view');
        if (dom.viewModeGrid) dom.viewModeGrid.classList.add('active');
        if (dom.viewModeCompact) dom.viewModeCompact.classList.remove('active');
        try { localStorage.setItem('hybrid_catalog_view', 'grid'); } catch (e) {}
      }
    }

    if (saved === 'compact') setMode('compact');
    if (dom.viewModeGrid) dom.viewModeGrid.addEventListener('click', () => setMode('grid'));
    if (dom.viewModeCompact) dom.viewModeCompact.addEventListener('click', () => setMode('compact'));
  }

  /* ---------------- XỬ LÝ NÚT YÊU THÍCH (WISHLIST) & XÓA TẤT CẢ LỌC ---------------- */
  function setupCatalogExtras() {
    if (dom.clearAllBtn) {
      dom.clearAllBtn.addEventListener('click', resetAllFilters);
    }
  }

  /* ---------------- QUẢN LÝ SO SÁNH SẢN PHẨM (COMPARE SYSTEM) ---------------- */
  let compareList = [];

  function setupCompareSystem() {
    const dock = document.getElementById("compareDockBar");
    const countText = document.getElementById("compareCountText");
    const thumbsContainer = document.getElementById("compareDockThumbs");
    const btnOpen = document.getElementById("btnOpenCompareModal");
    const btnClear = document.getElementById("btnClearCompare");
    const modal = document.getElementById("compareMatrixModal");
    const modalBody = document.getElementById("compareMatrixBody");
    const btnClose = document.getElementById("btnCloseCompareModal");
    const btnCloseFoot = document.getElementById("btnCloseCompareFoot");

    function updateCompareUI() {
      if (!dock || !countText || !thumbsContainer) return;
      const count = compareList.length;
      countText.textContent = count;

      if (count === 0) {
        dock.classList.remove("active");
        thumbsContainer.innerHTML = "";
      } else {
        dock.classList.add("active");
        let html = "";
        for (let i = 0; i < 3; i++) {
          const item = compareList[i];
          if (item) {
            const imgSrc = (typeof window !== "undefined" && window.resolveAssetUrl ? window.resolveAssetUrl(item.img) : item.img) || "";
            html += `
              <div class="compare-dock-thumb" title="${Utils.escapeHtml(item.name)}">
                <img src="${imgSrc}" alt="${Utils.escapeHtml(item.name)}" />
                <button type="button" class="remove-thumb-btn" data-remove-compare="${item.id}">✕</button>
              </div>`;
          } else {
            html += `<div class="compare-dock-empty-slot">+</div>`;
          }
        }
        thumbsContainer.innerHTML = html;
      }

      document.querySelectorAll('[data-action="compare"]').forEach((btn) => {
        const id = btn.getAttribute("data-id");
        const isSelected = compareList.some((p) => String(p.id) === String(id));
        btn.classList.toggle("active", isSelected);
      });
    }

    document.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="compare"]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const idx = compareList.findIndex((p) => String(p.id) === String(id));

        if (idx !== -1) {
          compareList.splice(idx, 1);
          Utils.toast("Đã bỏ sản phẩm khỏi bảng so sánh.", "info");
        } else {
          if (compareList.length >= 3) {
            Utils.toast("Bạn chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc!", "warning");
            return;
          }
          const allProds = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
          const found = allProds.find((p) => String(p.id) === String(id));
          if (found) {
            compareList.push(found);
            Utils.toast(`Đã thêm "${found.short || found.name}" vào bảng so sánh!`, "success");
          }
        }
        updateCompareUI();
        return;
      }

      const removeThumb = e.target.closest("[data-remove-compare]");
      if (removeThumb) {
        e.preventDefault();
        const remId = removeThumb.getAttribute("data-remove-compare");
        compareList = compareList.filter((p) => String(p.id) !== String(remId));
        updateCompareUI();
        return;
      }
    });

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        compareList = [];
        updateCompareUI();
        Utils.toast("Đã xóa tất cả sản phẩm trong bảng so sánh.", "info");
      });
    }

    if (btnOpen && modal && modalBody) {
      btnOpen.addEventListener("click", () => {
        if (compareList.length < 2) {
          Utils.toast("Vui lòng chọn ít nhất 2 sản phẩm để so sánh đối chiếu!", "warning");
          return;
        }

        modalBody.innerHTML = `
          <div style="overflow-x: auto;">
            <table class="compare-matrix-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Tiêu Chí</th>
                  ${compareList.map((p) => `
                    <th style="text-align: center; min-width: 200px;">
                      <img src="${(typeof window !== "undefined" && window.resolveAssetUrl ? window.resolveAssetUrl(p.img) : p.img) || ""}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; margin: 0 auto 8px; display: block; border: 1px solid var(--border);" alt="${Utils.escapeHtml(p.name)}" />
                      <div class="text-xs fw-700 line-clamp-2" style="color: var(--text);">${Utils.escapeHtml(p.name)}</div>
                    </th>
                  `).join("")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Phân Khúc</th>
                  ${compareList.map((p) => `
                    <td style="text-align: center;">
                      ${p.type === "mall" ? '<span class="badge badge-mall">HÀNG MỚI MALL 100%</span>' : `<span class="badge badge-c2c">ĐỒ CŨ ${p.cond || 99}% MỚI</span>`}
                    </td>
                  `).join("")}
                </tr>
                <tr>
                  <th>Giá Bán</th>
                  ${compareList.map((p) => `
                    <td style="text-align: center;">
                      <strong class="mono text-primary" style="font-size: 15px;">${Utils.formatCurrency(p.price)}</strong>
                      ${p.oldPrice ? `<div class="mono text-muted text-xs line-through">${Utils.formatCurrency(p.oldPrice)}</div>` : ""}
                    </td>
                  `).join("")}
                </tr>
                <tr>
                  <th>Tình Trạng</th>
                  ${compareList.map((p) => `
                    <td>
                      ${p.type === "mall" ? "Nguyên hộp, nguyên seal chưa kích hoạt" : `Máy Like New ${p.cond || 99}%, không cấn móp, linh kiện nguyên bản`}
                    </td>
                  `).join("")}
                </tr>
                <tr>
                  <th>Bảo Hành</th>
                  ${compareList.map((p) => `
                    <td>
                      ${p.type === "mall" ? "Bảo hành 12-24 tháng chính hãng tại trung tâm ủy quyền" : "Bảo hành 6 tháng kỹ thuật Hybrid + Đổi trả 7 ngày"}
                    </td>
                  `).join("")}
                </tr>
                <tr>
                  <th>Đồng Kiểm</th>
                  ${compareList.map((p) => `
                    <td>
                      <span class="text-success fw-600">✓ Đồng kiểm ngoại quan &amp; thử nguồn</span><br/>
                      <small class="text-muted">${p.type === "mall" ? "Hỏa tốc 2 giờ tại HN & HCM" : "Giao hàng tiêu chuẩn 1-2 ngày"}</small>
                    </td>
                  `).join("")}
                </tr>
                <tr>
                  <th>Chi Tiết</th>
                  ${compareList.map((p) => `
                    <td style="text-align: center;">
                      <a href="${p.type === "mall" ? `product_new.html?id=${p.id}` : `product_used.html?id=${p.id}`}" class="btn btn-primary btn-xs is-full">
                        <span class="material-symbols-outlined icon-2xs">visibility</span> Xem Sản Phẩm
                      </a>
                    </td>
                  `).join("")}
                </tr>
              </tbody>
            </table>
          </div>
        `;
        modal.style.display = "flex";
      });
    }

    [btnClose, btnCloseFoot].forEach((btn) => {
      if (btn) btn.addEventListener("click", () => (modal.style.display = "none"));
    });
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    }
  }

  setupAvatar();
  initTypeTabCounts();
  applyType(initialType, false);
  syncFilterInputs();
  setupFilterEvents();
  setupProductCardEvents();
  setupCountdown();
  updateSidebarCounts();
  setupMobileFilter();
  setupViewMode();
  setupCatalogExtras();
  setupCompareSystem();
  render();
  enableHorizontalDrag($(".subnav .container"));
  if (typeof Utils !== "undefined" && Utils.Cart) {
    Utils.Cart.syncBadge();
  }

  // Đồng bộ sản phẩm từ Backend Database API
  if (window.API && window.API.Catalog) {
    window.API.Catalog.getProducts().then((backendProducts) => {
      if (Array.isArray(backendProducts) && backendProducts.length > 0) {
        const catMap = { 1: "tech", 2: "audio", 3: "fashion", 4: "book", 5: "appliances" };
        const existingIds = new Set(PRODUCTS.map((p) => p.id));
        let addedCount = 0;
        backendProducts.forEach((bp) => {
          if (!existingIds.has(bp.id)) {
            const mapped = {
              id: bp.id,
              name: bp.name,
              short: bp.name,
              category: catMap[bp.category_id] || "tech",
              type: bp.is_new ? "mall" : "c2c",
              badge: bp.is_new ? "CHÍNH HÃNG 100%" : `ĐỒ CŨ ${bp.wear_condition || 98}%`,
              cond: bp.wear_condition || 100,
              price: bp.selling_price,
              oldPrice: bp.original_price,
              img: (bp.media && bp.media[0] && bp.media[0].media_url) || "../../assets/images/products/phone-sample.svg",
              desc: bp.description,
              rating: 5,
              ratingCount: 1,
              soldCount: 0
            };
            PRODUCTS.unshift(mapped);
            addedCount++;
          }
        });
        if (addedCount > 0) {
          initTypeTabCounts();
          updateSidebarCounts();
          render();
        }
      }
    }).catch((e) => console.warn("Catalog API sync fallback:", e));
  }
})();
