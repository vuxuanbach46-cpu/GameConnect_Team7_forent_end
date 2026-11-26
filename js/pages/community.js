const CURRENT_USER = {
  id: null,
  username: "",
  name: "Game thủ",
  handle: "@gameconnect",
  avatarUrl: "",
};
const COMMUNITY_GAMES = {
  Valorant: { label: "Valorant", image: "../assets/images/games/valorant.png", art: "valorant" },
  "Liên Minh Huyền Thoại": { label: "League of Legends", image: "../assets/images/games/lol.png", art: "lol" },
  CS2: { label: "Counter-Strike 2", image: "../assets/images/games/cs2.png", art: "cs2" },
  "Liên Quân Mobile": { label: "Liên Quân Mobile", image: "../assets/images/games/aov.png", art: "aov" },
  TFT: { label: "Đấu Trường Chân Lý", image: "../assets/images/games/tft.png", art: "lol" },
};
const COMMUNITY_GAME_ALIASES = {
  Valorant: ["valorant"],
  "Liên Minh Huyền Thoại": ["liên minh huyền thoại", "league of legends"],
  CS2: ["cs2", "counter-strike 2", "counter strike 2"],
  "Liên Quân Mobile": ["liên quân mobile", "arena of valor", "aov"],
  TFT: ["tft", "đấu trường chân lý", "teamfight tactics"],
};
const COMMUNITY_GAME_IDS = new Map();
const COMMUNITY_GAME_KEYS_BY_ID = new Map();

const feedList = document.getElementById("feed-list");
const postForm = document.getElementById("post-form");
const contentInput = document.getElementById("post-content");
const gameInput = document.getElementById("post-game");
const imageInput = document.getElementById("post-image");
const imagePreview = document.getElementById("image-preview");
const imageCountLabel = document.getElementById("image-count");
const composerError = document.getElementById("composer-error");
const publishButton = document.getElementById("publish-button");
const cancelEditButton = document.getElementById("cancel-edit");
const loadMoreButton = document.getElementById("load-more");
const feedStatus = document.getElementById("feed-status");
const feedEmpty = document.getElementById("feed-empty");
const deletePostModal = document.getElementById("delete-post-modal");
const confirmDeletePostButton = document.getElementById("confirm-delete-post");
const visibilityInput = document.getElementById("post-visibility");
const COMPOSER_GAME_ICONS = {
  Valorant: "../assets/images/games/valorant.png",
  "Liên Minh Huyền Thoại": "../assets/images/games/lol.png",
  CS2: "../assets/images/games/cs2.png",
  "Liên Quân Mobile": "../assets/images/games/aov.png",
  TFT: "../assets/images/games/tft.png",
};
const COMPOSER_VISIBILITY = {
  PUBLIC: { icon: "☀️", label: "Mọi người" },
  FRIENDS: { icon: "👥", label: "Bạn bè" },
  PRIVATE: { icon: "🔒", label: "Chỉ mình tôi" },
};

function renderComposerSelect(select, kind) {
  const wrap = document.querySelector(`[data-composer-select="${kind}"]`);
  const label = document.getElementById(`post-${kind}-label`);
  const menu = document.getElementById(`post-${kind}-menu`);
  const trigger = document.getElementById(`post-${kind}-trigger`);
  if (!select || !wrap || !label || !menu || !trigger) return;

  const options = [...select.options];
  const selected = options.find((option) => option.value === select.value) || options[0];
  const visibility = kind === "visibility" ? COMPOSER_VISIBILITY[selected.value] : null;
  const gameIcon = kind === "game" ? COMPOSER_GAME_ICONS[selected.value] : null;
  label.innerHTML = visibility
    ? `<span class="composer-visibility-icon" aria-hidden="true">${visibility.icon}</span><span>${escapeHtml(visibility.label)}</span>`
    : (gameIcon
      ? `<img class="composer-select-game-icon" src="${gameIcon}" alt=""><span>${escapeHtml(selected.textContent.trim())}</span>`
      : `<i class="fa-solid fa-gamepad" aria-hidden="true"></i><span>${escapeHtml(selected.textContent.trim())}</span>`);
  menu.innerHTML = options.map((option) => {
    const isSelected = option.value === select.value;
    const optionVisibility = kind === "visibility" ? COMPOSER_VISIBILITY[option.value] : null;
    const optionIcon = kind === "game" ? COMPOSER_GAME_ICONS[option.value] : null;
    const icon = optionVisibility
      ? `<span class="composer-visibility-icon" aria-hidden="true">${optionVisibility.icon}</span>`
      : (optionIcon
        ? `<img class="composer-select-game-icon" src="${optionIcon}" alt="">`
        : `<i class="fa-solid fa-gamepad" aria-hidden="true"></i>`);
    return `<button type="button" class="composer-select-option" role="option" aria-selected="${isSelected}" data-value="${escapeHtml(option.value)}"><span class="composer-select-option-left">${icon}<span>${escapeHtml(optionVisibility?.label || option.textContent.trim())}</span></span><span class="composer-select-check">${isSelected ? "✓" : ""}</span></button>`;
  }).join("");
}

function closeComposerSelects(except = null) {
  document.querySelectorAll(".composer-select-wrap.is-open").forEach((wrap) => {
    if (wrap === except) return;
    wrap.classList.remove("is-open");
    wrap.querySelector(".composer-select-menu").hidden = true;
    wrap.querySelector(".composer-select-trigger").setAttribute("aria-expanded", "false");
  });
}

