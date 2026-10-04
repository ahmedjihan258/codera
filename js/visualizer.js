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
const SORTS = {
  bubble: {
    name: "Bubble Sort", time: "O(n²)", space: "O(1)", best: "O(n)",
    short: "Repeatedly swaps adjacent elements that are in the wrong order.",
    desc: "Bubble Sort steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The largest element \"bubbles\" to the end after each pass.",
    code: [
      "for i from 0 to n-2:",
      "  swapped = false",
      "  for j from 0 to n-i-2:",
      "    if arr[j] > arr[j+1]:",
      "      swap(arr[j], arr[j+1])",
      "      swapped = true",
      "  if not swapped: break"
    ],
    gen: function* (a, c) {
      const n = a.length;
      for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        yield { line: 0, msg: `Pass ${i + 1} — comparing adjacent elements` };
        for (let j = 0; j < n - i - 1; j++) {
          yield { line: 3, cmp: [j, j + 1], msg: `Compare ${a[j]} and ${a[j + 1]}` };
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]]; swapped = true;
            yield { line: 4, swap: [j, j + 1], msg: `Swapped → ${a[j]}, ${a[j + 1]}` };
          }
        }
        c.sorted.add(n - 1 - i);
        yield { line: 6, msg: `${a[n - 1 - i]} is now in its final place` };
        if (!swapped) { yield { line: 6, msg: "No swaps in this pass — already sorted, early exit!" }; return; }
      }
    }
  },
  selection: {
    name: "Selection Sort", time: "O(n²)", space: "O(1)", best: "O(n²)",
    short: "Finds the minimum of the unsorted part and puts it at the front.",
    desc: "Selection Sort repeatedly finds the smallest element in the unsorted part and swaps it into the next position of the sorted part.",
    code: [
      "for i from 0 to n-2:",
      "  min = i",
      "  for j from i+1 to n-1:",
      "    if arr[j] < arr[min]:",
      "      min = j",
      "  swap(arr[i], arr[min])"
    ],
    gen: function* (a, c) {
      const n = a.length;
      for (let i = 0; i < n - 1; i++) {
        let min = i;
        yield { line: 1, pivot: min, msg: `Pass ${i + 1} — assume ${a[min]} (index ${i}) is the minimum` };
        for (let j = i + 1; j < n; j++) {
          yield { line: 3, cmp: [j], pivot: min, msg: `Compare ${a[j]} with current min ${a[min]}` };
          if (a[j] < a[min]) { min = j; yield { line: 4, pivot: min, msg: `New minimum found: ${a[min]}` }; }
        }
        if (min !== i) {
          [a[i], a[min]] = [a[min], a[i]];
          yield { line: 5, swap: [i, min], msg: `Swapped ${a[min]} and ${a[i]}` };
        }
        c.sorted.add(i);
        yield { line: 5, msg: `${a[i]} placed at index ${i}` };
      }
    }
  },
  insertion: {
    name: "Insertion Sort", time: "O(n²)", space: "O(1)", best: "O(n)",
    short: "Builds the sorted list one element at a time, like sorting cards.",
    desc: "Insertion Sort takes each element and inserts it into the correct position among the already-sorted elements to its left.",
    code: [
      "for i from 1 to n-1:",
      "  j = i",
      "  while j > 0 and arr[j-1] > arr[j]:",
      "    swap(arr[j-1], arr[j])",
      "    j = j - 1"
    ],
    gen: function* (a, c) {
      const n = a.length;
      for (let i = 1; i < n; i++) {
        yield { line: 1, pivot: i, msg: `Take ${a[i]} and insert it into the sorted left part` };
        let j = i;
        while (j > 0) {
          yield { line: 2, cmp: [j - 1, j], msg: `Compare ${a[j - 1]} and ${a[j]}` };
          if (a[j - 1] > a[j]) {
            [a[j - 1], a[j]] = [a[j], a[j - 1]];
            yield { line: 3, swap: [j - 1, j], msg: `Shifted ${a[j]} right` };
            j--;
          } else break;
        }
      }
    }
  },
  merge: {
    name: "Merge Sort", time: "O(n log n)", space: "O(n)", best: "O(n log n)",
    short: "Divides the array in halves, sorts each, then merges them.",
    desc: "Merge Sort is a divide-and-conquer algorithm: split the array in half, sort each half recursively, then merge the two sorted halves.",
    code: [
      "mergeSort(l, r):",
      "  if l >= r: return",
      "  m = floor((l + r) / 2)",
      "  mergeSort(l, m)",
      "  mergeSort(m+1, r)",
      "  merge(l, m, r):",
      "    while left and right have items:",
      "      write the smaller front item",
      "    copy the leftover items"
    ],
    gen: function* (a, c) {
      function* ms(l, r) {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        yield { line: 2, range: [l, r], msg: `Divide [${l}..${r}] into [${l}..${m}] and [${m + 1}..${r}]` };
        yield* ms(l, m);
        yield* ms(m + 1, r);
        const L = a.slice(l, m + 1), R = a.slice(m + 1, r + 1);
        let i = 0, j = 0, k = l;
        yield { line: 5, range: [l, r], msg: `Merge [${L.join(", ")}] and [${R.join(", ")}]` };
        while (i < L.length && j < R.length) {
          yield { line: 6, range: [l, r], cmp: [l + i, m + 1 + j], msg: `Compare ${L[i]} and ${R[j]}` };
          a[k] = L[i] <= R[j] ? L[i++] : R[j++];
          yield { line: 7, range: [l, r], write: [k], msg: `Write ${a[k]} at index ${k}` };
          k++;
        }
        while (i < L.length) { a[k] = L[i++]; yield { line: 8, range: [l, r], write: [k], msg: `Write leftover ${a[k]} at index ${k}` }; k++; }
        while (j < R.length) { a[k] = R[j++]; yield { line: 8, range: [l, r], write: [k], msg: `Write leftover ${a[k]} at index ${k}` }; k++; }
      }
      yield* ms(0, a.length - 1);
    }
  },
  quick: {
    name: "Quick Sort", time: "O(n log n)", space: "O(log n)", best: "O(n log n)",
    short: "Picks a pivot and partitions smaller / larger elements around it.",
    desc: "Quick Sort picks a pivot (here, the last element), moves smaller elements to its left and larger to its right, then sorts both sides recursively.",
    code: [
      "quickSort(lo, hi):",
      "  if lo >= hi: return",
      "  pivot = arr[hi];  i = lo",
      "  for j from lo to hi-1:",
      "    if arr[j] < pivot:",
      "      swap(arr[i], arr[j]);  i++",
      "  swap(arr[i], arr[hi])",
      "  quickSort(lo, i-1)",
      "  quickSort(i+1, hi)"
    ],
    gen: function* (a, c) {
      function* qs(lo, hi) {
        if (lo > hi) return;
        if (lo === hi) { c.sorted.add(lo); yield { line: 1, msg: `${a[lo]} is alone — in place` }; return; }
        const pv = a[hi];
        let i = lo;
        yield { line: 2, range: [lo, hi], pivot: hi, msg: `Partition [${lo}..${hi}] with pivot ${pv}` };
        for (let j = lo; j < hi; j++) {
          yield { line: 4, range: [lo, hi], pivot: hi, cmp: [j], msg: `Compare ${a[j]} with pivot ${pv}` };
          if (a[j] < pv) {
            if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; yield { line: 5, range: [lo, hi], pivot: hi, swap: [i, j], msg: `Swapped ${a[j]} and ${a[i]}` }; }
            i++;
          }
        }
        if (i !== hi) { [a[i], a[hi]] = [a[hi], a[i]]; yield { line: 6, range: [lo, hi], swap: [i, hi], msg: `Pivot ${pv} moved to index ${i}` }; }
        c.sorted.add(i);
        yield { line: 6, msg: `Pivot ${pv} is in its final place (index ${i})` };
        yield { line: 7, msg: `Sort the left part [${lo}..${i - 1}]` };
        yield* qs(lo, i - 1);
        yield { line: 8, msg: `Sort the right part [${i + 1}..${hi}]` };
        yield* qs(i + 1, hi);
      }
      yield* qs(0, a.length - 1);
    }
  },
  heap: {
    name: "Heap Sort", time: "O(n log n)", space: "O(1)", best: "O(n log n)",
    short: "Builds a max-heap, then repeatedly extracts the largest element.",
    desc: "Heap Sort first turns the array into a max-heap, then repeatedly swaps the root (largest) with the last element and restores the heap.",
    code: [
      "buildMaxHeap(arr)",
      "for end from n-1 down to 1:",
      "  swap(arr[0], arr[end])",
      "  heapify(arr, 0, end)",
      "",
      "heapify(i):",
      "  largest = max(parent, left, right)",
      "  if largest != i: swap, keep going down"
    ],
    gen: function* (a, c) {
      const n = a.length;
      function* heapify(size, i) {
        while (true) {
          let big = i; const l = 2 * i + 1, r = 2 * i + 2;
          if (l < size) { yield { line: 6, cmp: [big, l], msg: `Compare parent ${a[big]} with left child ${a[l]}` }; if (a[l] > a[big]) big = l; }
          if (r < size) { yield { line: 6, cmp: [big, r], msg: `Compare ${a[big]} with right child ${a[r]}` }; if (a[r] > a[big]) big = r; }
          if (big === i) return;
          [a[i], a[big]] = [a[big], a[i]];
          yield { line: 7, swap: [i, big], msg: `Swapped ${a[big]} and ${a[i]} to keep heap order` };
          i = big;
        }
      }
      yield { line: 0, msg: "Step 1: build a max-heap" };
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) yield* heapify(n, i);
      yield { line: 0, msg: `Max-heap built — root is ${a[0]}` };
      for (let end = n - 1; end > 0; end--) {
        [a[0], a[end]] = [a[end], a[0]];
        c.sorted.add(end);
        yield { line: 2, swap: [0, end], msg: `Moved max ${a[end]} to index ${end}` };
        yield { line: 3, msg: `Restore the heap for the first ${end} items` };
        yield* heapify(end, 0);
      }
    }
  },
  shell: {
    name: "Shell Sort", time: "O(n²)", space: "O(1)", best: "O(n log n)",
    short: "Insertion sort over shrinking gaps to move items far quickly.",
    desc: "Shell Sort improves Insertion Sort by comparing elements that are far apart first, then reducing the gap until it becomes 1.",
    code: [
      "gap = n / 2",
      "while gap > 0:",
      "  for i from gap to n-1:",
      "    j = i",
      "    while j >= gap and arr[j-gap] > arr[j]:",
      "      swap(arr[j-gap], arr[j]);  j -= gap",
      "  gap = gap / 2"
    ],
    gen: function* (a, c) {
      const n = a.length;
      for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        yield { line: 1, msg: `Gap = ${gap}` };
        for (let i = gap; i < n; i++) {
          let j = i;
          while (j >= gap) {
            yield { line: 4, cmp: [j - gap, j], msg: `Compare ${a[j - gap]} and ${a[j]} (gap ${gap})` };
            if (a[j - gap] > a[j]) {
              [a[j - gap], a[j]] = [a[j], a[j - gap]];
              yield { line: 5, swap: [j - gap, j], msg: `Swapped ${a[j]} and ${a[j - gap]}` };
              j -= gap;
            } else break;
          }
        }
        yield { line: 6, msg: `Finished gap ${gap}` };
      }
    }
  }
};

