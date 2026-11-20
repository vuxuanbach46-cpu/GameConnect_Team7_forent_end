// ============================================================
// js/pages/team-post-detail.js  –  Chi tiết bài đăng tìm đội (Gaming Hub UI)
// Task: T3CCE3F
// ============================================================

const detailWrap   = document.getElementById("detail-wrap");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle   = document.getElementById("modal-title");
const postForm     = document.getElementById("post-form");
const formError    = document.getElementById("form-error");
const submitBtn    = document.getElementById("btn-submit-post");
const fGame        = document.getElementById("f-game");
const fMinRank     = document.getElementById("f-min-rank");
const fMaxRank     = document.getElementById("f-max-rank");
const fRolesWrap   = document.getElementById("f-roles-wrap");

// Apply modal
const applyModal   = document.getElementById("apply-modal");
const applyMsg     = document.getElementById("apply-message");

let gamesCatalog = [];
let currentPost  = null;

const GAME_META = {
  1: { icon: "fa-gamepad", color: "from-blue-600/30 to-blue-900/10", border: "border-blue-500/30", text: "text-blue-400", name: "Liên Minh Huyền Thoại" },
  2: { icon: "fa-crosshairs", color: "from-red-600/30 to-red-900/10", border: "border-red-500/30", text: "text-red-400", name: "Valorant" },
  3: { icon: "fa-person-rifle", color: "from-amber-600/30 to-amber-900/10", border: "border-amber-500/30", text: "text-amber-400", name: "PUBG Mobile" },
  4: { icon: "fa-fire", color: "from-orange-600/30 to-orange-900/10", border: "border-orange-500/30", text: "text-orange-400", name: "Free Fire" },
  5: { icon: "fa-shield-halved", color: "from-purple-600/30 to-purple-900/10", border: "border-purple-500/30", text: "text-purple-400", name: "Liên Quân Mobile" },
};

// 1. Lấy post_id từ URL
const urlParams = new URLSearchParams(window.location.search);
const postId = Number(urlParams.get("id"));

if (!postId) {
  detailWrap.innerHTML = `
    <div class="bg-[#181920] border border-[#242631] rounded-2xl p-10 text-center">
      <i class="fa-solid fa-triangle-exclamation text-3xl text-red-400 mb-2"></i>
      <h3 class="text-white font-bold text-base">Không tìm thấy bài đăng</h3>
      <p class="text-zinc-400 text-xs mt-1">Đường dẫn không hợp lệ hoặc bài đăng đã bị gỡ.</p>
      <a href="team-posts.html" class="btn-orange px-4 py-2 text-xs rounded-xl inline-flex items-center gap-2 mt-4">
        ← Quay lại Sảnh Tìm Đồng Đội
      </a>
    </div>`;
}

// 2. Load danh mục game
async function loadGamesCatalog() {
  try {
    try {
      gamesCatalog = await api.get("/api/games");
    } catch {
      gamesCatalog = await api.get("/games");
    }
    populateGameSelect(fGame);
  } catch (e) {
    console.warn("Không tải được catalog:", e.message);
  }
}

function populateGameSelect(selectEl) {
  selectEl.innerHTML = '<option value="">-- Chọn game --</option>' +
    gamesCatalog.map((g) => `<option value="${g.id}">🎮 ${escapeHtml(g.name)}</option>`).join("");
}

function getGameById(id) {
  return gamesCatalog.find((g) => g.id === Number(id));
}

// 3. Load chi tiết bài đăng
async function loadDetail() {
  try {
    let post;
    try {
      post = await api.get(`/api/team-posts/${postId}`);
    } catch {
      post = await api.get(`/team-posts/${postId}`);
    }
    currentPost = post;
    document.title = `${post.title} | GameConnect`;
    renderDetail(post);
  } catch (err) {
    detailWrap.innerHTML = `
      <div class="bg-[#181920] border border-[#242631] rounded-2xl p-10 text-center">
        <i class="fa-solid fa-triangle-exclamation text-3xl text-red-400 mb-2"></i>
        <p class="text-red-400 text-sm mt-2">${escapeHtml(err.message)}</p>
        <a href="team-posts.html" class="btn-orange px-4 py-2 text-xs rounded-xl inline-flex items-center gap-2 mt-4">
          ← Quay lại Sảnh Tìm Đồng Đội
        </a>
      </div>`;
  }
}

