/* quiz */

let quizData    = null;
let courseId    = null;
let userAnswers = {};

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);

  const params = new URLSearchParams(window.location.search);
  courseId     = parseInt(params.get("course"));
  if (!courseId) { window.location.href = "courses.html"; return; }

  // Back link
  document.getElementById("back-link").href = `course-details.html?id=${courseId}`;
  document.getElementById("course-link").href = `course-details.html?id=${courseId}`;

  await loadQuiz();
})();

async function loadQuiz() {
  const res  = await fetch(`../php/quiz.php?course_id=${courseId}`);
  const data = await res.json();

  document.getElementById("quiz-loading").style.display = "none";

  if (!data.success) {
    document.getElementById("quiz-section").innerHTML = `
      <div class="empty-state"><div class="icon">❓</div><h3>${data.message || "No quiz available."}</h3></div>`;
    document.getElementById("quiz-section").style.display = "block";
    return;
  }

  quizData    = data;
  userAnswers = {};

  // Populate header
  document.getElementById("quiz-title").textContent        = data.quiz.title;
  document.getElementById("quiz-course-label").textContent = "Course Quiz";
  document.getElementById("q-count-label").textContent     = data.questions.length + " questions";

  // Best previous attempt
  if (data.best) {
    const pct = Math.round((data.best.score / data.best.total) * 100);
    document.getElementById("best-score-text").textContent =
      `${data.best.score}/${data.best.total} (${pct}%) — ${new Date(data.best.attempted_at).toLocaleDateString()}`;
    document.getElementById("best-score-banner").style.display = "flex";
  }

  renderQuestions();
  document.getElementById("quiz-section").style.display = "block";
}

function renderQuestions() {
  const container = document.getElementById("questions-container");
  const options = ["a", "b", "c", "d"];
  const labels  = { a: "A", b: "B", c: "C", d: "D" };

  container.innerHTML = quizData.questions.map((q, i) => `
    <div class="question-card" id="q-card-${q.id}">
      <div class="question-number">Question ${i + 1} of ${quizData.questions.length}</div>
      <div class="question-text">${q.question}</div>
      <div class="options-grid">
        ${options.map(opt => `
          <label class="option-label" id="opt-${q.id}-${opt}" onclick="selectOption(${q.id}, '${opt}', this)">
            <input type="radio" name="q_${q.id}" value="${opt}" />
            <span class="option-key">${labels[opt]}</span>
            <span>${q["option_" + opt]}</span>
          </label>`).join("")}
      </div>
    </div>`).join("");

  // Progress bar update on change
  document.getElementById("quiz-form").addEventListener("change", updateProgress);
}

function selectOption(qId, opt, labelEl) {
  userAnswers[qId] = opt;
  // Remove selected class from siblings
  document.querySelectorAll(`label[id^="opt-${qId}-"]`).forEach(l => l.classList.remove("selected"));
  labelEl.classList.add("selected");
  updateProgress();
}

function updateProgress() {
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

    const res  = await fetch("../php/quiz.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_id: quizData.quiz.id, answers: userAnswers })
    });
    const result = await res.json();
    if (result.success) showResults(result);
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
    sub = `You scored ${result.score} out of ${result.total}. Outstanding performance!`;
  } else if (pct >= 60) {
    feedback = "Good job! 👍";
    sub = `You scored ${result.score} out of ${result.total}. Review the missed questions.`;
  } else {
    feedback = "Keep practicing! 💪";
    sub = `You scored ${result.score} out of ${result.total}. Go over the course material and try again.`;
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
        <div class="question-text">${q.question}</div>
        <div class="options-grid">
          ${opts.map(opt => {
            let cls = "";
            if (opt === fb.expected) cls = "correct";
            else if (opt === fb.your && !ok) cls = "wrong";
            return `
              <div class="option-label ${cls}">
                <span class="option-key">${opt.toUpperCase()}</span>
                <span>${q["option_" + opt]}</span>
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
