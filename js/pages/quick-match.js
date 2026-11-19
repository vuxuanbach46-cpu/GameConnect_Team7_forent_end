// Kiểm tra đăng nhập: Người dùng chưa đăng nhập -> chuyển về file index
if (!localStorage.getItem("access_token")) {
  window.location.href = "../index.html";
}

/* ==========================================================
   GameConnect — Trang Tìm đội nhanh (Quick Team Finder)
   100% Dữ liệu thật từ Backend FastAPI qua module `api` (js/api.js)
   Không sử dụng dữ liệu giả (Mock Data).
   ========================================================== */
"use strict";

const QM_IMG = "../assets/images/";

// Lưu ánh xạ dữ liệu thật từ Database (/api/games, /api/user-games/me)
const QM_DB = {
  connected: false,
  gameIdByKey: {},
  keyByGameId: {},
  ranksByKey: {}, // key -> [{ id, rank_name, rank_order }]
  rolesByKey: {}, // key -> [{ id, role_name }]
  myUserGameByKey: {} // key -> UserGameResponse thật của tài khoản đang đăng nhập
};

// =========================================================================
// 1. BỘ ICON RANK TĨNH ĐỂ ÁNH XẠ HIỂN THỊ CHO TỪNG TỰA GAME
// =========================================================================
function qmBuildValorantRanks() {
  const tiers = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal"];
  const list = [];
  tiers.forEach((tier) => {
    [1, 2, 3].forEach((n) => {
      list.push({ name: `${tier} ${n}`, icon: `${QM_IMG}ranks/valorant/${tier}_${n}_Rank.png` });
    });
  });
  list.push({ name: "Radiant", icon: `${QM_IMG}ranks/valorant/Radiant_Rank.png` });
  return list;
}

function qmBuildFaceitRanks() {
  const list = [];
  for (let lv = 1; lv <= 10; lv++) {
    list.push({ name: `FACEIT Level ${lv}`, icon: `${QM_IMG}ranks/faceit/${lv}.svg` });
  }
  list.push({ name: "FACEIT Challenger", icon: `${QM_IMG}ranks/faceit/11.svg` });
  return list;
}

const QM_PREMIER_RANKS = [
  { name: "1.000+ (Xám)", short: "1.000+", min: 1000, icon: `${QM_IMG}ranks/premier/cs-rating-1000-4999-grey.png` },
  { name: "5.000+ (Xanh nhạt)", short: "5.000+", min: 5000, icon: `${QM_IMG}ranks/premier/cs-rating-5000-9999-light-blue.png` },
  { name: "10.000+ (Xanh đậm)", short: "10.000+", min: 10000, icon: `${QM_IMG}ranks/premier/cs-rating-10000-14999-blue.png` },
  { name: "15.000+ (Tím)", short: "15.000+", min: 15000, icon: `${QM_IMG}ranks/premier/cs-rating-15000-19999-purple.png` },
  { name: "20.000+ (Hồng)", short: "20.000+", min: 20000, icon: `${QM_IMG}ranks/premier/cs-rating-20000-24999-pink.png` },
  { name: "25.000+ (Đỏ)", short: "25.000+", min: 25000, icon: `${QM_IMG}ranks/premier/cs-rating-25000-29999-red.png` },
  { name: "30.000+ (Vàng)", short: "30.000+", min: 30000, icon: `${QM_IMG}ranks/premier/cs-rating-30000-plus-yellow.png` }
];

const QM_AOV_RANKS = [
  { name: "Đồng", icon: `${QM_IMG}ranks/aov/bronze.png` },
  { name: "Bạc", icon: `${QM_IMG}ranks/aov/silver.png` },
  { name: "Vàng", icon: `${QM_IMG}ranks/aov/gold.png` },
  { name: "Bạch Kim", icon: `${QM_IMG}ranks/aov/platinum.png` },
  { name: "Kim Cương", icon: `${QM_IMG}ranks/aov/diamond.png` },
  { name: "Tinh Anh", icon: `${QM_IMG}ranks/aov/veteran.png` },
  { name: "Cao Thủ", icon: `${QM_IMG}ranks/aov/master.png` },
  { name: "Chiến Tướng", icon: `${QM_IMG}ranks/aov/conqueror.png` },
  { name: "Thách Đấu", icon: `${QM_IMG}ranks/aov/challenger.png` }
];

const QM_LOL_RANKS = [
  "Sắt", "Đồng", "Bạc", "Vàng", "Bạch Kim", "Lục Bảo", "Kim Cương", "Cao Thủ", "Đại Cao Thủ", "Thách Đấu"
].map((name, i) => ({ name, icon: `${QM_IMG}ranks/lol/${i + 1}.png` }));

const QM_RANKS = {
  valorant: qmBuildValorantRanks(),
  "cs2-faceit": qmBuildFaceitRanks(),
  "cs2-premier": QM_PREMIER_RANKS,
  aov: QM_AOV_RANKS,
  lol: QM_LOL_RANKS,
  tft: QM_LOL_RANKS
};

const QM_GAMES = {
  valorant: {
    name: "Valorant",
    logo: `${QM_IMG}games/valorant.png`,
    roles: ["Duelist", "Initiator", "Controller", "Sentinel"]
  },
  cs2: {
    name: "Counter-Strike 2",
    logo: `${QM_IMG}games/cs2.png`,
    roles: ["AWPer", "Entry", "IGL", "Support", "Lurker"]
  },
  aov: {
    name: "Liên Quân Mobile",
    logo: `${QM_IMG}games/aov.png`,
    roles: ["Top", "Jungle", "Mid", "ADC", "Support"]
  },
  lol: {
    name: "Liên Minh Huyền Thoại",
    logo: `${QM_IMG}games/lol.png`,
    roles: ["Top", "Jungle", "Mid", "ADC", "Support"]
  },
  tft: {
    name: "Đấu Trường Chân Lý",
    logo: `${QM_IMG}games/tft.png`,
    roles: ["Reroll", "Fast 8", "Fast 9", "Flex"]
  }
};

const QM_GAME_ORDER = ["valorant", "cs2", "aov", "lol", "tft"];

