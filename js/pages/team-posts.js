// ============================================================
// js/pages/team-posts.js  –  Danh sách & Tạo/Sửa bài đăng tìm đội
// T3CCE3F: Danh sách card bài đăng, bộ lọc, form tạo/sửa bài
//          có dropdown rank/vai trò theo game.
// ============================================================

// ---- Trạng thái ----
let currentPage = 1;
let currentFilters = {};
let gamesCatalog = [];   // [{ id, name, ranks: [], roles: [] }]
let editingPostId = null;

// ---- Phần tử DOM ----
const postGrid        = document.getElementById("post-grid");
const totalCount      = document.getElementById("total-count");
const pagination      = document.getElementById("pagination");
const modalOverlay    = document.getElementById("modal-overlay");
const modalTitle      = document.getElementById("modal-title");
const postForm        = document.getElementById("post-form");
const formError       = document.getElementById("form-error");
const submitBtn       = document.getElementById("btn-submit-post");

// Bộ lọc
const filterQ         = document.getElementById("filter-q");
const filterGame      = document.getElementById("filter-game");
const filterRank      = document.getElementById("filter-rank");
const filterRole      = document.getElementById("filter-role");
const filterRegion    = document.getElementById("filter-region");

// Form modal
const fGame           = document.getElementById("f-game");
const fMinRank        = document.getElementById("f-min-rank");
const fMaxRank        = document.getElementById("f-max-rank");
const fRolesWrap      = document.getElementById("f-roles-wrap");

// ============================================================
// 1. Load danh mục game (ranks + roles)
// ============================================================
async function loadGamesCatalog() {
  try {
    gamesCatalog = await api.get("/games");
    populateGameDropdown(filterGame, false);
    populateGameDropdown(fGame, true);
  } catch (err) {
    console.warn("Không tải được danh mục game:", err.message);
  }
}

function populateGameDropdown(selectEl, withPlaceholder) {
  const placeholder = withPlaceholder
    ? '<option value="">-- Chọn game --</option>'
    : '<option value="">-- Tất cả game --</option>';
  selectEl.innerHTML = placeholder + gamesCatalog
    .map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`)
    .join("");
}

// ============================================================
// 2. Cập nhật dropdown rank/role khi chọn game
// ============================================================
function getGameById(id) {
  return gamesCatalog.find((g) => g.id === Number(id));
}

// Dùng cho bộ lọc ngoài
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
  if (!game) return;
  const sorted = [...game.ranks].sort((a, b) => a.rank_order - b.rank_order);
  filterRank.innerHTML += sorted
    .map((r) => `<option value="${r.id}">${escapeHtml(r.rank_name)}</option>`)
    .join("");
}

function populateFilterRole(game) {
  filterRole.innerHTML = '<option value="">-- Tất cả vai trò --</option>';
  if (!game) return;
  filterRole.innerHTML += game.roles
    .map((r) => `<option value="${r.id}">${escapeHtml(r.role_name)}</option>`)
    .join("");
}

// Dùng cho form modal
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
  if (!game) {
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

// ============================================================
// 3. Load & Render danh sách bài đăng
// ============================================================
async function loadPosts(page = 1, filters = {}) {
  postGrid.innerHTML = `
    <div class="post-skeleton"></div>
    <div class="post-skeleton"></div>
    <div class="post-skeleton"></div>`;
  pagination.innerHTML = "";
  totalCount.textContent = "";

  const params = { page, page_size: 12, ...filters };
  // Xoá các key rỗng
  Object.keys(params).forEach((k) => {
    if (params[k] === "" || params[k] === undefined || params[k] === null) delete params[k];
  });

  try {
    const data = await api.get("/team-posts", params);
    renderPosts(data.items);
    totalCount.textContent = `(${data.total} bài)`;
    renderPagination(data.page, data.total_pages);
    currentPage = data.page;
  } catch (err) {
    postGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <p class="text-error">${escapeHtml(err.message)}</p>
    </div>`;
  }
}

