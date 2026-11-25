// Layout chung: tự chèn header (menu) và footer vào mọi trang,
// để không phải copy lại HTML menu ở từng file.
//
// Mỗi trang cần có:  <body data-root="./">   (trang ở thư mục gốc)
//              hoặc  <body data-root="../">  (trang trong thư mục pages/)
// và hai thẻ rỗng:   <header id="app-header"></header> ... <footer id="app-footer"></footer>

// Thêm trang mới vào menu: thêm 1 dòng vào mảng này (đường dẫn tính từ thư mục frontend/)
const MENU = [
  { href: "index.html", label: "Trang chủ" },
  { href: "pages/community.html", label: "Bảng tin Cộng đồng" },
  { href: "pages/friends.html", label: "Bạn bè & Kết nối" },
  { href: "pages/profile.html", label: "Hồ sơ" },
  { href: "pages/items.html", label: "Items (CRUD mẫu)" },
  { href: "pages/team-posts.html", label: "🎮 Tìm đồng đội" },
  { href: "pages/admin-dashboard.html", label: "📊 Dashboard Thống kê", adminOnly: true },
  { href: "pages/admin-reports.html", label: "🛡️ Quản lý Báo cáo", adminOnly: true },
  { href: "pages/my-team.html", label: "🎮 Đội của tôi" },
];

function checkIsAdmin() {
  const token = localStorage.getItem("access_token");
  if (!token) return false;
  try {
    const base64Url = token.split(".")[1];
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload && payload.role) {
        return String(payload.role).toUpperCase() === "ADMIN";
      }
    }
  } catch (e) {}
  return String(localStorage.getItem("user_role") || "").toUpperCase() === "ADMIN";
}

function renderLayout() {
  const root = document.body.dataset.root || "./";
  const currentPath = window.location.pathname;
  const isAdmin = checkIsAdmin();

  const visibleMenu = MENU.filter((item) => !item.adminOnly || isAdmin);

  const links = visibleMenu.map((item) => {
    const isActive = currentPath.endsWith("/" + item.href) ||
      (item.href === "index.html" && currentPath.endsWith("/"));
    return `<a href="${root}${item.href}" class="${isActive ? "active" : ""}">${item.label}</a>`;
  }).join("");

  document.getElementById("app-header").innerHTML = `
    <div class="container header-inner">
      <a href="${root}index.html" class="brand">
        <img src="${root}assets/images/logo.svg" alt="logo" width="28" height="28">
        <span>${CONFIG.APP_NAME}</span>
      </a>
      <nav class="nav">${links}</nav>
    </div>`;

  document.getElementById("app-footer").innerHTML = `
    <div class="container">© ${new Date().getFullYear()} HN-KS25-CNTT1 · Base code thực tập doanh nghiệp</div>`;
}

renderLayout();
