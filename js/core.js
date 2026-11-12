/**
 * NEXO PLAY · Núcleo compartido por todas las páginas
 * ------------------------------------------------------------
 * 1. Utilidades
 * 2. Estado (carrito, favoritos, usuario, pedidos) en localStorage
 * 3. Header y footer
 * 4. Búsqueda en vivo (Ctrl/⌘ + K)
 * 5. Notificaciones (toasts), mini carrito y animación "vuela al carrito"
 * 6. Animaciones al hacer scroll, botón "volver arriba", aviso de cookies
 */
(function () {
  "use strict";

  /* =========================================================
     1. UTILIDADES
     ========================================================= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function formatPrice(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function normalize(str) {
    return String(str).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function readStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* almacenamiento no disponible: se sigue funcionando en memoria */
    }
    memory[key] = value;
  }

  const memory = {};
  function load(key, fallback) {
    if (key in memory) return memory[key];
    memory[key] = readStore(key, fallback);
    return memory[key];
  }

  const KEYS = {
    cart: "nexo_cart_v2",
    wishlist: "nexo_wishlist",
    user: "nexo_user",
    orders: "nexo_orders",
    promo: "nexo_promo",
    cookies: "nexo_cookies_ok"
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     2. ESTADO
     ========================================================= */
  const listeners = [];
  function emit() {
    listeners.forEach((fn) => fn());
    updateBadges();
  }

  const Cart = {
    items() {
      return load(KEYS.cart, []).filter((i) => getProduct(i.productId));
    },
    save(items) {
      writeStore(KEYS.cart, items);
      emit();
    },
    count() {
      return this.items().reduce((n, i) => n + i.qty + i.dlcs.length, 0);
    },
    find(productId, platform) {
      return this.items().find((i) => i.productId === productId && (!platform || i.platform === platform));
    },
    add(productId, platform, opts = {}) {
      const product = getProduct(productId);
      if (!product) return null;
      platform = platform || product.platforms[0];
      const items = this.items();
      let item = items.find((i) => i.productId === productId && i.platform === platform);
      let isNew = false;
      if (item) {
        if (!opts.dlcId) item.qty = Math.min(item.qty + 1, 5);
      } else {
        item = { productId, platform, qty: 1, dlcs: [] };
        items.push(item);
        isNew = true;
      }
      if (opts.dlcId && !item.dlcs.includes(opts.dlcId)) item.dlcs.push(opts.dlcId);
      this.save(items);
      return { item, isNew };
    },
    setQty(productId, platform, qty) {
      const items = this.items();
      const item = items.find((i) => i.productId === productId && i.platform === platform);
      if (!item) return;
      item.qty = Math.max(1, Math.min(5, qty));
      this.save(items);
    },
    insert(item, index) {
      const items = this.items().filter((i) => !(i.productId === item.productId && i.platform === item.platform));
      items.splice(Math.min(index, items.length), 0, item);
      this.save(items);
    },
    changePlatform(productId, from, to) {
      if (from === to) return;
      const items = this.items();
      const item = items.find((i) => i.productId === productId && i.platform === from);
      if (!item) return;
      const other = items.find((i) => i.productId === productId && i.platform === to);
      if (other) {
        other.qty = Math.min(5, other.qty + item.qty);
        item.dlcs.forEach((d) => { if (!other.dlcs.includes(d)) other.dlcs.push(d); });
        items.splice(items.indexOf(item), 1);
      } else {
        item.platform = to;
      }
      this.save(items);
    },
    remove(productId, platform) {
      this.save(this.items().filter((i) => !(i.productId === productId && i.platform === platform)));
    },
    removeDlc(productId, platform, dlcId) {
      const items = this.items();
      const item = items.find((i) => i.productId === productId && i.platform === platform);
      if (item) item.dlcs = item.dlcs.filter((d) => d !== dlcId);
      this.save(items);
    },
    clear() {
      this.save([]);
      Promo.clear();
    },
    totals() {
      let games = 0;
      let dlc = 0;
      let soulsSubtotal = 0;
      let gameCount = 0;
      let dlcCount = 0;
      this.items().forEach((i) => {
        const p = getProduct(i.productId);
        const g = p.price * i.qty;
        const d = i.dlcs.reduce((s, id) => s + (getDlc(p, id) ? getDlc(p, id).price : 0), 0);
        games += g;
        dlc += d;
        gameCount += i.qty;
        dlcCount += i.dlcs.length;
        if (SOULS_IDS.includes(p.id)) soulsSubtotal += g + d;
      });
      const subtotal = games + dlc;
      const promo = Promo.get();
      let discount = 0;
      if (promo) {
        const rule = PROMO_CODES[promo];
        if (rule.type === "percent") {
          discount = (rule.onlySouls ? soulsSubtotal : subtotal) * (rule.value / 100);
        } else if (rule.type === "fixed" && subtotal >= (rule.min || 0)) {
          discount = rule.value;
        }
      }
      discount = Math.round(Math.min(discount, subtotal) * 100) / 100;
      return { games, dlc, subtotal, discount, total: subtotal - discount, gameCount, dlcCount, promo };
    }
  };

  const Promo = {
    get() {
      const code = load(KEYS.promo, null);
      return code && PROMO_CODES[code] ? code : null;
    },
    apply(code) {
      code = String(code || "").trim().toUpperCase();
      if (!PROMO_CODES[code]) return { ok: false, message: "Ese código no existe o ha caducado." };
      writeStore(KEYS.promo, code);
      emit();
      return { ok: true, message: `Código ${code} aplicado: ${PROMO_CODES[code].label}.` };
    },
    clear() {
      writeStore(KEYS.promo, null);
      emit();
    }
  };

  const Wishlist = {
    ids() {
      return load(KEYS.wishlist, []).filter((id) => getProduct(id));
    },
    has(id) {
      return this.ids().includes(id);
    },
    toggle(id) {
      const ids = this.ids();
      const on = !ids.includes(id);
      writeStore(KEYS.wishlist, on ? [...ids, id] : ids.filter((x) => x !== id));
      emit();
      return on;
    }
  };

  const User = {
    get() {
      return load(KEYS.user, null);
    },
    login(data) {
      writeStore(KEYS.user, data);
      emit();
    },
    logout() {
      writeStore(KEYS.user, null);
      emit();
    }
  };

  const Orders = {
    all() {
      return load(KEYS.orders, []);
    },
    create(order) {
      const orders = this.all();
      orders.unshift(order);
      writeStore(KEYS.orders, orders);
      return order;
    },
    find(id) {
      return this.all().find((o) => o.id === id) || null;
    }
  };

  /* =========================================================
     3. HEADER Y FOOTER
     ========================================================= */
  const ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  };

  function currentPage() {
    const file = location.pathname.split("/").pop() || "index.html";
    return file.replace(".html", "") || "index";
  }

  function renderHeader() {
    const container = $("#header-container");
    if (!container) return;
    const page = currentPage();
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const user = User.get();
    const links = [
      { href: "index.html", label: "Inicio", key: "inicio" },
      { href: "index.html#catalog", label: "Catálogo", key: "catalog" },
      { href: "index.html#novedades", label: "Novedades", key: "novedades" },
      { href: "index.html#ofertas", label: "Ofertas", key: "ofertas" }
    ];
    let active = "";
    if (page === "index") active = location.hash ? location.hash.slice(1) : "inicio";
    if (page === "product") active = "catalog";

    container.innerHTML = `
      <a class="skip-link" href="#main-content">Saltar al contenido</a>
      <header class="navbar" id="site-navbar">
        <div class="navbar-wrapper">
          <div class="navbar-top">
            <button type="button" class="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-links">${ICONS.menu}</button>
            <a href="index.html" class="brand-logo" aria-label="NEXO PLAY, inicio">NEXO<span class="brand-logo-accent">&nbsp;PLAY</span></a>

            <div class="navbar-right">
              <form class="search-box" role="search" action="index.html" autocomplete="off">
                <span class="search-icon">${ICONS.search}</span>
                <input type="search" name="q" id="global-search" placeholder="Busca tu próxima aventura"
                  aria-label="Buscar juegos" aria-autocomplete="list" aria-controls="search-results" />
                <kbd class="cmd-badge">${isMac ? "⌘" : "Ctrl"} K</kbd>
                <div class="search-results" id="search-results" role="listbox" hidden></div>
              </form>

              <div class="user-menu">
                <a href="account.html#favoritos" class="icon-link wishlist-link" aria-label="Favoritos">
                  ${ICONS.heart}
                  <span class="icon-link-count" data-wishlist-count hidden>0</span>
                </a>
                <a href="account.html" class="account-btn">
                  ${ICONS.user}
                  <span class="account-btn-label">${user ? escapeHTML(user.name.split(" ")[0]) : "Mi cuenta"}</span>
                </a>
                <a href="cart.html" class="cart-btn" aria-label="Ver carrito" data-cart-trigger>
                  ${ICONS.bag}
                  <span class="cart-count" data-cart-count>0</span>
                </a>
              </div>
            </div>
          </div>

          <div class="navbar-bottom">
            <nav class="nav-links" id="nav-links" aria-label="Navegación principal">
              ${links.map((l) => `<a href="${l.href}" data-nav="${l.key}" class="${active === l.key ? "active" : ""}">${l.label}</a>`).join("")}
            </nav>
            <p class="navbar-tagline">Grandes mundos. Una sola tienda.</p>
          </div>
        </div>
      </header>`;

    initHeaderBehaviour();
  }

  function renderFooter() {
    const container = $("#footer-container");
    if (!container) return;
    container.innerHTML = `
      <section class="footer-cta reveal">
        <div class="footer-cta-inner">
          <div>
            <h2 class="footer-cta-title">Menos ruido. Más juego.</h2>
            <p class="footer-cta-text">Un catálogo corto y elegido a mano. Apúntate y te avisamos de novedades y códigos antes que nadie.</p>
          </div>
          <form class="newsletter-form" novalidate>
            <label class="visually-hidden" for="newsletter-email">Correo electrónico</label>
            <input type="email" id="newsletter-email" class="newsletter-input" placeholder="tu@correo.com" required />
            <button type="submit" class="btn btn-primary">Suscribirme</button>
            <p class="newsletter-feedback" aria-live="polite"></p>
          </form>
        </div>
      </section>

      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-grid">
            <div class="footer-col footer-brand">
              <a href="index.html" class="footer-logo">NEXO PLAY</a>
              <p class="footer-text">Grandes mundos. Una sola tienda.</p>
              <nav class="footer-social" aria-label="Redes sociales">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord ↗</a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube ↗</a>
              </nav>
            </div>

            <div class="footer-col">
              <h3 class="footer-heading">Explora</h3>
              <nav class="footer-links" aria-label="Explora">
                <a href="index.html#catalog">Catálogo</a>
                <a href="index.html#novedades">Novedades</a>
                <a href="index.html#ofertas">Ofertas</a>
                <a href="index.html#sobre">Sobre NEXO</a>
                <a href="index.html#faq">Preguntas frecuentes</a>
              </nav>
            </div>

            <div class="footer-col">
              <h3 class="footer-heading">Tu cuenta</h3>
              <nav class="footer-links" aria-label="Tu cuenta">
                <a href="account.html">Mi cuenta</a>
                <a href="account.html#pedidos">Mis pedidos</a>
                <a href="account.html#favoritos">Favoritos</a>
                <a href="cart.html">Carrito</a>
              </nav>
            </div>

            <div class="footer-col">
              <h3 class="footer-heading">Estamos al otro lado</h3>
              <a class="footer-email" href="mailto:hola@nexoplay.com">hola@nexoplay.com</a>
              <p class="footer-text">Lun–vie · 9:00–18:00</p>
              <p class="footer-text">Respuesta en menos de 24 h</p>
            </div>
          </div>

          <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} NEXO PLAY · Proyecto académico, sin fines comerciales.</p>
            <nav class="footer-legal" aria-label="Enlaces legales">
              <a href="terms.html#privacidad">Privacidad</a>
              <a href="terms.html">Términos</a>
              <a href="terms.html#cookies">Cookies</a>
              <a href="terms.html#contacto_terms">Contacto</a>
            </nav>
          </div>
        </div>
      </footer>

      <button type="button" class="back-to-top" aria-label="Volver arriba">${ICONS.arrowUp}</button>`;

    const form = $(".newsletter-form", container);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $(".newsletter-input", form);
      const fb = $(".newsletter-feedback", form);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
        fb.textContent = "Escribe un correo válido.";
        fb.className = "newsletter-feedback is-error";
        input.focus();
        shake(form);
        return;
      }
      fb.textContent = "¡Listo! Tu primer código: NEXO10.";
      fb.className = "newsletter-feedback is-success";
      input.value = "";
      toast("Suscripción confirmada", "Usa NEXO10 para un 10% en tu carrito.", "success");
    });

    const toTop = $(".back-to-top", container);
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
    window.addEventListener(
      "scroll",
      () => {
        toTop.classList.toggle("is-visible", window.scrollY > 600);
        const nav = $("#site-navbar");
        if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 10);
      },
      { passive: true }
    );
  }

  function initHeaderBehaviour() {
    const toggle = $(".nav-toggle");
    const links = $("#nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const open = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.innerHTML = open ? ICONS.close : ICONS.menu;
      });
    }

    // Enlaces con ancla en la propia página: marcar activo
    $$(".nav-links a").forEach((a) => {
      a.addEventListener("click", () => {
        $$(".nav-links a").forEach((x) => x.classList.remove("active"));
        a.classList.add("active");
        if (links) links.classList.remove("is-open");
      });
    });

    // El icono del carrito abre el mini carrito (salvo en el carrito o el pago)
    const trigger = $("[data-cart-trigger]");
    if (trigger && !["cart", "checkout"].includes(currentPage())) {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        openDrawer();
      });
    }

    initSearch();
    updateBadges();
  }

  let lastCount = null;
  function updateBadges() {
    const count = Cart.count();
    $$("[data-cart-count]").forEach((b) => {
      b.textContent = count;
      b.classList.toggle("is-empty", count === 0);
      if (lastCount !== null && count > lastCount) {
        b.classList.remove("bump");
        void b.offsetWidth;
        b.classList.add("bump");
      }
    });
    lastCount = count;

    const wish = Wishlist.ids().length;
    $$("[data-wishlist-count]").forEach((b) => {
      b.textContent = wish;
      b.hidden = wish === 0;
    });
    if ($("#cart-drawer.is-open")) renderDrawer();
  }

  /* =========================================================
     4. BÚSQUEDA EN VIVO
     ========================================================= */
  function searchProducts(query) {
    const q = normalize(query.trim());
    if (!q) return [];
    return PRODUCTS.filter((p) => {
      const hay = normalize(
        [getProductName(p), p.developer, p.publisher, GENRES[p.genre], p.platforms.map((k) => PLATFORMS[k].label).join(" ")].join(" ")
      );
      return q.split(/\s+/).every((word) => hay.includes(word));
    });
  }

  function initSearch() {
    const form = $(".search-box");
    const input = $("#global-search");
    const box = $("#search-results");
    if (!form || !input || !box) return;
    let index = -1;

    const params = new URLSearchParams(location.search);
    if (params.get("q")) input.value = params.get("q");

    function render() {
      const results = searchProducts(input.value).slice(0, 6);
      index = -1;
      if (!input.value.trim()) {
        box.hidden = true;
        return;
      }
      box.hidden = false;
      if (!results.length) {
        box.innerHTML = `<p class="search-empty">Sin resultados para «${escapeHTML(input.value)}».</p>`;
        return;
      }
      box.innerHTML =
        results
          .map(
            (p) => `
          <a class="search-result" role="option" href="product.html?id=${p.id}">
            <img src="${p.image}" alt="" loading="lazy" style="object-position:${p.focus}" />
            <span class="search-result-text">
              <strong>${escapeHTML(getProductName(p))}</strong>
              <small>${GENRES[p.genre]} · ${p.platforms.map((k) => PLATFORMS[k].short).join(" · ")}</small>
            </span>
            <span class="search-result-price">${formatPrice(p.price)}</span>
          </a>`
          )
          .join("") + `<button type="submit" class="search-all">Ver todos los resultados →</button>`;
    }

    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", (e) => {
      const items = $$(".search-result", box);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        index = (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle("is-active", i === index));
      } else if (e.key === "Enter" && index >= 0 && items[index]) {
        e.preventDefault();
        location.href = items[index].href;
      } else if (e.key === "Escape") {
        box.hidden = true;
        input.blur();
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (currentPage() === "index" && window.NexoCatalog) {
        box.hidden = true;
        window.NexoCatalog.setQuery(q);
        const cat = $("#catalog");
        if (cat) cat.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      } else {
        location.href = `index.html?q=${encodeURIComponent(q)}#catalog`;
      }
    });

    document.addEventListener("click", (e) => {
      if (!form.contains(e.target)) box.hidden = true;
    });

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* =========================================================
     5. TOASTS, MINI CARRITO Y ANIMACIONES DE COMPRA
     ========================================================= */
  function toast(title, text, type = "info", action) {
    let stack = $(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${type === "success" ? ICONS.check : type === "error" ? ICONS.close : ICONS.info}</span>
      <div class="toast-body">
        <strong class="toast-title">${escapeHTML(title)}</strong>
        ${text ? `<p class="toast-text">${escapeHTML(text)}</p>` : ""}
      </div>
      ${action ? (action.onClick ? `<button type="button" class="toast-action">${escapeHTML(action.label)}</button>` : `<a class="toast-action" href="${action.href}">${escapeHTML(action.label)}</a>`) : ""}
      <button type="button" class="toast-close" aria-label="Cerrar aviso">${ICONS.close}</button>
      <span class="toast-progress"></span>`;
    stack.appendChild(el);
    while (stack.children.length > 3) stack.firstElementChild.remove();
    const close = () => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 300);
    };
    $(".toast-close", el).addEventListener("click", close);
    if (action && action.onClick) {
      $(".toast-action", el).addEventListener("click", () => {
        action.onClick();
        close();
      });
    }
    setTimeout(close, action && action.onClick ? 6000 : 4200);
    if (action && action.onClick) $(".toast-progress", el).style.animationDuration = "6s";
  }

  function shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  function flyToCart(sourceImg) {
    const target = $(".cart-btn");
    if (!sourceImg || !target || prefersReducedMotion) return;
    const from = sourceImg.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width) return;
    const clone = sourceImg.cloneNode();
    clone.className = "fly-to-cart";
    Object.assign(clone.style, {
      left: from.left + "px",
      top: from.top + "px",
      width: from.width + "px",
      height: from.height + "px"
    });
    document.body.appendChild(clone);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    clone.animate(
      [
        { transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 },
        { transform: `translate(${dx * 0.6}px, ${dy - 80}px) scale(0.45) rotate(-8deg)`, opacity: 0.9, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(12deg)`, opacity: 0.2 }
      ],
      { duration: 750, easing: "cubic-bezier(.5,-0.1,.4,1)" }
    ).onfinish = () => clone.remove();
  }

  function ensureDrawer() {
    if ($("#cart-drawer")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="drawer-backdrop" data-drawer-close></div>
      <aside class="cart-drawer" id="cart-drawer" aria-label="Mini carrito" aria-hidden="true">
        <div class="drawer-head">
          <h2 class="drawer-title">Tu carrito</h2>
          <button type="button" class="drawer-close" data-drawer-close aria-label="Cerrar carrito">${ICONS.close}</button>
        </div>
        <div class="drawer-body"></div>
        <div class="drawer-foot"></div>
      </aside>`;
    document.body.append(...wrap.children);
    $$("[data-drawer-close]").forEach((el) => el.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  function renderDrawer() {
    const body = $("#cart-drawer .drawer-body");
    const foot = $("#cart-drawer .drawer-foot");
    const items = Cart.items();
    if (!items.length) {
      body.innerHTML = `<div class="drawer-empty"><p>Tu carrito está vacío.</p><a class="btn btn-secondary" href="index.html#catalog">Explorar catálogo →</a></div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = items
      .map((i) => {
        const p = getProduct(i.productId);
        return `
        <div class="drawer-item">
          <img src="${p.image}" alt="" style="object-position:${p.focus}" />
          <div class="drawer-item-info">
            <a href="product.html?id=${p.id}" class="drawer-item-title">${escapeHTML(getProductName(p))}</a>
            <span class="drawer-item-meta">${PLATFORMS[i.platform].label} · x${i.qty}${i.dlcs.length ? ` · +${i.dlcs.length} DLC` : ""}</span>
          </div>
          <span class="drawer-item-price">${formatPrice(p.price * i.qty + i.dlcs.reduce((s, d) => s + getDlc(p, d).price, 0))}</span>
          <button type="button" class="drawer-item-remove" aria-label="Eliminar ${escapeHTML(getProductName(p))}" data-remove="${p.id}|${i.platform}">${ICONS.trash}</button>
        </div>`;
      })
      .join("");
    const t = Cart.totals();
    foot.innerHTML = `
      <div class="drawer-total"><span>Subtotal</span><strong>${formatPrice(t.subtotal)}</strong></div>
      ${t.discount ? `<div class="drawer-total drawer-discount"><span>Descuento ${t.promo}</span><strong>−${formatPrice(t.discount)}</strong></div>` : ""}
      <a href="checkout.html" class="btn btn-primary btn-block">Pagar ${formatPrice(t.total)} →</a>
      <a href="cart.html" class="btn btn-secondary btn-block">Ver carrito completo</a>`;
    $$("[data-remove]", body).forEach((btn) =>
      btn.addEventListener("click", () => {
        const [id, platform] = btn.dataset.remove.split("|");
        Cart.remove(id, platform);
        renderDrawer();
      })
    );
  }

  function openDrawer() {
    ensureDrawer();
    renderDrawer();
    document.body.classList.add("drawer-open");
    $("#cart-drawer").classList.add("is-open");
    $("#cart-drawer").setAttribute("aria-hidden", "false");
    setTimeout(() => $(".drawer-close").focus(), 50);
  }

  function closeDrawer() {
    const d = $("#cart-drawer");
    if (!d || !d.classList.contains("is-open")) return;
    d.classList.remove("is-open");
    d.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
  }

  /**
   * Añade un juego (o un DLC) al carrito con todas las animaciones.
   * @param {string} productId
   * @param {object} opts { platform, dlcId, sourceImg, button, silent }
   */
  function addToCart(productId, opts = {}) {
    const p = getProduct(productId);
    if (!p) return;
    const platform = opts.platform || p.platforms[0];
    const hadBase = !!Cart.find(productId, platform);
    const prevItem = Cart.find(productId, platform);
    if (!opts.dlcId && prevItem && prevItem.qty >= 5) {
      toast("Límite alcanzado", "Puedes comprar hasta 5 copias de un mismo juego.", "error");
      return;
    }
    if (opts.dlcId && prevItem && prevItem.dlcs.includes(opts.dlcId)) {
      toast("Ya está en tu carrito", `${getDlc(p, opts.dlcId).title} ya está añadido.`, "info", { href: "cart.html", label: "Ver" });
      return;
    }
    Cart.add(productId, platform, { dlcId: opts.dlcId });
    flyToCart(opts.sourceImg);

    if (opts.button) {
      const btn = opts.button;
      if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
      btn.classList.add("is-added");
      btn.innerHTML = `${ICONS.check}<span>Añadido</span>`;
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.classList.remove("is-added");
        btn.innerHTML = btn.dataset.label;
      }, 1600);
    }

    if (opts.silent) return;
    if (opts.dlcId) {
      const dlc = getDlc(p, opts.dlcId);
      toast(
        `${dlc.title} añadido`,
        hadBase ? `Expansión para ${getProductName(p)}.` : `También añadimos ${getProductName(p)} (${PLATFORMS[platform].short}), necesario para jugarlo.`,
        "success",
        { href: "cart.html", label: "Ver carrito" }
      );
    } else {
      toast(`${getProductName(p)} añadido`, `${PLATFORMS[platform].label} · ${formatPrice(p.price)}`, "success", { href: "cart.html", label: "Ver carrito" });
    }
  }

  function toggleWishlist(productId, button) {
    const on = Wishlist.toggle(productId);
    const p = getProduct(productId);
    $$(`[data-wish="${productId}"]`).forEach((b) => {
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", on ? "Quitar de favoritos" : "Añadir a favoritos");
    });
    if (button && !prefersReducedMotion) {
      button.classList.remove("pop");
      void button.offsetWidth;
      button.classList.add("pop");
    }
    toast(on ? "Guardado en favoritos" : "Quitado de favoritos", getProductName(p), on ? "success" : "info", on ? { href: "account.html#favoritos", label: "Ver" } : null);
  }

  /* =========================================================
     6. TARJETA DE JUEGO REUTILIZABLE
     ========================================================= */
  function platformChips(p, max = 3) {
    const chips = p.platforms.slice(0, max).map((k) => `<span class="platform-chip">${PLATFORMS[k].short}</span>`);
    if (p.platforms.length > max) chips.push(`<span class="platform-chip">+${p.platforms.length - max}</span>`);
    return chips.join("");
  }

  function gameCardHTML(p, i = 0) {
    const wished = Wishlist.has(p.id);
    return `
      <article class="game-card" data-id="${p.id}" style="--i:${i}">
        <a href="product.html?id=${p.id}" class="game-card-media ${p.wide ? "is-wide" : ""}" style="--cover:url('${p.image}')" aria-label="Ver ${escapeHTML(getProductName(p))}">
          ${p.badge ? `<span class="game-card-badge">${p.badge}</span>` : ""}
          <img src="${p.image}" alt="Portada de ${escapeHTML(getProductName(p))}" class="game-card-img" loading="lazy" style="object-position:${p.focus}" />
          <span class="game-card-shine" aria-hidden="true"></span>
        </a>
        <button type="button" class="wish-btn ${wished ? "is-active" : ""}" data-wish="${p.id}" aria-pressed="${wished}" aria-label="${wished ? "Quitar de favoritos" : "Añadir a favoritos"}">${ICONS.heart}</button>
        <div class="game-card-info">
          <div class="game-card-platforms">${platformChips(p)}</div>
          <h3 class="game-card-title"><a href="product.html?id=${p.id}">${escapeHTML(p.displayTitle || p.title)}</a></h3>
          <p class="game-card-subtitle">${p.displayTitle ? GENRES[p.genre] : escapeHTML(p.subtitle)}</p>
          <p class="game-card-genre">${GENRES[p.genre]} · ${p.year}</p>
          <div class="game-card-bottom">
            <p class="game-card-price">${formatPrice(p.price)}</p>
            <button type="button" class="btn-add-cart" data-add="${p.id}" aria-label="Añadir ${escapeHTML(getProductName(p))} al carrito">
              ${ICONS.bag}<span>Añadir</span>
            </button>
          </div>
        </div>
      </article>`;
  }

  // Delegación global: botones de añadir y favoritos dentro de cualquier tarjeta
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      e.preventDefault();
      const card = add.closest(".game-card");
      addToCart(add.dataset.add, { sourceImg: card ? $("img", card) : null, button: add });
      return;
    }
    const wish = e.target.closest("[data-wish]");
    if (wish) {
      e.preventDefault();
      toggleWishlist(wish.dataset.wish, wish);
    }
  });

  /* =========================================================
     7. SCROLL REVEAL, COOKIES Y ARRANQUE
     ========================================================= */
  let revealObserver = null;
  function observeReveals(root = document) {
    const els = $$(".reveal:not(.is-visible)", root);
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              revealObserver.unobserve(en.target);
            }
          }),
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
    }
    els.forEach((el) => revealObserver.observe(el));
  }

  function cookieNotice() {
    if (load(KEYS.cookies, false)) return;
    const el = document.createElement("div");
    el.className = "cookie-notice";
    el.innerHTML = `
      <p>Usamos almacenamiento local para guardar tu carrito y tus favoritos. <a href="terms.html#cookies">Más información</a></p>
      <button type="button" class="btn btn-primary btn-sm">Entendido</button>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    $("button", el).addEventListener("click", () => {
      writeStore(KEYS.cookies, true);
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 400);
    });
  }

  function init() {
    renderHeader();
    renderFooter();
    observeReveals();
    cookieNotice();
    document.body.classList.add("is-ready");
  }

  // Cambios hechos en otra pestaña
  window.addEventListener("storage", (e) => {
    if (Object.values(KEYS).includes(e.key)) {
      delete memory[e.key];
      emit();
    }
  });

  // API pública
  window.Nexo = {
    $,
    $$,
    ICONS,
    formatPrice,
    escapeHTML,
    getName: getProductName,
    ICON: (name) => ICONS[name] || "",
    normalize,
    Cart,
    Promo,
    Wishlist,
    User,
    Orders,
    addToCart,
    toggleWishlist,
    toast,
    shake,
    flyToCart,
    openDrawer,
    gameCardHTML,
    platformChips,
    searchProducts,
    observeReveals,
    onChange: (fn) => listeners.push(fn),
    prefersReducedMotion
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
