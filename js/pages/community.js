const COMMUNITY_STORAGE_KEY = "gameconnect-community-posts";
const CURRENT_USER = {
  id: "me",
  name: "Minh Nguyễn",
  handle: "@minhng",
  avatar: "M",
};
const COMMUNITY_GAMES = {
  Valorant: { label: "Valorant", image: "../assets/images/games/valorant.png", art: "valorant" },
  "Liên Minh Huyền Thoại": { label: "League of Legends", image: "../assets/images/games/lol.png", art: "lol" },
  CS2: { label: "Counter-Strike 2", image: "../assets/images/games/cs2.png", art: "cs2" },
  "Liên Quân Mobile": { label: "Liên Quân Mobile", image: "../assets/images/games/aov.png", art: "aov" },
  TFT: { label: "Đấu Trường Chân Lý", image: "../assets/images/games/tft.png", art: "lol" },
};

const DEMO_POSTS = [
  {
    id: "demo-1",
    author: "Hoàng Minh",
    handle: "@zerocool",
    avatar: "Z",
    game: "Valorant",
    content: "Round cuối căng như dây đàn, team call cực mượt nên clutch được luôn 🥹 GG anh em!",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    likes: 28,
    comments: 6,
    visual: true,
  },
  {
    id: "demo-2",
    author: "Lê Khánh Linh",
    handle: "@linhbae",
    avatar: "L",
    game: "Liên Minh Huyền Thoại",
    content: "Cuối cùng cũng lên được Cao Thủ rồi! Cảm ơn người đi rừng đã camp đường dưới hết mình 💙",
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    likes: 46,
    comments: 12,
    visual: true,
  },
  {
    id: "demo-3",
    author: "Đức Huy",
    handle: "@huysniper",
    avatar: "H",
    game: "CS2",
    content: "Góc setup mới cho buổi luyện aim tối nay. Mọi người hay dùng map nào để warm-up vậy?",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 17,
    comments: 9,
    visual: true,
  },
  {
    id: "demo-4",
    author: "Mỹ Duyên",
    handle: "@duyenalice",
    avatar: "D",
    game: "Liên Quân Mobile",
    content: "Một pha mở giao tranh đúng lúc là đủ xoay chuyển cả trận. Leo rank tối nay cần thêm một bạn trợ thủ nhé!",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    likes: 32,
    comments: 8,
    visual: true,
  },
  {
    id: "demo-5",
    author: "Tuấn Anh",
    handle: "@tuanjungle",
    avatar: "T",
    game: "Liên Minh Huyền Thoại",
    content: "Tìm duo đi rừng hoặc hỗ trợ, mic vui vẻ, không toxic. Online từ 9 giờ tối nha 🎮",
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    likes: 21,
    comments: 4,
    visual: false,
  },
  {
    id: "demo-6",
    author: "Quốc Bảo",
    handle: "@baoclutch",
    avatar: "B",
    game: "CS2",
    content: "Ace đầu tiên trong mùa mới! Pha cuối chắc đối thủ không ngờ mình còn flash 😎",
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    likes: 59,
    comments: 15,
    visual: true,
  },
];

const feedList = document.getElementById("feed-list");
const postForm = document.getElementById("post-form");
const contentInput = document.getElementById("post-content");
const gameInput = document.getElementById("post-game");
const imageInput = document.getElementById("post-image");
const imagePreview = document.getElementById("image-preview");
const previewImage = document.getElementById("preview-image");
const composerError = document.getElementById("composer-error");
const publishButton = document.getElementById("publish-button");
const cancelEditButton = document.getElementById("cancel-edit");
const loadMoreButton = document.getElementById("load-more");
const feedStatus = document.getElementById("feed-status");
const feedEmpty = document.getElementById("feed-empty");
const activeGameFilter = document.getElementById("active-game-filter");

let userPosts = loadUserPosts();
let activeFilter = "all";
let activeGame = "";
let visibleCount = 3;
let editingId = null;
let draftImage = "";
const likedPostIds = new Set();

function loadUserPosts() {
  try {
    const savedPosts = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (!savedPosts) return [];
    const parsedPosts = JSON.parse(savedPosts);
    if (!Array.isArray(parsedPosts)) throw new Error("Dữ liệu bài viết đã lưu không hợp lệ.");
    return parsedPosts.filter((post) =>
      post && post.authorId === CURRENT_USER.id && typeof post.id === "string" &&
      typeof post.content === "string" && typeof post.createdAt === "string",
    );
  } catch (error) {
    showToast(`Không thể đọc bài viết đã lưu: ${error.message}`, "error");
    return [];
  }
}

