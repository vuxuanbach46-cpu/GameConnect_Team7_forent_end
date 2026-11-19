// ============================================================
// js/pages/my-team-posts.js  –  Bài của tôi và Người ứng tuyển
// Mã task: T3CCE75
// ============================================================

// 1. Kiểm tra xác thực & Lấy thông tin user
const currentUser = getCurrentUser();
if (!currentUser || !currentUser.id) {
  window.location.href = "login.html";
}

function getCurrentUser() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub ? Number(payload.sub) : null,
      username: payload.username || null,
      email: payload.email || null,
      role: payload.role || localStorage.getItem("user_role") || "USER",
    };
  } catch (e) {
    return null;
  }
}

// 2. DOM Elements
const tabBtnMyPosts    = document.getElementById("tab-btn-my-posts");
const tabBtnApplied    = document.getElementById("tab-btn-applied");
const panelMyPosts     = document.getElementById("panel-my-posts");
const panelApplied     = document.getElementById("panel-applied");

const myPostsContainer = document.getElementById("my-posts-container");
const appliedContainer = document.getElementById("applied-container");

// Profile Modal elements
const profileModalOverlay = document.getElementById("profile-modal-overlay");
const btnCloseProfileModal= document.getElementById("btn-close-profile-modal");
const btnDoneProfile      = document.getElementById("btn-done-profile");
const pmAvatar            = document.getElementById("pm-avatar");
const pmUsername          = document.getElementById("pm-username");
const pmBio               = document.getElementById("pm-bio");
const pmRegion            = document.getElementById("pm-region");
const pmPlaytime          = document.getElementById("pm-playtime");
const pmMic               = document.getElementById("pm-mic");
const pmRole              = document.getElementById("pm-role");

// Edit Modal elements
const editModalOverlay    = document.getElementById("edit-modal-overlay");
const btnCloseEditModal   = document.getElementById("btn-close-edit-modal");
const btnCancelEdit       = document.getElementById("btn-cancel-edit");
const editPostForm        = document.getElementById("edit-post-form");
const editFormError       = document.getElementById("edit-form-error");
const editGame            = document.getElementById("edit-game");
const editMinRank         = document.getElementById("edit-min-rank");
const editMaxRank         = document.getElementById("edit-max-rank");
const editRolesWrap       = document.getElementById("edit-roles-wrap");

// State
let gamesCatalog = [];
let myPostsList = [];
let myApplicationsList = [];
let activePostStatusFilter = "ALL";
let activeAppStatusFilter = "ALL";

// ============================================================
// 3. Khởi tạo & Tab routing
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  initUserHeaderAndTheme();
  await loadGamesCatalog();

  // Kiểm tra query parameter ?tab=applied
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get("tab");
  if (activeTab === "applied") {
    switchTab("applied");
  } else {
    switchTab("my-posts");
  }

  setupEventListeners();
  loadMyPosts();
  loadMyApplications();
});

