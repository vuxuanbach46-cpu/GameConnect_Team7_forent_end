/* ==========================================================================
   GameConnect — Trang Landing (index.html) kết nối 100% dữ liệu thật từ DB
   APIs sử dụng:
   - GET /api/games              : Danh mục tựa game hỗ trợ
   - GET /api/profiles/search    : Hồ sơ game thủ công khai kèm Game, Rank, Role
   - GET /api/matchmaking/rooms  : Các sảnh đội 5v5 đang mở chờ người (WAITING)
   - GET /api/team-posts         : Các bài đăng tuyển đồng đội đang mở (OPEN)
   - GET /api/teams              : Danh sách Câu lạc bộ đang hoạt động
   - GET /posts                  : Bài viết mới nhất trên bảng tin cộng đồng
   ========================================================================== */

(() => {
  if (window.location.pathname.includes("/pages/")) return;

  const GAME_LOGOS = [
    { match: ["valorant"], src: "assets/images/games/valorant.png" },
    { match: ["cs2", "counter-strike", "counter strike"], src: "assets/images/games/cs2.png" },
    { match: ["liên minh", "league of legends", "lol"], src: "assets/images/games/lol.png" },
    { match: ["liên quân", "arena of valor", "aov"], src: "assets/images/games/aov.png" },
    { match: ["चân lý", "chân lý", "teamfight", "tft"], src: "assets/images/games/tft.png" },
  ];

  const state = {
    games: [],
    gameNameById: {},
    selectedGameId: "",
    totalProfiles: 0,
    totalOpenRooms: 0,
    totalTeamPosts: 0,
    totalClubs: 0,
    totalCommunityPosts: 0,
  };

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function unwrap(payload) {
    return payload && typeof payload === "object" && payload.data !== undefined
      ? payload.data
      : payload;
  }

  function diceBearAvatar(seed) {
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed || "Gamer")}&backgroundColor=b6e3f4`;
  }

  function resolveMediaUrl(rawUrl, fallbackSeed = "") {
    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
      return fallbackSeed ? diceBearAvatar(fallbackSeed) : "";
    }
    const trimmed = rawUrl.trim();
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    const cleaned = trimmed.replace(/^(\.\.\/|\.\/)+/, "");
    if (/^(assets|images)\//i.test(cleaned)) return cleaned;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
      : "http://127.0.0.1:8000";
    return `${apiBase}/${cleaned.replace(/^\//, "")}`;
  }

  function getGameLogo(gameName) {
    const lower = String(gameName || "").toLowerCase();
    return GAME_LOGOS.find((item) => item.match.some((term) => lower.includes(term)))?.src || "";
  }

  function getInitials(name) {
    return String(name || "GC")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "GC";
  }

  function formatTimeAgo(isoStr) {
    if (!isoStr) return "Vừa xong";
    const dt = new Date(isoStr);
    if (Number.isNaN(dt.getTime())) return "Vừa xong";
    const mins = Math.max(1, Math.floor((Date.now() - dt.getTime()) / 60000));
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  function updateHeroStatsSummary() {
    const statsEl = document.getElementById("hero-live-stats");
    if (!statsEl) return;

    const totalSquads = state.totalOpenRooms + state.totalTeamPosts;
    const parts = [
      `${state.totalProfiles} hồ sơ game thủ`,
      `${totalSquads} phòng & bài tuyển đội`,
      `${state.totalClubs} câu lạc bộ đang hoạt động`,
    ];
    statsEl.textContent = parts.join(" · ");
  }

  // =========================================================================
  // 1. ĐỒNG BỘ TRẠNG THÁI ĐĂNG NHẬP & OAUTH REDIRECT
  // =========================================================================
  async function initLandingAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryAccess = urlParams.get("access_token");
    const queryRefresh = urlParams.get("refresh_token");

    if (queryAccess) {
      localStorage.setItem("auth_provider", "google");
      localStorage.setItem("access_token", queryAccess);
      if (queryRefresh) localStorage.setItem("refresh_token", queryRefresh);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = "pages/home.html";
      return;
    }

    const token = localStorage.getItem("access_token");
    const authBox = document.getElementById("auth-actions");
    const heroPrimaryCta = document.getElementById("hero-primary-cta");
    const footerPrimaryCta = document.getElementById("footer-primary-cta");
    const heroCardYou = document.getElementById("hero-card-you");

    if (!token) {
      // Nếu chưa đăng nhập: các liên kết cần đăng nhập sẽ chuyển qua login.html?next=...
      document.querySelectorAll("[data-auth-link]").forEach((link) => {
        const target = link.getAttribute("data-auth-link") || "pages/home.html";
        const fileOnly = target.replace(/^pages\//, "");
        link.setAttribute("href", `pages/login.html?next=${encodeURIComponent(fileOnly)}`);
      });
      return;
    }

    // Nếu đã đăng nhập: cập nhật các nút CTA dẫn thẳng vào Sảnh chính (pages/home.html)
    if (heroPrimaryCta) {
      heroPrimaryCta.href = "pages/home.html";
      heroPrimaryCta.innerHTML = '<span>VÀO SẢNH CHÍNH</span><i class="fa-solid fa-arrow-right text-xs"></i>';
    }
    if (footerPrimaryCta) {
      footerPrimaryCta.href = "pages/home.html";
      footerPrimaryCta.textContent = "VÀO SẢNH CHÍNH NGAY";
    }
    if (heroCardYou) {
      heroCardYou.href = "pages/profile.html";
    }

    let displayName = localStorage.getItem("username") || "Game thủ";
    let avatarUrl = diceBearAvatar(displayName);

    try {
      const me = unwrap(await api.get("/user/me")) || {};
      const uname = me.username || displayName;
      displayName = me.display_name || uname;
      avatarUrl = resolveMediaUrl(me.avatar, uname);

      try {
        const prof = unwrap(await api.get("/api/profiles/me")) || {};
        if (prof.display_name) displayName = prof.display_name;
        if (prof.avatar) avatarUrl = resolveMediaUrl(prof.avatar, uname);
      } catch (_) {}
    } catch (_) {}

    if (authBox) {
      authBox.innerHTML = `
        <a href="pages/profile.html" class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-300/70 hover:bg-zinc-300 text-zinc-900 text-xs font-bold transition">
          <img src="${esc(avatarUrl)}" alt="${esc(displayName)}" class="w-6 h-6 rounded-full object-cover border border-zinc-400">
          <span class="max-w-[130px] truncate">${esc(displayName)}</span>
        </a>
        <a href="pages/home.html" class="px-5 py-2 text-xs btn-faceit rounded-md inline-flex items-center gap-1.5">
          <span>VÀO SẢNH CHÍNH</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </a>
      `;
    }

    const youAvatarWrap = document.getElementById("hero-card-you-avatar-wrap");
    const youName = document.getElementById("hero-card-you-name");
    const youMeta = document.getElementById("hero-card-you-meta");
    if (youAvatarWrap) {
      youAvatarWrap.className = "w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400 overflow-hidden p-0.5 bg-zinc-800";
      youAvatarWrap.innerHTML = `<img src="${esc(avatarUrl)}" alt="${esc(displayName)}" class="w-full h-full object-cover rounded-full">`;
    }
    if (youName) youName.textContent = displayName;
    if (youMeta) {
      youMeta.className = "text-[10px] text-emerald-400 font-semibold mt-0.5 truncate";
      youMeta.textContent = "Đang trực tuyến • Vào hồ sơ";
    }
  }

  // =========================================================================
  // 2. TẢI DANH MỤC TỰA GAME TỪ DB (GET /api/games)
  // =========================================================================
  async function loadGamesCatalog() {
    try {
      const raw = unwrap(await api.get("/api/games"));
      const games = Array.isArray(raw) ? raw : (Array.isArray(raw?.games) ? raw.games : []);
      state.games = games;
      games.forEach((g) => {
        const id = g.id ?? g.game_id;
        const name = g.name ?? g.title;
        if (id != null && name) state.gameNameById[Number(id)] = name;
      });

      renderGameFilterButtons();
      renderFooterGames();
    } catch (_) {}
  }

  function renderGameFilterButtons() {
    const container = document.getElementById("landing-game-filters");
    if (!container) return;

    const allBtn = `
      <button
        type="button"
        data-game-id=""
        class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
          state.selectedGameId === ""
            ? "bg-orange-600 text-white border border-orange-500"
            : "bg-[#1b1d26] text-zinc-300 border border-[#2c3040] hover:text-white hover:border-zinc-500"
        }"
      >
        Tất cả game
      </button>
    `;

    const gameBtns = state.games.map((g) => {
      const id = String(g.id ?? g.game_id ?? "");
      const name = g.name ?? g.title ?? `Game #${id}`;
      const logo = getGameLogo(name);
      const active = state.selectedGameId === id;
      return `
        <button
          type="button"
          data-game-id="${esc(id)}"
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            active
              ? "bg-orange-600 text-white border border-orange-500"
              : "bg-[#1b1d26] text-zinc-300 border border-[#2c3040] hover:text-white hover:border-zinc-500"
          }"
        >
          ${logo ? `<img src="${esc(logo)}" alt="" class="w-4 h-4 rounded object-cover">` : ""}
          <span>${esc(name)}</span>
        </button>
      `;
    }).join("");

    container.innerHTML = allBtn + gameBtns;
  }

  function renderFooterGames() {
    const listEl = document.getElementById("footer-games-list");
    if (!listEl || !state.games.length) return;

    listEl.innerHTML = state.games.map((g) => {
      const id = g.id ?? g.game_id;
      const name = g.name ?? g.title;
      return `
        <li>
          <a href="#db-live-section" data-footer-game-id="${esc(id)}" class="hover:text-white transition">
            ${esc(name)}
          </a>
        </li>
      `;
    }).join("");
  }

  // =========================================================================
  // 3. TẢI HỒ SƠ GAME THỦ CÔNG KHAI TỪ DB (GET /api/profiles/search)
  // =========================================================================
  function updateHeroTopPlayerCards(items) {
    if (!Array.isArray(items) || items.length === 0) return;

    const fillHeroCard = (slotIdx, player, accentColor) => {
      if (!player) return;
      const avatarEl = document.getElementById(`hero-card-${slotIdx}-avatar`);
      const nameEl = document.getElementById(`hero-card-${slotIdx}-name`);
      const metaEl = document.getElementById(`hero-card-${slotIdx}-meta`);
      const cardEl = document.getElementById(`hero-card-${slotIdx}`);

      const uname = player.username || `player${player.user_id || slotIdx}`;
      const dname = player.display_name || uname;
      const primaryGame = Array.isArray(player.games) && player.games.length ? player.games[0] : null;
      const metaText = primaryGame
        ? `${primaryGame.game_name}${primaryGame.rank_name ? ` • ${primaryGame.rank_name}` : ""}`
        : (player.region ? `Khu vực ${player.region}` : "Game thủ GameConnect");

      if (avatarEl) {
        avatarEl.src = resolveMediaUrl(player.avatar, uname);
        avatarEl.alt = dname;
      }
      if (nameEl) {
        nameEl.innerHTML = `${esc(dname)} <i class="fa-solid fa-check text-[10px] ${accentColor}"></i>`;
      }
      if (metaEl) {
        metaEl.textContent = metaText;
      }
      if (cardEl && player.username) {
        cardEl.style.cursor = "pointer";
        cardEl.title = `Xem hồ sơ của ${dname}`;
        cardEl.onclick = () => {
          window.location.href = `pages/profile.html?username=${encodeURIComponent(player.username)}`;
        };
      }
    };

    fillHeroCard(1, items[0], "text-orange-500");
    if (items[1]) {
      fillHeroCard(2, items[1], "text-amber-400");
    } else if (items[0]) {
      fillHeroCard(2, items[0], "text-amber-400");
    }
  }

  async function loadPublicGamerProfiles(updateHeroCards = false) {
    const tbody = document.getElementById("landing-players-tbody");
    if (!tbody) return;

    try {
      const params = { page: 1, page_size: 8 };
      if (state.selectedGameId) params.game_id = Number(state.selectedGameId);

      const data = unwrap(await api.get("/api/profiles/search", params)) || {};
      const items = Array.isArray(data.items) ? data.items : [];
      const total = Number(data.total ?? items.length) || 0;

      if (!state.selectedGameId) {
        state.totalProfiles = total;
        updateHeroStatsSummary();
      }
      if (updateHeroCards && items.length > 0) {
        updateHeroTopPlayerCards(items);
      }

      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="py-8 px-6 text-center text-zinc-400">
              Chưa có hồ sơ game thủ công khai nào cho bộ lọc này.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = items.map((player, index) => {
        const uname = player.username || `user${player.user_id || index + 1}`;
        const dname = player.display_name || uname;
        const avatar = resolveMediaUrl(player.avatar, uname);
        const region = player.region || "VN";
        const playTime = player.play_time || "Linh hoạt";
        const hasMic = Boolean(player.has_mic);

        const games = Array.isArray(player.games) ? player.games : [];
        const matchedGame = state.selectedGameId
          ? (games.find((g) => String(g.game_id) === String(state.selectedGameId)) || games[0])
          : games[0];

        const gameName = matchedGame?.game_name || "Chưa chọn game";
        const roleName = matchedGame?.role_name || "";
        const rankName = matchedGame?.rank_name || "Chưa xếp hạng";
        const gameLogo = getGameLogo(gameName);
        const profileHref = `pages/profile.html?username=${encodeURIComponent(uname)}`;

        return `
          <tr class="hover:bg-[#1e2029] transition">
            <td class="py-3.5 px-5 font-black text-white">#${index + 1}</td>
            <td class="py-3.5 px-5">
              <a href="${profileHref}" class="flex items-center gap-3 group">
                <img
                  src="${esc(avatar)}"
                  alt="${esc(dname)}"
                  class="w-9 h-9 rounded-full object-cover bg-zinc-800 border border-[#313545]"
                >
                <div class="min-w-0">
                  <div class="font-bold text-white group-hover:text-orange-400 transition truncate">
                    ${esc(dname)}
                    <i class="fa-solid fa-circle-check text-orange-500 text-[11px] ml-1"></i>
                  </div>
                  <div class="text-[11px] text-zinc-500 truncate">@${esc(uname)}</div>
                </div>
              </a>
            </td>
            <td class="py-3.5 px-5">
              <div class="font-semibold text-zinc-200">${esc(region)}</div>
              <div class="text-[11px] text-zinc-500">
                ${esc(playTime)}${hasMic ? ' · <span class="text-emerald-400">🎤 Có Mic</span>' : ""}
              </div>
            </td>
            <td class="py-3.5 px-5">
              <div class="inline-flex items-center gap-2">
                ${gameLogo ? `<img src="${esc(gameLogo)}" alt="" class="w-4 h-4 rounded object-cover">` : '<i class="fa-solid fa-gamepad text-orange-400"></i>'}
                <span class="font-semibold text-white">${esc(gameName)}</span>
              </div>
              ${roleName ? `<div class="text-[11px] text-zinc-400 mt-0.5">Vị trí: ${esc(roleName)}</div>` : ""}
            </td>
            <td class="py-3.5 px-5">
              <span class="px-2.5 py-1 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-xs">
                ${esc(rankName)}
              </span>
            </td>
            <td class="py-3.5 px-5 text-right">
              <a
                href="${profileHref}"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#222531] hover:bg-orange-600 text-zinc-200 hover:text-white border border-[#323646] hover:border-orange-500 text-xs font-bold transition"
              >
                <span>Xem hồ sơ</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            </td>
          </tr>
        `;
      }).join("");
    } catch (_) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 px-6 text-center text-zinc-500">
            Không tải được danh sách hồ sơ game thủ. Hãy kiểm tra kết nối máy chủ Backend.
          </td>
        </tr>
      `;
    }
  }

  // =========================================================================
  // 4. TẢI PHÒNG ĐANG MỞ & BÀI TUYỂN ĐỒNG ĐỘI (GET /api/matchmaking/rooms & /api/team-posts)
  // =========================================================================
  async function loadOpenRoomsAndTeamPosts() {
    const listEl = document.getElementById("landing-open-rooms-list");
    const badgeRooms = document.getElementById("stat-badge-rooms");
    const badgeTeamPosts = document.getElementById("stat-badge-teamposts");
    const descRooms = document.getElementById("stat-desc-rooms");
    const descTeamPosts = document.getElementById("stat-desc-teamposts");

    try {
      const [roomsSettled, postsSettled] = await Promise.allSettled([
        api.get("/api/matchmaking/rooms"),
        api.get("/api/team-posts", { status: "OPEN", page: 1, page_size: 6 }),
      ]);

      const combined = [];

      if (roomsSettled.status === "fulfilled" && roomsSettled.value) {
        const rawRooms = unwrap(roomsSettled.value);
        const rooms = Array.isArray(rawRooms) ? rawRooms : [];
        state.totalOpenRooms = rooms.length;

        rooms.forEach((r) => {
          const host = Array.isArray(r.members)
            ? (r.members.find((m) => m.is_host) || r.members[0])
            : null;
          const hostName = host ? (host.display_name || host.username) : `Chủ phòng #${r.creator_id || r.id}`;
          const gameName = r.game_name || state.gameNameById[Number(r.game_id)] || "Sảnh 5v5";
          combined.push({
            kind: "ROOM",
            title: r.room_name || `Sảnh đội của ${hostName}`,
            gameName,
            hostName,
            meta: r.play_style_label || "Ranked · Ghép đội nhanh",
            filled: Number(r.current_players) || 1,
            max: Number(r.max_players) || 5,
            href: localStorage.getItem("access_token")
              ? "pages/quick-match.html?view=rooms"
              : "pages/login.html?next=quick-match.html%3Fview%3Drooms",
          });
        });
      }

      if (postsSettled.status === "fulfilled" && postsSettled.value) {
        const rawPosts = unwrap(postsSettled.value) || {};
        const items = Array.isArray(rawPosts.items)
          ? rawPosts.items
          : (Array.isArray(rawPosts) ? rawPosts : []);
        state.totalTeamPosts = Number(rawPosts.total ?? items.length) || 0;

        items.forEach((p) => {
          const needed = Math.min(4, Math.max(1, Number(p.needed_players) || 1));
          const filled = Math.max(1, Math.min(4, 5 - needed));
          const gameName = p.game?.name || state.gameNameById[Number(p.game_id)] || "Tuyển đồng đội";
          const authorName = p.user?.display_name || p.user?.username || `Game thủ #${p.user_id || ""}`;
          const rankRange = [p.min_rank?.rank_name, p.max_rank?.rank_name].filter(Boolean).join(" → ");
          combined.push({
            kind: "POST",
            title: p.title || `Tuyển ${needed} thành viên chiến ${gameName}`,
            gameName,
            hostName: authorName,
            meta: [rankRange, p.region ? `Server ${p.region}` : "", p.play_time || ""].filter(Boolean).join(" · ") || "Đang mở tuyển thành viên",
            filled,
            max: 5,
            href: localStorage.getItem("access_token")
              ? `pages/quick-match.html?view=rooms`
              : "pages/login.html?next=quick-match.html%3Fview%3Drooms",
          });
        });
      }

      updateHeroStatsSummary();

      if (badgeRooms) {
        badgeRooms.textContent = `TRỰC TUYẾN · ${state.totalOpenRooms} SẢNH 5V5 ĐANG CHỜ`;
      }
      if (descRooms && state.totalOpenRooms > 0) {
        descRooms.textContent = `Hiện đang có ${state.totalOpenRooms} sảnh đội 5v5 đang mở chờ thành viên. Ghép đội tự động theo tựa game, khoảng Rank, vị trí (Role) và Mic.`;
      }
      if (badgeTeamPosts) {
        badgeTeamPosts.textContent = `ĐANG MỞ · ${state.totalTeamPosts} BÀI TUYỂN ĐỒNG ĐỘI`;
      }
      if (descTeamPosts && state.totalTeamPosts > 0) {
        descTeamPosts.textContent = `Khám phá ${state.totalTeamPosts} bài đăng tuyển thành viên đang mở trên hệ thống theo đúng bậc Rank và khung giờ chơi của bạn.`;
      }

      if (!listEl) return;

      if (combined.length === 0) {
        listEl.innerHTML = `
          <div class="faceit-card p-6 text-center text-zinc-400 text-xs">
            Hiện chưa có phòng hoặc bài tuyển đội nào đang mở. Hãy tạo sảnh đội đầu tiên!
          </div>
        `;
        return;
      }

      listEl.innerHTML = combined.slice(0, 4).map((item) => {
        const logo = getGameLogo(item.gameName);
        const isRoom = item.kind === "ROOM";
        return `
          <a
            href="${item.href}"
            class="faceit-card p-4 flex items-center justify-between gap-4 hover:border-orange-500/60 transition block"
          >
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="w-11 h-11 rounded-lg bg-[#1e212d] border border-[#2f3344] flex items-center justify-center flex-shrink-0 overflow-hidden">
                ${logo ? `<img src="${esc(logo)}" alt="${esc(item.gameName)}" class="w-7 h-7 object-contain">` : '<i class="fa-solid fa-gamepad text-orange-500"></i>'}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    isRoom
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  }">
                    ${isRoom ? "SẢNH 5V5" : "BÀI TUYỂN"}
                  </span>
                  <span class="text-xs font-bold text-orange-400">${esc(item.gameName)}</span>
                </div>
                <h4 class="text-sm font-bold text-white truncate mt-1">${esc(item.title)}</h4>
                <p class="text-xs text-zinc-400 truncate mt-0.5">
                  Chủ đội: <strong class="text-zinc-200">${esc(item.hostName)}</strong> · ${esc(item.meta)}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 flex-shrink-0">
              <span class="px-2.5 py-1 rounded-md bg-[#222532] border border-[#323748] text-xs font-black text-white">
                ${item.filled}/${item.max}
              </span>
              <span class="px-3 py-1.5 rounded-md btn-faceit text-[11px]">
                Tham gia
              </span>
            </div>
          </a>
        `;
      }).join("");
    } catch (_) {
      if (listEl) {
        listEl.innerHTML = `
          <div class="faceit-card p-6 text-center text-zinc-500 text-xs">
            Không tải được danh sách phòng đang mở.
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // 5. TẢI DANH SÁCH CÂU LẠC BỘ TỪ DB (GET /api/teams)
  // =========================================================================
  async function loadFeaturedClubs() {
    const listEl = document.getElementById("landing-clubs-list");
    const badgeClubs = document.getElementById("stat-badge-clubs");
    const descClubs = document.getElementById("stat-desc-clubs");

    try {
      const data = unwrap(await api.get("/api/teams", { page: 1, page_size: 4 })) || {};
      const items = Array.isArray(data.items)
        ? data.items
        : (Array.isArray(data) ? data : []);
      const total = Number(data.total ?? items.length) || 0;

      state.totalClubs = total;
      updateHeroStatsSummary();

      if (badgeClubs) {
        badgeClubs.textContent = `${total} CÂU LẠC BỘ ĐANG HOẠT ĐỘNG`;
      }
      if (descClubs && total > 0) {
        descClubs.textContent = `Tham gia cùng ${total} câu lạc bộ đang hoạt động trên GameConnect, nhận thông báo lịch tập luyện từ Đội trưởng và xem hồ sơ từng thành viên.`;
      }

      if (!listEl) return;

      if (items.length === 0) {
        listEl.innerHTML = `
          <div class="faceit-card p-6 text-center text-zinc-400 text-xs">
            Chưa có câu lạc bộ nào trong cơ sở dữ liệu.
          </div>
        `;
        return;
      }

      const targetHref = localStorage.getItem("access_token")
        ? "pages/clubs.html"
        : "pages/login.html?next=clubs.html";

      listEl.innerHTML = items.slice(0, 4).map((club) => {
        const name = club.name || `Câu lạc bộ #${club.id}`;
        const gameName = club.game_name || state.gameNameById[Number(club.main_game_id)] || "Đa tựa game";
        const members = Number(club.total_members ?? club.member_count ?? 1);
        const maxMembers = Number(club.max_members) || 100;
        const logoUrl = resolveMediaUrl(club.logo_url || club.logo);
        const initials = esc(getInitials(name));
        const isPublic = (club.join_mode || "PUBLIC") === "PUBLIC";

        const logoHtml = logoUrl
          ? `<img src="${esc(logoUrl)}" alt="${esc(name)}" class="w-11 h-11 rounded-xl object-cover border border-[#323646] flex-shrink-0" onerror="this.outerHTML='<div class=\\'w-11 h-11 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 font-black text-sm flex items-center justify-center flex-shrink-0\\'>${initials}</div>'">`
          : `<div class="w-11 h-11 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 font-black text-sm flex items-center justify-center flex-shrink-0">${initials}</div>`;

        return `
          <a
            href="${targetHref}"
            class="faceit-card p-4 flex items-center justify-between gap-3.5 hover:border-orange-500/60 transition block"
          >
            <div class="flex items-center gap-3 min-w-0">
              ${logoHtml}
              <div class="min-w-0">
                <h4 class="text-sm font-bold text-white truncate">${esc(name)}</h4>
                <div class="text-xs text-zinc-400 truncate mt-0.5">
                  <span class="text-orange-400 font-semibold">${esc(gameName)}</span>
                  · ${isPublic ? "Tham gia tự do" : "Cần phê duyệt"}
                </div>
              </div>
            </div>

            <div class="text-right flex-shrink-0">
              <div class="text-xs font-extrabold text-white">
                <i class="fa-solid fa-users text-zinc-400 mr-1"></i>${members}/${maxMembers}
              </div>
              <span class="text-[10px] text-zinc-500">Thành viên</span>
            </div>
          </a>
        `;
      }).join("");
    } catch (_) {
      if (listEl) {
        listEl.innerHTML = `
          <div class="faceit-card p-6 text-center text-zinc-500 text-xs">
            Không tải được danh sách câu lạc bộ.
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // 6. TẢI BÀI ĐĂNG MỚI NHẤT TỪ BẢNG TIN CỘNG ĐỒNG (GET /posts)
  // =========================================================================
  async function loadLatestCommunityPosts() {
    const gridEl = document.getElementById("landing-posts-grid");
    const badgeCommunity = document.getElementById("stat-badge-community");

    try {
      const raw = unwrap(await api.get("/posts", { skip: 0, limit: 3 }));
      const posts = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.items) ? raw.items : []);

      state.totalCommunityPosts = posts.length;
      if (badgeCommunity && state.games.length > 0) {
        badgeCommunity.textContent = `${state.games.length} TỰA GAME · BẢNG TIN CỘNG ĐỒNG`;
      }

      if (!gridEl) return;

      if (posts.length === 0) {
        gridEl.innerHTML = `
          <div class="faceit-card p-6 text-center text-zinc-400 text-xs md:col-span-3">
            Chưa có bài viết công khai nào trên bảng tin cộng đồng.
          </div>
        `;
        return;
      }

      gridEl.innerHTML = posts.slice(0, 3).map((post) => {
        const postId = post.id ?? post.post_id;
        const authorName = post.author_name || post.author || post.username || "Game thủ";
        const handle = post.author_handle || (post.author_username ? `@${post.author_username}` : "");
        const avatar = resolveMediaUrl(post.author_avatar || post.avatar, post.author_username || authorName);
        const content = post.content || post.body || "";
        const likes = Number(post.like_count ?? post.likes ?? 0);
        const comments = Number(post.comment_count ?? post.comments ?? 0);
        const timeAgo = formatTimeAgo(post.created_at || post.createdAt);
        const href = postId != null
          ? `pages/community-detail.html?id=${encodeURIComponent(postId)}`
          : "pages/community.html";

        return `
          <a
            href="${href}"
            class="faceit-card p-5 flex flex-col justify-between gap-4 hover:border-orange-500/60 transition"
          >
            <div>
              <div class="flex items-center gap-3 mb-3">
                <img
                  src="${esc(avatar)}"
                  alt="${esc(authorName)}"
                  class="w-9 h-9 rounded-full object-cover bg-zinc-800 border border-[#323646]"
                >
                <div class="min-w-0">
                  <div class="text-xs font-bold text-white truncate">${esc(authorName)}</div>
                  <div class="text-[11px] text-zinc-500 truncate">
                    ${handle ? `${esc(handle)} · ` : ""}${esc(timeAgo)}
                  </div>
                </div>
              </div>
              <p class="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                ${esc(content)}
              </p>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-[#242631] text-xs text-zinc-400">
              <div class="flex items-center gap-4">
                <span><i class="fa-regular fa-heart text-orange-400 mr-1"></i>${likes}</span>
                <span><i class="fa-regular fa-comment text-sky-400 mr-1"></i>${comments}</span>
              </div>
              <span class="text-orange-400 font-semibold">Xem bài viết →</span>
            </div>
          </a>
        `;
      }).join("");
    } catch (_) {
      if (gridEl) {
        gridEl.innerHTML = `
          <div class="faceit-card p-6 text-center text-zinc-500 text-xs md:col-span-3">
            Không tải được bài đăng cộng đồng mới nhất.
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // 7. GẮN SỰ KIỆN LỌC THEO TỰA GAME TRÊN TRANG INDEX
  // =========================================================================
  function bindLandingEvents() {
    document.getElementById("landing-game-filters")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-game-id]");
      if (!btn) return;
      state.selectedGameId = btn.getAttribute("data-game-id") || "";
      renderGameFilterButtons();
      loadPublicGamerProfiles(false);
    });

    document.getElementById("footer-games-list")?.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-footer-game-id]");
      if (!link) return;
      state.selectedGameId = link.getAttribute("data-footer-game-id") || "";
      renderGameFilterButtons();
      loadPublicGamerProfiles(false);
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    bindLandingEvents();
    await initLandingAuth();
    await loadGamesCatalog();
    await Promise.allSettled([
      loadPublicGamerProfiles(true),
      loadOpenRoomsAndTeamPosts(),
      loadFeaturedClubs(),
      loadLatestCommunityPosts(),
    ]);
  });
})();
