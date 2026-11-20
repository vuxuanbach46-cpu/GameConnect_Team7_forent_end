// Kiểm tra đăng nhập: Người dùng chưa đăng nhập -> chuyển về file index
if (!localStorage.getItem("access_token")) {
  window.location.href = "../index.html";
}

// =========================================================================
// Trang Bạn Bè & Kết Nối — 100% Dữ liệu thật từ Backend FastAPI (js/api.js)
// =========================================================================

const MOCK_DATA = {
  friends: [],
  received: [],
  sent: [],
  suggestions: [],
  blocked: []
};

let currentUserInfo = {
  id: null,
  username: "",
  displayName: "",
  avatar: ""
};

// Trạng thái bộ lọc & phân trang hiện tại
let currentTab = "friends";
let searchQuery = "";
let selectedGame = "ALL";
let selectedStatus = "ALL";
let currentPage = 1;
let pageSize = 6;
let isLoadingData = false;

const TAB_CONFIG = {
  friends: {
    heading: "DANH SÁCH BẠN BÈ",
    summaryPrefix: "Người bạn đang kết nối",
    emptyTitle: "Chưa có dữ liệu bạn bè",
    emptyDesc: "Bạn chưa kết nối với người bạn nào hoặc không có kết quả khớp bộ lọc."
  },
  received: {
    heading: "LỜI MỜI KẾT BẠN ĐẾN",
    summaryPrefix: "Lời mời đang chờ bạn xác nhận",
    emptyTitle: "Chưa có lời mời kết bạn nào",
    emptyDesc: "Hiện tại chưa có lời mời kết bạn nào đang chờ bạn phản hồi."
  },
  sent: {
    heading: "LỜI MỜI ĐÃ GỬI",
    summaryPrefix: "Lời mời đang chờ đối phương đồng ý",
    emptyTitle: "Chưa có lời mời đã gửi",
    emptyDesc: "Bạn chưa gửi lời mời kết bạn nào đang chờ phản hồi."
  },
  suggestions: {
    heading: "GỢI Ý KẾT BẠN",
    summaryPrefix: "Ưu tiên người có bạn chung và game chung lên đầu",
    emptyTitle: "Chưa có gợi ý kết bạn",
    emptyDesc: "Hiện chưa có gợi ý kết bạn mới trong hệ thống."
  },
  blocked: {
    heading: "DANH SÁCH CHẶN",
    summaryPrefix: "Người bị chặn không thể liên hệ với bạn",
    emptyTitle: "Bạn chưa chặn ai",
    emptyDesc: "Những người bạn chặn sẽ xuất hiện ở đây và bạn có thể bỏ chặn bất cứ lúc nào."
  }
};

// =========================================================================
// Hàm tạo khung SVG CS2 Premier (từ premier/premier_rating_bg.svg của repo)
// =========================================================================
function getPremierPalette(score) {
  if (score >= 30000) {
    return { bar: "#ffd700", bg1: "#6b5300", bg2: "#2e2300", stripe: "#b89000", text: "#ffe766" };
  }
  if (score >= 25000) {
    return { bar: "#eb4b4b", bg1: "#5e1919", bg2: "#290a0a", stripe: "#9e2a2a", text: "#ff8080" };
  }
  if (score >= 20000) {
    return { bar: "#d32ce6", bg1: "#521259", bg2: "#240729", stripe: "#8f1d9c", text: "#f58aff" };
  }
  if (score >= 15000) {
    return { bar: "#8847ff", bg1: "#341b66", bg2: "#160a2e", stripe: "#5b2eb0", text: "#bca0ff" };
  }
  if (score >= 10000) {
    return { bar: "#4b69ff", bg1: "#1c2866", bg2: "#0b102e", stripe: "#3246ad", text: "#99acff" };
  }
  if (score >= 5000) {
    return { bar: "#5e98d9", bg1: "#223852", bg2: "#0e1824", stripe: "#3b628f", text: "#a8d0ff" };
  }
  return { bar: "#b0c3d9", bg1: "#3b424a", bg2: "#1b1e21", stripe: "#636e7a", text: "#dce8f5" };
}

function renderPremierBadge(score) {
  const num = Number(score) || 0;
  const pal = getPremierPalette(num);
  const thousands = Math.floor(num / 1000);
  const remainder = String(num % 1000).padStart(3, "0");

  return `
    <div class="fc-premier-svg-wrap" title="CS2 Premier Rating: ${num.toLocaleString("en-US")}">
      <svg viewBox="0 0 178 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 0H21L9 64H13L25 0Z" fill="${pal.bg2}"/>
        <path d="M178 0H34L22 64H166L178 0Z" fill="${pal.bg1}"/>
        <path d="M176.25 1.5H33.24L21.6562 62.5H164.666L176.25 1.5Z" fill="${pal.bg2}" fill-opacity="0.65"/>
        <path opacity="0.35" d="M46.1141 4L54 4L40.8859 61H33L46.1141 4Z" fill="${pal.stripe}"/>
        <path opacity="0.55" d="M36.7301 4L42 4L30.2699 61H25L36.7301 4Z" fill="${pal.stripe}"/>
        <path opacity="0.35" d="M56.8737 4L72 4L59.1263 61H44L56.8737 4Z" fill="${pal.stripe}"/>
        <path opacity="0.25" d="M75.7813 4L110 4L97.2187 61H63L75.7813 4Z" fill="${pal.stripe}"/>
        <path d="M12 0H21L9 64H0L12 0Z" fill="${pal.bar}"/>
        <path d="M25 0H34L22 64H13L25 0Z" fill="${pal.bar}"/>
      </svg>
      <span class="fc-premier-score-text" style="color: ${pal.text};">
        ${thousands}<small>,${remainder}</small>
      </span>
    </div>
  `;
}

// Hiển thị thông báo nhanh (Toast)
function showFcToast(message) {
  const container = document.getElementById("fc-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "fc-toast";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

// Xử lý Chế độ Sáng / Tối (Light / Dark Mode) qua menu Avatar
function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("fc-light-mode", isLight);

  const checkDark = document.getElementById("check-theme-dark");
  const checkLight = document.getElementById("check-theme-light");
  if (checkDark && checkLight) {
    checkDark.textContent = isLight ? "" : "✓";
    checkLight.textContent = isLight ? "✓" : "";
  }

  document.querySelectorAll(".fc-theme-option").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.setTheme === theme);
  });

  localStorage.setItem("gc_friends_theme", theme);
}

// Bản đồ Logo của từng Game
const GAME_LOGOS = {
  "Valorant": "../assets/images/games/valorant.png",
  "Liên Minh Huyền Thoại": "../assets/images/games/lol.png",
  "Đấu Trường Chân Lý": "../assets/images/games/tft.png",
  "CS2": "../assets/images/games/cs2.png",
  "Liên Quân Mobile": "../assets/images/games/aov.png"
};

const GAME_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả game", logo: null },
  { value: "Valorant", label: "Valorant", logo: GAME_LOGOS["Valorant"] },
  { value: "Liên Minh Huyền Thoại", label: "Liên Minh Huyền Thoại", logo: GAME_LOGOS["Liên Minh Huyền Thoại"] },
  { value: "Đấu Trường Chân Lý", label: "Đấu Trường Chân Lý (TFT)", logo: GAME_LOGOS["Đấu Trường Chân Lý"] },
  { value: "CS2", label: "Counter-Strike 2", logo: GAME_LOGOS["CS2"] },
  { value: "Liên Quân Mobile", label: "Liên Quân Mobile", logo: GAME_LOGOS["Liên Quân Mobile"] }
];

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Mọi trạng thái", dotClass: "is-all" },
  { value: "online", label: "Đang Online / Trong phòng", dotClass: "is-online" },
  { value: "offline", label: "Đang Offline", dotClass: "is-offline" }
];

