const invitationList = document.getElementById("invitation-list");
const invitationMessage = document.getElementById("invitation-message");

async function loadInvitations() {
  invitationList.replaceChildren();
  if (!localStorage.getItem("access_token")) {
    invitationMessage.textContent = "Vui lòng đăng nhập để xem lời mời.";
    const link = document.createElement("a");
    link.href = "login.html"; link.textContent = "Đăng nhập";
    invitationMessage.append(" ", link);
    return;
  }
  invitationMessage.textContent = "Đang tải lời mời...";
  try {
    const response = await api.get("/api/team-invitations/me");
    const invitations = response.data || [];
    invitationMessage.textContent = invitations.length ? "" : "Bạn chưa có lời mời nào đang chờ.";
    for (const invitation of invitations) {
      const card = document.createElement("article"); card.className = "my-teams-card";
      const title = document.createElement("h2"); title.textContent = invitation.team_name;
      const description = document.createElement("p"); description.textContent = `${invitation.inviter_name} mời bạn tham gia đội.`;
      const actions = document.createElement("div"); actions.className = "my-teams-card-actions";
      for (const [action, label, css] of [["accept", "Chấp nhận", "my-teams-action"], ["reject", "Từ chối", "my-teams-secondary"]]) {
        const button = document.createElement("button"); button.type = "button"; button.className = css; button.textContent = label;
        button.addEventListener("click", async () => {
          actions.querySelectorAll("button").forEach((b) => b.disabled = true);
          try {
            await api.patch(`/api/team-invitations/${invitation.id}`, { action });
            await loadInvitations();
          } catch (error) {
            invitationMessage.textContent = error.message || "Không thể phản hồi lời mời.";
            actions.querySelectorAll("button").forEach((b) => b.disabled = false);
          }
        });
        actions.append(button);
      }
      card.append(title, description, actions); invitationList.append(card);
    }
  } catch (error) { invitationMessage.textContent = error.message || "Không thể tải lời mời."; }
}
loadInvitations();

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
  const active = current === 'team-invitations.html' ? 'my-team.html' : current === 'team-detail.html' ? 'teams.html' : current === 'team-feed.html' ? 'my-team.html' : current === 'admin_user-detail.html' ? 'admin_users.html' : current;
  const shell = document.createElement('aside');
  shell.className = 'gc-team-nav';
  shell.setAttribute('aria-label', 'Điều hướng chính');
  shell.innerHTML = `<a class="gc-team-brand" href="home.html"><span class="gc-team-brand-icon">✣</span><span><strong>GameConnect</strong><small>GAMING HUB</small></span></a><span class="gc-team-nav-heading">KHÁM PHÁ</span><nav>${links.map(([href, icon, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}" ${href === active ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</a>`).join('')}</nav><a class="gc-team-nav-bottom" href="../index.html">GameConnect <span>GAMING HUB</span></a>`;
  document.body.prepend(shell);
})();
