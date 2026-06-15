import { isLoggedIn } from "./auth.js";

const navbar = document.getElementById("navbar");
const navActions = document.getElementById("navActions");
const navLinks = document.getElementById("navLinks");
const navToggle = document.getElementById("navToggle");

if (isLoggedIn() && navActions) {
  navActions.innerHTML = `<a href="app.html" class="lp-btn lp-btn-primary">Panele Git</a>`;
}

window.addEventListener("scroll", () => {
  navbar?.classList.toggle("scrolled", window.scrollY > 12);
});

navToggle?.addEventListener("click", () => {
  navLinks?.classList.toggle("open");
  navActions?.classList.toggle("open");
});

navLinks?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navActions?.classList.remove("open");
  });
});

// Hero panel subtle entrance
const panel = document.querySelector(".lp-panel-main");
if (panel) {
  panel.style.opacity = "0";
  panel.style.transform = "translateY(20px)";
  requestAnimationFrame(() => {
    panel.style.transition = "opacity 0.7s ease, transform 0.7s ease";
    panel.style.opacity = "1";
    panel.style.transform = "translateY(0)";
  });
}