// =========================================================================
// 2. DỮ LIỆU THẬT TỪ BACKEND (KHỞI TẠO RỖNG — KHÔNG CÓ DỮ LIỆU GIẢ)
// =========================================================================
function qmDiceBearAvatar(username) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(String(username || "user"))}`;
}

// Thông tin tài khoản thật đang đăng nhập (cập nhật từ GET /user/me & GET /api/profiles/me)
const QM_ME = {
  id: 0,
  username: "",
  name: "Đang tải...",
  avatar: qmDiceBearAvatar("user"),
  verified: null,
  isMe: true
};

// Danh sách bạn bè thật từ GET /friend-requests/friends
const QM_PEOPLE = [];
const QM_RIGHT_FRIENDS = [];

// Danh sách phòng thật từ GET /api/matchmaking/rooms & GET /api/team-posts
const QM_ROOMS = [];

function qmPersonById(id) {
  return QM_PEOPLE.find((p) => Number(p.id) === Number(id));
}

// =========================================================================
// 3. TRẠNG THÁI TRANG
// =========================================================================
const qm = {
  game: "valorant",
  queue: "ranked", // ranked | unrated
  cs2Mode: "faceit", // faceit | premier
  vibe: "tryhard", // tryhard | chill
  mic: false,
  region: "VN", // VN | SEA
  ranges: {}, // lưu Min/Max rank theo từng hệ thống rank
  roles: new Set(), // rỗng = "Tất cả"
  view: "lobby", // lobby | rooms
  searching: false,
  seconds: 0,
  timerId: null,
  pollId: null,
  menuPos: null,
  posted: false,
  myRoom: null,
  lobby: null,
  loadingRooms: false
};

// Vị trí 5 ô: ô giữa (2) là đội trưởng, thứ tự lấp đầy thành viên từ trong ra ngoài
const QM_POSITIONS = [0, 1, 2, 3, 4];
const QM_FILL_ORDER = [1, 3, 0, 4];

// Sảnh mặc định của tôi: chỉ có 1 mình tôi ở ô Đội trưởng giữa, 4 ô xung quanh trống
function qmCreateOwnLobby() {
  return {
    mode: "own",
    roomId: null,
    gameCode: null,
    leader: QM_ME,
    config: null,
    members: {},
    pending: {},
    need: {}
  };
}

// =========================================================================
// 4. HÀM TIỆN ÍCH & ÁNH XẠ RANK
// =========================================================================
function qmEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function qmCtxKey() {
  if (qm.game === "cs2") return `cs2-${qm.cs2Mode}`;
  return qm.game;
}

function qmRanks() {
  return QM_RANKS[qmCtxKey()];
}

// Tìm vị trí icon rank tương ứng với tên rank thật trong DB
function qmMatchRankIdxByName(ctxKey, rankName) {
  if (!rankName) return -1;
  const ranks = QM_RANKS[ctxKey] || [];
  const lower = String(rankName).trim().toLowerCase();

  let idx = ranks.findIndex((r) => r.name.toLowerCase() === lower);
  if (idx !== -1) return idx;

  idx = ranks.findIndex((r) => r.name.toLowerCase().includes(lower) || lower.includes(r.name.toLowerCase()));
  if (idx !== -1) return idx;

  // Hỗ trợ tiếng Việt -> tiếng Anh cho Valorant / LoL / AOV / CS2
  const aliasPairs = [
    ["sắt", "iron"],
    ["đồng", "bronze"],
    ["bạc", "silver"],
    ["vàng", "gold"],
    ["bạch kim", "platinum"],
    ["lục bảo", "emerald"],
    ["kim cương", "diamond"],
    ["thăng hoa", "ascendant"],
    ["bất tử", "immortal"],
    ["tinh anh", "veteran"],
    ["cao thủ", "master"],
    ["đại cao thủ", "grandmaster"],
    ["chiến tướng", "conqueror"],
    ["thách đấu", "challenger"]
  ];
  for (const [vi, en] of aliasPairs) {
    if (lower.includes(vi) || lower.includes(en)) {
      const hit = ranks.findIndex((r) => {
        const rn = r.name.toLowerCase();
        return rn.includes(vi) || rn.includes(en);
      });
      if (hit !== -1) return hit;
    }
  }
  return -1;
}

function qmRange() {
  const key = qmCtxKey();
  const total = QM_RANKS[key].length;
  if (!qm.ranges[key]) {
    const ug = QM_DB.myUserGameByKey[qm.game];
    const myIdx = ug && ug.rank ? qmMatchRankIdxByName(key, ug.rank.rank_name) : -1;
    if (myIdx >= 0) {
      qm.ranges[key] = { min: Math.max(0, myIdx - 2), max: Math.min(total - 1, myIdx + 2) };
    } else {
      qm.ranges[key] = { min: 0, max: total - 1 };
    }
  }
  return qm.ranges[key];
}

function qmFracToIdx(frac) {
  const total = qmRanks().length;
  return Math.round(Math.max(0, Math.min(1, frac)) * (total - 1));
}

function qmIdxToFrac(idx) {
  const total = qmRanks().length;
  return total > 1 ? idx / (total - 1) : 0;
}

function qmRolesOfGame() {
  const dbRoles = QM_DB.rolesByKey[qm.game];
  if (Array.isArray(dbRoles) && dbRoles.length > 0) {
    return dbRoles.map((r) => r.role_name);
  }
  return QM_GAMES[qm.game].roles;
}

function qmQueueLabel(queue) {
  return queue === "ranked" ? "Ranked" : "Unrated";
}

function qmVibeLabel(vibe) {
  return vibe === "tryhard" ? "Tryhard" : "Chill";
}

function qmShowToast(message) {
  const container = document.getElementById("fc-toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "fc-toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function qmFormatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function qmVerifiedBadge(tier) {
  if (!tier) return "";
  const isGold = tier === "gold";
  const title = isGold ? "Game thủ nổi bật đã xác thực" : "Game thủ đã xác thực";
  const src = isGold ? `${QM_IMG}badges/verified-gold.png` : `${QM_IMG}badges/verified-blue.png`;
  return `<img src="${src}" alt="${title}" title="${title}" class="fc-verified-badge">`;
}

const QM_FLAG_VN = `
  <svg class="qm-flag" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-label="Việt Nam">
    <rect width="30" height="20" fill="#da251d"/>
    <polygon points="15,4 16.76,9.42 22.46,9.42 17.85,12.76 19.61,18.18 15,14.84 10.39,18.18 12.15,12.76 7.54,9.42 13.24,9.42" fill="#ffff00"/>
  </svg>`;

function qmRegionLabel(region) {
  return region === "VN" ? `${QM_FLAG_VN} VN` : "🌏 SEA";
}

const QM_CROWN = `
  <svg width="26" height="20" viewBox="0 0 26 20" fill="currentColor" aria-label="Đội trưởng">
    <path d="M2 17 0.5 5.5 7 10.5 13 2l6 8.5 6.5-5L24 17z"/>
    <rect x="2" y="18" width="22" height="2" rx="1"/>
  </svg>`;

function qmPremierPalette(score) {
  if (score >= 30000) return { bar: "#ffd700", bg1: "#6b5300", bg2: "#2e2300", stripe: "#b89000", text: "#ffe766" };
  if (score >= 25000) return { bar: "#eb4b4b", bg1: "#5e1919", bg2: "#290a0a", stripe: "#9e2a2a", text: "#ff8080" };
  if (score >= 20000) return { bar: "#d32ce6", bg1: "#521259", bg2: "#240729", stripe: "#8f1d9c", text: "#f58aff" };
  if (score >= 15000) return { bar: "#8847ff", bg1: "#341b66", bg2: "#160a2e", stripe: "#5b2eb0", text: "#bca0ff" };
  if (score >= 10000) return { bar: "#4b69ff", bg1: "#1c2866", bg2: "#0b102e", stripe: "#3246ad", text: "#99acff" };
  if (score >= 5000) return { bar: "#5e98d9", bg1: "#223852", bg2: "#0e1824", stripe: "#3b628f", text: "#a8d0ff" };
  return { bar: "#b0c3d9", bg1: "#3b424a", bg2: "#1b1e21", stripe: "#636e7a", text: "#dce8f5" };
}

function qmPremierBadge(score) {
  const num = Number(score) || 0;
  const pal = qmPremierPalette(num);
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
      <span class="fc-premier-score-text" style="color: ${pal.text};">${thousands}<small>,${remainder}</small></span>
    </div>`;
}

// Hiển thị Rank của người chơi trong ô sảnh (Dùng đúng dữ liệu thật từ DB)
function qmRankBlock(person, big) {
  const ctxKey = qmCtxKey();
  const ranks = qmRanks();

  if (person.isMe) {
    const myUg = QM_DB.myUserGameByKey[qm.game];
    if (!myUg || !myUg.rank || !myUg.rank.rank_name) {
      return `
        <div class="qm-slot-rank">
          <span class="qm-slot-rank-name">Chưa khai báo Rank</span>
        </div>`;
    }
    const rName = myUg.rank.rank_name;
    const idx = qmMatchRankIdxByName(ctxKey, rName);
    const rankObj = idx >= 0 ? ranks[idx] : ranks[0];
    return `
      <div class="qm-slot-rank">
        <img src="${rankObj.icon}" alt="${qmEsc(rName)}" class="qm-slot-rank-icon" ${big ? 'style="width:56px;height:56px;"' : ""}>
        <span class="qm-slot-rank-name">${qmEsc(rName)}</span>
      </div>`;
  }

  if (!person.rankName) {
    return `
      <div class="qm-slot-rank">
        <span class="qm-slot-rank-name">Chưa xếp hạng</span>
      </div>`;
  }

  const idx = qmMatchRankIdxByName(ctxKey, person.rankName);
  const icon = person.rankIcon || (idx >= 0 ? ranks[idx].icon : "");
  return `
    <div class="qm-slot-rank">
      ${icon ? `<img src="${icon}" alt="${qmEsc(person.rankName)}" class="qm-slot-rank-icon" ${big ? 'style="width:56px;height:56px;"' : ""}>` : ""}
      <span class="qm-slot-rank-name">${qmEsc(person.rankName)}</span>
    </div>`;
}

function qmLobbyMemberCount() {
  return 1 + Object.keys(qm.lobby.members).length;
}

// =========================================================================
// 5. RENDER BANNER (3 KHỐI) — HIỂN THỊ ĐÚNG HỒ SƠ RANK THẬT CỦA TÀI KHOẢN
// =========================================================================
function qmRenderGameDropdown() {
  const game = QM_GAMES[qm.game];
  document.getElementById("label-dd-game").innerHTML = `
    <img src="${game.logo}" alt="${qmEsc(game.name)}" class="qm-dd-logo">
    <span>${qmEsc(game.name)}</span>`;

  document.getElementById("menu-dd-game").innerHTML = QM_GAME_ORDER.map((key) => {
    const g = QM_GAMES[key];
    const active = key === qm.game;
    return `
      <button type="button" class="fc-dropdown-item ${active ? "active" : ""}" data-game="${key}">
        <span class="fc-dropdown-item-left">
          <img src="${g.logo}" alt="${qmEsc(g.name)}" class="qm-dd-logo">
          <span>${qmEsc(g.name)}</span>
        </span>
        <span class="fc-dropdown-item-right"><span class="fc-dd-check">${active ? "✓" : ""}</span></span>
      </button>`;
  }).join("");
}

function qmRenderMeRank() {
  const key = qmCtxKey();
  const ranks = qmRanks();
  const myUg = QM_DB.myUserGameByKey[qm.game];
  const gameObj = QM_GAMES[qm.game];

  // Nếu người dùng chưa khai báo rank cho tựa game này trong DB (/api/user-games/me)
  if (!myUg || !myUg.rank || !myUg.rank.rank_name) {
    document.getElementById("qm-me-rank").innerHTML = `
      <div class="qm-me-top">
        <img src="${gameObj.logo}" alt="${qmEsc(gameObj.name)}" class="qm-me-icon" style="opacity:0.45;">
        <div class="qm-me-info">
          <span class="qm-me-name">Chưa khai báo Rank</span>
          <span class="qm-me-points">${myUg && myUg.in_game_id ? `ID trong game: ${qmEsc(myUg.in_game_id)}` : "Bạn chưa cập nhật hồ sơ cho tựa game này"}</span>
          <span class="qm-me-region">Tài khoản: ${qmEsc(QM_ME.name)}</span>
        </div>
      </div>
      <div class="qm-progress">
        <div class="qm-progress-bar"><div class="qm-progress-fill" style="width:0%"></div></div>
        <div class="qm-progress-text">
          <span>Cập nhật hồ sơ game để đồng bộ Rank của bạn</span>
          <strong>0%</strong>
        </div>
      </div>`;
    return;
  }

  const rName = myUg.rank.rank_name;
  const idx = qmMatchRankIdxByName(key, rName);
  const rankIdx = idx >= 0 ? idx : 0;
  const rank = ranks[rankIdx];
  const nextRank = ranks[rankIdx + 1];
  const progressPct = ranks.length > 1 ? Math.round(((rankIdx + 1) / ranks.length) * 100) : 100;
  const roleText = myUg.role && myUg.role.role_name ? `Vị trí chính: ${myUg.role.role_name}` : "Đã khai báo hồ sơ game";
  const inGameText = myUg.in_game_id ? `In-game ID: ${myUg.in_game_id}` : `Tài khoản: ${QM_ME.name}`;

  const progressText = nextRank
    ? `Bậc tiếp theo: <strong>${qmEsc(nextRank.name)}</strong>`
    : "Bạn đang ở bậc rank cao nhất";

  document.getElementById("qm-me-rank").innerHTML = `
    <div class="qm-me-top">
      <img src="${rank.icon}" alt="${qmEsc(rName)}" class="qm-me-icon">
      <div class="qm-me-info">
        <span class="qm-me-name">${qmEsc(rName)}</span>
        <span class="qm-me-points">${qmEsc(roleText)}</span>
        <span class="qm-me-region">${qmEsc(inGameText)}</span>
      </div>
    </div>
    <div class="qm-progress">
      <div class="qm-progress-bar"><div class="qm-progress-fill" style="width:${progressPct}%"></div></div>
      <div class="qm-progress-text">
        <span>${progressText}</span>
        <strong>${progressPct}%</strong>
      </div>
    </div>`;
}

