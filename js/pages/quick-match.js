/* ==========================================================
   GameConnect — Trang Tìm đội nhanh (Quick Team Finder)
   Chỉ dùng dữ liệu mẫu (mock) cho giao diện — không gọi API.
   Dùng chung hệ thống class/biến màu của friends.css
   ========================================================== */
"use strict";

const QM_IMG = "../assets/images/";

// =========================================================================
// 1. DỮ LIỆU CẤU HÌNH: GAME, RANK, VỊ TRÍ
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
  tft: QM_LOL_RANKS // Đấu Trường Chân Lý dùng chung rank với Liên Minh Huyền Thoại
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

// Hồ sơ rank hiện tại của tôi theo từng hệ thống rank
const QM_ME_PROFILE = {
  valorant: { rankIdx: 19, points: 64, floor: 0, next: 100, unit: "RR", region: "#1.245 VN" },
  "cs2-faceit": { rankIdx: 7, points: 1680, floor: 1531, next: 1751, unit: "ELO", region: "#312 VN" },
  "cs2-premier": { rankIdx: 3, points: 16240, floor: 15000, next: 20000, unit: "CS Rating", region: "#428 VN", premierScore: 16240 },
  aov: { rankIdx: 4, points: 24, floor: 0, next: 30, unit: "Sao", region: "#2.108 VN" },
  lol: { rankIdx: 6, points: 56, floor: 0, next: 100, unit: "LP", region: "#864 VN" },
  tft: { rankIdx: 4, points: 72, floor: 0, next: 100, unit: "LP", region: "#1.530 VN" }
};

