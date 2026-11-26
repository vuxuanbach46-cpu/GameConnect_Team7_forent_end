document.addEventListener("DOMContentLoaded", () => {
  // --- 0. NẾU ĐÃ ĐĂNG NHẬP -> CHUYỂN HƯỚNG VÀO FILE HOME ---
  const existingToken = localStorage.getItem("access_token");
  if (existingToken) {
    window.location.href = "home.html";
    return;
  }

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
      if (username.length < 2) {
        showAlert("Tên người dùng phải có ít nhất 2 ký tự!", "error");
        return;
      }

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
          username: username,
          email: email,
          password: password,
        });

        showAlert(
          "Đăng ký thành công! Đang chuyển hướng vào trang chủ...",
          "success",
        );

        // Lấy token từ phản hồi đăng ký hoặc tự động đăng nhập để lấy token
        const resData = response.data || response;
        let accessToken = resData.access_token;
        let role = resData.role;

        // Fallback: nếu API register chưa cấp token, tự động đăng nhập ngay lập tức
        if (!accessToken) {
          try {
            const loginRes = await api.post("/auth/login", {
              email: email,
              username: username,
              password: password,
            });
            const loginData = loginRes.data || loginRes;
            accessToken = loginData.access_token;
            role = loginData.role;
          } catch (loginErr) {
            console.warn("Tự động đăng nhập sau đăng ký không thành công:", loginErr);
          }
        }

        // Lưu thông tin đăng nhập vào localStorage
        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
        }
        localStorage.removeItem("refresh_token");
        localStorage.setItem("remember_login", "false");
        localStorage.setItem("auth_provider", "password");
        if (role) {
          localStorage.setItem("user_role", role);
        }

        registerForm.reset();

        // Chuyển hướng thẳng vào trang home.html
        setTimeout(() => {
          window.location.href = "home.html";
        }, 800);
      } catch (error) {
        console.error("Lỗi đăng ký:", error);
        const backendMessage = error?.data?.error ?? error?.data?.detail;
        const message = typeof backendMessage === "string" && backendMessage.trim()
          ? backendMessage
          : (error?.message && !/^Lỗi\s+\d+$/i.test(error.message)
            ? error.message
            : (Number(error?.status) === 409
              ? "Email hoặc tên người dùng đã được sử dụng. Hãy thử thông tin khác."
              : "Đăng ký thất bại, vui lòng kiểm tra lại thông tin."));
        showAlert(message, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Đăng ký ngay";
      }
    });
  }

  // Xử lý nút đăng nhập Google OAuth
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      const baseUrl = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL
        : "http://127.0.0.1:8000";
      const loginUrl = new URL("/auth/google/login", baseUrl);
      loginUrl.searchParams.set("redirect_to", new URL("home.html", window.location.href).href);
      window.location.href = loginUrl.href;
    });
  }
});
