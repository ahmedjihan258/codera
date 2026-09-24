// ===== FILE: js/admin.js =====

// Global memory caches to safely reference objects without inline JSON stringifying issues
const adminCache = {
  courses: {},
  lessons: {},
  problems: {}
};

// Structured content blocks for the lesson editor (Add/Edit Lesson modal).
// Each entry: { type: 'heading' | 'paragraph' | 'code' | 'list' | 'html', value: string }
let contentBlocks = [];

const BLOCK_LABELS = {
  heading: "Heading",
  paragraph: "Paragraph",
  code: "Code Block",
  list: "Bullet List",
  html: "Custom HTML"
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function addContentBlock(type, value = "") {
  contentBlocks.push({ type, value });
  renderContentBlocks();
}

function removeContentBlock(index) {
  contentBlocks.splice(index, 1);
  renderContentBlocks();
}

function moveContentBlock(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= contentBlocks.length) return;
  [contentBlocks[index], contentBlocks[target]] = [contentBlocks[target], contentBlocks[index]];
  renderContentBlocks();
}

function updateContentBlockValue(index, value) {
  if (contentBlocks[index]) contentBlocks[index].value = value;
}

function renderContentBlocks() {
  const container = document.getElementById("l-blocks");
  if (!container) return;

  if (contentBlocks.length === 0) {
    container.innerHTML = '<div class="block-empty-state">No content blocks yet. Add a Heading, Paragraph, Code Block, or Bullet List below.</div>';
    return;
  }

  container.innerHTML = contentBlocks.map((block, i) => {
    const controls = `
      <div class="content-block-actions">
        <button type="button" onclick="moveContentBlock(${i}, -1)" title="Move up">↑</button>
        <button type="button" onclick="moveContentBlock(${i}, 1)" title="Move down">↓</button>
        <button type="button" onclick="removeContentBlock(${i})" title="Remove">✕</button>
      </div>`;
    const head = `<div class="content-block-head"><span class="content-block-tag">${BLOCK_LABELS[block.type] || block.type}</span>${controls}</div>`;
    const escapedValue = block.value.replace(/"/g, "&quot;");

    let field = "";
    if (block.type === "heading") {
      field = `<input type="text" value="${escapedValue.replace(/</g, "&lt;")}" placeholder="Heading text" oninput="updateContentBlockValue(${i}, this.value)" />`;
    } else if (block.type === "paragraph") {
      field = `<textarea rows="3" placeholder="Paragraph text" oninput="updateContentBlockValue(${i}, this.value)">${escapeHtml(block.value)}</textarea>
        <div class="content-block-hint">Plain text, or simple inline HTML like &lt;strong&gt;/&lt;code&gt; if needed.</div>`;
    } else if (block.type === "code") {
      field = `<textarea rows="6" class="code-editor" placeholder="Paste code here — no need to escape &lt; &gt; or add <pre><code> tags, that's automatic" oninput="updateContentBlockValue(${i}, this.value)">${escapeHtml(block.value)}</textarea>`;
    } else if (block.type === "list") {
      field = `<textarea rows="4" placeholder="One item per line" oninput="updateContentBlockValue(${i}, this.value)">${escapeHtml(block.value)}</textarea>
        <div class="content-block-hint">Each line becomes one bullet point.</div>`;
    } else {
      field = `<textarea rows="4" placeholder="Raw HTML, inserted as-is" oninput="updateContentBlockValue(${i}, this.value)">${escapeHtml(block.value)}</textarea>`;
    }

    return `<div class="content-block">${head}${field}</div>`;
  }).join("");
}

// Turns the structured blocks into the same kind of HTML the lesson viewer
// already expects (h2/p/pre-code/ul-li), so new lessons render exactly like
// the seeded ones instead of relying on admins hand-writing tags.
function composeLessonContent() {
  return contentBlocks.map(block => {
    switch (block.type) {
      case "heading":
        return `<h2>${block.value}</h2>`;
      case "paragraph":
        return `<p>${block.value}</p>`;
      case "code":
        return `<pre><code>${escapeHtml(block.value)}</code></pre>`;
      case "list": {
        const items = block.value.split("\n").map(l => l.trim()).filter(Boolean);
        return `<ul>${items.map(l => `<li>${l}</li>`).join("")}</ul>`;
      }
      case "html":
        return block.value;
      default:
        return "";
    }
  }).join("\n");
}

// Reverse of composeLessonContent(): reconstructs blocks from an existing
// lesson's stored HTML so it can be edited in the block editor. Anything
// that doesn't map to a known block type falls back to a Custom HTML block
// so no content is ever lost.
function parseContentToBlocks(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html || "";
  const blocks = [];

  wrapper.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) blocks.push({ type: "html", value: node.textContent });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();
    if (tag === "h2" || tag === "h3") {
      blocks.push({ type: "heading", value: node.innerHTML });
    } else if (tag === "p") {
      blocks.push({ type: "paragraph", value: node.innerHTML });
    } else if (tag === "pre") {
      const codeEl = node.querySelector("code");
      blocks.push({ type: "code", value: (codeEl || node).textContent });
    } else if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.querySelectorAll("li")).map(li => li.innerHTML);
      blocks.push({ type: "list", value: items.join("\n") });
    } else {
      blocks.push({ type: "html", value: node.outerHTML });
    }
  });

  return blocks;
}

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadCourses();
  loadLessons();
  loadProblems();
  loadUsers();

  // Attach dynamic listener to course selector in lesson modal
  const lCourseSelect = document.getElementById("l-course-id");
  if (lCourseSelect) {
    // The <select> in admin.html also has an inline onchange="loadCourseModules(this.value)"
    // attribute. Left in place, that fires alongside this addEventListener on every change,
    // causing loadCourseModules() to run twice and duplicate the module list. Clear the inline
    // handler here so this listener is the single source of truth, regardless of the HTML.
    lCourseSelect.onchange = null;
    lCourseSelect.addEventListener("change", (e) => {
      loadCourseModules(e.target.value);
    });
  }
});

