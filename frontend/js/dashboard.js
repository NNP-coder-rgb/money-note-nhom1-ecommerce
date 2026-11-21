/**
 * dashboard.js — Xử lý Bảng điều khiển, Đơn hàng, Stepper tiến trình & Chat hỗ trợ 24/7
 */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // Kiểm tra đăng nhập
  const currentUser = typeof Auth !== "undefined" ? Auth.current() : null;

  // Khởi tạo các phần tử DOM
  const dom = {
    dashAvatar: $("#dashAvatar"),
    dashUserName: $("#dashUserName"),
    dashUserEmail: $("#dashUserEmail"),
    dashLogoutBtn: $("#dashLogoutBtn"),
    dashOrderBadge: $("#dashOrderBadge"),
    // Thống kê
    statTotalOrders: $("#statTotalOrders"),
    statDelivering: $("#statDelivering"),
    statCompleted: $("#statCompleted"),
    statSaved: $("#statSaved"),
    // Khung đơn hàng
    recentOrdersContainer: $("#recentOrdersContainer"),
    ordersListContainer: $("#ordersListContainer"),
    btnGoToOrders: $("#btnGoToOrders"),
    orderFilterChips: $$(".order-filter-chip"),
    // Chat
    chatMessages: $("#chatMessages"),
    chatForm: $("#chatForm"),
    chatInput: $("#chatInput"),
    quickChatBtns: $$(".btn-quick-chat"),
    // Cài đặt
    settingsForm: $("#settingsForm"),
    settingsName: $("#settingsName"),
    settingsPhone: $("#settingsPhone"),
    settingsEmail: $("#settingsEmail"),
    settingsAddress: $("#settingsAddress"),
  };

  /* ---------------- QUẢN LÝ DANH SÁCH ĐƠN HÀNG ---------------- */
  function getOrders() {
    let localOrders = [];
    try {
      localOrders = JSON.parse(localStorage.getItem("hv_orders")) || [];
    } catch (e) {
      localOrders = [];
    }
    const mockOrders = typeof MOCK_ORDERS !== "undefined" ? MOCK_ORDERS : [];
    // Gộp đơn mới đặt lên đầu
    return [...localOrders, ...mockOrders];
  }

  /* ---------------- THIẾT LẬP THÔNG TIN USER ---------------- */
  function setupUser() {
    if (currentUser) {
      const name = currentUser.fullName || "Khách Hàng";
      const initials = name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

      if (dom.dashAvatar) dom.dashAvatar.textContent = initials;
      if (dom.dashUserName) dom.dashUserName.textContent = name;
      if (dom.dashUserEmail) dom.dashUserEmail.textContent = currentUser.email || "";

      if (dom.settingsName) dom.settingsName.value = name;
      if (dom.settingsEmail) dom.settingsEmail.value = currentUser.email || "";
      if (dom.settingsPhone && currentUser.phone) dom.settingsPhone.value = currentUser.phone;
    }

    if (dom.dashLogoutBtn) {
      dom.dashLogoutBtn.addEventListener("click", () => {
        Utils.confirm({
          title: "Đăng xuất tài khoản?",
          message: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
          confirmText: "Đăng xuất",
          onConfirm: () => {
            if (typeof Auth !== "undefined") Auth.logout();
            Utils.toast("Đã đăng xuất tài khoản.", "info");
            setTimeout(() => {
              window.location.href = "../account/auth_login.html";
            }, 300);
          },
        });
      });
    }
  }

  /* ---------------- THIẾT LẬP CHUYỂN PANE ---------------- */
  function setupNavigation() {
    const sideLinks = $$(".side-link");
    const panes = $$(".dash-pane");

    sideLinks.forEach((link) => {
      link.addEventListener("click", () => {
        sideLinks.forEach((l) => l.classList.remove("active"));
        panes.forEach((p) => {
          p.classList.remove("active");
          p.style.display = "none";
        });

        link.classList.add("active");
        const paneId = link.dataset.pane;
        const target = document.getElementById(paneId);
        if (target) {
          target.classList.add("active");
          target.style.display = "block";
        }
      });
    });

    if (dom.btnGoToOrders) {
      dom.btnGoToOrders.addEventListener("click", () => {
        const orderLink = $('[data-pane="paneOrders"]');
        if (orderLink) orderLink.click();
      });
    }
  }

  /* ---------------- THỐNG KÊ & DỰNG ĐƠN HÀNG ---------------- */
  function renderDashboardData() {
    const orders = getOrders();

    // Thống kê
    const totalOrders = orders.length;
    const delivering = orders.filter((o) => o.status === "delivering").length;
    const completed = orders.filter((o) => o.status === "completed").length;

    // Tính tổng tiền tiết kiệm từ đồ cũ
    let totalSaved = 0;
    orders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (item.type === "c2c" && item.oldPrice && item.price) {
            totalSaved += (item.oldPrice - item.price) * (item.qty || 1);
          }
        });
      }
    });

    if (dom.statTotalOrders) dom.statTotalOrders.textContent = totalOrders;
    if (dom.statDelivering) dom.statDelivering.textContent = delivering;
    if (dom.statCompleted) dom.statCompleted.textContent = completed;
    if (dom.statSaved) dom.statSaved.textContent = Utils.formatCurrency(totalSaved > 0 ? totalSaved : 8500000);
    if (dom.dashOrderBadge) dom.dashOrderBadge.textContent = totalOrders;

    // Dựng gần đây (1-2 đơn)
    if (dom.recentOrdersContainer) {
      if (orders.length === 0) {
        dom.recentOrdersContainer.innerHTML = '<p class="text-sm text-muted">Bạn chưa có đơn hàng nào.</p>';
      } else {
        dom.recentOrdersContainer.innerHTML = orders
          .slice(0, 2)
          .map((o) => renderOrderCardHtml(o))
          .join("");
        bindOrderActions(dom.recentOrdersContainer);
      }
    }

    // Dựng toàn bộ đơn
    renderOrdersList("all");
  }

  /* ---------------- DỰNG DANH SÁCH ĐƠN HÀNG CHI TIẾT ---------------- */
  function renderOrdersList(filterStatus = "all") {
    if (!dom.ordersListContainer) return;
    const orders = getOrders();
    const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

    if (filtered.length === 0) {
      dom.ordersListContainer.innerHTML = `
        <div class="panel text-center p-6">
          <span class="material-symbols-outlined text-muted" style="font-size: 48px;">receipt_long</span>
          <p class="text-sm text-muted mt-2">Không có đơn hàng nào trong mục này.</p>
        </div>
      `;
      return;
    }

    dom.ordersListContainer.innerHTML = filtered.map((o) => renderOrderCardHtml(o)).join("");
    bindOrderActions(dom.ordersListContainer);
  }

  /* ---------------- HTML THẺ ĐƠN HÀNG VỚI STEPPER TIẾN TRÌNH ---------------- */
  function renderOrderCardHtml(order) {
    const stepIdx = order.stepIndex || (order.status === "completed" ? 4 : 3);
    const formattedDate = Utils.formatDate(order.createdAt, "DD/MM/YYYY HH:mm");

    const itemsHtml = (order.items || [])
      .map((item) => {
        const isUsed = item.type === "c2c";
        const discountPercent =
          item.discountPercent || (isUsed && item.oldPrice ? Math.round((1 - item.price / item.oldPrice) * 100) : 0);

        return `
        <div class="order-item-row">
          <img class="order-item-thumb" src="${item.img || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}" alt="${item.name}" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              ${
                isUsed
                  ? `<span class="badge badge-c2c">ĐỒ CŨ ${item.condition || "LIKE NEW"} • -${discountPercent}%</span>`
                  : `<span class="badge badge-mall">HÀNG MỚI 100%</span>`
              }
              ${item.variant ? `<span class="badge badge-secondary">${item.variant}</span>` : ""}
            </div>
            <strong class="text-sm">${item.name}</strong>
            <div class="text-xs text-muted mt-1">Số lượng: ${item.qty} món</div>
          </div>
          <div class="text-right">
            <strong class="mono text-primary">${Utils.formatCurrency(item.price)}</strong>
            ${isUsed && item.oldPrice ? `<div class="text-xs text-faint line-through mono">${Utils.formatCurrency(item.oldPrice)}</div>` : ""}
          </div>
        </div>
      `;
      })
      .join("");

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="flex items-center justify-between flex-wrap gap-2 pb-3" style="border-bottom: 1px solid var(--border)">
          <div>
            <span class="mono text-sm fw-700 text-secondary">${order.id}</span>
            <span class="text-faint mx-2">•</span>
            <span class="text-xs text-muted">${formattedDate}</span>
          </div>
          <span class="badge badge-${order.statusTone || "secondary"}">
            ${order.statusLabel || "Đang xử lý"}
          </span>
        </div>

        <!-- Stepper tiến trình vận chuyển -->
        <div class="order-stepper">
          <div class="order-step ${stepIdx >= 1 ? (stepIdx === 1 ? "active" : "done") : ""}">
            <div class="step-circle">${stepIdx > 1 ? "✓" : "1"}</div>
            <div class="step-text">Đặt hàng</div>
          </div>
          <div class="order-step ${stepIdx >= 2 ? (stepIdx === 2 ? "active" : "done") : ""}">
            <div class="step-circle">${stepIdx > 2 ? "✓" : "2"}</div>
            <div class="step-text">Đã xác nhận</div>
          </div>
          <div class="order-step ${stepIdx >= 3 ? (stepIdx === 3 ? "active" : "done") : ""}">
            <div class="step-circle">${stepIdx > 3 ? "✓" : "3"}</div>
            <div class="step-text">Đang giao</div>
          </div>
          <div class="order-step ${stepIdx >= 4 ? "done" : ""}">
            <div class="step-circle">4</div>
            <div class="step-text">Đã nhận hàng</div>
          </div>
        </div>

        <!-- Danh sách mặt hàng -->
        <div class="my-3">${itemsHtml}</div>

        <!-- Tóm tắt & Nút hành động -->
        <div class="flex items-center justify-between flex-wrap gap-3 pt-3" style="border-top: 1px solid var(--border)">
          <div class="text-xs text-muted">
            Mã vận đơn: <strong class="mono text-secondary">${order.trackingCode || "VNPOST-HN-884920"}</strong> • Đơn vị: ${order.carrier || "VNPost Hỏa Tốc"}
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-muted">Tổng thanh toán:</span>
            <strong class="mono text-gradient" style="font-size: 1.15rem">${Utils.formatCurrency(order.total)}</strong>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 mt-3 flex-wrap">
          <button class="btn btn-secondary btn-sm btn-track-order" data-id="${order.id}" type="button">
            <span class="material-symbols-outlined icon-xs">location_searching</span>
            Theo Dõi Vận Đơn
          </button>
          <button class="btn btn-ghost btn-sm text-secondary btn-support-order" data-id="${order.id}" type="button">
            <span class="material-symbols-outlined icon-xs">chat</span>
            Hỗ Trợ / Đổi Trả
          </button>
        </div>
      </div>
    `;
  }

  /* ---------------- GẮN SỰ KIỆN CHO ĐƠN HÀNG ---------------- */
  function bindOrderActions(container) {
    $$(".btn-track-order", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        Utils.toast({
          title: `Tra cứu vận đơn: ${id}`,
          message: "Bưu tá VNPost đang trên đường phát hàng. Dự kiến giao trong ngày hôm nay. Vui lòng giữ máy đồng kiểm!",
          type: "info",
          duration: 5000,
        });
      });
    });

    $$(".btn-support-order", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        // Chuyển sang Pane Chat
        const chatLink = $('[data-pane="paneChat"]');
        if (chatLink) chatLink.click();
        if (dom.chatInput) {
          dom.chatInput.value = `Mình cần hỗ trợ đơn hàng ${id}, shop kiểm tra giúp mình nhé!`;
          dom.chatInput.focus();
        }
      });
    });
  }

  /* ---------------- HỆ THỐNG CHAT HỖ TRỢ TRỰC TUYẾN ---------------- */
  function setupChat() {
    if (!dom.chatMessages) return;

    // Nạp tin nhắn mẫu từ MOCK_CHAT
    const mockMessages = typeof MOCK_CHAT !== "undefined" ? MOCK_CHAT : [];
    dom.chatMessages.innerHTML = mockMessages.map((m) => renderChatMessageHtml(m)).join("");
    scrollChatBottom();

    // Nút câu hỏi gợi ý nhanh
    dom.quickChatBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const msg = btn.dataset.msg;
        sendUserMessage(msg);
      });
    });

    // Form gửi tin nhắn
    if (dom.chatForm) {
      dom.chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = dom.chatInput.value.trim();
        if (!text) return;
        sendUserMessage(text);
        dom.chatInput.value = "";
      });
    }
  }

  function renderChatMessageHtml(msg) {
    const isOwn = msg.sender === "own";
    return `
      <div class="msg ${isOwn ? "own" : ""}">
        <div class="msg-bubble">
          <div class="msg-meta">
            <strong>${msg.senderName || (isOwn ? "Bạn" : "Trợ Lý Khách Hàng")}</strong>
          </div>
          <div>${msg.text}</div>
          <div class="msg-time text-right">${msg.time || "Vừa xong"}</div>
        </div>
      </div>
    `;
  }

  function sendUserMessage(text) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const userMsg = {
      sender: "own",
      senderName: "Bạn",
      text: text,
      time: timeStr,
    };

    dom.chatMessages.insertAdjacentHTML("beforeend", renderChatMessageHtml(userMsg));
    scrollChatBottom();

    // Phản hồi tự động thông minh sau 800ms
    setTimeout(() => {
      let replyText = "Cảm ơn bạn đã nhắn tin! Chúng tôi đã ghi nhận yêu cầu và sẽ hỗ trợ ngay lập tức.";
      const lower = text.toLowerCase();

      if (lower.includes("đơn hàng") || lower.includes("tiến độ") || lower.includes("vận đơn")) {
        replyText =
          "Dạ đơn hàng của bạn đang được bưu tá chuyển phát hỏa tốc. Bạn vui lòng chuẩn bị nhận máy và đồng kiểm ngoại quan trực tiếp cùng shipper nhé!";
      } else if (lower.includes("đổi trả") || lower.includes("7 ngày") || lower.includes("bảo hành")) {
        replyText =
          "Chính sách đổi trả tại HYBRID.STORE: Trong vòng 7 ngày kể từ khi nhận hàng, nếu sản phẩm có bất kỳ lỗi kỹ thuật hoặc không ưng ý, bạn được đổi mới 100% hoặc hoàn lại toàn bộ tiền mà không mất phí ạ.";
      } else if (lower.includes("đồ cũ") || lower.includes("like new") || lower.includes("tiêu chuẩn")) {
        replyText =
          "Mọi sản phẩm đồ cũ Like New (từ 90% đến 99%) đều được kiểm tra kỹ lưỡng: soi pin, màn hình, chức năng và cam kết giá rẻ hơn đồ mới từ 20% đến 50%. Khách hàng được đồng kiểm thoải mái trước khi nhận hàng ạ.";
      }

      const botMsg = {
        sender: "bot",
        senderName: "Trợ Lý Khách Hàng",
        text: replyText,
        time: timeStr,
      };

      dom.chatMessages.insertAdjacentHTML("beforeend", renderChatMessageHtml(botMsg));
      scrollChatBottom();
    }, 800);
  }

  function scrollChatBottom() {
    if (dom.chatMessages) {
      dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    }
  }

  /* ---------------- FORM CÀI ĐẶT TÀI KHOẢN ---------------- */
  function setupSettings() {
    if (!dom.settingsForm) return;

    dom.settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = dom.settingsName.value.trim();
      const phone = dom.settingsPhone.value.trim();
      const address = dom.settingsAddress.value.trim();

      if (!name) {
        Utils.toast("Vui lòng nhập họ và tên", "error");
        return;
      }

      if (currentUser) {
        currentUser.fullName = name;
        currentUser.phone = phone;
        currentUser.address = address;
        localStorage.setItem("hv_current_user", JSON.stringify(currentUser));
        setupUser();
      }

      Utils.toast("Đã lưu thông tin tài khoản thành công!", "success");
    });
  }

  /* ---------------- BỘ LỌC ĐƠN HÀNG ---------------- */
  function setupOrderFilters() {
    dom.orderFilterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        dom.orderFilterChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        renderOrdersList(chip.dataset.status);
      });
    });
  }

  /* ---------------- KHỞI CHẠY ---------------- */
  setupUser();
  setupNavigation();
  renderDashboardData();
  setupChat();
  setupSettings();
  setupOrderFilters();
  Utils.Cart.syncBadge();
})();
