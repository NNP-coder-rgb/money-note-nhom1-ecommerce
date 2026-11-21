/**
 * app.js — HYBRID.STORE Global Application Coordinator
 * -------------------------------------------------------------
 * Chức năng:
 *  1. Đồng bộ số lượng giỏ hàng (Cart Badge) tự động trên toàn hệ thống và giữa các tab
 *  2. Phím tắt toàn cục:
 *     - `/` hoặc `Ctrl+K`: Focus nhanh vào thanh tìm kiếm
 *     - `Alt+T` hoặc `Ctrl+J`: Chuyển đổi giao diện Sáng / Tối (Theme Toggle)
 *     - `Escape`: Đóng nhanh các modal hoặc menu đang mở
 *  3. Quản lý trạng thái kết nối mạng (Online/Offline status notifications)
 *  4. Tự động hỗ trợ nút cuộn lên đầu trang (Back to top)
 *  5. Tương thích môi trường trình duyệt và Node.js test
 */

(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    root.HybridApp = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STORAGE_KEYS = {
    THEME: "hybrid_theme",
    CART: "hv_cart",
    WISHLIST: "hv_wishlist_items",
  };

  /**
   * Cập nhật số lượng giỏ hàng hiển thị trên Header
   */
  function syncCartBadge() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      let count = 0;
      if (raw) {
        const cart = JSON.parse(raw);
        if (Array.isArray(cart)) {
          count = cart.reduce((sum, item) => sum + (parseInt(item.quantity || item.qty, 10) || 1), 0);
        } else if (typeof cart === "object" && cart !== null) {
          const items = cart.items || cart.products || [];
          if (Array.isArray(items)) {
            count = items.reduce((sum, item) => sum + (parseInt(item.quantity || item.qty, 10) || 1), 0);
          }
        }
      }

      const badges = document.querySelectorAll(".cart-badge, [data-cart-badge], .badge-cart-count, #cartCount, .badge-counter#cartCount");
      badges.forEach((b) => {
        b.textContent = count > 99 ? "99+" : count;
        if (count > 0) {
          b.classList.remove("hidden", "d-none");
          b.style.display = "";
        } else {
          // Nếu cấu hình ẩn khi 0
          if (b.dataset.hideZero === "true") {
            b.style.display = "none";
          }
        }
      });
      return count;
    } catch (e) {
      console.warn("[app.js] Không thể đồng bộ giỏ hàng:", e);
      return 0;
    }
  }

  /**
   * Chuyển đổi Theme Sáng / Tối
   */
  function toggleTheme(forcedTheme) {
    if (typeof window !== "undefined" && window.Utils && window.Utils.Theme) {
      if (forcedTheme) {
        return window.Utils.Theme.set(forcedTheme);
      }
      return window.Utils.Theme.toggle(true);
    }
    if (typeof document === "undefined") return;
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = forcedTheme || (currentTheme === "dark" ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.classList.toggle("light-theme", nextTheme === "light");
    if (document.body) {
      document.body.classList.toggle("light-theme", nextTheme === "light");
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    } catch (e) {}

    // Cập nhật icon trên các nút theme
    const buttons = document.querySelectorAll(".theme-toggle-btn, #themeToggleBtn");
    buttons.forEach((btn) => {
      const icon = btn.querySelector(".material-symbols-outlined, .theme-toggle-icon");
      if (icon) {
        icon.textContent = nextTheme === "light" ? "dark_mode" : "light_mode";
      }
      btn.setAttribute(
        "title",
        nextTheme === "light"
          ? "Chuyển sang giao diện Tối (Midnight Cyber)"
          : "Chuyển sang giao diện Sáng (Nền trắng)"
      );
    });

    // Thông báo nếu có toast
    if (typeof window !== "undefined" && window.Utils && typeof window.Utils.toast === "function") {
      window.Utils.toast({
        title: "Giao diện",
        message: `Đã đổi sang giao diện ${nextTheme === "dark" ? "Tối (Cyber)" : "Sáng (Clean)"}`,
        type: "info",
        duration: 2000,
      });
    }
    return nextTheme;
  }

  /**
   * Khởi tạo Theme từ localStorage
   */
  function initTheme() {
    if (typeof window !== "undefined" && window.Utils && window.Utils.Theme) {
      window.Utils.Theme.init();
      return;
    }
    if (typeof document === "undefined" || typeof localStorage === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) || localStorage.getItem("hv_theme") || "dark";
      document.documentElement.setAttribute("data-theme", saved);
      document.documentElement.classList.toggle("light-theme", saved === "light");
      if (document.body) {
        document.body.classList.toggle("light-theme", saved === "light");
      }
    } catch (e) {}
  }

  /**
   * Thiết lập phím tắt toàn cục
   */
  function setupKeyboardShortcuts() {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", function (e) {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);

      // Phím tắt '/' hoặc Ctrl+K để focus tìm kiếm
      if ((e.key === "/" && !isInputActive) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        const searchInput = document.querySelector(
          "#globalSearchInput, input[type='search'], .header-search input, input[name='q']"
        );
        if (searchInput) {
          searchInput.focus();
          if (searchInput.select) searchInput.select();
        }
      }

      // Phím tắt Alt+T hoặc Ctrl+J: Đổi theme
      if ((e.altKey && e.key.toLowerCase() === "t") || (e.ctrlKey && e.key.toLowerCase() === "j")) {
        e.preventDefault();
        toggleTheme();
      }

      // Phím Escape: Đóng modal / drawer
      if (e.key === "Escape") {
        const openModals = document.querySelectorAll(".modal.active, .modal.show, [data-modal].open");
        openModals.forEach((m) => {
          m.classList.remove("active", "show", "open");
        });
      }
    });
  }

  /**
   * Lắng nghe sự kiện đồng bộ storage giữa các tab
   */
  function setupStorageListener() {
    if (typeof window === "undefined") return;
    window.addEventListener("storage", function (e) {
      if (e.key === STORAGE_KEYS.CART) {
        syncCartBadge();
      } else if ((e.key === STORAGE_KEYS.THEME || e.key === "hybrid_theme" || e.key === "hv_theme") && e.newValue) {
        if (typeof window !== "undefined" && window.Utils && window.Utils.Theme) {
          window.Utils.Theme.apply(e.newValue);
        } else {
          document.documentElement.setAttribute("data-theme", e.newValue);
          document.documentElement.classList.toggle("light-theme", e.newValue === "light");
          if (document.body) {
            document.body.classList.toggle("light-theme", e.newValue === "light");
          }
        }
      } else if (e.key && (e.key === STORAGE_KEYS.WISHLIST || e.key.indexOf("hv_wishlist_") === 0)) {
        window.dispatchEvent(new CustomEvent("wishlist:updated", { detail: { storageEvent: true } }));
      }
    });
  }

  /**
   * Quản lý trạng thái kết nối mạng (Online / Offline status banner)
   */
  function setupNetworkStatusListener() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let banner = document.getElementById("offlineStatusBanner");

    function showOfflineBanner() {
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "offlineStatusBanner";
        banner.className = "offline-banner";
        banner.innerHTML = '<span class="material-symbols-outlined icon-xs">cloud_off</span> Bạn đang ngoại tuyến. Dữ liệu giỏ hàng và danh sách đã được lưu trên thiết bị.';
        document.body.prepend(banner);
      }
      banner.style.display = "flex";
    }

    function hideOfflineBanner() {
      if (banner) {
        banner.style.display = "none";
      }
      if (window.Utils && typeof window.Utils.toast === "function") {
        window.Utils.toast("Đã khôi phục kết nối internet!", "success");
      }
    }

    window.addEventListener("offline", showOfflineBanner);
    window.addEventListener("online", hideOfflineBanner);

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      showOfflineBanner();
    }
  }

  /**
   * Hỗ trợ nút cuộn lên đầu trang (Back to top)
   */
  function setupBackToTop() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const bttBtn = document.querySelector("#backToTop, .btn-back-to-top, [data-back-to-top]");
    if (!bttBtn) return;

    window.addEventListener("scroll", function () {
      if (window.scrollY > 400) {
        bttBtn.classList.add("visible");
        bttBtn.style.opacity = "1";
        bttBtn.style.pointerEvents = "auto";
      } else {
        bttBtn.classList.remove("visible");
        bttBtn.style.opacity = "0";
        bttBtn.style.pointerEvents = "none";
      }
    });

    bttBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /**
   * Hiệu ứng xuất hiện mượt mà khi cuộn trang (Scroll Reveal with Stagger)
   */
  function setupScrollReveal() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const candidates = document.querySelectorAll(
      ".section, .panel, .hero-grid, .hero-card, .catalog-grid, .product-grid, .footer-col, .dash-stat-card, .table-card, .reveal-on-scroll"
    );

    if (!candidates || candidates.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      candidates.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            // Gán stagger delay cho các phần tử con dạng grid
            const children = entry.target.querySelectorAll(
              ".product-card, .cat-card, .cat-jump, .panel, .mini-stat"
            );
            children.forEach((child, idx) => {
              child.style.setProperty("--reveal-index", idx);
              child.classList.add("is-revealed");
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    candidates.forEach((el) => {
      if (!el.classList.contains("is-revealed")) {
        el.classList.add("reveal-on-scroll");
        observer.observe(el);
      }
    });
  }

  /**
   * Hiệu ứng Header thu gọn và đổ bóng kính mờ (Glassmorphism Elevation) khi cuộn
   */
  function setupHeaderScroll() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const header = document.querySelector(".site-header, .dash-topbar");
    if (!header) return;

    let ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          if (typeof window.requestAnimationFrame === "function") {
            window.requestAnimationFrame(function () {
              if (window.scrollY > 30) {
                header.classList.add("scrolled");
              } else {
                header.classList.remove("scrolled");
              }
              ticking = false;
            });
          } else {
            if (window.scrollY > 30) {
              header.classList.add("scrolled");
            } else {
              header.classList.remove("scrolled");
            }
            ticking = false;
          }
        }
      },
      { passive: true }
    );
  }

  /**
   * Hiệu ứng nảy huy hiệu giỏ hàng (Cart Bounce) & Hạt bay vào giỏ (Fly-to-cart)
   */
  function setupCartAnimation() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    function triggerBadgeBounce() {
      const badges = document.querySelectorAll(".cart-badge, #cartCount, .badge-counter#cartCount");
      badges.forEach((b) => {
        b.classList.remove("badge-bounce");
        void b.offsetWidth; // Trigger reflow để animation có thể lặp lại
        b.classList.add("badge-bounce");
      });
    }

    // Lắng nghe sự kiện custom giỏ hàng
    window.addEventListener("cart:item-added", function (e) {
      triggerBadgeBounce();
      if (e.detail && e.detail.sourceElement) {
        createFlyToCart(e.detail.sourceElement);
      }
    });

    // Lắng nghe click trực tiếp vào các nút Thêm giỏ hàng / Mua ngay
    document.addEventListener("click", function (e) {
      const addBtn = e.target.closest(
        ".btn-add-cart, [data-action='add-to-cart'], .product-add-cart-btn, .btn-buy-now, [data-open='drawerCart']"
      );
      if (addBtn && !addBtn.classList.contains("btn-buy-now")) {
        triggerBadgeBounce();
        createFlyToCart(addBtn);
      }
    });
  }

  function createFlyToCart(sourceEl) {
    if (typeof document === "undefined" || !sourceEl || typeof sourceEl.getBoundingClientRect !== "function") return;
    const targetEl = document.querySelector("#cartCount, .icon-btn[href*='cart']");
    if (!targetEl || typeof targetEl.getBoundingClientRect !== "function") return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const dot = document.createElement("div");
    dot.className = "flying-cart-dot";
    dot.style.top = sourceRect.top + sourceRect.height / 2 - 7 + "px";
    dot.style.left = sourceRect.left + sourceRect.width / 2 - 7 + "px";
    document.body.appendChild(dot);

    const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        dot.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
        dot.style.opacity = "0.1";
      });
    } else {
      dot.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
      dot.style.opacity = "0.1";
    }

    setTimeout(() => {
      if (dot.parentNode) dot.parentNode.removeChild(dot);
    }, 700);
  }

  /**
   * Hiệu ứng tải ảnh mượt mà dịu mắt (Image Smooth Fade-In)
   */
  function setupImageSmoothFade() {
    if (typeof document === "undefined") return;
    const images = document.querySelectorAll("img:not(.smooth-fade)");
    images.forEach((img) => {
      img.classList.add("smooth-fade");
      if (img.complete) {
        img.classList.add("loaded");
      } else {
        img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
        img.addEventListener("error", () => img.classList.add("loaded"), { once: true });
      }
    });
  }

  /**
   * Hiệu ứng tương tác cảm ứng xúc giác (Tactile Press) trên nút bấm
   */
  function setupTactileButtons() {
    if (typeof document === "undefined") return;
    document.addEventListener("pointerdown", function (e) {
      const btn = e.target.closest(".btn, .icon-btn, .pill, .type-tab-btn, .cat-jump");
      if (btn) {
        btn.classList.add("tactile-press");
      }
    });

    document.addEventListener("pointerup", function () {
      const pressed = document.querySelectorAll(".tactile-press");
      pressed.forEach((el) => el.classList.remove("tactile-press"));
    });
  }

  /**
   * Đồng bộ và làm mới Progressive Web App (PWA) Service Worker, tự động dọn Cache cũ
   */
  function setupServiceWorker() {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location && window.location.protocol && window.location.protocol.startsWith("http")) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.update();
          }
        });
        if (typeof caches !== "undefined") {
          caches.keys().then((names) => {
            names.forEach((name) => {
              if (name === "hybrid-store-v1") {
                console.log("[PWA] Tự động giải phóng cache cũ:", name);
                caches.delete(name);
              }
            });
          });
        }
      });
    }
  }

  /**
   * Khởi động toàn bộ ứng dụng khi DOM đã sẵn sàng
   */
  function init() {
    if (typeof document === "undefined") return;
    initTheme();
    syncCartBadge();
    setupKeyboardShortcuts();
    setupStorageListener();
    setupBackToTop();
    setupNetworkStatusListener();
    setupHeaderScroll();
    setupScrollReveal();
    setupCartAnimation();
    setupImageSmoothFade();
    setupTactileButtons();
    setupServiceWorker();
  }

  // Tự động chạy khi nạp trên trình duyệt
  if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  return {
    init,
    syncCartBadge,
    toggleTheme,
    initTheme,
    setupScrollReveal,
    setupHeaderScroll,
    setupCartAnimation,
    setupImageSmoothFade,
    createFlyToCart,
  };
});