function qmRenderModeButtons() {
  document.querySelectorAll("[data-queue]").forEach((b) => b.classList.toggle("active", b.dataset.queue === qm.queue));
  document.querySelectorAll("[data-cs2mode]").forEach((b) => b.classList.toggle("active", b.dataset.cs2mode === qm.cs2Mode));
  document.querySelectorAll("[data-vibe]").forEach((b) => b.classList.toggle("active", b.dataset.vibe === qm.vibe));
  document.querySelectorAll("[data-region]").forEach((b) => b.classList.toggle("active", b.dataset.region === qm.region));

  const micBtn = document.getElementById("btn-toggle-mic");
  micBtn.setAttribute("aria-pressed", qm.mic ? "true" : "false");

  document.getElementById("field-cs2-mode").hidden = !(qm.game === "cs2" && qm.queue === "ranked");
}

function qmRankDropdownLabel(rank) {
  return `
    <img src="${rank.icon}" alt="${qmEsc(rank.name)}" class="qm-dd-rank-icon">
    <span class="qm-dd-rank-name">${qmEsc(rank.name)}</span>`;
}

function qmRenderRankDropdowns() {
  const ranks = qmRanks();
  const range = qmRange();

  document.getElementById("label-dd-min").innerHTML = qmRankDropdownLabel(ranks[range.min]);
  document.getElementById("label-dd-max").innerHTML = qmRankDropdownLabel(ranks[range.max]);

  const buildMenu = (which, selectedIdx) =>
    ranks
      .map((rank, idx) => {
        const active = idx === selectedIdx;
        return `
          <button type="button" class="fc-dropdown-item ${active ? "active" : ""}" data-rank-which="${which}" data-rank-idx="${idx}">
            <span class="fc-dropdown-item-left">${qmRankDropdownLabel(rank)}</span>
            <span class="fc-dropdown-item-right"><span class="fc-dd-check">${active ? "✓" : ""}</span></span>
          </button>`;
      })
      .join("");

  document.getElementById("menu-dd-min").innerHTML = buildMenu("min", range.min);
  document.getElementById("menu-dd-max").innerHTML = buildMenu("max", range.max);
}

function qmRenderRoleChips() {
  const roles = qmRolesOfGame();
  const allActive = qm.roles.size === 0;
  const chips = [
    `<button type="button" class="qm-role-chip ${allActive ? "active" : ""}" data-role="__ALL__">Tất cả</button>`,
    ...roles.map(
      (r) => `<button type="button" class="qm-role-chip ${qm.roles.has(r) ? "active" : ""}" data-role="${qmEsc(r)}">${qmEsc(r)}</button>`
    )
  ];
  document.getElementById("qm-role-chips").innerHTML = chips.join("");
}

function qmRenderBanner() {
  qmRenderGameDropdown();
  qmRenderMeRank();
  qmRenderModeButtons();
  qmRenderRankDropdowns();
  qmRenderRoleChips();
}

// =========================================================================
// 6. RENDER MATCH BAR (TÓM TẮT CẤU HÌNH)
// =========================================================================
function qmRenderSummary() {
  const game = QM_GAMES[qm.game];
  const ranks = qmRanks();
  const range = qmRange();
  const chips = [];

  chips.push(`<span class="qm-chip is-accent">${qmQueueLabel(qm.queue)}</span>`);
  if (qm.game === "cs2" && qm.queue === "ranked") {
    chips.push(`<span class="qm-chip">${qm.cs2Mode === "faceit" ? "FACEIT" : "Premier"}</span>`);
  }
  chips.push(`<span class="qm-chip">${qmVibeLabel(qm.vibe)}</span>`);
  if (qm.mic) chips.push(`<span class="qm-chip">🎤 Mic</span>`);
  chips.push(`<span class="qm-chip">${qmRegionLabel(qm.region)}</span>`);
  chips.push(`
    <span class="qm-range-group">
      <span class="qm-chip"><img src="${ranks[range.min].icon}" alt="">${qmEsc(ranks[range.min].name)}</span>
      <span class="qm-sum-arrow">➔</span>
      <span class="qm-chip"><img src="${ranks[range.max].icon}" alt="">${qmEsc(ranks[range.max].name)}</span>
    </span>`);

  document.getElementById("qm-summary").innerHTML = `
    <img src="${game.logo}" alt="${qmEsc(game.name)}" class="qm-sum-game" title="${qmEsc(game.name)}">
    ${chips.join("")}`;
}

function qmRenderSearchState() {
  const findBtn = document.getElementById("btn-find-match");
  const cancelBtn = document.getElementById("btn-cancel-search");
  const status = document.getElementById("qm-search-status");
  const label = document.getElementById("qm-queue-label");

  findBtn.disabled = qm.searching;
  findBtn.textContent = qm.searching ? "ĐANG TÌM ĐỘI..." : "TÌM ĐỘI NHANH (FIND MATCH)";
  cancelBtn.hidden = !qm.searching;
  status.hidden = !qm.searching;
  label.classList.toggle("is-searching", qm.searching);
  document.getElementById("qm-timer").textContent = qmFormatTime(qm.seconds);

  const postBtn = document.getElementById("btn-post-room");
  postBtn.textContent = qm.posted ? "GỠ BÀI TUYỂN NGƯỜI" : "ĐĂNG PHÒNG TUYỂN NGƯỜI";
  postBtn.classList.toggle("is-posted", qm.posted);
}

// =========================================================================
// 7. RENDER SẢNH 5 Ô (100% THÀNH VIÊN THẬT TỪ BACKEND)
// =========================================================================
function qmLobbyConfig() {
  if (qm.lobby.mode === "joined" && qm.lobby.config) return qm.lobby.config;
  return { queue: qm.queue, vibe: qm.vibe, mic: qm.mic, region: qm.region };
}

function qmRenderLeaderSlot() {
  const lobby = qm.lobby;
  const leader = lobby.leader;
  const cfg = qmLobbyConfig();

  return `
    <div class="qm-slot is-leader" data-pos="2">
      <span class="qm-crown">${QM_CROWN}</span>
      <img src="${leader.avatar}" alt="${qmEsc(leader.name)}" class="qm-slot-avatar">
      <div class="qm-slot-name">
        <span>${qmEsc(leader.name)}</span>
        ${qmVerifiedBadge(leader.verified)}
        ${QM_FLAG_VN}
      </div>
      ${qmRankBlock(leader, true)}
      <div class="qm-slot-tags">
        <span class="fc-role-tag">${qmQueueLabel(cfg.queue)}</span>
        <span class="fc-role-tag">${qmVibeLabel(cfg.vibe)}</span>
        <span class="fc-role-tag">${cfg.mic ? "Mic On" : "Mic Off"}</span>
      </div>
    </div>`;
}

function qmRenderMemberSlot(pos, member) {
  const person = member.person;
  const roles = Array.isArray(person.roles) && person.roles.length > 0 ? person.roles : [];
  const canRemove = qm.lobby.mode === "own" || person.isMe;
  const displayName = person.isMe ? `Bạn (${person.name})` : person.name;

  return `
    <div class="qm-slot" data-pos="${pos}">
      ${canRemove ? `<button type="button" class="qm-slot-remove" data-action="remove" data-pos="${pos}" title="${person.isMe ? "Rời phòng" : "Xóa khỏi đội"}">×</button>` : ""}
      <img src="${person.avatar}" alt="${qmEsc(person.name)}" class="qm-slot-avatar">
      <div class="qm-slot-name">
        <span>${qmEsc(displayName)}</span>
        ${qmVerifiedBadge(person.verified)}
      </div>
      ${qmRankBlock(person, false)}
      ${roles.length ? `<div class="qm-slot-tags">${roles.map((r) => `<span class="fc-role-tag">${qmEsc(r)}</span>`).join("")}</div>` : ""}
    </div>`;
}

function qmRenderPendingSlot(pos, person) {
  return `
    <div class="qm-slot is-pending" data-pos="${pos}">
      <span class="qm-spinner"></span>
      <div class="qm-slot-pending-text">Đã mời ${qmEsc(person.name)}...</div>
    </div>`;
}

function qmRenderSlotMenu(pos) {
  const lobby = qm.lobby;
  const inLobbyIds = new Set([
    Number(lobby.leader.id),
    ...Object.values(lobby.members).map((m) => Number(m.person.id)),
    ...Object.values(lobby.pending).map((p) => Number(p.id))
  ]);
  const friends = QM_PEOPLE.filter((p) => !inLobbyIds.has(Number(p.id)));

  const friendHtml = friends.length
    ? friends
        .map(
          (p) => `
        <button type="button" class="qm-menu-friend" data-action="invite" data-pos="${pos}" data-person="${p.id}">
          <img src="${p.avatar}" alt="">
          <span class="qm-menu-friend-name">${qmEsc(p.name)}</span>
          <span class="qm-menu-friend-state ${p.status === "room" ? "is-room" : ""}">${p.status === "room" ? "Trong phòng" : "Online"}</span>
        </button>`
        )
        .join("")
    : `<div class="qm-slot-empty-text" style="padding:6px 4px;">Chưa có bạn bè để mời</div>`;

  const roles = qmRolesOfGame();
  const currentNeed = lobby.need[pos];
  const roleHtml = `
    <div class="qm-menu-roles">
      ${roles
        .map(
          (r) => `<button type="button" class="qm-role-chip ${currentNeed === r ? "active" : ""}" data-action="set-need" data-pos="${pos}" data-role="${qmEsc(r)}">${qmEsc(r)}</button>`
        )
        .join("")}
      ${currentNeed ? `<button type="button" class="qm-role-chip" data-action="clear-need" data-pos="${pos}">Bỏ yêu cầu</button>` : ""}
    </div>`;

  return `
    <div class="qm-slot-menu">
      <div class="qm-slot-menu-label">Mời bạn bè đang Online</div>
      <div class="qm-menu-friends">${friendHtml}</div>
      <div class="qm-slot-menu-divider"></div>
      <div class="qm-slot-menu-label">Đặt vị trí cần tuyển cho ô này</div>
      ${roleHtml}
      <button type="button" class="fc-btn fc-btn-danger-ghost qm-menu-close" data-action="close-menu">Đóng</button>
    </div>`;
}

