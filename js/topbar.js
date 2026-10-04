/* ===== FILE: js/topbar.js =====
   Shared right side of the topbar for student pages:
   [🔔 notifications]  [M avatar + user name ▾ → Profile / Logout]
   Load AFTER auth.js and BEFORE the page's own script. */
(function () {
  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function build() {
    const right = document.querySelector(".topbar-right");
    if (!right || right.dataset.built) return;
    right.dataset.built = "1";

    right.innerHTML = `
      <div class="notif-container">
        <button id="notif-btn" class="notif-btn" type="button" aria-label="Notifications">
          🔔 <span id="notif-badge" class="notif-badge" style="display:none;">0</span>
        </button>
        <div id="notif-menu" class="notif-menu">
          <div class="notif-header"><h4>Notifications</h4></div>
          <div id="notif-list" class="notif-list">
            <p class="notif-empty">No new notifications</p>
          </div>
        </div>
      </div>

      <div class="user-menu">
        <button id="user-menu-btn" class="user-menu-btn" type="button" aria-haspopup="true" aria-expanded="false">
          <div class="avatar" id="topbar-avatar" style="width:32px;height:32px;font-size:.85rem;">?</div>
          <span id="topbar-user-name" class="user-menu-name"></span>
        </button>
        <div id="user-menu-dropdown" class="user-menu-dropdown">
          <a href="profile.html">👤 Profile</a>
          <a href="../php/logout.php" class="danger">⏻ Logout</a>
        </div>
      </div>
    `;

    const notifBtn  = document.getElementById("notif-btn");
    const notifMenu = document.getElementById("notif-menu");
    const userBtn   = document.getElementById("user-menu-btn");
    const userMenu  = document.getElementById("user-menu-dropdown");

    function closeUserMenu() {
      userMenu.classList.remove("open");
      userBtn.setAttribute("aria-expanded", "false");
    }

    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeUserMenu();
      const opening = !notifMenu.classList.contains("open");
      notifMenu.classList.toggle("open", opening);
      if (opening) {
        const badge = document.getElementById("notif-badge");
        if (badge && badge.style.display !== "none") {
          badge.style.display = "none";
          fetch("../php/notifications.php?action=mark_read").catch(() => {});
        }
      }
    });

    userBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifMenu.classList.remove("open");
      const opening = !userMenu.classList.contains("open");
      userMenu.classList.toggle("open", opening);
      userBtn.setAttribute("aria-expanded", String(opening));
    });

    // Click outside / Esc closes both menus
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notif-container")) notifMenu.classList.remove("open");
      if (!e.target.closest(".user-menu")) closeUserMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { notifMenu.classList.remove("open"); closeUserMenu(); }
    });

    fetchNotifications();
  }

  async function fetchNotifications() {
    try {
      const res = await fetch("../php/notifications.php?action=get");
      const data = await res.json();
      const list = document.getElementById("notif-list");
      const badge = document.getElementById("notif-badge");
      if (!data.success || !Array.isArray(data.notifications) || !list || !badge) return;

      if (data.notifications.length === 0) {
        list.innerHTML = '<p class="notif-empty">No new notifications</p>';
        badge.style.display = "none";
        return;
      }

      let unread = 0;
      list.innerHTML = data.notifications.map(n => {
        if (parseInt(n.is_read) === 0) unread++;
        const d = n.created_at ? new Date(String(n.created_at).replace(" ", "T")).toLocaleDateString() : "";
        return `<div class="notif-item"><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><small>${d}</small></div>`;
      }).join("");

      if (unread > 0) { badge.textContent = unread; badge.style.display = "flex"; }
      else badge.style.display = "none";
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  if (document.querySelector(".topbar-right")) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