function saveUserPosts() {
  try {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(userPosts));
    return true;
  } catch (error) {
    showToast(`Không thể lưu bài viết trên thiết bị: ${error.message}`, "error");
    return false;
  }
}

function getAllPosts() {
  return [...userPosts, ...DEMO_POSTS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function timeAgo(value) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function renderPost(post) {
  const owner = post.authorId === CURRENT_USER.id;
  const game = COMMUNITY_GAMES[post.game];
  const gameTag = game ? `<span class="post-game-tag">${escapeHtml(game.label)}</span>` : "";
  const media = post.image
    ? `<div class="post-media"><img src="${escapeHtml(post.image)}" alt="Ảnh được chia sẻ bởi ${escapeHtml(post.author)}"></div>`
    : post.visual && game
      ? `<div class="post-media post-media-art media-${game.art}" aria-label="Hình minh hoạ ${escapeHtml(game.label)}">
          <img src="${game.image}" alt="">
          <span class="art-caption">GAMECONNECT · ${escapeHtml(game.label.toUpperCase())}</span>
        </div>`
      : "";
  const liked = likedPostIds.has(post.id);
  const safeId = escapeHtml(post.id);

  return `
    <article class="post-card" data-post-id="${safeId}">
      <header class="post-top">
        <div class="avatar ${owner ? "avatar-self" : ""}" aria-hidden="true">${escapeHtml(post.avatar)}</div>
        <div class="post-author">
          <strong>${escapeHtml(post.author)}${owner ? "" : '<span class="author-badge" title="Game thủ đã xác thực">✦</span>'}</strong>
          <small>${escapeHtml(post.handle)} · ${timeAgo(post.createdAt)}</small>
        </div>
        ${owner ? `<details class="post-menu">
          <summary aria-label="Tuỳ chọn bài viết">···</summary>
          <div class="post-menu-actions">
            <button type="button" data-action="edit" data-id="${safeId}">Chỉnh sửa</button>
            <button type="button" data-action="delete" data-id="${safeId}">Xoá bài viết</button>
          </div>
        </details>` : ""}
      </header>
      <div class="post-copy"><p>${escapeHtml(post.content)}</p>${gameTag}</div>
      ${media}
      <footer class="post-actions">
        <div class="post-actions-left">
          <button type="button" class="post-action ${liked ? "liked" : ""}" data-action="like" data-id="${safeId}" aria-pressed="${liked}">
            <span class="action-icon" aria-hidden="true">${liked ? "♥" : "♡"}</span><span>${Number(post.likes || 0) + (liked ? 1 : 0)}</span>
          </button>
          <span class="post-action"><span class="action-icon" aria-hidden="true">▢</span><span>${Number(post.comments || 0)} bình luận</span></span>
        </div>
        <button type="button" class="post-action post-save" data-action="save" aria-label="Lưu bài viết">♧</button>
      </footer>
    </article>`;
}

function renderFeed() {
  const posts = getAllPosts().filter((post) =>
    (activeFilter !== "mine" || post.authorId === CURRENT_USER.id) &&
    (!activeGame || post.game === activeGame),
  );
  const shownPosts = activeFilter === "mine" || activeGame ? posts : posts.slice(0, visibleCount);
  feedList.innerHTML = shownPosts.map(renderPost).join("");
  feedEmpty.hidden = posts.length > 0;

  const canLoadMore = activeFilter === "all" && !activeGame && shownPosts.length < posts.length;
  loadMoreButton.hidden = !canLoadMore;
  feedStatus.textContent = !canLoadMore && shownPosts.length > 0 && activeFilter === "all" && !activeGame
    ? "Bạn đã cập nhật đến bài viết mới nhất."
    : "";
  activeGameFilter.hidden = !activeGame;
  activeGameFilter.innerHTML = activeGame
    ? `Đang xem bài viết về <strong>${escapeHtml(COMMUNITY_GAMES[activeGame]?.label || activeGame)}</strong><button type="button" data-clear-game aria-label="Bỏ lọc game">Bỏ lọc ×</button>`
    : "";
}

function updateCharCount() {
  document.getElementById("char-count").textContent = `${contentInput.value.length} / 600`;
}

function showImagePreview(source) {
  draftImage = source;
  if (source) previewImage.src = source;
  else previewImage.removeAttribute("src");
  imagePreview.hidden = !source;
}

function resetComposer() {
  editingId = null;
  postForm.reset();
  draftImage = "";
  imageInput.value = "";
  imagePreview.hidden = true;
  composerError.hidden = true;
  cancelEditButton.hidden = true;
  publishButton.innerHTML = '<span aria-hidden="true">↗</span> Đăng bài';
  document.getElementById("composer-title").textContent = "Chia sẻ với cộng đồng";
  updateCharCount();
}

function startEditing(postId) {
  const post = userPosts.find((item) => item.id === postId);
  if (!post) {
    showToast("Không tìm thấy bài viết để chỉnh sửa.", "error");
    return;
  }
  editingId = post.id;
  contentInput.value = post.content;
  gameInput.value = post.game || "";
  showImagePreview(post.image || "");
  composerError.hidden = true;
  cancelEditButton.hidden = false;
  publishButton.innerHTML = '<span aria-hidden="true">✓</span> Lưu thay đổi';
  document.getElementById("composer-title").textContent = "Chỉnh sửa bài viết";
  updateCharCount();
  postForm.scrollIntoView({ behavior: "smooth", block: "center" });
  contentInput.focus({ preventScroll: true });
}

async function readImageFile(file) {
  if (!file.type.startsWith("image/")) throw new Error("Vui lòng chọn một tệp hình ảnh.");
  if (file.size > 1_500_000) throw new Error("Ảnh cần nhỏ hơn 1,5 MB để lưu trên thiết bị.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không thể đọc ảnh đã chọn."));
    reader.readAsDataURL(file);
  });
}

postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const content = contentInput.value.trim();
  if (!content) {
    composerError.textContent = "Hãy viết vài dòng trước khi đăng bài.";
    composerError.hidden = false;
    contentInput.focus();
    return;
  }

  const previousPosts = userPosts;
  if (editingId) {
    userPosts = userPosts.map((post) => post.id === editingId
      ? { ...post, content, game: gameInput.value, image: draftImage, updatedAt: new Date().toISOString() }
      : post);
  } else {
    userPosts = [{
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      authorId: CURRENT_USER.id,
      author: CURRENT_USER.name,
      handle: CURRENT_USER.handle,
      avatar: CURRENT_USER.avatar,
      content,
      game: gameInput.value,
      image: draftImage,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
    }, ...userPosts];
  }

  if (!saveUserPosts()) {
    userPosts = previousPosts;
    return;
  }
  const wasEditing = Boolean(editingId);
  resetComposer();
  visibleCount = Math.max(visibleCount, 3);
  renderFeed();
  showToast(wasEditing ? "Đã cập nhật bài viết." : "Bài viết đã được đăng.");
});

imageInput.addEventListener("change", async () => {
  const [file] = imageInput.files;
  if (!file) return;
  try {
    showImagePreview(await readImageFile(file));
    composerError.hidden = true;
  } catch (error) {
    imageInput.value = "";
    composerError.textContent = error.message;
    composerError.hidden = false;
  }
});

document.getElementById("remove-image").addEventListener("click", () => {
  showImagePreview("");
  imageInput.value = "";
});
contentInput.addEventListener("input", updateCharCount);
cancelEditButton.addEventListener("click", resetComposer);
document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderFeed();
  });
});

document.querySelectorAll("[data-game-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeGame = button.dataset.gameFilter;
    activeFilter = "all";
    visibleCount = 3;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item.dataset.filter === "all";
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderFeed();
    document.querySelector(".feed-toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

activeGameFilter.addEventListener("click", (event) => {
  if (event.target.closest("[data-clear-game]")) {
    activeGame = "";
    renderFeed();
  }
});

feedList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const postId = button.dataset.id;
  if (button.dataset.action === "like") {
    if (likedPostIds.has(postId)) likedPostIds.delete(postId);
    else likedPostIds.add(postId);
    renderFeed();
    return;
  }
  if (button.dataset.action === "edit") {
    startEditing(postId);
    return;
  }
  if (button.dataset.action === "delete") {
    const post = userPosts.find((item) => item.id === postId);
    if (!post) {
      showToast("Không tìm thấy bài viết để xoá.", "error");
      return;
    }
    if (!confirm("Bạn có chắc muốn xoá bài viết này?")) return;
    const previousPosts = userPosts;
    userPosts = userPosts.filter((item) => item.id !== postId);
    if (!saveUserPosts()) {
      userPosts = previousPosts;
      return;
    }
    if (editingId === postId) resetComposer();
    renderFeed();
    showToast("Đã xoá bài viết.");
  }
  if (button.dataset.action === "save") showToast("Tính năng lưu bài viết sẽ sớm có mặt.");
});

loadMoreButton.addEventListener("click", () => {
  visibleCount += 3;
  renderFeed();
});

window.addEventListener("scroll", () => {
  const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
  if (remaining < 360 && window.scrollY > 100 && !loadMoreButton.hidden) {
    visibleCount += 3;
    renderFeed();
  }
}, { passive: true });

renderFeed();
