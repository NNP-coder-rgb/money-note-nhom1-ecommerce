/**
 * components.js — HYBRID.STORE UI Component Library
 * Tasks:
 *   - [FE] T13 components.js: Header ba biến thể (Marketplace, Minimal, Dashboard)
 *   - [FE] T14 components.js: Footer, Breadcrumb, renderProductCard
 *
 * Tương thích kép: Hỗ trợ nạp dạng UMD (trình duyệt gán window.Components,
 * Node.js dùng module.exports cho unit test).
 */

(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    root.Components = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Nạp utils.js nếu có sẵn
  var UtilsRef = null;
  if (typeof window !== "undefined" && window.Utils) {
    UtilsRef = window.Utils;
  } else if (typeof require === "function") {
    try {
      UtilsRef = require("./utils.js");
    } catch (e1) {
      try {
        UtilsRef = require("./frontend/js/utils.js");
      } catch (e2) {}
    }
  }

  /* ---------------- CÁC HÀM TIỆN ÍCH NỘI BỘ ---------------- */

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Tự động xác định đường dẫn tương đối (basePath) dựa vào URL hiện tại
   * Trả về "" nếu ở thư mục gốc, "../../" nếu ở các trang con 2 cấp (pages/shop/, pages/seller/, ...)
   */
  function detectBasePath(customPath) {
    if (customPath !== undefined && customPath !== null) {
      return customPath;
    }
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.pathname
    ) {
      var pathname = window.location.pathname.replace(/\\/g, "/");
      if (
        pathname.indexOf("/pages/shop/") !== -1 ||
        pathname.indexOf("/pages/account/") !== -1 ||
        pathname.indexOf("/pages/seller/") !== -1 ||
        pathname.indexOf("/pages/admin/") !== -1 ||
        pathname.indexOf("/pages/buyer/") !== -1 ||
        pathname.indexOf("/pages/info/") !== -1 ||
        pathname.indexOf("/test/") !== -1
      ) {
        return "../../";
      }
      if (pathname.indexOf("/pages/") !== -1) {
        return "../";
      }
    }
    return "";
  }

  /**
   * Chuẩn hóa URL theo basePath
   */
  function resolveUrl(url, basePath) {
    if (!url) return "#";
    if (
      url.indexOf("http://") === 0 ||
      url.indexOf("https://") === 0 ||
      url.indexOf("#") === 0 ||
      url.indexOf("mailto:") === 0 ||
      url.indexOf("tel:") === 0 ||
      url.indexOf("javascript:") === 0 ||
      url.indexOf("data:") === 0
    ) {
      return url;
    }
    if (url.charAt(0) === "/") return url;
    if (basePath === "" || !basePath) return url;

    // Tránh cộng dồn nếu url đã có sẵn tiền tố
    if (url.indexOf(basePath) === 0) return url;

    return basePath + url;
  }

  function formatMoney(amount) {
    if (UtilsRef && typeof UtilsRef.formatCurrency === "function") {
      return UtilsRef.formatCurrency(amount);
    }
    var num = Number(amount) || 0;
    return new Intl.NumberFormat("vi-VN").format(num) + "₫";
  }

  function getRatingStars(rating) {
    if (UtilsRef && typeof UtilsRef.renderStars === "function") {
      return UtilsRef.renderStars(rating, { html: true });
    }
    var full = Math.floor(Number(rating) || 5);
    var stars = "";
    for (var i = 0; i < 5; i++) {
      stars +=
        i < full
          ? '<span class="material-symbols-outlined icon-xs star-filled">star</span>'
          : '<span class="material-symbols-outlined icon-xs star-empty">star</span>';
    }
    return stars;
  }

  /* =====================================================================
     TASK [FE] T13: HEADER BA BIẾN THỂ
     - Biến thể 1: MARKETPLACE (Full Header cho trang mua sắm, catalog, sp)
     - Biến thể 2: MINIMAL (Rút gọn cho giỏ hàng, thanh toán, đăng nhập/ký)
     - Biến thể 3: DASHBOARD (Dành cho Kênh người bán & Master Admin Portal)
     ===================================================================== */

  var Header = {
    MARKETPLACE: "marketplace",
    MINIMAL: "minimal",
    DASHBOARD: "dashboard",

    /**
     * Tạo mã HTML Header theo biến thể yêu cầu
     * @param {Object} options
     *   - variant: "marketplace" | "minimal" | "dashboard" (mặc định: marketplace)
     *   - basePath: đường dẫn tương đối (tự động nhận diện nếu để trống)
     *   - activeNav: mục điều hướng active ("home" | "mall" | "c2c" | "about" | "inspection")
     *   - title: tiêu đề hiển thị (dùng cho minimal hoặc dashboard)
     *   - badgeText: nhãn phụ trên logo (ví dụ: "v3.2", "GIỎ HÀNG", "KÊNH NGƯỜI BÁN")
     *   - statusText: trạng thái hệ thống (dashboard)
     *   - searchQuery: từ khóa tìm kiếm đang nhập
     *   - currentUser: đối tượng người dùng hiện tại
     *   - backUrl: liên kết nút quay lại (dùng cho minimal)
     *   - backLabel: nhãn nút quay lại
     */
    createHTML: function (options) {
      options = options || {};
      var variant = options.variant || Header.MARKETPLACE;
      var bp = detectBasePath(options.basePath);

      var homeUrl = resolveUrl("index.html", bp);
      var catalogUrl = resolveUrl("pages/shop/catalog.html", bp);
      var cartUrl = resolveUrl("pages/shop/cart.html", bp);
      var postItemUrl = resolveUrl("pages/seller/post_item.html", bp);
      var profileUrl = resolveUrl("pages/account/profile.html", bp);
      var loginUrl = resolveUrl("pages/account/auth_login.html", bp);
      var registerUrl = resolveUrl("pages/account/auth_register.html", bp);

      // Lấy thông tin user hiện tại nếu có
      var user = options.currentUser;
      if (
        !user &&
        UtilsRef &&
        UtilsRef.Auth &&
        typeof UtilsRef.Auth.getCurrentUser === "function"
      ) {
        user = UtilsRef.Auth.getCurrentUser();
      }

      /* ----- 1. BIẾN THỂ MINIMAL (Giỏ hàng, Thanh toán, Auth) ----- */
      if (variant === Header.MINIMAL) {
        var badgeTextMinimal = options.badgeText || options.title || "GIỎ HÀNG";
        var backUrl = options.backUrl
          ? resolveUrl(options.backUrl, bp)
          : catalogUrl;
        var backLabel = options.backLabel || "Tiếp Tục Mua Sắm";

        return (
          '<header class="site-header site-header--minimal" id="siteHeader">' +
          '<div class="container">' +
          '<div class="flex items-center gap-3">' +
          '<a class="brand" href="' +
          homeUrl +
          '">' +
          '<span class="brand-mark"><span class="material-symbols-outlined">token</span></span>' +
          '<span>HYBRID<span class="text-secondary">.STORE</span> <span class="badge">' +
          escapeHtml(badgeTextMinimal) +
          "</span></span>" +
          "</a>" +
          "</div>" +
          '<div class="header-trust-pills hide-md flex items-center gap-4 text-xs text-muted">' +
          '<span class="flex items-center gap-1 text-success fw-600">' +
          '<span class="material-symbols-outlined icon-sm">verified_user</span> Đồng kiểm 100% khi nhận hàng' +
          "</span>" +
          '<span class="flex items-center gap-1 text-secondary fw-600">' +
          '<span class="material-symbols-outlined icon-sm">bolt</span> Thanh toán Napas 24/7' +
          "</span>" +
          '<span class="flex items-center gap-1">' +
          '<span class="material-symbols-outlined icon-sm">support_agent</span> Hotline: 1900 8899' +
          "</span>" +
          "</div>" +
          '<div class="header-actions">' +
          '<a class="btn btn-secondary btn-sm hide-sm" href="' +
          backUrl +
          '">' +
          '<span class="material-symbols-outlined icon-sm">arrow_back</span> ' +
          escapeHtml(backLabel) +
          "</a>" +
          '<button class="icon-btn theme-toggle-btn" id="themeToggleBtn" type="button" aria-label="Chuyển chế độ sáng / tối" title="Chuyển sang giao diện Sáng">' +
          '<span class="material-symbols-outlined theme-toggle-icon">light_mode</span>' +
          "</button>" +
          (options.showCart !== false
            ? '<a class="icon-btn" href="' +
              cartUrl +
              '" aria-label="Giỏ hàng" title="Giỏ hàng">' +
              '<span class="material-symbols-outlined">shopping_bag</span>' +
              '<span class="badge badge-counter" id="cartCount">0</span>' +
              "</a>"
            : "") +
          '<a class="avatar" href="' +
          profileUrl +
          '" title="' +
          (user ? escapeHtml(user.fullName || user.name) : "Tài khoản") +
          '">' +
          '<span class="material-symbols-outlined">person</span>' +
          "</a>" +
          "</div>" +
          "</div>" +
          "</header>"
        );
      }

      /* ----- 2. BIẾN THỂ DASHBOARD (Seller Center & Master Admin Portal) ----- */
      if (variant === Header.DASHBOARD) {
        var portalType = options.portalType || "seller"; // "seller" | "admin"
        var isAdmin = portalType === "admin";
        var brandName = isAdmin ? "HYBRID" : "HYBRID";
        var brandSuffix = isAdmin ? ".SYSTEM" : ".STORE";
        var portalBadge =
          options.badgeText || (isAdmin ? "MASTER ADMIN" : "KÊNH NGƯỜI BÁN");
        var portalBadgeClass = isAdmin
          ? "badge badge-solid"
          : "badge badge-secondary";
        var portalIcon = isAdmin ? "terminal" : "token";
        var statusText =
          options.statusText ||
          (isAdmin ? "HỆ THỐNG ONLINE 99.99%" : "Gian Hàng Hoạt Động");
        var adminUrl = resolveUrl("pages/admin/admin_system.html", bp);
        var sellerUrl = resolveUrl("pages/seller/dashboard.html", bp);
        var actionBtnHtml = isAdmin
          ? '<a class="btn btn-secondary btn-sm hide-sm" href="' +
            sellerUrl +
            '"><span class="material-symbols-outlined icon-sm">store</span> Kênh Người Bán</a>' +
            '<a class="btn btn-secondary btn-sm hide-sm" href="' +
            homeUrl +
            '"><span class="material-symbols-outlined icon-sm">storefront</span> Ra Trang Chủ</a>'
          : '<a class="btn btn-secondary btn-sm hide-sm" href="' +
            adminUrl +
            '"><span class="material-symbols-outlined icon-sm">terminal</span> Master Admin</a>' +
            '<a class="btn btn-primary btn-sm" href="' +
            postItemUrl +
            '"><span class="material-symbols-outlined icon-sm">add</span> Đăng Bán Món Mới</a>';

        var headerStyle = isAdmin
          ? ' style="border-bottom: 2px solid var(--primary-600);"'
          : "";

        return (
          '<header class="site-header site-header--dashboard"' +
          headerStyle +
          ' id="siteHeader">' +
          '<div class="container">' +
          '<div class="flex items-center gap-3">' +
          '<button class="icon-btn hide-lg" id="sidebarToggleBtn" type="button" aria-label="Mở menu quản trị">' +
          '<span class="material-symbols-outlined">menu</span>' +
          "</button>" +
          '<a class="brand" href="' +
          homeUrl +
          '">' +
          '<span class="brand-mark"><span class="material-symbols-outlined">' +
          portalIcon +
          "</span></span>" +
          "<span>" +
          brandName +
          '<span class="text-secondary">' +
          brandSuffix +
          "</span> " +
          '<span class="' +
          portalBadgeClass +
          '">' +
          escapeHtml(portalBadge) +
          "</span></span>" +
          "</a>" +
          "</div>" +
          '<div class="dashboard-status hide-md flex items-center gap-2 text-xs text-success">' +
          '<span class="status-dot"></span> ' +
          escapeHtml(statusText) +
          "</div>" +
          '<div class="header-actions">' +
          actionBtnHtml +
          '<button class="icon-btn theme-toggle-btn" id="themeToggleBtn" type="button" aria-label="Chuyển chế độ sáng / tối" title="Chuyển sang giao diện Sáng">' +
          '<span class="material-symbols-outlined theme-toggle-icon">light_mode</span>' +
          "</button>" +
          '<button class="icon-btn" id="headerNotifBtn" type="button" aria-label="Thông báo" title="Thông báo hệ thống">' +
          '<span class="material-symbols-outlined">notifications</span>' +
          '<span class="badge badge-counter">3</span>' +
          "</button>" +
          '<a class="avatar" href="' +
          profileUrl +
          '" title="' +
          (user ? escapeHtml(user.fullName || user.name) : "Tài khoản") +
          '">' +
          '<span class="material-symbols-outlined">' +
          (isAdmin ? "shield_person" : "store") +
          "</span>" +
          "</a>" +
          "</div>" +
          "</div>" +
          "</header>"
        );
      }

      /* ----- 3. BIẾN THỂ MARKETPLACE (Mặc định: Trang mua sắm đầy đủ) ----- */
      var searchQuery = options.searchQuery || "";
      var badgeMarketplace = options.badgeText || "v3.2";

      return (
        '<header class="site-header site-header--marketplace" id="siteHeader">' +
        '<div class="container">' +
        '<a class="brand" href="' +
        homeUrl +
        '">' +
        '<span class="brand-mark"><span class="material-symbols-outlined">token</span></span>' +
        "<span>HYBRID" +
        '<span class="text-secondary">.STORE</span> ' +
        '<span class="badge">' +
        escapeHtml(badgeMarketplace) +
        "</span>" +
        '<small><span class="status-dot"></span> Hàng Mới 100% &amp; Đồ Cũ Tuyển Chọn</small>' +
        "</span>" +
        "</a>" +
        '<div class="header-search">' +
        '<form class="header-search-form" id="headerSearchForm" action="' +
        catalogUrl +
        '" method="GET" style="margin: 0; width: 100%;">' +
        '<div class="input-group">' +
        '<span class="icon-left material-symbols-outlined">search</span>' +
        '<input id="headerSearchInput" name="q" class="input input-search" type="search" autocomplete="off" ' +
        'value="' +
        escapeHtml(searchQuery) +
        '" ' +
        'placeholder="Tìm kiếm sản phẩm, thương hiệu (iPhone, Nike, Sony, Dyson...)" />' +
        "</div>" +
        "</form>" +
        '<div class="search-dropdown" id="searchDropdown" style="display: none;"></div>' +
        "</div>" +
        '<div class="header-actions">' +
        '<div class="wallet-pill hide-sm">' +
        '<span class="material-symbols-outlined text-secondary">account_balance_wallet</span>' +
        "<div><small>Giao hàng toàn quốc</small><strong>Miễn Phí 0₫</strong></div>" +
        "</div>" +
        '<a class="btn btn-danger btn-sm" id="btnHeaderPost" href="' +
        postItemUrl +
        '">' +
        '<span class="material-symbols-outlined icon-sm">add_circle</span>' +
        '<span class="hide-md">Đăng Bán Đồ Cũ</span>' +
        "</a>" +
        '<button class="icon-btn theme-toggle-btn" id="themeToggleBtn" type="button" aria-label="Chuyển chế độ sáng / tối" title="Chuyển sang giao diện Sáng">' +
        '<span class="material-symbols-outlined theme-toggle-icon">light_mode</span>' +
        "</button>" +
        '<a class="icon-btn" href="' +
        cartUrl +
        '" aria-label="Giỏ hàng" title="Giỏ hàng">' +
        '<span class="material-symbols-outlined">shopping_bag</span>' +
        '<span class="badge badge-counter" id="cartCount">0</span>' +
        "</a>" +
        '<a class="avatar" id="avatarBtn" href="' +
        profileUrl +
        '" aria-label="Tài khoản" title="' +
        (user ? escapeHtml(user.fullName || user.name) : "Tài khoản") +
        '">' +
        '<span class="material-symbols-outlined">person</span>' +
        "</a>" +
        "</div>" +
        "</div>" +
        "</header>"
      );
    },

    /**
     * Render Header vào target element và tự động gắn các event listener cần thiết
     */
    render: function (target, options) {
      if (typeof document === "undefined") return;
      var el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;

      var html = Header.createHTML(options);
      // Nếu target chính là <header class="site-header"> thì thay thế outerHTML hoặc innerHTML
      if (el.tagName && el.tagName.toLowerCase() === "header") {
        el.outerHTML = html;
      } else {
        el.innerHTML = html;
      }

      Header.bindEvents();
    },

    /**
     * Gắn các event lắng nghe: Theme Toggle, Cart Sync, Mobile Sidebar Toggle
     */
    bindEvents: function () {
      if (typeof document === "undefined") return;

      // 1. Đồng bộ Theme nút bấm
      var themeBtn = document.getElementById("themeToggleBtn");
      if (themeBtn && !themeBtn.dataset.bound) {
        themeBtn.dataset.bound = "true";
        themeBtn.addEventListener("click", function () {
          if (
            UtilsRef &&
            UtilsRef.Theme &&
            typeof UtilsRef.Theme.toggle === "function"
          ) {
            UtilsRef.Theme.toggle();
          } else {
            var isLight =
              document.body.classList.contains("light-theme") ||
              document.documentElement.getAttribute("data-theme") === "light";
            var nextTheme = isLight ? "dark" : "light";
            document.body.classList.toggle(
              "light-theme",
              nextTheme === "light",
            );
            document.documentElement.setAttribute("data-theme", nextTheme);
            try {
              localStorage.setItem("hybrid_theme", nextTheme);
            } catch (e) {}
            var icon = themeBtn.querySelector(".theme-toggle-icon");
            if (icon)
              icon.textContent =
                nextTheme === "light" ? "dark_mode" : "light_mode";
          }
        });
      }

      // 2. Đồng bộ giỏ hàng Cart Badge
      if (
        UtilsRef &&
        UtilsRef.Cart &&
        typeof UtilsRef.Cart.syncBadge === "function"
      ) {
        UtilsRef.Cart.syncBadge();
      }

      // 3. Sidebar Toggle cho Dashboard
      var sidebarToggle = document.getElementById("sidebarToggleBtn");
      if (sidebarToggle && !sidebarToggle.dataset.bound) {
        sidebarToggle.dataset.bound = "true";
        sidebarToggle.addEventListener("click", function () {
          var sidebar = document.querySelector(".dash-sidebar");
          if (sidebar) sidebar.classList.toggle("open");
        });
      }
    },
  };

  /* =====================================================================
     TASK [FE] T14: FOOTER CHUNG CHO TOÀN SÀN
     - Cấu trúc 4 cột Responsive:
       1) Thông tin nền tảng & 3 Showroom kiểm định (HN, ĐN, HCM)
       2) Thị trường & Danh mục
       3) Chính sách đồng kiểm, bảo hành, đổi trả
       4) Hỗ trợ 24/7, hotline 1900 8899, phương thức thanh toán an toàn
     ===================================================================== */

  var Footer = {
    /**
     * Tạo mã HTML Footer
     * @param {Object} options
     *   - basePath: đường dẫn tương đối
     */
    createHTML: function (options) {
      options = options || {};
      var bp = detectBasePath(options.basePath);

      var homeUrl = resolveUrl("index.html", bp);
      var catalogUrl = resolveUrl("pages/shop/catalog.html", bp);
      var aboutWebUrl = resolveUrl("pages/info/about-web.html", bp);
      var aboutInspectionUrl = resolveUrl("pages/info/about.html", bp);
      var warrantyUrl = resolveUrl("pages/info/warranty_policy.html", bp);
      var returnUrl = resolveUrl("pages/info/return_policy.html", bp);
      var termsUrl = resolveUrl("pages/info/terms_of_service.html", bp);
      var postItemUrl = resolveUrl("pages/seller/post_item.html", bp);
      var disputeUrl = resolveUrl("pages/buyer/dispute.html", bp);
      var ordersUrl = resolveUrl("pages/buyer/orders.html", bp);
      var adminUrl = resolveUrl("pages/admin/admin_system.html", bp);

      return (
        '<footer class="site-footer" id="siteFooter">' +
        '<div class="container">' +
        '<div class="footer-grid">' +
        /* CỘT 1: THƯƠNG HIỆU & SHOWROOM */
        '<div class="footer-col footer-col--brand">' +
        '<div class="brand mb-3">' +
        '<span class="brand-mark"><span class="material-symbols-outlined text-primary">token</span></span>' +
        '<span>HYBRID<span class="text-secondary">.STORE</span> <span class="badge">v3.2</span></span>' +
        "</div>" +
        '<p class="mb-3 text-sm text-muted">' +
        "Nền tảng thương mại điện tử mua sắm uy tín. Chuyên phân phối hàng mới chính hãng 100% " +
        "và chợ đồ cũ Like New chất lượng cao với giá tiết kiệm nhất." +
        "</p>" +
        '<div class="footer-showrooms text-xs text-muted mb-3">' +
        '<div class="fw-700 text-text mb-1 flex items-center gap-1">' +
        '<span class="material-symbols-outlined icon-sm text-primary">location_on</span> ' +
        "3 Trung Tâm Kỹ Thuật Showroom:" +
        "</div>" +
        "<div>• Hà Nội: Tầng 1, Keangnam Landmark 72, Nam Từ Liêm</div>" +
        "<div>• Đà Nẵng: Tòa FPT Complex, Ngũ Hành Sơn</div>" +
        "<div>• TP.HCM: Tầng trệt, Bitexco Financial Tower, Quận 1</div>" +
        "</div>" +
        '<div class="flex gap-4 mono text-xs">' +
        '<span class="text-success fw-600">● Bảo hành 12-24T</span>' +
        '<span class="text-secondary fw-600">● Đổi trả 7 ngày</span>' +
        "</div>" +
        "</div>" +
        /* CỘT 2: THỊ TRƯỜNG & DANH MỤC */
        '<div class="footer-col">' +
        "<h5>Thị Trường Mua Sắm</h5>" +
        '<ul class="footer-links">' +
        '<li><a href="' +
        catalogUrl +
        '?category=dien-thoai">Điện Thoại &amp; Smartphone</a></li>' +
        '<li><a href="' +
        catalogUrl +
        '?category=laptop">Laptop &amp; MacBook Cao Cấp</a></li>' +
        '<li><a href="' +
        catalogUrl +
        '?category=audio">Tai Nghe &amp; Thiết Bị Âm Thanh</a></li>' +
        '<li><a href="' +
        catalogUrl +
        '?category=camera">Máy Ảnh &amp; Ống Kính Mirrorless</a></li>' +
        '<li><a href="' +
        catalogUrl +
        '?type=mall">Brand Mall — Hàng Mới 100%</a></li>' +
        '<li><a href="' +
        catalogUrl +
        '?type=c2c">Chợ Đồ Cũ Like New Tuyển Chọn</a></li>' +
        "</ul>" +
        "</div>" +
        /* CỘT 3: CHÍNH SÁCH & AN TOÀN */
        '<div class="footer-col">' +
        "<h5>Chính Sách &amp; Hỗ Trợ</h5>" +
        '<ul class="footer-links">' +
        '<li><a href="' +
        aboutWebUrl +
        '">Giới thiệu nền tảng HYBRID.STORE</a></li>' +
        '<li><a href="' +
        aboutInspectionUrl +
        '">Quy trình kiểm định kỹ thuật 15 bước</a></li>' +
        '<li><a href="' +
        warrantyUrl +
        '">Chính sách bảo hành chính hãng</a></li>' +
        '<li><a href="' +
        returnUrl +
        '">Chính sách đổi trả trong 7 ngày</a></li>' +
        '<li><a href="' +
        termsUrl +
        '">Điều khoản dịch vụ sàn</a></li>' +
        '<li><a href="' +
        postItemUrl +
        '">Quy định đăng tin bán đồ cũ C2C</a></li>' +
        "</ul>" +
        "</div>" +
        /* CỘT 4: HỖ TRỢ 24/7 & THANH TOÁN */
        '<div class="footer-col">' +
        "<h5>Hỗ Trợ 24/7</h5>" +
        '<ul class="footer-links mb-3">' +
        '<li class="mono text-secondary fw-700 flex items-center gap-1">' +
        '<span class="material-symbols-outlined icon-sm">call</span> Hotline: 1900 8899 (Miễn phí)' +
        "</li>" +
        '<li class="flex items-center gap-1">' +
        '<span class="material-symbols-outlined icon-sm">mail</span> support@hybridstore.vn' +
        "</li>" +
        '<li><a href="' +
        disputeUrl +
        '">Trung tâm xử lý khiếu nại &amp; Chat</a></li>' +
        '<li><a href="' +
        ordersUrl +
        '">Tra cứu tiến độ đơn hàng</a></li>' +
        '<li><a href="' +
        adminUrl +
        '" class="flex items-center gap-1 text-primary fw-600"><span class="material-symbols-outlined icon-xs">terminal</span> Cổng Master Admin</a></li>' +
        "</ul>" +
        '<div class="footer-payment-methods">' +
        '<div class="text-xs text-muted mb-2 fw-600">Thanh toán &amp; Đồng kiểm:</div>' +
        '<div class="flex flex-wrap gap-2 text-xs">' +
        '<span class="badge badge-secondary">Napas 24/7</span>' +
        '<span class="badge badge-secondary">VietQR</span>' +
        '<span class="badge badge-secondary">COD Đồng Kiểm 100%</span>' +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        /* CHÂN TRANG BẢN QUYỀN */
        '<div class="footer-bottom">' +
        "<span>© 2026 HYBRID.STORE — Bán Hàng Mới &amp; Đồ Cũ Tuyển Chọn. All rights reserved.</span>" +
        '<span class="flex gap-4 items-center">' +
        '<a href="' +
        termsUrl +
        '">Điều Khoản Dịch Vụ</a>' +
        '<a href="' +
        warrantyUrl +
        '">Chính Sách Bảo Hành</a>' +
        '<a href="' +
        returnUrl +
        '">Chính Sách Đổi Trả</a>' +
        '<a href="' +
        adminUrl +
        '" class="text-primary fw-600">⚡ Master Admin</a>' +
        "</span>" +
        "</div>" +
        "</div>" +
        "</footer>"
      );
    },

    render: function (target, options) {
      if (typeof document === "undefined") return;
      var el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      var html = Footer.createHTML(options);
      if (el.tagName && el.tagName.toLowerCase() === "footer") {
        el.outerHTML = html;
      } else {
        el.innerHTML = html;
      }
    },
  };

  /* =====================================================================
     TASK [FE] T14: BREADCRUMB CHUẨN ARIA & SEO
     ===================================================================== */

  var Breadcrumb = {
    /**
     * Tạo mã HTML Breadcrumb từ mảng danh sách
     * @param {Array} items Danh sách phần tử: [{ label: "Trang Chủ", url: "index.html" }, { label: "Tên SP" }]
     * @param {Object} options { basePath: "" }
     */
    createHTML: function (items, options) {
      if (!Array.isArray(items) || items.length === 0) return "";
      options = options || {};
      var bp = detectBasePath(options.basePath);

      var listItemsHtml = items
        .map(function (item, index) {
          var isLast = index === items.length - 1;
          var label =
            typeof item === "string" ? item : item.label || item.name || "";
          var rawUrl = typeof item === "object" ? item.url : null;
          var url = rawUrl ? resolveUrl(rawUrl, bp) : null;

          if (isLast || !url) {
            return (
              '<li class="breadcrumb-item active" aria-current="page">' +
              escapeHtml(label) +
              "</li>"
            );
          }
          return (
            '<li class="breadcrumb-item"><a href="' +
            url +
            '">' +
            escapeHtml(label) +
            "</a></li>"
          );
        })
        .join("");

      return (
        '<nav class="breadcrumb-nav" aria-label="Đường dẫn trang">' +
        '<ol class="breadcrumb">' +
        listItemsHtml +
        "</ol>" +
        "</nav>"
      );
    },

    render: function (target, items, options) {
      if (typeof document === "undefined") return;
      var el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.innerHTML = Breadcrumb.createHTML(items, options);
    },
  };

  /* =====================================================================
     TASK [FE] T14: RENDER PRODUCT CARD (Brand Mall & Chợ Đồ Cũ C2C)
     ===================================================================== */

  var ProductCard = {
    /**
     * Tạo mã HTML cho một thẻ sản phẩm
     * @param {Object} p Thông tin sản phẩm từ mock_data
     * @param {Object} options { basePath: "", context: "catalog"|"home"|"flash" }
     */
    createHTML: function (p, options) {
      if (!p) return "";
      options = options || {};
      var bp = detectBasePath(options.basePath);
      var isMall = p.type === "mall";
      var title = p.short || p.name || "Sản phẩm";
      var detailUrl = isMall
        ? resolveUrl(
            "pages/shop/product_new.html?id=" + encodeURIComponent(p.id),
            bp,
          )
        : resolveUrl(
            "pages/shop/product_used.html?id=" + encodeURIComponent(p.id),
            bp,
          );
      var imgUrl = resolveUrl(p.img || "", bp);

      var formattedPrice = formatMoney(p.price);
      var formattedOldPrice = p.oldPrice ? formatMoney(p.oldPrice) : "";
      var starsHtml = getRatingStars(p.rating || 5.0);
      var ratingNumber = p.rating ? Number(p.rating).toFixed(1) : "5.0";

      /* ----- THẺ SẢN PHẨM BRAND MALL (Hàng mới 100%) ----- */
      if (isMall) {
        return (
          '<article class="product-card" data-id="' +
          escapeHtml(p.id) +
          '" data-type="mall">' +
          '<div class="product-media">' +
          '<a href="' +
          detailUrl +
          '">' +
          '<img src="' +
          imgUrl +
          '" alt="' +
          escapeHtml(title) +
          '" loading="lazy">' +
          "</a>" +
          '<div class="product-tags">' +
          '<span class="badge badge-solid">' +
          escapeHtml(p.badge || "CHÍNH HÃNG MALL") +
          "</span>" +
          (p.off
            ? '<span class="badge badge-success">-' + p.off + "%</span>"
            : "") +
          "</div>" +
          '<button class="product-wishlist-btn" type="button" data-action="wishlist" data-id="' +
          escapeHtml(p.id) +
          '" aria-label="Yêu thích" title="Lưu vào danh sách yêu thích">' +
          '<span class="material-symbols-outlined">favorite_border</span>' +
          "</button>" +
          (p.tag
            ? '<span class="media-tag">' + escapeHtml(p.tag) + "</span>"
            : "") +
          "</div>" +
          '<div class="product-body">' +
          '<span class="product-cat text-primary">' +
          escapeHtml(p.sub || "CHÍNH HÃNG 100%") +
          "</span>" +
          '<h3 class="product-name line-clamp-2" title="' +
          escapeHtml(p.name) +
          '">' +
          '<a href="' +
          detailUrl +
          '" class="text-hover-primary">' +
          escapeHtml(p.name) +
          "</a>" +
          "</h3>" +
          '<div class="stars-container">' +
          starsHtml +
          "</div>" +
          '<div class="product-price mt-2">' +
          '<span class="price">' +
          formattedPrice +
          "</span>" +
          (formattedOldPrice
            ? '<span class="price-old">' + formattedOldPrice + "</span>"
            : "") +
          "</div>" +
          "</div>" +
          '<div class="product-actions">' +
          '<button class="btn btn-outlined btn-sm" type="button" data-action="add-cart" data-id="' +
          escapeHtml(p.id) +
          '" title="Thêm vào giỏ hàng">' +
          '<span class="material-symbols-outlined icon-sm">add_shopping_cart</span> Thêm Vào Giỏ' +
          "</button>" +
          '<button class="btn btn-primary btn-sm" type="button" data-action="buy" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<span class="material-symbols-outlined icon-sm">bolt</span> Mua Ngay' +
          "</button>" +
          "</div>" +
          "</article>"
        );
      }

      /* ----- THẺ SẢN PHẨM C2C (Đồ cũ Like New tuyển chọn) ----- */
      var discount = p.oldPrice
        ? Math.round((1 - p.price / p.oldPrice) * 100)
        : 0;
      var savedAmount = p.oldPrice ? p.oldPrice - p.price : 0;
      var badgeCls = p.limited
        ? "badge badge-limited"
        : "badge badge-solid-secondary";

      return (
        '<article class="product-card" data-id="' +
        escapeHtml(p.id) +
        '" data-type="c2c">' +
        '<div class="product-media">' +
        '<a href="' +
        detailUrl +
        '">' +
        '<img src="' +
        imgUrl +
        '" alt="' +
        escapeHtml(title) +
        '" loading="lazy">' +
        "</a>" +
        '<div class="product-tags">' +
        '<span class="' +
        badgeCls +
        '">' +
        escapeHtml(p.badge || "ĐỒ CŨ LIKE NEW") +
        "</span>" +
        (discount > 0
          ? '<span class="badge badge-success">Rẻ hơn đồ mới ' +
            discount +
            "%</span>"
          : "") +
        '<span class="badge badge-secondary">' +
        escapeHtml(p.condText || p.cond + "% Mới") +
        "</span>" +
        "</div>" +
        (p.tag
          ? '<span class="media-tag">' + escapeHtml(p.tag) + "</span>"
          : "") +
        "</div>" +
        '<div class="product-body">' +
        '<div class="cond">' +
        '<div class="progress-label"><span>' +
        escapeHtml(p.condPrefix || "Độ mới") +
        ": <strong>" +
        escapeHtml(p.condLabel || p.cond + "%") +
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
        escapeHtml(p.seller || p.sellerName || "Người bán uy tín") +
        "</span>" +
        "</div>" +
        '<h3 class="product-name line-clamp-2" title="' +
        escapeHtml(p.name) +
        '">' +
        '<a href="' +
        detailUrl +
        '" class="text-hover-primary">' +
        escapeHtml(p.name) +
        "</a>" +
        "</h3>" +
        '<div class="product-price mt-2">' +
        '<span class="price">' +
        formattedPrice +
        "</span>" +
        (formattedOldPrice
          ? '<span class="price-old" title="Giá hàng mới 100%">Giá mới: ' +
            formattedOldPrice +
            "</span>"
          : "") +
        "</div>" +
        (discount > 0
          ? '<div class="text-xs text-success fw-600 mt-1">Tiết kiệm ' +
            discount +
            "% (" +
            formatMoney(savedAmount) +
            ") so với mua mới</div>"
          : "") +
        "</div>" +
        '<div class="product-actions c2c-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">' +
        '<button class="btn btn-outlined btn-sm" type="button" data-action="add-cart" data-id="' +
        escapeHtml(p.id) +
        '" title="Thêm vào giỏ hàng">' +
        '<span class="material-symbols-outlined icon-sm">add_shopping_cart</span> Thêm Vào Giỏ' +
        "</button>" +
        '<button class="btn btn-primary btn-sm" type="button" data-action="buy" data-id="' +
        escapeHtml(p.id) +
        '">' +
        '<span class="material-symbols-outlined icon-sm">bolt</span> Mua Ngay' +
        "</button>" +
        '<button class="btn btn-secondary btn-sm" type="button" data-action="offer" data-id="' +
        escapeHtml(p.id) +
        '" style="grid-column: span 2;" title="Thương lượng giá trực tiếp">' +
        '<span class="material-symbols-outlined icon-sm">handshake</span> Trả Giá Với Người Bán' +
        "</button>" +
        "</div>" +
        "</article>"
      );
    },

    render: function (target, product, options) {
      if (typeof document === "undefined") return;
      var el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.innerHTML = ProductCard.createHTML(product, options);
    },
  };

  /* =====================================================================
     XUẤT RA TOÀN CỤC & TỰ ĐỘNG KHỞI TẠO (AUTO-INIT)
     ===================================================================== */

  var Components = {
    detectBasePath: detectBasePath,
    resolveUrl: resolveUrl,
    Header: Header,
    Footer: Footer,
    Breadcrumb: Breadcrumb,
    ProductCard: ProductCard,

    // Shortcut API trực quan
    renderHeader: function (target, options) {
      return Header.render(target, options);
    },
    renderFooter: function (target, options) {
      return Footer.render(target, options);
    },
    renderBreadcrumb: function (target, items, options) {
      return Breadcrumb.render(target, items, options);
    },
    renderProductCard: function (product, options) {
      return ProductCard.createHTML(product, options);
    },

    /**
     * Tự động quét và render các container có đánh dấu data-component
     */
    initAuto: function () {
      if (typeof document === "undefined") return;

      // Quét Header tự động
      var headerEl = document.querySelector('[data-component="header"]');
      if (headerEl) {
        var variant =
          headerEl.getAttribute("data-variant") || Header.MARKETPLACE;
        var title = headerEl.getAttribute("data-title") || "";
        Header.render(headerEl, { variant: variant, title: title });
      }

      // Quét Footer tự động
      var footerEl = document.querySelector('[data-component="footer"]');
      if (footerEl) {
        Footer.render(footerEl);
      }

      // Quét Breadcrumb tự động
      var breadcrumbEl = document.querySelector(
        '[data-component="breadcrumb"]',
      );
      if (breadcrumbEl && breadcrumbEl.getAttribute("data-items")) {
        try {
          var items = JSON.parse(breadcrumbEl.getAttribute("data-items"));
          Breadcrumb.render(breadcrumbEl, items);
        } catch (e) {}
      }
    },
  };

  // Tự động chạy khi DOM sẵn sàng trong trình duyệt
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        Components.initAuto();
      });
    } else {
      Components.initAuto();
    }
  }

  return Components;
});
