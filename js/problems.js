/* for problems */

let allProblems = [];
let currentProblemId = null;
let currentProblemTestCases = [];
let currentLanguage = "javascript";

// Starter code shown when a language is picked (JavaScript starts empty).
const STARTERS = {
  javascript: "",
  c: "#include <stdio.h>\n\nint main() {\n  // read input with scanf, print the answer with printf\n  return 0;\n}\n",
  cpp: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  // read input with cin, print the answer with cout\n  return 0;\n}\n"
};

function onLanguageChange() {
  const editor = document.getElementById("code-editor");
  const prev   = STARTERS[currentLanguage];
  currentLanguage = document.getElementById("lang-select").value;
  // Only swap the text if the student hasn't written anything of their own yet
  if (editor.value.trim() === "" || editor.value === prev) {
    editor.value = STARTERS[currentLanguage];
  }
  document.getElementById("judge-results").innerHTML = "";
}

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);
  await loadProblems();

  // Let Tab insert an actual tab character in the code editor instead of
  // jumping focus to the next element, like a real code editor.
  const editor = document.getElementById("code-editor");
  if (editor) {
    editor.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = editor.selectionStart, end = editor.selectionEnd;
        editor.value = editor.value.slice(0, start) + "  " + editor.value.slice(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
    });
  }
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

  currentProblemId = id;
  currentProblemTestCases = [];

  document.getElementById("modal-title").textContent = p.title;
  const badge = document.getElementById("modal-badge");
  badge.textContent  = p.difficulty;
  badge.className    = `badge badge-${p.difficulty.toLowerCase()}`;
  document.getElementById("modal-desc").textContent   = p.description;
  document.getElementById("modal-input").textContent  = p.example_input || "—";
  document.getElementById("modal-output").textContent = p.example_output || "—";
  document.getElementById("modal-hint").textContent   = p.hint || "Try breaking the problem into smaller steps.";

  // Reset the editor/results/history panels for the newly opened problem
  document.getElementById("code-editor").value = STARTERS[currentLanguage];
  document.getElementById("judge-results").innerHTML = "";
  document.getElementById("judge-status").textContent = "";
  document.getElementById("submission-history").style.display = "none";
  document.getElementById("submission-history").innerHTML = "";
  document.getElementById("history-toggle-icon").textContent = "▾";

  await loadTestCasesForProblem(id);
  loadHistory(id); // don't block modal opening on this

  openModal("problem-modal");
}

let testCaseLoadError = "";

async function loadTestCasesForProblem(problemId) {
  testCaseLoadError = "";
  try {
    const res  = await fetch(`../php/submissions.php?action=get_test_cases&problem_id=${problemId}`);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // The server answered with something that is not JSON (usually a PHP error)
      testCaseLoadError = "Server error from submissions.php: " + text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
      currentProblemTestCases = [];
      return;
    }
    if (!data.success) {
      testCaseLoadError = data.message || "Could not load test cases.";
      currentProblemTestCases = [];
      return;
    }
    currentProblemTestCases = data.test_cases || [];
  } catch (err) {
    console.error("Failed to load test cases:", err);
    testCaseLoadError = "Could not reach the server: " + err.message;
    currentProblemTestCases = [];
  }
}

function toggleHistory() {
  const box  = document.getElementById("submission-history");
  const icon = document.getElementById("history-toggle-icon");
  const isHidden = box.style.display === "none";
  box.style.display = isHidden ? "block" : "none";
  icon.textContent = isHidden ? "▴" : "▾";
}

