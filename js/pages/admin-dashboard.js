// =================================================================
// GameConnect — Admin Dashboard & Statistics Module
// Tích hợp API thống kê & Biểu đồ Chart.js
// =================================================================

const AdminDashboard = (() => {
  // ---- STATE ----
  let _selectedDays = 14;
  let _userGrowthChart = null;
  let _gameDistChart = null;
  let _isLoading = false;

  // Từ điển nhãn tiếng Việt
  const REASON_LABELS = {
    SPAM: "Spam / Rác",
    HARASSMENT: "Quấy rối",
    HATE_SPEECH: "Thù ghét",
    INAPPROPRIATE_CONTENT: "Nội dung phản cảm",
    SCAM: "Lừa đảo",
    OTHER: "Khác",
  };

  const TARGET_LABELS = {
    USER: "Người dùng",
    POST: "Bài viết",
    COMMENT: "Bình luận",
    TEAM_POST: "Bài tìm đội",
  };

  // ---- TIỆN ÍCH ----
  function _escape(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function _formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  function _timeAgo(dateStr) {
    if (!dateStr) return "—";
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return "Vừa xong";
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}p trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN");
  }

  // ---- GỌI API THỐNG KÊ ----
  async function _fetchStats() {
    _isLoading = true;
    _setLoadingState(true);

    try {
      const res = await api.get("/api/admin/dashboard/stats", { days: _selectedDays });
      const data = res.data || res;

      _renderSummaryCards(data.summary || {});
      _renderUserGrowthChart(data.user_growth || []);
      _renderGameDistChart(data.team_posts_by_game || []);
      _renderRecentPendingReports(data.recent_pending_reports || []);
      _renderRecentUsers(data.recent_users || []);
    } catch (err) {
      console.error("Lỗi tải thống kê Dashboard:", err);
      showToast(err.message || "Không thể tải dữ liệu thống kê.", "error");
    } finally {
      _isLoading = false;
      _setLoadingState(false);
    }
  }

  function _setLoadingState(loading) {
    const refreshBtn = document.getElementById("ad-btn-refresh");
    if (refreshBtn) {
      if (loading) {
        refreshBtn.classList.add("fa-spin");
      } else {
        refreshBtn.classList.remove("fa-spin");
      }
    }
  }

  // ---- RENDER SUMMARY METRIC CARDS ----
  function _renderSummaryCards(summary) {
    // 1. Số người dùng
    const elUsers = document.getElementById("val-users");
    const elUsersSub = document.getElementById("sub-users");
    if (elUsers) elUsers.textContent = Number(summary.total_users || 0).toLocaleString();
    if (elUsersSub) elUsersSub.innerHTML = `<strong>${summary.active_users || 0}</strong> hoạt động • <strong>${summary.locked_users || 0}</strong> bị khóa`;

    // 2. Số đội
    const elTeams = document.getElementById("val-teams");
    const elTeamsSub = document.getElementById("sub-teams");
    if (elTeams) elTeams.textContent = Number(summary.total_teams || 0).toLocaleString();
    if (elTeamsSub) elTeamsSub.textContent = `Đội tuyển & nhóm gaming`;

    // 3. Số bài đăng tìm đội
    const elTeamPosts = document.getElementById("val-team-posts");
    const elTeamPostsSub = document.getElementById("sub-team-posts");
    if (elTeamPosts) elTeamPosts.textContent = Number(summary.total_team_posts || 0).toLocaleString();
    if (elTeamPostsSub) elTeamPostsSub.innerHTML = `<strong>${summary.open_team_posts || 0}</strong> bài đang mở tuyển`;

    // 4. Số bài viết
    const elPosts = document.getElementById("val-posts");
    const elPostsSub = document.getElementById("sub-posts");
    if (elPosts) elPosts.textContent = Number(summary.total_posts || 0).toLocaleString();
    if (elPostsSub) elPostsSub.innerHTML = `<strong>${summary.visible_posts || 0}</strong> bài viết công khai`;

    // 5. Báo cáo chờ xử lý
    const elReports = document.getElementById("val-reports");
    const elReportsSub = document.getElementById("sub-reports");
    const pendingCount = summary.pending_reports || 0;
    if (elReports) elReports.textContent = Number(pendingCount).toLocaleString();
    if (elReportsSub) elReportsSub.innerHTML = `<strong>${summary.resolved_reports || 0}</strong> đã xử lý • <strong>${summary.rejected_reports || 0}</strong> bỏ qua`;

    // Alert Banner
    const alertBanner = document.getElementById("ad-alert-banner");
    const alertText = document.getElementById("ad-alert-text");
    if (alertBanner && alertText) {
      if (pendingCount > 0) {
        alertBanner.hidden = false;
        alertText.innerHTML = `Có <strong>${pendingCount}</strong> báo cáo vi phạm mới đang chờ bạn xem xét và xử lý!`;
      } else {
        alertBanner.hidden = true;
      }
    }
  }

  // ---- BIỂU ĐỒ 1: NGƯỜI DÙNG MỚI THEO NGÀY (CHART.JS LINE/AREA) ----
  function _renderUserGrowthChart(growthData) {
    const ctx = document.getElementById("user-growth-canvas");
    if (!ctx) return;

    const labels = growthData.map((d) => d.label || d.date);
    const dataPoints = growthData.map((d) => d.count || 0);

    if (_userGrowthChart) {
      _userGrowthChart.destroy();
    }

    const canvasContext = ctx.getContext("2d");
    const gradient = canvasContext.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(232, 80, 2, 0.45)");
    gradient.addColorStop(1, "rgba(232, 80, 2, 0.02)");

    _userGrowthChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Người dùng mới",
            data: dataPoints,
            borderColor: "#e85002",
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#e85002",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#161922",
            titleColor: "#f1f5f9",
            bodyColor: "#f1f5f9",
            borderColor: "#31374a",
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => `+${context.parsed.y} người dùng mới`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "#232734",
              drawBorder: false,
            },
            ticks: {
              color: "#94a3b8",
              font: { size: 11, family: "Inter" },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: "#94a3b8",
              font: { size: 11, family: "Inter" },
            },
            grid: {
              color: "#232734",
              drawBorder: false,
            },
          },
        },
      },
    });
  }

  // ---- BIỂU ĐỒ 2: BÀI ĐĂNG TÌM ĐỘI THEO GAME (CHART.JS DOUGHNUT) ----
  function _renderGameDistChart(gameDistData) {
    const ctx = document.getElementById("game-dist-canvas");
    if (!ctx) return;

    if (_gameDistChart) {
      _gameDistChart.destroy();
    }

    const labels = gameDistData.map((g) => g.game);
    const dataPoints = gameDistData.map((g) => g.count);

    const colors = [
      "#38bdf8", // Sky blue (Valorant / FPS)
      "#e85002", // Brand Orange (GameConnect)
      "#a855f7", // Purple
      "#22c55e", // Green
      "#f59e0b", // Amber
      "#ec4899", // Pink
    ];

    if (labels.length === 0) {
      labels.push("Chưa có bài đăng");
      dataPoints.push(1);
    }

    _gameDistChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: dataPoints,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: "#13161f",
            borderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#94a3b8",
              font: { size: 11.5, family: "Inter" },
              padding: 12,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            backgroundColor: "#161922",
            titleColor: "#f1f5f9",
            bodyColor: "#f1f5f9",
            borderColor: "#31374a",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.parsed} bài`,
            },
          },
        },
        cutout: "68%",
      },
    });
  }

  // ---- DANH SÁCH BÁO CÁO MỚI CHỜ XỬ LÝ ----
  function _renderRecentPendingReports(reports) {
    const tbody = document.getElementById("recent-reports-tbody");
    if (!tbody) return;

    if (reports.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="ad-empty-mini">
            <i class="fa-solid fa-circle-check" style="color: #22c55e; margin-right: 6px;"></i>
            Tuyệt vời! Không còn báo cáo nào đang chờ xử lý.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = reports.map((r) => {
      const targetLabel = TARGET_LABELS[r.target_type] || r.target_type;
      const targetClass = r.target_type ? r.target_type.toLowerCase().replace("_", "-") : "user";
      const reasonText = REASON_LABELS[r.reason] || r.reason;

      return `
        <tr>
          <td><span style="font-family: monospace; font-weight: 700; color: #94a3b8;">#${r.id}</span></td>
          <td>
            <span class="ad-tag ${targetClass}">${targetLabel} #${r.target_id}</span>
          </td>
          <td>
            <div style="font-weight: 600; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${_escape(reasonText)}
            </div>
          </td>
          <td><span style="color: #64748b; font-size: 11.5px;">${_timeAgo(r.created_at)}</span></td>
          <td style="text-align: right;">
            <a href="admin-reports.html" class="ad-btn-action-small" title="Chuyển sang trang xử lý">
              <i class="fa-solid fa-bolt"></i> Xử lý
            </a>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ---- DANH SÁCH NGƯỜI DÙNG MỚI THAM GIA ----
  function _renderRecentUsers(users) {
    const tbody = document.getElementById("recent-users-tbody");
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="ad-empty-mini">
            Chưa có người dùng nào.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map((u) => {
      const initial = u.username ? u.username.charAt(0).toUpperCase() : "?";
      const roleTag = u.role === "ADMIN" ? `<span class="ad-tag admin">ADMIN</span>` : `<span class="ad-tag user">USER</span>`;

      return `
        <tr>
          <td>
            <div class="ad-user-item">
              <div class="ad-user-avatar">${initial}</div>
              <div>
                <div style="font-weight: 600; color: #f1f5f9;">${_escape(u.username)}</div>
                <div style="font-size: 11px; color: #64748b;">${_escape(u.email)}</div>
              </div>
            </div>
          </td>
          <td>${roleTag}</td>
          <td>
            <span style="font-size: 11.5px; color: ${u.status === 'ACTIVE' ? '#22c55e' : '#ef4444'}; font-weight: 600;">
              <i class="fa-solid fa-circle" style="font-size: 7px; margin-right: 4px;"></i>${u.status}
            </span>
          </td>
          <td style="color: #64748b; font-size: 11.5px; text-align: right;">${_timeAgo(u.created_at)}</td>
        </tr>
      `;
    }).join("");
  }

  // ---- THỜI GIAN FILTER & EVENTS ----
  function setTimeframe(days) {
    _selectedDays = days;

    document.querySelectorAll(".ad-timeframe-btn").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.days) === days);
    });

    _fetchStats();
  }

  function refresh() {
    _fetchStats();
    showToast("Đã cập nhật dữ liệu thống kê mới nhất", "info");
  }

  // ---- INIT ----
  function init() {
    // 1. Kiểm tra đăng nhập & quyền ADMIN
    if (typeof requireAdminAccess === "function") {
      if (!requireAdminAccess()) return;
    } else {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.replace("login.html");
        return;
      }
    }

    // 2. Gắn sự kiện các nút chọn số ngày
    document.querySelectorAll(".ad-timeframe-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const days = Number(btn.dataset.days || 14);
        setTimeframe(days);
      });
    });

    // 3. Gắn nút refresh
    const refreshBtn = document.getElementById("ad-btn-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", refresh);
    }

    // 4. Tải dữ liệu lần đầu
    _fetchStats();
  }

  return {
    init,
    refresh,
    setTimeframe,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  AdminDashboard.init();
});
