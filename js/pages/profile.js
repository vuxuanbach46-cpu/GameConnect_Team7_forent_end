/*
 * GameConnect - Gamer profile
 * Frontend HTML/CSS/JS thuần. Các endpoint dưới đây gom tại một chỗ để khớp
 * với router FastAPI của nhóm. Backend cần trả game catalog theo cấu trúc
 * games[].ranks[] và games[].roles[] như module team-posts đang sử dụng.
 */

const PROFILE_API = {
  PROFILE_ME: "/game-profile/me",
  PROFILE_BY_USERNAME: (username) => `/game-profile/${encodeURIComponent(username)}`,
  PROFILE_UPDATE: "/game-profile/me",
  AVATAR_UPLOAD: "/game-profile/me/avatar",
  GAME_CATALOG: "/games",
  MY_GAMES: "/user-games/me",
  CREATE_USER_GAME: "/user-games",
  USER_GAME_DETAIL: (id) => `/user-games/${encodeURIComponent(id)}`,
  MY_TEAMS: "/teams/me",
  FRIEND_REQUESTS: "/friends/requests",
};

const GAME_IMAGE_FALLBACKS = [
  { match: ["valorant"], src: "../assets/images/games/valorant.png" },
  { match: ["liên minh", "league of legends", "lol"], src: "../assets/images/games/lol.png" },
  { match: ["đấu trường chân lý", "teamfight tactics", "tft"], src: "../assets/images/games/tft.png" },
  { match: ["cs2", "counter-strike", "counter strike"], src: "../assets/images/games/cs2.png" },
  { match: ["liên quân", "arena of valor", "aov"], src: "../assets/images/games/aov.png" },
];

const profileEls = {
  alert: document.getElementById("profile-alert"),
  avatar: document.getElementById("profile-avatar"),
  displayName: document.getElementById("profile-display-name"),
  username: document.getElementById("profile-username"),
  region: document.getElementById("profile-region"),
  playTime: document.getElementById("profile-play-time"),
  mic: document.getElementById("profile-mic"),
  bio: document.getElementById("profile-bio"),
  status: document.getElementById("profile-status"),
  heroAction: document.getElementById("profile-hero-action"),
  gamesCount: document.getElementById("games-count"),
  gamesList: document.getElementById("profile-games-list"),
  teamsList: document.getElementById("profile-teams-list"),
  editBtn: document.getElementById("btn-edit-profile"),
  editModal: document.getElementById("edit-profile-modal"),
  editForm: document.getElementById("edit-profile-form"),
  editError: document.getElementById("edit-profile-error"),
  avatarFile: document.getElementById("avatar-file"),
  avatarPreview: document.getElementById("avatar-preview"),
  addGameForm: document.getElementById("add-game-form"),
  newGame: document.getElementById("new-game-id"),
  newRank: document.getElementById("new-rank-id"),
  newRole: document.getElementById("new-role-id"),
  gamePreview: document.getElementById("selected-game-preview"),
  addGameError: document.getElementById("add-game-error"),
};

let currentProfile = null;
let gamesCatalog = [];
let myGames = [];
let myTeams = [];
let isOwnProfile = !new URLSearchParams(window.location.search).has("username");
let selectedAvatarFile = null;
let previewObjectUrl = null;
let catalogReady = false;

function unwrapData(response) {
  if (response && typeof response === "object" && response.data !== undefined) return response.data;
  return response;
}

function asArray(value, keys = ["items", "results", "games", "teams", "data"]) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of keys) if (Array.isArray(value[key])) return value[key];
  return [];
}

function toNumberOrString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function decodeTokenPayload() {
  const token = localStorage.getItem("access_token");
  if (!token || token.split(".").length < 2) return {};
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(base64))));
  } catch (_) {
    return {};
  }
}

function currentUsernameFromToken() {
  const payload = decodeTokenPayload();
  return payload.username || payload.email || payload.sub || localStorage.getItem("username") || "";
}

function showProfileAlert(message, type = "info") {
  profileEls.alert.textContent = message;
  profileEls.alert.className = `profile-alert${type === "error" ? " error" : ""}`;
  profileEls.alert.hidden = false;
}

function hideProfileAlert() {
  profileEls.alert.hidden = true;
  profileEls.alert.textContent = "";
}

function setInlineError(element, message = "") {
  element.textContent = message;
  element.hidden = !message;
}