const sortState = { key: null, arr: [], work: [], gen: null, ctx: null, timer: null,
                    status: "idle", comps: 0, moves: 0, delay: 300, last: {} };

function initSorting() {
  const grid = document.getElementById("sort-grid");
  if (!grid) return;
  grid.innerHTML = Object.entries(SORTS).map(([k, s]) => `
    <div class="sort-card" onclick="openSort('${k}')" tabindex="0" onkeydown="if(event.key==='Enter')openSort('${k}')">
      <h3>${s.name}</h3>
      <p>${s.short}</p>
      <div class="sort-card-tags"><span>Avg ${s.time}</span><span>Space ${s.space}</span></div>
      <button class="btn btn-primary btn-sm sort-card-btn" onclick="event.stopPropagation();openSort('${k}')">Visualize →</button>
    </div>`).join("");
}

function openSort(key) {
  const s = SORTS[key];
  sortState.key = key;
  document.getElementById("sort-list-view").style.display = "none";
  document.getElementById("sort-detail-view").style.display = "block";
  document.getElementById("sort-title").textContent = s.name + " Visualizer";
  document.getElementById("sort-about-title").textContent = "How " + s.name + " Works";
  document.getElementById("sort-about").innerHTML = `
    <p><strong>${s.name}</strong> — ${s.desc}</p>
    <p style="margin-top:10px;color:var(--text-muted);">Best: <strong>${s.best}</strong> &nbsp;|&nbsp; Average/Worst: <strong>${s.time}</strong> &nbsp;|&nbsp; Space: <strong>${s.space}</strong></p>`;
  document.getElementById("sort-code").innerHTML = s.code.map((ln, i) =>
    `<div class="code-line" id="code-line-${i}"><span class="code-no">${i + 1}</span><span class="code-text">${ln.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") || "&nbsp;"}</span></div>`).join("");
  resetSort();
}

