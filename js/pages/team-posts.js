// ============================================================
// js/pages/team-posts.js  –  Danh sách & Tạo bài tìm đội (Gaming Hub UI)
// Task: T3CCE3F
// ============================================================

let currentPage = 1;
let currentFilters = {};
let gamesCatalog = [];
let editingPostId = null;

// DOM Elements
const postGrid        = document.getElementById("post-grid");
const totalCountText  = document.getElementById("total-count-text");
const badgeTotalCount = document.getElementById("badge-total-count");
const pagination      = document.getElementById("pagination");
const modalOverlay    = document.getElementById("modal-overlay");
const modalTitle      = document.getElementById("modal-title");
const postForm        = document.getElementById("post-form");
const formError       = document.getElementById("form-error");
const formErrorText   = document.getElementById("form-error-text");
const submitBtn       = document.getElementById("btn-submit-post");
const submitBtnText   = document.getElementById("submit-btn-text");

// Filter inputs
const filterQ         = document.getElementById("filter-q");
const filterGame      = document.getElementById("filter-game");
const filterRank      = document.getElementById("filter-rank");
const filterRole      = document.getElementById("filter-role");
const filterRegion    = document.getElementById("filter-region");

// Modal inputs
const fGame           = document.getElementById("f-game");
const fMinRank        = document.getElementById("f-min-rank");
const fMaxRank        = document.getElementById("f-max-rank");
const fRolesWrap      = document.getElementById("f-roles-wrap");

// Game color accents & icons
const GAME_META = {
  1: { icon: "fa-gamepad", color: "from-blue-600/30 to-blue-900/10", border: "border-blue-500/30", text: "text-blue-400", name: "Liên Minh Huyền Thoại" },
  2: { icon: "fa-crosshairs", color: "from-red-600/30 to-red-900/10", border: "border-red-500/30", text: "text-red-400", name: "Valorant" },
  3: { icon: "fa-person-rifle", color: "from-amber-600/30 to-amber-900/10", border: "border-amber-500/30", text: "text-amber-400", name: "PUBG Mobile" },
  4: { icon: "fa-fire", color: "from-orange-600/30 to-orange-900/10", border: "border-orange-500/30", text: "text-orange-400", name: "Free Fire" },
  5: { icon: "fa-shield-halved", color: "from-purple-600/30 to-purple-900/10", border: "border-purple-500/30", text: "text-purple-400", name: "Liên Quân Mobile" },
};

// ============================================================
// 1. Nạp danh mục Game (Ranks & Roles)
// ============================================================
async function loadGamesCatalog() {
  try {
    // Thử endpoint chuẩn /api/games hoặc /games
    try {
      gamesCatalog = await api.get("/api/games");
    } catch {
      gamesCatalog = await api.get("/games");
    }
    populateGameSelect(filterGame, false);
    populateGameSelect(fGame, true);
  } catch (err) {
    console.warn("Không tải được danh mục game:", err.message);
  }
}

function populateGameSelect(selectEl, withPlaceholder) {
  const placeholder = withPlaceholder
    ? '<option value="">-- Chọn game để tải rank & vai trò --</option>'
    : '<option value="">-- Tất cả game --</option>';
  selectEl.innerHTML = placeholder + gamesCatalog
    .map((g) => `<option value="${g.id}">🎮 ${escapeHtml(g.name)}</option>`)
    .join("");
}

function getGameById(id) {
  return gamesCatalog.find((g) => g.id === Number(id));
}

// ============================================================
// 2. Xử lý Dropdown động Rank & Role khi chọn Game
// ============================================================
filterGame.addEventListener("change", () => {
  const game = getGameById(filterGame.value);
  populateFilterRank(game);
  populateFilterRole(game);
  filterRank.disabled = !game;
  filterRole.disabled = !game;
  filterRank.value = "";
  filterRole.value = "";
});

