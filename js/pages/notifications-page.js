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
    team_invite: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    PARTY_INVITE: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    team_join: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    match: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    system: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  const DEFAULT_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

  function _getTypeClass(type) {
    const known = ["friend_request", "friend_accepted", "team_invite", "PARTY_INVITE", "team_join", "match", "system"];
    return known.includes(type) ? `type-${type}` : "type-default";
  }

  function _getTypeIcon(type) {
    return TYPE_ICONS[type] || DEFAULT_ICON;
  }

  function _getTypeLabel(type) {
    const labels = {
      friend_request: "Lời mời kết bạn",
      friend_accepted: "Chấp nhận kết bạn",
      team_invite: "Mời vào đội",
      PARTY_INVITE: "Mời vào đội",
      team_join: "Xin gia nhập",
      match: "Trận đấu",
      system: "Hệ thống",
    };
    return labels[type] || type;
  }

  // ---- Lấy notifications từ filter ----
  function _getFilteredNotifications() {
    if (_currentFilter === "all") return _allNotifications;
    if (_currentFilter === "unread") return _allNotifications.filter((n) => !n.is_read);
    return _allNotifications.filter((n) => n.type === _currentFilter);
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
           data-notif-link="${escapeHtml(n.link || "")}"
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
    const link = item.dataset.notifLink;

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

    // Điều hướng
    if (link) {
      if (link.startsWith("http")) {
        window.location.href = link;
      } else {
        window.location.href = _rootPath + link;
      }
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