function closeSort() {
  stopTimer();
  sortState.status = "idle";
  document.getElementById("sort-detail-view").style.display = "none";
  document.getElementById("sort-list-view").style.display = "block";
}

function parseSortInput() {
  return document.getElementById("sort-input").value.split(",")
    .map(v => parseInt(v.trim())).filter(v => !isNaN(v)).slice(0, 12);
}

function randomSort() {
  const n = 8 + Math.floor(Math.random() * 3);
  document.getElementById("sort-input").value =
    Array.from({ length: n }, () => 5 + Math.floor(Math.random() * 95)).join(", ");
  resetSort();
}

function stopTimer() { clearTimeout(sortState.timer); sortState.timer = null; }

function resetSort() {
  stopTimer();
  sortState.arr = parseSortInput();
  sortState.work = [...sortState.arr];
  sortState.gen = null;
  sortState.ctx = { sorted: new Set() };
  sortState.comps = 0; sortState.moves = 0; sortState.last = {};
  sortState.status = "idle";
  renderBars();
  highlightCode(null);
  document.getElementById("sort-log").innerHTML = "<div class='log-line'>— Ready. Press Start to begin —</div>";
  updateSortUI();
}

function renderBars() {
  const { work: arr, last, ctx } = sortState;
  const chart = document.getElementById("bar-chart");
  const maxVal = Math.max(...arr, 1);
  const done = sortState.status === "done";
  chart.innerHTML = arr.map((v, i) => {
    let cls = "bar";
    if (done || ctx.sorted.has(i)) cls += " sorted";
    else if (last.swap && last.swap.includes(i)) cls += " swapping";
    else if (last.write && last.write.includes(i)) cls += " swapping";
    else if (last.cmp && last.cmp.includes(i)) cls += " comparing";
    else if (last.pivot === i) cls += " pivot";
    else if (last.range && (i < last.range[0] || i > last.range[1])) cls += " dim";
    const h = Math.max(8, Math.round((v / maxVal) * 210));
    return `<div class="${cls}" style="height:${h}px"><div class="bar-val">${v}</div></div>`;
  }).join("");
}

