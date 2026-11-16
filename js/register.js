document.addEventListener("DOMContentLoaded", () => {
  // --- 1. XỬ LÝ CHUYỂN ĐỔI LIGHT / DARK MODE ---
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");
  const htmlElement = document.documentElement;

  // Lấy theme đã lưu trong localStorage (mặc định là dark)
  const savedTheme = localStorage.getItem("gc_theme") || "dark";
  applyTheme(savedTheme);

  function applyTheme(theme) {
    if (theme === "light") {
      htmlElement.setAttribute("data-theme", "light");
      if (themeIcon) themeIcon.className = "fa-solid fa-moon";
      if (themeText) themeText.textContent = "Dark Mode";
    } else {
      htmlElement.removeAttribute("data-theme");
      if (themeIcon) themeIcon.className = "fa-solid fa-sun";
      if (themeText) themeText.textContent = "Light Mode";
    }
    localStorage.setItem("gc_theme", theme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = htmlElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(newTheme);
    });
  }

  // --- 2. XỬ LÝ FORM ĐĂNG KÝ VÀ KẾT NỐI API ---
  const registerForm = document.getElementById("register-form");
  const alertBox = document.getElementById("alert-box");
  const submitBtn = document.getElementById("submit-btn");
  const togglePwdBtn = document.getElementById("toggle-pwd");
  const passwordInput = document.getElementById("password");
  const googleBtn = document.getElementById("google-login-btn");

  // Tính năng ẩn / hiện mật khẩu
  if (togglePwdBtn && passwordInput) {
    togglePwdBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePwdBtn.innerHTML = isPassword
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
    });
  }

  // Hàm hiển thị thông báo lỗi / thành công trên UI
  function showAlert(message, type = "error") {
    if (!alertBox) return;
    alertBox.className = `alert-box ${type}`;
    alertBox.textContent = message;
  }

  // Sự kiện submit form đăng ký
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (alertBox) alertBox.className = "alert-box hidden";

      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = passwordInput.value;
      const confirmPassword = document.getElementById("confirm-password").value;

      // Validate sơ bộ ở frontend trước khi gọi API
      if (password.length < 6) {
        showAlert("Mật khẩu phải có ít nhất 6 ký tự!", "error");
        return;
      }

      if (password !== confirmPassword) {
        showAlert("Mật khẩu xác nhận không khớp!", "error");
        return;
      }

      // Khóa nút bấm, hiển thị trạng thái đang xử lý
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang xử lý...";

      try {
        const response = await api.post("/auth/register", {
          full_name: username,
          email: email,
          password: password,
        });

        showAlert(
          response.message || "Đăng ký thành công! Đang chuyển hướng...",
          "success",
        );
        registerForm.reset();

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1200);
      } catch (error) {
        console.error("Lỗi đăng ký:", error);
        showAlert(
          error.message || "Đăng ký thất bại, vui lòng kiểm tra lại thông tin.",
          "error",
        );
      } finally {
        // Mở khóa lại nút bấm
        submitBtn.disabled = false;
        submitBtn.textContent = "Đăng ký ngay";
      }
    });
  }

  // Xử lý nút đăng nhập Google OAuth (nếu có)
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      window.location.href = `${CONFIG.API_BASE_URL}/auth/google/login`;
    });
  }
});
