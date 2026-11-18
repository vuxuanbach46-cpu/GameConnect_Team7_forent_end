document.addEventListener("DOMContentLoaded", () => {
  // --- 1. BẮT VÀ LƯU TOKEN TỪ GOOGLE OAUTH REDIRECT ---
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("access_token");
  const refreshToken = urlParams.get("refresh_token");

  if (accessToken) {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    // Xóa token trên URL query string cho giao diện sạch sẽ, bảo mật
    window.history.replaceState({}, document.title, window.location.pathname);

    // Đã đăng nhập -> Chuyển vào file home
    window.location.href = "pages/home.html";
    return;
  }

  // --- 2. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP ---
  const token = localStorage.getItem("access_token");

  // Khi đã đăng nhập -> Tự động chuyển vào file home
  if (token) {
    window.location.href = "pages/home.html";
    return;
  }

  // Người dùng CHƯA đăng nhập -> Ở lại trang index.html
});