[[visibilityInput, "visibility"], [gameInput, "game"]].forEach(([select, kind]) => {
  if (!select) return;
  renderComposerSelect(select, kind);
  select.addEventListener("change", () => renderComposerSelect(select, kind));
  const wrap = document.querySelector(`[data-composer-select="${kind}"]`);
  const trigger = document.getElementById(`post-${kind}-trigger`);
  const menu = document.getElementById(`post-${kind}-menu`);
  trigger?.addEventListener("click", () => {
    const opening = !wrap.classList.contains("is-open");
    closeComposerSelects(wrap);
    wrap.classList.toggle("is-open", opening);
    menu.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
  });
  menu?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-value]");
    if (!option) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    closeComposerSelects();
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".composer-select-wrap")) closeComposerSelects();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeComposerSelects();
});
const activeGameFilter = document.getElementById("active-game-filter");
const searchForm = document.getElementById("post-search-form");
const searchInput = document.getElementById("post-search");
const searchSummary = document.getElementById("search-summary");

let activeFilter = "all";
let activeGame = "";
let feedSource = "all"; // "all" | "friends"
const FEED_PAGE_SIZE = 10;
let feedHasMore = true;
let feedLoadingMore = false;
let editingId = null;
const MAX_POST_IMAGES = 4;
let draftImages = []; // các URL ảnh đã có của bài (từ backend hoặc đã upload)
let selectedImageFiles = []; // File người dùng vừa chọn chưa upload
let previewObjectUrls = [];
let searchMode = "";
let searchResults = [];
let searchLoading = false;
let searchError = "";
let apiPosts = [];
let feedLoadError = "";
let pendingDeletePost = null;

function getCurrentUserId() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Number(payload.sub);
  } catch (_error) {
    return null;
  }
}

const CURRENT_USER_ID = getCurrentUserId();

function getCommentCount(post) {
  return Number(post.comments || 0);
}

