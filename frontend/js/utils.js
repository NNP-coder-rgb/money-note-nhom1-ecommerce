/**
 * utils.js — Thư viện hàm tiện ích dùng chung cho toàn bộ sàn HYBRID.STORE
 * Bao gồm:
 * 1) Định dạng: formatCurrency, formatDate
 * 2) Thông báo & Modal: toast, openModal, closeModal, confirm
 * 3) Đếm ngược: startCountdown (flash sale, đếm ngược 48 giờ)
 * 4) Đánh giá: renderStars (sao đầy / nửa / rỗng)
 * 5) Xử lý danh sách: filterProducts (lọc đa điều kiện), sortProducts (sắp xếp), paginate (phân trang)
 */

(function (global) {
  "use strict";

  /* =========================================================================
     1. ĐỊNH DẠNG (formatCurrency, formatDate)
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
     2. THÔNG BÁO & MODAL (toast, openModal, closeModal, confirm)
     ========================================================================= */

  /**
   * Hiển thị thông báo Toast góc dưới màn hình (dựa trên class .toast trong base.css)
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

    // Đảm bảo có container .toast-stack trong body
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
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    };
    const iconName = ICONS[type] || "info";

    toastEl.innerHTML =
      '<div style="display:flex;align-items:flex-start;gap:8px;">' +
      '<span class="material-symbols-outlined icon-sm" style="margin-top:2px;">' +
      iconName +
      "</span>" +
      '<div style="flex:1;">' +
      (title ? '<strong style="display:block;margin-bottom:2px;font-size:13px;">' + title + "</strong>" : "") +
      '<div class="toast-text">' + message + "</div>" +
      "</div>" +
      '<button type="button" class="toast-dismiss" aria-label="Đóng" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0;font-size:16px;line-height:1;">&times;</button>' +
      "</div>";

    stack.appendChild(toastEl);

    let isDismissed = false;
    function dismiss() {
      if (isDismissed) return;
      isDismissed = true;
      toastEl.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translateY(8px)";
      setTimeout(() => {
        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      }, 250);
    }

    const closeBtn = toastEl.querySelector(".toast-dismiss");
    if (closeBtn) closeBtn.addEventListener("click", dismiss);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return toastEl;
  }

  /**
   * Mở modal (áp dụng class is-open cho modal backdrop và modal-open cho body)
   * @param {string|HTMLElement} modalIdOrEl - ID của modal backdrop hoặc DOM element
   */
  function openModal(modalIdOrEl) {
    if (typeof document === "undefined") return;
    const el =
      typeof modalIdOrEl === "string"
        ? document.getElementById(modalIdOrEl) || document.querySelector(modalIdOrEl)
        : modalIdOrEl;

    if (!el) return;

    // Tìm backdrop nếu el là hộp con bên trong
    const backdrop = el.classList.contains("modal-backdrop")
      ? el
      : el.closest(".modal-backdrop") || el;

    backdrop.classList.add("is-open");
    document.body.classList.add("modal-open");

    // Lắng nghe phím ESC để đóng nếu chưa có
    if (!backdrop._escAttached) {
      const escHandler = (e) => {
        if (e.key === "Escape" && backdrop.classList.contains("is-open")) {
          closeModal(backdrop);
        }
      };
      document.addEventListener("keydown", escHandler);
      backdrop._escAttached = true;
    }

    // Tự động focus vào input đầu tiên hoặc nút trong modal
    const focusable = backdrop.querySelector(
      'input:not([type="hidden"]), select, textarea, button.btn-primary, button[type="submit"]'
    );
    if (focusable) focusable.focus();
  }

  /**
   * Đóng modal (xóa class is-open và khôi phục thanh cuộn body)
   * @param {string|HTMLElement} modalIdOrEl - ID của modal backdrop hoặc DOM element
   */
  function closeModal(modalIdOrEl) {
    if (typeof document === "undefined") return;
    const el =
      typeof modalIdOrEl === "string"
        ? document.getElementById(modalIdOrEl) || document.querySelector(modalIdOrEl)
        : modalIdOrEl;

    if (!el) return;

    const backdrop = el.classList.contains("modal-backdrop")
      ? el
      : el.closest(".modal-backdrop") || el;

    backdrop.classList.remove("is-open");

    // Chỉ gỡ modal-open khi không còn backdrop nào mở
    if (!document.querySelector(".modal-backdrop.is-open")) {
      document.body.classList.remove("modal-open");
    }
  }

  /**
   * Hộp thoại xác nhận (trả về Promise và hỗ trợ callbacks onConfirm / onCancel)
   * Ưu tiên tích hợp với showPopup() sẵn có của dự án
   * @param {string|object} messageOrOpts - Nội dung thông báo hoặc opts
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
      // Ưu tiên dùng showPopup của dự án nếu có
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

        // Bắt sự kiện bấm nút Hủy của popup.js (#popupCancel)
        const cancelBtn = document.getElementById("popupCancel");
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
      } else if (typeof global.confirm === "function") {
        const ok = global.confirm(title + "\n\n" + message);
        if (ok) {
          if (typeof onConfirm === "function") onConfirm();
          resolve(true);
        } else {
          if (typeof onCancel === "function") onCancel();
          resolve(false);
        }
      } else {
        if (typeof onConfirm === "function") onConfirm();
        resolve(true);
      }
    });
  }

  /* =========================================================================
     3. ĐẾM NGƯỢC (startCountdown)
     ========================================================================= */

  /**
   * Bộ đếm ngược thời gian (flash sale, đếm ngược khuyến mãi 48 giờ).
   * Cập nhật mỗi giây, khi hết giờ tự động dọn clearInterval và gọi onEnd.
   *
   * @param {Date|number|string} endsAt - Thời điểm kết thúc (Date, timestamp, hoặc số giây còn lại từ bây giờ)
   * @param {HTMLElement|string|object} [element] - DOM element, CSS selector, hoặc object { d, h, m, s }
   * @param {Function} [onEnd] - Callback khi đếm ngược về 0
   * @returns {{ intervalId: number, stop: Function, getRemaining: Function }}
   */
  function startCountdown(endsAt, element, onEnd) {
    let targetMs;
    if (endsAt instanceof Date) {
      targetMs = endsAt.getTime();
    } else if (typeof endsAt === "number") {
      // Nếu số nhỏ hơn 1e11 coi như số giây tương đối từ thời điểm gọi
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

    function tick() {
      if (isStopped) return;
      const now = Date.now();
      const remainingMs = targetMs - now;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));

      const days = Math.floor(remainingSec / 86400);
      const hours = Math.floor((remainingSec % 86400) / 3600);
      const totalHours = Math.floor(remainingSec / 3600);
      const minutes = Math.floor((remainingSec % 3600) / 60);
      const seconds = remainingSec % 60;

      // Cập nhật DOM
      if (resolvedEl) {
        if (typeof resolvedEl === "object" && (resolvedEl.h || resolvedEl.m || resolvedEl.s || resolvedEl.d)) {
          // Trường hợp object các node con: { d, h, m, s }
          if (resolvedEl.d) resolvedEl.d.textContent = pad(days);
          if (resolvedEl.h) resolvedEl.h.textContent = pad(resolvedEl.d ? hours : totalHours);
          if (resolvedEl.m) resolvedEl.m.textContent = pad(minutes);
          if (resolvedEl.s) resolvedEl.s.textContent = pad(seconds);
        } else if (typeof resolvedEl.querySelector === "function") {
          // Tìm các phần tử con chuyên biệt trước
          const dEl = resolvedEl.querySelector("[data-unit='d'], .days, #fs-d");
          const hEl = resolvedEl.querySelector("[data-unit='h'], .hours, #fs-h");
          const mEl = resolvedEl.querySelector("[data-unit='m'], .minutes, #fs-m");
          const sEl = resolvedEl.querySelector("[data-unit='s'], .seconds, #fs-s");

          if (hEl && mEl && sEl) {
            if (dEl) dEl.textContent = pad(days);
            hEl.textContent = pad(dEl ? hours : totalHours);
            mEl.textContent = pad(minutes);
            sEl.textContent = pad(seconds);
          } else {
            const units = resolvedEl.querySelectorAll(".countdown-unit");
            if (units.length === 4) {
              units[0].textContent = pad(days);
              units[1].textContent = pad(hours);
              units[2].textContent = pad(minutes);
              units[3].textContent = pad(seconds);
            } else if (units.length === 3) {
              units[0].textContent = pad(totalHours);
              units[1].textContent = pad(minutes);
              units[2].textContent = pad(seconds);
            } else {
              resolvedEl.textContent =
                (days > 0 ? pad(days) + "d " : "") +
                pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
            }
          }
        } else if (resolvedEl && typeof resolvedEl === "object" && "textContent" in resolvedEl) {
          resolvedEl.textContent =
            (days > 0 ? pad(days) + "d " : "") +
            pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
        }
      }

      if (remainingSec <= 0) {
        stop();
        if (typeof onEnd === "function") {
          onEnd();
        }
      }
    }

    function stop() {
      if (isStopped) return;
      isStopped = true;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    // Chạy tick ngay lập tức lần đầu để không trễ 1s
    tick();

    if (!isStopped) {
      intervalId = setInterval(tick, 1000);
    }

    return {
      intervalId,
      stop,
      getRemaining() {
        return Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
      },
    };
  }

  /* =========================================================================
     4. ĐÁNH GIÁ SAO (renderStars)
     ========================================================================= */

  /**
   * Tạo chuỗi đánh giá sao gồm sao đầy (★), sao nửa (½), và sao rỗng (☆).
   * Hỗ trợ xuất HTML với Material Symbols khi truyền options.html = true.
   *
   * @param {number} rating - Điểm đánh giá (ví dụ: 4.8, 3.5, 5, 0)
   * @param {object|boolean} [options={}] - Tuỳ chọn { max: 5, html: false } hoặc cờ boolean asHtml
   * @returns {string} Chuỗi sao ví dụ "★★★★½", "★★★½☆", hoặc HTML
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
        html += '<span class="material-symbols-outlined star filled">star</span>';
      }
      if (half) {
        html += '<span class="material-symbols-outlined star filled">star_half</span>';
      }
      for (let i = 0; i < empty; i++) {
        html += '<span class="material-symbols-outlined star">star</span>';
      }
      html += '<span class="rating-value">' + num.toFixed(1) + "</span>";
      html += "</span>";
      return html;
    }

    // Trả chuỗi sao đầy/nửa/rỗng ký tự Unicode chuẩn
    return "★".repeat(effectiveFull) + (half ? "½" : "") + "☆".repeat(empty);
  }

  // Tiện ích phụ trợ xuất HTML trực tiếp
  renderStars.toHTML = function (rating, max = 5) {
    return renderStars(rating, { html: true, max });
  };

  /* =========================================================================
     5. XỬ LÝ DANH SÁCH (filterProducts, sortProducts, paginate)
     ========================================================================= */

  /**
   * Lọc danh sách sản phẩm theo nhiều điều kiện đồng thời
   * @param {Array<object>} list - Mảng sản phẩm cần lọc
   * @param {object} criteria - Điều kiện lọc:
   *   - keyword / search / q / name: từ khóa tìm kiếm trong tên, mô tả, người bán, tag
   *   - category / categories: danh mục ('fashion', 'sneakers', 'tech', 'appliances', hoặc 'all')
   *   - type: loại hàng ('mall', 'c2c', hoặc 'all')
   *   - minPrice, maxPrice: khoảng giá
   *   - minRating: điểm đánh giá tối thiểu (ví dụ: 4, 4.5)
   *   - minCond: độ mới tối thiểu cho hàng C2C (ví dụ: 90, 95, 98)
   *   - flash: lọc sản phẩm flash sale (true/false)
   * @returns {Array<object>} Danh sách sau khi lọc (mảng mới, không sửa mảng gốc)
   */
  function filterProducts(list, criteria = {}) {
    if (!Array.isArray(list)) return [];
    if (!criteria || Object.keys(criteria).length === 0) return [...list];

    return list.filter((item) => {
      // 1. Từ khóa tìm kiếm
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

        if (!fullText.includes(keyword) && !cleanFull.includes(cleanKw)) return false;
      }

      // 2. Danh mục (category)
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

      // 6. Độ mới tối thiểu (minCond)
      if (criteria.minCond != null && criteria.minCond !== "") {
        const cond = Number(item.cond) || 100;
        if (cond < Number(criteria.minCond)) return false;
      }

      // 7. Flash sale
      if (criteria.flash != null) {
        const isFlash = Boolean(item.flash || (item.off && item.off > 0));
        if (Boolean(criteria.flash) !== isFlash) return false;
      }

      // 8. Hỗ trợ bất kỳ thuộc tính khớp trực tiếp nào khác
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
   * Sắp xếp danh sách sản phẩm theo tiêu chí
   * @param {Array<object>} list - Mảng sản phẩm cần sắp xếp
   * @param {string|Function} key - Tiêu chí sắp xếp:
   *   - 'price-asc', 'price_asc', 'priceAsc', 'priceLow': Giá tăng dần
   *   - 'price-desc', 'price_desc', 'priceDesc', 'priceHigh': Giá giảm dần
   *   - 'rating-desc', 'rating_desc', 'ratingHigh', 'rating': Đánh giá cao nhất
   *   - 'rating-asc': Đánh giá thấp nhất
   *   - 'name-asc', 'name_asc', 'name': Tên từ A-Z
   *   - 'name-desc', 'name_desc': Tên từ Z-A
   *   - 'cond-desc', 'cond_desc', 'cond': Độ mới cao nhất
   *   - 'newest', 'latest': Mới nhất
   *   - Hoặc hàm so sánh tùy chỉnh: (a, b) => number
   * @returns {Array<object>} Mảng mới sau khi sắp xếp (không sửa mảng gốc)
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
        // Hỗ trợ sắp xếp theo tên trường tổng quát: ví dụ "price" hoặc "-price"
        if (typeof key === "string" && key.startsWith("-")) {
          const field = key.slice(1);
          return cloned.sort((a, b) => {
            if (typeof a[field] === "number") {
              return (Number(b[field]) || 0) - (Number(a[field]) || 0);
            }
            return String(b[field] || "").localeCompare(String(a[field] || ""), "vi");
          });
        } else if (typeof key === "string" && key && key !== "default") {
          const field = key;
          return cloned.sort((a, b) => {
            if (typeof a[field] === "number") {
              return (Number(a[field]) || 0) - (Number(b[field]) || 0);
            }
            return String(a[field] || "").localeCompare(String(b[field] || ""), "vi");
          });
        }
        return cloned;
    }
  }

  /**
   * Phân trang danh sách dữ liệu
   * @param {Array<any>} list - Toàn bộ danh sách cần phân trang
   * @param {number} [page=1] - Trang hiện tại (1-based)
   * @param {number} [size=10] - Số phần tử trên mỗi trang
   * @returns {{ items: Array<any>, page: number, totalPages: number, total: number }}
   */
  function paginate(list, page = 1, size = 10) {
    const total = Array.isArray(list) ? list.length : 0;
    const pageSize = Math.max(1, Number(size) || 10);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Clamp trang giữa 1 và totalPages
    const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages));

    const startIndex = (currentPage - 1) * pageSize;
    const items = Array.isArray(list) ? list.slice(startIndex, startIndex + pageSize) : [];

    return {
      items,
      page: currentPage,
      totalPages,
      total,
      // Thuộc tính tiện ích phụ trợ
      size: pageSize,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  }

  /* =========================================================================
     6. QUẢN LÝ GIỎ HÀNG (Cart) - Task [FE] T12
     ========================================================================= */
  const CART_STORAGE_KEY = "hv_cart_items";

  const Cart = {
    getItems() {
      if (typeof localStorage === "undefined") return [];
      try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
      } catch (e) {
        return [];
      }
    },
    saveItems(items) {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items } }));
        Cart.syncBadge();
      }
    },
    addItem(product, qty = 1, variant = null) {
      if (!product || !product.id) return false;
      const items = Cart.getItems();
      const numQty = Math.max(1, Number(qty) || 1);
      const existing = items.find(
        (item) => item.id === product.id && item.variant === (variant || ""),
      );
      if (existing) {
        existing.qty += numQty;
      } else {
        const discountPct =
          product.type === "c2c" && product.oldPrice && product.price
            ? Math.round((1 - product.price / product.oldPrice) * 100)
            : product.off || 0;

        items.push({
          id: product.id,
          name: product.name || product.short,
          price: Number(product.price) || 0,
          oldPrice: Number(product.oldPrice) || 0,
          type: product.type || "mall",
          condition:
            product.condition ||
            product.condText ||
            (product.type === "mall" ? "Mới 100%" : "Like New"),
          discountPercent: discountPct,
          img: product.img || "",
          category: product.category || "",
          variant: variant || "",
          qty: numQty,
        });
      }
      Cart.saveItems(items);
      if (typeof toast === "function") {
        toast({
          title: "Đã thêm vào giỏ hàng",
          message: `${product.short || product.name} (${numQty} món)`,
          type: "success",
        });
      }
      return true;
    },
    updateQty(productId, qty, variant = null) {
      const items = Cart.getItems();
      const numQty = Number(qty);
      const idx = items.findIndex(
        (i) => i.id === productId && (!variant || i.variant === variant),
      );
      if (idx === -1) return false;
      if (numQty <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx].qty = numQty;
      }
      Cart.saveItems(items);
      return true;
    },
    removeItem(productId, variant = null) {
      let items = Cart.getItems();
      items = items.filter(
        (i) => !(i.id === productId && (!variant || i.variant === variant)),
      );
      Cart.saveItems(items);
      return true;
    },
    clear() {
      Cart.saveItems([]);
    },
    getCount() {
      const items = Cart.getItems();
      return items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    },
    getSubtotal() {
      const items = Cart.getItems();
      return items.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
        0,
      );
    },
    syncBadge(selector = "#cartCount") {
      if (typeof document === "undefined") return;
      const count = Cart.getCount();
      const badges = document.querySelectorAll(selector);
      badges.forEach((el) => {
        el.textContent = count;
        el.style.display = count > 0 ? "inline-flex" : "none";
      });
    },
  };

  /* =========================================================================
     7. BỘ VALIDATE BIỂU MẪU (Validator) - Task [FE] T12
     ========================================================================= */
  const Validator = {
    isEmail(email) {
      if (!email || typeof email !== "string") return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    },
    isPhone(phone) {
      if (!phone) return false;
      const clean = String(phone).replace(/\D/g, "");
      return (
        /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(clean) ||
        (clean.length >= 10 && clean.length <= 11)
      );
    },
    isNotEmpty(value) {
      if (value == null) return false;
      return String(value).trim().length > 0;
    },
    isMinLength(value, min = 6) {
      if (!value) return false;
      return String(value).trim().length >= min;
    },
    isCCCD(cccd) {
      if (!cccd) return false;
      const clean = String(cccd).replace(/\D/g, "");
      return clean.length === 12;
    },
    isPasswordValid(password, min = 6) {
      if (!password || typeof password !== "string") return false;
      return password.trim().length >= min;
    },
    validateForm(formData, rules) {
      const errors = {};
      let isValid = true;
      if (!formData || !rules) return { isValid, errors };

      for (const [field, ruleSet] of Object.entries(rules)) {
        const val = formData[field];
        if (ruleSet.required && !Validator.isNotEmpty(val)) {
          errors[field] = ruleSet.requiredMessage || `${field} không được để trống`;
          isValid = false;
          continue;
        }
        if (val && ruleSet.email && !Validator.isEmail(val)) {
          errors[field] = ruleSet.emailMessage || "Email không đúng định dạng";
          isValid = false;
          continue;
        }
        if (val && ruleSet.phone && !Validator.isPhone(val)) {
          errors[field] = ruleSet.phoneMessage || "Số điện thoại không hợp lệ";
          isValid = false;
          continue;
        }
        if (val && ruleSet.cccd && !Validator.isCCCD(val)) {
          errors[field] = ruleSet.cccdMessage || "CCCD phải gồm đúng 12 chữ số";
          isValid = false;
          continue;
        }
        if (val && ruleSet.minLength && !Validator.isMinLength(val, ruleSet.minLength)) {
          errors[field] = ruleSet.minLengthMessage || `Tối thiểu ${ruleSet.minLength} ký tự`;
          isValid = false;
          continue;
        }
      }
      return { isValid, errors };
    },
  };

  /* =========================================================================
     8. ĐĂNG NHẬP GIẢ & QUẢN LÝ PHIÊN (Auth) - Task [FE] T12
     ========================================================================= */
  const AUTH_STORAGE_KEY = "hv_current_user";

  const Auth = {
    current() {
      if (typeof localStorage === "undefined") return null;
      try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
      } catch (e) {
        return null;
      }
    },
    getCurrentUser() {
      return Auth.current();
    },
    isAuthenticated() {
      const user = Auth.current();
      return !!(user && user.isAuthenticated);
    },
    mockLogin(emailOrUsername, password, role = "buyer") {
      const cleanIdentifier = String(emailOrUsername || "phuc.nn@gmail.com").trim();
      const userRole = role || "buyer";

      let matchedUser = null;
      if (typeof MOCK_USERS !== "undefined" && Array.isArray(MOCK_USERS)) {
        matchedUser = MOCK_USERS.find(
          (u) =>
            u.email.toLowerCase() === cleanIdentifier.toLowerCase() ||
            u.username.toLowerCase() === cleanIdentifier.toLowerCase(),
        );
      }

      const sessionUser = {
        id: matchedUser ? matchedUser.id : "u_" + Date.now(),
        username: matchedUser ? matchedUser.username : cleanIdentifier.split("@")[0],
        email: matchedUser ? matchedUser.email : cleanIdentifier,
        fullName: matchedUser ? matchedUser.fullName : "Nguyễn Ngọc Phúc",
        role: userRole,
        phone: matchedUser ? matchedUser.phone : "0912 345 678",
        avatar: matchedUser ? matchedUser.avatar : "P",
        ekycStatus: matchedUser ? matchedUser.ekycStatus : "verified",
        isAuthenticated: true,
        loginAt: new Date().toISOString(),
      };

      if (typeof localStorage !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:changed", { detail: { user: sessionUser } }),
        );
      }
      return { success: true, user: sessionUser };
    },
    mockLogout() {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:changed", { detail: { user: null } }),
        );
      }
      return true;
    },
    login(emailOrUsername, password, role) {
      return Auth.mockLogin(emailOrUsername, password, role);
    },
    logout() {
      return Auth.mockLogout();
    },
    switchRole(newRole) {
      const user = Auth.current() || {
        id: "u1",
        username: "phuc_buyer",
        fullName: "Nguyễn Ngọc Phúc",
        email: "phuc.nn@gmail.com",
        role: "buyer",
        phone: "0912 345 678",
        avatar: "P",
        isAuthenticated: true,
      };
      user.role = newRole;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:changed", { detail: { user } }),
        );
      }
      return user;
    },
    requireLogin(options = {}) {
      if (typeof window !== "undefined" && window.Auth && typeof window.Auth.requireLogin === "function" && window.Auth !== Auth) {
        return window.Auth.requireLogin(options);
      }
      if (!Auth.current()) {
        const isSubpage = typeof window !== "undefined" && window.location.pathname.includes("/pages/");
        const loginPage = isSubpage ? "../account/auth_login.html" : "pages/account/auth_login.html";
        let returnUrl = options.returnUrl || (typeof window !== "undefined" ? window.location.href : "");
        if (returnUrl && typeof window !== "undefined") {
          try {
            returnUrl = new URL(returnUrl, window.location.href).href;
          } catch (e) {}
        }
        if (typeof sessionStorage !== "undefined" && returnUrl) {
          sessionStorage.setItem("hv_redirect_after_login", returnUrl);
        }
        if (typeof window !== "undefined") {
          window.location.href = loginPage + (returnUrl ? "?redirect=" + encodeURIComponent(returnUrl) : "");
        }
        return false;
      }
      return true;
    },
    ensureLogin(actionCallback, options = {}) {
      if (typeof window !== "undefined" && window.Auth && typeof window.Auth.ensureLogin === "function" && window.Auth !== Auth) {
        return window.Auth.ensureLogin(actionCallback, options);
      }
      if (!Auth.current()) {
        const isSubpage = typeof window !== "undefined" && window.location.pathname.includes("/pages/");
        const loginPage = isSubpage ? "../account/auth_login.html" : "pages/account/auth_login.html";
        let returnUrl = options.returnUrl || (typeof window !== "undefined" ? window.location.href : "");
        if (returnUrl && typeof window !== "undefined") {
          try {
            returnUrl = new URL(returnUrl, window.location.href).href;
          } catch (e) {}
        }
        if (typeof sessionStorage !== "undefined" && returnUrl) {
          sessionStorage.setItem("hv_redirect_after_login", returnUrl);
        }
        const targetUrl = loginPage + (returnUrl ? "?redirect=" + encodeURIComponent(returnUrl) : "");
        const promptTitle = options.title || "Cần Đăng Nhập Tài Khoản";
        const promptMessage = options.message || "Vui lòng đăng nhập tài khoản để tiếp tục thao tác.";

        if (typeof showPopup === "function") {
          showPopup({
            type: "warning",
            title: promptTitle,
            message: promptMessage,
            confirmText: "Đăng Nhập Ngay",
            showCancel: true,
            cancelText: "Để sau",
            onConfirm: () => {
              if (typeof window !== "undefined") window.location.href = targetUrl;
            },
          });
        } else if (typeof Utils !== "undefined" && typeof Utils.confirm === "function") {
          Utils.confirm(
            {
              title: promptTitle,
              message: promptMessage,
              confirmText: "Đăng Nhập Ngay",
              cancelText: "Hủy",
            },
            () => {
              if (typeof window !== "undefined") window.location.href = targetUrl;
            }
          );
        } else if (typeof window !== "undefined") {
          window.location.href = targetUrl;
        }
        return false;
      }
      if (typeof actionCallback === "function") actionCallback(Auth.current());
      return true;
    },
  };

  /* =========================================================================
     9. TRẢ GIÁ & THƯƠNG LƯỢNG ĐỒ CŨ (Offer) - Task [FE] T12
     ========================================================================= */
  const OFFER_STORAGE_KEY = "hv_product_offers";

  const Offer = {
    getOffers(productId = null) {
      if (typeof localStorage === "undefined") return [];
      try {
        const raw = JSON.parse(localStorage.getItem(OFFER_STORAGE_KEY)) || [];
        if (!productId) return raw;
        return raw.filter((o) => o.productId === productId);
      } catch (e) {
        return [];
      }
    },
    saveOffers(offers) {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify(offers));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("offers:updated", { detail: { offers } }),
        );
      }
    },
    submitOffer({
      productId,
      productName,
      originalPrice,
      offerPrice,
      message = "",
      buyerName = "Người mua ẩn danh",
      buyerPhone = "",
    }) {
      const orig = Number(originalPrice) || 0;
      const offered = Number(offerPrice) || 0;

      if (!productId) {
        return { success: false, message: "Thiếu mã sản phẩm cần trả giá" };
      }
      if (offered <= 0) {
        return { success: false, message: "Mức giá đề xuất phải lớn hơn 0" };
      }
      if (orig > 0 && offered > orig) {
        return {
          success: false,
          message: "Giá trả không được cao hơn giá người bán niêm yết",
        };
      }
      if (orig > 0 && offered < orig * 0.5) {
        return {
          success: false,
          message: "Mức giá trả quá thấp (tối thiểu 50% giá niêm yết)",
        };
      }

      const discountPercent =
        orig > 0 ? Math.round((1 - offered / orig) * 100) : 0;
      const newOffer = {
        id: "OFFER-" + Date.now().toString(36).toUpperCase(),
        productId,
        productName: productName || "Sản phẩm C2C",
        originalPrice: orig,
        offerPrice: offered,
        discountPercent,
        message: message.trim(),
        buyerName,
        buyerPhone,
        status: "pending", // 'pending' | 'accepted' | 'rejected' | 'countered'
        createdAt: new Date().toISOString(),
      };

      const offers = Offer.getOffers();
      offers.unshift(newOffer);
      Offer.saveOffers(offers);

      if (typeof toast === "function") {
        toast({
          title: "Đã gửi đề nghị trả giá!",
          message: `Mức giá: ${formatCurrency(offered)} (-${discountPercent}%)`,
          type: "success",
        });
      }

      return { success: true, offer: newOffer };
    },
    updateOfferStatus(offerId, newStatus) {
      const offers = Offer.getOffers();
      const target = offers.find((o) => o.id === offerId);
      if (!target) return false;
      target.status = newStatus;
      Offer.saveOffers(offers);
      return true;
    },
    calculateOfferDiscount(originalPrice, offerPrice) {
      return getUsedDiscountPercent(offerPrice, originalPrice);
    },
  };

  /**
   * Tính phần trăm rẻ hơn của đồ cũ so với đồ mới
   */
  function getUsedDiscountPercent(usedPrice, newPrice) {
    if (usedPrice == null || newPrice == null || Number(newPrice) <= 0) return 0;
    const used = Number(usedPrice);
    const original = Number(newPrice);
    if (isNaN(used) || isNaN(original) || used < 0) return 0;
    const diff = 1 - used / original;
    return Math.max(0, Math.min(100, Math.round(diff * 100)));
  }

  /* =========================================================================
     10. QUẢN LÝ GIAO DIỆN SÁNG / TỐI (Theme Manager)
     ========================================================================= */
  const THEME_STORAGE_KEY = "hybrid_theme";

  const Theme = {
    KEY: THEME_STORAGE_KEY,
    DEFAULT: "dark",

    get() {
      if (typeof localStorage === "undefined") return this.DEFAULT;
      try {
        return localStorage.getItem(this.KEY) || this.DEFAULT;
      } catch (e) {
        return this.DEFAULT;
      }
    },

    set(theme) {
      const mode = theme === "light" ? "light" : "dark";
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(this.KEY, mode);
        } catch (e) {}
      }
      this.apply(mode);
      return mode;
    },

    toggle() {
      const current = this.get();
      const next = current === "light" ? "dark" : "light";
      return this.set(next);
    },

    apply(theme) {
      const mode = theme || this.get();
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        if (root) {
          root.setAttribute("data-theme", mode);
          root.classList.toggle("light-theme", mode === "light");
        }
        if (document.body) {
          document.body.classList.toggle("light-theme", mode === "light");
        }
        this.updateButtons(mode);
      }
      return mode;
    },

    updateButtons(theme) {
      if (typeof document === "undefined") return;
      const isLight = theme === "light";
      const iconName = isLight ? "dark_mode" : "light_mode";
      const tooltip = isLight
        ? "Chuyển sang giao diện Tối (Midnight Cyber)"
        : "Chuyển sang giao diện Sáng (Nền trắng)";

      const buttons = document.querySelectorAll(".theme-toggle-btn, #themeToggleBtn");
      buttons.forEach((btn) => {
        btn.setAttribute("title", tooltip);
        btn.setAttribute("aria-label", tooltip);
        const icon = btn.querySelector(".material-symbols-outlined, .theme-toggle-icon");
        if (icon) {
          icon.textContent = iconName;
        }
      });
    },

    init() {
      if (typeof document === "undefined") return;
      const theme = this.get();
      this.apply(theme);

      // Lắng nghe sự kiện click nút chuyển đổi giao diện
      document.addEventListener("click", (e) => {
        const btn = e.target.closest(".theme-toggle-btn, #themeToggleBtn");
        if (btn) {
          e.preventDefault();
          const newTheme = Theme.toggle();
          if (typeof toast === "function") {
            toast({
              title: newTheme === "light" ? "Giao diện Sáng" : "Giao diện Tối",
              message:
                newTheme === "light"
                  ? "Đã chuyển sang giao diện nền trắng hiện đại"
                  : "Đã chuyển sang giao diện Midnight Cyber Violet",
              type: "info",
              duration: 2000,
            });
          }
        }
      });
    },
  };

  /* =========================================================================
     11. XUẤT RA TOÀN CỤC VÀ MODULE (CHO NODE.JS / TRÌNH DUYỆT)
     ========================================================================= */

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const Utils = {
    escapeHtml,
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
    Cart,
    Validator,
    Auth,
    Offer,
    Theme,
    getUsedDiscountPercent,
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // Đăng ký toàn cục trên window
  if (typeof window !== "undefined") {
    window.$ = window.$ || $;
    window.$$ = window.$$ || $$;
    window.Utils = Utils;
    window.escapeHtml = escapeHtml;
    // Gắn trực tiếp lên window để gọi tự nhiên: formatCurrency(...), toast(...), ...
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
    window.Cart = Cart;
    window.Validator = Validator;
    if (typeof window.Auth !== "undefined") {
      Object.assign(Auth, window.Auth);
      Utils.Auth = window.Auth;
    } else {
      window.Auth = Auth;
    }
    window.Offer = Offer;
    window.Theme = Theme;
    window.getUsedDiscountPercent = getUsedDiscountPercent;

    // Tự động khởi tạo Theme & Giỏ hàng khi trang tải xong (nếu chạy trong trình duyệt)
    if (typeof document !== "undefined") {
      Theme.init();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          Cart.syncBadge();
          Theme.updateButtons(Theme.get());
        });
      } else {
        Cart.syncBadge();
        Theme.updateButtons(Theme.get());
      }
    }
  }

  // Hỗ trợ CommonJS module cho unit test với Node.js
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Utils;
  }
})(typeof window !== "undefined" ? window : globalThis);