function qmRenderEmptySlot(pos) {
  const need = qm.lobby.need[pos];
  const canAdd = qm.lobby.mode === "own";
  return `
    <div class="qm-slot is-empty" data-pos="${pos}">
      ${
        canAdd
          ? `<button type="button" class="qm-slot-add" data-action="add" data-pos="${pos}" aria-label="Thêm thành viên">+</button>`
          : `<div class="qm-slot-add" style="cursor:default;pointer-events:none;">+</div>`
      }
      <div class="qm-slot-empty-text">Ô trống</div>
      ${need ? `<span class="qm-slot-need">Cần: ${qmEsc(need)}</span>` : ""}
      ${qm.menuPos === pos && canAdd ? qmRenderSlotMenu(pos) : ""}
    </div>`;
}

function qmRenderLobby() {
  const lobby = qm.lobby;
  const slotsEl = document.getElementById("qm-slots");

  slotsEl.innerHTML = QM_POSITIONS.map((pos) => {
    if (pos === 2) return qmRenderLeaderSlot();
    if (lobby.members[pos]) return qmRenderMemberSlot(pos, lobby.members[pos]);
    if (lobby.pending[pos]) return qmRenderPendingSlot(pos, lobby.pending[pos]);
    return qmRenderEmptySlot(pos);
  }).join("");

  const count = qmLobbyMemberCount();
  document.getElementById("qm-lobby-count").textContent = `${count}/5 người`;
  document.getElementById("qm-right-party-count").textContent = count;

  const isJoined = lobby.mode === "joined";
  const hasRealRoom = Boolean(lobby.roomId);
  const codeSuffix = lobby.gameCode && !String(lobby.gameCode).includes("*") ? ` · Mã phòng: ${lobby.gameCode}` : "";
  document.getElementById("qm-lobby-title").textContent = isJoined
    ? `Phòng của ${lobby.leader.name}${codeSuffix}`
    : `Sảnh đội của bạn (${QM_ME.name})${codeSuffix}`;
  document.getElementById("btn-leave-lobby").hidden = !(isJoined || (hasRealRoom && count > 1));
}

// =========================================================================
// 8. DANH SÁCH PHÒNG ĐANG MỞ (KẾT HỢP /api/matchmaking/rooms & /api/team-posts)
// =========================================================================
function qmRoomRankRange(room) {
  const ranks = qmRanks();
  const a = qmFracToIdx(room.min);
  const b = qmFracToIdx(room.max);
  return { lo: Math.min(a, b), hi: Math.max(a, b), ranks };
}

function qmRoomMatches(room) {
  if (room.game !== qm.game) return false;
  if (room.queue && room.queue !== qm.queue) return false;
  if (room.vibe && room.vibe !== qm.vibe) return false;
  if (qm.mic && !room.mic) return false;
  if (qm.region === "VN" && room.region && room.region !== "VN") return false;
  if (qm.roles.size > 0 && room.needs.length > 0 && !room.needs.some((r) => qm.roles.has(r))) return false;

  const range = qmRange();
  const { lo, hi } = qmRoomRankRange(room);
  return lo <= range.max && hi >= range.min;
}

function qmGetFilteredRooms() {
  return QM_ROOMS.filter(qmRoomMatches);
}

function qmRenderRoomRow(room) {
  const game = QM_GAMES[room.game] || QM_GAMES.valorant;
  const { lo, hi, ranks } = qmRoomRankRange(room);
  const filled = room.filled || 1;
  const maxPlayers = room.maxPlayers || 5;

  const dots = [0, 1, 2, 3, 4].map((i) => `<span class="qm-dot ${i < filled ? "is-filled" : ""}"></span>`).join("");

  const tags = [
    `<span class="fc-role-tag">${qmQueueLabel(room.queue)}</span>`,
    `<span class="fc-role-tag">${qmVibeLabel(room.vibe)}</span>`,
    room.mic ? `<span class="fc-role-tag">🎤 Mic</span>` : "",
    `<span class="fc-role-tag">${qmRegionLabel(room.region || "VN")}</span>`
  ].join("");

  const needsText = room.title
    ? `${room.title}${room.needs.length ? ` · Cần: ${room.needs.join(", ")}` : ""}`
    : (room.needs.length ? `Cần: ${room.needs.join(", ")}` : "Đang tuyển thành viên");

  const button = room.mine
    ? (room.source === "team_post"
        ? `<button type="button" class="fc-btn fc-btn-danger-ghost" data-room-action="unpost" data-post-id="${room.backendPostId}">Gỡ bài</button>`
        : `<button type="button" class="fc-btn fc-btn-secondary" data-room-action="open-my-lobby">Sảnh của bạn</button>`)
    : filled >= maxPlayers
    ? `<button type="button" class="fc-btn fc-btn-secondary" disabled>Đã đầy</button>`
    : `<button type="button" class="fc-btn fc-btn-join" data-room-action="join" data-room-key="${room.key}">+ Tham gia ngay</button>`;

  return `
    <article class="fc-player-row qm-room-row ${room.mine ? "is-mine" : ""}">
      <div class="fc-player-identity">
        <div class="fc-avatar-box">
          <img src="${room.host.avatar}" alt="${qmEsc(room.host.name)}" class="fc-avatar-img" loading="lazy">
          <span class="fc-presence-badge fc-presence-ingame"></span>
        </div>
        <div class="fc-player-meta">
          <div class="fc-player-subhead is-inroom">${room.mine ? "PHÒNG CỦA BẠN" : (room.source === "match_room" ? "SẢNH GHÉP ĐỘI TRỰC TIẾP" : "BÀI ĐĂNG TUYỂN NGƯỜI")}</div>
          <div class="fc-player-name-row">
            <span class="fc-player-name">${qmEsc(room.host.name)}</span>
            ${qmVerifiedBadge(room.host.verified)}
          </div>
          <div class="fc-player-desc">${qmEsc(needsText)}</div>
        </div>
      </div>

      <div class="fc-player-games">
        <div class="qm-room-slots">
          <span class="qm-slot-dots">${dots}</span>
          <span class="qm-room-slots-text">${filled}/${maxPlayers} người</span>
        </div>
        <div class="fc-game-main">
          <img src="${game.logo}" alt="${qmEsc(game.name)}" class="fc-row-game-logo">
          <span>${qmEsc(game.name)}</span>
        </div>
        <div class="qm-room-tags">${tags}</div>
      </div>

      <div class="fc-player-rank">
        <div class="qm-room-range">
          <div class="qm-range-badge">
            <img src="${ranks[lo].icon}" alt="${qmEsc(ranks[lo].name)}">
            <span>${qmEsc(ranks[lo].name)}</span>
          </div>
          <span class="qm-range-sep">➔</span>
          <div class="qm-range-badge">
            <img src="${ranks[hi].icon}" alt="${qmEsc(ranks[hi].name)}">
            <span>${qmEsc(ranks[hi].name)}</span>
          </div>
        </div>
      </div>

      <div class="fc-player-actions">${button}</div>
    </article>`;
}

function qmRenderRooms() {
  const rooms = qmGetFilteredRooms();

  document.getElementById("qm-rooms-count").textContent = rooms.length;
  document.getElementById("qm-rooms-heading").textContent =
    `PHÒNG PHÙ HỢP VỚI BỘ LỌC CỦA BẠN · ${rooms.length} PHÒNG`;

  const listEl = document.getElementById("qm-rooms-list");
  if (rooms.length === 0) {
    listEl.innerHTML = `
      <div class="fc-empty-state">
        <h3>${qm.loadingRooms ? "Đang tải danh sách phòng..." : "Chưa có dữ liệu phòng đang mở"}</h3>
        <p>${qm.loadingRooms ? "Vui lòng chờ giây lát..." : "Hiện chưa có phòng nào khớp bộ lọc trong hệ thống. Bạn có thể bấm “Đăng phòng tuyển người” để mở phòng mới."}</p>
      </div>`;
    return;
  }
  listEl.innerHTML = rooms.map(qmRenderRoomRow).join("");
}

// =========================================================================
// 9. THANH PHẢI: BẠN BÈ THẬT ĐANG ONLINE
// =========================================================================
function qmRenderRightFriends() {
  const el = document.getElementById("qm-right-online");
  if (!el) return;
  if (QM_RIGHT_FRIENDS.length === 0) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = QM_RIGHT_FRIENDS.map((id) => {
    const p = qmPersonById(id);
    if (!p) return "";
    return `
      <button type="button" class="qm-right-friend" data-right-friend="${p.id}" title="${qmEsc(p.name)} — ${p.status === "room" ? "Đang trong phòng" : "Đang online"}">
        <img src="${p.avatar}" alt="${qmEsc(p.name)}">
        <span class="qm-pres ${p.status === "room" ? "is-room" : ""}"></span>
      </button>`;
  }).join("");
}

// =========================================================================
// 10. KẾT NỐI 100% API BACKEND THẬT
// =========================================================================
function qmCanCallApi() {
  return typeof api !== "undefined" && Boolean(localStorage.getItem("access_token"));
}

