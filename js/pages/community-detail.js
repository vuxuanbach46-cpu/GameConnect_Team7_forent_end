const CURRENT_USER = {
  id: null,
  username: "",
  name: "Game thủ",
  handle: "@gameconnect",
  avatarUrl: "",
};

const GAMES = {
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
const COMMUNITY_GAME_KEYS_BY_ID = new Map();

const postId = new URLSearchParams(window.location.search).get("id");
let post = null;
let replyToId = null;
let editingCommentId = null;
let apiComments = [];
let postLoadError = "";
let commentsLoadError = "";

function normalizeCommunityGameKey(value) {
  const normalized = String(value || "").trim().toLocaleLowerCase("vi");
  return Object.entries(COMMUNITY_GAME_ALIASES).find(([, aliases]) =>
    aliases.includes(normalized),
  )?.[0] || "";
}

async function loadCommunityGameCatalog() {
  const response = await api.get("/api/games");
  const games = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];
  COMMUNITY_GAME_KEYS_BY_ID.clear();
  games.forEach((game) => {
    const key = normalizeCommunityGameKey(game.name);
    const id = Number(game.id);
    if (key && Number.isInteger(id) && id > 0) COMMUNITY_GAME_KEYS_BY_ID.set(id, key);
  });
}

document.documentElement.style.overflowY = "auto";
document.body.style.height = "auto";
document.body.style.overflowY = "auto";