async function loadHistory(problemId) {
  const box = document.getElementById("submission-history");
  try {
    const res  = await fetch(`../php/submissions.php?action=get_history&problem_id=${problemId}`);
    const data = await res.json();
    if (!data.success || !data.history || data.history.length === 0) {
      box.innerHTML = `<p class="text-muted text-sm" style="padding:8px 0;">No submissions yet for this problem.</p>`;
      return;
    }
    box.innerHTML = data.history.map(h => {
      const when = new Date(h.submitted_at.replace(" ", "T")).toLocaleString();
      const color = h.verdict === "Accepted" ? "#166534" : "#991b1b";
      return `
        <div class="history-row">
          <span style="color:${color};font-weight:700;">${escHtml(h.verdict)}</span>
          <span class="text-muted">${h.passed_count}/${h.total_count} passed</span>
          <span class="text-muted">${when}</span>
        </div>`;
    }).join("");
  } catch (err) {
    box.innerHTML = `<p class="text-muted text-sm">Could not load submission history.</p>`;
  }
}

// ---------- THE JUDGE ----------
// Runs the student's code inside a sandboxed Web Worker (not the main page),
// one test case at a time, with a hard time limit per run to protect against
// infinite loops. Note: since this runs entirely in the browser (no
// server-side execution sandbox), the test cases' expected outputs are sent
// to the client to compare against — a determined student could find them
// in DevTools. That's an accepted trade-off for a local learning tool, not
// a cheat-proof competitive judge.
const JUDGE_WORKER_SRC = `
self.onmessage = function (e) {
  const { code, cases } = e.data;
  for (const tc of cases) {
    const logs = [];
    const fakeConsole = {
      log: function () {
        const parts = Array.prototype.slice.call(arguments).map(function (a) {
          return (typeof a === "string") ? a : JSON.stringify(a);
        });
        logs.push(parts.join(" "));
      }
    };
    try {
      const fn = new Function("console", code + "\\nreturn (" + tc.input + ");");
      const returnValue = fn(fakeConsole);
      postMessage({ id: tc.id, ok: true, returnValue: returnValue, logs: logs.join("\\n") });
    } catch (err) {
      postMessage({ id: tc.id, ok: false, error: (err && err.message) ? err.message : String(err) });
    }
  }
  postMessage({ done: true });
};
`;

function runJudge(testCases, code, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const blob   = new Blob([JUDGE_WORKER_SRC], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    const resultsById = {};
    let finished = false;

    const finish = (results) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(results);
    };

    const timer = setTimeout(() => {
      testCases.forEach(tc => {
        if (!resultsById[tc.id]) {
          resultsById[tc.id] = { id: tc.id, ok: false, error: "Time limit exceeded (possible infinite loop)." };
        }
      });
      finish(testCases.map(tc => resultsById[tc.id]));
    }, timeoutMs);

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.done) {
        finish(testCases.map(tc => resultsById[tc.id] || { id: tc.id, ok: false, error: "No result returned." }));
        return;
      }
      resultsById[msg.id] = msg;
    };

    worker.onerror = (err) => {
      testCases.forEach(tc => {
        if (!resultsById[tc.id]) resultsById[tc.id] = { id: tc.id, ok: false, error: err.message || "Worker error." };
      });
      finish(testCases.map(tc => resultsById[tc.id]));
    };

    worker.postMessage({ code, cases: testCases.map(tc => ({ id: tc.id, input: tc.input })) });
  });
}

// Compares a worker result against a test case's stored expected_output.
// expected_output is itself a JS expression string (e.g. "10", '"olleh"',
// "[1, 2, 3]") — we eval it the same way we eval the student's call, so both
// sides are real JS values, then deep-compare. If it doesn't parse as valid
// JS (legacy/plain-text data), we fall back to a plain string comparison.
function compareResult(raw, expectedRaw) {
  if (!raw || raw.ok === false) {
    return { passed: false, actual: null, expected: undefined, error: raw ? raw.error : "No result." };
  }

  const actual = raw.returnValue !== undefined ? raw.returnValue : raw.logs;

  let expected, expectedParsed = true;
  try {
    expected = new Function('"use strict"; return (' + expectedRaw + ");")();
  } catch {
    expectedParsed = false;
    expected = expectedRaw;
  }

  let passed;
  try {
    passed = expectedParsed
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : String(actual).trim() === String(expected).trim();
  } catch {
    passed = actual === expected;
  }

  return { passed, actual, expected };
}

