const invitationList = document.getElementById("invitation-list");
const invitationMessage = document.getElementById("invitation-message");
const invitationCount = document.getElementById("invitation-count");

function setInvitationMessage(message, state = "") {
  invitationMessage.textContent = message;
  invitationMessage.dataset.state = state;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderInvitation(invitation) {
  const card = makeElement("article", "gc-invitation-card");
  const identity = makeElement("div", "gc-invitation-team-mark", String(invitation.team_name || "CL").trim().slice(0, 2).toUpperCase());
  identity.setAttribute("aria-hidden", "true");

  const main = makeElement("div", "gc-invitation-main");
  const meta = makeElement("div", "gc-invitation-meta");
  const type = makeElement("span", "gc-invitation-type");
  type.innerHTML = '<i class="fa-solid fa-gamepad" aria-hidden="true"></i> LỜI MỜI THAM GIA ĐỘI';
  const mode = makeElement("span", `gc-invitation-mode${invitation.join_mode === "APPROVAL_REQUIRED" ? " is-approval" : ""}`,
    invitation.join_mode === "APPROVAL_REQUIRED" ? "Cần đội trưởng duyệt" : "Tham gia trực tiếp");
  meta.append(type, mode);
  const title = makeElement("h3", "gc-invitation-title", invitation.team_name || "Đội GameConnect");
  const inviter = makeElement("p", "gc-invitation-inviter");
  inviter.append("Được mời bởi ");
  inviter.append(makeElement("strong", "", invitation.inviter_name || "Thành viên đội"));
  main.append(meta, title, inviter);

  const divider = makeElement("div", "gc-invitation-divider");
  const footer = makeElement("div", "gc-invitation-footer");
  const note = makeElement("p", "gc-invitation-note");
  const noteIcon = makeElement("i", `fa-solid ${invitation.join_mode === "APPROVAL_REQUIRED" ? "fa-user-shield" : "fa-circle-check"}`);
  noteIcon.setAttribute("aria-hidden", "true");
  note.append(noteIcon, document.createTextNode(invitation.join_mode === "APPROVAL_REQUIRED"
    ? "Khi chấp nhận, yêu cầu tham gia sẽ được gửi đến đội trưởng để phê duyệt."
    : "Chấp nhận lời mời để trở thành thành viên của đội."));

  const actions = makeElement("div", "gc-invitation-actions");
  for (const [action, label, icon, css] of [
    ["reject", "Từ chối", "fa-xmark", "gc-invitation-reject"],
    ["accept", "Chấp nhận", "fa-check", "gc-invitation-accept"],
  ]) {
    const button = makeElement("button", css, label);
    button.type = "button";
    button.dataset.action = action;
    const buttonIcon = makeElement("i", `fa-solid ${icon}`);
    buttonIcon.setAttribute("aria-hidden", "true");
    button.prepend(buttonIcon);
    button.addEventListener("click", async () => {
      actions.querySelectorAll("button").forEach((item) => { item.disabled = true; });
      button.classList.add("is-loading");
      button.setAttribute("aria-busy", "true");
      button.replaceChildren(buttonIcon, document.createTextNode(action === "accept" ? " Đang chấp nhận..." : " Đang từ chối..."));
      setInvitationMessage("");
      try {
        const result = await api.patch(`/api/team-invitations/${invitation.id}`, { action });
        const responseMessage = result?.message || (action === "accept" ? "Đã chấp nhận lời mời." : "Đã từ chối lời mời.");
        await loadInvitations(responseMessage);
      } catch (error) {
        setInvitationMessage(error.message || "Không thể phản hồi lời mời. Vui lòng thử lại.", "error");
        actions.querySelectorAll("button").forEach((item) => { item.disabled = false; });
        button.classList.remove("is-loading");
        button.removeAttribute("aria-busy");
        button.replaceChildren(buttonIcon, document.createTextNode(` ${label}`));
      }
    });
    actions.append(button);
  }
  footer.append(note, actions);
  card.append(identity, main, divider, footer);
  return card;
}

async function loadInvitations(successMessage = "") {
  invitationList.replaceChildren();
  if (!localStorage.getItem("access_token")) {
    invitationCount.textContent = "— lời mời";
    setInvitationMessage("Vui lòng đăng nhập để xem lời mời.", "auth");
    const link = makeElement("a", "gc-invitations-login", "Đăng nhập");
    link.href = "login.html";
    invitationMessage.append(" ", link);
    return;
  }

  setInvitationMessage("Đang tải danh sách lời mời...", "loading");
  try {
    const response = await api.get("/api/team-invitations/me");
    const invitations = Array.isArray(response?.data) ? response.data : [];
    invitationCount.textContent = `${invitations.length} lời mời`;
    if (!invitations.length) {
      setInvitationMessage(successMessage || "Bạn chưa có lời mời nào đang chờ. Khi có đội mời, lời mời sẽ xuất hiện tại đây.", "empty");
      const empty = makeElement("div", "gc-invitations-empty");
      const icon = makeElement("span", "gc-invitations-empty-icon");
      icon.innerHTML = '<img src="../assets/images/logo.svg" alt="GameConnect Logo" style="width: 36px; height: 36px;">';
      empty.append(icon, makeElement("strong", "", "Hộp thư lời mời đang trống"), makeElement("span", "", "Khám phá bạn bè và cùng nhau lập đội để sẵn sàng vào trận."));
      const browse = makeElement("a", "gc-invitations-empty-link", "Tìm đồng đội");
      browse.href = "quick-match.html";
      const arrow = makeElement("i", "fa-solid fa-arrow-right");
      arrow.setAttribute("aria-hidden", "true");
      browse.append(" ", arrow);
      empty.append(browse);
      invitationList.append(empty);
      return;
    }

    setInvitationMessage(successMessage || "Kiểm tra thông tin đội và chọn phản hồi phù hợp.", successMessage ? "success" : "");
    invitations.forEach((invitation) => invitationList.append(renderInvitation(invitation)));
  } catch (error) {
    invitationCount.textContent = "— lời mời";
    setInvitationMessage(error.message || "Không thể tải lời mời. Vui lòng thử lại.", "error");
  }
}

loadInvitations();