function populateFilterRank(game) {
  filterRank.innerHTML = '<option value="">-- Tất cả rank --</option>';
  if (!game || !game.ranks) return;
  const sorted = [...game.ranks].sort((a, b) => a.rank_order - b.rank_order);
  filterRank.innerHTML += sorted
    .map((r) => `<option value="${r.id}">🏆 ${escapeHtml(r.rank_name)}</option>`)
    .join("");
}

function populateFilterRole(game) {
  filterRole.innerHTML = '<option value="">-- Tất cả vai trò --</option>';
  if (!game || !game.roles) return;
  filterRole.innerHTML += game.roles
    .map((r) => `<option value="${r.id}">🎯 ${escapeHtml(r.role_name)}</option>`)
    .join("");
}

// Dropdown trong Form Modal
fGame.addEventListener("change", () => {
  const game = getGameById(fGame.value);
  populateFormRanks(game);
  populateFormRoles(game, []);
  fMinRank.disabled = !game;
  fMaxRank.disabled = !game;
});

function populateFormRanks(game, selectedMin, selectedMax) {
  const baseMin = '<option value="">-- Không yêu cầu --</option>';
  const baseMax = '<option value="">-- Không giới hạn --</option>';
  if (!game || !game.ranks) {
    fMinRank.innerHTML = baseMin;
    fMaxRank.innerHTML = baseMax;
    return;
  }
  const sorted = [...game.ranks].sort((a, b) => a.rank_order - b.rank_order);
  const opts = sorted
    .map((r) => `<option value="${r.id}">${escapeHtml(r.rank_name)}</option>`)
    .join("");
  fMinRank.innerHTML = baseMin + opts;
  fMaxRank.innerHTML = baseMax + opts;
  if (selectedMin) fMinRank.value = selectedMin;
  if (selectedMax) fMaxRank.value = selectedMax;
}

function populateFormRoles(game, selectedIds = []) {
  if (!game || !game.roles || !game.roles.length) {
    fRolesWrap.innerHTML = '<span class="text-zinc-500 italic text-[11px]">Tựa game này không có cấu hình vai trò riêng</span>';
    return;
  }
  fRolesWrap.innerHTML = game.roles.map((r) => `
    <label class="cursor-pointer px-2.5 py-1 rounded-md bg-[#20222d] border border-[#2e313e] hover:border-orange-500/50 text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition has-[:checked]:bg-orange-500/20 has-[:checked]:border-orange-500 has-[:checked]:text-orange-400 select-none">
      <input type="checkbox" name="role_ids" value="${r.id}" class="accent-orange-500 rounded"
        ${selectedIds.includes(r.id) ? "checked" : ""}>
      <span>${escapeHtml(r.role_name)}</span>
    </label>`).join("");
}

