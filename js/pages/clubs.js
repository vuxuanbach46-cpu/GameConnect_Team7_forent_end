document.addEventListener("DOMContentLoaded", initClubsPage);

const clubEls = {
  gameFilter: document.getElementById("club-game-filter"),
  createGame: document.getElementById("club-create-game"),
  search: document.getElementById("club-search-input"),
  access: document.getElementById("club-access-filter"),
  publicOnly: document.getElementById("club-public-only"),
  grid: document.getElementById("clubs-grid"),
  feedback: document.getElementById("clubs-feedback"),
  count: document.getElementById("clubs-count"),
  page: document.getElementById("clubs-page"),
  previous: document.getElementById("clubs-prev"),
  next: document.getElementById("clubs-next"),
  createModal: document.getElementById("club-modal"),
  detailModal: document.getElementById("club-detail-modal"),
  detailContent: document.getElementById("club-detail-content"),
  createForm: document.getElementById("club-create-form"),
  createMessage: document.getElementById("club-form-message"),
  createButton: document.getElementById("club-submit"),
};

const CLUBS_PAGE_SIZE = 12;
let clubsPage = 1;
let clubsTotalPages = 1;
let clubsRequestId = 0;
let clubsSearchTimer = null;
let clubsGames = [];
let clubsMine = new Map();
const clubsPending = new Set();

function clubUnwrap(response) {
  return response?.data !== undefined ? response.data : response;
}

function clubList(value, key = "items") {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.[key])) return value.data[key];
  if (Array.isArray(value?.[key])) return value[key];
  return [];
}

function clubEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function renderClubFilterDropdown(select, menu, label, trigger) {
  if (!select || !menu || !label || !trigger) return;
  menu.innerHTML = Array.from(select.options).map((option) => `
    <button type="button" class="club-filter-option${option.value === select.value ? " is-selected" : ""}" role="option" aria-selected="${option.value === select.value}" data-filter-select="${select.id}" data-filter-value="${clubEscape(option.value)}">
      <span>${clubEscape(option.textContent)}</span><i class="fa-solid fa-check" aria-hidden="true"></i>
    </button>`).join("");
  label.textContent = select.selectedOptions[0]?.textContent || "Chọn";
}

function setupClubFilterDropdown(selectId, menuId, labelId, triggerId) {
  renderClubFilterDropdown(
    document.getElementById(selectId), document.getElementById(menuId),
    document.getElementById(labelId), document.getElementById(triggerId),
  );
}

function closeClubFilterDropdowns(except = null) {
  document.querySelectorAll(".club-filter-dropdown.is-open").forEach((dropdown) => {
    if (dropdown === except) return;
    dropdown.classList.remove("is-open");
    dropdown.querySelector(".club-filter-trigger")?.setAttribute("aria-expanded", "false");
    dropdown.querySelector(".club-filter-menu")?.setAttribute("hidden", "");
  });
}

