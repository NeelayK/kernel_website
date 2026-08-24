import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDate, escapeHTML, initNav, hideLoader, getParam, renderState } from "./common.js";

initNav();

const container = document.getElementById("talk-detail");

function render(t) {
  document.title = `${t.title} — </KERNEL>`;
  container.innerHTML = `
    <a class="back-link" href="talks.html">← all talks</a>
    <div class="prompt-line"><span>$ select * from talks where id = '${escapeHTML(t.id)}';</span></div>
    <h1>${escapeHTML(t.title)}</h1>
    <div class="detail-meta">
      <span>${fmtDate(t.talk_date)}</span>
      ${t.speaker ? `<span>speaker · ${escapeHTML(t.speaker)}</span>` : ""}
    </div>
    ${
      t.image_url
        ? `<div class="detail-cover"><img src="${escapeHTML(t.image_url)}" alt="${escapeHTML(t.title)}" /></div>`
        : ""
    }
    <div class="detail-body"><p>${escapeHTML(t.description || "No description yet.")}</p></div>
    ${
      t.link_url
        ? `<a class="btn btn-primary" href="${escapeHTML(t.link_url)}" target="_blank" rel="noopener">View recording / slides →</a>`
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
    renderState(container, "No talk specified.", true);
    return;
  }
  const { data, error } = await supabase.from("talks").select("*").eq("id", id).maybeSingle();
  if (error) return renderState(container, `Couldn't load this talk (${error.message}).`, true);
  if (!data) return renderState(container, "That talk couldn't be found — it may have been removed.", true);
  render(data);
}

load().finally(hideLoader);
