/* GameConnect – Hồ sơ người chơi, tích hợp trực tiếp với FastAPI hiện tại. */

const PROFILE_API = {
  CURRENT_USER: "/user/me",
  PROFILE_ME: "/api/profiles/me",
  PROFILE_BY_USERNAME: (username) => `/api/profiles/${encodeURIComponent(username)}`,
  PROFILE_CREATE: "/api/profiles/me",
  PROFILE_UPDATE: "/api/profiles/me",
  AVATAR_UPLOAD: "/api/profiles/me/avatar",
  GAME_CATALOG: "/api/games",
  MY_GAMES: "/api/user-games/me",
  CREATE_USER_GAME: "/api/user-games/me",
  USER_GAME_DETAIL: (id) => `/api/user-games/me/${encodeURIComponent(id)}`,
  MY_TEAMS: "/teams/me",
  FRIEND_REQUESTS: "/friend-requests",
};

const GAME_IMAGE_FALLBACKS = [
  { match: ["valorant"], src: "../assets/images/games/valorant.png" },
  { match: ["liên minh", "league of legends", "lol"], src: "../assets/images/games/lol.png" },
  { match: ["đấu trường chân lý", "teamfight tactics", "tft"], src: "../assets/images/games/tft.png" },
  { match: ["cs2", "counter-strike", "counter strike"], src: "../assets/images/games/cs2.png" },
  { match: ["liên quân", "arena of valor", "aov"], src: "../assets/images/games/aov.png" },
];

const $ = (id) => document.getElementById(id);
const profileEls = {
  alert: $("profile-alert"), avatar: $("profile-avatar"), displayName: $("profile-display-name"),
  username: $("profile-username"), region: $("profile-region"), playTime: $("profile-play-time"),
  mic: $("profile-mic"), bio: $("profile-bio"), status: $("profile-status"), heroAction: $("profile-hero-action"),
  gamesCount: $("games-count"), gamesList: $("profile-games-list"), teamsList: $("profile-teams-list"),
  editBtn: $("btn-edit-profile"), editModal: $("edit-profile-modal"), editForm: $("edit-profile-form"),
  editError: $("edit-profile-error"), avatarFile: $("avatar-file"), avatarPreview: $("avatar-preview"),
  addGameForm: $("add-game-form"), newGame: $("new-game-id"), newRank: $("new-rank-id"),
  newRole: $("new-role-id"), gamePreview: $("selected-game-preview"), addGameError: $("add-game-error"),
};

let currentUser = null;
let currentProfile = null;
let gamesCatalog = [];
let myGames = [];
let myTeams = [];
let isOwnProfile = false;
let profileCreated = false;
let selectedAvatarFile = null;
let previewObjectUrl = null;
let catalogReady = false;

function unwrapData(response) {
  return response && typeof response === "object" && Object.prototype.hasOwnProperty.call(response, "data")
    ? response.data : response;
}

