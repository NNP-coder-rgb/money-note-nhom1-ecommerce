// index.js — trang chủ: dựng giao diện từ mock-data.js, giỏ hàng, trả giá, đăng bán, đăng xuất
// Cần nạp trước: popup.js, auth.js, mock-data.js
(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);

  /* ---------------- Báo lỗi ngay trên trang (để không bị "trắng" mà không biết vì sao) ---------------- */
  function showFatal(lines) {
    console.error("[index.js]", lines.join(" | "));
    const box = document.createElement("div");
    box.className = "container section";
    box.innerHTML =
      '<div class="alert alert-danger"><span class="material-symbols-outlined alert-icon">error</span><div>' +
      '<div class="alert-title">Trang chủ chưa tải được dữ liệu</div>' +
      lines.map((l) => "<p>" + l + "</p>").join("") +
      "<p>Mở F12 → tab Console để xem lỗi chi tiết.</p></div></div>";
    const main = document.querySelector("main");
    main.insertBefore(box, main.firstChild);
  }

  // Kiểm tra các file cần thiết đã được nạp chưa
  const missing = [];
  if (typeof showPopup === "undefined")
    missing.push("Thiếu <code>js/popup.js</code> (hàm showPopup).");
  if (typeof Auth === "undefined")
    missing.push("Thiếu <code>js/auth.js</code> (đối tượng Auth).");
  if (typeof Utils === "undefined")
    missing.push("Thiếu <code>js/utils.js</code> (bộ hàm tiện ích Utils).");
  if (typeof PRODUCTS === "undefined")
    missing.push(
      "Thiếu biến <code>PRODUCTS</code> — kiểm tra <code>js/mock-data.js</code> có đúng file/đường dẫn và đúng tên biến không.",
    );
  if (typeof CATEGORIES === "undefined")
    missing.push(
      "Thiếu biến <code>CATEGORIES</code> trong <code>js/mock-data.js</code>.",
    );
  if (typeof FLASH_SALE === "undefined")
    missing.push(
      "Thiếu biến <code>FLASH_SALE</code> trong <code>js/mock-data.js</code>.",
    );
  if (typeof TICKER === "undefined")
    missing.push(
      "Thiếu biến <code>TICKER</code> trong <code>js/mock-data.js</code>.",
    );
  if (missing.length) {
    showFatal(missing);
    return;
  }

  // Lỗi JavaScript bất ngờ trong quá trình dựng trang cũng hiện ra trên màn hình
  window.addEventListener("error", (e) => {
    showFatal([
      "Lỗi JavaScript: <code>" +
        e.message +
        "</code> (" +
        String(e.filename || "")
          .split("/")
          .pop() +
        ":" +
        e.lineno +
        ")",
    ]);
  });

  // Muốn chỉ cho người đã đăng nhập xem trang chủ thì bỏ dấu // ở dòng dưới:
  // if (!Auth.requireLogin()) return;

  const fmt = (n) => (typeof formatCurrency === "function" ? formatCurrency(n) : n.toLocaleString("vi-VN") + "₫");
  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

  /* ---------------- Tài khoản ---------------- */
  const user = typeof Auth !== "undefined" && typeof Auth.current === "function" ? Auth.current() : null;
  const avatarBtn = $("#avatarBtn");
  if (user) {
    const initials = user.fullName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    avatarBtn.textContent = initials;
    avatarBtn.title = user.fullName;
  }
  avatarBtn.addEventListener("click", () => {
    if (!user) {
      window.location.href = "pages/account/auth_login.html";
      return;
    }
    window.location.href = "pages/account/profile.html";
  });

  /* ---------------- Tìm kiếm tương tác trang chủ ---------------- */
  const searchInput = $("#homeSearchInput");
  const searchForm = $("#homeSearchForm");
  const searchDropdown = $("#searchDropdown");

  if (searchInput && searchDropdown) {
    let searchDebounce = null;

    function renderSearchDropdown(keyword) {
      const q = (keyword || "").trim();
      if (!q) {
        searchDropdown.style.display = "none";
        searchDropdown.innerHTML = "";
        return;
      }

      // Lọc sản phẩm khớp từ khóa
      const matches = typeof Utils !== "undefined" && typeof Utils.filterProducts === "function"
        ? Utils.filterProducts(PRODUCTS, { keyword: q })
        : PRODUCTS.filter((p) => {
            const str = (p.name + " " + (p.short || "") + " " + (p.desc || "")).toLowerCase();
            return str.includes(q.toLowerCase());
          });

      const safeQ = typeof escapeHtml === "function" ? escapeHtml(q) : q.replace(/</g, "&lt;");

      if (matches.length === 0) {
        searchDropdown.innerHTML =
          '<div class="search-dropdown-empty">' +
          '<span class="material-symbols-outlined icon-md text-muted mb-1" style="display:block;font-size:28px;">search_off</span>' +
          '<div>Không tìm thấy sản phẩm khớp với "<strong>' + safeQ + '</strong>"</div>' +
          '<div class="text-xs text-muted mt-1">Gợi ý thử: iPhone, Nike, Sony, Dyson, MacBook, Jordan...</div>' +
          '</div>';
        searchDropdown.style.display = "block";
        return;
      }

      const topMatches = matches.slice(0, 6);
      let html = topMatches.map((p) => {
        const targetUrl = p.type === "mall"
          ? "pages/shop/product_new.html?id=" + p.id
          : "pages/shop/product_used.html?id=" + p.id;
        const badgeText = p.type === "mall" ? (p.badge || "MALL 100%") : (p.condText || "LIKE NEW");
        const categoryName = p.category === "fashion" ? "Thời Trang"
          : p.category === "sneakers" ? "Sneakers"
          : p.category === "tech" ? "Điện Tử"
          : "Gia Dụng";

        return (
          '<a class="search-dropdown-item" href="' + targetUrl + '">' +
          '<img src="' + p.img + '" alt="' + (p.short || p.name) + '">' +
          '<div class="item-info">' +
          '<div class="item-title">' + (p.short || p.name) + '</div>' +
          '<div class="item-sub">' +
          '<span class="badge badge-sm ' + (p.type === "mall" ? "badge-primary" : "badge-secondary") + '">' + badgeText + '</span>' +
          '<span>' + categoryName + '</span>' +
          '</div>' +
          '</div>' +
          '<div class="item-price">' + fmt(p.price) + '</div>' +
          '</a>'
        );
      }).join("");

      html +=
        '<a class="search-dropdown-footer" href="pages/shop/catalog.html?q=' + encodeURIComponent(q) + '">' +
        'Xem tất cả ' + matches.length + ' kết quả cho "' + safeQ + '" trong Bộ Sưu Tập →' +
        '</a>';

      searchDropdown.innerHTML = html;
      searchDropdown.style.display = "block";
    }

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        renderSearchDropdown(e.target.value);
      }, 150);
    });

    searchInput.addEventListener("focus", (e) => {
      if (e.target.value.trim()) {
        renderSearchDropdown(e.target.value);
      }
    });

    // Bấm ESC hoặc click ra ngoài thì ẩn
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.style.display = "none";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchDropdown.style.display = "none";
      }
    });

    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) {
          window.location.href = "pages/shop/catalog.html?q=" + encodeURIComponent(q);
        } else {
          window.location.href = "pages/shop/catalog.html";
        }
      });
    }
  }

  /* ---------------- Dòng chạy Giao Dịch Mới ---------------- */
  const tickerHTML = TICKER.map(
    (t) =>
      '<span class="ticker-item tone-' +
      t.tone +
      '"><i></i><strong>' +
      t.id +
      "</strong> " +
      t.html +
      "</span>",
  ).join("");
  $("#tickerInner").innerHTML = tickerHTML + tickerHTML; // nhân đôi để chạy vòng liền mạch

  /* ---------------- Hỗ trợ kéo cuộn ngang ---------------- */
  // Hỗ trợ cuộn ngang tự nhiên bằng con lăn chuột (mouse wheel) và kéo chuột (drag)
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

  enableHorizontalDrag($("#chipBar"));
  enableHorizontalDrag($(".subnav .container"));

  /* ---------------- Thẻ sản phẩm ---------------- */
  function cardHTML(p, ctx) {
    if (typeof Components !== "undefined" && typeof Components.renderProductCard === "function") {
      return Components.renderProductCard(p, { basePath: "" });
    }
    const flash = ctx === "flash";
    const title = p.short || p.name;

    if (p.type === "mall") {
      return (
        '<article class="product-card">' +
        '<div class="product-media">' +
        '<a href="pages/shop/product_new.html?id=' + p.id + '">' +
        '<img src="' +
        p.img +
        '" alt="' +
        title +
        '" loading="lazy">' +
        '</a>' +
        '<div class="product-tags"><span class="badge badge-solid">' +
        p.badge +
        "</span>" +
        (flash ? '<span class="badge">-' + p.off + "%</span>" : "") +
        "</div>" +
        (p.tag && !flash
          ? '<span class="media-tag">' + p.tag + "</span>"
          : "") +
        "</div>" +
        '<div class="product-body">' +
        '<span class="product-cat text-primary">' +
        p.sub +
        "</span>" +
        '<h3 class="product-name line-clamp-2">' +
        '<a href="pages/shop/product_new.html?id=' + p.id + '" class="text-hover-primary">' +
        p.name +
        '</a>' +
        "</h3>" +
        (p.rating
          ? '<div class="product-meta"><span class="stars" title="' + (typeof renderStars === "function" ? renderStars(p.rating) : "") + '">★ ' +
            p.rating.toFixed(1) +
            "</span><span>" +
            p.reviews +
            "</span></div>"
          : "") +
        '<div class="product-price"><span class="price">' +
        fmt(p.price) +
        "</span>" +
        (flash && p.oldPrice
          ? '<span class="price-old">' + fmt(p.oldPrice) + "</span>"
          : '<span class="badge badge-success">-' + p.off + "%</span>") +
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

    // c2c — đồ cũ / đã qua sử dụng
    const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const badgeCls = p.limited
      ? "badge badge-limited"
      : "badge badge-solid-secondary";
    return (
      '<article class="product-card">' +
      '<div class="product-media">' +
      '<a href="pages/shop/product_used.html?id=' + p.id + '">' +
      '<img src="' +
      p.img +
      '" alt="' +
      title +
      '" loading="lazy">' +
      '</a>' +
      '<div class="product-tags"><span class="' +
      badgeCls +
      '">' +
      (p.badge || "ĐỒ CŨ LIKE NEW") +
      "</span>" +
      (discount > 0 ? '<span class="badge badge-success">Rẻ hơn đồ mới ' + discount + '%</span>' : '') +
      '<span class="badge badge-secondary">' +
      p.condText +
      "</span></div>" +
      (p.tag ? '<span class="media-tag">' + p.tag + "</span>" : "") +
      "</div>" +
      '<div class="product-body">' +
      '<div class="cond">' +
      '<div class="progress-label"><span>' +
      p.condPrefix +
      ": <strong>" +
      p.condLabel +
      "</strong></span>" +
      '<strong class="text-secondary">' +
      p.cond +
      "%</strong></div>" +
      '<div class="progress progress-secondary" style="--value:' +
      p.cond +
      '%"><div class="progress-bar"></div></div>' +
      "</div>" +
      '<div class="product-meta"><span class="material-symbols-outlined icon-sm">verified</span>' +
      p.seller +
      "</div>" +
      '<h3 class="product-name line-clamp-2">' +
      '<a href="pages/shop/product_used.html?id=' + p.id + '" class="text-hover-primary">' +
      p.name +
      '</a>' +
      "</h3>" +
      (p.desc
        ? '<p class="text-xs text-muted truncate">' + p.desc + "</p>"
        : "") +
      '<div class="product-price"><span class="price">' +
      fmt(p.price) +
      "</span>" +
      (p.oldPrice ? '<span class="price-old" title="Giá hàng mới 100%">Giá mới: ' + fmt(p.oldPrice) + '</span>' : '') +
      "</div>" +
      (discount > 0 ? '<div class="text-xs text-success fw-600 mt-1">Tiết kiệm ' + discount + '% (' + fmt(p.oldPrice - p.price) + ') so với mua mới</div>' : '') +
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

  /* ---------------- Flash sale ---------------- */
  $("#flashGrid").innerHTML = FLASH_SALE.items
    .map((id) => cardHTML(findProduct(id), "flash"))
    .join("");

  const countdownEls = { h: $("#fs-h"), m: $("#fs-m"), s: $("#fs-s") };
  if (typeof startCountdown === "function") {
    startCountdown(FLASH_SALE.endsInSeconds, countdownEls, () => {
      startCountdown(4 * 3600, countdownEls);
    });
  } else {
    let seconds = FLASH_SALE.endsInSeconds;
    const pad = (n) => String(n).padStart(2, "0");
    setInterval(() => {
      seconds = seconds <= 0 ? 4 * 3600 : seconds - 1;
      countdownEls.h.textContent = pad(Math.floor(seconds / 3600));
      countdownEls.m.textContent = pad(Math.floor((seconds % 3600) / 60));
      countdownEls.s.textContent = pad(seconds % 60);
    }, 1000);
  }

  /* ---------------- Các khối ngành hàng (Hỗ trợ phân chia Đồ Mới vs Đồ Cũ) ---------------- */
  let currentHomeType = "all";

  function renderHomeCategories(type) {
    currentHomeType = type || "all";
    const list = currentHomeType === "mall"
      ? (typeof CATEGORIES_MALL !== "undefined" ? CATEGORIES_MALL : CATEGORIES)
      : (currentHomeType === "c2c" ? (typeof CATEGORIES_C2C !== "undefined" ? CATEGORIES_C2C : CATEGORIES) : CATEGORIES);

    // 1. Cập nhật thanh chip
    const chipBaseUrl = currentHomeType === "all" ? "pages/shop/catalog.html" : "pages/shop/catalog.html?type=" + currentHomeType;
    const allChipTitle = currentHomeType === "mall" ? "Tất Cả Hàng Mới" : (currentHomeType === "c2c" ? "Tất Cả Đồ Cũ" : "Tất Cả Ngành Hàng");

    const chipBar = $("#chipBar");
    if (chipBar) {
      chipBar.innerHTML =
        '<a class="chip active" href="' + chipBaseUrl + '"><span class="material-symbols-outlined">grid_view</span>' + allChipTitle + '</a>' +
        list.map(
          (c) =>
            '<a class="chip tone-' + c.tone + '" href="#cat-' + c.id + '">' +
            '<span class="material-symbols-outlined" style="color:var(--tone)">' + c.chipIcon + '</span>' +
            (c.chip || c.tile || c.title) +
            '<span class="chip-count">' + c.total + '</span>' +
            '</a>',
        ).join("");

      // Gắn sự kiện cuộn mượt cho chip
      const chipEls = $$("#chipBar .chip");
      chipEls.forEach((chip) => {
        chip.addEventListener("click", (e) => {
          chipEls.forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          const targetId = chip.getAttribute("href");
          if (targetId && targetId.startsWith("#cat-")) {
            const targetEl = $(targetId);
            if (targetEl) {
              e.preventDefault();
              targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        });
      });
    }

    // 2. Cập nhật catJump (ô chỉ mục nhanh)
    const catJump = $("#catJump");
    if (catJump) {
      catJump.innerHTML = list.map(
        (c) =>
          '<a class="cat-jump tone-' + c.tone + '" href="#cat-' + c.id + '">' +
          '<span class="material-symbols-outlined">' + c.icon + '</span>' +
          '<div><strong>' + (c.tile || c.title) + '</strong><small>' + (c.tileCount || c.total) + '</small></div></a>',
      ).join("");
    }

    // 3. Cập nhật các khối ngành hàng
    const catSections = $("#categorySections");
    if (catSections) {
      catSections.innerHTML = list.map((c) => {
        const items = PRODUCTS.filter((p) => {
          const matchCat = p.category === c.id;
          const matchType = currentHomeType === "all" ? true : p.type === currentHomeType;
          return matchCat && matchType && !p.flashOnly && !p.catalogOnly;
        }).slice(0, 12);
        if (!items || items.length === 0) return "";
        const viewAllUrl = currentHomeType === "all"
          ? 'pages/shop/catalog.html?cat=' + c.id
          : 'pages/shop/catalog.html?type=' + currentHomeType + '&cat=' + c.id;
        return (
          '<section class="container section tone-' + c.tone + '" id="cat-' + c.id + '">' +
          '<div class="cat-head">' +
          '<div class="cat-title">' +
          '<span class="icon-box"><span class="material-symbols-outlined icon-lg">' + c.icon + '</span></span>' +
          '<div>' +
          '<div class="flex items-center gap-2 flex-wrap"><h2>' + c.title + '</h2><span class="badge badge-tone">' + c.badge + '</span></div>' +
          '<p class="text-sm text-muted">' + c.desc + '</p>' +
          '</div>' +
          '</div>' +
          '<div class="cat-links">' +
          '<span class="note"><span class="material-symbols-outlined icon-sm">' + c.noteIcon + '</span>' + c.note + '</span>' +
          '<a href="' + viewAllUrl + '">Xem tất cả (' + c.total + ') <span class="material-symbols-outlined icon-sm">arrow_forward</span></a>' +
          '</div>' +
          '</div>' +
          '<div class="product-grid">' +
          items.map((p) => cardHTML(p)).join("") +
          '</div>' +
          '</section>'
        );
      }).join("");
    }

    // 4. Cập nhật active trên các tab chuyển đổi trang chủ
    $$("#sectionTypeSelector .type-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === currentHomeType);
    });
  }

  // Khởi tạo các khối ngành hàng
  renderHomeCategories("all");

  // Gắn sự kiện cho các tab chuyển đổi Đồ Mới vs Đồ Cũ trên trang chủ
  $$("#sectionTypeSelector .type-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type || "all";
      renderHomeCategories(type);
    });
  });

  /* ---------------- Giỏ hàng ---------------- */
  const CART_KEY = "hv_cart_count";
  const cartBadge = $("#cartCount");
  function readCart() {
    try {
      return parseInt(localStorage.getItem(CART_KEY), 10) || 0;
    } catch (e) {
      return 0;
    }
  }
  function saveCart(n) {
    try {
      localStorage.setItem(CART_KEY, n);
    } catch (e) {
      /* trình duyệt chặn localStorage */
    }
  }
  let cartCount = readCart();
  function renderCart() {
    if (typeof Utils !== "undefined" && Utils.Cart) {
      Utils.Cart.syncBadge("#cartCount");
    } else {
      cartBadge.textContent = cartCount;
      cartBadge.classList.toggle("hidden", cartCount === 0);
    }
  }
  renderCart();

  /* ---------------- Modal ---------------- */
  function openModal(id) {
    $("#" + id).classList.add("is-open");
    document.body.classList.add("modal-open");
  }
  function closeModal(backdrop) {
    backdrop.classList.remove("is-open");
    if (!document.querySelector(".modal-backdrop.is-open"))
      document.body.classList.remove("modal-open");
  }

  /* ---------------- Trả giá ---------------- */
  let offerProduct = null;
  function openOffer(p) {
    offerProduct = p;
    $("#offerProduct").textContent = p.short || p.name;
    $("#offerSeller").textContent = p.sellerName || "-";
    $("#offerCond").textContent = p.cond + "%";
    $("#offerCurrent").textContent = fmt(p.price);
    $("#offerPrice").value = Math.round(p.price * 0.95).toLocaleString("vi-VN");
    $("#offerMsg").value = "";
    openModal("offerModal");
  }

  $("#offerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = parseInt($("#offerPrice").value.replace(/\D/g, ""), 10) || 0;
    if (value <= 0) {
      showPopup({
        type: "error",
        title: "Giá chưa hợp lệ",
        message: "Vui lòng nhập mức giá đề xuất lớn hơn 0.",
        confirmText: "Nhập lại",
      });
      return;
    }
    closeModal($("#offerModal"));
    showPopup({
      type: "success",
      title: "Đã gửi đề nghị trả giá",
      message:
        "Bạn đề nghị " +
        fmt(value) +
        ' cho "' +
        (offerProduct.short || offerProduct.name) +
        '". Hãy chờ người bán phản hồi.',
      confirmText: "Đóng",
    });
  });

  /* ---------------- Xử lý Tải ảnh trên Modal Đăng bán nhanh ---------------- */
  const modalPostFileInput = $("#modalPostFileInput");
  const modalPostDropzone = $("#modalPostDropzone");
  const modalPostDropzoneText = $("#modalPostDropzoneText");
  const modalPostPreviewStrip = $("#modalPostPreviewStrip");
  const modalPostImgCount = $("#modalPostImgCount");
  let modalUploadedImages = [];

  function compressImage(file, maxWidth = 1000, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleModalPostFiles(files) {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!validFiles.length) {
      if (typeof Utils !== "undefined" && Utils.toast) {
        Utils.toast("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!", "warning");
      }
      return;
    }
    const filesToProcess = validFiles.slice(0, 6 - modalUploadedImages.length);
    if (!filesToProcess.length) return;

    if (modalPostDropzoneText) modalPostDropzoneText.textContent = "Đang tối ưu & nén ảnh...";
    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file);
        modalUploadedImages.push(compressed);
      } catch (err) {}
    }
    renderModalPreviews();
  }

  function renderModalPreviews() {
    const count = modalUploadedImages.length;
    if (modalPostImgCount) modalPostImgCount.textContent = `${count}/6 ảnh đã chọn`;
    if (!count) {
      if (modalPostPreviewStrip) modalPostPreviewStrip.style.display = "none";
      if (modalPostDropzoneText) modalPostDropzoneText.textContent = "Bấm để chọn ảnh từ máy hoặc kéo thả vào đây";
      return;
    }
    if (modalPostDropzoneText) modalPostDropzoneText.textContent = `Đã chọn ${count}/6 ảnh (Bấm để thêm)`;
    if (modalPostPreviewStrip) {
      modalPostPreviewStrip.style.display = "flex";
      modalPostPreviewStrip.innerHTML = modalUploadedImages.map((src, i) => `
        <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0; border-radius: 6px; overflow: hidden; border: 2px solid ${i === 0 ? 'var(--primary, #8b5cf6)' : 'var(--border, #334155)'}; background: #000;">
          <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;" />
          <button type="button" data-modal-remove="${i}" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px;">✕</button>
        </div>
      `).join("");

      modalPostPreviewStrip.querySelectorAll("button[data-modal-remove]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const idx = Number(btn.dataset.modalRemove);
          modalUploadedImages.splice(idx, 1);
          renderModalPreviews();
        });
      });
    }
  }

  if (modalPostDropzone && modalPostFileInput) {
    modalPostDropzone.addEventListener("click", () => modalPostFileInput.click());
    modalPostDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      modalPostDropzone.style.borderColor = "var(--primary, #8b5cf6)";
    });
    ["dragleave", "dragend"].forEach((type) => {
      modalPostDropzone.addEventListener(type, () => {
        modalPostDropzone.style.borderColor = "";
      });
    });
    modalPostDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      modalPostDropzone.style.borderColor = "";
      if (e.dataTransfer && e.dataTransfer.files.length) {
        handleModalPostFiles(e.dataTransfer.files);
      }
    });
    modalPostFileInput.addEventListener("change", (e) => {
      if (e.target.files.length) handleModalPostFiles(e.target.files);
    });
  }

  /* ---------------- Đăng bán nhanh ---------------- */
  $("#postForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!Auth.ensureLogin(() => {}, {
      title: "Đăng Bán Đồ Cũ",
      message: "Vui lòng đăng nhập tài khoản người bán để đăng tin thanh lý đồ cũ.",
      returnUrl: "pages/seller/post_item.html"
    })) {
      return;
    }
    const name = $("#postName").value.trim();
    const price = parseInt($("#postPrice").value, 10) || 0;
    const condStr = $("#postCond").value || "99%";
    const condVal = parseInt(condStr, 10) || 99;

    if (!name || price <= 0) {
      showPopup({
        type: "error",
        title: "Thiếu thông tin",
        message: !name
          ? "Vui lòng nhập tên thiết bị cần đăng bán."
          : "Vui lòng nhập giá muốn bán.",
        confirmText: "Nhập lại",
      });
      return;
    }

    if (!modalUploadedImages.length) {
      if (typeof Utils !== "undefined" && Utils.toast) {
        Utils.toast("Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm!", "warning");
      }
      return;
    }

    const curUser = Auth.current();
    const newProduct = {
      id: "c2c-user-" + Date.now(),
      name: name,
      short: name.split("(")[0].trim(),
      category: "tech",
      type: "c2c",
      badge: "ĐỒ CŨ LIKE NEW",
      cond: condVal,
      condText: condStr + " Likenew",
      condLabel: "Đã qua kiểm tra ngoại quan",
      seller: curUser ? `${curUser.fullName} (Đã eKYC CCCD)` : "Người bán uy tín (Đã eKYC CCCD)",
      sellerName: curUser ? curUser.fullName : "Người bán uy tín",
      price: price,
      oldPrice: Math.round(price * 1.45),
      img: modalUploadedImages[0],
      images: modalUploadedImages,
      desc: `Sản phẩm đăng bán nhanh từ trang chủ: ${name}. Độ mới ${condStr}.`,
      status: "active",
      createdAt: new Date().toISOString()
    };

    try {
      let sellerProducts = JSON.parse(localStorage.getItem("hv_seller_products") || "[]");
      sellerProducts.unshift(newProduct);
      localStorage.setItem("hv_seller_products", JSON.stringify(sellerProducts));
    } catch (err) {}

    closeModal($("#postModal"));
    e.target.reset();
    modalUploadedImages = [];
    renderModalPreviews();

    showPopup({
      type: "success",
      title: "Đã đăng sản phẩm thành công",
      message: `"${name}" với ${newProduct.images.length} hình ảnh đã được đưa lên sàn và đồng bộ vào Kênh Người Bán!`,
      confirmText: "Xem Kênh Người Bán",
      onConfirm: () => {
        window.location.href = "pages/seller/dashboard.html";
      }
    });
  });

  /* ---------------- Một chỗ xử lý mọi cú nhấp ---------------- */
  document.addEventListener("click", (e) => {
    // Bấm nền tối của modal -> đóng
    if (e.target.matches("#offerModal, #postModal")) {
      closeModal(e.target);
      return;
    }

    const t = e.target.closest(
      "[data-action],[data-open],[data-close],[data-quick]",
    );
    if (!t) return;

    if (t.dataset.open) {
      if (t.dataset.open === "postModal") {
        if (!Auth.ensureLogin(() => {
          openModal("postModal");
        }, {
          title: "Đăng Bán Đồ Cũ",
          message: "Vui lòng đăng nhập tài khoản người bán để đăng bán đồ cũ.",
          returnUrl: "pages/seller/post_item.html"
        })) {
          return;
        }
      }
      openModal(t.dataset.open);
      return;
    }
    if (t.hasAttribute("data-close")) {
      closeModal(t.closest(".modal-backdrop"));
      return;
    }
    if (t.dataset.quick) {
      if (offerProduct) {
        const v = Math.round(
          offerProduct.price * (1 + Number(t.dataset.quick) / 100),
        );
        $("#offerPrice").value = v.toLocaleString("vi-VN");
      }
      return;
    }

    const p = findProduct(t.dataset.id);
    if (!p) return;
    const title = p.short || p.name;

    if (t.dataset.action === "offer") {
      if (!Auth.ensureLogin(() => {
        openOffer(p);
      }, {
        title: "Yêu Cầu Đăng Nhập",
        message: 'Vui lòng đăng nhập tài khoản để gửi đề nghị trả giá cho "' + title + '".',
      })) {
        return;
      }
      openOffer(p);
    } else if (t.dataset.action === "add-cart") {
      if (!Auth.ensureLogin(() => {
        if (typeof Utils !== "undefined" && Utils.Cart) {
          Utils.Cart.addItem(p, 1);
        } else {
          cartCount++;
          saveCart(cartCount);
          renderCart();
          if (typeof toast === "function") {
            toast('Đã thêm "' + title + '" vào giỏ hàng.', "success");
          }
        }
      }, {
        title: "Đăng Nhập Mua Hàng",
        message: 'Vui lòng đăng nhập tài khoản để thêm "' + title + '" vào giỏ hàng.',
      })) {
        return;
      }
    } else if (t.dataset.action === "buy") {
      if (!Auth.ensureLogin(() => {
        if (typeof Utils !== "undefined" && Utils.Cart) {
          Utils.Cart.addItem(p, 1);
        }
        window.location.href = "pages/shop/cart.html";
      }, {
        title: "Đăng Nhập Mua Hàng",
        message: 'Vui lòng đăng nhập tài khoản để mua ngay "' + title + '".',
        returnUrl: "pages/shop/cart.html"
      })) {
        return;
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document
      .querySelectorAll("#offerModal.is-open, #postModal.is-open")
      .forEach(closeModal);
  });
})();
