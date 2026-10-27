/*  list.js – renders a simple list of events from data/events.json
 *  and lets you toggle a “registered” flag for each event.
 *
 *  Two modes:
 *  1️⃣  Local‑only: the flag lives in the browser (localStorage) – no GitHub write.
 *  2️⃣  Git‑backed: if the user supplies a GitHub Personal Access Token (PAT)
 *      the script writes the updated JSON back to the repo via the GitHub
 *      Contents API.  The token is stored in localStorage (never sent to a
 *      server you control).
 *
 *  Adjust `REPO_OWNER` and `REPO_NAME` to match your GitHub repository.
 */

const REPO_OWNER = "amemery";   // ← replace
const REPO_NAME  = "rce_aus";              // ← replace

// ---------------------------------------------------------------------------
// Helper: fetch the JSON file from the static site
async function loadEvents() {
  const resp = await fetch("data/events.json");
  if (!resp.ok) throw new Error(`Failed to load events.json (${resp.status})`);
  return resp.json();   // array of event objects
}

// ---------------------------------------------------------------------------
// Helper: write the whole JSON file back to GitHub (optional persistence)
async function pushEventsToGitHub(updatedEvents) {
  const token = localStorage.getItem("gh_pat");
  if (!token) return;                     // no token → skip GitHub write

  const apiBase = "https://api.github.com";
  const path = "data/events.json";

  // 1️⃣ Get the current file metadata (SHA & base64 content)
  const metaResp = await fetch(
    `${apiBase}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      headers: { Authorization: *** ${token}` }   // ← fixed
    }
  );
  if (!metaResp.ok) {
    console.warn("GitHub metadata fetch failed – skipping persistence");
    return;
  }
  const meta = await metaResp.json();   // contains sha, content (base64)

  // 2️⃣ Prepare the new content (base64‑encoded)
const newContent = btoa(JSON.stringify(updatedEvents, null, 2));

  // 3️⃣ Commit the change
  const commitResp = await fetch(
    `${apiBase}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: *** ${token}`,           // ← fixed
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update registration flag (auto‑commit)",
        content: newContent,
        sha: meta.sha
      })
    }
  );

  if (!commitResp.ok) {
    console.warn("GitHub commit failed", await commitResp.text());
  }
}

// ---------------------------------------------------------------------------
// UI rendering
document.addEventListener("DOMContentLoaded", async () => {
  let events;
  try {
    events = await loadEvents();
  } catch (e) {
    console.error(e);
    return;
  }

  const listEl = document.getElementById("event-list");
  if (!listEl) {
    console.error("Missing <ul id=\"event-list\"> in index.html");
    return;
  }

  const render = () => {
    // clear any previous items
    listEl.innerHTML = "";

    events.forEach((ev, idx) => {
      const li = document.createElement("li");
      li.dataset.idx = idx;   // store index for later lookup

      // Build the list entry HTML
      li.innerHTML = `
        <a href="${ev.url}" target="_blank">${ev.title}</a>
        <span class="date">${new Date(ev.date).toLocaleDateString()}</span>
        <span class="loc">${ev.location || ""}</span>
        <button class="reg-btn">${ev.registered ? "Registered ✅" : "Register"}</button>
     `;

      const btn = li.querySelector(".reg-btn");
      btn.addEventListener("click", async () => {
        // toggle flag in the in‑memory array
        ev.registered = !ev.registered;
        // update button text immediately
        btn.textContent = ev.registered ? "Registered ✅" : "Register";

        // Persist the change (if a PAT is present)
        await pushEventsToGitHub(events);
      });

      listEl.appendChild(li);
    });
  };

  // -------------------------------------------------------------------------
  // Optional: Prompt for a GitHub PAT if the user wants persistence
  // (Only shown once per browser via localStorage)
  if (!localStorage.getItem("gh_pat")) {
    const wantPersist = confirm(
      "Do you want your registration choices to be saved across devices?\n" +
      "If you answer Yes, you'll be asked for a GitHub Personal Access Token " +
      "with the 'repo' scope. The token is stored only in this browser."
    );
    if (wantPersist) {
      const pat = prompt("Enter your GitHub PAT (repo scope):");
      if (pat) {
        localStorage.setItem("gh_pat", pat.trim());
        alert("Token saved – future changes will be committed to the repo.");
      }
    }
  }

  // Initial render
  render();
});