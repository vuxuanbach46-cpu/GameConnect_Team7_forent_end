// Thanh điều hướng thống nhất cho các trang đội và trang quản trị dùng chung.
(() => {
  const SIDEBAR = `
    <aside class="fc-left-bar gc-unified-nav" aria-label="Thanh điều hướng chính">
      <div class="fc-bar-group">
        <a href="home.html" class="fc-brand-link" title="GameConnect - Sảnh chính">
          <div class="fc-brand-logo"><i class="fa-solid fa-gamepad"></i></div>
          <div class="fc-brand-text"><span class="fc-brand-title">GameConnect</span><span class="fc-brand-sub">GAMING HUB</span></div>
        </a>
        <div class="fc-nav-divider"></div>
        <a href="quick-match.html" class="fc-nav-item" title="Tìm đội nhanh"><span class="fc-nav-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span><span class="fc-nav-label">Tìm đội nhanh</span></a>
        <a href="quick-match.html?view=rooms" class="fc-nav-item" title="Tìm phòng"><span class="fc-nav-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg></span><span class="fc-nav-label">Tìm phòng</span></a>
        <a href="quick-match.html?view=lobby" class="fc-nav-item" title="Tạo phòng đội"><span class="fc-nav-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg></span><span class="fc-nav-label">Tạo phòng đội</span></a>
        <a href="community.html" class="fc-nav-item" title="Bảng tin cộng đồng"><span class="fc-nav-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13"></path><path d="M3 6h.01M3 12h.01M3 18h.01"></path></svg></span><span class="fc-nav-label">Bảng tin</span></a>
        <a href="friends.html" class="fc-nav-item" title="Bạn bè &amp; Kết nối"><span class="fc-nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span class="fc-nav-badge" id="sidebar-req-badge" style="display:none">0</span></span><span class="fc-nav-label">Bạn bè &amp; Kết nối</span></a>
        <a href="clubs.html" class="fc-nav-item" title="Câu lạc bộ"><span class="fc-nav-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3"></circle><circle cx="6" cy="17" r="3"></circle><circle cx="18" cy="17" r="3"></circle><path d="m10.5 9.5-3 5m6-5 3 5m-7.5 4h6"></path></svg></span><span class="fc-nav-label">Câu lạc bộ</span></a>
        <a href="teams.html" class="fc-nav-item" title="Danh sách đội"><span class="fc-nav-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span><span class="fc-nav-label">Danh sách đội</span></a>
        <a href="my-team.html" class="fc-nav-item" title="Đội của tôi"><span class="fc-nav-icon"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg></span><span class="fc-nav-label">Đội của tôi</span></a>
        <a href="admin-dashboard.html" class="fc-nav-item admin-nav-item" style="display:none" title="Dashboard Thống kê"><span class="fc-nav-icon"><i class="fa-solid fa-chart-line"></i></span><span class="fc-nav-label">Dashboard Thống Kê</span></a>
        <a href="admin-reports.html" class="fc-nav-item admin-nav-item" style="display:none" title="Quản lý Báo cáo"><span class="fc-nav-icon"><i class="fa-solid fa-shield-halved"></i></span><span class="fc-nav-label">Quản lý Báo cáo</span></a>
      </div>
      <div class="fc-bar-group"><a href="#" class="fc-nav-item" title="Cửa hàng vật phẩm"><span class="fc-nav-icon"><i class="fa-solid fa-bag-shopping"></i></span><span class="fc-nav-label">Cửa hàng vật phẩm</span></a></div>
    </aside>`;

  const old = document.querySelector(".gc-team-nav");
  if (!old) return;
  const template = document.createElement("template");
  template.innerHTML = SIDEBAR.trim();
  const sidebar = template.content.firstElementChild;
  const current = location.pathname.split("/").pop();
  const selected = current === "team-detail.html" ? "teams.html" : ["team-feed.html", "team-invitations.html"].includes(current) ? "my-team.html" : current;
  const active = sidebar.querySelector(`a[href="${selected}"]`);
  if (active) {
    active.classList.add("active");
    active.setAttribute("aria-current", "page");
  }

  let role = localStorage.getItem("user_role") || "";
  try {
    const token = localStorage.getItem("access_token");
    if (token) role = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role || role;
  } catch (_) {}
  if (localStorage.getItem("access_token") && String(role).toUpperCase() === "ADMIN") {
    sidebar.querySelectorAll(".admin-nav-item").forEach((item) => { item.style.display = ""; });
  }
  old.replaceWith(sidebar);
})();
