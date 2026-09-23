/* profile view */

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);
  await loadProfile();
  bindForms();
})();

async function loadProfile() {
  const res  = await fetch("../php/profile.php");
  const data = await res.json();
  if (!data.success) return;

  const u = data.user;
  // Hero
  document.getElementById("hero-name").textContent  = u.full_name;
  document.getElementById("hero-email").textContent = u.email;
  document.getElementById("stat-courses").textContent = u.enrolled_courses;
  document.getElementById("stat-lessons").textContent = u.completed_lessons;

  // Info sidebar
  document.getElementById("info-name").textContent   = u.full_name;
  document.getElementById("info-email").textContent  = u.email;
  document.getElementById("info-joined").textContent = new Date(u.created_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  document.getElementById("info-bio").textContent    = u.bio || "No bio yet.";

  // Topbar avatar
  document.getElementById("topbar-avatar").textContent = u.full_name[0].toUpperCase();

  // Form pre-fill
  document.getElementById("full_name").value = u.full_name;
  document.getElementById("email").value     = u.email;
  document.getElementById("bio").value       = u.bio || "";
}

function bindForms() {
  // Profile form
  
  document.getElementById("profile-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const full_name = document.getElementById("full_name").value.trim();
    const bio       = document.getElementById("bio").value.trim();

    const res  = await fetch("../php/profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, bio })
    });
    const data = await res.json();

    if (data.success) {
      showAlert("profile-success", data.message);
      await loadProfile();
    } else {
      showAlert("profile-error", data.message);
    }
  });

  // Password form
  document.getElementById("password-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const current_password  = document.getElementById("current_password").value;
    const new_password      = document.getElementById("new_password").value;
    const confirm           = document.getElementById("confirm_new_password").value;

    if (new_password !== confirm) {
      showAlert("pwd-error", "New passwords do not match.");
      return;
    }

    const res  = await fetch("../php/profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: document.getElementById("full_name").value.trim(),
        bio: document.getElementById("bio").value.trim(),
        current_password,
        new_password
      })
    });
    const data = await res.json();

    if (data.success) {
      showAlert("pwd-success", "Password updated successfully!");
      document.getElementById("password-form").reset();
    } else {
      showAlert("pwd-error", data.message);
    }
  });
}