function initials(value) {
  const words = String(value || "GC").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] || "GC").slice(0, 2)).toUpperCase();
}

function resolveImageUrl(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("/")) {
    const base = (CONFIG.API_BASE_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "");
    return `${base}${raw}`;
  }
  if (raw.startsWith("../") || raw.startsWith("./")) return raw;
  if (raw.startsWith("assets/") || raw.startsWith("images/")) return `../${raw}`;
  const apiRoot = (CONFIG.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/api\/?$/, "").replace(/\/$/, "");
  return `${apiRoot}/${raw.replace(/^\//, "")}`;
}

function getGameImage(game) {
  const fromApi = game?.image_url || game?.image || game?.cover_image || game?.icon;
  if (fromApi) return resolveImageUrl(fromApi);
  const name = String(game?.name || "").toLowerCase();
  const matched = GAME_IMAGE_FALLBACKS.find((entry) => entry.match.some((term) => name.includes(term)));
  return matched ? matched.src : "";
}

function renderAvatar(container, avatarUrl, name, className = "") {
  const url = resolveImageUrl(avatarUrl);
  if (url) {
    container.className = `profile-avatar ${className}`.trim();
    container.innerHTML = `<img src="${escapeHtml(url)}" alt="Ảnh đại diện ${escapeHtml(name || "người chơi")}">`;
  } else {
    container.className = `profile-avatar profile-avatar-placeholder ${className}`.trim();
    container.textContent = initials(name);
  }
}

function findGame(gameId) {
  return gamesCatalog.find((game) => String(game.id) === String(gameId));
}

function findRank(game, rankId) {
  return game?.ranks?.find((rank) => String(rank.id) === String(rankId));
}

function findRole(game, roleId) {
  return game?.roles?.find((role) => String(role.id) === String(roleId));
}

function populateDependentSelect(select, entries, labelKey, placeholder, selectedValue = "") {
  const opts = [...(entries || [])];
  if (labelKey === "rank_name") opts.sort((a, b) => Number(a.rank_order || 0) - Number(b.rank_order || 0));
  select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + opts.map((entry) =>
    `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry[labelKey] || entry.name || "")}</option>`
  ).join("");
  select.disabled = !opts.length;
  if (selectedValue !== "" && selectedValue !== null && selectedValue !== undefined) select.value = String(selectedValue);
}

