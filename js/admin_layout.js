
// Sidebar dùng chung cho các trang Admin

const ADMIN_MENU = [
    {
        label: "Tổng quan",
        href: "admin_dashboard.html",
        icon: "📊"
    },
    {
        label: "Quản lý người dùng",
        href: "admin_users.html",
        icon: "👥"
    },
    {
        label: "Báo cáo",
        href: "admin_reports.html",
        icon: "📋"
    }
];

function renderAdminLayout() {
    const sidebar = document.getElementById("admin-sidebar");

    if (!sidebar) return;

    const currentPage = window.location.pathname.split("/").pop();

    const brand = document.createElement("div");
    brand.className = "admin-brand";
    brand.textContent = "GameConnect Admin";

    const nav = document.createElement("nav");
    nav.className = "admin-nav";

    ADMIN_MENU.forEach((item) => {
        const link = document.createElement("a");
        link.href = item.href;
        link.textContent = `${item.icon} ${item.label}`;

        const isUserPage =
            item.href === "admin_users.html" &&
            (currentPage === "admin_users.html" ||
                currentPage === "admin_user-detail.html");

        if (currentPage === item.href || isUserPage) {
            link.classList.add("active");
        }

        nav.appendChild(link);
    });

    const backLink = document.createElement("a");
    backLink.href = "../index.html";
    backLink.textContent = "← Về trang chủ";
    backLink.style.marginTop = "24px";

    nav.appendChild(backLink);
    sidebar.append(brand, nav);
}

renderAdminLayout();