function renderDropdownGameIcon(opt) {
  if (!opt.logo) {
    return `
      <svg class="fc-dd-all-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
    `;
  }
  return `<img src="${opt.logo}" alt="${escapeHtml(opt.label)}" class="fc-dd-game-logo">`;
}

// Render nội dung & số đếm người chơi trong 2 Custom Dropdown
function renderFilterDropdowns() {
  const rawList = MOCK_DATA[currentTab] || [];

  // 1. Dropdown Game
  const gameLabelEl = document.getElementById("label-dropdown-game");
  const gameMenuEl = document.getElementById("menu-dropdown-game");
  if (gameLabelEl && gameMenuEl) {
    const activeGameOpt = GAME_FILTER_OPTIONS.find((o) => o.value === selectedGame) || GAME_FILTER_OPTIONS[0];
    gameLabelEl.innerHTML = `
      ${renderDropdownGameIcon(activeGameOpt)}
      <span>${escapeHtml(activeGameOpt.label)}</span>
    `;

    gameMenuEl.innerHTML = GAME_FILTER_OPTIONS.map((opt) => {
      const isActive = opt.value === selectedGame;
      return `
        <button type="button" class="fc-dropdown-item ${isActive ? "active" : ""}" data-filter-game="${escapeHtml(opt.value)}">
          <span class="fc-dropdown-item-left">
            ${renderDropdownGameIcon(opt)}
            <span>${escapeHtml(opt.label)}</span>
          </span>
          <span class="fc-dropdown-item-right">
            <span class="fc-dd-check">${isActive ? "✓" : ""}</span>
          </span>
        </button>
      `;
    }).join("");
  }

  // 2. Dropdown Trạng thái
  const statusLabelEl = document.getElementById("label-dropdown-status");
  const statusMenuEl = document.getElementById("menu-dropdown-status");
  if (statusLabelEl && statusMenuEl) {
    const activeStatusOpt = STATUS_FILTER_OPTIONS.find((o) => o.value === selectedStatus) || STATUS_FILTER_OPTIONS[0];
    statusLabelEl.innerHTML = `
      <span class="fc-dd-dot ${activeStatusOpt.dotClass}"></span>
      <span>${escapeHtml(activeStatusOpt.label)}</span>
    `;

    statusMenuEl.innerHTML = STATUS_FILTER_OPTIONS.map((opt) => {
      const count =
        opt.value === "ALL"
          ? rawList.length
          : opt.value === "online"
          ? rawList.filter((p) => p.presence === "online" || p.presence === "ingame").length
          : rawList.filter((p) => p.presence === "offline").length;
      const isActive = opt.value === selectedStatus;
      return `
        <button type="button" class="fc-dropdown-item ${isActive ? "active" : ""}" data-filter-status="${escapeHtml(opt.value)}">
          <span class="fc-dropdown-item-left">
            <span class="fc-dd-dot ${opt.dotClass}"></span>
            <span>${escapeHtml(opt.label)}</span>
          </span>
          <span class="fc-dropdown-item-right">
            <span class="fc-dd-count">${count}</span>
            <span class="fc-dd-check">${isActive ? "✓" : ""}</span>
          </span>
        </button>
      `;
    }).join("");
  }
}

// Cập nhật số đếm trên 5 tab và thanh bên
function updateCounters() {
  document.getElementById("count-friends").textContent = MOCK_DATA.friends.length;
  document.getElementById("count-received").textContent = MOCK_DATA.received.length;
  document.getElementById("count-sent").textContent = MOCK_DATA.sent.length;
  document.getElementById("count-suggestions").textContent = MOCK_DATA.suggestions.length;
  const countBlockedEl = document.getElementById("count-blocked");
  if (countBlockedEl) countBlockedEl.textContent = MOCK_DATA.blocked.length;

  const sidebarBadge = document.getElementById("sidebar-req-badge");
  if (sidebarBadge) {
    const recCount = MOCK_DATA.received.length;
    sidebarBadge.textContent = recCount;
    sidebarBadge.style.display = recCount > 0 ? "flex" : "none";
  }

  renderFilterDropdowns();
}

// Tạo nút bấm tương ứng với từng Tab
function renderActionsForTab(player, tab) {
  if (tab === "blocked") {
    return `
      <button class="fc-btn fc-btn-secondary" data-action="unblock" data-id="${player.id}">
        Bỏ chặn
      </button>
    `;
  }

  if (tab === "friends") {
    const mainBtn = player.inRoom
      ? `<button class="fc-btn fc-btn-join" data-action="join-room" data-id="${player.id}">
        Xin vào phòng
      </button>`
      : `<button class="fc-btn fc-btn-primary" data-action="invite" data-id="${player.id}">
        + Mời vào đội
      </button>`;
    return `
      ${mainBtn}
      <button class="fc-btn fc-btn-secondary" data-action="message" data-id="${player.id}">
        Nhắn tin
      </button>
      <button class="fc-btn fc-btn-danger-ghost fc-btn-icon" data-action="unfriend" data-id="${player.id}" title="Hủy kết bạn">
        ✕
      </button>
    `;
  }

  if (tab === "received") {
    return `
      <button class="fc-btn fc-btn-primary" data-action="accept" data-id="${player.id}">
        ✓ Chấp nhận
      </button>
      <button class="fc-btn fc-btn-danger-ghost" data-action="reject" data-id="${player.id}">
        Từ chối
      </button>
    `;
  }

  if (tab === "sent") {
    return `
      <span style="font-size: 12.5px; color: var(--fc-text-muted); margin-right: 6px; font-weight: 700;">Đang chờ...</span>
      <button class="fc-btn fc-btn-danger-ghost" data-action="cancel-sent" data-id="${player.id}">
        Hủy lời mời
      </button>
    `;
  }

  return `
    <button class="fc-btn fc-btn-primary" data-action="add-friend" data-id="${player.id}">
      + Kết bạn
    </button>
    <button class="fc-btn fc-btn-danger-ghost fc-btn-icon" data-action="dismiss-suggestion" data-id="${player.id}" title="Ẩn gợi ý">
      ✕
    </button>
  `;
}

// Render huy hiệu phụ ở cột Tên Game (Cột 2): chỉ hiển thị khi user có dữ liệu thật
function renderGameHeaderBadge(player) {
  if (!player.hasGame || !player.inGameId) return "";
  return `
    <span class="fc-game-level-pill lv-lol" title="In-game ID">
      <span>${escapeHtml(String(player.inGameId))}</span>
    </span>
  `;
}

// Huy hiệu xác thực: chỉ hiện khi tài khoản đã liên kết game trong DB hoặc có nhiều bạn chung
function getVerifiedTier(player) {
  if (!player.verified) return null;
  const topRank = /Immortal|Radiant|Challenger|Grandmaster|Master|Cao Thủ|Chiến Tướng|Thách Đấu|Level 10/i.test(player.rankName || "");
  const topPremier = player.cs2Mode === "premier" && Number(player.premierScore) >= 20000;
  const manyMutual = Number(player.mutualFriends) >= 10;
  return topRank || topPremier || manyMutual ? "gold" : "blue";
}

function renderVerifiedBadge(player) {
  const tier = getVerifiedTier(player);
  if (!tier) return "";
  const isGold = tier === "gold";
  const title = isGold ? "Game thủ nổi bật đã xác thực" : "Game thủ đã xác thực";
  const src = isGold ? "../assets/images/badges/verified-gold.png" : "../assets/images/badges/verified-blue.png";
  return `<img src="${src}" alt="${title}" title="${title}" class="fc-verified-badge">`;
}

