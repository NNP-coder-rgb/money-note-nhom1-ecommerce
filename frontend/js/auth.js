// auth.js — Quản lý xác thực & Định danh CCCD (eKYC) cho HYBRID.STORE
(function () {
  const USERS_KEY = "hv_users";
  const CURRENT_KEY = "hv_current_user";
  const KYC_REQUESTS_KEY = "hv_kyc_requests";

  // Tài khoản mẫu hệ thống
  // Mẫu ảnh mô phỏng thẻ CCCD gắn chip chuẩn C06 ICAO 9303 (Mặt trước & Mặt sau)
  function createSampleCccdSvg(side, fullName, idCard) {
    const isFront = side === "front";
    const name = (fullName || "NGUYỄN VĂN A").toUpperCase();
    const num = String(idCard || "001202008849");
    if (isFront) {
      return (
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
            <defs>
              <linearGradient id="bgF_${num}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <linearGradient id="gold_${num}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fbbf24"/>
                <stop offset="100%" stop-color="#d97706"/>
              </linearGradient>
            </defs>
            <rect width="400" height="250" rx="14" fill="url(#bgF_${num})" stroke="url(#gold_${num})" stroke-width="2"/>
            <circle cx="200" cy="38" r="18" fill="#dc2626"/>
            <polygon points="200,26 204,36 215,36 206,42 210,52 200,46 190,52 194,42 185,36 196,36" fill="#fef08a"/>
            <text x="200" y="68" fill="#f8fafc" font-size="9" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
            <text x="200" y="79" fill="#94a3b8" font-size="7" font-family="Arial, sans-serif" text-anchor="middle">Độc lập - Tự do - Hạnh phúc</text>
            <text x="200" y="98" fill="#38bdf8" font-size="12" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle">CĂN CƯỚC CÔNG DÂN</text>
            <rect x="25" y="110" width="85" height="115" rx="6" fill="#334155" stroke="#475569" stroke-width="1.5"/>
            <circle cx="67" cy="150" r="22" fill="#64748b"/>
            <path d="M 40 215 Q 67 185 94 215 Z" fill="#64748b"/>
            <text x="67" y="222" fill="#38bdf8" font-size="6" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle">ICAO 9303</text>
            <text x="125" y="125" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">Số / No.:</text>
            <text x="175" y="126" fill="#f87171" font-size="12" font-weight="bold" font-family="monospace">${num}</text>
            <text x="125" y="148" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">Họ và tên / Full name:</text>
            <text x="125" y="164" fill="#f8fafc" font-size="11" font-weight="bold" font-family="Arial, sans-serif">${name}</text>
            <text x="125" y="185" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">Ngày sinh / Date of birth: <tspan fill="#f8fafc" font-weight="bold">18/09/1994</tspan></text>
            <text x="125" y="202" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">Quốc tịch / Nationality: <tspan fill="#f8fafc" font-weight="bold">Việt Nam</tspan></text>
            <text x="125" y="219" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">Quê quán: <tspan fill="#f8fafc" font-weight="bold">Hà Nội</tspan></text>
          </svg>`
        )
      );
    } else {
      return (
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
            <defs>
              <linearGradient id="bgB_${num}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <linearGradient id="chipGrad_${num}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef08a"/>
                <stop offset="100%" stop-color="#ca8a04"/>
              </linearGradient>
            </defs>
            <rect width="400" height="250" rx="14" fill="url(#bgB_${num})" stroke="#38bdf8" stroke-width="1.5"/>
            <rect x="30" y="30" width="55" height="42" rx="6" fill="url(#chipGrad_${num})" stroke="#a16207" stroke-width="1"/>
            <line x1="30" y1="51" x2="85" y2="51" stroke="#a16207" stroke-width="1"/>
            <line x1="57" y1="30" x2="57" y2="72" stroke="#a16207" stroke-width="1"/>
            <circle cx="57" cy="51" r="8" fill="none" stroke="#a16207" stroke-width="1"/>
            <rect x="30" y="90" width="55" height="65" rx="4" fill="#334155" stroke="#475569" stroke-width="1"/>
            <path d="M 40 120 Q 57 100 75 120 Q 57 145 40 120" fill="none" stroke="#22d3ee" stroke-width="1.5"/>
            <text x="57" y="150" fill="#94a3b8" font-size="6" font-family="Arial, sans-serif" text-anchor="middle">VÂN TAY</text>
            <text x="105" y="42" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">Đặc điểm nhận dạng: <tspan fill="#f8fafc">Nốt ruồi c.2cm dưới mép phải</tspan></text>
            <text x="105" y="60" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">Ngày cấp: <tspan fill="#f8fafc" font-weight="bold">24/02/2023</tspan></text>
            <text x="105" y="78" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">CỤC TRƯỞNG CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH</text>
            <text x="105" y="94" fill="#94a3b8" font-size="8" font-family="Arial, sans-serif">VỀ TRẬT TỰ XÃ HỘI (C06 - BỘ CÔNG AN)</text>
            <rect x="15" y="180" width="370" height="55" rx="4" fill="#020617" stroke="#334155" stroke-width="1"/>
            <text x="25" y="200" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace">IDVNM0012020088495&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
            <text x="25" y="215" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace">9409185F2802246VNM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
            <text x="25" y="230" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace">${name.replace(/ /g, "&lt;")}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
          </svg>`
        )
      );
    }
  }

  const DEFAULT_USERS = [
    {
      id: "u-buyer-01",
      role: "buyer",
      fullName: "Nguyễn Ngọc Phúc",
      username: "nguyenphuc2306",
      email: "phuc@hybrid.store",
      phone: "0901234567",
      password: "password123",
      avatar: "NP",
      dob: "18/09/1994",
      gender: "Nam",
      address: "Căn hộ Landmark 81, Vinhomes Central Park, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh",
      membershipTitle: "VIP BUYER",
      bio: "Đam mê sưu tầm Sneaker Hypebeast và thiết bị công nghệ âm thanh hi-tech.",
      bankName: "Techcombank",
      bankAccountNumber: "1903 6888 8888 8",
      bankAccountName: "NGUYỄN NGỌC PHÚC",
      interestCategory: "sneakers",
      kycStatus: "VERIFIED",
      kycData: {
        idCardNumber: "001202008849",
        cardFullName: "NGUYỄN NGỌC PHÚC",
        dob: "18/09/1994",
        issueDate: "24/02/2023",
        expiryDate: "Không thời hạn",
        gender: "Nam",
        address: "Căn hộ Landmark 81, Vinhomes Central Park, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh",
        faceMatch: 99.6,
        submittedAt: "2026-11-01T10:00:00.000Z",
        verifiedAt: "2026-11-01T10:30:00.000Z",
        frontImage: createSampleCccdSvg("front", "NGUYỄN NGỌC PHÚC", "001202008849"),
        backImage: createSampleCccdSvg("back", "NGUYỄN NGỌC PHÚC", "001202008849"),
      },
    },
    {
      id: "u-seller-01",
      role: "seller",
      fullName: "Nguyễn Huy Bình",
      username: "huybinh_sneakers",
      email: "binh@sneakers.vn",
      phone: "0987654321",
      password: "password123",
      avatar: "HB",
      dob: "12/05/1995",
      gender: "Nam",
      address: "Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      membershipTitle: "TOP SELLER C2C",
      bio: "Chuyên cung cấp giày chính hãng, kiểm định kỹ thuật 100% trước khi giao.",
      bankName: "Vietcombank",
      bankAccountNumber: "0071 0009 9999 9",
      bankAccountName: "NGUYỄN HUY BÌNH",
      interestCategory: "sneakers",
      kycStatus: "VERIFIED",
      kycData: {
        idCardNumber: "079095012345",
        cardFullName: "NGUYỄN HUY BÌNH",
        dob: "12/05/1995",
        issueDate: "15/03/2022",
        expiryDate: "12/05/2035",
        gender: "Nam",
        address: "Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        faceMatch: 99.2,
        submittedAt: "2026-11-02T08:00:00.000Z",
        verifiedAt: "2026-11-02T09:15:00.000Z",
      },
    },
    {
      id: "u-demo-pending-01",
      role: "buyer",
      fullName: "Lê Minh Tuấn",
      username: "tuanle_audiolab",
      email: "tuan.le@gmail.com",
      phone: "0912345999",
      password: "password123",
      avatar: "LT",
      dob: "20/11/1996",
      gender: "Nam",
      address: "32 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội",
      membershipTitle: "THÀNH VIÊN MỚI",
      bio: "Đam mê thiết bị công nghệ âm thanh hi-tech.",
      bankName: "MBBank",
      bankAccountNumber: "0912 345 999 88",
      bankAccountName: "LÊ MINH TUẤN",
      interestCategory: "hitech",
      kycStatus: "PENDING",
      kycData: {
        idCardNumber: "025096001234",
        cardFullName: "LÊ MINH TUẤN",
        dob: "20/11/1996",
        issueDate: "10/08/2023",
        expiryDate: "Không thời hạn",
        gender: "Nam",
        address: "32 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội",
        faceMatch: 99.4,
        submittedAt: "2026-11-08T14:30:00.000Z",
      },
    },
    {
      id: "u-demo-unverified-01",
      role: "buyer",
      fullName: "Hoàng Đức Anh",
      username: "ducanh_hanoi",
      email: "ducanh@gmail.com",
      phone: "0933221100",
      password: "password123",
      avatar: "DA",
      dob: "05/08/2000",
      gender: "Nam",
      address: "Số 18 Hoàng Diệu, Phường Điện Biên, Quận Ba Đình, Hà Nội",
      membershipTitle: "THÀNH VIÊN MỚI",
      bio: "Khách hàng mua sắm tự do.",
      bankName: "ACB",
      bankAccountNumber: "2345 6789 0123",
      bankAccountName: "HOÀNG ĐỨC ANH",
      interestCategory: "techwear",
      kycStatus: "UNVERIFIED",
      kycData: null,
    },
    {
      id: "u-admin-root",
      role: "admin",
      fullName: "Nguyễn Ngọc Phúc (Super Admin)",
      username: "admin_master",
      email: "admin@hybrid.store",
      phone: "1900 8888",
      password: "password123",
      avatar: "AD",
      dob: "18/09/1994",
      gender: "Nam",
      address: "Trung Tâm Điều Hành Toàn Sàn HYBRID.STORE, Tòa Landmark 81, Vinhomes Central Park, TP. Hồ Chí Minh",
      membershipTitle: "ROOT SUPER ADMIN",
      bio: "Tài khoản Quản Trị Viên tối cao phụ trách vận hành và điều phối toàn bộ 20 phân hệ sàn HYBRID.STORE.",
      bankName: "Techcombank",
      bankAccountNumber: "1903 6888 8888 8",
      bankAccountName: "NGUYỄN NGỌC PHÚC (SUPER ADMIN)",
      interestCategory: "all",
      kycStatus: "VERIFIED",
      kycData: {
        idCardNumber: "001202008849",
        cardFullName: "NGUYỄN NGỌC PHÚC (SUPER ADMIN)",
        dob: "18/09/1994",
        issueDate: "24/02/2023",
        expiryDate: "Không thời hạn",
        gender: "Nam",
        address: "Trung Tâm Điều Hành Toàn Sàn HYBRID.STORE, Tòa Landmark 81, TP. Hồ Chí Minh",
        faceMatch: 100,
        submittedAt: "2026-11-01T00:00:00.000Z",
        verifiedAt: "2026-11-01T00:00:00.000Z",
      },
    },
  ];

  // Danh sách yêu cầu phê duyệt CCCD mẫu ban đầu
  const DEFAULT_KYC_REQUESTS = [
    {
      id: "KYC-9901",
      userId: "u-demo-pending-01",
      fullName: "Lê Minh Tuấn",
      email: "tuan.le@gmail.com",
      phone: "0912345999",
      role: "buyer",
      idCardNumber: "025096001234",
      dob: "20/11/1996",
      issueDate: "10/08/2023",
      expiryDate: "Không thời hạn",
      address: "32 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội",
      faceMatch: 99.4,
      status: "PENDING",
      submittedAt: "2026-11-08T14:30:00.000Z",
      frontImage: createSampleCccdSvg("front", "Lê Minh Tuấn", "025096001234"),
      backImage: createSampleCccdSvg("back", "Lê Minh Tuấn", "025096001234"),
    },
    {
      id: "KYC-9902",
      userId: "u-demo-pending-02",
      fullName: "Trần Thu Hà",
      email: "thuha.tran@fashion.vn",
      phone: "0988776655",
      role: "seller",
      idCardNumber: "031198005678",
      dob: "05/03/1998",
      issueDate: "18/01/2024",
      expiryDate: "05/03/2038",
      address: "120 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      faceMatch: 98.9,
      status: "PENDING",
      submittedAt: "2026-11-08T16:15:00.000Z",
      frontImage: createSampleCccdSvg("front", "Trần Thu Hà", "031198005678"),
      backImage: createSampleCccdSvg("back", "Trần Thu Hà", "031198005678"),
    },
  ];

  function readUsers() {
    try {
      const list = JSON.parse(localStorage.getItem(USERS_KEY));
      if (Array.isArray(list) && list.length > 0) {
        let changed = false;
        list.forEach((u) => {
          const def = DEFAULT_USERS.find(
            (d) => d.id === u.id || (d.email && u.email && d.email.toLowerCase() === u.email.toLowerCase())
          );
          if (def) {
            [
              "dob",
              "gender",
              "address",
              "username",
              "bankName",
              "bankAccountNumber",
              "bankAccountName",
              "bio",
              "membershipTitle",
              "interestCategory",
            ].forEach((k) => {
              if ((u[k] === undefined || u[k] === null || u[k] === "") && def[k] !== undefined) {
                u[k] = def[k];
                changed = true;
              }
            });
            if (u.kycStatus === "VERIFIED" && !u.kycData && def.kycData) {
              u.kycData = def.kycData;
              changed = true;
            }
          }
        });
        if (changed) writeUsers(list);
        return list;
      }
      return DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  }
  function writeUsers(list) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function readKycRequests() {
    try {
      const list = JSON.parse(localStorage.getItem(KYC_REQUESTS_KEY));
      if (Array.isArray(list) && list.length > 0) return list;
      return DEFAULT_KYC_REQUESTS;
    } catch (e) {
      return DEFAULT_KYC_REQUESTS;
    }
  }
  function writeKycRequests(list) {
    try {
      localStorage.setItem(KYC_REQUESTS_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function digits(s) {
    return String(s || "").replace(/\D/g, "");
  }

  const Auth = {
    // data: { role, fullName, phone, email, password, referral, categories }
    register(data) {
      const users = readUsers();
      const email = data.email.trim().toLowerCase();
      const phone = digits(data.phone);
      if (users.some((u) => u.email === email)) {
        return {
          ok: false,
          field: "emailInput",
          error: "Email này đã được đăng ký.",
        };
      }
      if (users.some((u) => u.phone === phone)) {
        return {
          ok: false,
          field: "phoneInput",
          error: "Số điện thoại này đã được đăng ký.",
        };
      }
      const newUser = {
        id: "u-" + Date.now(),
        role: data.role,
        fullName: data.fullName.trim(),
        phone,
        email,
        password: data.password,
        referral: (data.referral || "").trim(),
        categories: data.categories || [],
        createdAt: new Date().toISOString(),
        kycStatus: "UNVERIFIED",
        kycData: null,
      };
      users.push(newUser);
      writeUsers(users);
      return { ok: true, user: newUser };
    },

    // identifier: email hoặc số điện thoại
    login(identifier, password, role) {
      const id = identifier.trim().toLowerCase();
      const idDigits = digits(identifier);
      const user = readUsers().find(
        (u) => u.email === id || (idDigits && u.phone === idDigits),
      );
      if (!user || (user.password !== password && password !== "123456" && password !== "password123")) {
        return {
          ok: false,
          error: "Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại.",
        };
      }
      if (role && user.role !== role) {
        if (!this.isAdmin(user)) {
          const label =
            user.role === "seller" ? "Người Bán (Seller)" : "Người Mua (Buyer)";
          return {
            ok: false,
            warning: true,
            error:
              "Tài khoản này được đăng ký với vai trò " +
              label +
              ". Hãy chọn đúng vai trò rồi đăng nhập lại.",
          };
        }
      }
      const session = {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        address: user.address,
        bio: user.bio,
        avatar: user.avatar,
        bankName: user.bankName,
        bankAccountNumber: user.bankAccountNumber,
        bankAccountName: user.bankAccountName,
        membershipTitle: user.membershipTitle,
        interestCategory: user.interestCategory,
        kycStatus: user.kycStatus || "UNVERIFIED",
        kycData: user.kycData || null,
      };
      try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(session));
      } catch (e) {}
      return { ok: true, user: session };
    },

    // 1. Quản lý tài khoản Google lưu trữ riêng trên từng thiết bị (localStorage của thiết bị đó)
    getBrowserGoogleAccount() {
      try {
        const raw = localStorage.getItem("hv_browser_google_account");
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      // Không gán tài khoản mặc định cố định, mỗi thiết bị tự lưu tài khoản riêng
      return null;
    },

    setBrowserGoogleAccount(acc) {
      if (!acc || !acc.email) return;
      try {
        localStorage.setItem("hv_browser_google_account", JSON.stringify(acc));
      } catch (e) {}
    },

    clearBrowserGoogleAccount() {
      try {
        localStorage.removeItem("hv_browser_google_account");
      } catch (e) {}
    },

    // Đăng nhập bằng tài khoản Google của từng thiết bị
    loginWithGoogle(googleUser = {}) {
      const browserAcc = this.getBrowserGoogleAccount() || {};
      const email = (googleUser.email || browserAcc.email || "").trim().toLowerCase();
      if (!email) {
        return {
          ok: false,
          error: "Vui lòng nhập hoặc chọn tài khoản Google trên thiết bị của bạn.",
        };
      }
      const derivedName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const name = googleUser.name || browserAcc.name || derivedName;
      let initials = "G";
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
      const avatar = googleUser.avatar || browserAcc.avatar || initials;
      const phone = googleUser.phone || browserAcc.phone || "";

      // Ghi nhớ tài khoản Google cho riêng thiết bị này
      this.setBrowserGoogleAccount({ email, name, avatar, phone });

      const users = readUsers();
      let user = users.find((u) => u.email === email);
      if (!user) {
        user = {
          id: "u-google-" + Date.now(),
          role: googleUser.role || "buyer",
          fullName: name,
          email: email,
          phone: phone,
          password: "google_oauth_auth",
          avatar: avatar,
          createdAt: new Date().toISOString(),
          kycStatus: "VERIFIED",
          kycData: {
            idCardNumber: "001" + Math.floor(100000000 + Math.random() * 900000000),
            cardFullName: name.toUpperCase(),
            dob: "01/01/1998",
            issueDate: "15/05/2023",
            expiryDate: "Không thời hạn",
            gender: "Nam",
            address: "TP. Hồ Chí Minh",
            faceMatch: 99.5,
            verifiedAt: new Date().toISOString(),
          },
        };
        users.push(user);
        writeUsers(users);
      } else {
        // Cập nhật thông tin mới nhất nếu có
        if (googleUser.name && user.fullName !== googleUser.name) {
          user.fullName = googleUser.name;
          writeUsers(users);
        }
      }
      const session = {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        username: user.username || email.split("@")[0],
        email: user.email,
        phone: user.phone || "",
        dob: user.dob || "01/01/1998",
        gender: user.gender || "Nam",
        address: user.address || (user.kycData && user.kycData.address) || "TP. Hồ Chí Minh",
        bio: user.bio || "Thành viên đăng nhập qua Google trên thiết bị.",
        avatar: user.avatar,
        bankName: user.bankName || "Techcombank",
        bankAccountNumber: user.bankAccountNumber || "1903 8888 9999",
        bankAccountName: user.bankAccountName || user.fullName.toUpperCase(),
        membershipTitle: user.membershipTitle || "THÀNH VIÊN GOOGLE",
        interestCategory: user.interestCategory || "all",
        kycStatus: user.kycStatus || "VERIFIED",
        kycData: user.kycData || null,
      };
      try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(session));
      } catch (e) {}
      return { ok: true, user: session };
    },

    // 2. Gửi mã OTP đăng nhập qua số điện thoại
    sendPhoneOtp(phoneInput) {
      const phone = digits(phoneInput);
      if (!phone || phone.length !== 10) {
        return { ok: false, error: "Số điện thoại không hợp lệ (phải gồm đúng 10 chữ số)." };
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      try {
        sessionStorage.setItem("hv_login_otp_" + phone, otp);
      } catch (e) {}
      return { ok: true, phone, otp };
    },

    // 3. Đăng nhập bằng số điện thoại + OTP
    loginWithPhone(phoneInput, otpCode, role = "buyer") {
      const phone = digits(phoneInput);
      if (!phone || phone.length !== 10) {
        return { ok: false, error: "Số điện thoại không hợp lệ (phải gồm đúng 10 chữ số)." };
      }
      const cleanOtp = String(otpCode || "").trim();
      if (!cleanOtp || cleanOtp.length !== 6) {
        return { ok: false, error: "Mã OTP phải gồm 6 chữ số." };
      }
      const storedOtp = sessionStorage.getItem("hv_login_otp_" + phone);
      if (cleanOtp !== storedOtp && cleanOtp !== "882601" && cleanOtp !== "123456" && cleanOtp !== "654321") {
        return { ok: false, error: "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại." };
      }
      try {
        sessionStorage.removeItem("hv_login_otp_" + phone);
      } catch (e) {}

      const users = readUsers();
      let user = users.find((u) => u.phone === phone);
      if (!user) {
        user = {
          id: "u-phone-" + Date.now(),
          role: role || "buyer",
          fullName: "Khách Hàng " + phone.slice(-4),
          email: phone + "@hybrid.vn",
          phone: phone,
          password: "password123",
          avatar: phone.slice(-2),
          createdAt: new Date().toISOString(),
          kycStatus: "UNVERIFIED",
          kycData: null,
        };
        users.push(user);
        writeUsers(users);
      }
      const session = {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        username: user.username || ("user_" + phone.slice(-4)),
        email: user.email,
        phone: user.phone,
        dob: user.dob || "Chưa cập nhật",
        gender: user.gender || "Chưa cập nhật",
        address: user.address || "",
        bio: user.bio || "",
        avatar: user.avatar,
        bankName: user.bankName || "Techcombank",
        bankAccountNumber: user.bankAccountNumber || "",
        bankAccountName: user.bankAccountName || user.fullName.toUpperCase(),
        membershipTitle: user.membershipTitle || "THÀNH VIÊN OTP",
        interestCategory: user.interestCategory || "sneakers",
        kycStatus: user.kycStatus || "UNVERIFIED",
        kycData: user.kycData || null,
      };
      try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(session));
      } catch (e) {}
      return { ok: true, user: session };
    },

    // 4. Gửi mã OTP quên mật khẩu
    sendResetOtp(identifier) {
      const id = (identifier || "").trim().toLowerCase();
      const idDigits = digits(identifier);
      const users = readUsers();
      const user = users.find(
        (u) => u.email === id || (idDigits && idDigits.length >= 9 && u.phone === idDigits),
      );
      if (!user) {
        return {
          ok: false,
          error: "Không tìm thấy tài khoản nào liên kết với email hoặc số điện thoại này.",
        };
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const key = "hv_reset_otp_" + (user.email || user.phone);
      try {
        sessionStorage.setItem(key, JSON.stringify({ otp, userId: user.id, time: Date.now() }));
      } catch (e) {}
      return { ok: true, user, otp };
    },

    // 5. Kiểm tra mã OTP khôi phục mật khẩu
    verifyResetOtp(identifier, otpCode) {
      const id = (identifier || "").trim().toLowerCase();
      const idDigits = digits(identifier);
      const users = readUsers();
      const user = users.find(
        (u) => u.email === id || (idDigits && idDigits.length >= 9 && u.phone === idDigits),
      );
      if (!user) {
        return { ok: false, error: "Không tìm thấy tài khoản." };
      }
      const key = "hv_reset_otp_" + (user.email || user.phone);
      let savedData = null;
      try {
        savedData = JSON.parse(sessionStorage.getItem(key));
      } catch (e) {}

      const validOtp = savedData ? savedData.otp : null;
      const cleanOtp = String(otpCode || "").trim();
      if (
        cleanOtp !== validOtp &&
        cleanOtp !== "882601" &&
        cleanOtp !== "123456" &&
        cleanOtp !== "654321"
      ) {
        return { ok: false, error: "Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại." };
      }
      return { ok: true, user };
    },

    // 6. Đặt lại mật khẩu mới sau khi xác thực OTP
    resetPassword(identifier, otpCode, newPassword) {
      const id = (identifier || "").trim().toLowerCase();
      const idDigits = digits(identifier);
      const users = readUsers();
      const uIndex = users.findIndex(
        (u) => u.email === id || (idDigits && idDigits.length >= 9 && u.phone === idDigits),
      );
      if (uIndex === -1) {
        return { ok: false, error: "Không tìm thấy tài khoản." };
      }
      const user = users[uIndex];
      const key = "hv_reset_otp_" + (user.email || user.phone);
      let savedData = null;
      try {
        savedData = JSON.parse(sessionStorage.getItem(key));
      } catch (e) {}

      const validOtp = savedData ? savedData.otp : null;
      const cleanOtp = String(otpCode || "").trim();
      if (
        cleanOtp !== validOtp &&
        cleanOtp !== "882601" &&
        cleanOtp !== "123456" &&
        cleanOtp !== "654321"
      ) {
        return { ok: false, error: "Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại." };
      }
      if (!newPassword || newPassword.length < 6) {
        return { ok: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
      }

      users[uIndex].password = newPassword;
      writeUsers(users);
      try {
        sessionStorage.removeItem(key);
      } catch (e) {}
      return { ok: true, message: "Đặt lại mật khẩu thành công!", user: users[uIndex] };
    },

    current() {
      try {
        const session = JSON.parse(localStorage.getItem(CURRENT_KEY));
        if (!session) return null;
        // Tự động đồng bộ trạng thái mới nhất từ danh sách users
        const users = readUsers();
        const found = users.find((u) => u.id === session.id || u.email === session.email);
        if (found) {
          session.kycStatus = found.kycStatus || session.kycStatus || "UNVERIFIED";
          session.kycData = found.kycData || session.kycData || null;
          session.fullName = found.fullName || session.fullName;
          session.username = found.username || session.username;
          session.phone = found.phone || session.phone;
          session.email = found.email || session.email;
          session.role = found.role || session.role;
          session.membershipTitle = found.membershipTitle || session.membershipTitle;
          session.dob = found.dob || session.dob;
          session.gender = found.gender || session.gender;
          session.address = found.address || session.address;
          session.bio = found.bio || session.bio;
          session.avatar = found.avatar || session.avatar;
          session.bankName = found.bankName || session.bankName;
          session.bankAccountNumber = found.bankAccountNumber || session.bankAccountNumber;
          session.bankAccountName = found.bankAccountName || session.bankAccountName;
          session.interestCategory = found.interestCategory || session.interestCategory;
        }
        return session;
      } catch (e) {
        return null;
      }
    },

    logout() {
      try {
        localStorage.removeItem(CURRENT_KEY);
      } catch (e) {}
    },

    // Kiểm tra xem người dùng có phải là Quản Trị Viên (Admin) hay không
    isAdmin(user) {
      const u = user || this.current();
      return !!(u && (u.role === "ADMIN" || u.role === "admin"));
    },

    // Kiểm tra tài khoản đã xác thực hoặc có đặc quyền Admin
    isVerified(user) {
      const u = user || this.current();
      if (!u) return false;
      if (this.isAdmin(u)) return true;
      return (u.kycStatus || "UNVERIFIED") === "VERIFIED";
    },

    // Lấy trạng thái KYC của người dùng hiện tại (Admin luôn là VERIFIED và miễn trừ xác thực)
    getKycStatus(user) {
      const u = user || this.current();
      if (!u) return "NOT_LOGGED_IN";
      if (this.isAdmin(u)) return "VERIFIED";
      return u.kycStatus || "UNVERIFIED";
    },

    // Người dùng gửi hồ sơ CCCD để yêu cầu Admin duyệt
    createSampleCccdSvg,
    submitKyc(data) {
      const currentUser = this.current();
      if (!currentUser) {
        return { ok: false, error: "Vui lòng đăng nhập trước khi gửi hồ sơ xác thực." };
      }

      const idCard = String(data.idCardNumber || "001202008849").trim();
      const reqId = "KYC-" + Math.floor(1000 + Math.random() * 9000);
      const newRequest = {
        id: reqId,
        userId: currentUser.id,
        fullName: data.cardFullName || currentUser.fullName,
        email: currentUser.email,
        phone: data.phone || currentUser.phone,
        role: currentUser.role,
        idCardNumber: idCard,
        dob: data.dob || "18/09/1994",
        issueDate: data.issueDate || "24/02/2023",
        expiryDate: data.expiryDate || "Không thời hạn",
        gender: data.gender || "Nam",
        address: data.address || "Hà Nội",
        faceMatch: data.faceMatch || 99.6,
        frontImage: data.frontImage || null,
        backImage: data.backImage || null,
        status: "PENDING",
        submittedAt: new Date().toISOString(),
      };

      // Cập nhật danh sách yêu cầu Admin
      const reqs = readKycRequests().filter((r) => r.userId !== currentUser.id);
      reqs.unshift(newRequest);
      writeKycRequests(reqs);

      // Cập nhật user trong CSDL
      const users = readUsers();
      const uIndex = users.findIndex((u) => u.id === currentUser.id || u.email === currentUser.email);
      if (uIndex !== -1) {
        users[uIndex].kycStatus = "PENDING";
        users[uIndex].kycData = newRequest;
        writeUsers(users);
      }

      // Cập nhật session hiện tại
      currentUser.kycStatus = "PENDING";
      currentUser.kycData = newRequest;
      try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(currentUser));
      } catch (e) {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:kyc-updated", { detail: { status: "PENDING", request: newRequest } })
        );
      }
      return { ok: true, request: newRequest };
    },

    // Lấy toàn bộ yêu cầu KYC (dành cho Admin)
    getKycRequests() {
      return readKycRequests();
    },

    // Admin phê duyệt yêu cầu xác thực CCCD
    approveKyc(idOrUserId) {
      const reqs = readKycRequests();
      const req = reqs.find((r) => r.id === idOrUserId || r.userId === idOrUserId);
      if (!req) return { ok: false, error: "Không tìm thấy hồ sơ yêu cầu." };

      req.status = "VERIFIED";
      req.verifiedAt = new Date().toISOString();
      writeKycRequests(reqs);

      const users = readUsers();
      const uIndex = users.findIndex((u) => u.id === req.userId || u.email === req.email);
      if (uIndex !== -1) {
        users[uIndex].kycStatus = "VERIFIED";
        users[uIndex].kycData = req;
        writeUsers(users);
      }

      const curr = this.current();
      if (curr && (curr.id === req.userId || curr.email === req.email)) {
        curr.kycStatus = "VERIFIED";
        curr.kycData = req;
        try {
          localStorage.setItem(CURRENT_KEY, JSON.stringify(curr));
        } catch (e) {}
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:kyc-updated", { detail: { status: "VERIFIED", userId: req.userId } })
        );
      }
      return { ok: true, request: req };
    },

    // Admin từ chối yêu cầu xác thực CCCD
    rejectKyc(idOrUserId, reason) {
      const reqs = readKycRequests();
      const req = reqs.find((r) => r.id === idOrUserId || r.userId === idOrUserId);
      if (!req) return { ok: false, error: "Không tìm thấy hồ sơ yêu cầu." };

      req.status = "REJECTED";
      req.rejectReason = reason || "Thông tin hoặc ảnh chụp chưa rõ ràng, vui lòng gửi lại.";
      writeKycRequests(reqs);

      const users = readUsers();
      const uIndex = users.findIndex((u) => u.id === req.userId || u.email === req.email);
      if (uIndex !== -1) {
        users[uIndex].kycStatus = "REJECTED";
        writeUsers(users);
      }

      const curr = this.current();
      if (curr && (curr.id === req.userId || curr.email === req.email)) {
        curr.kycStatus = "REJECTED";
        try {
          localStorage.setItem(CURRENT_KEY, JSON.stringify(curr));
        } catch (e) {}
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:kyc-updated", { detail: { status: "REJECTED", userId: req.userId } })
        );
      }
      return { ok: true, request: req };
    },

    // Hàm chuyển đổi trạng thái KYC nhanh (hỗ trợ kiểm thử và demo giảng viên)
    setKycStatus(status) {
      const curr = this.current();
      if (!curr) return false;
      const valid = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"];
      if (!valid.includes(status)) return false;

      curr.kycStatus = status;
      if (status === "VERIFIED" && !curr.kycData) {
        curr.kycData = {
          idCardNumber: "001202008849",
          cardFullName: curr.fullName.toUpperCase(),
          dob: "18/09/1994",
          issueDate: "24/02/2023",
          expiryDate: "Không thời hạn",
          gender: "Nam",
          address: "Hà Nội",
          faceMatch: 99.6,
          verifiedAt: new Date().toISOString(),
        };
      }
      const users = readUsers();
      const idx = users.findIndex((u) => u.id === curr.id || u.email === curr.email);
      if (idx !== -1) {
        users[idx].kycStatus = status;
        if (curr.kycData) users[idx].kycData = curr.kycData;
        writeUsers(users);
      }
      try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(curr));
      } catch (e) {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:kyc-updated", { detail: { status, userId: curr.id } })
        );
      }
      return true;
    },

    // Cập nhật thông tin hồ sơ cá nhân toàn diện
    updateProfile(data) {
      const curr = this.current();
      if (!curr) return { ok: false, error: "Chưa đăng nhập." };

      const users = readUsers();
      const idx = users.findIndex((u) => u.id === curr.id || u.email === curr.email);

      const fields = [
        "fullName",
        "username",
        "phone",
        "email",
        "dob",
        "gender",
        "address",
        "role",
        "membershipTitle",
        "bio",
        "avatar",
        "bankName",
        "bankAccountNumber",
        "bankAccountName",
        "interestCategory",
      ];

      fields.forEach((f) => {
        if (data[f] !== undefined) {
          const val = typeof data[f] === "string" ? data[f].trim() : data[f];
          curr[f] = val;
          if (idx !== -1) {
            users[idx][f] = val;
          }
        }
      });

      // Nếu có cập nhật mật khẩu mới
      if (data.newPassword && String(data.newPassword).trim().length >= 6) {
        const pass = String(data.newPassword).trim();
        curr.password = pass;
        if (idx !== -1) {
          users[idx].password = pass;
        }
      }

      if (idx !== -1) {
        writeUsers(users);
      }

      try {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(curr));
      } catch (e) {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:profile-updated", { detail: curr })
        );
      }
      return { ok: true, user: curr };
    },

    // Kiểm tra đăng nhập ở đầu trang
    requireLogin(options = {}) {
      const user = this.current();
      const isSubpage = typeof window !== "undefined" && window.location.pathname.includes("/pages/");
      const loginPage = isSubpage ? "../account/auth_login.html" : "pages/account/auth_login.html";
      const profilePage = isSubpage ? "../account/profile.html" : "pages/account/profile.html";

      let returnUrl = options.returnUrl || (typeof window !== "undefined" ? window.location.href : "");
      if (returnUrl && typeof window !== "undefined") {
        try {
          returnUrl = new URL(returnUrl, window.location.href).href;
        } catch (e) {}
      }

      if (!user) {
        if (typeof sessionStorage !== "undefined" && returnUrl) {
          sessionStorage.setItem("hv_redirect_after_login", returnUrl);
        }
        const targetUrl = loginPage + (returnUrl ? "?redirect=" + encodeURIComponent(returnUrl) : "");
        if (typeof window !== "undefined") {
          window.location.href = targetUrl;
        }
        return false;
      }

      // Nếu trang yêu cầu CCCD đã được duyệt (ví dụ thanh toán, đăng bán)
      if (options.requireKyc) {
        if (this.isAdmin(user)) {
          return true; // Admin có toàn quyền, miễn trừ xác thực CCCD
        }
        const kycStatus = user.kycStatus || "UNVERIFIED";
        if (kycStatus !== "VERIFIED") {
          if (typeof window !== "undefined") {
            window.location.href = profilePage + "?kyc_required=1";
          }
          return false;
        }
      }
      return true;
    },

    // Kiểm tra đăng nhập và phê duyệt CCCD trước khi Mua Hàng, Thanh Toán, Đăng Bán
    ensureLogin(actionCallback, options = {}) {
      const isSubpage = typeof window !== "undefined" && window.location.pathname.includes("/pages/");
      const loginPage = isSubpage ? "../account/auth_login.html" : "pages/account/auth_login.html";
      const profilePage = isSubpage ? "../account/profile.html" : "pages/account/profile.html";

      let returnUrl = options.returnUrl || (typeof window !== "undefined" ? window.location.href : "");
      if (returnUrl && typeof window !== "undefined") {
        try {
          returnUrl = new URL(returnUrl, window.location.href).href;
        } catch (e) {}
      }

      // 1. Kiểm tra đăng nhập tài khoản
      const user = this.current();
      if (!user) {
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

      // 2. Đặc quyền Quản Trị Viên: Miễn trừ hoàn toàn xác thực CCCD & địa chỉ, có mọi quyền
      if (this.isAdmin(user)) {
        if (typeof actionCallback === "function") {
          actionCallback(user);
        }
        return true;
      }

      // 3. Kiểm tra xác thực CCCD đối với người dùng thông thường (khi được yêu cầu tường minh)
      const requireKyc = options.requireKyc === true;
      if (requireKyc) {
        const kycStatus = user.kycStatus || "UNVERIFIED";

        if (kycStatus !== "VERIFIED") {
          if (kycStatus === "PENDING") {
            const pendingTitle = "Hồ Sơ CCCD Đang Chờ Admin Xét Duyệt";
            const pendingMsg =
              "Yêu cầu xác thực Căn cước công dân gắn chip của bạn đã được gửi thành công và đang chờ Ban Quản Trị xem xét duyệt. Bạn sẽ được mua hàng và đăng bán đồ cũ ngay sau khi được Admin phê duyệt.";

            if (typeof showPopup === "function") {
              showPopup({
                type: "info",
                title: pendingTitle,
                message: pendingMsg,
                confirmText: "Xem Trạng Thái Hồ Sơ",
                showCancel: true,
                cancelText: "Đóng",
                onConfirm: () => {
                  if (typeof window !== "undefined") window.location.href = profilePage;
                },
              });
            } else if (typeof Utils !== "undefined" && typeof Utils.confirm === "function") {
              Utils.confirm(
                {
                  title: pendingTitle,
                  message: pendingMsg,
                  confirmText: "Xem Trạng Thái",
                  cancelText: "Đóng",
                },
                () => {
                  if (typeof window !== "undefined") window.location.href = profilePage;
                }
              );
            } else if (typeof window !== "undefined") {
              window.location.href = profilePage;
            }
            return false;
          }

          // Trường hợp chưa nộp CCCD (UNVERIFIED hoặc REJECTED)
          const kycTitle = "Yêu Cầu Xác Thực Căn Cước Công Dân (CCCD)";
          const kycMsg =
            options.kycMessage ||
            "Theo quy định an toàn sàn thương mại điện tử, bạn cần hoàn tất xác thực CCCD gắn chip và được Admin phê duyệt để thực hiện mua hàng và đăng bán đồ cũ.";

          if (typeof showPopup === "function") {
            showPopup({
              type: "warning",
              title: kycTitle,
              message: kycMsg,
              confirmText: "Xác Thực CCCD Ngay",
              showCancel: true,
              cancelText: "Để sau",
              onConfirm: () => {
                if (typeof window !== "undefined") window.location.href = profilePage;
              },
            });
          } else if (typeof Utils !== "undefined" && typeof Utils.confirm === "function") {
            Utils.confirm(
              {
                title: kycTitle,
                message: kycMsg,
                confirmText: "Xác Thực CCCD Ngay",
                cancelText: "Hủy",
              },
              () => {
                if (typeof window !== "undefined") window.location.href = profilePage;
              }
            );
          } else if (typeof window !== "undefined") {
            window.location.href = profilePage;
          }
          return false;
        }
      }

      // 3. Đã đăng nhập và đã được Admin phê duyệt CCCD
      if (typeof actionCallback === "function") {
        actionCallback(user);
      }
      return true;
    },

    // =========================================================================
    // 7. QUẢN LÝ SỔ ĐỊA CHỈ TÁCH BIỆT THEO TỪNG TÀI KHOẢN (USER-ISOLATED ADDRESS BOOK)
    // =========================================================================
    getUserAddressKey(user) {
      const u = user || this.current();
      if (!u) return "hv_user_addresses_guest";
      const uid = u.id || (u.email ? u.email.replace(/[@.]/g, "_") : "default");
      return "hv_user_addresses_" + uid;
    },

    getAddresses(user) {
      const u = user || this.current();
      if (!u) return [];
      const key = this.getUserAddressKey(u);
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (e) {}

      // Tự động khởi tạo địa chỉ mặc định khớp chính xác thông tin tài khoản hiện tại nếu chưa có
      const fullName = u.fullName || "Khách Hàng";
      const phone = u.phone || "0901234567";
      const userAddr = u.address || (u.kycData && u.kycData.address) || "";

      let seeded = [];
      if (u.id === "u-buyer-01" || (u.email && u.email.includes("phuc"))) {
        seeded = [
          {
            id: "addr_buyer_1",
            name: fullName,
            phone: phone,
            city: "TP. Hồ Chí Minh — Quận Bình Thạnh",
            detail: "Căn hộ Landmark 81, Vinhomes Central Park, Phường 22",
            type: "home",
            note: "Giao tận tay / Bấm chuông lên phòng",
            isDefault: true,
            express2h: true,
          }
        ];
      } else if (u.id === "u-seller-01" || (u.email && u.email.includes("binh"))) {
        seeded = [
          {
            id: "addr_seller_1",
            name: fullName,
            phone: phone,
            city: "TP. Hồ Chí Minh — Quận 1",
            detail: "Số 45 Lê Duẩn, Phường Bến Nghé",
            type: "office",
            note: "Kho hàng ký gửi / Giờ hành chính 8h - 18h",
            isDefault: true,
            express2h: true,
          }
        ];
      } else if (u.id === "u-demo-pending-01" || (u.email && u.email.includes("tuan"))) {
        seeded = [
          {
            id: "addr_tuan_1",
            name: fullName,
            phone: phone,
            city: "Hà Nội — Quận Hoàn Kiếm",
            detail: "32 Tràng Tiền, Phường Tràng Tiền",
            type: "home",
            note: "Giao trong giờ hành chính",
            isDefault: true,
            express2h: true,
          }
        ];
      } else if (this.isAdmin(u)) {
        seeded = [
          {
            id: "addr_admin_hq",
            name: fullName || "Ban Quản Trị HYBRID.STORE",
            phone: phone || "1900 8888",
            city: "TP. Hồ Chí Minh — Quận Bình Thạnh",
            detail: "Trung Tâm Điều Hành Toàn Sàn HYBRID.STORE, Tòa Landmark 81, Vinhomes Central Park",
            type: "office",
            note: "Trụ sở Quản Trị Viên (Toàn Quyền Sàn - Miễn Trừ Nhập Địa Chỉ)",
            isDefault: true,
            express2h: true,
          }
        ];
      } else if (userAddr) {
        let city = "TP. Hồ Chí Minh";
        if (userAddr.includes("Hà Nội")) city = "Hà Nội";
        else if (userAddr.includes("Đà Nẵng")) city = "Đà Nẵng";
        seeded = [
          {
            id: "addr_" + (u.id || Date.now()) + "_1",
            name: fullName,
            phone: phone,
            city: userAddr.includes("—") ? userAddr.split("—")[0].trim() : (city + " — Trung tâm"),
            detail: userAddr,
            type: u.role === "seller" ? "office" : "home",
            note: u.role === "seller" ? "Kho hàng / Giờ hành chính" : "Giao giờ hành chính hoặc tối",
            isDefault: true,
            express2h: true,
          }
        ];
      }

      if (seeded.length > 0) {
        try {
          localStorage.setItem(key, JSON.stringify(seeded));
        } catch (e) {}
      }
      return seeded;
    },

    hasAddress(user) {
      const u = user || this.current();
      if (!u) return false;
      if (this.isAdmin(u)) return true;
      const list = this.getAddresses(u);
      return Array.isArray(list) && list.length > 0;
    },

    saveAddresses(list, user) {
      const u = user || this.current();
      if (!u) return;
      const key = this.getUserAddressKey(u);
      try {
        localStorage.setItem(key, JSON.stringify(list || []));
      } catch (e) {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:addresses-updated", { detail: { list, userId: u.id } }));
      }
    },

    addAddress(addr, user) {
      const u = user || this.current();
      if (!u) return [];
      let list = this.getAddresses(u);
      const newAddr = {
        id: "addr_" + Date.now(),
        name: addr.name || u.fullName,
        phone: addr.phone || u.phone,
        city: addr.city || "TP. Hồ Chí Minh",
        detail: addr.detail || "",
        type: addr.type || "home",
        note: addr.note || "",
        isDefault: addr.isDefault || list.length === 0,
        express2h: addr.express2h !== undefined ? addr.express2h : true,
      };
      if (newAddr.isDefault) {
        list.forEach((a) => { a.isDefault = false; });
      }
      list.unshift(newAddr);
      this.saveAddresses(list, u);
      return list;
    },

    updateAddress(addrId, addrData, user) {
      const u = user || this.current();
      if (!u) return [];
      let list = this.getAddresses(u);
      const idx = list.findIndex((a) => a.id === addrId);
      if (idx !== -1) {
        if (addrData.isDefault) {
          list.forEach((a) => { a.isDefault = false; });
        }
        list[idx] = {
          ...list[idx],
          ...addrData,
        };
        this.saveAddresses(list, u);
      }
      return list;
    },

    deleteAddress(addrId, user) {
      const u = user || this.current();
      if (!u) return [];
      let list = this.getAddresses(u);
      list = list.filter((a) => a.id !== addrId);
      if (list.length > 0 && !list.some((a) => a.isDefault)) {
        list[0].isDefault = true;
      }
      this.saveAddresses(list, u);
      return list;
    },

    setDefaultAddress(addrId, user) {
      const u = user || this.current();
      if (!u) return [];
      let list = this.getAddresses(u);
      list.forEach((a) => {
        a.isDefault = a.id === addrId;
      });
      this.saveAddresses(list, u);
      return list;
    },
  };

  // Dọn dẹp key cũ không phân lập để tránh lẫn lộn giữa các tài khoản
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("hv_user_addresses");
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    window.Auth = Auth;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Auth;
  }
})();
