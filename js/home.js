import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDate, escapeHTML, initNav, hideLoader, renderState, getShowTalks } from "./common.js";

initNav();

const NOT_CONFIGURED_MSG =
  "Supabase isn't connected yet — add your project URL and anon key in js/supabase-config.js.";

function talkCard(t) {
  const img = t.image_url
    ? `<img src="${escapeHTML(t.image_url)}" alt="${escapeHTML(t.title)}" loading="lazy" />`
    : "";
  const href = `talk-detail.html?id=${encodeURIComponent(t.id)}`;
  return `
    <article class="card">
      <div class="card-media ${t.image_url ? "" : "empty"}">${img || "no image"}</div>
      <div class="card-body">
        <span class="card-meta">talk · ${fmtDate(t.talk_date)}</span>
        <h3 class="card-title"><a href="${href}">${escapeHTML(t.title)}</a></h3>
        <p class="card-desc">${escapeHTML(t.description || "").slice(0, 120)}${(t.description || "").length > 120 ? "…" : ""}</p>
        <div class="card-foot"><span>${escapeHTML(t.speaker || "")}</span></div>
      </div>
    </article>`;
}

function eventCard(e) {
  const img = e.image_url
    ? `<img src="${escapeHTML(e.image_url)}" alt="${escapeHTML(e.title)}" loading="lazy" />`
    : "";
  const href = `event-detail.html?id=${encodeURIComponent(e.id)}`;
  return `
    <article class="card">
      <div class="card-media ${e.image_url ? "" : "empty"}">${img || "no image"}</div>
      <div class="card-body">
        <span class="card-meta">event · ${fmtDate(e.event_date)}</span>
        <h3 class="card-title"><a href="${href}">${escapeHTML(e.title)}</a></h3>
        <p class="card-desc">${escapeHTML(e.description || "").slice(0, 120)}${(e.description || "").length > 120 ? "…" : ""}</p>
        <div class="card-foot"><span>${escapeHTML(e.location || "")}</span></div>
      </div>
    </article>`;
}

// --- Separate mode (show_talks = true): original two-section behaviour ---

async function loadRecentTalks() {
  const el = document.getElementById("recent-talks");
  if (!isConfigured) return renderState(el, NOT_CONFIGURED_MSG, true);
  const { data, error } = await supabase
    .from("talks")
    .select("*")
    .order("talk_date", { ascending: false })
    .limit(3);
  if (error) return renderState(el, `Couldn't load talks (${error.message})`, true);
  if (!data || data.length === 0) return renderState(el, "No talks posted yet — check back soon.");
  el.innerHTML = data.map(talkCard).join("");
}

async function loadRecentEvents() {
  const el = document.getElementById("recent-events");
  if (!isConfigured) return renderState(el, NOT_CONFIGURED_MSG, true);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(3);
  if (error) return renderState(el, `Couldn't load events (${error.message})`, true);
  if (!data || data.length === 0) return renderState(el, "No events posted yet — check back soon.");
  el.innerHTML = data.map(eventCard).join("");
}

function renumberSections() {
  // Re-run the 00./01./02. index labels after a section is removed, so
  // there's no gap (e.g. 00. Log, 01. Recent, 02. Newsletter).
  const sections = document.querySelectorAll("main.wrap > .section:not([style*='display: none']) .idx");
  sections.forEach((el, i) => {
    el.textContent = `${String(i).padStart(2, "0")}.`;
  });
}

// --- Combined mode (show_talks = false): one merged "recent" section ---

