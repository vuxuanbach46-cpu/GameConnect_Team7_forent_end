// ============================================================
// js/home.js – Sảnh chính & Gợi ý bài đăng tìm đội (T3CCE98)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    // --- 0. BẮT VÀ LƯU TOKEN NẾU REDIRECT TỪ GOOGLE OAUTH ---
    const urlParams = new URLSearchParams(window.location.search);
    const queryAccessToken = urlParams.get("access_token");
    const queryRefreshToken = urlParams.get("refresh_token");

    if (queryAccessToken) {
        localStorage.setItem("access_token", queryAccessToken);
        if (queryRefreshToken) {
            localStorage.setItem("refresh_token", queryRefreshToken);
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

    // Hiển thị tên / email user từ JWT payload
    const userDisplay = document.getElementById("user-display-name");
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const nameOrEmail = payload.email || payload.username || payload.sub || "Game thủ";
        if (userDisplay) {
            userDisplay.innerHTML = `<i class="fa-solid fa-circle-user text-orange-500 mr-1.5"></i> ${nameOrEmail}`;
        }
    } catch (e) {
        if (userDisplay) {
            userDisplay.innerHTML = `<i class="fa-solid fa-circle-user text-orange-500 mr-1.5"></i> Game thủ`;
        }
    }

    // --- 2. XỬ LÝ ĐĂNG XUẤT ---
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user_role");
            window.location.href = "../index.html";
        });
    }

    // --- 3. GỢI Ý BÀI ĐĂNG PHÙ HỢP (T3CCE98) ---
    await initRecommendations();
});

// Cache danh mục games (bao gồm ranks và roles)
let gamesCatalog = [];

function safeEscape(str) {
    if (typeof escapeHtml === "function") return escapeHtml(str);
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function safeFormatDate(dateStr) {
    if (!dateStr) return "";
    if (typeof formatDateTime === "function") return formatDateTime(dateStr);
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
        return dateStr;
    }
}

async function loadGamesCatalog() {
    try {
        if (typeof api !== "undefined") {
            gamesCatalog = await api.get("/games");
        }
    } catch (err) {
        console.warn("Không tải được danh mục games:", err.message);
        gamesCatalog = [];
    }
}

function getGame(gameId) {
    return gamesCatalog.find((g) => g.id === Number(gameId));
}