// =========================================================================
// 2. DỮ LIỆU MẪU: NGƯỜI CHƠI, BẠN BÈ ONLINE, PHÒNG ĐANG MỞ
// =========================================================================
function qmAvatar(seed, bg) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=${bg || "b6e3f4"}`;
}

const QM_ME = {
  id: 0,
  name: "CaptainVN",
  avatar: qmAvatar("CaptianVN", "b6e3f4"),
  verified: "gold",
  tier: 0.7,
  isMe: true
};

const QM_PEOPLE = [
  { id: 1, name: "LinhBae", avatar: qmAvatar("LinhBae", "ffd5dc"), verified: "blue", tier: 0.62, status: "online" },
  { id: 2, name: "BaoClutch", avatar: qmAvatar("BaoClutch", "c0aede"), verified: "blue", tier: 0.55, status: "online" },
  { id: 3, name: "HuySniper", avatar: qmAvatar("HuySniper", "c0aede"), verified: "gold", tier: 0.85, status: "room" },
  { id: 4, name: "DuyenAlice", avatar: qmAvatar("DuyenAlice", "ffdfbf"), verified: null, tier: 0.5, status: "online" },
  { id: 5, name: "TuanJungle", avatar: qmAvatar("TuanJungle", "d1d4f9"), verified: "blue", tier: 0.68, status: "online" },
  { id: 6, name: "QuanViper", avatar: qmAvatar("QuanViper", "b6e3f4"), verified: null, tier: 0.6, status: "room" },
  { id: 7, name: "MinhFaceit", avatar: qmAvatar("MinhFaceit9", "ffd5dc"), verified: null, tier: 0.72, status: "online" },
  { id: 8, name: "KhoiTapHead", avatar: qmAvatar("KhoiTapHead", "ffdfbf"), verified: "blue", tier: 0.58, status: "online" },
  { id: 9, name: "PhucConqueror", avatar: qmAvatar("PhucConqueror", "c0aede"), verified: "gold", tier: 0.9, status: "online" },
  { id: 10, name: "NamFlorentino", avatar: qmAvatar("NamFlorentino", "d1d4f9"), verified: null, tier: 0.52, status: "online" }
];

// Bạn bè hiển thị ở thanh phải (đang online)
const QM_RIGHT_FRIENDS = [1, 2, 3, 4, 5];

function qmPersonById(id) {
  return QM_PEOPLE.find((p) => p.id === id);
}

// Phòng đang mở (mô phỏng bảng team_posts). min/max là tỉ lệ 0..1 trên thang rank của game đó
const QM_ROOMS = [
  { id: 1, host: { name: "ZeroCool", avatar: qmAvatar("ZeroCool", "b6e3f4"), verified: "gold" }, game: "valorant", queue: "ranked", vibe: "tryhard", mic: true, region: "VN", min: 0.62, max: 0.9, filled: 3, needs: ["Controller"] },
  { id: 2, host: { name: "ViperMain", avatar: qmAvatar("ViperMain", "ffd5dc"), verified: "blue" }, game: "valorant", queue: "ranked", vibe: "tryhard", mic: false, region: "VN", min: 0.5, max: 0.8, filled: 4, needs: ["Sentinel"] },
  { id: 3, host: { name: "HuySova", avatar: qmAvatar("HuySova", "b6e3f4"), verified: null }, game: "valorant", queue: "ranked", vibe: "chill", mic: false, region: "VN", min: 0.3, max: 0.65, filled: 2, needs: ["Duelist", "Initiator"] },
  { id: 4, host: { name: "NhiPhoenix", avatar: qmAvatar("NhiPhoenix", "ffdfbf"), verified: null }, game: "valorant", queue: "unrated", vibe: "chill", mic: false, region: "SEA", min: 0, max: 1, filled: 1, needs: ["Duelist", "Controller", "Sentinel"] },
  { id: 5, host: { name: "SEA_Reyna", avatar: qmAvatar("SEAReyna", "c0aede"), verified: "blue" }, game: "valorant", queue: "ranked", vibe: "tryhard", mic: true, region: "SEA", min: 0.7, max: 1, filled: 3, needs: ["Initiator"] },

  { id: 6, host: { name: "KienFaceit10", avatar: qmAvatar("KienFaceit10", "c0aede"), verified: "gold" }, game: "cs2", cs2Mode: "faceit", queue: "ranked", vibe: "tryhard", mic: true, region: "VN", min: 0.5, max: 0.95, filled: 3, needs: ["AWPer", "Support"] },
  { id: 7, host: { name: "TrungPremier", avatar: qmAvatar("TrungPremier", "ffd5dc"), verified: "blue" }, game: "cs2", cs2Mode: "premier", queue: "ranked", vibe: "tryhard", mic: false, region: "VN", min: 0.5, max: 0.9, filled: 2, needs: ["Entry", "Lurker"] },
  { id: 8, host: { name: "MirageKing", avatar: qmAvatar("MirageKing", "d1d4f9"), verified: null }, game: "cs2", cs2Mode: "faceit", queue: "ranked", vibe: "chill", mic: false, region: "VN", min: 0.3, max: 0.7, filled: 4, needs: ["IGL"] },
  { id: 9, host: { name: "DustLover", avatar: qmAvatar("DustLover", "ffdfbf"), verified: null }, game: "cs2", cs2Mode: "faceit", queue: "unrated", vibe: "chill", mic: false, region: "VN", min: 0, max: 1, filled: 2, needs: ["Support", "Entry"] },

  { id: 10, host: { name: "BaoConqueror", avatar: qmAvatar("BaoConqueror", "ffd5dc"), verified: "gold" }, game: "aov", queue: "ranked", vibe: "tryhard", mic: true, region: "VN", min: 0.5, max: 1, filled: 3, needs: ["Jungle", "Support"] },
  { id: 11, host: { name: "DuyenAlice", avatar: qmAvatar("DuyenAlice", "ffdfbf"), verified: "blue" }, game: "aov", queue: "ranked", vibe: "chill", mic: false, region: "VN", min: 0.25, max: 0.7, filled: 2, needs: ["Mid", "ADC"] },
  { id: 12, host: { name: "AoVVuiVe", avatar: qmAvatar("AoVVuiVe", "b6e3f4"), verified: null }, game: "aov", queue: "unrated", vibe: "chill", mic: false, region: "VN", min: 0, max: 1, filled: 1, needs: ["Top", "Jungle", "Support"] },

  { id: 13, host: { name: "TuanJungle", avatar: qmAvatar("TuanJungle", "d1d4f9"), verified: "gold" }, game: "lol", queue: "ranked", vibe: "tryhard", mic: true, region: "VN", min: 0.55, max: 0.95, filled: 3, needs: ["Jungle", "ADC"] },
  { id: 14, host: { name: "YasuoVN", avatar: qmAvatar("YasuoVN", "c0aede"), verified: null }, game: "lol", queue: "ranked", vibe: "chill", mic: false, region: "VN", min: 0.3, max: 0.7, filled: 2, needs: ["Mid", "Support"] },
  { id: 15, host: { name: "ARAMFan", avatar: qmAvatar("ARAMFan", "ffd5dc"), verified: null }, game: "lol", queue: "unrated", vibe: "chill", mic: false, region: "VN", min: 0, max: 1, filled: 3, needs: ["Top", "Mid"] },

  { id: 16, host: { name: "HoangTFTMaster", avatar: qmAvatar("HoangTFT", "ffdfbf"), verified: "gold" }, game: "tft", queue: "ranked", vibe: "tryhard", mic: false, region: "VN", min: 0.5, max: 1, filled: 3, needs: ["Fast 8", "Fast 9"] },
  { id: 17, host: { name: "ChessChill", avatar: qmAvatar("ChessChill", "b6e3f4"), verified: null }, game: "tft", queue: "ranked", vibe: "chill", mic: false, region: "VN", min: 0.2, max: 0.7, filled: 2, needs: ["Reroll", "Flex"] }
];

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
  menuPos: null,
  posted: false,
  myRoom: null,
  lobby: null
};

// Vị trí 5 ô: ô giữa (2) là đội trưởng, thứ tự lấp đầy thành viên từ trong ra ngoài
const QM_POSITIONS = [0, 1, 2, 3, 4];
const QM_FILL_ORDER = [1, 3, 0, 4];

function qmCreateOwnLobby() {
  return {
    mode: "own",
    roomId: null,
    leader: QM_ME,
    config: null,
    members: { 3: { person: qmPersonById(1) } },
    pending: {},
    need: {}
  };
}

// =========================================================================
// 4. HÀM TIỆN ÍCH
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

function qmRange() {
  const key = qmCtxKey();
  if (!qm.ranges[key]) {
    const total = QM_RANKS[key].length;
    const me = QM_ME_PROFILE[key].rankIdx;
    qm.ranges[key] = { min: Math.max(0, me - 2), max: Math.min(total - 1, me + 2) };
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

// Nhãn khu vực (dùng cờ SVG vì Windows không hiển thị emoji cờ quốc gia)
function qmRegionLabel(region) {
  return region === "VN" ? `${QM_FLAG_VN} VN` : "🌏 SEA";
}

const QM_CROWN = `
  <svg width="26" height="20" viewBox="0 0 26 20" fill="currentColor" aria-label="Đội trưởng">
    <path d="M2 17 0.5 5.5 7 10.5 13 2l6 8.5 6.5-5L24 17z"/>
    <rect x="2" y="18" width="22" height="2" rx="1"/>
  </svg>`;

// Khung điểm CS2 Premier (đổi màu theo điểm) — cùng cách vẽ với trang Bạn bè
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

// Rank của một người chơi trong sảnh theo game/hệ thống rank hiện tại
function qmPersonRankIdx(person) {
  if (person.isMe) return QM_ME_PROFILE[qmCtxKey()].rankIdx;
  return qmFracToIdx(person.tier ?? 0.5);
}

function qmRankBlock(person, big) {
  const ranks = qmRanks();
  const idx = qmPersonRankIdx(person);
  const rank = ranks[idx];

  if (qmCtxKey() === "cs2-premier") {
    const score = person.isMe ? QM_ME_PROFILE["cs2-premier"].premierScore : rank.min + 700 + (person.id || 0) * 90;
    return `<div class="qm-slot-rank">${qmPremierBadge(score)}<span class="qm-slot-rank-name">${qmEsc(rank.name)}</span></div>`;
  }

  return `
    <div class="qm-slot-rank">
      <img src="${rank.icon}" alt="${qmEsc(rank.name)}" class="qm-slot-rank-icon" ${big ? 'style="width:56px;height:56px;"' : ""}>
      <span class="qm-slot-rank-name">${qmEsc(rank.name)}</span>
    </div>`;
}

function qmLobbyMemberCount() {
  return 1 + Object.keys(qm.lobby.members).length;
}

// =========================================================================
// 5. RENDER BANNER (3 KHỐI)
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
  const me = QM_ME_PROFILE[key];
  const rank = ranks[me.rankIdx];
  const nextRank = ranks[me.rankIdx + 1];
  const progress = Math.max(0, Math.min(1, (me.points - me.floor) / (me.next - me.floor)));
  const remain = me.next - me.points;

  const badge = key === "cs2-premier"
    ? `<div class="qm-me-premier">${qmPremierBadge(me.premierScore)}</div>`
    : `<img src="${rank.icon}" alt="${qmEsc(rank.name)}" class="qm-me-icon">`;

  const pointsText = key === "cs2-premier"
    ? `${me.points.toLocaleString("en-US")} ${me.unit}`
    : `${me.points.toLocaleString("en-US")} ${me.unit}`;

  const progressText = nextRank
    ? `Còn <strong>${remain.toLocaleString("en-US")} ${me.unit}</strong> để lên ${qmEsc(nextRank.name)}`
    : "Bạn đang ở bậc rank cao nhất";

  document.getElementById("qm-me-rank").innerHTML = `
    <div class="qm-me-top">
      ${badge}
      <div class="qm-me-info">
        <span class="qm-me-name">${qmEsc(rank.name)}</span>
        <span class="qm-me-points">${pointsText}</span>
        <span class="qm-me-region">Hạng khu vực ${qmEsc(me.region)}</span>
      </div>
    </div>
    <div class="qm-progress">
      <div class="qm-progress-bar"><div class="qm-progress-fill" style="width:${Math.round(progress * 100)}%"></div></div>
      <div class="qm-progress-text">
        <span>${progressText}</span>
        <strong>${Math.round(progress * 100)}%</strong>
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

  // Chỉ hiện lựa chọn FACEIT / Premier khi chọn CS2 + Xếp hạng
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
// 7. RENDER SẢNH 5 Ô
// =========================================================================
function qmLobbyConfig() {
  // Cấu hình hiển thị trên thẻ đội trưởng (của tôi: theo banner, đang vào phòng người khác: theo phòng đó)
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
  const roles = qmRolesOfGame();
  const role = roles[((person.id || 0) + pos) % roles.length];
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
      <div class="qm-slot-tags"><span class="fc-role-tag">${qmEsc(role)}</span></div>
    </div>`;
}

function qmRenderPendingSlot(pos, person) {
  return `
    <div class="qm-slot is-pending" data-pos="${pos}">
      <span class="qm-spinner"></span>
      <div class="qm-slot-pending-text">Đang chờ ${qmEsc(person.name)}...</div>
    </div>`;
}

function qmRenderSlotMenu(pos) {
  const lobby = qm.lobby;
  const inLobbyIds = new Set([
    ...Object.values(lobby.members).map((m) => m.person.id),
    ...Object.values(lobby.pending).map((p) => p.id)
  ]);
  const friends = QM_PEOPLE.filter((p) => !inLobbyIds.has(p.id) && p.id !== lobby.leader.id);

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
    : `<div class="qm-slot-empty-text" style="padding:6px 4px;">Không còn bạn bè online để mời</div>`;

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
  document.getElementById("qm-lobby-title").textContent = isJoined
    ? `Phòng của ${lobby.leader.name}`
    : "Sảnh đội của bạn";
  document.getElementById("btn-leave-lobby").hidden = !isJoined;
}

// =========================================================================
// 8. DANH SÁCH PHÒNG ĐANG MỞ
// =========================================================================
function qmRoomRankRange(room) {
  const ranks = qmRanks();
  const a = qmFracToIdx(room.min);
  const b = qmFracToIdx(room.max);
  return { lo: Math.min(a, b), hi: Math.max(a, b), ranks };
}

function qmRoomMatches(room) {
  if (room.game !== qm.game) return false;
  if (room.queue !== qm.queue) return false;
  if (room.vibe !== qm.vibe) return false;
  if (qm.mic && !room.mic) return false;
  if (qm.region === "VN" && room.region !== "VN") return false;
  if (qm.game === "cs2" && qm.queue === "ranked" && room.cs2Mode !== qm.cs2Mode) return false;

  if (qm.roles.size > 0 && !room.needs.some((r) => qm.roles.has(r))) return false;

  const range = qmRange();
  const { lo, hi } = qmRoomRankRange(room);
  return lo <= range.max && hi >= range.min;
}

function qmGetFilteredRooms() {
  const rooms = QM_ROOMS.filter(qmRoomMatches);
  return rooms;
}

function qmRenderRoomRow(room) {
  const game = QM_GAMES[room.game];
  const { lo, hi, ranks } = qmRoomRankRange(room);
  const filled = room.mine ? qmLobbyMemberCount() : room.filled;

  const dots = [0, 1, 2, 3, 4].map((i) => `<span class="qm-dot ${i < filled ? "is-filled" : ""}"></span>`).join("");

  const tags = [
    `<span class="fc-role-tag">${qmQueueLabel(room.queue)}</span>`,
    `<span class="fc-role-tag">${qmVibeLabel(room.vibe)}</span>`,
    room.mic ? `<span class="fc-role-tag">🎤 Mic</span>` : "",
    `<span class="fc-role-tag">${qmRegionLabel(room.region)}</span>`,
    room.game === "cs2" && room.queue === "ranked" ? `<span class="fc-role-tag">${room.cs2Mode === "faceit" ? "FACEIT" : "Premier"}</span>` : ""
  ].join("");

  const needsText = room.needs.length ? `Cần: ${room.needs.join(", ")}` : "Đang tuyển mọi vị trí";

  const button = room.mine
    ? `<button type="button" class="fc-btn fc-btn-danger-ghost" data-room-action="unpost">Gỡ bài</button>`
    : filled >= 5
    ? `<button type="button" class="fc-btn fc-btn-secondary" disabled>Đã đầy</button>`
    : `<button type="button" class="fc-btn fc-btn-join" data-room-action="join" data-room-id="${room.id}">+ Tham gia ngay</button>`;

  return `
    <article class="fc-player-row qm-room-row ${room.mine ? "is-mine" : ""}">
      <div class="fc-player-identity">
        <div class="fc-avatar-box">
          <img src="${room.host.avatar}" alt="${qmEsc(room.host.name)}" class="fc-avatar-img" loading="lazy">
          <span class="fc-presence-badge fc-presence-ingame"></span>
        </div>
        <div class="fc-player-meta">
          <div class="fc-player-subhead is-inroom">${room.mine ? "PHÒNG CỦA BẠN" : "ĐANG TRONG PHÒNG"}</div>
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
          <span class="qm-room-slots-text">${filled}/5 người</span>
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
  const filtered = qmGetFilteredRooms();
  const rooms = qm.posted && qm.myRoom ? [qm.myRoom, ...filtered] : filtered;

  document.getElementById("qm-rooms-count").textContent = rooms.length;
  document.getElementById("qm-rooms-heading").textContent =
    `PHÒNG PHÙ HỢP VỚI BỘ LỌC CỦA BẠN · ${rooms.length} PHÒNG`;

  const listEl = document.getElementById("qm-rooms-list");
  if (rooms.length === 0) {
    listEl.innerHTML = `
      <div class="fc-empty-state">
        <h3>Chưa có phòng nào phù hợp</h3>
        <p>Thử nới khoảng rank, đổi phong cách chơi hoặc bấm “Đăng phòng tuyển người” để tự mở phòng.</p>
      </div>`;
    return;
  }
  listEl.innerHTML = rooms.map(qmRenderRoomRow).join("");
}

