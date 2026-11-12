// popup.js — hộp thông báo dạng pop-up dùng chung (thay cho alert())
// Cách dùng:
//   showPopup({ type: 'success', title: 'Thành công!', message: '...', confirmText: 'Tiếp tục', onConfirm: () => {...} });
// type: 'success' | 'error' | 'warning' | 'info'
(function () {
  const ICONS = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };
  let backdrop, lastFocus, onCloseCb;

  function build() {
    backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML =
      '<div class="modal popup" role="dialog" aria-modal="true" aria-labelledby="popupTitle">' +
      '<div class="modal-body">' +
      '<div class="popup-icon" id="popupIcon"><span class="material-symbols-outlined"></span></div>' +
      '<h2 class="popup-title" id="popupTitle"></h2>' +
      '<p class="popup-msg" id="popupMsg"></p>' +
      "</div>" +
      '<div class="modal-foot">' +
      '<button type="button" class="btn btn-outlined" id="popupCancel">Đóng</button>' +
      '<button type="button" class="btn btn-primary" id="popupOk">OK</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closePopup();
    });
    backdrop
      .querySelector("#popupCancel")
      .addEventListener("click", closePopup);
    backdrop.querySelector("#popupOk").addEventListener("click", () => {
      const cb = onCloseCb;
      closePopup();
      if (cb) cb();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backdrop.classList.contains("is-open"))
        closePopup();
    });
  }

  window.showPopup = function (opts) {
    opts = opts || {};
    if (!backdrop) build();
    const type = ICONS[opts.type] ? opts.type : "info";

    const icon = backdrop.querySelector("#popupIcon");
    icon.className = "popup-icon is-" + type;
    icon.firstElementChild.textContent = ICONS[type];

    backdrop.querySelector("#popupTitle").textContent =
      opts.title || "Thông báo";
    backdrop.querySelector("#popupMsg").textContent = opts.message || "";
    backdrop.querySelector("#popupOk").textContent = opts.confirmText || "OK";
    backdrop
      .querySelector("#popupCancel")
      .classList.toggle("hidden", !opts.showCancel);
    onCloseCb = opts.onConfirm || null;

    lastFocus = document.activeElement;
    backdrop.classList.add("is-open");
    document.body.classList.add("modal-open");
    backdrop.querySelector("#popupOk").focus();
  };

  window.closePopup = function () {
    if (!backdrop) return;
    backdrop.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  };
})();
