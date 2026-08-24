import { supabase, isConfigured } from "./supabase-client.js";
import { fmtDate, escapeHTML, initNav, renderSkeletons, renderState, hideLoader } from "./common.js";

initNav();

const PAGE_SIZE = 12;
let page = 0; // zero-indexed
let atLastPage = false;

const grid = document.getElementById("talks-grid");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const indicator = document.getElementById("page-indicator");

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
        <p class="card-desc">${escapeHTML(t.description || "")}</p>
        <div class="card-foot"><span>${escapeHTML(t.speaker || "")}</span></div>
      </div>
    </article>`;
}

async function loadPage() {
  if (!isConfigured) {
    renderState(
      grid,
      "Supabase isn't connected yet — add your project URL and anon key in js/supabase-config.js.",
      true
    );
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  renderSkeletons(grid, 6);
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1; // inclusive, one extra fetched via +1 trick below

  const { data, error } = await supabase
    .from("talks")
    .select("*")
    .order("talk_date", { ascending: false })
    .range(from, to);

  if (error) {
    renderState(grid, `Couldn't load talks (${error.message})`, true);
    return;
  }

  if (!data || data.length === 0) {
    if (page === 0) {
      renderState(grid, "No talks posted yet — check back soon.");
    } else {
      // overshot — bounce back a page
      page = Math.max(0, page - 1);
      atLastPage = true;
      loadPage();
      return;
    }
  } else {
    grid.innerHTML = data.map(talkCard).join("");
    atLastPage = data.length < PAGE_SIZE;
  }

  indicator.textContent = `page ${page + 1}`;
  prevBtn.disabled = page === 0;
  nextBtn.disabled = atLastPage;
}

prevBtn.addEventListener("click", () => {
  if (page > 0) {
    page -= 1;
    loadPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextBtn.addEventListener("click", () => {
  if (!atLastPage) {
    page += 1;
    loadPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

loadPage().finally(hideLoader);