function renderStatusBadge(status) {
  if (status === "OPEN") {
    return `<span class="badge-open px-3 py-1 rounded-full text-xs font-bold tracking-wider inline-flex items-center gap-1.5">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ĐANG MỞ TUYỂN
    </span>`;
  } else if (status === "FULL") {
    return `<span class="badge-full px-3 py-1 rounded-full text-xs font-bold tracking-wider">ĐÃ ĐỦ THÀNH VIÊN</span>`;
  } else {
    return `<span class="badge-closed px-3 py-1 rounded-full text-xs font-bold tracking-wider">ĐÃ ĐÓNG BÀI</span>`;
  }
}

function renderDetail(post) {
  const game = getGameById(post.game_id);
  const meta = GAME_META[post.game_id] || { icon: "fa-gamepad", color: "from-zinc-700/30 to-zinc-900/10", border: "border-zinc-700/30", text: "text-zinc-400", name: game?.name || `Game #${post.game_id}` };
  const gameName = game ? escapeHtml(game.name) : meta.name;

  let rankText = "Không yêu cầu bậc Rank";
  if (post.min_rank_id || post.max_rank_id) {
    const minR = game?.ranks?.find((r) => r.id === post.min_rank_id);
    const maxR = game?.ranks?.find((r) => r.id === post.max_rank_id);
    if (minR && maxR) rankText = `${minR.rank_name} → ${maxR.rank_name}`;
    else if (minR) rankText = `Từ ${minR.rank_name}`;
    else if (maxR) rankText = `Đến ${maxR.rank_name}`;
  }

  const roleTags = (post.role_ids || []).map((rid) => {
    const role = game?.roles?.find((r) => r.id === rid);
    return role ? `<span class="px-3 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold">${escapeHtml(role.role_name)}</span>` : "";
  }).join("") || '<span class="text-zinc-500 italic text-xs">Tuyển tự do mọi vị trí</span>';

  // Applications Table (nếu có quyền xem)
  const apps = post.applications || [];
  const appsSection = apps.length > 0 ? `
    <div class="bg-[#181920] border border-[#242631] rounded-2xl p-6 mt-6 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-users-viewfinder text-orange-400"></i>
          <span>Danh sách đơn ứng tuyển (${apps.length})</span>
        </h3>
        <span class="text-[11px] text-zinc-500">Chỉ chủ bài đăng nhìn thấy danh sách này</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-zinc-300">
          <thead class="text-zinc-500 uppercase border-b border-[#242631] text-[10px]">
            <tr>
              <th class="py-2.5 px-3">#</th>
              <th class="py-2.5 px-3">Người chơi</th>
              <th class="py-2.5 px-3">Lời nhắn</th>
              <th class="py-2.5 px-3">Trạng thái</th>
              <th class="py-2.5 px-3 text-right">Ngày nộp</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#242631]">
            ${apps.map((a) => `
              <tr class="hover:bg-[#1f212b]/60 transition">
                <td class="py-3 px-3 font-mono text-zinc-500">#${a.id}</td>
                <td class="py-3 px-3 font-semibold text-white">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">
                      ${a.user_id}
                    </div>
                    <span>Gamer #${a.user_id}</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-zinc-300">${escapeHtml(a.message || "Không có lời nhắn")}</td>
                <td class="py-3 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' :
                    a.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }">${a.status}</span>
                </td>
                <td class="py-3 px-3 text-right text-zinc-500 text-[11px]">${formatDateTime(a.created_at)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>` : "";

  detailWrap.innerHTML = `
    <!-- Main Card -->
    <div class="bg-[#181920] border border-[#242631] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

      <!-- Header: Game tag & Status -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r ${meta.color} border ${meta.border} text-xs font-bold ${meta.text}">
          <i class="fa-solid ${meta.icon}"></i>
          <span>${gameName}</span>
        </div>
        <div>${renderStatusBadge(post.status)}</div>
      </div>

      <!-- Title -->
      <h1 class="text-xl sm:text-2xl font-extrabold text-white leading-tight">
        ${escapeHtml(post.title)}
      </h1>

      <!-- Specs Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#13141a] p-4 rounded-xl border border-[#242631]">
        <div>
          <span class="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Số lượng tuyển</span>
          <span class="text-sm font-bold text-orange-400 flex items-center gap-1.5">
            <i class="fa-solid fa-users"></i> ${post.needed_players} người
          </span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Yêu cầu Rank</span>
          <span class="text-sm font-bold text-amber-400 flex items-center gap-1.5 truncate">
            <i class="fa-solid fa-trophy"></i> ${escapeHtml(rankText)}
          </span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Khung giờ</span>
          <span class="text-sm font-bold text-blue-400 flex items-center gap-1.5 truncate">
            <i class="fa-solid fa-clock"></i> ${escapeHtml(post.play_time || "Linh hoạt")}
          </span>
        </div>
        <div>
          <span class="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Khu vực / Server</span>
          <span class="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <i class="fa-solid fa-globe"></i> ${escapeHtml(post.region || "Toàn quốc")}
          </span>
        </div>
      </div>

      <!-- Roles Required -->
      <div>
        <h4 class="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-crosshairs text-orange-400"></i> Vai trò cần tuyển
        </h4>
        <div class="flex flex-wrap gap-2">${roleTags}</div>
      </div>

      <!-- Description -->
      ${post.description ? `
        <div>
          <h4 class="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-align-left text-orange-400"></i> Lời nhắn từ chủ bài đăng
          </h4>
          <div class="p-4 bg-[#13141a] rounded-xl border border-[#242631] text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
            ${escapeHtml(post.description)}
          </div>
        </div>` : ""}

      <!-- Meta Info -->
      <div class="text-[11px] text-zinc-500 flex flex-wrap gap-4 pt-2 border-t border-[#242631]">
        <span><i class="fa-regular fa-clock mr-1"></i>Đăng lúc: ${formatDateTime(post.created_at)}</span>
        ${post.expires_at ? `<span><i class="fa-regular fa-calendar-xmark mr-1"></i>Hạn bài: ${formatDateTime(post.expires_at)}</span>` : ""}
        <span><i class="fa-regular fa-user mr-1"></i>Chủ bài: Gamer #${post.user_id}</span>
      </div>

      <!-- Action Buttons -->
      <div class="pt-4 border-t border-[#242631] flex flex-wrap items-center gap-3">
        ${post.status === 'OPEN' ? `
          <button id="btn-open-apply" class="btn-orange px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <i class="fa-solid fa-handshake"></i>
            <span>Ứng tuyển ngay</span>
          </button>` : ""}
        <button id="btn-edit-post" class="px-4 py-2.5 bg-[#1e2029] hover:bg-[#282a36] text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-[#2e313e] flex items-center gap-2 transition">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>Chỉnh sửa bài</span>
        </button>
        <button id="btn-close-post" class="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition">
          <i class="fa-solid fa-lock"></i>
          <span>Đóng bài đăng</span>
        </button>
        <a href="team-posts.html" class="px-4 py-2.5 bg-[#181920] hover:bg-[#222430] text-zinc-400 hover:text-white rounded-xl text-xs font-semibold border border-[#242631] transition">
          ← Quay lại danh sách
        </a>
      </div>

    </div>

    ${appsSection}
  `;

  // Gắn sự kiện
  document.getElementById("btn-open-apply")?.addEventListener("click", () => {
    applyMsg.value = "";
    applyModal.hidden = false;
    applyMsg.focus();
  });
  document.getElementById("btn-edit-post")?.addEventListener("click", () => openEditModal(post));
  document.getElementById("btn-close-post")?.addEventListener("click", () => closePost(post.id));
}

// 4. Nộp đơn ứng tuyển
document.getElementById("btn-close-apply")?.addEventListener("click", () => applyModal.hidden = true);
document.getElementById("btn-cancel-apply")?.addEventListener("click", () => applyModal.hidden = true);
document.getElementById("btn-confirm-apply")?.addEventListener("click", async () => {
  const message = applyMsg.value.trim() || null;
  const btn = document.getElementById("btn-confirm-apply");
  btn.disabled = true;
  try {
    try {
      await api.post(`/api/team-posts/${postId}/applications`, { message });
    } catch {
      await api.post(`/team-posts/${postId}/applications`, { message });
    }
    showGamerToast("Đã gửi đơn ứng tuyển vào đội! 🎉", "success");
    applyModal.hidden = true;
    loadDetail();
  } catch (err) {
    showGamerToast(err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

// 5. Đóng bài đăng
async function closePost(id) {
  if (!confirm("Bạn có chắc chắn muốn đóng bài đăng này sớm?")) return;
  try {
    try {
      await (api.patch ? api.patch(`/api/team-posts/${id}/close`) : api.post(`/api/team-posts/${id}/close`));
    } catch {
      await api.post(`/team-posts/${id}/close`);
    }
    showGamerToast("Đã đóng bài đăng thành công!", "success");
    loadDetail();
  } catch (err) {
    showGamerToast(err.message, "error");
  }
}

// 6. Modal sửa bài
function openEditModal(post) {
  fGame.value = post.game_id;
  const game = getGameById(post.game_id);
  populateFormRanks(game, post.min_rank_id, post.max_rank_id);
  populateFormRoles(game, post.role_ids || []);
  fMinRank.disabled = !game;
  fMaxRank.disabled = !game;

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
}

function populateFormRanks(game, selectedMin, selectedMax) {
  const baseMin = '<option value="">-- Không yêu cầu --</option>';
  const baseMax = '<option value="">-- Không giới hạn --</option>';
  if (!game || !game.ranks) {
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
  if (!game || !game.roles || !game.roles.length) {
    fRolesWrap.innerHTML = '<span class="text-zinc-500 italic text-[11px]">Không có vai trò</span>';
    return;
  }
  fRolesWrap.innerHTML = game.roles.map((r) => `
    <label class="cursor-pointer px-2.5 py-1 rounded bg-[#20222d] border border-[#2e313e] hover:border-orange-500/50 text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition has-[:checked]:bg-orange-500/20 has-[:checked]:border-orange-500 has-[:checked]:text-orange-400 select-none">
      <input type="checkbox" name="role_ids" value="${r.id}" class="accent-orange-500"
        ${selectedIds.includes(r.id) ? "checked" : ""}>
      <span>${escapeHtml(r.role_name)}</span>
    </label>`).join("");
}

fGame.addEventListener("change", () => {
  const game = getGameById(fGame.value);
  populateFormRanks(game);
  populateFormRoles(game, []);
  fMinRank.disabled = !game;
  fMaxRank.disabled = !game;
});

document.getElementById("btn-close-modal")?.addEventListener("click", () => modalOverlay.hidden = true);
document.getElementById("btn-cancel-form")?.addEventListener("click", () => modalOverlay.hidden = true);

// 7. Submit cập nhật
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const game_id = Number(fGame.value);
  if (!game_id) return alert("Vui lòng chọn game.");
  const title = postForm.title.value.trim();
  if (!title) return alert("Vui lòng nhập tiêu đề.");

  const checkedRoles = [...fRolesWrap.querySelectorAll('input[type="checkbox"]:checked')].map((el) => Number(el.value));

  const payload = {
    game_id,
    title,
    min_rank_id: Number(postForm.min_rank_id.value) || null,
    max_rank_id: Number(postForm.max_rank_id.value) || null,
    needed_players: Number(postForm.needed_players.value) || 1,
    play_time: postForm.play_time.value.trim() || null,
    region: postForm.region.value || null,
    description: postForm.description.value.trim() || null,
    expires_at: postForm.expires_at.value ? new Date(postForm.expires_at.value).toISOString() : null,
    role_ids: checkedRoles,
  };

  submitBtn.disabled = true;
  try {
    try {
      await api.put(`/api/team-posts/${postId}`, payload);
    } catch {
      await api.put(`/team-posts/${postId}`, payload);
    }
    showGamerToast("Đã cập nhật bài đăng thành công!", "success");
    modalOverlay.hidden = true;
    loadDetail();
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

function showGamerToast(message, type = "success") {
  const container = document.getElementById("toast-container") || document.body;
  const toast = document.createElement("div");
  const isOk = type === "success";
  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
    isOk ? "bg-[#14231b] border-emerald-500/40 text-emerald-400" : "bg-[#281515] border-red-500/40 text-red-400"
  }`;
  toast.innerHTML = `<i class="fa-solid ${isOk ? "fa-circle-check" : "fa-triangle-exclamation"} text-sm"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 8. Khởi tạo
(async function init() {
  if (!postId) return;
  await loadGamesCatalog();
  await loadDetail();
})();
