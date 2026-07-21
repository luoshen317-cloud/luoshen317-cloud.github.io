const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector(".site-nav");
const header = document.querySelector("[data-header]");
const year = document.querySelector("[data-year]");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "打开导航");
    }
  });
}

const updateHeader = () => {
  if (!header) {
    return;
  }
  header.style.boxShadow = window.scrollY > 16 ? "0 10px 30px rgba(31, 27, 20, 0.08)" : "none";
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
