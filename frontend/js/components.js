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
    if (typeof window !== "undefined" && window.location && window.location.pathname) {
      var pathname = window.location.pathname.replace(/\\/g, "/");
      if (
        pathname.indexOf("/pages/shop/") !== -1 ||
        pathname.indexOf("/pages/account/") !== -1 ||
        pathname.indexOf("/pages/seller/") !== -1 ||
        pathname.indexOf("/pages/admin/") !== -1 ||
        pathname.indexOf("/pages/buyer/") !== -1 ||
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
      stars += i < full
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
      if (!user && UtilsRef && UtilsRef.Auth && typeof UtilsRef.Auth.getCurrentUser === "function") {
        user = UtilsRef.Auth.getCurrentUser();
      }

      /* ----- 1. BIẾN THỂ MINIMAL (Giỏ hàng, Thanh toán, Auth) ----- */
      if (variant === Header.MINIMAL) {
        var badgeTextMinimal = options.badgeText || options.title || "GIỎ HÀNG";
        var backUrl = options.backUrl ? resolveUrl(options.backUrl, bp) : catalogUrl;
        var backLabel = options.backLabel || "Tiếp Tục Mua Sắm";

        return (
          '<header class="site-header site-header--minimal" id="siteHeader">' +
          '<div class="container">' +
          '<div class="flex items-center gap-3">' +
          '<a class="brand" href="' + homeUrl + '">' +
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
          '<a class="btn btn-secondary btn-sm hide-sm" href="' + backUrl + '">' +
          '<span class="material-symbols-outlined icon-sm">arrow_back</span> ' +
          escapeHtml(backLabel) +
          "</a>" +
          '<button class="icon-btn theme-toggle-btn" id="themeToggleBtn" type="button" aria-label="Chuyển chế độ sáng / tối" title="Chuyển sang giao diện Sáng">' +
          '<span class="material-symbols-outlined theme-toggle-icon">light_mode</span>' +
          "</button>" +
          (options.showCart !== false
            ? '<a class="icon-btn" href="' + cartUrl + '" aria-label="Giỏ hàng" title="Giỏ hàng">' +
              '<span class="material-symbols-outlined">shopping_bag</span>' +
              '<span class="badge badge-counter" id="cartCount">0</span>' +
              "</a>"
            : "") +
          '<a class="avatar" href="' + profileUrl + '" title="' + (user ? escapeHtml(user.fullName || user.name) : "Tài khoản") + '">' +
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
        var portalBadge = options.badgeText || (isAdmin ? "MASTER ADMIN" : "KÊNH NGƯỜI BÁN");
        var portalBadgeClass = isAdmin ? "badge badge-solid" : "badge badge-secondary";
        var portalIcon = isAdmin ? "terminal" : "token";
        var statusText = options.statusText || (isAdmin ? "HỆ THỐNG ONLINE 99.99%" : "Gian Hàng Hoạt Động");
        var actionBtnHtml = isAdmin
          ? '<a class="btn btn-secondary btn-sm hide-sm" href="' + homeUrl + '"><span class="material-symbols-outlined icon-sm">storefront</span> Ra Trang Chủ</a>'
          : '<a class="btn btn-primary btn-sm" href="' + postItemUrl + '"><span class="material-symbols-outlined icon-sm">add</span> Đăng Bán Món Mới</a>';

        var headerStyle = isAdmin ? ' style="border-bottom: 2px solid var(--primary-600);"' : "";

        return (
          '<header class="site-header site-header--dashboard"' + headerStyle + ' id="siteHeader">' +
          '<div class="container">' +
          '<div class="flex items-center gap-3">' +
          '<button class="icon-btn hide-lg" id="sidebarToggleBtn" type="button" aria-label="Mở menu quản trị">' +
          '<span class="material-symbols-outlined">menu</span>' +
          "</button>" +
          '<a class="brand" href="' + homeUrl + '">' +
          '<span class="brand-mark"><span class="material-symbols-outlined">' + portalIcon + "</span></span>" +
          "<span>" + brandName + '<span class="text-secondary">' + brandSuffix + "</span> " +
          '<span class="' + portalBadgeClass + '">' + escapeHtml(portalBadge) + "</span></span>" +
          "</a>" +
          "</div>" +
          '<div class="dashboard-status hide-md flex items-center gap-2 text-xs text-success">' +
          '<span class="status-dot"></span> ' + escapeHtml(statusText) +
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
          '<a class="avatar" href="' + profileUrl + '" title="' + (user ? escapeHtml(user.fullName || user.name) : "Tài khoản") + '">' +
          '<span class="material-symbols-outlined">' + (isAdmin ? "shield_person" : "store") + "</span>" +
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
        '<a class="brand" href="' + homeUrl + '">' +
        '<span class="brand-mark"><span class="material-symbols-outlined">token</span></span>' +
        "<span>HYBRID" +
        '<span class="text-secondary">.STORE</span> ' +
        '<span class="badge">' + escapeHtml(badgeMarketplace) + "</span>" +
        '<small><span class="status-dot"></span> Hàng Mới 100% &amp; Đồ Cũ Tuyển Chọn</small>' +
        "</span>" +
        "</a>" +
        '<div class="header-search">' +
        '<form class="header-search-form" id="headerSearchForm" action="' + catalogUrl + '" method="GET" style="margin: 0; width: 100%;">' +
        '<div class="input-group">' +
        '<span class="icon-left material-symbols-outlined">search</span>' +
        '<input id="headerSearchInput" name="q" class="input input-search" type="search" autocomplete="off" ' +
        'value="' + escapeHtml(searchQuery) + '" ' +
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
        '<a class="btn btn-danger btn-sm" id="btnHeaderPost" href="' + postItemUrl + '">' +
        '<span class="material-symbols-outlined icon-sm">add_circle</span>' +
        '<span class="hide-md">Đăng Bán Đồ Cũ</span>' +
        "</a>" +
        '<button class="icon-btn theme-toggle-btn" id="themeToggleBtn" type="button" aria-label="Chuyển chế độ sáng / tối" title="Chuyển sang giao diện Sáng">' +
        '<span class="material-symbols-outlined theme-toggle-icon">light_mode</span>' +
        "</button>" +
        '<a class="icon-btn" href="' + cartUrl + '" aria-label="Giỏ hàng" title="Giỏ hàng">' +
        '<span class="material-symbols-outlined">shopping_bag</span>' +
        '<span class="badge badge-counter" id="cartCount">0</span>' +
        "</a>" +
        '<a class="avatar" id="avatarBtn" href="' + profileUrl + '" aria-label="Tài khoản" title="' + (user ? escapeHtml(user.fullName || user.name) : "Tài khoản") + '">' +
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
      var el = typeof target === "string" ? document.querySelector(target) : target;
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
          if (UtilsRef && UtilsRef.Theme && typeof UtilsRef.Theme.toggle === "function") {
            UtilsRef.Theme.toggle();
          } else {
            var isLight = document.body.classList.contains("light-theme") ||
              document.documentElement.getAttribute("data-theme") === "light";
            var nextTheme = isLight ? "dark" : "light";
            document.body.classList.toggle("light-theme", nextTheme === "light");
            document.documentElement.setAttribute("data-theme", nextTheme);
            try { localStorage.setItem("hybrid_theme", nextTheme); } catch (e) {}
            var icon = themeBtn.querySelector(".theme-toggle-icon");
            if (icon) icon.textContent = nextTheme === "light" ? "dark_mode" : "light_mode";
          }
        });
      }

      // 2. Đồng bộ giỏ hàng Cart Badge
      if (UtilsRef && UtilsRef.Cart && typeof UtilsRef.Cart.syncBadge === "function") {
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
    }
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