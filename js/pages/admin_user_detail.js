const STORAGE_KEY = "gameconnect_admin_demo_users";

const params = new URLSearchParams(window.location.search);
const userId = Number(params.get("id"));

const detailMessage = document.getElementById("user-detail-message");
const lockButton = document.getElementById("detail-lock-btn");
const unlockButton = document.getElementById("detail-unlock-btn");
const lockDialog = document.getElementById("detail-lock-dialog");
const lockForm = document.getElementById("detail-lock-form");
const lockDuration = document.getElementById("detail-lock-duration");
const cancelButton = document.getElementById("detail-cancel-lock");

function loadUsers() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Không đọc được dữ liệu:", error);
        return [];
    }
}

let users = loadUsers();
let currentUser = users.find(user => Number(user.id) === userId);

function isUserLocked(user) {
    if (!user || !user.locked_until) return false;

    if (user.locked_until === "permanent") return true;

    return new Date(user.locked_until).getTime() > Date.now();
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? "--";
    }
}

function formatDate(value) {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleDateString("vi-VN");
}

function renderUserDetail() {
    if (!currentUser) {
        detailMessage.textContent =
            "Không tìm thấy người dùng. Hãy quay lại danh sách.";
        detailMessage.style.color = "#dc2626";

        setText("detail-name", "Không tìm thấy");
        lockButton.hidden = true;
        unlockButton.hidden = true;
        return;
    }

    detailMessage.textContent = "Đang hiển thị dữ liệu minh họa.";

    const name = currentUser.full_name || "Chưa có tên";
    const email = currentUser.email || "--";
    const locked = isUserLocked(currentUser);

    setText("detail-name", name);
    setText("detail-email", email);
    setText("detail-id", currentUser.id);
    setText("detail-full-name", name);
    setText("detail-email-info", email);
    setText("detail-role", currentUser.role || "USER");
    setText("detail-created-at", formatDate(currentUser.created_at));

    setText(
        "detail-account-status",
        locked ? "Đã khóa" : "Hoạt động"
    );

    const avatar = document.getElementById("user-avatar");
    avatar.textContent = name.charAt(0).toUpperCase();

    const status = document.getElementById("detail-status");
    status.className = locked
        ? "admin-status locked"
        : "admin-status active";

    status.textContent = locked ? "Đã khóa" : "Hoạt động";

    lockButton.hidden = locked;
    unlockButton.hidden = !locked;
}

function saveUserChanges() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

lockButton.addEventListener("click", () => {
    if (!currentUser) return;

    lockDuration.value = "1";
    lockDialog.showModal();
});

cancelButton.addEventListener("click", () => {
    lockDialog.close();
});

lockForm.addEventListener("submit", event => {
    event.preventDefault();

    if (!currentUser) return;

    const duration = lockDuration.value;

    if (duration === "permanent") {
        currentUser.locked_until = "permanent";
    } else {
        const days = Number(duration);
        const endDate = new Date();

        endDate.setDate(endDate.getDate() + days);
        currentUser.locked_until = endDate.toISOString();
    }

    saveUserChanges();
    lockDialog.close();
    renderUserDetail();
});

unlockButton.addEventListener("click", () => {
    if (!currentUser) return;

    currentUser.locked_until = null;

    saveUserChanges();
    renderUserDetail();
});

renderUserDetail();

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
