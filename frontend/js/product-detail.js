/**
 * product-detail.js — Chi tiết sản phẩm, thư viện ảnh, bộ chọn biến thể & giỏ hàng
 */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) =>
    Array.from((root || document).querySelectorAll(sel));

  // Lấy ID sản phẩm từ URL (?id=...)
  const params = new URLSearchParams(window.location.search);
  const productId =
    params.get("id") ||
    (typeof PRODUCTS !== "undefined" && PRODUCTS[0] ? PRODUCTS[0].id : null);

  const product =
    typeof PRODUCTS !== "undefined"
      ? PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0]
      : null;

  if (!product) {
    console.error("Không tìm thấy sản phẩm:", productId);
    return;
  }

  // Khởi tạo các phần tử DOM
  const dom = {
    breadCatLink: $("#breadCatLink"),
    breadProductName: $("#breadProductName"),
    productBadgeBox: $("#productBadgeBox"),
    mainImage: $("#mainImage"),
    thumbStrip: $("#thumbStrip"),
    productCategoryText: $("#productCategoryText"),
    productSellerText: $("#productSellerText"),
    productName: $("#productName"),
    productStarsBox: $("#productStarsBox"),
    productRatingScore: $("#productRatingScore"),
    productReviewCount: $("#productReviewCount"),
    productCurrentPrice: $("#productCurrentPrice"),
    productOldPrice: $("#productOldPrice"),
    usedSavingCallout: $("#usedSavingCallout"),
    usedSavingText: $("#usedSavingText"),
    productShortDesc: $("#productShortDesc"),
    detailQtyInput: $("#detailQtyInput"),
    btnDetailDec: $("#btnDetailDec"),
    btnDetailInc: $("#btnDetailInc"),
    btnAddToCart: $("#btnAddToCart"),
    btnBuyNow: $("#btnBuyNow"),
    negotiateBox: $("#negotiateBox"),
    btnOpenOfferModal: $("#btnOpenOfferModal"),
    variantOptions: $("#variantOptions"),
    tabDescContent: $("#tabDescContent"),
    specsTable: $("#specsTable"),
    reviewsList: $("#reviewsList"),
    relatedProductsGrid: $("#relatedProductsGrid"),
    avatarBtn: $("#avatarBtn"),
    // Modal trả giá
    offerModal: $("#offerModal"),
    offerForm: $("#offerForm"),
    offerProductName: $("#offerProductName"),
    offerProductPrice: $("#offerProductPrice"),
    offerPriceInput: $("#offerPriceInput"),
  };

  let currentQty = 1;
  let selectedVariant = "Tiêu Chuẩn";

  /* ---------------- HIỂN THỊ DỮ LIỆU SẢN PHẨM ---------------- */
  function renderProduct() {
    const isUsed = product.type === "c2c";
    const discountPercent =
      isUsed && product.oldPrice && product.price
        ? Math.round((1 - product.price / product.oldPrice) * 100)
        : product.off || 0;

    // Breadcrumb
    const catObj =
      typeof CATEGORIES !== "undefined"
        ? CATEGORIES.find((c) => c.id === product.category)
        : null;
    if (dom.breadCatLink) {
      dom.breadCatLink.textContent = catObj ? catObj.chip : "Danh Mục";
      dom.breadCatLink.href = `catalog.html?category=${product.category}`;
    }
    if (dom.breadProductName) {
      dom.breadProductName.textContent = product.short || product.name;
    }

    // Tiêu đề & Danh mục
    if (dom.productCategoryText)
      dom.productCategoryText.textContent = catObj
        ? catObj.chip
        : product.category;
    if (dom.productSellerText) {
      dom.productSellerText.textContent = isUsed
        ? `Người bán: ${product.seller || "Đã xác minh uy tín"}`
        : "Brand Mall chính hãng 100%";
    }
    if (dom.productName) dom.productName.textContent = product.name;

    // Badge
    if (dom.productBadgeBox) {
      if (isUsed) {
        dom.productBadgeBox.innerHTML = `
          <span class="badge badge-c2c" style="font-size: 12px; padding: 6px 12px;">
            ĐỒ CŨ ${product.condText || "LIKE NEW"} • RẺ HƠN ĐỒ MỚI ${discountPercent}%
          </span>
        `;
      } else {
        dom.productBadgeBox.innerHTML = `
          <span class="badge badge-mall" style="font-size: 12px; padding: 6px 12px;">
            HÀNG MỚI 100% NGUYÊN SEAL • BRAND MALL
          </span>
        `;
      }
    }

    // Ảnh chính & Thumbnails - Đảm bảo chỉ hiển thị ảnh của chính sản phẩm
    const resolvedProductImg =
      typeof window !== "undefined" && window.resolveAssetUrl
        ? window.resolveAssetUrl(product.img)
        : product.img;
    const images =
      typeof ProductDetailData !== "undefined" &&
      ProductDetailData.getGalleryImages
        ? ProductDetailData.getGalleryImages(product)
        : [resolvedProductImg].filter(Boolean);

    if (dom.mainImage && images.length) dom.mainImage.src = images[0];

    if (dom.thumbStrip) {
      if (images.length > 1) {
        dom.thumbStrip.style.display = "flex";
        dom.thumbStrip.innerHTML = images
          .map(
            (img, idx) => `
            <div class="thumb-item ${idx === 0 ? "active" : ""}" data-img="${img}">
              <img src="${img}" alt="Góc chụp ${idx + 1}" />
            </div>
          `,
          )
          .join("");

        $$(".thumb-item", dom.thumbStrip).forEach((item) => {
          item.addEventListener("click", () => {
            $$(".thumb-item", dom.thumbStrip).forEach((t) =>
              t.classList.remove("active"),
            );
            item.classList.add("active");
            if (dom.mainImage) dom.mainImage.src = item.dataset.img;
          });
        });
      } else {
        dom.thumbStrip.style.display = "none";
        dom.thumbStrip.innerHTML = "";
      }
    }

    // Đánh giá sao
    const rating = product.rating || 4.8;
    if (dom.productStarsBox && typeof Utils !== "undefined") {
      dom.productStarsBox.innerHTML = Utils.renderStars(rating, { html: true });
    }
    if (dom.productRatingScore)
      dom.productRatingScore.textContent = rating.toFixed(1);
    if (dom.productReviewCount) {
      dom.productReviewCount.textContent = `(${Math.floor(rating * 35)} nhận xét)`;
    }

    // Giá tiền & Tiết kiệm
    if (dom.productCurrentPrice)
      dom.productCurrentPrice.textContent = Utils.formatCurrency(product.price);

    if (isUsed && product.oldPrice) {
      if (dom.productOldPrice) {
        dom.productOldPrice.textContent = Utils.formatCurrency(
          product.oldPrice,
        );
      }
      if (dom.usedSavingCallout && dom.usedSavingText) {
        dom.usedSavingCallout.style.display = "inline-flex";
        const saved = product.oldPrice - product.price;
        dom.usedSavingText.textContent = `Rẻ hơn đồ mới ${discountPercent}% (Tiết kiệm ${Utils.formatCurrency(saved)})`;
      }
      if (dom.negotiateBox) dom.negotiateBox.style.display = "block";
    } else {
      if (dom.productOldPrice) dom.productOldPrice.textContent = "";
      if (dom.usedSavingCallout) dom.usedSavingCallout.style.display = "none";
      if (dom.negotiateBox) dom.negotiateBox.style.display = "none";
    }

    // Mô tả ngắn
    if (dom.productShortDesc) {
      dom.productShortDesc.innerHTML = `
        <p class="mb-2"><strong>Mô tả chi tiết:</strong> ${product.desc || "Sản phẩm được tuyển chọn chính hãng, tình trạng hoàn hảo."}</p>
        <div class="flex items-center gap-3 text-xs text-muted mt-2">
          <span><span class="material-symbols-outlined icon-xs text-success">check_circle</span> Đã kiểm tra 100%</span>
          <span><span class="material-symbols-outlined icon-xs text-secondary">local_shipping</span> Miễn phí vận chuyển</span>
          <span><span class="material-symbols-outlined icon-xs text-primary">published_with_changes</span> Đổi trả 7 ngày</span>
        </div>
      `;
    }

    // Dựng bảng thông số kỹ thuật (Specs)
    renderSpecs();

    // Dựng danh sách đánh giá
    renderReviews();

    // Dựng sản phẩm liên quan
    renderRelatedProducts();
  }

  /* ---------------- THÔNG SỐ KỸ THUẬT (SPECS) ---------------- */
  function renderSpecs() {
    if (!dom.specsTable) return;
    const isUsed = product.type === "c2c";

    const specs = [
      {
        label: "Phân loại sản phẩm",
        val: isUsed
          ? `Đồ cũ Like New (${product.condText || "99%"})`
          : "Hàng Mới 100% Nguyên Seal",
      },
      { label: "Thương hiệu", val: product.sub || "Chính Hãng Phân Phối" },
      {
        label: "Tình trạng ngoại quan",
        val: isUsed
          ? product.condLabel || "Rất đẹp, không trầy xước cấn móp"
          : "Mới 100% trong hộp nguyên seal",
      },
      {
        label: "Chế độ bảo hành",
        val: isUsed
          ? "Bảo hành 6 tháng tại hệ thống + Đổi trả 7 ngày"
          : "Bảo hành chính hãng 12 - 24 tháng toàn quốc",
      },
      {
        label: "Chính sách đồng kiểm",
        val: "Được mở hộp kiểm tra ngoại quan cùng shipper trước khi nhận",
      },
      {
        label: "Đóng gói bao gồm",
        val: isUsed
          ? "Thân máy + Phụ kiện đi kèm + Phiếu bảo hành"
          : "Hộp seal đầy đủ phụ kiện theo tiêu chuẩn hãng",
      },
    ];

    dom.specsTable.innerHTML = specs
      .map(
        (s) => `
        <div class="spec-row">
          <div class="spec-label">${s.label}</div>
          <div class="spec-val">${s.val}</div>
        </div>
      `,
      )
      .join("");
  }

  /* ---------------- ĐÁNH GIÁ (REVIEWS) ---------------- */
  function renderReviews() {
    if (!dom.reviewsList) return;
    const reviews = typeof MOCK_REVIEWS !== "undefined" ? MOCK_REVIEWS : [];

    dom.reviewsList.innerHTML = reviews
      .map(
        (r) => `
        <div class="review-card">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="avatar" style="width: 36px; height: 36px; font-size: 13px;">${r.avatar}</div>
              <div>
                <strong class="text-sm">${r.author}</strong>
                <div class="text-xs text-secondary">${r.productType}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-warning text-xs">${Utils.renderStars(r.rating, { html: true })}</div>
              <div class="text-xs text-faint mt-1">${r.date}</div>
            </div>
          </div>
          <p class="text-sm text-muted" style="line-height: 1.6;">${r.content}</p>
        </div>
      `,
      )
      .join("");
  }

  /* ---------------- SẢN PHẨM TƯƠNG TỰ ---------------- */
  function renderRelatedProducts() {
    if (!dom.relatedProductsGrid || typeof PRODUCTS === "undefined") return;

    const related = PRODUCTS.filter(
      (p) => p.category === product.category && p.id !== product.id,
    ).slice(0, 4);

    dom.relatedProductsGrid.innerHTML = related
      .map((p) => {
        const isUsed = p.type === "c2c";
        const discountPercent =
          isUsed && p.oldPrice && p.price
            ? Math.round((1 - p.price / p.oldPrice) * 100)
            : p.off || 0;

        return `
          <div class="card-product">
            <div class="card-product-thumb">
              <img src="${typeof window !== "undefined" && window.resolveAssetUrl ? window.resolveAssetUrl(p.img) : p.img}" alt="${p.name}" />
              <div class="card-badge-top">
                ${
                  isUsed
                    ? `<span class="badge badge-c2c">ĐỒ CŨ ${p.condText || "LIKE NEW"} • -${discountPercent}%</span>`
                    : `<span class="badge badge-mall">HÀNG MỚI 100%</span>`
                }
              </div>
            </div>
            <div class="card-product-body">
              <h4 class="card-product-title">
                <a href="${isUsed ? "product_used.html?id=" + p.id : "product_new.html?id=" + p.id}">${p.short || p.name}</a>
              </h4>
              <div class="card-product-prices">
                <strong class="price text-primary">${Utils.formatCurrency(p.price)}</strong>
                ${isUsed && p.oldPrice ? `<small class="old-price">${Utils.formatCurrency(p.oldPrice)}</small>` : ""}
              </div>
            </div>
            <div class="card-product-foot">
              <a class="btn btn-secondary w-full" href="${isUsed ? "product_used.html?id=" + p.id : "product_new.html?id=" + p.id}">
                Xem Chi Tiết
              </a>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /* ---------------- GẮN SỰ KIỆN TƯƠNG TÁC ---------------- */
  function setupEvents() {
    // Biến thể
    if (dom.variantOptions) {
      $$(".variant-btn", dom.variantOptions).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".variant-btn", dom.variantOptions).forEach((b) =>
            b.classList.remove("active"),
          );
          btn.classList.add("active");
          selectedVariant = btn.textContent.trim();
        });
      });
    }

    // Số lượng
    if (dom.btnDetailDec && dom.detailQtyInput) {
      dom.btnDetailDec.addEventListener("click", () => {
        if (currentQty > 1) {
          currentQty--;
          dom.detailQtyInput.value = currentQty;
        }
      });
    }
    if (dom.btnDetailInc && dom.detailQtyInput) {
      dom.btnDetailInc.addEventListener("click", () => {
        currentQty++;
        dom.detailQtyInput.value = currentQty;
      });
    }

    // Thêm vào giỏ
    if (dom.btnAddToCart) {
      dom.btnAddToCart.addEventListener("click", () => {
        Utils.Cart.addItem(product, currentQty, selectedVariant);
      });
    }

    // Mua ngay
    if (dom.btnBuyNow) {
      dom.btnBuyNow.addEventListener("click", () => {
        Utils.Cart.addItem(product, currentQty, selectedVariant);
        window.location.href = "cart.html";
      });
    }

    // Modal trả giá
    if (dom.btnOpenOfferModal) {
      dom.btnOpenOfferModal.addEventListener("click", () => {
        if (dom.offerProductName)
          dom.offerProductName.textContent = product.name;
        if (dom.offerProductPrice)
          dom.offerProductPrice.textContent = Utils.formatCurrency(
            product.price,
          );
        if (dom.offerPriceInput) {
          const defaultOffer = Math.round(product.price * 0.9);
          dom.offerPriceInput.value = defaultOffer.toLocaleString("vi-VN");
        }
        Utils.openModal("offerModal");
      });
    }

    // Nút trả giá nhanh
    if (dom.offerModal) {
      $$(".chip[data-quick]", dom.offerModal).forEach((chip) => {
        chip.addEventListener("click", () => {
          const pct = Math.abs(parseInt(chip.dataset.quick, 10)) / 100;
          const discounted = Math.round(product.price * (1 - pct));
          if (dom.offerPriceInput)
            dom.offerPriceInput.value = discounted.toLocaleString("vi-VN");
        });
      });
    }

    // Gửi form trả giá
    if (dom.offerForm) {
      dom.offerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const price = dom.offerPriceInput.value.replace(/\D/g, "");
        if (!price || Number(price) <= 0) {
          Utils.toast("Vui lòng nhập mức giá hợp lệ", "error");
          return;
        }
        Utils.closeModal("offerModal");
        Utils.toast({
          title: "Đề nghị trả giá đã được gửi!",
          message: `Mức giá đề xuất ${Utils.formatCurrency(price)} đã chuyển tới người bán. Người bán sẽ phản hồi trong 24 giờ.`,
          type: "success",
          duration: 4000,
        });
      });
    }

    // Tabs
    const tabBtns = $$("#detailTabs .tab-btn");
    const tabPanes = $$(".tab-pane");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        tabPanes.forEach((p) => (p.style.display = "none"));

        btn.classList.add("active");
        const targetId = btn.dataset.tab;
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.style.display = "block";
      });
    });

    // Viết đánh giá
    const btnWriteReview = $("#btnWriteReview");
    if (btnWriteReview) {
      btnWriteReview.addEventListener("click", () => {
        Utils.toast(
          "Chức năng đánh giá sẽ mở sau khi bạn hoàn tất đơn hàng và nhận sản phẩm.",
          "info",
        );
      });
    }
  }

  /* ---------------- KHỞI CHẠY ---------------- */
  renderProduct();
  setupEvents();
  Utils.Cart.syncBadge();
})();
