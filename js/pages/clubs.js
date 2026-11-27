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
  deleteModal: document.getElementById("club-delete-modal"),
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
let pendingClubDeleteId = null;
let pendingClubMemberAction = null;

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

const CLUB_GAME_LOGOS = {
  valorant: "../assets/images/games/valorant.png",
  lol: "../assets/images/games/lol.png",
  tft: "../assets/images/games/tft.png",
  cs2: "../assets/images/games/cs2.png",
  aov: "../assets/images/games/aov.png",
};

const CLUB_GRID_ICON_SVG = `<svg class="club-dd-grid-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;

function resolveClubGameLogo(gameName, rawIconUrl = "") {
  const s = String(gameName || "").trim().toLowerCase();
  if (s.includes("valorant")) return CLUB_GAME_LOGOS.valorant;
  if (s.includes("cs2") || s.includes("counter-strike") || s.includes("counter strike")) return CLUB_GAME_LOGOS.cs2;
  if (s.includes("liên quân") || s.includes("lien quan") || s.includes("aov") || s.includes("arena of valor")) return CLUB_GAME_LOGOS.aov;
  if (s.includes("chân lý") || s.includes("chan ly") || s.includes("tft") || s.includes("đtcl") || s.includes("teamfight")) return CLUB_GAME_LOGOS.tft;
  if (s.includes("liên minh") || s.includes("lien minh") || s.includes("lol") || s.includes("league")) return CLUB_GAME_LOGOS.lol;
  if (rawIconUrl) return clubImageUrl(rawIconUrl);
  return "";
}

function getClubOptionLogo(selectId, optionValue, optionText) {
  if (selectId !== "club-game-filter" && selectId !== "club-create-game") return "";
  if (!optionValue) return "";
  const matchedGame = clubsGames.find((g) => String(g.id ?? g.game_id) === String(optionValue));
  return resolveClubGameLogo(optionText || matchedGame?.name, matchedGame?.icon_url || matchedGame?.logo_url || "");
}

function renderClubFilterDropdown(select, menu, label, trigger) {
  if (!select || !menu || !label || !trigger) return;
  const isGameDropdown = select.id === "club-game-filter" || select.id === "club-create-game";

  menu.innerHTML = Array.from(select.options).map((option) => {
    const isSelected = option.value === select.value;
    const logoUrl = getClubOptionLogo(select.id, option.value, option.textContent);
    const leftIconHtml = isGameDropdown
      ? (logoUrl
          ? `<img src="${clubEscape(logoUrl)}" alt="" class="club-dd-logo">`
          : CLUB_GRID_ICON_SVG)
      : "";

    return `
      <button type="button" class="club-filter-option${isSelected ? " is-selected" : ""}" role="option" aria-selected="${isSelected}" data-filter-select="${select.id}" data-filter-value="${clubEscape(option.value)}">
        <span class="club-dd-option-left">
          ${leftIconHtml}
          <span>${clubEscape(option.textContent)}</span>
        </span>
        <span class="club-dd-option-right">
          <span class="club-dd-check">${isSelected ? "✓" : ""}</span>
        </span>
      </button>`;
  }).join("");

  const selectedOpt = select.selectedOptions[0] || select.options[0];
  const selectedText = selectedOpt?.textContent || "Chọn";
  const selectedValue = selectedOpt?.value || "";
  if (isGameDropdown) {
    const selectedLogo = getClubOptionLogo(select.id, selectedValue, selectedText);
    const triggerIcon = selectedLogo
      ? `<img src="${clubEscape(selectedLogo)}" alt="" class="club-dd-logo">`
      : CLUB_GRID_ICON_SVG;
    label.innerHTML = `${triggerIcon}<span>${clubEscape(selectedText)}</span>`;
    // Ẩn icon fa-gamepad cũ ngoài label nếu có
    const legacyIcon = trigger.querySelector(":scope > i.fa-gamepad");
    if (legacyIcon) legacyIcon.style.display = "none";
  } else {
    label.textContent = selectedText;
  }
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
  const isCover = preview.id === "club-cover-preview";
  const defaultTitle = isCover ? "Tải ảnh nền bìa lên" : "Tải ảnh logo lên";
  const defaultSub = isCover ? "JPG, PNG, WebP · Tỉ lệ ngang 16:9" : "JPG, PNG, WebP · Tối đa 5 MB";
  const defaultIcon = isCover ? "fa-regular fa-image" : "fa-solid fa-cloud-arrow-up";
  const file = input.files?.[0];
  if (!file) {
    preview.classList.remove("has-file");
    preview.innerHTML = `
      <div class="club-upload-placeholder">
        <span class="club-upload-icon"><i class="${defaultIcon}"></i></span>
        <strong class="club-upload-title">${clubEscape(defaultTitle)}</strong>
        <span class="club-upload-sub">${clubEscape(defaultSub || emptyLabel)}</span>
      </div>`;
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  preview.classList.add("has-file");
  preview.innerHTML = `
    <img src="${clubEscape(objectUrl)}" alt="Xem trước ảnh đã chọn">
    <div class="club-upload-overlay">
      <span class="club-upload-filename" title="${clubEscape(file.name)}">${clubEscape(file.name)}</span>
      <div class="club-upload-actions">
        <span class="club-upload-change">Đổi ảnh</span>
        <button type="button" class="club-upload-remove" data-clear-file="${clubEscape(input.id)}" title="Xoá ảnh đã chọn" aria-label="Xoá ảnh đã chọn">✕</button>
      </div>
    </div>`;
}

function syncClubCapacityChips(val) {
  const num = Number(val) || 100;
  document.querySelectorAll("[data-capacity-preset]").forEach((chip) => {
    chip.classList.toggle("active", Number(chip.dataset.capacityPreset) === num);
  });
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
      <div class="club-card-footer"><span class="club-access ${isApproval ? "is-approval" : ""}"><i class="fa-solid ${isApproval ? "fa-user-check" : "fa-circle-check"}"></i>${isApproval ? "Cần phê duyệt" : "Tham gia tự do"}</span><div class="club-card-actions"><button type="button" data-club-detail="${id}">Chi tiết</button>${isMine ? `<a href="team-feed.html?id=${id}" class="club-join-btn">Bảng tin CLB</a>` : `<button type="button" class="club-join-btn" data-club-join="${id}" ${isPending ? "disabled" : ""}>${isPending ? "Đang chờ duyệt" : "Tham gia"}</button>`}</div></div>
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
  setupClubFilterDropdown("club-create-game", "club-create-game-menu", "club-create-game-label", "club-create-game-trigger");
  setupClubFilterDropdown("club-join-mode", "club-join-mode-menu", "club-join-mode-label", "club-join-mode-trigger");
}

async function loadMyClubs() {
  if (!localStorage.getItem("access_token")) return;
  clubsMine.clear();
  const response = await api.get("/api/teams/me");
  const myTeams = clubList(response, "teams");
  myTeams.forEach((team) => clubsMine.set(Number(team.id), {
    ...team,
    is_captain: Boolean(team.is_captain || String(team.role || "").toLowerCase() === "captain"),
  }));
  if (typeof window.gcRefreshSidebarClubs === "function") {
    window.gcRefreshSidebarClubs(myTeams);
  }
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
  document.body.classList.toggle("club-modal-open", Boolean(document.querySelector(".club-modal:not([hidden])")));
  if (open && modal === clubEls.createModal) setTimeout(() => document.getElementById("club-name").focus(), 30);
  if (!open && modal === clubEls.createModal) {
    closeClubFilterDropdowns();
    clubEls.createForm.reset();
    setupClubFilterDropdown("club-create-game", "club-create-game-menu", "club-create-game-label", "club-create-game-trigger");
    setupClubFilterDropdown("club-join-mode", "club-join-mode-menu", "club-join-mode-label", "club-join-mode-trigger");
    syncClubCapacityChips(100);
    showClubImagePreview(document.getElementById("club-logo-file"), document.getElementById("club-logo-preview"), "Chưa chọn ảnh logo");
    showClubImagePreview(document.getElementById("club-cover-file"), document.getElementById("club-cover-preview"), "Chưa chọn ảnh nền");
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
    const needsApproval = team.join_mode === "APPROVAL_REQUIRED";
    const memberRows = members.length ? members.map((member) => {
      const captain = member.role === "CAPTAIN";
      const manageActions = isCaptain && !captain
        ? `<span class="club-member-actions"><button type="button" data-transfer-captain="${Number(team.id)}" data-member-id="${Number(member.user_id)}" data-member-name="${clubEscape(member.username || `Người chơi #${member.user_id}`)}">Chuyển trưởng</button><button type="button" data-remove-member="${Number(team.id)}" data-member-id="${Number(member.user_id)}" data-member-name="${clubEscape(member.username || `Người chơi #${member.user_id}`)}">Xóa</button></span>`
        : `<span>${captain ? "Đội trưởng" : "Thành viên"}</span>`;
      return `<div class="club-member-row"><span>${clubEscape(member.username || `Người chơi #${member.user_id}`)}</span>${manageActions}</div>`;
    }).join("") : `<div class="club-member-row"><span>Chưa có dữ liệu thành viên</span></div>`;
    let primaryAction = "";
    if (clubsMine.has(Number(team.id))) {
      const feedLink = `<a href="team-feed.html?id=${Number(team.id)}" class="club-btn club-btn-primary"><i class="fa-solid fa-bullhorn"></i> Bảng tin CLB</a>`;
      const secondaryManage = isCaptain
        ? `<button type="button" class="club-btn club-btn-quiet" data-edit-team="${Number(team.id)}"><i class="fa-solid fa-pen"></i> Chỉnh sửa</button><button type="button" class="club-btn club-btn-danger club-btn-delete-inline" data-delete-team="${Number(team.id)}"><i class="fa-solid fa-trash-can"></i> Xóa CLB</button>`
        : `<button type="button" class="club-btn club-btn-quiet" data-leave-team="${Number(team.id)}"><i class="fa-solid fa-right-from-bracket"></i> Rời CLB</button>`;
      primaryAction = `${secondaryManage}${feedLink}`;
    } else if (joinRequest?.status === "PENDING") {
      primaryAction = `<button type="button" class="club-btn club-btn-primary" data-cancel-request="${Number(team.id)}"><i class="fa-solid fa-xmark"></i> Hủy yêu cầu</button>`;
    } else {
      primaryAction = `<button type="button" class="club-btn club-btn-primary" data-detail-join="${Number(team.id)}"><i class="fa-solid fa-user-plus"></i> Tham gia câu lạc bộ</button>`;
    }
    clubEls.detailContent.innerHTML = `<div class="club-dialog-header"><div><span class="clubs-eyebrow">CLUB PROFILE · ${game}</span></div><button type="button" class="club-modal-close" data-close-detail aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="club-detail-hero"><div class="club-logo">${logoMarkup}</div><div><h2 id="club-detail-title">${clubEscape(team.name)}</h2><p>${Number(team.total_members ?? members.length)} / ${clubEscape(team.max_members)} thành viên · ${team.join_mode === "APPROVAL_REQUIRED" ? "Cần phê duyệt" : "Tham gia tự do"}</p></div></div>
      <p class="club-detail-description">${clubEscape(team.description || "Câu lạc bộ chưa thêm phần giới thiệu.")}</p>
      ${isCaptain && needsApproval ? `<section class="club-join-requests" aria-labelledby="club-requests-title"><div class="club-requests-heading"><h3 id="club-requests-title">Yêu cầu tham gia</h3><span class="club-requests-count" data-pending-count>…</span></div><div class="club-requests-list" data-pending-requests><p class="club-requests-state"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải yêu cầu...</p></div></section>` : ""}
      <div class="club-detail-members"><h3>Thành viên câu lạc bộ</h3>${memberRows}</div>
      ${isCaptain ? `<form class="club-edit-form" data-edit-form="${Number(team.id)}" hidden><label><span>Tên câu lạc bộ</span><input name="name" value="${clubEscape(team.name)}" minlength="2" maxlength="100" required></label><label><span>Tựa game</span><select name="main_game_id" required>${clubsGames.map((item) => `<option value="${Number(item.id ?? item.game_id)}" ${Number(item.id ?? item.game_id) === Number(team.main_game_id) ? "selected" : ""}>${clubEscape(item.name ?? item.title)}</option>`).join("")}</select></label><label><span>Giới thiệu</span><textarea name="description" rows="3" maxlength="1000">${clubEscape(team.description || "")}</textarea></label><div class="club-form-columns"><label><span>Sức chứa (tối đa 100 người)</span><input name="max_members" type="number" min="2" max="100" value="${Number(team.max_members)}" required></label><label><span>Chế độ tham gia</span><select name="join_mode"><option value="PUBLIC" ${team.join_mode === "PUBLIC" ? "selected" : ""}>Tham gia tự do</option><option value="APPROVAL_REQUIRED" ${team.join_mode === "APPROVAL_REQUIRED" ? "selected" : ""}>Cần phê duyệt</option></select></label></div><label><span>Đường dẫn logo</span><input name="logo_url" type="url" maxlength="500" value="${clubEscape(team.logo_url || "")}"></label><p class="club-form-message" data-edit-message hidden></p><div class="club-form-actions"><button type="button" class="club-btn club-btn-quiet" data-cancel-edit>Hủy sửa</button><button type="submit" class="club-btn club-btn-primary">Lưu thay đổi</button></div></form>` : ""}
      <div class="club-form-actions"><button type="button" class="club-btn club-btn-quiet" data-close-detail>Đóng</button>${primaryAction}</div>`;
    if (isCaptain && needsApproval) loadPendingClubRequests(Number(team.id));
  } catch (error) {
    clubEls.detailContent.innerHTML = `<div class="club-dialog-header"><h2>Không tải được chi tiết</h2><button type="button" class="club-modal-close" data-close-detail aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button></div><p class="club-form-message">${clubEscape(error.message)}</p>`;
  }
}

async function loadPendingClubRequests(teamId) {
  const list = clubEls.detailContent.querySelector("[data-pending-requests]");
  const count = clubEls.detailContent.querySelector("[data-pending-count]");
  if (!list || !count) return;
  try {
    const response = await api.get(`/api/teams/${teamId}/join-requests`);
    const requests = clubList(response, "requests");
    count.textContent = String(requests.length);
    list.innerHTML = requests.length ? requests.map((request) => `
      <article class="club-join-request" data-request-row="${Number(request.id)}">
        <div class="club-join-request-copy"><strong>${clubEscape(request.username || `Người chơi #${request.user_id}`)}</strong><span>${clubEscape(request.message || "Chưa thêm lời nhắn.")}</span></div>
        <div class="club-join-request-actions"><button type="button" class="club-request-approve" data-review-request="${Number(request.id)}" data-team-id="${teamId}" data-review-status="ACCEPTED" aria-label="Duyệt yêu cầu của ${clubEscape(request.username || "thành viên")}" title="Duyệt"><i class="fa-solid fa-check"></i></button><button type="button" class="club-request-reject" data-review-request="${Number(request.id)}" data-team-id="${teamId}" data-review-status="REJECTED" aria-label="Từ chối yêu cầu của ${clubEscape(request.username || "thành viên")}" title="Từ chối"><i class="fa-solid fa-xmark"></i></button></div>
      </article>`).join("") : `<p class="club-requests-state">Hiện chưa có yêu cầu chờ duyệt.</p>`;
  } catch (error) {
    count.textContent = "!";
    list.innerHTML = `<p class="club-requests-state is-error">${clubEscape(error.message || "Không tải được yêu cầu tham gia.")}</p>`;
  }
}

async function reviewClubJoinRequest(teamId, requestId, status, button) {
  button.disabled = true;
  const row = button.closest("[data-request-row]");
  row?.querySelectorAll("button").forEach((item) => { item.disabled = true; });
  try {
    const response = await api.patch(`/api/teams/${teamId}/join-requests/${requestId}`, { status });
    const result = clubUnwrap(response);
    await Promise.all([loadMyClubs(), loadClubs()]);
    await openClubDetails(teamId);
    setClubDetailNotice(result?.message || (status === "ACCEPTED" ? "Đã duyệt thành viên." : "Đã từ chối yêu cầu."));
  } catch (error) {
    if (row?.isConnected) {
      row.querySelectorAll("button").forEach((item) => { item.disabled = false; });
      setClubDetailNotice(error.message || "Không thể xử lý yêu cầu tham gia.", true);
    }
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

function requestDeleteClub(teamId) {
  const team = clubsMine.get(Number(teamId));
  if (!team || !(team.is_captain || String(team.role || "").toLowerCase() === "captain")) return;
  pendingClubDeleteId = Number(teamId);
  document.getElementById("club-delete-name").textContent = team.name || `#${teamId}`;
  const message = document.getElementById("club-delete-message");
  message.hidden = true;
  message.textContent = "";
  const confirm = document.getElementById("club-delete-confirm");
  confirm.disabled = false;
  confirm.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa câu lạc bộ';
  setClubModal(clubEls.detailModal, false);
  setClubModal(clubEls.deleteModal, true);
  confirm.focus();
}

