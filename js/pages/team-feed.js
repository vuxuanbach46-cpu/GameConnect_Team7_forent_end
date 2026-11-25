const teamId = Number(new URLSearchParams(location.search).get('id'));
const postList = document.getElementById('feed-post-list');
const emptyBox = document.getElementById('feed-empty');
const accessDenied = document.getElementById('feed-access-denied');
const captainTools = document.getElementById('feed-captain-tools');
const modal = document.getElementById('feed-modal');
const form = document.getElementById('feed-post-form');
const postType = document.getElementById('feed-post-type');
const scheduleFields = document.getElementById('feed-schedule-fields');
let currentTeam = null;
let posts = [];

function escapeFeedHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function renderFeed() {
    const filter = document.getElementById('feed-filter').value;
    document.getElementById('announcement-count').textContent = posts.filter(p => p.type === 'announcement').length;
    document.getElementById('schedule-count').textContent = posts.filter(p => p.type === 'schedule').length;
    const filtered = posts.filter(p => filter === 'all' || p.type === filter);
    postList.innerHTML = filtered.map(post => `<article class="feed-post-card">
      <div class="feed-post-top"><span class="feed-post-badge">${post.type === 'schedule' ? '📅 Lịch chơi' : '📢 Thông báo'}</span>
      <span class="feed-post-date">${escapeFeedHTML(post.createdAt ? new Date(post.createdAt).toLocaleString('vi-VN') : '')}</span></div>
      <h3>${escapeFeedHTML(post.title)}</h3><p>${escapeFeedHTML(post.content)}</p>
      <div class="feed-post-footer"><span>✍️ ${escapeFeedHTML(post.author)}</span>${post.type === 'schedule' ? `<span>🕒 ${escapeFeedHTML(post.playDate)} ${escapeFeedHTML(post.playTime)}</span>` : ''}</div></article>`).join('');
    emptyBox.hidden = filtered.length > 0;
}
async function loadFeed() {
    if (!Number.isSafeInteger(teamId) || teamId <= 0) return deny('Không tìm thấy mã đội.');
    if (!localStorage.getItem('access_token') && !localStorage.getItem('token')) return deny('Vui lòng đăng nhập để xem bảng tin.');
    try {
        const response = await api.get(`/api/teams/${teamId}/feed`);
        currentTeam = response.data.team; posts = response.data.posts;
        document.getElementById('feed-team-name').textContent = currentTeam.name;
        document.getElementById('feed-user-role').textContent = currentTeam.role === 'captain' ? 'Đội trưởng' : 'Thành viên';
        captainTools.hidden = currentTeam.role !== 'captain';
        renderFeed();
    } catch (error) { deny(error.message || 'Không thể tải bảng tin.'); }
}
function deny(message) {
    document.querySelector('.feed-summary').hidden = true;
    document.querySelector('.feed-toolbar').hidden = true;
    postList.hidden = true;
    accessDenied.querySelector('p').textContent = message;
    accessDenied.hidden = false;
}
function closeFeedModal() { modal.hidden = true; }
document.getElementById('feed-filter').addEventListener('change', renderFeed);
document.getElementById('btn-create-post').addEventListener('click', () => {
    if (!currentTeam || currentTeam.role !== 'captain') return;
    form.reset(); document.getElementById('feed-form-error').hidden = true;
    scheduleFields.hidden = true; updateScheduleFields(); modal.hidden = false;
});
document.getElementById('btn-close-feed-modal').addEventListener('click', closeFeedModal);
document.getElementById('btn-cancel-feed').addEventListener('click', closeFeedModal);
function updateScheduleFields() {
    const schedule = postType.value === 'schedule'; scheduleFields.hidden = !schedule;
    document.getElementById('feed-play-date').required = schedule;
    document.getElementById('feed-play-time').required = schedule;
}
postType.addEventListener('change', updateScheduleFields);
form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentTeam || currentTeam.role !== 'captain') return;
    const error = document.getElementById('feed-form-error');
    const type = postType.value;
    const body = {type, title:document.getElementById('feed-post-title').value.trim(), content:document.getElementById('feed-post-content').value.trim()};
    if (type === 'schedule') { body.play_date = document.getElementById('feed-play-date').value; body.play_time = document.getElementById('feed-play-time').value; }
    if (!body.title || !body.content || (type === 'schedule' && (!body.play_date || !body.play_time))) { error.textContent = 'Vui lòng nhập đầy đủ thông tin.'; error.hidden = false; return; }
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
    try {
        await api.post(`/api/teams/${teamId}/feed`, body);
        document.getElementById('feed-filter').value = 'all'; closeFeedModal(); await loadFeed();
    } catch (err) { error.textContent = err.message || 'Không thể đăng bài.'; error.hidden = false; }
    finally { submit.disabled = false; }
});
modal.addEventListener('click', event => { if (event.target === modal) closeFeedModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeFeedModal(); });
loadFeed();

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
