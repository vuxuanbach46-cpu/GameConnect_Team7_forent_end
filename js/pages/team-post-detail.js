// ============================================================
// js/pages/team-post-detail.js  –  Trang chi tiết bài đăng tìm đội
// T3CCE3F
// ============================================================

const detailWrap = document.getElementById("detail-wrap");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle   = document.getElementById("modal-title");
const postForm     = document.getElementById("post-form");
const formError    = document.getElementById("form-error");
const submitBtn    = document.getElementById("btn-submit-post");
const fGame        = document.getElementById("f-game");
const fMinRank     = document.getElementById("f-min-rank");
const fMaxRank     = document.getElementById("f-max-rank");
const fRolesWrap   = document.getElementById("f-roles-wrap");

let gamesCatalog = [];
let currentPost  = null;

// ============================================================
// 1. Lấy post_id từ URL
// ============================================================
const params = new URLSearchParams(window.location.search);
const postId = Number(params.get("id"));

if (!postId) {
  detailWrap.innerHTML = `<div class="card empty-state"><p class="text-error">Không tìm thấy bài đăng.</p></div>`;
}

// ============================================================
// 2. Load danh mục game
// ============================================================
async function loadGamesCatalog() {
  try {
    gamesCatalog = await api.get("/games");
    populateGameDropdown(fGame);
  } catch (e) {
    console.warn("Không tải được game catalog:", e.message);
  }
}

function populateGameDropdown(selectEl) {
  selectEl.innerHTML = '<option value="">-- Chọn game --</option>' +
    gamesCatalog.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
}

function getGameById(id) {
  return gamesCatalog.find((g) => g.id === Number(id));
}

// ============================================================
// 3. Load & Render chi tiết
// ============================================================
async function loadDetail() {
  try {
    const post = await api.get(`/team-posts/${postId}`);
    currentPost = post;
    document.title = `${post.title} | GameConnect`;
    renderDetail(post);
  } catch (err) {
    detailWrap.innerHTML = `<div class="card empty-state">
      <p class="text-error">${escapeHtml(err.message)}</p>
      <a href="team-posts.html" class="btn" style="margin-top:12px;">← Quay lại danh sách</a>
    </div>`;
  }
}

