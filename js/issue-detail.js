import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDate, escapeHTML, initNav, hideLoader, getParam, renderState } from "./common.js";

initNav();

const container = document.getElementById("issue-detail");

function render(issue) {
  document.title = `${issue.issue_title} — </KERNEL>`;
  container.innerHTML = `
    <a class="back-link" href="newsletter.html">← all issues</a>
    <div class="prompt-line"><span>$ select * from newsletters where id = '${escapeHTML(issue.id)}';</span></div>
    <h1>${escapeHTML(issue.issue_title)}</h1>
    <div class="detail-meta">
      ${issue.issue_number ? `<span>issue ${escapeHTML(String(issue.issue_number))}</span>` : ""}
      <span>${fmtDate(issue.published_at)}</span>
    </div>
    ${
      issue.cover_image_url
        ? `<div class="detail-cover"><img src="${escapeHTML(issue.cover_image_url)}" alt="${escapeHTML(issue.issue_title)} cover" /></div>`
        : ""
    }
    <div class="detail-body"><p>${escapeHTML(issue.summary || "No summary yet.")}</p></div>
    ${
      issue.pdf_url
        ? `<a class="btn btn-primary" href="${escapeHTML(issue.pdf_url)}" target="_blank" rel="noopener">Read this issue →</a>`
        : ""
    }
  `;
}

async function load() {
  const id = getParam("id");
  if (!isConfigured) {
    renderState(container, "Supabase isn't connected yet — add your project URL and anon key in js/supabase-config.js.", true);
    return;
  }
  if (!id) {
    renderState(container, "No issue specified.", true);
    return;
  }
  const { data, error } = await supabase.from("newsletters").select("*").eq("id", id).maybeSingle();
  if (error) return renderState(container, `Couldn't load this issue (${error.message}).`, true);
  if (!data) return renderState(container, "That issue couldn't be found — it may have been removed.", true);
  render(data);
}

load().finally(hideLoader);
