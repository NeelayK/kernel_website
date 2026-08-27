const SUN_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const MOON_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

(function initThemeEarly() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.documentElement.classList.add("light-mode");
  }
})();

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

export function initThemeToggle() {
  const themeBtn = document.getElementById("theme-toggle");
  const isLight = localStorage.getItem("theme") === "light";

  if (isLight) {
    document.body.classList.add("light-mode");
    document.documentElement.classList.add("light-mode");
  }

  if (themeBtn && !themeBtn.dataset.bound) {
    themeBtn.dataset.bound = "true";
    themeBtn.innerHTML = (document.body.classList.contains("light-mode") || document.documentElement.classList.contains("light-mode")) ? MOON_ICON : SUN_ICON;

    themeBtn.addEventListener("click", () => {
      const activeLight = document.body.classList.toggle("light-mode");
      document.documentElement.classList.toggle("light-mode", activeLight);
      localStorage.setItem("theme", activeLight ? "light" : "dark");
      themeBtn.innerHTML = activeLight ? MOON_ICON : SUN_ICON;
    });
  }
}

export function renderLayout() {
  if (document.querySelector(".site-nav")) return;

  const isLight = localStorage.getItem("theme") === "light";
  const initialIcon = isLight ? MOON_ICON : SUN_ICON;

  const navHTML = `
<nav class="site-nav">
  <div class="wrap">
    <a href="./index.html" data-page="index.html"><img class="logo" src="./assets/logo.png" alt="KERNEL" /></a>
    <div style="display: flex; align-items: center; gap: 8px;"><div class="nav-controls">
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">${initialIcon}</button>
      <button class="nav-toggle" aria-label="Toggle menu">☰</button>
    </div>
    <ul class="nav-links">
      <li><a href="./index.html" data-page="index.html">home</a></li>
      <li><a href="./talks.html" data-page="talks.html">talks</a></li>
      <li><a href="./events.html" data-page="events.html">events</a></li>
      <li><a href="./newsletter.html" data-page="newsletter.html">newsletter</a></li>
      <li><a href="./about.html" data-page="about.html">about</a></li>
    </ul>
  </div></div>
</nav>`;

  const footerHTML = `
<footer class="site-footer">
  <div class="wrap">
    <div>
      <img class="logo" src="./assets/logo.png" alt="KERNEL" />
      <p class="footer-note">Data Science Society, IISER Thiruvananthapuram. Built by students, for students.</p>
    </div>
    <div class="footer-links">
      <a href="./about.html">about</a>
      <a href="./talks.html">talks</a>
      <a href="./events.html">events</a>
      <a href="./newsletter.html">newsletter</a>
      <a href="mailto:kernel@iisertvm.ac.in">contact</a>
    </div>
  </div>
</footer>`;

  if (document.body) {
    document.body.insertAdjacentHTML("afterbegin", navHTML);
    document.body.insertAdjacentHTML("beforeend", footerHTML);
  }

  initNav();
  initThemeToggle();
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
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  loader.classList.add('fade-out');
  loader.classList.add('hidden');
  
  setTimeout(() => {
    loader.style.display = 'none';
  }, 450);
}

// Auto-run layout injection as soon as DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLayout);
} else {
  renderLayout();
}