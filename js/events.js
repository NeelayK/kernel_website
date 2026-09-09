import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDateTime, escapeHTML, initNav, renderState, hideLoader, getShowTalks } from "./common.js";

initNav();

function itemCard(item) {
  const img = item.image_url
    ? `<img src="${escapeHTML(item.image_url)}" alt="${escapeHTML(item.title)}" loading="lazy" />`
    : "";
  const href =
    item.type === "talk"
      ? `talk-detail.html?id=${encodeURIComponent(item.id)}`
      : `event-detail.html?id=${encodeURIComponent(item.id)}`;
  const badge = item.type === "talk" ? `<span class="card-badge">talk</span>` : "";
  const footText = item.type === "talk" ? item.speaker : item.location;

  return `
    <article class="card">
      <div class="card-media ${item.image_url ? "" : "empty"}">${img || "no image"}</div>
      <div class="card-body">
        <span class="card-meta">${badge}${fmtDateTime(item.date)}</span>
        <h3 class="card-title"><a href="${href}">${escapeHTML(item.title)}</a></h3>
        <p class="card-desc">${escapeHTML(item.description || "")}</p>
        <div class="card-foot"><span>${escapeHTML(footText || "")}</span></div>
      </div>
    </article>`;
}

function normalizeEvent(e) {
  return { ...e, type: "event", date: e.event_date };
}

function normalizeTalk(t) {
  return { ...t, type: "talk", date: t.talk_date };
}

async function loadEventsOnly() {
  const nowIso = new Date().toISOString();
  const [upcomingRes, pastRes] = await Promise.all([
    supabase.from("events").select("*").gte("event_date", nowIso).order("event_date", { ascending: true }),
    supabase.from("events").select("*").lt("event_date", nowIso).order("event_date", { ascending: false }),
  ]);

  return {
    upcomingError: upcomingRes.error,
    pastError: pastRes.error,
    upcoming: (upcomingRes.data || []).map(normalizeEvent),
    past: (pastRes.data || []).map(normalizeEvent),
  };
}

async function loadEventsAndTalks() {
  const nowIso = new Date().toISOString();

  const [upcomingEvents, pastEvents, upcomingTalks, pastTalks] = await Promise.all([
    supabase.from("events").select("*").gte("event_date", nowIso),
    supabase.from("events").select("*").lt("event_date", nowIso),
    supabase.from("talks").select("*").gte("talk_date", nowIso),
    supabase.from("talks").select("*").lt("talk_date", nowIso),
  ]);

  const upcomingError = upcomingEvents.error || upcomingTalks.error;
  const pastError = pastEvents.error || pastTalks.error;

  const upcoming = [
    ...(upcomingEvents.data || []).map(normalizeEvent),
    ...(upcomingTalks.data || []).map(normalizeTalk),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = [
    ...(pastEvents.data || []).map(normalizeEvent),
    ...(pastTalks.data || []).map(normalizeTalk),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return { upcomingError, pastError, upcoming, past };
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

  const showTalks = await getShowTalks();
  const { upcomingError, pastError, upcoming, past } = showTalks
    ? await loadEventsOnly()
    : await loadEventsAndTalks();

  if (upcomingError) {
    renderState(upcomingEl, `Couldn't load events (${upcomingError.message})`, true);
  } else if (upcoming.length === 0) {
    renderState(upcomingEl, "Nothing scheduled right now — check back soon.");
  } else {
    upcomingEl.innerHTML = upcoming.map(itemCard).join("");
  }

  if (pastError) {
    renderState(pastEl, `Couldn't load events (${pastError.message})`, true);
  } else if (past.length === 0) {
    renderState(pastEl, "No past events yet.");
  } else {
    pastEl.innerHTML = past.map(itemCard).join("");
  }
}

loadEvents().finally(hideLoader);