// =========================================================================
// 9. THANH PHẢI: BẠN BÈ ĐANG ONLINE
// =========================================================================
function qmRenderRightFriends() {
  document.getElementById("qm-right-online").innerHTML = QM_RIGHT_FRIENDS.map((id) => {
    const p = qmPersonById(id);
    return `
      <button type="button" class="qm-right-friend" data-right-friend="${p.id}" title="${qmEsc(p.name)} — ${p.status === "room" ? "Đang trong phòng" : "Đang online"}">
        <img src="${p.avatar}" alt="${qmEsc(p.name)}">
        <span class="qm-pres ${p.status === "room" ? "is-room" : ""}"></span>
      </button>`;
  }).join("");
}

// =========================================================================
// 10. LOGIC SẢNH: MỜI, XÓA, TÌM TRẬN, ĐĂNG PHÒNG, THAM GIA PHÒNG
// =========================================================================
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

function qmInvite(pos, personId) {
  const person = qmPersonById(personId);
  if (!person || qm.lobby.members[pos] || qm.lobby.pending[pos]) return;

  qm.lobby.pending[pos] = person;
  qm.menuPos = null;
  qmRenderLobby();
  qmShowToast(`📨 Đã gửi lời mời vào đội cho ${person.name}`);

  const lobbyRef = qm.lobby;
  setTimeout(() => {
    if (qm.lobby !== lobbyRef || lobbyRef.pending[pos] !== person) return;
    delete lobbyRef.pending[pos];
    lobbyRef.members[pos] = { person };
    qmRenderLobby();
    qmRenderRooms();
    qmShowToast(`✅ ${person.name} đã tham gia sảnh đội`);
  }, 2500);
}

