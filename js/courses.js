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

  startCooldownTicker();
})();

/* Ticks every visible ⏳ countdown down by one second, live, so hours/mins/secs
   actually move instead of showing a number frozen at page-load time. When one
   hits zero, reload this page's data so the button unlocks automatically. */
let cooldownTickerStarted = false;
function startCooldownTicker() {
  if (cooldownTickerStarted) return;
  cooldownTickerStarted = true;
  setInterval(() => {
    let expired = false;
    document.querySelectorAll(".cooldown-timer").forEach(el => {
      const remaining = Math.max(0, parseInt(el.dataset.remaining, 10) - 1);
      el.dataset.remaining = remaining;
      if (remaining <= 0) { expired = true; return; }
      const textEl = el.querySelector(".cooldown-text");
      if (textEl) textEl.textContent = formatRemaining(remaining);
    });
    if (expired) loadCourseDetails();
  }, 1000);
}

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

  // Load this course's quizzes (module quizzes + optional final quiz)
  let quizzes = [];
  try {
    const qRes  = await fetch(`../php/quiz.php?course_id=${currentCourseId}`);
    const qData = await qRes.json();
    if (qData.success) quizzes = qData.quizzes;
  } catch { /* lessons still work without quizzes */ }

  const moduleQuiz = {};
  let finalQuiz = null;
  quizzes.forEach(q => { if (q.module_name) moduleQuiz[q.module_name] = q; else finalQuiz = q; });

  // Group lessons by module (keeps their order)
  const modules = [];
  pData.lessons.forEach((l, i) => {
    let m = modules.find(x => x.name === l.module_name);
    if (!m) { m = { name: l.module_name, lessons: [] }; modules.push(m); }
    m.lessons.push({ ...l, num: i + 1 });
  });

  lessonList.innerHTML = modules.map(m => {
    const moduleLocked = m.lessons[0]?.locked; // every lesson in a module shares the same lock state
    return `
    <div class="module-block" style="margin-bottom:22px;${moduleLocked ? "opacity:.6;" : ""}">
      <p class="section-label" style="margin-bottom:8px;">
        ${moduleLocked ? "🔒 " : ""}${escHtml(m.name)}
      </p>
      ${m.lessons.map(l => `
        <div class="lesson-list-item">
          <div class="lesson-num">${l.num}</div>
          <div class="lesson-info">
            <h4>${l.title}</h4>
          </div>
          ${l.completed ? '<span class="badge badge-easy">✓ Done</span>' : ""}
          ${isEnrolled && !l.locked
            ? `<a href="learning.html?course=${currentCourseId}&lesson=${l.id}" class="btn btn-outline-dark btn-sm" style="margin-left:auto;">Open</a>`
            : isEnrolled ? `<span class="text-muted text-sm" style="margin-left:auto;" title="Pass the previous module's quiz to unlock">🔒</span>` : ""}
        </div>`).join("")}
      ${moduleQuizRow(moduleQuiz[m.name])}
    </div>`;
  }).join("");

  // Final (course-wide) quiz card, only when the course has one
  const finalWrap = document.getElementById("final-quiz-wrap");
  if (finalWrap) {
    if (finalQuiz) {
      finalWrap.innerHTML = `
        <div class="card">
          <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
            <div>
              <h4 style="font-weight:700;">Final Course Quiz</h4>
              <p class="text-muted text-sm mt-8">${!isEnrolled
                ? "🔒 Enroll in this course to unlock the final quiz."
                : finalQuiz.locked ? "🔒 " + escHtml(finalQuiz.locked_reason)
                : "Test your knowledge of the whole course."}</p>
            </div>
            ${quizButton(finalQuiz)}
          </div>
        </div>`;
      finalWrap.style.display = "block";
    } else {
      finalWrap.style.display = "none";
    }
  }
}

function escHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatRemaining(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const pad = n => String(n).padStart(2, "0");
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
}

/* Button for a quiz: real link when unlocked, disabled otherwise. Reflects
   enrollment, module order, the final-quiz gate, and the retry cooldown. */
function quizButton(q) {
  if (!isEnrolled || q.locked) {
    const reason = !isEnrolled ? "Enroll in this course to take the quiz" : q.locked_reason;
    return `<button class="btn btn-outline-dark btn-sm" style="flex-shrink:0;opacity:.7;cursor:not-allowed;" disabled
              title="${escHtml(reason)}">🔒 Locked</button>`;
  }
  if (q.cooldown_seconds > 0) {
    return `<button class="btn btn-outline-dark btn-sm cooldown-timer" data-remaining="${Math.floor(q.cooldown_seconds)}"
              style="flex-shrink:0;opacity:.7;cursor:not-allowed;" disabled
              title="You didn't pass last time — try again later">⏳ Retry in <span class="cooldown-text">${formatRemaining(q.cooldown_seconds)}</span></button>`;
  }
  const label = q.best_percent !== null ? "Retake Quiz" : "Take Quiz";
  return `<a href="quiz.html?course=${currentCourseId}&quiz=${q.id}" class="btn btn-primary btn-sm" style="flex-shrink:0;">${label}</a>`;
}

/* The "Module quiz" row shown under the lessons of a module */
function moduleQuizRow(q) {
  if (!q || q.question_count === 0) return "";
  const best = q.best_percent !== null
    ? `<span class="badge ${q.passed ? "badge-easy" : "badge-hard"}" style="margin-right:8px;">
         ${q.passed ? "✓ Passed" : "Best"}: ${q.best_percent}%</span>` : "";
  const note = !isEnrolled ? "Enroll to unlock"
             : q.locked ? "Locked"
             : q.cooldown_seconds > 0 ? "On cooldown" : "";
  return `
    <div style="display:flex;align-items:center;gap:12px;margin-top:10px;padding:12px 14px;
                background:var(--bg);border:1.5px dashed var(--border);border-radius:var(--radius);">
      <span style="font-size:1.2rem;">📝</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:.9rem;">Module Quiz</div>
        ${note ? `<div class="text-muted text-sm">${note}</div>` : ""}
      </div>
      ${best}${quizButton(q)}
    </div>`;
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
