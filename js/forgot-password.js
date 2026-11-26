document.addEventListener("DOMContentLoaded", () => {
  const forgotForm = document.getElementById("forgot-form");
  const resetForm = document.getElementById("reset-form");
  const alertBox = document.getElementById("forgot-alert");
  const emailInput = document.getElementById("forgot-email");
  const emailLabel = document.getElementById("reset-email-label");
  const sendButton = document.getElementById("send-code-btn");
  const resetButton = document.getElementById("reset-password-btn");
  const resendButton = document.getElementById("resend-code-btn");
  const changeEmailButton = document.getElementById("change-email-btn");
  let requestedEmail = "";

  const showMessage = (message, type = "error") => {
    alertBox.className = `alert-box ${type}`;
    alertBox.textContent = message;
  };
  const clearMessage = () => { alertBox.className = "alert-box hidden"; };

  async function sendCode(button = sendButton) {
    const email = (requestedEmail || emailInput.value).trim();
    if (!emailInput.checkValidity() && !requestedEmail) {
      emailInput.reportValidity();
      return false;
    }
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Đang gửi mã...";
    clearMessage();
    try {
      const response = await api.post("/auth/forgot-password", { email });
      requestedEmail = email;
      emailLabel.textContent = email;
      forgotForm.hidden = true;
      resetForm.hidden = false;
      showMessage(response.message || "Nếu email tồn tại, mã xác nhận sẽ được gửi tới hộp thư của bạn.", "success");
      return true;
    } catch (error) {
      if (error.status === 503) {
        showMessage("Chưa gửi được mã: backend chưa cấu hình Gmail SMTP (thiếu SMTP_USER hoặc SMTP_APP_PASSWORD trong .env). Nhờ quản trị viên cấu hình và khởi động lại backend, rồi bấm Gửi lại mã.");
      } else if (error.status === 429) {
        showMessage("Bạn đã yêu cầu mã quá 5 lần trong 1 giờ. Vui lòng chờ rồi thử gửi lại.");
      } else {
        showMessage(error.message || "Không gửi được yêu cầu. Vui lòng thử lại.");
      }
      return false;
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    requestedEmail = emailInput.value.trim();
    await sendCode();
  });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    const code = document.getElementById("reset-code").value.trim();
    const password = document.getElementById("new-password").value;
    const confirmation = document.getElementById("confirm-new-password").value;
    if (!/^\d{6}$/.test(code)) return showMessage("Mã xác nhận phải gồm 6 chữ số.");
    if (password.length < 6) return showMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (password !== confirmation) return showMessage("Mật khẩu xác nhận không khớp.");

    resetButton.disabled = true;
    resetButton.textContent = "Đang cập nhật...";
    try {
      const response = await api.post("/auth/reset-password", {
        email: requestedEmail,
        code,
        new_password: password,
      });
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.setItem("remember_login", "false");
      localStorage.removeItem("auth_provider");
      showMessage(response.message || "Đổi mật khẩu thành công. Hãy đăng nhập lại.", "success");
      resetForm.reset();
      setTimeout(() => { window.location.href = "login.html"; }, 1200);
    } catch (error) {
      showMessage(error.message || "Không đổi được mật khẩu. Hãy kiểm tra mã và thử lại.");
    } finally {
      resetButton.disabled = false;
      resetButton.textContent = "Đổi mật khẩu";
    }
  });

  resendButton.addEventListener("click", async () => {
    if (await sendCode(resendButton)) document.getElementById("reset-code").value = "";
  });

  changeEmailButton.addEventListener("click", () => {
    clearMessage();
    requestedEmail = "";
    resetForm.hidden = true;
    forgotForm.hidden = false;
    emailInput.focus();
  });
});
