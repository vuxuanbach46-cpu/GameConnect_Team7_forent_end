document.addEventListener("DOMContentLoaded", () => {
    // --- 0. BẮT VÀ LƯU TOKEN NẾU REDIRECT TỪ GOOGLE OAUTH ---
    const urlParams = new URLSearchParams(window.location.search);
    const queryAccessToken = urlParams.get("access_token");
    const queryRefreshToken = urlParams.get("refresh_token");

    if (queryAccessToken) {
        localStorage.setItem("access_token", queryAccessToken);
        if (queryRefreshToken) {
            localStorage.setItem("refresh_token", queryRefreshToken);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- 1. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP ---
    const token = localStorage.getItem("access_token");

    // Người dùng CHƯA đăng nhập -> Chuyển đến file index
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    // Hiển thị tên / email user từ JWT payload
    const userDisplay = document.getElementById("user-display-name");
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const nameOrEmail = payload.email || payload.username || payload.sub || "Game thủ";
        if (userDisplay) {
            userDisplay.innerHTML = `<i class="fa-solid fa-circle-user text-orange-500 mr-1.5"></i> ${nameOrEmail}`;
        }
    } catch (e) {
        if (userDisplay) {
            userDisplay.innerHTML = `<i class="fa-solid fa-circle-user text-orange-500 mr-1.5"></i> Game thủ`;
        }
    }

    // --- 2. XỬ LÝ ĐĂNG XUẤT ---
    // Đăng xuất -> Xóa sạch token & trạng thái -> Chuyển về file index
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user_role");
            window.location.href = "../index.html";
        });
    }
});
