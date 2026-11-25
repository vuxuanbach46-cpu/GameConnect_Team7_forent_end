const TEAM_STORAGE_KEY = "gameconnect_my_teams";
const FEED_STORAGE_KEY = "gameconnect_team_feed";

const sampleTeams = [
    { id: 1, name: "GameConnect Warriors", role: "captain" },
    { id: 2, name: "Valorant Legends", role: "member" },
    { id: 3, name: "PUBG Squad", role: "member" }
];

const samplePosts = [
    {
        id: 1,
        teamId: 1,
        type: "announcement",
        title: "Chào mừng đến với GameConnect Warriors!",
        content: "Chào mọi người! Đây là bảng tin chung của đội. Các thông báo quan trọng và lịch chơi sẽ được cập nhật tại đây.",
        author: "Đội trưởng",
        createdAt: "2026-11-18T09:00:00"
    },
    {
        id: 2,
        teamId: 1,
        type: "schedule",
        title: "Leo rank cùng đội tối thứ Sáu",
        content: "Mọi người chuẩn bị mic và vào phòng đúng giờ nhé!",
        playDate: "2026-11-20",
        playTime: "20:00",
        author: "Đội trưởng",
        createdAt: "2026-11-18T10:00:00"
    },
    {
        id: 3,
        teamId: 2,
        type: "announcement",
        title: "Nội quy đội Valorant Legends",
        content: "Chơi vui vẻ, tôn trọng đồng đội và không toxic nhé!",
        author: "Đội trưởng",
        createdAt: "2026-11-18T08:00:00"
    },
    {
        id: 4,
        teamId: 3,
        type: "schedule",
        title: "PUBG Squad cuối tuần",
        content: "Tập trung đủ thành viên để chơi squad.",
        playDate: "2026-11-21",
        playTime: "19:30",
        author: "Đội trưởng",
        createdAt: "2026-11-18T08:30:00"
    }
];

function readArray(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (error) {
        console.error("Lỗi đọc dữ liệu:", error);
    }
    return fallback;
}

const teams = readArray(TEAM_STORAGE_KEY, sampleTeams);
let posts = readArray(FEED_STORAGE_KEY, samplePosts);

const params = new URLSearchParams(window.location.search);
const teamId = Number(params.get("id") || 1);
const currentTeam = teams.find((team) => Number(team.id) === teamId);

const postList = document.getElementById("feed-post-list");
const emptyBox = document.getElementById("feed-empty");
const accessDenied = document.getElementById("feed-access-denied");
const captainTools = document.getElementById("feed-captain-tools");
const modal = document.getElementById("feed-modal");
const form = document.getElementById("feed-post-form");
const postType = document.getElementById("feed-post-type");
const scheduleFields = document.getElementById("feed-schedule-fields");

function escapeFeedHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatFeedDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString("vi-VN");
}

function renderFeed() {
    if (!currentTeam) return;

    const filter = document.getElementById("feed-filter").value;
    const teamPosts = posts.filter((post) => Number(post.teamId) === teamId);

    document.getElementById("announcement-count").textContent =
        teamPosts.filter((post) => post.type === "announcement").length;

    document.getElementById("schedule-count").textContent =
        teamPosts.filter((post) => post.type === "schedule").length;

    const filteredPosts = teamPosts
        .filter((post) => filter === "all" || post.type === filter)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    postList.innerHTML = filteredPosts.map((post) => `
    <article class="feed-post-card">
      <div class="feed-post-top">
        <span class="feed-post-badge ${post.type === "schedule" ? "schedule" : ""}">
          ${post.type === "schedule" ? "📅 Lịch chơi" : "📢 Thông báo"}
        </span>
        <span class="feed-post-date">
          ${escapeFeedHTML(formatFeedDate(post.createdAt))}
        </span>
      </div>

      <h3>${escapeFeedHTML(post.title)}</h3>
      <p>${escapeFeedHTML(post.content)}</p>

      <div class="feed-post-footer">
        <span>✍️ ${escapeFeedHTML(post.author)}</span>
        ${post.type === "schedule" ? `
          <span class="feed-play-info">
            🕒 ${escapeFeedHTML(post.playDate || "")}
            ${escapeFeedHTML(post.playTime || "")}
          </span>
        ` : ""}
      </div>
    </article>
  `).join("");

    emptyBox.hidden = filteredPosts.length > 0;
}

function openFeedModal() {
    if (!currentTeam || currentTeam.role !== "captain") return;
    form.reset();
    document.getElementById("feed-form-error").hidden = true;
    scheduleFields.hidden = true;
    modal.hidden = false;
}

