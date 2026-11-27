/* ==========================================================================
   GameConnect — Quản lý Tài khoản Người dùng (Admin Panel)
   Chỉ cho phép tài khoản có role === "ADMIN" truy cập.
   APIs sử dụng:
   - GET   /api/admin/users                  : Danh sách phân trang, tìm kiếm, lọc trạng thái
   - PATCH /api/admin/users/{user_id}/lock   : Khóa tài khoản kèm lý do & thời hạn (1/7/30 ngày hoặc vĩnh viễn)
   - PATCH /api/admin/users/{user_id}/unlock : Mở khóa tài khoản
   ========================================================================== */

(() => {
  // 1. Bảo vệ trang: Chỉ cho phép ADMIN
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.replace("login.html?next=admin_users.html");
    return;
  }

  let currentAdminId = null;
  let jwtRole = localStorage.getItem("user_role") || "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload?.role) jwtRole = payload.role;
    if (payload?.sub) currentAdminId = Number(payload.sub);
  } catch (_) {}

  if (String(jwtRole).toUpperCase() !== "ADMIN") {
    window.location.replace("home.html");
    return;
  }

  // Hiển thị các mục điều hướng Admin trên thanh Taskbar bên trái
  document.querySelectorAll(".admin-nav-item").forEach((el) => {
    el.style.display = "";
  });

  // 2. DOM Elements & State
  const usersTableBody = document.getElementById("users-table-body");
  const userSearch = document.getElementById("user-search");
  const pageSizeSelect = document.getElementById("user-page-size");
  const statusTabs = document.querySelectorAll("[data-user-status]");
  const refreshBtn = document.getElementById("btn-refresh-users");
  const usersMessage = document.getElementById("users-message");
  const pageInfo = document.getElementById("page-info");
  const paginationControls = document.getElementById("users-pagination-controls");

  const statTotalEl = document.getElementById("stat-users-total");
  const statActiveEl = document.getElementById("stat-users-active");
  const statLockedEl = document.getElementById("stat-users-locked");

  const lockModal = document.getElementById("lock-modal");
  const lockForm = document.getElementById("lock-form");
  const lockDurationSelect = document.getElementById("lock-duration");
  const lockDurationGrid = document.getElementById("lock-duration-grid");
  const lockReasonInput = document.getElementById("lock-reason");
  const lockUserLabel = document.getElementById("lock-user-label");
  const lockFormError = document.getElementById("lock-form-error");
  const confirmLockSubmit = document.getElementById("confirm-lock-submit");
  const closeLockModalBtn = document.getElementById("close-lock-modal");
  const cancelLockBtn = document.getElementById("cancel-lock");

  let users = [];
  let currentPage = 1;
  let pageSize = 20;
  let totalUsers = 0;
  let totalPages = 1;
  let statusFilter = "";
  let searchQuery = "";
  let searchDebounce = null;
  let selectedUserForLock = null;
  let isLoading = false;

  function esc(val) {
    return String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function unwrap(res) {
    return res && typeof res === "object" && res.data !== undefined ? res.data : res;
  }

  function showAdminToast(message) {
    const container = document.getElementById("fc-toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "fc-toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.isConnected) toast.remove();
    }, 3200);
  }

  function showFeedback(text, isError = false) {
    if (!usersMessage) return;
    if (!text) {
      usersMessage.hidden = true;
      usersMessage.textContent = "";
      return;
    }
    usersMessage.textContent = text;
    usersMessage.className = `au-feedback-msg ${isError ? "is-error" : "is-success"}`;
    usersMessage.hidden = false;
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return "—";
    const dt = new Date(isoStr);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateShort(isoStr) {
    if (!isoStr) return "—";
    const dt = new Date(isoStr);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function isLockExpired(user) {
    if (!user || String(user.status).toUpperCase() !== "LOCKED") return false;
    if (!user.locked_until) return false; // null = khóa vĩnh viễn
    const untilTime = new Date(user.locked_until).getTime();
    if (Number.isNaN(untilTime)) return false;
    return untilTime <= Date.now();
  }

  // 3. Tải số liệu thống kê tổng quát (Tổng, ACTIVE, LOCKED)
  async function loadUserSummaryStats() {
    try {
      const [allRes, activeRes, lockedRes] = await Promise.allSettled([
        api.get("/api/admin/users", { page: 1, page_size: 1 }),
        api.get("/api/admin/users", { page: 1, page_size: 1, status: "ACTIVE" }),
        api.get("/api/admin/users", { page: 1, page_size: 1, status: "LOCKED" }),
      ]);

      if (allRes.status === "fulfilled" && statTotalEl) {
        const d = unwrap(allRes.value) || {};
        statTotalEl.textContent = String(Number(d.total ?? 0));
      }
      if (activeRes.status === "fulfilled" && statActiveEl) {
        const d = unwrap(activeRes.value) || {};
        statActiveEl.textContent = String(Number(d.total ?? 0));
      }
      if (lockedRes.status === "fulfilled" && statLockedEl) {
        const d = unwrap(lockedRes.value) || {};
        statLockedEl.textContent = String(Number(d.total ?? 0));
      }
    } catch (_) {}
  }

  // 4. Tải danh sách người dùng từ GET /api/admin/users
  async function loadUsers() {
    if (isLoading) return;
    isLoading = true;

    if (usersTableBody) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="au-empty-cell">
            <i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px; color: #38bdf8;"></i>
            Đang tải danh sách người dùng...
          </td>
        </tr>
      `;
    }

    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await api.get("/api/admin/users", params);
      const data = unwrap(response) || {};

      users = Array.isArray(data.items) ? data.items : [];
      totalUsers = Number(data.total ?? users.length) || 0;
      totalPages = Math.max(1, Number(data.total_pages) || Math.ceil(totalUsers / pageSize) || 1);
      if (currentPage > totalPages) currentPage = totalPages;

      renderUsersTable();
      renderPagination();
    } catch (error) {
      if (usersTableBody) {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="au-empty-cell is-error">
              <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i>
              ${esc(error?.message || "Không thể tải danh sách người dùng. Vui lòng kiểm tra quyền Admin.")}
            </td>
          </tr>
        `;
      }
    } finally {
      isLoading = false;
    }
  }

  // 5. Render bảng danh sách người dùng
  function renderUsersTable() {
    if (!usersTableBody) return;

    if (users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="au-empty-cell">
            Không tìm thấy người dùng nào khớp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    usersTableBody.innerHTML = users.map((user) => {
      const uid = Number(user.id);
      const uname = user.username || `user_${uid}`;
      const email = user.email || "—";
      const role = String(user.role || "USER").toUpperCase();
      const isAdminRole = role === "ADMIN";
      const isSelf = currentAdminId !== null && uid === currentAdminId;
      const status = String(user.status || "ACTIVE").toUpperCase();
      const isLockedStatus = status === "LOCKED";
      const expired = isLockExpired(user);
      const provider = String(user.auth_provider || "LOCAL").toUpperCase();
      const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(uname)}&backgroundColor=b6e3f4`;

      let statusHtml = "";
      if (!isLockedStatus) {
        statusHtml = `
          <div class="au-status-stack">
            <span class="au-status-badge is-active">
              <i class="fa-solid fa-circle-check"></i> Hoạt động
            </span>
          </div>
        `;
      } else {
        const durationLabel = user.locked_until
          ? (expired
              ? `Đã hết hạn khóa (${formatDateTime(user.locked_until)}) · Tự mở khi đăng nhập`
              : `Khóa đến: ${formatDateTime(user.locked_until)}`)
          : "Thời hạn: Khóa vĩnh viễn";
        const reasonLabel = user.locked_reason
          ? `Lý do: ${user.locked_reason}`
          : "Lý do: Vi phạm quy định";

        statusHtml = `
          <div class="au-status-stack">
            <span class="au-status-badge ${expired ? "is-expired" : "is-locked"}">
              <i class="fa-solid ${expired ? "fa-clock-rotate-left" : "fa-lock"}"></i>
              ${expired ? "Hết hạn khóa (Chờ đăng nhập)" : "Đã khóa"}
            </span>
            <span class="au-lock-meta">${esc(durationLabel)}</span>
            <span class="au-lock-reason" title="${esc(user.locked_reason || "")}">${esc(reasonLabel)}</span>
          </div>
        `;
      }

      let actionButtonsHtml = `
        <a href="admin_user-detail.html?id=${encodeURIComponent(uid)}" class="au-btn au-btn-sm au-btn-ghost">
          <i class="fa-regular fa-eye"></i> Chi tiết
        </a>
      `;

      if (isAdminRole || isSelf) {
        actionButtonsHtml += `
          <span class="au-protected-tag" title="Tài khoản Quản trị viên được bảo vệ">
            <i class="fa-solid fa-shield-halved"></i> Bảo vệ
          </span>
        `;
      } else if (isLockedStatus) {
        actionButtonsHtml += `
          <button
            type="button"
            class="au-btn au-btn-sm au-btn-unlock"
            data-action="unlock"
            data-user-id="${uid}"
          >
            <i class="fa-solid fa-lock-open"></i> Mở khóa
          </button>
        `;
      } else {
        actionButtonsHtml += `
          <button
            type="button"
            class="au-btn au-btn-sm au-btn-danger"
            data-action="lock"
            data-user-id="${uid}"
          >
            <i class="fa-solid fa-lock"></i> Khóa
          </button>
        `;
      }

      return `
        <tr>
          <td class="au-id-cell">#${uid}</td>
          <td>
            <div class="au-user-cell">
              <img src="${esc(avatarUrl)}" alt="${esc(uname)}" class="au-user-avatar">
              <div class="au-user-meta">
                <strong>${esc(uname)}</strong>
                <span class="au-provider-chip">${provider === "GOOGLE" ? "Google OAuth" : "Tài khoản Local"}</span>
              </div>
            </div>
          </td>
          <td class="au-email-cell">${esc(email)}</td>
          <td>
            <span class="au-role-badge ${isAdminRole ? "is-admin" : "is-user"}">
              ${isAdminRole ? '<i class="fa-solid fa-crown"></i> ADMIN' : "USER"}
            </span>
          </td>
          <td>${statusHtml}</td>
          <td class="au-date-cell">${esc(formatDateShort(user.created_at))}</td>
          <td>
            <div class="au-actions-cell">
              ${actionButtonsHtml}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 6. Render thanh phân trang
  function renderPagination() {
    if (pageInfo) {
      if (totalUsers === 0) {
        pageInfo.innerHTML = "Không có bản ghi nào";
      } else {
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(totalUsers, currentPage * pageSize);
        pageInfo.innerHTML = `Hiển thị <strong>${start}–${end}</strong> trên tổng <strong>${totalUsers}</strong> tài khoản · Trang <strong>${currentPage}/${totalPages}</strong>`;
      }
    }

    if (!paginationControls) return;

    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }

    paginationControls.innerHTML = `
      <button type="button" class="ar-page-btn" data-goto-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>
        « Trước
      </button>
      ${pages.map((p) => `
        <button
          type="button"
          class="ar-page-btn ${p === currentPage ? "active" : ""}"
          data-goto-page="${p}"
        >
          ${p}
        </button>
      `).join("")}
      <button type="button" class="ar-page-btn" data-goto-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>
        Sau »
      </button>
    `;
  }

  // 7. Xử lý Modal Khóa tài khoản (Lý do + Thời hạn 1 / 7 / 30 ngày hoặc Vĩnh viễn)
  function setDurationChoice(val) {
    if (lockDurationSelect) lockDurationSelect.value = val;
    lockDurationGrid?.querySelectorAll(".au-duration-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.durationVal === val);
    });
  }

  function openLockModal(userId) {
    const target = users.find((u) => Number(u.id) === Number(userId));
    if (!target) return;

    selectedUserForLock = target;
    setDurationChoice("1");
    if (lockReasonInput) lockReasonInput.value = "";
    if (lockFormError) {
      lockFormError.hidden = true;
      lockFormError.textContent = "";
    }

    if (lockUserLabel) {
      lockUserLabel.innerHTML = `
        <span>Tài khoản mục tiêu:</span>
        <strong>@${esc(target.username)}</strong>
        <small>(${esc(target.email || `ID #${target.id}`)})</small>
      `;
    }

    if (lockModal) {
      lockModal.hidden = false;
      setTimeout(() => lockReasonInput?.focus(), 40);
    }
  }

  function closeLockModal() {
    selectedUserForLock = null;
    if (lockModal) lockModal.hidden = true;
  }

  async function handleUnlockUser(userId, buttonEl) {
    const target = users.find((u) => Number(u.id) === Number(userId));
    const uname = target ? target.username : `#${userId}`;

    if (buttonEl) buttonEl.disabled = true;
    try {
      await api.patch(`/api/admin/users/${userId}/unlock`, {});
      showAdminToast(`🔓 Đã mở khóa tài khoản @${uname} thành công.`);
      showFeedback(`Đã mở khóa tài khoản @${uname}.`, false);
      await Promise.all([loadUsers(), loadUserSummaryStats()]);
    } catch (error) {
      showFeedback(error?.message || "Không thể mở khóa tài khoản.", true);
      if (buttonEl) buttonEl.disabled = false;
    }
  }

  // 8. Gắn sự kiện tương tác
  statusTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      statusTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      statusFilter = tab.dataset.userStatus || "";
      currentPage = 1;
      loadUsers();
    });
  });

  pageSizeSelect?.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value) || 20;
    currentPage = 1;
    loadUsers();
  });

  userSearch?.addEventListener("input", () => {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchQuery = userSearch.value;
      currentPage = 1;
      loadUsers();
    }, 280);
  });

  refreshBtn?.addEventListener("click", () => {
    showFeedback("");
    loadUsers();
    loadUserSummaryStats();
  });

  paginationControls?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-goto-page]");
    if (!btn || btn.disabled) return;
    const next = Number(btn.dataset.gotoPage);
    if (next >= 1 && next <= totalPages && next !== currentPage) {
      currentPage = next;
      loadUsers();
    }
  });

  usersTableBody?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const uid = Number(btn.dataset.userId);
    if (!uid) return;

    if (btn.dataset.action === "lock") {
      openLockModal(uid);
    } else if (btn.dataset.action === "unlock") {
      handleUnlockUser(uid, btn);
    }
  });

  lockDurationGrid?.addEventListener("click", (e) => {
    const chip = e.target.closest("button[data-duration-val]");
    if (!chip) return;
    setDurationChoice(chip.dataset.durationVal);
  });

  document.querySelectorAll("[data-reason-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!lockReasonInput) return;
      lockReasonInput.value = btn.getAttribute("data-reason-preset") || "";
      lockReasonInput.focus();
      if (lockFormError) lockFormError.hidden = true;
    });
  });

  closeLockModalBtn?.addEventListener("click", closeLockModal);
  cancelLockBtn?.addEventListener("click", closeLockModal);
  lockModal?.querySelectorAll("[data-close-lock-modal]").forEach((el) => {
    el.addEventListener("click", closeLockModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lockModal && !lockModal.hidden) {
      closeLockModal();
    }
  });

  lockForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedUserForLock) return;

    const reason = (lockReasonInput?.value || "").trim();
    if (!reason) {
      if (lockFormError) {
        lockFormError.textContent = "Vui lòng nhập hoặc chọn lý do khóa tài khoản.";
        lockFormError.hidden = false;
      }
      lockReasonInput?.focus();
      return;
    }

    const rawDuration = lockDurationSelect ? lockDurationSelect.value : "1";
    const durationDays = rawDuration === "permanent" ? null : Number(rawDuration);

    if (confirmLockSubmit) {
      confirmLockSubmit.disabled = true;
      confirmLockSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang khóa...';
    }

    try {
      await api.patch(`/api/admin/users/${selectedUserForLock.id}/lock`, {
        duration_days: durationDays,
        reason,
      });

      const targetName = selectedUserForLock.username;
      const durText = durationDays ? `${durationDays} ngày` : "vĩnh viễn";
      closeLockModal();
      showAdminToast(`🔒 Đã khóa tài khoản @${targetName} (${durText}).`);
      showFeedback(`Đã khóa tài khoản @${targetName} (${durText}) · Lý do: ${reason}`, false);
      await Promise.all([loadUsers(), loadUserSummaryStats()]);
    } catch (error) {
      if (lockFormError) {
        lockFormError.textContent = error?.message || "Không thể khóa tài khoản.";
        lockFormError.hidden = false;
      }
    } finally {
      if (confirmLockSubmit) {
        confirmLockSubmit.disabled = false;
        confirmLockSubmit.innerHTML = '<i class="fa-solid fa-lock"></i> Xác nhận khóa tài khoản';
      }
    }
  });

  // 9. Khởi chạy
  loadUserSummaryStats();
  loadUsers();
})();
