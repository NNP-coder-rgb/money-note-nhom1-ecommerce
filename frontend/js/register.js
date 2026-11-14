// register.js — đăng ký 1 bước: kiểm tra dữ liệu -> lưu tài khoản -> popup -> chuyển sang login.html
(function () {
  const form = document.getElementById("registerForm");
  const pwd = document.getElementById("passwordInput");
  const meter = document.getElementById("strengthMeter");
  const strengthText = document.getElementById("strengthText");
  const LABELS = ["Chưa nhập", "Yếu", "Trung bình", "An toàn", "Rất mạnh"];

  // ----- Độ mạnh mật khẩu -----
  pwd.addEventListener("input", () => {
    const v = pwd.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (v.length > 0 && score === 0) score = 1;
    const level = v.length === 0 ? 0 : score;
    meter.dataset.level = level;
    strengthText.textContent = "Độ mạnh: " + LABELS[level];
  });

  // ----- Hiện / ẩn mật khẩu -----
  const toggleIcon = document.getElementById("passwordToggleIcon");
  document.getElementById("togglePasswordBtn").addEventListener("click", () => {
    const show = pwd.type === "password";
    pwd.type = show ? "text" : "password";
    toggleIcon.textContent = show ? "visibility_off" : "visibility";
  });

  // ----- Hiện lỗi dưới từng ô -----
  function setError(id, msg) {
    const el = document.getElementById(id);
    const group = el.closest(".form-group");
    group.classList.add("has-error");
    group.querySelector(".form-error").textContent = msg;
    if (el.classList.contains("input")) el.classList.add("is-invalid");
  }
  function clearErrors() {
    form
      .querySelectorAll(".has-error")
      .forEach((g) => g.classList.remove("has-error"));
    form
      .querySelectorAll(".is-invalid")
      .forEach((i) => i.classList.remove("is-invalid"));
  }

  // ----- Gửi form -----
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    const data = {
      role: form.querySelector('input[name="accountRole"]:checked').value,
      fullName: document.getElementById("fullNameInput").value,
      phone: document.getElementById("phoneInput").value,
      email: document.getElementById("emailInput").value,
      referral: document.getElementById("referralInput").value,
      password: pwd.value,
      categories: Array.from(
        form.querySelectorAll('input[name="category"]:checked'),
      ).map((c) => c.value),
    };
    const confirm = document.getElementById("confirmInput").value;

    let firstBad = null;
    function fail(id, msg) {
      setError(id, msg);
      if (!firstBad) firstBad = id;
    }

    if (data.fullName.trim().length < 2)
      fail("fullNameInput", "Vui lòng nhập họ và tên.");
    if (!/^(0|\+84)\d{9}$/.test(data.phone.replace(/\s|-|\./g, "")))
      fail("phoneInput", "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      fail("emailInput", "Email không hợp lệ.");
    if (data.password.length < 8)
      fail("passwordInput", "Mật khẩu cần tối thiểu 8 ký tự.");
    if (confirm !== data.password)
      fail("confirmInput", "Mật khẩu nhập lại không khớp.");
    if (!document.getElementById("termsCheck").checked)
      fail("termsCheck", "Bạn cần đồng ý điều khoản để tiếp tục.");

    if (firstBad) {
      document.getElementById(firstBad).focus();
      return;
    }

    const btn = document.getElementById("submitRegistrationBtn");
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<span class="material-symbols-outlined spin">sync</span><span>ĐANG TẠO TÀI KHOẢN...</span>';

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = original;

      const res = Auth.register(data);
      if (!res.ok) {
        setError(res.field, res.error);
        document.getElementById(res.field).focus();
        return;
      }

      // Gợi ý sẵn email ở trang đăng nhập
      sessionStorage.setItem("hv_prefill", data.email.trim());

      showPopup({
        type: "success",
        title: "Đăng ký thành công!",
        message:
          "Tài khoản của bạn đã được tạo. Hãy đăng nhập để vào trang chủ.",
        confirmText: "Đến trang đăng nhập",
        onConfirm: () => {
          window.location.href = "auth_login.html";
        },
      });
    }, 800);
  });
})();