function updateNewGameOptions() {
  const game = findGame(profileEls.newGame.value);
  populateDependentSelect(profileEls.newRank, game?.ranks || [], "rank_name", game ? "Chọn rank" : "Chọn game trước");
  populateDependentSelect(profileEls.newRole, game?.roles || [], "role_name", game ? "Chọn vai trò" : "Chọn game trước");
  if (!game) {
    profileEls.gamePreview.innerHTML = `<div class="game-preview-placeholder"><i class="fa-solid fa-gamepad"></i></div><div><strong>Chưa chọn game</strong><small>Ảnh game xem trước</small></div>`;
    return;
  }
  const image = getGameImage(game);
  profileEls.gamePreview.innerHTML = `${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(game.name)}">` : `<div class="game-preview-placeholder"><i class="fa-solid fa-gamepad"></i></div>`}<div><strong>${escapeHtml(game.name)}</strong><small>${game.ranks?.length || 0} rank · ${game.roles?.length || 0} vai trò</small></div>`;
}

function renderProfile(profile) {
  const user = profile.user || {};
  const displayName = profile.display_name || user.display_name || user.full_name || user.username || profile.username || "Game thủ";
  const username = profile.username || user.username || currentUsernameFromToken() || "player";
  const region = profile.region || "Chưa cập nhật khu vực";
  const playTime = profile.play_time || "Chưa cập nhật giờ chơi";
  const avatar = profile.avatar_url || profile.avatar || user.avatar_url || user.avatar || "";

  profileEls.displayName.textContent = displayName;
  profileEls.username.textContent = username.startsWith("@") ? username : `@${username}`;
  profileEls.region.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(region)}`;
  profileEls.playTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${escapeHtml(playTime)}`;
  profileEls.mic.innerHTML = `<i class="fa-solid fa-microphone"></i> ${profile.has_mic ? "Có microphone" : "Chưa bật microphone"}`;
  profileEls.bio.textContent = profile.bio || "Người chơi chưa cập nhật phần giới thiệu.";
  renderAvatar(profileEls.avatar, avatar, displayName);

  const isPublic = profile.is_public !== false;
  profileEls.status.innerHTML = `<span></span>${isPublic ? "PUBLIC PLAYER" : "PRIVATE PLAYER"}`;
  profileEls.status.className = `status-chip${isPublic ? "" : " status-private"}`;

  profileEls.editBtn.hidden = !isOwnProfile;
  renderHeroAction(profile);
  document.title = `${displayName} | GameConnect`;
}

function renderHeroAction(profile) {
  if (isOwnProfile) {
    profileEls.heroAction.innerHTML = `<button class="gc-btn gc-btn-outline" type="button" id="btn-edit-profile-hero"><i class="fa-solid fa-pen"></i> Chỉnh sửa</button>`;
    document.getElementById("btn-edit-profile-hero").addEventListener("click", openEditModal);
    return;
  }
  const status = String(profile.friend_status || profile.relationship_status || "NONE").toUpperCase();
  const targetId = profile.user_id || profile.id || profile.user?.id;
  let label = "Kết bạn";
  let disabled = false;
  if (["FRIEND", "FRIENDS", "ACCEPTED", "CONNECTED"].includes(status)) { label = "Đã là bạn bè"; disabled = true; }
  else if (["PENDING", "SENT", "REQUESTED"].includes(status)) { label = "Đã gửi lời mời"; disabled = true; }
  else if (["RECEIVED", "INCOMING"].includes(status)) { label = "Có lời mời kết bạn"; disabled = true; }
  profileEls.heroAction.innerHTML = `<button class="gc-btn gc-btn-primary" id="btn-profile-add-friend" type="button" ${disabled || !targetId ? "disabled" : ""}><i class="fa-solid fa-user-plus"></i> ${label}</button><a class="gc-btn gc-btn-quiet" href="friends.html"><i class="fa-solid fa-user-group"></i> Bạn bè</a>`;
  const addBtn = document.getElementById("btn-profile-add-friend");
  if (addBtn && !disabled && targetId) addBtn.addEventListener("click", () => sendFriendRequest(targetId, addBtn));
}

async function sendFriendRequest(targetId, button) {
  button.disabled = true;
  const oldHtml = button.innerHTML;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...`;
  try {
    await api.post(PROFILE_API.FRIEND_REQUESTS, { receiver_id: targetId });
    button.innerHTML = `<i class="fa-solid fa-check"></i> Đã gửi lời mời`;
    currentProfile.friend_status = "PENDING";
    showToast("Đã gửi lời mời kết bạn.", "success");
  } catch (error) {
    button.disabled = false;
    button.innerHTML = oldHtml;
    showToast(`Không thể gửi lời mời: ${error.message}`, "error");
  }
}

function normalizeUserGame(item) {
  const nestedGame = item.game || {};
  const gameId = item.game_id ?? nestedGame.id;
  const game = findGame(gameId) || nestedGame;
  const rankId = item.rank_id ?? item.rank?.id ?? "";
  const roleId = item.role_id ?? item.role?.id ?? "";
  return { ...item, game_id: gameId, rank_id: rankId, role_id: roleId, game };
}

