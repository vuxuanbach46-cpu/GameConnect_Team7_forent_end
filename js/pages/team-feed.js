/* Không gian Câu lạc bộ: Bảng tin Đội trưởng & Danh sách Thành viên CLB */
(() => {
  const teamId = Number(new URLSearchParams(window.location.search).get("id"));
  const postList = document.getElementById("feed-post-list");
  const emptyBox = document.getElementById("feed-empty");
  const accessDenied = document.getElementById("feed-access-denied");
  const captainTools = document.getElementById("feed-captain-tools");
  const joinRequestsPanel = document.getElementById("feed-join-requests");
  const joinRequestsList = document.getElementById("feed-join-requests-list");
  const joinRequestsCount = document.getElementById("feed-join-requests-count");
  const modal = document.getElementById("feed-modal");
  const form = document.getElementById("feed-post-form");
  const postType = document.getElementById("feed-post-type");
  const scheduleFields = document.getElementById("feed-schedule-fields");
  const filterSelect = document.getElementById("feed-filter");
  const filterTabs = document.querySelectorAll("[data-filter-tab]");

  const membersListEl = document.getElementById("club-members-list");
  const membersCountEl = document.getElementById("club-members-count");
  const inviteFriendsButton = document.getElementById("btn-invite-club-friend");
  const inviteModal = document.getElementById("club-invite-modal");
  const inviteList = document.getElementById("club-invite-list");
  const inviteStatus = document.getElementById("club-invite-status");
  const inviteSearch = document.getElementById("club-invite-search");
  const memberSearchInput = document.getElementById("club-member-search-input");
  const memberPopover = document.getElementById("club-member-popover");
  const popoverAvatar = document.getElementById("club-popover-avatar");
  const popoverName = document.getElementById("club-popover-name");
  const popoverRole = document.getElementById("club-popover-role");
  const popoverProfileLink = document.getElementById("club-popover-profile-link");
  const clubChatMessagesEl = document.getElementById("club-chat-messages");
  const clubChatStatusEl = document.getElementById("club-chat-status");
  const clubChatForm = document.getElementById("club-chat-form");
  const clubChatInput = document.getElementById("club-chat-input");
  const clubChatSendButton = document.getElementById("club-chat-send");

  let currentTeam = null;
  let teamDetail = null;
  let posts = [];
  let clubMembers = [];
  let activeMemberUsername = null;
  let lastClubChatMessageId = 0;
  let clubChatMessages = [];
  let clubChatTimer = null;
  let clubChatInitialized = false;
  let invitableFriends = [];
  const sentClubInvites = new Set();

  function setClubWorkspaceTab(tab, updateUrl = true) {
    const activeTab = tab === "chat" ? "chat" : "feed";
    document.querySelectorAll("[data-club-tab]").forEach((button) => {
      const selected = button.dataset.clubTab === activeTab;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll("[data-club-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.clubPanel !== activeTab;
    });
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (activeTab === "chat") url.searchParams.set("tab", "chat");
      else url.searchParams.delete("tab");
      window.history.replaceState({}, "", url);
    }
    if (activeTab === "chat") {
      requestAnimationFrame(() => { clubChatMessagesEl.scrollTop = clubChatMessagesEl.scrollHeight; });
      clubChatInput?.focus({ preventScroll: true });
    }
  }

  function renderClubChatMessages() {
    if (!clubChatMessagesEl) return;
    if (!clubChatMessages.length) {
      clubChatMessagesEl.innerHTML = '<div class="club-chat-empty"><i class="fa-regular fa-message"></i><strong>Chưa có tin nhắn nào</strong><span>Hãy bắt đầu cuộc trò chuyện của câu lạc bộ.</span></div>';
      return;
    }
    clubChatMessagesEl.innerHTML = clubChatMessages.map((message) => {
      const name = message.sender_name || message.sender_username || "Thành viên";
      const avatar = getMemberAvatar(name, message.avatar);
      const date = message.created_at ? new Date(message.created_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "";
      return `<article class="club-chat-row${message.is_mine ? " is-mine" : ""}" data-chat-message="${Number(message.id)}">
        <img class="club-chat-avatar" src="${escapeFeedHTML(avatar)}" alt="" loading="lazy">
        <div class="club-chat-message-wrap"><div class="club-chat-meta"><strong class="club-chat-author">${escapeFeedHTML(message.is_mine ? "Bạn" : name)}</strong><time>${escapeFeedHTML(date)}</time></div><div class="club-chat-bubble">${escapeFeedHTML(message.content || "")}</div></div>
      </article>`;
    }).join("");
  }

  async function loadClubChatMessages(initial = false) {
    if (!Number.isSafeInteger(teamId) || teamId <= 0) return;
    try {
      const params = !initial && lastClubChatMessageId > 0 ? { after_id: lastClubChatMessageId, limit: 100 } : { limit: 100 };
      const response = await api.get(`/api/teams/${teamId}/chat/messages`, params);
      const data = unwrapPayload(response);
      const incoming = Array.isArray(data?.messages) ? data.messages : [];
      const wasNearBottom = clubChatMessagesEl.scrollHeight - clubChatMessagesEl.scrollTop - clubChatMessagesEl.clientHeight < 90;
      const knownIds = new Set(clubChatMessages.map((item) => Number(item.id)));
      incoming.forEach((item) => {
        const id = Number(item.id);
        if (!knownIds.has(id)) clubChatMessages.push(item);
        if (id > lastClubChatMessageId) lastClubChatMessageId = id;
      });
      clubChatMessages.sort((a, b) => Number(a.id) - Number(b.id));
      clubChatMessages = clubChatMessages.slice(-200);
      renderClubChatMessages();
      if (initial || wasNearBottom) clubChatMessagesEl.scrollTop = clubChatMessagesEl.scrollHeight;
      if (clubChatStatusEl) clubChatStatusEl.textContent = "Tin nhắn được lưu và cập nhật tự động.";
      if (clubChatForm) clubChatForm.hidden = false;
    } catch (error) {
      if (clubChatStatusEl) clubChatStatusEl.textContent = error.message || "Không tải được chat. Chỉ thành viên câu lạc bộ mới có quyền truy cập.";
      if (clubChatForm) clubChatForm.hidden = true;
    }
  }

  function initClubChat() {
    if (clubChatInitialized) return;
    clubChatInitialized = true;
    loadClubChatMessages(true);
    clubChatTimer = window.setInterval(() => {
      if (!document.hidden && !document.getElementById("club-chat-panel")?.hidden) {
        loadClubChatMessages(false);
      }
    }, 3000);
  }

  function escapeFeedHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function unwrapPayload(res) {
    return res && typeof res === "object" && res.data !== undefined ? res.data : res;
  }

  async function loadPendingJoinRequests() {
    if (!joinRequestsPanel || !joinRequestsList || currentTeam?.role !== "captain" || teamDetail?.join_mode !== "APPROVAL_REQUIRED") return;
    joinRequestsPanel.hidden = false;
    joinRequestsList.innerHTML = '<p class="feed-join-requests-state"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang tải yêu cầu...</p>';
    try {
      const response = await api.get(`/api/teams/${teamId}/join-requests`);
      const requests = unwrapPayload(response);
      const items = Array.isArray(requests) ? requests : [];
      joinRequestsCount.textContent = String(items.length);
      joinRequestsList.innerHTML = items.length ? items.map((request) => `
        <article class="feed-join-request" role="listitem" data-join-request-row="${Number(request.id)}">
          <div class="feed-join-request-person"><span class="feed-join-request-avatar">${escapeFeedHTML(String(request.username || "G").slice(0, 1).toUpperCase())}</span><div><strong>${escapeFeedHTML(request.username || `Người chơi #${request.user_id}`)}</strong><p>${escapeFeedHTML(request.message || "Không có lời nhắn kèm theo.")}</p></div></div>
          <div class="feed-join-request-actions"><button type="button" data-review-join="${Number(request.id)}" data-review-status="ACCEPTED" title="Duyệt thành viên" aria-label="Duyệt yêu cầu của ${escapeFeedHTML(request.username || "thành viên")}"><i class="fa-solid fa-check" aria-hidden="true"></i> Duyệt</button><button type="button" data-review-join="${Number(request.id)}" data-review-status="REJECTED" title="Từ chối yêu cầu" aria-label="Từ chối yêu cầu của ${escapeFeedHTML(request.username || "thành viên")}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
        </article>`).join("") : '<p class="feed-join-requests-state"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Chưa có yêu cầu nào đang chờ duyệt.</p>';
    } catch (error) {
      joinRequestsCount.textContent = "!";
      joinRequestsList.innerHTML = `<p class="feed-join-requests-state is-error">${escapeFeedHTML(error.message || "Không tải được yêu cầu tham gia.")}</p>`;
    }
  }

  async function reviewJoinRequest(requestId, status, button) {
    const row = button.closest("[data-join-request-row]");
    row?.querySelectorAll("button").forEach((item) => { item.disabled = true; });
    try {
      await api.patch(`/api/teams/${teamId}/join-requests/${requestId}`, { status });
      const pending = loadPendingJoinRequests();
      if (status === "ACCEPTED") {
        const detailResponse = await api.get(`/api/teams/${teamId}`);
        teamDetail = unwrapPayload(detailResponse);
        clubMembers = Array.isArray(teamDetail?.members) ? teamDetail.members : clubMembers;
        updateClubBanner();
        renderClubMembers();
      }
      await pending;
      const notice = document.getElementById("feed-join-request-notice");
      if (notice) notice.hidden = true;
    } catch (error) {
      if (row?.isConnected) {
        row.querySelectorAll("button").forEach((item) => { item.disabled = false; });
        const notice = document.getElementById("feed-join-request-notice");
        if (notice) { notice.textContent = error.message || "Không thể xử lý yêu cầu."; notice.hidden = false; }
      }
    }
  }

  function resolveMediaUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) return "";
    const trimmed = rawUrl.trim();
    if (/^(https?:|data:|blob:|\.\.\/)/i.test(trimmed)) return trimmed;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
      : "http://127.0.0.1:8000";
    return `${apiBase}/${trimmed.replace(/^\//, "")}`;
  }

  function getClubInitials(name) {
    return String(name || "GC")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "GC";
  }

  function getClubShortTag(name) {
    const cleaned = String(name || "CLUB").replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, "").toUpperCase();
    return cleaned.slice(0, 7) || "CLUB";
  }

  function getMemberAvatar(username, avatarUrl) {
    const resolved = resolveMediaUrl(avatarUrl);
    if (resolved) return resolved;
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(username || "Player")}&backgroundColor=b6e3f4`;
  }

  function renderInvitableFriends() {
    if (!inviteList) return;
    const query = String(inviteSearch?.value || "").trim().toLocaleLowerCase("vi");
    const filtered = invitableFriends.filter((friend) => String(friend.username || "").toLocaleLowerCase("vi").includes(query));
    if (!filtered.length) {
      inviteList.innerHTML = `<div class="club-invite-empty"><i class="fa-solid fa-user-group" aria-hidden="true"></i><strong>${invitableFriends.length ? "Không tìm thấy bạn bè phù hợp" : "Chưa có bạn bè có thể mời"}</strong><span>${invitableFriends.length ? "Thử tìm với tên khác." : "Bạn bè đã ở trong CLB hoặc đã có lời mời đang chờ sẽ không xuất hiện tại đây."}</span></div>`;
      return;
    }
    inviteList.innerHTML = filtered.map((friend) => {
      const friendId = Number(friend.user_id);
      const sent = sentClubInvites.has(friendId);
      const avatar = getMemberAvatar(friend.username, friend.avatar);
      return `<article class="club-invite-friend" role="listitem" data-invite-friend="${friendId}"><img src="${escapeFeedHTML(avatar)}" alt="" loading="lazy"><div class="club-invite-friend-meta"><strong>${escapeFeedHTML(friend.username || "Người chơi")}</strong><span>${sent ? "Đã gửi lời mời" : "Bạn bè của bạn"}</span></div><button type="button" class="club-invite-send" data-send-club-invite="${friendId}" ${sent ? "disabled" : ""}>${sent ? '<i class="fa-solid fa-check"></i> Đã gửi' : '<i class="fa-solid fa-user-plus"></i> Mời'}</button></article>`;
    }).join("");
  }

  async function openClubInviteModal() {
    if (!inviteModal || !teamId) return;
    inviteModal.hidden = false;
    document.body.classList.add("club-invite-open");
    inviteStatus.classList.remove("is-error");
    inviteStatus.textContent = "Đang tải bạn bè...";
    inviteList.replaceChildren();
    inviteSearch.value = "";
    inviteSearch.focus();
    try {
      const response = await api.get("/api/team-invitations/available-friends", { team_id: teamId });
      const data = unwrapPayload(response);
      invitableFriends = Array.isArray(data) ? data : [];
      inviteStatus.textContent = `${invitableFriends.length} bạn bè có thể mời`;
      renderInvitableFriends();
    } catch (error) {
      inviteStatus.textContent = error.message || "Không tải được danh sách bạn bè.";
      inviteList.replaceChildren();
    }
  }

  function closeClubInviteModal() {
    if (!inviteModal) return;
    inviteModal.hidden = true;
    document.body.classList.remove("club-invite-open");
  }

  async function sendClubInvite(friendId, button) {
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang gửi';
    try {
      await api.post("/api/team-invitations", { team_id: teamId, user_id: friendId });
      sentClubInvites.add(friendId);
      inviteStatus.classList.remove("is-error");
      inviteStatus.textContent = "Đã gửi lời mời thành công.";
      renderInvitableFriends();
    } catch (error) {
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-user-plus" aria-hidden="true"></i> Mời';
      inviteStatus.textContent = error.message || "Không thể gửi lời mời.";
      inviteStatus.classList.add("is-error");
    }
  }

  function initAdminSidebarVisibility() {
    const token = localStorage.getItem("access_token");
    let role = localStorage.getItem("user_role") || "";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload?.role) role = payload.role;
      } catch (_) {}
    }
    const isAdmin = Boolean(token) && String(role).toUpperCase() === "ADMIN";
    document.querySelectorAll(".admin-nav-item").forEach((item) => {
      item.style.display = isAdmin ? "" : "none";
    });
  }

  function initClubRightbar() {
    const avatarButton = document.getElementById("btn-avatar-menu");
    const avatarMenu = document.getElementById("avatar-dropdown-menu");
    const avatarName = document.getElementById("avatar-user-name");
    const avatarImage = document.querySelector(".fc-self-avatar");
    const changePasswordButton = document.getElementById("open-change-password");
    const passwordModal = document.getElementById("change-password-modal");
    const passwordForm = document.getElementById("change-password-form");
    const passwordMessage = document.getElementById("change-password-message");
    const passwordSubmit = document.getElementById("change-password-submit");
    const savedTheme = localStorage.getItem("gc_friends_theme") || "dark";

    const applyTheme = (theme) => {
      const light = theme === "light";
      document.body.classList.toggle("fc-light-mode", light);
      localStorage.setItem("gc_friends_theme", light ? "light" : "dark");
      document.querySelectorAll(".fc-theme-option").forEach((button) => {
        const selected = button.dataset.setTheme === (light ? "light" : "dark");
        button.classList.toggle("active", selected);
        const check = button.querySelector(".fc-theme-check");
        if (check) check.textContent = selected ? "✓" : "";
      });
    };

    applyTheme(savedTheme);
    avatarButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!avatarMenu) return;
      avatarMenu.hidden = !avatarMenu.hidden;
      avatarButton.setAttribute("aria-expanded", String(!avatarMenu.hidden));
    });
    document.querySelectorAll(".fc-theme-option").forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(button.dataset.setTheme);
        if (avatarMenu) avatarMenu.hidden = true;
        avatarButton?.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", (event) => {
      if (avatarMenu && !avatarMenu.hidden && !avatarMenu.contains(event.target) && !avatarButton?.contains(event.target)) {
        avatarMenu.hidden = true;
        avatarButton?.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && avatarMenu) {
        avatarMenu.hidden = true;
        avatarButton?.setAttribute("aria-expanded", "false");
      }
    });
    document.getElementById("logout-btn")?.addEventListener("click", () => {
      ["access_token", "refresh_token", "remember_login", "auth_provider", "user_role"].forEach((key) => localStorage.removeItem(key));
      window.location.href = "../index.html";
    });

    if (changePasswordButton) {
      changePasswordButton.hidden = String(localStorage.getItem("auth_provider") || "").toLowerCase() === "google";
      const setPasswordModal = (open) => {
        if (!passwordModal) return;
        passwordModal.hidden = !open;
        document.body.classList.toggle("gc-password-modal-open", open);
        if (open) {
          if (avatarMenu) avatarMenu.hidden = true;
          avatarButton?.setAttribute("aria-expanded", "false");
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
      changePasswordButton.addEventListener("click", (event) => {
        event.stopPropagation();
        setPasswordModal(true);
      });
      ["close-change-password", "cancel-change-password"].forEach((id) => {
        document.getElementById(id)?.addEventListener("click", () => setPasswordModal(false));
      });
      passwordModal?.querySelectorAll("[data-close-password]").forEach((element) => {
        element.addEventListener("click", () => setPasswordModal(false));
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && passwordModal && !passwordModal.hidden) setPasswordModal(false);
      });
      passwordForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById("old-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const showMessage = (message, isError = false) => {
          passwordMessage.textContent = message;
          passwordMessage.classList.toggle("error", isError);
          passwordMessage.hidden = false;
        };
        if (newPassword !== confirmPassword) return showMessage("Mật khẩu xác nhận không khớp.", true);
        if (oldPassword === newPassword) return showMessage("Mật khẩu mới cần khác mật khẩu hiện tại.", true);
        passwordSubmit.disabled = true;
        passwordSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang cập nhật...';
        try {
          const response = await api.put("/auth/change-password", { old_password: oldPassword, new_password: newPassword });
          showMessage(response?.message || "Đổi mật khẩu thành công.");
          passwordForm.reset();
        } catch (error) {
          showMessage(error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.", true);
        } finally {
          passwordSubmit.disabled = false;
          passwordSubmit.innerHTML = '<i class="fa-solid fa-key" aria-hidden="true"></i> Cập nhật mật khẩu';
        }
      });
    }

    let fallbackName = localStorage.getItem("username") || "Game thủ";
    try {
      const token = localStorage.getItem("access_token") || "";
      const payload = JSON.parse(atob((token.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")));
      fallbackName = payload.username || (payload.email ? payload.email.split("@")[0] : payload.sub) || fallbackName;
    } catch (_) {}
    if (avatarName) avatarName.textContent = fallbackName;
    if (avatarImage) avatarImage.alt = `Avatar của ${fallbackName}`;

    if (localStorage.getItem("access_token") && typeof api !== "undefined") {
      api.get("/user/me").then((response) => {
        const user = unwrapPayload(response) || {};
        const username = user.username || fallbackName;
        if (avatarName) avatarName.textContent = username;
        return api.get("/api/profiles/me");
      }).then((response) => {
        const profile = unwrapPayload(response) || {};
        if (profile.display_name && avatarName) avatarName.textContent = profile.display_name;
        if (profile.avatar && avatarImage) avatarImage.src = resolveMediaUrl(profile.avatar);
      }).catch(() => {});
    }
  }

  function updateClubBanner() {
    const name = teamDetail?.name || currentTeam?.name || `Câu lạc bộ #${teamId}`;
    document.getElementById("feed-team-name").textContent = name;
    document.title = `${name} · Câu lạc bộ | GameConnect`;

    const isCaptain = currentTeam?.role === "captain";
    const roleEl = document.getElementById("feed-user-role");
    if (roleEl) {
      roleEl.innerHTML = isCaptain
        ? '<i class="fa-solid fa-crown" style="color:#f59e0b;margin-right:5px"></i>Đội trưởng'
        : "Thành viên";
    }

    const avatarBox = document.getElementById("feed-club-avatar");
    if (avatarBox) {
      const logoUrl = resolveMediaUrl(teamDetail?.logo_url || teamDetail?.logo);
      const initials = escapeFeedHTML(getClubInitials(name));
      avatarBox.innerHTML = logoUrl
        ? `<img src="${escapeFeedHTML(logoUrl)}" alt="${escapeFeedHTML(name)}" onerror="this.outerHTML='<span>${initials}</span>'">`
        : `<span>${initials}</span>`;
    }

    const gameBadge = document.getElementById("feed-game-badge");
    if (gameBadge) {
      const gameName = teamDetail?.game_name || "CÂU LẠC BỘ";
      gameBadge.textContent = `🎮 ${String(gameName).toUpperCase()}`;
    }

    const memberRatio = document.getElementById("feed-member-ratio");
    if (memberRatio) {
      const total = Number(teamDetail?.total_members ?? clubMembers.length ?? 0);
      const max = Number(teamDetail?.max_members ?? 0);
      memberRatio.textContent = max > 0 ? `${total} / ${max} thành viên` : `${total} thành viên`;
    }

    const descEl = document.getElementById("feed-team-desc");
    if (descEl && teamDetail?.description) {
      descEl.textContent = teamDetail.description;
    }
  }

  function renderFeed() {
    const filter = filterSelect ? filterSelect.value : "all";
    const annCount = posts.filter((p) => p.type === "announcement").length;
    const schCount = posts.filter((p) => p.type === "schedule").length;

    const annEl = document.getElementById("announcement-count");
    const schEl = document.getElementById("schedule-count");
    if (annEl) annEl.textContent = String(annCount);
    if (schEl) schEl.textContent = String(schCount);

    filterTabs.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filterTab === filter);
    });

    const filtered = posts.filter((p) => filter === "all" || p.type === filter);
    postList.innerHTML = filtered.map((post) => {
      const isSchedule = post.type === "schedule";
      const authorName = post.author || "Đội trưởng";
      const authorAvatar = getMemberAvatar(authorName, post.authorAvatar);
      const timeStr = post.createdAt
        ? new Date(post.createdAt).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "";

      return `
        <article class="feed-post-card ${isSchedule ? "is-schedule" : "is-announcement"}">
          <div class="feed-post-top">
            <div class="feed-post-author">
              <div class="feed-post-author-avatar-wrap">
                <img src="${escapeFeedHTML(authorAvatar)}" alt="${escapeFeedHTML(authorName)}" class="feed-post-author-avatar">
                <span class="feed-post-captain-star" title="Đội trưởng CLB">★</span>
              </div>
              <div class="feed-post-author-meta">
                <div class="feed-post-author-line">
                  <strong class="feed-post-author-name">${escapeFeedHTML(authorName)}</strong>
                  <span class="feed-post-role-chip"><i class="fa-solid fa-crown"></i> Đội trưởng</span>
                </div>
                <span class="feed-post-date">${escapeFeedHTML(timeStr)}</span>
              </div>
            </div>
            <span class="feed-post-badge ${isSchedule ? "schedule" : "announcement"}">
              ${isSchedule ? "📅 Lịch hoạt động" : "📢 Thông báo CLB"}
            </span>
          </div>

          <h3 class="feed-post-title">${escapeFeedHTML(post.title)}</h3>
          <p class="feed-post-body">${escapeFeedHTML(post.content)}</p>

          ${isSchedule ? `
            <div class="feed-schedule-banner">
              <div class="feed-schedule-item">
                <i class="fa-regular fa-calendar-check"></i>
                <span>Ngày chơi: <strong>${escapeFeedHTML(post.playDate || "—")}</strong></span>
              </div>
              <div class="feed-schedule-item">
                <i class="fa-regular fa-clock"></i>
                <span>Giờ bắt đầu: <strong>${escapeFeedHTML(post.playTime || "—")}</strong></span>
              </div>
            </div>
          ` : ""}
        </article>
      `;
    }).join("");

    postList.hidden = filtered.length === 0;
    emptyBox.hidden = filtered.length > 0;
  }

  function renderClubMembers() {
    if (!membersListEl) return;
    const keyword = (memberSearchInput?.value || "").trim().toLowerCase();
    const totalCount = clubMembers.length;
    if (membersCountEl) membersCountEl.textContent = String(totalCount);

    const filtered = clubMembers.filter((m) => {
      const uname = String(m.username || "").toLowerCase();
      return !keyword || uname.includes(keyword);
    });

    if (filtered.length === 0) {
      membersListEl.innerHTML = `
        <div class="club-members-empty">
          ${keyword ? "Không tìm thấy thành viên phù hợp." : "Chưa có thành viên nào trong CLB."}
        </div>
      `;
      return;
    }

    const clubName = teamDetail?.name || currentTeam?.name || "CLUB";
    const clubLogo = resolveMediaUrl(teamDetail?.logo_url || teamDetail?.logo);
    const clubShortTag = escapeFeedHTML(getClubShortTag(clubName));
    const gameName = teamDetail?.game_name || "";

    membersListEl.innerHTML = filtered.map((member) => {
      const username = String(member.username || `Player_${member.user_id || ""}`).trim();
      const isCaptain = String(member.role || "").toUpperCase() === "CAPTAIN";
      const avatarSrc = getMemberAvatar(username, member.avatar_url || member.avatar);
      const starTitle = isCaptain ? "Club Captain · Đội trưởng CLB" : "Club supporter · Thành viên CLB";
      const subText = isCaptain
        ? `Đội trưởng${gameName ? ` · ${gameName}` : ""}`
        : (gameName ? `Playing · ${gameName}` : "Thành viên CLB");

      const badgeHtml = clubLogo
        ? `<img src="${escapeFeedHTML(clubLogo)}" alt="${escapeFeedHTML(clubName)}" class="club-member-emblem-img" onerror="this.outerHTML='<span class=\\'club-member-emblem-tag\\'>${clubShortTag}</span>'">`
        : `<span class="club-member-emblem-tag">${clubShortTag}</span>`;

      const isSelected = activeMemberUsername && activeMemberUsername === username;

      return `
        <button
          type="button"
          class="club-member-item${isSelected ? " is-selected" : ""}"
          data-member-username="${escapeFeedHTML(username)}"
          data-member-role="${isCaptain ? "CAPTAIN" : "MEMBER"}"
          data-member-avatar="${escapeFeedHTML(avatarSrc)}"
          role="listitem"
        >
          <span class="club-member-avatar-box">
            <img src="${escapeFeedHTML(avatarSrc)}" alt="${escapeFeedHTML(username)}" class="club-member-avatar" loading="lazy">
            <span class="club-member-star ${isCaptain ? "is-captain" : "is-member"}" data-tooltip="${escapeFeedHTML(starTitle)}">★</span>
            <span class="club-member-status-dot" aria-hidden="true"></span>
          </span>

          <span class="club-member-info">
            <span class="club-member-name">${escapeFeedHTML(username)}</span>
            <span class="club-member-sub">${escapeFeedHTML(subText)}</span>
          </span>

          <span class="club-member-emblem" title="${escapeFeedHTML(clubName)}">
            ${badgeHtml}
          </span>
        </button>
      `;
    }).join("");
  }

  function closeMemberPopover() {
    activeMemberUsername = null;
    if (memberPopover) memberPopover.hidden = true;
    document.querySelectorAll(".club-member-item.is-selected").forEach((el) => {
      el.classList.remove("is-selected");
    });
  }

  function openMemberPopover(buttonEl) {
    if (!memberPopover || !buttonEl) return;
    const username = buttonEl.getAttribute("data-member-username") || "";
    const role = buttonEl.getAttribute("data-member-role") || "MEMBER";
    const avatar = buttonEl.getAttribute("data-member-avatar") || getMemberAvatar(username);

    if (activeMemberUsername === username && !memberPopover.hidden) {
      closeMemberPopover();
      return;
    }

    activeMemberUsername = username;
    document.querySelectorAll(".club-member-item.is-selected").forEach((el) => {
      el.classList.toggle("is-selected", el === buttonEl);
    });

    if (popoverAvatar) {
      popoverAvatar.src = avatar;
      popoverAvatar.alt = username;
    }
    if (popoverName) popoverName.textContent = username;
    if (popoverRole) {
      popoverRole.innerHTML = role === "CAPTAIN"
        ? '<i class="fa-solid fa-crown" style="color:#f59e0b"></i> Đội trưởng Câu lạc bộ'
        : '<i class="fa-solid fa-star" style="color:#38bdf8"></i> Thành viên Câu lạc bộ';
    }
    if (popoverProfileLink) {
      popoverProfileLink.href = `profile.html?username=${encodeURIComponent(username)}`;
    }

    memberPopover.hidden = false;

    const panelRect = document.getElementById("club-members-panel")?.getBoundingClientRect();
    const rowRect = buttonEl.getBoundingClientRect();
    if (panelRect) {
      const popoverHeight = memberPopover.offsetHeight || 118;
      let topPos = rowRect.bottom - panelRect.top + 4;
      if (topPos + popoverHeight > panelRect.height - 12) {
        topPos = Math.max(12, rowRect.top - panelRect.top - popoverHeight - 4);
      }
      memberPopover.style.top = `${topPos}px`;
    }
  }

  async function loadClubWorkspace() {
    initAdminSidebarVisibility();

    if (!Number.isSafeInteger(teamId) || teamId <= 0) {
      return deny("Không tìm thấy mã câu lạc bộ hợp lệ.");
    }
    if (!localStorage.getItem("access_token") && !localStorage.getItem("token")) {
      return deny("Vui lòng đăng nhập và tham gia câu lạc bộ để xem thông báo từ Đội trưởng.");
    }

    try {
      const [feedResponse, detailResponse] = await Promise.all([
        api.get(`/api/teams/${teamId}/feed`),
        api.get(`/api/teams/${teamId}`).catch(() => null),
      ]);

      const feedData = unwrapPayload(feedResponse);
      currentTeam = feedData?.team || { id: teamId, name: `Câu lạc bộ #${teamId}`, role: "member" };
      posts = Array.isArray(feedData?.posts) ? feedData.posts : [];

      teamDetail = detailResponse ? unwrapPayload(detailResponse) : null;
      clubMembers = Array.isArray(teamDetail?.members) ? teamDetail.members : [];

      updateClubBanner();
      captainTools.hidden = currentTeam.role !== "captain";
      if (inviteFriendsButton) inviteFriendsButton.hidden = !["captain", "member"].includes(currentTeam.role);
      await loadPendingJoinRequests();
      renderFeed();
      renderClubMembers();
      initClubChat();

      if (typeof window.gcRefreshSidebarClubs === "function") {
        window.gcRefreshSidebarClubs();
      }
    } catch (error) {
      deny(error.message || "Chỉ thành viên đã tham gia câu lạc bộ mới được xem bảng tin này.");
    }
  }

  function deny(message) {
    const summary = document.querySelector(".feed-summary");
    const toolbar = document.querySelector(".feed-toolbar");
    if (summary) summary.hidden = true;
    if (toolbar) toolbar.hidden = true;
    if (captainTools) captainTools.hidden = true;
    if (postList) postList.hidden = true;
    if (emptyBox) emptyBox.hidden = true;
    if (accessDenied) {
      const p = accessDenied.querySelector("p");
      if (p) p.textContent = message;
      accessDenied.hidden = false;
    }
    if (clubChatStatusEl) clubChatStatusEl.textContent = message;
    if (clubChatForm) clubChatForm.hidden = true;
    if (membersListEl) {
      membersListEl.innerHTML = `
        <div class="club-members-empty">
          <i class="fa-solid fa-lock" style="display:block;font-size:18px;margin-bottom:8px;opacity:0.7"></i>
          Hãy tham gia câu lạc bộ để xem danh sách thành viên.
        </div>
      `;
    }
  }

  document.querySelectorAll("[data-club-tab]").forEach((button) => {
    button.addEventListener("click", () => setClubWorkspaceTab(button.dataset.clubTab));
  });
  setClubWorkspaceTab(new URLSearchParams(window.location.search).get("tab"), false);

  clubChatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = (clubChatInput?.value || "").trim();
    if (!content || !teamId) return;
    clubChatSendButton.disabled = true;
    try {
      const response = await api.post(`/api/teams/${teamId}/chat/messages`, { content });
      const message = unwrapPayload(response);
      if (message?.id) {
        clubChatMessages.push(message);
        lastClubChatMessageId = Math.max(lastClubChatMessageId, Number(message.id));
        clubChatMessages = clubChatMessages.slice(-200);
        renderClubChatMessages();
        clubChatMessagesEl.scrollTop = clubChatMessagesEl.scrollHeight;
      }
      clubChatInput.value = "";
      clubChatStatusEl.textContent = "Đã gửi tin nhắn.";
      clubChatInput.focus();
    } catch (error) {
      clubChatStatusEl.textContent = error.message || "Không gửi được tin nhắn.";
    } finally {
      clubChatSendButton.disabled = false;
    }
  });

  function closeFeedModal() {
    if (modal) modal.hidden = true;
  }

  function updateScheduleFields() {
    if (!postType || !scheduleFields) return;
    const isSchedule = postType.value === "schedule";
    scheduleFields.hidden = !isSchedule;
    const dateInput = document.getElementById("feed-play-date");
    const timeInput = document.getElementById("feed-play-time");
    if (dateInput) dateInput.required = isSchedule;
    if (timeInput) timeInput.required = isSchedule;
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const value = tab.dataset.filterTab || "all";
      if (filterSelect) filterSelect.value = value;
      renderFeed();
    });
  });

  filterSelect?.addEventListener("change", renderFeed);

  document.getElementById("btn-create-post")?.addEventListener("click", () => {
    if (!currentTeam || currentTeam.role !== "captain") return;
    form?.reset();
    const errEl = document.getElementById("feed-form-error");
    if (errEl) errEl.hidden = true;
    if (scheduleFields) scheduleFields.hidden = true;
    updateScheduleFields();
    if (modal) modal.hidden = false;
    setTimeout(() => document.getElementById("feed-post-title")?.focus(), 40);
  });

  document.getElementById("btn-close-feed-modal")?.addEventListener("click", closeFeedModal);
  document.getElementById("btn-cancel-feed")?.addEventListener("click", closeFeedModal);
  postType?.addEventListener("change", updateScheduleFields);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentTeam || currentTeam.role !== "captain") return;
    const errorEl = document.getElementById("feed-form-error");
    const type = postType.value;
    const body = {
      type,
      title: document.getElementById("feed-post-title").value.trim(),
      content: document.getElementById("feed-post-content").value.trim(),
    };
    if (type === "schedule") {
      body.play_date = document.getElementById("feed-play-date").value;
      body.play_time = document.getElementById("feed-play-time").value;
    }
    if (!body.title || !body.content || (type === "schedule" && (!body.play_date || !body.play_time))) {
      if (errorEl) {
        errorEl.textContent = "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.";
        errorEl.hidden = false;
      }
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      await api.post(`/api/teams/${teamId}/feed`, body);
      if (filterSelect) filterSelect.value = "all";
      closeFeedModal();
      await loadClubWorkspace();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || "Không thể đăng bài thông báo.";
        errorEl.hidden = false;
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  membersListEl?.addEventListener("click", (event) => {
    const memberBtn = event.target.closest(".club-member-item");
    if (!memberBtn) return;
    event.stopPropagation();
    openMemberPopover(memberBtn);
  });

  joinRequestsList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-join]");
    if (!button) return;
    reviewJoinRequest(Number(button.dataset.reviewJoin), button.dataset.reviewStatus, button);
  });

  memberSearchInput?.addEventListener("input", () => {
    closeMemberPopover();
    renderClubMembers();
  });

  inviteFriendsButton?.addEventListener("click", openClubInviteModal);
  inviteSearch?.addEventListener("input", renderInvitableFriends);
  inviteModal?.querySelectorAll("[data-close-club-invite]").forEach((button) => button.addEventListener("click", closeClubInviteModal));
  inviteList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-send-club-invite]");
    if (button) sendClubInvite(Number(button.dataset.sendClubInvite), button);
  });

  document.addEventListener("click", (event) => {
    if (!memberPopover || memberPopover.hidden) return;
    if (memberPopover.contains(event.target) || event.target.closest(".club-member-item")) return;
    closeMemberPopover();
  });

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeFeedModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeFeedModal();
      closeMemberPopover();
      closeClubInviteModal();
    }
  });

  initClubRightbar();
  loadClubWorkspace();
})();
