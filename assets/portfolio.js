// Portfolio: light/dark theme (same choice as the JORDY ZERO store: "zero-theme"), mobile menu, remembered language.
const root = document.documentElement;
const systemDark = matchMedia("(prefers-color-scheme: dark)");

const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

// Theme
const themeButton = document.getElementById("theme");
const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches;
const updateTheme = () => themeButton?.setAttribute("aria-pressed", String(isDark()));
themeButton?.addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  write("zero-theme", root.dataset.theme);
  updateTheme();
});
systemDark.addEventListener("change", updateTheme);
updateTheme();

// Mobile menu (styles come from the store stylesheet)
const menuButton = document.getElementById("menu-toggle");
root.classList.add("mobile-menu-ready");
const setMenu = open => {
  root.classList.toggle("menu-open", open);
  menuButton?.setAttribute("aria-expanded", String(open));
};
menuButton?.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
document.getElementById("main-navigation")?.addEventListener("click", event => {
  if (event.target instanceof Element && event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });
matchMedia("(min-width: 721px)").addEventListener("change", () => setMenu(false));

// Language: remember the choice for the next visit to portfolio.jordyzero.com
write("zero-portfolio-language", root.lang);
document.addEventListener("click", event => {
  const link = event.target instanceof Element && event.target.closest("a[data-lang]");
  if (link) write("zero-portfolio-language", link.dataset.lang);
});

// Videos and images: no right-click "Save as".
document.addEventListener("contextmenu", event => {
  if (event.target instanceof Element && event.target.closest("video, .pf-media img, .pf-gallery img")) event.preventDefault();
});

// Loading screen, home page only (same as the JORDY ZERO store): full on the first visit, short on later visits,
// not again while browsing the same visit. ?intro replays the full version, ?intro=short the later-visit version.
const loader = document.getElementById("loader");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const heroVideo = document.querySelector(".hero-video");
const LOADER_GRID_AT = 3050;
const LOADER_SHORT_SKIP = 2400;
const LOADER_VIDEO_WAIT = 5000;
const readSession = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
const writeSession = (key, value) => { try { sessionStorage.setItem(key, value); } catch {} };

function runLoader() {
  if (!loader) return;
  const forced = new URLSearchParams(location.search).get("intro");
  const seenThisVisit = forced === null && readSession("zero-portfolio-intro") === "1";
  const seenBefore = forced === null ? read("zero-portfolio-intro") === "1" : forced === "short";
  writeSession("zero-portfolio-intro", "1");
  write("zero-portfolio-intro", "1");
  if (seenThisVisit || reducedMotion.matches) {
    loader.classList.add("is-skipped");
    return;
  }
  loader.classList.add("is-driven");
  const short = seenBefore;
  if (short) loader.classList.add("is-short");
  const loaderAnimations = () => loader.getAnimations({ subtree: true });
  const clock = loaderAnimations().find(animation => animation.animationName === "loader-clock");
  const started = performance.now();
  const elapsed = () => clock ? clock.currentTime ?? 0 : performance.now() - started;

  // 1 The logo is traced, then filled.
  const logo = loader.querySelector(".loader-logo");
  const use = logo.querySelector("use");
  const symbol = use && document.querySelector(use.getAttribute("href"));
  if (symbol) {
    logo.setAttribute("viewBox", symbol.getAttribute("viewBox"));
    logo.innerHTML = symbol.innerHTML;
  }
  for (const shape of logo.querySelectorAll("path, polygon")) {
    const length = shape.getTotalLength();
    shape.style.strokeDasharray = String(length);
    shape.animate([
      { strokeDashoffset: length, fillOpacity: 0 },
      { strokeDashoffset: 0, fillOpacity: 0, offset: 0.72 },
      { strokeDashoffset: 0, fillOpacity: 1 },
    ], { duration: 1100, delay: 150, easing: "ease-in-out", fill: "both" });
  }
  if (short) loaderAnimations().forEach(animation => { animation.currentTime = (animation.currentTime || 0) + LOADER_SHORT_SKIP; });

  // 2 The counter follows the time, then waits at 99 for the intro film to be ready.
  const count = document.getElementById("loader-count");
  const videoReady = () => !heroVideo || heroVideo.readyState >= 3 || heroVideo.error;
  let gridStarted = false;
  function tick() {
    if (gridStarted) return;
    const progress = Math.max(0, Math.min(1, (elapsed() - 200) / (LOADER_GRID_AT - 600)));
    const value = Math.round(100 * (1 - (1 - progress) ** 2));
    count.textContent = String(videoReady() ? value : Math.min(99, value)).padStart(3, "0");
    if (elapsed() >= LOADER_GRID_AT && (videoReady() || elapsed() >= LOADER_GRID_AT + LOADER_VIDEO_WAIT)) startGrid();
    if (!gridStarted) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  heroVideo?.addEventListener("canplay", () => { if (elapsed() >= LOADER_GRID_AT) startGrid(); }, { once: true });

  // 3 A click or a key skips straight to the grid.
  const skip = () => {
    for (const animation of loaderAnimations()) {
      if (animation !== clock && (animation.currentTime || 0) < LOADER_GRID_AT) animation.currentTime = LOADER_GRID_AT;
    }
    startGrid();
  };
  loader.addEventListener("click", skip);
  document.addEventListener("keydown", skip, { once: true });

  // 4 A black and white grid fills the screen in a diagonal wave, then empties onto the site.
  function startGrid() {
    if (gridStarted) return;
    gridStarted = true;
    count.textContent = "100";
    document.removeEventListener("keydown", skip);
    const columns = 12;
    const rows = Math.max(4, Math.round(columns * innerHeight / innerWidth));
    const grid = document.createElement("div");
    grid.className = "loader-cells";
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    loader.append(grid);
    const easing = "cubic-bezier(0.7, 0, 0.2, 1)";
    const covered = 900;
    let last = 0;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const cell = document.createElement("span");
        if ((row + column) % 2) cell.className = "is-dark";
        grid.append(cell);
        const wave = (row + column) * 32;
        cell.animate([{ transform: "scale(0)" }, { transform: "scale(1.02)" }], { duration: 300, delay: wave, easing, fill: "both" });
        const out = covered + 120 + wave + Math.random() * 120;
        cell.animate([{ transform: "scale(1.02)" }, { transform: "scale(0)" }], { duration: 300, delay: out, easing, fill: "forwards" });
        last = Math.max(last, out + 300);
      }
    }
    setTimeout(() => loader.classList.add("is-covered"), covered);
    setTimeout(() => loader.remove(), last + 50);
  }
}
runLoader();
