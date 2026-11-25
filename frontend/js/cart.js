/**
 * cart.js — Xử lý logic Giỏ hàng & Thanh toán cho HYBRID.STORE
 */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // Các phần tử DOM chính
  const dom = {
    cartEmptyView: $("#cartEmptyView"),
    cartLayoutView: $("#cartLayoutView"),
    cartItemsList: $("#cartItemsList"),
    clearCartBtn: $("#clearCartBtn"),
    cartCount: $("#cartCount"),
    // Tóm tắt tiền
    summaryTotalQty: $("#summaryTotalQty"),
    summarySubtotal: $("#summarySubtotal"),
    summaryDiscount: $("#summaryDiscount"),
    summaryTotal: $("#summaryTotal"),
    voucherRow: $("#voucherRow"),
    voucherCodeText: $("#voucherCodeText"),
    voucherInput: $("#voucherInput"),
    applyVoucherBtn: $("#applyVoucherBtn"),
    // Form thanh toán
    checkoutForm: $("#checkoutForm"),
    customerName: $("#customerName"),
    customerPhone: $("#customerPhone"),
    customerAddress: $("#customerAddress"),
    orderNote: $("#orderNote"),
    paymentRadios: $$("input[name='paymentMethod']"),
    qrPayBox: $("#qrPayBox"),
    qrTransferMemo: $("#qrTransferMemo"),
    // Modal thành công
    successModal: $("#successModal"),
    modalOrderId: $("#modalOrderId"),
    modalCustomerName: $("#modalCustomerName"),
    modalCustomerPhone: $("#modalCustomerPhone"),
    modalTotal: $("#modalTotal"),
    modalPayment: $("#modalPayment"),
    // Avatar / user
    avatarBtn: $("#avatarBtn"),
  };

  // Trạng thái voucher
  let appliedVoucher = null;

  /* ---------------- KHỞI TẠO TÀI KHOẢN HIỆN TẠI ---------------- */
  function setupUser() {
    if (typeof Auth === "undefined") return;
    const user = Auth.current();
    if (user && dom.avatarBtn) {
      const initials = (user.fullName || "User")
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      dom.avatarBtn.textContent = initials;
      dom.avatarBtn.title = user.fullName;

      // Điền sẵn thông tin vào form
      if (dom.customerName && !dom.customerName.value) {
        dom.customerName.value = user.fullName || "";
      }
      if (dom.customerPhone && !dom.customerPhone.value) {
        dom.customerPhone.value = user.phone || "";
      }
    }
  }

  /* ---------------- KHỞI TẠO DỮ LIỆU MẪU BAN ĐẦU ---------------- */
  function ensureInitialCart() {
    if (typeof Utils === "undefined" || !Utils.Cart) return;
    let current = Utils.Cart.getItems();

    // Tự động dọn dẹp và nâng cấp các ID cũ (m01 -> f2, c01 -> t2) hoặc link ảnh ngoài nếu còn lưu trong localStorage
    let updated = false;
    current = current.map((item) => {
      let realId = item.id;
      if (item.id === "m01") realId = "f2";
      if (item.id === "c01") realId = "t2";

      if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) {
        const p = PRODUCTS.find((x) => String(x.id).toLowerCase() === String(realId).toLowerCase());
        if (p) {
          if (item.id !== p.id || item.name !== p.name || item.img !== p.img) {
            updated = true;
            return {
              id: p.id,
              name: p.name,
              price: p.price,
              oldPrice: p.oldPrice || 0,
              type: p.type,
              condition: p.condText || (p.type === "mall" ? "Mới 100%" : "Like New 99%"),
              variant: item.variant || (p.type === "mall" ? "Size L • Mới nguyên seal" : "Bản 256GB • Like New 99%"),
              discountPercent: p.off || (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0),
              img: p.img,
              category: p.category || "",
              qty: item.qty || 1,
            };
          }
        }
      }
      return item;
    });

    if (updated) {
      Utils.Cart.saveItems(current);
    }

    // Nếu chưa từng bấm xóa giỏ hàng và giỏ hiện đang rỗng, tự nạp 2 món mẫu chuẩn xác từ PRODUCTS
    if (current.length === 0 && !localStorage.getItem("hybrid_cart_cleared")) {
      const prodMall = (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS))
        ? PRODUCTS.find((p) => p.id === "f2")
        : null;
      const prodUsed = (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS))
        ? PRODUCTS.find((p) => p.id === "t2")
        : null;

      if (prodMall) {
        Utils.Cart.addItem(prodMall, 1, "Size L • Mới 100% nguyên seal");
      }
      if (prodUsed) {
        Utils.Cart.addItem(prodUsed, 1, "Titan Tự Nhiên • Like New 99%");
      }
    }
  }

  function renderItemHTML(item) {
    let prod = null;
    if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) {
      prod = PRODUCTS.find((p) => String(p.id).toLowerCase() === String(item.id).toLowerCase());
    }
    const name = (prod && prod.name) || item.name;
    const price = (prod && prod.price) || item.price;
    const oldPrice = (prod && prod.oldPrice) || item.oldPrice;
    const type = (prod && prod.type) || item.type || "mall";
    const isUsed = type === "c2c";
    const lineTotal = price * item.qty;
    const discountPercent =
      item.discountPercent ||
      (isUsed && oldPrice
        ? Math.round((1 - price / oldPrice) * 100)
        : 0);
    const detailUrl = isUsed
      ? `product_used.html?id=${encodeURIComponent(item.id)}`
      : `product_new.html?id=${encodeURIComponent(item.id)}`;
    const rawImg = (prod && prod.img) || item.img || "";
    const imgSrc = (typeof window !== "undefined" && window.resolveAssetUrl ? window.resolveAssetUrl(rawImg) : rawImg) || "../../assets/images/products/phone-sample.svg";

    return `
      <div class="cart-item" data-id="${item.id}" data-variant="${item.variant || ""}">
        <a href="${detailUrl}">
          <img class="cart-item-img" src="${imgSrc}" alt="${name}" />
        </a>
        <div>
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            ${
              isUsed
                ? `<span class="badge badge-c2c">ĐỒ CŨ ${item.condition || "LIKE NEW"} • RẺ HƠN ĐỒ MỚI ${discountPercent}%</span>`
                : `<span class="badge badge-mall">HÀNG MỚI 100% NGUYÊN SEAL</span>`
            }
            ${item.variant ? `<span class="badge badge-secondary">${item.variant}</span>` : ""}
          </div>
          <h4 class="cart-item-title mb-1">
            <a href="${detailUrl}" class="text-hover-primary">${name}</a>
          </h4>
          <div class="flex items-baseline gap-2">
            <strong class="mono text-primary">${Utils.formatCurrency(price)}</strong>
            ${isUsed && oldPrice ? `<small class="text-faint line-through mono">${Utils.formatCurrency(oldPrice)}</small>` : ""}
          </div>
        </div>

        <div class="cart-item-actions flex items-center gap-3">
          <div class="qty-control">
            <button class="qty-btn btn-qty-dec" type="button" aria-label="Giảm">−</button>
            <input class="qty-input" type="text" value="${item.qty}" readonly />
            <button class="qty-btn btn-qty-inc" type="button" aria-label="Tăng">+</button>
          </div>
          <div class="text-right hide-sm" style="min-width: 110px;">
            <strong class="mono text-secondary">${Utils.formatCurrency(lineTotal)}</strong>
          </div>
          <button class="btn btn-ghost text-danger btn-remove-item" type="button" title="Xóa sản phẩm">
            <span class="material-symbols-outlined icon-sm">delete</span>
          </button>
        </div>
      </div>
    `;
  }

  /* ---------------- RENDER GIỎ HÀNG ---------------- */
  function renderCart() {
    const items = Utils.Cart.getItems();
    const count = Utils.Cart.getCount();
    Utils.Cart.syncBadge();

    if (items.length === 0) {
      if (dom.cartEmptyView) dom.cartEmptyView.style.display = "block";
      if (dom.cartLayoutView) dom.cartLayoutView.style.display = "none";
      if (dom.clearCartBtn) dom.clearCartBtn.style.display = "none";
      return;
    }

    if (dom.cartEmptyView) dom.cartEmptyView.style.display = "none";
    if (dom.cartLayoutView) dom.cartLayoutView.style.display = "grid";
    if (dom.clearCartBtn) dom.clearCartBtn.style.display = "inline-flex";

    // Phân nhóm hàng Brand Mall và Hàng C2C Đồ cũ
    const mallItems = items.filter((i) => i.type === "mall");
    const c2cItems = items.filter((i) => i.type !== "mall");

    let html = "";
    if (mallItems.length > 0) {
      html += `
        <div class="cart-seller-group">
          <div class="cart-seller-head">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">storefront</span>
              <strong class="text-sm">Kiện Hàng 1: Flagship Brand Mall Chính Hãng</strong>
              <span class="badge badge-mall">MỚI 100%</span>
            </div>
            <span class="text-xs text-success hide-sm">● Đóng gói &amp; kiểm tra tại kho tổng HYBRID</span>
          </div>
          <div class="cart-group-items">
            ${mallItems.map(renderItemHTML).join("")}
          </div>
        </div>
      `;
    }

    if (c2cItems.length > 0) {
      html += `
        <div class="cart-seller-group">
          <div class="cart-seller-head">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">person_check</span>
              <strong class="text-sm">Kiện Hàng 2: Người Bán C2C Tuyển Chọn</strong>
              <span class="badge badge-c2c">ĐỒ CŨ LIKE NEW</span>
            </div>
            <span class="text-xs text-secondary hide-sm">● Đã kiểm định ngoại quan 15 bước</span>
          </div>
          <div class="cart-group-items">
            ${c2cItems.map(renderItemHTML).join("")}
          </div>
        </div>
      `;
    }

    dom.cartItemsList.innerHTML = html;

    // Gắn sự kiện cho các nút trong item
    bindItemEvents();

    // Tính toán lại tổng tiền
    calculateTotals();
  }

  /* ---------------- GẮN SỰ KIỆN CHO CÁC MÓN HÀNG ---------------- */
  function bindItemEvents() {
    const itemCards = $$(".cart-item", dom.cartItemsList);
    itemCards.forEach((card) => {
      const id = card.dataset.id;
      const variant = card.dataset.variant || null;

      const decBtn = $(".btn-qty-dec", card);
      const incBtn = $(".btn-qty-inc", card);
      const removeBtn = $(".btn-remove-item", card);

      if (decBtn) {
        decBtn.addEventListener("click", () => {
          const items = Utils.Cart.getItems();
          const item = items.find((i) => i.id === id && (!variant || i.variant === variant));
          if (item) {
            if (item.qty > 1) {
              Utils.Cart.updateQty(id, item.qty - 1, variant);
              renderCart();
            } else {
              Utils.confirm({
                title: "Bỏ sản phẩm khỏi giỏ hàng?",
                message: `Bạn có muốn xóa "${item.name}" khỏi giỏ hàng?`,
                onConfirm: () => {
                  Utils.Cart.removeItem(id, variant);
                  renderCart();
                  Utils.toast("Đã bỏ sản phẩm khỏi giỏ hàng", "info");
                },
              });
            }
          }
        });
      }

      if (incBtn) {
        incBtn.addEventListener("click", () => {
          const items = Utils.Cart.getItems();
          const item = items.find((i) => i.id === id && (!variant || i.variant === variant));
          if (item) {
            Utils.Cart.updateQty(id, item.qty + 1, variant);
            renderCart();
          }
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          const items = Utils.Cart.getItems();
          const item = items.find((i) => i.id === id && (!variant || i.variant === variant));
          Utils.confirm({
            title: "Xóa sản phẩm?",
            message: `Xác nhận xóa "${item ? item.name : "sản phẩm này"}" khỏi giỏ hàng?`,
            onConfirm: () => {
              Utils.Cart.removeItem(id, variant);
              renderCart();
              Utils.toast("Đã xóa khỏi giỏ hàng", "info");
            },
          });
        });
      }
    });
  }

  /* ---------------- TÍNH TOÁN TỔNG TIỀN & VOUCHER ---------------- */
  function calculateTotals() {
    const subtotal = Utils.Cart.getSubtotal();
    const count = Utils.Cart.getCount();

    let discount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.type === "percent") {
        discount = Math.round((subtotal * appliedVoucher.value) / 100);
      } else if (appliedVoucher.type === "fixed") {
        discount = Math.min(subtotal, appliedVoucher.value);
      }
    }

    const finalTotal = Math.max(0, subtotal - discount);

    if (dom.summaryTotalQty) dom.summaryTotalQty.textContent = count;
    if (dom.summarySubtotal) dom.summarySubtotal.textContent = Utils.formatCurrency(subtotal);

    if (discount > 0 && dom.voucherRow) {
      dom.voucherRow.style.display = "flex";
      dom.voucherCodeText.textContent = appliedVoucher.code;
      dom.summaryDiscount.textContent = "-" + Utils.formatCurrency(discount);
    } else if (dom.voucherRow) {
      dom.voucherRow.style.display = "none";
    }

    if (dom.summaryTotal) dom.summaryTotal.textContent = Utils.formatCurrency(finalTotal);

    // Cập nhật mã ghi chú chuyển khoản nếu chọn QR
    if (dom.qrTransferMemo) {
      dom.qrTransferMemo.textContent = "HYBRID-" + Math.floor(100000 + Math.random() * 900000);
    }

    return { subtotal, discount, finalTotal, count };
  }

  /* ---------------- ÁP DỤNG MÃ GIẢM GIÁ ---------------- */
  function setupVoucher() {
    if (!dom.applyVoucherBtn || !dom.voucherInput) return;

    dom.applyVoucherBtn.addEventListener("click", () => {
      const code = dom.voucherInput.value.trim().toUpperCase();
      if (!code) {
        Utils.toast("Vui lòng nhập mã giảm giá", "warning");
        return;
      }

      if (code === "GIAM10") {
        appliedVoucher = { code: "GIAM10", type: "percent", value: 10 };
        Utils.toast("Đã áp dụng mã GIAM10: Giảm 10% tổng đơn hàng!", "success");
      } else if (code === "CHAOBANMOI") {
        appliedVoucher = { code: "CHAOBANMOI", type: "fixed", value: 100000 };
        Utils.toast("Đã áp dụng mã CHAOBANMOI: Giảm ngay 100.000₫!", "success");
      } else if (code === "FREESHIP") {
        appliedVoucher = { code: "FREESHIP", type: "fixed", value: 50000 };
        Utils.toast("Đã áp dụng mã FREESHIP: Hỗ trợ thêm 50.000₫!", "success");
      } else {
        Utils.toast("Mã giảm giá không hợp lệ hoặc đã hết hạn", "error");
        return;
      }

      calculateTotals();
    });
  }

  /* ---------------- XÓA TẤT CẢ GIỎ HÀNG ---------------- */
  function setupClearCart() {
    if (!dom.clearCartBtn) return;
    dom.clearCartBtn.addEventListener("click", () => {
      Utils.confirm({
        title: "Xóa toàn bộ giỏ hàng?",
        message: "Hành động này sẽ làm trống toàn bộ các món hàng bạn đã chọn.",
        onConfirm: () => {
          Utils.Cart.clear();
          localStorage.setItem("hybrid_cart_cleared", "true");
          appliedVoucher = null;
          renderCart();
          Utils.toast("Đã dọn sạch giỏ hàng", "info");
        },
      });
    });
  }

  /* ---------------- PHƯƠNG THỨC THANH TOÁN ---------------- */
  function setupPaymentMethods() {
    dom.paymentRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.value === "QR_PAY") {
          if (dom.qrPayBox) dom.qrPayBox.style.display = "block";
        } else {
          if (dom.qrPayBox) dom.qrPayBox.style.display = "none";
        }
      });
    });
  }

  /* ---------------- XÁC NHẬN ĐẶT HÀNG ---------------- */
  function setupCheckout() {
    if (!dom.checkoutForm) return;

    dom.checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = dom.customerName.value.trim();
      const phone = dom.customerPhone.value.trim();
      const address = dom.customerAddress.value.trim();
      const note = dom.orderNote ? dom.orderNote.value.trim() : "";

      // Validate
      if (!Utils.Validator.isNotEmpty(name)) {
        Utils.toast("Vui lòng nhập họ và tên người nhận", "error");
        dom.customerName.focus();
        return;
      }
      if (!Utils.Validator.isPhone(phone)) {
        Utils.toast("Số điện thoại không hợp lệ (cần 10 số, ví dụ 0912345678)", "error");
        dom.customerPhone.focus();
        return;
      }
      if (!Utils.Validator.isNotEmpty(address)) {
        Utils.toast("Vui lòng nhập địa chỉ nhận hàng chi tiết", "error");
        dom.customerAddress.focus();
        return;
      }

      const items = Utils.Cart.getItems();
      if (items.length === 0) {
        Utils.toast("Giỏ hàng của bạn đang trống!", "warning");
        return;
      }

      const { subtotal, discount, finalTotal } = calculateTotals();
      const selectedPayment = $("input[name='paymentMethod']:checked").value;
      const orderId = "ORD-" + Date.now().toString().slice(-6);

      // Tạo đối tượng đơn hàng mới
      const buyerUser = (typeof Auth !== "undefined" && typeof Auth.current === "function") ? Auth.current() : null;
      const newOrder = {
        id: orderId,
        orderCode: orderId,
        buyerId: buyerUser ? buyerUser.id : "guest",
        buyerEmail: buyerUser ? buyerUser.email : "",
        createdAt: new Date().toISOString(),
        status: "delivering",
        statusLabel: "Đang xử lý & đóng gói",
        statusTone: "secondary",
        stepIndex: 2,
        items: items,
        subtotal: subtotal,
        discount: discount,
        shippingFee: 0,
        total: finalTotal,
        paymentMethod: selectedPayment,
        paymentLabel: selectedPayment === "COD" ? "Thanh toán khi nhận hàng (Đồng kiểm)" : "Chuyển khoản VietQR",
        shippingAddress: {
          fullName: name,
          phone: phone,
          address: address,
        },
        note: note,
        trackingCode: "VNPOST-" + Math.floor(100000 + Math.random() * 900000),
        carrier: "VNPost Hỏa Tốc",
        estimatedDelivery: "Giao trong 1 - 2 ngày tới",
      };

      // Lưu đơn vào localStorage
      try {
        const savedOrders = JSON.parse(localStorage.getItem("hv_orders")) || [];
        savedOrders.unshift(newOrder);
        localStorage.setItem("hv_orders", JSON.stringify(savedOrders));
      } catch (err) {
        console.error("Lưu đơn hàng lỗi:", err);
      }

      // Xóa sạch giỏ hàng
      Utils.Cart.clear();

      // Hiển thị modal thành công
      if (dom.modalOrderId) dom.modalOrderId.textContent = orderId;
      if (dom.modalCustomerName) dom.modalCustomerName.textContent = name;
      if (dom.modalCustomerPhone) dom.modalCustomerPhone.textContent = phone;
      if (dom.modalTotal) dom.modalTotal.textContent = Utils.formatCurrency(finalTotal);
      if (dom.modalPayment) dom.modalPayment.textContent = newOrder.paymentLabel;

      Utils.openModal("successModal");
      Utils.toast("Chúc mừng! Đơn hàng của bạn đã được tiếp nhận thành công.", "success");
    });
  }

  /* ---------------- KHỞI CHẠY ---------------- */
  setupUser();
  ensureInitialCart();
  renderCart();
  setupVoucher();
  setupClearCart();
  setupPaymentMethods();
  setupCheckout();

  // Lắng nghe sự kiện giỏ hàng cập nhật từ các trang khác
  window.addEventListener("cart:updated", () => {
    renderCart();
  });
})();