function decodeTokenPayload() {
  const token = localStorage.getItem("access_token");
  if (!token || token.split(".").length < 2) return {};
  try {
    const value = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = value + "=".repeat((4 - value.length % 4) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch (_) { return {}; }
}

function resolveImageUrl(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const apiRoot = (CONFIG.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  if (raw.startsWith("/")) return `${apiRoot}${raw}`;
  if (raw.startsWith("../") || raw.startsWith("./")) return raw;
  if (raw.startsWith("assets/") || raw.startsWith("images/")) return `../${raw}`;
  return `${apiRoot}/${raw.replace(/^\//, "")}`;
}

function initials(value) {
  const words = String(value || "GC").trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] || "GC").slice(0, 2)).toUpperCase();
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

function getGameImage(game) {
  const fromApi = game?.image || game?.image_url || game?.cover_image || game?.icon;
  if (fromApi) return resolveImageUrl(fromApi);
  const name = String(game?.name || "").toLowerCase();
  return GAME_IMAGE_FALLBACKS.find((item) => item.match.some((term) => name.includes(term)))?.src || "";
}

function renderAvatar(container, avatarUrl, name, extraClass = "") {
  const url = resolveImageUrl(avatarUrl);
  if (url) {
    container.className = `profile-avatar ${extraClass}`.trim();
    container.innerHTML = `<img src="${escapeHtml(url)}" alt="Ảnh đại diện ${escapeHtml(name || "người chơi")}">`;
    const image = container.querySelector("img");
    image.addEventListener("error", () => {
      container.className = `profile-avatar profile-avatar-placeholder ${extraClass}`.trim();
      container.textContent = initials(name);
    }, { once: true });
  } else {
    container.className = `profile-avatar profile-avatar-placeholder ${extraClass}`.trim();
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

function buildSelectOptions(entries, key, placeholder, selected = "") {
  const sorted = [...(entries || [])];
  if (key === "rank_name") sorted.sort((a, b) => Number(a.rank_order || 0) - Number(b.rank_order || 0));
  return `<option value="">${escapeHtml(placeholder)}</option>` + sorted.map((entry) =>
    `<option value="${escapeHtml(entry.id)}" ${String(entry.id) === String(selected) ? "selected" : ""}>${escapeHtml(entry[key] || entry.name || "")}</option>`
  ).join("");
}

function populateDependentSelect(select, entries, key, placeholder, selected = "") {
  select.innerHTML = buildSelectOptions(entries, key, placeholder, selected);
  select.disabled = !(entries || []).length;
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
  const displayName = profile.display_name || currentUser?.username || "Game thủ";
  const username = profile.username || currentUser?.username || "player";
  profileEls.displayName.textContent = displayName;
  profileEls.username.textContent = `@${String(username).replace(/^@/, "")}`;
  profileEls.region.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(profile.region || "Chưa cập nhật khu vực")}`;
  profileEls.playTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${escapeHtml(profile.play_time || "Chưa cập nhật giờ chơi")}`;
  profileEls.mic.innerHTML = `<i class="fa-solid fa-microphone"></i> ${profile.has_mic ? "Có microphone" : "Chưa bật microphone"}`;
  profileEls.bio.textContent = profile.bio || "Người chơi chưa cập nhật phần giới thiệu.";
  renderAvatar(profileEls.avatar, profile.avatar, displayName);
  const isPublic = Boolean(profile.is_public);
  profileEls.status.innerHTML = `<span></span>${isPublic ? "PUBLIC PLAYER" : "PRIVATE PLAYER"}`;
  profileEls.status.className = `status-chip${isPublic ? "" : " status-private"}`;
  profileEls.editBtn.hidden = !isOwnProfile;
  renderHeroAction(profile);
  document.title = `${displayName} | GameConnect`;
}

function renderHeroAction(profile) {
  if (isOwnProfile) {
    profileEls.heroAction.innerHTML = `<button class="gc-btn gc-btn-outline" type="button" id="btn-edit-profile-hero"><i class="fa-solid fa-pen"></i> Chỉnh sửa</button>`;
    $("btn-edit-profile-hero").addEventListener("click", openEditModal);
    return;
  }
  const status = String(profile.friend_status || "NONE").toUpperCase();
  const targetId = profile.user_id;
  const signedIn = Boolean(localStorage.getItem("access_token"));
  if (!signedIn) {
    profileEls.heroAction.innerHTML = `<a class="gc-btn gc-btn-primary" href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Đăng nhập để kết bạn</a>`;
    return;
  }
  let label = "Kết bạn";
  let disabled = !targetId;
  if (status === "FRIEND") { label = "Đã là bạn bè"; disabled = true; }
  else if (status === "SENT") { label = "Đã gửi lời mời"; disabled = true; }
  else if (status === "RECEIVED") { label = "Có lời mời đang chờ"; disabled = true; }
  profileEls.heroAction.innerHTML = `<button class="gc-btn gc-btn-primary" id="btn-profile-add-friend" type="button" ${disabled ? "disabled" : ""}><i class="fa-solid fa-user-plus"></i> ${label}</button><a class="gc-btn gc-btn-quiet" href="friends.html"><i class="fa-solid fa-user-group"></i> Bạn bè</a>`;
  const button = $("btn-profile-add-friend");
  if (button && !disabled) button.addEventListener("click", () => sendFriendRequest(Number(targetId), button));
}

async function sendFriendRequest(targetId, button) {
  const oldHtml = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...`;
  try {
    const result = unwrapData(await api.post(PROFILE_API.FRIEND_REQUESTS, { receiver_id: targetId }));
    const wasAutoAccepted = result?.status === "ACCEPTED";
    currentProfile.friend_status = wasAutoAccepted ? "FRIEND" : "SENT";
    renderHeroAction(currentProfile);
    showToast(wasAutoAccepted ? "Hai bạn đã trở thành bạn bè." : "Đã gửi lời mời kết bạn.", "success");
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
  return {
    ...item,
    game_id: gameId,
    rank_id: item.rank_id ?? item.rank?.id ?? "",
    role_id: item.role_id ?? item.role?.id ?? "",
    game,
  };
}

function renderGames() {
  profileEls.gamesCount.textContent = `${myGames.length}/5`;
  if (!myGames.length) {
    profileEls.gamesList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-gamepad"></i><strong>Chưa có game yêu thích</strong><span>${isOwnProfile ? "Thêm game bạn thường chơi để hiển thị rank và vai trò trên hồ sơ." : "Người chơi chưa thêm game yêu thích vào hồ sơ."}</span></div>`;
    return;
  }
  profileEls.gamesList.innerHTML = myGames.map((raw) => {
    const item = normalizeUserGame(raw);
    const game = item.game || {};
    const name = game.name || `Game #${item.game_id}`;
    const rankName = findRank(game, item.rank_id)?.rank_name || item.rank?.rank_name || "Chưa chọn rank";
    const roleName = findRole(game, item.role_id)?.role_name || item.role?.role_name || "Chưa chọn vai trò";
    const image = getGameImage(game);
    return `<article class="game-card" data-user-game-id="${escapeHtml(item.id)}">
      ${image ? `<img class="game-card-image" src="${escapeHtml(image)}" alt="${escapeHtml(name)}">` : `<div class="game-card-image game-card-image-fallback"><i class="fa-solid fa-gamepad"></i></div>`}
      <div class="game-card-main"><h3 class="game-card-name">${escapeHtml(name)}</h3>
      <div class="game-tags"><span class="game-tag"><i class="fa-solid fa-ranking-star"></i>${escapeHtml(rankName)}</span><span class="game-tag"><i class="fa-solid fa-crosshairs"></i>${escapeHtml(roleName)}</span></div>
      ${item.in_game_id ? `<div class="game-card-id">ID game: ${escapeHtml(item.in_game_id)}</div>` : ""}</div>
      ${isOwnProfile ? `<div class="game-card-actions"><button class="icon-action" type="button" data-action="edit-game" title="Sửa rank/vai trò"><i class="fa-solid fa-pen"></i></button><button class="icon-action danger" type="button" data-action="delete-game" title="Xóa game"><i class="fa-solid fa-trash"></i></button></div>
      <div class="game-edit-wrap" hidden><select data-field="rank_id" aria-label="Rank">${buildSelectOptions(game.ranks || [], "rank_name", "Chọn rank", item.rank_id)}</select><select data-field="role_id" aria-label="Vai trò">${buildSelectOptions(game.roles || [], "role_name", "Chọn vai trò", item.role_id)}</select><button class="gc-btn gc-btn-primary" type="button" data-action="save-game-edit"><i class="fa-solid fa-check"></i> Lưu</button></div>` : ""}
    </article>`;
  }).join("");
  profileEls.gamesList.querySelectorAll(".game-card-image").forEach((img) => img.addEventListener("error", () => { img.replaceWith(Object.assign(document.createElement("div"), { className: "game-card-image game-card-image-fallback", innerHTML: '<i class="fa-solid fa-gamepad"></i>' })); }, { once: true }));
}

function renderTeams() {
  if (!myTeams.length) {
    profileEls.teamsList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-people-group"></i><strong>Chưa tham gia đội nào</strong><span>${isOwnProfile ? "Khi bạn tham gia một đội, thông tin sẽ xuất hiện tại đây." : "Người chơi chưa tham gia đội nào được công khai."}</span>${isOwnProfile ? `<a class="text-link" href="team-posts.html">Tìm đồng đội <i class="fa-solid fa-arrow-right"></i></a>` : ""}</div>`;
    return;
  }

  profileEls.teamsList.innerHTML = myTeams.map((team) => {
    const name = team.name || `Đội #${team.id}`;
    const logo = resolveImageUrl(team.logo_url || "");
    const gameName = team.game_name || "Game chưa xác định";
    const memberCount = Number(team.member_count || 0);
    const maxMembers = Number(team.max_members || 0);
    const role = team.is_captain || team.member_role === "CAPTAIN" ? "Đội trưởng" : "Thành viên";
    return `<article class="team-card">
      ${logo ? `<img class="team-avatar" src="${escapeHtml(logo)}" alt="Logo ${escapeHtml(name)}">` : `<div class="team-avatar team-avatar-fallback">${escapeHtml(initials(name))}</div>`}
      <div class="team-info"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(gameName)} · ${memberCount}${maxMembers ? `/${maxMembers}` : ""} thành viên</span><span class="team-role">${role} · ${team.join_mode === "PUBLIC" ? "Công khai" : "Cần phê duyệt"}</span>${team.description ? `<span class="team-description">${escapeHtml(team.description)}</span>` : ""}</div>
    </article>`;
  }).join("");
  profileEls.teamsList.querySelectorAll(".team-avatar").forEach((img) => {
    if (img.tagName === "IMG") img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "team-avatar team-avatar-fallback";
      fallback.textContent = initials(img.alt.replace(/^Logo /, ""));
      img.replaceWith(fallback);
    }, { once: true });
  });
}