function initUserHeaderAndTheme() {
  const nameEl = document.getElementById("user-header-name");
  const avatarEl = document.getElementById("user-avatar-img");
  if (currentUser) {
    if (nameEl) nameEl.textContent = currentUser.username || "Game thủ";
    if (avatarEl) {
      avatarEl.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(currentUser.username || "Gamer")}&backgroundColor=b6e3f4`;
    }
  }

  // Theme support
  const applyTheme = (theme) => {
    const isLight = theme === "light";
    document.body.classList.toggle("fc-light-mode", isLight);
    const checkDark = document.getElementById("check-theme-dark");
    const checkLight = document.getElementById("check-theme-light");
    if (checkDark) checkDark.textContent = isLight ? "" : "✓";
    if (checkLight) checkLight.textContent = isLight ? "✓" : "";
    document.querySelectorAll(".fc-theme-option[data-set-theme]").forEach((btn) => {
      const selected = btn.dataset.setTheme === theme;
      btn.classList.toggle("active", selected);
    });
    localStorage.setItem("gc_friends_theme", theme);
  };

  applyTheme(localStorage.getItem("gc_friends_theme") || "dark");

  const avatarMenuButton = document.getElementById("btn-avatar-menu");
  const avatarDropdownMenu = document.getElementById("avatar-dropdown-menu");
  if (avatarMenuButton && avatarDropdownMenu) {
    avatarMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarDropdownMenu.hidden = !avatarDropdownMenu.hidden;
    });

    document.querySelectorAll(".fc-theme-option[data-set-theme]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        applyTheme(btn.dataset.setTheme);
        avatarDropdownMenu.hidden = true;
      });
    });

    document.addEventListener("click", (e) => {
      if (!avatarDropdownMenu.hidden && !avatarDropdownMenu.contains(e.target)) {
        avatarDropdownMenu.hidden = true;
      }
    });
  }

  const logoutBtn = document.getElementById("btn-header-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      window.location.href = "login.html";
    });
  }
}

function switchTab(tabName) {
  if (tabName === "applied") {
    tabBtnMyPosts.classList.remove("active");
    tabBtnApplied.classList.add("active");
    panelMyPosts.hidden = true;
    panelApplied.hidden = false;
  } else {
    tabBtnApplied.classList.remove("active");
    tabBtnMyPosts.classList.add("active");
    panelApplied.hidden = true;
    panelMyPosts.hidden = false;
  }
}

function setupEventListeners() {
  tabBtnMyPosts.addEventListener("click", () => switchTab("my-posts"));
  tabBtnApplied.addEventListener("click", () => switchTab("applied"));

  // Post filter pills
  document.querySelectorAll("[data-post-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-post-status]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activePostStatusFilter = btn.dataset.postStatus;
      renderMyPosts();
    });
  });

  // Application filter pills
  document.querySelectorAll("[data-app-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-app-status]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeAppStatusFilter = btn.dataset.appStatus;
      renderMyApplications();
    });
  });

  // Modal events
  btnCloseProfileModal.addEventListener("click", closeProfileModal);
  btnDoneProfile.addEventListener("click", closeProfileModal);
  profileModalOverlay.addEventListener("click", (e) => {
    if (e.target === profileModalOverlay) closeProfileModal();
  });

  btnCloseEditModal.addEventListener("click", closeEditModal);
  btnCancelEdit.addEventListener("click", closeEditModal);
  editModalOverlay.addEventListener("click", (e) => {
    if (e.target === editModalOverlay) closeEditModal();
  });
  editPostForm.addEventListener("submit", handleEditFormSubmit);
}

// ============================================================
// 4. Load Games Catalog
// ============================================================
async function loadGamesCatalog() {
  try {
    gamesCatalog = await api.get("/games");
  } catch (err) {
    console.warn("Không tải được danh mục game:", err.message);
  }
}

function getGameById(id) {
  return gamesCatalog.find((g) => g.id === Number(id));
}

// ============================================================
// 5. Tải & Hiển thị BÀI ĐĂNG CỦA TÔI (My Posts & Applicants)
// ============================================================
async function loadMyPosts() {
  try {
    let posts = [];
    // Thử gọi endpoint chuyên biệt nếu có
    try {
      posts = await api.get("/team-posts/me/posts");
    } catch (e) {
      // Fallback: Lấy danh sách bài đăng chung và lọc theo user_id
      const res = await api.get("/team-posts", {
        include_expired: true,
        limit: 100,
        status: null,
      });
      const allItems = res.items || [];
      posts = allItems.filter((p) => p.user_id === currentUser.id);
    }

    // Nạp chi tiết applications cho từng bài của tôi
    const detailedPosts = await Promise.all(
      posts.map(async (p) => {
        if (p.applications && p.applications.length > 0) return p;
        try {
          const detail = await api.get(`/team-posts/${p.id}`);
          return { ...p, applications: detail.applications || [] };
        } catch (err) {
          try {
            const apps = await api.get(`/team-posts/${p.id}/applications`);
            return { ...p, applications: apps || [] };
          } catch (err2) {
            return { ...p, applications: [] };
          }
        }
      })
    );

    myPostsList = detailedPosts;
    updateMyPostsStats();
    renderMyPosts();
  } catch (err) {
    myPostsContainer.innerHTML = `
      <div class="card empty-state">
        <p class="text-error"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi khi tải bài đăng: ${escapeHtml(err.message)}</p>
        <button class="btn" onclick="loadMyPosts()" style="margin-top:12px;">Thử lại</button>
      </div>`;
  }
}

function updateMyPostsStats() {
  const total = myPostsList.length;
  const openCount = myPostsList.filter((p) => p.status === "OPEN").length;
  const fullCount = myPostsList.filter((p) => p.status === "FULL").length;
  const closedCount = myPostsList.filter((p) => p.status === "CLOSED").length;
  const totalApplicants = myPostsList.reduce((acc, p) => acc + (p.applications?.length || 0), 0);

  document.getElementById("stat-my-total").textContent = total;
  document.getElementById("stat-my-open").textContent = openCount;
  document.getElementById("stat-my-full").textContent = fullCount;
  document.getElementById("stat-my-closed").textContent = closedCount;
  document.getElementById("stat-my-applicants").textContent = totalApplicants;

  document.getElementById("count-pill-all").textContent = total;
  document.getElementById("count-pill-open").textContent = openCount;
  document.getElementById("count-pill-full").textContent = fullCount;
  document.getElementById("count-pill-closed").textContent = closedCount;

  const badgeCount = document.getElementById("badge-count-my-posts");
  badgeCount.textContent = total;
  badgeCount.style.display = total > 0 ? "inline-block" : "none";
}

function renderMyPosts() {
  let filtered = myPostsList;
  if (activePostStatusFilter !== "ALL") {
    filtered = myPostsList.filter((p) => p.status === activePostStatusFilter);
  }

  if (filtered.length === 0) {
    myPostsContainer.innerHTML = `
      <div class="card empty-state">
        <i class="fa-solid fa-folder-open text-orange-500" style="font-size:36px;margin-bottom:8px;"></i>
        <p>Không có bài đăng nào trong trạng thái này.</p>
        <a href="team-posts.html" class="btn btn-primary" style="margin-top:14px;">
          <i class="fa-solid fa-plus"></i> Đăng bài tìm đội ngay
        </a>
      </div>`;
    return;
  }

  myPostsContainer.innerHTML = filtered.map((post) => renderSingleMyPostCard(post)).join("");
}

function renderSingleMyPostCard(post) {
  const game = getGameById(post.game_id);
  const gameName = game ? escapeHtml(game.name) : `Game #${post.game_id}`;

  // Rank range
  let rankText = "Không yêu cầu rank";
  if (post.min_rank_id || post.max_rank_id) {
    const minR = game?.ranks.find((r) => r.id === post.min_rank_id);
    const maxR = game?.ranks.find((r) => r.id === post.max_rank_id);
    if (minR && maxR) rankText = `${minR.rank_name} → ${maxR.rank_name}`;
    else if (minR) rankText = `Từ ${minR.rank_name}`;
    else if (maxR) rankText = `Đến ${maxR.rank_name}`;
  }

  // Roles
  const roles = (post.role_ids || []).map((rid) => {
    const r = game?.roles.find((ro) => ro.id === rid);
    return r ? `<span class="role-tag">${escapeHtml(r.role_name)}</span>` : "";
  }).join("") || '<span class="muted" style="font-size:12px;">Không yêu cầu vai trò</span>';

  // Status badge
  const statusBadges = {
    OPEN: `<span class="badge badge-open"><i class="fa-solid fa-circle-dot"></i> Đang mở</span>`,
    FULL: `<span class="badge badge-full"><i class="fa-solid fa-circle-check"></i> Đã đủ người</span>`,
    CLOSED: `<span class="badge badge-closed"><i class="fa-solid fa-lock"></i> Đã đóng</span>`,
  };
  const statusBadgeHtml = statusBadges[post.status] || `<span class="badge">${post.status}</span>`;

  // Applications
  const apps = post.applications || [];
  const acceptedCount = apps.filter((a) => a.status === "ACCEPTED").length;
  const pendingCount = apps.filter((a) => a.status === "PENDING").length;
  const needed = post.needed_players || 1;
  const progressPct = Math.min(100, Math.round((acceptedCount / needed) * 100));

  return `
    <div class="my-post-card" id="post-card-${post.id}">
      <div class="my-post-header">
        <div class="my-post-title-wrap">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span class="role-tag" style="background:#242631;color:#f97316;">🎮 ${gameName}</span>
            ${statusBadgeHtml}
          </div>
          <h3 class="my-post-title">
            <a href="team-post-detail.html?id=${post.id}" style="color:inherit;text-decoration:none;">
              ${escapeHtml(post.title)}
            </a>
          </h3>
          <div class="my-post-meta">
            <span>🏆 ${escapeHtml(rankText)}</span>
            ${post.region ? `<span>🌏 ${escapeHtml(post.region)}</span>` : ""}
            ${post.play_time ? `<span>⏰ ${escapeHtml(post.play_time)}</span>` : ""}
            <span>📅 Đăng: ${formatDateTime(post.created_at)}</span>
            ${post.expires_at ? `<span>⌛ Hạn: ${formatDateTime(post.expires_at)}</span>` : ""}
          </div>
        </div>

        <div class="my-post-actions">
          <a href="team-post-detail.html?id=${post.id}" class="btn btn-small" title="Xem chi tiết">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Chi tiết
          </a>
          <button class="btn btn-small" onclick="openEditModal(${post.id})" title="Chỉnh sửa bài">
            <i class="fa-solid fa-pen-to-square"></i> Sửa
          </button>
          ${post.status !== "CLOSED" ? `
            <button class="btn btn-danger btn-small" onclick="handleClosePost(${post.id})" title="Đóng tuyển sớm">
              <i class="fa-solid fa-lock"></i> Đóng
            </button>` : ""}
          <button class="btn btn-danger btn-small" onclick="handleDeletePost(${post.id})" title="Xoá bài đăng">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <!-- Vai trò & mô tả -->
      <div style="margin-bottom:10px;">
        <div class="role-tags">${roles}</div>
        ${post.description ? `<p class="post-desc" style="margin:8px 0 0;">${escapeHtml(post.description)}</p>` : ""}
      </div>

      <!-- Tiến độ tuyển -->
      <div class="recruit-progress">
        <span>Tiến độ: <strong>${acceptedCount} / ${needed}</strong> thành viên</span>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${progressPct}%;"></div>
        </div>
        <span class="muted" style="font-size:12px;">(${progressPct}%)</span>
      </div>

      <!-- Khu vực người ứng tuyển -->
      <div class="applicants-wrapper">
        <div class="applicants-header" onclick="toggleApplicantsSection(${post.id})">
          <h4>
            <i class="fa-solid fa-users text-orange-500"></i> Người ứng tuyển 
            <span class="badge" style="background:#242631;color:#fff;font-size:12px;">${apps.length}</span>
            ${pendingCount > 0 ? `<span class="badge" style="background:rgba(245,158,11,0.2);color:#fbbf24;font-size:11px;">${pendingCount} chờ duyệt</span>` : ""}
          </h4>
          <span id="chevron-${post.id}" class="muted" style="font-size:13px;">▼</span>
        </div>

        <div id="applicants-list-${post.id}">
          ${renderApplicantsList(post.id, apps, post.status)}
        </div>
      </div>
    </div>
  `;
}

function renderApplicantsList(postId, apps, postStatus) {
  if (!apps || apps.length === 0) {
    return `<div style="padding:12px;color:var(--color-muted);font-size:13px;text-align:center;background:#15161d;border-radius:6px;">Chưa có đơn ứng tuyển nào cho bài đăng này.</div>`;
  }

  return apps.map((app) => {
    const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=user_${app.user_id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    
    // Status badge
    const statusMap = {
      PENDING: `<span class="badge-app-pending"><i class="fa-solid fa-clock"></i> Chờ duyệt</span>`,
      ACCEPTED: `<span class="badge-app-accepted"><i class="fa-solid fa-check"></i> Đã chấp nhận</span>`,
      REJECTED: `<span class="badge-app-rejected"><i class="fa-solid fa-xmark"></i> Đã từ chối</span>`,
      CANCELLED: `<span class="badge-app-cancelled"><i class="fa-solid fa-ban"></i> Đã rút đơn</span>`,
    };
    const statusHtml = statusMap[app.status] || `<span class="badge">${app.status}</span>`;

    // Action buttons (Chấp nhận / Từ chối)
    let actionButtons = "";
    if (app.status === "PENDING" && postStatus !== "CLOSED") {
      actionButtons = `
        <button class="btn-accept" onclick="handleApplicationDecision(${postId}, ${app.id}, 'ACCEPTED')">
          <i class="fa-solid fa-check"></i> Chấp nhận
        </button>
        <button class="btn-reject" onclick="handleApplicationDecision(${postId}, ${app.id}, 'REJECTED')">
          <i class="fa-solid fa-xmark"></i> Từ chối
        </button>
      `;
    }

    return `
      <div class="applicant-card" id="app-card-${app.id}">
        <div class="applicant-user">
          <img src="${avatarUrl}" class="applicant-avatar" alt="Avatar">
          <div class="applicant-details">
            <div class="applicant-name">
              <span>Game thủ #${app.user_id}</span>
              <a href="javascript:void(0)" class="applicant-profile-link" onclick="openProfileModal(${app.user_id})">
                <i class="fa-solid fa-id-card"></i> Hồ sơ
              </a>
            </div>
            ${app.message ? `<div class="applicant-msg">"${escapeHtml(app.message)}"</div>` : ""}
            <div class="applicant-date">Nộp lúc: ${formatDateTime(app.created_at)}</div>
          </div>
        </div>

        <div class="applicant-actions">
          ${statusHtml}
          ${actionButtons}
        </div>
      </div>
    `;
  }).join("");
}

function toggleApplicantsSection(postId) {
  const listEl = document.getElementById(`applicants-list-${postId}`);
  const chevron = document.getElementById(`chevron-${postId}`);
  if (!listEl) return;
  if (listEl.style.display === "none") {
    listEl.style.display = "block";
    if (chevron) chevron.textContent = "▼";
  } else {
    listEl.style.display = "none";
    if (chevron) chevron.textContent = "▶";
  }
}

// ============================================================
// 6. Xử lý Duyệt đơn ứng tuyển (Chấp nhận / Từ chối)
// ============================================================
async function handleApplicationDecision(postId, appId, decision) {
  const actionText = decision === "ACCEPTED" ? "chấp nhận" : "từ chối";
  if (!confirm(`Bạn có chắc muốn ${actionText} đơn ứng tuyển này?`)) return;

  try {
    const updated = await api.put(`/team-posts/${postId}/applications/${appId}`, {
      status: decision,
    });

    showToast(`Đã ${actionText} đơn ứng tuyển thành công! 🎉`, "success");
    // Cập nhật lại danh sách bài và giao diện
    await loadMyPosts();
  } catch (err) {
    showToast(err.message || `Không thể ${actionText} đơn ứng tuyển`, "error");
  }
}

// ============================================================
// 7. Tải & Hiển thị TÔI ĐÃ ỨNG TUYỂN (My Applications)
// ============================================================
async function loadMyApplications() {
  try {
    let applications = [];

    // Gọi endpoint nếu backend hỗ trợ
    try {
      applications = await api.get("/team-posts/me/applications");
    } catch (e) {
      // Fallback: Quét danh sách bài đăng gần đây để tìm đơn của currentUser
      const res = await api.get("/team-posts", {
        include_expired: true,
        limit: 100,
        status: null,
      });
      const allPosts = res.items || [];
      
      const found = [];
      await Promise.all(
        allPosts.map(async (p) => {
          try {
            const detail = await api.get(`/team-posts/${p.id}`);
            const userApps = (detail.applications || []).filter((a) => a.user_id === currentUser.id);
            userApps.forEach((a) => {
              found.push({ ...a, post: p });
            });
          } catch (err) {}
        })
      );
      applications = found;
    }

    myApplicationsList = applications;
    updateAppliedStats();
    renderMyApplications();
  } catch (err) {
    appliedContainer.innerHTML = `
      <div class="card empty-state">
        <p class="text-error"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi khi tải đơn đã ứng tuyển: ${escapeHtml(err.message)}</p>
        <button class="btn" onclick="loadMyApplications()" style="margin-top:12px;">Thử lại</button>
      </div>`;
  }
}

function updateAppliedStats() {
  const total = myApplicationsList.length;
  const pendingCount = myApplicationsList.filter((a) => a.status === "PENDING").length;
  const acceptedCount = myApplicationsList.filter((a) => a.status === "ACCEPTED").length;
  const rejectedCount = myApplicationsList.filter((a) => a.status === "REJECTED").length;
  const cancelledCount = myApplicationsList.filter((a) => a.status === "CANCELLED").length;

  document.getElementById("stat-app-total").textContent = total;
  document.getElementById("stat-app-pending").textContent = pendingCount;
  document.getElementById("stat-app-accepted").textContent = acceptedCount;
  document.getElementById("stat-app-rejected").textContent = rejectedCount;
  document.getElementById("stat-app-cancelled").textContent = cancelledCount;

  document.getElementById("count-app-all").textContent = total;
  document.getElementById("count-app-pending").textContent = pendingCount;
  document.getElementById("count-app-accepted").textContent = acceptedCount;
  document.getElementById("count-app-rejected").textContent = rejectedCount;
  document.getElementById("count-app-cancelled").textContent = cancelledCount;

  const badgeCount = document.getElementById("badge-count-applied");
  badgeCount.textContent = total;
  badgeCount.style.display = total > 0 ? "inline-block" : "none";
}

function renderMyApplications() {
  let filtered = myApplicationsList;
  if (activeAppStatusFilter !== "ALL") {
    filtered = myApplicationsList.filter((a) => a.status === activeAppStatusFilter);
  }

  if (filtered.length === 0) {
    appliedContainer.innerHTML = `
      <div class="card empty-state">
        <i class="fa-solid fa-inbox text-orange-500" style="font-size:36px;margin-bottom:8px;"></i>
        <p>Bạn chưa có đơn ứng tuyển nào trong mục này.</p>
        <a href="team-posts.html" class="btn btn-primary" style="margin-top:14px;">
          <i class="fa-solid fa-magnifying-glass"></i> Khám phá bài đăng và ứng tuyển
        </a>
      </div>`;
    return;
  }

  appliedContainer.innerHTML = filtered.map((item) => renderSingleAppliedCard(item)).join("");
}

function renderSingleAppliedCard(item) {
  const post = item.post || {};
  const game = getGameById(post.game_id);
  const gameName = game ? escapeHtml(game.name) : `Game #${post.game_id || "?"}`;

  // Trạng thái đơn của tôi
  const statusBadges = {
    PENDING: `<span class="badge-app-pending"><i class="fa-solid fa-clock"></i> Chờ duyệt</span>`,
    ACCEPTED: `<span class="badge-app-accepted"><i class="fa-solid fa-check"></i> Được chấp nhận 🎉</span>`,
    REJECTED: `<span class="badge-app-rejected"><i class="fa-solid fa-xmark"></i> Bị từ chối</span>`,
    CANCELLED: `<span class="badge-app-cancelled"><i class="fa-solid fa-ban"></i> Đã rút đơn</span>`,
  };
  const statusHtml = statusBadges[item.status] || `<span class="badge">${item.status}</span>`;

  // Nút Rút đơn (khi đơn đang PENDING hoặc ACCEPTED)
  const canWithdraw = (item.status === "PENDING" || item.status === "ACCEPTED");

  return `
    <div class="my-post-card" id="applied-card-${item.id}">
      <div class="my-post-header">
        <div class="my-post-title-wrap">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span class="role-tag" style="background:#242631;color:#f97316;">🎮 ${gameName}</span>
            ${post.status ? `<span class="badge ${post.status === "OPEN" ? "badge-open" : (post.status === "FULL" ? "badge-full" : "badge-closed")}">${post.status}</span>` : ""}
          </div>
          <h3 class="my-post-title">
            <a href="team-post-detail.html?id=${post.id || item.team_post_id}" style="color:inherit;text-decoration:none;">
              ${escapeHtml(post.title || `Bài đăng #${item.team_post_id}`)}
            </a>
          </h3>
          <div class="my-post-meta">
            ${post.user_id ? `
              <span>Chủ bài: 
                <a href="javascript:void(0)" class="applicant-profile-link" onclick="openProfileModal(${post.user_id})">
                  Game thủ #${post.user_id}
                </a>
              </span>` : ""}
            <span>📅 Nộp đơn lúc: ${formatDateTime(item.created_at)}</span>
            ${post.region ? `<span>🌏 ${escapeHtml(post.region)}</span>` : ""}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          ${statusHtml}
          ${canWithdraw ? `
            <button class="btn-withdraw" onclick="handleWithdrawApplication(${item.team_post_id || post.id}, ${item.id})">
              <i class="fa-solid fa-arrow-rotate-left"></i> Rút đơn
            </button>` : ""}
          <a href="team-post-detail.html?id=${post.id || item.team_post_id}" class="btn btn-small">
            Chi tiết bài →
          </a>
        </div>
      </div>

      <!-- Lời nhắn của tôi -->
      <div style="background:#15161d;padding:12px 14px;border-radius:6px;border:1px solid var(--color-border);margin-top:10px;">
        <span style="font-size:12px;color:var(--color-muted);display:block;margin-bottom:4px;font-weight:600;">
          <i class="fa-regular fa-comment-dots"></i> Lời nhắn ứng tuyển của bạn:
        </span>
        <div style="font-size:14px;color:#fff;">
          ${escapeHtml(item.message || "Không kèm lời nhắn")}
        </div>
      </div>
    </div>
  `;
}

// Rút đơn ứng tuyển
async function handleWithdrawApplication(postId, appId) {
  if (!confirm("Bạn có chắc chắn muốn rút đơn ứng tuyển khỏi bài đăng này?")) return;

  try {
    await api.put(`/team-posts/${postId}/applications/${appId}`, {
      status: "CANCELLED",
    });
    showToast("Đã rút đơn ứng tuyển thành công!", "success");
    await loadMyApplications();
  } catch (err) {
    showToast(err.message || "Không thể rút đơn ứng tuyển", "error");
  }
}

// ============================================================
// 8. Đóng & Xóa bài đăng
// ============================================================
async function handleClosePost(postId) {
  if (!confirm("Bạn có chắc muốn đóng bài đăng này sớm? (Người khác sẽ không thể ứng tuyển)")) return;
  try {
    try {
      await api.patch(`/team-posts/${postId}/close`);
    } catch (e) {
      await api.post(`/team-posts/${postId}/close`);
    }
    showToast("Đã đóng bài đăng thành công!", "success");
    await loadMyPosts();
  } catch (err) {
    showToast(err.message || "Lỗi khi đóng bài đăng", "error");
  }
}

async function handleDeletePost(postId) {
  if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này vĩnh viễn?")) return;
  try {
    await api.delete(`/team-posts/${postId}`);
    showToast("Đã xóa bài đăng!", "success");
    await loadMyPosts();
  } catch (err) {
    showToast(err.message || "Lỗi khi xóa bài đăng", "error");
  }
}

// ============================================================
// 9. Modal Xem Hồ Sơ Người Chơi (Profile Modal)
// ============================================================
async function openProfileModal(userId) {
  pmAvatar.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=user_${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  pmUsername.textContent = `Game thủ #${userId}`;
  pmBio.textContent = "Đang tải thông tin hồ sơ...";
  pmRegion.textContent = "—";
  pmPlaytime.textContent = "—";
  pmMic.textContent = "—";
  pmRole.textContent = "—";

  profileModalOverlay.hidden = false;
  document.body.style.overflow = "hidden";

  try {
    let profile = null;
    try {
      profile = await api.get(`/api/profiles/${userId}`);
    } catch (e) {
      try {
        profile = await api.get(`/users/${userId}`);
      } catch (e2) {}
    }

    if (profile) {
      pmUsername.textContent = profile.display_name || profile.username || `Game thủ #${userId}`;
      if (profile.avatar) pmAvatar.src = profile.avatar;
      pmBio.textContent = profile.bio || "Game thủ chưa cập nhật lời giới thiệu.";
      pmRegion.textContent = profile.region || "Việt Nam";
      pmPlaytime.textContent = profile.play_time || "20:00 - 23:00";
      pmMic.innerHTML = profile.has_mic ? `<span style="color:#34d399;"><i class="fa-solid fa-microphone"></i> Có Mic</span>` : `<span style="color:#94a3b8;"><i class="fa-solid fa-microphone-slash"></i> Không</span>`;
      pmRole.textContent = profile.role || "Thành viên";
    } else {
      pmBio.textContent = "Hồ sơ cá nhân chưa cập nhật thông tin chi tiết.";
      pmRegion.textContent = "Việt Nam";
      pmPlaytime.textContent = "Buổi tối";
      pmMic.innerHTML = `<span style="color:#34d399;"><i class="fa-solid fa-microphone"></i> Sẵn sàng mic</span>`;
      pmRole.textContent = "Game thủ";
    }
  } catch (err) {
    pmBio.textContent = "Không thể tải thông tin hồ sơ chi tiết.";
  }
}

function closeProfileModal() {
  profileModalOverlay.hidden = true;
  document.body.style.overflow = "";
}

// ============================================================
// 10. Modal Chỉnh Sửa Bài Đăng (Edit Post Modal)
// ============================================================
function openEditModal(postId) {
  const post = myPostsList.find((p) => p.id === postId);
  if (!post) return;

  document.getElementById("edit-post-id").value = post.id;
  editFormError.hidden = true;

  // Set game dropdown
  const game = getGameById(post.game_id);
  editGame.innerHTML = `<option value="${post.game_id}">${game ? escapeHtml(game.name) : `Game #${post.game_id}`}</option>`;

  // Ranks
  populateEditRanks(game, post.min_rank_id, post.max_rank_id);

  // Roles
  populateEditRoles(game, post.role_ids || []);

  // Form values
  editPostForm.title.value = post.title;
  editPostForm.needed_players.value = post.needed_players;
  editPostForm.play_time.value = post.play_time || "";
  editPostForm.region.value = post.region || "";
  editPostForm.description.value = post.description || "";
  if (post.expires_at) {
    const d = new Date(post.expires_at);
    editPostForm.expires_at.value = d.toISOString().slice(0, 16);
  } else {
    editPostForm.expires_at.value = "";
  }

  editModalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  editModalOverlay.hidden = true;
  document.body.style.overflow = "";
}

function populateEditRanks(game, minId, maxId) {
  const baseMin = '<option value="">-- Không yêu cầu --</option>';
  const baseMax = '<option value="">-- Không giới hạn --</option>';
  if (!game || !game.ranks) {
    editMinRank.innerHTML = baseMin;
    editMaxRank.innerHTML = baseMax;
    return;
  }
  const sorted = [...game.ranks].sort((a, b) => a.rank_order - b.rank_order);
  const opts = sorted.map((r) => `<option value="${r.id}">${escapeHtml(r.rank_name)}</option>`).join("");
  editMinRank.innerHTML = baseMin + opts;
  editMaxRank.innerHTML = baseMax + opts;
  if (minId) editMinRank.value = minId;
  if (maxId) editMaxRank.value = maxId;
}

function populateEditRoles(game, selectedRoles) {
  if (!game || !game.roles || game.roles.length === 0) {
    editRolesWrap.innerHTML = '<span class="muted" style="font-size:13px;">Game này không chia vai trò.</span>';
    return;
  }
  editRolesWrap.innerHTML = game.roles.map((r) => `
    <label class="role-checkbox-item">
      <input type="checkbox" name="role_ids" value="${r.id}" ${selectedRoles.includes(r.id) ? "checked" : ""}>
      ${escapeHtml(r.role_name)}
    </label>
  `).join("");
}

async function handleEditFormSubmit(e) {
  e.preventDefault();
  editFormError.hidden = true;

  const postId = Number(document.getElementById("edit-post-id").value);
  const selectedRoles = Array.from(
    editPostForm.querySelectorAll('input[name="role_ids"]:checked')
  ).map((cb) => Number(cb.value));

  const payload = {
    title: editPostForm.title.value.trim(),
    min_rank_id: editPostForm.min_rank_id.value ? Number(editPostForm.min_rank_id.value) : null,
    max_rank_id: editPostForm.max_rank_id.value ? Number(editPostForm.max_rank_id.value) : null,
    role_ids: selectedRoles,
    needed_players: Number(editPostForm.needed_players.value),
    play_time: editPostForm.play_time.value.trim() || null,
    region: editPostForm.region.value || null,
    description: editPostForm.description.value.trim() || null,
    expires_at: editPostForm.expires_at.value ? new Date(editPostForm.expires_at.value).toISOString() : null,
  };

  try {
    await api.put(`/team-posts/${postId}`, payload);
    showToast("Đã cập nhật bài đăng thành công! 🎉", "success");
    closeEditModal();
    await loadMyPosts();
  } catch (err) {
    editFormError.textContent = err.message || "Có lỗi xảy ra khi cập nhật";
    editFormError.hidden = false;
  }
}