async function loadPost() {
  postLoadError = "";
  if (!postId || !/^\d+$/.test(postId)) {
    post = null;
    postLoadError = "Liên kết bài viết không hợp lệ.";
    return;
  }
  try {
    const response = await api.get(`/posts/${encodeURIComponent(postId)}`);
    const payload = response?.data || response || {};
    const author = payload.author_name || payload.author || payload.user_name || "Game thủ";
    const username = payload.author_username || payload.username || "";
    const gameIds = Array.isArray(payload.game_ids) ? payload.game_ids : [];
    const imageUrls = Array.isArray(payload.image_urls) ? payload.image_urls : [];
    const rawGameName = payload.game || payload.game_name || COMMUNITY_GAME_KEYS_BY_ID.get(Number(gameIds[0])) || "";
    post = {
      id: String(payload.id ?? payload.post_id ?? postId),
      authorId: payload.user_id != null ? String(payload.user_id) : null,
      numericId: payload.id != null ? payload.id : null,
      author,
      username,
      handle: payload.author_handle || payload.handle || username || "@gameconnect",
      avatar: String(author).slice(0, 1).toUpperCase(),
      avatarUrl: payload.author_avatar || payload.avatar || buildCommunityAvatar(username || author),
      game: normalizeCommunityGameKey(rawGameName) || rawGameName,
      content: payload.content || payload.body || payload.title || "",
      images: (Array.isArray(payload.image_urls) ? payload.image_urls : [])
        .map((url) => resolveCommunityMediaUrl(url))
        .filter(Boolean),
      createdAt: payload.createdAt || payload.created_at || payload.created || new Date().toISOString(),
      likes: Number(payload.likes || payload.like_count || 0),
      comments: Number(payload.comments || payload.comment_count || 0),
      isLiked: Boolean(payload.liked_by_current_user ?? payload.is_liked),
      userId: payload.user_id != null ? Number(payload.user_id) : null,
      visibility: payload.visibility || "PUBLIC",
      visual: Boolean(payload.visual),
    };
  } catch (error) {
    post = null;
    postLoadError = error?.message || "Không thể tải bài viết.";
  }
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

function isCurrentUser(userId) {
  return userId != null && String(userId) === String(CURRENT_USER.id);
}

function avatarMarkup(avatarUrl, name) {
  const initial = escapeHtml(String(name || "G").slice(0, 1).toUpperCase());
  if (!avatarUrl) return initial;
  const fallback = escapeHtml(String(name || "G").slice(0, 1).toUpperCase());
  return `<img src="${escapeHtml(resolveCommunityMediaUrl(avatarUrl))}" alt="" data-fallback="${fallback}">`;
}

async function loadCurrentCommunityUser() {
  const userResponse = await api.get("/user/me");
  const user = userResponse?.data || userResponse || {};
  CURRENT_USER.id = String(user.id || "");
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

  const avatar = document.querySelector("#comment-form .avatar-self");
  if (avatar) {
    avatar.dataset.fallback = String(CURRENT_USER.name).slice(0, 1).toUpperCase();
    avatar.innerHTML = avatarMarkup(CURRENT_USER.avatarUrl, CURRENT_USER.name);
    attachAvatarFallbacks(document);
  }
}

function attachAvatarFallbacks(root) {
  root.querySelectorAll(".avatar img").forEach((image) => {
    image.addEventListener("error", () => {
      const wrapper = image.closest(".avatar");
      if (wrapper) wrapper.textContent = image.dataset.fallback || "G";
    }, { once: true });
  });
}

async function loadApiComments() {
  if (!post?.numericId) {
    apiComments = [];
    return;
  }
  try {
    const response = await api.get(`/posts/${post.numericId}/comments`, { skip: 0, limit: 100 });
    const items = Array.isArray(response?.data) ? response.data : [];
    apiComments = items.map((comment) => ({
      id: String(comment.id),
      numericId: comment.id,
      postId: String(comment.post_id),
      parentId: comment.parent_comment_id != null ? String(comment.parent_comment_id) : null,
      authorId: String(comment.user_id),
      author: comment.author_name || `Game thủ #${comment.user_id}`,
      username: comment.author_username || "",
      avatar: String(comment.author_name || "G").slice(0, 1).toUpperCase(),
      avatarUrl: comment.author_avatar || buildCommunityAvatar(comment.author_username || comment.author_name),
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    }));
    commentsLoadError = "";
  } catch (error) {
    apiComments = [];
    commentsLoadError = error?.message || "Không thể tải bình luận.";
  }
}

function getComments() {
  return apiComments;
}

function timeAgo(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Vừa xong";
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function renderPost() {
  const wrap = document.getElementById("detail-post");
  if (!post) {
    wrap.innerHTML = `<article class="post-card detail-not-found"><h1>Không thể hiển thị bài viết</h1><p>${escapeHtml(postLoadError || "Bài viết có thể đã bị xoá hoặc liên kết không hợp lệ.")}</p></article>`;
    document.getElementById("comment-form").hidden = true;
    return;
  }

  const game = GAMES[post.game];
  const owner = isCurrentUser(post.authorId);
  const liked = post.isLiked;
  const visibilityLabels = {
    PUBLIC: { text: "🌤 Mọi người", title: "Bài viết công khai - ai cũng có thể xem" },
    FRIENDS: { text: "👥 Bạn bè", title: "Chỉ bạn bè của bạn có thể xem bài này" },
    PRIVATE: { text: "🔒 Chỉ mình tôi", title: "Chỉ bạn có thể xem bài này" },
  };
  const visibilityBadge = owner && visibilityLabels[post.visibility]
    ? `<span class="post-visibility-badge" title="${visibilityLabels[post.visibility].title}">${visibilityLabels[post.visibility].text}</span>`
    : "";
  const media = post.images?.length
    ? `<div class="post-media post-media-grid ${post.images.length > 1 ? "post-media-multi" : ""}">${post.images.map((url, index) => `<img src="${escapeHtml(url)}" alt="Ảnh ${index + 1} bài viết của ${escapeHtml(post.author)}" loading="lazy">`).join("")}</div>`
    : post.visual && game
      ? `<div class="post-media post-media-art media-${game.art}"><img src="${game.image}" alt=""><span class="art-caption">GAMECONNECT · ${escapeHtml(game.label.toUpperCase())}</span></div>`
      : "";

  wrap.innerHTML = `
    <article class="post-card detail-post-card">
      <header class="post-top">
        <div class="avatar ${owner ? "avatar-self" : ""}" aria-hidden="true" data-fallback="${escapeHtml(post.avatar)}">${avatarMarkup(post.avatarUrl, post.author)}</div>
        <div class="post-author">
          <strong>${escapeHtml(post.author)}${owner ? "" : '<span class="author-badge">✦</span>'}</strong>
          <small>${escapeHtml(post.handle)} · ${timeAgo(post.createdAt)} ${visibilityBadge}</small>
        </div>
      </header>
      <div class="post-copy"><p>${escapeHtml(post.content)}</p>${game ? `<span class="post-game-tag">${escapeHtml(game.label)}</span>` : ""}</div>
      ${media}
      <footer class="post-actions">
        <div class="post-actions-left">
          <button type="button" class="post-action ${liked ? "liked" : ""}" id="detail-like" aria-pressed="${liked}">
            <span class="action-icon">${liked ? "♥" : "♡"}</span><span>${Number(post.likes || 0)}</span>
          </button>
          <span class="post-action"><span class="action-icon">▢</span><span id="detail-comment-count">0 bình luận</span></span>
        </div>
      </footer>
    </article>`;

  attachAvatarFallbacks(wrap);
  wrap.querySelectorAll(".post-media img").forEach((image) => {
    image.addEventListener("error", () => {
      const message = document.createElement("p");
      message.className = "post-image-error";
      message.textContent = "Không thể tải ảnh bài viết.";
      image.replaceWith(message);
    }, { once: true });
  });

  document.getElementById("detail-like").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      if (post.isLiked) await api.delete(`/posts/${post.numericId}/like`);
      else await api.post(`/posts/${post.numericId}/like`, {});
      await loadPost();
      renderPost();
      await loadApiComments();
      renderComments();
    } catch (error) {
      showToast(error?.message || "Không thể cập nhật lượt thích.", "error");
    } finally {
      button.disabled = false;
    }
  });
}

