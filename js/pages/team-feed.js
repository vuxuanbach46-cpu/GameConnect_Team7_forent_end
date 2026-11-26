/* Không gian Câu lạc bộ: Bảng tin Đội trưởng & Danh sách Thành viên CLB */
(() => {
  const teamId = Number(new URLSearchParams(window.location.search).get("id"));
  const postList = document.getElementById("feed-post-list");
  const emptyBox = document.getElementById("feed-empty");
  const accessDenied = document.getElementById("feed-access-denied");
  const captainTools = document.getElementById("feed-captain-tools");
  const modal = document.getElementById("feed-modal");
  const form = document.getElementById("feed-post-form");
  const postType = document.getElementById("feed-post-type");
  const scheduleFields = document.getElementById("feed-schedule-fields");
  const filterSelect = document.getElementById("feed-filter");
  const filterTabs = document.querySelectorAll("[data-filter-tab]");

  const membersListEl = document.getElementById("club-members-list");
  const membersCountEl = document.getElementById("club-members-count");
  const memberSearchInput = document.getElementById("club-member-search-input");
  const memberPopover = document.getElementById("club-member-popover");
  const popoverAvatar = document.getElementById("club-popover-avatar");
  const popoverName = document.getElementById("club-popover-name");
  const popoverRole = document.getElementById("club-popover-role");
  const popoverProfileLink = document.getElementById("club-popover-profile-link");

  let currentTeam = null;
  let teamDetail = null;
  let posts = [];
  let clubMembers = [];
  let activeMemberUsername = null;

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
      renderFeed();
      renderClubMembers();

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
    if (membersListEl) {
      membersListEl.innerHTML = `
        <div class="club-members-empty">
          <i class="fa-solid fa-lock" style="display:block;font-size:18px;margin-bottom:8px;opacity:0.7"></i>
          Hãy tham gia câu lạc bộ để xem danh sách thành viên.
        </div>
      `;
    }
  }

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

  memberSearchInput?.addEventListener("input", () => {
    closeMemberPopover();
    renderClubMembers();
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
    }
  });

  loadClubWorkspace();
})();