async function loadCurrentUser() {
  const result = unwrapData(await api.get(PROFILE_API.CURRENT_USER));
  if (!result || !result.id) throw new Error("Không lấy được thông tin tài khoản hiện tại.");
  currentUser = result;
  localStorage.setItem("username", result.username || "");
  localStorage.setItem("user_id", String(result.id));
}

async function loadProfile() {
  const requestedUsername = new URLSearchParams(window.location.search).get("username");
  isOwnProfile = !requestedUsername || (currentUser?.username && requestedUsername.toLowerCase() === currentUser.username.toLowerCase());
  profileEls.editBtn.hidden = !isOwnProfile;

  if (isOwnProfile) {
    try {
      currentProfile = unwrapData(await api.get(PROFILE_API.PROFILE_ME));
      profileCreated = true;
    } catch (error) {
      if (error.status !== 404) throw error;
      profileCreated = false;
      currentProfile = {
        user_id: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.username,
        bio: "",
        region: "",
        play_time: "",
        has_mic: false,
        is_public: false,
        avatar: null,
      };
    }
  } else {
    try {
      currentProfile = unwrapData(await api.get(PROFILE_API.PROFILE_BY_USERNAME(requestedUsername)));
      profileCreated = true;
    } catch (error) {
      if (error && (error.status === 404 || error.status === 403)) {
        profileCreated = false;
        currentProfile = {
          user_id: null,
          username: requestedUsername,
          display_name: requestedUsername,
          bio: error.status === 403
            ? "Người chơi này đang đặt hồ sơ ở chế độ riêng tư."
            : "Người chơi này chưa cập nhật chi tiết hồ sơ game thủ.",
          region: "Chưa cập nhật khu vực",
          play_time: "Chưa cập nhật giờ chơi",
          has_mic: false,
          is_public: error.status !== 403,
          avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(requestedUsername)}&backgroundColor=b6e3f4`,
          user_games: [],
          teams: [],
        };
      } else {
        throw error;
      }
    }
  }

  if (!currentProfile || typeof currentProfile !== "object") throw new Error("Dữ liệu hồ sơ không hợp lệ.");
  currentProfile.username = currentProfile.username || currentUser?.username || requestedUsername;
  renderProfile(currentProfile);

  if (isOwnProfile && !profileCreated) {
    showProfileAlert("Bạn chưa tạo hồ sơ game thủ. Hãy bổ sung thông tin để hoàn tất hồ sơ.");
    openEditModal();
  }
}

async function loadCatalog() {
  const response = unwrapData(await api.get(PROFILE_API.GAME_CATALOG));
  gamesCatalog = Array.isArray(response) ? response : [];
  catalogReady = true;
  profileEls.newGame.innerHTML = `<option value="">-- Chọn game --</option>` + gamesCatalog.map((game) =>
    `<option value="${escapeHtml(game.id)}">${escapeHtml(game.name)}</option>`
  ).join("");
  updateNewGameOptions();
}

async function loadMyGames() {
  if (isOwnProfile) {
    myGames = unwrapData(await api.get(PROFILE_API.MY_GAMES)) || [];
  } else {
    myGames = Array.isArray(currentProfile.user_games) ? currentProfile.user_games : [];
  }
  renderGames();
  $("btn-add-game-toggle").hidden = !isOwnProfile;
}

async function loadMyTeams() {
  if (isOwnProfile) {
    myTeams = unwrapData(await api.get(PROFILE_API.MY_TEAMS)) || [];
  } else {
    myTeams = Array.isArray(currentProfile.teams) ? currentProfile.teams : [];
  }
  renderTeams();
}

function openEditModal() {
  if (!currentProfile || !isOwnProfile) return;
  $("edit-display-name").value = currentProfile.display_name || currentUser?.username || "";
  $("edit-bio").value = currentProfile.bio || "";
  $("edit-region").value = currentProfile.region || "";
  $("edit-play-time").value = currentProfile.play_time || "";
  $("edit-has-mic").checked = Boolean(currentProfile.has_mic);
  $("edit-is-public").checked = Boolean(currentProfile.is_public);
  selectedAvatarFile = null;
  profileEls.avatarFile.value = "";
  renderAvatarPreview(currentProfile.avatar || "", currentProfile.display_name || currentUser?.username || "GC");
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
  profileEls.avatarFile.value = "";
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

async function uploadSelectedAvatar() {
  if (!selectedAvatarFile) return;
  const formData = new FormData();
  formData.append("file", selectedAvatarFile);
  const response = await http.post(PROFILE_API.AVATAR_UPLOAD, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const result = unwrapData(response.data);
  if (!result?.avatar) throw new Error("Backend không trả về trường avatar sau khi tải ảnh.");
  currentProfile = { ...currentProfile, ...result };
}

async function saveProfile(event) {
  event.preventDefault();
  setInlineError(profileEls.editError);
  const displayName = $("edit-display-name").value.trim();
  if (!displayName) return setInlineError(profileEls.editError, "Vui lòng nhập tên hiển thị.");

  const payload = {
    display_name: displayName,
    bio: $("edit-bio").value.trim() || null,
    region: $("edit-region").value || null,
    play_time: $("edit-play-time").value.trim() || null,
    has_mic: $("edit-has-mic").checked,
    is_public: $("edit-is-public").checked,
  };
  const button = $("btn-save-profile");
  button.disabled = true;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;

  try {
    const saved = profileCreated
      ? unwrapData(await api.put(PROFILE_API.PROFILE_UPDATE, payload))
      : unwrapData(await api.post(PROFILE_API.PROFILE_CREATE, payload));
    currentProfile = { ...currentProfile, ...saved, ...payload };
    profileCreated = true;
    if (selectedAvatarFile) await uploadSelectedAvatar();
    renderProfile(currentProfile);
    closeEditModal();
    hideProfileAlert();
    showToast("Đã cập nhật hồ sơ cá nhân.", "success");
  } catch (error) {
    setInlineError(profileEls.editError, error.message || "Không thể lưu hồ sơ.");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i class="fa-solid fa-check"></i> Lưu thay đổi`;
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
  renderAvatarPreview(currentProfile?.avatar || "", currentProfile?.display_name || currentUser?.username || "GC");
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
  if (!profileCreated) return setInlineError(profileEls.addGameError, "Hãy tạo hồ sơ trước khi thêm game.");
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
    game_id: Number(gameId), rank_id: rankId ? Number(rankId) : null,
    role_id: roleId ? Number(roleId) : null,
    in_game_id: $("new-in-game-id").value.trim() || null,
  };
  const button = $("btn-save-new-game");
  button.disabled = true;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;
  try {
    await api.post(PROFILE_API.CREATE_USER_GAME, payload);
    myGames = unwrapData(await api.get(PROFILE_API.MY_GAMES)) || [];
    renderGames();
    profileEls.addGameForm.reset();
    updateNewGameOptions();
    toggleAddGame(false);
    showToast("Đã thêm game vào hồ sơ.", "success");
  } catch (error) {
    setInlineError(profileEls.addGameError, error.message || "Không thể thêm game.");
  } finally {
    button.disabled = false;
    button.innerHTML = "Lưu game";
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
    if (!window.confirm("Bạn có chắc muốn xóa game này khỏi hồ sơ?")) return;
    button.disabled = true;
    try {
      await api.delete(PROFILE_API.USER_GAME_DETAIL(id));
      myGames = myGames.filter((item) => String(item.id) !== String(id));
      renderGames();
      showToast("Đã xóa game khỏi hồ sơ.", "success");
    } catch (error) {
      button.disabled = false;
      showToast(`Không thể xóa game: ${error.message}`, "error");
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
      myGames = unwrapData(await api.get(PROFILE_API.MY_GAMES)) || [];
      renderGames();
      showToast("Đã cập nhật rank và vai trò.", "success");
    } catch (error) {
      button.disabled = false;
      showToast(`Không thể cập nhật game: ${error.message}`, "error");
    }
  }
}

function bindEvents() {
  profileEls.editBtn.addEventListener("click", openEditModal);
  $("btn-close-edit").addEventListener("click", closeEditModal);
  $("btn-cancel-edit").addEventListener("click", closeEditModal);
  document.querySelectorAll("[data-close-edit]").forEach((node) => node.addEventListener("click", closeEditModal));
  profileEls.editForm.addEventListener("submit", saveProfile);
  profileEls.avatarFile.addEventListener("change", (event) => handleAvatarFile(event.target.files?.[0]));
  $("btn-remove-avatar-preview").addEventListener("click", clearAvatarSelection);
  $("btn-add-game-toggle").addEventListener("click", () => toggleAddGame());
  $("btn-cancel-add-game").addEventListener("click", () => toggleAddGame(false));
  profileEls.newGame.addEventListener("change", updateNewGameOptions);
  profileEls.addGameForm.addEventListener("submit", addGame);
  profileEls.gamesList.addEventListener("click", handleGameListAction);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !profileEls.editModal.hidden) closeEditModal();
  });
}

