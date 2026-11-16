document.addEventListener("DOMContentLoaded", () => {
  // --- 1. BẮT VÀ LƯU TOKEN TỪ GOOGLE OAUTH REDIRECT ---
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("access_token");
  const refreshToken = urlParams.get("refresh_token");

  if (accessToken) {
    // Lưu token vào localStorage giống như hệ thống đăng nhập thông thường
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    // Xóa token trên URL query string bằng History API cho giao diện sạch sẽ, bảo mật
    window.history.replaceState({}, document.title, window.location.pathname);

    console.log("Xác thực Google OAuth thành công!");
  }

  // --- 2. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP & CẬP NHẬT GIAO DIỆN (UI) ---
  const token = localStorage.getItem("access_token");
  const authActionContainer = document.getElementById("auth-actions"); // Khu vực chứa nút Đăng nhập / Đăng ký ở Header (tuỳ bạn đặt ID trong HTML)

  if (token) {
    // Người dùng ĐÃ đăng nhập
    console.log("Người dùng đã đăng nhập vào hệ thống.");

    // Bạn có thể gọi API lấy thông tin user hoặc thay đổi giao diện ở đây
    if (authActionContainer) {
      authActionContainer.innerHTML = `
                <div class="user-profile-menu">
                    <span class="welcome-text"><i class="fa-solid fa-user-shield"></i> Chào mừng game thủ!</span>
                    <button id="logout-btn" class="btn-logout">Đăng xuất</button>
                </div>
            `;

      // Xử lý sự kiện đăng xuất
      document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.reload(); // Tải lại trang sau khi đăng xuất
      });
    }
  } else {
    // Người dùng CHƯA đăng nhập
    console.log("Chưa có phiên đăng nhập.");
  }
});
