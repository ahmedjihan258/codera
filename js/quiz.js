/* quiz — module based. URL: quiz.html?course=1&quiz=4  (quiz = quizzes.id) */

let quizData    = null;
let courseId    = null;
let quizId      = null;
let userAnswers = {};

// Escape text coming from the database before putting it into innerHTML
// (some answers contain tags such as <a> or <link> that must be shown as text)
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function setCourseLinks(id) {
  document.getElementById("back-link").href   = `course-details.html?id=${id}`;
  document.getElementById("course-link").href = `course-details.html?id=${id}`;
}

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);

  const params = new URLSearchParams(window.location.search);
  courseId     = parseInt(params.get("course")) || null;
  quizId       = parseInt(params.get("quiz"))   || null;

  // No quiz chosen -> send the student to the course page where the module quizzes are listed
  if (!quizId) {
    window.location.href = courseId ? `course-details.html?id=${courseId}` : "courses.html";
    return;
  }
  if (courseId) setCourseLinks(courseId);

  await loadQuiz();
})();

function showMessage(icon, title, text, buttonHtml) {
  document.getElementById("quiz-loading").style.display = "none";
  const box = document.getElementById("quiz-section");
  box.innerHTML = `
    <div class="empty-state">
      <div class="icon">${icon}</div>
      <h3>${esc(title)}</h3>
      ${text ? `<p>${esc(text)}</p>` : ""}
      ${buttonHtml || ""}
    </div>`;
  box.style.display = "block";
}

async function loadQuiz() {
  let data;
  try {
    const res = await fetch(`../php/quiz.php?quiz_id=${quizId}`);
    data = await res.json();
  } catch {
    showMessage("⚠️", "Could not load the quiz.", "Make sure XAMPP is running.");
    return;
  }

  const link = courseId ? `course-details.html?id=${courseId}` : "courses.html";

  // 🔒 Not enrolled in the course this quiz belongs to
  if (data.code === "not_enrolled") {
    showMessage("🔒", "Enroll to take this quiz",
      "Quizzes are available only to students who are enrolled in the course.",
      `<a href="${link}" class="btn btn-primary mt-16">Go to course & enroll</a>`);
    return;
  }

  // 🔒 Previous module (or, for the final quiz, some module) hasn't been passed yet
  if (data.code === "locked_module" || data.code === "locked_final") {
    showMessage("🔒", "This quiz is locked", data.message,
      `<a href="${link}" class="btn btn-primary mt-16">Back to course</a>`);
    return;
  }

  // ⏳ Failed last attempt — on cooldown
  if (data.code === "cooldown") {
    showMessage("⏳", "Take a short break", data.message,
      `<a href="${link}" class="btn btn-outline-dark mt-16">Back to course</a>`);
    return;
  }

  if (!data.success) {
    showMessage("❓", data.message || "No quiz available.");
    return;
  }

  document.getElementById("quiz-loading").style.display = "none";

  quizData    = data;
  userAnswers = {};
  courseId    = parseInt(data.quiz.course_id) || courseId;
  setCourseLinks(courseId);

  if (data.questions.length === 0) {
    showMessage("❓", "This quiz has no questions yet.");
    return;
  }

  // Header
  document.getElementById("quiz-title").textContent        = data.quiz.title;
  document.getElementById("quiz-course-label").textContent =
    data.quiz.module_name
      ? `${data.quiz.course_title} · Module Quiz`
      : `${data.quiz.course_title} · Final Quiz`;
  document.getElementById("q-count-label").textContent     = data.questions.length + " questions";

  // Best previous attempt
  if (data.best) {
    const pct = Math.round((data.best.score / data.best.total) * 100);
    document.getElementById("best-score-text").textContent =
      `${data.best.score}/${data.best.total} (${pct}%) — ${new Date(data.best.attempted_at.replace(" ", "T")).toLocaleDateString()}`;
    document.getElementById("best-score-banner").style.display = "flex";
  }

  renderQuestions();
  updateProgress();
  document.getElementById("quiz-section").style.display = "block";
}

