
document.addEventListener("DOMContentLoaded", () => {
  function getPostLoginDestination() {
    const next = new URLSearchParams(window.location.search).get("next");
    if (!next) return "home.html";
    const target = new URL(next, window.location.href);
    if (
      target.origin !== window.location.origin ||
      !["community.html", "community-detail.html"].includes(target.pathname.split("/").pop())
    ) {
      return "home.html";
    }
    return `${target.pathname}${target.search}${target.hash}`;
  }

  // --- 0. NẾU ĐÃ ĐĂNG NHẬP -> CHUYỂN HƯỚNG VÀO FILE HOME ---
  const existingToken = localStorage.getItem("access_token");
  if (existingToken) {
    window.location.href = getPostLoginDestination();
    return;
  }

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

  // --- 2. XỬ LÝ GỌI API ĐĂNG NHẬP ---
  const loginForm = document.getElementById("login-form");
  const alertBox = document.getElementById("alert-box");
  const submitBtn = document.getElementById("submit-btn");
  const togglePwdBtn = document.getElementById("toggle-pwd");
  const passwordInput = document.getElementById("password");
  const googleBtn = document.getElementById("google-login-btn");
  const rememberLogin = document.getElementById("remember-login");
  if (rememberLogin) rememberLogin.checked = localStorage.getItem("remember_login") === "true";

  // Ẩn/hiện mật khẩu
  if (togglePwdBtn && passwordInput) {
    togglePwdBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePwdBtn.innerHTML = isPassword
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
    });
  }

  function showAlert(message, type = "error") {
    if (!alertBox) return;
    alertBox.className = `alert-box ${type}`;
    alertBox.textContent = message;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (alertBox) alertBox.className = "alert-box hidden";

      const identifier = document.getElementById("username").value.trim();
      const password = passwordInput.value;

      if (!identifier || !password) {
        showAlert("Vui lòng điền đầy đủ thông tin đăng nhập!", "error");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Đang đăng nhập...";

      try {
        // Gửi thông tin đăng nhập (hỗ trợ cả username và email)
        const response = await api.post("/auth/login", {
          email: identifier,
          username: identifier,
          password: password,
        });

        showAlert("Đăng nhập thành công! Đang chuyển hướng...", "success");

        // Lấy token và vai trò từ phản hồi của API
        const responseData = response.data || response;
        const accessToken = responseData.access_token;
        const refreshToken = responseData.refresh_token;
        let role = responseData.role;
        const shouldRemember = Boolean(rememberLogin?.checked);
        localStorage.setItem("auth_provider", "password");

        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
          // Nếu role chưa có trong body, giải mã payload token để lấy role
          if (!role) {
            try {
              const payload = JSON.parse(atob(accessToken.split(".")[1]));
              if (payload.role) role = payload.role;
            } catch (err) {}
          }
        }

        if (shouldRemember && refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
          localStorage.setItem("remember_login", "true");
        } else {
          localStorage.removeItem("refresh_token");
          localStorage.setItem("remember_login", "false");
        }

        if (role) {
          localStorage.setItem("user_role", role);
        }

        // Chuyển hướng người dùng vào file home sau khi đăng nhập thành công
        setTimeout(() => {
          window.location.href = getPostLoginDestination();
        }, 800);
      } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        const backendMessage = error?.data?.detail;
        const message = typeof backendMessage === "string"
          ? backendMessage
          : (error?.message && !/^Lỗi\s+\d+$/i.test(error.message)
            ? error.message
            : (Number(error?.status) === 401
              ? "Không tìm thấy tài khoản hoặc mật khẩu không chính xác. Hãy kiểm tra lại email/tên đăng nhập và mật khẩu, hoặc đăng ký tài khoản mới."
              : "Đăng nhập chưa thành công. Vui lòng thử lại."));
        showAlert(message, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Đăng nhập";
      }
    });
  }

  // Nút Google OAuth Login
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      localStorage.setItem("remember_login", String(Boolean(rememberLogin?.checked)));
      localStorage.setItem("auth_provider", "google_pending");
      const baseUrl = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL
        : "http://127.0.0.1:8000";
      const loginUrl = new URL("/auth/google/login", baseUrl);
      loginUrl.searchParams.set("redirect_to", new URL(getPostLoginDestination(), window.location.href).href);
      window.location.href = loginUrl.href;
    });
  }
});
