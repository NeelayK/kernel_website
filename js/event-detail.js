import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDateTime, escapeHTML, initNav, hideLoader, getParam, renderState } from "./common.js";

initNav();

const container = document.getElementById("event-detail");

function render(e) {
  document.title = `${e.title} — </KERNEL>`;
  container.innerHTML = `
    <a class="back-link" href="events.html">← all events</a>
    <div class="prompt-line"><span>$ select * from events where id = '${escapeHTML(e.id)}';</span></div>
    <h1>${escapeHTML(e.title)}</h1>
    <div class="detail-meta">
      <span>${fmtDateTime(e.event_date)}</span>
      ${e.location ? `<span>${escapeHTML(e.location)}</span>` : ""}
    </div>
    ${
      e.image_url
        ? `<div class="detail-cover"><img src="${escapeHTML(e.image_url)}" alt="${escapeHTML(e.title)}" /></div>`
        : ""
    }
    <div class="detail-body"><p>${escapeHTML(e.description || "No description yet.")}</p></div>
    ${
      e.link_url
        ? `<a class="btn btn-primary" href="${escapeHTML(e.link_url)}" target="_blank" rel="noopener">Register / learn more →</a>`
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
    renderState(container, "No event specified.", true);
    return;
  }
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) return renderState(container, `Couldn't load this event (${error.message}).`, true);
  if (!data) return renderState(container, "That event couldn't be found — it may have been removed.", true);
  render(data);
}

load().finally(hideLoader);
