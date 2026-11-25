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