async function deleteClub() {
  const teamId = pendingClubDeleteId;
  const confirm = document.getElementById("club-delete-confirm");
  const message = document.getElementById("club-delete-message");
  if (!teamId || confirm.disabled) return;
  confirm.disabled = true;
  confirm.textContent = "Đang xóa...";
  try {
    await api.delete(`/api/teams/${teamId}`);
    clubsMine.delete(teamId);
    clubsPending.delete(teamId);
    setClubModal(clubEls.deleteModal, false);
    pendingClubDeleteId = null;
    clubsPage = 1;
    await Promise.all([loadMyClubs(), loadClubs()]);
    setClubFeedback("Đã xóa câu lạc bộ.", "success");
  } catch (error) {
    message.textContent = error.message || "Không thể xóa câu lạc bộ.";
    message.hidden = false;
    confirm.disabled = false;
    confirm.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa câu lạc bộ';
  }
}

function openClubMemberAction(type, teamId, userId, memberName) {
  pendingClubMemberAction = { type, teamId, userId, memberName };
  const isTransfer = type === "transfer";
  const icon = document.getElementById("club-member-action-icon");
  const confirm = document.getElementById("club-member-action-confirm");
  const message = document.getElementById("club-member-action-message");
  icon.className = `club-member-action-icon ${isTransfer ? "is-transfer" : "is-remove"}`;
  icon.innerHTML = `<i class="fa-solid ${isTransfer ? "fa-crown" : "fa-user-minus"}" aria-hidden="true"></i>`;
  document.getElementById("club-member-action-eyebrow").textContent = isTransfer ? "CHUYỂN QUYỀN ĐỘI TRƯỞNG" : "XÓA THÀNH VIÊN";
  document.getElementById("club-member-action-title").textContent = isTransfer ? "Chuyển quyền đội trưởng?" : "Xóa thành viên khỏi CLB?";
  document.getElementById("club-member-action-description").innerHTML = isTransfer
    ? `Bạn sẽ chuyển quyền đội trưởng cho <strong>${clubEscape(memberName)}</strong>. Tài khoản của bạn sẽ trở thành thành viên thường.`
    : `Bạn có chắc muốn xóa <strong>${clubEscape(memberName)}</strong> khỏi câu lạc bộ? Người này có thể gửi yêu cầu tham gia lại.`;
  confirm.className = `club-btn ${isTransfer ? "club-btn-primary" : "club-btn-danger"}`;
  confirm.innerHTML = isTransfer
    ? '<i class="fa-solid fa-crown" aria-hidden="true"></i> Chuyển đội trưởng'
    : '<i class="fa-solid fa-user-minus" aria-hidden="true"></i> Xóa thành viên';
  confirm.disabled = false;
  message.hidden = true;
  message.textContent = "";
  setClubModal(document.getElementById("club-member-action-modal"), true);
  confirm.focus();
}

