const STORAGE_KEY = "gameconnect_my_teams";

const demoTeams = [
    {
        id: 1,
        name: "GameConnect Warriors",
        game: "Liên Minh Huyền Thoại",
        description: "Cùng nhau leo rank, giao lưu và tìm đồng đội mỗi tối.",
        role: "captain",
        members: 3,
        maxMembers: 5
    },
    {
        id: 2,
        name: "Valorant Legends",
        game: "Valorant",
        description: "Đội chơi Valorant vui vẻ, ưu tiên teamwork và giao tiếp.",
        role: "member",
        members: 4,
        maxMembers: 5
    },
    {
        id: 3,
        name: "PUBG Squad",
        game: "PUBG",
        description: "Tập hợp những người yêu thích PUBG và chơi cùng cuối tuần.",
        role: "member",
        members: 4,
        maxMembers: 4
    }
];

function loadMyTeams() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (error) {
        console.error("Không thể đọc danh sách đội:", error);
    }

    return demoTeams;
}

let myTeams = loadMyTeams();

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function updateTeamStats() {
    document.getElementById("total-teams").textContent = myTeams.length;
    document.getElementById("captain-teams").textContent =
        myTeams.filter((team) => team.role === "captain").length;
    document.getElementById("member-teams").textContent =
        myTeams.filter((team) => team.role === "member").length;
}

function renderMyTeams() {
    const filter = document.getElementById("team-role-filter").value;
    const list = document.getElementById("my-teams-list");
    const empty = document.getElementById("my-teams-empty");

    const filteredTeams = myTeams.filter((team) =>
        filter === "all" || team.role === filter
    );

    list.innerHTML = filteredTeams.map((team) => `
    <article class="my-teams-card">
      <div class="my-teams-card-header">
        <div class="my-teams-avatar">🎮</div>
        <div>
          <h3>${escapeHTML(team.name)}</h3>
          <span class="my-teams-role">
            ${team.role === "captain" ? "👑 Đội trưởng" : "Thành viên"}
          </span>
        </div>
      </div>

      <p class="my-teams-description">
        ${escapeHTML(team.description)}
      </p>

      <div class="my-teams-info">
        <span>🎯 ${escapeHTML(team.game)}</span>
        <span>👥 ${team.members}/${team.maxMembers}</span>
      </div>

      <div class="my-teams-card-actions">
        <a class="my-teams-action"
           href="team-feed.html?id=${encodeURIComponent(team.id)}">
          Xem bảng tin
        </a>
        <a class="my-teams-secondary"
           href="team-detail.html?id=${encodeURIComponent(team.id)}">
          Chi tiết đội
        </a>
      </div>
    </article>
  `).join("");

    empty.hidden = filteredTeams.length > 0;
    updateTeamStats();
}

document.getElementById("team-role-filter")
    .addEventListener("change", renderMyTeams);

renderMyTeams();

// Điều hướng chung cho các trang đội và quản trị.
(() => {
  const current = location.pathname.split('/').pop();
  const links = [
    ['home.html', '⌂', 'Trang chủ'],
    ['community.html', '▤', 'Cộng đồng'],
    ['friends.html', '♙', 'Bạn bè'],
    ['team-posts.html', '⌕', 'Tìm đồng đội'],
    ['teams.html', '◈', 'Danh sách đội'],
    ['my-team.html', '♜', 'Đội của tôi'],
    ['admin_users.html', '⚙', 'Quản lý người dùng']
  ];
  const active = current === 'team-detail.html' ? 'teams.html' : current === 'team-feed.html' ? 'my-team.html' : current === 'admin_user-detail.html' ? 'admin_users.html' : current;
  const shell = document.createElement('aside');
  shell.className = 'gc-team-nav';
  shell.setAttribute('aria-label', 'Điều hướng chính');
  shell.innerHTML = `<a class="gc-team-brand" href="home.html"><span class="gc-team-brand-icon">✣</span><span><strong>GameConnect</strong><small>GAMING HUB</small></span></a><span class="gc-team-nav-heading">KHÁM PHÁ</span><nav>${links.map(([href, icon, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}" ${href === active ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</a>`).join('')}</nav><a class="gc-team-nav-bottom" href="../index.html">GameConnect <span>GAMING HUB</span></a>`;
  document.body.prepend(shell);
})();
