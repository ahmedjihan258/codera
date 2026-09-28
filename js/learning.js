/* for learning page*/
let allLessons      = [];
let currentLessonId = null;
let courseId        = null;
let moduleQuizzes   = {};     // module_name -> quiz
let quizUnlocked    = false;  // true when the student is enrolled

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

  // Module quizzes (shown at the end of each module in the sidebar)
  await loadModuleQuizzes();

  renderSidebar();
  startCooldownTicker();

  // Open the requested lesson, or the first unlocked one
  const firstUnlocked = allLessons.find(l => !l.locked);
  const firstId = currentLessonId || (firstUnlocked ? firstUnlocked.id : (allLessons[0] ? allLessons[0].id : null));
  if (firstId) openLesson(firstId);
})();

async function loadModuleQuizzes() {
  try {
    const qRes  = await fetch(`../php/quiz.php?course_id=${courseId}`);
    const qData = await qRes.json();
    if (qData.success) {
      quizUnlocked = qData.enrolled;
      moduleQuizzes = {};
      qData.quizzes.forEach(q => { if (q.module_name && q.question_count > 0) moduleQuizzes[q.module_name] = q; });
    }
  } catch { /* the lessons work even if quizzes cannot be loaded */ }
}

function formatCooldown(seconds) {
  const pad = n => String(n).padStart(2, "0");
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
}

/* Ticks every visible ⏳ countdown down by one second, live. When one hits
   zero, re-fetch quiz state from the server (source of truth for unlocking)
   and re-render the sidebar. */
let cooldownTickerStarted = false;
function startCooldownTicker() {
  if (cooldownTickerStarted) return;
  cooldownTickerStarted = true;
  setInterval(async () => {
    let expired = false;
    document.querySelectorAll(".cooldown-timer").forEach(el => {
      const remaining = Math.max(0, parseInt(el.dataset.remaining, 10) - 1);
      el.dataset.remaining = remaining;
      if (remaining <= 0) { expired = true; return; }
      const textEl = el.querySelector(".cooldown-text");
      if (textEl) textEl.textContent = formatCooldown(remaining);
    });
    if (expired) {
      await loadModuleQuizzes();
      renderSidebar();
    }
  }, 1000);
}

function renderSidebar() {
  const container = document.getElementById("lesson-list-container");
  const groups = {};

  // Group by module
  allLessons.forEach(l => {
    if (!groups[l.module_name]) groups[l.module_name] = [];
    groups[l.module_name].push(l);
  });

  container.innerHTML = Object.entries(groups).map(([mod, lessons]) => `
    <div class="module-group" style="${lessons[0].locked ? "opacity:.6;" : ""}">
      <div class="module-name">${lessons[0].locked ? "🔒 " : ""}${mod}</div>
      ${lessons.map(l => l.locked ? `
        <div class="lesson-item" style="cursor:not-allowed;" title="Pass the previous module's quiz to unlock">
          <div class="lesson-check">🔒</div>
          <span>${l.title}</span>
        </div>` : `
        <div class="lesson-item ${l.completed ? "completed" : ""} ${l.id === currentLessonId ? "active" : ""}"
             id="sidebar-item-${l.id}" onclick="openLesson(${l.id})">
          <div class="lesson-check ${l.completed ? "done" : ""}">
            ${l.completed ? "✓" : ""}
          </div>
          <span>${l.title}</span>
        </div>`).join("")}
      ${moduleQuizItem(mod)}
    </div>`).join("");
}

function moduleQuizItem(mod) {
  const q = moduleQuizzes[mod];
  if (!q) return "";

  if (!quizUnlocked || q.locked) {
    const reason = !quizUnlocked ? "Enroll in this course to take the quiz" : q.locked_reason;
    return `
      <div class="lesson-item" style="cursor:not-allowed;opacity:.65;" title="${reason}">
        <div class="lesson-check">🔒</div>
        <span>Module Quiz</span>
      </div>`;
  }
  if (q.cooldown_seconds > 0) {
    const secs = Math.max(0, Math.floor(q.cooldown_seconds));
    return `
      <div class="lesson-item cooldown-timer" data-remaining="${secs}" style="cursor:not-allowed;opacity:.65;" title="You didn't pass last time — try again later">
        <div class="lesson-check">⏳</div>
        <span>Module Quiz · retry in <span class="cooldown-text">${formatCooldown(secs)}</span></span>
      </div>`;
  }
  const best = q.best_percent !== null ? ` · ${q.passed ? "✓" : "best"} ${q.best_percent}%` : "";
  return `
    <div class="lesson-item" style="font-weight:700;"
         onclick="window.location.href='quiz.html?course=${courseId}&quiz=${q.id}'">
      <div class="lesson-check">📝</div>
      <span>Module Quiz${best}</span>
    </div>`;
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

  if (!data.success) {
    if (data.code === "locked_module") {
      document.getElementById("lesson-title").textContent = "🔒 Module locked";
      document.getElementById("lesson-module-badge").textContent = "";
      document.getElementById("lesson-body").innerHTML =
        `<p class="text-muted">${data.message}</p>`;
      ["prev-btn", "next-btn", "complete-btn"].forEach(id => document.getElementById(id).disabled = true);
    }
    return;
  }

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
