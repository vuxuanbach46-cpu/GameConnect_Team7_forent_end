// =================================================================
// GameConnect — Trang Tất Cả Thông Báo (notifications.html)
// =================================================================
// JS chuyên biệt cho trang notifications.html.
// Cần load js/notifications.js trước file này.
// =================================================================

const NotificationPage = (() => {
  let _rootPath = "../";
  let _currentFilter = "all";
  let _currentSkip = 0;
  const _pageSize = 15;
  let _allNotifications = [];
  let _isLoading = false;
  let _hasMore = true;

  // ---- Helpers ----
  function _getToken() {
    return localStorage.getItem("access_token");
  }

  function _authHeaders() {
    const token = _getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function _apiGet(path, params = {}) {
    const res = await http.get(path, { params, headers: _authHeaders() });
    return res.data;
  }

  async function _apiPatch(path) {
    const res = await http.patch(path, {}, { headers: _authHeaders() });
    return res.data;
  }

  async function _apiPost(path, data = {}) {
    try {
      if (typeof http !== "undefined") {
        const res = await http.post(path, data, { headers: _authHeaders() });
        return res.data;
      } else if (typeof api !== "undefined") {
        return await api.post(path, data);
      }
    } catch (err) {
      console.warn("Lỗi gọi POST:", path, err);
      throw err;
    }
  }

  function _resolvePageUrl(relativePath) {
    if (!relativePath) return "";
    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
      return relativePath;
    }
    let clean = relativePath.replace(/^\/+/, "");
    if (clean.startsWith("pages/")) {
      clean = clean.replace(/^pages\//, "");
    }
    const inPages = window.location.pathname.includes("/pages/");
    return (inPages ? "" : "pages/") + clean;
  }

  // Tính khoảng thời gian
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

  // Icon theo type
  const TYPE_ICONS = {
    friend_request: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
    friend_accepted: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
    new_message: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    team_invite: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    team_join: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    match: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    post: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    system: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  const DEFAULT_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

  function _normalizeType(rawType) {
    const t = String(rawType || "").toLowerCase().trim();
    if (t.includes("message") || t.includes("chat")) return "new_message";
    if (t.includes("friend_accepted") || t.includes("friend_accept")) return "friend_accepted";
    if (t.includes("friend")) return "friend_request";
    if (t.includes("party") || t.includes("team_invit") || t.includes("mời vào đội") || t.includes("moi_vao_doi")) return "team_invite";
    if (t.includes("team_join") || t.includes("team_post_app") || t.includes("team")) return "team_join";
    if (t.includes("match")) return "match";
    if (t.includes("post") || t.includes("comment") || t.includes("like")) return "post";
    return "system";
  }

  function _getTypeClass(type) {
    const norm = _normalizeType(type);
    return `type-${norm}`;
  }

  function _getTypeIcon(type) {
    const norm = _normalizeType(type);
    return TYPE_ICONS[norm] || DEFAULT_ICON;
  }

  function _getTypeLabel(type) {
    const upper = String(type || "").toUpperCase().trim();
    const map = {
      FRIEND_REQUEST: "Lời mời kết bạn",
      FRIEND_ACCEPTED: "Chấp nhận kết bạn",
      NEW_MESSAGE: "Tin nhắn mới",
      PARTY_INVITE: "Mời vào đội",
      TEAM_INVITATION: "Mời vào đội",
      MOI_VAO_DOI: "Mời vào đội",
      TEAM_JOIN_REQUEST: "Yêu cầu vào đội",
      TEAM_INVITATION_RESPONSE: "Phản hồi lời mời",
      TEAM_JOIN_ACCEPTED: "Gia nhập đội",
      TEAM_JOIN_REJECTED: "Từ chối gia nhập",
      TEAM_MEMBER_REMOVED: "Rời đội",
      TEAM_CAPTAIN_TRANSFERRED: "Chuyển đội trưởng",
      TEAM_POST_APPLICATION_ACCEPTED: "Duyệt ứng tuyển",
      TEAM_POST_APPLICATION_REJECTED: "Từ chối ứng tuyển",
      TEAM_POST_APPLICATION_CANCELLED: "Hủy ứng tuyển",
      TEAM_CREATED_FROM_POST: "Tạo đội mới",
      POST_COMMENT: "Bình luận",
      POST_LIKE: "Lượt thích",
      MATCH_FOUND: "Trận đấu",
      REPORT_RESULT: "Báo cáo",
      SYSTEM: "Hệ thống",
    };
    if (map[upper]) return map[upper];
    const norm = _normalizeType(type);
    const fallback = {
      friend_request: "Lời mời kết bạn",
      friend_accepted: "Chấp nhận kết bạn",
      new_message: "Tin nhắn mới",
      team_invite: "Mời vào đội",
      team_join: "Đội & CLB",
      match: "Trận đấu",
      post: "Cộng đồng",
      system: "Hệ thống",
    };
    return fallback[norm] || type || "Thông báo";
  }

  // ---- Lấy notifications từ filter ----
  function _getFilteredNotifications() {
    if (_currentFilter === "all") return _allNotifications;
    if (_currentFilter === "unread") return _allNotifications.filter((n) => !n.is_read);
    return _allNotifications.filter((n) => {
      const norm = _normalizeType(n.type);
      if (_currentFilter === "friend_request") {
        return norm === "friend_request" || norm === "friend_accepted" || norm === "new_message";
      }
      if (_currentFilter === "team_invite") {
        return norm === "team_invite" || norm === "team_join";
      }
      if (_currentFilter === "match") {
        return norm === "match";
      }
      if (_currentFilter === "system") {
        return norm === "system" || norm === "post";
      }
      return norm === _currentFilter || String(n.type).toLowerCase() === _currentFilter.toLowerCase();
    });
  }

  // ---- RENDER ----

  function _renderItems() {
    const listEl = document.getElementById("gc-notif-page-list");
    if (!listEl) return;

    const filtered = _getFilteredNotifications();

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="gc-notif-page-empty">
          <div class="gc-notif-page-empty-icon">🔔</div>
          <h3>${_currentFilter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}</h3>
          <p>Các thông báo mới sẽ hiện ở đây khi có.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map((n) => `
      <div class="gc-notif-page-item ${n.is_read ? "" : "is-unread"}"
           data-notif-id="${n.id}"
           data-notif-type="${escapeHtml(n.type || "")}"
           data-notif-room-id="${n.room_id || ""}"
           data-notif-link="${escapeHtml(n.link || "")}"
           data-notif-content="${escapeHtml(n.content || "")}"
           role="button" tabindex="0">
        <div class="gc-notif-page-icon ${_getTypeClass(n.type)}">
          ${_getTypeIcon(n.type)}
        </div>
        <div class="gc-notif-page-body">
          <div class="gc-notif-page-content">${escapeHtml(n.content)}</div>
          <div class="gc-notif-page-meta">
            <span class="gc-notif-page-time">${_timeAgo(n.created_at)}</span>
            <span class="gc-notif-page-type-tag">${_getTypeLabel(n.type)}</span>
          </div>
        </div>
        <div class="gc-notif-page-dot"></div>
      </div>
    `).join("");

    // Gắn event click
    listEl.querySelectorAll(".gc-notif-page-item").forEach((item) => {
      item.addEventListener("click", () => _onItemClick(item));
    });
  }

  function _renderLoadMore() {
    const container = document.getElementById("gc-notif-load-more");
    if (!container) return;

    if (_hasMore) {
      container.innerHTML = `
        <button type="button" class="gc-notif-load-more-btn" id="gc-load-more-btn">
          Tải thêm thông báo...
        </button>
      `;
      document.getElementById("gc-load-more-btn").addEventListener("click", _loadMore);
    } else {
      container.innerHTML = "";
    }
  }

  function _updateUnreadPill() {
    const pill = document.getElementById("gc-unread-count-pill");
    const unread = _allNotifications.filter((n) => !n.is_read).length;
    if (pill) {
      pill.textContent = `${unread} chưa đọc`;
      pill.style.display = unread > 0 ? "inline" : "none";
    }
  }

  // ---- SỰ KIỆN ----

  async function _onItemClick(item) {
    const id = item.dataset.notifId;
    const type = item.dataset.notifType || "";
    const roomId = item.dataset.notifRoomId || "";
    const link = item.dataset.notifLink || "";
    const content = item.dataset.notifContent || "";

    // Đánh dấu đã đọc
    if (item.classList.contains("is-unread")) {
      try {
        await _apiPatch(`/notifications/${id}/read`);
        item.classList.remove("is-unread");

        // Cập nhật local data
        const notif = _allNotifications.find((n) => String(n.id) === String(id));
        if (notif) notif.is_read = true;

        _updateUnreadPill();
        // Cập nhật badge chuông
        if (typeof NotificationBell !== "undefined") {
          NotificationBell.refreshBadge();
        }
      } catch (e) {
        console.warn("Không thể đánh dấu đã đọc:", e);
      }
    }

    // Điều hướng thông minh theo loại thông báo
    const norm = _normalizeType(type);

    // 1. Tin nhắn 1-1 (NEW_MESSAGE hoặc link /chat/{id})
    if (
      norm === "new_message" ||
      (link && link.startsWith("/chat/")) ||
      (content && (content.includes("đã nhắn:") || content.includes("tin nhắn mới")))
    ) {
      const chatMatch = link ? link.match(/\/chat\/(\d+)/) : null;
      const friendId = chatMatch ? Number(chatMatch[1]) : 0;
      if (friendId > 0 && window.location.pathname.endsWith("/friends.html") && typeof window.openChatByFriendId === "function") {
        await window.openChatByFriendId(friendId);
      } else if (friendId > 0) {
        window.location.href = _resolvePageUrl(`friends.html?tab=friends&chat=${friendId}`);
      } else {
        window.location.href = _resolvePageUrl("friends.html?tab=friends");
      }
      return;
    }

    // 2. Lời mời kết bạn đến
    if (
      norm === "friend_request" ||
      (link && link.startsWith("/friends/requests")) ||
      (content && (content.includes("lời mời kết bạn") || content.includes("gửi lời mời kết bạn")))
    ) {
      if (window.location.pathname.endsWith("/friends.html") && typeof switchTab === "function") {
        switchTab("received");
        if (typeof loadAllFriendsData === "function") loadAllFriendsData();
      } else {
        window.location.href = _resolvePageUrl("friends.html?tab=received");
      }
      return;
    }

    // 3. Lời mời kết bạn được chấp nhận
    if (
      norm === "friend_accepted" ||
      (content && content.includes("chấp nhận lời mời kết bạn"))
    ) {
      if (window.location.pathname.endsWith("/friends.html") && typeof switchTab === "function") {
        switchTab("friends");
        if (typeof loadAllFriendsData === "function") loadAllFriendsData();
      } else {
        window.location.href = _resolvePageUrl("friends.html?tab=friends");
      }
      return;
    }

    // 4. Lời mời vào sảnh đội / Party invite
    if (
      norm === "team_invite" ||
      (link && (link.includes("accept-invite") || link.includes("matchmaking"))) ||
      (content && (content.includes("mời bạn tham gia đội chơi") || content.includes("mời bạn tham gia sảnh")))
    ) {
      const apiPath = (link && link.includes("/api/matchmaking/accept-invite/"))
        ? link
        : (roomId ? `/api/matchmaking/accept-invite/${roomId}` : `/api/matchmaking/accept-notification/${id}`);
      try {
        await _apiPost(apiPath);
      } catch (err) {
        console.warn("Không thể nhận lời mời sảnh đội:", err);
      }
      if (window.location.pathname.endsWith("/quick-match.html") && typeof qmLoadBackendData === "function") {
        if (typeof qmSwitchView === "function") qmSwitchView("lobby");
        await qmLoadBackendData();
      } else {
        window.location.href = _resolvePageUrl("quick-match.html?view=lobby");
      }
      return;
    }

    // 5. Đã tìm thấy trận / Đủ người (MATCH_FOUND)
    if (
      norm === "match" ||
      (link && link.startsWith("/rooms/")) ||
      (content && (content.includes("đã đủ người") || content.includes("tìm thấy phòng")))
    ) {
      if (window.location.pathname.endsWith("/quick-match.html") && typeof qmLoadBackendData === "function") {
        if (typeof qmSwitchView === "function") qmSwitchView("lobby");
        await qmLoadBackendData();
      } else {
        window.location.href = _resolvePageUrl("quick-match.html?view=lobby");
      }
      return;
    }

    // 6. Bình luận hoặc Like bài viết cộng đồng
    if (
      norm === "post" ||
      (link && link.match(/\/posts\/(\d+)/)) ||
      (content && (content.includes("bình luận") || content.includes("lượt thích")))
    ) {
      const postMatch = (link && link.match(/\/posts\/(\d+)/)) || (content && content.match(/#(\d+)/));
      if (postMatch) {
        window.location.href = _resolvePageUrl(`community-detail.html?id=${postMatch[1]}#comments`);
        return;
      }
      window.location.href = _resolvePageUrl("community.html");
      return;
    }

    // 7. Đội nhóm & Câu lạc bộ
    const upperType = String(type || "").toUpperCase();
    if (upperType === "TEAM_INVITATION" || (link && link.includes("team-invitations"))) {
      window.location.href = _resolvePageUrl("team-invitations.html");
      return;
    }
    if (upperType === "TEAM_JOIN_REQUEST" || (link && link.includes("team-feed"))) {
      const teamMatch = link ? link.match(/id=(\d+)/) : null;
      window.location.href = _resolvePageUrl(teamMatch ? `team-feed.html?id=${teamMatch[1]}` : "clubs.html");
      return;
    }
    if (upperType === "TEAM_INVITATION_RESPONSE" || upperType === "TEAM_CREATED_FROM_POST") {
      const teamMatch = link ? (link.match(/id=(\d+)/) || link.match(/\/teams\/(\d+)/)) : null;
      window.location.href = _resolvePageUrl(teamMatch ? `team-detail.html?id=${teamMatch[1]}` : "my-team.html");
      return;
    }
    if (upperType === "TEAM_JOIN_ACCEPTED") {
      window.location.href = _resolvePageUrl("my-team.html");
      return;
    }
    if (
      upperType === "TEAM_JOIN_REJECTED" ||
      upperType === "TEAM_MEMBER_REMOVED" ||
      upperType === "TEAM_CAPTAIN_TRANSFERRED" ||
      (link && link.startsWith("/teams/"))
    ) {
      const teamMatch = link ? link.match(/\/teams\/(\d+)/) : null;
      window.location.href = _resolvePageUrl(teamMatch ? `team-detail.html?id=${teamMatch[1]}` : "clubs.html");
      return;
    }
    if (
      upperType.startsWith("TEAM_POST_APPLICATION") ||
      (link && link.includes("team-post-detail"))
    ) {
      const postMatch = link ? link.match(/id=(\d+)/) : null;
      window.location.href = _resolvePageUrl(postMatch ? `team-post-detail.html?id=${postMatch[1]}` : "team-posts.html");
      return;
    }

    // 8. Báo cáo (REPORT_RESULT)
    if (upperType === "REPORT_RESULT") {
      alert(content || "Báo cáo của bạn đã được ban quản trị xử lý.");
      return;
    }

    // 9. Fallback đường dẫn khác
    if (link) {
      window.location.href = _resolvePageUrl(link);
      return;
    }
  }

  async function _markAllRead() {
    try {
      await _apiPatch("/notifications/read-all");
      _allNotifications.forEach((n) => (n.is_read = true));
      _renderItems();
      _updateUnreadPill();
      if (typeof NotificationBell !== "undefined") {
        NotificationBell.refreshBadge();
      }
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  }

  // ---- DATA LOADING ----

  async function _loadNotifications() {
    if (_isLoading) return;
    _isLoading = true;

    const listEl = document.getElementById("gc-notif-page-list");

    if (_currentSkip === 0 && listEl) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--fc-text-muted)">
          <div class="gc-notif-spinner"></div>
          <div style="margin-top:8px">Đang tải thông báo...</div>
        </div>
      `;
    }

    try {
      const result = await _apiGet("/notifications", {
        skip: _currentSkip,
        limit: _pageSize,
      });
      const items = result.data || result;
      const newItems = Array.isArray(items) ? items : [];

      _allNotifications = _allNotifications.concat(newItems);
      _hasMore = newItems.length === _pageSize;
      _currentSkip += newItems.length;

      _renderItems();
      _renderLoadMore();
      _updateUnreadPill();
    } catch (err) {
      if (listEl) {
        listEl.innerHTML = `
          <div class="gc-notif-page-empty">
            <div class="gc-notif-page-empty-icon">⚠️</div>
            <h3>Không thể tải thông báo</h3>
            <p>Kiểm tra kết nối và thử lại.</p>
          </div>
        `;
      }
    } finally {
      _isLoading = false;
    }
  }

  async function _loadMore() {
    await _loadNotifications();
  }

  function _setFilter(filter) {
    _currentFilter = filter;

    // Cập nhật active class
    document.querySelectorAll(".gc-notif-filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });

    _renderItems();
  }

  // ---- PUBLIC ----

  function init(options = {}) {
    _rootPath = options.rootPath || "../";

    const token = localStorage.getItem("access_token");
    if (!token) {
      const listEl = document.getElementById("gc-notif-page-list");
      if (listEl) {
        listEl.innerHTML = `
          <div class="gc-notif-page-empty">
            <div class="gc-notif-page-empty-icon">🔒</div>
            <h3>Cần đăng nhập</h3>
            <p>Vui lòng <a href="${_rootPath}pages/login.html" style="color:var(--fc-orange)">đăng nhập</a> để xem thông báo.</p>
          </div>
        `;
      }
      return;
    }

    // Gắn sự kiện filter tabs
    document.querySelectorAll(".gc-notif-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => _setFilter(btn.dataset.filter));
    });

    // Gắn sự kiện "Đánh dấu đã đọc tất cả"
    const markAllBtn = document.getElementById("gc-page-mark-all");
    if (markAllBtn) markAllBtn.addEventListener("click", _markAllRead);

    // Load thông báo
    _loadNotifications();
  }

  function refresh() {
    _allNotifications = [];
    _currentSkip = 0;
    _hasMore = true;
    _loadNotifications();
  }

  return { init, refresh };
})();

document.addEventListener("DOMContentLoaded", () => {
  NotificationPage.init({ rootPath: "../" });

  function applyNotifTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("fc-light-mode", isLight);
    const checkDark = document.getElementById("check-theme-dark");
    const checkLight = document.getElementById("check-theme-light");
    if (checkDark) checkDark.textContent = isLight ? "" : "✓";
    if (checkLight) checkLight.textContent = isLight ? "✓" : "";
    document.querySelectorAll(".fc-theme-option").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.setTheme === (isLight ? "light" : "dark"));
    });
    localStorage.setItem("gc_friends_theme", isLight ? "light" : "dark");
  }

  applyNotifTheme(localStorage.getItem("gc_friends_theme") || "dark");

  const avatarBtn = document.getElementById("btn-avatar-menu");
  const avatarDropdown = document.getElementById("avatar-dropdown-menu");
  if (avatarBtn && avatarDropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarDropdown.hidden = !avatarDropdown.hidden;
    });
    document.querySelectorAll(".fc-theme-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        applyNotifTheme(opt.dataset.setTheme);
        avatarDropdown.hidden = true;
      });
    });
    document.addEventListener("click", (e) => {
      if (!avatarDropdown.hidden && !avatarDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
        avatarDropdown.hidden = true;
      }
    });
  }

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("auth_provider");
    window.location.href = "../index.html";
  });

  const changePwdBtn = document.getElementById("open-change-password");
  if (changePwdBtn) {
    changePwdBtn.hidden = localStorage.getItem("auth_provider") === "google";
  }
  const pwdModal = document.getElementById("change-password-modal");
  const pwdForm = document.getElementById("change-password-form");
  const pwdMsg = document.getElementById("change-password-message");
  const pwdSubmit = document.getElementById("change-password-submit");
  const setPwdModal = (open) => {
    if (!pwdModal) return;
    pwdModal.hidden = !open;
    document.body.classList.toggle("gc-password-modal-open", open);
    if (open) {
      if (avatarDropdown) avatarDropdown.hidden = true;
      window.setTimeout(() => document.getElementById("old-password")?.focus(), 30);
    } else {
      pwdForm?.reset();
      if (pwdMsg) {
        pwdMsg.hidden = true;
        pwdMsg.textContent = "";
        pwdMsg.classList.remove("error");
      }
    }
  };
  changePwdBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    setPwdModal(true);
  });
  ["close-change-password", "cancel-change-password"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => setPwdModal(false));
  });
  pwdModal?.querySelectorAll("[data-close-password]").forEach((el) => {
    el.addEventListener("click", () => setPwdModal(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pwdModal && !pwdModal.hidden) setPwdModal(false);
  });
  pwdForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const showMsg = (text, isError = false) => {
      if (!pwdMsg) return;
      pwdMsg.textContent = text;
      pwdMsg.classList.toggle("error", isError);
      pwdMsg.hidden = false;
    };
    if (newPassword !== confirmPassword) {
      showMsg("Mật khẩu xác nhận không khớp.", true);
      return;
    }
    if (oldPassword === newPassword) {
      showMsg("Mật khẩu mới cần khác mật khẩu hiện tại.", true);
      return;
    }
    if (pwdSubmit) {
      pwdSubmit.disabled = true;
      pwdSubmit.textContent = "Đang cập nhật...";
    }
    try {
      const res = await api.put("/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword
      });
      showMsg(res?.message || "Đổi mật khẩu thành công.");
      pwdForm.reset();
    } catch (err) {
      showMsg(err?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.", true);
    } finally {
      if (pwdSubmit) {
        pwdSubmit.disabled = false;
        pwdSubmit.textContent = "Cập nhật mật khẩu";
      }
    }
  });
});
