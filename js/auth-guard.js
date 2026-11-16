document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role"); // 'ADMIN' hoặc 'USER' (lưu khi gọi API login thành công)
    
    const authNav = document.getElementById("auth-nav");
    const appView = document.getElementById("app-view");

    if (!token) {
        // --- 1. NHÓM KHÁCH (GUEST): Chưa đăng nhập ---
        authNav.innerHTML = `
            <a href="/login.html" class="px-4 py-2 text-sm text-gray-300 hover:text-white">Đăng nhập</a>
            <a href="/register.html" class="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">Đăng ký</a>
        `;
        // Khách chỉ xem được các trang public (Trang chủ, bài viết công khai, danh sách trận đấu...)
    } else {
        // Đã đăng nhập, kiểm tra xem là USER thường hay ADMIN
        if (userRole === "ADMIN") {
            // --- 2. NHÓM ADMIN ---
            authNav.innerHTML = `
                <a href="/admin-dashboard.html" class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold uppercase">Admin Panel</a>
                <span class="text-gray-300 text-sm">Chào, Admin</span>
                <button id="logout-btn" class="text-sm text-red-400 hover:underline">Đăng xuất</button>
            `;
        } else {
            // --- 3. NHÓM USER (Cần đăng nhập) ---
            authNav.innerHTML = `
                <a href="/create-match.html" class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">Tạo phòng đấu</a>
                <a href="/profile.html" class="text-sm text-gray-300 hover:text-white">Trang cá nhân</a>
                <button id="logout-btn" class="text-sm text-red-400 hover:underline">Đăng xuất</button>
            `;
        }

        // Xử lý sự kiện đăng xuất chung
        document.getElementById("logout-btn").addEventListener("click", () => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_role");
            window.location.reload();
        });
    }
});