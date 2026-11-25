function buildDiceBearAvatar(seed) {
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed || "User")}&backgroundColor=b6e3f4`;
}

function resolveHomeAvatarUrl(rawAvatar, seed) {
    if (!rawAvatar || typeof rawAvatar !== "string" || !rawAvatar.trim()) {
        return buildDiceBearAvatar(seed);
    }
    const trimmed = rawAvatar.trim();
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
        return trimmed;
    }
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
        : "";
    if (!apiBase) return trimmed;
    return trimmed.startsWith("/") ? `${apiBase}${trimmed}` : `${apiBase}/${trimmed}`;
}

function showHomeToast(message) {
    const container = document.getElementById("fc-toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "fc-toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
        setTimeout(() => toast.remove(), 240);
    }, 2200);
}

function applyHomeTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("fc-light-mode", isLight);
    localStorage.setItem("gc_friends_theme", isLight ? "light" : "dark");

    const checkDark = document.getElementById("check-theme-dark");
    const checkLight = document.getElementById("check-theme-light");
    if (checkDark) checkDark.textContent = isLight ? "" : "✓";
    if (checkLight) checkLight.textContent = isLight ? "✓" : "";

    document.querySelectorAll(".fc-theme-option").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.setTheme === (isLight ? "light" : "dark"));
    });
}

async function loadHomeUserAvatar(token) {
    const nameEl = document.getElementById("avatar-user-name");
    const avatarImg = document.querySelector(".fc-self-avatar");

    let fallbackName = "Game thủ";
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.username) {
            fallbackName = payload.username;
        } else if (payload.email && typeof payload.email === "string") {
            fallbackName = payload.email.split("@")[0] || "Game thủ";
        } else if (payload.sub) {
            fallbackName = String(payload.sub);
        }
    } catch (_) {}

    if (nameEl) nameEl.textContent = fallbackName;
    if (avatarImg) {
        avatarImg.src = buildDiceBearAvatar(fallbackName);
        avatarImg.alt = fallbackName;
    }

    if (typeof api === "undefined") return;

    try {
        const meRes = await api.get("/user/me");
        const meData = meRes?.data || meRes || {};
        const username = meData.username || fallbackName;
        let displayName = username;
        let avatarUrl = buildDiceBearAvatar(username);

        try {
            const profRes = await api.get("/api/profiles/me");
            const prof = profRes?.data || profRes || {};
            if (prof.display_name) displayName = prof.display_name;
            if (prof.avatar) avatarUrl = resolveHomeAvatarUrl(prof.avatar, username);
        } catch (_) {
            // Tài khoản chưa có profile -> dùng username & avatar mặc định
        }

        if (nameEl) nameEl.textContent = displayName;
        if (avatarImg) {
            avatarImg.src = avatarUrl;
            avatarImg.alt = displayName;
        }
    } catch (_) {
        // Giữ fallback đã hiển thị từ JWT
    }
}

function escapeHomeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function loadOpenRoomsPreview() {
    const countEl = document.getElementById("home-open-rooms-count");
    const listEl = document.getElementById("home-open-rooms-list");
    if (!listEl || typeof api === "undefined") return;

    try {
        const [gamesSettled, roomsSettled, postsSettled] = await Promise.allSettled([
            api.get("/api/games"),
            api.get("/api/matchmaking/rooms"),
            api.get("/api/team-posts", { status: "OPEN" }),
        ]);

        const gameNameById = {};
        if (gamesSettled.status === "fulfilled" && gamesSettled.value) {
            const gamesList = Array.isArray(gamesSettled.value)
                ? gamesSettled.value
                : (Array.isArray(gamesSettled.value?.data) ? gamesSettled.value.data : []);
            gamesList.forEach((g) => {
                if (g && g.id != null) {
                    gameNameById[Number(g.id)] = g.name || "";
                }
            });
        }

        const openRooms = [];

        if (roomsSettled.status === "fulfilled" && roomsSettled.value) {
            const rawRooms = Array.isArray(roomsSettled.value?.data)
                ? roomsSettled.value.data
                : (Array.isArray(roomsSettled.value) ? roomsSettled.value : []);
            rawRooms.forEach((r) => {
                const hostMember = Array.isArray(r.members)
                    ? (r.members.find((m) => m.is_host) || r.members[0])
                    : null;
                const hostLabel = hostMember ? (hostMember.display_name || hostMember.username) : "";
                const roomTitle = r.room_name || (hostLabel ? `Phòng của ${hostLabel}` : `Phòng #${r.id}`);
                const gameLabel = r.game_name || gameNameById[Number(r.game_id)] || "Tổ đội 5v5";
                openRooms.push({
                    title: roomTitle,
                    meta: hostLabel ? `${gameLabel} · Chủ phòng: ${hostLabel}` : gameLabel,
                    filled: Number(r.current_players) || 1,
                    max: Number(r.max_players) || 5,
                });
            });
        }

        if (postsSettled.status === "fulfilled" && postsSettled.value) {
            const postItems = Array.isArray(postsSettled.value?.items)
                ? postsSettled.value.items
                : (Array.isArray(postsSettled.value?.data?.items) ? postsSettled.value.data.items : []);
            postItems.forEach((p) => {
                const needed = Math.min(4, Math.max(1, Number(p.needed_players) || 1));
                const filled = Math.max(1, Math.min(4, 5 - needed));
                const gameLabel = gameNameById[Number(p.game_id)] || "Tìm đồng đội";
                const region = p.region === "SEA" ? "SEA" : "VN";
                openRooms.push({
                    title: p.title || `Tuyển thêm ${needed} người`,
                    meta: `${gameLabel} · Khu vực ${region}`,
                    filled,
                    max: 5,
                });
            });
        }

        if (countEl) {
            countEl.textContent = `${openRooms.length} phòng`;
        }

        if (openRooms.length === 0) {
            listEl.innerHTML = `<div class="home-room-empty">Hiện chưa có phòng nào đang chờ — bấm bên dưới để xem hoặc tạo phòng mới.</div>`;
            return;
        }

        listEl.innerHTML = openRooms.slice(0, 3).map((room) => `
            <a href="quick-match.html?view=rooms" class="home-room-item">
                <div class="home-room-main">
                    <span class="home-room-name">${escapeHomeHtml(room.title)}</span>
                    <span class="home-room-meta">${escapeHomeHtml(room.meta)}</span>
                </div>
                <span class="home-room-slot">${room.filled}/${room.max}</span>
            </a>
        `).join("");
    } catch (_) {
        if (countEl) countEl.textContent = "0 phòng";
        listEl.innerHTML = `<div class="home-room-empty">Chưa tải được danh sách phòng mở. Bấm nút bên dưới để mở trang Tìm phòng.</div>`;
    }
}

