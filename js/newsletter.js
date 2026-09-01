import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDate, escapeHTML, initNav, renderState, hideLoader } from "./common.js";

initNav();

function issueBlock(issue) {
  const rawUrl = issue.pdf_url || "#";
  const href = escapeHTML(rawUrl);
  const targetAttr = rawUrl.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";

  return `
    <div class="cell">
      <div class="cell-head"><span class="dot"></span><span class="tag">Out[${issue.issue_number ?? "·"}]:</span> ${fmtDate(issue.published_at)}</div>
      <div class="cell-body">
        <div class="issue" style="padding:0;">
          ${
            issue.cover_image_url
              ? `<a class="issue-cover" href="${href}"${targetAttr}>
                   <img src="${escapeHTML(issue.cover_image_url)}" alt="${escapeHTML(issue.issue_title)} cover" loading="lazy" />
                 </a>`
              : ""
          }
          <div class="issue-body">
            ${issue.issue_number ? `<span class="issue-num">ISSUE ${escapeHTML(String(issue.issue_number))}</span>` : ""}
            <h3><a href="${href}"${targetAttr}>${escapeHTML(issue.issue_title)}</a></h3>
            <p class="issue-summary">${escapeHTML(issue.summary || "")}</p>
            <a class="btn" href="${href}"${targetAttr}>Read this issue →</a>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadIssues() {
  const el = document.getElementById("issues-list");
  if (!isConfigured) {
    return renderState(el, "Supabase isn't connected yet — add your project URL and anon key in js/supabase-config.js.", true);
  }
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) return renderState(el, `Couldn't load issues (${error.message})`, true);
  if (!data || data.length === 0) return renderState(el, "No issues published yet — the first one is on its way.");

  el.innerHTML = data.map(issueBlock).join("");
}

loadIssues().finally(hideLoader);