// Render cột Mức Rank (Cột 3)
function renderRankBadgeColumn(player) {
  if (player.game === "CS2" && player.cs2Mode === "premier" && player.premierScore) {
    return renderPremierBadge(player.premierScore);
  }
  if (!player.rankIcon) {
    return "";
  }
  return `
    <div class="fc-rank-badges-wrap">
      <img
        src="${player.rankIcon}"
        alt="${escapeHtml(player.rankName)}"
        class="fc-rank-icon-img"
        title="${escapeHtml(player.rankName)}"
      >
    </div>
  `;
}

// Render thanh Phân Trang (Pagination)
function renderPagination(totalItems, totalPages, startIdx, endIdx) {
  const paginationEl = document.getElementById("pagination-container");
  if (!paginationEl) return;

  if (totalItems === 0) {
    paginationEl.innerHTML = "";
    return;
  }

  let pageButtonsHtml = "";
  for (let p = 1; p <= totalPages; p++) {
    const activeClass = p === currentPage ? "active" : "";
    pageButtonsHtml += `
      <button type="button" class="fc-page-btn ${activeClass}" data-page="${p}">
        ${p}
      </button>
    `;
  }

  paginationEl.innerHTML = `
    <div class="fc-page-info">
      Trang <strong>${currentPage} / ${totalPages}</strong> · Hiển thị <strong>${startIdx + 1}–${endIdx}</strong> trên tổng <strong>${totalItems}</strong> người chơi
    </div>
    <div class="fc-page-controls">
      <button type="button" class="fc-page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>
        « Trước
      </button>
      ${pageButtonsHtml}
      <button type="button" class="fc-page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>
        Sau »
      </button>
      <select id="page-size-select" class="fc-page-size-select" aria-label="Số người chơi mỗi trang">
        <option value="6" ${pageSize === 6 ? "selected" : ""}>6 / trang</option>
        <option value="10" ${pageSize === 10 ? "selected" : ""}>10 / trang</option>
        <option value="15" ${pageSize === 15 ? "selected" : ""}>15 / trang</option>
      </select>
    </div>
  `;
}

// Trạng thái hiển thị ở tab Bạn bè: chỉ "Đang trong phòng" hoặc "Đang trực tuyến"
function getFriendStatusLine(player) {
  if (player.presence !== "online" && player.presence !== "ingame") return null;
  if (player.inRoom) {
    return { key: "inroom", text: "ĐANG TRONG PHÒNG" };
  }
  return { key: "online", text: "ĐANG TRỰC TUYẾN" };
}

function getMutualCount(player) {
  return typeof player.mutualFriends === "number" ? player.mutualFriends : 0;
}

// Dòng mô tả dưới tên: đang trong phòng -> thông tin phòng thật; còn lại -> số bạn chung thật từ Backend
function renderPlayerSubInfo(player) {
  let text = "";
  if (player.inRoom && player.roomPost) {
    text = player.roomPost;
  } else {
    const mutual = getMutualCount(player);
    if (mutual > 0) text = `${mutual} bạn chung`;
    else if (player.subInfo) text = player.subInfo;
  }
  return text ? `<div class="fc-player-desc">${escapeHtml(text)}</div>` : "";
}

function matchesPlayerFilter(item) {
  const q = searchQuery.trim().toLowerCase();
  const matchSearch =
    !q ||
    item.name.toLowerCase().includes(q) ||
    item.tag.toLowerCase().includes(q) ||
    (item.username && item.username.toLowerCase().includes(q)) ||
    item.game.toLowerCase().includes(q) ||
    item.rankName.toLowerCase().includes(q) ||
    item.roles.some((r) => r.toLowerCase().includes(q));

  const matchGame = selectedGame === "ALL" || item.game === selectedGame;

  const matchStatus =
    selectedStatus === "ALL" ||
    (selectedStatus === "online" && (item.presence === "online" || item.presence === "ingame")) ||
    (selectedStatus === "offline" && item.presence === "offline");

  return matchSearch && matchGame && matchStatus;
}

function renderSinglePlayerRow(player, tabForRow) {
  const friendStatus = tabForRow === "friends" ? getFriendStatusLine(player) : null;

  const presenceClass =
    tabForRow === "blocked"
      ? "fc-presence-offline"
      : tabForRow === "friends"
      ? friendStatus
        ? friendStatus.key === "inroom"
          ? "fc-presence-ingame"
          : "fc-presence-online"
        : "fc-presence-offline"
      : player.presence === "ingame"
      ? "fc-presence-ingame"
      : player.presence === "online"
      ? "fc-presence-online"
      : "fc-presence-offline";

  const subheadStatusClass =
    tabForRow === "blocked"
      ? "is-blocked"
      : tabForRow === "friends"
      ? friendStatus
        ? friendStatus.key === "inroom"
          ? "is-inroom"
          : "is-online"
        : ""
      : player.presence === "ingame"
      ? "is-ingame"
      : player.presence === "online"
      ? "is-online"
      : "";

  const subheadText = tabForRow === "friends" ? (friendStatus ? friendStatus.text : "") : player.statusText;
  const subheadHtml = subheadText
    ? `<div class="fc-player-subhead ${subheadStatusClass}">${escapeHtml(subheadText)}</div>`
    : "";

  const roleBadges = player.roles
    .map((r) => `<span class="fc-role-tag">${escapeHtml(r)}</span>`)
    .join("");

  return `
    <article class="fc-player-row ${tabForRow === "blocked" ? "is-blocked" : ""}">
      <!-- Cột 1: Avatar + Tên + Trạng thái / Bạn chung -->
      <div class="fc-player-identity">
        <div class="fc-avatar-box">
          <img src="${player.avatar}" alt="${escapeHtml(player.name)}" class="fc-avatar-img" loading="lazy">
          <span class="fc-presence-badge ${presenceClass}"></span>
        </div>
        <div class="fc-player-meta">
          ${subheadHtml}
          <div class="fc-player-name-row">
            <span class="fc-player-name">${escapeHtml(player.name)}</span>
            <span style="font-size: 12.5px; color: var(--fc-text-muted); font-weight: 700;">${escapeHtml(player.tag)}</span>
            ${renderVerifiedBadge(player)}
          </div>
          ${renderPlayerSubInfo(player)}
        </div>
      </div>

      <!-- Cột 2: Tên Game + Logo Game + Role thật từ DB -->
      <div class="fc-player-games">
        <div class="fc-game-main">
          ${GAME_LOGOS[player.game] ? `<img src="${GAME_LOGOS[player.game]}" alt="${escapeHtml(player.game)}" class="fc-row-game-logo">` : '<span class="fc-game-dot"></span>'}
          <span>${escapeHtml(player.game)}</span>
          ${renderGameHeaderBadge(player)}
        </div>
        ${roleBadges ? `<div class="fc-role-tags">${roleBadges}</div>` : ""}
      </div>

      <!-- Cột 3: Mức Rank thật từ DB -->
      <div class="fc-player-rank">
        ${renderRankBadgeColumn(player)}
        <div class="fc-rank-info">
          <div class="fc-rank-title-row">
            <span class="fc-rank-title">${escapeHtml(player.rankName)}</span>
          </div>
          ${player.elo ? `<span class="fc-rank-elo">${escapeHtml(player.elo)}</span>` : ""}
        </div>
      </div>

      <!-- Cột 4: Nút thao tác -->
      <div class="fc-player-actions">
        ${renderActionsForTab(player, tabForRow)}${tabForRow === "blocked" ? "" : renderMoreMenu(player)}
      </div>
    </article>
  `;
}

