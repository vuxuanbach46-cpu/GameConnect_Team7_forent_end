const teamsList = document.getElementById("teams-list");
const teamsMessage = document.getElementById("teams-message");
const teamsCount = document.getElementById("teams-count");

const teamSearch = document.getElementById("team-search");
const gameFilter = document.getElementById("game-filter");
const gameSelect = document.getElementById("team-game");

const createSection = document.getElementById("create-team-section");
const createForm = document.getElementById("create-team-form");
const createMessage = document.getElementById("create-team-message");

const logoInput = document.getElementById("team-logo");
const logoPreview = document.getElementById("logo-preview");
const logoContainer = document.getElementById("logo-preview-container");

const previousButton = document.getElementById("previous-page");
const nextButton = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const submitButton = document.getElementById("submit-team");

let currentPage = 1;
let totalPages = 1;
const pageSize = 6;

let searchTimer = null;
let previewUrl = null;
let latestRequest = 0;
let games = [];

function getList(response, key) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.items)) {
        return response.data.items;
    }
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data?.[key])) {
        return response.data[key];
    }
    if (Array.isArray(response?.[key])) return response[key];
    return [];
}

function getResponseData(response) {
    return response?.data &&
        !Array.isArray(response.data)
        ? response.data
        : response;
}

function getGameName(team) {
    if (team.main_game?.name) return team.main_game.name;
    if (team.game?.name) return team.game.name;
    if (team.game_name) return team.game_name;

    const game = games.find(
        item => Number(item.id ?? item.game_id) ===
            Number(team.main_game_id)
    );

    return game?.name || `Game #${team.main_game_id ?? "?"}`;
}

function getMemberCount(team) {
    if (team.member_count != null) return team.member_count;
    if (team.members_count != null) return team.members_count;
    if (Array.isArray(team.members)) return team.members.length;
    return null;
}

function renderTeams(teams) {
    teamsList.replaceChildren();

    if (teams.length === 0) {
        teamsMessage.className = "status status-loading";
        teamsMessage.textContent = "Không tìm thấy đội phù hợp.";
        return;
    }

    teamsMessage.className = "";
    teamsMessage.textContent = "";

    teams.forEach(team => {
        const card = document.createElement("article");
        card.className = "card team-card";

        const header = document.createElement("div");
        header.className = "team-card-header";

        const logo = document.createElement("img");
        logo.className = "team-card-logo";
        logo.alt = `Logo đội ${team.name || ""}`;
        logo.src = team.logo_url || team.logo ||
            "../assets/images/logo.svg";

        logo.onerror = () => {
            logo.onerror = null;
            logo.src = "../assets/images/logo.svg";
        };

        const info = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = team.name || "Chưa có tên";

        const game = document.createElement("p");
        game.className = "team-card-game";
        game.textContent = getGameName(team);

        info.append(name, game);
        header.append(logo, info);

        const description = document.createElement("p");
        description.className = "team-card-description";
        description.textContent =
            team.description || "Chưa có mô tả đội.";

        const footer = document.createElement("div");
        footer.className = "team-card-footer";

        const members = document.createElement("span");
        const count = getMemberCount(team);

        members.textContent = count == null
            ? `Thành viên: --/${team.max_members ?? "?"}`
            : `Thành viên: ${count}/${team.max_members ?? "?"}`;

        const mode = document.createElement("span");
        mode.className = "team-join-mode";
        mode.textContent =
            team.join_mode === "APPROVAL_REQUIRED"
                ? "Cần duyệt"
                : "Công khai";

        footer.append(members, mode);
        card.append(header, description, footer);
        teamsList.appendChild(card);
    });
}

async function loadTeams() {
    const requestId = ++latestRequest;

    teamsMessage.className = "status status-loading";
    teamsMessage.textContent = "Đang tải danh sách đội...";
    teamsList.replaceChildren();

    const params = {
        page: currentPage,
        page_size: pageSize
    };

    const keyword = teamSearch.value.trim();

    if (keyword) params.name = keyword;
    if (gameFilter.value) {
        params.game_id = Number(gameFilter.value);
    }

    try {
        const response = await api.get("/teams", params);

        if (requestId !== latestRequest) return;

        const teams = getList(response, "teams");
        const data = getResponseData(response);

        const total = Number(data?.total);
        const pages = Number(data?.total_pages);

        if (Number.isFinite(pages) && pages > 0) {
            totalPages = pages;
        } else if (data?.total != null &&
            Number.isFinite(total)) {
            totalPages = Math.max(1, Math.ceil(total / pageSize));
        } else {
            totalPages = teams.length < pageSize
                ? currentPage
                : currentPage + 1;
        }

        renderTeams(teams);

        teamsCount.textContent =
            data?.total != null
                ? `${data.total} đội`
                : `${teams.length} đội trên trang`;

        pageInfo.textContent = `Trang ${currentPage}/${totalPages}`;
        previousButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;

    } catch (error) {
        if (requestId !== latestRequest) return;

        teamsList.replaceChildren();
        teamsCount.textContent = "";
        teamsMessage.className = "status status-error";
        teamsMessage.textContent = error.message;

        previousButton.disabled = true;
        nextButton.disabled = true;
    }
}