function getHomeClubInitials(name) {
    return String(name || "GC")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "GC";
}

function resolveHomeClubLogoUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) return "";
    const trimmed = rawUrl.trim();
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
        : "http://127.0.0.1:8000";
    return `${apiBase}/${trimmed.replace(/^\//, "")}`;
}

async function loadFeaturedClubsPreview() {
    const countEl = document.getElementById("home-featured-clubs-count");
    const listEl = document.getElementById("home-featured-clubs-list");
    if (!listEl || typeof api === "undefined") return;

    try {
        const res = await api.get("/api/teams", { page: 1, page_size: 4 });
        const data = res?.data !== undefined ? res.data : res;
        const items = Array.isArray(data?.items)
            ? data.items
            : (Array.isArray(data) ? data : []);
        const total = Number(data?.total ?? items.length) || 0;

        if (countEl) {
            countEl.textContent = `${total} CLB`;
        }

        if (items.length === 0) {
            listEl.innerHTML = `<div class="home-room-empty">Hiện chưa có câu lạc bộ nào trong hệ thống — bấm bên dưới để tạo hoặc khám phá.</div>`;
            return;
        }

        const badgePalettes = [
            "bg-sky-500/20 text-sky-400",
            "bg-orange-500/20 text-orange-400",
            "bg-emerald-500/20 text-emerald-400",
            "bg-purple-500/20 text-purple-400",
        ];

        listEl.innerHTML = items.slice(0, 4).map((team, idx) => {
            const clubName = team.name || `Câu lạc bộ #${team.id}`;
            const gameName = team.game_name || team.game?.name || "";
            const memberCount = Number(team.total_members ?? team.member_count ?? team.members_count ?? 1);
            const maxMembers = Number(team.max_members) || 0;
            const memberText = maxMembers > 0 ? `${memberCount}/${maxMembers}` : `${memberCount}`;
            const logoUrl = resolveHomeClubLogoUrl(team.logo_url || team.logo);
            const initials = escapeHomeHtml(getHomeClubInitials(clubName));
            const palette = badgePalettes[idx % badgePalettes.length];

            const avatarHtml = logoUrl
                ? `<img src="${escapeHomeHtml(logoUrl)}" alt="${escapeHomeHtml(clubName)}" class="w-7 h-7 rounded object-cover flex-shrink-0 border border-[#2e313e]" onerror="this.outerHTML='<div class=\\'w-7 h-7 rounded ${palette} flex items-center justify-center font-bold text-xs flex-shrink-0\\'>${initials}</div>'">`
                : `<div class="w-7 h-7 rounded ${palette} flex items-center justify-center font-bold text-xs flex-shrink-0">${initials}</div>`;

            return `
                <a href="clubs.html" class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#1b1d26] hover:bg-[#222530] transition">
                    <div class="flex items-center gap-2.5 min-w-0">
                        ${avatarHtml}
                        <div class="min-w-0 flex flex-col">
                            <span class="text-xs font-bold text-white truncate">${escapeHomeHtml(clubName)}</span>
                            ${gameName ? `<span class="text-[10.5px] text-zinc-400 truncate">${escapeHomeHtml(gameName)}</span>` : ""}
                        </div>
                    </div>
                    <span class="text-[11px] text-zinc-400 flex-shrink-0" title="Số lượng thành viên"><i class="fa-solid fa-users mr-1"></i>${escapeHomeHtml(memberText)}</span>
                </a>
            `;
        }).join("");
    } catch (_) {
        if (countEl) countEl.textContent = "0 CLB";
        listEl.innerHTML = `<div class="home-room-empty">Chưa tải được danh sách câu lạc bộ. Bấm bên dưới để mở trang Câu lạc bộ.</div>`;
    }
}

function formatHomePostTimeAgo(isoStr) {
    if (!isoStr) return "Vừa xong";
    const dt = new Date(isoStr);
    if (Number.isNaN(dt.getTime())) return "Vừa xong";
    const diffMin = Math.max(1, Math.floor((Date.now() - dt.getTime()) / 60000));
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
}