// ---------- TAB NAVIGATION ----------
function switchTab(tabName) {
  document.querySelectorAll("section[id^='tab-']").forEach(sec => sec.style.display = "none");
  document.querySelectorAll(".admin-nav-item").forEach(item => item.classList.remove("active"));

  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) targetTab.style.display = "block";

  const activeBtn = Array.from(document.querySelectorAll(".admin-nav-item"))
    .find(el => el.textContent.trim().toLowerCase() === tabName.toLowerCase());
  if (activeBtn) activeBtn.classList.add("active");
}

// ---------- MODAL OPEN / CLOSE ----------
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    modal.style.display = "flex";
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    modal.style.display = "none";
  }
}

// ---------- MODULE SELECTION TOGGLES ----------
function toggleNewModuleInput(val) {
  const customInput = document.getElementById("l-module-custom");
  if (!customInput) return;
  if (val === "__new__") {
    customInput.style.display = "block";
    customInput.value = "";
    customInput.focus();
  } else {
    customInput.style.display = "none";
  }
}

async function loadCourseModules(courseId, selectedModule = "") {
  const moduleSelect = document.getElementById("l-module-select");
  const customInput = document.getElementById("l-module-custom");
  if (!moduleSelect) return;

  moduleSelect.innerHTML = `
    <option value="">-- Select Existing Module --</option>
    <option value="__new__">+ Create New Module</option>
  `;
  if (customInput) customInput.style.display = "none";

  if (!courseId) return;

  try {
    const res = await fetch(`../php/admin.php?action=get_modules&course_id=${courseId}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.modules)) {
      data.modules.forEach(mod => {
        const opt = document.createElement("option");
        opt.value = mod;
        opt.textContent = mod;
        moduleSelect.appendChild(opt);
      });
    }

    if (selectedModule) {
      const exists = Array.from(moduleSelect.options).some(opt => opt.value === selectedModule);
      if (exists) {
        moduleSelect.value = selectedModule;
      } else {
        moduleSelect.value = "__new__";
        if (customInput) {
          customInput.style.display = "block";
          customInput.value = selectedModule;
        }
      }
    }
  } catch (err) {
    console.error("Failed to load modules:", err);
  }
}

// ---------- STATS ----------
async function loadStats() {
  try {
    const res = await fetch("../php/admin.php?action=stats");
    const data = await res.json();
    if (data.success) {
      const cVal = document.getElementById("stat-c-val");
      const lVal = document.getElementById("stat-l-val");
      const pVal = document.getElementById("stat-p-val");
      const uVal = document.getElementById("stat-u-val");

      if (cVal) cVal.textContent = data.stats.courses || 0;
      if (lVal) lVal.textContent = data.stats.lessons || 0;
      if (pVal) pVal.textContent = data.stats.problems || 0;
      if (uVal) uVal.textContent = data.stats.users || 0;
    }
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

// ---------- COURSES ----------
async function loadCourses() {
  try {
    const res = await fetch("../php/admin.php?action=get_courses");
    const data = await res.json();
    const tbody = document.getElementById("tbl-courses");
    const courseSelect = document.getElementById("l-course-id");

    if (tbody) tbody.innerHTML = "";
    if (courseSelect) courseSelect.innerHTML = '<option value="">-- Select Course --</option>';

    if (data.success && data.courses) {
      data.courses.forEach(c => {
        adminCache.courses[c.id] = c;

        if (tbody) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${c.icon || "🌐"}</td>
            <td><strong>${escapeHtml(c.title)}</strong></td>
            <td><span class="badge badge-beginner">${escapeHtml(c.level)}</span></td>
            <td>${escapeHtml(c.duration || '')}</td>
            <td>${c.lesson_count || 0}</td>
            <td class="action-btns">
              <button class="btn btn-outline-dark btn-sm" onclick="editCourse(${c.id})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteCourse(${c.id})">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);
        }

        if (courseSelect) {
          const opt = document.createElement("option");
          opt.value = c.id;
          opt.textContent = c.title;
          courseSelect.appendChild(opt);
        }
      });
    }
  } catch (err) {
    console.error("Error loading courses:", err);
  }
}

function openCourseModal() {
  document.getElementById("c-id").value = "";
  document.getElementById("c-title").value = "";
  document.getElementById("c-desc").value = "";
  document.getElementById("c-level").value = "Beginner";
  document.getElementById("c-duration").value = "";
  document.getElementById("c-icon").value = "🌐";
  document.getElementById("course-modal-title").textContent = "Add Course";
  openModal("modal-course");
}

function editCourse(id) {
  const c = adminCache.courses[id];
  if (!c) return;

  document.getElementById("c-id").value = c.id;
  document.getElementById("c-title").value = c.title;
  document.getElementById("c-desc").value = c.description || "";
  document.getElementById("c-level").value = c.level;
  document.getElementById("c-duration").value = c.duration || "";
  document.getElementById("c-icon").value = c.icon || "🌐";
  document.getElementById("course-modal-title").textContent = "Edit Course";
  openModal("modal-course");
}

async function saveCourse() {
  const id = document.getElementById("c-id").value;
  const payload = {
    action: "save_course",
    id: id || undefined,
    title: document.getElementById("c-title").value.trim(),
    description: document.getElementById("c-desc").value.trim(),
    level: document.getElementById("c-level").value,
    duration: document.getElementById("c-duration").value.trim(),
    icon: document.getElementById("c-icon").value.trim()
  };

  try {
    const res = await fetch("../php/admin.php?action=save_course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      closeModal("modal-course");
      loadCourses();
      loadStats();
    } else {
      alert(data.message || "Failed to save course.");
    }
  } catch (err) {
    console.error("Save course error:", err);
  }
}

async function deleteCourse(id) {
  if (!confirm("Are you sure? This will delete all associated lessons!")) return;
  const res = await fetch(`../php/admin.php?action=delete_course&id=${id}`, { method: "POST" });
  const data = await res.json();
  if (data.success) {
    loadCourses();
    loadLessons();
    loadStats();
  } else {
    alert(data.message || "Failed to delete course.");
  }
}

// ---------- LESSONS ----------
async function loadLessons() {
  try {
    const res = await fetch("../php/admin.php?action=get_lessons");
    const data = await res.json();
    const tbody = document.getElementById("tbl-lessons");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (data.success && data.lessons) {
      data.lessons.forEach(l => {
        adminCache.lessons[l.id] = l;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(l.course_title || "N/A")}</td>
          <td><span class="badge badge-beginner">${escapeHtml(l.module_name || "General")}</span></td>
          <td><strong>${escapeHtml(l.title)}</strong></td>
          <td>${l.order_num}</td>
          <td class="action-btns">
            <button class="btn btn-outline-dark btn-sm" onclick="editLesson(${l.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteLesson(${l.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Error loading lessons:", err);
  }
}

function openLessonModal() {
  const lId = document.getElementById("l-id");
  const lCourse = document.getElementById("l-course-id");
  const lOrder = document.getElementById("l-order");
  const lTitle = document.getElementById("l-title");
  const modalTitle = document.getElementById("lesson-modal-title");

  if (lId) lId.value = "";
  if (lCourse) lCourse.value = "";
  if (lOrder) lOrder.value = "1";
  if (lTitle) lTitle.value = "";
  if (modalTitle) modalTitle.textContent = "Add Lesson";

  contentBlocks = [];
  renderContentBlocks();

  const moduleSelect = document.getElementById("l-module-select");
  if (moduleSelect) moduleSelect.innerHTML = '<option value="">-- Select Course First --</option>';

  const customInput = document.getElementById("l-module-custom");
  if (customInput) {
    customInput.style.display = "none";
    customInput.value = "";
  }

  openModal("modal-lesson");
}

async function editLesson(id) {
  const l = adminCache.lessons[id];
  if (!l) return;

  document.getElementById("l-id").value = l.id;
  document.getElementById("l-course-id").value = l.course_id;
  document.getElementById("l-order").value = l.order_num;
  document.getElementById("l-title").value = l.title;
  document.getElementById("lesson-modal-title").textContent = "Edit Lesson";

  contentBlocks = parseContentToBlocks(l.content || "");
  renderContentBlocks();

  await loadCourseModules(l.course_id, l.module_name);
  openModal("modal-lesson");
}

async function saveLesson() {
  const id = document.getElementById("l-id").value;
  const course_id = document.getElementById("l-course-id").value;
  const module_select = document.getElementById("l-module-select").value;
  const customInput = document.getElementById("l-module-custom");
  const module_custom = customInput ? customInput.value.trim() : "";
  const title = document.getElementById("l-title").value.trim();
  const order_num = document.getElementById("l-order").value;
  const content = composeLessonContent();

  let module_name = module_select;
  if (module_select === "__new__" || !module_select) {
    module_name = module_custom;
  }

  if (!course_id || !module_name || !title) {
    alert("Please select a Course, enter/select a Module name, and provide a Lesson Title.");
    return;
  }

  const payload = {
    action: "save_lesson",
    id: id || undefined,
    course_id,
    module_name,
    title,
    order_num,
    content
  };

  const res = await fetch("../php/admin.php?action=save_lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.success) {
    closeModal("modal-lesson");
    loadLessons();
    loadStats();
  } else {
    alert(data.message || "Failed to save lesson.");
  }
}

async function deleteLesson(id) {
  if (!confirm("Are you sure you want to delete this lesson?")) return;
  const res = await fetch(`../php/admin.php?action=delete_lesson&id=${id}`, { method: "POST" });
  const data = await res.json();
  if (data.success) {
    loadLessons();
    loadStats();
  } else {
    alert(data.message || "Failed to delete lesson.");
  }
}

// ---------- PROBLEMS ----------
async function loadProblems() {
  try {
    const res = await fetch("../php/admin.php?action=get_problems");
    const data = await res.json();
    const tbody = document.getElementById("tbl-problems");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (data.success && data.problems) {
      data.problems.forEach(p => {
        adminCache.problems[p.id] = p;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${escapeHtml(p.title)}</strong></td>
          <td><span class="badge badge-beginner">${escapeHtml(p.difficulty)}</span></td>
          <td class="action-btns">
            <button class="btn btn-outline-dark btn-sm" onclick="editProblem(${p.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProblem(${p.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Error loading problems:", err);
  }
}

function openProblemModal() {
  document.getElementById("p-id").value = "";
  document.getElementById("p-title").value = "";
  document.getElementById("p-diff").value = "Easy";
  document.getElementById("p-desc").value = "";
  document.getElementById("p-in").value = "";
  document.getElementById("p-out").value = "";
  document.getElementById("p-hint").value = "";
  document.getElementById("p-sol").value = "";
  document.getElementById("problem-modal-title").textContent = "Add Problem";
  openModal("modal-problem");
}

function editProblem(id) {
  const p = adminCache.problems[id];
  if (!p) return;

  document.getElementById("p-id").value = p.id;
  document.getElementById("p-title").value = p.title;
  document.getElementById("p-diff").value = p.difficulty;
  document.getElementById("p-desc").value = p.description || "";
  document.getElementById("p-in").value = p.example_input || "";
  document.getElementById("p-out").value = p.example_output || "";
  document.getElementById("p-hint").value = p.hint || "";
  document.getElementById("p-sol").value = p.solution || "";
  document.getElementById("problem-modal-title").textContent = "Edit Problem";
  openModal("modal-problem");
}

async function saveProblem() {
  const id = document.getElementById("p-id").value;
  const payload = {
    action: "save_problem",
    id: id || undefined,
    title: document.getElementById("p-title").value.trim(),
    difficulty: document.getElementById("p-diff").value,
    description: document.getElementById("p-desc").value.trim(),
    example_input: document.getElementById("p-in").value,
    example_output: document.getElementById("p-out").value,
    hint: document.getElementById("p-hint").value,
    solution: document.getElementById("p-sol").value
  };

  const res = await fetch("../php/admin.php?action=save_problem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.success) {
    closeModal("modal-problem");
    loadProblems();
    loadStats();
  } else {
    alert(data.message || "Failed to save problem.");
  }
}

async function deleteProblem(id) {
  if (!confirm("Are you sure you want to delete this problem?")) return;
  const res = await fetch(`../php/admin.php?action=delete_problem&id=${id}`, { method: "POST" });
  const data = await res.json();
  if (data.success) {
    loadProblems();
    loadStats();
  } else {
    alert(data.message || "Failed to delete problem.");
  }
}

// ---------- USERS ----------
async function loadUsers() {
  try {
    const res = await fetch("../php/admin.php?action=get_users");
    const data = await res.json();
    const tbody = document.getElementById("tbl-users");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (data.success && data.users) {
      data.users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.id}</td>
          <td><strong>${escapeHtml(u.full_name)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td>
            <select onchange="updateUserRole(${u.id}, this.value)">
              <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
              <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </td>
          <td>${u.created_at || "N/A"}</td>
          <td class="action-btns">
            <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

async function updateUserRole(id, role) {
  const res = await fetch("../php/admin.php?action=update_user_role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, role })
  });
  const data = await res.json();
  if (!data.success) alert(data.message || "Failed to update role.");
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  const res = await fetch(`../php/admin.php?action=delete_user&id=${id}`, { method: "POST" });
  const data = await res.json();
  if (data.success) {
    loadUsers();
    loadStats();
  } else {
    alert(data.message || "Failed to delete user.");
  }
}

// Helper utility function to prevent XSS and broken HTML render in tables
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
