/* for dashboard */


(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);

  try {
    const res  = await fetch("../php/dashboard.php");
    const data = await res.json();

    if (!data.success) return;

    // Header
    document.getElementById("dash-name").textContent    = data.user.full_name;
    document.getElementById("dash-avatar").textContent  = data.user.full_name[0].toUpperCase();
    document.getElementById("dash-joined").textContent  =
      "Member since " + new Date(data.user.created_at).toLocaleDateString("en-US", { year:"numeric", month:"long" });

    // Stats
    document.getElementById("stat-enrolled").textContent  = data.total_enrolled;
    document.getElementById("stat-completed").textContent = data.total_completed;
    document.getElementById("stat-lessons").textContent   = data.lessons_done;

    // Enrolled courses
    const container = document.getElementById("enrolled-courses-list");
    if (data.courses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📚</div>
          <h3>No courses yet</h3>
          <p>Browse courses and enroll to start learning.</p>
          <a href="courses.html" class="btn btn-primary mt-16">Browse Courses</a>
        </div>`;
    } else {
      container.innerHTML = data.courses.map(c => `
        <div class="card" style="margin-bottom:14px;">
          <div class="course-card-enrolled">
            <div class="course-top">
              <div class="course-icon">${c.icon}</div>
              <div>
                <h4>${c.title}</h4>
                <p class="meta">${c.level} · ${c.duration}</p>
              </div>
            </div>
            <div>
              <div class="progress-label">
                <span>Progress</span>
                <span>${c.done_lessons} / ${c.total_lessons} lessons — ${c.percent}%</span>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width:${c.percent}%"></div>
              </div>
            </div>
            <div style="display:flex;gap:10px;">
              <a href="course-details.html?id=${c.id}" class="btn btn-outline-dark btn-sm">Details</a>
              <a href="learning.html?course=${c.id}" class="btn btn-primary btn-sm">Continue →</a>
            </div>
          </div>
        </div>`).join("");
    }

    
    // Quiz attempts
    const qContainer = document.getElementById("quiz-activity");
    if (data.quiz_attempts.length === 0) {
      qContainer.innerHTML = `<p class="text-muted text-sm">No quizzes taken yet. Enroll in a course and take a quiz!</p>`;
    } else {
      qContainer.innerHTML = data.quiz_attempts.map(a => {
        const pct = Math.round((a.score / a.total) * 100);
        return `
          <div class="recent-activity-item">
            <div class="activity-dot"></div>
            <div>
              <div class="activity-text">${a.quiz_title} — <strong>${a.score}/${a.total}</strong> (${pct}%)</div>
              <div class="activity-time">${a.course_title} · ${new Date(a.attempted_at).toLocaleDateString()}</div>
            </div>
          </div>`;
      }).join("");
    }

  } catch {
    document.getElementById("enrolled-courses-list").innerHTML =
      `<p class="text-muted text-sm">Could not load data. Make sure XAMPP is running.</p>`;
  }
})();