async function initProfilePage() {
  const requestedUsername = new URLSearchParams(window.location.search).get("username");
  const hasToken = Boolean(localStorage.getItem("access_token"));
  if (!hasToken && !requestedUsername) {
    const next = encodeURIComponent("profile.html");
    window.location.href = `login.html?next=${next}`;
    return;
  }

  bindEvents();
  try {
    if (hasToken) {
      try { await loadCurrentUser(); }
      catch (error) {
        if (!requestedUsername) throw error;
        currentUser = null;
      }
    }

    const jobs = await Promise.allSettled([loadProfile(), loadCatalog()]);
    const profileResult = jobs[0];
    if (profileResult.status === "rejected") {
      const error = profileResult.reason;
      showProfileAlert(error.message || "Không tải được hồ sơ.", "error");
      profileEls.gamesList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>Không thể tải hồ sơ</strong><span>Hồ sơ có thể chưa công khai hoặc tài khoản chưa có dữ liệu.</span></div>`;
      profileEls.teamsList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-info"></i><strong>Chưa có thông tin đội</strong></div>`;
      return;
    }

    if (jobs[1].status === "rejected") showProfileAlert(`Không tải được danh mục game: ${jobs[1].reason?.message || "Lỗi không xác định"}.`, "error");
    const secondary = await Promise.allSettled([loadMyGames(), loadMyTeams()]);
    if (secondary[0].status === "rejected") {
      profileEls.gamesList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-gamepad"></i><strong>Chưa tải được game yêu thích</strong><span>${escapeHtml(secondary[0].reason?.message || "Kiểm tra API /api/user-games/me.")}</span></div>`;
    }
    if (secondary[1].status === "rejected") {
      profileEls.teamsList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-people-group"></i><strong>Chưa tải được đội hiện tại</strong><span>${escapeHtml(secondary[1].reason?.message || "Kiểm tra API /teams/me.")}</span></div>`;
    }
  } catch (error) {
    showProfileAlert(error.message || "Có lỗi khi khởi tạo trang hồ sơ.", "error");
  }
}

document.addEventListener("DOMContentLoaded", initProfilePage);
