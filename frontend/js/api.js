/**
 * api.js — Bộ Kết Nối Toàn Diện Giữa Frontend và FastAPI Backend (RESTful API Client)
 * Tự động đồng bộ dữ liệu giữa trình duyệt và Cơ sở dữ liệu 23 bảng của máy chủ.
 */

(function (global) {
  "use strict";

  // Tự động nhận diện URL Backend thông minh (Hỗ trợ cấu hình tùy biến, Live Server mọi cổng, file protocol, Uvicorn, và Cloud Render)
  let API_BASE = "/api/v1";
  if (typeof window !== "undefined") {
    if (window.API_BASE) {
      API_BASE = window.API_BASE;
    } else if (window.__API_BASE__) {
      API_BASE = window.__API_BASE__;
    } else {
      const isFileProto = window.location.protocol === "file:";
      const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isFileProto || (isLocalHost && window.location.port !== "8000")) {
        const defaultPort = window.BACKEND_PORT || "8000";
        API_BASE = `http://127.0.0.1:${defaultPort}/api/v1`;
      }
    }
  }

  const TOKEN_KEY = "hybrid_access_token";

  /**
   * Hàm gọi fetch có bọc xử lý Token, JSON, và Báo lỗi chuẩn
   */
  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    // Gắn Bearer Token nếu có trong localStorage
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem("hv_access_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const isJson = (response.headers.get("content-type") || "").includes("application/json");
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        let errorMsg = `Lỗi HTTP ${response.status}`;
        if (data) {
          if (typeof data.detail === "string") {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map((e) => (e && e.msg) || (typeof e === "string" ? e : JSON.stringify(e))).join("; ");
          } else if (typeof data.message === "string") {
            errorMsg = data.message;
          } else if (typeof data.detail === "object" && data.detail !== null) {
            errorMsg = JSON.stringify(data.detail);
          }
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.warn(`[API] Yêu cầu ${options.method || "GET"} ${endpoint} thất bại:`, err.message);
      throw err;
    }
  }

  // ==============================================================
  // 1. PHÂN HỆ XÁC THỰC & NGƯỜI DÙNG (AUTH & USER)
  // ==============================================================
  const AuthAPI = {
    async login(usernameOrPhone, password) {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username_or_phone: usernameOrPhone, password })
      });
      if (res.data && res.data.access_token) {
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
        localStorage.setItem("hv_access_token", res.data.access_token);
        localStorage.setItem("hv_current_user", JSON.stringify(res.data.user));
        localStorage.setItem("hybrid_current_user", JSON.stringify(res.data.user));
      }
      return res;
    },

    async register(userData) {
      return await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
    },

    async getMe(userId) {
      return await request(`/auth/me?user_id=${userId}`);
    },

    async updateProfile(userId, profileData) {
      return await request(`/auth/me?user_id=${userId}`, {
        method: "PUT",
        body: JSON.stringify(profileData)
      });
    },

    async submitKyc(userId, kycData) {
      return await request(`/auth/ekyc?user_id=${userId}`, {
        method: "POST",
        body: JSON.stringify(kycData)
      });
    },

    async getKycStatus(userId) {
      return await request(`/auth/ekyc?user_id=${userId}`);
    },

    // Khôi phục mật khẩu qua Email bảo mật & Cấp mật khẩu mới
    async requestPasswordReset(email) {
      return await request("/auth/forgot-password/request", {
        method: "POST",
        body: JSON.stringify({ email })
      });
    },

    async verifyPasswordResetOtp(email, otp) {
      return await request("/auth/forgot-password/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp })
      });
    },

    async resetPasswordAndSendNew(email, otp, newPassword = null) {
      return await request("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({ email, otp, new_password: newPassword })
      });
    },

    // Gửi tin nhắn SMS thật đến số điện thoại qua Cổng Viễn thông
    async sendPhoneOtpSms(phone) {
      return await request("/auth/otp/send-phone", {
        method: "POST",
        body: JSON.stringify({ phone })
      });
    },

    async loginWithPhoneOtp(phone, otp, role = "buyer") {
      return await request("/auth/otp/login-phone", {
        method: "POST",
        body: JSON.stringify({ phone, otp, role })
      });
    },

    // Lấy cấu hình Google OAuth 2.0 & xác thực Token thật
    async getGoogleOAuthConfig() {
      return await request("/auth/oauth/google/config");
    },

    async verifyGoogleOAuthToken(accessToken, role = "buyer") {
      return await request("/auth/oauth/google/verify-token", {
        method: "POST",
        body: JSON.stringify({ access_token: accessToken, role })
      });
    },

    async getAddresses(userId) {
      return await request(`/users/${userId}/addresses`);
    },

    async addAddress(userId, addrData) {
      return await request(`/users/${userId}/addresses`, {
        method: "POST",
        body: JSON.stringify(addrData)
      });
    },

    async deleteAddress(addrId) {
      return await request(`/users/addresses/${addrId}`, { method: "DELETE" });
    },

    async getBankAccounts(userId) {
      return await request(`/users/${userId}/bank-accounts`);
    },

    async addBankAccount(userId, bankData) {
      return await request(`/users/${userId}/bank-accounts`, {
        method: "POST",
        body: JSON.stringify(bankData)
      });
    },

    async deleteBankAccount(bankId) {
      return await request(`/users/bank-accounts/${bankId}`, { method: "DELETE" });
    },

    logout() {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("hv_access_token");
        localStorage.removeItem("hybrid_current_user");
        localStorage.removeItem("hv_current_user");
        localStorage.removeItem("hv_browser_google_account");
        sessionStorage.clear();
      } catch (e) {}
    }
  };

  // ==============================================================
  // 2. PHÂN HỆ DANH MỤC & SẢN PHẨM (CATALOG & PRODUCTS)
  // ==============================================================
  const CatalogAPI = {
    async getCategories() {
      return await request("/categories");
    },

    async getBrands() {
      return await request("/brands");
    },

    async getProducts(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request(`/products${qs ? "?" + qs : ""}`);
    },

    async getFlashSale() {
      return await request("/products/flash-sale");
    },

    async getProductDetail(identifier) {
      return await request(`/products/${encodeURIComponent(identifier)}`);
    },

    async createProduct(productData, images = null) {
      const payload = {
        prod_in: productData,
        images: images || []
      };
      return await request("/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },

    async updateProduct(productId, updateData) {
      return await request(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(updateData)
      });
    },

    async deleteProduct(productId) {
      return await request(`/products/${productId}`, { method: "DELETE" });
    }
  };

  // ==============================================================
  // 3. PHÂN HỆ ĐÀM PHÁN TRẢ GIÁ C2C 24H (OFFERS)
  // ==============================================================
  const OfferAPI = {
    async createOffer(buyerId, offerData) {
      return await request(`/offers/?buyer_id=${buyerId}`, {
        method: "POST",
        body: JSON.stringify(offerData)
      });
    },

    async getOffers(userId, role = "all") {
      return await request(`/offers/?user_id=${userId}&role=${role}`);
    },

    async getOfferDetail(offerId) {
      return await request(`/offers/${offerId}`);
    },

    async respondOffer(offerId, sellerId, actionData) {
      return await request(`/offers/${offerId}/respond?seller_id=${sellerId}`, {
        method: "POST",
        body: JSON.stringify(actionData)
      });
    }
  };

  // ==============================================================
  // 4. PHÂN HỆ VOUCHER & KHUYẾN MÃI (VOUCHERS)
  // ==============================================================
  const VoucherAPI = {
    async getVouchers(activeOnly = true) {
      return await request(`/vouchers/?active_only=${activeOnly}`);
    },

    async applyVoucher(code, orderAmount) {
      return await request("/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({ code, order_amount: orderAmount })
      });
    }
  };

  // ==============================================================
  // 5. PHÂN HỆ ĐƠN HÀNG & VẬN CHUYỂN GHN (ORDERS & SHIPPING)
  // ==============================================================
  const OrderAPI = {
    async createOrder(buyerId, orderData) {
      return await request(`/orders/?buyer_id=${buyerId}`, {
        method: "POST",
        body: JSON.stringify(orderData)
      });
    },

    async getOrders(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request(`/orders/?${qs}`);
    },

    async getOrderDetail(identifier) {
      return await request(`/orders/${encodeURIComponent(identifier)}`);
    },

    async updateOrderStatus(orderId, updateData) {
      return await request(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify(updateData)
      });
    },

    async getOrderTracking(orderId) {
      return await request(`/orders/${orderId}/tracking`);
    },

    async cancelOrder(orderId, reason = "Khách hàng hủy đơn") {
      return await request(`/orders/${orderId}/cancel?reason=${encodeURIComponent(reason)}`, {
        method: "POST"
      });
    }
  };

  // ==============================================================
  // 6. PHÂN HỆ VÍ KÝ QUỸ ESCROW & SỔ CÁI 24/7 (FINANCIAL LEDGER)
  // ==============================================================
  const EscrowAPI = {
    async getWallet(userId) {
      return await request(`/escrow/wallet?user_id=${userId}`);
    },

    async getTransactions(userId, limit = 50) {
      return await request(`/escrow/transactions?user_id=${userId}&limit=${limit}`);
    },

    async withdraw(userId, withdrawData) {
      return await request(`/escrow/withdraw?user_id=${userId}`, {
        method: "POST",
        body: JSON.stringify(withdrawData)
      });
    }
  };

  // ==============================================================
  // 7. PHÂN HỆ PHÒNG TRỌNG TÀI KHIẾU NẠI 3 BÊN (DISPUTES)
  // ==============================================================
  const DisputeAPI = {
    async createDispute(buyerId, disputeData) {
      return await request(`/disputes/?buyer_id=${buyerId}`, {
        method: "POST",
        body: JSON.stringify(disputeData)
      });
    },

    async getDisputes(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request(`/disputes/?${qs}`);
    },

    async getDisputeRoom(identifier) {
      return await request(`/disputes/${encodeURIComponent(identifier)}`);
    },

    async sendMessage(disputeId, senderId, senderRole, messageData) {
      return await request(`/disputes/${disputeId}/messages?sender_id=${senderId}&sender_role=${senderRole}`, {
        method: "POST",
        body: JSON.stringify(messageData)
      });
    },

    async uploadEvidence(disputeId, userId, mediaUrl, mediaType = "image", title = "Bằng chứng mở hộp") {
      const qs = new URLSearchParams({
        media_url: mediaUrl,
        media_type: mediaType,
        title: title,
        user_id: userId
      }).toString();
      return await request(`/disputes/${disputeId}/evidence?${qs}`, { method: "POST" });
    },

    async resolveDispute(disputeId, adminId, resolveData) {
      return await request(`/disputes/${disputeId}/resolve?admin_id=${adminId}`, {
        method: "POST",
        body: JSON.stringify(resolveData)
      });
    }
  };

  // ==============================================================
  // 8. PHÂN HỆ ĐÁNH GIÁ, YÊU THÍCH & THÔNG BÁO (INTERACTIONS)
  // ==============================================================
  const InteractionAPI = {
    async createReview(userId, reviewData) {
      return await request(`/reviews?user_id=${userId}`, {
        method: "POST",
        body: JSON.stringify(reviewData)
      });
    },

    async replyReview(reviewId, sellerId, replyText) {
      return await request(`/reviews/${reviewId}/reply?seller_id=${sellerId}`, {
        method: "POST",
        body: JSON.stringify({ seller_reply: replyText })
      });
    },

    async getProductReviews(productId, page = 1, limit = 20) {
      return await request(`/products/${productId}/reviews?page=${page}&limit=${limit}`);
    },

    async getWishlist(userId) {
      return await request(`/wishlist?user_id=${userId}`);
    },

    async toggleWishlist(userId, productId) {
      return await request(`/wishlist/toggle?user_id=${userId}&product_id=${productId}`, {
        method: "POST"
      });
    },

    async getNotifications(userId, unreadOnly = false) {
      return await request(`/notifications?user_id=${userId}&unread_only=${unreadOnly}`);
    },

    async markNotificationRead(userId, notifId) {
      return await request(`/notifications/${notifId}/read?user_id=${userId}`, { method: "PUT" });
    },

    async markAllNotificationsRead(userId) {
      return await request(`/notifications/read-all?user_id=${userId}`, { method: "PUT" });
    }
  };

  // ==============================================================
  // 9. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PORTAL)
  // ==============================================================
  const AdminAPI = {
    async getStats() {
      return await request("/admin/stats");
    },

    async getPendingKyc(page = 1, limit = 50) {
      return await request(`/admin/ekyc/pending?page=${page}&limit=${limit}`);
    },

    async reviewKyc(kycId, adminId, approved, rejectionReason = "") {
      const qs = new URLSearchParams({
        approved: approved,
        rejection_reason: rejectionReason,
        admin_id: adminId
      }).toString();
      return await request(`/admin/ekyc/${kycId}/review?${qs}`, { method: "POST" });
    }
  };

  // ==============================================================
  // 10. TẢI LÊN FILE & ẢNH/VIDEO THỰC TẾ (FILE UPLOAD)
  // ==============================================================
  const UploadAPI = {
    async uploadFile(fileObject) {
      const formData = new FormData();
      formData.append("file", fileObject);
      return await request("/upload/", {
        method: "POST",
        body: formData
      });
    },

    async uploadMultiple(fileList) {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append("files", fileList[i]);
      }
      return await request("/upload/multiple", {
        method: "POST",
        body: formData
      });
    }
  };

  // Xuất ra phạm vi toàn cục (Global Window)
  global.API = {
    BASE_URL: API_BASE,
    Auth: AuthAPI,
    Catalog: CatalogAPI,
    Offer: OfferAPI,
    Voucher: VoucherAPI,
    Order: OrderAPI,
    Escrow: EscrowAPI,
    Dispute: DisputeAPI,
    Interaction: InteractionAPI,
    Admin: AdminAPI,
    Upload: UploadAPI
  };

})(typeof window !== "undefined" ? window : this);
