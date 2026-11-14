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
        '<button class="icon-btn" id="headerNotifBtn" type="button" aria-label="Thông báo" title="Thông báo hệ thống">' +
        '<span class="material-symbols-outlined">notifications</span>' +
        '<span class="badge badge-counter" id="notifBadge">3</span>' +
        "</button>" +
        '<a class="icon-btn" href="' +
        cartUrl +
        '" id="headerCartBtn" data-action="open-drawer-cart" aria-label="Giỏ hàng" title="Giỏ hàng">' +
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
      var privacyUrl = resolveUrl("pages/info/privacy_policy.html", bp);
      var postItemUrl = resolveUrl("pages/seller/post_item.html", bp);
      var disputeUrl = resolveUrl("pages/buyer/dispute.html", bp);
      var ordersUrl = resolveUrl("pages/buyer/orders.html", bp);

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
        privacyUrl +
        '">Chính sách bảo mật dữ liệu</a></li>' +
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
        '<span class="flex gap-4 items-center flex-wrap">' +
        '<a href="' +
        termsUrl +
        '">Điều Khoản Dịch Vụ</a>' +
        '<a href="' +
        privacyUrl +
        '">Chính Sách Bảo Mật</a>' +
        '<a href="' +
        warrantyUrl +
        '">Chính Sách Bảo Hành</a>' +
        '<a href="' +
        returnUrl +
        '">Chính Sách Đổi Trả</a>' +
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

      var isFav =
        UtilsRef &&
        UtilsRef.Wishlist &&
        typeof UtilsRef.Wishlist.has === "function" &&
        UtilsRef.Wishlist.has(p.id);
      var favIcon = isFav ? "favorite" : "favorite_border";
      var favClass = isFav
        ? "product-wishlist-btn active"
        : "product-wishlist-btn";

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
          '<button class="' +
          favClass +
          '" type="button" data-action="wishlist" data-id="' +
          escapeHtml(p.id) +
          '" aria-label="Yêu thích" title="Lưu vào danh sách yêu thích">' +
          '<span class="material-symbols-outlined">' +
          favIcon +
          "</span>" +
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
        '<button class="' +
        favClass +
        '" type="button" data-action="wishlist" data-id="' +
        escapeHtml(p.id) +
        '" aria-label="Yêu thích" title="Lưu vào danh sách yêu thích">' +
        '<span class="material-symbols-outlined">' +
        favIcon +
        "</span>" +
        "</button>" +
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
     TASK: SLIDE-OVER DRAWER CART (Mini-Cart Trượt Phải Chuẩn TMĐT)
     ===================================================================== */
  var DrawerCart = {
    createHTML: function (options) {
      options = options || {};
      var bp = detectBasePath(options.basePath);
      var cartUrl = resolveUrl("pages/shop/cart.html", bp);
      var checkoutUrl = resolveUrl("pages/shop/checkout.html", bp);

      return (
        '<div class="drawer-cart-backdrop" id="drawerCartBackdrop"></div>' +
        '<aside class="drawer-cart" id="drawerCart" aria-label="Giỏ hàng trượt">' +
        '  <div class="drawer-cart-header">' +
        '    <div class="drawer-cart-title">' +
        '      <span class="material-symbols-outlined text-primary">shopping_bag</span>' +
        '      <h3>Giỏ Hàng (<span id="drawerCartItemCount">0</span>)</h3>' +
        "    </div>" +
        '    <button class="icon-btn drawer-cart-close" id="drawerCartClose" type="button" aria-label="Đóng giỏ hàng">' +
        '      <span class="material-symbols-outlined">close</span>' +
        "    </button>" +
        "  </div>" +
        '  <div class="drawer-cart-freeship" id="drawerCartFreeship">' +
        '    <div class="freeship-text">' +
        '      <span class="material-symbols-outlined icon-xs text-secondary">local_shipping</span>' +
        '      <span id="drawerFreeshipMsg">Đang tính toán ưu đãi freeship...</span>' +
        "    </div>" +
        '    <div class="progress progress-secondary" id="drawerFreeshipProgress" style="--value: 0%; height: 6px;"><div class="progress-bar"></div></div>' +
        "  </div>" +
        '  <div class="drawer-cart-body" id="drawerCartBody">' +
        "  </div>" +
        '  <div class="drawer-cart-footer" id="drawerCartFooter">' +
        '    <div class="drawer-cart-subtotal">' +
        '      <span class="text-muted">Tạm tính:</span>' +
        '      <strong id="drawerCartTotal" class="text-primary fs-lg mono">0₫</strong>' +
        "    </div>" +
        '    <div class="drawer-cart-notice text-xs text-muted mb-3">' +
        '      <span class="material-symbols-outlined icon-xs text-success">verified</span> Đồng kiểm khi nhận • 15 ngày đổi trả' +
        "    </div>" +
        '    <div class="drawer-cart-actions">' +
        '      <a href="' +
        cartUrl +
        '" class="btn btn-outlined w-full" id="drawerCartViewBtn">Xem Giỏ Hàng Chi Tiết</a>' +
        '      <a href="' +
        checkoutUrl +
        '" class="btn btn-primary w-full" id="drawerCartCheckoutBtn">' +
        '        <span class="material-symbols-outlined icon-sm">bolt</span> Thanh Toán Nhanh' +
        "      </a>" +
        "    </div>" +
        "  </div>" +
        "</aside>"
      );
    },

    render: function (target, options) {
      if (typeof document === "undefined") return;
      var el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.innerHTML = DrawerCart.createHTML(options);
      DrawerCart.bindEvents();
    },

    open: function () {
      if (typeof document === "undefined") return;
      var drawer = document.getElementById("drawerCart");
      var backdrop = document.getElementById("drawerCartBackdrop");
      if (!drawer) {
        var div = document.createElement("div");
        div.id = "drawerCartWrapper";
        div.innerHTML = DrawerCart.createHTML();
        document.body.appendChild(div);
        DrawerCart.bindEvents();
        drawer = document.getElementById("drawerCart");
        backdrop = document.getElementById("drawerCartBackdrop");
      }
      DrawerCart.update();
      if (drawer) drawer.classList.add("active");
      if (backdrop) backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    },

    close: function () {
      if (typeof document === "undefined") return;
      var drawer = document.getElementById("drawerCart");
      var backdrop = document.getElementById("drawerCartBackdrop");
      if (drawer) drawer.classList.remove("active");
      if (backdrop) backdrop.classList.remove("active");
      document.body.style.overflow = "";
    },

    toggle: function () {
      var drawer = document.getElementById("drawerCart");
      if (drawer && drawer.classList.contains("active")) {
        DrawerCart.close();
      } else {
        DrawerCart.open();
      }
    },

    update: function () {
      if (typeof document === "undefined") return;
      var cartBody = document.getElementById("drawerCartBody");
      var countEl = document.getElementById("drawerCartItemCount");
      var totalEl = document.getElementById("drawerCartTotal");
      var freeshipMsg = document.getElementById("drawerFreeshipMsg");
      var freeshipProg = document.getElementById("drawerFreeshipProgress");
      var footer = document.getElementById("drawerCartFooter");

      if (!cartBody) return;

      var items =
        UtilsRef &&
        UtilsRef.Cart &&
        typeof UtilsRef.Cart.getItems === "function"
          ? UtilsRef.Cart.getItems()
          : [];
      var total =
        UtilsRef &&
        UtilsRef.Cart &&
        typeof UtilsRef.Cart.getTotal === "function"
          ? UtilsRef.Cart.getTotal()
          : 0;
      var count = items.reduce(function (sum, it) {
        return sum + (it.qty || 1);
      }, 0);

      if (countEl) countEl.textContent = count;
      if (totalEl) totalEl.textContent = formatMoney(total);

      // Mức miễn phí vận chuyển 500.000₫
      var freeShipLimit = 500000;
      if (freeshipMsg && freeshipProg) {
        if (total >= freeShipLimit && total > 0) {
          freeshipMsg.innerHTML =
            '🎉 Bạn được <strong class="text-success">Miễn Phí Vận Chuyển Toàn Quốc!</strong>';
          freeshipProg.style.setProperty("--value", "100%");
        } else {
          var remaining = freeShipLimit - total;
          var pct = Math.min(100, Math.round((total / freeShipLimit) * 100));
          freeshipMsg.innerHTML =
            'Mua thêm <strong class="text-secondary">' +
            formatMoney(remaining) +
            "</strong> để được <strong>Freeship Toàn Quốc</strong>";
          freeshipProg.style.setProperty("--value", pct + "%");
        }
      }

      if (items.length === 0) {
        var bp = detectBasePath();
        var catalogUrl = resolveUrl("pages/shop/catalog.html", bp);
        cartBody.innerHTML =
          '<div class="drawer-cart-empty text-center py-6">' +
          '  <span class="material-symbols-outlined text-muted" style="font-size: 48px;">shopping_bag</span>' +
          '  <h4 class="mt-2 mb-1 text-sm fw-700">Giỏ hàng của bạn đang trống</h4>' +
          '  <p class="text-xs text-muted mb-4">Hãy chọn thêm sản phẩm chính hãng Brand Mall hoặc đồ cũ Like New kiểm định 15 bước.</p>' +
          '  <a href="' +
          catalogUrl +
          '" class="btn btn-primary btn-sm" onclick="Components.DrawerCart.close()">' +
          '    <span class="material-symbols-outlined icon-sm">storefront</span> Khám Phá Sản Phẩm Ngay' +
          "  </a>" +
          "</div>";
        if (footer) footer.style.display = "none";
        return;
      }

      if (footer) footer.style.display = "block";

      var bp = detectBasePath();
      var html = items
        .map(function (item) {
          var prod = item.product || {};
          var name = prod.name || prod.title || "Sản phẩm";
          var price = item.price || prod.price || 0;
          var img = resolveUrl(prod.img || "", bp);
          var isMall = prod.type === "mall";
          var badgeText = isMall
            ? "Brand Mall"
            : prod.condText || (prod.cond ? prod.cond + "% Mới" : "Like New");
          var badgeClass = isMall
            ? "badge badge-solid"
            : "badge badge-secondary";
          var variantText = item.variant
            ? '<span class="text-xs text-muted block mt-0.5">' +
              escapeHtml(item.variant) +
              "</span>"
            : "";
          var detailUrl = isMall
            ? resolveUrl(
                "pages/shop/product_new.html?id=" + encodeURIComponent(prod.id),
                bp,
              )
            : resolveUrl(
                "pages/shop/product_used.html?id=" +
                  encodeURIComponent(prod.id),
                bp,
              );

          return (
            '<div class="drawer-cart-item" data-id="' +
            escapeHtml(prod.id) +
            '" data-variant="' +
            escapeHtml(item.variant || "") +
            '">' +
            '  <a href="' +
            detailUrl +
            '" class="drawer-cart-item-img">' +
            '    <img src="' +
            img +
            '" alt="' +
            escapeHtml(name) +
            '" loading="lazy" />' +
            "  </a>" +
            '  <div class="drawer-cart-item-info">' +
            '    <div class="flex items-center gap-1 mb-1">' +
            '      <span class="' +
            badgeClass +
            '" style="font-size: 10px; padding: 1px 5px;">' +
            escapeHtml(badgeText) +
            "</span>" +
            "    </div>" +
            '    <h5 class="drawer-cart-item-name line-clamp-2 text-xs fw-600 m-0">' +
            '      <a href="' +
            detailUrl +
            '" class="text-hover-primary">' +
            escapeHtml(name) +
            "</a>" +
            "    </h5>" +
            variantText +
            '    <div class="drawer-cart-item-price mono text-primary fw-700 mt-1">' +
            formatMoney(price) +
            "</div>" +
            '    <div class="drawer-cart-item-row mt-2 flex items-center justify-between">' +
            '      <div class="qty-stepper">' +
            '        <button type="button" class="qty-btn" data-action="drawer-minus" aria-label="Giảm số lượng">-</button>' +
            '        <span class="qty-value mono">' +
            (item.qty || 1) +
            "</span>" +
            '        <button type="button" class="qty-btn" data-action="drawer-plus" aria-label="Tăng số lượng">+</button>' +
            "      </div>" +
            '      <button type="button" class="drawer-item-del-btn" data-action="drawer-delete" aria-label="Xóa sản phẩm" title="Xóa khỏi giỏ hàng">' +
            '        <span class="material-symbols-outlined icon-sm">delete_outline</span>' +
            "      </button>" +
            "    </div>" +
            "  </div>" +
            "</div>"
          );
        })
        .join("");

      cartBody.innerHTML = html;
    },

    bindEvents: function () {
      if (typeof document === "undefined") return;
      var closeBtn = document.getElementById("drawerCartClose");
      if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = "true";
        closeBtn.addEventListener("click", DrawerCart.close);
      }

      var backdrop = document.getElementById("drawerCartBackdrop");
      if (backdrop && !backdrop.dataset.bound) {
        backdrop.dataset.bound = "true";
        backdrop.addEventListener("click", DrawerCart.close);
      }

      var cartBody = document.getElementById("drawerCartBody");
      if (cartBody && !cartBody.dataset.bound) {
        cartBody.dataset.bound = "true";
        cartBody.addEventListener("click", function (e) {
          var btn = e.target.closest("button");
          if (!btn) return;
          var action = btn.getAttribute("data-action");
          var itemEl = btn.closest(".drawer-cart-item");
          if (!itemEl) return;
          var id = itemEl.getAttribute("data-id");
          var variant = itemEl.getAttribute("data-variant") || undefined;

          if (action === "drawer-minus") {
            if (UtilsRef && UtilsRef.Cart) {
              var items = UtilsRef.Cart.getItems();
              var found = items.find(function (it) {
                return (
                  String(it.id) === String(id) &&
                  (variant ? it.variant === variant : true)
                );
              });
              if (found) {
                if (found.qty > 1) {
                  UtilsRef.Cart.updateQty(id, found.qty - 1, variant);
                } else {
                  UtilsRef.Cart.removeItem(id, variant);
                }
                DrawerCart.update();
              }
            }
          } else if (action === "drawer-plus") {
            if (UtilsRef && UtilsRef.Cart) {
              var items = UtilsRef.Cart.getItems();
              var found = items.find(function (it) {
                return (
                  String(it.id) === String(id) &&
                  (variant ? it.variant === variant : true)
                );
              });
              if (found) {
                UtilsRef.Cart.updateQty(id, found.qty + 1, variant);
                DrawerCart.update();
              }
            }
          } else if (action === "drawer-delete") {
            if (UtilsRef && UtilsRef.Cart) {
              UtilsRef.Cart.removeItem(id, variant);
              DrawerCart.update();
            }
          }
        });
      }

      if (!window.__drawerCartEscBound) {
        window.__drawerCartEscBound = true;
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape") DrawerCart.close();
        });
      }
    },
  };

  /* =====================================================================
     TASK: AUTOCOMPLETE SEARCH VỚI LIVE PREVIEW & GỢI Ý THÔNG MINH
     ===================================================================== */
  var AutocompleteSearch = {
    RECENT_KEY: "hv_recent_searches",
    TRENDING: [
      "iPhone 15 Pro Max",
      "MacBook Pro M3",
      "Sony WH-1000XM5",
      "iPad Pro M2",
      "Dyson V12 Detect",
      "Giày Nike Air Max",
      "Samsung Galaxy S24 Ultra",
    ],

    getRecent: function () {
      if (typeof localStorage === "undefined") return [];
      try {
        return (
          JSON.parse(localStorage.getItem(AutocompleteSearch.RECENT_KEY)) || []
        );
      } catch (e) {
        return [];
      }
    },

    addRecent: function (query) {
      if (!query || typeof localStorage === "undefined") return;
      var q = String(query).trim();
      if (!q) return;
      var list = AutocompleteSearch.getRecent();
      list = list.filter(function (item) {
        return item.toLowerCase() !== q.toLowerCase();
      });
      list.unshift(q);
      if (list.length > 5) list = list.slice(0, 5);
      try {
        localStorage.setItem(
          AutocompleteSearch.RECENT_KEY,
          JSON.stringify(list),
        );
      } catch (e) {}
    },

    clearRecent: function () {
      if (typeof localStorage === "undefined") return;
      try {
        localStorage.removeItem(AutocompleteSearch.RECENT_KEY);
      } catch (e) {}
    },

    createDropdownHTML: function (query, options) {
      options = options || {};
      var bp = detectBasePath(options.basePath);
      var q = (query || "").trim();

      // Khi chưa gõ đủ 2 ký tự: Hiển thị Tìm kiếm gần đây & Xu hướng
      if (!q || q.length < 2) {
        var recents = AutocompleteSearch.getRecent();
        var recentHtml = "";
        if (recents.length > 0) {
          var itemsHtml = recents
            .map(function (item) {
              return (
                '<button type="button" class="search-recent-item" data-query="' +
                escapeHtml(item) +
                '">' +
                '  <span class="material-symbols-outlined icon-xs text-muted">history</span>' +
                '  <span class="search-recent-text">' +
                escapeHtml(item) +
                "</span>" +
                "</button>"
              );
            })
            .join("");
          recentHtml =
            '<div class="search-drop-section">' +
            '  <div class="search-drop-title flex items-center justify-between">' +
            "    <span>Tìm Kiếm Gần Đây</span>" +
            '    <button type="button" class="search-clear-recent-btn" id="searchClearRecentBtn">Xóa tất cả</button>' +
            "  </div>" +
            '  <div class="search-recent-list">' +
            itemsHtml +
            "</div>" +
            "</div>";
        }

        var trendingHtml = AutocompleteSearch.TRENDING.map(function (t, idx) {
          return (
            '<button type="button" class="search-trending-item" data-query="' +
            escapeHtml(t) +
            '">' +
            '  <span class="trending-rank">' +
            (idx + 1) +
            "</span>" +
            '  <span class="trending-text">' +
            escapeHtml(t) +
            "</span>" +
            '  <span class="material-symbols-outlined icon-xs text-danger">trending_up</span>' +
            "</button>"
          );
        }).join("");

        return (
          '<div class="search-drop-wrapper">' +
          recentHtml +
          '<div class="search-drop-section">' +
          '  <div class="search-drop-title">' +
          '    <span class="material-symbols-outlined icon-xs text-secondary">local_fire_department</span>' +
          "    <span>Từ Khóa Xu Hướng Hôm Nay</span>" +
          "  </div>" +
          '  <div class="search-trending-grid">' +
          trendingHtml +
          "</div>" +
          "</div>" +
          "</div>"
        );
      }

      // Khi người dùng đã gõ từ khóa: Tìm kiếm sản phẩm trực tiếp từ PRODUCTS
      var prods =
        typeof window !== "undefined" && window.PRODUCTS ? window.PRODUCTS : [];
      var lowerQ = q.toLowerCase();
      var matches = prods
        .filter(function (p) {
          var name = (p.name || "").toLowerCase();
          var cat = (p.category || "").toLowerCase();
          var sub = (p.sub || "").toLowerCase();
          return (
            name.indexOf(lowerQ) !== -1 ||
            cat.indexOf(lowerQ) !== -1 ||
            sub.indexOf(lowerQ) !== -1
          );
        })
        .slice(0, 5);

      var catalogUrl = resolveUrl(
        "pages/shop/catalog.html?q=" + encodeURIComponent(q),
        bp,
      );

      if (matches.length === 0) {
        return (
          '<div class="search-drop-wrapper p-4 text-center">' +
          '  <span class="material-symbols-outlined text-muted" style="font-size: 32px;">search_off</span>' +
          '  <p class="text-xs text-muted mt-2 mb-3">Không tìm thấy sản phẩm khớp với "<strong>' +
          escapeHtml(q) +
          '</strong>"</p>' +
          '  <a href="' +
          catalogUrl +
          '" class="btn btn-secondary btn-xs">Xem Tất Cả Sản Phẩm Trong Danh Mục</a>' +
          "</div>"
        );
      }

      var itemsHtml = matches
        .map(function (p) {
          var isMall = p.type === "mall";
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
          var badgeText = isMall
            ? "Brand Mall"
            : p.condText || (p.cond ? p.cond + "% Mới" : "Like New");
          var badgeClass = isMall
            ? "badge badge-solid"
            : "badge badge-secondary";

          return (
            '<a href="' +
            detailUrl +
            '" class="search-prod-item" data-name="' +
            escapeHtml(p.name) +
            '">' +
            '  <img src="' +
            imgUrl +
            '" class="search-prod-thumb" alt="' +
            escapeHtml(p.name) +
            '" />' +
            '  <div class="search-prod-info">' +
            '    <div class="flex items-center gap-1 mb-0.5">' +
            '      <span class="' +
            badgeClass +
            '" style="font-size: 9px; padding: 1px 4px;">' +
            escapeHtml(badgeText) +
            "</span>" +
            '      <span class="text-xs text-muted truncate">' +
            escapeHtml(p.sub || "") +
            "</span>" +
            "    </div>" +
            '    <div class="search-prod-title line-clamp-1 text-xs fw-600">' +
            escapeHtml(p.name) +
            "</div>" +
            '    <div class="search-prod-price mono text-primary fw-700 text-xs mt-0.5">' +
            formatMoney(p.price) +
            "</div>" +
            "  </div>" +
            "</a>"
          );
        })
        .join("");

      return (
        '<div class="search-drop-wrapper">' +
        '  <div class="search-drop-section">' +
        '    <div class="search-drop-title">Gợi Ý Sản Phẩm Phù Hợp</div>' +
        '    <div class="search-prod-list">' +
        itemsHtml +
        "</div>" +
        "  </div>" +
        '  <div class="search-drop-foot">' +
        '    <a href="' +
        catalogUrl +
        '" class="search-view-all-link">' +
        '      <span>Xem tất cả kết quả cho "<strong>' +
        escapeHtml(q) +
        '</strong>"</span>' +
        '      <span class="material-symbols-outlined icon-xs">arrow_forward</span>' +
        "    </a>" +
        "  </div>" +
        "</div>"
      );
    },

    bindEvents: function () {
      if (typeof document === "undefined") return;
      var input = document.getElementById("headerSearchInput");
      var dropdown = document.getElementById("searchDropdown");
      var form = document.getElementById("headerSearchForm");
      if (!input || !dropdown) return;

      var debounceTimer = null;

      function renderDrop() {
        var q = input.value.trim();
        dropdown.innerHTML = AutocompleteSearch.createDropdownHTML(q);
        dropdown.style.display = "block";
      }

      input.addEventListener("focus", function () {
        renderDrop();
      });

      input.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderDrop, 180);
      });

      if (form) {
        form.addEventListener("submit", function () {
          var val = input.value.trim();
          if (val) AutocompleteSearch.addRecent(val);
        });
      }

      dropdown.addEventListener("click", function (e) {
        var clearBtn = e.target.closest("#searchClearRecentBtn");
        if (clearBtn) {
          e.preventDefault();
          AutocompleteSearch.clearRecent();
          renderDrop();
          return;
        }

        var recentItem = e.target.closest(
          ".search-recent-item, .search-trending-item",
        );
        if (recentItem) {
          e.preventDefault();
          var query = recentItem.getAttribute("data-query");
          if (query) {
            input.value = query;
            AutocompleteSearch.addRecent(query);
            var bp = detectBasePath();
            window.location.href = resolveUrl(
              "pages/shop/catalog.html?q=" + encodeURIComponent(query),
              bp,
            );
          }
          return;
        }

        var prodItem = e.target.closest(".search-prod-item");
        if (prodItem) {
          var prodName = prodItem.getAttribute("data-name");
          if (prodName) AutocompleteSearch.addRecent(prodName);
        }
      });

      document.addEventListener("click", function (e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = "none";
        }
      });
    },
  };

  /* =====================================================================
     TASK: THANH ĐIỀU HƯỚNG DI ĐỘNG (Mobile Bottom Navigation)
     ===================================================================== */
  var MobileBottomNav = {
    createHTML: function (options) {
      options = options || {};
      var bp = detectBasePath(options.basePath);
      var homeUrl = resolveUrl("index.html", bp);
      var catalogUrl = resolveUrl("pages/shop/catalog.html", bp);
      var postUrl = resolveUrl("pages/seller/post_item.html", bp);
      var cartUrl = resolveUrl("pages/shop/cart.html", bp);
      var profileUrl = resolveUrl("pages/account/profile.html", bp);

      var activeTab = "home";
      if (
        typeof window !== "undefined" &&
        window.location &&
        window.location.pathname
      ) {
        var path = window.location.pathname.toLowerCase();
        if (
          path.indexOf("catalog.html") !== -1 ||
          path.indexOf("product_") !== -1
        )
          activeTab = "catalog";
        else if (path.indexOf("post_item.html") !== -1) activeTab = "post";
        else if (
          path.indexOf("cart.html") !== -1 ||
          path.indexOf("checkout.html") !== -1
        )
          activeTab = "cart";
        else if (
          path.indexOf("profile.html") !== -1 ||
          path.indexOf("auth_") !== -1 ||
          path.indexOf("order_") !== -1
        )
          activeTab = "profile";
      }

      var cartCount = 0;
      if (
        UtilsRef &&
        UtilsRef.Cart &&
        typeof UtilsRef.Cart.count === "function"
      ) {
        cartCount = UtilsRef.Cart.count();
      }

      return (
        '<nav class="mobile-bottom-nav" id="mobileBottomNav" aria-label="Thanh điều hướng di động">' +
        '  <a href="' +
        homeUrl +
        '" class="bottom-nav-item ' +
        (activeTab === "home" ? "active" : "") +
        '">' +
        '    <span class="material-symbols-outlined">home</span>' +
        "    <span>Trang Chủ</span>" +
        "  </a>" +
        '  <a href="' +
        catalogUrl +
        '" class="bottom-nav-item ' +
        (activeTab === "catalog" ? "active" : "") +
        '">' +
        '    <span class="material-symbols-outlined">storefront</span>' +
        "    <span>Cửa Hàng</span>" +
        "  </a>" +
        '  <a href="' +
        postUrl +
        '" class="bottom-nav-item bottom-nav-item--post ' +
        (activeTab === "post" ? "active" : "") +
        '" title="Đăng Bán Đồ Cũ">' +
        '    <div class="post-btn-circle">' +
        '      <span class="material-symbols-outlined">add</span>' +
        "    </div>" +
        "    <span>Đăng Bán</span>" +
        "  </a>" +
        '  <button type="button" class="bottom-nav-item ' +
        (activeTab === "cart" ? "active" : "") +
        '" id="bottomNavCartBtn" aria-label="Giỏ hàng">' +
        '    <div class="bottom-nav-icon-wrap">' +
        '      <span class="material-symbols-outlined">shopping_bag</span>' +
        '      <span class="badge badge-counter" id="bottomNavCartCount">' +
        cartCount +
        "</span>" +
        "    </div>" +
        "    <span>Giỏ Hàng</span>" +
        "  </button>" +
        '  <a href="' +
        profileUrl +
        '" class="bottom-nav-item ' +
        (activeTab === "profile" ? "active" : "") +
        '">' +
        '    <span class="material-symbols-outlined">person</span>' +
        "    <span>Tài Khoản</span>" +
        "  </a>" +
        "</nav>"
      );
    },

    render: function (target, options) {
      if (typeof document === "undefined") return;
      var el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.innerHTML = MobileBottomNav.createHTML(options);
    },

    syncBadge: function () {
      if (typeof document === "undefined") return;
      var countEl = document.getElementById("bottomNavCartCount");
      if (countEl && UtilsRef && UtilsRef.Cart) {
        countEl.textContent = UtilsRef.Cart.count();
      }
    },
  };

  /* =====================================================================
     TASK: NOTIFICATION CENTER (Trung Tâm Thông Báo)
     ===================================================================== */
  var NotificationCenter = {
    NOTIFS: [
      {
        id: "notif-1",
        tab: "order",
        type: "order",
        icon: "local_shipping",
        iconColor: "text-secondary",
        title: "Đơn hàng #HV-9821 đang được vận chuyển",
        desc: "Bưu chính Viettel Post hỏa tốc đang trên đường giao tới bạn. Bưu tá hỗ trợ đồng kiểm bóc hộp.",
        time: "15 phút trước",
        unread: true,
        url: "pages/shop/order_tracking.html",
      },
      {
        id: "notif-2",
        tab: "promo",
        type: "promo",
        icon: "redeem",
        iconColor: "text-warning",
        title: "Tặng voucher 300.000₫ Brand Mall",
        desc: "Áp dụng cho mọi đơn hàng điện tử chính hãng nguyên seal từ 5.000.000₫ trong 48 giờ tới.",
        time: "2 giờ trước",
        unread: true,
        url: "pages/shop/catalog.html",
      },
      {
        id: "notif-3",
        tab: "system",
        type: "system",
        icon: "verified_user",
        iconColor: "text-success",
        title: "Báo cáo kiểm định 15 bước đã hoàn tất",
        desc: "Sản phẩm iPhone 14 Pro Max bạn quan tâm đã vượt qua toàn bộ 15 bài kiểm tra phần cứng & độ zin linh kiện.",
        time: "1 ngày trước",
        unread: false,
        url: "pages/shop/product_used.html",
      },
    ],

    createHTML: function (options) {
      options = options || {};
      var bp = detectBasePath(options.basePath);
      var unreadCount = NotificationCenter.NOTIFS.filter(function (n) {
        return n.unread;
      }).length;

      var itemsHtml = NotificationCenter.NOTIFS.map(function (n) {
        var targetUrl = resolveUrl(n.url, bp);
        return (
          '<a href="' +
          targetUrl +
          '" class="notif-item ' +
          (n.unread ? "unread" : "") +
          '" data-tab="' +
          n.tab +
          '" data-id="' +
          n.id +
          '">' +
          '  <div class="notif-icon-wrap ' +
          n.iconColor +
          '">' +
          '    <span class="material-symbols-outlined icon-sm">' +
          n.icon +
          "</span>" +
          "  </div>" +
          '  <div class="notif-content">' +
          '    <div class="notif-item-title">' +
          escapeHtml(n.title) +
          "</div>" +
          '    <div class="notif-item-desc">' +
          escapeHtml(n.desc) +
          "</div>" +
          '    <div class="notif-item-time text-xs text-muted mt-1">' +
          n.time +
          "</div>" +
          "  </div>" +
          (n.unread ? '  <span class="notif-unread-dot"></span>' : "") +
          "</a>"
        );
      }).join("");

      return (
        '<div class="notif-dropdown" id="notifDropdown" style="display: none;">' +
        '  <div class="notif-header">' +
        "    <div>" +
        '      <h4 class="m-0 text-sm fw-700">Trung Tâm Thông Báo</h4>' +
        '      <small class="text-xs text-muted" id="notifUnreadSummary">' +
        unreadCount +
        " tin chưa đọc</small>" +
        "    </div>" +
        '    <button type="button" class="btn-link text-xs text-primary" id="btnMarkAllNotifsRead">Đã đọc tất cả</button>' +
        "  </div>" +
        '  <div class="notif-tabs">' +
        '    <button type="button" class="notif-tab active" data-tab="all">Tất cả</button>' +
        '    <button type="button" class="notif-tab" data-tab="order">Đơn hàng</button>' +
        '    <button type="button" class="notif-tab" data-tab="promo">Khuyến mãi</button>' +
        '    <button type="button" class="notif-tab" data-tab="system">Hệ thống</button>' +
        "  </div>" +
        '  <div class="notif-list" id="notifList">' +
        itemsHtml +
        "</div>" +
        '  <div class="notif-footer">' +
        '    <a href="' +
        resolveUrl("pages/shop/order_tracking.html", bp) +
        '" class="text-xs text-secondary flex items-center justify-center gap-1 py-2">' +
        "      <span>Kiểm tra lộ trình đơn hàng</span>" +
        '      <span class="material-symbols-outlined icon-xs">arrow_forward</span>' +
        "    </a>" +
        "  </div>" +
        "</div>"
      );
    },

    bindEvents: function () {
      if (typeof document === "undefined") return;
      var btn = document.getElementById("headerNotifBtn");
      if (!btn) return;

      var dropdown = document.getElementById("notifDropdown");
      if (!dropdown) {
        var header = document.getElementById("siteHeader");
        if (header) {
          var container = header.querySelector(".header-actions");
          if (container) {
            var div = document.createElement("div");
            div.style.position = "relative";
            div.innerHTML = NotificationCenter.createHTML();
            container.appendChild(div.firstElementChild);
            dropdown = document.getElementById("notifDropdown");
          }
        }
      }

      if (!btn.dataset.notifBound) {
        btn.dataset.notifBound = "true";
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (dropdown) {
            var isShown = dropdown.style.display === "block";
            dropdown.style.display = isShown ? "none" : "block";
          }
        });
      }

      if (dropdown && !dropdown.dataset.bound) {
        dropdown.dataset.bound = "true";
        document.addEventListener("click", function (e) {
          if (
            !dropdown.contains(e.target) &&
            e.target !== btn &&
            !btn.contains(e.target)
          ) {
            dropdown.style.display = "none";
          }
        });

        var tabs = dropdown.querySelectorAll(".notif-tab");
        tabs.forEach(function (tab) {
          tab.addEventListener("click", function () {
            tabs.forEach(function (t) {
              t.classList.remove("active");
            });
            this.classList.add("active");
            var filter = this.getAttribute("data-tab");
            var items = dropdown.querySelectorAll(".notif-item");
            items.forEach(function (item) {
              if (
                filter === "all" ||
                item.getAttribute("data-tab") === filter
              ) {
                item.style.display = "flex";
              } else {
                item.style.display = "none";
              }
            });
          });
        });

        var markReadBtn = dropdown.querySelector("#btnMarkAllNotifsRead");
        if (markReadBtn) {
          markReadBtn.addEventListener("click", function () {
            dropdown
              .querySelectorAll(".notif-item.unread")
              .forEach(function (el) {
                el.classList.remove("unread");
              });
            dropdown
              .querySelectorAll(".notif-unread-dot")
              .forEach(function (dot) {
                dot.remove();
              });
            var sum = dropdown.querySelector("#notifUnreadSummary");
            if (sum) sum.textContent = "0 tin chưa đọc";
            var badge = btn.querySelector(".badge-counter");
            if (badge) badge.style.display = "none";
          });
        }
      }
    },
  };

  /* =====================================================================
     TASK: FLOATING LIVE CHAT SUPPORT 24/7 (AI Trợ Lý & CSKH)
     ===================================================================== */
  var LiveChat = {
    FAQS: [
      {
        keys: ["15 bước", "kiểm định", "check", "phần cứng", "zin"],
        answer:
          "Quy trình kiểm định 15 bước của HYBRID.STORE bao gồm: 1. Kiểm tra IMEI/Serial chính hãng, 2. Ngoại quan vỏ & viền máy, 3. Màn hình & cảm ứng đa điểm, 4. Độ chai & chu kỳ sạc pin, 5. Cụm camera trước/sau & chống rung, 6. Face ID/Vân tay, 7. Loa thoại & loa ngoài, 8. Mic & thu âm, 9. Cổng sạc & sạc nhanh, 10. Khe SIM & kết nối 4G/5G, 11. Wi-Fi & Bluetooth, 12. Cảm biến tiệm cận & con quay, 13. Phụ kiện đi kèm, 14. Mainboard nguyên bản chưa sửa chữa, 15. Khôi phục cài đặt gốc và dán tem niêm phong kiểm định.",
      },
      {
        keys: ["bảo hành", "đổi trả", "hoàn tiền", "15 ngày"],
        answer:
          "Chính sách bảo hành tại HYBRID.STORE: Với Brand Mall hàng mới 100%: Bảo hành chính hãng ủy quyền từ 12-24 tháng toàn quốc. Với Chợ Đồ Cũ Like New: Bảo hành 6 tháng toàn diện phần cứng từ HYBRID, cam kết bao test 1 đổi 1 trong 15 ngày đầu tiên nếu phát sinh bất kỳ lỗi phần cứng nào từ nhà sản xuất.",
      },
      {
        keys: ["trả giá", "thương lượng", "offer", "giảm giá"],
        answer:
          "Để trả giá với người bán đồ cũ: Quý khách hãy bấm nút [🤝 Trả Giá Với Người Bán] tại trang sản phẩm, sau đó nhập mức giá mong muốn (tối đa giảm 20% so với giá niêm yết). Hệ thống sẽ gửi thông báo đến người bán và người bán sẽ phản hồi chấp thuận hoặc từ chối trong vòng 24 giờ.",
      },
      {
        keys: ["đơn hàng", "vận chuyển", "giao hàng", "shipper", "tra cứu"],
        answer:
          "HYBRID.STORE hợp tác cùng Viettel Post hỏa tốc và GHTK, hỗ trợ giao hàng hỏa tốc trong 120 phút tại nội thành Hà Nội & TP.HCM. Quý khách có thể vào trang [Tra Cứu Đơn Hàng] để xem lộ trình bưu tá theo thời gian thực.",
      },
      {
        keys: ["thanh toán", "napas", "qr", "chuyển khoản", "cod"],
        answer:
          "Chúng tôi hỗ trợ 3 hình thức thanh toán an toàn: 1. Chuyển khoản Napas 24/7 quét mã VietQR tự động khớp lệnh trong 3 giây. 2. Thanh toán thẻ nội địa & quốc tế Visa/Mastercard. 3. Thanh toán tiền mặt khi nhận hàng (COD) sau khi đã đồng kiểm mở hộp cùng bưu tá.",
      },
    ],

    createHTML: function () {
      return (
        '<div class="live-chat-widget" id="liveChatWidget">' +
        '  <button class="live-chat-floating-btn" id="liveChatFloatingBtn" type="button" aria-label="Mở cửa sổ hỗ trợ trực tuyến" title="Hỗ trợ trực tuyến 24/7">' +
        '    <span class="material-symbols-outlined chat-icon">support_agent</span>' +
        '    <span class="material-symbols-outlined close-icon hidden">close</span>' +
        '    <span class="chat-pulse-badge"></span>' +
        "  </button>" +
        '  <div class="live-chat-window" id="liveChatWindow" style="display: none;">' +
        '    <div class="chat-header">' +
        '      <div class="chat-agent-info">' +
        '        <div class="agent-avatar">' +
        '          <span class="material-symbols-outlined">smart_toy</span>' +
        '          <span class="online-indicator"></span>' +
        "        </div>" +
        "        <div>" +
        '          <h5 class="m-0 text-sm fw-700">HYBRID Assistant 24/7</h5>' +
        '          <small class="text-success flex items-center gap-1">● Trực tuyến hỗ trợ ngay</small>' +
        "        </div>" +
        "      </div>" +
        '      <button class="icon-btn icon-btn-sm" id="chatMinimizeBtn" type="button" aria-label="Thu nhỏ">' +
        '        <span class="material-symbols-outlined">close</span>' +
        "      </button>" +
        "    </div>" +
        '    <div class="chat-messages" id="chatMessages">' +
        '      <div class="chat-msg bot-msg">' +
        "        <p>Xin chào quý khách! 👋 Tôi là trợ lý ảo HYBRID.STORE. Quý khách cần hỗ trợ giải đáp về Brand Mall hàng mới hay Chợ Đồ Cũ Like New kiểm định 15 bước?</p>" +
        '        <span class="msg-time">Vừa xong</span>' +
        "      </div>" +
        '      <div class="chat-quick-replies" id="chatQuickReplies">' +
        '        <button type="button" class="quick-pill" data-query="15 bước kiểm định">🔍 15 bước kiểm định đồ cũ</button>' +
        '        <button type="button" class="quick-pill" data-query="Chính sách bảo hành và đổi trả">🛡️ Chính sách bảo hành &amp; đổi trả</button>' +
        '        <button type="button" class="quick-pill" data-query="Cách trả giá với người bán">🤝 Cách trả giá / thương lượng</button>' +
        '        <button type="button" class="quick-pill" data-query="Hình thức thanh toán Napas QR">💳 Thanh toán Napas &amp; QR</button>' +
        "      </div>" +
        "    </div>" +
        '    <form class="chat-input-bar" id="chatForm">' +
        '      <input type="text" id="chatInput" placeholder="Nhập câu hỏi của quý khách..." autocomplete="off" />' +
        '      <button type="submit" class="btn btn-primary btn-sm" id="chatSendBtn" aria-label="Gửi tin">' +
        '        <span class="material-symbols-outlined icon-sm">send</span>' +
        "      </button>" +
        "    </form>" +
        "  </div>" +
        "</div>"
      );
    },

    render: function (target) {
      if (typeof document === "undefined") return;
      var el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return;
      el.innerHTML = LiveChat.createHTML();
      LiveChat.bindEvents();
    },

    getBotReply: function (userText) {
      var lower = (userText || "").toLowerCase();
      for (var i = 0; i < LiveChat.FAQS.length; i++) {
        var faq = LiveChat.FAQS[i];
        for (var k = 0; k < faq.keys.length; k++) {
          if (lower.indexOf(faq.keys[k]) !== -1) {
            return faq.answer;
          }
        }
      }
      return "Cảm ơn quý khách đã gửi câu hỏi. Mọi sản phẩm tại HYBRID.STORE đều được cam kết 100% chính hãng (đối với Brand Mall) hoặc kiểm định kỹ thuật 15 bước độc quyền (đối với Chợ Đồ Cũ). Bưu tá hỗ trợ đồng kiểm bóc hộp trước khi trả tiền. Nếu cần tư vấn viên chuyên sâu, xin vui lòng gọi hotline miễn cước 1900 8899.";
    },

    bindEvents: function () {
      if (typeof document === "undefined") return;
      var floatBtn = document.getElementById("liveChatFloatingBtn");
      var chatWin = document.getElementById("liveChatWindow");
      var minBtn = document.getElementById("chatMinimizeBtn");
      var chatForm = document.getElementById("chatForm");
      var chatInput = document.getElementById("chatInput");
      var chatMsgs = document.getElementById("chatMessages");
      var quickReplies = document.getElementById("chatQuickReplies");

      if (!floatBtn || !chatWin) return;

      function toggleChat() {
        var isShown = chatWin.style.display === "flex";
        chatWin.style.display = isShown ? "none" : "flex";
        var chatIcon = floatBtn.querySelector(".chat-icon");
        var closeIcon = floatBtn.querySelector(".close-icon");
        if (chatIcon) chatIcon.classList.toggle("hidden", !isShown);
        if (closeIcon) closeIcon.classList.toggle("hidden", isShown);
        if (!isShown && chatInput) chatInput.focus();
      }

      if (!floatBtn.dataset.bound) {
        floatBtn.dataset.bound = "true";
        floatBtn.addEventListener("click", toggleChat);
      }

      if (minBtn && !minBtn.dataset.bound) {
        minBtn.dataset.bound = "true";
        minBtn.addEventListener("click", toggleChat);
      }

      function appendMessage(sender, text) {
        if (!chatMsgs) return;
        var div = document.createElement("div");
        div.className =
          "chat-msg " + (sender === "user" ? "user-msg" : "bot-msg");
        div.innerHTML =
          "<p>" +
          escapeHtml(text) +
          '</p><span class="msg-time">Vừa xong</span>';
        chatMsgs.appendChild(div);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
      }

      function handleUserSend(text) {
        if (!text || !text.trim()) return;
        var trimmed = text.trim();
        appendMessage("user", trimmed);

        var typingDiv = document.createElement("div");
        typingDiv.className = "chat-msg bot-msg chat-typing";
        typingDiv.innerHTML =
          '<div class="typing-dots"><span></span><span></span><span></span></div>';
        chatMsgs.appendChild(typingDiv);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;

        setTimeout(function () {
          typingDiv.remove();
          var reply = LiveChat.getBotReply(trimmed);
          appendMessage("bot", reply);
        }, 500);
      }

      if (chatForm && !chatForm.dataset.bound) {
        chatForm.dataset.bound = "true";
        chatForm.addEventListener("submit", function (e) {
          e.preventDefault();
          if (chatInput) {
            var val = chatInput.value;
            chatInput.value = "";
            handleUserSend(val);
          }
        });
      }

      if (quickReplies && !quickReplies.dataset.bound) {
        quickReplies.dataset.bound = "true";
        quickReplies.addEventListener("click", function (e) {
          var pill = e.target.closest(".quick-pill");
          if (!pill) return;
          var q = pill.getAttribute("data-query");
          if (q) handleUserSend(q);
        });
      }
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
    DrawerCart: DrawerCart,
    AutocompleteSearch: AutocompleteSearch,
    MobileBottomNav: MobileBottomNav,
    NotificationCenter: NotificationCenter,
    LiveChat: LiveChat,

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

      // 1. Quét Header tự động
      var headerEl = document.querySelector('[data-component="header"]');
      if (headerEl) {
        var variant =
          headerEl.getAttribute("data-variant") || Header.MARKETPLACE;
        var title = headerEl.getAttribute("data-title") || "";
        Header.render(headerEl, { variant: variant, title: title });
      } else {
        Header.bindEvents();
      }

      // 2. Quét Footer tự động
      var footerEl = document.querySelector('[data-component="footer"]');
      if (footerEl) {
        Footer.render(footerEl);
      }

      // 3. Quét Breadcrumb tự động
      var breadcrumbEl = document.querySelector(
        '[data-component="breadcrumb"]',
      );
      if (breadcrumbEl && breadcrumbEl.getAttribute("data-items")) {
        try {
          var items = JSON.parse(breadcrumbEl.getAttribute("data-items"));
          Breadcrumb.render(breadcrumbEl, items);
        } catch (e) {}
      }

      // 4. Khởi tạo Drawer Cart (nếu chưa có trong DOM)
      if (!document.getElementById("drawerCart")) {
        var drawerContainer = document.createElement("div");
        drawerContainer.id = "drawerCartWrapper";
        drawerContainer.innerHTML = DrawerCart.createHTML();
        document.body.appendChild(drawerContainer);
      }
      DrawerCart.bindEvents();

      // 5. Khởi tạo Autocomplete Search
      AutocompleteSearch.bindEvents();

      // 6. Khởi tạo Mobile Bottom Nav
      if (
        !document.getElementById("mobileBottomNav") &&
        !document.querySelector(".mobile-bottom-nav")
      ) {
        var bottomNavContainer = document.createElement("div");
        bottomNavContainer.id = "mobileBottomNavWrapper";
        bottomNavContainer.innerHTML = MobileBottomNav.createHTML();
        document.body.appendChild(bottomNavContainer);
      }

      // 7. Khởi tạo Notification Center
      NotificationCenter.bindEvents();

      // 8. Khởi tạo Live Chat Widget
      if (!document.getElementById("liveChatWidget")) {
        var chatContainer = document.createElement("div");
        chatContainer.id = "liveChatWrapper";
        chatContainer.innerHTML = LiveChat.createHTML();
        document.body.appendChild(chatContainer);
        LiveChat.bindEvents();
      }

      // 9. Lắng nghe mở DrawerCart khi có sự kiện cart:item-added
      if (!window.__drawerCartAutoBound) {
        window.__drawerCartAutoBound = true;
        window.addEventListener("cart:item-added", function () {
          DrawerCart.open();
        });
      }

      // 10. Lắng nghe click toàn cục cho Wishlist & Cart Triggers
      if (!window.__globalComponentsBound) {
        window.__globalComponentsBound = true;
        document.addEventListener("click", function (e) {
          // A. Wishlist heart toggle
          var wishBtn = e.target.closest('[data-action="wishlist"]');
          if (wishBtn) {
            e.preventDefault();
            e.stopPropagation();
            var id = wishBtn.getAttribute("data-id");
            if (
              UtilsRef &&
              UtilsRef.Wishlist &&
              typeof UtilsRef.Wishlist.toggle === "function"
            ) {
              var isAdded = UtilsRef.Wishlist.toggle(id);
              var allSameBtns = document.querySelectorAll(
                '[data-action="wishlist"][data-id="' + id + '"]',
              );
              allSameBtns.forEach(function (b) {
                b.classList.toggle("active", isAdded);
                var icon = b.querySelector(".material-symbols-outlined");
                if (icon)
                  icon.textContent = isAdded ? "favorite" : "favorite_border";
              });
              if (typeof UtilsRef.toast === "function") {
                UtilsRef.toast({
                  title: isAdded
                    ? "Đã lưu vào Yêu thích"
                    : "Đã bỏ khỏi Yêu thích",
                  message: isAdded
                    ? "Sản phẩm đã được lưu vào danh sách yêu thích của bạn."
                    : "Sản phẩm đã được xóa khỏi danh sách yêu thích.",
                  type: isAdded ? "success" : "info",
                });
              }
            }
            return;
          }

          // B. Mở Slide-over Drawer Cart
          var openCartBtn = e.target.closest(
            '[data-action="open-drawer-cart"], #headerCartBtn, #bottomNavCartBtn',
          );
          if (openCartBtn) {
            e.preventDefault();
            DrawerCart.open();
            return;
          }
        });
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
