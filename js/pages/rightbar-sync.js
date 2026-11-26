// Đồng bộ thanh công cụ nhanh bên phải trên các trang đã đăng nhập.
(() => {
  const ICONS = {
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>',
    invite: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6m3-3h-6"></path></svg>',
    friends: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    create: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>',
  };

  function addStyles() {
    if (document.querySelector('link[data-gc-rightbar-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "../css/rightbar.css";
    link.dataset.gcRightbarCss = "true";
    document.head.append(link);
  }

  function createAvatar() {
    const wrapper = document.createElement("div");
    wrapper.className = "fc-avatar-menu-wrapper";
    wrapper.dataset.gcRightTool = "avatar";
    wrapper.innerHTML = '<a href="profile.html" class="fc-self-avatar-wrap" title="Mở hồ sơ game thủ" aria-label="Mở hồ sơ game thủ"><img src="https://api.dicebear.com/9.x/adventurer/svg?seed=User&backgroundColor=b6e3f4" alt="Avatar của bạn" class="fc-self-avatar"><span class="fc-status-dot"></span></a>';
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

    let avatar = bar.querySelector(":scope > .fc-avatar-menu-wrapper");
    if (!avatar) avatar = createAvatar();
    avatar.dataset.gcRightTool = "avatar";

    let vs = bar.querySelector('[data-gc-right-tool="vs"]')
      || bar.querySelector(".community-vs")
      || Array.from(bar.children).find((child) => child.matches("a,button") && (child.href?.includes("quick-match.html") || child.textContent.trim() === "VS"));
    if (!vs) vs = createLink("quick-match.html", "Đấu nhanh VS", "VS");
    vs = asLink(vs, "quick-match.html", "Đấu nhanh VS", "VS");
    vs.dataset.gcRightTool = "vs";

    let bell = bar.querySelector(":scope > #gc-notif-bell");
    if (!bell) {
      bell = createLink("notifications.html", "Thông báo", ICONS.bell);
      bell.id = "gc-notif-bell";
      bell.dataset.gcBellFallback = "true";
    }
    // Keep the notification icon visible if NotificationBell has not rendered yet
    // (for example, when auth initialization is delayed or the module exits early).
    if (!bell.querySelector(".gc-notif-bell-btn") && !bell.querySelector(":scope > a")) {
      const fallback = createLink("notifications.html", "Thông báo", ICONS.bell);
      fallback.dataset.gcBellFallback = "true";
      bell.append(fallback);
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
    if (friendList.tagName === "A") {
      friendList = asLink(friendList, "friends.html", "Danh sách bạn bè", ICONS.friends);
    } else {
      friendList.title = "Danh sách bạn bè";
      friendList.setAttribute("aria-label", "Danh sách bạn bè");
      friendList.innerHTML = ICONS.friends;
    }
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
    // Keep the rail identical on every page while preserving the friend chat heads list below "+".
    bar.replaceChildren(...common);
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