function stringifyForDisplay(v) {
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderResultRow(num, tc, cmp, raw, showDetails) {
  const icon = cmp.passed ? "✅" : "❌";
  if (!showDetails) {
    const errSuffix = raw && raw.ok === false ? ` — ${escHtml(raw.error)}` : "";
    return `<div class="judge-row ${cmp.passed ? "pass" : "fail"}">${icon} Hidden test case #${num}${errSuffix}</div>`;
  }
  if (raw && raw.ok === false) {
    return `<div class="judge-row fail">${icon} <code>${escHtml(tc.input)}</code><br/><span class="text-muted">Error: ${escHtml(raw.error)}</span></div>`;
  }
  return `
    <div class="judge-row ${cmp.passed ? "pass" : "fail"}">
      ${icon} <code>${escHtml(tc.input)}</code><br/>
      <span class="text-muted">Expected: <code>${escHtml(stringifyForDisplay(cmp.expected !== undefined ? cmp.expected : tc.expected_output))}</code>
      — Got: <code>${escHtml(stringifyForDisplay(cmp.actual))}</code></span>
    </div>`;
}

function setJudgeButtonsDisabled(disabled) {
  document.getElementById("run-btn").disabled = disabled;
  document.getElementById("submit-btn").disabled = disabled;
}

async function runCode() {
  const code = document.getElementById("code-editor").value;
  if (!code.trim()) { alert("Write some code first."); return; }
  if (currentLanguage !== "javascript") return runNative("run", code);

  if (currentProblemTestCases.length === 0) await loadTestCasesForProblem(currentProblemId);
  if (testCaseLoadError) {
    document.getElementById("judge-results").innerHTML = `<div class="judge-banner fail">${escHtml(testCaseLoadError)}</div>`;
    return;
  }

  const sampleCases = currentProblemTestCases.filter(tc => tc.is_sample == 1);
  if (sampleCases.length === 0) {
    document.getElementById("judge-results").innerHTML = `<div class="judge-banner info">No visible example is set up for this problem yet — try Submit to check against the full test suite.</div>`;
    return;
  }

  setJudgeButtonsDisabled(true);
  document.getElementById("judge-status").textContent = "Running…";
  document.getElementById("judge-results").innerHTML = "";

  const raws = await runJudge(sampleCases, code);
  const rows = sampleCases.map((tc, i) => {
    const cmp = compareResult(raws[i], tc.expected_output);
    return renderResultRow(i + 1, tc, cmp, raws[i], true);
  });

  document.getElementById("judge-status").textContent = "";
  document.getElementById("judge-results").innerHTML = rows.join("");
  setJudgeButtonsDisabled(false);
}

async function submitCode() {
  const code = document.getElementById("code-editor").value;
  if (!code.trim()) { alert("Write some code first."); return; }
  if (currentLanguage !== "javascript") return runNative("submit", code);

  if (currentProblemTestCases.length === 0) await loadTestCasesForProblem(currentProblemId);
  if (testCaseLoadError) {
    document.getElementById("judge-results").innerHTML = `<div class="judge-banner fail">${escHtml(testCaseLoadError)}</div>`;
    return;
  }

  if (currentProblemTestCases.length === 0) {
    document.getElementById("judge-results").innerHTML = `<div class="judge-banner info">This problem has no test cases set up yet — ask an admin to add some before it can be judged.</div>`;
    return;
  }

  setJudgeButtonsDisabled(true);
  document.getElementById("judge-status").textContent = "Judging…";
  document.getElementById("judge-results").innerHTML = "";

  const raws = await runJudge(currentProblemTestCases, code);

  let passedCount = 0;
  let anyRuntimeError = false;
  const rows = currentProblemTestCases.map((tc, i) => {
    const cmp = compareResult(raws[i], tc.expected_output);
    if (cmp.passed) passedCount++;
    if (raws[i] && raws[i].ok === false) anyRuntimeError = true;
    return renderResultRow(i + 1, tc, cmp, raws[i], tc.is_sample == 1);
  });

  const total = currentProblemTestCases.length;
  let verdict = "Accepted";
  if (passedCount < total) {
    verdict = (anyRuntimeError && passedCount === 0) ? "Runtime Error" : "Wrong Answer";
  }

  const banner = `<div class="judge-banner ${verdict === "Accepted" ? "pass" : "fail"}"><strong>${verdict}</strong> — ${passedCount}/${total} test cases passed</div>`;
  document.getElementById("judge-status").textContent = "";
  document.getElementById("judge-results").innerHTML = banner + rows.join("");
  setJudgeButtonsDisabled(false);

  try {
    await fetch("../php/submissions.php?action=submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_id: currentProblemId,
        code,
        verdict,
        passed_count: passedCount,
        total_count: total
      })
    });
  } catch (err) {
    console.error("Failed to save submission:", err);
  }

  loadHistory(currentProblemId);
}