function getAllPosts() {
  return [...apiPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function buildCommunityAvatar(seed) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed || "Game thủ")}&backgroundColor=b6e3f4`;
}

function resolveCommunityMediaUrl(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed) || /^(data|blob):/i.test(trimmed) || trimmed.startsWith("../")) return trimmed;
  const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
    ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
    : "";
  return trimmed.startsWith("/") && apiBase ? `${apiBase}${trimmed}` : "";
}

function normalizeCommunityGameKey(value) {
  const normalized = String(value || "").trim().toLocaleLowerCase("vi");
  return Object.entries(COMMUNITY_GAME_ALIASES).find(([, aliases]) =>
    aliases.includes(normalized),
  )?.[0] || "";
}

function avatarMarkup(avatarUrl, name) {
  if (!avatarUrl) return escapeHtml(String(name || "G").slice(0, 1).toUpperCase());
  return `<img src="${escapeHtml(resolveCommunityMediaUrl(avatarUrl))}" alt="" loading="lazy">`;
}

function attachAvatarFallbacks(root) {
  root.querySelectorAll(".avatar img").forEach((image) => {
    image.addEventListener("error", () => {
      const wrapper = image.closest(".avatar");
      if (wrapper) wrapper.textContent = wrapper.dataset.fallback || "G";
    }, { once: true });
  });
}

function attachPostImageFallbacks(root) {
  attachAvatarFallbacks(root);
  root.querySelectorAll(".post-media img").forEach((image) => {
    image.addEventListener("error", () => {
      const message = document.createElement("p");
      message.className = "post-image-error";
      message.textContent = "Không thể tải ảnh bài viết.";
      image.replaceWith(message);
    }, { once: true });
  });
}

function isCurrentUser(userId) {
  return userId != null && (
    String(userId) === String(CURRENT_USER.id) ||
    (CURRENT_USER_ID != null && String(userId) === String(CURRENT_USER_ID))
  );
}

function setAvatarImage(element, url, name) {
  if (!element) return;
  const fallback = String(name || "G").slice(0, 1).toUpperCase();
  const image = document.createElement("img");
  image.src = resolveCommunityMediaUrl(url || buildCommunityAvatar(name));
  image.alt = `Ảnh đại diện ${name || "Game thủ"}`;
  image.addEventListener("error", () => {
    element.textContent = fallback;
  }, { once: true });
  element.replaceChildren(image);
}

async function loadCurrentCommunityUser() {
  const userResponse = await api.get("/user/me");
  const user = userResponse?.data || userResponse || {};
  CURRENT_USER.id = String(user.id || getCurrentUserId() || "");
  CURRENT_USER.username = user.username || "";
  CURRENT_USER.name = user.username || "Game thủ";
  CURRENT_USER.handle = user.username ? `@${user.username}` : "@gameconnect";
  CURRENT_USER.avatarUrl = buildCommunityAvatar(CURRENT_USER.username || CURRENT_USER.name);

  try {
    const profileResponse = await api.get("/api/profiles/me");
    const profile = profileResponse?.data || profileResponse || {};
    if (profile.display_name) CURRENT_USER.name = profile.display_name;
    if (profile.avatar) CURRENT_USER.avatarUrl = resolveCommunityMediaUrl(profile.avatar);
  } catch (error) {
    if (error?.status !== 404) throw error;
  }

  const nameElement = document.querySelector("#avatar-dropdown-menu .fc-avatar-dropdown-header strong");
  if (nameElement) nameElement.textContent = CURRENT_USER.name;
  const rightAvatar = document.querySelector(".fc-self-avatar");
  if (rightAvatar) {
    rightAvatar.src = CURRENT_USER.avatarUrl;
    rightAvatar.alt = `Ảnh đại diện ${CURRENT_USER.name}`;
  }
  setAvatarImage(document.querySelector(".composer-topline .avatar-self"), CURRENT_USER.avatarUrl, CURRENT_USER.name);
}

function extractPostList(payload) {
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.posts)) return payload.posts;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

async function loadCommunityGameCatalog() {
  const status = document.getElementById("game-catalog-status");
  const options = [...gameInput.options].filter((option) => option.value);
  gameInput.disabled = true;

  try {
    const catalog = extractPostList(await api.get("/api/games"));
    COMMUNITY_GAME_IDS.clear();
    COMMUNITY_GAME_KEYS_BY_ID.clear();
    catalog.forEach((game) => {
      const key = normalizeCommunityGameKey(game.name);
      const id = Number(game.id);
      if (!key || !Number.isInteger(id) || id < 1) return;
      COMMUNITY_GAME_IDS.set(key, id);
      COMMUNITY_GAME_KEYS_BY_ID.set(id, key);
    });

    let unavailableCount = 0;
    options.forEach((option) => {
      const key = normalizeCommunityGameKey(option.value);
      const gameId = COMMUNITY_GAME_IDS.get(key);
      option.disabled = !gameId;
      option.dataset.gameId = gameId ? String(gameId) : "";
      if (!gameId) unavailableCount += 1;
    });

    gameInput.disabled = COMMUNITY_GAME_IDS.size === 0;
    if (status) {
      status.hidden = false;
      status.textContent = COMMUNITY_GAME_IDS.size === 0
        ? "Danh mục game chưa được thiết lập."
        : unavailableCount > 0
          ? "Một số game chưa có trong danh mục."
          : "";
      status.hidden = !status.textContent;
    }
  } catch (error) {
    options.forEach((option) => {
      option.disabled = true;
      option.dataset.gameId = "";
    });
    if (status) {
      status.textContent = "Không tải được danh mục game.";
      status.hidden = false;
    }
    showToast(error?.message || "Không thể tải danh mục game.", "error");
  }
}

function normalizeApiPost(post) {
  const author = post.author_name || post.author || post.user_name || "Game thủ";
  const username = post.author_username || post.username || "";
  const handle = post.author_handle || post.handle || username;
  const gameIds = Array.isArray(post.game_ids) ? post.game_ids : [];
  const rawGameName = post.game || post.game_name || COMMUNITY_GAME_KEYS_BY_ID.get(Number(gameIds[0])) || "";
  const gameName = normalizeCommunityGameKey(rawGameName) || rawGameName;
  const content = post.content || post.body || post.title || "";
  const imageUrls = Array.isArray(post.image_urls) ? post.image_urls : [];
  const images = imageUrls.map((url) => resolveCommunityMediaUrl(url)).filter(Boolean);
  const image = images[0] || resolveCommunityMediaUrl(post.image || post.image_url || "");
  return {
    id: String(post.id ?? post.post_id ?? `api-${Math.random()}`),
    authorId: post.user_id != null ? String(post.user_id) : null,
    numericId: post.id != null ? post.id : null,
    author,
    username,
    handle: handle ? (String(handle).startsWith("@") ? String(handle) : `@${handle}`) : "@gameconnect",
    avatarUrl: post.author_avatar || post.avatar || buildCommunityAvatar(username || author),
    avatar: String(author).slice(0, 1).toUpperCase(),
    game: gameName,
    content,
    image,
    images: images.length ? images : (image ? [image] : []),
    createdAt: post.createdAt || post.created_at || post.created || new Date().toISOString(),
    likes: Number(post.likes || post.like_count || 0),
    comments: Number(post.comments || post.comment_count || 0),
    isLiked: Boolean(post.liked_by_current_user ?? post.is_liked),
    userId: post.user_id != null ? Number(post.user_id) : null,
    visibility: post.visibility || "PUBLIC",
    visual: Boolean(post.visual),
  };
}

function selectedGameOptionValue(post) {
  // Trả về value của option khớp game của bài viết trong select post-game
  const wanted = normalizeCommunityGameKey(post.game) || post.game;
  if (!wanted) return "";
  const option = [...gameInput.options].find(
    (item) => normalizeCommunityGameKey(item.value) === wanted || item.value === post.game,
  );
  return option ? option.value : "";
}

function timeAgo(value) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function renderPost(post) {
  const owner = isCurrentUser(post.authorId);
  const game = COMMUNITY_GAMES[post.game];
  const gameTag = game ? `<span class="post-game-tag">${escapeHtml(game.label)}</span>` : "";
  const media = post.images?.length
    ? `<div class="post-media post-media-grid ${post.images.length > 1 ? "post-media-multi" : ""}">${post.images.map((url, index) => `<img src="${escapeHtml(url)}" alt="Ảnh ${index + 1} được chia sẻ bởi ${escapeHtml(post.author)}" loading="lazy">`).join("")}</div>`
    : post.visual && game
      ? `<div class="post-media post-media-art media-${game.art}" aria-label="Hình minh hoạ ${escapeHtml(game.label)}">
          <img src="${game.image}" alt="">
          <span class="art-caption">GAMECONNECT · ${escapeHtml(game.label.toUpperCase())}</span>
        </div>`
      : "";
  const liked = post.isLiked;
  const safeId = escapeHtml(post.id);
  const visibilityLabels = {
    PUBLIC: { text: "🌤 Mọi người", title: "Bài viết công khai - ai cũng có thể xem" },
    FRIENDS: { text: "👥 Bạn bè", title: "Chỉ bạn bè của bạn có thể xem bài này" },
    PRIVATE: { text: "🔒 Chỉ mình tôi", title: "Chỉ bạn có thể xem bài này" },
  };
  const visibilityBadge = owner && visibilityLabels[post.visibility]
    ? `<span class="post-visibility-badge" title="${visibilityLabels[post.visibility].title}">${visibilityLabels[post.visibility].text}</span>`
    : "";

  return `
    <article class="post-card" data-post-id="${safeId}">
      <header class="post-top">
        <div class="avatar ${owner ? "avatar-self" : ""}" aria-hidden="true" data-fallback="${escapeHtml(post.avatar)}">${avatarMarkup(post.avatarUrl, post.author)}</div>
        <div class="post-author">
          <strong><button type="button" class="post-author-link" data-author-id="${escapeHtml(post.userId ?? "")}" data-author-name="${escapeHtml(post.author)}">${escapeHtml(post.author)}</button>${owner ? "" : '<span class="author-badge" title="Game thủ đã xác thực">✦</span>'}</strong>
          <small>${escapeHtml(post.handle)} · ${timeAgo(post.createdAt)} ${visibilityBadge}</small>
        </div>
        ${owner ? `<details class="post-menu">
          <summary aria-label="Tuỳ chọn bài viết">···</summary>
          <div class="post-menu-actions">
            <button type="button" data-action="edit" data-id="${safeId}">Chỉnh sửa</button>
            <button type="button" data-action="delete" data-id="${safeId}">Xoá bài viết</button>
          </div>
        </details>` : `<details class="post-menu">
          <summary aria-label="Tuỳ chọn bài viết">···</summary>
          <div class="post-menu-actions">
            <button type="button" data-action="block" data-id="${safeId}" data-user-id="${escapeHtml(post.userId ?? "")}" data-user-name="${escapeHtml(post.author)}">Chặn ${escapeHtml(post.author)}</button>
            <button type="button" data-report-type="POST" data-report-id="${safeId}" data-report-title="${escapeHtml(post.content ? post.content.slice(0, 60) : 'Bài viết')}" data-report-owner="${escapeHtml(post.author)}">🚩 Báo cáo bài viết</button>
            ${post.userId ? `<button type="button" data-report-type="USER" data-report-id="${escapeHtml(post.userId)}" data-report-title="Tài khoản ${escapeHtml(post.author)}" data-report-owner="${escapeHtml(post.author)}">🛡 Báo cáo người dùng</button>` : ""}
          </div>
        </details>`}
      </header>
      <div class="post-copy"><p>${escapeHtml(post.content)}</p>${gameTag}</div>
      ${media}
      <footer class="post-actions">
        <div class="post-actions-left">
          <button type="button" class="post-action ${liked ? "liked" : ""}" data-action="like" data-id="${safeId}" aria-pressed="${liked}">
            <span class="action-icon" aria-hidden="true">${liked ? "♥" : "♡"}</span><span>${Number(post.likes || 0)}</span>
          </button>
          <button type="button" class="post-action" data-action="detail" data-scroll-comments="true" data-id="${safeId}">
            <span class="action-icon" aria-hidden="true">▢</span><span>${getCommentCount(post)} bình luận</span>
          </button>
        </div>
        <div class="post-actions-right">
          ${!owner ? `
            <button type="button" class="post-action post-report gc-report-btn" data-report-type="POST" data-report-id="${safeId}" data-report-title="${escapeHtml(post.content ? post.content.slice(0, 60) : 'Bài viết')}" data-report-owner="${escapeHtml(post.author)}" title="Báo cáo bài viết vi phạm">
              <span class="action-icon" aria-hidden="true">🚩</span><span>Báo cáo</span>
            </button>
          ` : ""}
          <button type="button" class="post-detail-button" data-action="detail" data-id="${safeId}">Xem chi tiết <span aria-hidden="true">→</span></button>
          <button type="button" class="post-action post-save" data-action="save" aria-label="Lưu bài viết">♧</button>
        </div>
      </footer>
    </article>`;
}

function renderFeed() {
  if (searchLoading) {
    feedList.innerHTML = `
      <div class="feed-skeleton" aria-label="Đang tải kết quả"><span></span><span></span><span></span></div>
      <div class="feed-skeleton" aria-label="Đang tải kết quả"><span></span><span></span><span></span></div>`;
    feedEmpty.hidden = true;
    loadMoreButton.hidden = true;
    feedStatus.textContent = "Đang tìm bài viết...";
    return;
  }
  if (searchError) {
    feedList.innerHTML = "";
    feedEmpty.hidden = false;
    feedEmpty.innerHTML = `
      <span aria-hidden="true">!</span>
      <strong>Không thể tải bài viết</strong>
      <p>${escapeHtml(searchError)}</p>
      <button type="button" class="feed-retry" id="search-retry">Thử lại</button>`;
    loadMoreButton.hidden = true;
    feedStatus.textContent = "";
    return;
  }
  if (feedLoadError && !searchMode) {
    feedList.innerHTML = "";
    feedEmpty.hidden = false;
    feedEmpty.innerHTML = `
      <span aria-hidden="true">!</span>
      <strong>Không thể tải bài viết</strong>
      <p>${escapeHtml(feedLoadError)}</p>
      <button type="button" class="feed-retry" id="feed-retry">Thử lại</button>`;
    loadMoreButton.hidden = true;
    feedStatus.textContent = "";
    return;
  }
  if (searchMode) {
    feedList.innerHTML = searchResults.map(renderPost).join("");
    attachPostImageFallbacks(feedList);
    feedEmpty.hidden = searchResults.length > 0;
    if (searchResults.length === 0) {
      feedEmpty.innerHTML = `
        <span aria-hidden="true">⌕</span>
        <strong>Không tìm thấy bài viết</strong>
        <p>Thử từ khoá ngắn hơn hoặc thay đổi hashtag.</p>`;
    }
    loadMoreButton.hidden = true;
    feedStatus.textContent = searchResults.length
      ? `Tìm thấy ${searchResults.length} bài viết.`
      : "";
    return;
  }

  const posts = getAllPosts().filter((post) =>
    activeFilter !== "mine" || isCurrentUser(post.authorId),
  );
  feedList.innerHTML = posts.map(renderPost).join("");
  attachPostImageFallbacks(feedList);
  feedEmpty.hidden = posts.length > 0;
  if (posts.length === 0) {
    feedEmpty.innerHTML = activeFilter === "friends"
      ? `
        <span aria-hidden="true">👥</span>
        <strong>Chưa có bài viết từ bạn bè</strong>
        <p>Kết bạn thêm để cập nhật tin từ đồng đội nhé.</p>`
      : `
        <span aria-hidden="true">⌕</span>
        <strong>Chưa có bài viết nào</strong>
        <p>Hãy là người đầu tiên chia sẻ khoảnh khắc của bạn.</p>`;
  }

  loadMoreButton.hidden = !feedHasMore;
  feedStatus.textContent = !feedHasMore && posts.length > 0
    ? "Bạn đã cập nhật đến bài viết mới nhất."
    : feedLoadingMore
      ? "Đang tải thêm bài viết..."
      : "";
  activeGameFilter.hidden = !activeGame && !viewingUser;
  activeGameFilter.innerHTML = viewingUser
    ? `Bài viết của <strong>${escapeHtml(viewingUser.name)}</strong><button type="button" data-clear-user aria-label="Xem tất cả">Xem tất cả ×</button>`
    : activeGame
      ? `Đang xem bài viết về <strong>${escapeHtml(COMMUNITY_GAMES[activeGame]?.label || activeGame)}</strong><button type="button" data-clear-game aria-label="Bỏ lọc game">Bỏ lọc ×</button>`
      : "";
}

// ----- Bài của một người (bấm tên tác giả) -----
let viewingUser = null; // { id, name }

function openUserPosts(userId, userName) {
  viewingUser = { id: userId, name: userName || `Game thủ #${userId}` };
  activeFilter = "all";
  activeGame = "";
  if (searchMode || searchLoading || searchError) clearSearch();
  document.querySelectorAll(".filter-button").forEach((item) => {
    const selected = item.dataset.filter === "all";
    item.classList.toggle("active", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  loadApiPosts();
  document.querySelector(".feed-toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
}

activeGameFilter.addEventListener("click", (event) => {
  if (event.target.closest("[data-clear-user]")) {
    viewingUser = null;
    loadApiPosts();
  }
});

async function searchPosts(query) {
  const keyword = query.trim();
  if (!keyword) {
    clearSearch();
    return;
  }

  searchMode = keyword;
  searchLoading = true;
  searchError = "";
  searchResults = [];
  searchSummary.hidden = false;
  searchSummary.innerHTML = `Đang tìm <strong>${escapeHtml(keyword)}</strong><button type="button" data-clear-search>Bỏ tìm kiếm ×</button>`;
  const isHashtag = keyword.startsWith("#");
  const hashtag = isHashtag ? keyword.slice(1).replace(/^#+/, "") : "";
  const q = isHashtag ? "" : keyword;

  try {
    const payload = await api.get("/posts/search", {
      ...(q ? { keyword: q } : {}),
      ...(hashtag ? { hashtag } : {}),
      page: 1,
      limit: 20,
    });
    searchResults = extractPostList(payload).map(normalizeApiPost);
  } catch (error) {
    searchError = error?.message || "Backend không phản hồi. Vui lòng thử lại.";
  } finally {
    searchLoading = false;
    searchSummary.innerHTML = searchError
      ? `Từ khoá <strong>${escapeHtml(keyword)}</strong><button type="button" data-clear-search>Bỏ tìm kiếm ×</button>`
      : `Kết quả cho <strong>${escapeHtml(keyword)}</strong><button type="button" data-clear-search>Bỏ tìm kiếm ×</button>`;
    renderFeed();
  }
}

function clearSearch() {
  searchMode = "";
  searchLoading = false;
  searchError = "";
  searchResults = [];
  searchInput.value = "";
  searchSummary.hidden = true;
  searchSummary.innerHTML = "";
  renderFeed();
}

async function loadFeaturedPosts() {
  const featuredList = document.getElementById("featured-list");
  featuredList.innerHTML = `
    <div class="featured-loading" aria-label="Đang tải bài nổi bật">
      <span></span><span></span><span></span>
    </div>`;

  try {
    const payload = await api.get("/posts/featured", { skip: 0, limit: 5 });
    const posts = extractPostList(payload).map(normalizeApiPost);
    if (!posts.length) {
      featuredList.innerHTML = '<p class="featured-message">Chưa có bài nổi bật trong 7 ngày qua.</p>';
      return;
    }
    featuredList.innerHTML = posts.map((post, index) => `
      <button type="button" class="featured-item" data-featured-id="${escapeHtml(post.id)}">
        <span class="featured-rank">${String(index + 1).padStart(2, "0")}</span>
        <span class="featured-copy">
          <strong>${escapeHtml(post.content)}</strong>
          <small>${escapeHtml(post.author)} · ${Number(post.likes || 0)} lượt thích</small>
        </span>
      </button>`).join("");
  } catch (error) {
    featuredList.innerHTML = `
      <div class="featured-error">
        <strong>Không tải được bài nổi bật</strong>
        <p>${escapeHtml(error?.message || "Backend không phản hồi.")}</p>
        <button type="button" id="featured-retry">Thử lại</button>
      </div>`;
  }
}

function updateCharCount() {
  document.getElementById("char-count").textContent = `${contentInput.value.length} / 2000`;
}

function totalDraftImages() {
  return draftImages.length + selectedImageFiles.length;
}

function revokePreviewObjectUrls() {
  previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  previewObjectUrls = [];
}

function updateImageCountLabel() {
  const total = totalDraftImages();
  imageCountLabel.hidden = total === 0 && imageInput.files.length === 0;
  imageCountLabel.textContent = `Đã chọn ${total}/${MAX_POST_IMAGES} ảnh`;
  imageInput.disabled = total >= MAX_POST_IMAGES;
  const addImageButton = document.querySelector("label[for='post-image']");
  if (addImageButton) addImageButton.classList.toggle("tool-button-disabled", total >= MAX_POST_IMAGES);
}

function renderImagePreviews() {
  imagePreview.innerHTML = "";
  if (totalDraftImages() === 0) {
    imagePreview.hidden = true;
    updateImageCountLabel();
    return;
  }
  imagePreview.hidden = false;
  draftImages.forEach((url, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "image-preview-item";
    const img = document.createElement("img");
    img.src = url;
    img.alt = `Ảnh xem trước ${index + 1}`;
    const removeButton = document.createElement("button");
    removeButton.className = "remove-image";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Bỏ ảnh ${index + 1}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      draftImages.splice(index, 1);
      renderImagePreviews();
    });
    wrapper.append(img, removeButton);
    imagePreview.appendChild(wrapper);
  });
  selectedImageFiles.forEach((file, index) => {
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrls.push(objectUrl);
    const wrapper = document.createElement("div");
    wrapper.className = "image-preview-item";
    const img = document.createElement("img");
    img.src = objectUrl;
    img.alt = `Ảnh mới xem trước ${draftImages.length + index + 1}`;
    const removeButton = document.createElement("button");
    removeButton.className = "remove-image";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Bỏ ảnh mới ${draftImages.length + index + 1}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      selectedImageFiles.splice(index, 1);
      renderImagePreviews();
    });
    wrapper.append(img, removeButton);
    imagePreview.appendChild(wrapper);
  });
  updateImageCountLabel();
}