function highlightCode(line) {
  document.querySelectorAll("#sort-code .code-line.active").forEach(e => e.classList.remove("active"));
  if (line === undefined || line === null) return;
  const el = document.getElementById("code-line-" + line);
  if (el) el.classList.add("active");
}

function logStep(msg, current = false) {
  const log = document.getElementById("sort-log");
  if (current || msg.startsWith("✓")) {
    log.querySelectorAll(".log-line.current").forEach(e => e.classList.remove("current"));
  }
  log.innerHTML += `<div class='log-line${current ? " current" : ""}'><span>→</span> ${msg}</div>`;
  while (log.children.length > 300) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

function updateSortUI() {
  const st = sortState.status;
  const main = document.getElementById("sort-main-btn");
  main.textContent = { idle: "▶ Start", running: "Running…", paused: "▶ Resume", done: "↻ Run Again" }[st];
  main.className = "btn btn-primary";
  main.disabled = st === "running";
  document.getElementById("sort-pause-btn").disabled = st !== "running";
  document.getElementById("sort-step-btn").disabled = st === "running" || st === "done";
  document.getElementById("sort-input").disabled = st === "running" || st === "paused";
  document.getElementById("sort-random-btn").disabled = st === "running" || st === "paused";
  document.getElementById("sort-status").textContent =
    { idle: "Ready", running: "Running", paused: "Paused", done: "Completed" }[st];
  document.getElementById("sort-status").className = "sort-status " + st;
  document.getElementById("sort-comps").textContent = sortState.comps;
  document.getElementById("sort-moves").textContent = sortState.moves;
}

function toggleSort() {
  const st = sortState.status;
  if (st === "running") return;
  if (st === "done") resetSort();
  if (sortState.status === "idle") {
    if (!beginSort()) return;
    document.getElementById("sort-log").innerHTML = "";
    logStep(`Starting ${SORTS[sortState.key].name}…`);
  }
  sortState.status = "running";
  updateSortUI();
  tick();
}

function beginSort() {
  const arr = parseSortInput();
  if (arr.length < 2) { alert("Enter at least 2 numbers."); return false; }
  sortState.arr = arr;
  sortState.work = [...arr];
  sortState.ctx = { sorted: new Set() };
  sortState.comps = 0; sortState.moves = 0; sortState.last = {};
  sortState.gen = SORTS[sortState.key].gen(sortState.work, sortState.ctx);
  return true;
}

function pauseSort() {
  if (sortState.status !== "running") return;
  stopTimer();
  sortState.status = "paused";
  logStep("⏸ Paused");
  updateSortUI();
}

function stepSort() {
  if (sortState.status === "done" || sortState.status === "running") return;
  if (sortState.status === "idle") {
    if (!beginSort()) return;
    document.getElementById("sort-log").innerHTML = "";
    logStep(`Starting ${SORTS[sortState.key].name}…`);
    sortState.status = "paused";
  }
  advance();
}

function tick() {
  if (sortState.status !== "running") return;
  advance();
  if (sortState.status === "running") {
    sortState.timer = setTimeout(tick, parseInt(document.getElementById("sort-speed").value));
  }
}

function advance() {
  const r = sortState.gen.next();
  if (r.done) {
    stopTimer();
    sortState.status = "done";
    sortState.last = {};
    renderBars();
    highlightCode(null);
    logStep("✓ Sorting complete! Final array: [" + sortState.work.join(", ") + "]");
    updateSortUI();
    return;
  }
  const ev = r.value;
  sortState.last = ev;
  if (ev.cmp) sortState.comps++;
  if (ev.swap || ev.write) sortState.moves++;
  renderBars();
  highlightCode(ev.line);
  if (ev.msg) logStep(ev.msg, true);
  updateSortUI();
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
