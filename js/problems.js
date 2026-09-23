/* for problems */

let allProblems = [];

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);
  await loadProblems();
})();

async function loadProblems() {
  try {
    const res  = await fetch("../php/problems.php");
    const data = await res.json();
    if (!data.success) throw new Error();
    allProblems = data.problems;
    renderList(allProblems);
  } catch {
    document.getElementById("problems-list").innerHTML = `<p class="text-muted">Could not load problems.</p>`;
  }
}

function renderList(problems) {
  const container = document.getElementById("problems-list");
  if (problems.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">💻</div><h3>No problems found</h3></div>`;
    return;
  }
  container.innerHTML = problems.map((p, i) => `
    <div class="problem-list-item" onclick="openProblem(${p.id})">
      <div class="problem-num">${i + 1}</div>
      <div style="flex:1;">
        <h4>${p.title}</h4>
        <span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
      </div>
      <span style="color:var(--text-muted);font-size:.82rem;">View →</span>
    </div>`).join("");
}

function filterProblems(level, btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const filtered = level === "all" ? allProblems : allProblems.filter(p => p.difficulty === level);
  renderList(filtered);
}

async function openProblem(id) {
  const res  = await fetch(`../php/problems.php?id=${id}`);
  const data = await res.json();
  if (!data.success) return;
  const p = data.problem;

  document.getElementById("modal-title").textContent = p.title;
  const badge = document.getElementById("modal-badge");
  badge.textContent  = p.difficulty;
  badge.className    = `badge badge-${p.difficulty.toLowerCase()}`;
  document.getElementById("modal-desc").textContent   = p.description;
  document.getElementById("modal-input").textContent  = p.example_input || "—";
  document.getElementById("modal-output").textContent = p.example_output || "—";
  document.getElementById("modal-hint").textContent   = p.hint || "Try breaking the problem into smaller steps.";
  document.getElementById("modal-solution").textContent = p.solution || "—";

  // Hide solution by default
  document.getElementById("solution-box").classList.remove("show");

  openModal("problem-modal");
}

function toggleSolution() {
  document.getElementById("solution-box").classList.toggle("show");
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

// Close modal on overlay click
document.getElementById("problem-modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal("problem-modal");
});