function closeFeedModal() {
    modal.hidden = true;
}

function updateScheduleFields() {
    const isSchedule = postType.value === "schedule";
    scheduleFields.hidden = !isSchedule;
    document.getElementById("feed-play-date").required = isSchedule;
    document.getElementById("feed-play-time").required = isSchedule;
}

function saveFeedPost(event) {
    event.preventDefault();

    if (!currentTeam || currentTeam.role !== "captain") return;

    const type = postType.value;
    const title = document.getElementById("feed-post-title").value.trim();
    const content = document.getElementById("feed-post-content").value.trim();
    const playDate = document.getElementById("feed-play-date").value;
    const playTime = document.getElementById("feed-play-time").value;
    const errorBox = document.getElementById("feed-form-error");

    if (!title || !content || (type === "schedule" && (!playDate || !playTime))) {
        errorBox.textContent = "Vui lòng nhập đầy đủ thông tin.";
        errorBox.hidden = false;
        return;
    }

    const newPost = {
        id: Date.now(),
        teamId,
        type,
        title,
        content,
        author: "Đội trưởng",
        createdAt: new Date().toISOString(),
        ...(type === "schedule" ? { playDate, playTime } : {})
    };

    posts.unshift(newPost);

    try {
        localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
        posts.shift();
        errorBox.textContent = "Không thể lưu bài viết. Vui lòng thử lại.";
        errorBox.hidden = false;
        return;
    }

    document.getElementById("feed-filter").value = "all";
    closeFeedModal();
    renderFeed();
}

function initTeamFeed() {
    if (!currentTeam) {
        document.querySelector(".feed-summary").hidden = true;
        document.querySelector(".feed-toolbar").hidden = true;
        postList.hidden = true;
        accessDenied.hidden = false;
        return;
    }

    document.getElementById("feed-team-name").textContent =
        currentTeam.name;

    document.getElementById("feed-user-role").textContent =
        currentTeam.role === "captain" ? "Đội trưởng" : "Thành viên";

    captainTools.hidden = currentTeam.role !== "captain";

    renderFeed();
}

document.getElementById("feed-filter")
    .addEventListener("change", renderFeed);

document.getElementById("btn-create-post")
    .addEventListener("click", openFeedModal);

document.getElementById("btn-close-feed-modal")
    .addEventListener("click", closeFeedModal);

document.getElementById("btn-cancel-feed")
    .addEventListener("click", closeFeedModal);

postType.addEventListener("change", updateScheduleFields);

form.addEventListener("submit", saveFeedPost);

modal.addEventListener("click", (event) => {
    if (event.target === modal) closeFeedModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeFeedModal();
});

initTeamFeed();

// Điều hướng chung cho các trang đội và quản trị.
(() => {
  const current = location.pathname.split('/').pop();
  const token = localStorage.getItem('access_token');
  let role = localStorage.getItem('user_role') || '';
  if (token) {
    try {
      const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (p && p.role) role = p.role;
    } catch (e) {}
  }
  const isAdmin = Boolean(token) && String(role).toUpperCase() === 'ADMIN';
  const links = [
    ['home.html', '⌂', 'Trang chủ'],
    ['community.html', '▤', 'Cộng đồng'],
    ['friends.html', '♙', 'Bạn bè'],
    ['team-posts.html', '⌕', 'Tìm đồng đội'],
    ['teams.html', '◈', 'Danh sách đội'],
    ['my-team.html', '♜', 'Đội của tôi'],
  ];
  if (isAdmin) {
    links.push(['admin-dashboard.html', '📊', 'Dashboard Admin']);
    links.push(['admin-reports.html', '🛡', 'Quản lý Báo cáo']);
    links.push(['admin_users.html', '⚙', 'Quản lý người dùng']);
  }
  const active = current === 'team-detail.html' ? 'teams.html' : current === 'team-feed.html' ? 'my-team.html' : current === 'admin_user-detail.html' ? 'admin_users.html' : current;
  const shell = document.createElement('aside');
  shell.className = 'gc-team-nav';
  shell.setAttribute('aria-label', 'Điều hướng chính');
  shell.innerHTML = `<a class="gc-team-brand" href="home.html"><span class="gc-team-brand-icon">✣</span><span><strong>GameConnect</strong><small>GAMING HUB</small></span></a><span class="gc-team-nav-heading">KHÁM PHÁ</span><nav>${links.map(([href, icon, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}" ${href === active ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</a>`).join('')}</nav><a class="gc-team-nav-bottom" href="../index.html">GameConnect <span>GAMING HUB</span></a>`;
  document.body.prepend(shell);
})();
