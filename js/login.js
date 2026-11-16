document.addEventListener("DOMContentLoaded", () => {
  // --- 1. XỬ LÝ LIGHT / DARK MODE (Đồng bộ qua localStorage) ---
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");
  const htmlElement = document.documentElement;

  const savedTheme = localStorage.getItem("gc_theme") || "dark";
  applyTheme(savedTheme);

  function applyTheme(theme) {
    if (theme === "light") {
      htmlElement.setAttribute("data-theme", "light");
      themeIcon.className = "fa-solid fa-moon";
      themeText.textContent = "Dark Mode";
    } else {
      htmlElement.removeAttribute("data-theme");
      themeIcon.className = "fa-solid fa-sun";
      themeText.textContent = "Light Mode";
    }
    localStorage.setItem("gc_theme", theme);
  }

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
  });

  // --- 2. XỬ LÝ GỌI API ĐĂNG NHẬP (FastAPI OAuth2 / Token) ---
  const loginForm = document.getElementById("login-form");
  const alertBox = document.getElementById("alert-box");
  const submitBtn = document.getElementById("submit-btn");
  const togglePwdBtn = document.getElementById("toggle-pwd");
  const passwordInput = document.getElementById("password");
  const googleBtn = document.getElementById("google-login-btn");

  // Ẩn/hiện mật khẩu
  togglePwdBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePwdBtn.innerHTML = isPassword
      ? '<i class="fa-regular fa-eye-slash"></i>'
      : '<i class="fa-regular fa-eye"></i>';
  });

  function showAlert(message, type = "error") {
    alertBox.className = `alert-box ${type}`;
    alertBox.textContent = message;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.className = "alert-box hidden";

    const username = document.getElementById("username").value.trim();
    const password = passwordInput.value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang đăng nhập...";

    // ⚠️ Lưu ý: Nếu FastAPI của bạn dùng OAuth2PasswordRequestForm thì thường nhận định dạng x-www-form-urlencoded
    // Hoặc nếu bạn dùng JSON body, hãy giữ nguyên định dạng fetch bên dưới.
    const API_LOGIN_URL = "http://127.0.0.1:8000/api/v1/auth/login";

    try {
      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username, // hoặc email tùy backend của bạn hỗ trợ trường nào
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert("Đăng nhập thành công! Đang chuyển hướng...", "success");

        // Lưu token và thông tin phân quyền vào localStorage như đã trao đổi
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }
        if (data.role) {
          localStorage.setItem("user_role", data.role); // 'ADMIN' hoặc 'USER'
        }

        setTimeout(() => {
          // Nếu là Admin chuyển sang trang quản trị, ngược lại về trang danh sách bạn bè/trang chủ
          if (data.role === "ADMIN") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "friends.html";
          }
        }, 1000);
      } else {
        const errorMsg =
          data.detail || "Tên đăng nhập hoặc mật khẩu không chính xác.";
        showAlert(errorMsg, "error");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      showAlert("Không thể kết nối tới máy chủ Backend!", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Đăng nhập";
    }
  });

  // Nút Google OAuth Login
  googleBtn.addEventListener("click", () => {
    window.location.href = "http://127.0.0.1:8000/api/v1/auth/google/login";
  });
});
