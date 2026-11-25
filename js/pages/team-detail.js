document.addEventListener('DOMContentLoaded', () => {
    const teamId = Number(new URLSearchParams(location.search).get('id'));
    const $ = id => document.getElementById(id);
    const authenticated = Boolean(localStorage.getItem('access_token') || localStorage.getItem('token'));
    let currentUser = null;
    let team = null;
    let pending = null;

    function message(text) { $('team-message').textContent = text; }
    function button(label, action, primary = false) {
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = primary ? 'btn btn-primary' : 'btn'; btn.textContent = label;
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            try { await action(); await loadTeam(); }
            catch (error) { message(error.message || 'Không thể thực hiện thao tác.'); }
            finally { btn.disabled = false; }
        });
        return btn;
    }
    async function loadTeam() {
        if (!Number.isSafeInteger(teamId) || teamId <= 0) { $('team-name').textContent = 'Không tìm thấy đội'; message('Mã đội không hợp lệ.'); return; }
        try {
            const result = await api.get(`/api/teams/${teamId}`); team = result.data;
            if (authenticated && !currentUser) {
                try { currentUser = (await api.get('/user/me')).data; }
                catch (error) { message(error.message || 'Không thể xác minh tài khoản.'); }
            }
            const captain = currentUser && Number(team.captain_id) === Number(currentUser.id);
            const isMember = currentUser && team.members.some(member => Number(member.user_id) === Number(currentUser.id));
            $('team-name').textContent = team.name;
            $('team-game').textContent = `Game #${team.main_game_id}`;
            $('team-description').textContent = team.description || 'Chưa có mô tả đội.';
            $('team-count').textContent = `${team.total_members}/${team.max_members} thành viên`;
            const logo = $('team-logo'); logo.replaceChildren();
            if (team.logo_url) { const img = document.createElement('img'); img.src = team.logo_url; img.alt = `Logo đội ${team.name}`; logo.append(img); }
            else logo.textContent = team.name.slice(0, 2).toUpperCase();
            $('btn-join').hidden = true; $('btn-leave').hidden = true; $('join-status').textContent = '';
            if (!currentUser) $('join-status').textContent = 'Đăng nhập để tham gia đội.';
            else if (captain) $('join-status').textContent = 'Bạn là đội trưởng';
            else if (isMember) $('btn-leave').hidden = false;
            else {
                try { pending = (await api.get(`/api/teams/${teamId}/join-request/me`)).data; }
                catch (error) { pending = null; message(error.message || 'Không tải được trạng thái yêu cầu.'); }
                if (pending?.status === 'PENDING') $('join-status').textContent = 'Đang chờ đội trưởng duyệt';
                else if (team.total_members >= team.max_members) $('join-status').textContent = 'Đội đã đủ thành viên';
                else $('btn-join').hidden = false;
            }
            const list = $('member-list'); list.replaceChildren();
            for (const member of team.members) {
                const row = document.createElement('div'); row.className = 'team-member';
                const info = document.createElement('div'); info.className = 'member-info';
                const label = document.createElement('div'); label.textContent = `${member.username} · ${member.role === 'CAPTAIN' ? 'Đội trưởng' : 'Thành viên'}`; info.append(label); row.append(info);
                if (captain && Number(member.user_id) !== Number(currentUser.id)) {
                    const actions = document.createElement('div'); actions.className = 'member-actions';
                    actions.append(button('Xóa khỏi đội', async () => { if (!confirm(`Xóa ${member.username} khỏi đội?`)) return; await api.delete(`/api/teams/${teamId}/members/${member.user_id}`); message('Đã xóa thành viên.'); }));
                    actions.append(button('Chuyển quyền', async () => { if (!confirm(`Chuyển quyền đội trưởng cho ${member.username}?`)) return; await api.patch(`/api/teams/${teamId}/transfer-captain`, {new_captain_id:member.user_id}); message('Đã chuyển quyền đội trưởng.'); }, true));
                    row.append(actions);
                }
                list.append(row);
            }
            $('captain-panel').hidden = !captain; $('request-list').replaceChildren();
            if (captain) {
                try {
                    const requests = (await api.get(`/api/teams/${teamId}/join-requests`)).data;
                    if (!requests.length) $('request-list').textContent = 'Không có yêu cầu chờ duyệt.';
                    for (const request of requests) {
                        const row = document.createElement('div'); row.className = 'team-request';
                        const label = document.createElement('span'); label.textContent = request.username + (request.message ? `: ${request.message}` : ''); row.append(label);
                        const actions = document.createElement('div'); actions.className = 'member-actions';
                        for (const [title, status] of [['Duyệt','ACCEPTED'],['Từ chối','REJECTED']]) actions.append(button(title, async () => { await api.patch(`/api/teams/${teamId}/join-requests/${request.id}`, {status}); message('Đã xử lý yêu cầu.'); }, status === 'ACCEPTED'));
                        row.append(actions); $('request-list').append(row);
                    }
                } catch (error) { $('request-list').textContent = error.message || 'Không thể tải yêu cầu.'; }
            }
        } catch (error) { $('team-name').textContent = 'Không tải được đội'; message(error.message || 'Không thể tải thông tin đội.'); }
    }
    $('btn-join').addEventListener('click', async () => {
        $('btn-join').disabled = true;
        try { const res = await api.post(`/api/teams/${teamId}/join`, {}); message(res.message || 'Đã gửi yêu cầu.'); await loadTeam(); }
        catch (error) { message(error.message || 'Không thể tham gia đội.'); }
        finally { $('btn-join').disabled = false; }
    });
    $('btn-leave').addEventListener('click', async () => {
        if (!confirm('Bạn muốn rời đội này?')) return;
        $('btn-leave').disabled = true;
        try { await api.post(`/api/teams/${teamId}/leave`, {}); message('Đã rời đội.'); await loadTeam(); }
        catch (error) { message(error.message || 'Không thể rời đội.'); }
        finally { $('btn-leave').disabled = false; }
    });
    loadTeam();
});

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
