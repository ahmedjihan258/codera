/* visualizer*/

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);
  initSorting();
})();

//Tab switching
function showTab(name, btn) {
  document.querySelectorAll(".viz-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".viz-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
}

//SORTING VISUALIZER
let sortArr        = [];
let sortRunning    = false;
let sortStepDelay  = 300;

function initSorting() {
  resetSort();
}

function resetSort() {
  const input = document.getElementById("sort-input");
  if (!input) return;
  sortArr = input.value.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v)).slice(0, 12);
  renderBars(sortArr, [], []);
  document.getElementById("sort-log").innerHTML = "<div class='log-line'>— Ready. Press Sort to begin —</div>";
  sortRunning = false;
}

function renderBars(arr, comparing = [], sorted = []) {
  const chart  = document.getElementById("bar-chart");
  const maxVal = Math.max(...arr, 1);
  chart.innerHTML = arr.map((v, i) => {
    let cls = "bar";
    if (sorted.includes(i))    cls += " sorted";
    else if (comparing.includes(i)) cls += " comparing";
    const h = Math.round((v / maxVal) * 140);
    return `<div class="${cls}" style="height:${h}px"><div class="bar-val">${v}</div></div>`;
  }).join("");
}

function logStep(msg) {
  const log = document.getElementById("sort-log");
  log.innerHTML += `<div class='log-line'><span>→</span> ${msg}</div>`;
  log.scrollTop = log.scrollHeight;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function startSort() {
  if (sortRunning) return;
  const input = document.getElementById("sort-input");
  sortArr = input.value.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v)).slice(0, 12);
  if (sortArr.length < 2) { alert("Enter at least 2 numbers."); return; }

  sortStepDelay = parseInt(document.getElementById("sort-speed").value);
  sortRunning   = true;
  document.getElementById("sort-log").innerHTML = "";

  logStep("Starting Bubble Sort…");
  const arr     = [...sortArr];
  const n       = arr.length;
  const sorted  = [];

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    logStep(`Pass ${i + 1} — comparing adjacent elements`);
    for (let j = 0; j < n - i - 1; j++) {
      renderBars(arr, [j, j + 1], sorted);
      await sleep(sortStepDelay);
      if (arr[j] > arr[j + 1]) {
        logStep(`Swapping ${arr[j]} and ${arr[j + 1]}`);
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        renderBars(arr, [j, j + 1], sorted);
        await sleep(sortStepDelay);
      }
    }
    sorted.unshift(n - 1 - i);
    renderBars(arr, [], sorted);
    if (!swapped) { logStep("Array already sorted — early exit!"); break; }
  }
  sorted.push(...Array.from({length: n}, (_, i) => i));
  renderBars(arr, [], sorted);
  logStep("✓ Sorting complete! Final array: [" + arr.join(", ") + "]");
  sortRunning = false;
}

//VARIABLE INSPECTOR
function inspectVars() {
  const input   = document.getElementById("var-input").value.trim();
  const canvas  = document.getElementById("var-canvas");

  if (!input) { canvas.innerHTML = `<p style="color:rgba(255,255,255,.4);font-size:.88rem;">Enter some variable declarations.</p>`; return; }

  // Parse simple declarations: let/const/var name = value;
  const pattern = /(?:let|const|var)\s+(\w+)\s*=\s*([^;]+)/g;
  const rows    = [];
  let match;

  while ((match = pattern.exec(input)) !== null) {
    const name  = match[1];
    const raw   = match[2].trim();
    let value, type;

    if (raw === "true" || raw === "false") {
      value = raw; type = "boolean";
    } else if (!isNaN(raw)) {
      value = raw; type = "number";
    } else if (raw.startsWith('"') || raw.startsWith("'") || raw.startsWith("`")) {
      value = raw; type = "string";
    } else if (raw.startsWith("[")) {
      value = raw; type = "array";
    } else if (raw.startsWith("{")) {
      value = raw; type = "object";
    } else if (raw === "null") {
      value = "null"; type = "null";
    } else if (raw === "undefined") {
      value = "undefined"; type = "undefined";
    } else {
      value = raw; type = "unknown";
    }
    rows.push({ name, value, type });
  }

  if (rows.length === 0) {
    canvas.innerHTML = `<p style="color:rgba(255,255,255,.4);font-size:.88rem;">No valid variable declarations found. Use: let name = value;</p>`;
    return;
  }

  canvas.innerHTML = `
    <table class="var-table">
      <thead><tr><th>Variable</th><th>Value</th><th>Type</th></tr></thead>
      <tbody>
        ${rows.map(r => `
          <tr class="highlight">
            <td style="color:#89b4fa;">${r.name}</td>
            <td style="color:#a6e3a1;">${r.value}</td>
            <td style="color:#f38ba8;">${r.type}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function clearVars() {
  document.getElementById("var-input").value = "";
  document.getElementById("var-canvas").innerHTML = `<p style="color:rgba(255,255,255,.4);font-size:.88rem;">Declare some variables and click Inspect.</p>`;
}

//LOOPS
function runLoop() {
  const start  = parseInt(document.getElementById("loop-start").value);
  const end    = parseInt(document.getElementById("loop-end").value);
  const step   = parseInt(document.getElementById("loop-step").value) || 1;
  const canvas = document.getElementById("loop-canvas");

  if (isNaN(start) || isNaN(end) || step <= 0) {
    canvas.innerHTML = `<p style="color:rgba(255,255,255,.4);">Invalid parameters.</p>`;
    return;
  }
  if ((end - start) / step > 40) {
    canvas.innerHTML = `<p style="color:rgba(255,255,255,.4);">Too many iterations (max 40). Adjust your parameters.</p>`;
    return;
  }

  const steps = [];
  for (let i = start; i < end; i += step) {
    steps.push({ i, condition: `${i} < ${end}`, body: `console.log("i = ${i}")` });
  }

  let html = `<div style="font-family:'Courier New',monospace;color:#cdd6f4;font-size:.85rem;margin-bottom:12px;">
    for (let i = ${start}; i &lt; ${end}; i += ${step}) { }
  </div>`;

  if (steps.length === 0) {
    html += `<div style="color:#f38ba8;">Loop body never executes — condition (${start} &lt; ${end}) is false from the start.</div>`;
  } else {
    html += steps.map((s, idx) => `
      <div class="loop-step ${idx === steps.length - 1 ? "" : ""}">
        <span style="color:#585b70;min-width:80px;">Iteration ${idx + 1}</span>
        <span class="arrow">→</span>
        <span style="color:#89b4fa;">i = ${s.i}</span>
        <span style="color:#585b70;margin-left:12px;">Condition: ${s.condition} ✓</span>
        <span style="color:#a6e3a1;margin-left:12px;">${s.body}</span>
      </div>`).join("");
    html += `<div class="loop-step" style="border-top:1px solid rgba(255,255,255,.1);margin-top:6px;padding-top:8px;">
      <span style="color:#585b70;min-width:80px;">Exit</span>
      <span class="arrow">→</span>
      <span style="color:#f38ba8;">i = ${steps[steps.length-1].i + step} — condition ${steps[steps.length-1].i + step} &lt; ${end} is false</span>
    </div>`;
  }

  canvas.innerHTML = html;
}

function clearLoop() {
  document.getElementById("loop-canvas").innerHTML = `<p style="color:rgba(255,255,255,.4);font-size:.88rem;">Set loop parameters and click Run.</p>`;
}
