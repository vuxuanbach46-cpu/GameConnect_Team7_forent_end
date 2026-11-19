const COMMUNITY_STORAGE_KEY = "gameconnect-community-posts";
const COMMUNITY_COMMENTS_KEY = "gameconnect-community-comments";
const COMMUNITY_LIKES_KEY = "gameconnect-community-liked-posts";
const CURRENT_USER = {
  id: "me",
  name: "Minh Nguyễn",
  handle: "@minhng",
  avatar: "M",
};

const GAMES = {
  Valorant: { label: "Valorant", image: "../assets/images/games/valorant.png", art: "valorant" },
  "Liên Minh Huyền Thoại": { label: "League of Legends", image: "../assets/images/games/lol.png", art: "lol" },
  CS2: { label: "Counter-Strike 2", image: "../assets/images/games/cs2.png", art: "cs2" },
  "Liên Quân Mobile": { label: "Liên Quân Mobile", image: "../assets/images/games/aov.png", art: "aov" },
};

const DEMO_POSTS = [
  { id:"demo-1", author:"Hoàng Minh", handle:"@zerocool", avatar:"Z", game:"Valorant", content:"Round cuối căng như dây đàn, team call cực mượt nên clutch được luôn 🥹 GG anh em!", createdAt:new Date(Date.now()-12*60000).toISOString(), likes:28, comments:6, visual:true },
  { id:"demo-2", author:"Lê Khánh Linh", handle:"@linhbae", avatar:"L", game:"Liên Minh Huyền Thoại", content:"Cuối cùng cũng lên được Cao Thủ rồi! Cảm ơn người đi rừng đã camp đường dưới hết mình 💙", createdAt:new Date(Date.now()-48*60000).toISOString(), likes:46, comments:12, visual:true },
  { id:"demo-3", author:"Đức Huy", handle:"@huysniper", avatar:"H", game:"CS2", content:"Góc setup mới cho buổi luyện aim tối nay. Mọi người hay dùng map nào để warm-up vậy?", createdAt:new Date(Date.now()-2*3600000).toISOString(), likes:17, comments:9, visual:true },
  { id:"demo-4", author:"Mỹ Duyên", handle:"@duyenalice", avatar:"D", game:"Liên Quân Mobile", content:"Một pha mở giao tranh đúng lúc là đủ xoay chuyển cả trận. Leo rank tối nay cần thêm một bạn trợ thủ nhé!", createdAt:new Date(Date.now()-4*3600000).toISOString(), likes:32, comments:8, visual:true },
  { id:"demo-5", author:"Tuấn Anh", handle:"@tuanjungle", avatar:"T", game:"Liên Minh Huyền Thoại", content:"Tìm duo đi rừng hoặc hỗ trợ, mic vui vẻ, không toxic. Online từ 9 giờ tối nha 🎮", createdAt:new Date(Date.now()-7*3600000).toISOString(), likes:21, comments:4, visual:false },
  { id:"demo-6", author:"Quốc Bảo", handle:"@baoclutch", avatar:"B", game:"CS2", content:"Ace đầu tiên trong mùa mới! Pha cuối chắc đối thủ không ngờ mình còn flash 😎", createdAt:new Date(Date.now()-11*3600000).toISOString(), likes:59, comments:15, visual:true },
];

const postId = new URLSearchParams(window.location.search).get("id");
let post = null;
let likedPostIds = new Set();
let replyToId = null;
let editingCommentId = null;

document.documentElement.style.overflowY = "auto";
document.body.style.height = "auto";
document.body.style.overflowY = "auto";

async function loadPost() {
  let userPosts = [];
  try { userPosts = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || "[]"); } catch (_error) {}
  post = userPosts.find((item) => item.id === postId) || DEMO_POSTS.find((item) => item.id === postId);
  if (!post && postId) {
    try {
      const payload = await api.get(`/posts/${encodeURIComponent(postId)}`);
      const author = payload.author || payload.author_name || payload.user_name || "Game thủ";
      post = {
        id: String(payload.id ?? payload.post_id ?? postId),
        author,
        handle: payload.handle || payload.username || "@gameconnect",
        avatar: String(payload.avatar || author).slice(0, 1).toUpperCase(),
        game: payload.game || payload.game_name || "",
        content: payload.content || payload.body || payload.title || "",
        image: payload.image || payload.image_url || "",
        createdAt: payload.createdAt || payload.created_at || payload.created || new Date().toISOString(),
        likes: Number(payload.likes || payload.like_count || 0),
        comments: Number(payload.comments || payload.comment_count || 0),
        visual: Boolean(payload.visual),
      };
    } catch (_error) {
      post = null;
    }
  }
}

function loadLikes() {
  try {
    const ids = JSON.parse(localStorage.getItem(COMMUNITY_LIKES_KEY) || "[]");
    likedPostIds = new Set(Array.isArray(ids) ? ids : []);
  } catch (_error) { likedPostIds = new Set(); }
}

function getComments() {
  try {
    const data = JSON.parse(localStorage.getItem(COMMUNITY_COMMENTS_KEY) || "{}");
    return data && Array.isArray(data[postId]) ? data[postId] : [];
  } catch (_error) { return []; }
}

function saveComments(comments) {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(COMMUNITY_COMMENTS_KEY) || "{}") || {}; } catch (_error) {}
  data[postId] = comments;
  localStorage.setItem(COMMUNITY_COMMENTS_KEY, JSON.stringify(data));
}

