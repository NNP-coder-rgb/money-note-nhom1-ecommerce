/**
 * utils.js — Thư viện hàm tiện ích dùng chung cho dự án E-Commerce (Task TF2530D)
 * Dành cho sinh viên: JavaScript thuần, dễ hiểu, tương thích tối đa và không phụ thuộc thư viện ngoài.
 *
 * Chức năng bao gồm:
 * 1. Định dạng: formatCurrency (VNĐ), formatDate (ngày tháng)
 * 2. Thông báo & Modal: toast, openModal, closeModal, confirm
 * 3. Đếm ngược: startCountdown (Flash sale, đếm ngược 48 giờ)
 * 4. Đánh giá: renderStars (sao đầy ★, nửa ½, rỗng ☆)
 * 5. Xử lý danh sách: filterProducts (lọc đa điều kiện), sortProducts (sắp xếp), paginate (phân trang)
 */

(function (global) {
  "use strict";

  /* =========================================================================
     1. TIỆN ÍCH CƠ BẢN (escapeHtml, getUsedDiscountPercent)
     ========================================================================= */

  /**
   * Thoát các ký tự đặc biệt trong HTML để phòng tránh XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Tính phần trăm tiết kiệm của đồ cũ (C2C) so với giá đồ mới niêm yết
   * @param {number} usedPrice - Giá đồ cũ
   * @param {number} newPrice - Giá đồ mới
   * @returns {number} Phần trăm làm tròn (ví dụ: 25)
   */
  function getUsedDiscountPercent(usedPrice, newPrice) {
    const u = Number(usedPrice) || 0;
    const n = Number(newPrice) || 0;
    if (n <= 0) return 0;
    if (u <= 0) return 100;
    const pct = Math.round((1 - u / n) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  /* =========================================================================
     2. ĐỊNH DẠNG (formatCurrency, formatDate)
     ========================================================================= */

  /**
   * Định dạng số tiền sang chuẩn tiền tệ (mặc định VNĐ)
   * @param {number|string} amount - Số tiền cần định dạng
   * @param {string} [currency='VND'] - Mã loại tiền tệ ('VND', 'USD', ...)
   * @returns {string} Chuỗi định dạng ví dụ: "2.850.000₫"
   */
  function formatCurrency(amount, currency = "VND") {
    if (amount == null || amount === "") return "0₫";
    const num = Number(amount);
    if (isNaN(num)) return "0₫";

    if (currency.toUpperCase() === "VND") {
      return num.toLocaleString("vi-VN") + "₫";
    }

    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: currency,
      }).format(num);
    } catch (e) {
      return num.toLocaleString("vi-VN") + " " + currency;
    }
  }

  /**
   * Định dạng thời gian theo mẫu (mặc định DD/MM/YYYY)
   * @param {Date|string|number} dateInput - Thời gian cần format
   * @param {string} [format='DD/MM/YYYY'] - Mẫu chuỗi: 'DD/MM/YYYY', 'DD/MM/YYYY HH:mm:ss', ...
   * @returns {string} Chuỗi thời gian đã định dạng hoặc "" nếu không hợp lệ
   */
  function formatDate(dateInput, format = "DD/MM/YYYY") {
    if (!dateInput) return "";
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const shortYear = String(year).slice(-2);
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return format
      .replace(/YYYY/g, year)
      .replace(/YY/g, shortYear)
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds);
  }

  /* =========================================================================
     3. THÔNG BÁO & MODAL (toast, openModal, closeModal, confirm)
     ========================================================================= */

  /**
   * Đảm bảo CSS cho Toast được chèn nếu trang chưa có sẵn style
   */
  function ensureToastStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("hybrid-toast-styles")) return;

    const style = document.createElement("style");
    style.id = "hybrid-toast-styles";
    style.textContent = `
      .toast-stack {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        min-width: 260px;
        max-width: 380px;
        padding: 12px 16px;
        font-size: 13px;
        background: #1a1a2b;
        color: #edebf7;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-left: 4px solid #a97ffa;
        border-radius: 10px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: flex-start;
        gap: 10px;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      .toast.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .toast.success { border-left-color: #34d399; }
      .toast.error { border-left-color: #f87171; }
      .toast.warning { border-left-color: #fbbf24; }
      .toast.info { border-left-color: #22d3ee; }
      .toast-icon { font-size: 16px; line-height: 1.2; }
      .toast-body { flex: 1; }
      .toast-title { font-weight: 700; font-size: 13px; margin-bottom: 2px; }
      .toast-text { color: #dcd9ee; font-size: 12px; line-height: 1.4; }
      .toast-dismiss {
        background: none;
        border: none;
        color: #7a7893;
        cursor: pointer;
        padding: 0;
        font-size: 16px;
        line-height: 1;
      }
      .toast-dismiss:hover { color: #ffffff; }
    `;
    document.head.appendChild(style);
  }

  /**
   * Hiển thị thông báo Toast góc dưới màn hình
   * @param {string|object} messageOrOpts - Nội dung thông báo hoặc object { message, type, duration, title }
   * @param {string} [type='info'] - 'success' | 'error' | 'warning' | 'info'
   * @param {number} [duration=3000] - Thời gian hiển thị (ms)
   * @returns {HTMLElement|null} Phần tử toast DOM
   */
  function toast(messageOrOpts, type = "info", duration = 3000) {
    if (typeof document === "undefined") return null;

    let message = "";
    let title = "";
    if (typeof messageOrOpts === "object" && messageOrOpts !== null) {
      message = messageOrOpts.message || "";
      type = messageOrOpts.type || type;
      duration = messageOrOpts.duration != null ? messageOrOpts.duration : duration;
      title = messageOrOpts.title || "";
    } else {
      message = String(messageOrOpts || "");
    }

    ensureToastStyles();

    // Tìm hoặc tạo container .toast-stack trong body
    let stack = document.getElementById("toastStack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toastStack";
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }

    const toastEl = document.createElement("div");
    toastEl.className = "toast " + (type || "info");
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");

    const ICONS = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };
    const iconChar = ICONS[type] || "ℹ";

    toastEl.innerHTML =
      '<span class="toast-icon">' + iconChar + "</span>" +
      '<div class="toast-body">' +
      (title ? '<div class="toast-title">' + escapeHtml(title) + "</div>" : "") +
      '<div class="toast-text">' + escapeHtml(message) + "</div>" +
      "</div>" +
      '<button type="button" class="toast-dismiss" aria-label="Đóng">&times;</button>';

    stack.appendChild(toastEl);

    // Kích hoạt animation xuất hiện
    requestAnimationFrame(() => {
      toastEl.classList.add("is-visible");
    });

    let isDismissed = false;
    function dismiss() {
      if (isDismissed) return;
      isDismissed = true;
      toastEl.classList.remove("is-visible");
      setTimeout(() => {
        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      }, 260);
    }

    const closeBtn = toastEl.querySelector(".toast-dismiss");
    if (closeBtn) closeBtn.addEventListener("click", dismiss);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return toastEl;
  }

  /**
   * Mở modal (tương thích tối đa với modal.js của Task TF2520C)
   * @param {string|HTMLElement} modalIdOrEl - ID của modal backdrop hoặc DOM element
   */
  function openModal(modalIdOrEl) {
    if (typeof document === "undefined") return;

    // Nếu modal.js đã định nghĩa openModal trên global thì sử dụng trực tiếp
    if (typeof global.Modal !== "undefined" && typeof global.Modal.open === "function") {
      return global.Modal.open(modalIdOrEl);
    }

    if (!modalIdOrEl) return;
    const el =
      typeof modalIdOrEl === "string"
        ? document.getElementById(modalIdOrEl) || document.querySelector(modalIdOrEl)
        : modalIdOrEl;

    if (!el) return;

    const backdrop = el.classList.contains("modal-backdrop")
      ? el
      : el.closest(".modal-backdrop") || el;

    backdrop.classList.add("is-open");
    document.body.classList.add("modal-open");

    const firstInput = backdrop.querySelector(
      'input:not([type="hidden"]), textarea, button.btn-primary, button[type="submit"]'
    );
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  }

  /**
   * Đóng modal (tương thích tối đa với modal.js của Task TF2520C)
   * @param {string|HTMLElement} modalIdOrEl - ID của modal backdrop hoặc DOM element
   */
  function closeModal(modalIdOrEl) {
    if (typeof document === "undefined") return;

    // Nếu modal.js đã định nghĩa closeModal trên global thì sử dụng trực tiếp
    if (typeof global.Modal !== "undefined" && typeof global.Modal.close === "function") {
      return global.Modal.close(modalIdOrEl);
    }

    if (!modalIdOrEl) return;
    const el =
      typeof modalIdOrEl === "string"
        ? document.getElementById(modalIdOrEl) || document.querySelector(modalIdOrEl)
        : modalIdOrEl;

    if (!el) return;

    const backdrop = el.classList.contains("modal-backdrop")
      ? el
      : el.closest(".modal-backdrop") || el;

    backdrop.classList.remove("is-open");

    const remainingOpen = document.querySelectorAll(".modal-backdrop.is-open");
    if (remainingOpen.length === 0) {
      document.body.classList.remove("modal-open");
    }
  }

  /**
   * Hộp thoại xác nhận (trả về Promise và hỗ trợ callbacks onConfirm / onCancel)
   * @param {string|object} messageOrOpts - Nội dung thông báo hoặc object tùy chọn
   * @param {Function} [onConfirm] - Callback khi xác nhận
   * @param {Function} [onCancel] - Callback khi hủy
   * @param {object} [opts] - Tùy chọn bổ sung { title, confirmText, cancelText, type }
   * @returns {Promise<boolean>}
   */
  function confirm(messageOrOpts, onConfirm, onCancel, opts = {}) {
    let title = "Xác nhận";
    let message = "";
    let confirmText = "Đồng ý";
    let cancelText = "Hủy";
    let type = "warning";

    if (typeof messageOrOpts === "object" && messageOrOpts !== null) {
      title = messageOrOpts.title || title;
      message = messageOrOpts.message || "";
      confirmText = messageOrOpts.confirmText || confirmText;
      cancelText = messageOrOpts.cancelText || cancelText;
      type = messageOrOpts.type || type;
      if (typeof messageOrOpts.onConfirm === "function") onConfirm = messageOrOpts.onConfirm;
      if (typeof messageOrOpts.onCancel === "function") onCancel = messageOrOpts.onCancel;
    } else {
      message = String(messageOrOpts || "");
      if (opts.title) title = opts.title;
      if (opts.confirmText) confirmText = opts.confirmText;
      if (opts.cancelText) cancelText = opts.cancelText;
      if (opts.type) type = opts.type;
    }

    return new Promise((resolve) => {
      // 1. Tương thích với showPopup của dự án nếu có
      if (typeof global.showPopup === "function") {
        let isResolved = false;
        global.showPopup({
          type: type,
          title: title,
          message: message,
          confirmText: confirmText,
          showCancel: true,
          onConfirm: () => {
            if (isResolved) return;
            isResolved = true;
            if (typeof onConfirm === "function") onConfirm();
            resolve(true);
          },
        });

        const cancelBtn = typeof document !== "undefined" ? document.getElementById("popupCancel") : null;
        if (cancelBtn) {
          const handleCancel = () => {
            cancelBtn.removeEventListener("click", handleCancel);
            if (isResolved) return;
            isResolved = true;
            if (typeof onCancel === "function") onCancel();
            resolve(false);
          };
          cancelBtn.addEventListener("click", handleCancel, { once: true });
        }
      }
      // 2. Môi trường trình duyệt tiêu chuẩn có window.confirm
      else if (typeof global.confirm === "function") {
        const ok = global.confirm(title + "\n\n" + message);
        if (ok) {
          if (typeof onConfirm === "function") onConfirm();
          resolve(true);
        } else {
          if (typeof onCancel === "function") onCancel();
          resolve(false);
        }
      }
      // 3. Fallback khác
      else {
        if (typeof onConfirm === "function") onConfirm();
        resolve(true);
      }
    });
  }

  /* =========================================================================
     4. ĐẾM NGƯỢC (startCountdown)
     ========================================================================= */

  /**
   * Bộ đếm ngược thời gian (flash sale, khuyến mãi 48 giờ).
   * Cập nhật mỗi giây, tự động dừng interval và gọi onEnd đúng một lần khi hết giờ.
   *
   * @param {Date|number|string} endsAt - Thời điểm kết thúc (Date, timestamp, hoặc số giây còn lại tính từ bây giờ)
   * @param {HTMLElement|string|object} [element] - DOM element, selector chuỗi, hoặc object { d, h, m, s }
   * @param {Function} [onEnd] - Callback khi đếm ngược kết thúc
   * @returns {{ intervalId: number|null, stop: Function, getRemaining: Function }}
   */
  function startCountdown(endsAt, element, onEnd) {
    let targetMs;
    if (endsAt instanceof Date) {
      targetMs = endsAt.getTime();
    } else if (typeof endsAt === "number") {
      // Nếu số nhỏ hơn 1e11 (100 tỷ ms), coi là số giây tương đối từ thời điểm gọi
      targetMs = endsAt > 1e11 ? endsAt : Date.now() + endsAt * 1000;
    } else if (typeof endsAt === "string") {
      const parsed = new Date(endsAt).getTime();
      targetMs = isNaN(parsed) ? Date.now() : parsed;
    } else {
      targetMs = Date.now();
    }

    // Resolve element nếu là selector chuỗi
    let resolvedEl = element;
    if (typeof element === "string" && typeof document !== "undefined") {
      resolvedEl = document.querySelector(element);
    }

    const pad = (n) => String(n).padStart(2, "0");
    let intervalId = null;
    let isStopped = false;
    let hasEnded = false;
    let controller = null;

    function renderTime(remainingSec) {
      if (!resolvedEl) return;

      const days = Math.floor(remainingSec / 86400);
      const hours = Math.floor((remainingSec % 86400) / 3600);
      const totalHours = Math.floor(remainingSec / 3600);
      const minutes = Math.floor((remainingSec % 3600) / 60);
      const seconds = remainingSec % 60;

      // TH1: Object gồm các phần tử con { d, h, m, s }
      if (
        typeof resolvedEl === "object" &&
        (resolvedEl.h || resolvedEl.m || resolvedEl.s || resolvedEl.d)
      ) {
        if (resolvedEl.d) resolvedEl.d.textContent = pad(days);
        if (resolvedEl.h) resolvedEl.h.textContent = pad(resolvedEl.d ? hours : totalHours);
        if (resolvedEl.m) resolvedEl.m.textContent = pad(minutes);
        if (resolvedEl.s) resolvedEl.s.textContent = pad(seconds);
        return;
      }

      // TH2: Element có các selector con chuyên biệt
      if (typeof resolvedEl.querySelector === "function") {
        const dEl = resolvedEl.querySelector("[data-unit='d'], .days, #fs-d");
        const hEl = resolvedEl.querySelector("[data-unit='h'], .hours, #fs-h");
        const mEl = resolvedEl.querySelector("[data-unit='m'], .minutes, #fs-m");
        const sEl = resolvedEl.querySelector("[data-unit='s'], .seconds, #fs-s");

        if (hEl && mEl && sEl) {
          if (dEl) dEl.textContent = pad(days);
          hEl.textContent = pad(dEl ? hours : totalHours);
          mEl.textContent = pad(minutes);
          sEl.textContent = pad(seconds);
          return;
        }

        const units = resolvedEl.querySelectorAll(".countdown-unit");
        if (units.length === 4) {
          units[0].textContent = pad(days);
          units[1].textContent = pad(hours);
          units[2].textContent = pad(minutes);
          units[3].textContent = pad(seconds);
          return;
        } else if (units.length === 3) {
          units[0].textContent = pad(totalHours);
          units[1].textContent = pad(minutes);
          units[2].textContent = pad(seconds);
          return;
        }
      }

      // TH3: Element text thông thường
      if (resolvedEl && typeof resolvedEl === "object" && "textContent" in resolvedEl) {
        resolvedEl.textContent =
          (days > 0 ? pad(days) + "d " : "") +
          pad(days > 0 ? hours : totalHours) +
          ":" +
          pad(minutes) +
          ":" +
          pad(seconds);
      }
    }

    // Tự động dừng countdown cũ nếu cùng gán lên 1 DOM element để tránh nhiều interval chạy đè nhau
    if (resolvedEl && resolvedEl._activeCountdown && typeof resolvedEl._activeCountdown.stop === "function") {
      resolvedEl._activeCountdown.stop();
    }

    function calcRemainingSec() {
      const diffMs = targetMs - Date.now();
      if (diffMs <= 0) return 0;
      // Dùng Math.ceil để tại t=0 (còn ~10000ms) hiển thị đúng 10, sau 1s (còn ~9000ms) hiển thị 9, không bị nhảy số
      return Math.ceil(diffMs / 1000);
    }

    function stop() {
      if (isStopped) return;
      isStopped = true;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (resolvedEl && controller && resolvedEl._activeCountdown === controller) {
        delete resolvedEl._activeCountdown;
      }
    }

    function tick() {
      if (isStopped) return;
      const remainingSec = calcRemainingSec();

      renderTime(remainingSec);

      if (remainingSec <= 0) {
        stop();
        if (!hasEnded) {
          hasEnded = true;
          if (typeof onEnd === "function") {
            onEnd();
          }
        }
      }
    }

    controller = {
      get intervalId() {
        return intervalId;
      },
      stop,
      getRemaining() {
        return calcRemainingSec();
      },
    };

    if (resolvedEl && typeof resolvedEl === "object") {
      resolvedEl._activeCountdown = controller;
    }

    // 1. Cập nhật ngay thời gian ban đầu lúc khởi tạo (ví dụ 00:00:10)
    const initialSec = calcRemainingSec();
    renderTime(initialSec);

    // Nếu thời gian đã hết ngay từ đầu thì dừng ngay và gọi onEnd đúng 1 lần, không tạo interval
    if (initialSec <= 0) {
      stop();
      hasEnded = true;
      if (typeof onEnd === "function") {
        onEnd();
      }
    } else {
      // 2. Chạy tick định kỳ mỗi giây
      intervalId = setInterval(tick, 1000);
    }

    return controller;
  }

  /* =========================================================================
     5. ĐÁNH GIÁ SAO (renderStars)
     ========================================================================= */

  /**
   * Tạo chuỗi đánh giá sao gồm sao đầy (★), sao nửa biểu tượng trực quan (⯨), và sao rỗng (☆).
   * Hỗ trợ xuất HTML với Material Symbols khi truyền options.html = true.
   *
   * @param {number} rating - Điểm đánh giá (0 đến 5)
   * @param {object|boolean} [options={}] - Tùy chọn { max: 5, html: false } hoặc cờ boolean asHtml
   * @returns {string} Chuỗi sao ví dụ: "★★★★⯨", "★★⯨☆☆", "☆☆☆☆☆" hoặc HTML
   */
  function renderStars(rating, options = {}) {
    const asHtml = typeof options === "boolean" ? options : Boolean(options && options.html);
    const max = (options && options.max) || 5;
    const num = Math.max(0, Math.min(Number(rating) || 0, max));

    const full = Math.floor(num);
    const remainder = num - full;
    const half = remainder >= 0.25 && remainder < 0.75 ? 1 : 0;
    const effectiveFull = remainder >= 0.75 ? full + 1 : full;
    const empty = Math.max(0, max - effectiveFull - half);

    if (asHtml) {
      let html = '<span class="rating" aria-label="' + num.toFixed(1) + " / " + max + ' sao">';
      for (let i = 0; i < effectiveFull; i++) {
        html += '<span class="material-symbols-outlined star filled" style="color:#fbbf24;">star</span>';
      }
      if (half) {
        html += '<span class="material-symbols-outlined star half filled" style="color:#fbbf24;">star_half</span>';
      }
      for (let i = 0; i < empty; i++) {
        html += '<span class="material-symbols-outlined star empty" style="color:#5e5c75;">star</span>';
      }
      html += '<span class="rating-value">' + num.toFixed(1) + "</span>";
      html += "</span>";
      return html;
    }

    // Trả về chuỗi sao trực quan: ★ (đầy), ⯨ (nửa sao Unicode U+2BE8 trực quan), ☆ (rỗng)
    return "★".repeat(effectiveFull) + (half ? "⯨" : "") + "☆".repeat(empty);
  }

  // Tiện ích phụ trợ xuất HTML trực tiếp
  renderStars.toHTML = function (rating, max = 5) {
    return renderStars(rating, { html: true, max });
  };

  /* =========================================================================
     6. XỬ LÝ DANH SÁCH (filterProducts, sortProducts, paginate)
     ========================================================================= */

  /**
   * Lọc danh sách sản phẩm theo nhiều điều kiện kết hợp theo logic AND
   * @param {Array<object>} list - Mảng sản phẩm cần lọc
   * @param {object} criteria - Điều kiện lọc:
   *   - keyword / search / q / name: từ khóa tìm kiếm (trong tên, mô tả, người bán, tag...)
   *   - category / categories: danh mục sản phẩm ('fashion', 'sneakers', 'tech', ...)
   *   - type: loại hàng ('mall' | 'c2c')
   *   - minPrice, maxPrice: khoảng giá
   *   - minRating: đánh giá sao tối thiểu
   *   - minCond: độ mới tối thiểu cho hàng C2C (ví dụ: 90, 95)
   *   - flash: sản phẩm flash sale (true/false)
   * @returns {Array<object>} Mảng mới sau khi lọc (không thay đổi mảng ban đầu)
   */
  function filterProducts(list, criteria = {}) {
    if (!Array.isArray(list)) return [];
    if (!criteria || Object.keys(criteria).length === 0) return [...list];

    return list.filter((item) => {
      if (!item || typeof item !== "object") return false;

      // 1. Từ khóa tìm kiếm (keyword / search / q / name)
      const keyword = (
        criteria.keyword ||
        criteria.search ||
        criteria.q ||
        criteria.name ||
        ""
      )
        .trim()
        .toLowerCase();

      if (keyword) {
        const fullText = [
          item.name,
          item.short,
          item.desc,
          item.seller,
          item.sellerName,
          item.badge,
          item.tag,
          item.sub,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const cleanFull = fullText.replace(/['’\-_.]/g, "");
        const cleanKw = keyword.replace(/['’\-_.]/g, "");

        if (!fullText.includes(keyword) && !cleanFull.includes(cleanKw)) {
          return false;
        }
      }

      // 2. Danh mục (category / categories)
      const cat = criteria.category;
      if (cat && cat !== "all") {
        if (Array.isArray(cat)) {
          if (!cat.includes(item.category)) return false;
        } else if (item.category !== cat) {
          return false;
        }
      }
      if (Array.isArray(criteria.categories) && criteria.categories.length > 0) {
        if (!criteria.categories.includes(item.category)) return false;
      }

      // 3. Loại hàng (type: 'mall' | 'c2c')
      const type = criteria.type;
      if (type && type !== "all") {
        if (Array.isArray(type)) {
          if (!type.includes(item.type)) return false;
        } else if (item.type !== type) {
          return false;
        }
      }

      // 4. Khoảng giá (minPrice, maxPrice)
      const price = Number(item.price) || 0;
      if (criteria.minPrice != null && criteria.minPrice !== "") {
        if (price < Number(criteria.minPrice)) return false;
      }
      if (criteria.maxPrice != null && criteria.maxPrice !== "") {
        if (price > Number(criteria.maxPrice)) return false;
      }

      // 5. Đánh giá tối thiểu (minRating)
      if (criteria.minRating != null && criteria.minRating !== "") {
        const rating = Number(item.rating) || 0;
        if (rating < Number(criteria.minRating)) return false;
      }

      // 6. Độ mới tối thiểu (minCond cho C2C, hàng Mall mặc định là 100%)
      if (criteria.minCond != null && criteria.minCond !== "") {
        const cond = Number(item.cond) || (item.type === "mall" ? 100 : 0);
        if (cond < Number(criteria.minCond)) return false;
      }

      // 7. Flash sale (true/false)
      if (criteria.flash != null) {
        const isFlash = Boolean(item.flash || (item.off && item.off > 0));
        if (Boolean(criteria.flash) !== isFlash) return false;
      }

      // 8. Hỗ trợ bất kỳ thuộc tính lọc mở rộng nào khác
      for (const [key, value] of Object.entries(criteria)) {
        if (
          [
            "keyword",
            "search",
            "q",
            "name",
            "category",
            "categories",
            "type",
            "minPrice",
            "maxPrice",
            "minRating",
            "minCond",
            "flash",
          ].includes(key)
        ) {
          continue;
        }
        if (value == null || value === "" || value === "all") continue;

        if (typeof value === "function") {
          if (!value(item[key], item)) return false;
        } else if (Array.isArray(value)) {
          if (!value.includes(item[key])) return false;
        } else if (item[key] !== value) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sắp xếp danh sách sản phẩm theo tiêu chí được chỉ định
   * @param {Array<object>} list - Mảng sản phẩm cần sắp xếp
   * @param {string|Function} key - Tiêu chí sắp xếp:
   *   - 'price-asc', 'price_asc', 'priceAsc', 'priceLow': Giá tăng dần
   *   - 'price-desc', 'price_desc', 'priceDesc', 'priceHigh': Giá giảm dần
   *   - 'rating-desc', 'rating_desc', 'ratingHigh', 'rating': Đánh giá cao nhất
   *   - 'rating-asc', 'rating_asc': Đánh giá thấp nhất
   *   - 'name-asc', 'name_asc', 'name': Tên A-Z (chuẩn tiếng Việt)
   *   - 'name-desc', 'name_desc': Tên Z-A
   *   - 'cond-desc', 'cond_desc', 'cond': Độ mới giảm dần
   *   - 'newest', 'latest': Mới nhất
   *   - Hoặc hàm so sánh tùy chỉnh: (a, b) => number
   *   - Hoặc tên trường tổng quát: ví dụ "price" (tăng dần), "-price" (giảm dần)
   * @returns {Array<object>} Mảng mới sau khi sắp xếp (không thay đổi mảng ban đầu)
   */
  function sortProducts(list, key = "default") {
    if (!Array.isArray(list)) return [];
    const cloned = [...list];

    if (typeof key === "function") {
      return cloned.sort(key);
    }

    switch (key) {
      case "price-asc":
      case "price_asc":
      case "priceAsc":
      case "priceLow":
        return cloned.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));

      case "price-desc":
      case "price_desc":
      case "priceDesc":
      case "priceHigh":
        return cloned.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));

      case "rating-desc":
      case "rating_desc":
      case "rating":
      case "ratingHigh":
        return cloned.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

      case "rating-asc":
      case "rating_asc":
        return cloned.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));

      case "name-asc":
      case "name_asc":
      case "name":
        return cloned.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""), "vi")
        );

      case "name-desc":
      case "name_desc":
        return cloned.sort((a, b) =>
          String(b.name || "").localeCompare(String(a.name || ""), "vi")
        );

      case "cond-desc":
      case "cond_desc":
      case "cond":
        return cloned.sort((a, b) => (Number(b.cond) || 0) - (Number(a.cond) || 0));

      case "newest":
      case "latest":
        return cloned.sort((a, b) => String(b.id || "").localeCompare(String(a.id || "")));

      default:
        // Hỗ trợ trường hợp sắp xếp theo tên trường tùy chỉnh
        if (typeof key === "string" && key.startsWith("-")) {
          const field = key.slice(1);
          return cloned.sort((a, b) => {
            const valA = a ? a[field] : null;
            const valB = b ? b[field] : null;
            if (typeof valA === "number" || typeof valB === "number") {
              return (Number(valB) || 0) - (Number(valA) || 0);
            }
            return String(valB || "").localeCompare(String(valA || ""), "vi");
          });
        } else if (typeof key === "string" && key && key !== "default") {
          const field = key;
          return cloned.sort((a, b) => {
            const valA = a ? a[field] : null;
            const valB = b ? b[field] : null;
            if (typeof valA === "number" || typeof valB === "number") {
              return (Number(valA) || 0) - (Number(valB) || 0);
            }
            return String(valA || "").localeCompare(String(valB || ""), "vi");
          });
        }
        return cloned;
    }
  }

  /**
   * Phân trang danh sách dữ liệu
   * @param {Array<any>} list - Toàn bộ mảng dữ liệu cần phân trang
   * @param {number} [page=1] - Trang hiện tại (1-based)
   * @param {number} [size=10] - Số phần tử trên mỗi trang
   * @returns {{ items: Array<any>, page: number, totalPages: number, total: number, size: number, hasPrev: boolean, hasNext: boolean }}
   */
  function paginate(list, page = 1, size = 10) {
    const total = Array.isArray(list) ? list.length : 0;
    const pageSize = Math.max(1, Number(size) || 10);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Giới hạn trang hợp lệ giữa 1 và totalPages
    const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages));

    const startIndex = (currentPage - 1) * pageSize;
    const items = Array.isArray(list) ? list.slice(startIndex, startIndex + pageSize) : [];

    return {
      items,
      page: currentPage,
      totalPages,
      total,
      size: pageSize,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  }

  /* =========================================================================
     7. EXPORT & ĐĂNG KÝ HỆ THỐNG
     ========================================================================= */

  const Utils = {
    escapeHtml,
    getUsedDiscountPercent,
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
  };

  // Đăng ký toàn cục trên window khi chạy trên trình duyệt
  if (typeof window !== "undefined") {
    window.Utils = Utils;
    window.escapeHtml = escapeHtml;
    window.getUsedDiscountPercent = getUsedDiscountPercent;
    window.formatCurrency = formatCurrency;
    window.formatDate = formatDate;
    window.toast = toast;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.confirm = confirm;
    window.startCountdown = startCountdown;
    window.renderStars = renderStars;
    window.filterProducts = filterProducts;
    window.sortProducts = sortProducts;
    window.paginate = paginate;
  }

  // Hỗ trợ CommonJS module khi chạy unit test trên Node.js
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Utils;
  }
})(typeof window !== "undefined" ? window : globalThis);
