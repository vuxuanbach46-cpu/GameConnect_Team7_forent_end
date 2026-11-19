const usersTableBody = document.getElementById("users-table-body");
const userSearch = document.getElementById("user-search");
const usersMessage = document.getElementById("users-message");

const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

const lockDialog = document.getElementById("lock-dialog");
const lockForm = document.getElementById("lock-form");
const lockDuration = document.getElementById("lock-duration");
const lockUserLabel = document.getElementById("lock-user-label");
const cancelLockBtn = document.getElementById("cancel-lock");

const sampleUsers = [
    {
        id: 1,
        full_name: "Nguyễn Văn An",
        email: "an@example.com",
        role: "USER",
        created_at: "2026-10-01",
        locked_until: null
    },
    {
        id: 2,
        full_name: "Trần Thị Bình",
        email: "binh@example.com",
        role: "USER",
        created_at: "2026-10-05",
        locked_until: null
    },
    {
        id: 3,
        full_name: "Lê Minh Châu",
        email: "chau@example.com",
        role: "USER",
        created_at: "2026-10-10",
        locked_until: null
    },
    {
        id: 4,
        full_name: "Phạm Quốc Dũng",
        email: "dung@example.com",
        role: "USER",
        created_at: "2026-10-12",
        locked_until: null
    },
    {
        id: 5,
        full_name: "Hoàng Ngọc Hà",
        email: "ha@example.com",
        role: "USER",
        created_at: "2026-10-15",
        locked_until: null
    },
    {
        id: 6,
        full_name: "Đỗ Anh Khoa",
        email: "khoa@example.com",
        role: "USER",
        created_at: "2026-10-20",
        locked_until: null
    }
];

const STORAGE_KEY = "gameconnect_admin_demo_users";

function loadDemoUsers() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (Array.isArray(saved)) {
            return saved;
        }
    } catch (error) {
        console.error("Lỗi đọc dữ liệu mẫu:", error);
    }

    return sampleUsers.map(user => ({ ...user }));
}

let users = loadDemoUsers();
let currentPage = 1;
const pageSize = 5;
let selectedUserId = null;

function saveUsers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function isLocked(user) {
    if (!user.locked_until) return false;

    if (user.locked_until === "permanent") {
        return true;
    }

    return new Date(user.locked_until).getTime() > Date.now();
}

function getFilteredUsers() {
    const keyword = userSearch.value.trim().toLowerCase();

    return users.filter(user => {
        const name = (user.full_name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();

        return name.includes(keyword) || email.includes(keyword);
    });
}

function renderUsers() {
    const filteredUsers = getFilteredUsers();
    const totalPages = Math.max(
        1,
        Math.ceil(filteredUsers.length / pageSize)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * pageSize;
    const pageUsers = filteredUsers.slice(start, start + pageSize);

    usersTableBody.replaceChildren();

    if (pageUsers.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "muted";
        cell.textContent = "Không tìm thấy người dùng.";

        row.appendChild(cell);
        usersTableBody.appendChild(row);
    }

    pageUsers.forEach(user => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = user.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = user.full_name;

        const emailCell = document.createElement("td");
        emailCell.textContent = user.email;

        const statusCell = document.createElement("td");
        const status = document.createElement("span");

        const locked = isLocked(user);

        status.className = locked
            ? "admin-status locked"
            : "admin-status active";

        status.textContent = locked ? "Đã khóa" : "Hoạt động";
        statusCell.appendChild(status);

        const actionCell = document.createElement("td");
        actionCell.className = "actions";

        const detailLink = document.createElement("a");
        detailLink.className = "btn btn-small";
        detailLink.href =
            `admin_user-detail.html?id=${encodeURIComponent(user.id)}`;
        detailLink.textContent = "Chi tiết";

        const actionButton = document.createElement("button");
        actionButton.type = "button";
        actionButton.className = locked
            ? "btn btn-small"
            : "btn btn-small btn-danger";

        actionButton.textContent = locked ? "Mở khóa" : "Khóa";

        actionButton.addEventListener("click", () => {
            if (locked) {
                unlockUser(user.id);
            } else {
                openLockDialog(user.id);
            }
        });

        actionCell.append(detailLink, actionButton);

        row.append(
            idCell,
            nameCell,
            emailCell,
            statusCell,
            actionCell
        );

        usersTableBody.appendChild(row);
    });

    pageInfo.textContent = `Trang ${currentPage}/${totalPages}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    usersMessage.textContent =
        `Tìm thấy ${filteredUsers.length} người dùng (dữ liệu mẫu).`;
}

function openLockDialog(userId) {
    const user = users.find(item => item.id === userId);

    if (!user) return;

    selectedUserId = userId;
    lockDuration.value = "1";
    lockUserLabel.textContent =
        `Bạn muốn khóa tài khoản ${user.full_name}?`;

    lockDialog.showModal();
}

function lockUser(userId, duration) {
    const user = users.find(item => item.id === userId);

    if (!user) return;

    if (duration === "permanent") {
        user.locked_until = "permanent";
    } else {
        const days = Number(duration);
        const endDate = new Date();

        endDate.setDate(endDate.getDate() + days);
        user.locked_until = endDate.toISOString();
    }

    saveUsers();
    renderUsers();
}

function unlockUser(userId) {
    const user = users.find(item => item.id === userId);

    if (!user) return;

    user.locked_until = null;

    saveUsers();
    renderUsers();
}

userSearch.addEventListener("input", () => {
    currentPage = 1;
    renderUsers();
});

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderUsers();
    }
});

nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(getFilteredUsers().length / pageSize);

    if (currentPage < totalPages) {
        currentPage++;
        renderUsers();
    }
});

lockForm.addEventListener("submit", event => {
    event.preventDefault();

    if (selectedUserId === null) return;

    lockUser(selectedUserId, lockDuration.value);

    lockDialog.close();
    selectedUserId = null;
});

cancelLockBtn.addEventListener("click", () => {
    lockDialog.close();
    selectedUserId = null;
});

renderUsers();