// Render danh sách người chơi theo tab + bộ lọc + phân trang
function renderPlayerList() {
  updateCounters();

  const listEl = document.getElementById("players-list-container");
  const headingEl = document.getElementById("section-heading");
  const summaryEl = document.getElementById("tab-summary-text");

  const config = TAB_CONFIG[currentTab];
  headingEl.textContent = config.heading;

  const rawList = MOCK_DATA[currentTab] || [];
  const filtered = rawList.filter(matchesPlayerFilter);

  if (currentTab === "suggestions") {
    filtered.sort((a, b) => (b.mutualFriends || 0) - (a.mutualFriends || 0));
  }

  // Nếu đang ở tab Bạn bè mà gõ tìm kiếm chưa có trong danh sách bạn bè -> hiển thị kết quả từ Gợi ý kết bạn
  if (currentTab === "friends" && searchQuery.trim() !== "" && filtered.length === 0) {
    const matchedSuggestions = (MOCK_DATA.suggestions || []).filter(matchesPlayerFilter);
    matchedSuggestions.sort((a, b) => (b.mutualFriends || 0) - (a.mutualFriends || 0));

    if (matchedSuggestions.length > 0) {
      headingEl.textContent = "KẾT QUẢ TÌM NGƯỜI CHƠI ĐỂ KẾT BẠN";
      const totalSug = matchedSuggestions.length;
      const totalSugPages = Math.max(1, Math.ceil(totalSug / pageSize));
      if (currentPage > totalSugPages) currentPage = totalSugPages;
      if (currentPage < 1) currentPage = 1;

      const sIdx = (currentPage - 1) * pageSize;
      const eIdx = Math.min(sIdx + pageSize, totalSug);
      const sugPageItems = matchedSuggestions.slice(sIdx, eIdx);

      summaryEl.textContent = `Tìm thấy ${totalSug} người chơi trong hệ thống để kết bạn`;
      listEl.innerHTML = sugPageItems.map((player) => renderSinglePlayerRow(player, "suggestions")).join("");
      renderPagination(totalSug, totalSugPages, sIdx, eIdx);
      return;
    }
  }

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageItems = filtered.slice(startIdx, endIdx);

  summaryEl.textContent = `Tổng ${totalItems} / ${rawList.length} — ${config.summaryPrefix}`;

  if (totalItems === 0) {
    const title = isLoadingData
      ? "Đang tải dữ liệu từ hệ thống..."
      : (rawList.length === 0 ? config.emptyTitle : "Không tìm thấy người chơi nào");
    const desc = isLoadingData
      ? "Vui lòng chờ giây lát..."
      : (rawList.length === 0 ? config.emptyDesc : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc game / trạng thái ở phía trên.");

    listEl.innerHTML = `
      <div class="fc-empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
      </div>
    `;
    renderPagination(0, 1, 0, 0);
    return;
  }

  listEl.innerHTML = pageItems.map((player) => renderSinglePlayerRow(player, currentTab)).join("");

  renderPagination(totalItems, totalPages, startIdx, endIdx);
}

// =========================================================================
// Chặn / Bỏ chặn & Xem hồ sơ (100% API thật)
// =========================================================================
let modalPendingId = null;

function renderMoreMenu(player) {
  return `
    <div class="fc-more-wrap">
      <button type="button" class="fc-more-btn" data-more-toggle aria-haspopup="true" aria-label="Tùy chọn khác" title="Tùy chọn khác">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"></circle>
          <circle cx="12" cy="12" r="1.8"></circle>
          <circle cx="19" cy="12" r="1.8"></circle>
        </svg>
      </button>
      <div class="fc-more-menu" role="menu">
        <button type="button" class="fc-more-item" role="menuitem" data-action="view-profile" data-id="${player.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Xem hồ sơ</span>
        </button>
        <button type="button" class="fc-more-item is-danger" role="menuitem" data-action="block-ask" data-id="${player.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
          <span>Chặn</span>
        </button>
      </div>
    </div>
  `;
}

function closeAllMoreMenus() {
  document.querySelectorAll(".fc-more-wrap.is-open").forEach((w) => w.classList.remove("is-open"));
}

function findPlayerAnywhere(id) {
  const keys = ["friends", "received", "sent", "suggestions", "blocked"];
  for (const key of keys) {
    const found = (MOCK_DATA[key] || []).find((x) => x.id === id || x.userId === id);
    if (found) return found;
  }
  return null;
}

function openModal(html) {
  const root = document.getElementById("fc-modal");
  const card = document.getElementById("fc-modal-card");
  if (!root || !card) return;
  card.innerHTML = html;
  root.hidden = false;
}

function closeModal() {
  const root = document.getElementById("fc-modal");
  if (root) root.hidden = true;
  modalPendingId = null;
}

function openBlockConfirm(player) {
  modalPendingId = player.id;
  openModal(`
    <div class="fc-modal-head">
      <img src="${player.avatar}" alt="${escapeHtml(player.name)}" class="fc-modal-avatar">
      <div>
        <h3>Chặn ${escapeHtml(player.name)}?</h3>
        <p>${escapeHtml(player.tag)}</p>
      </div>
    </div>
    <ul class="fc-modal-list">
      <li>Hai bên không thể mời kết bạn, mời vào đội hay nhắn tin cho nhau.</li>
      <li>Nếu đang là bạn bè, hai người sẽ bị huỷ kết bạn.</li>
      <li>Bạn có thể bỏ chặn bất cứ lúc nào trong tab “Danh sách chặn”.</li>
    </ul>
    <div class="fc-modal-actions">
      <button type="button" class="fc-btn fc-btn-secondary" data-modal-close>Hủy</button>
      <button type="button" class="fc-btn fc-btn-danger" data-modal-confirm-block>Chặn</button>
    </div>
  `);
}

// =========================================================================
// Ánh xạ dữ liệu thật từ Backend (Không bịa game/rank giả)
// =========================================================================
function buildDiceBearAvatar(username) {
  const seed = encodeURIComponent(String(username || "user"));
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;
}

function resolveAvatarUrl(rawAvatar, username) {
  if (rawAvatar && typeof rawAvatar === "string" && rawAvatar.trim()) {
    const trimmed = rawAvatar.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("../")) {
      return trimmed;
    }
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : "http://127.0.0.1:8000";
    return `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }
  return buildDiceBearAvatar(username);
}

// Chuẩn hóa tên game từ DB sang tên hiển thị có logo; nếu chưa có game thì trả về null
function normalizeRealGameName(rawName) {
  if (!rawName || !String(rawName).trim()) return null;
  const s = String(rawName).trim().toLowerCase();
  if (s.includes("valorant")) return "Valorant";
  if (s.includes("cs2") || s.includes("counter-strike") || s.includes("counter strike")) return "CS2";
  if (s.includes("liên quân") || s.includes("lien quan") || s.includes("aov") || s.includes("arena of valor")) return "Liên Quân Mobile";
  if (s.includes("chân lý") || s.includes("chan ly") || s.includes("tft") || s.includes("đtcl") || s.includes("teamfight")) return "Đấu Trường Chân Lý";
  if (s.includes("liên minh") || s.includes("lien minh") || s.includes("lol") || s.includes("league")) return "Liên Minh Huyền Thoại";
  return String(rawName).trim();
}

// Map rank thật từ DB sang icon trong ../assets/images/ranks/; nếu chưa khai báo rank thì hiển thị "Chưa xếp hạng"
function resolveRealRankAssets(gameName, rawRankName, rawRankIcon, rawElo) {
  if (!gameName) {
    return {
      rankName: "Chưa xếp hạng",
      rankIcon: "",
      elo: ""
    };
  }

  const rName = String(rawRankName || "").trim();
  if (!rName && !rawRankIcon) {
    return {
      rankName: "Chưa xếp hạng",
      rankIcon: "",
      elo: rawElo ? String(rawElo) : ""
    };
  }

  const rLower = rName.toLowerCase();

  if (gameName === "Valorant") {
    const valMap = [
      { match: ["radiant"], icon: "../assets/images/ranks/valorant/Radiant_Rank.png" },
      { match: ["immortal 3", "bất tử 3"], icon: "../assets/images/ranks/valorant/Immortal_3_Rank.png" },
      { match: ["immortal 2", "bất tử 2"], icon: "../assets/images/ranks/valorant/Immortal_2_Rank.png" },
      { match: ["immortal", "bất tử"], icon: "../assets/images/ranks/valorant/Immortal_1_Rank.png" },
      { match: ["ascendant 3", "thăng hoa 3"], icon: "../assets/images/ranks/valorant/Ascendant_3_Rank.png" },
      { match: ["ascendant 2", "thăng hoa 2"], icon: "../assets/images/ranks/valorant/Ascendant_2_Rank.png" },
      { match: ["ascendant", "thăng hoa"], icon: "../assets/images/ranks/valorant/Ascendant_1_Rank.png" },
      { match: ["diamond 3", "kim cương 3"], icon: "../assets/images/ranks/valorant/Diamond_3_Rank.png" },
      { match: ["diamond 2", "kim cương 2"], icon: "../assets/images/ranks/valorant/Diamond_2_Rank.png" },
      { match: ["diamond", "kim cương"], icon: "../assets/images/ranks/valorant/Diamond_1_Rank.png" },
      { match: ["platinum 3", "bạch kim 3"], icon: "../assets/images/ranks/valorant/Platinum_3_Rank.png" },
      { match: ["platinum 2", "bạch kim 2"], icon: "../assets/images/ranks/valorant/Platinum_2_Rank.png" },
      { match: ["platinum", "bạch kim"], icon: "../assets/images/ranks/valorant/Platinum_1_Rank.png" },
      { match: ["gold 3", "vàng 3"], icon: "../assets/images/ranks/valorant/Gold_3_Rank.png" },
      { match: ["gold 2", "vàng 2"], icon: "../assets/images/ranks/valorant/Gold_2_Rank.png" },
      { match: ["gold", "vàng"], icon: "../assets/images/ranks/valorant/Gold_1_Rank.png" },
      { match: ["silver 3", "bạc 3"], icon: "../assets/images/ranks/valorant/Silver_3_Rank.png" },
      { match: ["silver 2", "bạc 2"], icon: "../assets/images/ranks/valorant/Silver_2_Rank.png" },
      { match: ["silver", "bạc"], icon: "../assets/images/ranks/valorant/Silver_1_Rank.png" },
      { match: ["bronze 3", "đồng 3"], icon: "../assets/images/ranks/valorant/Bronze_3_Rank.png" },
      { match: ["bronze 2", "đồng 2"], icon: "../assets/images/ranks/valorant/Bronze_2_Rank.png" },
      { match: ["bronze", "đồng"], icon: "../assets/images/ranks/valorant/Bronze_1_Rank.png" },
      { match: ["iron 3", "sắt 3"], icon: "../assets/images/ranks/valorant/Iron_3_Rank.png" },
      { match: ["iron 2", "sắt 2"], icon: "../assets/images/ranks/valorant/Iron_2_Rank.png" },
      { match: ["iron", "sắt"], icon: "../assets/images/ranks/valorant/Iron_1_Rank.png" }
    ];
    const hit = valMap.find((m) => m.match.some((k) => rLower.includes(k)));
    return {
      rankName: rName,
      rankIcon: rawRankIcon || (hit ? hit.icon : "../assets/images/ranks/valorant/Gold_1_Rank.png"),
      elo: rawElo ? String(rawElo) : ""
    };
  }

  if (gameName === "CS2") {
    const numMatch = (rName + " " + String(rawElo || "")).match(/(\d{4,5})/);
    if (rLower.includes("premier") || numMatch) {
      const score = numMatch ? Number(numMatch[1]) : 15000;
      return {
        cs2Mode: "premier",
        premierScore: score,
        rankName: rName || "CS2 Premier",
        rankIcon: "",
        elo: rawElo ? String(rawElo) : ""
      };
    }
    const lvMatch = rLower.match(/(\d+)/);
    const lv = lvMatch ? Math.min(10, Math.max(1, Number(lvMatch[1]))) : 5;
    const isChal = rLower.includes("challenger") || rLower.includes("thách đấu");
    return {
      cs2Mode: "faceit",
      rankName: rName,
      rankIcon: rawRankIcon || `../assets/images/ranks/faceit/${isChal ? 11 : lv}.svg`,
      elo: rawElo ? String(rawElo) : ""
    };
  }

  if (gameName === "Liên Quân Mobile") {
    const aovMap = [
      { match: ["thách đấu", "challenger"], icon: "../assets/images/ranks/aov/challenger.png" },
      { match: ["chiến tướng", "conqueror"], icon: "../assets/images/ranks/aov/conqueror.png" },
      { match: ["cao thủ", "master"], icon: "../assets/images/ranks/aov/master.png" },
      { match: ["tinh anh", "veteran"], icon: "../assets/images/ranks/aov/veteran.png" },
      { match: ["kim cương", "diamond"], icon: "../assets/images/ranks/aov/diamond.png" },
      { match: ["bạch kim", "platinum"], icon: "../assets/images/ranks/aov/platinum.png" },
      { match: ["vàng", "gold"], icon: "../assets/images/ranks/aov/gold.png" },
      { match: ["bạc", "silver"], icon: "../assets/images/ranks/aov/silver.png" },
      { match: ["đồng", "bronze"], icon: "../assets/images/ranks/aov/bronze.png" }
    ];
    const hit = aovMap.find((m) => m.match.some((k) => rLower.includes(k)));
    return {
      rankName: rName,
      rankIcon: rawRankIcon || (hit ? hit.icon : "../assets/images/ranks/aov/gold.png"),
      elo: rawElo ? String(rawElo) : ""
    };
  }

  const lolMap = [
    { match: ["thách đấu", "challenger"], icon: "../assets/images/ranks/lol/10.png" },
    { match: ["đại cao thủ", "grandmaster"], icon: "../assets/images/ranks/lol/9.png" },
    { match: ["cao thủ", "master"], icon: "../assets/images/ranks/lol/8.png" },
    { match: ["kim cương", "diamond"], icon: "../assets/images/ranks/lol/7.png" },
    { match: ["lục bảo", "emerald"], icon: "../assets/images/ranks/lol/6.png" },
    { match: ["bạch kim", "platinum"], icon: "../assets/images/ranks/lol/5.png" },
    { match: ["vàng", "gold"], icon: "../assets/images/ranks/lol/4.png" },
    { match: ["bạc", "silver"], icon: "../assets/images/ranks/lol/3.png" },
    { match: ["đồng", "bronze"], icon: "../assets/images/ranks/lol/2.png" },
    { match: ["sắt", "iron"], icon: "../assets/images/ranks/lol/1.png" }
  ];
  const hit = lolMap.find((m) => m.match.some((k) => rLower.includes(k)));
  return {
    rankName: rName,
    rankIcon: rawRankIcon || (hit ? hit.icon : "../assets/images/ranks/lol/4.png"),
    elo: rawElo ? String(rawElo) : ""
  };
}

function formatRelativeTime(isoStr, prefix) {
  if (!isoStr) return prefix;
  const dt = new Date(isoStr);
  if (Number.isNaN(dt.getTime())) return prefix;
  const diffMin = Math.max(1, Math.floor((Date.now() - dt.getTime()) / 60000));
  if (diffMin < 60) return `${prefix} ${diffMin} PHÚT TRƯỚC`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${prefix} ${diffHours} GIỜ TRƯỚC`;
  const diffDays = Math.floor(diffHours / 24);
  return `${prefix} ${diffDays} NGÀY TRƯỚC`;
}

// Chuyển đổi bản ghi thật từ Backend sang thẻ người chơi 4 cột
function mapBackendPlayerToCard(raw, tabType) {
  const userObj = raw && raw.user ? raw.user : (raw || {});
  const userId = Number(
    userObj.user_id ||
    userObj.id ||
    raw.friend_id ||
    raw.user_id ||
    (tabType === "received" ? raw.sender_id : tabType === "sent" ? raw.receiver_id : raw.id)
  );
  const requestId = raw && raw.user && raw.id ? Number(raw.id) : (raw.request_id ? Number(raw.request_id) : null);
  const username = String(userObj.username || raw.username || "").trim();
  const displayName = String(userObj.display_name || raw.display_name || username).trim();
  const tag = username ? `@${username}` : "";

  const pg = userObj.primary_game || raw.primary_game || (Array.isArray(userObj.games) ? userObj.games[0] : null) || null;
  const realGameName = normalizeRealGameName(pg && (pg.game_name || pg.name));
  const hasGame = Boolean(realGameName);
  const gameDisplay = realGameName || "Chưa cập nhật game";

  const rankMeta = resolveRealRankAssets(
    realGameName,
    pg && pg.rank_name,
    pg && pg.rank_icon,
    pg && pg.elo
  );

  const roles = (pg && Array.isArray(pg.roles) && pg.roles.length > 0)
    ? pg.roles
    : [];

  const mutualCount = Number(
    userObj.mutual_friends_count ??
    raw.mutual_friends_count ??
    0
  );

  const inRoom = Boolean(userObj.in_room ?? raw.in_room ?? false);
  const roomInfo = userObj.room_info || raw.room_info || null;
  const roomId = roomInfo && roomInfo.room_id ? Number(roomInfo.room_id) : null;
  const roomPost = inRoom && roomInfo
    ? `${roomInfo.room_name || "Phòng chờ"} (${roomInfo.current_players || 1}/${roomInfo.max_players || 5})`
    : "";

  const presence = tabType === "blocked"
    ? "offline"
    : (inRoom ? "ingame" : (userObj.presence || raw.presence || "online"));

  let statusText = "ĐANG TRỰC TUYẾN";
  if (tabType === "friends") {
    statusText = inRoom ? "ĐANG TRONG PHÒNG" : "ĐANG TRỰC TUYẾN";
  } else if (tabType === "received") {
    statusText = formatRelativeTime(raw.created_at, "GỬI LỜI MỜI");
  } else if (tabType === "sent") {
    statusText = `${formatRelativeTime(raw.created_at, "ĐÃ GỬI")} · ĐANG CHỜ PHẢN HỒI`;
  } else if (tabType === "suggestions") {
    statusText = raw.reason ? String(raw.reason).toUpperCase() : (mutualCount > 0 ? `${mutualCount} BẠN CHUNG` : "GỢI Ý KẾT BẠN");
  } else if (tabType === "blocked") {
    statusText = formatRelativeTime(raw.blocked_at || raw.created_at, "ĐÃ CHẶN");
  }

  return {
    id: userId,
    userId,
    requestId,
    username,
    name: displayName || username,
    tag,
    verified: Boolean(hasGame && pg && pg.rank_name),
    mutualFriends: mutualCount,
    avatar: resolveAvatarUrl(userObj.avatar ?? raw.avatar, username),
    presence,
    statusText,
    subInfo: mutualCount > 0 ? `${mutualCount} bạn chung` : (raw.reason || ""),
    inRoom,
    roomId,
    roomPost,
    hasGame,
    inGameId: pg && pg.in_game_name ? pg.in_game_name : "",
    game: gameDisplay,
    roles,
    cs2Mode: rankMeta.cs2Mode,
    premierScore: rankMeta.premierScore,
    rankName: rankMeta.rankName,
    rankIcon: rankMeta.rankIcon,
    elo: rankMeta.elo
  };
}

// Tải thông tin tài khoản thật đang đăng nhập (GET /user/me + GET /api/profiles/me)
async function loadCurrentUserProfile() {
  if (typeof api === "undefined" || !localStorage.getItem("access_token")) return;

  try {
    const meRes = await api.get("/user/me");
    const meData = meRes?.data || meRes || {};
    currentUserInfo.id = meData.id || null;
    currentUserInfo.username = meData.username || "";
    currentUserInfo.displayName = meData.username || "";
    currentUserInfo.avatar = buildDiceBearAvatar(currentUserInfo.username);

    try {
      const profRes = await api.get("/api/profiles/me");
      const prof = profRes?.data || profRes || {};
      if (prof.display_name) currentUserInfo.displayName = prof.display_name;
      if (prof.avatar) currentUserInfo.avatar = resolveAvatarUrl(prof.avatar, currentUserInfo.username);
    } catch (_) {
      // Tài khoản mới chưa tạo hồ sơ (404) -> dùng username & avatar DiceBear theo username thật
    }

    const nameStrong = document.querySelector("#avatar-dropdown-menu .fc-avatar-dropdown-header strong");
    if (nameStrong) {
      nameStrong.textContent = currentUserInfo.displayName || currentUserInfo.username;
    }
    const selfAvatarImg = document.querySelector(".fc-self-avatar");
    if (selfAvatarImg && currentUserInfo.avatar) {
      selfAvatarImg.src = currentUserInfo.avatar;
      selfAvatarImg.alt = currentUserInfo.displayName || currentUserInfo.username;
    }
  } catch (err) {
    console.error("[Friends] Không lấy được thông tin /user/me:", err);
  }
}

// Tải dữ liệu thật cho cả 5 tab từ Backend (Không dùng dữ liệu giả)
async function loadAllFriendsData() {
  if (typeof api === "undefined" || !localStorage.getItem("access_token")) return;

  isLoadingData = true;
  renderPlayerList();

  const [friendsRes, receivedRes, sentRes, suggestionsRes, blocksRes] = await Promise.allSettled([
    api.get("/friend-requests/friends"),
    api.get("/friend-requests/received", { status: "PENDING" }),
    api.get("/friend-requests/sent", { status: "PENDING" }),
    api.get("/friend-requests/suggestions"),
    api.get("/friend-requests/blocks")
  ]);

  const extractArray = (settled, nestedKey) => {
    if (settled.status !== "fulfilled" || !settled.value) return [];
    const val = settled.value;
    if (nestedKey && Array.isArray(val?.data?.[nestedKey])) return val.data[nestedKey];
    if (nestedKey && Array.isArray(val?.[nestedKey])) return val[nestedKey];
    if (Array.isArray(val?.data)) return val.data;
    if (Array.isArray(val)) return val;
    return [];
  };

  MOCK_DATA.friends = extractArray(friendsRes).map((item) => mapBackendPlayerToCard(item, "friends"));
  MOCK_DATA.received = extractArray(receivedRes).map((item) => mapBackendPlayerToCard(item, "received"));
  MOCK_DATA.sent = extractArray(sentRes).map((item) => mapBackendPlayerToCard(item, "sent"));
  MOCK_DATA.suggestions = extractArray(suggestionsRes, "suggestions").map((item) => mapBackendPlayerToCard(item, "suggestions"));
  MOCK_DATA.blocked = extractArray(blocksRes).map((item) => mapBackendPlayerToCard(item, "blocked"));

  isLoadingData = false;
  renderPlayerList();
}

// Mở hộp hồ sơ thật + gọi GET /friend-requests/mutual-friends/{targetUserId}
async function openProfile(player) {
  modalPendingId = player.id;
  const targetUserId = player.userId || player.id;
  const roleBadges = player.roles.map((r) => `<span class="fc-role-tag">${escapeHtml(r)}</span>`).join("");
  const mutual = getMutualCount(player);
  const gameLogo = GAME_LOGOS[player.game]
    ? `<img src="${GAME_LOGOS[player.game]}" alt="${escapeHtml(player.game)}" class="fc-row-game-logo">`
    : "";

  openModal(`
    <div class="fc-modal-head">
      <img src="${player.avatar}" alt="${escapeHtml(player.name)}" class="fc-modal-avatar">
      <div>
        <h3>${escapeHtml(player.name)} ${renderVerifiedBadge(player)}</h3>
        <p id="fc-profile-mutual-line">${escapeHtml(player.tag)}${mutual > 0 ? ` · ${mutual} bạn chung` : " · 0 bạn chung"}</p>
      </div>
    </div>

    <div class="fc-profile-block">
      <span class="fc-profile-label">Game chính</span>
      <div class="fc-game-main">${gameLogo}<span>${escapeHtml(player.game)}</span>${renderGameHeaderBadge(player)}</div>
      ${roleBadges ? `<div class="fc-role-tags">${roleBadges}</div>` : ""}
    </div>

    <div class="fc-profile-block">
      <span class="fc-profile-label">Mức rank</span>
      <div class="fc-player-rank">
        ${renderRankBadgeColumn(player)}
        <div class="fc-rank-info">
          <span class="fc-rank-title">${escapeHtml(player.rankName)}</span>
          ${player.elo ? `<span class="fc-rank-elo">${escapeHtml(player.elo)}</span>` : ""}
        </div>
      </div>
    </div>

    <div class="fc-modal-actions">
      <button type="button" class="fc-btn fc-btn-secondary" data-modal-close>Đóng</button>
      <button type="button" class="fc-btn fc-btn-danger-ghost" data-modal-block-profile>Chặn</button>
    </div>
  `);

  try {
    const res = await api.get(`/friend-requests/mutual-friends/${targetUserId}`);
    const data = res?.data || res;
    if (data && typeof data.mutual_friends_count === "number") {
      player.mutualFriends = data.mutual_friends_count;
      const names = Array.isArray(data.mutual_friends)
        ? data.mutual_friends.slice(0, 3).map((u) => u.display_name || u.username).join(", ")
        : "";
      const lineEl = document.getElementById("fc-profile-mutual-line");
      if (lineEl) {
        const suffix = data.mutual_friends_count > 0
          ? ` · ${data.mutual_friends_count} bạn chung${names ? ` (${names})` : ""}`
          : " · 0 bạn chung";
        lineEl.textContent = `${player.tag}${suffix}`;
      }
    }
  } catch (_) {}
}

// Chặn người dùng thật: POST /friend-requests/blocks/{targetUserId}
async function blockPlayer(id) {
  const existing = findPlayerAnywhere(id);
  const targetUserId = existing ? (existing.userId || existing.id) : id;
  const targetName = existing ? existing.name : `#${targetUserId}`;

  try {
    await api.post(`/friend-requests/blocks/${targetUserId}`);
    showFcToast(`🚫 Đã chặn ${targetName}`);
    await loadAllFriendsData();
  } catch (err) {
    showFcToast(`⚠️ ${err?.message || "Không thể chặn người dùng này"}`);
  }
}

// Bỏ chặn người dùng thật: DELETE /friend-requests/blocks/{targetUserId}
async function unblockPlayer(id) {
  const existing = MOCK_DATA.blocked.find((x) => x.id === id || x.userId === id);
  const targetUserId = existing ? (existing.userId || existing.id) : id;
  const targetName = existing ? existing.name : `#${targetUserId}`;

  try {
    await api.delete(`/friend-requests/blocks/${targetUserId}`);
    showFcToast(`✅ Đã bỏ chặn ${targetName}`);
    await loadAllFriendsData();
  } catch (err) {
    showFcToast(`⚠️ ${err?.message || "Không thể bỏ chặn người dùng này"}`);
  }
}

function initBlockUi() {
  const list = document.getElementById("players-list-container");
  list.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-more-toggle]");
    if (!toggle) return;
    e.stopPropagation();
    const wrap = toggle.closest(".fc-more-wrap");
    const willOpen = !wrap.classList.contains("is-open");
    closeAllMoreMenus();
    wrap.classList.toggle("is-open", willOpen);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".fc-more-wrap")) closeAllMoreMenus();
  });

  const modalRoot = document.getElementById("fc-modal");
  if (!modalRoot) return;

  modalRoot.addEventListener("click", (e) => {
    if (e.target === modalRoot || e.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }
    if (e.target.closest("[data-modal-confirm-block]")) {
      const id = modalPendingId;
      closeModal();
      if (id !== null) blockPlayer(id);
      return;
    }
    if (e.target.closest("[data-modal-block-profile]")) {
      const p = findPlayerAnywhere(modalPendingId);
      if (p) openBlockConfirm(p);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalRoot.hidden) closeModal();
  });
}