function qmRemoveMember(pos) {
  const member = qm.lobby.members[pos];
  if (!member) return;

  if (qm.lobby.mode === "joined") {
    qmLeaveRoom();
    return;
  }
  delete qm.lobby.members[pos];
  qmRenderLobby();
  qmRenderRooms();
  qmShowToast(`Đã xóa ${member.person.name} khỏi đội`);
}

function qmStopSearch() {
  if (qm.timerId) clearInterval(qm.timerId);
  qm.timerId = null;
  qm.searching = false;
  qm.seconds = 0;
  qmRenderSearchState();
}

function qmFinishSearch() {
  const lobby = qm.lobby;
  const used = new Set([
    lobby.leader.id,
    ...Object.values(lobby.members).map((m) => m.person.id),
    ...Object.values(lobby.pending).map((p) => p.id)
  ]);
  const pool = QM_PEOPLE.filter((p) => !used.has(p.id));
  let added = 0;

  QM_FILL_ORDER.forEach((pos) => {
    if (lobby.members[pos] || lobby.pending[pos] || pool.length === 0) return;
    const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    lobby.members[pos] = { person: pick };
    added += 1;
  });

  qmStopSearch();
  qmRenderLobby();
  qmRenderRooms();
  qmShowToast(`🎮 Đã tìm thấy đội! ${added} người chơi đã vào sảnh của bạn`);
}

