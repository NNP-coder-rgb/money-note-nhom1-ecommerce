/**
 * sw.js — Service Worker cho HYBRID.STORE (PWA & Tự động làm mới Cache)
 * Phiên bản: v20261123_v25 (Chuẩn hóa 100% khớp tên gọi, hình ảnh và thông số kỹ thuật sản phẩm)
 */
const CACHE_NAME = "hybrid-store-v20261123_v25";

self.addEventListener("install", (e) => {
  // Lập tức kích hoạt Service Worker mới không chờ đợi
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Tự động xóa sạch toàn bộ các phiên bản Cache cũ (đặc biệt là hybrid-store-v1)
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log("[ServiceWorker] Đang xóa bộ nhớ đệm cũ:", key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Bỏ qua các request không phải GET hoặc không thuộc giao thức http/https
  if (e.request.method !== "GET" || !e.request.url.startsWith("http")) {
    return;
  }

  // CHIẾN LƯỢC NETWORK-FIRST CHO TOÀN BỘ YÊU CẦU:
  // Luôn luôn gửi request lên máy chủ Render để lấy phiên bản mã nguồn mới nhất.
  // Tuyệt đối không phục vụ file HTML hay JS cũ từ ổ đĩa khi có mạng.
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        // Chỉ khi mất mạng hoàn toàn (offline) mới tìm trong cache dự phòng
        return caches.match(e.request);
      })
  );
});
