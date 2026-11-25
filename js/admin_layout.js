
// Sidebar dùng chung cho các trang Admin

const ADMIN_MENU = [
    {
        label: "Tổng quan",
        href: "admin-dashboard.html",
        icon: "📊"
    },
    {
        label: "Quản lý người dùng",
        href: "admin_users.html",
        icon: "👥"
    },
    {
        label: "Báo cáo",
        href: "admin-reports.html",
        icon: "📋"
    }
];

function renderAdminLayout() {
    const token = localStorage.getItem("access_token");
    let role = localStorage.getItem("user_role") || "";
    if (token) {
        try {
            const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            if (p && p.role) role = p.role;
        } catch (e) {}
    }
    if (!token || String(role).toUpperCase() !== "ADMIN") {
        return;
    }
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