async function initRecommendations() {
    const container = document.getElementById("recommended-posts-container");
    const headerDesc = document.getElementById("recommend-header-desc");
    const headerBadge = document.getElementById("recommend-header-badge");
    const userGamesBanner = document.getElementById("user-games-banner");
    const userGamesTags = document.getElementById("user-games-tags");

    if (!container) return;

    try {
        // Tải catalog games song song
        await loadGamesCatalog();

        // Gọi API gợi ý bài đăng theo game & rank
        // Hỗ trợ cả 2 endpoint /team-posts/recommendations và /team-posts/recommended
        let res;
        try {
            res = await api.get("/team-posts/recommendations", { limit: 6 });
        } catch (err1) {
            res = await api.get("/team-posts/recommended", { limit: 6 });
        }

        const items = res?.items || [];
        const hasProfileGames = res?.has_profile_games ?? true;
        const userGames = res?.user_games || [];

        // 1. Hiển thị thông tin game trong hồ sơ nếu có
        if (userGamesBanner && userGamesTags && userGames.length > 0) {
            userGamesBanner.classList.remove("hidden");
            userGamesTags.innerHTML = userGames.map(g => `
                <span class="px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-[11px] flex items-center gap-1">
                    <i class="fa-solid fa-gamepad text-[10px]"></i> ${safeEscape(g)}
                </span>
            `).join("");
        }

        // 2. Cập nhật mô tả & badge header
        if (headerDesc) {
            if (userGames.length > 0) {
                headerDesc.textContent = `Tìm thấy ${items.length} bài đăng phù hợp với trình độ Rank của bạn`;
            } else if (!hasProfileGames) {
                headerDesc.textContent = `Bạn chưa cập nhật game trong hồ sơ. Hiển thị các bài đăng đang mở tuyển mới nhất.`;
            } else {
                headerDesc.textContent = `Các bài đăng tìm đồng đội đang mở tuyển sôi nổi nhất`;
            }
        }

        if (headerBadge) {
            if (userGames.length > 0) {
                headerBadge.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i> Khớp Rank & Game (${items.length})`;
            } else {
                headerBadge.innerHTML = `<i class="fa-solid fa-fire text-[9px]"></i> Đang mở tuyển (${items.length})`;
            }
        }

        // 3. Render danh sách bài đăng
        if (items.length === 0) {
            container.innerHTML = `
                <div class="col-span-full bg-[#15161d] border border-[#242631] rounded-xl p-8 text-center space-y-3">
                    <div class="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto text-xl">
                        <i class="fa-solid fa-gamepad"></i>
                    </div>
                    <div class="text-sm font-bold text-white">Chưa có bài đăng nào phù hợp vào lúc này</div>
                    <p class="text-xs text-zinc-400 max-w-md mx-auto">
                        Hãy thử tạo một bài đăng tìm đồng đội mới để kết nối với những người chơi cùng sở thích!
                    </p>
                    <div class="pt-2">
                        <a href="team-posts.html" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition">
                            <i class="fa-solid fa-plus"></i> Đăng bài tìm đồng đội
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(post => {
            const game = getGame(post.game_id);
            const gameName = game ? game.name : `Game #${post.game_id}`;

            // Chuỗi rank yêu cầu
            let rankText = "Mọi bậc rank";
            if (post.min_rank_id || post.max_rank_id) {
                const minR = game?.ranks?.find(r => r.id === post.min_rank_id);
                const maxR = game?.ranks?.find(r => r.id === post.max_rank_id);
                if (minR && maxR) {
                    rankText = `${minR.rank_name} → ${maxR.rank_name}`;
                } else if (minR) {
                    rankText = `Từ ${minR.rank_name}`;
                } else if (maxR) {
                    rankText = `Đến ${maxR.rank_name}`;
                }
            }

            // Tag vai trò
            const roleTags = (post.role_ids || []).map(rid => {
                const role = game?.roles?.find(r => r.id === rid);
                return role ? `<span class="px-1.5 py-0.5 rounded bg-[#1f222e] text-[10px] text-zinc-300 font-medium">${safeEscape(role.role_name)}</span>` : "";
            }).filter(Boolean).join("");

            // Huy hiệu lý do gợi ý
            let matchReasonHtml = "";
            if (post.match_reason) {
                matchReasonHtml = `
                    <div class="mb-3 px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-semibold flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-check text-xs text-orange-400"></i>
                        <span class="truncate">${safeEscape(post.match_reason)}</span>
                    </div>
                `;
            } else {
                matchReasonHtml = `
                    <div class="mb-3 px-2.5 py-1 rounded bg-[#1e2029] border border-[#282b37] text-zinc-400 text-[11px] font-medium flex items-center gap-1.5">
                        <i class="fa-solid fa-fire text-amber-400 text-xs"></i>
                        <span class="truncate">Đang mở tuyển thành viên</span>
                    </div>
                `;
            }

            return `
                <div class="bg-[#15161d] hover:bg-[#1a1c26] border border-[#242631] hover:border-orange-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-lg shadow-black/20">
                    <div>
                        <!-- Header thẻ: Game & Trạng thái -->
                        <div class="flex items-center justify-between gap-2 mb-2">
                            <span class="px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-extrabold truncate">
                                🎮 ${safeEscape(gameName)}
                            </span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Đang mở
                            </span>
                        </div>

                        <!-- Badge lý do gợi ý -->
                        ${matchReasonHtml}

                        <!-- Tiêu đề bài đăng -->
                        <h4 class="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-2">
                            <a href="team-post-detail.html?id=${post.id}">${safeEscape(post.title)}</a>
                        </h4>

                        <!-- Meta: Rank & Số người -->
                        <div class="space-y-1.5 text-xs text-zinc-300 mb-3">
                            <div class="flex items-center gap-2">
                                <span class="text-zinc-500"><i class="fa-solid fa-trophy text-amber-400/80 w-4"></i> Rank:</span>
                                <span class="font-semibold text-white">${safeEscape(rankText)}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-zinc-500"><i class="fa-solid fa-users text-sky-400/80 w-4"></i> Cần tuyển:</span>
                                <span class="font-semibold text-orange-400">${post.needed_players} người</span>
                            </div>
                            ${post.region ? `
                                <div class="flex items-center gap-2">
                                    <span class="text-zinc-500"><i class="fa-solid fa-globe text-emerald-400/80 w-4"></i> Khu vực:</span>
                                    <span class="text-zinc-300">${safeEscape(post.region)}</span>
                                </div>
                            ` : ""}
                            ${post.play_time ? `
                                <div class="flex items-center gap-2">
                                    <span class="text-zinc-500"><i class="fa-solid fa-clock text-purple-400/80 w-4"></i> Giờ chơi:</span>
                                    <span class="text-zinc-300 truncate">${safeEscape(post.play_time)}</span>
                                </div>
                            ` : ""}
                        </div>

                        <!-- Tag vai trò nếu có -->
                        ${roleTags ? `
                            <div class="flex flex-wrap gap-1 mb-3">
                                ${roleTags}
                            </div>
                        ` : ""}

                        <!-- Mô tả ngắn -->
                        ${post.description ? `
                            <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                ${safeEscape(post.description)}
                            </p>
                        ` : ""}
                    </div>

                    <!-- Footer: Thời gian & Nút ứng tuyển -->
                    <div class="pt-3 border-t border-[#242631] flex items-center justify-between gap-2 mt-2">
                        <span class="text-[11px] text-zinc-500 flex items-center gap-1">
                            <i class="fa-regular fa-clock text-[10px]"></i> ${safeFormatDate(post.created_at)}
                        </span>
                        <a href="team-post-detail.html?id=${post.id}" class="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 hover:scale-[1.02]">
                            <span>Ứng tuyển</span>
                            <i class="fa-solid fa-arrow-right text-[10px]"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Lỗi khi tải bài đăng gợi ý:", err);
        container.innerHTML = `
            <div class="col-span-full bg-[#15161d] border border-red-500/20 rounded-xl p-4 text-center text-xs text-zinc-400">
                <i class="fa-solid fa-triangle-exclamation text-red-400 mb-1"></i>
                <p>Không thể tải danh sách gợi ý bài đăng vào lúc này.</p>
            </div>
        `;
    }
}