async function confirmClubMemberAction() {
  const action = pendingClubMemberAction;
  const confirm = document.getElementById("club-member-action-confirm");
  const message = document.getElementById("club-member-action-message");
  if (!action || confirm.disabled) return;
  confirm.disabled = true;
  confirm.textContent = action.type === "transfer" ? "Đang chuyển quyền..." : "Đang xóa...";
  try {
    if (action.type === "transfer") {
      await api.patch(`/api/teams/${action.teamId}/transfer-captain`, { new_captain_id: action.userId });
    } else {
      await api.delete(`/api/teams/${action.teamId}/members/${action.userId}`);
    }
    setClubModal(document.getElementById("club-member-action-modal"), false);
    pendingClubMemberAction = null;
    await Promise.all([loadMyClubs(), loadClubs()]);
    await openClubDetails(action.teamId);
    setClubDetailNotice(action.type === "transfer" ? `Đã chuyển quyền đội trưởng cho ${action.memberName}.` : `Đã xóa ${action.memberName} khỏi câu lạc bộ.`);
  } catch (error) {
    message.textContent = error.message || "Không thể hoàn tất thao tác.";
    message.hidden = false;
    confirm.disabled = false;
    confirm.innerHTML = action.type === "transfer"
      ? '<i class="fa-solid fa-crown" aria-hidden="true"></i> Chuyển đội trưởng'
      : '<i class="fa-solid fa-user-minus" aria-hidden="true"></i> Xóa thành viên';
  }
}

