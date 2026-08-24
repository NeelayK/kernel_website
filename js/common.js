// Shared helpers used across every page.

export function fmtDate(iso, opts = {}) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
  );
}

export function escapeHTML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Highlights the current page in the nav (matches on data-page attr)
export function initNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[data-page]").forEach((a) => {
    if (a.dataset.page === path) a.classList.add("active");
  });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }
}

export function renderSkeletons(container, count = 3) {
  container.innerHTML = Array.from({ length: count })
    .map(() => `<div class="skeleton skeleton-card"></div>`)
    .join("");
}

export function renderState(container, message, isError = false) {
  container.innerHTML = `<p class="state${isError ? " error" : ""}">${escapeHTML(message)}</p>`;
}

// Reads a query-string param from the current URL, e.g. ?id=xyz
export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

// Full-page loading screen shown on load, hidden once initial Supabase
// fetches for the page have resolved (see hideLoader()).
export function hideLoader() {
  const el = document.getElementById("page-loader");
  if (el) el.classList.add("hidden");
}