function clubImageUrl(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const apiRoot = (CONFIG.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  return `${apiRoot}/${raw.replace(/^\//, "")}`;
}

async function uploadClubImage(file) {
  if (!file) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Ảnh phải có định dạng JPG, PNG hoặc WebP.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Dung lượng mỗi ảnh tối đa là 5MB.");
  const formData = new FormData();
  formData.append("file", file);
  const response = clubUnwrap(await api.upload("/api/teams/images", formData));
  if (!response?.image_url) throw new Error("Máy chủ không trả về đường dẫn ảnh đã tải lên.");
  return response.image_url;
}

function showClubImagePreview(input, preview, emptyLabel) {
  if (!input || !preview) return;
  const file = input.files?.[0];
  if (!file) {
    preview.innerHTML = `<i class="fa-regular fa-image"></i><span>${clubEscape(emptyLabel)}</span>`;
    return;
  }
  const image = document.createElement("img");
  image.src = URL.createObjectURL(file);
  image.alt = "Xem trước ảnh đã chọn";
  preview.replaceChildren(image);
}

function clubInitials(name) {
  return String(name || "GC").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function clubGameName(team) {
  const game = clubsGames.find((item) => Number(item.id ?? item.game_id) === Number(team.main_game_id));
  return team.game_name || team.game?.name || team.main_game?.name || game?.name || `Game #${team.main_game_id ?? "?"}`;
}

function setClubFeedback(message = "", kind = "") {
  clubEls.feedback.className = `clubs-feedback${kind ? ` is-${kind}` : ""}`;
  clubEls.feedback.innerHTML = message ? (kind === "loading" ? `<span class="club-spinner"></span>${clubEscape(message)}` : clubEscape(message)) : "";
}

function setClubDetailNotice(message, isError = false) {
  let notice = clubEls.detailContent.querySelector(".club-detail-notice");
  if (!notice) {
    notice = document.createElement("p");
    notice.className = "club-detail-notice";
    const actions = clubEls.detailContent.querySelector(".club-form-actions");
    if (actions) actions.before(notice);
    else clubEls.detailContent.append(notice);
  }
  notice.textContent = message;
  notice.classList.toggle("is-error", isError);
}

function renderClubCard(team) {
  const id = Number(team.id);
  const isMine = clubsMine.has(id);
  const isPending = clubsPending.has(id);
  const myClub = clubsMine.get(id);
  const logo = clubImageUrl(team.logo_url || team.logo);
  const cover = clubImageUrl(team.cover_url || team.background_url || team.banner_url);
  const game = clubEscape(clubGameName(team));
  const mode = team.join_mode || "PUBLIC";
  const isApproval = mode === "APPROVAL_REQUIRED";
  const memberCount = team.total_members ?? team.member_count ?? team.members_count ?? myClub?.member_count ?? myClub?.members;
  const memberLabel = memberCount == null ? "Đội đang tuyển" : `${memberCount} thành viên`;
  const logoMarkup = logo
    ? `<img src="${clubEscape(logo)}" alt="Logo ${clubEscape(team.name)}" loading="lazy" onerror="this.remove()">`
    : clubEscape(clubInitials(team.name));

  return `<article class="club-card" data-team-id="${id}">
    <div class="club-card-cover ${cover ? "has-image" : ""}">${cover ? `<img src="${clubEscape(cover)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<span class="club-game-chip"><i class="fa-solid fa-gamepad"></i> ${game}</span></div>
    <div class="club-card-body">
      <div class="club-card-identity"><div class="club-logo">${logoMarkup}</div><div class="club-card-title"><h3 title="${clubEscape(team.name)}">${clubEscape(team.name || "Chưa đặt tên")}</h3><p>${isMine ? "Đội của bạn" : memberLabel}</p></div></div>
      <p class="club-card-description">${clubEscape(team.description || "Chưa có phần giới thiệu. Mở chi tiết để tìm hiểu thêm về đội.")}</p>
      <div class="club-card-stats"><div class="club-card-stat"><strong>${memberCount == null ? "—" : clubEscape(memberCount)}</strong><span>Thành viên</span></div><div class="club-card-stat"><strong>${clubEscape(team.max_members ?? "—")}</strong><span>Sức chứa tối đa</span></div></div>
      <div class="club-card-footer"><span class="club-access ${isApproval ? "is-approval" : ""}"><i class="fa-solid ${isApproval ? "fa-user-check" : "fa-circle-check"}"></i>${isApproval ? "Cần phê duyệt" : "Tham gia tự do"}</span><div class="club-card-actions"><button type="button" data-club-detail="${id}">Chi tiết</button><button type="button" class="club-join-btn" data-club-join="${id}" ${(isMine || isPending) ? "disabled" : ""}>${isMine ? "Đã tham gia" : isPending ? "Đang chờ duyệt" : "Tham gia"}</button></div></div>
    </div>
  </article>`;
}

function renderClubs(teams, total = teams.length) {
  clubEls.grid.innerHTML = teams.map(renderClubCard).join("");
  if (!teams.length && total === 0 && !clubEls.search.value.trim() && !clubEls.gameFilter.value && !clubEls.access.value && !clubEls.publicOnly.checked) {
    setClubFeedback("Cơ sở dữ liệu hiện chưa có câu lạc bộ nào.", "empty");
  }
  else if (!teams.length) setClubFeedback("Không có câu lạc bộ nào phù hợp với bộ lọc hiện tại.", "empty");
  else setClubFeedback();
}

async function loadClubGames() {
  const response = await api.get("/api/games");
  clubsGames = clubList(response, "games");
  for (const select of [clubEls.gameFilter, clubEls.createGame]) {
    clubsGames.forEach((game) => {
      const id = game.id ?? game.game_id;
      const name = game.name ?? game.title;
      if (id != null && name) select.add(new Option(name, id));
    });
  }
  setupClubFilterDropdown("club-game-filter", "club-game-menu", "club-game-label", "club-game-trigger");
}

async function loadMyClubs() {
  if (!localStorage.getItem("access_token")) return;
  clubsMine.clear();
  const response = await api.get("/api/teams/me");
  clubList(response, "teams").forEach((team) => clubsMine.set(Number(team.id), team));
}

async function loadClubs() {
  const requestId = ++clubsRequestId;
  setClubFeedback("Đang tải câu lạc bộ...", "loading");
  clubEls.grid.replaceChildren();
  clubEls.count.textContent = "Đang tải...";

  const params = { page: clubsPage, page_size: CLUBS_PAGE_SIZE };
  const keyword = clubEls.search.value.trim();
  const gameId = clubEls.gameFilter.value;
  const joinMode = clubEls.publicOnly.checked ? "PUBLIC" : clubEls.access.value;
  if (keyword) params.keyword = keyword;
  if (gameId) params.game_id = Number(gameId);
  if (joinMode) params.join_mode = joinMode;

  try {
    const response = await api.get("/api/teams", params);
    if (requestId !== clubsRequestId) return;
    const data = clubUnwrap(response);
    const teams = clubList(data, "items");
    const total = Number(data?.total ?? teams.length);
    clubsTotalPages = Math.max(1, Number(data?.total_pages) || Math.ceil(total / CLUBS_PAGE_SIZE));
    clubEls.count.innerHTML = `Hiển thị <strong>${teams.length}</strong> / <strong>${total}</strong> câu lạc bộ`;
    clubEls.page.textContent = `Trang ${clubsPage} / ${clubsTotalPages}`;
    clubEls.previous.disabled = clubsPage <= 1;
    clubEls.next.disabled = clubsPage >= clubsTotalPages;
    clubEls.previous.parentElement.hidden = total <= CLUBS_PAGE_SIZE;
    renderClubs(teams, total);
  } catch (error) {
    if (requestId !== clubsRequestId) return;
    clubEls.count.textContent = "";
    clubEls.previous.disabled = true;
    clubEls.next.disabled = true;
    setClubFeedback(error.message || "Không tải được danh sách câu lạc bộ.", "error");
  }
}

function setClubModal(modal, open) {
  modal.hidden = !open;
  document.body.classList.toggle("club-modal-open", open);
  if (open && modal === clubEls.createModal) setTimeout(() => document.getElementById("club-name").focus(), 30);
  if (!open && modal === clubEls.createModal) {
    clubEls.createForm.reset();
    clubEls.createMessage.hidden = true;
    clubEls.createMessage.classList.remove("success");
  }
}

function requireClubLogin() {
  if (localStorage.getItem("access_token")) return true;
  const next = encodeURIComponent("clubs.html");
  window.location.href = `login.html?next=${next}`;
  return false;
}

async function openClubDetails(teamId) {
  clubEls.detailContent.innerHTML = `<div class="clubs-feedback"><span class="club-spinner"></span> Đang tải chi tiết...</div>`;
  setClubModal(clubEls.detailModal, true);
  try {
    const [response, requestResponse] = await Promise.all([
      api.get(`/api/teams/${teamId}`),
      localStorage.getItem("access_token") && !clubsMine.has(Number(teamId))
        ? api.get(`/api/teams/${teamId}/join-request/me`).catch(() => null)
        : Promise.resolve(null),
    ]);
    const team = clubUnwrap(response);
    const joinRequest = requestResponse ? clubUnwrap(requestResponse) : null;
    if (joinRequest?.status === "PENDING") clubsPending.add(Number(teamId));
    else clubsPending.delete(Number(teamId));
    const game = clubEscape(clubGameName(team));
    const members = Array.isArray(team.members) ? team.members : [];
    const logo = clubImageUrl(team.logo_url);
    const logoMarkup = logo ? `<img src="${clubEscape(logo)}" alt="Logo ${clubEscape(team.name)}">` : clubEscape(clubInitials(team.name));
    const mine = clubsMine.get(Number(team.id));
    const isCaptain = Boolean(mine?.is_captain);
    const memberRows = members.length ? members.map((member) => {
      const captain = member.role === "CAPTAIN";
      const manageActions = isCaptain && !captain
        ? `<span class="club-member-actions"><button type="button" data-transfer-captain="${Number(team.id)}" data-member-id="${Number(member.user_id)}">Chuyển trưởng</button><button type="button" data-remove-member="${Number(team.id)}" data-member-id="${Number(member.user_id)}">Xóa</button></span>`
        : `<span>${captain ? "Đội trưởng" : "Thành viên"}</span>`;
      return `<div class="club-member-row"><span>${clubEscape(member.username || `Người chơi #${member.user_id}`)}</span>${manageActions}</div>`;
    }).join("") : `<div class="club-member-row"><span>Chưa có dữ liệu thành viên</span></div>`;
    let primaryAction = "";
    if (clubsMine.has(Number(team.id))) {
      primaryAction = isCaptain
        ? `<button type="button" class="club-btn club-btn-primary" data-edit-team="${Number(team.id)}"><i class="fa-solid fa-pen"></i> Chỉnh sửa</button>`
        : `<button type="button" class="club-btn club-btn-primary" data-leave-team="${Number(team.id)}"><i class="fa-solid fa-right-from-bracket"></i> Rời đội</button>`;
    } else if (joinRequest?.status === "PENDING") {
      primaryAction = `<button type="button" class="club-btn club-btn-primary" data-cancel-request="${Number(team.id)}"><i class="fa-solid fa-xmark"></i> Hủy yêu cầu</button>`;
    } else {
      primaryAction = `<button type="button" class="club-btn club-btn-primary" data-detail-join="${Number(team.id)}"><i class="fa-solid fa-user-plus"></i> Tham gia câu lạc bộ</button>`;
    }
    clubEls.detailContent.innerHTML = `<div class="club-dialog-header"><div><span class="clubs-eyebrow">CLUB PROFILE · ${game}</span></div><button type="button" class="club-modal-close" data-close-detail aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="club-detail-hero"><div class="club-logo">${logoMarkup}</div><div><h2 id="club-detail-title">${clubEscape(team.name)}</h2><p>${Number(team.total_members ?? members.length)} / ${clubEscape(team.max_members)} thành viên · ${team.join_mode === "APPROVAL_REQUIRED" ? "Cần phê duyệt" : "Tham gia tự do"}</p></div></div>
      <p class="club-detail-description">${clubEscape(team.description || "Câu lạc bộ chưa thêm phần giới thiệu.")}</p>
      <div class="club-detail-members"><h3>Thành viên câu lạc bộ</h3>${memberRows}</div>
      ${isCaptain ? `<form class="club-edit-form" data-edit-form="${Number(team.id)}" hidden><label><span>Tên câu lạc bộ</span><input name="name" value="${clubEscape(team.name)}" minlength="2" maxlength="100" required></label><label><span>Tựa game</span><select name="main_game_id" required>${clubsGames.map((item) => `<option value="${Number(item.id ?? item.game_id)}" ${Number(item.id ?? item.game_id) === Number(team.main_game_id) ? "selected" : ""}>${clubEscape(item.name ?? item.title)}</option>`).join("")}</select></label><label><span>Giới thiệu</span><textarea name="description" rows="3" maxlength="1000">${clubEscape(team.description || "")}</textarea></label><div class="club-form-columns"><label><span>Sức chứa (tối đa 100 người)</span><input name="max_members" type="number" min="2" max="100" value="${Number(team.max_members)}" required></label><label><span>Chế độ tham gia</span><select name="join_mode"><option value="PUBLIC" ${team.join_mode === "PUBLIC" ? "selected" : ""}>Tham gia tự do</option><option value="APPROVAL_REQUIRED" ${team.join_mode === "APPROVAL_REQUIRED" ? "selected" : ""}>Cần phê duyệt</option></select></label></div><label><span>Đường dẫn logo</span><input name="logo_url" type="url" maxlength="500" value="${clubEscape(team.logo_url || "")}"></label><p class="club-form-message" data-edit-message hidden></p><div class="club-form-actions"><button type="button" class="club-btn club-btn-quiet" data-cancel-edit>Hủy sửa</button><button type="submit" class="club-btn club-btn-primary">Lưu thay đổi</button></div></form>` : ""}
      <div class="club-form-actions"><button type="button" class="club-btn club-btn-quiet" data-close-detail>Đóng</button>${primaryAction}</div>`;
  } catch (error) {
    clubEls.detailContent.innerHTML = `<div class="club-dialog-header"><h2>Không tải được chi tiết</h2><button type="button" class="club-modal-close" data-close-detail aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button></div><p class="club-form-message">${clubEscape(error.message)}</p>`;
  }
}

async function joinClub(teamId, button) {
  if (!requireClubLogin()) return;
  button.disabled = true;
  const original = button.innerHTML;
  button.textContent = "Đang gửi...";
  try {
    const response = await api.post(`/api/teams/${teamId}/join`, {});
    const result = clubUnwrap(response);
    const status = result?.status;
    const confirmation = status === "PENDING" ? "Đã gửi yêu cầu tham gia. Hãy chờ đội trưởng phê duyệt." : "Bạn đã tham gia câu lạc bộ thành công.";
    if (status === "PENDING") clubsPending.add(Number(teamId));
    else clubsMine.set(Number(teamId), { id: Number(teamId) });
    if (status !== "PENDING") await loadMyClubs().catch(() => {});
    await loadClubs();
    if (button.isConnected) {
      button.disabled = true;
      button.textContent = status === "PENDING" ? "Đang chờ duyệt" : "Đã tham gia";
    }
    if (button.closest("#club-detail-content")) setClubDetailNotice(confirmation);
    else setClubFeedback(confirmation, "success");
  } catch (error) {
    if (button.closest("#club-detail-content")) setClubDetailNotice(error.message || "Không thể tham gia câu lạc bộ.", true);
    else setClubFeedback(error.message || "Không thể tham gia câu lạc bộ.", "error");
    button.disabled = false;
    button.innerHTML = original;
  }
}

async function cancelClubRequest(teamId, button) {
  button.disabled = true;
  try {
    await api.delete(`/api/teams/${teamId}/join-request`);
    clubsPending.delete(teamId);
    await loadClubs();
    await openClubDetails(teamId);
    setClubDetailNotice("Đã hủy yêu cầu tham gia.");
  } catch (error) {
    setClubDetailNotice(error.message || "Không hủy được yêu cầu tham gia.", true);
    button.disabled = false;
  }
}

async function leaveClub(teamId, button) {
  if (!window.confirm("Bạn muốn rời khỏi câu lạc bộ này?")) return;
  button.disabled = true;
  try {
    await api.post(`/api/teams/${teamId}/leave`, {});
    clubsMine.delete(teamId);
    await loadMyClubs();
    await loadClubs();
    setClubModal(clubEls.detailModal, false);
    setClubFeedback("Bạn đã rời câu lạc bộ.", "success");
  } catch (error) {
    setClubDetailNotice(error.message || "Không thể rời câu lạc bộ.", true);
    button.disabled = false;
  }
}

async function transferClubCaptain(teamId, userId, button) {
  if (!window.confirm("Chuyển quyền đội trưởng cho thành viên này?")) return;
  button.disabled = true;
  try {
    await api.patch(`/api/teams/${teamId}/transfer-captain`, { new_captain_id: userId });
    await loadMyClubs();
    await loadClubs();
    await openClubDetails(teamId);
    setClubDetailNotice("Đã chuyển quyền đội trưởng.");
  } catch (error) {
    setClubDetailNotice(error.message || "Không chuyển được quyền đội trưởng.", true);
    button.disabled = false;
  }
}

async function removeClubMember(teamId, userId, button) {
  if (!window.confirm("Xóa thành viên này khỏi câu lạc bộ?")) return;
  button.disabled = true;
  try {
    await api.delete(`/api/teams/${teamId}/members/${userId}`);
    await loadMyClubs();
    await loadClubs();
    await openClubDetails(teamId);
    setClubDetailNotice("Đã xóa thành viên khỏi câu lạc bộ.");
  } catch (error) {
    setClubDetailNotice(error.message || "Không xóa được thành viên.", true);
    button.disabled = false;
  }
}

function bindClubEvents() {
  setupClubFilterDropdown("club-access-filter", "club-access-menu", "club-access-label", "club-access-trigger");
  document.querySelectorAll(".club-filter-trigger").forEach((trigger) => trigger.addEventListener("click", () => {
    const dropdown = trigger.closest(".club-filter-dropdown");
    const opening = !dropdown.classList.contains("is-open");
    closeClubFilterDropdowns(dropdown);
    dropdown.classList.toggle("is-open", opening);
    trigger.setAttribute("aria-expanded", String(opening));
    dropdown.querySelector(".club-filter-menu").toggleAttribute("hidden", !opening);
  }));
  document.querySelectorAll(".club-filter-menu").forEach((menu) => menu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-filter-select]");
    if (!option) return;
    const select = document.getElementById(option.dataset.filterSelect);
    if (!select) return;
    select.value = option.dataset.filterValue;
    setupClubFilterDropdown(select.id, menu.id, menu.id.replace("-menu", "-label"), menu.id.replace("-menu", "-trigger"));
    closeClubFilterDropdowns();
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".club-filter-dropdown")) closeClubFilterDropdowns();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeClubFilterDropdowns();
  });
  ["create-club-top"].forEach((id) => document.getElementById(id)?.addEventListener("click", () => {
    if (requireClubLogin()) setClubModal(clubEls.createModal, true);
  }));
  document.querySelectorAll("[data-close-club-modal]").forEach((button) => button.addEventListener("click", () => setClubModal(clubEls.createModal, false)));
  document.querySelectorAll("[data-close-detail]").forEach((button) => button.addEventListener("click", () => setClubModal(clubEls.detailModal, false)));
  clubEls.search.addEventListener("input", () => {
    clearTimeout(clubsSearchTimer);
    clubsSearchTimer = setTimeout(() => { clubsPage = 1; loadClubs(); }, 300);
  });
  clubEls.gameFilter.addEventListener("change", () => { clubsPage = 1; loadClubs(); });
  clubEls.access.addEventListener("change", () => {
    clubEls.publicOnly.checked = clubEls.access.value === "PUBLIC";
    clubsPage = 1;
    loadClubs();
  });
  clubEls.publicOnly.addEventListener("change", () => {
    clubEls.access.value = clubEls.publicOnly.checked ? "PUBLIC" : "";
    setupClubFilterDropdown("club-access-filter", "club-access-menu", "club-access-label", "club-access-trigger");
    clubsPage = 1;
    loadClubs();
  });
  clubEls.previous.addEventListener("click", () => { if (clubsPage > 1) { clubsPage -= 1; loadClubs(); } });
  clubEls.next.addEventListener("click", () => { if (clubsPage < clubsTotalPages) { clubsPage += 1; loadClubs(); } });
  document.querySelectorAll(".club-view-toggle button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".club-view-toggle button").forEach((item) => item.classList.toggle("active", item === button));
    clubEls.grid.classList.toggle("is-list", button.dataset.view === "list");
  }));
  clubEls.grid.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-club-detail]");
    const joinButton = event.target.closest("[data-club-join]");
    if (detailButton) openClubDetails(Number(detailButton.dataset.clubDetail));
    if (joinButton) joinClub(Number(joinButton.dataset.clubJoin), joinButton);
  });
  clubEls.detailContent.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-detail]");
    const joinButton = event.target.closest("[data-detail-join]");
    const cancelEditButton = event.target.closest("[data-cancel-edit]");
    const editButton = event.target.closest("[data-edit-team]");
    const cancelRequestButton = event.target.closest("[data-cancel-request]");
    const leaveButton = event.target.closest("[data-leave-team]");
    const transferButton = event.target.closest("[data-transfer-captain]");
    const removeButton = event.target.closest("[data-remove-member]");
    if (closeButton) setClubModal(clubEls.detailModal, false);
    if (joinButton) joinClub(Number(joinButton.dataset.detailJoin), joinButton);
    if (cancelEditButton) clubEls.detailContent.querySelector("[data-edit-form]").hidden = true;
    if (editButton) clubEls.detailContent.querySelector("[data-edit-form]").hidden = false;
    if (cancelRequestButton) cancelClubRequest(Number(cancelRequestButton.dataset.cancelRequest), cancelRequestButton);
    if (leaveButton) leaveClub(Number(leaveButton.dataset.leaveTeam), leaveButton);
    if (transferButton) transferClubCaptain(Number(transferButton.dataset.transferCaptain), Number(transferButton.dataset.memberId), transferButton);
    if (removeButton) removeClubMember(Number(removeButton.dataset.removeMember), Number(removeButton.dataset.memberId), removeButton);
  });
  clubEls.detailContent.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-edit-form]");
    if (!form) return;
    event.preventDefault();
    const teamId = Number(form.dataset.editForm);
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      main_game_id: Number(formData.get("main_game_id")),
      description: String(formData.get("description") || "").trim() || null,
      max_members: Number(formData.get("max_members")),
      join_mode: formData.get("join_mode"),
      logo_url: String(formData.get("logo_url") || "").trim() || null,
    };
    const message = form.querySelector("[data-edit-message]");
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await api.put(`/api/teams/${teamId}`, payload);
      await loadMyClubs();
      await loadClubs();
      await openClubDetails(teamId);
    } catch (error) {
      message.textContent = error.message || "Không cập nhật được câu lạc bộ.";
      message.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });
  clubEls.createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireClubLogin()) return;
    clubEls.createMessage.hidden = true;
    clubEls.createButton.disabled = true;
    clubEls.createButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';
    try {
      const logoUrl = await uploadClubImage(document.getElementById("club-logo-file").files?.[0]);
      const coverUrl = await uploadClubImage(document.getElementById("club-cover-file").files?.[0]);
      const payload = {
        name: document.getElementById("club-name").value.trim(),
        main_game_id: Number(clubEls.createGame.value),
        description: document.getElementById("club-description").value.trim() || null,
        max_members: Number(document.getElementById("club-max-members").value),
        join_mode: document.getElementById("club-join-mode").value,
        logo_url: logoUrl,
        cover_url: coverUrl,
      };
      await api.post("/api/teams", payload);
      clubEls.createMessage.textContent = "Đã tạo câu lạc bộ thành công.";
      clubEls.createMessage.classList.add("success");
      clubEls.createMessage.hidden = false;
      clubsPage = 1;
      await loadMyClubs();
      await loadClubs();
      setTimeout(() => setClubModal(clubEls.createModal, false), 650);
    } catch (error) {
      clubEls.createMessage.textContent = error.message || "Không tạo được câu lạc bộ.";
      clubEls.createMessage.classList.remove("success");
      clubEls.createMessage.hidden = false;
    } finally {
      clubEls.createButton.disabled = false;
      clubEls.createButton.innerHTML = '<i class="fa-solid fa-plus"></i> Tạo câu lạc bộ';
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!clubEls.createModal.hidden) setClubModal(clubEls.createModal, false);
    if (!clubEls.detailModal.hidden) setClubModal(clubEls.detailModal, false);
  });
}

function initClubRightbar() {
  const avatarButton = document.getElementById("btn-avatar-menu");
  const avatarMenu = document.getElementById("avatar-dropdown-menu");
  const avatarName = document.getElementById("avatar-user-name");
  const avatarImage = document.querySelector(".fc-self-avatar");
  const passwordMenuItem = document.getElementById("open-change-password");
  const passwordModal = document.getElementById("change-password-modal");
  const passwordForm = document.getElementById("change-password-form");
  const passwordMessage = document.getElementById("change-password-message");
  const passwordSubmit = document.getElementById("change-password-submit");

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
  applyTheme(localStorage.getItem("gc_friends_theme") || "dark");

  avatarButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    avatarMenu.hidden = !avatarMenu.hidden;
    avatarButton.setAttribute("aria-expanded", String(!avatarMenu.hidden));
  });
  document.querySelectorAll(".fc-theme-option").forEach((button) => button.addEventListener("click", () => {
    applyTheme(button.dataset.setTheme);
    avatarMenu.hidden = true;
    avatarButton?.setAttribute("aria-expanded", "false");
  }));
  document.addEventListener("click", (event) => {
    if (avatarMenu && !avatarMenu.hidden && !avatarMenu.contains(event.target) && !avatarButton?.contains(event.target)) {
      avatarMenu.hidden = true;
      avatarButton?.setAttribute("aria-expanded", "false");
    }
  });

  passwordMenuItem.hidden = localStorage.getItem("auth_provider") === "google";
  const closePasswordModal = (open) => {
    passwordModal.hidden = !open;
    document.body.classList.toggle("gc-password-modal-open", open);
    if (open) {
      avatarMenu.hidden = true;
      avatarButton?.setAttribute("aria-expanded", "false");
      setTimeout(() => document.getElementById("old-password")?.focus(), 30);
    } else {
      passwordForm.reset();
      passwordMessage.hidden = true;
      passwordMessage.textContent = "";
      passwordMessage.classList.remove("error");
    }
  };
  passwordMenuItem.addEventListener("click", () => closePasswordModal(true));
  ["close-change-password", "cancel-change-password"].forEach((id) => document.getElementById(id)?.addEventListener("click", () => closePasswordModal(false)));
  passwordModal.querySelectorAll("[data-close-password]").forEach((element) => element.addEventListener("click", () => closePasswordModal(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (passwordModal && !passwordModal.hidden) closePasswordModal(false);
      if (avatarMenu) {
        avatarMenu.hidden = true;
        avatarButton?.setAttribute("aria-expanded", "false");
      }
    }
  });

  passwordForm.addEventListener("submit", async (event) => {
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
    passwordSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
    try {
      const response = await api.put("/auth/change-password", { old_password: oldPassword, new_password: newPassword });
      showMessage(response?.message || "Đổi mật khẩu thành công.");
      passwordForm.reset();
    } catch (error) {
      showMessage(error.message || "Không thể đổi mật khẩu.", true);
    } finally {
      passwordSubmit.disabled = false;
      passwordSubmit.innerHTML = '<i class="fa-solid fa-key"></i> Cập nhật mật khẩu';
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    ["access_token", "refresh_token", "remember_login", "auth_provider", "user_role"].forEach((key) => localStorage.removeItem(key));
    window.location.href = "../index.html";
  });

  const token = localStorage.getItem("access_token") || "";
  let fallbackName = "Game thủ";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    fallbackName = payload.username || (payload.email ? payload.email.split("@")[0] : payload.sub) || fallbackName;
  } catch (_) {}
  avatarName.textContent = fallbackName;
  avatarImage.alt = fallbackName;
  if (token) {
    api.get("/user/me").then((response) => {
      const user = clubUnwrap(response) || {};
      const username = user.username || fallbackName;
      avatarName.textContent = username;
      api.get("/api/profiles/me").then((profileResponse) => {
        const profile = clubUnwrap(profileResponse) || {};
        if (profile.display_name) avatarName.textContent = profile.display_name;
        if (profile.avatar) avatarImage.src = clubImageUrl(profile.avatar);
      }).catch(() => {});
    }).catch(() => {});
  }
}

async function initClubsPage() {
  initClubRightbar();
  bindClubEvents();
  document.getElementById("club-logo-file")?.addEventListener("change", (event) => showClubImagePreview(event.currentTarget, document.getElementById("club-logo-preview"), "Chưa chọn ảnh logo"));
  document.getElementById("club-cover-file")?.addEventListener("change", (event) => showClubImagePreview(event.currentTarget, document.getElementById("club-cover-preview"), "Chưa chọn ảnh nền"));
  const results = await Promise.allSettled([loadClubGames(), loadMyClubs()]);
  if (results[0].status === "rejected") {
    console.error("Không tải được danh mục game:", results[0].reason);
    setClubFeedback("Không tải được danh mục game. Bạn vẫn có thể xem câu lạc bộ.", "error");
  }
  if (results[1].status === "rejected") console.warn("Chưa tải được danh sách câu lạc bộ của tôi:", results[1].reason);
  await loadClubs();
}