function qmStartSearch() {
  if (qm.searching) return;

  if (qm.lobby.mode === "joined") {
    qmShowToast(`Bạn đang ở trong phòng của ${qm.lobby.leader.name}. Hãy chờ chủ phòng bắt đầu trận.`);
    return;
  }
  if (qmLobbyMemberCount() + Object.keys(qm.lobby.pending).length >= 5) {
    qmShowToast("Đội của bạn đã đủ 5 người. Hãy vào game thôi! 🎮");
    return;
  }

  qm.searching = true;
  qm.seconds = 0;
  qm.menuPos = null;
  qmRenderLobby();
  qmRenderSearchState();
  qmShowToast("🔍 Đang dò tìm phòng phù hợp với cấu hình của bạn...");

  qm.timerId = setInterval(() => {
    qm.seconds += 1;
    document.getElementById("qm-timer").textContent = qmFormatTime(qm.seconds);
    if (qm.seconds >= 6) qmFinishSearch();
  }, 1000);
}

function qmCancelSearch() {
  if (!qm.searching) return;
  qmStopSearch();
  qmShowToast("Đã huỷ tìm đội");
}

function qmTogglePostRoom() {
  if (qm.lobby.mode === "joined") {
    qmShowToast("Bạn cần rời phòng hiện tại trước khi đăng phòng tuyển người.");
    return;
  }

  if (qm.posted) {
    qm.posted = false;
    qm.myRoom = null;
    qmRenderSearchState();
    qmRenderRooms();
    qmShowToast("Đã gỡ bài tuyển người");
    return;
  }

  const range = qmRange();
  const needs = Object.values(qm.lobby.need);
  const roleNeeds = needs.length ? needs : Array.from(qm.roles);

  qm.myRoom = {
    id: "mine",
    mine: true,
    host: { name: QM_ME.name, avatar: QM_ME.avatar, verified: QM_ME.verified },
    game: qm.game,
    cs2Mode: qm.cs2Mode,
    queue: qm.queue,
    vibe: qm.vibe,
    mic: qm.mic,
    region: qm.region,
    min: qmIdxToFrac(range.min),
    max: qmIdxToFrac(range.max),
    filled: 1,
    needs: roleNeeds
  };
  qm.posted = true;
  qmRenderSearchState();
  qmRenderRooms();
  qmShowToast("📣 Đã đăng phòng tuyển người lên danh sách phòng đang mở");
}

