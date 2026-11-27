// Các hàm tiện ích dùng chung cho nhiều trang.

// Chống XSS: luôn dùng hàm này khi chèn dữ liệu người dùng nhập vào innerHTML
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

// 45000 -> "45.000 ₫"
function formatMoney(value) {
  return Number(value).toLocaleString("vi-VN") + " ₫";
}

// "2026-11-04T09:30:00" -> "09:30 4/11/2026"
function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " +
    d.toLocaleDateString("vi-VN");
}

// Hiện thông báo nhỏ ở góc màn hình. type: "success" | "error"
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Lấy role hiện tại của người dùng từ JWT hoặc localStorage
function getCurrentUserRole() {
  const savedRole = String(localStorage.getItem("user_role") || "").toUpperCase();
  if (savedRole === "ADMIN") return "ADMIN";

  const token = localStorage.getItem("access_token");
  if (!token) return "";

  try {
    const base64Url = token.split(".")[1];
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload && payload.role) {
        return String(payload.role).toUpperCase();
      }
    }
  } catch (e) {
    // Bỏ qua lỗi giải mã token, fallback sang localStorage
  }

  return savedRole;
}

// Kiểm tra tài khoản hiện tại có phải ADMIN không
function isCurrentUserAdmin() {
  return Boolean(localStorage.getItem("access_token")) && getCurrentUserRole() === "ADMIN";
}

// Chặn truy cập vào trang Admin nếu chưa đăng nhập hoặc không phải ADMIN
function requireAdminAccess() {
  const inPagesDir = window.location.pathname.includes("/pages/");
  const loginUrl = inPagesDir ? "login.html" : "pages/login.html";
  const homeUrl = inPagesDir ? "home.html" : "pages/home.html";

  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.replace(loginUrl);
    return false;
  }

  if (!isCurrentUserAdmin()) {
    window.location.replace(homeUrl);
    return false;
  }

  return true;
}

// Tự động hiển thị hoặc ẩn các mục menu Admin trên mọi trang
document.addEventListener("DOMContentLoaded", () => {
  const adminItems = document.querySelectorAll(".admin-nav-item");
  if (!adminItems.length) return;
  if (isCurrentUserAdmin()) {
    adminItems.forEach((el) => {
      el.style.display = "";
    });
  } else {
    adminItems.forEach((el) => {
      el.style.display = "none";
    });
  }
});