function statusBadge(status) {
  const map = {
    OPEN:    ["badge-open", "Đang mở"],
    CLOSED:  ["badge-closed", "Đã đóng"],
    EXPIRED: ["badge-expired", "Hết hạn"],
  };
  const [cls, label] = map[status] || ["badge-expired", status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function renderPosts(items) {
  if (!items.length) {
    postGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <p>Chưa có bài đăng nào. Hãy là người đầu tiên đăng bài! 🎮</p>
    </div>`;
    return;
  }

  postGrid.innerHTML = items.map((post) => {
    const game = getGameById(post.game_id);
    const gameName = game ? escapeHtml(game.name) : `Game #${post.game_id}`;

    // Vai trò
    const roleTags = (post.role_ids || [])
      .map((rid) => {
        const role = game?.roles.find((r) => r.id === rid);
        return role ? `<span class="role-tag">${escapeHtml(role.role_name)}</span>` : "";
      }).join("");

    // Rank
    let rankText = "";
    if (post.min_rank_id || post.max_rank_id) {
      const minR = game?.ranks.find((r) => r.id === post.min_rank_id);
      const maxR = game?.ranks.find((r) => r.id === post.max_rank_id);
      if (minR && maxR) rankText = `${minR.rank_name} → ${maxR.rank_name}`;
      else if (minR) rankText = `Từ ${minR.rank_name}`;
      else if (maxR) rankText = `Đến ${maxR.rank_name}`;
    }

    return `
    <div class="post-card" data-id="${post.id}">
      <div class="post-card-header">
        <h3 class="post-card-title">
          <a href="team-post-detail.html?id=${post.id}">${escapeHtml(post.title)}</a>
        </h3>
        ${statusBadge(post.status)}
      </div>

      <div class="post-meta">
        <span>🎮 ${gameName}</span>
        ${rankText ? `<span>🏆 ${escapeHtml(rankText)}</span>` : ""}
        <span>👥 ${post.needed_players} người</span>
        ${post.region ? `<span>🌏 ${escapeHtml(post.region)}</span>` : ""}
        ${post.play_time ? `<span>⏰ ${escapeHtml(post.play_time)}</span>` : ""}
      </div>

      ${roleTags ? `<div class="role-tags">${roleTags}</div>` : ""}

      ${post.description ? `<p class="post-desc">${escapeHtml(post.description)}</p>` : ""}

      <div class="post-card-footer">
        <span>🕐 ${formatDateTime(post.created_at)}</span>
        <a href="team-post-detail.html?id=${post.id}" class="btn btn-small">Xem chi tiết →</a>
      </div>
    </div>`;
  }).join("");
}

// ============================================================
// 4. Phân trang
// ============================================================
function renderPagination(page, totalPages) {
  if (totalPages <= 1) return;

  let html = `<button ${page === 1 ? "disabled" : ""} data-page="${page - 1}">‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= page - 2 && i <= page + 2)
    ) {
      html += `<button class="${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += `<button disabled>…</button>`;
    }
  }
  html += `<button ${page === totalPages ? "disabled" : ""} data-page="${page + 1}">›</button>`;
  pagination.innerHTML = html;
}

pagination.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-page]");
  if (!btn || btn.disabled) return;
  const p = Number(btn.dataset.page);
  loadPosts(p, currentFilters);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ============================================================
// 5. Bộ lọc
// ============================================================
document.getElementById("btn-filter").addEventListener("click", applyFilter);
filterQ.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilter(); });

function applyFilter() {
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
// 6. Mở modal Tạo bài
// ============================================================
document.getElementById("btn-open-create").addEventListener("click", openCreateModal);

function openCreateModal() {
  editingPostId = null;
  modalTitle.textContent = "Đăng bài tìm đồng đội";
  submitBtn.textContent = "Đăng bài";
  postForm.reset();
  fMinRank.disabled = true;
  fMaxRank.disabled = true;
  fRolesWrap.innerHTML = '<span class="muted" style="font-size:13px;">Chọn game trước để hiện vai trò</span>';
  hideFormError();
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  fGame.focus();
}

// ============================================================
// 7. Đóng modal
// ============================================================
document.getElementById("btn-close-modal").addEventListener("click", closeModal);
document.getElementById("btn-cancel-form").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

// ============================================================
// 8. Submit form (Tạo / Sửa)
// ============================================================
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideFormError();

  const game_id = Number(fGame.value);
  if (!game_id) return showFormError("Vui lòng chọn game.");

  const title = postForm.title.value.trim();
  if (!title) return showFormError("Vui lòng nhập tiêu đề.");

  // Lấy các role đã chọn
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
    if (editingPostId === null) {
      await api.post("/team-posts", payload);
      showToast("Đăng bài thành công! 🎮");
    } else {
      await api.put(`/team-posts/${editingPostId}`, payload);
      showToast("Đã cập nhật bài đăng!");
    }
    closeModal();
    loadPosts(currentPage, currentFilters);
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
// 9. Khởi động
// ============================================================
(async function init() {
  await loadGamesCatalog();
  loadPosts(1, {});
})();
