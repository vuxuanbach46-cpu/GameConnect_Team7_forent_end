document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get("id") || "1";
    const storageKey = "gc_team_detail_" + teamId;

    const defaultTeam = {
        id: teamId,
        name: "GameConnect Warriors",
        game: "Liên Minh Huyền Thoại",
        description: "Đội tuyển giao lưu, leo rank và tìm đồng đội chơi cùng mỗi tối.",
        logo: "",
        max_members: 5,
        captain_id: 1,
        members: [
            { id: 1, name: "Nguyễn Văn An" },
            { id: 2, name: "Trần Minh Đức" },
            { id: 3, name: "Lê Hoàng Nam" }
        ],
        requests: [
            { id: 4, name: "Phạm Gia Huy" },
            { id: 5, name: "Đỗ Minh Quân" }
        ]
    };

    function loadTeam() {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey));
            if (saved && Array.isArray(saved.members) && Array.isArray(saved.requests)) {
                return saved;
            }
        } catch (error) {
            console.error("Không đọc được dữ liệu đội:", error);
        }
        return structuredClone(defaultTeam);
    }

    let team = loadTeam();

    // Chế độ demo: đổi ID để thử vai trò đội trưởng, thành viên, người ngoài.
    const currentUser = {
        id: 1,
        name: "Nguyễn Văn An"
    };

    function saveTeam() {
        localStorage.setItem(storageKey, JSON.stringify(team));
    }

    function isCaptain() {
        return team.captain_id === currentUser.id;
    }

    function isMember() {
        return team.members.some(member => member.id === currentUser.id);
    }

    function hasPendingRequest() {
        return team.requests.some(request => request.id === currentUser.id);
    }

    function createButton(text, className, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = text;
        button.addEventListener("click", onClick);
        return button;
    }

    function showMessage(message) {
        document.getElementById("team-message").textContent = message;
    }

    function renderInfo() {
        document.getElementById("team-name").textContent = team.name;
        document.getElementById("team-game").textContent = team.game;
        document.getElementById("team-description").textContent = team.description;
        document.getElementById("team-count").textContent =
            team.members.length + "/" + team.max_members + " thành viên";

        const logo = document.getElementById("team-logo");
        logo.replaceChildren();

        if (team.logo) {
            const img = document.createElement("img");
            img.src = team.logo;
            img.alt = "Logo đội " + team.name;
            logo.appendChild(img);
        } else {
            logo.textContent = team.name.slice(0, 2).toUpperCase();
        }

        const joinButton = document.getElementById("btn-join");
        const leaveButton = document.getElementById("btn-leave");
        const joinStatus = document.getElementById("join-status");

        joinButton.hidden = true;
        leaveButton.hidden = true;
        joinStatus.textContent = "";

        if (isCaptain()) {
            joinStatus.textContent = "Bạn là đội trưởng";
        } else if (isMember()) {
            leaveButton.hidden = false;
        } else if (hasPendingRequest()) {
            joinStatus.textContent = "Đang chờ đội trưởng duyệt";
        } else if (team.members.length >= team.max_members) {
            joinStatus.textContent = "Đội đã đủ thành viên";
        } else {
            joinButton.hidden = false;
        }
    }

    function renderMembers() {
        const list = document.getElementById("member-list");
        list.replaceChildren();

        if (team.members.length === 0) {
            list.textContent = "Chưa có thành viên.";
            return;
        }

        team.members.forEach(member => {
            const row = document.createElement("div");
            row.className = "team-member";

            const info = document.createElement("div");
            info.className = "member-info";

            const avatar = document.createElement("div");
            avatar.className = "member-avatar";
            avatar.textContent = member.name.charAt(0);

            const details = document.createElement("div");
            const name = document.createElement("div");
            name.className = "member-name";
            name.textContent = member.name;

            const role = document.createElement("div");
            role.className = "member-role";
            role.textContent =
                member.id === team.captain_id ? "Đội trưởng" : "Thành viên";

            details.append(name, role);
            info.append(avatar, details);
            row.appendChild(info);

            if (isCaptain() && member.id !== currentUser.id) {
                const actions = document.createElement("div");
                actions.className = "member-actions";

                actions.appendChild(
                    createButton("Xóa khỏi đội", "btn", function () {
                        if (!confirm("Bạn muốn xóa " + member.name + " khỏi đội?")) return;

                        team.members = team.members.filter(item => item.id !== member.id);
                        saveTeam();
                        render();
                        showMessage("Đã xóa thành viên khỏi đội.");
                    })
                );

                actions.appendChild(
                    createButton("Chuyển quyền", "btn btn-primary", function () {
                        if (!confirm("Chuyển quyền đội trưởng cho " + member.name + "?")) return;

                        team.captain_id = member.id;
                        saveTeam();
                        render();
                        showMessage("Đã chuyển quyền đội trưởng thành công.");
                    })
                );

                row.appendChild(actions);
            }

            list.appendChild(row);
        });
    }

    function renderRequests() {
        const panel = document.getElementById("captain-panel");
        const list = document.getElementById("request-list");

        panel.hidden = !isCaptain();
        list.replaceChildren();

        if (!isCaptain()) return;

        if (team.requests.length === 0) {
            list.textContent = "Không có yêu cầu chờ duyệt.";
            return;
        }

        team.requests.forEach(request => {
            const row = document.createElement("div");
            row.className = "team-request";

            const name = document.createElement("strong");
            name.textContent = request.name;

            const actions = document.createElement("div");
            actions.className = "request-actions";

            actions.appendChild(
                createButton("Chấp nhận", "btn btn-primary", function () {
                    if (team.members.length >= team.max_members) {
                        showMessage("Đội đã đủ thành viên.");
                        return;
                    }

                    if (!team.members.some(member => member.id === request.id)) {
                        team.members.push({
                            id: request.id,
                            name: request.name
                        });
                    }

                    team.requests = team.requests.filter(item => item.id !== request.id);
                    saveTeam();
                    render();
                    showMessage("Đã chấp nhận yêu cầu tham gia.");
                })
            );

            actions.appendChild(
                createButton("Từ chối", "btn", function () {
                    team.requests = team.requests.filter(item => item.id !== request.id);
                    saveTeam();
                    render();
                    showMessage("Đã từ chối yêu cầu tham gia.");
                })
            );

            row.append(name, actions);
            list.appendChild(row);
        });
    }

    function render() {
        renderInfo();
        renderMembers();
        renderRequests();
    }

    document.getElementById("btn-join").addEventListener("click", function () {
        if (isMember() || hasPendingRequest()) return;

        if (team.members.length >= team.max_members) {
            showMessage("Đội đã đủ thành viên.");
            return;
        }

        team.requests.push({
            id: currentUser.id,
            name: currentUser.name
        });

        saveTeam();
        render();
        showMessage("Đã gửi yêu cầu tham gia đội.");
    });

    document.getElementById("btn-leave").addEventListener("click", function () {
        if (isCaptain()) {
            showMessage("Đội trưởng cần chuyển quyền trước khi rời đội.");
            return;
        }

        if (!isMember()) return;
        if (!confirm("Bạn có chắc muốn rời đội?")) return;

        team.members = team.members.filter(member => member.id !== currentUser.id);
        saveTeam();
        render();
        showMessage("Bạn đã rời đội.");
    });

    render();
});

