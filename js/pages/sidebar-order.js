// Chuẩn hóa thứ tự, vạch ngăn cách mục Câu lạc bộ và hiển thị danh sách Câu lạc bộ đã tham gia / làm chủ dưới mục Câu lạc bộ.
(() => {
  const entries = [
    { href: "quick-match.html", label: "Tìm đội nhanh", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' },
    { href: "quick-match.html?view=rooms", label: "Tìm phòng", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>' },
    { href: "community.html", label: "Bảng tin", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"></path><path d="M3 6h.01M3 12h.01M3 18h.01"></path></svg>' },
    { href: "friends.html", label: "Bạn bè & Kết nối", icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { href: "clubs.html", label: "Câu lạc bộ", dividerBefore: true, icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3"></circle><circle cx="6" cy="17" r="3"></circle><circle cx="18" cy="17" r="3"></circle><path d="m10.5 9.5-3 5m6-5 3 5m-7.5 4h6"></path></svg>' },
  ];

  function ensureSidebarClubStyles() {
    if (document.getElementById("gc-sidebar-clubs-style")) return;
    const style = document.createElement("style");
    style.id = "gc-sidebar-clubs-style";
    style.textContent = `
      .fc-sidebar-my-clubs {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }
      .fc-sidebar-my-clubs[hidden] {
        display: none !important;
      }
      .fc-sidebar-club-item {
        height: 40px;
      }
      .fc-sidebar-club-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
        background: #ffffff;
        border: 1px solid var(--fc-border-strong, #31374a);
        flex-shrink: 0;
        display: block;
      }
      .fc-sidebar-club-initials {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--fc-bg-surface, #1e2230);
        border: 1px solid var(--fc-border-strong, #31374a);
        color: var(--fc-text, #f1f5f9);
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: -0.3px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .fc-sidebar-club-item .fc-nav-label {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);
  }

  function escapeClubHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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

  function resolveClubLogo(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) return "";
    const trimmed = rawUrl.trim();
    if (/^(https?:|data:|blob:|\.\.\/)/i.test(trimmed)) return trimmed;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
      : "http://127.0.0.1:8000";
    return `${apiBase}/${trimmed.replace(/^\//, "")}`;
  }

  function extractClubsArray(payload) {
    const unwrapped = payload?.data !== undefined ? payload.data : payload;
    if (Array.isArray(unwrapped)) return unwrapped;
    if (Array.isArray(unwrapped?.teams)) return unwrapped.teams;
    if (Array.isArray(unwrapped?.items)) return unwrapped.items;
    if (Array.isArray(payload?.teams)) return payload.teams;
    return [];
  }

  function renderMyClubsIntoSidebars(clubsList) {
    const clubs = Array.isArray(clubsList) ? clubsList : [];
    const currentFile = (window.location.pathname.split("/").pop() || "").toLowerCase();
    const activeFeedId = currentFile === "team-feed.html"
      ? Number(new URLSearchParams(window.location.search).get("id"))
      : 0;

    document.querySelectorAll("[data-sidebar-my-clubs]").forEach((container) => {
      if (clubs.length === 0) {
        container.hidden = true;
        container.innerHTML = "";
        return;
      }

      if (activeFeedId > 0) {
        const sidebar = container.closest("aside.fc-left-bar");
        sidebar?.querySelectorAll("a.fc-nav-item.active, a.fc-nav-item.is-current").forEach((el) => {
          el.classList.remove("active", "is-current");
          el.removeAttribute("aria-current");
        });
      }

      container.hidden = false;
      container.innerHTML = clubs.map((club) => {
        const clubId = Number(club.id) || 0;
        const isCurrent = activeFeedId > 0 && clubId === activeFeedId;
        const clubName = String(club.name || `CLB #${clubId || ""}`).trim();
        const initials = escapeClubHtml(getClubInitials(clubName));
        const logoUrl = resolveClubLogo(club.logo_url || club.logo);
        const iconContent = logoUrl
          ? `<img src="${escapeClubHtml(logoUrl)}" alt="${escapeClubHtml(clubName)}" class="fc-sidebar-club-avatar" onerror="this.outerHTML='<span class=\\'fc-sidebar-club-initials\\'>${initials}</span>'">`
          : `<span class="fc-sidebar-club-initials">${initials}</span>`;

        return `
          <a href="team-feed.html?id=${clubId}&tab=chat" class="fc-nav-item fc-sidebar-club-item${isCurrent ? " active is-current" : ""}" data-sidebar-club-id="${clubId}" title="Mở chat ${escapeClubHtml(clubName)}"${isCurrent ? ' aria-current="page"' : ""}>
            <span class="fc-nav-icon" aria-hidden="true">${iconContent}</span>
            <span class="fc-nav-label">${escapeClubHtml(clubName)}</span>
          </a>
        `;
      }).join("");
    });
  }

  async function fetchAndRenderSidebarMyClubs(prefetchedList = null) {
    ensureSidebarClubStyles();
    if (Array.isArray(prefetchedList)) {
      renderMyClubsIntoSidebars(prefetchedList);
      return;
    }
    if (!localStorage.getItem("access_token") || typeof api === "undefined") {
      renderMyClubsIntoSidebars([]);
      return;
    }
    try {
      const response = await api.get("/api/teams/me");
      const myClubs = extractClubsArray(response);
      renderMyClubsIntoSidebars(myClubs);
    } catch (_) {
      // Giữ nguyên nếu chưa tải được
    }
  }

  window.gcRefreshSidebarClubs = fetchAndRenderSidebarMyClubs;

  function isSidebarAdminUser() {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    const storedRole = String(localStorage.getItem("user_role") || "").toUpperCase();
    if (storedRole === "ADMIN") return true;
    let role = storedRole;
    try {
      const base64Url = token.split(".")[1] || "";
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload?.role) role = payload.role;
    } catch (_) {}
    return String(role).toUpperCase() === "ADMIN";
  }

  const ADMIN_ENTRIES = [
    {
      href: "admin-dashboard.html",
      label: "Dashboard Thống Kê",
      color: "#f59e0b",
      icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    },
    {
      href: "admin-reports.html",
      label: "Quản lý Báo cáo",
      color: "#ef4444",
      icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    },
    {
      href: "admin_users.html",
      label: "Quản lý Người dùng",
      color: "#38bdf8",
      icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><circle cx="18" cy="16" r="3"></circle><path d="M18 11.5v1.5m0 6v1.5m4.5-4.5h-1.5m-6 0h-1.5"></path></svg>',
    },
  ];

  function normalizeSidebar(sidebar) {
    const group = sidebar.querySelector(".fc-bar-group");
    if (!group) return;
    const brand = group.querySelector(".fc-brand-link");
    sidebar.querySelectorAll('a.fc-nav-item[href="teams.html"],a.fc-nav-item[href="my-team.html"]').forEach((link) => link.remove());
    let cursor = brand;
    if (brand?.nextElementSibling?.classList.contains("fc-nav-divider")) cursor = brand.nextElementSibling;
    if (!cursor) return;

    const isAdmin = isSidebarAdminUser();
    const currentFile = (window.location.pathname.split("/").pop() || "").toLowerCase();
    const activeAdminHref = currentFile === "admin_user-detail.html" ? "admin_users.html" : currentFile;

    // Chuẩn hóa 3 mục Admin (.admin-nav-item): chỉ hiển thị khi đăng nhập bằng tài khoản ADMIN
    ADMIN_ENTRIES.forEach((adm) => {
      let adminLink = sidebar.querySelector(`a.admin-nav-item[href="${adm.href}"]`);
      if (!adminLink) {
        adminLink = document.createElement("a");
        adminLink.href = adm.href;
        adminLink.className = "fc-nav-item admin-nav-item";
        adminLink.title = adm.label;
        adminLink.innerHTML = `<span class="fc-nav-icon" style="color:${adm.color}">${adm.icon}</span><span class="fc-nav-label">${adm.label}</span>`;
      } else {
        adminLink.remove();
      }
      if (activeAdminHref === adm.href) {
        adminLink.classList.add("active");
        adminLink.setAttribute("aria-current", "page");
      }
      adminLink.style.display = isAdmin ? "" : "none";
      cursor.after(adminLink);
      cursor = adminLink;
    });

    // Xoá vạch ngăn cách Câu lạc bộ cũ (nếu chạy lại) để chèn đúng vị trí
    sidebar.querySelectorAll(".fc-clubs-divider").forEach((el) => el.remove());

    entries.forEach((entry) => {
      const link = Array.from(sidebar.querySelectorAll("a.fc-nav-item")).find(
        (candidate) => candidate.getAttribute("href") === entry.href
      );
      if (!link) return;

      const icon = link.querySelector(".fc-nav-icon");
      const label = link.querySelector(".fc-nav-label");
      if (icon) {
        const badge = icon.querySelector(".fc-nav-badge");
        icon.innerHTML = `${entry.icon}${badge ? badge.outerHTML : ""}`;
      }
      if (label) label.textContent = entry.label;
      link.title = entry.label;

      link.remove();

      if (entry.dividerBefore) {
        const divider = document.createElement("div");
        divider.className = "fc-nav-divider fc-clubs-divider";
        cursor.after(divider);
        cursor = divider;
      }

      cursor.after(link);
      cursor = link;

      if (entry.href === "clubs.html") {
        let myClubsBox = sidebar.querySelector("[data-sidebar-my-clubs]");
        if (!myClubsBox) {
          myClubsBox = document.createElement("div");
          myClubsBox.className = "fc-sidebar-my-clubs";
          myClubsBox.setAttribute("data-sidebar-my-clubs", "true");
          myClubsBox.hidden = true;
        } else {
          myClubsBox.remove();
        }
        cursor.after(myClubsBox);
        cursor = myClubsBox;
      }
    });
  }

  const run = () => {
    ensureSidebarClubStyles();
    document.querySelectorAll("aside.fc-left-bar").forEach(normalizeSidebar);
    fetchAndRenderSidebarMyClubs();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
