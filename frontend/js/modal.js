/**
 * modal.js — Quản lý Modal cho dự án E-Commerce (Task TF2520C)
 * Dành cho sinh viên năm 2: JavaScript thuần, dễ hiểu, dễ mở rộng.
 *
 * Chức năng chính:
 * 1. Mở modal: Thêm class .is-open và khóa cuộn trang (body.modal-open).
 * 2. Đóng modal: Xóa class .is-open và khôi phục cuộn trang.
 * 3. Phím Esc: Tự động đóng modal đang mở.
 * 4. Đóng khi click ra ngoài vùng backdrop hoặc nút data-close.
 */

(function (window, document) {
  "use strict";

  /**
   * Mở modal theo ID hoặc Element
   * @param {string|HTMLElement} modalIdOrEl
   */
  function openModal(modalIdOrEl) {
    if (!modalIdOrEl) return;

    const el =
      typeof modalIdOrEl === "string"
        ? document.getElementById(modalIdOrEl) || document.querySelector(modalIdOrEl)
        : modalIdOrEl;

    if (!el) {
      console.warn("[Modal] Không tìm thấy modal:", modalIdOrEl);
      return;
    }

    // Nếu truyền vào hộp .modal bên trong thì tìm ra .modal-backdrop
    const backdrop = el.classList.contains("modal-backdrop")
      ? el
      : el.closest(".modal-backdrop") || el;

    backdrop.classList.add("is-open");
    document.body.classList.add("modal-open");

    // Tự động focus vào input đầu tiên nếu có
    const firstInput = backdrop.querySelector("input:not([type='hidden']), textarea, button.btn-primary");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  }

  /**
   * Đóng modal theo ID hoặc Element
   * @param {string|HTMLElement} modalIdOrEl
   */
  function closeModal(modalIdOrEl) {
    if (!modalIdOrEl) return;

    const el =
      typeof modalIdOrEl === "string"
        ? document.getElementById(modalIdOrEl) || document.querySelector(modalIdOrEl)
        : modalIdOrEl;

    if (!el) return;

    const backdrop = el.classList.contains("modal-backdrop")
      ? el
      : el.closest(".modal-backdrop") || el;

    backdrop.classList.remove("is-open");

    // Chỉ khôi phục cuộn trang khi không còn modal nào đang mở
    const remainingOpenModals = document.querySelectorAll(".modal-backdrop.is-open");
    if (remainingOpenModals.length === 0) {
      document.body.classList.remove("modal-open");
    }
  }

  /**
   * Đóng tất cả các modal đang mở
   */
  function closeAllModals() {
    const openModals = document.querySelectorAll(".modal-backdrop.is-open");
    openModals.forEach((modal) => modal.classList.remove("is-open"));
    document.body.classList.remove("modal-open");
  }

  // Lắng nghe sự kiện click trên toàn document (Event Delegation)
  document.addEventListener("click", function (event) {
    // 1. Nút mở modal qua thuộc tính data-open="modalId"
    const openTrigger = event.target.closest("[data-open]");
    if (openTrigger) {
      event.preventDefault();
      const targetId = openTrigger.getAttribute("data-open");
      openModal(targetId);
      return;
    }

    // 2. Nút đóng modal qua thuộc tính data-close hoặc class .modal-close
    const closeTrigger = event.target.closest("[data-close], .modal-close");
    if (closeTrigger) {
      event.preventDefault();
      const enclosingModal = closeTrigger.closest(".modal-backdrop");
      if (enclosingModal) {
        closeModal(enclosingModal);
      }
      return;
    }

    // 3. Click ra ngoài vùng modal (click trực tiếp vào nền .modal-backdrop)
    if (event.target.classList.contains("modal-backdrop")) {
      closeModal(event.target);
    }
  });

  // Lắng nghe phím Esc để đóng modal trên cùng
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Esc") {
      const openModals = document.querySelectorAll(".modal-backdrop.is-open");
      if (openModals.length > 0) {
        // Đóng modal mở gần nhất (phần tử cuối cùng)
        closeModal(openModals[openModals.length - 1]);
      }
    }
  });

  // Xuất API ra global window
  window.Modal = {
    open: openModal,
    close: closeModal,
    closeAll: closeAllModals,
  };
  window.openModal = openModal;
  window.closeModal = closeModal;
})(window, document);