function resetComposer() {
  editingId = null;
  postForm.reset();
  renderComposerSelect(visibilityInput, "visibility");
  renderComposerSelect(gameInput, "game");
  draftImages = [];
  selectedImageFiles = [];
  revokePreviewObjectUrls();
  imageInput.value = "";
  renderImagePreviews();
  composerError.hidden = true;
  cancelEditButton.hidden = true;
  publishButton.innerHTML = '<span aria-hidden="true">↗</span> Đăng bài';
  document.getElementById("composer-title").textContent = "Chia sẻ với cộng đồng";
  updateCharCount();
}

function openDeletePostDialog(post) {
  pendingDeletePost = post;
  deletePostModal.hidden = false;
  document.body.classList.add("community-confirm-open");
  confirmDeletePostButton.disabled = false;
  confirmDeletePostButton.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa bài viết';
  confirmDeletePostButton.focus();
}

function closeDeletePostDialog() {
  deletePostModal.hidden = true;
  document.body.classList.remove("community-confirm-open");
  pendingDeletePost = null;
}

deletePostModal.querySelectorAll("[data-close-delete-post]").forEach((button) => {
  button.addEventListener("click", closeDeletePostDialog);
});
confirmDeletePostButton.addEventListener("click", async () => {
  const post = pendingDeletePost;
  if (!post?.numericId || confirmDeletePostButton.disabled) return;
  confirmDeletePostButton.disabled = true;
  confirmDeletePostButton.textContent = "Đang xóa...";
  try {
    await api.delete(`/posts/${post.numericId}`);
    if (editingId === post.id) resetComposer();
    closeDeletePostDialog();
    await loadApiPosts();
    showToast("Đã xóa bài viết.");
  } catch (error) {
    showToast(error?.message || "Không thể xóa bài viết.", "error");
    confirmDeletePostButton.disabled = false;
    confirmDeletePostButton.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa bài viết';
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !deletePostModal.hidden) closeDeletePostDialog();
});

