// Đồng bộ thanh công cụ nhanh bên phải trên các trang đã đăng nhập.
(() => {
  const ICONS = {
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>',
    invite: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6m3-3h-6"></path></svg>',
    friends: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    create: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>',
  };

  function addStyles() {
    if (document.querySelector('link[data-gc-rightbar-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "../css/rightbar.css";
    link.dataset.gcRightbarCss = "true";
    document.head.append(link);
  }

  function createAvatar() {
    const wrapper = document.createElement("div");
    wrapper.className = "fc-avatar-menu-wrapper";
    wrapper.dataset.gcRightTool = "avatar";
    wrapper.innerHTML = '<a href="profile.html" class="fc-self-avatar-wrap" title="Mở hồ sơ game thủ" aria-label="Mở hồ sơ game thủ"><img src="https://api.dicebear.com/9.x/adventurer/svg?seed=User&backgroundColor=b6e3f4" alt="Avatar của bạn" class="fc-self-avatar"><span class="fc-status-dot"></span></a>';
    return wrapper;
  }

  function createLink(href, title, icon, extraClass = "") {
    const link = document.createElement("a");
    link.href = href;
    link.title = title;
    link.setAttribute("aria-label", title);
    link.className = `fc-right-icon-btn ${extraClass}`.trim();
    link.innerHTML = icon;
    return link;
  }

  function asLink(node, href, title, body) {
    if (node?.tagName === "BUTTON") {
      const link = document.createElement("a");
      for (const attribute of Array.from(node.attributes)) {
        if (attribute.name !== "type") link.setAttribute(attribute.name, attribute.value);
      }
      node.replaceWith(link);
      node = link;
    }
    if (node) {
      node.href = href;
      node.title = title;
      node.setAttribute("aria-label", title);
      node.innerHTML = body;
      node.dataset.gcRightTool = node.dataset.gcRightTool || "";
    }
    return node;
  }

  function ensureToolbar() {
    let bar = document.querySelector("aside.fc-right-bar");
    if (!bar) {
      bar = document.createElement("aside");
      bar.className = "fc-right-bar gc-rightbar-fixed";
      bar.setAttribute("aria-label", "Thanh công cụ nhanh và tài khoản");
      document.body.append(bar);
      document.body.classList.add("gc-rightbar-has-fixed");
    }
    bar.classList.add("gc-rightbar-unified");
    addStyles();

    let avatar = bar.querySelector(":scope > .fc-avatar-menu-wrapper");
    if (!avatar) avatar = createAvatar();
    avatar.dataset.gcRightTool = "avatar";

    let vs = bar.querySelector('[data-gc-right-tool="vs"]')
      || bar.querySelector(".community-vs")
      || Array.from(bar.children).find((child) => child.matches("a,button") && (child.href?.includes("quick-match.html") || child.textContent.trim() === "VS"));
    if (!vs) vs = createLink("quick-match.html", "Đấu nhanh VS", "VS");
    vs = asLink(vs, "quick-match.html", "Đấu nhanh VS", "VS");
    vs.dataset.gcRightTool = "vs";

    let bell = bar.querySelector(":scope > #gc-notif-bell");
    if (!bell) {
      bell = createLink("notifications.html", "Thông báo", ICONS.bell);
      bell.id = "gc-notif-bell";
      bell.dataset.gcBellFallback = "true";
    }
    bell.dataset.gcRightTool = "notifications";

    let invite = bar.querySelector('[data-gc-right-tool="invite"]')
      || bar.querySelector('a[href="friends.html?tab=received"]')
      || bar.querySelector('button[data-quick-tab="received"]')
      || bar.querySelector('a[title*="Thêm bạn"]');
    if (!invite) invite = createLink("friends.html?tab=received", "Lời mời kết bạn", ICONS.invite);
    invite = asLink(invite, "friends.html?tab=received", "Lời mời kết bạn", ICONS.invite);
    invite.dataset.gcRightTool = "invite";

    let friendList = bar.querySelector('[data-gc-right-tool="friends"]')
      || bar.querySelector('a[href="friends.html"]')
      || bar.querySelector('button[data-quick-tab="friends"]');
    if (!friendList) friendList = createLink("friends.html", "Danh sách bạn bè", ICONS.friends);
    if (friendList.tagName === "A") {
      friendList = asLink(friendList, "friends.html", "Danh sách bạn bè", ICONS.friends);
    } else {
      friendList.title = "Danh sách bạn bè";
      friendList.setAttribute("aria-label", "Danh sách bạn bè");
      friendList.innerHTML = ICONS.friends;
    }
    friendList.dataset.gcRightTool = "friends";

    let create = bar.querySelector('[data-gc-right-tool="create"]')
      || bar.querySelector('a[href="quick-match.html?view=lobby"]');
    if (!create) create = createLink("quick-match.html?view=lobby", "Tạo phòng đội", ICONS.create);
    create = asLink(create, "quick-match.html?view=lobby", "Tạo phòng đội", ICONS.create);
    create.dataset.gcRightTool = "create";

    const common = [avatar, vs, bell, invite, friendList, create];
    // Keep the rail identical on every page; page specific controls do not belong here.
    bar.replaceChildren(...common);

  }

  const run = () => {
    if (["login.html", "register.html"].includes(location.pathname.split("/").pop())) return;
    ensureToolbar();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