// ---------- C / C++ (judged on the server by php/run_code.php) ----------
function renderNativeRow(num, r) {
  const icon = r.passed ? "✅" : "❌";
  const cls  = r.passed ? "pass" : "fail";
  if (!r.is_sample) {
    const why = r.error ? ` — ${escHtml(r.error)}` : "";
    return `<div class="judge-row ${cls}">${icon} Hidden test case #${num}${why}</div>`;
  }
  if (r.state === "runtime" || r.state === "timeout") {
    return `<div class="judge-row ${cls}">${icon} <code>${escHtml(r.input)}</code><br/><span class="text-muted">Error: ${escHtml(r.error)}</span></div>`;
  }
  return `
    <div class="judge-row ${cls}">
      ${icon} Input: <code style="white-space:pre-wrap;">${escHtml(r.input)}</code><br/>
      <span class="text-muted">Expected: <code style="white-space:pre-wrap;">${escHtml(r.expected.trim())}</code>
      — Got: <code style="white-space:pre-wrap;">${escHtml((r.actual || "").trim() || "(no output)")}</code></span>
    </div>`;
}

async function runNative(mode, code) {
  setJudgeButtonsDisabled(true);
  document.getElementById("judge-status").textContent = mode === "submit" ? "Compiling & judging…" : "Compiling & running…";
  document.getElementById("judge-results").innerHTML = "";

  const out = document.getElementById("judge-results");
  try {
    const res  = await fetch("../php/run_code.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem_id: currentProblemId, language: currentLanguage, code, mode })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch {
      out.innerHTML = `<div class="judge-banner fail">Server error from run_code.php: ${escHtml(text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300))}</div>`;
      return;
    }

    if (!data.success) {
      out.innerHTML = `<div class="judge-banner fail">${escHtml(data.message || "Something went wrong.")}</div>`;
    } else if (data.status === "no_tests" || data.status === "no_compiler") {
      out.innerHTML = `<div class="judge-banner info">${escHtml(data.message)}</div>`;
    } else if (data.status === "compile_error") {
      out.innerHTML = `<div class="judge-banner fail">Compile Error</div><pre style="white-space:pre-wrap;background:#fef2f2;padding:10px;border-radius:8px;font-size:.82rem;">${escHtml(data.compile_error)}</pre>`;
    } else {
      const rows = data.results.map((r, i) => renderNativeRow(i + 1, r)).join("");
      const banner = mode === "submit"
        ? `<div class="judge-banner ${data.verdict === "Accepted" ? "pass" : "fail"}"><strong>${escHtml(data.verdict)}</strong> — ${data.passed_count}/${data.total_count} test cases passed</div>`
        : "";
      out.innerHTML = banner + rows;
    }
    if (mode === "submit") loadHistory(currentProblemId);
  } catch (err) {
    out.innerHTML = `<div class="judge-banner fail">Could not reach the server: ${escHtml(err.message)}</div>`;
  } finally {
    document.getElementById("judge-status").textContent = "";
    setJudgeButtonsDisabled(false);
  }
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

// Close modal on overlay click
document.getElementById("problem-modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal("problem-modal");
});
