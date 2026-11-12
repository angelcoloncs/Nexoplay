/**
 * NEXO PLAY · Página de inicio
 * Carrusel destacado, novedades, catálogo con filtros, ofertas y estadísticas.
 */
(function () {
  "use strict";
  const { $, $$, formatPrice, escapeHTML, normalize, gameCardHTML, observeReveals, prefersReducedMotion } = Nexo;

  /* =========================================================
     HERO: carrusel de destacados
     ========================================================= */
  function initHero() {
    const slidesEl = $("#hero-slides");
    if (!slidesEl) return;
    const featured = PRODUCTS.filter((p) => p.featured);
    const bg = $(".home-hero-bg");
    const dots = $(".hero-dots");
    const cta = $("#hero-cta-featured");
    let current = 0;
    let timer = null;

    const minPrice = Math.min(...PRODUCTS.map((p) => p.price));
    $("#hero-meta").textContent = `${PRODUCTS.length} mundos por descubrir · Desde ${formatPrice(minPrice)} · Descarga digital`;

    bg.innerHTML = featured.map((p, i) => `<div class="home-hero-bg-layer ${i === 0 ? "is-active" : ""}" style="background-image:url('${p.image}')"></div>`).join("");

    slidesEl.innerHTML = featured
      .map(
        (p, i) => `
        <article class="hero-slide ${i === 0 ? "is-active" : ""}" aria-hidden="${i !== 0}">
          <a href="product.html?id=${p.id}" class="hero-slide-cover" tabindex="${i === 0 ? 0 : -1}">
            <img src="${p.image}" alt="Portada de ${escapeHTML(Nexo.getName(p))}" style="object-position:${p.focus}" />
            ${p.badge ? `<span class="game-card-badge">${p.badge}</span>` : ""}
          </a>
          <div class="hero-slide-info">
            <p class="hero-slide-name">${escapeHTML(p.displayTitle || p.title)}</p>
            <p class="hero-slide-sub">${escapeHTML(p.displayTitle ? "" : p.subtitle)}</p>
            <p class="hero-slide-tagline">${escapeHTML(p.tagline)}</p>
            <div class="hero-slide-buy">
              <span class="hero-slide-price">${formatPrice(p.price)}</span>
              <button type="button" class="btn btn-primary btn-sm" data-hero-add="${p.id}" tabindex="${i === 0 ? 0 : -1}">Añadir al carrito</button>
            </div>
          </div>
        </article>`
      )
      .join("");

    dots.innerHTML = featured
      .map((p, i) => `<button type="button" class="hero-dot ${i === 0 ? "is-active" : ""}" role="tab" aria-selected="${i === 0}" aria-label="${escapeHTML(Nexo.getName(p))}"><span></span></button>`)
      .join("");

    function go(n) {
      current = (n + featured.length) % featured.length;
      $$(".hero-slide", slidesEl).forEach((s, i) => {
        const on = i === current;
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-hidden", String(!on));
        $$("a, button", s).forEach((el) => (el.tabIndex = on ? 0 : -1));
      });
      $$(".home-hero-bg-layer", bg).forEach((l, i) => l.classList.toggle("is-active", i === current));
      $$(".hero-dot", dots).forEach((d, i) => {
        d.classList.toggle("is-active", i === current);
        d.setAttribute("aria-selected", String(i === current));
      });
      cta.href = `product.html?id=${featured[current].id}`;
      cta.textContent = `Ver ${Nexo.getName(featured[current])} →`;
      restart();
    }

    function restart() {
      clearInterval(timer);
      if (prefersReducedMotion) return;
      dots.classList.remove("is-running");
      void dots.offsetWidth;
      dots.classList.add("is-running");
      timer = setInterval(() => go(current + 1), 6000);
    }

    $$(".hero-dot", dots).forEach((d, i) => d.addEventListener("click", () => go(i)));
    $$("[data-hero]").forEach((b) => b.addEventListener("click", () => go(current + (b.dataset.hero === "next" ? 1 : -1))));

    const hero = $(".home-hero");
    hero.addEventListener("mouseenter", () => {
      clearInterval(timer);
      dots.classList.add("is-paused");
    });
    hero.addEventListener("mouseleave", () => {
      dots.classList.remove("is-paused");
      restart();
    });

    slidesEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-hero-add]");
      if (!btn) return;
      const slide = btn.closest(".hero-slide");
      Nexo.addToCart(btn.dataset.heroAdd, { sourceImg: $("img", slide), button: btn });
    });

    // Deslizar con el dedo
    let startX = null;
    slidesEl.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
    slidesEl.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
      startX = null;
    });

    // Efecto de inclinación 3D sobre la portada
    if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
      const showcase = $(".home-hero-showcase");
      showcase.addEventListener("mousemove", (e) => {
        const cover = $(".hero-slide.is-active .hero-slide-cover");
        if (!cover) return;
        const r = cover.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cover.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
      });
      showcase.addEventListener("mouseleave", () => {
        $$(".hero-slide-cover").forEach((c) => (c.style.transform = ""));
      });
    }

    go(0);
  }

  /* =========================================================
     NOVEDADES (carril horizontal)
     ========================================================= */
  function initRail() {
    const rail = $("#novedades-rail");
    if (!rail) return;
    const list = PRODUCTS.filter((p) => p.year >= 2024).sort((a, b) => b.year - a.year);
    rail.innerHTML = list.map((p, i) => gameCardHTML(p, i)).join("");
    $$("[data-rail]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const step = rail.clientWidth * 0.8;
        rail.scrollBy({ left: btn.dataset.rail === "next" ? step : -step, behavior: prefersReducedMotion ? "auto" : "smooth" });
      })
    );
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      $('[data-rail="prev"]').disabled = rail.scrollLeft <= 2;
      $('[data-rail="next"]').disabled = rail.scrollLeft >= max;
    };
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* =========================================================
     CATÁLOGO
     ========================================================= */
  function initCatalog() {
    const grid = $("#catalog-grid");
    if (!grid) return;

    const form = $("#filters-form");
    const slider = $("#priceRange");
    const output = $("#priceOutput");
    const sort = $("#catalogSort");
    const status = $(".catalog-status-text");
    const total = $(".catalog-total-count");
    const chipsEl = $("#active-filters");
    const openBtn = $(".filters-open");
    const openCount = $(".filters-open-count");
    const panel = $("#catalog-filters");
    let query = new URLSearchParams(location.search).get("q") || "";

    // Opciones de filtros generadas desde los datos
    const famCount = {};
    PRODUCTS.forEach((p) => new Set(p.platforms.map((k) => PLATFORMS[k].family)).forEach((f) => (famCount[f] = (famCount[f] || 0) + 1)));
    $('[data-filter="platform"]').innerHTML = Object.entries(PLATFORM_FAMILIES)
      .map(
        ([key, label]) => `
        <label class="filter-checkbox-label">
          <input type="checkbox" name="platform" value="${key}" />
          <span class="filter-checkbox-box" aria-hidden="true"></span>
          <span>${label}</span><span class="filter-count">${famCount[key] || 0}</span>
        </label>`
      )
      .join("");
    $('[data-filter="genre"]').innerHTML = Object.entries(GENRES)
      .map(
        ([key, label]) => `
        <label class="filter-checkbox-label">
          <input type="checkbox" name="genre" value="${key}" />
          <span class="filter-checkbox-box" aria-hidden="true"></span>
          <span>${label}</span><span class="filter-count">${PRODUCTS.filter((p) => p.genre === key).length}</span>
        </label>`
      )
      .join("");

    function state() {
      return {
        platforms: $$('input[name="platform"]:checked', form).map((c) => c.value),
        genres: $$('input[name="genre"]:checked', form).map((c) => c.value),
        max: Number(slider.value),
        dlc: $('input[name="has_dlc"]', form).checked,
        wish: $('input[name="wishlist"]', form).checked
      };
    }

    function filtered() {
      const s = state();
      const matches = query ? Nexo.searchProducts(query).map((p) => p.id) : null;
      let list = PRODUCTS.filter((p) => {
        if (matches && !matches.includes(p.id)) return false;
        if (s.platforms.length && !p.platforms.some((k) => s.platforms.includes(PLATFORMS[k].family))) return false;
        if (s.genres.length && !s.genres.includes(p.genre)) return false;
        if (p.price > s.max) return false;
        if (s.dlc && !(p.dlcs && p.dlcs.length)) return false;
        if (s.wish && !Nexo.Wishlist.has(p.id)) return false;
        return true;
      });
      const by = sort.value;
      if (by === "price-asc") list.sort((a, b) => a.price - b.price);
      else if (by === "price-desc") list.sort((a, b) => b.price - a.price);
      else if (by === "newest") list.sort((a, b) => b.year - a.year);
      else if (by === "name") list.sort((a, b) => Nexo.getName(a).localeCompare(Nexo.getName(b), "es"));
      return list;
    }

    function renderChips() {
      const s = state();
      const chips = [];
      if (query) chips.push({ label: `«${query}»`, clear: () => setQuery("") });
      s.platforms.forEach((v) => chips.push({ label: PLATFORM_FAMILIES[v], clear: () => uncheck("platform", v) }));
      s.genres.forEach((v) => chips.push({ label: GENRES[v], clear: () => uncheck("genre", v) }));
      if (s.max < 80) chips.push({ label: `Hasta $${s.max}`, clear: () => setPrice(80) });
      if (s.dlc) chips.push({ label: "Con DLC", clear: () => uncheck("has_dlc") });
      if (s.wish) chips.push({ label: "Favoritos", clear: () => uncheck("wishlist") });

      chipsEl.innerHTML = chips.map((c, i) => `<button type="button" class="filter-chip" data-chip="${i}">${escapeHTML(c.label)} <span aria-hidden="true">&times;</span></button>`).join("");
      if (chips.length > 1) chipsEl.innerHTML += `<button type="button" class="filter-chip-clear">Quitar todo</button>`;
      $$("[data-chip]", chipsEl).forEach((b) => b.addEventListener("click", () => chips[b.dataset.chip].clear()));
      const clearAll = $(".filter-chip-clear", chipsEl);
      if (clearAll) clearAll.addEventListener("click", resetAll);

      const n = chips.length - (query ? 1 : 0);
      openCount.hidden = n === 0;
      openCount.textContent = n;
    }

    function render() {
      const list = filtered();
      output.textContent = `$${slider.value}`;
      slider.style.setProperty("--fill", `${((slider.value - slider.min) / (slider.max - slider.min)) * 100}%`);
      if (!list.length) {
        grid.innerHTML = `
          <div class="catalog-empty">
            <p class="catalog-empty-title">Ningún juego coincide.</p>
            <p>Prueba con otros filtros o una búsqueda distinta.</p>
            <button type="button" class="btn btn-secondary btn-sm" data-reset>Limpiar filtros</button>
          </div>`;
        $("[data-reset]", grid).addEventListener("click", resetAll);
      } else {
        grid.innerHTML = list.map((p, i) => gameCardHTML(p, i)).join("");
      }
      status.textContent = `Mostrando ${list.length} de ${PRODUCTS.length} juegos`;
      total.textContent = `${list.length} ${list.length === 1 ? "juego" : "juegos"}`;
      renderChips();
    }

    function uncheck(name, value) {
      const sel = value ? `input[name="${name}"][value="${value}"]` : `input[name="${name}"]`;
      const el = $(sel, form);
      if (el) el.checked = false;
      render();
    }

    function setPrice(v) {
      slider.value = v;
      render();
    }

    function setQuery(q) {
      query = q.trim();
      const input = $("#global-search");
      if (input) input.value = query;
      const url = new URL(location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      history.replaceState(null, "", url);
      render();
    }

    function resetAll() {
      form.reset();
      slider.value = 80;
      setQuery("");
    }

    form.addEventListener("change", render);
    slider.addEventListener("input", render);
    form.addEventListener("reset", () => setTimeout(() => {
      slider.value = 80;
      render();
    }));
    sort.addEventListener("change", render);

    // Panel de filtros en móvil
    const backdrop = $(".filters-backdrop");
    const closePanel = () => {
      panel.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      document.body.classList.remove("drawer-open");
    };
    openBtn.addEventListener("click", () => {
      panel.classList.add("is-open");
      backdrop.classList.add("is-open");
      document.body.classList.add("drawer-open");
    });
    $(".filters-close").addEventListener("click", closePanel);
    backdrop.addEventListener("click", closePanel);

    // Re-render si cambian los favoritos (para el filtro "Solo mis favoritos")
    Nexo.onChange(() => {
      if ($('input[name="wishlist"]', form).checked) render();
    });

    // "Ver en el catálogo" desde Ofertas
    $$("[data-set-price]").forEach((a) => a.addEventListener("click", () => {
      resetAll();
      setPrice(Number(a.dataset.setPrice));
      sort.value = "price-asc";
      render();
    }));

    window.NexoCatalog = { setQuery };

    // Viene de la miga de pan de un producto (filtrar por su género)
    try {
      const g = sessionStorage.getItem("nexo_genre");
      if (g) {
        sessionStorage.removeItem("nexo_genre");
        const cb = $(`input[name="genre"][value="${g}"]`, form);
        if (cb) cb.checked = true;
      }
    } catch (e) { /* sin sessionStorage */ }

    render();

    if (query) {
      setTimeout(() => $("#catalog").scrollIntoView({ behavior: "auto" }), 50);
    }
  }

  /* =========================================================
     OFERTAS
     ========================================================= */
  function initOffers() {
    const codes = $("#promo-codes");
    if (codes) {
      codes.innerHTML = Object.entries(PROMO_CODES)
        .map(
          ([code, rule]) => `
          <div class="promo-code">
            <div>
              <span class="promo-code-value">${code}</span>
              <span class="promo-code-label">${rule.label}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" data-copy="${code}">Copiar</button>
          </div>`
        )
        .join("");
      codes.addEventListener("click", (e) => {
        const b = e.target.closest("[data-copy]");
        if (!b) return;
        const code = b.dataset.copy;
        const done = () => {
          b.textContent = "¡Copiado!";
          b.classList.add("is-added");
          Nexo.toast(`Código ${code} copiado`, "Pégalo en el carrito para aplicarlo.", "success", { href: "cart.html", label: "Ir al carrito" });
          setTimeout(() => {
            b.textContent = "Copiar";
            b.classList.remove("is-added");
          }, 1800);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, done);
        else done();
      });
    }
    const grid = $("#ofertas-grid");
    if (grid) {
      grid.innerHTML = PRODUCTS.filter((p) => p.price < 50)
        .sort((a, b) => a.price - b.price)
        .map((p, i) => gameCardHTML(p, i))
        .join("");
    }
  }

  /* =========================================================
     CONTADORES ANIMADOS
     ========================================================= */
  function initCounters() {
    const nums = $$("[data-count]");
    const run = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (prefersReducedMotion) {
        el.textContent = target + suffix;
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) return nums.forEach(run);
    const io = new IntersectionObserver((entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          run(en.target);
          io.unobserve(en.target);
        }
      })
    );
    nums.forEach((n) => io.observe(n));
  }

  initHero();
  initRail();
  initCatalog();
  initOffers();
  initCounters();
  observeReveals();
})();
