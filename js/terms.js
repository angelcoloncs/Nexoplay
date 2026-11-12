/**
 * NEXO PLAY · Términos: resaltado de la sección activa y barra de progreso
 */
(function () {
  "use strict";
  const { $, $$ } = Nexo;
  const sections = $$(".terms-section");
  const links = $$("[data-spy]");
  const bar = $(".terms-progress span");
  const current = $(".terms-current");
  const content = $(".terms-content");

  let lockUntil = 0;
  function setActive(id, force) {
    if (!force && Date.now() < lockUntil) return;
    links.forEach((a) => a.classList.toggle("is-active", a.dataset.spy === id));
    sections.forEach((s) => s.classList.toggle("is-active", s.id === id));
    const sec = document.getElementById(id);
    if (sec && current) current.textContent = sec.querySelector("h2").textContent;
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(en.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
  }

  function progress() {
    const r = content.getBoundingClientRect();
    const total = r.height - innerHeight * 0.5;
    const done = Math.min(Math.max((innerHeight * 0.5 - r.top) / total, 0), 1);
    bar.style.transform = `scaleY(${done})`;
  }
  addEventListener("scroll", progress, { passive: true });
  progress();

  // Destacar la sección al llegar desde un enlace
  function flash() {
    const id = location.hash.slice(1);
    const sec = id && document.getElementById(id);
    if (!sec || !sec.classList.contains("terms-section")) return;
    sec.classList.remove("is-flash");
    void sec.offsetWidth;
    sec.classList.add("is-flash");
    setActive(id, true);
    lockUntil = Date.now() + 1200;
  }
  addEventListener("hashchange", flash);
  flash();
})();
