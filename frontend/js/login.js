// login.js — xử lý đăng nhập mật khẩu, đăng nhập Google, SMS OTP và khôi phục mật khẩu
(function () {
  const isSubpage = typeof window !== "undefined" && window.location.pathname.includes("/pages/");
  const HOME_PAGE = isSubpage ? "../../index.html" : "index.html";
  const SELLER_PAGE = isSubpage ? "../seller/dashboard.html" : "pages/seller/dashboard.html";
  const ADMIN_PAGE = isSubpage ? "../admin/admin_system.html" : "pages/admin/admin_system.html";

  // Hàm xác định đích đến mặc định theo vai trò tài khoản (Role-based Navigation)
  function getRoleDefaultTarget(user, selectedRole) {
    const roleVal = ((user && user.role) || selectedRole || "buyer").toLowerCase();
    if (roleVal === "seller") return SELLER_PAGE;
    if (roleVal === "admin") return ADMIN_PAGE;
    return HOME_PAGE;
  }

  // Hàm lấy nhãn nút xác nhận trên popup thông báo
  function getConfirmButtonLabel(explicitTarget, user, selectedRole) {
    if (explicitTarget && explicitTarget !== HOME_PAGE && explicitTarget !== SELLER_PAGE && explicitTarget !== ADMIN_PAGE) {
      return "Tiếp tục";
    }
    const roleVal = ((user && user.role) || selectedRole || "buyer").toLowerCase();
    if (roleVal === "seller") return "Vào Kênh Người Bán";
    if (roleVal === "admin") return "Vào Cổng Quản Trị";
    return "Vào trang chủ";
  }

  // Thông điệp chào mừng tương ứng theo vai trò
  function getWelcomeMessage(user, selectedRole) {
    const name = (user && (user.fullName || user.username)) || "bạn";
    const roleVal = ((user && user.role) || selectedRole || "buyer").toLowerCase();
    if (roleVal === "seller") {
      return `Chào mừng Người Bán ${name} quay lại Kênh Quản Lý Gian Hàng!`;
    }
    if (roleVal === "admin") {
      return `Chào mừng Quản trị viên ${name} quay lại Master Admin Portal!`;
    }
    return `Chào mừng ${name} quay lại mua sắm tại Hybrid Store.`;
  }

  // Elements: Form đăng nhập mật khẩu
  const form = document.getElementById("vaultLoginForm");
  const idInput = document.getElementById("identifier");
  const pwd = document.getElementById("vaultKey");
  const pwdIcon = document.getElementById("passwordIcon");
  const btnText = document.getElementById("buttonText");
  const submitBtn = document.getElementById("submitUnlockBtn");
  const submitIcon = document.getElementById("submitIcon");

  // Elements: Tab chuyển đổi phương thức đăng nhập
  const tabLoginPassword = document.getElementById("tabLoginPassword");
  const tabLoginPhone = document.getElementById("tabLoginPhone");
  const phoneOtpLoginForm = document.getElementById("phoneOtpLoginForm");

  // Elements: Phone OTP login
  const otpPhoneNumber = document.getElementById("otpPhoneNumber");
  const btnSendPhoneOtp = document.getElementById("btnSendPhoneOtp");
  const phoneOtpCode = document.getElementById("phoneOtpCode");
  const phoneInputError = document.getElementById("phoneInputError");
  const phoneOtpCodeError = document.getElementById("phoneOtpCodeError");
  const submitPhoneOtpBtn = document.getElementById("submitPhoneOtpBtn");

  // Elements: Google Login & Account Management
  const btnGoogleLogin = document.getElementById("btnGoogleLogin");
  const googleLoginBtnText = document.getElementById("googleLoginBtnText");
  const browserGoogleEmailDisplay = document.getElementById("browserGoogleEmailDisplay");
  const googleAccountStatus = document.getElementById("googleAccountStatus");
  const btnSwitchGoogleAccount = document.getElementById("btnSwitchGoogleAccount");

  // Elements: Google OAuth 2.0 Client Configuration Modal
  const googleAuthModal = document.getElementById("googleAuthModal");
  const btnCloseGoogleModal = document.getElementById("btnCloseGoogleModal");
  const btnConfigGoogleClient = document.getElementById("btnConfigGoogleClient");
  const inputGoogleClientId = document.getElementById("inputGoogleClientId");
  const displayRedirectUri = document.getElementById("displayRedirectUri");
  const btnCopyRedirectUri = document.getElementById("btnCopyRedirectUri");
  const btnCancelGoogleConfig = document.getElementById("btnCancelGoogleConfig");
  const btnSaveGoogleConfig = document.getElementById("btnSaveGoogleConfig");
  const btnTestGoogleRedirect = document.getElementById("btnTestGoogleRedirect");
  const currentBrowserGoogleCard = document.getElementById("currentBrowserGoogleCard");
  const modalGoogleAvatar = document.getElementById("modalGoogleAvatar");
  const modalGoogleName = document.getElementById("modalGoogleName");
  const modalGoogleEmail = document.getElementById("modalGoogleEmail");
  const btnConfirmCurrentGoogle = document.getElementById("btnConfirmCurrentGoogle");
  const customGoogleEmail = document.getElementById("customGoogleEmail");
  const customGoogleName = document.getElementById("customGoogleName");
  const rememberCustomGoogle = document.getElementById("rememberCustomGoogle");
  const btnSubmitCustomGoogle = document.getElementById("btnSubmitCustomGoogle");

  // Elements: Forgot Password Modal & Wizard Steps
  const linkForgotPassword = document.getElementById("linkForgotPassword");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const btnCloseForgotModal = document.getElementById("btnCloseForgotModal");
  const btnCancelForgotModal = document.getElementById("btnCancelForgotModal");
  const forgotStep1 = document.getElementById("forgotStep1");
  const forgotStep2 = document.getElementById("forgotStep2");
  const forgotStep3 = document.getElementById("forgotStep3");
  const forgotIdentifier = document.getElementById("forgotIdentifier");
  const btnSendForgotOtp = document.getElementById("btnSendForgotOtp");
  const forgotStep1Error = document.getElementById("forgotStep1Error");
  const forgotOtpHintBox = document.getElementById("forgotOtpHintBox");
  const forgotOtpDisplayCode = document.getElementById("forgotOtpDisplayCode");
  const forgotOtpCode = document.getElementById("forgotOtpCode");
  const forgotStep2Error = document.getElementById("forgotStep2Error");
  const btnBackToStep1 = document.getElementById("btnBackToStep1");
  const btnVerifyForgotOtp = document.getElementById("btnVerifyForgotOtp");
  const forgotNewPassword = document.getElementById("forgotNewPassword");
  const forgotConfirmPassword = document.getElementById("forgotConfirmPassword");
  const forgotStep3Error = document.getElementById("forgotStep3Error");
  const btnSubmitNewPassword = document.getElementById("btnSubmitNewPassword");

  // Nếu vừa đăng ký xong: điền sẵn email, đưa con trỏ vào ô mật khẩu
  const prefill = sessionStorage.getItem("hv_prefill");
  if (prefill && idInput) {
    idInput.value = prefill;
    sessionStorage.removeItem("hv_prefill");
    if (pwd) pwd.focus();
  }

  // Lấy đường dẫn chuyển hướng sau đăng nhập (từ query ?redirect= hoặc sessionStorage)
  function getRedirectTarget() {
    try {
      const urlParam = new URLSearchParams(window.location.search).get("redirect");
      if (urlParam) return decodeURIComponent(urlParam);
      const stored = sessionStorage.getItem("hv_redirect_after_login");
      if (stored) return stored;
    } catch (e) {}
    return null;
  }

  const initialRedirect = getRedirectTarget();

  // 1. Kiểm tra tham số cưỡng chế đăng xuất qua URL (?action=logout hoặc ?logout=true)
  const urlParams = new URLSearchParams(window.location.search);
  const isForcedLogout = urlParams.get("action") === "logout" || urlParams.get("logout") === "true";
  if (isForcedLogout) {
    if (typeof Auth !== "undefined" && typeof Auth.logout === "function") {
      Auth.logout();
    }
    try {
      localStorage.removeItem("hv_current_user");
      localStorage.removeItem("hv_access_token");
      localStorage.removeItem("hybrid_current_user");
      localStorage.removeItem("hybrid_access_token");
      localStorage.removeItem("hv_browser_google_account");
      sessionStorage.clear();
    } catch (e) {}
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
    if (typeof Utils !== "undefined" && typeof Utils.toast === "function") {
      Utils.toast("Bạn đã đăng xuất tài khoản thành công.", "info");
    }
  }

  // 2. Nếu đã đăng nhập sẵn: Hiển thị banner thông báo và tùy chọn Đăng Xuất thay vì ép buộc chuyển trang gây kẹt
  if (!isForcedLogout && typeof Auth !== "undefined" && Auth.current()) {
    const cur = Auth.current();
    const alreadyNotice = document.getElementById("alreadyLoggedInNotice");
    if (alreadyNotice) {
      alreadyNotice.style.display = "block";
      const nameEl = document.getElementById("loggedInUserName");
      const infoEl = document.getElementById("loggedInUserInfo");
      const btnGoHome = document.getElementById("btnLoggedInGoHome");
      if (nameEl) nameEl.textContent = cur.fullName || cur.name || "Người dùng";
      if (infoEl) {
        infoEl.textContent = (cur.email || cur.phone || "") + " • Vai trò: " + (cur.role || "Buyer");
      }
      if (btnGoHome) {
        btnGoHome.href = initialRedirect || getRoleDefaultTarget(cur);
      }
      const btnLogoutNow = document.getElementById("btnLoggedInLogoutNow");
      if (btnLogoutNow && !btnLogoutNow.dataset.bound) {
        btnLogoutNow.dataset.bound = "true";
        btnLogoutNow.addEventListener("click", function () {
          Auth.logout();
          try {
            localStorage.removeItem("hv_current_user");
            localStorage.removeItem("hv_access_token");
            localStorage.removeItem("hybrid_current_user");
            localStorage.removeItem("hybrid_access_token");
            localStorage.removeItem("hv_browser_google_account");
            sessionStorage.clear();
          } catch (e) {}
          alreadyNotice.style.display = "none";
          if (typeof Utils !== "undefined" && typeof Utils.toast === "function") {
            Utils.toast("Đã đăng xuất thành công. Bạn có thể đăng nhập tài khoản khác.", "info");
          }
        });
      }
    }
  }

  // Helper mở/đóng modal an toàn
  function showModal(modalEl) {
    if (!modalEl) return;
    if (typeof openModal === "function") {
      openModal(modalEl);
    } else {
      modalEl.classList.add("is-open");
      modalEl.style.display = "flex";
      document.body.classList.add("modal-open");
    }
  }

  function hideModal(modalEl) {
    if (!modalEl) return;
    if (typeof closeModal === "function") {
      closeModal(modalEl);
    } else {
      modalEl.classList.remove("is-open");
      modalEl.style.display = "none";
      if (!document.querySelector(".modal-backdrop.is-open")) {
        document.body.classList.remove("modal-open");
      }
    }
  }

  // Thông báo toast an toàn
  function notify(opts) {
    if (typeof toast === "function") {
      toast(opts);
    } else if (typeof window.toast === "function") {
      window.toast(opts);
    }
  }

  // ----- Đóng modal khi bấm ra ngoài hoặc phím Escape -----
  [googleAuthModal, forgotPasswordModal].forEach((m) => {
    if (!m) return;
    m.addEventListener("click", (e) => {
      if (e.target === m) hideModal(m);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideModal(googleAuthModal);
      hideModal(forgotPasswordModal);
    }
  });

  // ----- Hiện / ẩn mật khẩu -----
  const toggleBtn = document.getElementById("togglePasswordBtn");
  if (toggleBtn && pwd && pwdIcon) {
    toggleBtn.addEventListener("click", () => {
      const show = pwd.type === "password";
      pwd.type = show ? "text" : "password";
      pwdIcon.textContent = show ? "visibility_off" : "visibility";
    });
  }

  // ----- Đổi vai trò (Buyer vs Seller) -----
  const roleBtns = document.querySelectorAll("#roleSelector button");
  const BTN_LABEL = {
    buyer: "ĐĂNG NHẬP NGAY",
    seller: "ĐĂNG NHẬP NGƯỜI BÁN",
  };
  let role = "buyer";

  // Đọc role từ URL query (ví dụ ?role=seller khi bấm từ nút "Kênh Người Bán" hoặc sau đăng ký)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const queryRole = urlParams.get("role");
    if (queryRole === "seller" || queryRole === "buyer") {
      role = queryRole;
    }
  } catch (e) {}

  const roleDestText = document.getElementById("roleDestinationText");
  function updateRoleDestHint(currentRole) {
    if (!roleDestText) return;
    const r = String(currentRole || "buyer").toLowerCase();
    if (r === "seller") {
      roleDestText.innerHTML = 'Sau khi đăng nhập sẽ vào: <strong class="text-warning">Kênh Quản Lý Gian Hàng (Seller Dashboard)</strong>';
    } else if (r === "admin") {
      roleDestText.innerHTML = 'Sau khi đăng nhập sẽ vào: <strong class="text-primary">Master Admin Command Portal</strong>';
    } else {
      roleDestText.innerHTML = 'Sau khi đăng nhập sẽ vào: <strong class="text-secondary">Trang Chủ Mua Sắm (Marketplace)</strong>';
    }
  }

  if (btnText) btnText.textContent = BTN_LABEL[role] || BTN_LABEL.buyer;
  updateRoleDestHint(role);
  roleBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.role === role);
    btn.addEventListener("click", () => {
      roleBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      role = btn.dataset.role;
      if (btnText) btnText.textContent = BTN_LABEL[role];
      updateRoleDestHint(role);
    });
  });

  // =========================================================================
  // 1. CHUYỂN TAB ĐĂNG NHẬP: MẬT KHẨU vs SỐ ĐIỆN THOẠI OTP
  // =========================================================================
  if (tabLoginPassword && tabLoginPhone && form && phoneOtpLoginForm) {
    tabLoginPassword.addEventListener("click", () => {
      tabLoginPassword.classList.add("active");
      tabLoginPhone.classList.remove("active");
      form.style.display = "block";
      phoneOtpLoginForm.style.display = "none";
      if (idInput) idInput.focus();
    });

    tabLoginPhone.addEventListener("click", () => {
      tabLoginPhone.classList.add("active");
      tabLoginPassword.classList.remove("active");
      form.style.display = "none";
      phoneOtpLoginForm.style.display = "block";
      if (otpPhoneNumber) otpPhoneNumber.focus();
    });
  }

  // =========================================================================
  // 2. FORM ĐĂNG NHẬP BẰNG MẬT KHẨU (FORM GỐC)
  // =========================================================================
  function setError(el, msg) {
    const group = el.closest(".form-group");
    if (group) {
      group.classList.add("has-error");
      const err = group.querySelector(".form-error");
      if (err) err.textContent = msg;
    }
    el.classList.add("is-invalid");
  }

  function clearErrors() {
    form.querySelectorAll(".has-error").forEach((g) => g.classList.remove("has-error"));
    form.querySelectorAll(".is-invalid").forEach((i) => i.classList.remove("is-invalid"));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    let bad = null;
    if (!idInput.value.trim()) {
      setError(idInput, "Vui lòng nhập email hoặc số điện thoại.");
      bad = bad || idInput;
    }
    if (!pwd.value) {
      setError(pwd, "Vui lòng nhập mật khẩu.");
      bad = bad || pwd;
    }
    if (bad) {
      bad.focus();
      return;
    }

    const oldText = btnText.textContent;
    submitBtn.disabled = true;
    submitIcon.textContent = "sync";
    submitIcon.classList.add("spin");
    btnText.textContent = "ĐANG ĐĂNG NHẬP...";

    setTimeout(async () => {
      submitBtn.disabled = false;
      submitIcon.classList.remove("spin");
      submitIcon.textContent = "lock_open";
      btnText.textContent = oldText;

      let res;
      // 1. Thử gọi API Backend FastAPI nếu có
      if (typeof API !== "undefined" && API.Auth) {
        try {
          const apiRes = await API.Auth.login(idInput.value.trim(), pwd.value);
          if (apiRes && apiRes.success && apiRes.data) {
            const u = apiRes.data.user;
            res = {
              ok: true,
              user: {
                id: u.id,
                fullName: u.full_name,
                username: u.username,
                email: u.email,
                phone: u.phone,
                role: u.role,
                avatar: u.avatar_url || "assets/images/avatars/default-avatar.svg",
                membershipTitle: u.membership_title || "VIP MEMBER",
                kycStatus: u.is_verified ? "VERIFIED" : "UNVERIFIED"
              }
            };
            localStorage.setItem("hv_current_user", JSON.stringify(res.user));
          }
        } catch (apiErr) {
          console.warn("[Login] API Backend thông báo:", apiErr.message);
        }
      }

      // 2. Dự phòng cục bộ nếu Backend offline
      if (!res) {
        res = Auth.login(idInput.value, pwd.value, role);
      }
      if (!res.ok) {
        if (typeof showPopup === "function") {
          showPopup({
            type: res.warning ? "warning" : "error",
            title: res.warning ? "Chọn lại vai trò" : "Đăng nhập thất bại",
            message: res.error,
            confirmText: "Thử lại",
          });
        } else {
          alert(res.error);
        }
        return;
      }

      if (typeof Utils !== "undefined") {
        if (Utils.Wishlist && typeof Utils.Wishlist.refresh === "function") Utils.Wishlist.refresh();
        if (Utils.Cart) {
          if (typeof Utils.Cart.migrateGuestCart === "function") Utils.Cart.migrateGuestCart();
          if (typeof Utils.Cart.syncBadge === "function") Utils.Cart.syncBadge();
        }
      }

      const targetAfterLogin = getRedirectTarget();
      const destination = targetAfterLogin || getRoleDefaultTarget(res.user, role);
      const confirmLabel = getConfirmButtonLabel(targetAfterLogin, res.user, role);

      if (typeof showPopup === "function") {
        showPopup({
          type: "success",
          title: "Đăng nhập thành công!",
          message: getWelcomeMessage(res.user, role),
          confirmText: confirmLabel,
          onConfirm: () => {
            if (targetAfterLogin) {
              sessionStorage.removeItem("hv_redirect_after_login");
            }
            window.location.href = destination;
          },
        });
      } else {
        if (targetAfterLogin) {
          sessionStorage.removeItem("hv_redirect_after_login");
        }
        window.location.href = destination;
      }
    }, 600);
  });

  // Các nút điền nhanh tài khoản mẫu kiểm thử 1-chạm
  const quickFillAdminBtn = document.getElementById("quickFillAdminBtn");
  const quickFillBuyerBtn = document.getElementById("quickFillBuyerBtn");
  const quickFillSellerBtn = document.getElementById("quickFillSellerBtn");

  if (quickFillAdminBtn) {
    quickFillAdminBtn.addEventListener("click", () => {
      if (idInput) idInput.value = "admin";
      if (pwd) pwd.value = "admin123456";
      role = "admin";
      updateRoleDestHint("admin");
      if (form) {
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit"));
      }
    });
  }

  if (quickFillBuyerBtn) {
    quickFillBuyerBtn.addEventListener("click", () => {
      if (idInput) idInput.value = "phuc@hybrid.store";
      if (pwd) pwd.value = "password123";
      role = "buyer";
      updateRoleDestHint("buyer");
      if (form) {
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit"));
      }
    });
  }

  if (quickFillSellerBtn) {
    quickFillSellerBtn.addEventListener("click", () => {
      if (idInput) idInput.value = "binh@sneakers.vn";
      if (pwd) pwd.value = "password123";
      role = "seller";
      updateRoleDestHint("seller");
      if (form) {
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit"));
      }
    });
  }

  // =========================================================================
  // 3. ĐĂNG NHẬP BẰNG TÀI KHOẢN GOOGLE CHUẨN GOOGLE IDENTITY SERVICES (GIS)
  // =========================================================================
  const escapeSafeHtml = (str) =>
    typeof Utils !== "undefined" && Utils.escapeHtml
      ? Utils.escapeHtml(str)
      : String(str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

  function renderGoogleAccountsPicker() {
    const picker = document.getElementById("googleAccountsPicker");
    if (!picker) return;

    picker.innerHTML = "";
  }

  // Lấy Google OAuth 2.0 Client ID hiệu lực (từ LocalStorage -> Backend API -> Mặc định)
  async function getEffectiveGoogleClientId() {
    const stored = localStorage.getItem("hv_google_client_id");
    if (stored && stored.trim()) return stored.trim();

    if (typeof API !== "undefined" && API.Auth && API.Auth.getGoogleOAuthConfig) {
      try {
        const res = await API.Auth.getGoogleOAuthConfig();
        if (res && res.success && res.data && res.data.client_id) {
          return res.data.client_id;
        }
      } catch (e) {
        console.warn("[Google OAuth] Không lấy được Client ID từ backend:", e.message);
      }
    }

    return "481928491823-hybridstore.apps.googleusercontent.com";
  }

  function getGoogleRedirectUri() {
    const origin = window.location.origin;
    let path = window.location.pathname;
    return origin + path;
  }

  // Khởi động luồng Google OAuth 2.0 thật: Chuyển hướng trực tiếp tới accounts.google.com
  async function initiateRealGoogleOAuth() {
    const clientId = await getEffectiveGoogleClientId();
    const redirectUri = getGoogleRedirectUri();

    // Kiểm tra xem Client ID đã được cấu hình hợp lệ trên Google Cloud chưa
    const isConfigured = clientId &&
      !clientId.includes("hybridstore.apps.googleusercontent.com") &&
      !clientId.includes("your-client-id") &&
      clientId.endsWith(".apps.googleusercontent.com");

    if (!isConfigured) {
      if (btnGoogleLogin) {
        btnGoogleLogin.disabled = false;
        if (googleLoginBtnText) {
          googleLoginBtnText.textContent = "Đăng nhập bằng tài khoản Google";
        }
      }
      if (displayRedirectUri) {
        displayRedirectUri.value = redirectUri;
      }
      if (inputGoogleClientId) {
        inputGoogleClientId.value = clientId.includes("hybridstore") ? "" : clientId;
      }
      showModal(googleAuthModal);
      notify({
        type: "warning",
        title: "Cần Cấu Hình Google Client ID",
        message: "Hệ thống cần Google Client ID thật từ Google Cloud Console để Google không báo lỗi 401. Bạn có thể nhập Client ID hoặc bấm 'Đăng Nhập Thử Nghiệm Ngay'.",
      });
      return;
    }

    if (btnGoogleLogin) {
      btnGoogleLogin.disabled = true;
      if (googleLoginBtnText) {
        googleLoginBtnText.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Đang chuyển hướng sang Google...`;
      }
    }

    notify({
      type: "info",
      title: "Chuyển Hướng Google",
      message: "Đang mở trang xác minh danh tính tài khoản Google chính thức (accounts.google.com)...",
    });

    const statePayload = {
      role: role,
      redirect: getRedirectTarget() || "",
      ts: Date.now()
    };
    const stateStr = encodeURIComponent(JSON.stringify(statePayload));

    // Xây dựng URL chuẩn Google OAuth 2.0 Identity Services
    const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "openid email profile",
      include_granted_scopes: "true",
      prompt: "select_account",
      state: stateStr
    }).toString();

    // Chuyển hướng trình duyệt đến trang xác minh của Google
    window.location.href = authUrl;
  }

  // Kiểm tra callback xác thực từ Google khi trang được tải lại
  async function checkGoogleOAuthCallback() {
    const hash = window.location.hash;
    if (!hash) return;

    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const error = hashParams.get("error");
    const stateStr = hashParams.get("state");

    if (error) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
      notify({
        type: "warning",
        title: "Xác thực Google bị gián đoạn",
        message: "Phiên xác thực Google không hoàn tất (" + error + ").",
      });
      return;
    }

    if (!accessToken) return;

    // Dọn sạch hash trên URL ngay lập tức để bảo vệ Access Token
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);

    let parsedRole = role;
    if (stateStr) {
      try {
        const stateObj = JSON.parse(decodeURIComponent(stateStr));
        if (stateObj && stateObj.role) parsedRole = stateObj.role;
      } catch (e) {}
    }

    if (typeof showPopup === "function") {
      showPopup({
        type: "info",
        title: "Google Identity Services",
        message: "Đang xác thực thông tin tài khoản từ máy chủ Google...",
      });
    }

    try {
      let googleUser = null;

      // 1. Gọi trực tiếp API Google UserInfo để lấy email, họ tên, ảnh đại diện
      try {
        const gRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: "Bearer " + accessToken }
        });
        if (gRes.ok) {
          googleUser = await gRes.json();
        }
      } catch (e) {
        console.warn("Gọi trực tiếp Google UserInfo:", e);
      }

      // 2. Xác thực và lưu vào Database của hệ thống
      let backendUser = null;
      let backendToken = null;
      if (typeof API !== "undefined" && API.Auth && API.Auth.verifyGoogleOAuthToken) {
        try {
          const apiRes = await API.Auth.verifyGoogleOAuthToken(accessToken, parsedRole);
          if (apiRes && apiRes.success && apiRes.data) {
            backendUser = apiRes.data.user;
            backendToken = apiRes.data.access_token;
          }
        } catch (e) {
          console.warn("Backend verify token warning:", e);
        }
      }

      const email = (googleUser && googleUser.email) || (backendUser && backendUser.email);
      const fullName = (googleUser && googleUser.name) || (backendUser && backendUser.full_name) || "Google User";
      const avatar = (googleUser && googleUser.picture) || (backendUser && backendUser.avatar_url) || "G";

      if (!email) {
        throw new Error("Không thể trích xuất địa chỉ email từ tài khoản Google.");
      }

      const sessionUser = {
        id: backendUser ? backendUser.id : ("usr_gg_" + Date.now().toString(36)),
        email: email,
        fullName: fullName,
        name: fullName,
        role: (backendUser && backendUser.role) || parsedRole || "buyer",
        avatar: avatar,
        token: backendToken || ("bearer_google_" + accessToken.slice(-12))
      };

      if (typeof Auth !== "undefined" && Auth.loginWithGoogle) {
        Auth.loginWithGoogle({
          email: email,
          name: fullName,
          avatar: avatar,
          role: sessionUser.role,
          token: sessionUser.token
        });
      }

      if (typeof Auth !== "undefined" && Auth.setBrowserGoogleAccount) {
        Auth.setBrowserGoogleAccount({
          email: email,
          name: fullName,
          avatar: avatar
        });
      }

      handleGoogleLoginSuccess(sessionUser);
    } catch (err) {
      console.error("Lỗi hoàn tất đăng nhập Google:", err);
      if (typeof showPopup === "function") {
        showPopup({
          type: "error",
          title: "Đăng nhập Google thất bại",
          message: err.message || "Không thể xác minh danh tính tài khoản Google.",
          confirmText: "Thử lại",
        });
      }
    }
  }

  // Tự động kiểm tra callback đăng nhập Google ngay khi nạp trang
  checkGoogleOAuthCallback();

  function updateGoogleAccountUI() {
    if (typeof Auth === "undefined" || typeof Auth.getBrowserGoogleAccount !== "function") return;
    const browserAcc = Auth.getBrowserGoogleAccount();
    const googleHintRow = document.getElementById("googleHintRow");

    if (browserAcc && browserAcc.email) {
      if (googleLoginBtnText) {
        googleLoginBtnText.innerHTML = `Đăng nhập Google (<strong>${escapeSafeHtml(browserAcc.email)}</strong>)`;
      }
    } else {
      if (googleLoginBtnText) {
        googleLoginBtnText.textContent = "Đăng nhập bằng tài khoản Google";
      }
    }
  }

  updateGoogleAccountUI();

  function handleGoogleLoginSuccess(userSession) {
    hideModal(googleAuthModal);
    const targetAfterLogin = getRedirectTarget();
    const destination = targetAfterLogin || getRoleDefaultTarget(userSession, role);
    const confirmLabel = getConfirmButtonLabel(targetAfterLogin, userSession, role);

    if (typeof showPopup === "function") {
      showPopup({
        type: "success",
        title: "Đăng nhập Google thành công!",
        message:
          "Chào mừng " +
          userSession.fullName +
          " (" +
          userSession.email +
          ")! " +
          getWelcomeMessage(userSession, role),
        confirmText: confirmLabel,
        onConfirm: () => {
          if (targetAfterLogin) {
            sessionStorage.removeItem("hv_redirect_after_login");
          }
          window.location.href = destination;
        },
      });
    } else {
      if (targetAfterLogin) {
        sessionStorage.removeItem("hv_redirect_after_login");
      }
      window.location.href = destination;
    }
  }

  // Khi click nút Google Login -> Chuyển hướng trực tiếp sang accounts.google.com
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener("click", () => {
      initiateRealGoogleOAuth();
    });
  }

  // Nút mở Modal cấu hình Client ID cho quản trị viên / nhà phát triển
  if (btnConfigGoogleClient) {
    btnConfigGoogleClient.addEventListener("click", async () => {
      if (displayRedirectUri) {
        displayRedirectUri.value = getGoogleRedirectUri();
      }
      if (inputGoogleClientId) {
        inputGoogleClientId.value = await getEffectiveGoogleClientId();
      }
      showModal(googleAuthModal);
    });
  }

  if (btnCopyRedirectUri && displayRedirectUri) {
    btnCopyRedirectUri.addEventListener("click", () => {
      try {
        navigator.clipboard.writeText(displayRedirectUri.value);
        notify({
          type: "success",
          title: "Đã sao chép",
          message: "Đã sao chép Redirect URI vào bộ nhớ tạm.",
        });
      } catch (e) {
        alert("Redirect URI: " + displayRedirectUri.value);
      }
    });
  }

  if (btnSaveGoogleConfig && inputGoogleClientId) {
    btnSaveGoogleConfig.addEventListener("click", () => {
      const val = inputGoogleClientId.value.trim();
      if (!val) {
        notify({
          type: "warning",
          title: "Chưa nhập Client ID",
          message: "Vui lòng nhập Google Client ID hợp lệ.",
        });
        return;
      }
      localStorage.setItem("hv_google_client_id", val);
      notify({
        type: "success",
        title: "Đã lưu Google Client ID",
        message: "Cấu hình Google OAuth 2.0 đã được cập nhật thành công.",
      });
      hideModal(googleAuthModal);
    });
  }

  if (btnTestGoogleRedirect) {
    btnTestGoogleRedirect.addEventListener("click", () => {
      if (inputGoogleClientId && inputGoogleClientId.value.trim()) {
        localStorage.setItem("hv_google_client_id", inputGoogleClientId.value.trim());
      }
      initiateRealGoogleOAuth();
    });
  }

  if (btnCancelGoogleConfig) {
    btnCancelGoogleConfig.addEventListener("click", () => {
      hideModal(googleAuthModal);
    });
  }

  if (btnCloseGoogleModal) {
    btnCloseGoogleModal.addEventListener("click", () => {
      hideModal(googleAuthModal);
    });
  }

  // =========================================================================
  // 4. ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI & SMS OTP (BẢO MẬT CAO, CHE MỜ SĐT)
  // =========================================================================
  let phoneOtpCooldownTimer = null;
  const secureSmsNotice = document.getElementById("secureSmsNotice");
  const secureSmsNoticeText = document.getElementById("secureSmsNoticeText");
  const qaSmsBox = document.getElementById("qaSmsBox");
  const btnToggleQaSms = document.getElementById("btnToggleQaSms");
  const qaSmsContent = document.getElementById("qaSmsContent");
  const qaSmsText = document.getElementById("qaSmsText");

  if (btnToggleQaSms && qaSmsContent) {
    btnToggleQaSms.addEventListener("click", () => {
      const isHidden = qaSmsContent.style.display === "none";
      qaSmsContent.style.display = isHidden ? "block" : "none";
    });
  }

  function startPhoneOtpCooldown(seconds) {
    if (!btnSendPhoneOtp) return;
    let remain = seconds;
    btnSendPhoneOtp.disabled = true;
    btnSendPhoneOtp.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Gửi lại (${remain}s)`;

    if (phoneOtpCooldownTimer) clearInterval(phoneOtpCooldownTimer);
    phoneOtpCooldownTimer = setInterval(() => {
      remain -= 1;
      if (remain <= 0) {
        clearInterval(phoneOtpCooldownTimer);
        btnSendPhoneOtp.disabled = false;
        btnSendPhoneOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">send</span> Nhận Mã OTP`;
      } else {
        btnSendPhoneOtp.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Gửi lại (${remain}s)`;
      }
    }, 1000);
  }

  if (btnSendPhoneOtp && otpPhoneNumber) {
    btnSendPhoneOtp.addEventListener("click", async () => {
      if (phoneInputError) phoneInputError.textContent = "";
      const rawTarget = otpPhoneNumber.value.trim();
      const isEmail = rawTarget.includes("@") && rawTarget.includes(".");
      const cleanTarget = isEmail ? rawTarget.toLowerCase() : rawTarget.replace(/\D/g, "");

      if (isEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTarget)) {
          if (phoneInputError) phoneInputError.textContent = "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.";
          otpPhoneNumber.focus();
          return;
        }
      } else {
        if (!cleanTarget || cleanTarget.length !== 10 || !cleanTarget.startsWith("0")) {
          if (phoneInputError) phoneInputError.textContent = "Vui lòng nhập đúng số điện thoại di động (10 chữ số, ví dụ 09...) hoặc Email của bạn.";
          otpPhoneNumber.focus();
          return;
        }
      }

      btnSendPhoneOtp.disabled = true;
      btnSendPhoneOtp.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> ${isEmail ? "Đang gửi email..." : "Đang gửi SMS..."}`;

      try {
        let sentOk = false;
        let maskedTarget = isEmail
          ? cleanTarget.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + "***" + c)
          : cleanTarget.slice(0, 3) + "****" + cleanTarget.slice(-3);
        let errorMsg = "";

        // Gửi qua Backend SMS Gateway / Resend Email API thật
        if (typeof API !== "undefined" && API.Auth && API.Auth.sendPhoneOtpSms) {
          try {
            const apiRes = await API.Auth.sendPhoneOtpSms(cleanTarget);
            if (apiRes && apiRes.success) {
              sentOk = true;
              if (apiRes.data) {
                if (apiRes.data.masked_phone) maskedTarget = apiRes.data.masked_phone;
                if (apiRes.data.masked_target) maskedTarget = apiRes.data.masked_target;
              }
            } else if (apiRes && apiRes.message) {
              errorMsg = apiRes.message;
            }
          } catch (e) {
            errorMsg = e.message || (isEmail ? "Lỗi gửi mã OTP qua email." : "Lỗi kết nối Cổng SMS viễn thông.");
            console.warn("[OTP Dispatch] Lỗi kết nối API Gateway:", errorMsg);
          }
        }

        // Nếu chưa cấu hình hoặc gửi thất bại -> Báo lỗi bảo vệ hệ thống, tuyệt đối không in mã ra màn hình
        if (!sentOk) {
          btnSendPhoneOtp.disabled = false;
          btnSendPhoneOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">send</span> Nhận Mã OTP`;
          const displayErr = errorMsg || (isEmail ? "Chưa thể gửi email OTP. Vui lòng kiểm tra cấu hình RESEND_API_KEY trên Render." : "Hệ thống chưa kết nối Cổng SMS viễn thông (eSMS/Twilio).");
          if (phoneInputError) {
            phoneInputError.textContent = displayErr;
          }
          if (typeof notify === "function") {
            notify({
              type: "error",
              title: isEmail ? "Chưa Thể Gửi Email OTP" : "Chưa Thể Gửi SMS OTP",
              message: displayErr,
            });
          }
          return;
        }

        // Gửi thành công trực tiếp vào Email hoặc SIM điện thoại
        if (secureSmsNotice && secureSmsNoticeText) {
          secureSmsNotice.style.display = "flex";
          secureSmsNoticeText.innerHTML = isEmail
            ? `Mã OTP 6 số bảo mật đã được gửi trực tiếp đến hòm thư <strong class="text-secondary">${escapeSafeHtml(maskedTarget)}</strong>. Vui lòng mở hòm thư email của bạn để lấy mã (hiệu lực 3 phút).`
            : `Mã OTP 6 số bảo mật đã được gửi trực tiếp qua mạng viễn thông tới SIM điện thoại <strong class="text-secondary">${escapeSafeHtml(maskedTarget)}</strong>. Vui lòng mở tin nhắn SMS trên điện thoại của bạn để lấy mã (hiệu lực 3 phút).`;
        }

        // Ô nhập mã OTP để trống hoàn toàn để người dùng tự tay nhập mã nhận được
        if (phoneOtpCode) {
          phoneOtpCode.value = "";
          phoneOtpCode.focus();
        }

        notify({
          type: "success",
          title: isEmail ? "Đã Gửi Mã OTP Đến Email" : "Đã Gửi Tin Nhắn SMS OTP",
          message: isEmail
            ? `Mã OTP bảo mật đã được gửi trực tiếp đến hộp thư ${maskedTarget}. Vui lòng kiểm tra hòm thư của bạn.`
            : `Mã OTP bảo mật đã được gửi trực tiếp đến SIM điện thoại ${maskedTarget}. Vui lòng mở tin nhắn SMS trên máy để lấy mã.`,
        });

        startPhoneOtpCooldown(60);
      } catch (err) {
        btnSendPhoneOtp.disabled = false;
        btnSendPhoneOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">send</span> Nhận Mã OTP`;
        if (phoneInputError) phoneInputError.textContent = err.message || "Lỗi gửi mã OTP.";
      }
    });
  }

  if (phoneOtpLoginForm) {
    phoneOtpLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (phoneInputError) phoneInputError.textContent = "";
      if (phoneOtpCodeError) phoneOtpCodeError.textContent = "";

      const rawVal = otpPhoneNumber ? otpPhoneNumber.value.trim() : "";
      const isEmail = rawVal.includes("@") && rawVal.includes(".");
      const cleanTarget = isEmail ? rawVal.toLowerCase() : rawVal.replace(/\D/g, "");
      const otpVal = phoneOtpCode ? phoneOtpCode.value.trim() : "";

      if (isEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTarget)) {
          if (phoneInputError) phoneInputError.textContent = "Địa chỉ email không hợp lệ.";
          if (otpPhoneNumber) otpPhoneNumber.focus();
          return;
        }
      } else {
        if (!cleanTarget || cleanTarget.length !== 10) {
          if (phoneInputError) phoneInputError.textContent = "Vui lòng nhập đúng số điện thoại (10 chữ số) hoặc địa chỉ Email.";
          if (otpPhoneNumber) otpPhoneNumber.focus();
          return;
        }
      }

      if (!otpVal || otpVal.length !== 6) {
        if (phoneOtpCodeError) phoneOtpCodeError.textContent = "Vui lòng nhập đúng mã OTP gồm 6 chữ số.";
        if (phoneOtpCode) phoneOtpCode.focus();
        return;
      }

      if (submitPhoneOtpBtn) {
        submitPhoneOtpBtn.disabled = true;
        submitPhoneOtpBtn.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Đang xác thực OTP...`;
      }

      try {
        let loginSuccess = false;
        let sessionUser = null;
        let errorMsg = "";

        // 1. Xác thực và đăng nhập qua Backend API
        if (typeof API !== "undefined" && API.Auth && API.Auth.loginWithPhoneOtp) {
          try {
            const apiLogin = await API.Auth.loginWithPhoneOtp(cleanTarget, otpVal, role);
            if (apiLogin && apiLogin.success && apiLogin.data) {
              loginSuccess = true;
              sessionUser = apiLogin.data.user;
              if (apiLogin.data.access_token) {
                localStorage.setItem("hv_access_token", apiLogin.data.access_token);
              }
            }
          } catch (e) {
            console.warn("[Phone/Email Login] API backend login fallback:", e.message);
            errorMsg = e.message;
          }
        }

        // 2. Dự phòng Auth cục bộ nếu backend offline
        if (!loginSuccess && typeof Auth !== "undefined" && Auth.loginWithPhone) {
          const localLogin = Auth.loginWithPhone(cleanTarget, otpVal, role);
          if (localLogin.ok) {
            loginSuccess = true;
            sessionUser = localLogin.user;
          } else {
            errorMsg = localLogin.error;
          }
        }

        if (submitPhoneOtpBtn) {
          submitPhoneOtpBtn.disabled = false;
          submitPhoneOtpBtn.innerHTML = `<span class="material-symbols-outlined">login</span><span>XÁC NHẬN &amp; ĐĂNG NHẬP</span><span class="material-symbols-outlined icon-sm">arrow_forward</span>`;
        }

        if (!loginSuccess) {
          if (phoneOtpCodeError) phoneOtpCodeError.textContent = errorMsg || "Mã OTP không chính xác hoặc đã hết hạn.";
          if (typeof showPopup === "function") {
            showPopup({
              type: "error",
              title: "Xác thực OTP thất bại",
              message: errorMsg || (isEmail ? "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại hòm thư email của bạn." : "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại tin nhắn SMS trên điện thoại."),
              confirmText: "Thử lại",
            });
          }
          return;
        }

        if (typeof Utils !== "undefined") {
          if (Utils.Wishlist && typeof Utils.Wishlist.refresh === "function") Utils.Wishlist.refresh();
          if (Utils.Cart) {
            if (typeof Utils.Cart.migrateGuestCart === "function") Utils.Cart.migrateGuestCart();
            if (typeof Utils.Cart.syncBadge === "function") Utils.Cart.syncBadge();
          }
        }

        const targetAfterLogin = getRedirectTarget();
        const destination = targetAfterLogin || getRoleDefaultTarget(sessionUser, role);
        const confirmLabel = getConfirmButtonLabel(targetAfterLogin, sessionUser, role);

        if (typeof showPopup === "function") {
          const targetDisplay = (sessionUser && (sessionUser.phone || sessionUser.email)) || cleanTarget;
          showPopup({
            type: "success",
            title: "Đăng nhập thành công!",
            message:
              (isEmail ? "Xác thực địa chỉ Email " : "Xác thực số điện thoại ") +
              targetDisplay +
              " thành công. " +
              getWelcomeMessage(sessionUser, role),
            confirmText: confirmLabel,
            onConfirm: () => {
              if (targetAfterLogin) {
                sessionStorage.removeItem("hv_redirect_after_login");
              }
              window.location.href = destination;
            },
          });
        } else {
          if (targetAfterLogin) {
            sessionStorage.removeItem("hv_redirect_after_login");
          }
          window.location.href = destination;
        }
      } catch (err) {
        if (submitPhoneOtpBtn) {
          submitPhoneOtpBtn.disabled = false;
          submitPhoneOtpBtn.innerHTML = `<span class="material-symbols-outlined">login</span><span>XÁC NHẬN &amp; ĐĂNG NHẬP</span><span class="material-symbols-outlined icon-sm">arrow_forward</span>`;
        }
        if (phoneOtpCodeError) phoneOtpCodeError.textContent = err.message || "Lỗi xác thực OTP.";
      }
    });
  }

  // =========================================================================
  // 5. KHÔI PHỤC MẬT KHẨU QUA EMAIL BẢO MẬT & CẤP MẬT KHẨU MỚI (WIZARD 3 BƯỚC)
  // =========================================================================
  let resetVerifiedEmail = "";
  let generatedNewPassword = "";
  let forgotOtpCooldownTimer = null;

  const wizardBadge1 = document.getElementById("wizardBadge1");
  const wizardBadge2 = document.getElementById("wizardBadge2");
  const wizardBadge3 = document.getElementById("wizardBadge3");
  const forgotMaskedEmailText = document.getElementById("forgotMaskedEmailText");
  const qaEmailBox = document.getElementById("qaEmailBox");
  const btnToggleQaEmail = document.getElementById("btnToggleQaEmail");
  const qaEmailContent = document.getElementById("qaEmailContent");
  const qaEmailText = document.getElementById("qaEmailText");
  const btnResendForgotOtp = document.getElementById("btnResendForgotOtp");
  const displayGeneratedPassword = document.getElementById("displayGeneratedPassword");
  const btnCopyGeneratedPassword = document.getElementById("btnCopyGeneratedPassword");
  const copyPasswordText = document.getElementById("copyPasswordText");
  const copyPasswordIcon = document.getElementById("copyPasswordIcon");
  const btnAutoLoginWithNewPassword = document.getElementById("btnAutoLoginWithNewPassword");
  const forgotTargetEmailDisplay = document.getElementById("forgotTargetEmailDisplay");
  const btnGoToLoginFromForgot = document.getElementById("btnGoToLoginFromForgot");

  function setForgotStep(stepIndex) {
    [forgotStep1, forgotStep2, forgotStep3].forEach((step, idx) => {
      if (!step) return;
      if (idx + 1 === stepIndex) {
        step.classList.add("active");
        step.style.display = "block";
      } else {
        step.classList.remove("active");
        step.style.display = "none";
      }
    });

    [wizardBadge1, wizardBadge2, wizardBadge3].forEach((badge, idx) => {
      if (!badge) return;
      badge.classList.toggle("active", idx + 1 === stepIndex);
    });
  }

  function startForgotCooldown(seconds) {
    if (!btnResendForgotOtp) return;
    let remain = seconds;
    btnResendForgotOtp.disabled = true;
    btnResendForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Gửi lại (${remain}s)`;

    if (forgotOtpCooldownTimer) clearInterval(forgotOtpCooldownTimer);
    forgotOtpCooldownTimer = setInterval(() => {
      remain -= 1;
      if (remain <= 0) {
        clearInterval(forgotOtpCooldownTimer);
        btnResendForgotOtp.disabled = false;
        btnResendForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">refresh</span> Gửi lại mã`;
      } else {
        btnResendForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Gửi lại (${remain}s)`;
      }
    }, 1000);
  }

  if (btnToggleQaEmail && qaEmailContent) {
    btnToggleQaEmail.addEventListener("click", () => {
      const isHidden = qaEmailContent.style.display === "none";
      qaEmailContent.style.display = isHidden ? "block" : "none";
    });
  }

  if (linkForgotPassword) {
    linkForgotPassword.addEventListener("click", () => {
      setForgotStep(1);
      resetVerifiedEmail = "";
      generatedNewPassword = "";
      if (forgotStep1Error) forgotStep1Error.textContent = "";
      if (forgotStep2Error) forgotStep2Error.textContent = "";

      if (forgotIdentifier && idInput && idInput.value.trim()) {
        const val = idInput.value.trim();
        if (val.includes("@")) {
          forgotIdentifier.value = val;
        }
      }

      showModal(forgotPasswordModal);
      if (forgotIdentifier) forgotIdentifier.focus();
    });
  }

  if (btnCloseForgotModal) {
    btnCloseForgotModal.addEventListener("click", () => {
      hideModal(forgotPasswordModal);
    });
  }

  if (btnCancelForgotModal) {
    btnCancelForgotModal.addEventListener("click", () => {
      hideModal(forgotPasswordModal);
    });
  }

  // BƯỚC 1: Gửi mã xác nhận qua Email thật
  async function triggerSendForgotEmail() {
    if (forgotStep1Error) forgotStep1Error.textContent = "";
    const emailVal = forgotIdentifier ? forgotIdentifier.value.trim().toLowerCase() : "";

    if (!emailVal || !emailVal.includes("@") || !emailVal.includes(".")) {
      if (forgotStep1Error) forgotStep1Error.textContent = "Vui lòng nhập địa chỉ email hợp lệ đã đăng ký.";
      if (forgotIdentifier) forgotIdentifier.focus();
      return;
    }

    if (btnSendForgotOtp) {
      btnSendForgotOtp.disabled = true;
      btnSendForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Đang gửi email...`;
    }

    try {
      let res = null;
      // 1. Gửi qua Backend SMTP thật (Gmail / SendGrid)
      let errorMsg = "";
      if (typeof API !== "undefined" && API.Auth && API.Auth.requestPasswordReset) {
        try {
          const apiRes = await API.Auth.requestPasswordReset(emailVal);
          if (apiRes && apiRes.success && apiRes.data) {
            res = {
              ok: true,
              email: apiRes.data.email,
              maskedEmail: apiRes.data.masked_email,
              isRealEmail: !!apiRes.data.email_dispatched,
              testOtp: apiRes.data.test_otp,
            };
          } else if (apiRes && apiRes.message) {
            errorMsg = apiRes.message;
          }
        } catch (e) {
          errorMsg = e.message || "Lỗi kết nối máy chủ gửi Email SMTP.";
          console.warn("[Forgot-Password] API SMTP Error:", errorMsg);
        }
      }

      // 2. Dự phòng Auth cục bộ nếu backend offline
      if (!res && typeof Auth !== "undefined" && Auth.sendPasswordResetEmail) {
        const localRes = Auth.sendPasswordResetEmail(emailVal);
        if (localRes.ok) {
          res = {
            ok: true,
            email: localRes.email || emailVal,
            maskedEmail: localRes.maskedEmail,
            isRealEmail: false,
            testOtp: localRes.code,
          };
        } else {
          errorMsg = localRes.error;
        }
      }

      if (btnSendForgotOtp) {
        btnSendForgotOtp.disabled = false;
        btnSendForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">send</span> Gửi Mã Xác Thực Đến Email`;
      }

      if (!res || !res.ok) {
        if (forgotStep1Error) {
          forgotStep1Error.textContent = errorMsg || "Không tìm thấy tài khoản hoặc không thể gửi email lúc này.";
        }
        if (typeof notify === "function") {
          notify({
            type: "error",
            title: "Chưa Thể Gửi Email OTP",
            message: errorMsg || "Vui lòng kiểm tra lại địa chỉ email tài khoản.",
          });
        }
        return;
      }

      resetVerifiedEmail = res.email;

      if (forgotMaskedEmailText) {
        forgotMaskedEmailText.textContent = res.maskedEmail || res.email;
      }

      notify({
        type: "success",
        title: "Đã Gửi Mã OTP Đến Email",
        message: `Mã xác thực OTP đã được gửi trực tiếp đến hộp thư ${res.maskedEmail || res.email}. Vui lòng mở hòm thư để lấy mã.`,
      });

      setForgotStep(2);
      startForgotCooldown(60);
      if (forgotOtpCode) {
        forgotOtpCode.value = "";
        forgotOtpCode.focus();
      }
    } catch (err) {
      if (btnSendForgotOtp) {
        btnSendForgotOtp.disabled = false;
        btnSendForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">send</span> Gửi Mã Xác Thực Đến Email`;
      }
      if (forgotStep1Error) forgotStep1Error.textContent = err.message || "Lỗi khi gửi email.";
    }
  }

  if (btnSendForgotOtp) {
    btnSendForgotOtp.addEventListener("click", triggerSendForgotEmail);
  }
  if (forgotIdentifier) {
    forgotIdentifier.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerSendForgotEmail();
      }
    });
  }

  // BƯỚC 2: Quay lại đổi email
  if (btnBackToStep1) {
    btnBackToStep1.addEventListener("click", () => {
      setForgotStep(1);
      if (forgotIdentifier) forgotIdentifier.focus();
    });
  }

  // BƯỚC 2: Gửi lại mã
  if (btnResendForgotOtp) {
    btnResendForgotOtp.addEventListener("click", async () => {
      if (!resetVerifiedEmail) return;
      btnResendForgotOtp.disabled = true;

      let res = null;
      let resendError = "";
      if (typeof API !== "undefined" && API.Auth && API.Auth.requestPasswordReset) {
        try {
          const apiRes = await API.Auth.requestPasswordReset(resetVerifiedEmail);
          if (apiRes && apiRes.success && apiRes.data) {
            res = { ok: true, maskedEmail: apiRes.data.masked_email };
          } else if (apiRes && apiRes.message) {
            resendError = apiRes.message;
          }
        } catch (e) {
          resendError = e.message || "Lỗi gửi lại mã OTP qua email.";
        }
      }

      if (!res || !res.ok) {
        if (forgotStep2Error) forgotStep2Error.textContent = resendError || "Không thể gửi lại mã lúc này. Vui lòng kiểm tra cấu hình SMTP trên Render.";
        btnResendForgotOtp.disabled = false;
        return;
      }

      notify({
        type: "info",
        title: "Đã gửi lại mã OTP",
        message: `Mã xác thực mới đã được gửi tới ${res.maskedEmail || resetVerifiedEmail}.`,
      });
      startForgotCooldown(60);
    });
  }

  // BƯỚC 2: Xác minh OTP Email và Cấp Mật Khẩu Mới Tự Động Gửi Về Email Thật
  async function triggerVerifyAndGeneratePassword() {
    if (forgotStep2Error) forgotStep2Error.textContent = "";
    const code = forgotOtpCode ? forgotOtpCode.value.trim() : "";

    if (!code || code.length !== 6) {
      if (forgotStep2Error) forgotStep2Error.textContent = "Vui lòng nhập đúng mã OTP gồm 6 chữ số từ email.";
      if (forgotOtpCode) forgotOtpCode.focus();
      return;
    }

    if (btnVerifyForgotOtp) {
      btnVerifyForgotOtp.disabled = true;
      btnVerifyForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs spin">sync</span> Đang xác minh OTP...`;
    }

    try {
      let verifyOk = false;

      // 1. Xác thực qua Backend nếu có
      if (typeof API !== "undefined" && API.Auth && API.Auth.verifyPasswordResetOtp) {
        try {
          const apiRes = await API.Auth.verifyPasswordResetOtp(resetVerifiedEmail, code);
          if (apiRes && apiRes.success) verifyOk = true;
        } catch (e) {
          console.warn("[Verify OTP] API fallback sang Auth cục bộ:", e.message);
        }
      }

      if (!verifyOk && typeof Auth !== "undefined" && Auth.verifyEmailResetOtp) {
        const localCheck = Auth.verifyEmailResetOtp(resetVerifiedEmail, code);
        if (!localCheck.ok) {
          if (btnVerifyForgotOtp) {
            btnVerifyForgotOtp.disabled = false;
            btnVerifyForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">task_alt</span> Xác Minh Email Chính Chủ`;
          }
          if (forgotStep2Error) forgotStep2Error.textContent = localCheck.error;
          if (forgotOtpCode) forgotOtpCode.focus();
          return;
        }
        verifyOk = true;
      }

      // 2. Xác thực thành công -> Cấp mật khẩu mới và gửi trực tiếp về Email thật
      let newPwdRes = null;
      if (typeof API !== "undefined" && API.Auth && API.Auth.resetPasswordAndSendNew) {
        try {
          const apiNew = await API.Auth.resetPasswordAndSendNew(resetVerifiedEmail, code);
          if (apiNew && apiNew.success && apiNew.data) {
            newPwdRes = {
              ok: true,
              newPassword: apiNew.data.new_password,
              email: apiNew.data.email,
              maskedEmail: apiNew.data.masked_email,
            };
          }
        } catch (e) {
          console.warn("[Reset Password] API fallback sang Auth cục bộ:", e.message);
        }
      }

      if (!newPwdRes && typeof Auth !== "undefined" && Auth.generateAndSendNewPassword) {
        newPwdRes = Auth.generateAndSendNewPassword(resetVerifiedEmail);
      }

      if (btnVerifyForgotOtp) {
        btnVerifyForgotOtp.disabled = false;
        btnVerifyForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">task_alt</span> Xác Minh Email Chính Chủ`;
      }

      if (!newPwdRes || !newPwdRes.ok) {
        if (forgotStep2Error) forgotStep2Error.textContent = (newPwdRes && newPwdRes.error) || "Không thể cấp mật khẩu mới lúc này.";
        return;
      }

      generatedNewPassword = newPwdRes.newPassword;

      // Cập nhật email đã nhận mật khẩu trên giao diện Bước 3
      if (forgotTargetEmailDisplay) {
        forgotTargetEmailDisplay.textContent = newPwdRes.maskedEmail || resetVerifiedEmail;
      }

      // Tự động điền email vào ô Đăng nhập
      if (idInput) {
        idInput.value = resetVerifiedEmail;
      }

      // Chuyển sang Bước 3 hiển thị thông báo mật khẩu đã gửi về email
      setForgotStep(3);

      notify({
        type: "success",
        title: "Đã Cấp Mật Khẩu Mới",
        message: `Mật khẩu mới đã được gửi trực tiếp về hòm thư ${newPwdRes.maskedEmail || resetVerifiedEmail}.`,
      });
    } catch (err) {
      if (btnVerifyForgotOtp) {
        btnVerifyForgotOtp.disabled = false;
        btnVerifyForgotOtp.innerHTML = `<span class="material-symbols-outlined icon-xs">task_alt</span> Xác Minh Email Chính Chủ`;
      }
      if (forgotStep2Error) forgotStep2Error.textContent = err.message || "Lỗi xác thực OTP.";
    }
  }

  if (btnVerifyForgotOtp) {
    btnVerifyForgotOtp.addEventListener("click", triggerVerifyAndGeneratePassword);
  }
  if (forgotOtpCode) {
    forgotOtpCode.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerVerifyAndGeneratePassword();
      }
    });
  }

  // BƯỚC 3: Nút điều hướng quay lại Đăng Nhập sau khi nhận mật khẩu qua email
  const handleGoToLoginFromForgot = () => {
    hideModal(forgotPasswordModal);

    // Chuyển sang tab Mật khẩu
    if (tabLoginPassword && tabLoginPassword.click) {
      tabLoginPassword.click();
    }

    // Điền email và trỏ chuột vào ô nhập mật khẩu
    if (idInput && resetVerifiedEmail) {
      idInput.value = resetVerifiedEmail;
    }
    if (pwd) {
      pwd.value = "";
      pwd.focus();
    }

    notify({
      type: "info",
      title: "Đăng Nhập Với Mật Khẩu Mới",
      message: "Vui lòng dán mật khẩu mới từ email vào ô 'Mật khẩu' để đăng nhập.",
    });
  };

  if (btnGoToLoginFromForgot) {
    btnGoToLoginFromForgot.addEventListener("click", handleGoToLoginFromForgot);
  }

  if (btnAutoLoginWithNewPassword) {
    btnAutoLoginWithNewPassword.addEventListener("click", handleGoToLoginFromForgot);
  }
})();