function qmResolveAvatar(rawAvatar, username) {
  if (rawAvatar && typeof rawAvatar === "string" && rawAvatar.trim()) {
    const trimmed = rawAvatar.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("../")) {
      return trimmed;
    }
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : "http://127.0.0.1:8000";
    return `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }
  return qmDiceBearAvatar(username);
}

function qmDetectGameKey(rawName) {
  const s = String(rawName || "").trim().toLowerCase();
  if (s.includes("valorant")) return "valorant";
  if (s.includes("cs2") || s.includes("counter-strike") || s.includes("counter strike")) return "cs2";
  if (s.includes("liên quân") || s.includes("lien quan") || s.includes("aov") || s.includes("arena of valor")) return "aov";
  if (s.includes("chân lý") || s.includes("chan ly") || s.includes("tft") || s.includes("đtcl") || s.includes("teamfight")) return "tft";
  if (s.includes("liên minh") || s.includes("lien minh") || s.includes("lol") || s.includes("league")) return "lol";
  return null;
}

function qmCurrentGameId() {
  return QM_DB.gameIdByKey[qm.game] || 1;
}

function qmRankIdForUiIndex(gameKey, uiIdx) {
  const dbRanks = QM_DB.ranksByKey[gameKey];
  if (!Array.isArray(dbRanks) || dbRanks.length === 0) return null;
  const uiRanks = QM_RANKS[gameKey === "cs2" ? `cs2-${qm.cs2Mode}` : gameKey] || [];
  const frac = uiRanks.length > 1 ? uiIdx / (uiRanks.length - 1) : 0;
  const dbIdx = Math.min(dbRanks.length - 1, Math.max(0, Math.round(frac * (dbRanks.length - 1))));
  return dbRanks[dbIdx]?.id || null;
}

function qmFracForDbRankId(gameKey, rankId, fallbackFrac) {
  if (!rankId) return fallbackFrac;
  const dbRanks = QM_DB.ranksByKey[gameKey];
  if (!Array.isArray(dbRanks) || dbRanks.length === 0) return fallbackFrac;
  const idx = dbRanks.findIndex((r) => Number(r.id) === Number(rankId));
  if (idx === -1) return fallbackFrac;
  return dbRanks.length > 1 ? idx / (dbRanks.length - 1) : fallbackFrac;
}

function qmRoleIdsForNames(gameKey, roleNames) {
  const dbRoles = QM_DB.rolesByKey[gameKey];
  if (!Array.isArray(dbRoles) || dbRoles.length === 0) return [];
  const wanted = (roleNames || []).map((n) => String(n).toLowerCase());
  return dbRoles
    .filter((r) => wanted.some((w) => String(r.role_name || "").toLowerCase().includes(w) || w.includes(String(r.role_name || "").toLowerCase())))
    .map((r) => r.id);
}

function qmRoleNamesForIds(gameKey, roleIds) {
  const dbRoles = QM_DB.rolesByKey[gameKey];
  if (!Array.isArray(dbRoles) || !Array.isArray(roleIds) || roleIds.length === 0) return [];
  const idSet = new Set(roleIds.map((x) => Number(x)));
  return dbRoles.filter((r) => idSet.has(Number(r.id))).map((r) => r.role_name);
}

function qmBuildLabelString() {
  if (qm.queue === "unrated") return "Unrank";
  return qm.vibe === "tryhard" ? "Hard rank" : "Chill rank";
}

function qmParseRoomLabel(rawLabel) {
  const s = String(rawLabel || "").trim().toUpperCase();
  if (s === "THUONG" || s.includes("UNRANK") || s.includes("UNRATED") || s.includes("THƯỜNG")) {
    return { queue: "unrated", vibe: "chill" };
  }
  if (s === "CHILL_RANK" || s.includes("CHILL") || s === "KHONG_TOXIC") {
    return { queue: "ranked", vibe: "chill" };
  }
  if (s === "HARD_RANK" || s.includes("HARD") || s.includes("TRYHARD")) {
    return { queue: "ranked", vibe: "tryhard" };
  }
  return { queue: qm.queue, vibe: qm.vibe };
}

// Áp dụng dữ liệu MatchRoomOut thật từ Backend vào sảnh 5 ô
function qmApplyBackendRoomToLobby(roomData) {
  if (!roomData || !Array.isArray(roomData.members) || roomData.members.length === 0) return;

  const gameKey = QM_DB.keyByGameId[roomData.game_id] || qmDetectGameKey(roomData.game_name) || qm.game;
  if (gameKey && QM_GAMES[gameKey]) {
    qm.game = gameKey;
  }

  const hostMember = roomData.members.find((m) => m.is_host) || roomData.members[0];
  const myId = Number(QM_ME.id);
  const isMyHost = Boolean(
    (myId > 0 && Number(roomData.host_id) === myId) ||
    (hostMember && hostMember.username === QM_ME.username)
  );

  const leaderPerson = isMyHost
    ? QM_ME
    : {
        id: Number(hostMember.user_id),
        name: hostMember.display_name || hostMember.username || `User#${hostMember.user_id}`,
        avatar: qmResolveAvatar(hostMember.avatar, hostMember.username),
        verified: hostMember.rank_name ? "gold" : null,
        rankName: hostMember.rank_name || null,
        rankIcon: hostMember.rank_icon || null,
        roles: Array.isArray(hostMember.roles) ? hostMember.roles : []
      };

  const otherMembers = roomData.members.filter((m) => Number(m.user_id) !== Number(hostMember.user_id));
  const membersMap = {};
  QM_FILL_ORDER.slice(0, otherMembers.length).forEach((pos, idx) => {
    const m = otherMembers[idx];
    const isMeMember = (myId > 0 && Number(m.user_id) === myId) || m.username === QM_ME.username;
    membersMap[pos] = {
      person: isMeMember
        ? QM_ME
        : {
            id: Number(m.user_id),
            name: m.display_name || m.username || `User#${m.user_id}`,
            avatar: qmResolveAvatar(m.avatar, m.username),
            verified: m.rank_name ? "blue" : null,
            rankName: m.rank_name || null,
            rankIcon: m.rank_icon || null,
            roles: Array.isArray(m.roles) ? m.roles : []
          }
    };
  });

  const parsedLabel = qmParseRoomLabel(roomData.label);

  qm.lobby = {
    mode: isMyHost ? "own" : "joined",
    roomId: Number(roomData.id),
    gameCode: roomData.game_code || null,
    leader: leaderPerson,
    config: { queue: parsedLabel.queue, vibe: parsedLabel.vibe, mic: qm.mic, region: qm.region },
    members: membersMap,
    pending: {},
    need: qm.lobby ? (qm.lobby.need || {}) : {}
  };
}

// Tạo / cập nhật sảnh đội trên Backend (POST /api/matchmaking/lobby)
async function qmSyncLobbyWithBackend() {
  if (!qmCanCallApi() || qm.lobby.mode === "joined") return null;
  const range = qmRange();
  const payload = {
    game_id: qmCurrentGameId(),
    max_players: 5,
    min_rank_id: qmRankIdForUiIndex(qm.game, range.min),
    max_rank_id: qmRankIdForUiIndex(qm.game, range.max),
    label: qmBuildLabelString()
  };
  try {
    const res = await api.post("/api/matchmaking/lobby", payload);
    const roomData = res?.data || res;
    if (roomData && roomData.id) {
      qmApplyBackendRoomToLobby(roomData);
      qmRenderLobby();
    }
    return roomData;
  } catch (_) {
    return null;
  }
}