function statusBadge(status) {
  const map = {
    OPEN:    ["badge-open", "Đang mở"],
    FULL:    ["badge-full", "Đã đủ người"],
    CLOSED:  ["badge-closed", "Đã đóng"],
    EXPIRED: ["badge-expired", "Hết hạn"],
  };
  const [cls, label] = map[status] || ["badge-expired", status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function renderDetail(post) {
  const game = getGameById(post.game_id);
  const gameName = game ? escapeHtml(game.name) : `Game #${post.game_id}`;

  // Rank
  let rankText = "Không yêu cầu";
  if (post.min_rank_id || post.max_rank_id) {
    const minR = game?.ranks.find((r) => r.id === post.min_rank_id);
    const maxR = game?.ranks.find((r) => r.id === post.max_rank_id);
    if (minR && maxR) rankText = `${minR.rank_name} → ${maxR.rank_name}`;
    else if (minR) rankText = `Từ ${minR.rank_name}`;
    else if (maxR) rankText = `Đến ${maxR.rank_name}`;
  }

  // Vai trò
  const roleTags = (post.role_ids || []).map((rid) => {
    const role = game?.roles.find((r) => r.id === rid);
    return role ? `<span class="role-tag">${escapeHtml(role.role_name)}</span>` : "";
  }).join("") || '<span class="muted" style="font-size:13px;">Không yêu cầu</span>';

  // Đơn ứng tuyển (chỉ hiện nếu có)
  const apps = post.applications || [];
  const statusBadgesApp = {
    PENDING: `<span class="badge-app-pending"><i class="fa-solid fa-clock"></i> Chờ duyệt</span>`,
    ACCEPTED: `<span class="badge-app-accepted"><i class="fa-solid fa-check"></i> Đã chấp nhận</span>`,
    REJECTED: `<span class="badge-app-rejected"><i class="fa-solid fa-xmark"></i> Đã từ chối</span>`,
    CANCELLED: `<span class="badge-app-cancelled"><i class="fa-solid fa-ban"></i> Đã rút đơn</span>`,
  };

  const appsSection = apps.length > 0 ? `
    <div class="card">
      <h3 style="margin:0 0 16px;"><i class="fa-solid fa-users text-orange-500"></i> Đơn ứng tuyển (${apps.length})</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Người ứng tuyển</th>
              <th>Lời nhắn</th>
              <th>Trạng thái</th>
              <th>Ngày nộp</th>
              <th style="text-align:right;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${apps.map((a) => {
              const statusHtml = statusBadgesApp[a.status] || `<span class="badge">${a.status}</span>`;
              let actionsHtml = "—";
              if (a.status === "PENDING" && post.status !== "CLOSED") {
                actionsHtml = `
                  <button class="btn-accept btn-small" onclick="handleDetailAppDecision(${a.id}, 'ACCEPTED')">
                    <i class="fa-solid fa-check"></i> Chấp nhận
                  </button>
                  <button class="btn-reject btn-small" onclick="handleDetailAppDecision(${a.id}, 'REJECTED')">
                    <i class="fa-solid fa-xmark"></i> Từ chối
                  </button>
                `;
              }
              return `
                <tr>
                  <td>${a.id}</td>
                  <td>
                    <strong>Game thủ #${a.user_id}</strong>
                    <a href="javascript:void(0)" onclick="openProfileModal(${a.user_id})" class="applicant-profile-link" style="margin-left:8px;">
                      <i class="fa-solid fa-id-card"></i> Hồ sơ
                    </a>
                  </td>
                  <td>${escapeHtml(a.message || "—")}</td>
                  <td>${statusHtml}</td>
                  <td>${formatDateTime(a.created_at)}</td>
                  <td style="text-align:right;white-space:nowrap;">${actionsHtml}</td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>` : "";

  detailWrap.innerHTML = `
    <div class="detail-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
        <h1 class="detail-title">${escapeHtml(post.title)}</h1>
        ${statusBadge(post.status)}
      </div>

      <div class="detail-meta">
        <span>🎮 <strong>${gameName}</strong></span>
        <span>🏆 Rank: <strong>${escapeHtml(rankText)}</strong></span>
        <span>👥 Cần tuyển: <strong>${post.needed_players} người</strong></span>
        ${post.region ? `<span>🌏 Khu vực: <strong>${escapeHtml(post.region)}</strong></span>` : ""}
        ${post.play_time ? `<span>⏰ Giờ chơi: <strong>${escapeHtml(post.play_time)}</strong></span>` : ""}
        ${post.expires_at ? `<span>📅 Hạn đến: <strong>${formatDateTime(post.expires_at)}</strong></span>` : ""}
        <span style="color:var(--color-muted);font-size:12px;">Đăng lúc ${formatDateTime(post.created_at)}</span>
      </div>

      <div class="detail-section-title">Vai trò cần tuyển</div>
      <div class="role-tags">${roleTags}</div>

      ${post.description ? `
        <div class="detail-section-title">Mô tả</div>
        <p class="detail-desc">${escapeHtml(post.description)}</p>` : ""}

      <div class="detail-actions" id="post-actions">
        ${post.status === "OPEN" ? `
          <button class="btn btn-primary" id="btn-apply">Ứng tuyển ngay</button>` : ""}
        <button class="btn" id="btn-edit-post">✏️ Chỉnh sửa</button>
        <button class="btn btn-danger" id="btn-close-post">Đóng bài đăng</button>
        <button class="btn" onclick="history.back()">← Quay lại</button>
      </div>
    </div>

    ${appsSection}
  `;

  // Gắn sự kiện cho các nút action
  document.getElementById("btn-edit-post")?.addEventListener("click", () => openEditModal(post));
  document.getElementById("btn-close-post")?.addEventListener("click", () => closePost(post.id));
  document.getElementById("btn-apply")?.addEventListener("click", applyToPost);
}

// ============================================================
// 4. Ứng tuyển
// ============================================================
async function applyToPost() {
  const message = prompt("Lời nhắn gửi chủ bài đăng (không bắt buộc):");
  if (message === null) return; // User cancel
  try {
    await api.post(`/team-posts/${postId}/applications`, { message: message.trim() || null });
    showToast("Đã nộp đơn ứng tuyển! 🎉");
    loadDetail();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// 5. Đóng bài đăng
// ============================================================
async function closePost(id) {
  if (!confirm("Đóng bài đăng này sớm?")) return;
  try {
    await api.patch ? api.patch(`/team-posts/${id}/close`) : api.put(`/team-posts/${id}/close`);
    showToast("Đã đóng bài đăng");
    loadDetail();
  } catch (err) {
    // fallback POST nếu patch chưa có
    try {
      await api.post(`/team-posts/${id}/close`);
      showToast("Đã đóng bài đăng");
      loadDetail();
    } catch (err2) {
      showToast(err2.message, "error");
    }
  }
}

// ============================================================
// 6. Modal sửa bài
// ============================================================
function openEditModal(post) {
  modalTitle.textContent = "Chỉnh sửa bài đăng";
  submitBtn.textContent = "Lưu thay đổi";
  hideFormError();

  // Chọn game
  fGame.value = post.game_id;
  const game = getGameById(post.game_id);
  populateFormRanks(game, post.min_rank_id, post.max_rank_id);
  populateFormRoles(game, post.role_ids || []);
  fMinRank.disabled = !game;
  fMaxRank.disabled = !game;

  // Điền các field
  postForm.title.value = post.title;
  postForm.needed_players.value = post.needed_players;
  postForm.play_time.value = post.play_time || "";
  postForm.region.value = post.region || "";
  postForm.description.value = post.description || "";
  if (post.expires_at) {
    const d = new Date(post.expires_at);
    postForm.expires_at.value = d.toISOString().slice(0, 16);
  } else {
    postForm.expires_at.value = "";
  }

  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

// Rank & Role form helpers (tái dùng từ team-posts.js)
function populateFormRanks(game, selectedMin, selectedMax) {
  const baseMin = '<option value="">-- Không yêu cầu --</option>';
  const baseMax = '<option value="">-- Không giới hạn --</option>';
  if (!game) {
    fMinRank.innerHTML = baseMin;
    fMaxRank.innerHTML = baseMax;
    return;
  }
  const sorted = [...game.ranks].sort((a, b) => a.rank_order - b.rank_order);
  const opts = sorted.map((r) => `<option value="${r.id}">${escapeHtml(r.rank_name)}</option>`).join("");
  fMinRank.innerHTML = baseMin + opts;
  fMaxRank.innerHTML = baseMax + opts;
  if (selectedMin) fMinRank.value = selectedMin;
  if (selectedMax) fMaxRank.value = selectedMax;
}

function populateFormRoles(game, selectedIds = []) {
  if (!game || !game.roles.length) {
    fRolesWrap.innerHTML = '<span class="muted" style="font-size:13px;">Game này không có vai trò</span>';
    return;
  }
  fRolesWrap.innerHTML = game.roles.map((r) => `
    <label class="role-checkbox-item">
      <input type="checkbox" name="role_ids" value="${r.id}"
        ${selectedIds.includes(r.id) ? "checked" : ""}>
      ${escapeHtml(r.role_name)}
    </label>`).join("");
}

// Thay đổi game → reload rank/role trong form
fGame.addEventListener("change", () => {
  const game = getGameById(fGame.value);
  populateFormRanks(game);
  populateFormRoles(game, []);
  fMinRank.disabled = !game;
  fMaxRank.disabled = !game;
});

// Đóng modal
document.getElementById("btn-close-modal").addEventListener("click", closeModal);
document.getElementById("btn-cancel-form").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

// ============================================================
// 7. Submit sửa bài
// ============================================================
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideFormError();

  const game_id = Number(fGame.value);
  if (!game_id) return showFormError("Vui lòng chọn game.");

  const title = postForm.title.value.trim();
  if (!title) return showFormError("Vui lòng nhập tiêu đề.");

  const checkedRoles = [...fRolesWrap.querySelectorAll('input[type="checkbox"]:checked')]
    .map((el) => Number(el.value));

  const payload = {
    game_id,
    title,
    min_rank_id: Number(postForm.min_rank_id.value) || null,
    max_rank_id: Number(postForm.max_rank_id.value) || null,
    needed_players: Number(postForm.needed_players.value) || 1,
    play_time: postForm.play_time.value.trim() || null,
    region: postForm.region.value || null,
    description: postForm.description.value.trim() || null,
    expires_at: postForm.expires_at.value
      ? new Date(postForm.expires_at.value).toISOString()
      : null,
    role_ids: checkedRoles,
  };

  submitBtn.disabled = true;
  try {
    await api.put(`/team-posts/${postId}`, payload);
    showToast("Đã cập nhật bài đăng!");
    closeModal();
    loadDetail();
  } catch (err) {
    showFormError(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}
function hideFormError() {
  formError.hidden = true;
  formError.textContent = "";
}

// ============================================================
// 8. Duyệt đơn ứng tuyển (Chấp nhận / Từ chối) & Xem hồ sơ
// ============================================================
async function handleDetailAppDecision(appId, decision) {
  const actionText = decision === "ACCEPTED" ? "chấp nhận" : "từ chối";
  if (!confirm(`Bạn có chắc muốn ${actionText} đơn ứng tuyển này?`)) return;

  try {
    await api.put(`/team-posts/${postId}/applications/${appId}`, {
      status: decision,
    });
    showToast(`Đã ${actionText} đơn ứng tuyển thành công! 🎉`, "success");
    loadDetail();
  } catch (err) {
    showToast(err.message || `Lỗi khi ${actionText} đơn`, "error");
  }
}

async function openProfileModal(userId) {
  const modalOverlay = document.getElementById("profile-modal-overlay");
  const avatar = document.getElementById("pm-avatar");
  const username = document.getElementById("pm-username");
  const bio = document.getElementById("pm-bio");
  const region = document.getElementById("pm-region");
  const playtime = document.getElementById("pm-playtime");
  const mic = document.getElementById("pm-mic");
  const role = document.getElementById("pm-role");

  if (!modalOverlay) return;

  avatar.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=user_${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  username.textContent = `Game thủ #${userId}`;
  bio.textContent = "Đang tải thông tin hồ sơ...";
  region.textContent = "—";
  playtime.textContent = "—";
  mic.textContent = "—";
  role.textContent = "—";

  modalOverlay.hidden = false;
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
      username.textContent = profile.display_name || profile.username || `Game thủ #${userId}`;
      if (profile.avatar) avatar.src = profile.avatar;
      bio.textContent = profile.bio || "Game thủ chưa cập nhật lời giới thiệu.";
      region.textContent = profile.region || "Việt Nam";
      playtime.textContent = profile.play_time || "20:00 - 23:00";
      mic.innerHTML = profile.has_mic ? `<span style="color:#34d399;"><i class="fa-solid fa-microphone"></i> Có Mic</span>` : `<span style="color:#94a3b8;"><i class="fa-solid fa-microphone-slash"></i> Không</span>`;
      role.textContent = profile.role || "Thành viên";
    } else {
      bio.textContent = "Hồ sơ cá nhân chưa cập nhật thông tin chi tiết.";
      region.textContent = "Việt Nam";
      playtime.textContent = "Buổi tối";
      mic.innerHTML = `<span style="color:#34d399;"><i class="fa-solid fa-microphone"></i> Sẵn sàng mic</span>`;
      role.textContent = "Game thủ";
    }
  } catch (err) {
    bio.textContent = "Không thể tải thông tin hồ sơ chi tiết.";
  }
}

function closeProfileModal() {
  const modalOverlay = document.getElementById("profile-modal-overlay");
  if (modalOverlay) {
    modalOverlay.hidden = true;
    document.body.style.overflow = "";
  }
}

document.getElementById("btn-close-profile-modal")?.addEventListener("click", closeProfileModal);
document.getElementById("btn-done-profile")?.addEventListener("click", closeProfileModal);
document.getElementById("profile-modal-overlay")?.addEventListener("click", (e) => {
  if (e.target.id === "profile-modal-overlay") closeProfileModal();
});

// ============================================================
// 9. Khởi động & Header / Theme
// ============================================================
function initUserHeaderAndTheme() {
  const token = localStorage.getItem("access_token");
  let username = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      username = payload.username || null;
    } catch (e) {}
  }

  const nameEl = document.getElementById("user-header-name");
  const avatarEl = document.getElementById("user-avatar-img");
  if (nameEl) nameEl.textContent = username || "Gamer";
  if (avatarEl) {
    avatarEl.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(username || "Gamer")}&backgroundColor=b6e3f4`;
  }

  // Theme
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

(async function init() {
  initUserHeaderAndTheme();
  if (!postId) return;
  await loadGamesCatalog();
  await loadDetail();
})();
