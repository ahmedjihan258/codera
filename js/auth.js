/* auth.js shard auth helpers used on every page */


function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  // Hide after 5 seconds
  setTimeout(() => el.classList.remove("show"), 5000);
}

// Redirect to login if not authenticated (call on protected pages)
async function requireAuth() {
  try {
    const res  = await fetch("../php/session_check.php");
    const data = await res.json();
    if (!data.logged_in) {
      window.location.href = "login.html";
    }
    return data;
  } catch {
    window.location.href = "login.html";
  }
}

//  topbar user info
function setTopbarUser(name) {
  const el = document.getElementById("topbar-user-name");
  if (el) el.textContent = name;
  const av = document.getElementById("topbar-avatar");
  if (av) av.textContent = name ? name[0].toUpperCase() : "?";
}
