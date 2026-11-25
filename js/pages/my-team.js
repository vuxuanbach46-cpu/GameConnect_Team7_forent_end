let myTeams = [];

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
        <span>👥 ${escapeHTML(team.members)}/${escapeHTML(team.maxMembers)}</span>
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

async function loadMyTeams() {
    const status = document.getElementById("my-teams-status");
    if (!localStorage.getItem("access_token")) {
        status.textContent = "Vui lòng đăng nhập để xem các đội của bạn.";
        return;
    }
    status.textContent = "Đang tải danh sách đội...";
    try {
        const response = await api.get("/api/teams/mine");
        myTeams = response.data;
        status.textContent = "";
        renderMyTeams();
    } catch (error) {
        status.textContent = error.message || "Không thể tải danh sách đội.";
    }
}

loadMyTeams();

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