function commentTemplate(comment, allComments) {
  const mine = isCurrentUser(comment.authorId);
  // Trả lời bình luận: hiện tag @tên người được trả lời
  let replyTag = "";
  if (comment.parentId) {
    const parent = (allComments || []).find((item) => item.id === comment.parentId);
    if (parent) {
      replyTag = `<span class="comment-reply-tag" data-author-id="${escapeHtml(parent.authorId || "")}">@${escapeHtml(parent.author || "")}</span> `;
    }
  }
  return `
    <article class="comment-item ${comment.parentId ? "comment-reply" : ""}" data-comment-id="${escapeHtml(comment.id)}">
      <div class="avatar comment-avatar ${mine ? "avatar-self" : ""}" aria-hidden="true" data-fallback="${escapeHtml(comment.avatar)}">${avatarMarkup(comment.avatarUrl, comment.author)}</div>
      <div class="comment-body">
        <div class="comment-bubble">
          <div class="comment-author-line">
            <strong>${escapeHtml(comment.author)}</strong>
            <span>${timeAgo(comment.createdAt)}</span>
          </div>
          <p>${replyTag}${escapeHtml(comment.content)}</p>
        </div>
        <div class="comment-actions">
          <button type="button" data-comment-action="reply" data-id="${escapeHtml(comment.id)}" data-name="${escapeHtml(comment.author)}">Trả lời</button>
          ${mine ? `
            <button type="button" data-comment-action="edit" data-id="${escapeHtml(comment.id)}">Sửa</button>
            <button type="button" data-comment-action="delete" data-id="${escapeHtml(comment.id)}">Xoá</button>` : ""}
        </div>
      </div>
    </article>`;
}

function renderComments() {
  const comments = getComments();
  const totalComments = Math.max(comments.length, Number(post?.comments || 0));
  document.getElementById("comment-count").textContent = String(totalComments);
  document.getElementById("detail-comment-count").textContent = `${totalComments} bình luận`;
  const roots = comments.filter((comment) => !comment.parentId);
  const errorElement = document.getElementById("comment-load-error");
  errorElement.textContent = commentsLoadError;
  errorElement.hidden = !commentsLoadError;
  document.getElementById("comment-empty").hidden = roots.length > 0 || Boolean(commentsLoadError);

  document.getElementById("comment-list").innerHTML = roots.map((root) => `
    ${commentTemplate(root, comments)}
    <div class="comment-replies">${comments.filter((comment) => comment.parentId === root.id).map((comment) => commentTemplate(comment, comments)).join("")}</div>
  `).join("");
  attachAvatarFallbacks(document.getElementById("comment-list"));
}