async function loadRecentCombined() {
  const talksSection = document.getElementById("talks-section");
  const eventsSection = document.getElementById("events-section");
  const eventsGrid = document.getElementById("recent-events");
  const eventsHeading = eventsSection ? eventsSection.querySelector(".section-head h2") : null;

  // Fold the talks section away entirely — its content moves into the
  // events grid below.
  if (talksSection) talksSection.style.display = "none";
  if (eventsHeading) {
    eventsHeading.innerHTML = `<span class="idx">01.</span>Most Recent`;
  }

  if (!eventsGrid) return;
  if (!isConfigured) return renderState(eventsGrid, NOT_CONFIGURED_MSG, true);

  const [eventsRes, talksRes] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: false }).limit(3),
    supabase.from("talks").select("*").order("talk_date", { ascending: false }).limit(3),
  ]);

  if (eventsRes.error && talksRes.error) {
    return renderState(eventsGrid, `Couldn't load recent activity (${eventsRes.error.message})`, true);
  }

  const combined = [
    ...(eventsRes.data || []).map((e) => ({ ...e, __type: "event", __date: e.event_date })),
    ...(talksRes.data || []).map((t) => ({ ...t, __type: "talk", __date: t.talk_date })),
  ]
    .filter((i) => i.__date)
    .sort((a, b) => new Date(b.__date) - new Date(a.__date))
    .slice(0, 3);

  if (combined.length === 0) {
    return renderState(eventsGrid, "No events or talks posted yet — check back soon.");
  }

  eventsGrid.innerHTML = combined.map((i) => (i.__type === "talk" ? talkCard(i) : eventCard(i))).join("");
}

async function loadActivityLog() {
  const el = document.getElementById("activity-log");
  if (!isConfigured) return renderState(el, NOT_CONFIGURED_MSG, true);

  const [talksRes, eventsRes] = await Promise.all([
    supabase.from("talks").select("id, title, talk_date").order("talk_date", { ascending: false }).limit(4),
    supabase.from("events").select("id, title, event_date").order("event_date", { ascending: false }).limit(4),
  ]);

  if (talksRes.error && eventsRes.error) {
    return renderState(el, `Couldn't load activity (${talksRes.error.message})`, true);
  }

  const items = [
    ...(talksRes.data || []).map((t) => ({
      type: "talk",
      date: t.talk_date,
      title: t.title,
      link: `talk-detail.html?id=${encodeURIComponent(t.id)}`,
    })),
    ...(eventsRes.data || []).map((e) => ({
      type: "event",
      date: e.event_date,
      title: e.title,
      link: `event-detail.html?id=${encodeURIComponent(e.id)}`,
    })),
  ]
    .filter((i) => i.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  if (items.length === 0) return renderState(el, "No activity yet.");

  el.innerHTML = items
    .map(
      (i) => `
      <div class="log-line">
        <span class="log-time">${fmtDate(i.date)}</span>
        <span class="log-tag ${i.type === "event" ? "evt" : ""}">${i.type.toUpperCase()}</span>
        <span class="log-msg"><a href="${escapeHTML(i.link)}">${escapeHTML(i.title)}</a></span>
      </div>`
    )
    .join("");
}

async function loadNewsletterTeaser() {
  const el = document.getElementById("newsletter-teaser");
  if (!isConfigured) return renderState(el, NOT_CONFIGURED_MSG, true);
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return renderState(el, `Couldn't load newsletter (${error.message})`, true);
  if (!data) return renderState(el, "No issues published yet.");

  const href = `issue-detail.html?id=${encodeURIComponent(data.id)}`;
  el.innerHTML = `
    <div class="issue" style="padding:0;">
      ${
        data.cover_image_url
          ? `<a class="issue-cover" href="${href}"><img src="${escapeHTML(data.cover_image_url)}" alt="${escapeHTML(data.issue_title)} cover" loading="lazy" /></a>`
          : ""
      }
      <div class="issue-body">
        ${data.issue_number ? `<span class="issue-num">ISSUE ${escapeHTML(String(data.issue_number))}</span>` : ""}
        <h3><a href="${href}">${escapeHTML(data.issue_title)}</a></h3>
        <p class="issue-summary">${escapeHTML(data.summary || "").slice(0, 220)}${(data.summary || "").length > 220 ? "…" : ""}</p>
        <a class="btn" href="${href}">Read this issue →</a>
      </div>
    </div>`;
}

async function applyTalksVisibility() {
  const showTalks = await getShowTalks();
  const heroTalksLink = document.getElementById("hero-talks-link");
  if (heroTalksLink && !showTalks) heroTalksLink.remove();

  if (showTalks) {
    await Promise.all([loadRecentTalks(), loadRecentEvents()]);
  } else {
    await loadRecentCombined();
    renumberSections();
  }
}

Promise.all([loadActivityLog(), applyTalksVisibility(), loadNewsletterTeaser()]).finally(hideLoader);
