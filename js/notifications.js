// =================================================================
// GameConnect — Module Thông Báo Dùng Chung (Notification Bell)
// =================================================================
// TÀI NGUYÊN CHUNG: Nhúng vào mọi trang cần chuông thông báo.
//
// Yêu cầu: trang phải load trước:
//   - css/notifications.css
//   - js/config.js, js/api.js, js/utils.js
//
// Cách dùng:
//   1. Đặt <div id="gc-notif-bell"></div> vào vị trí muốn hiện chuông
//   2. Gọi NotificationBell.init({ root: "gc-notif-bell", rootPath: "./" })
//      rootPath là đường dẫn tương đối đến thư mục gốc frontend/
//
// Module tự động:
//   - Render chuông + badge số chưa đọc
//   - Polling mỗi 30s để cập nhật badge
//   - Hiện dropdown 5 thông báo mới nhất khi bấm chuông
//   - Click vào thông báo -> đánh dấu đã đọc -> mở trang liên quan
//   - Nút "Đánh dấu đã đọc tất cả"
//   - Nút "Xem tất cả" -> trang notifications.html
// =================================================================

const NotificationBell = (() => {
  // ---- Cấu hình ----
  let _rootPath = "./";
  let _containerId = "gc-notif-bell";
  let _pollInterval = 30000; // 30 giây
  let _pollTimer = null;
  let _isOpen = false;
  let _unreadCount = 0;

  // ---- Icon SVG cho từng loại thông báo ----
  const TYPE_ICONS = {
    friend_request: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
    friend_accepted: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
    team_invite: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    PARTY_INVITE: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    team_join: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    match: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    system: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  const DEFAULT_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

  // ---- Hàm tiện ích ----
  function _getToken() {
    return localStorage.getItem("access_token");
  }

  function _isLoggedIn() {
    return !!_getToken();
  }

  // Tạo header Authorization
  function _authHeaders() {
    const token = _getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Gọi API dùng axios (đã cấu hình sẵn)
  async function _apiGet(path, params = {}) {
    const res = await http.get(path, {
      params,
      headers: _authHeaders(),
    });
    return res.data;
  }

  async function _apiPatch(path) {
    const res = await http.patch(path, {}, { headers: _authHeaders() });
    return res.data;
  }

  // Tính khoảng thời gian dạng "5 phút trước", "2 giờ trước"
  function _timeAgo(dateStr) {
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
    return new Date(dateStr).toLocaleDateString("vi-VN");
  }

  // Lấy CSS class cho icon type
  function _getTypeClass(type) {
    const known = ["friend_request", "friend_accepted", "team_invite", "PARTY_INVITE", "team_join", "match", "system"];
    return known.includes(type) ? `type-${type}` : "type-default";
  }

  // Lấy icon SVG cho type
  function _getTypeIcon(type) {
    return TYPE_ICONS[type] || DEFAULT_ICON;
  }

  // Lấy label cho type (hiện trên trang đầy đủ)
  function _getTypeLabel(type) {
    const labels = {
      friend_request: "Lời mời kết bạn",
      friend_accepted: "Đã chấp nhận",
      team_invite: "Mời vào đội",
      PARTY_INVITE: "Mời vào đội",
      team_join: "Xin gia nhập đội",
      match: "Trận đấu",
      system: "Hệ thống",
    };
    return labels[type] || type;
  }

  // ---- RENDER ----

  // Render chuông
  function _renderBell(container) {
    container.innerHTML = `
      <div class="gc-notif-bell-wrap">
        <button type="button" class="gc-notif-bell-btn" id="gc-bell-btn" title="Thông báo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="gc-notif-badge is-hidden" id="gc-bell-badge">0</span>
        </button>

        <div class="gc-notif-overlay" id="gc-notif-overlay" hidden></div>

        <div class="gc-notif-dropdown" id="gc-notif-dropdown" hidden>
          <div class="gc-notif-dd-header">
            <span class="gc-notif-dd-title">Thông báo</span>
            <div class="gc-notif-dd-actions">
              <button type="button" class="gc-notif-dd-link" id="gc-mark-all-read">Đánh dấu đã đọc tất cả</button>
            </div>
          </div>
          <div class="gc-notif-dd-list" id="gc-notif-dd-list">
            <div class="gc-notif-loading">
              <div class="gc-notif-spinner"></div>
              <div>Đang tải...</div>
            </div>
          </div>
          <div class="gc-notif-dd-footer">
            <a href="${_rootPath}pages/notifications.html">Xem tất cả thông báo</a>
          </div>
        </div>
      </div>
    `;
  }

  // Render danh sách thông báo trong dropdown
  function _renderDropdownItems(notifications) {
    const listEl = document.getElementById("gc-notif-dd-list");
    if (!listEl) return;

    if (!notifications || notifications.length === 0) {
      listEl.innerHTML = `
        <div class="gc-notif-empty">
          <div class="gc-notif-empty-icon">🔔</div>
          <div class="gc-notif-empty-text">Chưa có thông báo nào</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifications.map((n) => `
      <div class="gc-notif-item ${n.is_read ? "" : "is-unread"}"
           data-notif-id="${n.id}"
           data-notif-link="${escapeHtml(n.link || "")}"
           role="button" tabindex="0">
        <div class="gc-notif-icon ${_getTypeClass(n.type)}">
          ${_getTypeIcon(n.type)}
        </div>
        <div class="gc-notif-body">
          <div class="gc-notif-content">${escapeHtml(n.content)}</div>
          <div class="gc-notif-time">${_timeAgo(n.created_at)}</div>
        </div>
        <div class="gc-notif-unread-dot"></div>
      </div>
    `).join("");

    // Gắn event click
    listEl.querySelectorAll(".gc-notif-item").forEach((item) => {
      item.addEventListener("click", () => _onItemClick(item));
    });
  }

  // ---- SỰ KIỆN ----

  // Click vào thông báo: đánh dấu đã đọc + navigate
  async function _onItemClick(item) {
    const id = item.dataset.notifId;
    const link = item.dataset.notifLink;

    // Đánh dấu đã đọc
    if (item.classList.contains("is-unread")) {
      try {
        await _apiPatch(`/notifications/${id}/read`);
        item.classList.remove("is-unread");
        _unreadCount = Math.max(0, _unreadCount - 1);
        _updateBadge(_unreadCount);
      } catch (e) {
        console.warn("Không thể đánh dấu đã đọc:", e);
      }
    }

    // Điều hướng
    if (link) {
      // Nếu link bắt đầu bằng http → mở trực tiếp
      // Nếu link là đường dẫn tương đối → nối với rootPath
      if (link.startsWith("http")) {
        window.location.href = link;
      } else {
        window.location.href = _rootPath + link;
      }
    }

    _closeDropdown();
  }

  // Toggle dropdown
  function _toggleDropdown() {
    if (_isOpen) {
      _closeDropdown();
    } else {
      _openDropdown();
    }
  }

  async function _openDropdown() {
    _isOpen = true;
    const dd = document.getElementById("gc-notif-dropdown");
    const overlay = document.getElementById("gc-notif-overlay");
    const btn = document.getElementById("gc-bell-btn");

    if (dd) dd.hidden = false;
    if (overlay) overlay.hidden = false;
    if (btn) btn.classList.add("is-open");

    // Load thông báo mới nhất
    await _loadDropdownNotifications();
  }

  function _closeDropdown() {
    _isOpen = false;
    const dd = document.getElementById("gc-notif-dropdown");
    const overlay = document.getElementById("gc-notif-overlay");
    const btn = document.getElementById("gc-bell-btn");

    if (dd) dd.hidden = true;
    if (overlay) overlay.hidden = true;
    if (btn) btn.classList.remove("is-open");
  }

  // Load thông báo cho dropdown (5 cái mới nhất)
  async function _loadDropdownNotifications() {
    const listEl = document.getElementById("gc-notif-dd-list");
    if (!listEl) return;

    listEl.innerHTML = `
      <div class="gc-notif-loading">
        <div class="gc-notif-spinner"></div>
        <div>Đang tải...</div>
      </div>
    `;

    try {
      const result = await _apiGet("/notifications", { skip: 0, limit: 5 });
      const items = result.data || result;
      _renderDropdownItems(Array.isArray(items) ? items : []);
    } catch (err) {
      listEl.innerHTML = `
        <div class="gc-notif-empty">
          <div class="gc-notif-empty-icon">⚠️</div>
          <div class="gc-notif-empty-text">Không thể tải thông báo</div>
        </div>
      `;
    }
  }

  // Đánh dấu tất cả đã đọc
  async function _markAllRead() {
    try {
      await _apiPatch("/notifications/read-all");
      _unreadCount = 0;
      _updateBadge(0);

      // Cập nhật UI dropdown
      document.querySelectorAll(".gc-notif-item.is-unread").forEach((item) => {
        item.classList.remove("is-unread");
      });

      // Nếu đang ở trang notifications → cập nhật luôn
      if (typeof NotificationPage !== "undefined" && NotificationPage.refresh) {
        NotificationPage.refresh();
      }
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  }

  // ---- BADGE & POLLING ----

  function _updateBadge(count) {
    _unreadCount = count;
    const badge = document.getElementById("gc-bell-badge");
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.classList.remove("is-hidden");
    } else {
      badge.classList.add("is-hidden");
    }
  }

  async function _fetchUnreadCount() {
    if (!_isLoggedIn()) return;
    try {
      const result = await _apiGet("/notifications/unread-count");
      const data = result.data || result;
      _updateBadge(data.unread_count || 0);
    } catch (err) {
      // Im lặng nếu không lấy được
    }
  }

  function _startPolling() {
    // Lần đầu lấy ngay
    _fetchUnreadCount();
    // Sau đó polling mỗi 30 giây
    _pollTimer = setInterval(_fetchUnreadCount, _pollInterval);
  }

  function _stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  // ---- KHỞI TẠO ----

  function init(options = {}) {
    _containerId = options.root || "gc-notif-bell";
    _rootPath = options.rootPath || "./";
    _pollInterval = options.pollInterval || 30000;

    const container = document.getElementById(_containerId);
    if (!container) {
      console.warn(`[NotificationBell] Không tìm thấy #${_containerId}`);
      return;
    }

    // Chỉ render chuông nếu đã đăng nhập
    if (!_isLoggedIn()) return;

    _renderBell(container);

    // Gắn sự kiện
    const bellBtn = document.getElementById("gc-bell-btn");
    const overlay = document.getElementById("gc-notif-overlay");
    const markAllBtn = document.getElementById("gc-mark-all-read");

    if (bellBtn) bellBtn.addEventListener("click", _toggleDropdown);
    if (overlay) overlay.addEventListener("click", _closeDropdown);
    if (markAllBtn) markAllBtn.addEventListener("click", _markAllRead);

    // Esc đóng dropdown
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && _isOpen) _closeDropdown();
    });

    // Bắt đầu polling
    _startPolling();
  }

  // ---- PUBLIC API ----
  return {
    init,
    refreshBadge: _fetchUnreadCount,
    stopPolling: _stopPolling,
    getUnreadCount: () => _unreadCount,
  };
})();
