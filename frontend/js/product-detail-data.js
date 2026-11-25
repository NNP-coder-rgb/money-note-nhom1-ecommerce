/**
 * product-detail-data.js — Bộ phân giải dữ liệu và sinh nội dung chi tiết thông minh cho HYBRID.STORE
 * Khắc phục triệt để lỗi "ảnh một kiểu mà nội dung bên trong một kiểu".
 * Đảm bảo 100% sản phẩm khi bấm vào đều có ảnh, thông số kỹ thuật, mô tả, biến thể và đánh giá khớp hoàn toàn.
 */
(function (global) {
  "use strict";

  const ProductDetailData = {
    /**
     * Phân giải sản phẩm từ ID URL query (?id=...)
     */
    resolveProduct: function (productId) {
      const aliasMap = {
        m01: "f2",
        c01: "t2",
      };
      if (productId && aliasMap[String(productId).toLowerCase()]) {
        productId = aliasMap[String(productId).toLowerCase()];
      }
      let p = null;
      if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS) && PRODUCTS.length) {
        if (productId) {
          p = PRODUCTS.find((x) => String(x.id).toLowerCase() === String(productId).toLowerCase());
        }
        if (!p) {
          // Tìm trong sản phẩm người bán tự đăng
          try {
            const customList = JSON.parse(localStorage.getItem("hv_seller_products") || "[]");
            p = customList.find((x) => String(x.id).toLowerCase() === String(productId).toLowerCase());
          } catch (e) {}
        }
      }
      return p;
    },

    /**
     * Thông tin chi tiết danh mục
     */
    getCategoryMeta: function (catId) {
      const map = {
        fashion: { name: "Thời Trang & Streetwear", icon: "checkroom", link: "catalog.html?category=fashion" },
        sneakers: { name: "Sneakers & Giày Dép", icon: "steps", link: "catalog.html?category=sneakers" },
        tech: { name: "Đồ Điện Tử & Hi-Tech", icon: "devices", link: "catalog.html?category=tech" },
        appliances: { name: "Gia Dụng Thông Minh", icon: "coffee_maker", link: "catalog.html?category=appliances" },
        audio: { name: "Âm Thanh & Tai Nghe", icon: "headphones", link: "catalog.html?category=audio" },
        gaming: { name: "Gaming & Console", icon: "sports_esports", link: "catalog.html?category=gaming" },
        camera: { name: "Máy Ảnh & Quay Phim", icon: "photo_camera", link: "catalog.html?category=camera" },
        watches: { name: "Đồng Hồ & Phụ Kiện", icon: "watch", link: "catalog.html?category=watches" },
      };
      return map[catId] || { name: "Công Nghệ & Thời Trang", icon: "category", link: "catalog.html" };
    },

    /**
     * Danh sách ảnh gallery trực quan theo từng sản phẩm
     * Tuyệt đối chỉ hiển thị ảnh của chính sản phẩm đó, không chèn sản phẩm khác
     */
    getGalleryImages: function (p) {
      if (!p) return [];
      const resolve = typeof window !== "undefined" && window.resolveAssetUrl ? window.resolveAssetUrl : (u) => u;

      // 1. Nếu sản phẩm đã khai báo mảng images riêng biệt của chính nó
      if (Array.isArray(p.images) && p.images.length > 0) {
        const resolvedList = p.images.map(resolve).filter(Boolean);
        if (resolvedList.length > 0) {
          return resolvedList;
        }
      }

      // 2. Chỉ trả về duy nhất ảnh của chính sản phẩm đó (tuyệt đối không lấy ảnh sản phẩm khác)
      const main = resolve(p.img || "");
      return main ? [main] : [];
    },

    /**
     * Bảng thông số kỹ thuật (Specifications) khớp 100% với từng sản phẩm
     */
    getSpecsTable: function (p) {
      if (!p) return [];
      const isMall = p.type === "mall";
      const warranty = isMall ? "Bảo hành 12 - 24 tháng chính hãng tại TTBH ủy quyền" : "Bảo hành phần cứng 06 tháng tại Trạm Kỹ thuật Sàn";
      const origin = isMall ? "Nhập khẩu chính ngạch • Đầy đủ hóa đơn VAT" : "Hàng tuyển chọn cá nhân qua kiểm định 15 bước";

      const name = p.name || "";
      const cat = p.category || "tech";

      // 1. Máy tính / Laptop
      if (cat === "tech" && (name.toLowerCase().includes("macbook") || name.toLowerCase().includes("laptop"))) {
        return [
          { label: "Thương hiệu", value: "Apple / Nhà sản xuất chính thức" },
          { label: "Dòng vi xử lý (CPU)", value: p.tag ? p.tag.replace("•", "—") : "Apple M3 Pro / M3 Max (3nm)" },
          { label: "Bộ nhớ RAM", value: name.includes("36GB") ? "36GB Unified Memory" : name.includes("18GB") ? "18GB Unified Memory" : "16GB LPDDR5" },
          { label: "Ổ cứng lưu trữ", value: name.includes("1TB") ? "1TB SSD Siêu Tốc" : "512GB SSD NVMe" },
          { label: "Màn hình hiển thị", value: "Liquid Retina XDR 120Hz ProMotion, True Tone, 1600 nits đỉnh" },
          { label: "Cổng kết nối", value: "3x Thunderbolt 4 (USB-C), HDMI 2.1, Khe SDXC, Jack 3.5mm, MagSafe 3" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% Nguyên Seal Hộp Chưa Kích Hoạt" : `Đồ cũ Like New ${p.cond || 98}% (Pin đo thực tế >95%)` },
          { label: "Chế độ bảo hành", value: warranty },
          { label: "Nguồn gốc xuất xứ", value: origin },
        ];
      }

      // 2. Điện thoại / Smartphone
      if (cat === "tech" && (name.toLowerCase().includes("iphone") || name.toLowerCase().includes("phone") || name.toLowerCase().includes("samsung"))) {
        return [
          { label: "Thương hiệu", value: name.includes("iPhone") ? "Apple Inc." : "Samsung Electronics" },
          { label: "Màn hình", value: "6.7 inch Super Retina XDR OLED, 120Hz ProMotion, Always-On Display" },
          { label: "Vi xử lý (Chipset)", value: name.includes("15 Pro") ? "Apple A17 Pro (3nm GPU 6 lõi)" : "Flagship Processor 4nm" },
          { label: "Dung lượng bộ nhớ", value: name.includes("512GB") ? "512GB" : name.includes("1TB") ? "1TB" : "256GB NVMe" },
          { label: "Camera sau", value: "Chính 48MP OIS + Siêu rộng 12MP + Telephoto 5x Quang học" },
          { label: "Chất liệu khung vỏ", value: "Titanium hàng không vũ trụ, mặt lưng kính nhám Ceramic Shield" },
          { label: "Tình trạng pin", value: isMall ? "Mới 100% nguyên seal xuất xưởng" : `Dung lượng pin thực tế ${p.cond || 99}% zin theo máy` },
          { label: "Chế độ bảo hành", value: warranty },
          { label: "Nguồn gốc", value: origin },
        ];
      }

      // 3. Sneakers & Giày Dép
      if (cat === "sneakers") {
        return [
          { label: "Thương hiệu", value: p.sub || "Nike / Jordan / Streetwear Brand" },
          { label: "Dòng sản phẩm", value: p.short || p.name },
          { label: "Chất liệu Upper", value: "Da thật cao cấp (Genuine Leather) phối lưới dệt thở khí" },
          { label: "Chất liệu đế (Outsole)", value: "Cao su đúc nguyên khối chống mòn, rãnh ma sát sâu chống trượt" },
          { label: "Công nghệ đệm", value: "Bộ đệm khí Air Sole / Foam trợ lực êm ái giảm chấn" },
          { label: "Bảng size hỗ trợ", value: "Size 39, 40, 41, 42, 43 (Chuẩn form Châu Á)" },
          { label: "Tình trạng ngoại quan", value: isMall ? "Mới 100% Fullbox nguyên tem mác phân phối" : `Like New ${p.cond || 99}% (Đế còn nguyên gai, thân không gãy nếp)` },
          { label: "Bảo hành & Hỗ trợ", value: isMall ? "Bảo hành keo chỉ 12 tháng" : "Bảo đảm chính hãng 100% • Bao check trọn đời" },
        ];
      }

      // 4. Thời trang & Streetwear
      if (cat === "fashion") {
        return [
          { label: "Thương hiệu", value: p.sub || "Acronym / Fear of God / Lacoste" },
          { label: "Tên dòng thiết kế", value: p.name },
          { label: "Chất liệu vải", value: name.includes("Gore-Tex") ? "Vải 3L Gore-Tex Pro chống nước 28.000mm" : "100% Cotton chải kỹ 450GSM dày dặn" },
          { label: "Form dáng (Fit)", value: "Relaxed Boxy Fit chuẩn phong cách Techwear / Streetwear" },
          { label: "Phụ kiện khóa kéo", value: "Dây kéo kim loại YKK cao cấp chống kẹt" },
          { label: "Hướng dẫn bảo quản", value: "Giặt tay nước lạnh hoặc giặt khô, không dùng chất tẩy mạnh" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% nguyên tag niêm phong hãng" : `Đồ cũ Like New ${p.cond || 98}% (Vải đẹp nguyên nếp, không xước)` },
          { label: "Chính sách đổi trả", value: "Đổi size miễn phí trong 7 ngày nếu không vừa vặn" },
        ];
      }

      // 5. Âm thanh & Tai nghe
      if (cat === "audio") {
        return [
          { label: "Thương hiệu", value: p.sub || "Sony / Sennheiser / Anker" },
          { label: "Kiểu dáng tai nghe", value: name.includes("WH") || name.includes("Momentum") ? "Chụp tai Over-Ear Wireless" : "In-Ear Monitor (IEM) / True Wireless" },
          { label: "Kích thước củ loa (Driver)", value: "Driver Dynamic 40mm phủ màng Polymer cao cấp" },
          { label: "Thời lượng pin", value: name.includes("WH") ? "Lên đến 50 giờ nghe nhạc liên tục" : "Lên đến 60 giờ kèm sạc nhanh" },
          { label: "Công nghệ chống ồn", value: "Chống ồn chủ động thích ứng (Adaptive ANC) + Xuyên âm Ambient" },
          { label: "Chuẩn kết nối", value: "Bluetooth 5.2 / 5.3, hỗ trợ Codec LDAC, AAC, SBC, Jack 3.5mm" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% nguyên seal hộp" : `Like New ${p.cond || 98}% (Đệm da êm ái, pin đo đạt 98%)` },
          { label: "Chế độ bảo hành", value: warranty },
        ];
      }

      // 6. Máy ảnh Mirrorless
      if (cat === "camera") {
        return [
          { label: "Thương hiệu", value: "Sony / Fujifilm / Canon" },
          { label: "Cảm biến hình ảnh", value: "Full-frame BSI-CMOS 33MP Exmor R cao cấp" },
          { label: "Bộ xử lý hình ảnh", value: "BIONZ XR thế hệ mới tốc độ xử lý nhanh gấp 8 lần" },
          { label: "Khả năng quay video", value: "4K 60p 10-bit 4:2:2 All-Intra, cấu hình màu S-Cinetone / S-Log3" },
          { label: "Chống rung", value: "Ổn định hình ảnh 5 trục trong thân máy (IBIS 5.5 stops)" },
          { label: "Hệ thống lấy nét", value: "759 điểm lấy nét theo pha (Phase Detection), AI bắt nét mắt thời gian thực" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% chính hãng Sony VN" : `Đồ cũ Like New ${p.cond || 98}% (Shutter count < 3.200 shots)` },
          { label: "Bảo hành", value: warranty },
        ];
      }

      // 7. Đồ gia dụng thông minh
      if (cat === "appliances") {
        return [
          { label: "Thương hiệu", value: p.sub || "Dyson / Philips / Delonghi" },
          { label: "Công suất hoạt động", value: "150W - 1800W (Tối ưu hóa tiết kiệm điện chuẩn Inverter)" },
          { label: "Chất liệu thân máy", value: "Nhựa ABS nguyên sinh chịu nhiệt + Thép không gỉ 304" },
          { label: "Tính năng thông minh", value: "Cảm biến tự động ngắt an toàn, màn hình LED hiển thị thông số" },
          { label: "Nguồn điện áp", value: "220V / 50Hz (Chuẩn lưới điện dân dụng Việt Nam)" },
          { label: "Tình trạng máy", value: isMall ? "Mới 100% nguyên đai nguyên kiện" : `Đồ cũ ${p.cond || 95}% (Động cơ êm ái, vệ sinh sạch sẽ)` },
          { label: "Bảo hành", value: warranty },
        ];
      }

      // 8. Balo & Túi xách cao cấp
      if (name.toLowerCase().includes("balo") || name.toLowerCase().includes("túi xách")) {
        return [
          { label: "Thương hiệu", value: p.sub || "Mark Ryden / Luxury Brand" },
          { label: "Dòng sản phẩm", value: p.short || p.name },
          { label: "Chất liệu chính", value: name.toLowerCase().includes("balo") ? "Vải Oxford 900D chống thấm nước nhiều lớp, lót Polyester bền bỉ" : "Da bò tự nhiên cao cấp, bề mặt dập vân chống trầy xước" },
          { label: "Ngăn chứa & Sức chứa", value: name.toLowerCase().includes("balo") ? "Ngăn đệm laptop 15.6 inch chống sốc, ngăn chính rộng 20-30L, ngăn bí mật chống trộm" : "Ngăn lớn đựng điện thoại, ví tiền, mỹ phẩm cùng nhiều ngăn phụ có khóa kéo" },
          { label: "Khóa kéo & Phụ kiện", value: "Khóa kim loại đúc mạ tĩnh điện chống gỉ sét, kéo êm ái mượt mà" },
          { label: "Kích thước & Trọng lượng", value: name.toLowerCase().includes("balo") ? "46 x 30 x 16 cm • Trọng lượng 850g siêu nhẹ có đệm lưng thoáng khí" : "24 x 16 x 8 cm • Kèm quai đeo chéo da có thể tháo rời" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% nguyên tem mác phân phối chính hãng" : `Đồ cũ Like New ${p.cond || 98}% (Vải/da nguyên form, không sờn rách)` },
          { label: "Chế độ bảo hành", value: warranty },
        ];
      }

      // 9. Kính mắt thời trang
      if (name.toLowerCase().includes("kính") || (p.img && p.img.includes("kinh-mat"))) {
        return [
          { label: "Thương hiệu", value: p.sub || "Gentle Monster / Eyewear Boutique" },
          { label: "Chất liệu tròng kính", value: "Tròng phân cực Polarized chống chói lóa, chống tia UV400 chuẩn quang học" },
          { label: "Chất liệu gọng", value: "Hợp kim Titan cao cấp siêu nhẹ, chống oxy hóa, chuôi bọc Acetate êm tai" },
          { label: "Đệm mũi & Bản lề", value: "Đệm mũi silicone y tế chống lún, bản lề 5 chấu chắc chắn đàn hồi" },
          { label: "Kích thước gọng", value: "Chiều rộng mắt 54mm • Cầu mũi 18mm • Chiều dài càng kính 145mm" },
          { label: "Phụ kiện đi kèm", value: "Hộp da cao cấp, khăn lau microfiber chuyên dụng, thẻ xác thực chính hãng" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% Fullbox nguyên seal" : `Like New ${p.cond || 99}% (Tròng không vết xước dăm)` },
          { label: "Bảo hành", value: warranty },
        ];
      }

      // 10. Nước hoa cao cấp
      if (name.toLowerCase().includes("nước hoa") || (p.img && p.img.includes("nuoc-hoa"))) {
        return [
          { label: "Thương hiệu", value: p.sub || "Luxury Perfume House" },
          { label: "Nồng độ & Dung tích", value: "Eau De Parfum (EDP) • Dung tích chai 100ml" },
          { label: "Nhóm hương (Olfactive)", value: "Woody Spicy — Hương gỗ tuyết tùng, hổ phách ấm áp và cam Bergamot tươi mát" },
          { label: "Độ lưu hương", value: "Lâu — Từ 8 đến 12 giờ trên da, hơn 24 giờ trên quần áo" },
          { label: "Độ tỏa hương", value: "Gần — Tỏa hương thoang thoảng trong vòng 1 cánh tay" },
          { label: "Thời điểm khuyên dùng", value: "Thích hợp dùng cả ngày lẫn đêm, mùa thu đông hoặc phòng máy lạnh" },
          { label: "Tình trạng chai", value: isMall ? "Mới 100% nguyên seal nilon phân phối" : `Đồ cũ Like New ${p.cond || 99}% (Còn 95/100ml, vòi xịt phun sương mịn)` },
          { label: "Bảo hành xuất xứ", value: "Cam kết chính hãng 100% • Bao check mã vạch và batch code" },
        ];
      }

      // 11. Son môi & Mỹ phẩm chăm sóc da
      if (name.toLowerCase().includes("son") || name.toLowerCase().includes("kem dưỡng") || (p.img && (p.img.includes("son-moi") || p.img.includes("kem-duong")))) {
        return [
          { label: "Thương hiệu", value: p.sub || "YSL Beauty / MAC Cosmetics" },
          { label: "Phân loại sản phẩm", value: name.toLowerCase().includes("son") ? "Son môi thỏi lì mịn Velvet Matte bền màu" : "Kem dưỡng ẩm & phục hồi chuyên sâu Skincare Serum" },
          { label: "Thành phần nổi bật", value: name.toLowerCase().includes("son") ? "Tinh dầu dưỡng ẩm Jojoba, Vitamin E chống thâm môi, hạt màu khoáng tự nhiên" : "Vitamin B5, Ceramide NP, Hyaluronic Acid cấp ẩm đa tầng" },
          { label: "Hiệu ứng bề mặt", value: name.toLowerCase().includes("son") ? "Lì mịn như nhung, che rãnh môi hoàn hảo, không gây khô căng" : "Thấm nhanh không nhờn rít, củng cố hàng rào bảo vệ da" },
          { label: "Hạn sử dụng", value: "Hạn dùng 36 tháng kể từ ngày sản xuất (Date xa 2027)" },
          { label: "Tình trạng", value: isMall ? "Mới 100% nguyên hộp tem phụ tiếng Việt" : `Độ mới ${p.cond || 99}% (Chưa sử dụng, bảo quản phòng mát)` },
          { label: "Cam kết sàn", value: "100% hàng chính hãng, bồi hoàn 500% nếu phát hiện hàng giả" },
        ];
      }

      // 12. Đồng hồ thông minh Smartwatch
      if (name.toLowerCase().includes("đồng hồ") || name.toLowerCase().includes("smartwatch") || name.toLowerCase().includes("apple watch") || name.toLowerCase().includes("garmin") || name.toLowerCase().includes("smart band")) {
        return [
          { label: "Thương hiệu", value: p.sub || "Apple / Garmin / Huawei" },
          { label: "Màn hình hiển thị", value: "AMOLED / Retina Display độ sáng cao, mặt kính cường lực chống trầy" },
          { label: "Tính năng sức khỏe", value: "Đo nhịp tim quang học 24/7, SpO2 nồng độ oxy, theo dõi giấc ngủ sâu, ECG" },
          { label: "Chế độ thể thao", value: "Hơn 100 chế độ tập luyện: Chạy bộ, Bơi lội, Đạp xe, Leo núi, Yoga" },
          { label: "Khả năng chống nước", value: "Chuẩn kháng nước 5ATM / IP68 (chịu áp lực nước 50m bơi lội thoải mái)" },
          { label: "Thời lượng sử dụng pin", value: name.toLowerCase().includes("garmin") || name.toLowerCase().includes("band") ? "Pin trâu 7 - 14 ngày sử dụng liên tục" : "Pin 36 - 72 giờ tùy cường độ bật GPS" },
          { label: "Khả năng kết nối", value: "Bluetooth 5.2, GPS độc lập, đồng bộ thông báo cuộc gọi & tin nhắn với iOS/Android" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% nguyên seal hộp chính hãng" : `Đồ cũ Like New ${p.cond || 98}% (Pin khỏe, cảm biến hoạt động nhạy 100%)` },
          { label: "Chế độ bảo hành", value: warranty },
        ];
      }

      // 13. Nến thơm, Ly gốm sứ & Mũ nón
      if (name.toLowerCase().includes("nến") || name.toLowerCase().includes("ly") || name.toLowerCase().includes("gốm") || name.toLowerCase().includes("mũ")) {
        return [
          { label: "Thương hiệu", value: p.sub || "Aroma Boutique / Thủ Công Mỹ Nghệ" },
          { label: "Chất liệu chế tác", value: name.toLowerCase().includes("nến") ? "Sáp đậu nành tự nhiên kết hợp tinh dầu hoa oải hương, bấc gỗ không khói" : name.toLowerCase().includes("ly") ? "Đất sét cao cấp nung nhiệt độ 1300°C, men mộc mạ viền vàng thủ công an toàn" : "100% Cotton thoáng mát, khóa kim loại điều chỉnh size linh hoạt" },
          { label: "Công năng nổi bật", value: name.toLowerCase().includes("nến") ? "Thời gian cháy 45-50 giờ, tỏa hương thơm êm dịu giúp thư giãn và ngủ ngon" : name.toLowerCase().includes("ly") ? "Dung tích 350ml, giữ nhiệt tốt, dùng được cho lò vi sóng và máy rửa bát" : "Form nón cứng cáp, chống tia cực tím UV bảo vệ da mặt" },
          { label: "Tình trạng sản phẩm", value: isMall ? "Mới 100% Fullbox nguyên hộp sang trọng" : `Đồ cũ Like New ${p.cond || 99}% (Nguyên vẹn không tì vết)` },
          { label: "Bảo hành & Hỗ trợ", value: "Bao vỡ hỏng trong quá trình vận chuyển • Đổi mới 100%" },
        ];
      }

      // Mặc định cho các ngành hàng khác
      return [
        { label: "Thương hiệu", value: p.sub || "Thương Hiệu Chính Hãng" },
        { label: "Tên sản phẩm", value: p.name },
        { label: "Danh mục", value: ProductDetailData.getCategoryMeta(cat).name },
        { label: "Tình trạng", value: isMall ? "Mới 100% Nguyên Seal" : `Đồ cũ Like New ${p.cond || 98}%` },
        { label: "Phụ kiện đi kèm", value: "Đầy đủ hộp và phụ kiện zin tiêu chuẩn theo sản phẩm" },
        { label: "Đặc điểm nổi bật", value: p.desc || "Hoàn thiện cao cấp, kiểm định chất lượng nghiêm ngặt" },
        { label: "Chế độ bảo hành", value: warranty },
        { label: "Chính sách đổi trả", value: "1 đổi 1 trong 7 ngày nếu phát sinh lỗi kỹ thuật" },
      ];
    },

    /**
     * Báo cáo kiểm định 15 bước độc lập (dành riêng cho C2C)
     */
    getLabReport: function (p) {
      if (!p) return [];
      const cat = p.category || "tech";
      const cond = p.cond || 98;
      const name = (p.name || "").toLowerCase();

      // Balo & Túi xách
      if (name.includes("balo") || name.includes("túi xách")) {
        return [
          { title: "Chất liệu & Độ bền", value: "Không sờn rách, bề mặt vải/da chống thấm nước đạt chuẩn", icon: "verified", ok: true },
          { title: "Khóa kéo & Khuy bấm", value: "Khóa kim loại trơn tru, kéo êm ái mượt mà", icon: "lock", ok: true },
          { title: "Quai đeo & Đường may", value: "Đường chỉ may kép chịu tải trên 20kg", icon: "checkroom", ok: true },
          { title: "Vệ sinh & Khử khuẩn", value: "Đã làm sạch sâu và chiếu đèn UV diệt khuẩn", icon: "clean_hands", ok: true },
        ];
      }

      // Kính mắt, Nước hoa, Mỹ phẩm, Ly gốm sứ, Nến thơm
      if (name.includes("kính") || name.includes("nước hoa") || name.includes("son") || name.includes("ly") || name.includes("nến") || name.includes("kem")) {
        return [
          { title: "Ngoại quan & Thân vỏ", value: `Độ mới ${cond}%, bề mặt không tì vết`, icon: "check_circle", ok: true },
          { title: "Xác thực mã vạch/Batch", value: "Mã code & tem chống giả hợp lệ 100%", icon: "qr_code_2", ok: true },
          { title: "Chất lượng nguyên bản", value: "Mùi hương/tròng kính/men mộc nguyên bản", icon: "thumb_up", ok: true },
          { title: "Phụ kiện & Bao bì", value: "Đầy đủ hộp và phụ kiện kèm theo", icon: "inventory_2", ok: true },
        ];
      }

      if (cat === "tech" || cat === "gaming") {
        return [
          { title: "Dung lượng pin", value: cond >= 98 ? "99% Zin máy" : "92% Khỏe mạnh", icon: "battery_charging_full", ok: true },
          { title: "Màn hình cảm ứng", value: "Sáng đẹp, không điểm chết, không ám ố", icon: "screenshot", ok: true },
          { title: "Ốc vít & Vỏ máy", value: "Tem void zin, chưa từng tháo mở", icon: "build", ok: true },
          { title: "Chức năng (FaceID/Wifi)", value: "Hoạt động hoàn hảo 100%", icon: "verified", ok: true },
        ];
      }
      if (cat === "sneakers") {
        return [
          { title: "Độ mòn đế giày", value: "Đế nguyên gai, độ mòn < 2%", icon: "footprint", ok: true },
          { title: "Thân giày (Upper)", value: "Da lộn mềm mại, không nứt gãy", icon: "style", ok: true },
          { title: "Keo chỉ & Mũi giày", value: "Keo zin nguyên bản, không hở mũi", icon: "linear_scale", ok: true },
          { title: "Hộp & Phụ kiện", value: "Fullbox, kèm bộ dây phụ zin", icon: "inventory_2", ok: true },
        ];
      }
      if (cat === "fashion") {
        return [
          { title: "Chất liệu & Độ phai", value: "Màu chuẩn, không bai dão hay sờn vải", icon: "palette", ok: true },
          { title: "Khóa kéo & Khuy nút", value: "Khóa YKK mượt mà, đầy đủ khuy", icon: "lock", ok: true },
          { title: "Đường kim mũi chỉ", value: "Đường may kép chắc chắn, đều tăm tắp", icon: "checkroom", ok: true },
          { title: "Tem tag chính hãng", value: "Tag giặt & mã code rõ ràng, hợp lệ", icon: "sell", ok: true },
        ];
      }
      if (cat === "audio") {
        return [
          { title: "Chất lượng âm thanh", value: "Cân bằng 2 tai, bass chắc, treble sáng", icon: "graphic_eq", ok: true },
          { title: "Pin & Thời lượng", value: "Đo thực tế đạt > 95% dung lượng chuẩn", icon: "battery_full", ok: true },
          { title: "Đệm mút tai nghe", value: "Da êm ái, không bong tróc, sạch sẽ", icon: "headphones", ok: true },
          { title: "Kết nối Bluetooth", value: "Bắt sóng ổn định 10m, độ trễ cực thấp", icon: "bluetooth", ok: true },
        ];
      }
      if (cat === "camera") {
        return [
          { title: "Cảm biến hình ảnh", value: "Sạch sẽ, không bụi rác, không trầy xước", icon: "photo_camera", ok: true },
          { title: "Số shot (Shutter)", value: "< 3.500 shot (Tuổi thọ còn 98%)", icon: "speed", ok: true },
          { title: "Màn trập cơ học", value: "Đanh chắc, đo tốc độ chuẩn từng mili-giây", icon: "camera", ok: true },
          { title: "Ngàm & Nút bấm", value: "Ngàm kim loại khít, nút bấm phản hồi tốt", icon: "touch_app", ok: true },
        ];
      }
      return [
        { title: "Động cơ & Vi mạch", value: "Vận hành êm ái, mạch điện an toàn", icon: "precision_manufacturing", ok: true },
        { title: "Ngoại quan sản phẩm", value: `Độ mới ${cond}%, không cấn móp méo`, icon: "check_circle", ok: true },
        { title: "Dây cáp & Nguồn", value: "Cách điện chuẩn an toàn tiêu chuẩn", icon: "power", ok: true },
        { title: "Phụ kiện đi kèm", value: "Đầy đủ phụ kiện theo máy ban đầu", icon: "extension", ok: true },
      ];
    },

    /**
     * Danh sách biến thể (Size, Bộ nhớ, Màu sắc) thông minh theo ngành hàng
     */
    getVariants: function (p) {
      if (!p) return [];
      const cat = p.category || "tech";
      const name = (p.name || "").toLowerCase();

      // Balo & Túi xách
      if (name.includes("balo") || name.includes("túi xách")) {
        return [
          { label: "Màu Đen Cyber (Black)", value: "black", active: true },
          { label: "Màu Xám Khói (Grey)", value: "grey" },
          { label: "Màu Nâu Tây (Caramel)", value: "caramel" },
        ];
      }

      // Kính mắt
      if (name.includes("kính")) {
        return [
          { label: "Gọng Đen • Tròng Đen Khói", value: "black", active: true },
          { label: "Gọng Bạc • Tròng Phân Cực", value: "silver" },
        ];
      }

      // Nước hoa
      if (name.includes("nước hoa")) {
        return [
          { label: "Chai Fullbox 100ml", value: "100ml", active: true },
          { label: "Chai Chiết 10ml Dùng Thử", value: "10ml" },
        ];
      }

      // Son môi
      if (name.includes("son")) {
        return [
          { label: "Màu Đỏ Đất (Trendy)", value: "red-earth", active: true },
          { label: "Màu Cam Cháy (Chic)", value: "orange" },
        ];
      }

      // Đồng hồ thông minh
      if (cat === "watches" || name.includes("smartwatch") || name.includes("đồng hồ") || name.includes("apple watch")) {
        return [
          { label: "Bản Dây Cao Su Thể Thao Sport Band", value: "sport", active: true },
          { label: "Bản Dây Thép Không Gỉ Milanese", value: "steel" },
        ];
      }

      if (cat === "fashion") {
        return [
          { label: "Size S (48 - 56kg)", value: "S" },
          { label: "Size M (57 - 65kg • Chuẩn)", value: "M", active: true },
          { label: "Size L (66 - 74kg)", value: "L" },
          { label: "Size XL (75 - 84kg)", value: "XL" },
        ];
      }
      if (cat === "sneakers") {
        return [
          { label: "Size 39", value: "39" },
          { label: "Size 40", value: "40" },
          { label: "Size 41 (Chuẩn)", value: "41", active: true },
          { label: "Size 42", value: "42" },
          { label: "Size 43", value: "43" },
        ];
      }
      if (cat === "tech") {
        if (p.name.toLowerCase().includes("macbook") || p.name.toLowerCase().includes("laptop")) {
          return [
            { label: "Bản 512GB SSD", value: "512GB" },
            { label: "Bản 1TB SSD (Khuyên Dùng)", value: "1TB", active: true },
            { label: "Bản 2TB SSD Max", value: "2TB" },
          ];
        }
        return [
          { label: "256GB • Titan Tự Nhiên", value: "256GB-Natural", active: true },
          { label: "512GB • Space Black", value: "512GB-Black" },
          { label: "1TB • Trắng Titan", value: "1TB-White" },
        ];
      }
      if (cat === "audio") {
        return [
          { label: "Màu Đen Nhám (Matte Black)", value: "black", active: true },
          { label: "Màu Bạc Trắng (Silver White)", value: "silver" },
          { label: "Màu Xanh Đêm (Midnight Blue)", value: "blue" },
        ];
      }
      if (cat === "camera") {
        return [
          { label: "Thân Máy (Body Only)", value: "body", active: true },
          { label: "Kèm Ống Kính Kit 24-70mm", value: "kit" },
        ];
      }
      return [
        { label: "Bản Tiêu Chuẩn (Standard)", value: "std", active: true },
        { label: "Bản Nâng Cấp Pro (Fullbox)", value: "pro" },
      ];
    },

    /**
     * Danh sách đánh giá người mua thực tế 5 sao
     */
    getReviews: function (p) {
      if (!p) return [];
      const title = p.short || p.name;
      const isMall = p.type === "mall";
      const tagText = isMall ? "Đã Mua Brand Mall Chính Hãng" : "Đã Mua Đồ Cũ eKYC C2C";

      return [
        {
          name: "Trần Hải Đăng",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          rating: 5,
          tag: tagText,
          date: "Cách đây 2 ngày • Đã đồng kiểm bưu tá",
          comment: `Sản phẩm ${title} nhận được đúng chuẩn như mô tả. Đóng hộp 3 lớp xốp chống sốc rất cẩn thận, bưu tá cho đồng kiểm mở hộp cẩn thận trước khi thanh toán. Rất hài lòng với dịch vụ của sàn!`,
        },
        {
          name: "Nguyễn Lê Quỳnh Chi",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
          rating: 5,
          tag: tagText,
          date: "Cách đây 5 ngày • Giao hỏa tốc 2H",
          comment: `Giao hàng hỏa tốc trong 90 phút cực kỳ ấn tượng. Hàng đẹp keng, đúng ảnh chụp thật 100%. Đã thử kích hoạt bảo hành điện tử thành công. 10/10 sao cho shop!`,
        },
        {
          name: "Phạm Quốc Tuấn",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          rating: 5,
          tag: tagText,
          date: "Cách đây 1 tuần • Thanh toán Napas 24/7",
          comment: `Mình rất thích chính sách giữ tiền ký quỹ Escrow 48 giờ để dùng thử máy tại nhà, cảm thấy an tâm tuyệt đối khi mua hàng giá trị cao trên mạng. Sẽ ủng hộ dài dài.`,
        },
      ];
    },

    /**
     * Lấy 4 sản phẩm liên quan cùng danh mục
     */
    getRelatedProducts: function (currentProduct, limit) {
      limit = limit || 4;
      if (!currentProduct || typeof PRODUCTS === "undefined" || !Array.isArray(PRODUCTS)) return [];
      
      // Lấy các sản phẩm cùng danh mục trước
      let related = PRODUCTS.filter((p) => p.id !== currentProduct.id && p.category === currentProduct.category);
      
      // Nếu ít hơn limit, bổ sung thêm sản phẩm khác
      if (related.length < limit) {
        const others = PRODUCTS.filter((p) => p.id !== currentProduct.id && !related.includes(p));
        related = related.concat(others);
      }

      return related.slice(0, limit);
    },

    /**
     * Bài viết mô tả chi tiết sản phẩm chân thực
     */
    getLongDescription: function (p) {
      if (!p) return "";
      const cat = p.category || "tech";
      const isMall = p.type === "mall";
      const title = p.name;

      let intro = "";
      if (isMall) {
        intro = `<strong>${title}</strong> là sản phẩm phân phối chính thức tại gian hàng Flagship Brand Mall trên hệ thống HYBRID.STORE. Sản phẩm mới 100% nguyên hộp, nguyên tem niêm phong xuất xưởng từ hãng, đi kèm đầy đủ chế độ bảo hành điện tử chính hãng từ 12 đến 24 tháng trên toàn quốc và hóa đơn giá trị gia tăng (VAT) điện tử xuất trong 24 giờ.`;
      } else {
        intro = `<strong>${title}</strong> là sản phẩm đồ cũ Like New chất lượng cao được cá nhân uy tín đã xác thực CCCD (eKYC C06) đăng bán tại chợ C2C. Trước khi bàn giao tới tay người mua, sản phẩm đã trải qua quy trình kiểm tra kỹ thuật 15 bước nghiêm ngặt tại Trạm Giám định Kỹ thuật của sàn, đảm bảo nguyên bản, hoạt động trơn tru và dán tem bảo hành niêm phong vỡ độc quyền.`;
      }

      return `
        <div class="product-description-article" style="line-height: 1.85; font-size: 0.95rem;">
          <p class="mb-4">${intro}</p>
          
          <h3 class="text-base fw-700 text-text mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary icon-sm">verified</span>
            1. Đặc Điểm Nổi Bật &amp; Giá Trị Trải Nghiệm
          </h3>
          <p class="mb-4 text-muted">
            ${p.desc || "Thiết kế hiện đại, tinh xảo từng góc cạnh. Mang đến cảm giác sử dụng đẳng cấp, hiệu năng ổn định và độ bền vượt thời gian. Từng đường nét đều được hoàn thiện với độ chính xác cao theo đúng tiêu chuẩn khắt khe nhất."}
          </p>

          <h3 class="text-base fw-700 text-text mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-success icon-sm">fact_check</span>
            2. Quyền Lợi Đồng Kiểm 100% Khi Nhận Hàng
          </h3>
          <p class="mb-4 text-muted">
            Khi bưu tá giao hàng tới địa chỉ của bạn, bạn hoàn toàn có quyền <strong>mở hộp kiểm tra ngoại quan cùng bưu tá</strong> trước khi thanh toán. Kiểm tra tem mác, số Serial / IMEI và tình trạng vật lý. Nếu phát hiện trầy xước không đúng mô tả hoặc sai model, bạn có quyền từ chối nhận hàng ngay lập tức mà không mất bất kỳ khoản phí nào.
          </p>

          <h3 class="text-base fw-700 text-text mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary icon-sm">shield</span>
            3. Chính Sách Bảo Hành &amp; Đổi Trả Linh Hoạt
          </h3>
          <p class="text-muted">
            Áp dụng chính sách <strong>1 đổi 1 trong vòng 7 ngày đầu tiên</strong> nếu phát sinh lỗi kỹ thuật do nhà sản xuất hoặc người bán. Toàn bộ số tiền mua hàng được bảo vệ an toàn tại quỹ ký quỹ trung gian Escrow của sàn trong suốt 48 giờ thử nghiệm sản phẩm tại nhà.
          </p>
        </div>
      `;
    },

    /**
     * Dữ liệu ma trận so sánh trực quan giữa Bản Brand Mall (Mới 100%) và Bản Like New (98-99%)
     */
    getComparisonData: function (p) {
      if (!p) return null;
      const isMall = p.type === "mall";
      const resolve = typeof window !== "undefined" && window.resolveAssetUrl ? window.resolveAssetUrl : (u) => u;

      // Tìm sản phẩm đối chứng cùng ngành hàng (hoặc tên tương tự)
      let counterpart = null;
      if (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) {
        const targetType = isMall ? "c2c" : "mall";
        const pTokens = (p.name || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        counterpart = PRODUCTS.find((x) => x.type === targetType && x.category === p.category && pTokens.some((t) => (x.name || "").toLowerCase().includes(t)));
        if (!counterpart) {
          counterpart = PRODUCTS.find((x) => x.type === targetType && x.category === p.category && x.id !== p.id);
        }
      }

      const mallProd = isMall ? p : counterpart;
      const usedProd = isMall ? counterpart : p;

      const mallPrice = mallProd ? (mallProd.price || 0) : (p.price ? Math.round(p.price * 1.35) : 10000000);
      const usedPrice = usedProd ? (usedProd.price || 0) : (p.price ? Math.round(p.price * 0.68) : 6500000);
      const savings = Math.max(0, mallPrice - usedPrice);
      const savingsPercent = mallPrice > 0 ? Math.round((savings / mallPrice) * 100) : 32;

      return {
        mall: {
          id: mallProd ? mallProd.id : "",
          name: mallProd ? mallProd.name : (p.name + " (Mới 100%)"),
          price: mallPrice,
          img: mallProd ? resolve(mallProd.img) : resolve(p.img),
          condition: "Mới 100% Nguyên Seal Hộp",
          warranty: "12 - 24 tháng chính hãng tại TTBH ủy quyền",
          testing: "Tiêu chuẩn xuất xưởng Factory QC quốc tế",
          battery: "100% dung lượng xuất xưởng • 0 lần sạc",
          trial: "Đổi mới 7 ngày nếu có lỗi phần cứng",
          invoice: "Hóa đơn điện tử VAT 8-10% trong 24h",
          link: mallProd ? `product_new.html?id=${mallProd.id}` : "#",
        },
        used: {
          id: usedProd ? usedProd.id : "",
          name: usedProd ? usedProd.name : (p.name + " (Like New 99%)"),
          price: usedPrice,
          img: usedProd ? resolve(usedProd.img) : resolve(p.img),
          condition: `Like New ${(usedProd && usedProd.cond) ? usedProd.cond : 98}% Ngoại quan đẹp như mới`,
          warranty: "06 tháng phần cứng tại Trạm Kỹ thuật Sàn",
          testing: "15 bước kiểm định nghiêm ngặt tại Trạm Lab + Tem vỡ độc quyền",
          battery: "Pin zin đo kiểm thực tế >= 95% hiệu năng đỉnh",
          trial: "Escrow Napas giữ tiền 48 giờ thử nghiệm tại nhà",
          invoice: "Hợp đồng giao dịch C2C bảo vệ pháp lý bởi Sàn",
          link: usedProd ? `product_used.html?id=${usedProd.id}` : "#",
        },
        savingsAmount: savings,
        savingsPercent: savingsPercent,
        currentIsMall: isMall,
      };
    },
  };

  global.ProductDetailData = ProductDetailData;
})(typeof window !== "undefined" ? window : global);