function startEditing(postId) {
  const post = apiPosts.find((item) => item.id === postId);
  if (!post) {
    showToast("Không tìm thấy bài viết để chỉnh sửa.", "error");
    return;
  }
  editingId = post.id;
  contentInput.value = post.content;
  gameInput.value = selectedGameOptionValue(post);
  if (visibilityInput) visibilityInput.value = post.visibility || "PUBLIC";
  renderComposerSelect(gameInput, "game");
  renderComposerSelect(visibilityInput, "visibility");
  draftImages = Array.isArray(post.images) ? [...post.images] : (post.image ? [post.image] : []);
  selectedImageFiles = [];
  renderImagePreviews();
  composerError.hidden = true;
  cancelEditButton.hidden = false;
  publishButton.innerHTML = '<span aria-hidden="true">✓</span> Lưu thay đổi';
  document.getElementById("composer-title").textContent = "Chỉnh sửa bài viết";
  updateCharCount();
  postForm.scrollIntoView({ behavior: "smooth", block: "center" });
  contentInput.focus({ preventScroll: true });
}

function validateImageFile(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Dung lượng ảnh tối đa là 5MB.");
}

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = contentInput.value.trim();
  if (!content) {
    composerError.textContent = "Hãy viết vài dòng trước khi đăng bài.";
    composerError.hidden = false;
    contentInput.focus();
    return;
  }

  const wasEditing = Boolean(editingId);
  try {
    publishButton.disabled = true;
    composerError.hidden = true;
    const selectedGameKey = normalizeCommunityGameKey(gameInput.value);
    const selectedGameId = selectedGameKey ? COMMUNITY_GAME_IDS.get(selectedGameKey) : null;
    if (gameInput.value && !selectedGameId) {
      throw new Error("Game đã chọn chưa có trong danh mục.");
    }
    let imageUrls = [...draftImages];
    if (selectedImageFiles.length) {
      for (const file of selectedImageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await api.upload("/posts/images", formData);
        const uploadData = uploadResponse?.data || uploadResponse || {};
        if (!uploadData.image_url) throw new Error("Backend không trả về đường dẫn ảnh.");
        imageUrls.push(resolveCommunityMediaUrl(uploadData.image_url));
      }
      draftImages = [...imageUrls];
      selectedImageFiles = [];
      revokePreviewObjectUrls();
      renderImagePreviews();
    }
    if (imageUrls.length > MAX_POST_IMAGES) throw new Error("Chỉ được đính kèm tối đa 4 ảnh.");
    if (editingId) {
      const numericId = apiPosts.find((post) => String(post.id) === String(editingId))?.numericId;
      if (!numericId) throw new Error("Chỉ có thể sửa bài viết đã lưu trên cơ sở dữ liệu.");
      await api.put(`/posts/${numericId}`, {
        content,
        image_urls: imageUrls,
        visibility: visibilityInput?.value || "PUBLIC",
        game_ids: selectedGameId ? [selectedGameId] : [],
      });
    } else {
      await api.post("/posts", {
        content,
        image_urls: imageUrls,
        visibility: visibilityInput?.value || "PUBLIC",
        game_ids: selectedGameId ? [selectedGameId] : [],
      });
    }
    resetComposer();
    await loadApiPosts();
    await loadFeaturedPosts();
    showToast(wasEditing ? "Đã cập nhật bài viết." : "Bài viết đã được đăng.");
  } catch (error) {
    composerError.textContent = error?.message || "Không thể lưu bài viết.";
    composerError.hidden = false;
  } finally {
    publishButton.disabled = false;
  }
});