async function loadLatestPostsPreview() {
    const listEl = document.getElementById("home-latest-posts-list");
    if (!listEl || typeof api === "undefined") return;

    try {
        const res = await api.get("/posts", { skip: 0, limit: 3 });
        const rawPosts = Array.isArray(res?.data)
            ? res.data
            : (Array.isArray(res?.items)
                ? res.items
                : (Array.isArray(res?.posts)
                    ? res.posts
                    : (Array.isArray(res) ? res : [])));

        if (rawPosts.length === 0) {
            listEl.innerHTML = `<div class="home-room-empty">Chưa có bài đăng nào trong cộng đồng — bấm "Xem cộng đồng →" để chia sẻ bài viết đầu tiên.</div>`;
            return;
        }

        const sortedPosts = [...rawPosts].sort((a, b) => {
            const ta = new Date(a.created_at || a.createdAt || 0).getTime() || 0;
            const tb = new Date(b.created_at || b.createdAt || 0).getTime() || 0;
            return tb - ta;
        });

        listEl.innerHTML = sortedPosts.slice(0, 3).map((post) => {
            const postId = post.id ?? post.post_id;
            const detailHref = postId != null
                ? `community-detail.html?id=${encodeURIComponent(postId)}`
                : "community.html";
            const authorName = post.author_name || post.author || post.user_name || post.username || "Game thủ";
            const username = post.author_username || post.username || "";
            const handle = username ? `@${String(username).replace(/^@/, "")}` : "";
            const initials = escapeHomeHtml(getHomeClubInitials(authorName));
            const rawAvatar = post.author_avatar || post.avatar || "";
            const avatarUrl = rawAvatar ? resolveHomeAvatarUrl(rawAvatar, username || authorName) : "";
            const timeLabel = formatHomePostTimeAgo(post.created_at || post.createdAt || post.created);
            const content = post.content || post.body || post.title || "";
            const likesCount = Number(post.likes ?? post.like_count ?? 0);
            const commentsCount = Number(post.comments ?? post.comment_count ?? 0);
            const isLiked = Boolean(post.liked_by_current_user ?? post.is_liked);

            const avatarInner = avatarUrl
                ? `<img src="${escapeHomeHtml(avatarUrl)}" alt="${escapeHomeHtml(authorName)}" class="w-full h-full rounded-[7px] object-cover" onerror="this.parentElement.textContent='${initials}'">`
                : initials;

            return `
                <div class="home-post-card">
                    <div class="home-post-avatar overflow-hidden">${avatarInner}</div>
                    <div class="home-post-content">
                        <div class="home-post-meta">
                            <strong class="home-post-author">${escapeHomeHtml(authorName)}</strong>
                            ${handle ? `<span class="home-post-time">${escapeHomeHtml(handle)}</span>` : ""}
                            <span class="home-post-time">· ${escapeHomeHtml(timeLabel)}</span>
                        </div>
                        <p class="home-post-text">${escapeHomeHtml(content)}</p>
                        <div class="home-post-actions">
                            <a href="${detailHref}" class="home-post-action-link">
                                <i class="${isLiked ? "fa-solid text-orange-500" : "fa-regular"} fa-heart"></i>
                                <span>${likesCount}</span>
                            </a>
                            <a href="${detailHref}#comments" class="home-post-action-link">
                                <i class="fa-regular fa-comment"></i>
                                <span>${commentsCount} thảo luận</span>
                            </a>
                            <a href="${detailHref}" class="home-post-action-link">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                <span>Xem chi tiết</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    } catch (_) {
        listEl.innerHTML = `<div class="home-room-empty">Chưa tải được bài đăng mới nhất. Bấm "Xem cộng đồng →" để xem tất cả bài viết.</div>`;
    }
}

// =========================================================================
// KHU VỰC KẾT NỐI & LỜI MỜI NHANH TRÊN TRANG HOME (100% DỮ LIỆU THẬT TỪ API)
// =========================================================================
const HOME_GAME_LOGOS = {
    Valorant: "../assets/images/games/valorant.png",
    "Liên Minh Huyền Thoại": "../assets/images/games/lol.png",
    "Đấu Trường Chân Lý": "../assets/images/games/tft.png",
    CS2: "../assets/images/games/cs2.png",
    "Liên Quân Mobile": "../assets/images/games/aov.png",
};

const HOME_GAME_OPTIONS = [
    { value: "ALL", label: "Tất cả game", logo: "" },
    { value: "Valorant", label: "Valorant", logo: HOME_GAME_LOGOS.Valorant },
    { value: "Liên Minh Huyền Thoại", label: "Liên Minh Huyền Thoại", logo: HOME_GAME_LOGOS["Liên Minh Huyền Thoại"] },
    { value: "Đấu Trường Chân Lý", label: "Đấu Trường Chân Lý", logo: HOME_GAME_LOGOS["Đấu Trường Chân Lý"] },
    { value: "CS2", label: "CS2", logo: HOME_GAME_LOGOS.CS2 },
    { value: "Liên Quân Mobile", label: "Liên Quân Mobile", logo: HOME_GAME_LOGOS["Liên Quân Mobile"] },
];

const HOME_STATUS_OPTIONS = [
    { value: "ALL", label: "Mọi trạng thái", dotClass: "is-all" },
    { value: "online", label: "Đang trực tuyến", dotClass: "is-online" },
    { value: "offline", label: "Ngoại tuyến", dotClass: "is-offline" },
];

const HOME_TAB_META = {
    friends: {
        heading: "DANH SÁCH BẠN BÈ",
        summarySuffix: "Người bạn đang kết nối",
        emptyText: "Bạn chưa có bạn bè nào khớp bộ lọc hiện tại.",
    },
    received: {
        heading: "LỜI MỜI KẾT BẠN ĐẾN",
        summarySuffix: "Lời mời đang chờ bạn xác nhận",
        emptyText: "Hiện chưa có lời mời kết bạn nào gửi đến bạn.",
    },
    sent: {
        heading: "LỜI MỜI ĐÃ GỬI",
        summarySuffix: "Lời mời đang chờ đối phương đồng ý",
        emptyText: "Hiện chưa có lời mời kết bạn nào bạn đã gửi.",
    },
    suggestions: {
        heading: "GỢI Ý KẾT BẠN",
        summarySuffix: "Người chơi gợi ý trong hệ thống",
        emptyText: "Chưa tìm thấy người chơi gợi ý nào khớp bộ lọc.",
    },
};

const HOME_SOCIAL = {
    friends: [],
    received: [],
    sent: [],
    suggestions: [],
    blocked: [],
    activeTab: "sent",
    hasPickedInitialTab: false,
    searchQuery: "",
    selectedGame: "ALL",
    selectedStatus: "ALL",
    currentPage: 1,
    pageSize: 6,
    isLoading: true,
};

function normalizeHomeGameName(rawName) {
    if (!rawName || !String(rawName).trim()) return "";
    const s = String(rawName).trim().toLowerCase();
    if (s.includes("valorant")) return "Valorant";
    if (s.includes("cs2") || s.includes("counter-strike") || s.includes("counter strike")) return "CS2";
    if (s.includes("liên quân") || s.includes("lien quan") || s.includes("aov") || s.includes("arena of valor")) return "Liên Quân Mobile";
    if (s.includes("chân lý") || s.includes("chan ly") || s.includes("tft") || s.includes("đtcl") || s.includes("teamfight")) return "Đấu Trường Chân Lý";
    if (s.includes("liên minh") || s.includes("lien minh") || s.includes("lol") || s.includes("league")) return "Liên Minh Huyền Thoại";
    return String(rawName).trim();
}

function formatHomeRelativeTime(isoStr, prefix) {
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

function mapHomeSocialPlayer(raw, tabType) {
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
    const displayName = String(userObj.display_name || raw.display_name || username || `User #${userId}`).trim();
    const handle = username ? `@${username}` : "";

    const pg = userObj.primary_game || raw.primary_game || (Array.isArray(userObj.games) ? userObj.games[0] : null) || null;
    const realGameName = normalizeHomeGameName(pg && (pg.game_name || pg.name));
    const hasGame = Boolean(realGameName);
    const gameDisplay = realGameName || "Chưa cập nhật game";
    const roles = (pg && Array.isArray(pg.roles)) ? pg.roles : [];
    const rankName = (pg && pg.rank_name && String(pg.rank_name).trim()) ? String(pg.rank_name).trim() : "Chưa xếp hạng";
    const elo = pg && pg.elo ? String(pg.elo) : "";

    const inRoom = Boolean(userObj.in_room ?? raw.in_room ?? false);
    const presence = tabType === "blocked"
        ? "offline"
        : (inRoom ? "ingame" : (userObj.presence || raw.presence || "online"));

    let statusText = "ĐANG TRỰC TUYẾN";
    let statusTone = "";
    if (tabType === "friends") {
        statusText = inRoom ? "ĐANG TRONG PHÒNG" : "ĐANG TRỰC TUYẾN";
    } else if (tabType === "received") {
        statusText = formatHomeRelativeTime(raw.created_at, "GỬI LỜI MỜI");
    } else if (tabType === "sent") {
        statusText = `${formatHomeRelativeTime(raw.created_at, "ĐÃ GỬI")} · ĐANG CHỜ PHẢN HỒI`;
        statusTone = "is-sent";
    } else if (tabType === "suggestions") {
        const mutual = Number(userObj.mutual_friends_count ?? raw.mutual_friends_count ?? 0);
        statusText = raw.reason
            ? String(raw.reason).toUpperCase()
            : (mutual > 0 ? `${mutual} BẠN CHUNG` : "GỢI Ý KẾT BẠN");
        statusTone = "is-muted";
    }

    return {
        id: userId,
        userId,
        requestId,
        username,
        name: displayName,
        handle,
        avatar: resolveHomeAvatarUrl(userObj.avatar ?? raw.avatar, username || displayName),
        presence,
        statusText,
        statusTone,
        hasGame,
        game: gameDisplay,
        roles,
        rankName,
        rankSub: tabType === "sent" ? "Đang chờ..." : (elo || (roles.length ? roles.join(", ") : "")),
    };
}

function updateHomeTopbarCounters() {
    const mapIds = {
        friends: "home-count-friends",
        received: "home-count-received",
        sent: "home-count-sent",
        suggestions: "home-count-suggestions",
        blocked: "home-count-blocked",
    };

    Object.entries(mapIds).forEach(([key, elId]) => {
        const el = document.getElementById(elId);
        if (el) el.textContent = String(HOME_SOCIAL[key].length);
    });

    const sentTabLink = document.getElementById("home-top-tab-sent");
    if (sentTabLink) {
        sentTabLink.classList.toggle("has-highlight", HOME_SOCIAL.sent.length > 0);
    }

    const sidebarBadge = document.getElementById("sidebar-req-badge");
    if (sidebarBadge) {
        const recCount = HOME_SOCIAL.received.length;
        sidebarBadge.textContent = String(recCount);
        sidebarBadge.style.display = recCount > 0 ? "flex" : "none";
    }
}

function getHomeFilteredPlayers(tabKey) {
    const list = HOME_SOCIAL[tabKey] || [];
    const q = HOME_SOCIAL.searchQuery.trim().toLowerCase();

    return list.filter((p) => {
        if (HOME_SOCIAL.selectedGame !== "ALL" && p.game !== HOME_SOCIAL.selectedGame) {
            return false;
        }
        if (HOME_SOCIAL.selectedStatus === "online" && p.presence === "offline") {
            return false;
        }
        if (HOME_SOCIAL.selectedStatus === "offline" && p.presence !== "offline") {
            return false;
        }
        if (q) {
            const haystack = `${p.name} ${p.handle} ${p.game} ${p.rankName} ${p.roles.join(" ")}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    });
}

function renderHomeFilterDropdowns() {
    const rawList = HOME_SOCIAL[HOME_SOCIAL.activeTab] || [];

    // 1. Dropdown Game
    const gameLabelEl = document.getElementById("home-label-dd-game");
    const gameMenuEl = document.getElementById("home-menu-dd-game");
    if (gameLabelEl && gameMenuEl) {
        const activeGame = HOME_GAME_OPTIONS.find((g) => g.value === HOME_SOCIAL.selectedGame) || HOME_GAME_OPTIONS[0];
        gameLabelEl.innerHTML = activeGame.logo
            ? `<img src="${activeGame.logo}" alt="${escapeHomeHtml(activeGame.label)}" class="home-dd-logo"><span>${escapeHomeHtml(activeGame.label)}</span>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg><span>${escapeHomeHtml(activeGame.label)}</span>`;

        gameMenuEl.innerHTML = HOME_GAME_OPTIONS.map((opt) => {
            const count = opt.value === "ALL"
                ? rawList.length
                : rawList.filter((p) => p.game === opt.value).length;
            const isActive = opt.value === HOME_SOCIAL.selectedGame;
            return `
                <button type="button" class="home-dd-item ${isActive ? "active" : ""}" data-home-filter-game="${escapeHomeHtml(opt.value)}">
                    <span class="home-dd-item-left">
                        ${opt.logo ? `<img src="${opt.logo}" alt="" class="home-dd-logo">` : ""}
                        <span>${escapeHomeHtml(opt.label)}</span>
                    </span>
                    <span class="home-dd-item-right">
                        <span>${count}</span>
                        <span class="home-dd-check">${isActive ? "✓" : ""}</span>
                    </span>
                </button>
            `;
        }).join("");
    }

    // 2. Dropdown Status
    const statusLabelEl = document.getElementById("home-label-dd-status");
    const statusMenuEl = document.getElementById("home-menu-dd-status");
    if (statusLabelEl && statusMenuEl) {
        const activeStatus = HOME_STATUS_OPTIONS.find((s) => s.value === HOME_SOCIAL.selectedStatus) || HOME_STATUS_OPTIONS[0];
        statusLabelEl.innerHTML = `<span class="home-dd-dot ${activeStatus.dotClass}"></span><span>${escapeHomeHtml(activeStatus.label)}</span>`;

        statusMenuEl.innerHTML = HOME_STATUS_OPTIONS.map((opt) => {
            const count = opt.value === "ALL"
                ? rawList.length
                : (opt.value === "online"
                    ? rawList.filter((p) => p.presence !== "offline").length
                    : rawList.filter((p) => p.presence === "offline").length);
            const isActive = opt.value === HOME_SOCIAL.selectedStatus;
            return `
                <button type="button" class="home-dd-item ${isActive ? "active" : ""}" data-home-filter-status="${escapeHomeHtml(opt.value)}">
                    <span class="home-dd-item-left">
                        <span class="home-dd-dot ${opt.dotClass}"></span>
                        <span>${escapeHomeHtml(opt.label)}</span>
                    </span>
                    <span class="home-dd-item-right">
                        <span>${count}</span>
                        <span class="home-dd-check">${isActive ? "✓" : ""}</span>
                    </span>
                </button>
            `;
        }).join("");
    }
}

function renderHomePlayerActionBtns(player, tabKey) {
    const moreLink = `<a href="friends.html?tab=${encodeURIComponent(tabKey)}" class="home-action-btn home-action-more" title="Xem đầy đủ ở trang Bạn bè">•••</a>`;

    if (tabKey === "sent") {
        return `
            <button type="button" class="home-action-btn is-danger-ghost" data-home-action="cancel-sent" data-id="${player.id}">Hủy lời mời</button>
            ${moreLink}
        `;
    }
    if (tabKey === "received") {
        return `
            <button type="button" class="home-action-btn is-primary" data-home-action="accept" data-id="${player.id}">✓ Chấp nhận</button>
            <button type="button" class="home-action-btn is-danger-ghost" data-home-action="reject" data-id="${player.id}">Từ chối</button>
            ${moreLink}
        `;
    }
    if (tabKey === "friends") {
        return `
            <button type="button" class="home-action-btn is-primary" data-home-action="invite" data-id="${player.id}">+ Mời vào đội</button>
            ${moreLink}
        `;
    }
    return `
        <button type="button" class="home-action-btn is-primary" data-home-action="add-friend" data-id="${player.id}">+ Kết bạn</button>
        ${moreLink}
    `;
}

function renderHomePlayerRow(player, tabKey) {
    const presenceClass = player.presence === "ingame"
        ? "is-ingame"
        : (player.presence === "online" ? "is-online" : "");
    const gameLogo = HOME_GAME_LOGOS[player.game];

    return `
        <div class="home-player-row">
            <div class="home-player-identity">
                <div class="home-player-avatar-wrap">
                    <img src="${escapeHomeHtml(player.avatar)}" alt="${escapeHomeHtml(player.name)}" class="home-player-avatar">
                    <span class="home-player-presence-dot ${presenceClass}"></span>
                </div>
                <div class="home-player-info">
                    <span class="home-player-status-line ${player.statusTone}">${escapeHomeHtml(player.statusText)}</span>
                    <div class="home-player-name-line">
                        <span class="home-player-name">${escapeHomeHtml(player.name)}</span>
                        ${player.handle ? `<span class="home-player-handle">${escapeHomeHtml(player.handle)}</span>` : ""}
                    </div>
                </div>
            </div>

            <div class="home-player-game-col">
                ${gameLogo
                    ? `<img src="${gameLogo}" alt="${escapeHomeHtml(player.game)}" class="home-player-game-logo">`
                    : `<span class="home-player-game-dot"></span>`
                }
                <span class="home-player-game-text">${escapeHomeHtml(player.game)}</span>
            </div>

            <div class="home-player-rank-col">
                <div class="home-player-rank-meta">
                    <span class="home-player-rank-name">${escapeHomeHtml(player.rankName)}</span>
                    ${player.rankSub ? `<span class="home-player-rank-sub">${escapeHomeHtml(player.rankSub)}</span>` : ""}
                </div>
            </div>

            <div class="home-player-actions">
                ${renderHomePlayerActionBtns(player, tabKey)}
            </div>
        </div>
    `;
}

function renderHomeSocialList() {
    const listEl = document.getElementById("home-players-list");
    const paginationEl = document.getElementById("home-players-pagination");
    const headingEl = document.getElementById("home-players-heading");
    const summaryEl = document.getElementById("home-toolbar-summary");
    if (!listEl) return;

    const tabMeta = HOME_TAB_META[HOME_SOCIAL.activeTab] || HOME_TAB_META.sent;
    if (headingEl) headingEl.textContent = tabMeta.heading;

    document.querySelectorAll(".home-mini-tab").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.homeTab === HOME_SOCIAL.activeTab);
    });

    renderHomeFilterDropdowns();

    if (HOME_SOCIAL.isLoading) {
        listEl.innerHTML = `<div class="home-players-empty">Đang tải dữ liệu kết nối...</div>`;
        if (paginationEl) paginationEl.innerHTML = "";
        if (summaryEl) summaryEl.textContent = "Đang tải dữ liệu...";
        return;
    }

    const totalInTab = (HOME_SOCIAL[HOME_SOCIAL.activeTab] || []).length;
    let filtered = getHomeFilteredPlayers(HOME_SOCIAL.activeTab);
    let renderTabKey = HOME_SOCIAL.activeTab;
    let isFallbackSuggestions = false;

    if (filtered.length === 0 && HOME_SOCIAL.searchQuery.trim() && HOME_SOCIAL.activeTab !== "suggestions") {
        const fallbackMatches = getHomeFilteredPlayers("suggestions");
        if (fallbackMatches.length > 0) {
            filtered = fallbackMatches;
            renderTabKey = "suggestions";
            isFallbackSuggestions = true;
        }
    }

    if (summaryEl) {
        summaryEl.textContent = isFallbackSuggestions
            ? `Tìm thấy ${filtered.length} người chơi gợi ý để kết bạn`
            : `Tổng ${filtered.length}/${totalInTab} — ${tabMeta.summarySuffix}`;
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="home-players-empty">${escapeHomeHtml(tabMeta.emptyText)}</div>`;
        if (paginationEl) {
            paginationEl.innerHTML = `
                <span class="home-page-info">Trang <strong>1</strong> / <strong>1</strong> · Hiển thị <strong>0</strong> người chơi</span>
                <div class="home-page-controls">
                    <a href="friends.html?tab=${encodeURIComponent(HOME_SOCIAL.activeTab)}" class="home-page-btn">Mở trang Bạn bè →</a>
                </div>
            `;
        }
        return;
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / HOME_SOCIAL.pageSize));
    if (HOME_SOCIAL.currentPage > totalPages) HOME_SOCIAL.currentPage = totalPages;

    const startIdx = (HOME_SOCIAL.currentPage - 1) * HOME_SOCIAL.pageSize;
    const endIdx = Math.min(filtered.length, startIdx + HOME_SOCIAL.pageSize);
    const pageItems = filtered.slice(startIdx, endIdx);

    const fallbackBanner = isFallbackSuggestions
        ? `<div class="home-players-fallback-banner">Kết quả tìm người chơi để kết bạn</div>`
        : "";

    listEl.innerHTML = fallbackBanner + pageItems.map((p) => renderHomePlayerRow(p, renderTabKey)).join("");

    if (paginationEl) {
        let pagesHtml = "";
        for (let i = 1; i <= totalPages; i++) {
            pagesHtml += `<button type="button" class="home-page-btn ${i === HOME_SOCIAL.currentPage ? "active" : ""}" data-home-page="${i}">${i}</button>`;
        }

        paginationEl.innerHTML = `
            <span class="home-page-info">
                Trang <strong>${HOME_SOCIAL.currentPage}</strong> / <strong>${totalPages}</strong> · Hiển thị <strong>${startIdx + 1}-${endIdx}</strong> trên <strong>${filtered.length}</strong> người chơi
            </span>
            <div class="home-page-controls">
                <button type="button" class="home-page-btn" data-home-page="${HOME_SOCIAL.currentPage - 1}" ${HOME_SOCIAL.currentPage <= 1 ? "disabled" : ""}>« Trước</button>
                ${pagesHtml}
                <button type="button" class="home-page-btn" data-home-page="${HOME_SOCIAL.currentPage + 1}" ${HOME_SOCIAL.currentPage >= totalPages ? "disabled" : ""}>Sau »</button>
                <select id="home-page-size-select" class="home-page-size-select" aria-label="Số người mỗi trang">
                    <option value="6" ${HOME_SOCIAL.pageSize === 6 ? "selected" : ""}>6 / trang</option>
                    <option value="10" ${HOME_SOCIAL.pageSize === 10 ? "selected" : ""}>10 / trang</option>
                    <option value="20" ${HOME_SOCIAL.pageSize === 20 ? "selected" : ""}>20 / trang</option>
                </select>
            </div>
        `;
    }
}

async function loadHomeSocialData() {
    if (typeof api === "undefined" || !localStorage.getItem("access_token")) return;

    HOME_SOCIAL.isLoading = true;
    renderHomeSocialList();

    const [friendsRes, receivedRes, sentRes, suggestionsRes, blocksRes] = await Promise.allSettled([
        api.get("/friend-requests/friends"),
        api.get("/friend-requests/received", { status: "PENDING" }),
        api.get("/friend-requests/sent", { status: "PENDING" }),
        api.get("/friend-requests/suggestions", { limit: 50 }),
        api.get("/friend-requests/blocks"),
    ]);

    const extractList = (settled, nestedKey) => {
        if (settled.status !== "fulfilled" || !settled.value) return [];
        const val = settled.value;
        if (nestedKey && Array.isArray(val?.data?.[nestedKey])) return val.data[nestedKey];
        if (nestedKey && Array.isArray(val?.[nestedKey])) return val[nestedKey];
        if (Array.isArray(val?.data)) return val.data;
        if (Array.isArray(val)) return val;
        return [];
    };

    HOME_SOCIAL.friends = extractList(friendsRes).map((item) => mapHomeSocialPlayer(item, "friends"));
    HOME_SOCIAL.received = extractList(receivedRes).map((item) => mapHomeSocialPlayer(item, "received"));
    HOME_SOCIAL.sent = extractList(sentRes).map((item) => mapHomeSocialPlayer(item, "sent"));
    HOME_SOCIAL.suggestions = extractList(suggestionsRes, "suggestions").map((item) => mapHomeSocialPlayer(item, "suggestions"));
    HOME_SOCIAL.blocked = extractList(blocksRes).map((item) => mapHomeSocialPlayer(item, "blocked"));

    if (!HOME_SOCIAL.hasPickedInitialTab) {
        if (HOME_SOCIAL.sent.length > 0) HOME_SOCIAL.activeTab = "sent";
        else if (HOME_SOCIAL.received.length > 0) HOME_SOCIAL.activeTab = "received";
        else if (HOME_SOCIAL.friends.length > 0) HOME_SOCIAL.activeTab = "friends";
        else HOME_SOCIAL.activeTab = "suggestions";
        HOME_SOCIAL.hasPickedInitialTab = true;
    }

    HOME_SOCIAL.isLoading = false;
    updateHomeTopbarCounters();
    renderHomeSocialList();
}

async function handleHomeSocialAction(e) {
    const btn = e.target.closest("button[data-home-action]");
    if (!btn) return;
    const action = btn.dataset.homeAction;
    const id = Number(btn.dataset.id);
    if (!id) return;

    btn.disabled = true;
    try {
        if (action === "cancel-sent") {
            const target = HOME_SOCIAL.sent.find((x) => x.id === id);
            const requestId = (target && target.requestId) || id;
            await api.delete(`/friend-requests/${requestId}`);
            showHomeToast(`Đã hủy lời mời gửi tới ${target ? target.name : `#${id}`}`);
            await loadHomeSocialData();
            return;
        }
        if (action === "accept") {
            const target = HOME_SOCIAL.received.find((x) => x.id === id);
            const requestId = (target && target.requestId) || id;
            await api.put(`/friend-requests/${requestId}/accept`);
            showHomeToast(`✅ Đã chấp nhận lời mời của ${target ? target.name : `#${id}`}`);
            await loadHomeSocialData();
            return;
        }
        if (action === "reject") {
            const target = HOME_SOCIAL.received.find((x) => x.id === id);
            const requestId = (target && target.requestId) || id;
            await api.put(`/friend-requests/${requestId}/reject`);
            showHomeToast(`Đã từ chối lời mời của ${target ? target.name : `#${id}`}`);
            await loadHomeSocialData();
            return;
        }
        if (action === "add-friend") {
            const target = HOME_SOCIAL.suggestions.find((x) => x.id === id);
            const receiverId = (target && target.userId) || id;
            await api.post("/friend-requests", { receiver_id: receiverId });
            showHomeToast(`📨 Đã gửi lời mời kết bạn tới ${target ? target.name : `#${id}`}`);
            await loadHomeSocialData();
            return;
        }
        if (action === "invite") {
            const target = HOME_SOCIAL.friends.find((x) => x.id === id);
            const targetUserId = (target && target.userId) || id;
            await api.post(`/api/matchmaking/invite/${targetUserId}`);
            showHomeToast(`🎮 Đã gửi lời mời vào đội cho ${target ? target.name : `#${id}`}`);
        }
    } catch (err) {
        showHomeToast(`⚠️ ${err?.message || "Không thể thực hiện thao tác"}`);
    } finally {
        btn.disabled = false;
    }
}

function initHomeSocialControls() {
    // 1. Mini-tabs trong khung danh sách người chơi
    document.querySelectorAll(".home-mini-tab").forEach((btn) => {
        btn.addEventListener("click", () => {
            const nextTab = btn.dataset.homeTab;
            if (!nextTab || !HOME_TAB_META[nextTab]) return;
            HOME_SOCIAL.activeTab = nextTab;
            HOME_SOCIAL.currentPage = 1;
            renderHomeSocialList();
        });
    });

    // 2. Tìm kiếm + debounce gọi API gợi ý
    const searchInput = document.getElementById("home-search-input");
    let searchTimer = null;
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            HOME_SOCIAL.searchQuery = e.target.value;
            HOME_SOCIAL.currentPage = 1;
            renderHomeSocialList();

            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(async () => {
                if (typeof api === "undefined" || !localStorage.getItem("access_token")) return;
                try {
                    const res = await api.get("/friend-requests/suggestions", {
                        q: HOME_SOCIAL.searchQuery.trim(),
                        limit: 50,
                    });
                    const rawSuggestions = res?.data?.suggestions || res?.suggestions || res?.data || [];
                    if (Array.isArray(rawSuggestions)) {
                        HOME_SOCIAL.suggestions = rawSuggestions.map((item) => mapHomeSocialPlayer(item, "suggestions"));
                        updateHomeTopbarCounters();
                        renderHomeSocialList();
                    }
                } catch (_) {}
            }, 300);
        });
    }

    // 3. Dropdown Game & Status
    const ddGame = document.getElementById("home-dd-game");
    const btnGame = document.getElementById("home-btn-dd-game");
    const menuGame = document.getElementById("home-menu-dd-game");
    const ddStatus = document.getElementById("home-dd-status");
    const btnStatus = document.getElementById("home-btn-dd-status");
    const menuStatus = document.getElementById("home-menu-dd-status");

    function closeHomeFilterDropdowns() {
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
            closeHomeFilterDropdowns();
            if (willOpen) {
                ddGame.classList.add("is-open");
                menuGame.hidden = false;
                btnGame.setAttribute("aria-expanded", "true");
            }
        });
        menuGame.addEventListener("click", (e) => {
            const opt = e.target.closest("button[data-home-filter-game]");
            if (!opt) return;
            HOME_SOCIAL.selectedGame = opt.dataset.homeFilterGame;
            HOME_SOCIAL.currentPage = 1;
            closeHomeFilterDropdowns();
            renderHomeSocialList();
        });
    }

    if (btnStatus && menuStatus && ddStatus) {
        btnStatus.addEventListener("click", (e) => {
            e.stopPropagation();
            const willOpen = menuStatus.hidden;
            closeHomeFilterDropdowns();
            if (willOpen) {
                ddStatus.classList.add("is-open");
                menuStatus.hidden = false;
                btnStatus.setAttribute("aria-expanded", "true");
            }
        });
        menuStatus.addEventListener("click", (e) => {
            const opt = e.target.closest("button[data-home-filter-status]");
            if (!opt) return;
            HOME_SOCIAL.selectedStatus = opt.dataset.homeFilterStatus;
            HOME_SOCIAL.currentPage = 1;
            closeHomeFilterDropdowns();
            renderHomeSocialList();
        });
    }

    document.addEventListener("click", (e) => {
        if ((!ddGame || !ddGame.contains(e.target)) && (!ddStatus || !ddStatus.contains(e.target))) {
            closeHomeFilterDropdowns();
        }
    });

    // 4. Actions & Pagination
    const listEl = document.getElementById("home-players-list");
    if (listEl) {
        listEl.addEventListener("click", handleHomeSocialAction);
    }

    const paginationEl = document.getElementById("home-players-pagination");
    if (paginationEl) {
        paginationEl.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-home-page]");
            if (!btn || btn.disabled) return;
            const nextPage = Number(btn.dataset.homePage);
            if (nextPage && nextPage !== HOME_SOCIAL.currentPage) {
                HOME_SOCIAL.currentPage = nextPage;
                renderHomeSocialList();
            }
        });
        paginationEl.addEventListener("change", (e) => {
            if (e.target.id === "home-page-size-select") {
                HOME_SOCIAL.pageSize = Number(e.target.value) || 6;
                HOME_SOCIAL.currentPage = 1;
                renderHomeSocialList();
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // --- 0. BẮT VÀ LƯU TOKEN NẾU REDIRECT TỪ GOOGLE OAUTH ---
    const urlParams = new URLSearchParams(window.location.search);
    const queryAccessToken = urlParams.get("access_token");
    const queryRefreshToken = urlParams.get("refresh_token");

    if (queryAccessToken) {
        localStorage.setItem("auth_provider", "google");
        localStorage.setItem("access_token", queryAccessToken);
        if (localStorage.getItem("remember_login") === "true" && queryRefreshToken) {
            localStorage.setItem("refresh_token", queryRefreshToken);
        } else {
            localStorage.removeItem("refresh_token");
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- 1. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP ---
    const token = localStorage.getItem("access_token");

    // Người dùng CHƯA đăng nhập -> Chuyển đến file index
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    // --- 2. ĐỒNG BỘ GIAO DIỆN SÁNG / TỐI (CHUNG KEY VỚI FRIENDS.HTML) ---
    const savedTheme = localStorage.getItem("gc_friends_theme") || "dark";
    applyHomeTheme(savedTheme);

    // --- 3. MENU AVATAR (CHUYỂN LIGHT/DARK MODE + ĐĂNG XUẤT) ---
    const avatarBtn = document.getElementById("btn-avatar-menu");
    const avatarDropdown = document.getElementById("avatar-dropdown-menu");
    const changePasswordMenuItem = document.getElementById("open-change-password");
    if (changePasswordMenuItem) {
        changePasswordMenuItem.hidden = localStorage.getItem("auth_provider") === "google";
    }

    if (avatarBtn && avatarDropdown) {
        avatarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            avatarDropdown.hidden = !avatarDropdown.hidden;
        });

        document.querySelectorAll(".fc-theme-option").forEach((opt) => {
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const selected = opt.dataset.setTheme;
                applyHomeTheme(selected);
                avatarDropdown.hidden = true;
                showHomeToast(selected === "light" ? "☀️ Đã chuyển sang Chế độ Sáng" : "🌙 Đã chuyển sang Chế độ Tối");
            });
        });

        document.addEventListener("click", (e) => {
            if (!avatarDropdown.hidden && !avatarDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
                avatarDropdown.hidden = true;
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !avatarDropdown.hidden) {
                avatarDropdown.hidden = true;
            }
        });
    }

    // Popup đổi mật khẩu từ menu avatar
    const passwordModal = document.getElementById("change-password-modal");
    const passwordForm = document.getElementById("change-password-form");
    const passwordMessage = document.getElementById("change-password-message");
    const passwordSubmit = document.getElementById("change-password-submit");
    const setPasswordModal = (open) => {
        if (!passwordModal) return;
        passwordModal.hidden = !open;
        document.body.classList.toggle("gc-password-modal-open", open);
        if (open) {
            if (avatarDropdown) avatarDropdown.hidden = true;
            window.setTimeout(() => document.getElementById("old-password")?.focus(), 30);
        } else {
            passwordForm?.reset();
            if (passwordMessage) {
                passwordMessage.hidden = true;
                passwordMessage.textContent = "";
                passwordMessage.classList.remove("error");
            }
        }
    };
    document.getElementById("open-change-password")?.addEventListener("click", (event) => {
        event.stopPropagation();
        setPasswordModal(true);
    });
    ["close-change-password", "cancel-change-password"].forEach((id) => {
        document.getElementById(id)?.addEventListener("click", () => setPasswordModal(false));
    });
    passwordModal?.querySelectorAll("[data-close-password]").forEach((el) => {
        el.addEventListener("click", () => setPasswordModal(false));
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && passwordModal && !passwordModal.hidden) setPasswordModal(false);
    });
    passwordForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById("old-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const showPasswordMessage = (text, isError = false) => {
            passwordMessage.textContent = text;
            passwordMessage.classList.toggle("error", isError);
            passwordMessage.hidden = false;
        };
        if (newPassword !== confirmPassword) {
            showPasswordMessage("Mật khẩu xác nhận không khớp.", true);
            return;
        }
        if (oldPassword === newPassword) {
            showPasswordMessage("Mật khẩu mới cần khác mật khẩu hiện tại.", true);
            return;
        }

        passwordSubmit.disabled = true;
        passwordSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
        try {
            const response = await api.put("/auth/change-password", {
                old_password: oldPassword,
                new_password: newPassword,
            });
            showPasswordMessage(response?.message || "Đổi mật khẩu thành công.");
            passwordForm.reset();
        } catch (error) {
            showPasswordMessage(error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.", true);
        } finally {
            passwordSubmit.disabled = false;
            passwordSubmit.innerHTML = '<i class="fa-solid fa-key"></i> Cập nhật mật khẩu';
        }
    });

    // Tải tên & avatar thật vào menu Avatar
    loadHomeUserAvatar(token);

    // Tải danh sách phòng đang mở thật cho khối "Tổ đội đang tìm người"
    loadOpenRoomsPreview();

    // Tải danh sách câu lạc bộ nổi bật thật từ DB cho khối "Câu lạc bộ nổi bật"
    loadFeaturedClubsPreview();

    // Tải danh sách bài đăng cộng đồng mới nhất thật từ DB cho khối "Bài đăng mới nhất"
    loadLatestPostsPreview();

    // Khởi tạo & tải dữ liệu thật cho 5 tab Topbar + bảng người chơi/lời mời nhanh
    initHomeSocialControls();
    loadHomeSocialData();

    // --- 4. XỬ LÝ ĐĂNG XUẤT (TRONG MENU AVATAR) ---
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("remember_login");
            localStorage.removeItem("auth_provider");
            localStorage.removeItem("user_role");
            window.location.href = "../index.html";
        });
    }
});
