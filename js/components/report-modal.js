// =================================================================
// GameConnect — Component Modal & Nút Báo Cáo Vi Phạm Dùng Chung
// =================================================================
// Hỗ trợ báo cáo 4 loại đối tượng: USER, POST, COMMENT, TEAM_POST
// với danh sách lý do chọn sẵn, chống báo cáo trùng lặp (1 lần / đối tượng).
// =================================================================

const ReportModal = (() => {
  const PREDEFINED_REASONS = [
    {
      value: "SPAM",
      label: "Spam / Quảng cáo rác",
      desc: "Nội dung quảng cáo rác, tin nhắn lặp lại hoặc làm phiền",
      icon: "fa-bullhorn",
    },
    {
      value: "HARASSMENT",
      label: "Quấy rối / Đe dọa",
      desc: "Công kích cá nhân, bắt nạt, đe dọa hoặc có hành vi thô lỗ",
      icon: "fa-user-slash",
    },
    {
      value: "HATE_SPEECH",
      label: "Ngôn từ thù địch",
      desc: "Chửi bới, phân biệt đối xử, xúc phạm danh dự nhân phẩm",
      icon: "fa-comment-slash",
    },
    {
      value: "INAPPROPRIATE_CONTENT",
      label: "Nội dung phản cảm",
      desc: "Hình ảnh hoặc từ ngữ bạo lực, nhạy cảm, không phù hợp",
      icon: "fa-triangle-exclamation",
    },
    {
      value: "SCAM",
      label: "Lừa đảo / Gian lận",
      desc: "Hack, cheat, mạo danh người khác hoặc hành vi gian lận",
      icon: "fa-shield-halved",
    },
    {
      value: "OTHER",
      label: "Lý do khác",
      desc: "Các hành vi khác vi phạm tiêu chuẩn cộng đồng GameConnect",
      icon: "fa-circle-question",
    },
  ];

  const TARGET_TYPE_LABELS = {
    USER: "Tài khoản người chơi",
    POST: "Bài viết cộng đồng",
    COMMENT: "Bình luận",
    TEAM_POST: "Bài tìm đồng đội",
  };

  let _currentTarget = null;
  let _isSubmitting = false;

  function ensureStyles() {
    if (document.getElementById("gc-report-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "gc-report-modal-styles";
    style.textContent = `
      .gc-report-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(8, 10, 16, 0.78);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: gcReportFadeIn 0.2s ease-out;
      }
      .gc-report-overlay[hidden] {
        display: none !important;
      }
      .gc-report-modal {
        background: #141722;
        border: 1px solid #282d3e;
        border-radius: 18px;
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
        color: #f1f5f9;
        display: flex;
        flex-direction: column;
        animation: gcReportSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes gcReportFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes gcReportSlideUp {
        from { opacity: 0; transform: translateY(18px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .gc-report-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #242938;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        background: #141722;
        z-index: 2;
      }
      .gc-report-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .gc-report-icon-badge {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.25);
        color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }
      .gc-report-title {
        font-size: 17px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        line-height: 1.3;
      }
      .gc-report-subtitle {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .gc-report-close-btn {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 18px;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        transition: all 0.15s;
        line-height: 1;
      }
      .gc-report-close-btn:hover {
        color: #ffffff;
        background: #1e2333;
      }
      .gc-report-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .gc-report-target-box {
        background: #1a1e2d;
        border: 1px solid #282f44;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 12.5px;
        color: #cbd5e1;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .gc-report-target-tag {
        background: rgba(249, 115, 22, 0.15);
        color: #fb923c;
        border: 1px solid rgba(249, 115, 22, 0.3);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        flex-shrink: 0;
      }
      .gc-report-target-desc {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
      }
      .gc-report-section-label {
        font-size: 13px;
        font-weight: 600;
        color: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .gc-report-reasons-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .gc-report-reason-item {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid #242938;
        background: #161926;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .gc-report-reason-item:hover {
        background: #1c2030;
        border-color: #384058;
      }
      .gc-report-reason-item.is-selected {
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.45);
      }
      .gc-report-reason-item input[type="radio"] {
        accent-color: #ef4444;
        margin-top: 3px;
        cursor: pointer;
      }
      .gc-report-reason-content {
        flex: 1;
      }
      .gc-report-reason-title {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gc-report-reason-item.is-selected .gc-report-reason-title {
        color: #fca5a5;
      }
      .gc-report-reason-desc {
        font-size: 11.5px;
        color: #64748b;
        margin-top: 2px;
        line-height: 1.35;
      }
      .gc-report-textarea {
        width: 100%;
        background: #161926;
        border: 1px solid #282f44;
        border-radius: 12px;
        padding: 10px 14px;
        color: #f1f5f9;
        font-size: 13px;
        font-family: inherit;
        resize: vertical;
        min-height: 72px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }
      .gc-report-textarea:focus {
        border-color: #f97316;
      }
      .gc-report-error-box {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 12.5px;
        color: #f87171;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gc-report-error-box[hidden] {
        display: none !important;
      }
      .gc-report-footer {
        padding: 16px 24px 20px;
        border-top: 1px solid #242938;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        background: #141722;
        border-radius: 0 0 18px 18px;
      }
      .gc-report-btn-cancel {
        background: transparent;
        border: 1px solid #333a4d;
        color: #94a3b8;
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .gc-report-btn-cancel:hover {
        background: #1e2333;
        color: #ffffff;
      }
      .gc-report-btn-submit {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border: none;
        color: #ffffff;
        padding: 8px 20px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
        transition: all 0.15s;
      }
      .gc-report-btn-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(239, 68, 68, 0.45);
      }
      .gc-report-btn-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .gc-report-btn-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: gcReportSpin 0.6s linear infinite;
      }
      @keyframes gcReportSpin {
        to { transform: rotate(360deg); }
      }
      /* Nút kích hoạt báo cáo dùng chung */
      .gc-report-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.15s;
      }
      .gc-report-btn:hover {
        color: #f87171;
        background: rgba(239, 68, 68, 0.1);
      }
      .gc-report-btn.is-reported {
        color: #64748b !important;
        cursor: default !important;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureModalDOM() {
    ensureStyles();
    let overlay = document.getElementById("gc-report-modal-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "gc-report-modal-overlay";
    overlay.className = "gc-report-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
      <div class="gc-report-modal" role="dialog" aria-modal="true" aria-labelledby="gc-report-title">
        <header class="gc-report-header">
          <div class="gc-report-title-wrap">
            <div class="gc-report-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
            </div>
            <div>
              <h2 class="gc-report-title" id="gc-report-title">Báo cáo vi phạm</h2>
              <div class="gc-report-subtitle">Giúp xây dựng cộng đồng GameConnect văn minh, lành mạnh</div>
            </div>
          </div>
          <button type="button" class="gc-report-close-btn" id="gc-report-close-btn" aria-label="Đóng">✕</button>
        </header>

        <form id="gc-report-form" novalidate>
          <div class="gc-report-body">
            <!-- Thông tin đối tượng -->
            <div class="gc-report-target-box" id="gc-report-target-box">
              <span class="gc-report-target-tag" id="gc-report-target-tag">NỘI DUNG</span>
              <span class="gc-report-target-desc" id="gc-report-target-desc">#123</span>
            </div>

            <!-- Danh sách lý do chọn sẵn -->
            <div>
              <div class="gc-report-section-label" style="margin-bottom: 8px;">
                <span>Chọn lý do vi phạm <span style="color:#ef4444">*</span></span>
              </div>
              <div class="gc-report-reasons-list" id="gc-report-reasons-list">
                ${PREDEFINED_REASONS.map((r, i) => `
                  <label class="gc-report-reason-item ${i === 0 ? "is-selected" : ""}">
                    <input type="radio" name="gc_report_reason" value="${r.value}" ${i === 0 ? "checked" : ""}>
                    <div class="gc-report-reason-content">
                      <div class="gc-report-reason-title">
                        <span>${r.label}</span>
                      </div>
                      <div class="gc-report-reason-desc">${r.desc}</div>
                    </div>
                  </label>
                `).join("")}
              </div>
            </div>

            <!-- Mô tả chi tiết -->
            <div>
              <div class="gc-report-section-label" style="margin-bottom: 6px;">
                <span>Mô tả chi tiết <span style="color:#64748b; font-weight:400; font-size:11.5px">(tùy chọn)</span></span>
                <span id="gc-report-char-count" style="color:#64748b; font-size:11px">0/500</span>
              </div>
              <textarea
                class="gc-report-textarea"
                id="gc-report-desc"
                placeholder="Cung cấp thêm ngữ cảnh hoặc chi tiết vi phạm để hỗ trợ ban quản trị xem xét..."
                maxlength="500"
              ></textarea>
            </div>

            <!-- Hộp báo lỗi -->
            <div class="gc-report-error-box" id="gc-report-error-box" hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span id="gc-report-error-msg">Lỗi gửi báo cáo</span>
            </div>
          </div>

          <footer class="gc-report-footer">
            <button type="button" class="gc-report-btn-cancel" id="gc-report-cancel-btn">Hủy bỏ</button>
            <button type="submit" class="gc-report-btn-submit" id="gc-report-submit-btn">
              <span>Gửi báo cáo</span>
            </button>
          </footer>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    // Gắn sự kiện radio item active style
    const reasonItems = overlay.querySelectorAll(".gc-report-reason-item");
    reasonItems.forEach((item) => {
      item.addEventListener("click", () => {
        reasonItems.forEach((it) => it.classList.remove("is-selected"));
        item.classList.add("is-selected");
        const radio = item.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
      });
    });

    // Char counter
    const textarea = document.getElementById("gc-report-desc");
    const charCount = document.getElementById("gc-report-char-count");
    if (textarea && charCount) {
      textarea.addEventListener("input", () => {
        charCount.textContent = `${textarea.value.length}/500`;
      });
    }

    // Nút đóng / hủy
    document.getElementById("gc-report-close-btn")?.addEventListener("click", close);
    document.getElementById("gc-report-cancel-btn")?.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) close();
    });

    // Submit form
    document.getElementById("gc-report-form")?.addEventListener("submit", _handleSubmit);

    return overlay;
  }

  function _showError(msg) {
    const errorBox = document.getElementById("gc-report-error-box");
    const errorMsg = document.getElementById("gc-report-error-msg");
    if (errorBox && errorMsg) {
      errorMsg.textContent = msg;
      errorBox.hidden = false;
    }
  }

  function _hideError() {
    const errorBox = document.getElementById("gc-report-error-box");
    if (errorBox) errorBox.hidden = true;
  }

  async function _handleSubmit(e) {
    e.preventDefault();
    if (_isSubmitting || !_currentTarget) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      _showError("Bạn cần đăng nhập để có thể gửi báo cáo vi phạm.");
      return;
    }

    const form = document.getElementById("gc-report-form");
    const reasonInput = form.querySelector("input[name='gc_report_reason']:checked");
    const reason = reasonInput ? reasonInput.value : "SPAM";
    const description = (document.getElementById("gc-report-desc")?.value || "").trim();

    const submitBtn = document.getElementById("gc-report-submit-btn");
    _isSubmitting = true;
    _hideError();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="gc-report-btn-spinner"></div><span>Đang gửi...</span>`;
    }

    try {
      const payload = {
        target_type: _currentTarget.targetType,
        target_id: Number(_currentTarget.targetId),
        reason: reason,
        description: description || null,
      };

      let response;
      if (typeof api !== "undefined" && typeof api.post === "function") {
        response = await api.post("/reports", payload);
      } else if (typeof http !== "undefined" && typeof http.post === "function") {
        const res = await http.post("/reports", payload);
        response = res.data;
      } else {
        const res = await fetch("http://127.0.0.1:8000/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Lỗi ${res.status}`);
        }
        response = await res.json();
      }

      // Đánh dấu đối tượng này đã được báo cáo trong session / DOM
      _markTargetAsReported(_currentTarget.targetType, _currentTarget.targetId);

      close();

      const successMsg = "Báo cáo của bạn đã được gửi thành công! Ban quản trị sẽ sớm xem xét và xử lý.";
      if (typeof showToast === "function") {
        showToast(successMsg, "success");
      } else {
        alert(successMsg);
      }
    } catch (err) {
      console.error("Lỗi gửi báo cáo:", err);
      const status = err?.status || err?.response?.status;
      const detail = err?.data?.detail || err?.response?.data?.detail || err?.message || "";

      if (status === 409 || detail.includes("đã báo cáo")) {
        _showError("Bạn đã báo cáo đối tượng này rồi. Mỗi người chỉ được báo cáo một đối tượng một lần.");
        _markTargetAsReported(_currentTarget.targetType, _currentTarget.targetId);
      } else if (status === 400 || detail.includes("chính mình")) {
        _showError(detail || "Bạn không thể tự báo cáo nội dung của chính mình.");
      } else {
        _showError(detail || "Không thể gửi báo cáo lúc này. Vui lòng thử lại sau.");
      }
    } finally {
      _isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Gửi báo cáo</span>`;
      }
    }
  }

  function _markTargetAsReported(targetType, targetId) {
    try {
      const key = `gc_reported_${targetType}_${targetId}`;
      sessionStorage.setItem(key, "true");
    } catch (_) {}

    document.querySelectorAll(`[data-report-type="${targetType}"][data-report-id="${targetId}"], [data-target-type="${targetType}"][data-target-id="${targetId}"]`).forEach((btn) => {
      btn.classList.add("is-reported");
      btn.setAttribute("title", "Bạn đã báo cáo nội dung này");
      const icon = btn.querySelector("svg, i");
      if (icon) icon.style.opacity = "0.5";
    });
  }

  function isReported(targetType, targetId) {
    try {
      return sessionStorage.getItem(`gc_reported_${targetType}_${targetId}`) === "true";
    } catch (_) {
      return false;
    }
  }

  /**
   * Mở modal báo cáo vi phạm
   * @param {Object} options
   * @param {'USER'|'POST'|'COMMENT'|'TEAM_POST'} options.targetType Loại đối tượng cần báo cáo
   * @param {number|string} options.targetId ID của đối tượng
   * @param {string} [options.targetTitle] Tiêu đề hoặc nội dung tóm tắt hiển thị
   * @param {string} [options.targetOwner] Tên người tạo / sở hữu đối tượng
   */
  function open(options = {}) {
    const { targetType, targetId, targetTitle = "", targetOwner = "" } = options;
    if (!targetType || !targetId) {
      console.warn("ReportModal.open cần có targetType và targetId!");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      if (confirm("Bạn cần đăng nhập để gửi báo cáo vi phạm. Bạn có muốn đến trang đăng nhập ngay không?")) {
        const inPages = window.location.pathname.includes("/pages/");
        window.location.href = (inPages ? "" : "pages/") + "login.html";
      }
      return;
    }

    _currentTarget = {
      targetType: String(targetType).toUpperCase(),
      targetId: Number(targetId),
      targetTitle,
      targetOwner,
    };

    const overlay = ensureModalDOM();
    _hideError();

    // Reset form
    const form = document.getElementById("gc-report-form");
    if (form) form.reset();
    const firstReason = overlay.querySelector(".gc-report-reason-item");
    overlay.querySelectorAll(".gc-report-reason-item").forEach((it) => it.classList.remove("is-selected"));
    if (firstReason) {
      firstReason.classList.add("is-selected");
      const radio = firstReason.querySelector("input[type='radio']");
      if (radio) radio.checked = true;
    }
    const charCount = document.getElementById("gc-report-char-count");
    if (charCount) charCount.textContent = "0/500";

    // Cập nhật thông tin đối tượng
    const tagEl = document.getElementById("gc-report-target-tag");
    const descEl = document.getElementById("gc-report-target-desc");
    const typeLabel = TARGET_TYPE_LABELS[_currentTarget.targetType] || _currentTarget.targetType;

    if (tagEl) tagEl.textContent = typeLabel;
    if (descEl) {
      let descText = `#${_currentTarget.targetId}`;
      if (targetTitle) descText += ` · ${targetTitle}`;
      if (targetOwner) descText += ` (bởi ${targetOwner})`;
      descEl.textContent = descText;
      descEl.title = descText;
    }

    if (isReported(_currentTarget.targetType, _currentTarget.targetId)) {
      _showError("Bạn đã gửi báo cáo đối tượng này trước đó trong phiên này.");
    }

    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    const overlay = document.getElementById("gc-report-modal-overlay");
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = "";
    _currentTarget = null;
  }

  /**
   * Tạo chuỗi HTML nút Báo cáo dùng chung
   */
  function createButtonHtml(options = {}) {
    const {
      targetType,
      targetId,
      targetTitle = "",
      targetOwner = "",
      className = "gc-report-btn",
      label = "Báo cáo",
      iconOnly = false,
    } = options;

    const reported = isReported(targetType, targetId);
    return `
      <button type="button"
              class="${className} ${reported ? "is-reported" : ""}"
              data-report-type="${targetType}"
              data-report-id="${targetId}"
              data-report-title="${encodeURIComponent(targetTitle)}"
              data-report-owner="${encodeURIComponent(targetOwner)}"
              title="${reported ? "Bạn đã báo cáo nội dung này" : "Báo cáo vi phạm"}"
              ${reported ? "disabled" : ""}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
        ${iconOnly ? "" : `<span>${label}</span>`}
      </button>
    `;
  }

  // Khởi tạo tự động bắt sự kiện click toàn cục
  function _initGlobalDelegation() {
    ensureStyles();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-report-type], .gc-report-btn, [data-action='report']");
      if (!btn) return;

      const targetType = btn.dataset.reportType || btn.dataset.targetType;
      const targetId = btn.dataset.reportId || btn.dataset.targetId || btn.dataset.id;
      if (!targetType || !targetId) return;

      e.preventDefault();
      e.stopPropagation();

      const rawTitle = btn.dataset.reportTitle || btn.dataset.targetTitle || btn.title || "";
      const rawOwner = btn.dataset.reportOwner || btn.dataset.targetOwner || "";

      let targetTitle = rawTitle;
      let targetOwner = rawOwner;
      try {
        if (rawTitle.includes("%")) targetTitle = decodeURIComponent(rawTitle);
      } catch (_) {}
      try {
        if (rawOwner.includes("%")) targetOwner = decodeURIComponent(rawOwner);
      } catch (_) {}

      open({
        targetType,
        targetId,
        targetTitle,
        targetOwner,
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _initGlobalDelegation, { once: true });
  } else {
    _initGlobalDelegation();
  }

  return {
    open,
    close,
    createButtonHtml,
    isReported,
    REASONS: PREDEFINED_REASONS,
  };
})();

window.ReportModal = ReportModal;
window.openReportModal = ReportModal.open;
