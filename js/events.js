import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDateTime, escapeHTML, initNav, renderState, hideLoader } from "./common.js";

initNav();

function eventCard(e) {
  const img = e.image_url
    ? `<img src="${escapeHTML(e.image_url)}" alt="${escapeHTML(e.title)}" loading="lazy" />`
    : "";
  const href = `event-detail.html?id=${encodeURIComponent(e.id)}`;
  return `
    <article class="card">
      <div class="card-media ${e.image_url ? "" : "empty"}">${img || "no image"}</div>
      <div class="card-body">
        <span class="card-meta">${fmtDateTime(e.event_date)}</span>
        <h3 class="card-title"><a href="${href}">${escapeHTML(e.title)}</a></h3>
        <p class="card-desc">${escapeHTML(e.description || "")}</p>
        <div class="card-foot"><span>${escapeHTML(e.location || "")}</span></div>
      </div>
    </article>`;
}

async function loadEvents() {
  const upcomingEl = document.getElementById("upcoming-events");
  const pastEl = document.getElementById("past-events");

  if (!isConfigured) {
    const msg = "Supabase isn't connected yet — add your project URL and anon key in js/supabase-config.js.";
    renderState(upcomingEl, msg, true);
    renderState(pastEl, msg, true);
    return;
  }

  const nowIso = new Date().toISOString();

  const [upcomingRes, pastRes] = await Promise.all([
    supabase.from("events").select("*").gte("event_date", nowIso).order("event_date", { ascending: true }),
    supabase.from("events").select("*").lt("event_date", nowIso).order("event_date", { ascending: false }),
  ]);

  if (upcomingRes.error) {
    renderState(upcomingEl, `Couldn't load events (${upcomingRes.error.message})`, true);
  } else if (!upcomingRes.data || upcomingRes.data.length === 0) {
    renderState(upcomingEl, "Nothing scheduled right now — check back soon.");
  } else {
    upcomingEl.innerHTML = upcomingRes.data.map(eventCard).join("");
  }

  if (pastRes.error) {
    renderState(pastEl, `Couldn't load events (${pastRes.error.message})`, true);
  } else if (!pastRes.data || pastRes.data.length === 0) {
    renderState(pastEl, "No past events yet.");
  } else {
    pastEl.innerHTML = pastRes.data.map(eventCard).join("");
  }
}

loadEvents().finally(hideLoader);