imageInput.addEventListener("change", async () => {
  const files = [...imageInput.files];
  imageInput.value = ""; // cho phép chọn lại cùng file
  if (!files.length) return;
  const remaining = MAX_POST_IMAGES - totalDraftImages();
  try {
    if (remaining <= 0) throw new Error(`Chỉ được đính kèm tối đa ${MAX_POST_IMAGES} ảnh.`);
    if (files.length > remaining) throw new Error(`Bạn chỉ có thể thêm ${remaining} ảnh nữa (tối đa ${MAX_POST_IMAGES} ảnh).`);
    files.forEach(validateImageFile);
    selectedImageFiles.push(...files);
    renderImagePreviews();
    composerError.hidden = true;
  } catch (error) {
    composerError.textContent = error.message;
    composerError.hidden = false;
  }
});
contentInput.addEventListener("input", updateCharCount);
cancelEditButton.addEventListener("click", resetComposer);
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchPosts(searchInput.value);
});
searchSummary.addEventListener("click", (event) => {
  if (event.target.closest("[data-clear-search]")) clearSearch();
});
feedEmpty.addEventListener("click", (event) => {
  if (event.target.closest("#search-retry")) searchPosts(searchMode);
  if (event.target.closest("#feed-retry")) loadApiPosts();
});
document.getElementById("refresh-featured").addEventListener("click", loadFeaturedPosts);
document.getElementById("featured-list").addEventListener("click", (event) => {
  const featuredItem = event.target.closest("[data-featured-id]");
  if (featuredItem) {
    window.location.href = `community-detail.html?id=${encodeURIComponent(featuredItem.dataset.featuredId)}`;
    return;
  }
  if (event.target.closest("#featured-retry")) loadFeaturedPosts();
});
document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (searchMode || searchLoading || searchError) clearSearch();
    activeFilter = button.dataset.filter;
    feedSource = activeFilter === "friends" ? "friends" : "all";
    viewingUser = null;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    loadApiPosts();
  });
});

