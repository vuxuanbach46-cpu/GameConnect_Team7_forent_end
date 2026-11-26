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

const userId = Number(new URLSearchParams(location.search).get('id'));
const detailMessage = document.getElementById('user-detail-message');
const lockButton = document.getElementById('detail-lock-btn');
const unlockButton = document.getElementById('detail-unlock-btn');
const lockDialog = document.getElementById('detail-lock-dialog');
const lockForm = document.getElementById('detail-lock-form');
let currentUser = null;
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value ?? '—'; }
function formatDate(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN'); }
function renderUserDetail() {
    const user = currentUser; const locked = String(user.status).toUpperCase() === 'LOCKED';
    const name = user.username || 'Chưa có tên';
    setText('detail-name', name); setText('detail-email', user.email); setText('detail-id', user.id);
    setText('detail-full-name', name); setText('detail-email-info', user.email); setText('detail-role', user.role);
    setText('detail-created-at', formatDate(user.created_at)); setText('detail-account-status', locked ? 'Đã khóa' : 'Hoạt động');
    document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
    const status = document.getElementById('detail-status'); status.className = `admin-status ${locked ? 'locked' : 'active'}`; status.textContent = locked ? 'Đã khóa' : 'Hoạt động';
    lockButton.hidden = locked; unlockButton.hidden = !locked;
}
async function loadUserDetail() {
    lockButton.hidden = unlockButton.hidden = true;
    if (!Number.isSafeInteger(userId) || userId <= 0) { detailMessage.textContent = 'Mã người dùng không hợp lệ.'; return; }
    detailMessage.textContent = 'Đang tải thông tin...';
    try { const response = await api.get(`/api/admin/users/${userId}`); currentUser = response.data; renderUserDetail(); detailMessage.textContent = ''; }
    catch (error) { currentUser = null; setText('detail-name', 'Không tải được người dùng'); detailMessage.textContent = error.message || 'Không thể tải thông tin người dùng.'; }
}
lockButton.addEventListener('click', () => { if (!currentUser) return; lockForm.reset(); document.getElementById('detail-lock-error').textContent = ''; lockDialog.showModal(); });
document.getElementById('detail-cancel-lock').addEventListener('click', () => lockDialog.close());
lockForm.addEventListener('submit', async event => {
    event.preventDefault(); if (!currentUser) return;
    const errorBox = document.getElementById('detail-lock-error'); const reason = document.getElementById('detail-lock-reason').value.trim();
    if (!reason) { errorBox.textContent = 'Vui lòng nhập lý do khóa.'; return; }
    const duration = document.getElementById('detail-lock-duration').value; const submit = lockForm.querySelector('[type="submit"]'); submit.disabled = true; errorBox.textContent = '';
    try { await api.patch(`/api/admin/users/${userId}/lock`, {duration_days: duration === 'permanent' ? null : Number(duration), reason}); lockDialog.close(); await loadUserDetail(); }
    catch (error) { errorBox.textContent = error.message || 'Không thể khóa tài khoản.'; } finally { submit.disabled = false; }
});
unlockButton.addEventListener('click', async () => {
    if (!currentUser) return; unlockButton.disabled = true;
    try { await api.patch(`/api/admin/users/${userId}/unlock`, {}); await loadUserDetail(); }
    catch (error) { detailMessage.textContent = error.message || 'Không thể mở khóa tài khoản.'; }
    finally { unlockButton.disabled = false; }
});
loadUserDetail();
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