function switchTab(tabName) {
  if (!TAB_CONFIG[tabName]) return;
  currentTab = tabName;
  currentPage = 1;

  document.querySelectorAll(".fc-tab-btn").forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  renderPlayerList();
}

// Xử lý sự kiện nút bấm trên từng hàng người chơi — gọi thẳng API Backend và reload dữ liệu thật
async function handlePlayerAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === "view-profile") {
    closeAllMoreMenus();
    const p = findPlayerAnywhere(id);
    if (p) openProfile(p);
    return;
  }

  if (action === "block-ask") {
    closeAllMoreMenus();
    const p = findPlayerAnywhere(id);
    if (p) openBlockConfirm(p);
    return;
  }

  if (action === "unblock") {
    await unblockPlayer(id);
    return;
  }

  if (action === "invite") {
    const p = MOCK_DATA.friends.find((x) => x.id === id);
    if (!p) return;
    const friendId = p.userId || p.id;
    try {
      const res = await api.post(`/api/matchmaking/invite/${friendId}`);
      showFcToast(`🎮 ${res?.message || `Đã gửi lời mời vào tổ đội cho ${p.name}`}`);
    } catch (err) {
      showFcToast(`⚠️ ${err?.message || "Không thể gửi lời mời vào đội"}`);
    }
    return;
  }

  if (action === "join-room") {
    const p = MOCK_DATA.friends.find((x) => x.id === id);
    if (!p || !p.roomId) return;
    try {
      await api.post(`/api/matchmaking/join/${p.roomId}`);
      showFcToast(`🚪 Đã tham gia phòng của ${p.name}! Đang chuyển sang sảnh...`);
      setTimeout(() => {
        window.location.href = "quick-match.html?view=lobby";
      }, 500);
    } catch (err) {
      showFcToast(`⚠️ ${err?.message || "Không thể tham gia phòng"}`);
    }
    return;
  }

  if (action === "message") {
    const p = MOCK_DATA.friends.find((x) => x.id === id);
    if (p) showFcToast(`💬 Tính năng nhắn tin với ${p.name} đang được cập nhật`);
    return;
  }

  if (action === "unfriend") {
    const target = MOCK_DATA.friends.find((x) => x.id === id);
    if (!target) return;
    const friendId = target.userId || target.id;
    try {
      await api.delete(`/friend-requests/friends/${friendId}`);
      showFcToast(`Đã hủy kết bạn với ${target.name}`);
      await loadAllFriendsData();
    } catch (err) {
      showFcToast(`⚠️ ${err?.message || "Không thể hủy kết bạn"}`);
    }
    return;
  }

  if (action === "accept") {
    const target = MOCK_DATA.received.find((x) => x.id === id);
    if (!target) return;
    const requestId = target.requestId || target.id;
    try {
      await api.post(`/friend-requests/${requestId}/accept`);
      showFcToast(`✅ Đã chấp nhận lời mời của ${target.name}!`);
      await loadAllFriendsData();
    } catch (err) {
      showFcToast(`⚠️ ${err?.message || "Không thể chấp nhận lời mời"}`);
    }
    return;
  }

  if (action === "reject") {
    const target = MOCK_DATA.received.find((x) => x.id === id);
    if (!target) return;
    const requestId = target.requestId || target.id;
    try {
      await api.post(`/friend-requests/${requestId}/reject`);
      showFcToast(`Đã từ chối lời mời kết bạn từ ${target.name}`);
      await loadAllFriendsData();
    } catch (err) {
      showFcToast(`⚠️ ${err?.message || "Không thể từ chối lời mời"}`);
    }
    return;
  }

  if (action === "cancel-sent") {
    const target = MOCK_DATA.sent.find((x) => x.id === id);
    if (!target) return;
    const requestId = target.requestId || target.id;
    try {
      await api.delete(`/friend-requests/${requestId}`);
      showFcToast(`Đã thu hồi lời mời gửi tới ${target.name}`);
      await loadAllFriendsData();
    } catch (err) {
      showFcToast(`⚠️ ${err?.message || "Không thể thu hồi lời mời"}`);
    }
    return;
  }

  if (action === "add-friend") {
    const target = MOCK_DATA.suggestions.find((x) => x.id === id);
    if (!target) return;
    const receiverId = target.userId || target.id;
    try {
      const res = await api.post("/friend-requests", { receiver_id: receiverId });
      showFcToast(`📨 ${res?.message || `Đã gửi lời mời kết bạn tới ${target.name}`}`);
      await loadAllFriendsData();
    } catch (err) {
      showFcToast(`⚠️ ${err?.message || "Không thể gửi lời mời kết bạn"}`);
    }
    return;
  }

  if (action === "dismiss-suggestion") {
    const idx = MOCK_DATA.suggestions.findIndex((x) => x.id === id);
    if (idx !== -1) {
      MOCK_DATA.suggestions.splice(idx, 1);
      renderPlayerList();
    }
  }
}

