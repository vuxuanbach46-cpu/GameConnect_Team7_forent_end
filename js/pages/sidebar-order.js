// Chuẩn hóa thứ tự và biểu tượng các mục điều hướng chính trên sidebar.
(() => {
  const entries = [
    { href: "quick-match.html", label: "Tìm đội nhanh", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' },
    { href: "quick-match.html?view=rooms", label: "Tìm phòng", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>' },
    { href: "quick-match.html?view=lobby", label: "Tạo phòng đội", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>' },
    { href: "community.html", label: "Bảng tin", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"></path><path d="M3 6h.01M3 12h.01M3 18h.01"></path></svg>' },
    { href: "friends.html", label: "Bạn bè & Kết nối", icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { href: "clubs.html", label: "Câu lạc bộ", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3"></circle><circle cx="6" cy="17" r="3"></circle><circle cx="18" cy="17" r="3"></circle><path d="m10.5 9.5-3 5m6-5 3 5m-7.5 4h6"></path></svg>' },
    { href: "teams.html", label: "Danh sách đội", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { href: "my-team.html", label: "Đội của tôi", icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>' },
  ];

  function normalizeSidebar(sidebar) {
    const group = sidebar.querySelector(".fc-bar-group");
    if (!group) return;
    const brand = group.querySelector(".fc-brand-link");
    let cursor = brand;
    if (brand?.nextElementSibling?.classList.contains("fc-nav-divider")) cursor = brand.nextElementSibling;
    if (!cursor) return;

    const links = entries.map((entry) => {
      const link = Array.from(sidebar.querySelectorAll("a.fc-nav-item")).find((candidate) => candidate.getAttribute("href") === entry.href);
      if (!link) return null;
      const icon = link.querySelector(".fc-nav-icon");
      const label = link.querySelector(".fc-nav-label");
      if (icon) {
        const badge = icon.querySelector(".fc-nav-badge");
        icon.innerHTML = `${entry.icon}${badge ? badge.outerHTML : ""}`;
      }
      if (label) label.textContent = entry.label;
      link.title = entry.label;
      return link;
    }).filter(Boolean);

    links.forEach((link) => {
      link.remove();
      cursor.after(link);
      cursor = link;
    });
  }

  const run = () => document.querySelectorAll("aside.fc-left-bar").forEach(normalizeSidebar);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
