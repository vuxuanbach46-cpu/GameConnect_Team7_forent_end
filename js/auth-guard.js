document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role"); // 'ADMIN' hoặc 'USER' (lưu khi gọi API login thành công)
    
    const authNav = document.getElementById("auth-nav");
    if (!authNav) return;

    const inPagesDir = window.location.pathname.includes("/pages/");
    const loginLink = inPagesDir ? "login.html" : "pages/login.html";
    const registerLink = inPagesDir ? "register.html" : "pages/register.html";
    const homeLink = inPagesDir ? "home.html" : "pages/home.html";
    const adminDashboardLink = inPagesDir ? "admin-dashboard.html" : "pages/admin-dashboard.html";
    const adminReportsLink = inPagesDir ? "admin-reports.html" : "pages/admin-reports.html";
    const indexLink = inPagesDir ? "../index.html" : "index.html";

    if (!token) {
        // --- 1. NHÓM KHÁCH (GUEST): Chưa đăng nhập ---
        authNav.innerHTML = `
            <a href="${loginLink}" class="px-4 py-2 text-sm text-gray-300 hover:text-white">Đăng nhập</a>
            <a href="${registerLink}" class="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">Đăng ký</a>
        `;
    } else {
        // Đã đăng nhập, kiểm tra xem là USER thường hay ADMIN
        if (userRole === "ADMIN") {
            // --- 2. NHÓM ADMIN ---
            authNav.innerHTML = `
                <a href="${adminDashboardLink}" class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold uppercase">Admin Panel</a>
                <span class="text-gray-300 text-sm">Chào, Admin</span>
                <button id="logout-btn" class="text-sm text-red-400 hover:underline">Đăng xuất</button>
            `;
        } else {
            // --- 3. NHÓM USER (Cần đăng nhập) ---
            authNav.innerHTML = `
                <a href="${homeLink}" class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">Sảnh chính</a>
                <button id="logout-btn" class="text-sm text-red-400 hover:underline">Đăng xuất</button>
            `;
        }

        // Xử lý sự kiện đăng xuất chung
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("remember_login");
                localStorage.removeItem("auth_provider");
                localStorage.removeItem("user_role");
                window.location.href = indexLink;
            });
        }
    }
});
