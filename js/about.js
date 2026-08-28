import { supabase, isConfigured } from "./supabase-client.js";
import { escapeHTML, initNav, renderState, hideLoader } from "./common.js";

initNav();

const NOT_CONFIGURED_MSG =
  "Supabase isn't connected yet — add your project URL and anon key in js/supabase-config.js.";

function memberCard(m) {
  const label = m.name || m.title || "?";
  const img = m.image_url
    ? `<img src="${escapeHTML(m.image_url)}" alt="${escapeHTML(label)}" loading="lazy" />`
    : "";
  const metaParts = [];
  if (m.batch) metaParts.push(`${escapeHTML(String(m.batch))}`);
  if (m.roll) metaParts.push(`${escapeHTML(String(m.roll))}`);

  return `
    <div class="member-card">
      <div class="member-pfp ${m.image_url ? "" : "empty"}">${img || escapeHTML(label.charAt(0).toUpperCase())}</div>
      ${m.name ? `<h4 class="member-name">${escapeHTML(m.name)}</h4>` : ""}
      ${m.title ? `<div class="member-role">${escapeHTML(m.title)}</div>` : ""}
      ${metaParts.length ? `<div class="member-meta">${metaParts.join(" · ")}</div>` : ""}
      ${m.description ? `<p class="member-desc">${escapeHTML(m.description)}</p>` : ""}
    </div>`;
}

async function loadTeam() {
  const container = document.getElementById("team-container");
  if (!container) return;
  if (!isConfigured) return renderState(container, NOT_CONFIGURED_MSG, true);

  const [sectionsRes, membersRes] = await Promise.all([
    supabase.from("sections").select("*").order("number", { ascending: true }),
    supabase.from("members").select("*"),
  ]);

  if (sectionsRes.error) return renderState(container, `Couldn't load sections (${sectionsRes.error.message})`, true);
  if (membersRes.error) return renderState(container, `Couldn't load members (${membersRes.error.message})`, true);

  const sections = sectionsRes.data || [];
  const members = membersRes.data || [];

  if (sections.length === 0) {
    return renderState(container, "No sections set up yet — add rows to the sections table in Supabase.");
  }

  container.innerHTML = sections
    .map((s) => {
      const people = members
        .filter((m) => m.section_number === s.number)
        .sort(
          (a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
            (a.name || "").localeCompare(b.name || "")
        );

      return `
        <div class="team-section">
          <div class="section-head section-subhead">
            <h3><span class="idx"></span>${escapeHTML(s.title)}</h3>
          </div>
          ${
            people.length
              ? `<div class="member-grid">${people.map(memberCard).join("")}</div>`
              : `<p class="state">No one listed here yet.</p>`
          }
        </div>`;
    })
    .join("");
}

loadTeam().finally(hideLoader);