// Đồng bộ thanh công cụ nhanh bên phải trên các trang đã đăng nhập.
(() => {
  const ICONS = {
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>',
    invite: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6m3-3h-6"></path></svg>',
    friends: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    create: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>',
  };

  function addStyles() {
    if (!document.querySelector('link[data-gc-rightbar-css], link[href*="rightbar.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "../css/rightbar.css";
      link.dataset.gcRightbarCss = "true";
      document.head.append(link);
    }
    if (!document.querySelector('link[href*="notifications.css"]')) {
      const notifLink = document.createElement("link");
      notifLink.rel = "stylesheet";
      notifLink.href = "../css/notifications.css";
      notifLink.dataset.gcNotifCss = "true";
      document.head.append(notifLink);
    }
  }

  function createAvatar(oldWrapper = null) {
    const wrapper = document.createElement("div");
    wrapper.className = "fc-avatar-menu-wrapper";
    wrapper.dataset.gcRightTool = "avatar";

    const oldImg = oldWrapper?.querySelector(".fc-self-avatar");
    const oldName = oldWrapper?.querySelector("#avatar-user-name, .fc-avatar-dropdown-header strong");
    const initialSrc = oldImg?.getAttribute("src") || "https://api.dicebear.com/9.x/adventurer/svg?seed=User&backgroundColor=b6e3f4";
    const initialAlt = oldImg?.getAttribute("alt") || "Avatar của bạn";
    const initialName = (oldName && oldName.textContent && oldName.textContent.trim()) ? oldName.textContent.trim() : "Đang tải...";

    // Tạo button avatar chuẩn như trang home.html
    const isGoogleAuth = localStorage.getItem("auth_provider") === "google";
    wrapper.innerHTML = `
      <button type="button" id="btn-avatar-menu" class="fc-self-avatar-wrap" title="Tài khoản, giao diện Sáng / Tối &amp; Đăng xuất" aria-haspopup="true" aria-expanded="false">
        <img src="${initialSrc}" alt="${initialAlt}" class="fc-self-avatar">
        <span class="fc-status-dot"></span>
      </button>
      <div id="avatar-dropdown-menu" class="fc-avatar-dropdown" hidden>
        <div class="fc-avatar-dropdown-header">
          <strong id="avatar-user-name">${initialName}</strong>
          <span>● Đang trực tuyến</span>
        </div>
        <div class="fc-avatar-dropdown-divider"></div>
        <div class="fc-avatar-dropdown-label">Giao diện hiển thị</div>
        <button type="button" class="fc-theme-option" data-set-theme="dark">
          <span>🌙 Chế độ Tối (Dark)</span>
          <span class="fc-theme-check" id="check-theme-dark">✓</span>
        </button>
        <button type="button" class="fc-theme-option" data-set-theme="light">
          <span>☀️ Chế độ Sáng (Light)</span>
          <span class="fc-theme-check" id="check-theme-light"></span>
        </button>
        <div class="fc-avatar-dropdown-divider"></div>
        <a href="profile.html" id="avatar-profile-btn" class="fc-avatar-profile-btn">
          <span class="fc-profile-icon">🎮</span>
          <span>Hồ sơ game thủ</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"></path><path d="M7 7h10v10"></path></svg>
        </a>
        <div class="fc-avatar-dropdown-divider"></div>
        <button type="button" id="logout-btn" class="fc-avatar-logout-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Đăng xuất</span>
        </button>
        <button type="button" id="open-change-password" class="fc-avatar-password-btn"${isGoogleAuth ? ' hidden' : ''}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>Đổi mật khẩu</span>
        </button>
      </div>`;

    return wrapper;
  }

  function createLink(href, title, icon, extraClass = "") {
    const link = document.createElement("a");
    link.href = href;
    link.title = title;
    link.setAttribute("aria-label", title);
    link.className = `fc-right-icon-btn ${extraClass}`.trim();
    link.innerHTML = icon;
    return link;
  }

  function asLink(node, href, title, body) {
    if (node?.tagName === "BUTTON") {
      const link = document.createElement("a");
      for (const attribute of Array.from(node.attributes)) {
        if (attribute.name !== "type") link.setAttribute(attribute.name, attribute.value);
      }
      node.replaceWith(link);
      node = link;
    }
    if (node) {
      node.href = href;
      node.title = title;
      node.setAttribute("aria-label", title);
      node.innerHTML = body;
      node.dataset.gcRightTool = node.dataset.gcRightTool || "";
    }
    return node;
  }

  function ensureNotificationBellReady(bellEl) {
    if (!bellEl) return;
    if (typeof window.escapeHtml !== "function") {
      window.escapeHtml = function escapeHtmlFallback(val) {
        const div = document.createElement("div");
        div.textContent = val ?? "";
        return div.innerHTML;
      };
    }

    const mountBell = () => {
      if (typeof window.NotificationBell === "undefined" || typeof window.NotificationBell.init !== "function") {
        return false;
      }
      if (!bellEl.querySelector("#gc-bell-btn")) {
        bellEl.innerHTML = "";
        delete bellEl.dataset.gcBellFallback;
        window.NotificationBell.init({ root: "gc-notif-bell", rootPath: "../" });
      } else if (typeof window.NotificationBell.refreshBadge === "function") {
        window.NotificationBell.refreshBadge();
      }
      return true;
    };

    if (mountBell()) return;

    const existingScript = document.querySelector('script[src*="notifications.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => mountBell(), { once: true });
      setTimeout(() => mountBell(), 120);
      return;
    }

    const script = document.createElement("script");
    script.src = "../js/notifications.js";
    script.addEventListener("load", () => mountBell(), { once: true });
    document.body.appendChild(script);
  }

  function ensureToolbar() {
    let bar = document.querySelector("aside.fc-right-bar");
    if (!bar) {
      bar = document.createElement("aside");
      bar.className = "fc-right-bar gc-rightbar-fixed";
      bar.setAttribute("aria-label", "Thanh công cụ nhanh và tài khoản");
      document.body.append(bar);
      document.body.classList.add("gc-rightbar-has-fixed");
    }
    bar.classList.add("gc-rightbar-unified");
    addStyles();

    // Luôn tạo node Avatar mới để gỡ bỏ mọi event listener trùng lặp từ script riêng của từng trang
    const oldAvatar = bar.querySelector(".fc-avatar-menu-wrapper");
    const avatar = createAvatar(oldAvatar);
    avatar.dataset.gcRightTool = "avatar";

    let vs = bar.querySelector('[data-gc-right-tool="vs"]')
      || bar.querySelector(".community-vs")
      || Array.from(bar.querySelectorAll("a,button")).find((child) => child.href?.includes("quick-match.html") || child.textContent.trim() === "VS");
    if (!vs) vs = createLink("quick-match.html", "Tìm đội nhanh (VS)", "VS");
    vs = asLink(vs, "quick-match.html", "Tìm đội nhanh (VS)", "VS");
    vs.dataset.gcRightTool = "vs";

    let bell = bar.querySelector("#gc-notif-bell") || document.getElementById("gc-notif-bell");
    if (!bell) {
      bell = document.createElement("div");
      bell.id = "gc-notif-bell";
    }
    bell.dataset.gcRightTool = "notifications";

    let invite = bar.querySelector('[data-gc-right-tool="invite"]')
      || bar.querySelector('a[href="friends.html?tab=received"]')
      || bar.querySelector('button[data-quick-tab="received"]')
      || bar.querySelector('a[title*="Thêm bạn"]');
    if (!invite) invite = createLink("friends.html?tab=received", "Lời mời kết bạn", ICONS.invite);
    invite = asLink(invite, "friends.html?tab=received", "Lời mời kết bạn", ICONS.invite);
    invite.dataset.gcRightTool = "invite";

    let friendList = bar.querySelector('[data-gc-right-tool="friends"]')
      || bar.querySelector('a[href="friends.html"]')
      || bar.querySelector('button[data-quick-tab="friends"]');
    if (!friendList) friendList = createLink("friends.html", "Danh sách bạn bè", ICONS.friends);
    friendList = asLink(friendList, "friends.html", "Danh sách bạn bè", ICONS.friends);
    friendList.dataset.gcRightTool = "friends";

    let create = bar.querySelector('[data-gc-right-tool="create"]')
      || bar.querySelector('a[href="quick-match.html?view=lobby"]');
    if (!create) create = createLink("quick-match.html?view=lobby", "Tạo phòng đội", ICONS.create);
    create = asLink(create, "quick-match.html?view=lobby", "Tạo phòng đội", ICONS.create);
    create.dataset.gcRightTool = "create";

    let chatList = bar.querySelector("#fc-right-chat-list");
    if (!chatList) {
      chatList = document.createElement("div");
      chatList.id = "fc-right-chat-list";
      chatList.className = "fc-right-chat-list";
      chatList.setAttribute("aria-label", "Tin nhắn bạn bè");
      chatList.hidden = true;
    }
    chatList.dataset.gcRightTool = "chat-list";

    const common = [avatar, vs, bell, invite, friendList, create, chatList];
    // Giữ thanh Taskbar phải giống hệt trang Home trên tất cả các trang
    bar.replaceChildren(...common);

    // Khởi tạo chuông thông báo (có badge số thông báo chưa đọc & dropdown khi ấn vào)
    ensureNotificationBellReady(bell);

    // Khởi tạo menu avatar dropdown (đồng bộ chuẩn với trang Home)
    initAvatarMenu();
  }

  let _avatarDocListenersBound = false;

  // ==================== AVATAR DROPDOWN MENU (CHUẨN TRANG HOME TRÊN MỌI TRANG) ====================
  function initAvatarMenu() {
    const avatarBtn = document.getElementById("btn-avatar-menu");
    const avatarDropdown = document.getElementById("avatar-dropdown-menu");
    if (!avatarBtn || !avatarDropdown) return;

    if (avatarBtn.dataset.gcMenuInit === "true") return;
    avatarBtn.dataset.gcMenuInit = "true";

    // Toggle menu khi nhấn avatar (đóng dropdown thông báo nếu đang mở)
    avatarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const willOpen = avatarDropdown.hidden;
      if (willOpen) {
        const notifDd = document.getElementById("gc-notif-dropdown");
        const notifOverlay = document.getElementById("gc-notif-overlay");
        const notifBtn = document.getElementById("gc-bell-btn");
        if (notifDd) notifDd.hidden = true;
        if (notifOverlay) notifOverlay.hidden = true;
        if (notifBtn) notifBtn.classList.remove("is-open");
      }
      avatarDropdown.hidden = !willOpen;
      avatarBtn.setAttribute("aria-expanded", String(willOpen));
    });

    if (!_avatarDocListenersBound) {
      _avatarDocListenersBound = true;

      // Đóng menu khi nhấn ra ngoài
      document.addEventListener("click", (e) => {
        const currentBtn = document.getElementById("btn-avatar-menu");
        const currentMenu = document.getElementById("avatar-dropdown-menu");
        if (!currentMenu || currentMenu.hidden) return;
        if (!currentMenu.contains(e.target) && (!currentBtn || !currentBtn.contains(e.target))) {
          currentMenu.hidden = true;
          currentBtn?.setAttribute("aria-expanded", "false");
        }
      });

      // Đóng menu khi nhấn Escape
      document.addEventListener("keydown", (e) => {
        const currentBtn = document.getElementById("btn-avatar-menu");
        const currentMenu = document.getElementById("avatar-dropdown-menu");
        if (e.key === "Escape" && currentMenu && !currentMenu.hidden) {
          currentMenu.hidden = true;
          currentBtn?.setAttribute("aria-expanded", "false");
        }
      });
    }

    // Chuyển đổi giao diện sáng/tối
    function applyTheme(theme) {
      const isLight = theme === "light";
      document.body.classList.toggle("fc-light-mode", isLight);
      document.body.dataset.theme = isLight ? "light" : "dark";
      if (!isLight) document.body.classList.add("dark-mode");
      else document.body.classList.remove("dark-mode");
      localStorage.setItem("gc_friends_theme", isLight ? "light" : "dark");

      const checkDark = document.getElementById("check-theme-dark");
      const checkLight = document.getElementById("check-theme-light");
      if (checkDark) checkDark.textContent = isLight ? "" : "✓";
      if (checkLight) checkLight.textContent = isLight ? "✓" : "";

      document.querySelectorAll(".fc-theme-option").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.setTheme === (isLight ? "light" : "dark"));
      });
    }

    // Áp dụng theme đã lưu
    const savedTheme = localStorage.getItem("gc_friends_theme") || "dark";
    applyTheme(savedTheme);

    avatarDropdown.querySelectorAll(".fc-theme-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        applyTheme(opt.dataset.setTheme);
        avatarDropdown.hidden = true;
        avatarBtn.setAttribute("aria-expanded", "false");
      });
    });

    // Đăng xuất
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("remember_login");
        localStorage.removeItem("auth_provider");
        localStorage.removeItem("user_role");
        window.location.href = "../index.html";
      });
    }

    // Tải thông tin user (tên + avatar) chuẩn như trang Home
    loadRightbarUserInfo();

    // Đổi mật khẩu - tạo/gắn modal đổi mật khẩu
    initChangePasswordModal();
  }

  function buildDiceBearAvatar(seed) {
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed || "User")}&backgroundColor=b6e3f4`;
  }

  function resolveAvatarUrl(rawAvatar, seed) {
    if (!rawAvatar || typeof rawAvatar !== "string" || !rawAvatar.trim()) {
      return buildDiceBearAvatar(seed);
    }
    const trimmed = rawAvatar.trim();
    if (/^(https?:|data:|blob:|\.\.\/)/i.test(trimmed)) return trimmed;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
      : "http://127.0.0.1:8000";
    return `${apiBase}/${trimmed.replace(/^\//, "")}`;
  }

  async function loadRightbarUserInfo() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const getNameEl = () =>
      document.getElementById("avatar-user-name") ||
      document.querySelector("#avatar-dropdown-menu .fc-avatar-dropdown-header strong");
    const getAvatarImg = () => document.querySelector(".fc-self-avatar");

    let fallbackName = localStorage.getItem("username") || "Game thủ";
    try {
      const base64Url = token.split(".")[1] || "";
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload.username) {
        fallbackName = payload.username;
      } else if (payload.email && typeof payload.email === "string") {
        fallbackName = payload.email.split("@")[0] || fallbackName;
      } else if (payload.sub) {
        fallbackName = `User #${payload.sub}`;
      }
    } catch (_) {}

    const initialNameEl = getNameEl();
    const initialAvatarImg = getAvatarImg();
    if (initialNameEl && (!initialNameEl.textContent || initialNameEl.textContent.trim() === "Đang tải...")) {
      initialNameEl.textContent = fallbackName;
    }
    if (initialAvatarImg && (!initialAvatarImg.src || initialAvatarImg.src.includes("seed=User"))) {
      initialAvatarImg.src = buildDiceBearAvatar(fallbackName);
      initialAvatarImg.alt = fallbackName;
    }

    if (typeof api === "undefined") return;

    try {
      const meRes = await api.get("/user/me");
      const meData = meRes?.data || meRes || {};
      const username = meData.username || fallbackName;
      let displayName = meData.display_name || username || "Game thủ";
      let avatarUrl = meData.avatar
        ? resolveAvatarUrl(meData.avatar, username)
        : buildDiceBearAvatar(username);

      try {
        const profRes = await api.get("/api/profiles/me");
        const prof = profRes?.data || profRes || {};
        if (prof.display_name) displayName = prof.display_name;
        if (prof.avatar) avatarUrl = resolveAvatarUrl(prof.avatar, username);
      } catch (_) {}

      const nameEl = getNameEl();
      const avatarImg = getAvatarImg();
      if (nameEl) nameEl.textContent = displayName;
      if (avatarImg) {
        avatarImg.src = avatarUrl;
        avatarImg.alt = displayName;
      }
    } catch (_) {}
  }

  function initChangePasswordModal() {
    const openBtn = document.getElementById("open-change-password");
    if (!openBtn) return;

    // Nếu trang chưa có modal đổi mật khẩu, tạo nó; nếu đã có, clone để gỡ bỏ listener trùng lặp
    let modal = document.getElementById("change-password-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "change-password-modal";
      modal.className = "gc-password-modal";
      modal.hidden = true;
      modal.innerHTML = `
        <button type="button" class="gc-password-backdrop" data-close-password aria-label="Đóng popup"></button>
        <section class="gc-password-dialog" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
          <div class="gc-password-heading">
            <div><span class="gc-password-kicker">ACCOUNT SECURITY</span><h2 id="change-password-title">Đổi mật khẩu</h2><p>Cập nhật mật khẩu để bảo vệ tài khoản của bạn.</p></div>
            <button type="button" id="close-change-password" class="gc-password-close" aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form id="change-password-form" class="gc-password-form">
            <label><span>Mật khẩu hiện tại</span><input id="old-password" type="password" autocomplete="current-password" maxlength="128" required></label>
            <label><span>Mật khẩu mới</span><input id="new-password" type="password" autocomplete="new-password" minlength="6" maxlength="128" required><small>Tối thiểu 6 ký tự.</small></label>
            <label><span>Xác nhận mật khẩu mới</span><input id="confirm-password" type="password" autocomplete="new-password" minlength="6" maxlength="128" required></label>
            <p id="change-password-message" class="gc-password-message" role="status" hidden></p>
            <div class="gc-password-actions"><button type="button" id="cancel-change-password" class="gc-password-cancel">Huỷ</button><button type="submit" id="change-password-submit" class="gc-password-submit"><i class="fa-solid fa-key"></i> Cập nhật mật khẩu</button></div>
          </form>
        </section>`;
      document.body.append(modal);
    } else if (modal.dataset.gcPwdModalInit !== "true") {
      const cloned = modal.cloneNode(true);
      modal.replaceWith(cloned);
      modal = cloned;
    }
    modal.dataset.gcPwdModalInit = "true";

    const passwordForm = document.getElementById("change-password-form");
    const passwordMessage = document.getElementById("change-password-message");
    const passwordSubmit = document.getElementById("change-password-submit");
    const avatarDropdown = document.getElementById("avatar-dropdown-menu");

    const setPasswordModal = (open) => {
      if (!modal) return;
      modal.hidden = !open;
      document.body.classList.toggle("gc-password-modal-open", open);
      if (open) {
        if (avatarDropdown) avatarDropdown.hidden = true;
        window.setTimeout(() => document.getElementById("old-password")?.focus(), 30);
      } else {
        passwordForm?.reset();
        if (passwordMessage) {
          passwordMessage.hidden = true;
          passwordMessage.textContent = "";
          passwordMessage.classList.remove("error");
        }
      }
    };

    openBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setPasswordModal(true);
    });

    ["close-change-password", "cancel-change-password"].forEach((id) => {
      document.getElementById(id)?.addEventListener("click", () => setPasswordModal(false));
    });

    modal.querySelectorAll("[data-close-password]").forEach((el) => {
      el.addEventListener("click", () => setPasswordModal(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && !modal.hidden) setPasswordModal(false);
    });

    passwordForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById("old-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const showMsg = (text, isError = false) => {
        passwordMessage.textContent = text;
        passwordMessage.classList.toggle("error", isError);
        passwordMessage.hidden = false;
      };
      if (newPassword !== confirmPassword) { showMsg("Mật khẩu xác nhận không khớp.", true); return; }
      if (oldPassword === newPassword) { showMsg("Mật khẩu mới cần khác mật khẩu hiện tại.", true); return; }
      passwordSubmit.disabled = true;
      passwordSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
      try {
        const response = await api.put("/auth/change-password", { old_password: oldPassword, new_password: newPassword });
        showMsg(response?.message || "Đổi mật khẩu thành công.");
        passwordForm.reset();
      } catch (error) {
        showMsg(error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.", true);
      } finally {
        passwordSubmit.disabled = false;
        passwordSubmit.innerHTML = '<i class="fa-solid fa-key"></i> Cập nhật mật khẩu';
      }
    });
  }

  // ==================== LƯU & ĐỒNG BỘ DANH SÁCH NGƯỜI ĐANG NHẮN TIN QUA LOCALSTORAGE ====================
  function getCurrentJwtUserId() {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return "guest";
      const base64Url = token.split(".")[1] || "";
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      return String(payload.sub || payload.user_id || payload.id || "guest");
    } catch (_) {
      return "guest";
    }
  }

  function getRecentChatStorageKey() {
    return `gc_recent_chat_friends_${getCurrentJwtUserId()}`;
  }

  function buildDefaultAvatar(seed) {
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed || "User")}&backgroundColor=b6e3f4`;
  }

  function resolveChatMediaUrl(rawAvatar, seed) {
    if (!rawAvatar || typeof rawAvatar !== "string" || !rawAvatar.trim()) {
      return buildDefaultAvatar(seed);
    }
    const trimmed = rawAvatar.trim();
    if (/^(https?:|data:|blob:|\.\.\/)/i.test(trimmed)) return trimmed;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
      : "http://127.0.0.1:8000";
    return `${apiBase}/${trimmed.replace(/^\//, "")}`;
  }

  function escapeChatHtml(val) {
    return String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.gcLoadRecentChatFriends = function gcLoadRecentChatFriends() {
    try {
      const raw = localStorage.getItem(getRecentChatStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => x && Number(x.id) > 0) : [];
    } catch (_) {
      return [];
    }
  };

  window.gcSaveRecentChatFriend = function gcSaveRecentChatFriend(friendObj) {
    if (!friendObj) return;
    const fid = Number(friendObj.userId || friendObj.id || friendObj.user_id);
    if (!fid || fid <= 0) return;

    const existingList = window.gcLoadRecentChatFriends();
    const prev = existingList.find((x) => Number(x.id) === fid) || {};
    const username = friendObj.username || prev.username || "";
    const name = friendObj.name || friendObj.display_name || username || prev.name || `Người bạn #${fid}`;
    const avatar = resolveChatMediaUrl(friendObj.avatar || prev.avatar, username || name);
    const presence = friendObj.presence || prev.presence || "online";
    const statusText = friendObj.statusText || prev.statusText || "Đang trực tuyến";

    const entry = {
      id: fid,
      userId: fid,
      username,
      name,
      avatar,
      presence,
      statusText,
      updatedAt: Date.now(),
    };

    const nextList = [entry, ...existingList.filter((x) => Number(x.id) !== fid)].slice(0, 8);
    try {
      localStorage.setItem(getRecentChatStorageKey(), JSON.stringify(nextList));
    } catch (_) {}
    return entry;
  };

  // ==================== KHUNG CHAT 1-1 TOÀN HỆ THỐNG CHO CÁC TRANG NGOÀI FRIENDS.HTML ====================
  function initGlobalChatAcrossPages() {
    if (!localStorage.getItem("access_token") || typeof api === "undefined") return;

    // Nếu đang ở trang friends.html (đã có initDirectChat của friends.js), chỉ cần render lại danh sách avatar
    const isFriendsPage = location.pathname.split("/").pop() === "friends.html";
    if (isFriendsPage && typeof window.renderRightBarChatHeads === "function") {
      window.renderRightBarChatHeads();
      return;
    }

    const gChat = {
      activeFriendId: null,
      isMinimized: false,
      messages: [],
      lastMessageId: 0,
      isSending: false,
      friendsById: new Map(),
      unreadByFriend: {},
      unreadSenders: {},
      activePollTimer: null,
      unreadPollTimer: null,
      ws: null,
      wsReconnectTimer: null,
    };

    // Khởi tạo từ bộ nhớ recent trong localStorage
    window.gcLoadRecentChatFriends().forEach((f) => {
      gChat.friendsById.set(Number(f.id), f);
    });

    function ensureChatWidgetDom() {
      let widget = document.getElementById("fc-chat-widget");
      if (widget) return widget;

      widget = document.createElement("aside");
      widget.id = "fc-chat-widget";
      widget.className = "fc-chat-widget";
      widget.setAttribute("aria-label", "Khung chat 1-1 với bạn bè");
      widget.hidden = true;
      widget.innerHTML = `
        <header class="fc-chat-header" id="fc-chat-header">
          <div class="fc-chat-user-info">
            <div class="fc-chat-avatar-wrap">
              <img
                id="fc-chat-avatar"
                src="https://api.dicebear.com/9.x/adventurer/svg?seed=User&backgroundColor=b6e3f4"
                alt="Avatar bạn bè"
                class="fc-chat-avatar"
              >
              <span id="fc-chat-presence" class="fc-presence-badge fc-presence-online"></span>
            </div>
            <div class="fc-chat-user-meta">
              <strong id="fc-chat-name" class="fc-chat-name">Người chơi</strong>
              <span id="fc-chat-status" class="fc-chat-status is-online">Đang trực tuyến</span>
            </div>
          </div>
          <div class="fc-chat-header-actions">
            <button type="button" id="fc-chat-minimize-btn" class="fc-chat-icon-btn" title="Thu nhỏ / Mở rộng khung chat" aria-label="Thu nhỏ khung chat">—</button>
            <button type="button" id="fc-chat-close-btn" class="fc-chat-icon-btn" title="Đóng khung chat" aria-label="Đóng khung chat">✕</button>
          </div>
        </header>
        <div id="fc-chat-messages" class="fc-chat-messages" role="log" aria-live="polite"></div>
        <form id="fc-chat-form" class="fc-chat-input-bar" autocomplete="off">
          <input
            type="text"
            id="fc-chat-input"
            class="fc-chat-input"
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            maxlength="2000"
          >
          <button type="submit" id="fc-chat-send-btn" class="fc-chat-send-btn">Gửi</button>
        </form>
      `;
      document.body.appendChild(widget);

      const header = widget.querySelector("#fc-chat-header");
      const minBtn = widget.querySelector("#fc-chat-minimize-btn");
      const closeBtn = widget.querySelector("#fc-chat-close-btn");
      const form = widget.querySelector("#fc-chat-form");

      minBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleGlobalMinimize();
      });
      closeBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        closeGlobalChat();
      });
      header?.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        toggleGlobalMinimize();
      });
      form?.addEventListener("submit", handleGlobalSend);

      return widget;
    }

    function resolveFriendMeta(friendId) {
      const fid = Number(friendId);
      if (gChat.friendsById.has(fid)) return gChat.friendsById.get(fid);
      const sender = gChat.unreadSenders[String(fid)];
      if (sender) {
        const uname = sender.username || "";
        const dname = sender.display_name || uname || `Người bạn #${fid}`;
        const built = {
          id: fid,
          userId: fid,
          username: uname,
          name: dname,
          avatar: resolveChatMediaUrl(sender.avatar, uname || dname),
          presence: "online",
          statusText: "Đang trực tuyến",
        };
        gChat.friendsById.set(fid, built);
        return built;
      }
      const fromStorage = window.gcLoadRecentChatFriends().find((x) => Number(x.id) === fid);
      if (fromStorage) {
        gChat.friendsById.set(fid, fromStorage);
        return fromStorage;
      }
      return {
        id: fid,
        userId: fid,
        username: "",
        name: `Người bạn #${fid}`,
        avatar: buildDefaultAvatar(`user${fid}`),
        presence: "online",
        statusText: "Đang trực tuyến",
      };
    }

    function renderGlobalRightChatHeads() {
      const listEl = document.getElementById("fc-right-chat-list");
      if (!listEl) return;

      const seen = new Set();
      const orderedIds = [];
      const pushId = (rawId) => {
        const fid = Number(rawId);
        if (!fid || fid <= 0 || seen.has(fid)) return;
        seen.add(fid);
        orderedIds.push(fid);
      };

      // 1. Bạn bè có tin nhắn chưa đọc
      Object.keys(gChat.unreadByFriend)
        .filter((k) => Number(gChat.unreadByFriend[k]) > 0)
        .forEach(pushId);

      // 2. Người đang mở khung chat
      if (gChat.activeFriendId) pushId(gChat.activeFriendId);

      // 3. Danh sách người vừa nhắn tin gần đây đã lưu trong localStorage
      window.gcLoadRecentChatFriends().forEach((item) => {
        gChat.friendsById.set(Number(item.id), {
          ...(gChat.friendsById.get(Number(item.id)) || {}),
          ...item,
        });
        pushId(item.id);
      });

      if (orderedIds.length === 0) {
        listEl.hidden = true;
        listEl.innerHTML = "";
        return;
      }

      listEl.hidden = false;
      listEl.innerHTML = orderedIds
        .slice(0, 8)
        .map((fid) => {
          const friend = resolveFriendMeta(fid);
          const cnt = Number(gChat.unreadByFriend[String(fid)] || 0);
          const isActive = Number(gChat.activeFriendId) === fid;
          const presenceClass = friend.presence === "ingame"
            ? "fc-presence-ingame"
            : (friend.presence === "offline" ? "fc-presence-offline" : "fc-presence-online");
          const badgeHtml = cnt > 0
            ? `<span class="fc-right-chat-badge">${cnt > 99 ? "99+" : cnt}</span>`
            : "";
          const titleText = cnt > 0
            ? `${friend.name} · ${cnt} tin nhắn chưa đọc (Nhấn để mở chat)`
            : `${friend.name} (Nhấn để mở chat)`;

          return `
            <button
              type="button"
              class="fc-right-chat-item ${cnt > 0 ? "has-unread" : ""} ${isActive ? "is-active" : ""}"
              data-chat-head-id="${fid}"
              title="${escapeChatHtml(titleText)}"
              aria-label="${escapeChatHtml(titleText)}"
            >
              <img src="${escapeChatHtml(friend.avatar)}" alt="${escapeChatHtml(friend.name)}" class="fc-right-chat-avatar">
              <span class="fc-right-chat-presence ${presenceClass}"></span>
              ${badgeHtml}
            </button>
          `;
        })
        .join("");
    }

    function formatGlobalChatTime(isoStr) {
      if (!isoStr) return "";
      const dt = new Date(isoStr);
      if (Number.isNaN(dt.getTime())) return "";
      return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
    }

    function renderGlobalMessages(autoScroll = true) {
      const box = document.getElementById("fc-chat-messages");
      if (!box) return;
      if (!gChat.messages.length) {
        box.innerHTML = `<div class="fc-chat-welcome">Hãy gửi lời chào để bắt đầu trò chuyện hoặc rủ vào đội!</div>`;
        return;
      }
      const myId = Number(getCurrentJwtUserId());
      box.innerHTML = gChat.messages.map((m) => {
        const isMine = Boolean(m.is_mine || (myId > 0 && Number(m.sender_id) === myId));
        const timeText = formatGlobalChatTime(m.created_at);
        const readText = isMine ? (m.is_read ? "Đã xem" : "Đã gửi") : "";
        return `
          <div class="fc-chat-msg ${isMine ? "is-mine" : "is-theirs"}" data-msg-id="${Number(m.id) || 0}">
            <div class="fc-chat-bubble">${escapeChatHtml(m.content || "")}</div>
            <div class="fc-chat-msg-meta">
              ${timeText ? `<span>${escapeChatHtml(timeText)}</span>` : ""}
              ${readText ? `<span>· ${readText}</span>` : ""}
            </div>
          </div>
        `;
      }).join("");
      if (autoScroll) box.scrollTop = box.scrollHeight;
    }

    function appendGlobalMessages(list, autoScroll = true) {
      if (!Array.isArray(list) || !list.length) return;
      let added = false;
      const myId = Number(getCurrentJwtUserId());
      list.forEach((msg) => {
        const msgId = Number(msg.id) || 0;
        const idx = gChat.messages.findIndex((x) => Number(x.id) === msgId && msgId > 0);
        if (idx !== -1) {
          gChat.messages[idx] = { ...gChat.messages[idx], ...msg };
        } else {
          gChat.messages.push(msg);
          added = true;
        }
        if (msgId > gChat.lastMessageId) gChat.lastMessageId = msgId;
        const isMine = Boolean(msg.is_mine || (myId > 0 && Number(msg.sender_id) === myId));
        if (!isMine) {
          gChat.messages.forEach((prev) => {
            if (prev.is_mine) prev.is_read = true;
          });
        }
      });
      if (added) renderGlobalMessages(autoScroll);
    }

    async function loadGlobalChatHistory(friendId, isIncremental = false) {
      if (!friendId) return;
      try {
        const params = isIncremental && gChat.lastMessageId > 0
          ? { after_id: gChat.lastMessageId, limit: 100 }
          : { limit: 100 };
        const res = await api.get(`/chat/messages/${friendId}`, params);
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (Number(gChat.activeFriendId) !== Number(friendId)) return;

        if (!isIncremental) {
          gChat.messages = [];
          gChat.lastMessageId = 0;
          list.forEach((m) => {
            gChat.messages.push(m);
            if (Number(m.id) > gChat.lastMessageId) gChat.lastMessageId = Number(m.id);
          });
          renderGlobalMessages(true);
        } else if (list.length > 0) {
          appendGlobalMessages(list, true);
        }

        delete gChat.unreadByFriend[String(friendId)];
        delete gChat.unreadSenders[String(friendId)];
        renderGlobalRightChatHeads();
      } catch (_) {}
    }

    async function openGlobalChatByFriend(friendOrId, options = {}) {
      const widget = ensureChatWidgetDom();
      const targetId = Number(
        typeof friendOrId === "object" && friendOrId !== null
          ? (friendOrId.userId || friendOrId.id || friendOrId.user_id)
          : friendOrId
      );
      if (options.toggleOnSame && Number(gChat.activeFriendId) === targetId && widget && !widget.hidden) {
        if (gChat.isMinimized) {
          toggleGlobalMinimize();
        } else {
          closeGlobalChat();
        }
        return;
      }

      const friend = typeof friendOrId === "object" && friendOrId !== null
        ? window.gcSaveRecentChatFriend(friendOrId)
        : window.gcSaveRecentChatFriend(resolveFriendMeta(friendOrId));
      if (!friend) return;

      const fid = Number(friend.id);
      gChat.friendsById.set(fid, friend);
      gChat.activeFriendId = fid;
      gChat.isMinimized = false;

      widget.hidden = false;
      widget.classList.remove("is-minimized");
      const minBtn = document.getElementById("fc-chat-minimize-btn");
      if (minBtn) minBtn.textContent = "—";

      const avatarEl = document.getElementById("fc-chat-avatar");
      const nameEl = document.getElementById("fc-chat-name");
      const statusEl = document.getElementById("fc-chat-status");
      const presenceEl = document.getElementById("fc-chat-presence");
      if (avatarEl) {
        avatarEl.src = friend.avatar;
        avatarEl.alt = friend.name;
      }
      if (nameEl) nameEl.textContent = friend.name;
      if (statusEl) {
        statusEl.textContent = friend.statusText || "Đang trực tuyến";
        statusEl.className = `fc-chat-status ${friend.presence === "offline" ? "" : "is-online"}`;
      }
      if (presenceEl) {
        presenceEl.className = `fc-presence-badge ${friend.presence === "offline" ? "fc-presence-offline" : "fc-presence-online"}`;
      }

      delete gChat.unreadByFriend[String(fid)];
      delete gChat.unreadSenders[String(fid)];
      renderGlobalRightChatHeads();

      const box = document.getElementById("fc-chat-messages");
      if (box) box.innerHTML = `<div class="fc-chat-welcome">Đang tải cuộc trò chuyện...</div>`;

      await loadGlobalChatHistory(fid, false);

      if (gChat.activePollTimer) clearInterval(gChat.activePollTimer);
      gChat.activePollTimer = setInterval(() => {
        if (gChat.activeFriendId && !gChat.isMinimized) {
          loadGlobalChatHistory(gChat.activeFriendId, true);
        }
      }, 3000);

      document.getElementById("fc-chat-input")?.focus();
    }

    function closeGlobalChat() {
      const widget = document.getElementById("fc-chat-widget");
      if (gChat.activePollTimer) {
        clearInterval(gChat.activePollTimer);
        gChat.activePollTimer = null;
      }
      gChat.activeFriendId = null;
      gChat.isMinimized = false;
      gChat.messages = [];
      gChat.lastMessageId = 0;
      if (widget) {
        widget.hidden = true;
        widget.classList.remove("is-minimized");
      }
      renderGlobalRightChatHeads();
    }

    function toggleGlobalMinimize() {
      const widget = document.getElementById("fc-chat-widget");
      const minBtn = document.getElementById("fc-chat-minimize-btn");
      if (!widget || widget.hidden) return;
      gChat.isMinimized = !gChat.isMinimized;
      widget.classList.toggle("is-minimized", gChat.isMinimized);
      if (minBtn) minBtn.textContent = gChat.isMinimized ? "▢" : "—";
      if (!gChat.isMinimized && gChat.activeFriendId) {
        delete gChat.unreadByFriend[String(gChat.activeFriendId)];
        loadGlobalChatHistory(gChat.activeFriendId, true);
        document.getElementById("fc-chat-input")?.focus();
      }
      renderGlobalRightChatHeads();
    }

    async function handleGlobalSend(e) {
      e.preventDefault();
      if (gChat.isSending || !gChat.activeFriendId) return;
      const input = document.getElementById("fc-chat-input");
      const sendBtn = document.getElementById("fc-chat-send-btn");
      if (!input) return;
      const content = input.value.trim();
      if (!content) return;

      const targetId = gChat.activeFriendId;
      gChat.isSending = true;
      if (sendBtn) sendBtn.disabled = true;
      try {
        const res = await api.post(`/chat/messages/${targetId}`, { content });
        const msgObj = res?.data || res;
        input.value = "";
        window.gcSaveRecentChatFriend(resolveFriendMeta(targetId));
        renderGlobalRightChatHeads();
        if (msgObj && msgObj.id) {
          appendGlobalMessages([{ ...msgObj, is_mine: true }], true);
        } else {
          await loadGlobalChatHistory(targetId, true);
        }
      } catch (_) {} finally {
        gChat.isSending = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
      }
    }

    async function loadGlobalFriendsAndUnread() {
      try {
        const [friendsSettled, unreadSettled] = await Promise.allSettled([
          api.get("/friend-requests/friends"),
          api.get("/chat/unread-counts"),
        ]);

        if (friendsSettled.status === "fulfilled" && friendsSettled.value) {
          const val = friendsSettled.value;
          const list = Array.isArray(val?.data?.friends)
            ? val.data.friends
            : (Array.isArray(val?.data) ? val.data : (Array.isArray(val) ? val : []));
          list.forEach((raw) => {
            const u = raw?.user || raw || {};
            const fid = Number(u.user_id || u.id || raw.friend_id || raw.id);
            if (!fid) return;
            const uname = u.username || raw.username || "";
            const dname = u.display_name || raw.display_name || uname || `Người bạn #${fid}`;
            const lastSeen = u.last_seen ?? raw.last_seen ?? null;
            const isRecentOnline = lastSeen
              ? (Date.now() - new Date(lastSeen).getTime()) <= 10 * 60 * 1000
              : Boolean(u.is_online ?? raw.is_online);
            const meta = {
              id: fid,
              userId: fid,
              username: uname,
              name: dname,
              avatar: resolveChatMediaUrl(u.avatar ?? raw.avatar, uname || dname),
              presence: isRecentOnline ? "online" : "offline",
              statusText: isRecentOnline ? "Đang trực tuyến" : "Ngoại tuyến",
            };
            gChat.friendsById.set(fid, meta);
          });
        }

        if (unreadSettled.status === "fulfilled" && unreadSettled.value) {
          const res = unreadSettled.value;
          const byFriend = res?.data?.by_friend || res?.by_friend || {};
          const senders = Array.isArray(res?.data?.senders)
            ? res.data.senders
            : (Array.isArray(res?.senders) ? res.senders : []);

          gChat.unreadByFriend = {};
          gChat.unreadSenders = {};

          senders.forEach((s) => {
            if (!s || !s.user_id) return;
            gChat.unreadSenders[String(s.user_id)] = s;
          });

          Object.entries(byFriend).forEach(([fId, cnt]) => {
            const num = Number(cnt) || 0;
            const isOpenNow = Number(gChat.activeFriendId) === Number(fId) && !gChat.isMinimized;
            if (num > 0 && !isOpenNow) {
              gChat.unreadByFriend[String(fId)] = num;
              window.gcSaveRecentChatFriend(resolveFriendMeta(Number(fId)));
            }
          });
        }

        renderGlobalRightChatHeads();
      } catch (_) {}
    }

    window.openChatByFriendId = async function openChatByFriendId(friendOrId, options = {}) {
      await openGlobalChatByFriend(friendOrId, options);
    };

    renderGlobalRightChatHeads();
    loadGlobalFriendsAndUnread();

    if (gChat.unreadPollTimer) clearInterval(gChat.unreadPollTimer);
    gChat.unreadPollTimer = setInterval(loadGlobalFriendsAndUnread, 4000);
  }

  // Event delegation toàn cục cho cú click vào avatar ở #fc-right-chat-list trên MỌI TRANG
  document.addEventListener("click", (e) => {
    const itemBtn = e.target.closest("#fc-right-chat-list button[data-chat-head-id]");
    if (!itemBtn) return;
    const fid = Number(itemBtn.dataset.chatHeadId);
    if (!fid) return;

    if (typeof window.openChatByFriendId === "function") {
      window.openChatByFriendId(fid, { toggleOnSame: true });
    } else {
      window.location.href = `friends.html?chat=${encodeURIComponent(fid)}`;
    }
  });

  const run = () => {
    if (["login.html", "register.html"].includes(location.pathname.split("/").pop())) return;
    ensureToolbar();
    initGlobalChatAcrossPages();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