function renderGames() {
  profileEls.gamesCount.textContent = `${myGames.length}/5`;
  if (!myGames.length) {
    profileEls.gamesList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-gamepad"></i><strong>Chưa có game yêu thích</strong><span>Thêm game bạn thường chơi để hiển thị rank và vai trò trên hồ sơ.</span></div>`;
    return;
  }

  profileEls.gamesList.innerHTML = myGames.map((rawItem) => {
    const item = normalizeUserGame(rawItem);
    const game = item.game || {};
    const gameName = game.name || `Game #${item.game_id}`;
    const rank = findRank(game, item.rank_id);
    const role = findRole(game, item.role_id);
    const rankName = rank?.rank_name || item.rank?.rank_name || item.rank_name || "Chưa chọn rank";
    const roleName = role?.role_name || item.role?.role_name || item.role_name || "Chưa chọn vai trò";
    const image = getGameImage(game);
    const itemId = item.id;
    return `
      <article class="game-card" data-user-game-id="${escapeHtml(itemId)}">
        ${image ? `<img class="game-card-image" src="${escapeHtml(image)}" alt="${escapeHtml(gameName)}">` : `<div class="game-card-image game-card-image-fallback"><i class="fa-solid fa-gamepad"></i></div>`}
        <div class="game-card-main">
          <h3 class="game-card-name">${escapeHtml(gameName)}</h3>
          <div class="game-tags"><span class="game-tag"><i class="fa-solid fa-ranking-star"></i>${escapeHtml(rankName)}</span><span class="game-tag"><i class="fa-solid fa-crosshairs"></i>${escapeHtml(roleName)}</span></div>
          ${item.in_game_id ? `<div class="game-card-id">ID game: ${escapeHtml(item.in_game_id)}</div>` : ""}
        </div>
        ${isOwnProfile ? `<div class="game-card-actions"><button class="icon-action" type="button" data-action="edit-game" title="Sửa rank/vai trò"><i class="fa-solid fa-pen"></i></button><button class="icon-action danger" type="button" data-action="delete-game" title="Xoá game"><i class="fa-solid fa-trash"></i></button></div>` : ""}
        ${isOwnProfile ? `<div class="game-edit-wrap" hidden>
          <select data-field="rank_id" aria-label="Rank">${buildSelectOptions(game.ranks || [], "rank_name", "Chọn rank", item.rank_id)}</select>
          <select data-field="role_id" aria-label="Vai trò">${buildSelectOptions(game.roles || [], "role_name", "Chọn vai trò", item.role_id)}</select>
          <button class="gc-btn gc-btn-primary" type="button" data-action="save-game-edit"><i class="fa-solid fa-check"></i> Lưu</button>
        </div>` : ""}
      </article>`;
  }).join("");
}

function buildSelectOptions(entries, key, placeholder, selected) {
  const sorted = [...entries];
  if (key === "rank_name") sorted.sort((a, b) => Number(a.rank_order || 0) - Number(b.rank_order || 0));
  return `<option value="">${escapeHtml(placeholder)}</option>` + sorted.map((entry) =>
    `<option value="${escapeHtml(entry.id)}" ${String(entry.id) === String(selected) ? "selected" : ""}>${escapeHtml(entry[key] || entry.name || "")}</option>`
  ).join("");
}

