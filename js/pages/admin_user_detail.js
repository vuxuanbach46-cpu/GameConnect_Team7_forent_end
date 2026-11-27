/* ==========================================================================
   GameConnect — Chi tiết Tài khoản Người dùng (Admin Panel)
   Kết nối trực tiếp với:
   - GET   /api/admin/users/{user_id}
   - PATCH /api/admin/users/{user_id}/lock
   - PATCH /api/admin/users/{user_id}/unlock
   ========================================================================== */

(() => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  let currentAdminId = null;
  let role = localStorage.getItem("user_role") || "";
  try {
    const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (p?.role) role = p.role;
    if (p?.sub) currentAdminId = Number(p.sub);
  } catch (_) {}

  if (String(role).toUpperCase() !== "ADMIN") {
    window.location.replace("home.html");
    return;
  }

  document.querySelectorAll(".admin-nav-item").forEach((el) => {
    el.style.display = "";
  });

  const userId = Number(new URLSearchParams(window.location.search).get("id"));
  const detailMessage = document.getElementById("user-detail-message");
  const lockButton = document.getElementById("detail-lock-btn");
  const unlockButton = document.getElementById("detail-unlock-btn");
  const lockModal = document.getElementById("detail-lock-modal");
  const lockForm = document.getElementById("detail-lock-form");
  const lockDurationSelect = document.getElementById("detail-lock-duration");
  const durationGrid = document.getElementById("detail-duration-grid");
  const lockReasonInput = document.getElementById("detail-lock-reason");
  const lockError = document.getElementById("detail-lock-error");
  const confirmLockBtn = document.getElementById("detail-confirm-lock");

  let currentUser = null;

  function unwrap(res) {
    return res && typeof res === "object" && res.data !== undefined ? res.data : res;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "--";
  }

  function showDetailFeedback(text, isError = false) {
    if (!detailMessage) return;
    if (!text) {
      detailMessage.hidden = true;
      return;
    }
    detailMessage.textContent = text;
    detailMessage.className = `au-feedback-msg ${isError ? "is-error" : "is-success"}`;
    detailMessage.hidden = false;
  }

  function formatDateTime(value) {
    if (!value) return "--";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "--";
    return dt.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function renderUserDetail() {
    if (!currentUser) return;

    const uname = currentUser.username || `user_${currentUser.id}`;
    const email = currentUser.email || "--";
    const uRole = String(currentUser.role || "USER").toUpperCase();
    const uStatus = String(currentUser.status || "ACTIVE").toUpperCase();
    const isLocked = uStatus === "LOCKED";
    const isExpired = isLocked && currentUser.locked_until && new Date(currentUser.locked_until).getTime() <= Date.now();
    const isProtected = uRole === "ADMIN" || (currentAdminId !== null && Number(currentUser.id) === currentAdminId);

    setText("detail-name", `@${uname}`);
    setText("detail-email", email);
    setText("detail-id", `#${currentUser.id}`);
    setText("detail-full-name", uname);
    setText("detail-email-info", email);
    setText("detail-role", uRole);
    setText("detail-provider", currentUser.auth_provider || "LOCAL");
    setText("detail-created-at", formatDateTime(currentUser.created_at));
    setText(
      "detail-account-status",
      isLocked
        ? (isExpired ? "Đã hết hạn khóa (Tự mở khi đăng nhập)" : "Đang bị khóa (LOCKED)")
        : "Đang hoạt động (ACTIVE)"
    );
    setText(
      "detail-locked-until",
      isLocked
        ? (currentUser.locked_until ? formatDateTime(currentUser.locked_until) : "Khóa vĩnh viễn")
        : "Không áp dụng"
    );
    setText(
      "detail-locked-reason",
      isLocked ? (currentUser.locked_reason || "Vi phạm quy định hệ thống") : "Không bị khóa"
    );

    const avatarEl = document.getElementById("user-avatar");
    if (avatarEl) {
      const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(uname)}&backgroundColor=b6e3f4`;
      avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${uname}">`;
    }

    const profileLink = document.getElementById("detail-public-profile-link");
    if (profileLink) {
      profileLink.href = `profile.html?username=${encodeURIComponent(uname)}`;
    }

    const statusBadge = document.getElementById("detail-status");
    if (statusBadge) {
      statusBadge.className = `au-status-badge ${isLocked ? (isExpired ? "is-expired" : "is-locked") : "is-active"}`;
      statusBadge.textContent = isLocked ? (isExpired ? "Hết hạn khóa" : "Đã khóa") : "Hoạt động";
    }

    if (lockButton) lockButton.hidden = isProtected || isLocked;
    if (unlockButton) unlockButton.hidden = isProtected || !isLocked;
  }

  async function loadUserDetailFromApi() {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      showDetailFeedback("Mã người dùng không hợp lệ.", true);
      return;
    }
    try {
      const res = await api.get(`/api/admin/users/${userId}`);
      currentUser = unwrap(res);
      renderUserDetail();
    } catch (error) {
      showDetailFeedback(error?.message || "Không tìm thấy người dùng.", true);
      if (lockButton) lockButton.hidden = true;
      if (unlockButton) unlockButton.hidden = true;
    }
  }

  function setDurationChoice(val) {
    if (lockDurationSelect) lockDurationSelect.value = val;
    durationGrid?.querySelectorAll(".au-duration-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.durationVal === val);
    });
  }

  function closeLockModal() {
    if (lockModal) lockModal.hidden = true;
  }

  lockButton?.addEventListener("click", () => {
    if (!currentUser) return;
    setDurationChoice("1");
    if (lockReasonInput) lockReasonInput.value = "";
    if (lockError) lockError.hidden = true;
    if (lockModal) lockModal.hidden = false;
    setTimeout(() => lockReasonInput?.focus(), 40);
  });

  document.getElementById("detail-close-lock")?.addEventListener("click", closeLockModal);
  document.getElementById("detail-cancel-lock")?.addEventListener("click", closeLockModal);
  lockModal?.querySelectorAll("[data-close-detail-lock]").forEach((el) => {
    el.addEventListener("click", closeLockModal);
  });

  durationGrid?.addEventListener("click", (e) => {
    const chip = e.target.closest("button[data-duration-val]");
    if (!chip) return;
    setDurationChoice(chip.dataset.durationVal);
  });

  document.querySelectorAll("[data-reason-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!lockReasonInput) return;
      lockReasonInput.value = btn.getAttribute("data-reason-preset") || "";
      lockReasonInput.focus();
    });
  });

  lockForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const reason = (lockReasonInput?.value || "").trim();
    if (!reason) {
      if (lockError) {
        lockError.textContent = "Vui lòng nhập lý do khóa tài khoản.";
        lockError.hidden = false;
      }
      return;
    }

    const rawDur = lockDurationSelect ? lockDurationSelect.value : "1";
    const durationDays = rawDur === "permanent" ? null : Number(rawDur);

    if (confirmLockBtn) confirmLockBtn.disabled = true;
    try {
      const res = await api.patch(`/api/admin/users/${currentUser.id}/lock`, {
        duration_days: durationDays,
        reason,
      });
      currentUser = unwrap(res);
      closeLockModal();
      renderUserDetail();
      showDetailFeedback(`Đã khóa tài khoản @${currentUser.username} thành công.`, false);
    } catch (error) {
      if (lockError) {
        lockError.textContent = error?.message || "Không thể khóa tài khoản.";
        lockError.hidden = false;
      }
    } finally {
      if (confirmLockBtn) confirmLockBtn.disabled = false;
    }
  });

  unlockButton?.addEventListener("click", async () => {
    if (!currentUser) return;
    unlockButton.disabled = true;
    try {
      const res = await api.patch(`/api/admin/users/${currentUser.id}/unlock`, {});
      currentUser = unwrap(res);
      renderUserDetail();
      showDetailFeedback(`Đã mở khóa tài khoản @${currentUser.username} thành công.`, false);
    } catch (error) {
      showDetailFeedback(error?.message || "Không thể mở khóa tài khoản.", true);
    } finally {
      unlockButton.disabled = false;
    }
  });

  loadUserDetailFromApi();
})();