async function loadGames() {
    try {
        const response = await api.get("/games");
        games = getList(response, "games");

        gameFilter.length = 1;
        gameSelect.length = 1;

        games.forEach(game => {
            const id = game.id ?? game.game_id;
            const name = game.name ?? game.title;

            if (id == null || !name) return;

            gameFilter.add(new Option(name, id));
            gameSelect.add(new Option(name, id));
        });

        // Cập nhật tên game trên các card sau khi tải game.
        await loadTeams();

    } catch (error) {
        console.error("Không tải được danh sách game:", error);
        showToast(
            "Chưa tải được danh sách game từ backend.",
            "error"
        );
    }
}

// Tìm kiếm đội
teamSearch.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        currentPage = 1;
        loadTeams();
    }, 350);
});

// Lọc theo game
gameFilter.addEventListener("change", () => {
    currentPage = 1;
    loadTeams();
});

// Xóa bộ lọc
document.getElementById("reset-filter")
    .addEventListener("click", () => {
        clearTimeout(searchTimer);
        teamSearch.value = "";
        gameFilter.value = "";
        currentPage = 1;
        loadTeams();
    });

// Phân trang
previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        loadTeams();
    }
});

nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadTeams();
    }
});

// Mở form tạo đội
document.getElementById("open-create-form")
    .addEventListener("click", () => {
        createSection.hidden = false;
        createSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

// Đóng form
document.getElementById("close-create-form")
    .addEventListener("click", () => {
        createSection.hidden = true;
    });

// Xóa ảnh xem trước
function clearLogoPreview() {
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    logoPreview.removeAttribute("src");
    logoContainer.hidden = true;
}

// Chọn và xem trước logo
logoInput.addEventListener("change", () => {
    clearLogoPreview();
    createMessage.textContent = "";

    const file = logoInput.files[0];
    if (!file) return;

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        showToast("Chỉ chấp nhận ảnh JPG, PNG, WEBP.", "error");
        logoInput.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast("Logo không được vượt quá 2MB.", "error");
        logoInput.value = "";
        return;
    }

    previewUrl = URL.createObjectURL(file);
    logoPreview.src = previewUrl;
    logoContainer.hidden = false;
});

createForm.addEventListener("reset", () => {
    setTimeout(() => {
        clearLogoPreview();
        createMessage.textContent = "";
    }, 0);
});

// Tạo đội
createForm.addEventListener("submit", async event => {
    event.preventDefault();

    const file = logoInput.files[0];

    if (file) {
        showToast(
            "Backend chưa có API upload logo được xác nhận.",
            "error"
        );
        return;
    }

    const data = {
        name: document.getElementById("team-name").value.trim(),
        main_game_id: Number(gameSelect.value),
        description:
            document.getElementById("team-description").value.trim(),
        max_members: Number(
            document.getElementById("team-max-members").value
        ),
        join_mode:
            document.getElementById("team-join-mode").value
    };

    if (!data.name || !data.main_game_id) {
        showToast("Vui lòng nhập tên đội và chọn game.", "error");
        return;
    }

    submitButton.disabled = true;
    createMessage.textContent = "Đang tạo đội...";

    try {
        // Backend yêu cầu token đăng nhập khi tạo đội.
        // Chỉ gửi request khi đã có token.
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "Bạn cần đăng nhập trước khi tạo đội."
            );
        }

        // Sử dụng axios instance http có sẵn của nhóm,
        // thêm Authorization riêng cho request tạo đội.
        await http.post("/teams", data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        showToast("Tạo đội thành công!");

        createForm.reset();
        createMessage.textContent = "";
        createSection.hidden = true;

        currentPage = 1;
        await loadTeams();

    } catch (error) {
        const message = error.message || "Không thể tạo đội.";

        createMessage.className = "status status-error";
        createMessage.textContent = message;
        showToast(message, "error");

    } finally {
        submitButton.disabled = false;
    }
});

// Tải dữ liệu khi mở trang
loadTeams();
loadGames();
