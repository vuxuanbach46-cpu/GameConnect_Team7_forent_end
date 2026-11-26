// Kiểm tra quyền Admin ngay khi tải trang
(() => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }
  let role = localStorage.getItem("user_role") || "";
  try {
    const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (p && p.role) role = p.role;
  } catch (e) {}
  if (String(role).toUpperCase() !== "ADMIN") {
    window.location.replace("home.html");
  }
})();

const usersTableBody = document.getElementById('users-table-body');
const userSearch = document.getElementById('user-search');
const usersMessage = document.getElementById('users-message');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const lockDialog = document.getElementById('lock-dialog');
const lockForm = document.getElementById('lock-form');
const lockDuration = document.getElementById('lock-duration');
const lockReason = document.getElementById('lock-reason');
const lockError = document.getElementById('lock-error');
let currentPage = 1, totalPages = 1, users = [], selectedUserId = null, requestId = 0, searchTimer;
const pageSize = 5;
function isLocked(user) { return String(user.status).toUpperCase() === 'LOCKED'; }
function showError(error) { usersMessage.textContent = error.message || 'Không thể tải danh sách người dùng.'; }
async function loadUsers() {
    const currentRequest = ++requestId;
    usersMessage.textContent = 'Đang tải danh sách người dùng...';
    prevPageBtn.disabled = nextPageBtn.disabled = true;
    try {
        const response = await api.get('/api/admin/users', {page: currentPage, page_size: pageSize, search: userSearch.value.trim() || undefined});
        if (currentRequest !== requestId) return;
        const data = response.data;
        users = data.items;
        totalPages = Math.max(1, data.total_pages);
        if (currentPage > totalPages) { currentPage = totalPages; return loadUsers(); }
        renderUsers();
        usersMessage.textContent = `Tìm thấy ${data.total} người dùng.`;
    } catch (error) {
        if (currentRequest !== requestId) return;
        usersTableBody.replaceChildren();
        showError(error);
    }
}
function renderUsers() {
    usersTableBody.replaceChildren();
    if (!users.length) {
        const row = usersTableBody.insertRow(); const cell = row.insertCell();
        cell.colSpan = 5; cell.textContent = 'Không tìm thấy người dùng.';
    }
    for (const user of users) {
        const row = usersTableBody.insertRow();
        for (const value of [user.id, user.username, user.email]) row.insertCell().textContent = value ?? '—';
        const locked = isLocked(user);
        const status = document.createElement('span'); status.className = `admin-status ${locked ? 'locked' : 'active'}`;
        status.textContent = locked ? 'Đã khóa' : 'Hoạt động'; row.insertCell().append(status);
        const actions = row.insertCell(); actions.className = 'actions';
        const detail = document.createElement('a'); detail.className = 'btn btn-small'; detail.href = `admin_user-detail.html?id=${encodeURIComponent(user.id)}`; detail.textContent = 'Chi tiết';
        const action = document.createElement('button'); action.type = 'button'; action.className = locked ? 'btn btn-small' : 'btn btn-small btn-danger'; action.textContent = locked ? 'Mở khóa' : 'Khóa';
        action.addEventListener('click', async () => {
            if (!locked) { selectedUserId = user.id; lockForm.reset(); lockError.textContent = ''; document.getElementById('lock-user-label').textContent = `Bạn muốn khóa tài khoản ${user.username}?`; lockDialog.showModal(); return; }
            action.disabled = true;
            try { await api.patch(`/api/admin/users/${user.id}/unlock`, {}); await loadUsers(); }
            catch (error) { showError(error); } finally { action.disabled = false; }
        });
        actions.append(detail, action);
    }
    pageInfo.textContent = `Trang ${currentPage}/${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1; nextPageBtn.disabled = currentPage >= totalPages;
}
userSearch.addEventListener('input', () => { clearTimeout(searchTimer); currentPage = 1; searchTimer = setTimeout(loadUsers, 300); });
prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadUsers(); } });
nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadUsers(); } });
lockForm.addEventListener('submit', async event => {
    event.preventDefault(); if (selectedUserId === null) return;
    const reason = lockReason.value.trim(); if (!reason) { lockError.textContent = 'Vui lòng nhập lý do khóa.'; return; }
    const button = lockForm.querySelector('[type="submit"]'); button.disabled = true; lockError.textContent = '';
    try { await api.patch(`/api/admin/users/${selectedUserId}/lock`, {duration_days: lockDuration.value === 'permanent' ? null : Number(lockDuration.value), reason}); lockDialog.close(); selectedUserId = null; await loadUsers(); }
    catch (error) { lockError.textContent = error.message || 'Không thể khóa tài khoản.'; }
    finally { button.disabled = false; }
});
document.getElementById('cancel-lock').addEventListener('click', () => { lockDialog.close(); selectedUserId = null; });
loadUsers();
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
