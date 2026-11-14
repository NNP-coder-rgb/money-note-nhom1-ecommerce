// login.js — xử lý đăng nhập mật khẩu, đăng nhập Google, SMS OTP và khôi phục mật khẩu
(function () {
  const HOME_PAGE = window.location.pathname.includes("/pages/")
    ? "../../index.html"
    : "index.html";

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
  const phoneOtpHintBox = document.getElementById("phoneOtpHintBox");
  const phoneOtpDisplayCode = document.getElementById("phoneOtpDisplayCode");
  const phoneOtpCode = document.getElementById("phoneOtpCode");
  const phoneInputError = document.getElementById("phoneInputError");
  const phoneOtpCodeError = document.getElementById("phoneOtpCodeError");
  const submitPhoneOtpBtn = document.getElementById("submitPhoneOtpBtn");

  // Elements: Google Login & Account Management
  const btnGoogleLogin = document.getElementById("btnGoogleLogin");
  const googleLoginBtnText = document.getElementById("googleLoginBtnText");
  const browserGoogleEmailDisplay = document.getElementById(
    "browserGoogleEmailDisplay",
  );
  const googleAccountStatus = document.getElementById("googleAccountStatus");
  const btnSwitchGoogleAccount = document.getElementById(
    "btnSwitchGoogleAccount",
  );

  // Elements: Google Modal
  const googleAuthModal = document.getElementById("googleAuthModal");
  const btnCloseGoogleModal = document.getElementById("btnCloseGoogleModal");
  const currentBrowserGoogleCard = document.getElementById(
    "currentBrowserGoogleCard",
  );
  const modalGoogleAvatar = document.getElementById("modalGoogleAvatar");
  const modalGoogleName = document.getElementById("modalGoogleName");
  const modalGoogleEmail = document.getElementById("modalGoogleEmail");
  const btnConfirmCurrentGoogle = document.getElementById(
    "btnConfirmCurrentGoogle",
  );
  const customGoogleEmail = document.getElementById("customGoogleEmail");
  const customGoogleName = document.getElementById("customGoogleName");
  const rememberCustomGoogle = document.getElementById("rememberCustomGoogle");
  const btnSubmitCustomGoogle = document.getElementById(
    "btnSubmitCustomGoogle",
  );

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
  const forgotConfirmPassword = document.getElementById(
    "forgotConfirmPassword",
  );
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
      const urlParam = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      if (urlParam) return decodeURIComponent(urlParam);
      const stored = sessionStorage.getItem("hv_redirect_after_login");
      if (stored) return stored;
    } catch (e) {}
    return null;
  }

  const initialRedirect = getRedirectTarget();

  // Đã đăng nhập rồi thì chuyển hướng về trang trước hoặc trang chủ
  if (typeof Auth !== "undefined" && Auth.current()) {
    if (initialRedirect) {
      sessionStorage.removeItem("hv_redirect_after_login");
      window.location.href = initialRedirect;
    } else {
      window.location.href = HOME_PAGE;
    }
    return;
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
  if (btnText) btnText.textContent = BTN_LABEL.buyer;
  roleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      roleBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      role = btn.dataset.role;
      if (btnText) btnText.textContent = BTN_LABEL[role];
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
    form
      .querySelectorAll(".has-error")
      .forEach((g) => g.classList.remove("has-error"));
    form
      .querySelectorAll(".is-invalid")
      .forEach((i) => i.classList.remove("is-invalid"));
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

    setTimeout(() => {
      submitBtn.disabled = false;
      submitIcon.classList.remove("spin");
      submitIcon.textContent = "lock_open";
      btnText.textContent = oldText;

      const res = Auth.login(idInput.value, pwd.value, role);
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

      const targetAfterLogin = getRedirectTarget();

      if (typeof showPopup === "function") {
        showPopup({
          type: "success",
          title: "Đăng nhập thành công!",
          message: "Chào mừng " + res.user.fullName + " quay lại.",
          confirmText: targetAfterLogin ? "Tiếp tục" : "Vào trang chủ",
          onConfirm: () => {
            if (targetAfterLogin) {
              sessionStorage.removeItem("hv_redirect_after_login");
              window.location.href = targetAfterLogin;
            } else {
              window.location.href = HOME_PAGE;
            }
          },
        });
      } else {
        window.location.href = targetAfterLogin || HOME_PAGE;
      }
    }, 600);
  });

  // =========================================================================
  // 3. ĐĂNG NHẬP BẰNG TÀI KHOẢN GOOGLE CỦA TỪNG THIẾT BỊ
  // =========================================================================
  const escapeSafeHtml = (str) =>
    typeof Utils !== "undefined" && Utils.escapeHtml
      ? Utils.escapeHtml(str)
      : String(str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

  function updateGoogleAccountUI() {
    if (
      typeof Auth === "undefined" ||
      typeof Auth.getBrowserGoogleAccount !== "function"
    )
      return;
    const browserAcc = Auth.getBrowserGoogleAccount();
    const googleHintRow = document.getElementById("googleHintRow");
    const currentCard = document.getElementById("currentBrowserGoogleCard");
    const orDivider = document.getElementById("googleOrDivider");
    const modalDesc = document.getElementById("googleModalDesc");

    if (browserAcc && browserAcc.email) {
      if (googleLoginBtnText) {
        googleLoginBtnText.innerHTML = `Tiếp tục với Google (<strong>${escapeSafeHtml(browserAcc.email)}</strong>)`;
      }
      if (googleHintRow) googleHintRow.style.display = "flex";
      if (currentCard) currentCard.style.display = "flex";
      if (orDivider) orDivider.style.display = "block";
      if (modalGoogleEmail) modalGoogleEmail.textContent = browserAcc.email;
      if (modalGoogleName)
        modalGoogleName.textContent =
          browserAcc.name || browserAcc.email.split("@")[0];
      if (modalGoogleAvatar)
        modalGoogleAvatar.textContent = browserAcc.avatar || "G";
      if (modalDesc) {
        modalDesc.innerHTML = `Tài khoản Google đang được lưu trên thiết bị này:`;
      }
    } else {
      if (googleLoginBtnText) {
        googleLoginBtnText.textContent = "Tiếp tục với tài khoản Google";
      }
      if (googleHintRow) googleHintRow.style.display = "none";
      if (currentCard) currentCard.style.display = "none";
      if (orDivider) orDivider.style.display = "none";
      if (modalDesc) {
        modalDesc.innerHTML = `Đăng nhập bằng tài khoản Google trên thiết bị này:`;
      }
    }
    if (customGoogleEmail && !customGoogleEmail.value) {
      customGoogleEmail.placeholder = browserAcc
        ? browserAcc.email
        : "ten-cua-ban@gmail.com";
    }
  }

  // Khởi tạo ngay trạng thái Google trên trình duyệt
  updateGoogleAccountUI();

  // Giải mã JWT credential từ Google Identity Services
  function decodeJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // Khởi tạo Google Identity Services (GIS) nếu có Google Client ID
  function initGoogleIdentityServices() {
    const clientId = localStorage.getItem("hv_google_client_id");
    if (
      clientId &&
      window.google &&
      window.google.accounts &&
      window.google.accounts.id
    ) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response && response.credential) {
              const payload = decodeJwt(response.credential);
              if (payload && payload.email) {
                const acc = {
                  email: payload.email,
                  name: payload.name || payload.email.split("@")[0],
                  avatar: payload.picture || "G",
                };
                Auth.setBrowserGoogleAccount(acc);
                updateGoogleAccountUI();
                const res = Auth.loginWithGoogle({ ...acc, role });
                handleGoogleLoginSuccess(res.user);
              }
            }
          },
          auto_select: true,
        });
        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn("Google One Tap notice:", e);
      }
    }
  }

  if (document.readyState === "complete") {
    initGoogleIdentityServices();
  } else {
    window.addEventListener("load", initGoogleIdentityServices);
  }

  function handleGoogleLoginSuccess(userSession) {
    hideModal(googleAuthModal);
    const targetAfterLogin = getRedirectTarget();

    if (typeof showPopup === "function") {
      showPopup({
        type: "success",
        title: "Đăng nhập Google thành công!",
        message:
          "Đã đồng bộ tài khoản Google trên thiết bị này: " +
          userSession.fullName +
          " (" +
          userSession.email +
          ")!",
        confirmText: targetAfterLogin ? "Tiếp tục" : "Vào trang chủ",
        onConfirm: () => {
          if (targetAfterLogin) {
            sessionStorage.removeItem("hv_redirect_after_login");
            window.location.href = targetAfterLogin;
          } else {
            window.location.href = HOME_PAGE;
          }
        },
      });
    } else {
      window.location.href = targetAfterLogin || HOME_PAGE;
    }
  }

  // Khi bấm nút "Tiếp tục với Google":
  // Nếu thiết bị đã có tài khoản -> Đăng nhập 1-chạm
  // Nếu thiết bị chưa có tài khoản -> Mở popup chọn/nhập tài khoản Google cho thiết bị đó
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener("click", () => {
      const browserAcc = Auth.getBrowserGoogleAccount();

      if (!browserAcc || !browserAcc.email) {
        updateGoogleAccountUI();
        showModal(googleAuthModal);
        if (customGoogleEmail) customGoogleEmail.focus();
        return;
      }

      // Đã có tài khoản trên thiết bị này -> Đăng nhập 1-chạm
      btnGoogleLogin.disabled = true;
      btnGoogleLogin.classList.add("loading");
      const originalHtml = btnGoogleLogin.innerHTML;
      btnGoogleLogin.innerHTML = `
        <span class="material-symbols-outlined icon-sm spin">sync</span>
        <span>Đang đăng nhập tài khoản thiết bị (<strong>${escapeSafeHtml(browserAcc.email)}</strong>)...</span>
      `;

      setTimeout(() => {
        btnGoogleLogin.disabled = false;
        btnGoogleLogin.classList.remove("loading");
        btnGoogleLogin.innerHTML = originalHtml;

        const res = Auth.loginWithGoogle({
          email: browserAcc.email,
          name: browserAcc.name,
          avatar: browserAcc.avatar,
          phone: browserAcc.phone,
          role: role,
        });

        if (res.ok) {
          handleGoogleLoginSuccess(res.user);
        } else {
          notify({
            type: "error",
            title: "Đăng nhập thất bại",
            message: res.error || "Không thể đồng bộ tài khoản Google.",
          });
        }
      }, 400);
    });
  }

  // Mở modal khi bấm "Đổi tài khoản khác"
  if (btnSwitchGoogleAccount) {
    btnSwitchGoogleAccount.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateGoogleAccountUI();
      showModal(googleAuthModal);
      if (customGoogleEmail) customGoogleEmail.focus();
    });
  }

  if (btnCloseGoogleModal) {
    btnCloseGoogleModal.addEventListener("click", () => {
      hideModal(googleAuthModal);
    });
  }

  // Trong modal: Bấm "Đăng nhập" với tài khoản hiện tại của thiết bị
  if (btnConfirmCurrentGoogle) {
    btnConfirmCurrentGoogle.addEventListener("click", () => {
      const browserAcc = Auth.getBrowserGoogleAccount();
      if (!browserAcc || !browserAcc.email) return;
      const res = Auth.loginWithGoogle({
        email: browserAcc.email,
        name: browserAcc.name,
        avatar: browserAcc.avatar,
        phone: browserAcc.phone,
        role: role,
      });
      if (res.ok) {
        handleGoogleLoginSuccess(res.user);
      }
    });
  }

  // Trong modal: Nút xóa tài khoản đã lưu khỏi thiết bị này
  const btnClearDeviceGoogle = document.getElementById("btnClearDeviceGoogle");
  if (btnClearDeviceGoogle) {
    btnClearDeviceGoogle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      Auth.clearBrowserGoogleAccount();
      updateGoogleAccountUI();
      notify({
        type: "info",
        title: "Đã xóa tài khoản",
        message: "Đã xóa tài khoản Google được ghi nhớ khỏi thiết bị này.",
      });
    });
  }

  // Trong modal: Đăng nhập & Lưu tài khoản Google trên thiết bị này
  if (btnSubmitCustomGoogle && customGoogleEmail) {
    const handleCustomGoogleSubmit = () => {
      const email = customGoogleEmail.value.trim().toLowerCase();
      if (!email || !email.includes("@") || !email.includes(".")) {
        notify({
          type: "warning",
          title: "Email không hợp lệ",
          message:
            "Vui lòng nhập địa chỉ Google Email hợp lệ (ví dụ: ten-cua-ban@gmail.com).",
        });
        customGoogleEmail.focus();
        return;
      }

      const inputName = customGoogleName ? customGoogleName.value.trim() : "";
      const derivedName =
        inputName ||
        email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const avatarInitials =
        derivedName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "G";

      const newGoogleAcc = {
        email: email,
        name: derivedName,
        avatar: avatarInitials,
        phone: "",
      };

      if (!rememberCustomGoogle || rememberCustomGoogle.checked) {
        Auth.setBrowserGoogleAccount(newGoogleAcc);
        updateGoogleAccountUI();
      }

      const res = Auth.loginWithGoogle({
        ...newGoogleAcc,
        role: role,
      });

      if (res.ok) {
        handleGoogleLoginSuccess(res.user);
      } else {
        notify({
          type: "error",
          title: "Đăng nhập thất bại",
          message: res.error || "Không thể đăng nhập tài khoản Google.",
        });
      }
    };

    btnSubmitCustomGoogle.addEventListener("click", handleCustomGoogleSubmit);
    customGoogleEmail.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCustomGoogleSubmit();
      }
    });
  }

  // =========================================================================
  // 4. ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI & SMS OTP
  // =========================================================================
  let phoneOtpCooldownTimer = null;

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
    btnSendPhoneOtp.addEventListener("click", () => {
      if (phoneInputError) phoneInputError.textContent = "";
      const phoneVal = otpPhoneNumber.value.trim();
      const res = Auth.sendPhoneOtp(phoneVal);

      if (!res.ok) {
        if (phoneInputError) phoneInputError.textContent = res.error;
        otpPhoneNumber.focus();
        return;
      }

      // Hiển thị mã OTP giả lập
      if (phoneOtpHintBox && phoneOtpDisplayCode) {
        phoneOtpHintBox.style.display = "flex";
        phoneOtpDisplayCode.textContent = res.otp;
      }

      notify({
        type: "success",
        title: "Mã OTP SMS Đã Gửi",
        message:
          "Mã xác thực gửi tới " +
          res.phone +
          ": <strong>" +
          res.otp +
          "</strong>",
      });

      startPhoneOtpCooldown(60);
      if (phoneOtpCode) phoneOtpCode.focus();
    });
  }

  if (phoneOtpLoginForm) {
    phoneOtpLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (phoneInputError) phoneInputError.textContent = "";
      if (phoneOtpCodeError) phoneOtpCodeError.textContent = "";

      const phoneVal = otpPhoneNumber ? otpPhoneNumber.value.trim() : "";
      const otpVal = phoneOtpCode ? phoneOtpCode.value.trim() : "";

      if (!phoneVal) {
        if (phoneInputError)
          phoneInputError.textContent = "Vui lòng nhập số điện thoại.";
        if (otpPhoneNumber) otpPhoneNumber.focus();
        return;
      }

      if (!otpVal) {
        if (phoneOtpCodeError)
          phoneOtpCodeError.textContent = "Vui lòng nhập mã OTP 6 số.";
        if (phoneOtpCode) phoneOtpCode.focus();
        return;
      }

      if (submitPhoneOtpBtn) submitPhoneOtpBtn.disabled = true;

      setTimeout(() => {
        if (submitPhoneOtpBtn) submitPhoneOtpBtn.disabled = false;
        const res = Auth.loginWithPhone(phoneVal, otpVal, role);

        if (!res.ok) {
          if (phoneOtpCodeError) phoneOtpCodeError.textContent = res.error;
          if (typeof showPopup === "function") {
            showPopup({
              type: "error",
              title: "Xác thực OTP thất bại",
              message: res.error,
              confirmText: "Thử lại",
            });
          }
          return;
        }

        const targetAfterLogin = getRedirectTarget();

        if (typeof showPopup === "function") {
          showPopup({
            type: "success",
            title: "Đăng nhập thành công!",
            message:
              "Xác thực SĐT " +
              res.user.phone +
              " thành công. Chào mừng " +
              res.user.fullName +
              "!",
            confirmText: targetAfterLogin ? "Tiếp tục" : "Vào trang chủ",
            onConfirm: () => {
              if (targetAfterLogin) {
                sessionStorage.removeItem("hv_redirect_after_login");
                window.location.href = targetAfterLogin;
              } else {
                window.location.href = HOME_PAGE;
              }
            },
          });
        } else {
          window.location.href = targetAfterLogin || HOME_PAGE;
        }
      }, 500);
    });
  }

  // =========================================================================
  // 5. QUÊN MẬT KHẨU (WIZARD 3 BƯỚC)
  // =========================================================================
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
  }

  if (linkForgotPassword) {
    linkForgotPassword.addEventListener("click", () => {
      // Khởi tạo wizard về Bước 1
      setForgotStep(1);
      if (forgotStep1Error) forgotStep1Error.textContent = "";
      if (forgotStep2Error) forgotStep2Error.textContent = "";
      if (forgotStep3Error) forgotStep3Error.textContent = "";

      // Điền sẵn nếu người dùng đã gõ email/SĐT ở form đăng nhập
      if (forgotIdentifier && idInput && idInput.value.trim()) {
        forgotIdentifier.value = idInput.value.trim();
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

  // BƯỚC 1: Gửi mã OTP khôi phục
  if (btnSendForgotOtp && forgotIdentifier) {
    btnSendForgotOtp.addEventListener("click", () => {
      if (forgotStep1Error) forgotStep1Error.textContent = "";
      const val = forgotIdentifier.value.trim();

      if (!val) {
        if (forgotStep1Error)
          forgotStep1Error.textContent =
            "Vui lòng nhập email hoặc số điện thoại đã đăng ký.";
        forgotIdentifier.focus();
        return;
      }

      const res = Auth.sendResetOtp(val);
      if (!res.ok) {
        if (forgotStep1Error) forgotStep1Error.textContent = res.error;
        return;
      }

      // Đã tạo OTP thành công -> chuyển sang Bước 2
      if (forgotOtpDisplayCode) forgotOtpDisplayCode.textContent = res.otp;
      notify({
        type: "success",
        title: "Mã OTP Khôi Phục",
        message: "Mã xác thực của bạn là: <strong>" + res.otp + "</strong>",
      });

      setForgotStep(2);
      if (forgotOtpCode) {
        forgotOtpCode.value = "";
        forgotOtpCode.focus();
      }
    });
  }

  // BƯỚC 2: Quay lại Bước 1
  if (btnBackToStep1) {
    btnBackToStep1.addEventListener("click", () => {
      setForgotStep(1);
      if (forgotIdentifier) forgotIdentifier.focus();
    });
  }

  // BƯỚC 2: Xác thực mã OTP
  if (btnVerifyForgotOtp && forgotOtpCode) {
    btnVerifyForgotOtp.addEventListener("click", () => {
      if (forgotStep2Error) forgotStep2Error.textContent = "";
      const code = forgotOtpCode.value.trim();

      if (!code || code.length !== 6) {
        if (forgotStep2Error)
          forgotStep2Error.textContent =
            "Vui lòng nhập đúng mã OTP gồm 6 chữ số.";
        forgotOtpCode.focus();
        return;
      }

      // Kiểm tra hợp lệ trước khi chuyển sang Bước 3
      const idVal = forgotIdentifier ? forgotIdentifier.value.trim() : "";
      const checkRes = Auth.verifyResetOtp(idVal, code);
      if (!checkRes.ok) {
        if (forgotStep2Error) forgotStep2Error.textContent = checkRes.error;
        forgotOtpCode.focus();
        return;
      }

      // Mã đúng -> Chuyển sang Bước 3 để nhập mật khẩu mới
      setForgotStep(3);
      if (forgotNewPassword) {
        forgotNewPassword.value = "";
        forgotNewPassword.focus();
      }
      if (forgotConfirmPassword) forgotConfirmPassword.value = "";
    });
  }

  // BƯỚC 3: Lưu mật khẩu mới & hoàn tất
  if (btnSubmitNewPassword && forgotNewPassword && forgotConfirmPassword) {
    btnSubmitNewPassword.addEventListener("click", () => {
      if (forgotStep3Error) forgotStep3Error.textContent = "";
      const p1 = forgotNewPassword.value;
      const p2 = forgotConfirmPassword.value;

      if (!p1 || p1.length < 6) {
        if (forgotStep3Error)
          forgotStep3Error.textContent =
            "Mật khẩu mới phải có tối thiểu 6 ký tự.";
        forgotNewPassword.focus();
        return;
      }

      if (p1 !== p2) {
        if (forgotStep3Error)
          forgotStep3Error.textContent = "Mật khẩu xác nhận không khớp.";
        forgotConfirmPassword.focus();
        return;
      }

      const idVal = forgotIdentifier ? forgotIdentifier.value.trim() : "";
      const otpVal = forgotOtpCode ? forgotOtpCode.value.trim() : "";

      const res = Auth.resetPassword(idVal, otpVal, p1);
      if (!res.ok) {
        if (forgotStep3Error) forgotStep3Error.textContent = res.error;
        return;
      }

      // Thành công -> đóng modal, điền vào form đăng nhập mật khẩu và thông báo
      hideModal(forgotPasswordModal);

      if (tabLoginPassword) tabLoginPassword.click();
      if (idInput) idInput.value = idVal;
      if (pwd) pwd.value = p1;

      if (typeof showPopup === "function") {
        showPopup({
          type: "success",
          title: "Đổi mật khẩu thành công!",
          message:
            "Mật khẩu tài khoản của bạn đã được cập nhật thành công. Thông tin đăng nhập đã được điền sẵn.",
          confirmText: "Đăng Nhập Ngay",
          onConfirm: () => {
            if (submitBtn) submitBtn.click();
          },
        });
      } else {
        notify({
          type: "success",
          title: "Thành công",
          message: "Mật khẩu đã được cập nhật thành công!",
        });
      }
    });
  }
})();
