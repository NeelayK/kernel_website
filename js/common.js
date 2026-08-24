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

export function initNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  
  document.querySelectorAll(".nav-links a[data-page]").forEach((a) => {
    if (a.dataset.page === path) a.classList.add("active");
  });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  if (toggle && links && !toggle.dataset.bound) {
    toggle.dataset.bound = "true";

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      links.classList.toggle("open");
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => links.classList.remove("open"));
    });

    document.addEventListener("click", (e) => {
      if (!links.contains(e.target) && !toggle.contains(e.target)) {
        links.classList.remove("open");
      }
    });
  }
}

export function renderLayout() {
  if (!document.querySelector(".site-nav")) {
    const navHTML = `
<nav class="site-nav">
  <div class="wrap">
    <a href="index.html" data-page="index.html"><img class="logo" src="assets/logo.png" alt="KERNEL" /></a>
    <button class="nav-toggle" aria-label="Toggle menu">☰</button>
    <ul class="nav-links">
      <li><a href="index.html" data-page="index.html">home</a></li>
      <li><a href="talks.html" data-page="talks.html">talks</a></li>
      <li><a href="events.html" data-page="events.html">events</a></li>
      <li><a href="newsletter.html" data-page="newsletter.html">newsletter</a></li>
      <li><a href="about.html" data-page="about.html">about</a></li>
    </ul>
  </div>
</nav>`;

    const footerHTML = `
<footer class="site-footer">
  <div class="wrap">
    <div>
      <img class="logo" src="assets/logo.png" alt="KERNEL" />
      <p class="footer-note">Data Science Society, IISER Thiruvananthapuram. Built by students, for students.</p>
    </div>
    <div class="footer-links">
      <a href="about.html">about</a>
      <a href="talks.html">talks</a>
      <a href="events.html">events</a>
      <a href="newsletter.html">newsletter</a>
      <a href="mailto:kernel@iisertvm.ac.in">contact</a>
    </div>
  </div>
</footer>`;

    const loader = document.getElementById("page-loader");
    if (loader) {
      loader.insertAdjacentHTML("afterend", navHTML);
    } else {
      document.body.insertAdjacentHTML("afterbegin", navHTML);
    }

    document.body.insertAdjacentHTML("beforeend", footerHTML);
  }

  initNav();
}

export function renderSkeletons(container, count = 3) {
  container.innerHTML = Array.from({ length: count })
    .map(() => `<div class="skeleton skeleton-card"></div>`)
    .join("");
}

export function renderState(container, message, isError = false) {
  container.innerHTML = `<p class="state${isError ? " error" : ""}">${escapeHTML(message)}</p>`;
}

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export function hideLoader() {
  const el = document.getElementById("page-loader");
  if (el) el.classList.add("hidden");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLayout);
} else {
  renderLayout();
}