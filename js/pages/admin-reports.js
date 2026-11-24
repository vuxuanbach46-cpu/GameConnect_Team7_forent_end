// =================================================================
// GameConnect — Admin Reports Management Module
// Quản lý & xử lý báo cáo vi phạm cộng đồng
// =================================================================

const AdminReports = (() => {
  // ---- STATE ----
  let _reports = [];
  let _total = 0;
  let _skip = 0;
  const _limit = 10;
  let _currentStatus = "";     // "" = Tất cả, PENDING, RESOLVED, REJECTED
  let _currentTargetType = ""; // "" = Tất cả, USER, POST, COMMENT, TEAM_POST
  let _searchQuery = "";
  let _isLoading = false;

  // Thống kê đếm
  let _stats = {
    total: 0,
    pending: 0,
    resolved: 0,
    rejected: 0,
  };

  // Từ điển nhãn tiếng Việt
  const REASON_LABELS = {
    SPAM: "Spam / Quảng cáo rác",
    HARASSMENT: "Quấy rối / Đe doạ",
    HATE_SPEECH: "Ngôn từ thù ghét / Xúc phạm",
    INAPPROPRIATE_CONTENT: "Nội dung không phù hợp",
    SCAM: "Lừa đảo / Gian lận",
    OTHER: "Lý do khác",
  };

  const TARGET_LABELS = {
    USER: "Người dùng",
    POST: "Bài viết",
    COMMENT: "Bình luận",
    TEAM_POST: "Bài tìm đội",
  };

  const TARGET_ICONS = {
    USER: "fa-solid fa-user",
    POST: "fa-regular fa-newspaper",
    COMMENT: "fa-regular fa-comment-dots",
    TEAM_POST: "fa-solid fa-users",
  };

  // ---- TIỆN ÍCH ----
  function _escape(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function _formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " +
           d.toLocaleDateString("vi-VN");
  }

  function _timeAgo(dateStr) {
    if (!dateStr) return "—";
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return "Vừa xong";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return _formatDate(dateStr);
  }

  // Toast notification
  function _showToast(message, type = "success") {
    let container = document.getElementById("ar-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "ar-toast-container";
      container.className = "ar-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `ar-toast ${type}`;
    const icon = type === "success" ? "fa-solid fa-check" : type === "error" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-info";
    toast.innerHTML = `<i class="${icon}"></i> <span>${_escape(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ---- GỌI API ----
  async function _fetchReports() {
    _isLoading = true;
    _renderLoading();

    try {
      const params = {
        skip: _skip,
        limit: _limit,
      };
      if (_currentStatus) params.status = _currentStatus;
      if (_currentTargetType) params.target_type = _currentTargetType;

      const res = await api.get("/api/admin/reports", params);
      const data = res.data || res;
      _reports = data.items || [];
      _total = data.total || 0;

      // Tìm kiếm lọc client-side nếu người dùng nhập tìm kiếm
      if (_searchQuery) {
        const q = _searchQuery.toLowerCase();
        _reports = _reports.filter((r) =>
          String(r.id).includes(q) ||
          String(r.target_id).includes(q) ||
          (r.reporter_username && r.reporter_username.toLowerCase().includes(q)) ||
          (r.reason && r.reason.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q))
        );
      }

      _renderTable();
      _renderPagination();
      _updateStats();
    } catch (err) {
      console.error("Lỗi tải danh sách báo cáo:", err);
      _renderError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      _isLoading = false;
    }
  }

  // Cập nhật thống kê các tab
  async function _updateStats() {
    try {
      // Tải tổng số của từng trạng thái để làm badge thống kê
      const [allRes, pendingRes, resolvedRes, rejectedRes] = await Promise.allSettled([
        api.get("/api/admin/reports", { skip: 0, limit: 1 }),
        api.get("/api/admin/reports", { skip: 0, limit: 1, status: "PENDING" }),
        api.get("/api/admin/reports", { skip: 0, limit: 1, status: "RESOLVED" }),
        api.get("/api/admin/reports", { skip: 0, limit: 1, status: "REJECTED" }),
      ]);

      if (allRes.status === "fulfilled") _stats.total = allRes.value.data?.total || allRes.value.total || 0;
      if (pendingRes.status === "fulfilled") _stats.pending = pendingRes.value.data?.total || pendingRes.value.total || 0;
      if (resolvedRes.status === "fulfilled") _stats.resolved = resolvedRes.value.data?.total || resolvedRes.value.total || 0;
      if (rejectedRes.status === "fulfilled") _stats.rejected = rejectedRes.value.data?.total || rejectedRes.value.total || 0;

      const elTotal = document.getElementById("stat-total");
      const elPending = document.getElementById("stat-pending");
      const elResolved = document.getElementById("stat-resolved");
      const elRejected = document.getElementById("stat-rejected");

      if (elTotal) elTotal.textContent = _stats.total;
      if (elPending) elPending.textContent = _stats.pending;
      if (elResolved) elResolved.textContent = _stats.resolved;
      if (elRejected) elRejected.textContent = _stats.rejected;
    } catch (e) {
      console.warn("Không thể tải thống kê số lượng:", e);
    }
  }

  // Lấy chi tiết nội dung bị báo cáo (Live Content)
  async function _fetchReportedContent(targetType, targetId) {
    try {
      if (targetType === "POST") {
        const res = await api.get(`/posts/${targetId}`);
        return { success: true, data: res.data || res };
      } else if (targetType === "USER") {
        // Lấy thông tin user
        const res = await api.get(`/users/${targetId}`);
        return { success: true, data: res.data || res };
      } else if (targetType === "TEAM_POST") {
        const res = await api.get(`/team-posts/${targetId}`);
        return { success: true, data: res.data || res };
      } else if (targetType === "COMMENT") {
        // Comment thường nằm trong bài viết, nếu không có route trực tiếp thì trả target_id
        return { success: true, data: { comment_id: targetId, note: "Bình luận vi phạm #" + targetId } };
      }
    } catch (err) {
      return { success: false, error: err.message || "Nội dung không tồn tại hoặc đã bị xóa." };
    }
    return { success: false, error: "Không hỗ trợ loại nội dung này." };
  }

  // ---- RENDER GIAO DIỆN ----
  function _renderLoading() {
    const tbody = document.getElementById("ar-table-body");
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="ar-loading-state">
            <div class="ar-spinner"></div>
            <div>Đang tải danh sách báo cáo...</div>
          </div>
        </td>
      </tr>
    `;
  }

  function _renderError(message) {
    const tbody = document.getElementById("ar-table-body");
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="ar-empty-state">
            <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
            <h3>Đã xảy ra lỗi</h3>
            <p>${_escape(message)}</p>
            <button class="ar-btn ar-btn-secondary" style="margin-top: 14px;" onclick="AdminReports.refresh()">
              <i class="fa-solid fa-rotate"></i> Thử lại
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function _renderTable() {
    const tbody = document.getElementById("ar-table-body");
    if (!tbody) return;

    if (_reports.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="ar-empty-state">
              <i class="fa-regular fa-circle-check"></i>
              <h3>Không có báo cáo nào</h3>
              <p>Hiện không có báo cáo nào phù hợp với bộ lọc đã chọn.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = _reports.map((report) => {
      const isPending = report.status === "PENDING";
      const targetIcon = TARGET_ICONS[report.target_type] || "fa-solid fa-tag";
      const targetLabel = TARGET_LABELS[report.target_type] || report.target_type;
      const reasonLabel = REASON_LABELS[report.reason] || report.reason;
      const reporterInit = report.reporter_username ? report.reporter_username.charAt(0).toUpperCase() : "?";

      // Nút thao tác tương ứng theo loại đối tượng
      let specificActionBtn = "";
      if (isPending) {
        if (report.target_type === "POST") {
          specificActionBtn = `
            <button type="button" class="ar-btn-action btn-hide" title="Ẩn bài viết này"
              onclick="AdminReports.confirmAction('HIDE_POST', ${report.id}, ${report.target_id}, 'POST')">
              <i class="fa-regular fa-eye-slash"></i> Ẩn
            </button>
          `;
        } else if (report.target_type === "COMMENT") {
          specificActionBtn = `
            <button type="button" class="ar-btn-action btn-delete" title="Xóa bình luận này"
              onclick="AdminReports.confirmAction('DELETE_COMMENT', ${report.id}, ${report.target_id}, 'COMMENT')">
              <i class="fa-regular fa-trash-can"></i> Xóa
            </button>
          `;
        } else if (report.target_type === "USER") {
          specificActionBtn = `
            <button type="button" class="ar-btn-action btn-lock" title="Khóa tài khoản này"
              onclick="AdminReports.confirmAction('LOCK_USER', ${report.id}, ${report.target_id}, 'USER')">
              <i class="fa-solid fa-lock"></i> Khóa
            </button>
          `;
        }
      }

      return `
        <tr>
          <td>
            <span class="ar-report-id">#${report.id}</span>
          </td>
          <td>
            <div class="ar-user-cell">
              <div class="ar-avatar">${reporterInit}</div>
              <div>
                <div class="ar-username">${_escape(report.reporter_username || "ID: " + report.reporter_id)}</div>
                <div class="ar-user-sub">ID: ${report.reporter_id}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="ar-target-badge type-${report.target_type}">
              <i class="${targetIcon}"></i> ${targetLabel} #${report.target_id}
            </span>
          </td>
          <td>
            <div class="ar-reason-text">${_escape(reasonLabel)}</div>
            ${report.description ? `<div class="ar-desc-preview" title="${_escape(report.description)}">${_escape(report.description)}</div>` : ""}
          </td>
          <td>
            <span class="ar-status-badge status-${report.status}">
              <span class="ar-status-dot"></span>
              ${report.status === "PENDING" ? "Chờ xử lý" : report.status === "RESOLVED" ? "Đã xử lý" : "Đã bỏ qua"}
            </span>
          </td>
          <td>
            <span title="${_formatDate(report.created_at)}" style="font-size: 12.5px; color: var(--fc-text-muted);">
              ${_timeAgo(report.created_at)}
            </span>
          </td>
          <td>
            <div class="ar-actions-cell">
              <!-- Nút Xem chi tiết / nội dung -->
              <button type="button" class="ar-btn-action btn-view" title="Xem nội dung bị báo cáo"
                onclick="AdminReports.openDetailModal(${report.id})">
                <i class="fa-regular fa-eye"></i> Xem
              </button>

              ${specificActionBtn}

              ${isPending ? `
                <!-- Nút Bỏ qua báo cáo -->
                <button type="button" class="ar-btn-action btn-reject" title="Bỏ qua báo cáo (Không vi phạm)"
                  onclick="AdminReports.confirmAction('REJECT_REPORT', ${report.id}, ${report.target_id}, '${report.target_type}')">
                  <i class="fa-solid fa-xmark"></i> Bỏ qua
                </button>
              ` : ""}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function _renderPagination() {
    const infoEl = document.getElementById("ar-pagination-info");
    const controlsEl = document.getElementById("ar-pagination-controls");
    if (!infoEl || !controlsEl) return;

    const totalPages = Math.ceil(_total / _limit) || 1;
    const currentPage = Math.floor(_skip / _limit) + 1;
    const startItem = _total === 0 ? 0 : _skip + 1;
    const endItem = Math.min(_skip + _limit, _total);

    infoEl.innerHTML = `Hiển thị <strong>${startItem} - ${endItem}</strong> trên <strong>${_total}</strong> báo cáo`;

    let html = `
      <button class="ar-page-btn" ${currentPage <= 1 ? "disabled" : ""} onclick="AdminReports.goToPage(${currentPage - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 7 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
        if (p === 2 || p === totalPages - 1) {
          html += `<span style="padding: 0 4px; color: var(--fc-text-muted);">...</span>`;
        }
        continue;
      }
      html += `
        <button class="ar-page-btn ${p === currentPage ? "active" : ""}" onclick="AdminReports.goToPage(${p})">
          ${p}
        </button>
      `;
    }

    html += `
      <button class="ar-page-btn" ${currentPage >= totalPages ? "disabled" : ""} onclick="AdminReports.goToPage(${currentPage + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    controlsEl.innerHTML = html;
  }

  // ---- MODAL XEM NỘI DUNG CHI TIẾT (LIVE PREVIEW) ----
  async function openDetailModal(reportId) {
    const report = _reports.find((r) => r.id === reportId);
    if (!report) return;

    _closeModal();

    const backdrop = document.createElement("div");
    backdrop.id = "ar-modal-backdrop";
    backdrop.className = "ar-modal-backdrop";

    const targetLabel = TARGET_LABELS[report.target_type] || report.target_type;
    const reasonLabel = REASON_LABELS[report.reason] || report.reason;
    const isPending = report.status === "PENDING";

    backdrop.innerHTML = `
      <div class="ar-modal">
        <div class="ar-modal-header">
          <h2 class="ar-modal-title">
            <i class="fa-solid fa-shield-halved" style="color: var(--fc-orange);"></i>
            Chi tiết báo cáo #${report.id}
          </h2>
          <button type="button" class="ar-modal-close-btn" onclick="AdminReports.closeModal()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="ar-modal-body">
          <!-- Thông tin báo cáo -->
          <div class="ar-info-grid">
            <div class="ar-info-item">
              <span class="ar-info-label">Người báo cáo</span>
              <span class="ar-info-value">${_escape(report.reporter_username || "ID: " + report.reporter_id)} (ID: ${report.reporter_id})</span>
            </div>
            <div class="ar-info-item">
              <span class="ar-info-label">Đối tượng vi phạm</span>
              <span class="ar-info-value">
                <span class="ar-target-badge type-${report.target_type}">
                  ${targetLabel} #${report.target_id}
                </span>
              </span>
            </div>
            <div class="ar-info-item">
              <span class="ar-info-label">Thời gian báo cáo</span>
              <span class="ar-info-value">${_formatDate(report.created_at)}</span>
            </div>
            <div class="ar-info-item">
              <span class="ar-info-label">Trạng thái</span>
              <span class="ar-info-value">
                <span class="ar-status-badge status-${report.status}">
                  <span class="ar-status-dot"></span>
                  ${report.status === "PENDING" ? "Chờ xử lý" : report.status === "RESOLVED" ? "Đã xử lý" : "Đã bỏ qua"}
                </span>
              </span>
            </div>
          </div>

          <!-- Lý do & Mô tả của người gửi báo cáo -->
          <div class="ar-reported-reason-box">
            <div class="ar-reported-reason-header">
              <i class="fa-solid fa-triangle-exclamation"></i> Lý do vi phạm: ${_escape(reasonLabel)}
            </div>
            <div class="ar-reported-reason-body">
              ${report.description ? _escape(report.description) : "<em style='color: var(--fc-text-muted);'>Người báo cáo không để lại mô tả bổ sung.</em>"}
            </div>
          </div>

          <!-- Khung xem nội dung bị báo cáo (Live Fetch) -->
          <div class="ar-content-preview-box">
            <div class="ar-content-preview-header">
              <span class="ar-content-preview-title">
                <i class="fa-solid fa-magnifying-glass"></i> Nội dung bị báo cáo thực tế (${targetLabel} #${report.target_id})
              </span>
              <span id="ar-preview-loading" style="font-size: 11px; color: var(--fc-text-muted);">
                <i class="fa-solid fa-spinner fa-spin"></i> Đang tải nội dung...
              </span>
            </div>
            <div class="ar-content-preview-body" id="ar-preview-body">
              <!-- Nội dung sẽ được load động -->
            </div>
          </div>

          <!-- Kết quả đã xử lý (nếu có) -->
          ${!isPending ? `
            <div class="ar-info-grid" style="background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.2);">
              <div class="ar-info-item" style="grid-column: 1 / -1;">
                <span class="ar-info-label" style="color: #22c55e;">Kết quả xử lý từ Admin</span>
                <span class="ar-info-value" style="margin-top: 4px;">${_escape(report.result || "Đã xử lý")}</span>
              </div>
              <div class="ar-info-item">
                <span class="ar-info-label">Admin xử lý</span>
                <span class="ar-info-value">ID: ${report.handler_id || "N/A"}</span>
              </div>
              <div class="ar-info-item">
                <span class="ar-info-label">Thời gian xử lý</span>
                <span class="ar-info-value">${_formatDate(report.handled_at)}</span>
              </div>
            </div>
          ` : ""}
        </div>

        <div class="ar-modal-footer">
          <button type="button" class="ar-btn ar-btn-secondary" onclick="AdminReports.closeModal()">Đóng</button>

          ${isPending ? `
            <button type="button" class="ar-btn ar-btn-neutral"
              onclick="AdminReports.confirmAction('REJECT_REPORT', ${report.id}, ${report.target_id}, '${report.target_type}')">
              <i class="fa-solid fa-xmark"></i> Bỏ qua
            </button>

            ${report.target_type === "POST" ? `
              <button type="button" class="ar-btn ar-btn-warning"
                onclick="AdminReports.confirmAction('HIDE_POST', ${report.id}, ${report.target_id}, 'POST')">
                <i class="fa-regular fa-eye-slash"></i> Ẩn bài viết
              </button>
            ` : ""}

            ${report.target_type === "COMMENT" ? `
              <button type="button" class="ar-btn ar-btn-danger"
                onclick="AdminReports.confirmAction('DELETE_COMMENT', ${report.id}, ${report.target_id}, 'COMMENT')">
                <i class="fa-regular fa-trash-can"></i> Xóa bình luận
              </button>
            ` : ""}

            ${report.target_type === "USER" ? `
              <button type="button" class="ar-btn ar-btn-danger"
                onclick="AdminReports.confirmAction('LOCK_USER', ${report.id}, ${report.target_id}, 'USER')">
                <i class="fa-solid fa-lock"></i> Khóa tài khoản
              </button>
            ` : ""}

            <button type="button" class="ar-btn ar-btn-success"
              onclick="AdminReports.confirmAction('RESOLVE_CUSTOM', ${report.id}, ${report.target_id}, '${report.target_type}')">
              <i class="fa-solid fa-check"></i> Đánh dấu đã xử lý
            </button>
          ` : ""}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Xử lý đóng khi click backdrop hoặc bấm Esc
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) _closeModal();
    });

    // Tải nội dung live preview
    _loadLivePreview(report.target_type, report.target_id);
  }

  // Load preview chi tiết vào Modal
  async function _loadLivePreview(targetType, targetId) {
    const loadingEl = document.getElementById("ar-preview-loading");
    const bodyEl = document.getElementById("ar-preview-body");
    if (!bodyEl) return;

    const res = await _fetchReportedContent(targetType, targetId);
    if (loadingEl) loadingEl.style.display = "none";

    if (!res.success) {
      bodyEl.innerHTML = `
        <div style="color: #ef4444; font-size: 13px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>${_escape(res.error)}</span>
        </div>
      `;
      return;
    }

    const item = res.data;
    if (targetType === "POST") {
      bodyEl.innerHTML = `
        <div class="ar-content-title">${_escape(item.title || "Bài viết #" + item.id)}</div>
        <div class="ar-content-author">
          <i class="fa-solid fa-user-circle"></i> Tác giả: <strong>${_escape(item.user?.username || item.author_name || "ID " + item.user_id)}</strong>
          <span>•</span>
          <span>Trạng thái hiện tại: <strong style="color: ${item.status === 'HIDDEN' ? '#f59e0b' : '#22c55e'}">${item.status || 'VISIBLE'}</strong></span>
        </div>
        <div class="ar-content-text">${_escape(item.content || "Không có nội dung văn bản.")}</div>
      `;
    } else if (targetType === "USER") {
      bodyEl.innerHTML = `
        <div class="ar-content-title"><i class="fa-solid fa-user"></i> ${_escape(item.username || item.email || "User #" + targetId)}</div>
        <div class="ar-content-author">
          <span>Email: <strong>${_escape(item.email || "—")}</strong></span>
          <span>•</span>
          <span>Trạng thái: <strong style="color: ${item.status === 'LOCKED' ? '#ef4444' : '#22c55e'}">${item.status || 'ACTIVE'}</strong></span>
          <span>•</span>
          <span>Vai trò: <strong>${item.role || 'USER'}</strong></span>
        </div>
      `;
    } else if (targetType === "TEAM_POST") {
      bodyEl.innerHTML = `
        <div class="ar-content-title">${_escape(item.title || "Bài tìm đội #" + item.id)}</div>
        <div class="ar-content-author">
          <span>Chủ phòng: <strong>${_escape(item.creator?.username || "ID " + item.user_id)}</strong></span>
          <span>•</span>
          <span>Game: <strong>${_escape(item.game?.name || "Game")}</strong></span>
        </div>
        <div class="ar-content-text">${_escape(item.description || item.content || "Không có mô tả.")}</div>
      `;
    } else {
      bodyEl.innerHTML = `
        <div class="ar-content-text">Đối tượng ID #${targetId} (${targetType}).</div>
      `;
    }
  }

  function _closeModal() {
    const backdrop = document.getElementById("ar-modal-backdrop");
    if (backdrop) backdrop.remove();
  }

  // ---- HỘP THOẠI XÁC NHẬN (CONFIRM MODAL CÓ XÁC NHẬN) ----
  function confirmAction(actionType, reportId, targetId, targetType) {
    let title = "Xác nhận hành động";
    let desc = "";
    let confirmBtnText = "Xác nhận";
    let confirmBtnClass = "ar-btn-danger";
    let iconClass = "danger";
    let icon = "fa-solid fa-triangle-exclamation";
    let defaultReason = "";
    let isReject = false;
    let moderationAction = null;

    if (actionType === "HIDE_POST") {
      title = "Xác nhận ẨN bài viết";
      desc = `Bạn có chắc chắn muốn ẩn bài viết <strong>#${targetId}</strong> khỏi trang cộng đồng và chấp nhận báo cáo này?`;
      confirmBtnText = "Ẩn bài viết";
      confirmBtnClass = "ar-btn-warning";
      iconClass = "warning";
      icon = "fa-regular fa-eye-slash";
      defaultReason = "Bài viết vi phạm tiêu chuẩn cộng đồng và đã bị ẩn.";
      moderationAction = "HIDE_POST";
    } else if (actionType === "DELETE_COMMENT") {
      title = "Xác nhận XOÁ bình luận";
      desc = `Bạn có chắc chắn muốn xoá vĩnh viễn bình luận <strong>#${targetId}</strong> khỏi hệ thống?`;
      confirmBtnText = "Xoá bình luận";
      confirmBtnClass = "ar-btn-danger";
      iconClass = "danger";
      icon = "fa-regular fa-trash-can";
      defaultReason = "Bình luận vi phạm tiêu chuẩn cộng đồng và đã bị xoá.";
      moderationAction = "DELETE_COMMENT";
    } else if (actionType === "LOCK_USER") {
      title = "Xác nhận KHOÁ tài khoản người dùng";
      desc = `Bạn có chắc chắn muốn khóa tài khoản người dùng <strong>#${targetId}</strong>? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.`;
      confirmBtnText = "Khóa tài khoản";
      confirmBtnClass = "ar-btn-danger";
      iconClass = "danger";
      icon = "fa-solid fa-lock";
      defaultReason = "Tài khoản có hành vi vi phạm nghiêm trọng và đã bị khóa.";
      moderationAction = "LOCK_USER";
    } else if (actionType === "REJECT_REPORT") {
      title = "Xác nhận BỎ QUA báo cáo";
      desc = `Bỏ qua báo cáo <strong>#${reportId}</strong> nếu nội dung không vi phạm quy định cộng đồng.`;
      confirmBtnText = "Bỏ qua báo cáo";
      confirmBtnClass = "ar-btn-neutral";
      iconClass = "neutral";
      icon = "fa-solid fa-xmark";
      defaultReason = "Báo cáo bị từ chối do nội dung không vi phạm quy định cộng đồng.";
      isReject = true;
    } else if (actionType === "RESOLVE_CUSTOM") {
      title = "Xác nhận XỬ LÝ báo cáo";
      desc = `Đánh dấu báo cáo <strong>#${reportId}</strong> là đã giải quyết thành công.`;
      confirmBtnText = "Đánh dấu đã xử lý";
      confirmBtnClass = "ar-btn-success";
      iconClass = "neutral";
      icon = "fa-solid fa-check";
      defaultReason = "Báo cáo đã được ban quản trị xem xét và xử lý.";
    }

    _closeModal();

    const backdrop = document.createElement("div");
    backdrop.id = "ar-modal-backdrop";
    backdrop.className = "ar-modal-backdrop";

    backdrop.innerHTML = `
      <div class="ar-modal ar-confirm-modal">
        <div class="ar-modal-body">
          <div class="ar-confirm-icon-wrap ${iconClass}">
            <i class="${icon}"></i>
          </div>
          <h3 class="ar-confirm-title">${title}</h3>
          <p class="ar-confirm-desc">${desc}</p>

          <div style="text-align: left; margin-bottom: 16px;">
            <label class="ar-form-label">Ghi chú kết quả xử lý (Gửi tới người báo cáo) *</label>
            <textarea class="ar-textarea" id="ar-confirm-note" placeholder="Nhập lý do / ghi chú xử lý...">${defaultReason}</textarea>
          </div>
        </div>

        <div class="ar-modal-footer" style="justify-content: center;">
          <button type="button" class="ar-btn ar-btn-secondary" onclick="AdminReports.closeModal()">Hủy bỏ</button>
          <button type="button" class="ar-btn ${confirmBtnClass}" id="ar-btn-confirm-submit">
            <i class="${icon}"></i> ${confirmBtnText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const submitBtn = document.getElementById("ar-btn-confirm-submit");
    submitBtn.addEventListener("click", async () => {
      const noteInput = document.getElementById("ar-confirm-note");
      const note = noteInput ? noteInput.value.trim() : "";

      if (!note) {
        _showToast("Vui lòng nhập ghi chú kết quả xử lý!", "error");
        if (noteInput) noteInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...`;

      try {
        const payload = {
          status: isReject ? "REJECTED" : "RESOLVED",
          result: note,
        };
        if (moderationAction && !isReject) {
          payload.action = moderationAction;
        }

        await api.patch(`/api/admin/reports/${reportId}/resolve`, payload);

        _closeModal();
        _showToast("Xử lý báo cáo thành công!", "success");
        _fetchReports();
      } catch (err) {
        console.error("Lỗi khi xử lý báo cáo:", err);
        _showToast(err.message || "Không thể thực hiện hành động này.", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = confirmBtnText;
      }
    });
  }

  // ---- ĐIỀU HƯỚNG PHÂN TRANG & BỘ LỌC ----
  function setStatusFilter(status) {
    _currentStatus = status;
    _skip = 0;

    // Cập nhật tab active
    document.querySelectorAll(".ar-status-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.status === status);
    });

    _fetchReports();
  }

  function setTargetTypeFilter(type) {
    _currentTargetType = type;
    _skip = 0;
    _fetchReports();
  }

  function setSearch(query) {
    _searchQuery = query.trim();
    _skip = 0;
    _fetchReports();
  }

  function goToPage(page) {
    const totalPages = Math.ceil(_total / _limit) || 1;
    if (page < 1 || page > totalPages) return;
    _skip = (page - 1) * _limit;
    _fetchReports();
  }

  function refresh() {
    _fetchReports();
  }

  // ---- KHỞI TẠO ----
  function init() {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    // 2. Gắn sự kiện tab trạng thái
    document.querySelectorAll(".ar-status-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        setStatusFilter(tab.dataset.status || "");
      });
    });

    // 3. Gắn sự kiện select loại đối tượng
    const selectTarget = document.getElementById("ar-filter-target");
    if (selectTarget) {
      selectTarget.addEventListener("change", (e) => {
        setTargetTypeFilter(e.target.value);
      });
    }

    // 4. Gắn sự kiện tìm kiếm (debounce)
    const searchInput = document.getElementById("ar-search-input");
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setSearch(e.target.value);
        }, 300);
      });
    }

    // 5. Nút làm mới
    const refreshBtn = document.getElementById("ar-btn-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        refresh();
        _showToast("Đã làm mới dữ liệu báo cáo", "info");
      });
    }

    // 6. Esc đóng modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") _closeModal();
    });

    // 7. Tải dữ liệu ban đầu
    _fetchReports();
  }

  // Public API
  return {
    init,
    refresh,
    goToPage,
    openDetailModal,
    confirmAction,
    closeModal: _closeModal,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  AdminReports.init();
});
