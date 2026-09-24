/* for learning page*/
let allLessons      = [];
let currentLessonId = null;
let courseId        = null;

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);

  const params   = new URLSearchParams(window.location.search);
  courseId        = parseInt(params.get("course"));
  currentLessonId = parseInt(params.get("lesson")) || null;

  if (!courseId) { window.location.href = "courses.html"; return; }

  // Update back link
  document.getElementById("back-link").href = `course-details.html?id=${courseId}`;

  // Load lessons with progress
  const res  = await fetch(`../php/progress.php?course_id=${courseId}`);
  const data = await res.json();

  if (!data.success) return;
  allLessons = data.lessons;

  // Sidebar course title
  document.getElementById("sidebar-course-title").textContent =
    data.lessons[0] ? data.lessons[0].module_name.replace(/Module \d+: /, "") + " course" : "Course";

  renderSidebar();

  // Open first lesson or requested lesson
  const firstId = currentLessonId || (allLessons[0] ? allLessons[0].id : null);
  if (firstId) openLesson(firstId);
})();

function renderSidebar() {
  const container = document.getElementById("lesson-list-container");
  const groups = {};

  // Group by module
  allLessons.forEach(l => {
    if (!groups[l.module_name]) groups[l.module_name] = [];
    groups[l.module_name].push(l);
  });

  container.innerHTML = Object.entries(groups).map(([mod, lessons]) => `
    <div class="module-group">
      <div class="module-name">${mod}</div>
      ${lessons.map(l => `
        <div class="lesson-item ${l.completed ? "completed" : ""} ${l.id === currentLessonId ? "active" : ""}"
             id="sidebar-item-${l.id}" onclick="openLesson(${l.id})">
          <div class="lesson-check ${l.completed ? "done" : ""}">
            ${l.completed ? "✓" : ""}
          </div>
          <span>${l.title}</span>
        </div>`).join("")}
    </div>`).join("");
}

async function openLesson(id) {
  currentLessonId = id;

  // Update sidebar active state
  document.querySelectorAll(".lesson-item").forEach(el => el.classList.remove("active"));
  const sidebarItem = document.getElementById(`sidebar-item-${id}`);
  if (sidebarItem) sidebarItem.classList.add("active");

  // Fetch lesson content
  const res  = await fetch(`../php/lessons.php?lesson_id=${id}`);
  const data = await res.json();
  if (!data.success) return;

  const l = data.lesson;

  document.getElementById("lesson-title").textContent         = l.title;
  document.getElementById("lesson-module-badge").textContent  = l.module_name;
  document.getElementById("lesson-body").innerHTML            = l.content;

  // Nav buttons
  const prevBtn     = document.getElementById("prev-btn");
  const nextBtn     = document.getElementById("next-btn");
  const completeBtn = document.getElementById("complete-btn");

  prevBtn.disabled = !l.prev_lesson;
  nextBtn.disabled = !l.next_lesson;
  completeBtn.disabled = false;
  completeBtn.textContent = l.completed ? "✓ Completed" : "Mark Complete ✓";
  completeBtn.style.background = l.completed ? "#22c55e" : "";

  // Update URL without reloading
  const url = new URL(window.location);
  url.searchParams.set("lesson", id);
  window.history.replaceState({}, "", url);
}

function navigateLesson(dir) {
  const idx  = allLessons.findIndex(l => l.id === currentLessonId);
  if (dir === "prev" && idx > 0) openLesson(allLessons[idx - 1].id);
  if (dir === "next" && idx < allLessons.length - 1) openLesson(allLessons[idx + 1].id);
}

async function markComplete() {
  const res  = await fetch("../php/progress.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson_id: currentLessonId })
  });
  const data = await res.json();

  if (data.success) {
    // Update local state
    const lesson = allLessons.find(l => l.id === currentLessonId);
    if (lesson) lesson.completed = true;

    const btn = document.getElementById("complete-btn");
    btn.textContent        = "✓ Completed";
    btn.style.background   = "#22c55e";

    // Update sidebar
    const sideItem = document.getElementById(`sidebar-item-${currentLessonId}`);
    if (sideItem) {
      sideItem.classList.add("completed");
      const check = sideItem.querySelector(".lesson-check");
      if (check) { check.classList.add("done"); check.textContent = "✓"; }
    }
  }
}