// Khởi tạo trang Bạn bè
function initFriendsPage() {
  const savedTheme = localStorage.getItem("gc_friends_theme") || "dark";
  applyTheme(savedTheme);

  const avatarBtn = document.getElementById("btn-avatar-menu");
  const avatarDropdown = document.getElementById("avatar-dropdown-menu");

  if (avatarBtn && avatarDropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarDropdown.hidden = !avatarDropdown.hidden;
    });

    document.querySelectorAll(".fc-theme-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const selected = opt.dataset.setTheme;
        applyTheme(selected);
        avatarDropdown.hidden = true;
        showFcToast(selected === "light" ? "☀️ Đã chuyển sang Chế độ Sáng" : "🌙 Đã chuyển sang Chế độ Tối");
      });
    });

    document.addEventListener("click", (e) => {
      if (!avatarDropdown.hidden && !avatarDropdown.contains(e.target) && e.target !== avatarBtn) {
        avatarDropdown.hidden = true;
      }
    });
  }

  document.querySelectorAll(".fc-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll("[data-quick-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.quickTab));
  });

  const focusSearchBtn = document.getElementById("btn-focus-search");
  const searchInput = document.getElementById("search-player-input");
  if (focusSearchBtn && searchInput) {
    focusSearchBtn.addEventListener("click", () => {
      if (MOCK_DATA.friends.length === 0) {
        switchTab("suggestions");
      }
      searchInput.focus();
    });
  }

  let searchDebounceTimer = null;
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    renderPlayerList();

    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
      if (typeof api === "undefined" || !localStorage.getItem("access_token")) return;
      try {
        const res = await api.get("/friend-requests/suggestions", {
          q: searchQuery.trim(),
          limit: 50
        });
        const rawSuggestions = res?.data?.suggestions || res?.suggestions || res?.data || [];
        if (Array.isArray(rawSuggestions)) {
          MOCK_DATA.suggestions = rawSuggestions.map((item) => mapBackendPlayerToCard(item, "suggestions"));
          renderPlayerList();
        }
      } catch (_) {}
    }, 300);
  });

  const ddGame = document.getElementById("dropdown-game");
  const btnGame = document.getElementById("btn-dropdown-game");
  const menuGame = document.getElementById("menu-dropdown-game");

  const ddStatus = document.getElementById("dropdown-status");
  const btnStatus = document.getElementById("btn-dropdown-status");
  const menuStatus = document.getElementById("menu-dropdown-status");

  function closeAllFilterDropdowns() {
    if (ddGame && menuGame && btnGame) {
      ddGame.classList.remove("is-open");
      menuGame.hidden = true;
      btnGame.setAttribute("aria-expanded", "false");
    }
    if (ddStatus && menuStatus && btnStatus) {
      ddStatus.classList.remove("is-open");
      menuStatus.hidden = true;
      btnStatus.setAttribute("aria-expanded", "false");
    }
  }

  if (btnGame && menuGame && ddGame) {
    btnGame.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = menuGame.hidden;
      closeAllFilterDropdowns();
      if (willOpen) {
        ddGame.classList.add("is-open");
        menuGame.hidden = false;
        btnGame.setAttribute("aria-expanded", "true");
      }
    });

    menuGame.addEventListener("click", (e) => {
      const item = e.target.closest("button[data-filter-game]");
      if (!item) return;
      selectedGame = item.dataset.filterGame;
      currentPage = 1;
      closeAllFilterDropdowns();
      renderPlayerList();
    });
  }

  if (btnStatus && menuStatus && ddStatus) {
    btnStatus.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = menuStatus.hidden;
      closeAllFilterDropdowns();
      if (willOpen) {
        ddStatus.classList.add("is-open");
        menuStatus.hidden = false;
        btnStatus.setAttribute("aria-expanded", "true");
      }
    });

    menuStatus.addEventListener("click", (e) => {
      const item = e.target.closest("button[data-filter-status]");
      if (!item) return;
      selectedStatus = item.dataset.filterStatus;
      currentPage = 1;
      closeAllFilterDropdowns();
      renderPlayerList();
    });
  }

  document.addEventListener("click", (e) => {
    if (ddGame && !ddGame.contains(e.target) && ddStatus && !ddStatus.contains(e.target)) {
      closeAllFilterDropdowns();
    }
  });

  document.getElementById("players-list-container").addEventListener("click", handlePlayerAction);
  initBlockUi();

  const paginationEl = document.getElementById("pagination-container");
  if (paginationEl) {
    paginationEl.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("button[data-page]");
      if (!pageBtn || pageBtn.disabled) return;
      const targetPage = Number(pageBtn.dataset.page);
      if (targetPage && targetPage !== currentPage) {
        currentPage = targetPage;
        renderPlayerList();
        const scrollEl = document.querySelector(".fc-content-scroll");
        if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    paginationEl.addEventListener("change", (e) => {
      if (e.target.id === "page-size-select") {
        pageSize = Number(e.target.value) || 6;
        currentPage = 1;
        renderPlayerList();
      }
    });
  }

  const tabParam = new URLSearchParams(window.location.search).get("tab");
  if (tabParam && TAB_CONFIG[tabParam]) {
    switchTab(tabParam);
  } else {
    renderPlayerList();
  }
  loadCurrentUserProfile();
  loadAllFriendsData();
}

initFriendsPage();