// Điều hướng chung cho các trang đội và quản trị.
(() => {
  const current = location.pathname.split('/').pop();
  const links = [
    ['home.html', '⌂', 'Trang chủ'],
    ['community.html', '▤', 'Cộng đồng'],
    ['friends.html', '♙', 'Bạn bè'],
    ['team-posts.html', '⌕', 'Tìm đồng đội'],
    ['teams.html', '◈', 'Danh sách đội'],
    ['my-team.html', '♜', 'Đội của tôi'],
    ['admin_users.html', '⚙', 'Quản lý người dùng']
  ];
  const active = current === 'team-detail.html' ? 'teams.html' : current === 'team-feed.html' ? 'my-team.html' : current === 'admin_user-detail.html' ? 'admin_users.html' : current;
  const shell = document.createElement('aside');
  shell.className = 'gc-team-nav';
  shell.setAttribute('aria-label', 'Điều hướng chính');
  shell.innerHTML = `<a class="gc-team-brand" href="home.html"><span class="gc-team-brand-icon">✣</span><span><strong>GameConnect</strong><small>GAMING HUB</small></span></a><span class="gc-team-nav-heading">KHÁM PHÁ</span><nav>${links.map(([href, icon, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}" ${href === active ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</a>`).join('')}</nav><a class="gc-team-nav-bottom" href="../index.html">GameConnect <span>GAMING HUB</span></a>`;
  document.body.prepend(shell);
})();
