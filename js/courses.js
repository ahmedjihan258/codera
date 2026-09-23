/* used on courses.html And course-details.html */

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);

  const page = window.location.pathname;

  if (page.includes("courses.html")) {
    await loadCourseList();
  } else if (page.includes("course-details.html")) {
    await loadCourseDetails();
  }
})();

/* ── Course list page ─────────────────────── */
async function loadCourseList() {
  const grid = document.getElementById("courses-grid");
  try {
    const res  = await fetch("../php/courses.php");
    const data = await res.json();
    if (!data.success) throw new Error();

    grid.innerHTML = data.courses.map(c => `
      <div class="course-grid-card">
        <div class="stripe"></div>
        <div class="body">
          <div class="icon">${c.icon}</div>
          <div class="row">
            <h3>${c.title}</h3>
            <span class="badge badge-${c.level.toLowerCase()}">${c.level}</span>
            ${c.enrolled ? '<span class="enrolled-tag">✓ Enrolled</span>' : ""}
          </div>
          <p>${c.description}</p>
          <div class="course-meta-row">
            <span>⏱ ${c.duration}</span>
            <span>📖 ${c.lesson_count} lessons</span>
          </div>
          <a href="course-details.html?id=${c.id}" class="btn btn-green btn-block">
            ${c.enrolled ? "Continue Learning →" : "View Course"}
          </a>
        </div>
      </div>`).join("");
  } catch {
    grid.innerHTML = `<p class="text-muted">Could not load courses. Make sure XAMPP is running.</p>`;
  }
}

/* ── Course details page ──────────────────── */
let currentCourseId = null;
let isEnrolled      = false;

async function loadCourseDetails() {
  const params   = new URLSearchParams(window.location.search);
  currentCourseId = parseInt(params.get("id"));
  if (!currentCourseId) { window.location.href = "courses.html"; return; }

  // Update quiz link
  document.getElementById("quiz-link").href = `quiz.html?course=${currentCourseId}`;

  // Load course info from courses list
  const res  = await fetch("../php/courses.php");
  const data = await res.json();
  const course = data.courses.find(c => c.id === currentCourseId);
  if (!course) { window.location.href = "courses.html"; return; }

  // Hero
  document.getElementById("hero-label").textContent    = course.level;
  document.getElementById("hero-title").textContent    = course.title;
  document.getElementById("hero-desc").textContent     = course.description;
  document.getElementById("hero-level").textContent    = "📊 " + course.level;
  document.getElementById("hero-duration").textContent = "⏱ " + course.duration;
  document.getElementById("hero-lessons").textContent  = "📖 " + course.lesson_count + " lessons";
  document.getElementById("course-icon").textContent   = course.icon;
  document.getElementById("enroll-title").textContent  = course.title;
  document.title = course.title + " — Codera";

  isEnrolled = course.enrolled;
  renderEnrollButton();

  // Load lessons via progress endpoint
  const pRes  = await fetch(`../php/progress.php?course_id=${currentCourseId}`);
  const pData = await pRes.json();

  const lessonList = document.getElementById("lessons-list");
  if (!pData.success || pData.lessons.length === 0) {
    lessonList.innerHTML = `<p class="text-muted text-sm">No lessons found.</p>`;
    return;
  }

  lessonList.innerHTML = pData.lessons.map((l, i) => `
    <div class="lesson-list-item">
      <div class="lesson-num">${i + 1}</div>
      <div class="lesson-info">
        <h4>${l.title}</h4>
        <p>${l.module_name}</p>
      </div>
      ${l.completed ? '<span class="badge badge-easy">✓ Done</span>' : ""}
      ${isEnrolled
        ? `<a href="learning.html?course=${currentCourseId}&lesson=${l.id}" class="btn btn-outline-dark btn-sm" style="margin-left:auto;">Open</a>`
        : ""}
    </div>`).join("");
}

function renderEnrollButton() {
  const area = document.getElementById("enroll-action");
  if (isEnrolled) {
    area.innerHTML = `
      <span class="enrolled-tag" style="display:block;margin-bottom:12px;">✓ You are enrolled</span>
      <a href="learning.html?course=${currentCourseId}" class="btn btn-primary btn-block btn-lg">Continue Learning →</a>`;
  } else {
    area.innerHTML = `<button id="enroll-btn" class="btn btn-primary btn-block btn-lg" onclick="enrollNow()">Enroll Now</button>`;
  }
}

async function enrollNow() {
  const btn = document.getElementById("enroll-btn");
  if (btn) { btn.textContent = "Enrolling…"; btn.disabled = true; }

  const res  = await fetch("../php/enrollment.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ course_id: currentCourseId })
  });
  const data = await res.json();

  if (data.success) {
    isEnrolled = true;
    renderEnrollButton();
    // Reload lessons to show Open buttons
    loadCourseDetails();
  } else {
    alert(data.message || "Enrollment failed.");
    if (btn) { btn.textContent = "Enroll Now"; btn.disabled = false; }
  }
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