// Tải danh sách phòng thật đang mở: kết hợp GET /api/matchmaking/rooms & GET /api/team-posts
async function qmFetchOpenRoomsAndPosts() {
  if (typeof api === "undefined") return;
  qm.loadingRooms = true;
  qmRenderRooms();

  const gameId = qmCurrentGameId();
  const [roomsSettled, postsSettled] = await Promise.allSettled([
    api.get("/api/matchmaking/rooms", { game_id: gameId }),
    api.get("/api/team-posts", { game_id: gameId, status: "OPEN" })
  ]);

  const combined = [];

  // 1. Phòng MatchRoom đang WAITING từ /api/matchmaking/rooms
  if (roomsSettled.status === "fulfilled" && roomsSettled.value) {
    const rawRooms = Array.isArray(roomsSettled.value?.data)
      ? roomsSettled.value.data
      : (Array.isArray(roomsSettled.value) ? roomsSettled.value : []);

    rawRooms.forEach((r) => {
      const gKey = QM_DB.keyByGameId[r.game_id] || qmDetectGameKey(r.game_name) || qm.game;
      const hostMember = Array.isArray(r.members) ? (r.members.find((m) => m.is_host) || r.members[0]) : null;
      const hostName = hostMember
        ? (hostMember.display_name || hostMember.username)
        : (r.room_name || `Phòng #${r.id}`);
      const hostAvatar = hostMember
        ? qmResolveAvatar(hostMember.avatar, hostMember.username)
        : qmDiceBearAvatar(hostName);
      const parsedLabel = qmParseRoomLabel(r.label);
      const isMine = Number(r.host_id) === Number(QM_ME.id) && Number(QM_ME.id) > 0;

      combined.push({
        key: `room-${r.id}`,
        source: "match_room",
        id: Number(r.id),
        matchRoomId: Number(r.id),
        mine: isMine,
        title: r.room_name || "",
        host: {
          id: Number(r.host_id),
          name: hostName,
          avatar: hostAvatar,
          verified: hostMember && hostMember.rank_name ? "gold" : null
        },
        game: gKey,
        cs2Mode: qm.cs2Mode,
        queue: parsedLabel.queue,
        vibe: parsedLabel.vibe,
        mic: false,
        region: "VN",
        min: qmFracForDbRankId(gKey, r.min_rank_id, 0),
        max: qmFracForDbRankId(gKey, r.max_rank_id, 1),
        filled: Number(r.current_players) || 1,
        maxPlayers: Number(r.max_players) || 5,
        needs: []
      });
    });
  }

  // 2. Bài đăng tìm đội từ /api/team-posts
  if (postsSettled.status === "fulfilled" && postsSettled.value) {
    const resVal = postsSettled.value;
    const items = Array.isArray(resVal?.items)
      ? resVal.items
      : (Array.isArray(resVal?.data?.items) ? resVal.data.items : []);

    items.forEach((post) => {
      const gKey = QM_DB.keyByGameId[post.game_id] || qm.game;
      const titleText = String(post.title || "");
      const descText = String(post.description || "");
      const textLower = (titleText + " " + descText).toLowerCase();
      const isUnrated = textLower.includes("unrated") || textLower.includes("đấu thường");
      const isChill = textLower.includes("chill") || textLower.includes("vui vẻ");
      const hasMic = textLower.includes("mic");
      const neededCount = Math.min(4, Math.max(1, Number(post.needed_players) || 1));
      const filledCount = Math.max(1, Math.min(4, 5 - neededCount));
      const roleNames = qmRoleNamesForIds(gKey, post.role_ids);
      const isMine = Number(post.user_id) === Number(QM_ME.id) && Number(QM_ME.id) > 0;
      const friendMatch = QM_PEOPLE.find((p) => Number(p.id) === Number(post.user_id));
      const hostName = isMine
        ? QM_ME.name
        : (friendMatch ? friendMatch.name : `User #${post.user_id}`);
      const hostAvatar = isMine
        ? QM_ME.avatar
        : (friendMatch ? friendMatch.avatar : qmDiceBearAvatar(hostName));

      if (isMine) {
        qm.posted = true;
        qm.myRoom = { backendPostId: Number(post.id) };
      }

      combined.push({
        key: `post-${post.id}`,
        source: "team_post",
        id: Number(post.id),
        backendPostId: Number(post.id),
        mine: isMine,
        title: titleText,
        host: {
          id: Number(post.user_id),
          name: hostName,
          avatar: hostAvatar,
          verified: isMine ? QM_ME.verified : (friendMatch ? friendMatch.verified : null)
        },
        game: gKey,
        cs2Mode: qm.cs2Mode,
        queue: isUnrated ? "unrated" : "ranked",
        vibe: isChill ? "chill" : "tryhard",
        mic: hasMic,
        region: post.region === "SEA" ? "SEA" : "VN",
        min: qmFracForDbRankId(gKey, post.min_rank_id, 0),
        max: qmFracForDbRankId(gKey, post.max_rank_id, 1),
        filled: filledCount,
        maxPlayers: 5,
        needs: roleNames
      });
    });
  }

  QM_ROOMS.length = 0;
  QM_ROOMS.push(...combined);
  qm.loadingRooms = false;
  qmRenderSearchState();
  qmRenderRooms();
}

// Khởi tạo tải toàn bộ dữ liệu thật từ Backend
async function qmLoadBackendData() {
  if (typeof api === "undefined") return;

  // 1. Lấy danh mục Game, Rank, Role từ GET /api/games
  try {
    const gamesRes = await api.get("/api/games");
    const gamesList = Array.isArray(gamesRes) ? gamesRes : (Array.isArray(gamesRes?.data) ? gamesRes.data : []);
    gamesList.forEach((g) => {
      const key = qmDetectGameKey(g.name);
      if (key) {
        QM_DB.gameIdByKey[key] = Number(g.id);
        QM_DB.keyByGameId[Number(g.id)] = key;
        if (Array.isArray(g.ranks) && g.ranks.length > 0) {
          QM_DB.ranksByKey[key] = [...g.ranks].sort((a, b) => (a.rank_order || 0) - (b.rank_order || 0));
        }
        if (Array.isArray(g.roles) && g.roles.length > 0) {
          QM_DB.rolesByKey[key] = g.roles;
        }
      }
    });
    QM_DB.connected = true;
  } catch (err) {
    console.error("[QuickMatch] Lỗi tải /api/games:", err);
  }

  if (!qmCanCallApi()) return;

  // 2. Lấy tài khoản thật đang đăng nhập: GET /user/me + GET /api/profiles/me
  try {
    const meRes = await api.get("/user/me");
    const meData = meRes?.data || meRes || {};
    QM_ME.id = Number(meData.id) || 0;
    QM_ME.username = meData.username || "";
    QM_ME.name = meData.username || "Người chơi";
    QM_ME.avatar = qmDiceBearAvatar(QM_ME.username);

    try {
      const profRes = await api.get("/api/profiles/me");
      const prof = profRes?.data || profRes || {};
      if (prof.display_name) QM_ME.name = prof.display_name;
      if (prof.avatar) QM_ME.avatar = qmResolveAvatar(prof.avatar, QM_ME.username);
      if (typeof prof.has_mic === "boolean") qm.mic = prof.has_mic;
      if (prof.region === "SEA" || prof.region === "VN") qm.region = prof.region;
    } catch (_) {
      // Tài khoản chưa tạo GamerProfile (404) -> dùng username & avatar DiceBear theo username thật
    }

    const nameStrong = document.querySelector("#avatar-dropdown-menu .fc-avatar-dropdown-header strong");
    if (nameStrong) nameStrong.textContent = QM_ME.name;
    const selfAvatarImg = document.querySelector(".fc-self-avatar");
    if (selfAvatarImg) {
      selfAvatarImg.src = QM_ME.avatar;
      selfAvatarImg.alt = QM_ME.name;
    }
  } catch (err) {
    console.error("[QuickMatch] Lỗi tải /user/me:", err);
  }

  // 3. Lấy hồ sơ game & rank thật của bản thân từ GET /api/user-games/me
  try {
    const myGamesRes = await api.get("/api/user-games/me");
    const myGames = Array.isArray(myGamesRes) ? myGamesRes : (Array.isArray(myGamesRes?.data) ? myGamesRes.data : []);
    QM_DB.myUserGameByKey = {};
    myGames.forEach((ug) => {
      const key = QM_DB.keyByGameId[ug.game_id] || qmDetectGameKey(ug.game?.name);
      if (!key) return;
      QM_DB.myUserGameByKey[key] = ug;
      if (ug.user_id && !QM_ME.id) QM_ME.id = Number(ug.user_id);
    });
    QM_ME.verified = Object.keys(QM_DB.myUserGameByKey).length > 0 ? "blue" : null;
    qm.ranges = {};
  } catch (_) {}

  // 4. Lấy danh sách bạn bè thật từ GET /friend-requests/friends & số lời mời từ GET /friend-requests/received
  try {
    const [frRes, recRes] = await Promise.allSettled([
      api.get("/friend-requests/friends"),
      api.get("/friend-requests/received", { status: "PENDING" })
    ]);

    if (recRes.status === "fulfilled" && recRes.value) {
      const recArr = Array.isArray(recRes.value?.data) ? recRes.value.data : (Array.isArray(recRes.value) ? recRes.value : []);
      const badge = document.getElementById("sidebar-req-badge");
      if (badge) {
        badge.textContent = recArr.length;
        badge.style.display = recArr.length > 0 ? "flex" : "none";
      }
    }

    if (frRes.status === "fulfilled" && frRes.value) {
      const frList = Array.isArray(frRes.value?.data) ? frRes.value.data : (Array.isArray(frRes.value) ? frRes.value : []);
      const mappedFriends = frList.map((f) => {
        const uid = Number(f.user_id || f.friend_id || f.id);
        const uname = f.display_name || f.username || `User#${uid}`;
        const pg = f.primary_game || null;
        return {
          id: uid,
          username: f.username || uname,
          name: uname,
          avatar: qmResolveAvatar(f.avatar, f.username || uname),
          verified: pg && pg.rank_name ? "blue" : null,
          rankName: pg ? pg.rank_name : null,
          rankIcon: pg ? pg.rank_icon : null,
          roles: pg && Array.isArray(pg.roles) ? pg.roles : [],
          status: f.in_room ? "room" : "online"
        };
      });
      QM_PEOPLE.length = 0;
      QM_PEOPLE.push(...mappedFriends);
      QM_RIGHT_FRIENDS.length = 0;
      QM_RIGHT_FRIENDS.push(...mappedFriends.slice(0, 8).map((p) => p.id));
      qmRenderRightFriends();
    }
  } catch (_) {}

  // 5. Lấy sảnh đội 5 người hiện tại từ GET /api/matchmaking/my-team
  try {
    const teamRes = await api.get("/api/matchmaking/my-team");
    const roomData = teamRes?.data || teamRes?.room || null;
    if (roomData && roomData.id) {
      qmApplyBackendRoomToLobby(roomData);
    } else {
      qm.lobby = qmCreateOwnLobby();
    }
  } catch (_) {
    qm.lobby = qmCreateOwnLobby();
  }

  qmRefreshAll();
  await qmFetchOpenRoomsAndPosts();
}

function qmRefreshAll() {
  qmRenderBanner();
  qmRenderSummary();
  qmRenderLobby();
  qmRenderRooms();
  qmRenderSearchState();
}

function qmFirstFreePos() {
  return QM_FILL_ORDER.find((pos) => !qm.lobby.members[pos] && !qm.lobby.pending[pos]);
}

// Mời bạn bè thật vào sảnh: POST /api/matchmaking/invite/{friendId}
async function qmInvite(pos, personId) {
  const person = qmPersonById(personId);
  if (!person || qm.lobby.members[pos] || qm.lobby.pending[pos]) return;

  qm.lobby.pending[pos] = person;
  qm.menuPos = null;
  qmRenderLobby();

  try {
    if (!qm.lobby.roomId) {
      await qmSyncLobbyWithBackend();
    }
    const res = await api.post(`/api/matchmaking/invite/${personId}`);
    qmShowToast(`📨 ${res?.message || `Đã gửi lời mời vào đội cho ${person.name}`}`);
  } catch (err) {
    delete qm.lobby.pending[pos];
    qmRenderLobby();
    qmShowToast(`⚠️ ${err?.message || "Không thể gửi lời mời vào đội"}`);
  }
}