function bindClubEvents() {
  setupClubFilterDropdown("club-access-filter", "club-access-menu", "club-access-label", "club-access-trigger");
  setupClubFilterDropdown("club-create-game", "club-create-game-menu", "club-create-game-label", "club-create-game-trigger");
  setupClubFilterDropdown("club-join-mode", "club-join-mode-menu", "club-join-mode-label", "club-join-mode-trigger");

  // Điều khiển tăng/giảm & chọn nhanh Sức chứa câu lạc bộ
  const capInput = document.getElementById("club-max-members");
  const clampCap = (n) => Math.min(100, Math.max(2, Number(n) || 2));
  document.querySelectorAll("[data-capacity-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!capInput) return;
      const step = Number(btn.dataset.capacityStep) || 0;
      const next = clampCap((Number(capInput.value) || 100) + step);
      capInput.value = String(next);
      syncClubCapacityChips(next);
    });
  });
  document.querySelectorAll("[data-capacity-preset]").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (!capInput) return;
      const next = clampCap(chip.dataset.capacityPreset);
      capInput.value = String(next);
      syncClubCapacityChips(next);
    });
  });
  capInput?.addEventListener("input", () => {
    syncClubCapacityChips(capInput.value);
  });
  capInput?.addEventListener("blur", () => {
    const clamped = clampCap(capInput.value);
    capInput.value = String(clamped);
    syncClubCapacityChips(clamped);
  });

  // Điều khiển chọn ảnh / xoá ảnh custom cho Logo & Ảnh nền
  document.querySelectorAll("[data-trigger-file]").forEach((zone) => {
    zone.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("[data-clear-file]");
      if (removeBtn) {
        event.stopPropagation();
        const fileInput = document.getElementById(removeBtn.dataset.clearFile);
        if (fileInput) {
          fileInput.value = "";
          showClubImagePreview(fileInput, zone, "");
        }
        return;
      }
      const fileInput = document.getElementById(zone.dataset.triggerFile);
      fileInput?.click();
    });
    zone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const fileInput = document.getElementById(zone.dataset.triggerFile);
        fileInput?.click();
      }
    });
  });
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
  document.querySelectorAll("[data-cancel-delete-club]").forEach((button) => button.addEventListener("click", () => {
    pendingClubDeleteId = null;
    setClubModal(clubEls.deleteModal, false);
  }));
  document.getElementById("club-delete-confirm").addEventListener("click", deleteClub);
  document.querySelectorAll("[data-cancel-member-action]").forEach((button) => button.addEventListener("click", () => {
    pendingClubMemberAction = null;
    setClubModal(document.getElementById("club-member-action-modal"), false);
  }));
  document.getElementById("club-member-action-confirm").addEventListener("click", confirmClubMemberAction);
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
    const deleteButton = event.target.closest("[data-delete-team]");
    const reviewButton = event.target.closest("[data-review-request]");
    if (closeButton) setClubModal(clubEls.detailModal, false);
    if (joinButton) joinClub(Number(joinButton.dataset.detailJoin), joinButton);
    if (cancelEditButton) clubEls.detailContent.querySelector("[data-edit-form]").hidden = true;
    if (editButton) clubEls.detailContent.querySelector("[data-edit-form]").hidden = false;
    if (cancelRequestButton) cancelClubRequest(Number(cancelRequestButton.dataset.cancelRequest), cancelRequestButton);
    if (leaveButton) leaveClub(Number(leaveButton.dataset.leaveTeam), leaveButton);
    if (transferButton) openClubMemberAction("transfer", Number(transferButton.dataset.transferCaptain), Number(transferButton.dataset.memberId), transferButton.dataset.memberName || "thành viên này");
    if (removeButton) openClubMemberAction("remove", Number(removeButton.dataset.removeMember), Number(removeButton.dataset.memberId), removeButton.dataset.memberName || "thành viên này");
    if (deleteButton) requestDeleteClub(Number(deleteButton.dataset.deleteTeam));
    if (reviewButton) reviewClubJoinRequest(Number(reviewButton.dataset.teamId), Number(reviewButton.dataset.reviewRequest), reviewButton.dataset.reviewStatus, reviewButton);
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
    const clubNameVal = document.getElementById("club-name").value.trim();
    if (!clubNameVal || clubNameVal.length < 2) {
      clubEls.createMessage.textContent = "Tên câu lạc bộ phải có từ 2 đến 100 ký tự.";
      clubEls.createMessage.classList.remove("success");
      clubEls.createMessage.hidden = false;
      document.getElementById("club-name")?.focus();
      return;
    }
    if (!clubEls.createGame.value) {
      clubEls.createMessage.textContent = "Vui lòng chọn tựa game cho câu lạc bộ.";
      clubEls.createMessage.classList.remove("success");
      clubEls.createMessage.hidden = false;
      document.getElementById("club-create-game-trigger")?.focus();
      return;
    }
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