function timeAgo(value) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function renderPost() {
  const wrap = document.getElementById("detail-post");
  if (!post) {
    wrap.innerHTML = '<article class="post-card detail-not-found"><h1>Không tìm thấy bài viết</h1><p>Bài viết có thể đã bị xoá hoặc liên kết không hợp lệ.</p></article>';
    document.getElementById("comment-form").hidden = true;
    return;
  }

  const game = GAMES[post.game];
  const owner = post.authorId === CURRENT_USER.id;
  const liked = likedPostIds.has(post.id);
  const media = post.image
    ? `<div class="post-media"><img src="${escapeHtml(post.image)}" alt="Ảnh bài viết của ${escapeHtml(post.author)}"></div>`
    : post.visual && game
      ? `<div class="post-media post-media-art media-${game.art}"><img src="${game.image}" alt=""><span class="art-caption">GAMECONNECT · ${escapeHtml(game.label.toUpperCase())}</span></div>`
      : "";

  wrap.innerHTML = `
    <article class="post-card detail-post-card">
      <header class="post-top">
        <div class="avatar ${owner ? "avatar-self" : ""}" aria-hidden="true">${escapeHtml(post.avatar)}</div>
        <div class="post-author">
          <strong>${escapeHtml(post.author)}${owner ? "" : '<span class="author-badge">✦</span>'}</strong>
          <small>${escapeHtml(post.handle)} · ${timeAgo(post.createdAt)}</small>
        </div>
      </header>
      <div class="post-copy"><p>${escapeHtml(post.content)}</p>${game ? `<span class="post-game-tag">${escapeHtml(game.label)}</span>` : ""}</div>
      ${media}
      <footer class="post-actions">
        <div class="post-actions-left">
          <button type="button" class="post-action ${liked ? "liked" : ""}" id="detail-like" aria-pressed="${liked}">
            <span class="action-icon">${liked ? "♥" : "♡"}</span><span>${Number(post.likes || 0) + (liked ? 1 : 0)}</span>
          </button>
          <span class="post-action"><span class="action-icon">▢</span><span id="detail-comment-count">0 bình luận</span></span>
        </div>
      </footer>
    </article>`;

  document.getElementById("detail-like").addEventListener("click", () => {
    if (likedPostIds.has(post.id)) likedPostIds.delete(post.id);
    else likedPostIds.add(post.id);
    localStorage.setItem(COMMUNITY_LIKES_KEY, JSON.stringify([...likedPostIds]));
    renderPost();
  });
}

function commentTemplate(comment) {
  const mine = comment.authorId === CURRENT_USER.id;
  return `
    <article class="comment-item ${comment.parentId ? "comment-reply" : ""}" data-comment-id="${escapeHtml(comment.id)}">
      <div class="avatar comment-avatar ${mine ? "avatar-self" : ""}" aria-hidden="true">${escapeHtml(comment.avatar)}</div>
      <div class="comment-body">
        <div class="comment-bubble">
          <div class="comment-author-line">
            <strong>${escapeHtml(comment.author)}</strong>
            <span>${timeAgo(comment.createdAt)}</span>
          </div>
          <p>${escapeHtml(comment.content)}</p>
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
  document.getElementById("comment-count").textContent = String(comments.length);
  document.getElementById("detail-comment-count").textContent = `${comments.length || Number(post?.comments || 0)} bình luận`;
  const roots = comments.filter((comment) => !comment.parentId);
  document.getElementById("comment-empty").hidden = roots.length > 0;

  document.getElementById("comment-list").innerHTML = roots.map((root) => `
    ${commentTemplate(root)}
    <div class="comment-replies">${comments.filter((comment) => comment.parentId === root.id).map(commentTemplate).join("")}</div>
  `).join("");
}

document.getElementById("comment-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!post) return;
  const input = document.getElementById("comment-content");
  const content = input.value.trim();
  if (!content) {
    input.focus();
    showToast("Hãy nhập nội dung bình luận.", "error");
    return;
  }

  const comments = getComments();
  const wasEditing = Boolean(editingCommentId);
  if (editingCommentId) {
    const target = comments.find((comment) => comment.id === editingCommentId && comment.authorId === CURRENT_USER.id);
    if (!target) {
      showToast("Không tìm thấy bình luận để chỉnh sửa.", "error");
      return;
    }
    target.content = content;
    target.updatedAt = new Date().toISOString();
  } else {
    comments.push({
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      postId,
      parentId: replyToId,
      authorId: CURRENT_USER.id,
      author: CURRENT_USER.name,
      handle: CURRENT_USER.handle,
      avatar: CURRENT_USER.avatar,
      content,
      createdAt: new Date().toISOString(),
    });
  }
  saveComments(comments);
  resetCommentForm();
  renderComments();
  showToast(wasEditing ? "Đã cập nhật bình luận." : "Đã đăng bình luận.");
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

  if (button.dataset.commentAction === "edit" && comment.authorId === CURRENT_USER.id) {
    editingCommentId = comment.id;
    replyToId = null;
    document.getElementById("comment-content").value = comment.content;
    document.getElementById("replying-to").hidden = true;
    document.getElementById("cancel-reply").hidden = false;
    document.getElementById("comment-submit").textContent = "Lưu thay đổi";
    document.getElementById("comment-content").focus();
  }

  if (button.dataset.commentAction === "delete" && comment.authorId === CURRENT_USER.id) {
    if (!confirm("Bạn có chắc muốn xoá bình luận này?")) return;
    const remaining = comments.filter((item) => item.id !== comment.id && item.parentId !== comment.id);
    saveComments(remaining);
    if (editingCommentId === comment.id) resetCommentForm();
    renderComments();
    showToast("Đã xoá bình luận.");
  }
});

(async function initCommunityDetail() {
  await loadPost();
  loadLikes();
  renderPost();
  if (post) {
    renderComments();
    if (window.location.hash === "#comments") {
      requestAnimationFrame(() => {
        document.getElementById("comments").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }
})();