// ============================================================
// 3. Tải và Hiển thị Danh sách Bài đăng
// ============================================================
async function loadPosts(page = 1, filters = {}) {
  postGrid.innerHTML = `
    <div class="post-card rounded-xl p-5 animate-pulse h-48 bg-[#181920]"></div>
    <div class="post-card rounded-xl p-5 animate-pulse h-48 bg-[#181920]"></div>
    <div class="post-card rounded-xl p-5 animate-pulse h-48 bg-[#181920]"></div>`;
  pagination.innerHTML = "";
  totalCountText.textContent = "";

  const params = { page, page_size: 12, ...filters };
  Object.keys(params).forEach((k) => {
    if (params[k] === "" || params[k] === undefined || params[k] === null) delete params[k];
  });

  try {
    let data;
    try {
      data = await api.get("/api/team-posts", params);
    } catch {
      data = await api.get("/team-posts", params);
    }

    renderPosts(data.items);
    totalCountText.textContent = `(Tìm thấy ${data.total} bài đăng)`;
    if (badgeTotalCount) badgeTotalCount.textContent = `${data.total} bài`;
    renderPagination(data.page, data.total_pages);
    currentPage = data.page;
  } catch (err) {
    postGrid.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <i class="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-2"></i>
        <p class="text-red-400 text-sm">${escapeHtml(err.message)}</p>
        <button onclick="loadPosts(1)" class="mt-3 px-4 py-1.5 text-xs bg-[#1e2029] text-zinc-300 hover:text-white rounded-lg border border-[#2e313e]">Thử lại</button>
      </div>`;
  }
}

function renderStatusBadge(status) {
  if (status === "OPEN") {
    return `<span class="badge-open px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider inline-flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ĐANG MỞ
    </span>`;
  } else if (status === "FULL") {
    return `<span class="badge-full px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">ĐÃ ĐỦ</span>`;
  } else {
    return `<span class="badge-closed px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">ĐÃ ĐÓNG</span>`;
  }
}

function renderPosts(items) {
  if (!items || !items.length) {
    postGrid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-[#13141a] border border-[#242631] rounded-2xl p-8">
        <div class="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-gamepad"></i>
        </div>
        <h3 class="text-white font-bold text-base mb-1">Chưa có bài đăng nào phù hợp</h3>
        <p class="text-zinc-400 text-xs mb-4">Hãy thử điều chỉnh bộ lọc hoặc là người đầu tiên đăng bài tìm squad!</p>
        <button onclick="openCreateModal()" class="btn-orange px-4 py-2 text-xs rounded-xl inline-flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Đăng bài tuyển ngay
        </button>
      </div>`;
    return;
  }

  postGrid.innerHTML = items.map((post) => {
    const game = getGameById(post.game_id);
    const meta = GAME_META[post.game_id] || { icon: "fa-gamepad", color: "from-zinc-700/30 to-zinc-900/10", border: "border-zinc-700/30", text: "text-zinc-400", name: game?.name || `Game #${post.game_id}` };
    const gameName = game ? escapeHtml(game.name) : meta.name;

    // Rank text
    let rankText = "Mọi Rank";
    if (post.min_rank_id || post.max_rank_id) {
      const minR = game?.ranks?.find((r) => r.id === post.min_rank_id);
      const maxR = game?.ranks?.find((r) => r.id === post.max_rank_id);
      if (minR && maxR) rankText = `${minR.rank_name} → ${maxR.rank_name}`;
      else if (minR) rankText = `Từ ${minR.rank_name}`;
      else if (maxR) rankText = `Đến ${maxR.rank_name}`;
    }

    // Role tags
    const roleBadges = (post.role_ids || []).map((rid) => {
      const role = game?.roles?.find((r) => r.id === rid);
      return role ? `<span class="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-semibold">${escapeHtml(role.role_name)}</span>` : "";
    }).join("");

    return `
    <div class="post-card rounded-xl p-5 flex flex-col justify-between group" onclick="location.href='team-post-detail.html?id=${post.id}'">
      <div>
        <!-- Card Top Bar: Game tag & Status -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${meta.color} border ${meta.border} text-xs font-semibold ${meta.text}">
            <i class="fa-solid ${meta.icon}"></i>
            <span>${gameName}</span>
          </div>
          <div class="flex items-center gap-2">
            ${renderStatusBadge(post.status)}
            <button type="button" class="gc-report-btn text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition" data-report-type="TEAM_POST" data-report-id="${post.id}" data-report-title="${escapeHtml(post.title)}" data-report-owner="Gamer #${post.user_id}" title="Báo cáo bài tìm đội vi phạm" onclick="event.stopPropagation();">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Post Title -->
        <h3 class="text-sm font-bold text-white group-hover:text-orange-400 transition leading-snug line-clamp-2 mb-2">
          ${escapeHtml(post.title)}
        </h3>

        <!-- Key Specs Grid -->
        <div class="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 mb-3 bg-[#13141a]/60 p-2.5 rounded-lg border border-[#242631]/80">
          <div class="flex items-center gap-1.5">
            <i class="fa-solid fa-users text-orange-400 w-3.5"></i>
            <span>Cần: <strong class="text-zinc-200">${post.needed_players} người</strong></span>
          </div>
          <div class="flex items-center gap-1.5">
            <i class="fa-solid fa-trophy text-amber-400 w-3.5"></i>
            <span class="truncate" title="${escapeHtml(rankText)}">${escapeHtml(rankText)}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <i class="fa-solid fa-clock text-blue-400 w-3.5"></i>
            <span class="truncate">${escapeHtml(post.play_time || "Linh hoạt")}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <i class="fa-solid fa-globe text-emerald-400 w-3.5"></i>
            <span>${escapeHtml(post.region || "Toàn quốc")}</span>
          </div>
        </div>

        <!-- Role tags -->
        ${roleBadges ? `<div class="flex flex-wrap gap-1.5 mb-3">${roleBadges}</div>` : ""}

        <!-- Description excerpt -->
        ${post.description ? `<p class="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-3">${escapeHtml(post.description)}</p>` : ""}
      </div>

      <!-- Card Footer -->
      <div class="pt-3 border-t border-[#242631] flex items-center justify-between text-[11px] text-zinc-500">
        <span><i class="fa-regular fa-clock mr-1"></i>${formatDateTime(post.created_at)}</span>
        <span class="text-orange-400 font-semibold group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
          Chi tiết <i class="fa-solid fa-chevron-right text-[9px]"></i>
        </span>
      </div>
    </div>`;
  }).join("");
}