function qmJoinRoom(roomId) {
  const room = QM_ROOMS.find((r) => String(r.id) === String(roomId));
  if (!room) return;

  if (qm.lobby.mode === "joined" && qm.lobby.roomId === room.id) {
    qmShowToast("Bạn đã ở trong phòng này rồi");
    return;
  }
  if (room.filled >= 5) {
    qmShowToast("Phòng đã đủ người");
    return;
  }

  // Rời phòng cũ nếu đang ở phòng khác
  if (qm.lobby.mode === "joined") {
    const oldRoom = QM_ROOMS.find((r) => r.id === qm.lobby.roomId);
    if (oldRoom) oldRoom.filled = Math.max(1, oldRoom.filled - 1);
  }
  if (qm.searching) qmStopSearch();

  // Dựng sảnh của phòng: chủ phòng ở giữa, các thành viên khác + tôi ở các ô trống
  const hostPerson = {
    id: 1000 + room.id,
    name: room.host.name,
    avatar: room.host.avatar,
    verified: room.host.verified,
    tier: (room.min + room.max) / 2
  };

  const others = QM_PEOPLE.filter((p) => p.name !== room.host.name);
  const members = {};
  const otherCount = Math.max(0, room.filled - 1);
  QM_FILL_ORDER.slice(0, otherCount).forEach((pos, i) => {
    members[pos] = { person: others[(room.id + i) % others.length] };
  });
  const myPos = QM_FILL_ORDER.find((pos) => !members[pos]);
  members[myPos] = { person: QM_ME };

  room.filled += 1;
  qm.lobby = {
    mode: "joined",
    roomId: room.id,
    leader: hostPerson,
    config: { queue: room.queue, vibe: room.vibe, mic: room.mic, region: room.region },
    members,
    pending: {},
    need: {}
  };
  qm.menuPos = null;

  qmSwitchView("lobby");
  qmRenderLobby();
  qmRenderRooms();
  qmShowToast(`🚪 Bạn đã vào phòng của ${room.host.name} (${room.filled}/5 người)`);
}