// Fisher–Yates shuffle. The submitted value is still the real option letter
// (a/b/c/d) — only the on-screen ORDER changes, per question, per attempt.
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuestions() {
  const container = document.getElementById("questions-container");
  const labels = { a: "A", b: "B", c: "C", d: "D" };

  container.innerHTML = quizData.questions.map((q, i) => {
    const options = shuffled(["a", "b", "c", "d"]);
    return `
    <div class="question-card" id="q-card-${q.id}">
      <div class="question-number">Question ${i + 1} of ${quizData.questions.length}</div>
      <div class="question-text">${esc(q.question)}</div>
      <div class="options-grid">
        ${options.map(opt => `
          <label class="option-label" id="opt-${q.id}-${opt}" onclick="selectOption(${q.id}, '${opt}', this)">
            <input type="radio" name="q_${q.id}" value="${opt}" />
            <span class="option-key">${labels[opt]}</span>
            <span>${esc(q["option_" + opt])}</span>
          </label>`).join("")}
      </div>
    </div>`;
  }).join("");
}

function selectOption(qId, opt, labelEl) {
  userAnswers[qId] = opt;
  // Remove selected class from siblings
  document.querySelectorAll(`label[id^="opt-${qId}-"]`).forEach(l => l.classList.remove("selected"));
  labelEl.classList.add("selected");
  updateProgress();
}

function updateProgress() {
  if (!quizData) return;
  const answered = Object.keys(userAnswers).length;
  const total    = quizData.questions.length;
  const pct      = total > 0 ? (answered / total) * 100 : 0;
  document.getElementById("q-answered-label").textContent = `${answered} answered`;
  document.getElementById("q-progress-bar").style.width  = pct + "%";
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("quiz-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Check all answered
    if (Object.keys(userAnswers).length < quizData.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    let result;
    try {
      const res = await fetch("../php/quiz.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizData.quiz.id, answers: userAnswers })
      });
      result = await res.json();
    } catch {
      alert("Could not submit the quiz. Make sure XAMPP is running.");
      return;
    }

    if (result.success) {
      showResults(result);
    } else if (["not_enrolled", "locked_module", "locked_final", "cooldown"].includes(result.code)) {
      // Something changed the gate state between opening and submitting (e.g. it
      // took over 6h to answer, or this was their last chance before the cooldown).
      // Re-run loadQuiz(), which renders the right lock/cooldown screen for us.
      loadQuiz();
    } else {
      alert(result.message || "Could not submit the quiz.");
    }
  });
});

function showResults(result) {
  document.getElementById("quiz-section").style.display    = "none";
  document.getElementById("results-section").style.display = "block";

  const pct = result.percent;
  document.getElementById("score-val").textContent       = pct + "%";
  document.getElementById("score-ring").style.setProperty("--pct", pct + "%");

  let feedback, sub;
  if (pct >= 80) {
    feedback = "Excellent work! 🎉";
    sub = `You scored ${result.score} out of ${result.total} — passed! The next module is now unlocked.`;
  } else if (result.passed) {
    feedback = "Good job! 👍";
    sub = `You scored ${result.score} out of ${result.total} — passed! The next module is now unlocked.`;
  } else {
    feedback = "Keep practicing! 💪";
    sub = `You scored ${result.score} out of ${result.total}. You need 60% to pass and unlock the next module. Go over the lessons — you can try again in 6 hours.`;
  }
  document.getElementById("result-feedback").textContent = feedback;
  document.getElementById("result-sub").textContent      = sub;

  // Question review
  const container = document.getElementById("feedback-container");
  const opts      = ["a", "b", "c", "d"];

  container.innerHTML = quizData.questions.map((q, i) => {
    const fb  = result.feedback[q.id] || {};
    const ok  = fb.correct;
    return `
      <div class="question-card" style="margin-bottom:16px;">
        <div class="question-number" style="color:${ok ? "#22c55e" : "#ef4444"}">
          Question ${i + 1} — ${ok ? "✓ Correct" : "✗ Incorrect"}
        </div>
        <div class="question-text">${esc(q.question)}</div>
        ${(!ok && fb.expected === undefined) ? `<p class="text-muted text-sm" style="margin:-4px 0 10px;">Correct answer hidden — score 60%+ overall to reveal it.</p>` : ""}
        <div class="options-grid">
          ${opts.map(opt => {
            let cls = "";
            if (opt === fb.expected) cls = "correct";
            else if (opt === fb.your && !ok) cls = "wrong";
            return `
              <div class="option-label ${cls}">
                <span class="option-key">${opt.toUpperCase()}</span>
                <span>${esc(q["option_" + opt])}</span>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");
}

function retakeQuiz() {
  document.getElementById("results-section").style.display = "none";
  quizData    = null;
  userAnswers = {};
  document.getElementById("quiz-loading").style.display = "block";
  loadQuiz();
}
