/* community */

(async function () {
  const session = await requireAuth();
  setTopbarUser(session.user_name);
  await loadPosts();
})();

async function loadPosts() {
  try {
    const res  = await fetch("../php/community.php?action=posts");
    const data = await res.json();
    if (!data.success) throw new Error();
    renderPosts(data.posts);
  } catch {
    document.getElementById("posts-feed").innerHTML = `<p class="text-muted">Could not load posts.</p>`;
  }
}

function renderPosts(posts) {
  const feed = document.getElementById("posts-feed");
  if (posts.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        <div class="icon">💬</div>
        <h3>No posts yet</h3>
        <p>Be the first to start a discussion!</p>
      </div>`;
    return;
  }
  feed.innerHTML = posts.map(p => `
    <div class="post-card" id="post-${p.id}">
      <div class="post-header">
        <div class="avatar" style="width:38px;height:38px;font-size:.9rem;">${p.full_name[0].toUpperCase()}</div>
        <div class="post-meta">
          <h4>${escapeHtml(p.title)}</h4>
          <div class="by">by ${escapeHtml(p.full_name)} · ${timeAgo(p.created_at)}</div>
        </div>
      </div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      <div class="post-actions">
        <button class="upvote-btn" onclick="upvote(${p.id}, this)">▲ ${p.upvotes}</button>
        <span class="comment-toggle" onclick="toggleComments(${p.id})">
          💬 ${p.comment_count} comment${p.comment_count !== 1 ? "s" : ""}
        </span>
      </div>
      <div class="comments-area" id="comments-${p.id}">
        <div id="comments-list-${p.id}">
          <div class="spinner" style="width:24px;height:24px;border-width:2px;margin:12px auto;"></div>
        </div>
        <div class="comment-form">
          <input type="text" placeholder="Write a comment…" id="comment-input-${p.id}" />
          <button onclick="submitComment(${p.id})">Reply</button>
        </div>
      </div>
    </div>`).join("");
}

async function toggleComments(postId) {
  const area = document.getElementById(`comments-${postId}`);
  area.classList.toggle("open");
  if (area.classList.contains("open")) {
    await loadComments(postId);
  }
}

async function loadComments(postId) {
  const res  = await fetch(`../php/community.php?action=comments&post_id=${postId}`);
  const data = await res.json();
  const list = document.getElementById(`comments-list-${postId}`);

  if (!data.success || data.comments.length === 0) {
    list.innerHTML = `<p style="font-size:.82rem;color:var(--text-muted);margin:8px 0;">No comments yet. Be the first!</p>`;
    return;
  }

  list.innerHTML = data.comments.map(c => `
    <div class="comment-item">
      <div class="avatar" style="width:28px;height:28px;font-size:.7rem;">${c.full_name[0].toUpperCase()}</div>
      <div class="comment-body">
        <div class="cname">${escapeHtml(c.full_name)} <span style="font-weight:400;color:var(--text-muted);">· ${timeAgo(c.created_at)}</span></div>
        <div class="ctext">${escapeHtml(c.content)}</div>
      </div>
    </div>`).join("");
}

async function submitComment(postId) {
  const input   = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  const res  = await fetch("../php/community.php?action=comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id: postId, content })
  });
  const data = await res.json();
  if (data.success) {
    input.value = "";
    await loadComments(postId);
  }
}

async function upvote(postId, btn) {
  await fetch("../php/community.php?action=upvote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id: postId })
  });
  // Optimistic update
  const current = parseInt(btn.textContent.replace("▲ ", ""));
  btn.textContent = "▲ " + (current + 1);
}

async function submitPost() {
  const title   = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  if (!title || !content) { showAlert("post-error", "Title and content are required."); return; }

  const res  = await fetch("../php/community.php?action=post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content })
  });
  const data = await res.json();
  if (data.success) {
    closeModal("new-post-modal");
    document.getElementById("post-title").value   = "";
    document.getElementById("post-content").value = "";
    await loadPosts();
  } else {
    showAlert("post-error", data.message || "Failed to post.");
  }
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.getElementById("new-post-modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal("new-post-modal");
});

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}