function qmLeaveRoom() {
  if (qm.lobby.mode !== "joined") return;
  const oldRoom = QM_ROOMS.find((r) => r.id === qm.lobby.roomId);
  if (oldRoom) oldRoom.filled = Math.max(1, oldRoom.filled - 1);

  const leaderName = qm.lobby.leader.name;
  qm.lobby = qmCreateOwnLobby();
  qm.menuPos = null;
  qmRenderLobby();
  qmRenderRooms();
  qmShowToast(`Bạn đã rời phòng của ${leaderName}`);
}

function qmSwitchView(view) {
  qm.view = view;
  document.querySelectorAll(".qm-view-btn").forEach((btn) => {
    const active = btn.dataset.view === view;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.getElementById("view-lobby").hidden = view !== "lobby";
  document.getElementById("view-rooms").hidden = view !== "rooms";
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

  // ----- Menu Avatar (đổi giao diện) -----
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

  // ----- 3 Dropdown: Game, Min Rank, Max Rank -----
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

  document.getElementById("menu-dd-game").addEventListener("click", (e) => {
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
    if (qm.lobby.mode === "joined") {
      qmLeaveRoom();
    }
    qmRefreshAll();
    qmShowToast(`Đã chọn game: ${QM_GAMES[nextGame].name}`);
  });

  function onRankPick(e) {
    const item = e.target.closest("button[data-rank-idx]");
    if (!item) return;
    const idx = Number(item.dataset.rankIdx);
    const which = item.dataset.rankWhich;
    const range = qmRange();

    if (which === "min") {
      range.min = idx;
      if (range.min > range.max) range.max = range.min; // Min cao hơn Max -> nâng Max lên bằng Min
    } else {
      range.max = idx;
      if (range.max < range.min) range.min = range.max; // Max thấp hơn Min -> hạ Min xuống bằng Max
    }
    closeAllDropdowns();
    qmRenderRankDropdowns();
    qmRenderSummary();
    qmRenderRooms();
  }
  document.getElementById("menu-dd-min").addEventListener("click", onRankPick);
  document.getElementById("menu-dd-max").addEventListener("click", onRankPick);

  // ----- Nút chọn chế độ, phong cách, mic, khu vực -----
  document.getElementById("qm-card-mode").addEventListener("click", (e) => {
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
  });

  // ----- Chip vị trí cần tìm -----
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

  // ----- Chuyển chế độ xem (Sảnh đội / Danh sách phòng) -----
  document.querySelectorAll(".qm-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => qmSwitchView(btn.dataset.view));
  });

  // ----- Thao tác trong sảnh 5 ô -----
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

  // ----- Thao tác trên danh sách phòng -----
  document.getElementById("qm-rooms-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-room-action]");
    if (!btn) return;
    if (btn.dataset.roomAction === "join") qmJoinRoom(btn.dataset.roomId);
    if (btn.dataset.roomAction === "unpost") qmTogglePostRoom();
  });

  document.getElementById("btn-leave-lobby").addEventListener("click", qmLeaveRoom);

  // ----- Thanh Match Bar -----
  document.getElementById("btn-find-match").addEventListener("click", qmStartSearch);
  document.getElementById("btn-cancel-search").addEventListener("click", qmCancelSearch);
  document.getElementById("btn-post-room").addEventListener("click", qmTogglePostRoom);

  // ----- Bạn bè online ở thanh phải: bấm để mời vào ô trống đầu tiên -----
  document.getElementById("qm-right-online").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-right-friend]");
    if (!btn) return;
    const person = qmPersonById(Number(btn.dataset.rightFriend));
    if (qm.lobby.mode === "joined") {
      qmShowToast("Bạn đang ở trong phòng của người khác nên không thể mời thêm.");
      return;
    }
    const alreadyIn = Object.values(qm.lobby.members).some((m) => m.person.id === person.id) ||
      Object.values(qm.lobby.pending).some((p) => p.id === person.id);
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

  // ----- Thanh điều hướng trái -----
  document.getElementById("btn-nav-create-room").addEventListener("click", () => qmSwitchView("lobby"));
  document.getElementById("btn-nav-find-room").addEventListener("click", () => qmSwitchView("rooms"));

  // ----- Đóng menu / dropdown khi bấm ra ngoài -----
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
  qmSwitchView("lobby");
}

qmInit();