function renderTeams() {
  if (!myTeams.length) {
    profileEls.teamsList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-people-group"></i><strong>Chưa tham gia đội nào</strong><span>Tìm bài đăng tuyển đồng đội để tham gia một squad phù hợp.</span><a class="text-link" href="team-posts.html">Khám phá đội tuyển <i class="fa-solid fa-arrow-right"></i></a></div>`;
    return;
  }
  profileEls.teamsList.innerHTML = myTeams.map((team) => {
    const name = team.name || team.team_name || "Đội GameConnect";
    const logo = resolveImageUrl(team.avatar || team.logo || team.image || "");
    const meta = [team.game_name || team.game?.name, team.member_count ? `${team.member_count} thành viên` : ""].filter(Boolean).join(" · ");
    return `<article class="team-card">
      ${logo ? `<img class="team-avatar" src="${escapeHtml(logo)}" alt="${escapeHtml(name)}">` : `<div class="team-avatar team-avatar-fallback">${escapeHtml(initials(name))}</div>`}
      <div class="team-info"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(meta || "Đội đang hoạt động")}</span>${team.member_role || team.role ? `<span class="team-role">${escapeHtml(team.member_role || team.role)}</span>` : ""}</div>
      ${team.id ? `<a class="icon-action" href="team-detail.html?id=${encodeURIComponent(team.id)}" aria-label="Xem đội"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ""}
    </article>`;
  }).join("");
}

async function loadProfile() {
  const username = new URLSearchParams(window.location.search).get("username");
  const tokenUsername = currentUsernameFromToken();
  isOwnProfile = !username || (tokenUsername && username.toLowerCase() === String(tokenUsername).toLowerCase());
  profileEls.editBtn.hidden = !isOwnProfile;

  const endpoint = isOwnProfile ? PROFILE_API.PROFILE_ME : PROFILE_API.PROFILE_BY_USERNAME(username);
  const response = await api.get(endpoint);
  currentProfile = unwrapData(response);
  if (currentProfile?.profile) currentProfile = currentProfile.profile;
  if (!currentProfile || typeof currentProfile !== "object") throw new Error("Dữ liệu hồ sơ không hợp lệ.");
  renderProfile(currentProfile);
}

async function loadCatalog() {
  const response = await api.get(PROFILE_API.GAME_CATALOG);
  gamesCatalog = asArray(unwrapData(response), ["items", "games", "results", "data"]);
  catalogReady = true;
  profileEls.newGame.innerHTML = `<option value="">-- Chọn game --</option>` + gamesCatalog.map((game) =>
    `<option value="${escapeHtml(game.id)}">${escapeHtml(game.name)}</option>`
  ).join("");
  updateNewGameOptions();
}

async function loadMyGames() {
  if (!isOwnProfile) {
    // Hồ sơ công khai có thể được API profile trả kèm danh sách user_games.
    myGames = asArray(currentProfile.user_games || currentProfile.games, ["items", "games", "user_games"]);
  } else {
    try {
      const response = await api.get(PROFILE_API.MY_GAMES);
      myGames = asArray(unwrapData(response), ["items", "user_games", "games", "results"]);
    } catch (error) {
      if (Array.isArray(currentProfile.user_games)) myGames = currentProfile.user_games;
      else throw error;
    }
  }
  renderGames();
  document.getElementById("btn-add-game-toggle").hidden = !isOwnProfile;
}

async function loadMyTeams() {
  if (!isOwnProfile) {
    myTeams = asArray(currentProfile.teams || currentProfile.joined_teams, ["items", "teams"]);
  } else {
    const response = await api.get(PROFILE_API.MY_TEAMS);
    myTeams = asArray(unwrapData(response), ["items", "teams", "results"]);
  }
  renderTeams();
}

function openEditModal() {
  if (!currentProfile || !isOwnProfile) return;
  const displayName = currentProfile.display_name || currentProfile.user?.display_name || currentProfile.user?.username || "";
  document.getElementById("edit-display-name").value = displayName;
  document.getElementById("edit-bio").value = currentProfile.bio || "";
  document.getElementById("edit-region").value = currentProfile.region || "";
  document.getElementById("edit-play-time").value = currentProfile.play_time || "";
  document.getElementById("edit-has-mic").checked = Boolean(currentProfile.has_mic);
  document.getElementById("edit-is-public").checked = currentProfile.is_public !== false;
  selectedAvatarFile = null;
  profileEls.avatarFile.value = "";
  const avatar = currentProfile.avatar_url || currentProfile.avatar || currentProfile.user?.avatar_url || "";
  renderAvatarPreview(avatar, displayName);
  setInlineError(profileEls.editError);
  profileEls.editModal.hidden = false;
  document.body.classList.add("modal-open");
}

function renderAvatarPreview(url, name) {
  const resolved = resolveImageUrl(url);
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
  if (resolved) {
    profileEls.avatarPreview.className = "avatar-preview";
    profileEls.avatarPreview.innerHTML = `<img src="${escapeHtml(resolved)}" alt="Xem trước avatar">`;
  } else {
    profileEls.avatarPreview.className = "avatar-preview profile-avatar-placeholder";
    profileEls.avatarPreview.textContent = initials(name);
  }
}

function closeEditModal() {
  profileEls.editModal.hidden = true;
  document.body.classList.remove("modal-open");
  selectedAvatarFile = null;
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

async function saveProfile(event) {
  event.preventDefault();
  setInlineError(profileEls.editError);
  const displayName = document.getElementById("edit-display-name").value.trim();
  if (!displayName) return setInlineError(profileEls.editError, "Vui lòng nhập tên hiển thị.");

  const payload = {
    display_name: displayName,
    bio: document.getElementById("edit-bio").value.trim(),
    region: document.getElementById("edit-region").value || null,
    play_time: document.getElementById("edit-play-time").value.trim() || null,
    has_mic: document.getElementById("edit-has-mic").checked,
    is_public: document.getElementById("edit-is-public").checked,
  };
  const saveButton = document.getElementById("btn-save-profile");
  saveButton.disabled = true;
  saveButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;

  try {
    if (selectedAvatarFile) {
      const formData = new FormData();
      formData.append("file", selectedAvatarFile);
      const uploadResponse = await http.post(PROFILE_API.AVATAR_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadData = unwrapData(uploadResponse.data);
      const avatarUrl = uploadData?.avatar_url || uploadData?.avatar || uploadData?.url || uploadData?.path;
      if (!avatarUrl) throw new Error("API upload không trả về đường dẫn avatar (avatar_url/avatar/url).");
      payload.avatar = avatarUrl;
    }
    const updated = unwrapData(await api.put(PROFILE_API.PROFILE_UPDATE, payload));
    currentProfile = { ...currentProfile, ...payload, ...(updated?.profile || updated || {}) };
    renderProfile(currentProfile);
    closeEditModal();
    showToast("Đã cập nhật hồ sơ cá nhân.", "success");
  } catch (error) {
    setInlineError(profileEls.editError, error.message || "Không thể lưu hồ sơ.");
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = `<i class="fa-solid fa-check"></i> Lưu thay đổi`;
  }
}

function handleAvatarFile(file) {
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    setInlineError(profileEls.editError, "Ảnh phải có định dạng PNG, JPG hoặc WEBP.");
    profileEls.avatarFile.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setInlineError(profileEls.editError, "Ảnh đại diện không được vượt quá 5 MB.");
    profileEls.avatarFile.value = "";
    return;
  }
  setInlineError(profileEls.editError);
  selectedAvatarFile = file;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  profileEls.avatarPreview.className = "avatar-preview";
  profileEls.avatarPreview.innerHTML = `<img src="${previewObjectUrl}" alt="Xem trước avatar mới">`;
}

function clearAvatarSelection() {
  selectedAvatarFile = null;
  profileEls.avatarFile.value = "";
  renderAvatarPreview(currentProfile?.avatar_url || currentProfile?.avatar || "", currentProfile?.display_name || "GC");
  setInlineError(profileEls.editError);
}

function toggleAddGame(force) {
  const shouldShow = typeof force === "boolean" ? force : profileEls.addGameForm.hidden;
  profileEls.addGameForm.hidden = !shouldShow;
  if (shouldShow) {
    setInlineError(profileEls.addGameError);
    profileEls.newGame.focus();
  }
}

async function addGame(event) {
  event.preventDefault();
  setInlineError(profileEls.addGameError);
  if (!catalogReady) return setInlineError(profileEls.addGameError, "Danh mục game chưa tải xong.");
  if (myGames.length >= 5) return setInlineError(profileEls.addGameError, "Bạn chỉ có thể thêm tối đa 5 game yêu thích.");

  const gameId = profileEls.newGame.value;
  const game = findGame(gameId);
  const rankId = profileEls.newRank.value;
  const roleId = profileEls.newRole.value;
  if (!game) return setInlineError(profileEls.addGameError, "Vui lòng chọn game.");
  if (myGames.some((item) => String(item.game_id ?? item.game?.id) === String(gameId))) return setInlineError(profileEls.addGameError, "Game này đã có trong hồ sơ.");
  if (rankId && !findRank(game, rankId)) return setInlineError(profileEls.addGameError, "Rank không thuộc game đã chọn.");
  if (roleId && !findRole(game, roleId)) return setInlineError(profileEls.addGameError, "Vai trò không thuộc game đã chọn.");

  const payload = {
    game_id: Number(gameId),
    rank_id: rankId ? Number(rankId) : null,
    role_id: roleId ? Number(roleId) : null,
    in_game_id: document.getElementById("new-in-game-id").value.trim() || null,
  };
  const button = document.getElementById("btn-save-new-game");
  button.disabled = true;
  button.textContent = "Đang lưu...";
  try {
    await api.post(PROFILE_API.CREATE_USER_GAME, payload);
    await loadMyGames();
    profileEls.addGameForm.reset();
    updateNewGameOptions();
    toggleAddGame(false);
    showToast("Đã thêm game vào hồ sơ.", "success");
  } catch (error) {
    setInlineError(profileEls.addGameError, error.message || "Không thể thêm game.");
  } finally {
    button.disabled = false;
    button.textContent = "Lưu game";
  }
}

async function handleGameListAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".game-card");
  if (!card) return;
  const id = card.dataset.userGameId;
  const action = button.dataset.action;
  const row = myGames.find((item) => String(item.id) === String(id));
  if (!row) return;

  if (action === "edit-game") {
    const editWrap = card.querySelector(".game-edit-wrap");
    editWrap.hidden = !editWrap.hidden;
    return;
  }
  if (action === "delete-game") {
    if (!window.confirm("Bạn có chắc muốn xoá game này khỏi hồ sơ?")) return;
    button.disabled = true;
    try {
      await api.delete(PROFILE_API.USER_GAME_DETAIL(id));
      myGames = myGames.filter((item) => String(item.id) !== String(id));
      renderGames();
      showToast("Đã xoá game khỏi hồ sơ.", "success");
    } catch (error) {
      button.disabled = false;
      showToast(`Không thể xoá game: ${error.message}`, "error");
    }
    return;
  }
  if (action === "save-game-edit") {
    const rankId = card.querySelector('[data-field="rank_id"]').value;
    const roleId = card.querySelector('[data-field="role_id"]').value;
    const game = findGame(row.game_id) || row.game;
    if (rankId && !findRank(game, rankId)) return showToast("Rank không thuộc game này.", "error");
    if (roleId && !findRole(game, roleId)) return showToast("Vai trò không thuộc game này.", "error");
    button.disabled = true;
    try {
      await api.put(PROFILE_API.USER_GAME_DETAIL(id), {
        rank_id: rankId ? Number(rankId) : null,
        role_id: roleId ? Number(roleId) : null,
        in_game_id: row.in_game_id || null,
      });
      await loadMyGames();
      showToast("Đã cập nhật rank và vai trò.", "success");
    } catch (error) {
      button.disabled = false;
      showToast(`Không thể cập nhật game: ${error.message}`, "error");
    }
  }
}

function bindEvents() {
  profileEls.editBtn.addEventListener("click", openEditModal);
  document.getElementById("btn-close-edit").addEventListener("click", closeEditModal);
  document.getElementById("btn-cancel-edit").addEventListener("click", closeEditModal);
  document.querySelectorAll("[data-close-edit]").forEach((el) => el.addEventListener("click", closeEditModal));
  profileEls.editForm.addEventListener("submit", saveProfile);
  profileEls.avatarFile.addEventListener("change", (event) => handleAvatarFile(event.target.files?.[0]));
  document.getElementById("btn-remove-avatar-preview").addEventListener("click", clearAvatarSelection);

  document.getElementById("btn-add-game-toggle").addEventListener("click", () => toggleAddGame());
  document.getElementById("btn-cancel-add-game").addEventListener("click", () => toggleAddGame(false));
  profileEls.newGame.addEventListener("change", updateNewGameOptions);
  profileEls.addGameForm.addEventListener("submit", addGame);
  profileEls.gamesList.addEventListener("click", handleGameListAction);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !profileEls.editModal.hidden) closeEditModal();
  });
}

async function initProfilePage() {
  if (!localStorage.getItem("access_token")) {
    const next = encodeURIComponent("profile.html" + window.location.search);
    window.location.href = `login.html?next=${next}`;
    return;
  }
  bindEvents();

  try {
    const results = await Promise.allSettled([loadProfile(), loadCatalog()]);
    const profileResult = results[0];
    const catalogResult = results[1];
    if (profileResult.status === "rejected") {
      showProfileAlert(`Không tải được hồ sơ: ${profileResult.reason?.message || "Lỗi không xác định"}. Kiểm tra endpoint PROFILE_ME/PROFILE_BY_USERNAME trong js/pages/profile.js.`, "error");
      profileEls.gamesList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>Không thể tải dữ liệu hồ sơ</strong><span>Hãy kiểm tra backend đã chạy và API hồ sơ đã được khai báo.</span></div>`;
      profileEls.teamsList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-info"></i><strong>Chưa thể tải đội</strong><span>Thông tin đội sẽ xuất hiện khi API hồ sơ hoạt động.</span></div>`;
      return;
    }
    if (catalogResult.status === "rejected") {
      showProfileAlert(`Không tải được danh mục game: ${catalogResult.reason?.message || "Lỗi không xác định"}.`, "error");
    }
    const jobs = await Promise.allSettled([loadMyGames(), loadMyTeams()]);
    if (jobs[0].status === "rejected") {
      profileEls.gamesList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-gamepad"></i><strong>Chưa tải được game yêu thích</strong><span>${escapeHtml(jobs[0].reason?.message || "Kiểm tra API /user-games/me.")}</span></div>`;
    }
    if (jobs[1].status === "rejected") {
      profileEls.teamsList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-people-group"></i><strong>Chưa tải được đội tham gia</strong><span>${escapeHtml(jobs[1].reason?.message || "Kiểm tra API /teams/me.")}</span></div>`;
    }
  } catch (error) {
    showProfileAlert(error.message || "Có lỗi khi khởi tạo trang hồ sơ.", "error");
  }
}

initProfilePage();