document.querySelectorAll("[data-game-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    if (searchMode || searchLoading || searchError) clearSearch();
    activeGame = button.dataset.gameFilter;
    viewingUser = null;
    activeFilter = "all";
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item.dataset.filter === "all";
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    loadApiPosts();
    document.querySelector(".feed-toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

activeGameFilter.addEventListener("click", (event) => {
  if (event.target.closest("[data-clear-user]")) {
    viewingUser = null;
    loadApiPosts();
    return;
  }
  if (event.target.closest("[data-clear-game]")) {
    activeGame = "";
    loadApiPosts();
  }
});

feedList.addEventListener("click", (event) => {
  const authorLink = event.target.closest(".post-author-link");
  if (authorLink && authorLink.dataset.authorId && /^\d+$/.test(authorLink.dataset.authorId)) {
    openUserPosts(Number(authorLink.dataset.authorId), authorLink.dataset.authorName || "");
    return;
  }
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const postId = button.dataset.id;
  if (button.dataset.action === "like") {
    const apiPost = apiPosts.find((post) => String(post.id) === String(postId));
    if (apiPost?.numericId) {
      (async () => {
        try {
          if (apiPost.isLiked) await api.delete(`/posts/${apiPost.numericId}/like`);
          else await api.post(`/posts/${apiPost.numericId}/like`, {});
          await loadApiPosts();
          await loadFeaturedPosts();
        } catch (error) {
          showToast(error?.message || "Không thể cập nhật lượt thích.", "error");
        }
      })();
    } else showToast("Không thể tìm thấy bài viết trong cơ sở dữ liệu.", "error");
    return;
  }
  if (button.dataset.action === "detail") {
    const commentsHash = button.dataset.scrollComments ? "#comments" : "";
    window.location.href = `community-detail.html?id=${encodeURIComponent(postId)}${commentsHash}`;
    return;
  }
  if (button.dataset.action === "edit") {
    startEditing(postId);
    return;
  }
  if (button.dataset.action === "delete") {
    const post = apiPosts.find((item) => item.id === postId);
    if (!post) {
      showToast("Không tìm thấy bài viết để xoá.", "error");
      return;
    }
    openDeletePostDialog(post);
    return;
  }
  if (button.dataset.action === "block") {
    const targetUserId = button.dataset.userId;
    const targetName = button.dataset.userName || "người này";
    if (!targetUserId || !/^\d+$/.test(targetUserId)) {
      showToast("Không thể xác định người dùng để chặn.", "error");
      return;
    }
    if (!confirm(`Bạn có chắc muốn chặn ${targetName}? Bạn sẽ không thấy bài viết của họ nữa.`)) return;
    api.post(`/friend-requests/blocks/${targetUserId}`, {}).then(() => {
      showToast(`Đã chặn ${targetName}.`);
      feedLoadError = "";
      loadApiPosts();
    }).catch((error) => showToast(error?.message || "Không thể chặn người dùng này.", "error"));
    return;
  }
  if (button.dataset.action === "save") showToast("Tính năng lưu bài viết sẽ sớm có mặt.");
});

loadMoreButton.addEventListener("click", () => {
  loadApiPosts({ append: true });
});

async function loadApiPosts(options = {}) {
  const { append = false } = options;
  if (feedLoadingMore) return;
  if (append && !feedHasMore) return;
  feedLoadingMore = true;
  try {
    const skip = append ? apiPosts.length : 0;
    const payload = await api.get("/posts", {
      skip,
      limit: FEED_PAGE_SIZE,
      ...(feedSource === "friends" ? { friends_only: true } : {}),
      ...(viewingUser ? { user_id: viewingUser.id } : {}),
      ...(activeGame ? { game_id: COMMUNITY_GAME_IDS.get(activeGame) } : {}),
    });
    const items = extractPostList(payload).map(normalizeApiPost);
    apiPosts = append ? [...apiPosts, ...items] : items;
    feedHasMore = items.length === FEED_PAGE_SIZE;
    feedLoadError = "";
  } catch (error) {
    if (!append) apiPosts = [];
    feedLoadError = error?.message || "Backend không phản hồi.";
  } finally {
    feedLoadingMore = false;
  }
  renderFeed();
}

window.addEventListener("scroll", () => {
  const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
  if (remaining < 360 && window.scrollY > 100 && !searchMode && feedHasMore) {
    loadApiPosts({ append: true });
  }
}, { passive: true });

function applyCommunityTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("fc-light-mode", isLight);

  document.getElementById("check-theme-dark").textContent = isLight ? "" : "✓";
  document.getElementById("check-theme-light").textContent = isLight ? "✓" : "";
  document.querySelectorAll(".fc-theme-option").forEach((button) => {
    const selected = button.dataset.setTheme === theme;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  localStorage.setItem("gc_friends_theme", theme);
}

const avatarMenuButton = document.getElementById("btn-avatar-menu");
const avatarDropdownMenu = document.getElementById("avatar-dropdown-menu");
applyCommunityTheme(localStorage.getItem("gc_friends_theme") || "dark");

avatarMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  avatarDropdownMenu.hidden = !avatarDropdownMenu.hidden;
  avatarMenuButton.setAttribute("aria-expanded", String(!avatarDropdownMenu.hidden));
});

document.querySelectorAll(".fc-theme-option").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    applyCommunityTheme(button.dataset.setTheme);
    avatarDropdownMenu.hidden = true;
    avatarMenuButton.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (event) => {
  if (!avatarDropdownMenu.hidden && !avatarDropdownMenu.contains(event.target)) {
    avatarDropdownMenu.hidden = true;
    avatarMenuButton.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !avatarDropdownMenu.hidden) {
    avatarDropdownMenu.hidden = true;
    avatarMenuButton.setAttribute("aria-expanded", "false");
    avatarMenuButton.focus();
  }
});