// Xóa thành viên khỏi sảnh: DELETE /api/matchmaking/members/{userId} (hoặc tự rời: POST /api/matchmaking/leave-team)
async function qmRemoveMember(pos) {
  const member = qm.lobby.members[pos];
  if (!member) return;

  if (qm.lobby.mode === "joined" || member.person.isMe) {
    await qmLeaveRoom();
    return;
  }

  const targetUserId = member.person.id;
  try {
    const res = await api.delete(`/api/matchmaking/members/${targetUserId}`);
    const roomData = res?.data || null;
    if (roomData && roomData.id) {
      qmApplyBackendRoomToLobby(roomData);
    } else {
      delete qm.lobby.members[pos];
    }
    qmRenderLobby();
    await qmFetchOpenRoomsAndPosts();
    qmShowToast(`Đã xóa ${member.person.name} khỏi đội`);
  } catch (err) {
    qmShowToast(`⚠️ ${err?.message || "Không thể xóa thành viên khỏi sảnh"}`);
  }
}

function qmStopSearch() {
  if (qm.timerId) clearInterval(qm.timerId);
  if (qm.pollId) clearInterval(qm.pollId);
  qm.timerId = null;
  qm.pollId = null;
  qm.searching = false;
  qm.seconds = 0;
  qmRenderSearchState();
}

// Tìm đội nhanh thật: POST /api/matchmaking/find-match (kèm kiểm tra định kỳ GET /api/matchmaking/my-team)
async function qmStartSearch() {
  if (qm.searching) return;

  if (qm.lobby.mode === "joined") {
    qmShowToast(`Bạn đang ở trong phòng của ${qm.lobby.leader.name}. Chỉ trưởng nhóm mới được bấm tìm trận.`);
    return;
  }
  if (qmLobbyMemberCount() >= 5) {
    qmShowToast("Đội của bạn đã đủ 5 người. Hãy vào game thôi! 🎮");
    return;
  }

  qm.searching = true;
  qm.seconds = 0;
  qm.menuPos = null;
  qmRenderLobby();
  qmRenderSearchState();

  try {
    const myUg = QM_DB.myUserGameByKey[qm.game];
    const myRankId = myUg && myUg.rank_id ? myUg.rank_id : null;

    const res = await api.post("/api/matchmaking/find-match", {
      game_id: qmCurrentGameId(),
      label: qmBuildLabelString(),
      rank_id: myRankId
    });
    const matchData = res?.data || res;
    if (matchData && matchData.room) {
      qmApplyBackendRoomToLobby(matchData.room);
      qmRenderLobby();
      await qmFetchOpenRoomsAndPosts();
    }
    if (matchData && matchData.status === "MATCHED") {
      qmStopSearch();
      const codeHint = matchData.room?.game_code ? ` · Code Game: ${matchData.room.game_code}` : "";
      qmShowToast(`🎮 ${matchData.message || "Đã ghép đội thành công!"}${codeHint}`);
      return;
    }
    qmShowToast(`🔍 ${matchData?.message || "Đang trong hàng chờ tìm đồng đội..."}`);
  } catch (err) {
    qmStopSearch();
    qmShowToast(`⚠️ ${err?.message || "Không thể bắt đầu tìm trận"}`);
    return;
  }

  qm.timerId = setInterval(() => {
    qm.seconds += 1;
    document.getElementById("qm-timer").textContent = qmFormatTime(qm.seconds);
  }, 1000);

  // Kiểm tra trạng thái sảnh thật từ Backend mỗi 4 giây trong lúc đang chờ
  qm.pollId = setInterval(async () => {
    try {
      const teamRes = await api.get("/api/matchmaking/my-team");
      const roomData = teamRes?.data || teamRes?.room || null;
      if (roomData && roomData.id) {
        qmApplyBackendRoomToLobby(roomData);
        qmRenderLobby();
        if (roomData.status === "FULL" || (Array.isArray(roomData.members) && roomData.members.length >= (roomData.max_players || 5))) {
          qmStopSearch();
          const codeHint = roomData.game_code ? ` · Code Game: ${roomData.game_code}` : "";
          qmShowToast(`🎮 Đội đã đủ thành viên!${codeHint}`);
        }
      }
    } catch (_) {}
  }, 4000);
}

// Hủy tìm trận thật: POST /api/matchmaking/cancel-search
async function qmCancelSearch() {
  if (!qm.searching) return;
  try {
    const res = await api.post("/api/matchmaking/cancel-search");
    qmStopSearch();
    qmShowToast(res?.message || "Đã huỷ tìm đội");
    const teamRes = await api.get("/api/matchmaking/my-team");
    const roomData = teamRes?.data || teamRes?.room || null;
    if (roomData && roomData.id) {
      qmApplyBackendRoomToLobby(roomData);
    } else {
      qm.lobby = qmCreateOwnLobby();
    }
    qmRenderLobby();
    await qmFetchOpenRoomsAndPosts();
  } catch (err) {
    qmStopSearch();
    qmShowToast(`⚠️ ${err?.message || "Không thể huỷ tìm trận"}`);
  }
}

// Đăng / gỡ bài tuyển người thật: POST /api/team-posts & PATCH /api/team-posts/{postId}/close
async function qmTogglePostRoom(explicitPostId) {
  if (qm.lobby.mode === "joined") {
    qmShowToast("Bạn cần rời phòng hiện tại trước khi đăng phòng tuyển người.");
    return;
  }

  const postIdToClose = explicitPostId || (qm.myRoom && qm.myRoom.backendPostId);
  if (qm.posted && postIdToClose) {
    try {
      await api.patch(`/api/team-posts/${postIdToClose}/close`);
      qm.posted = false;
      qm.myRoom = null;
      qmRenderSearchState();
      await qmFetchOpenRoomsAndPosts();
      qmShowToast("Đã gỡ bài tuyển người");
    } catch (err) {
      qmShowToast(`⚠️ ${err?.message || "Không thể gỡ bài tuyển người"}`);
    }
    return;
  }

  const range = qmRange();
  const needs = Object.values(qm.lobby.need);
  const roleNeeds = needs.length ? needs : Array.from(qm.roles);
  const neededPlayers = Math.max(1, 5 - qmLobbyMemberCount());

  try {
    await qmSyncLobbyWithBackend();
    const postPayload = {
      game_id: qmCurrentGameId(),
      title: `[${qm.region}] Tuyển ${neededPlayers} người chơi ${QM_GAMES[qm.game].name} (${qmQueueLabel(qm.queue)} · ${qmVibeLabel(qm.vibe)})`,
      min_rank_id: qmRankIdForUiIndex(qm.game, range.min),
      max_rank_id: qmRankIdForUiIndex(qm.game, range.max),
      needed_players: neededPlayers,
      region: qm.region,
      description: `${qm.mic ? "Bắt buộc có Mic. " : ""}${roleNeeds.length ? `Cần vị trí: ${roleNeeds.join(", ")}` : "Tuyển mọi vị trí"}`,
      role_ids: qmRoleIdsForNames(qm.game, roleNeeds)
    };
    const created = await api.post("/api/team-posts", postPayload);
    const postObj = created?.data || created;
    if (postObj && postObj.id) {
      qm.myRoom = { backendPostId: Number(postObj.id) };
      qm.posted = true;
    }
    qmRenderSearchState();
    await qmFetchOpenRoomsAndPosts();
    qmShowToast("📣 Đã đăng phòng tuyển người lên danh sách phòng đang mở");
  } catch (err) {
    qmShowToast(`⚠️ ${err?.message || "Không thể đăng bài tuyển người"}`);
  }
}

// Tham gia phòng đang mở thật: POST /api/matchmaking/join/{roomId} hoặc POST /api/team-posts/{postId}/applications
async function qmJoinRoom(roomKey) {
  const room = QM_ROOMS.find((r) => r.key === roomKey);
  if (!room) return;

  if (qm.searching) qmStopSearch();

  // Nếu là sảnh MatchRoom đang WAITING -> gọi POST /api/matchmaking/join/{roomId}
  if (room.source === "match_room" && room.matchRoomId) {
    try {
      const res = await api.post(`/api/matchmaking/join/${room.matchRoomId}`);
      const roomData = res?.data || res;
      if (roomData && roomData.id) {
        qmApplyBackendRoomToLobby(roomData);
      }
      qmSwitchView("lobby");
      qmRenderLobby();
      await qmFetchOpenRoomsAndPosts();
      qmShowToast(`🚪 Đã tham gia phòng của ${room.host.name}`);
    } catch (err) {
      qmShowToast(`⚠️ ${err?.message || "Không thể tham gia phòng này"}`);
    }
    return;
  }

  // Nếu là bài đăng TeamPost -> gọi POST /api/team-posts/{postId}/applications
  if (room.source === "team_post" && room.backendPostId) {
    try {
      await api.post(`/api/team-posts/${room.backendPostId}/applications`, {
        message: `Xin tham gia đội ${QM_GAMES[room.game]?.name || ""} từ Tìm đội nhanh`
      });
      qmShowToast(`📨 Đã gửi yêu cầu tham gia bài đăng của ${room.host.name}`);
    } catch (err) {
      qmShowToast(`⚠️ ${err?.message || "Không thể ứng tuyển vào bài đăng này"}`);
    }
  }
}

// Rời phòng thật: POST /api/matchmaking/leave-team
async function qmLeaveRoom() {
  try {
    const res = await api.post("/api/matchmaking/leave-team");
    qmShowToast(res?.message || "Bạn đã rời khỏi sảnh đội");
  } catch (err) {
    qmShowToast(`⚠️ ${err?.message || "Không thể rời phòng"}`);
  }

  try {
    const teamRes = await api.get("/api/matchmaking/my-team");
    const roomData = teamRes?.data || teamRes?.room || null;
    if (roomData && roomData.id) {
      qmApplyBackendRoomToLobby(roomData);
    } else {
      qm.lobby = qmCreateOwnLobby();
    }
  } catch (_) {
    qm.lobby = qmCreateOwnLobby();
  }

  qm.menuPos = null;
  qmRenderLobby();
  await qmFetchOpenRoomsAndPosts();
}