// ============================================================
// 4. Phân trang Gamer UI
// ============================================================
function renderPagination(page, totalPages) {
  if (totalPages <= 1) return;

  let html = `
    <button ${page === 1 ? "disabled" : ""} data-page="${page - 1}"
      class="px-3 py-1.5 text-xs bg-[#181920] border border-[#2e313e] rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
      <i class="fa-solid fa-chevron-left"></i>
    </button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      const active = i === page;
      html += `
        <button data-page="${i}"
          class="w-8 h-8 text-xs font-semibold rounded-lg border transition ${
            active
              ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30"
              : "bg-[#181920] border-[#2e313e] text-zinc-400 hover:text-white hover:bg-[#222430]"
          }">
          ${i}
        </button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<span class="text-zinc-600 px-1">...</span>`;
    }
  }

  html += `
    <button ${page === totalPages ? "disabled" : ""} data-page="${page + 1}"
      class="px-3 py-1.5 text-xs bg-[#181920] border border-[#2e313e] rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
      <i class="fa-solid fa-chevron-right"></i>
    </button>`;

  pagination.innerHTML = html;
}

pagination.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-page]");
  if (!btn || btn.disabled) return;
  const p = Number(btn.dataset.page);
  loadPosts(p, currentFilters);
  document.querySelector("main").scrollTo({ top: 0, behavior: "smooth" });
});

// ============================================================
// 5. Bộ lọc Thông minh
// ============================================================
document.getElementById("btn-filter").addEventListener("click", applyFilters);
filterQ.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilters(); });

function applyFilters() {
  currentFilters = {
    q:       filterQ.value.trim() || undefined,
    game_id: filterGame.value || undefined,
    rank_id: filterRank.value || undefined,
    role_id: filterRole.value || undefined,
    region:  filterRegion.value || undefined,
  };
  loadPosts(1, currentFilters);
}

document.getElementById("btn-reset-filter").addEventListener("click", () => {
  filterQ.value = "";
  filterGame.value = "";
  filterRank.value = "";
  filterRank.disabled = true;
  filterRole.value = "";
  filterRole.disabled = true;
  filterRegion.value = "";
  currentFilters = {};
  loadPosts(1, {});
});

// ============================================================
// 6. Modal Tạo / Sửa bài
// ============================================================
document.getElementById("btn-open-create")?.addEventListener("click", openCreateModal);
document.getElementById("btn-sidebar-create")?.addEventListener("click", openCreateModal);
document.getElementById("btn-quick-create")?.addEventListener("click", openCreateModal);

function openCreateModal() {
  editingPostId = null;
  modalTitle.textContent = "Đăng bài tìm đồng đội";
  submitBtnText.textContent = "Đăng bài ngay";
  postForm.reset();
  fMinRank.disabled = true;
  fMaxRank.disabled = true;
  fRolesWrap.innerHTML = '<span class="text-zinc-500 italic text-[11px]">Vui lòng chọn game ở trên để nạp danh sách vai trò</span>';
  hideFormError();
  modalOverlay.hidden = false;
  fGame.focus();
}

document.getElementById("btn-close-modal")?.addEventListener("click", closeModal);
document.getElementById("btn-cancel-form")?.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

function closeModal() {
  modalOverlay.hidden = true;
}

// ============================================================
// 7. Submit Form Tạo bài đăng
// ============================================================
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideFormError();

  const game_id = Number(fGame.value);
  if (!game_id) return showFormError("Vui lòng chọn tựa game.");

  const title = postForm.title.value.trim();
  if (!title) return showFormError("Vui lòng nhập tiêu đề bài đăng.");

  const checkedRoles = [...fRolesWrap.querySelectorAll('input[type="checkbox"]:checked')]
    .map((el) => Number(el.value));

  const needed_players = Number(postForm.needed_players.value) || 1;
  if (needed_players < 1 || needed_players > 50) {
    return showFormError("Số người cần tuyển phải từ 1 đến 50 người.");
  }

  const payload = {
    game_id,
    title,
    min_rank_id: Number(postForm.min_rank_id.value) || null,
    max_rank_id: Number(postForm.max_rank_id.value) || null,
    needed_players,
    play_time: postForm.play_time.value.trim() || null,
    region: postForm.region.value || null,
    description: postForm.description.value.trim() || null,
    expires_at: postForm.expires_at.value
      ? new Date(postForm.expires_at.value).toISOString()
      : null,
    role_ids: checkedRoles,
  };

  submitBtn.disabled = true;
  submitBtnText.textContent = "Đang xử lý...";

  try {
    if (editingPostId === null) {
      try {
        await api.post("/api/team-posts", payload);
      } catch {
        await api.post("/team-posts", payload);
      }
      showGamerToast("Đăng bài tìm đồng đội thành công! 🎮", "success");
    } else {
      try {
        await api.put(`/api/team-posts/${editingPostId}`, payload);
      } catch {
        await api.put(`/team-posts/${editingPostId}`, payload);
      }
      showGamerToast("Cập nhật bài đăng thành công!", "success");
    }
    closeModal();
    loadPosts(1, currentFilters);
  } catch (err) {
    showFormError(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtnText.textContent = editingPostId ? "Lưu thay đổi" : "Đăng bài ngay";
  }
});

function showFormError(msg) {
  formErrorText.textContent = msg;
  formError.classList.remove("hidden");
}
function hideFormError() {
  formError.classList.add("hidden");
  formErrorText.textContent = "";
}

// Toast hiển thị kiểu Gaming
function showGamerToast(message, type = "success") {
  const container = document.getElementById("toast-container") || document.body;
  const toast = document.createElement("div");
  const isOk = type === "success";
  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
    isOk
      ? "bg-[#14231b] border-emerald-500/40 text-emerald-400"
      : "bg-[#281515] border-red-500/40 text-red-400"
  }`;
  toast.innerHTML = `<i class="fa-solid ${isOk ? "fa-circle-check" : "fa-triangle-exclamation"} text-sm"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
// 8. Khởi tạo
// ============================================================
(async function init() {
  await loadGamesCatalog();
  loadPosts(1, {});
  if (new URLSearchParams(window.location.search).get("create") === "1") {
    openCreateModal();
  }
})();