const logoutButton = document.getElementById("logout-btn");
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    window.location.replace("login.html");
  });
}

const changePasswordMenuButton = document.getElementById("open-change-password");
const communityPasswordModal = document.getElementById("change-password-modal");
const communityPasswordForm = document.getElementById("change-password-form");
const communityPasswordMessage = document.getElementById("change-password-message");
const communityPasswordSubmit = document.getElementById("change-password-submit");
if (changePasswordMenuButton) {
  changePasswordMenuButton.hidden = String(localStorage.getItem("auth_provider") || "").toLowerCase() === "google";

  const setCommunityPasswordModal = (open) => {
    if (!communityPasswordModal) return;
    communityPasswordModal.hidden = !open;
    document.body.classList.toggle("gc-password-modal-open", open);
    if (open) {
      avatarDropdownMenu.hidden = true;
      avatarMenuButton.setAttribute("aria-expanded", "false");
      window.setTimeout(() => document.getElementById("old-password")?.focus(), 30);
    } else {
      communityPasswordForm?.reset();
      if (communityPasswordMessage) {
        communityPasswordMessage.hidden = true;
        communityPasswordMessage.textContent = "";
        communityPasswordMessage.classList.remove("error");
      }
    }
  };

  changePasswordMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setCommunityPasswordModal(true);
  });
  ["close-change-password", "cancel-change-password"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => setCommunityPasswordModal(false));
  });
  communityPasswordModal?.querySelectorAll("[data-close-password]").forEach((element) => {
    element.addEventListener("click", () => setCommunityPasswordModal(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && communityPasswordModal && !communityPasswordModal.hidden) {
      setCommunityPasswordModal(false);
    }
  });
  communityPasswordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const showMessage = (message, isError = false) => {
      communityPasswordMessage.textContent = message;
      communityPasswordMessage.classList.toggle("error", isError);
      communityPasswordMessage.hidden = false;
    };
    if (newPassword !== confirmPassword) return showMessage("Mật khẩu xác nhận không khớp.", true);
    if (oldPassword === newPassword) return showMessage("Mật khẩu mới cần khác mật khẩu hiện tại.", true);

    communityPasswordSubmit.disabled = true;
    communityPasswordSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang cập nhật...';
    try {
      const response = await api.put("/auth/change-password", { old_password: oldPassword, new_password: newPassword });
      showMessage(response?.message || "Đổi mật khẩu thành công.");
      communityPasswordForm.reset();
    } catch (error) {
      showMessage(error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.", true);
    } finally {
      communityPasswordSubmit.disabled = false;
      communityPasswordSubmit.innerHTML = '<i class="fa-solid fa-key" aria-hidden="true"></i> Cập nhật mật khẩu';
    }
  });
}

(async function initCommunity() {
  try {
    await loadCurrentCommunityUser();
  } catch (error) {
    console.error("[Community] Không thể tải thông tin tài khoản:", error);
    showToast(error?.message || "Không thể tải thông tin tài khoản.", "error");
  }
  await loadCommunityGameCatalog();
  await Promise.all([loadApiPosts(), loadFeaturedPosts()]);
})();