function qmSetNav(key) {
  qm.navKey = key;
  const map = { quick: "btn-nav-quick", create: "btn-nav-create-room", find: "btn-nav-find-room" };
  Object.entries(map).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", k === key);
  });
}

function qmSwitchView(view, navKey) {
  qm.view = view;
  document.querySelectorAll(".qm-view-btn").forEach((btn) => {
    const active = btn.dataset.view === view;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.getElementById("view-lobby").hidden = view !== "lobby";
  document.getElementById("view-rooms").hidden = view !== "rooms";

  if (navKey) {
    qmSetNav(navKey);
  } else if (view === "rooms") {
    qmSetNav("find");
  } else if (qm.navKey === "find") {
    qmSetNav("quick");
  }

  const scrollEl = document.querySelector(".fc-content-scroll");
  if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================================================
// 11. THEME SÁNG / TỐI (đồng bộ với trang Bạn bè qua localStorage)
// =========================================================================
function qmApplyTheme(theme) {
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

// =========================================================================
// 12. KHỞI TẠO & SỰ KIỆN
// =========================================================================
function qmInit() {
  qm.lobby = qmCreateOwnLobby();

  qmApplyTheme(localStorage.getItem("gc_friends_theme") || "dark");

  const avatarBtn = document.getElementById("btn-avatar-menu");
  const avatarMenu = document.getElementById("avatar-dropdown-menu");
  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    avatarMenu.hidden = !avatarMenu.hidden;
  });
  document.querySelectorAll(".fc-theme-option").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      qmApplyTheme(opt.dataset.setTheme);
      avatarMenu.hidden = true;
      qmShowToast(opt.dataset.setTheme === "light" ? "☀️ Đã chuyển sang Chế độ Sáng" : "🌙 Đã chuyển sang Chế độ Tối");
    });
  });

  const dropdowns = [
    { dd: "dd-game", btn: "btn-dd-game", menu: "menu-dd-game" },
    { dd: "dd-min", btn: "btn-dd-min", menu: "menu-dd-min" },
    { dd: "dd-max", btn: "btn-dd-max", menu: "menu-dd-max" }
  ].map((cfg) => ({
    dd: document.getElementById(cfg.dd),
    btn: document.getElementById(cfg.btn),
    menu: document.getElementById(cfg.menu)
  }));

  function closeAllDropdowns() {
    dropdowns.forEach(({ dd, btn, menu }) => {
      dd.classList.remove("is-open");
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
  }

  dropdowns.forEach(({ dd, btn, menu }) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = menu.hidden;
      closeAllDropdowns();
      if (willOpen) {
        dd.classList.add("is-open");
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        const activeItem = menu.querySelector(".fc-dropdown-item.active");
        if (activeItem) activeItem.scrollIntoView({ block: "nearest" });
      }
    });
  });

  document.getElementById("menu-dd-game").addEventListener("click", async (e) => {
    const item = e.target.closest("button[data-game]");
    if (!item) return;
    const nextGame = item.dataset.game;
    closeAllDropdowns();
    if (nextGame === qm.game) return;

    qm.game = nextGame;
    qm.roles = new Set();
    qm.lobby.need = {};
    qm.menuPos = null;
    if (qm.searching) qmStopSearch();
    qmRefreshAll();
    if (qm.lobby.roomId && qm.lobby.mode === "own") {
      await qmSyncLobbyWithBackend();
    }
    await qmFetchOpenRoomsAndPosts();
    qmShowToast(`Đã chọn game: ${QM_GAMES[nextGame].name}`);
  });

  async function onRankPick(e) {
    const item = e.target.closest("button[data-rank-idx]");
    if (!item) return;
    const idx = Number(item.dataset.rankIdx);
    const which = item.dataset.rankWhich;
    const range = qmRange();

    if (which === "min") {
      range.min = idx;
      if (range.min > range.max) range.max = range.min;
    } else {
      range.max = idx;
      if (range.max < range.min) range.min = range.max;
    }
    closeAllDropdowns();
    qmRenderRankDropdowns();
    qmRenderSummary();
    qmRenderRooms();
    if (qm.lobby.roomId && qm.lobby.mode === "own") {
      await qmSyncLobbyWithBackend();
    }
  }
  document.getElementById("menu-dd-min").addEventListener("click", onRankPick);
  document.getElementById("menu-dd-max").addEventListener("click", onRankPick);

  document.getElementById("qm-card-mode").addEventListener("click", async (e) => {
    const queueBtn = e.target.closest("[data-queue]");
    const cs2Btn = e.target.closest("[data-cs2mode]");
    const vibeBtn = e.target.closest("[data-vibe]");
    const regionBtn = e.target.closest("[data-region]");
    const micBtn = e.target.closest("#btn-toggle-mic");

    if (queueBtn) qm.queue = queueBtn.dataset.queue;
    else if (cs2Btn) qm.cs2Mode = cs2Btn.dataset.cs2mode;
    else if (vibeBtn) qm.vibe = vibeBtn.dataset.vibe;
    else if (regionBtn) qm.region = regionBtn.dataset.region;
    else if (micBtn) qm.mic = !qm.mic;
    else return;

    qmRenderBanner();
    qmRenderSummary();
    qmRenderLobby();
    qmRenderRooms();
    if (qm.lobby.roomId && qm.lobby.mode === "own") {
      await qmSyncLobbyWithBackend();
    }
  });

  document.getElementById("qm-role-chips").addEventListener("click", (e) => {
    const chip = e.target.closest("button[data-role]");
    if (!chip) return;
    const role = chip.dataset.role;
    if (role === "__ALL__") {
      qm.roles = new Set();
    } else if (qm.roles.has(role)) {
      qm.roles.delete(role);
    } else {
      qm.roles.add(role);
    }
    qmRenderRoleChips();
    qmRenderRooms();
  });

  document.querySelectorAll(".qm-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      qmSwitchView(btn.dataset.view);
      if (btn.dataset.view === "rooms") qmFetchOpenRoomsAndPosts();
    });
  });

  document.getElementById("qm-slots").addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const pos = Number(target.dataset.pos);

    if (action === "add") {
      qm.menuPos = qm.menuPos === pos ? null : pos;
      qmRenderLobby();
    } else if (action === "close-menu") {
      qm.menuPos = null;
      qmRenderLobby();
    } else if (action === "invite") {
      qmInvite(pos, Number(target.dataset.person));
    } else if (action === "set-need") {
      qm.lobby.need[pos] = target.dataset.role;
      qm.menuPos = null;
      qmRenderLobby();
      qmShowToast(`Đã đặt vị trí cần tuyển: ${target.dataset.role}`);
    } else if (action === "clear-need") {
      delete qm.lobby.need[pos];
      qm.menuPos = null;
      qmRenderLobby();
    } else if (action === "remove") {
      qmRemoveMember(pos);
    }
  });

  document.getElementById("qm-rooms-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-room-action]");
    if (!btn) return;
    const act = btn.dataset.roomAction;
    if (act === "join") qmJoinRoom(btn.dataset.roomKey);
    if (act === "unpost") qmTogglePostRoom(Number(btn.dataset.postId));
    if (act === "open-my-lobby") qmSwitchView("lobby");
  });

  document.getElementById("btn-leave-lobby").addEventListener("click", qmLeaveRoom);

  document.getElementById("btn-find-match").addEventListener("click", qmStartSearch);
  document.getElementById("btn-cancel-search").addEventListener("click", qmCancelSearch);
  document.getElementById("btn-post-room").addEventListener("click", () => qmTogglePostRoom());

  document.getElementById("qm-right-online").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-right-friend]");
    if (!btn) return;
    const person = qmPersonById(Number(btn.dataset.rightFriend));
    if (!person) return;
    if (qm.lobby.mode === "joined") {
      qmShowToast("Bạn đang ở trong phòng của người khác nên không thể mời thêm.");
      return;
    }
    const alreadyIn =
      Object.values(qm.lobby.members).some((m) => Number(m.person.id) === Number(person.id)) ||
      Object.values(qm.lobby.pending).some((p) => Number(p.id) === Number(person.id));
    if (alreadyIn) {
      qmShowToast(`${person.name} đã ở trong sảnh đội của bạn`);
      return;
    }
    const pos = qmFirstFreePos();
    if (pos === undefined) {
      qmShowToast("Sảnh đội đã đủ người");
      return;
    }
    qmSwitchView("lobby");
    qmInvite(pos, person.id);
  });

  document.getElementById("btn-right-party").addEventListener("click", () => qmSwitchView("lobby"));

  document.getElementById("btn-nav-quick").addEventListener("click", (e) => {
    e.preventDefault();
    qmSwitchView("lobby", "quick");
  });
  document.getElementById("btn-nav-create-room").addEventListener("click", (e) => {
    e.preventDefault();
    qmSwitchView("lobby", "create");
  });
  document.getElementById("btn-nav-find-room").addEventListener("click", (e) => {
    e.preventDefault();
    qmSwitchView("rooms", "find");
    qmFetchOpenRoomsAndPosts();
  });

  document.addEventListener("click", (e) => {
    if (!dropdowns.some(({ dd }) => dd.contains(e.target))) closeAllDropdowns();

    if (!avatarMenu.hidden && !avatarMenu.contains(e.target) && e.target !== avatarBtn) {
      avatarMenu.hidden = true;
    }

    if (qm.menuPos !== null && !e.target.closest(".qm-slot-menu") && !e.target.closest('[data-action="add"]')) {
      qm.menuPos = null;
      qmRenderLobby();
    }
  });

  qmRenderRightFriends();
  qmRefreshAll();

  const viewParam = new URLSearchParams(window.location.search).get("view");
  if (viewParam === "rooms") qmSwitchView("rooms", "find");
  else if (viewParam === "lobby") qmSwitchView("lobby", "create");
  else qmSwitchView("lobby", "quick");

  qmLoadBackendData();
}

qmInit();