document.getElementById("comment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!post) return;
  const input = document.getElementById("comment-content");
  const submitButton = document.getElementById("comment-submit");
  const content = input.value.trim();
  if (!content) {
    input.focus();
    showToast("Hãy nhập nội dung bình luận.", "error");
    return;
  }

  const wasEditing = Boolean(editingCommentId);
  const target = editingCommentId
    ? getComments().find((comment) => comment.id === editingCommentId && isCurrentUser(comment.authorId))
    : null;
  if (editingCommentId && (!target || !target.numericId)) {
    showToast("Không tìm thấy bình luận để chỉnh sửa.", "error");
    return;
  }

  submitButton.disabled = true;
  try {
    if (target?.numericId) {
      await api.put(`/posts/${post.numericId}/comments/${target.numericId}`, { content });
    } else {
      await api.post(`/posts/${post.numericId}/comments`, {
        content,
        parent_comment_id: replyToId && /^\d+$/.test(replyToId) ? Number(replyToId) : null,
      });
    }
    await loadPost();
    await loadApiComments();
    renderPost();
    resetCommentForm();
    renderComments();
    showToast(wasEditing ? "Đã cập nhật bình luận." : "Đã đăng bình luận.");
  } catch (error) {
    showToast(error?.message || "Không thể lưu bình luận.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

function resetCommentForm() {
  editingCommentId = null;
  replyToId = null;
  document.getElementById("comment-content").value = "";
  document.getElementById("replying-to").hidden = true;
  document.getElementById("cancel-reply").hidden = true;
  document.getElementById("comment-submit").textContent = "Đăng bình luận";
}

document.getElementById("cancel-reply").addEventListener("click", resetCommentForm);

document.getElementById("comment-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-comment-action]");
  if (!button) return;
  const comments = getComments();
  const comment = comments.find((item) => item.id === button.dataset.id);
  if (!comment) return;

  if (button.dataset.commentAction === "reply") {
    replyToId = comment.parentId || comment.id;
    editingCommentId = null;
    document.getElementById("replying-to").textContent = `Đang trả lời ${comment.author}`;
    document.getElementById("replying-to").hidden = false;
    document.getElementById("cancel-reply").hidden = false;
    document.getElementById("comment-submit").textContent = "Đăng trả lời";
    document.getElementById("comment-content").focus();
  }

  if (button.dataset.commentAction === "edit" && isCurrentUser(comment.authorId)) {
    editingCommentId = comment.id;
    replyToId = null;
    document.getElementById("comment-content").value = comment.content;
    document.getElementById("replying-to").hidden = true;
    document.getElementById("cancel-reply").hidden = false;
    document.getElementById("comment-submit").textContent = "Lưu thay đổi";
    document.getElementById("comment-content").focus();
  }

  if (button.dataset.commentAction === "delete" && isCurrentUser(comment.authorId)) {
    if (!confirm("Bạn có chắc muốn xoá bình luận này?")) return;
    api.delete(`/posts/${post.numericId}/comments/${comment.numericId}`).then(async () => {
      await loadPost();
      await loadApiComments();
      renderPost();
      if (editingCommentId === comment.id) resetCommentForm();
      renderComments();
      showToast("Đã xoá bình luận.");
    }).catch((error) => showToast(error?.message || "Không thể xoá bình luận.", "error"));
  }
});

(async function initCommunityDetail() {
  try {
    await loadCurrentCommunityUser();
  } catch (error) {
    console.error("[Community detail] Không thể tải thông tin tài khoản:", error);
    showToast(error?.message || "Không thể tải thông tin tài khoản.", "error");
  }
  try {
    await loadCommunityGameCatalog();
  } catch (error) {
    console.error("[Community detail] Không thể tải danh mục game:", error);
    showToast(error?.message || "Không thể tải danh mục game.", "error");
  }
  await loadPost();
  renderPost();
  if (post) {
    await loadApiComments();
    renderComments();
    if (window.location.hash === "#comments") {
      requestAnimationFrame(() => {
        document.getElementById("comments").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }
})();
