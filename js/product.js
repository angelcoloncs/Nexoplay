/**
 * NEXO PLAY · Ficha de producto (product.html?id=...)
 */
(function () {
  "use strict";
  const { $, $$, formatPrice, escapeHTML, ICON, Cart, Wishlist } = Nexo;

  const params = new URLSearchParams(location.search);
  const product = getProduct(params.get("id")) || PRODUCTS[0];
  const name = Nexo.getName(product);
  let platform = params.get("platform") && product.platforms.includes(params.get("platform")) ? params.get("platform") : product.platforms[0];

  /* ---------- Datos principales ---------- */
  document.title = `${name} · NEXO PLAY`;
  $(".breadcrumb-current").textContent = name;
  const genreLink = $(".breadcrumb-genre");
  genreLink.textContent = GENRES[product.genre];
  genreLink.href = "index.html#catalog";
  genreLink.addEventListener("click", () => sessionStorage.setItem("nexo_genre", product.genre));

  const cover = $(".product-cover-img");
  cover.src = product.image;
  cover.alt = `Portada de ${name}`;
  cover.style.objectPosition = product.focus;
  if (product.wide) $(".product-cover-frame").classList.add("is-wide");
  $(".product-cover-frame").style.setProperty("--cover", `url('${product.image}')`);
  $(".product-cover-title").textContent = product.displayTitle || product.title;
  $(".product-cover-edition").textContent = product.displayTitle ? GENRES[product.genre] : product.subtitle;

  $(".product-badge-year").textContent = product.year;
  if (product.badge) $(".product-badge-edition").textContent = product.badge;
  $(".product-title").textContent = product.displayTitle || product.title;
  $(".product-edition").textContent = product.displayTitle ? product.tagline : product.subtitle;
  $(".product-description").innerHTML = product.description.map((p) => `<p>${escapeHTML(p)}</p>`).join("");
  $(".product-price").textContent = formatPrice(product.price);

  $(".product-spec-pills").innerHTML = [GENRES[product.genre], product.players, product.developer, `${product.year}`]
    .map((t) => `<span class="spec-pill">${escapeHTML(t)}</span>`)
    .join("");

  /* ---------- Selector de plataforma ---------- */
  const picker = $(".platform-picker-options");
  picker.innerHTML = product.platforms
    .map(
      (k) => `
      <label class="platform-option">
        <input type="radio" name="platform" value="${k}" ${k === platform ? "checked" : ""}>
        <span class="platform-option-box">
          <span class="platform-option-short">${PLATFORMS[k].short}</span>
          <span class="platform-option-label">${PLATFORMS[k].label}</span>
        </span>
      </label>`
    )
    .join("");
  picker.addEventListener("change", (e) => {
    platform = e.target.value;
    const url = new URL(location.href);
    url.searchParams.set("platform", platform);
    history.replaceState(null, "", url);
    updateCartState();
  });

  /* ---------- Acciones ---------- */
  const addBtn = $(".btn-primary-buy");
  addBtn.addEventListener("click", () => Nexo.addToCart(product.id, { platform, sourceImg: cover, button: addBtn }));

  $(".btn-buy-now").addEventListener("click", (e) => {
    if (!Cart.find(product.id, platform)) Nexo.addToCart(product.id, { platform, silent: true });
    e.currentTarget.classList.add("is-loading");
    setTimeout(() => (location.href = "checkout.html"), 350);
  });

  const wishBtn = $(".product-wish");
  wishBtn.dataset.wish = product.id;
  function paintWish() {
    const on = Wishlist.has(product.id);
    wishBtn.classList.toggle("is-active", on);
    wishBtn.setAttribute("aria-pressed", String(on));
    wishBtn.innerHTML = `${ICON("heart")}<span>${on ? "En favoritos" : "Añadir a favoritos"}</span>`;
  }
  paintWish();

  const shareBtn = $(".product-share");
  shareBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span>`;
  shareBtn.addEventListener("click", async () => {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `${name} en NEXO PLAY`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      Nexo.toast("Enlace copiado", "Ya puedes pegarlo donde quieras.", "success");
    } catch (err) {
      if (err && err.name === "AbortError") return;
      Nexo.toast("No se pudo copiar", url, "info");
    }
  });

  const inCart = $(".product-in-cart");
  function updateCartState() {
    const item = Cart.find(product.id, platform);
    inCart.hidden = !item;
    if (item) {
      inCart.innerHTML = `${ICON("check")} Tienes ${item.qty} ${item.qty === 1 ? "copia" : "copias"} para ${PLATFORMS[platform].short} en tu carrito · <a href="cart.html">Ver carrito</a>`;
    }
    $(".sticky-buy-platform").textContent = PLATFORMS[platform].label;
    renderDlcs();
  }

  /* ---------- DLC ---------- */
  const dlcSection = $(".product-dlc-section");
  const dlcList = $(".dlc-items-list");
  function renderDlcs() {
    if (!product.dlcs || !product.dlcs.length) return;
    dlcSection.hidden = false;
    $(".dlc-section-subtitle").textContent = `Contenido adicional para ${name}. Requiere el juego base (si no lo tienes en el carrito, lo añadimos por ti).`;
    const item = Cart.find(product.id, platform);
    dlcList.innerHTML = product.dlcs
      .map((dlc) => {
        const owned = item && item.dlcs.includes(dlc.id);
        return `
        <article class="dlc-card ${owned ? "is-owned" : ""}">
          <div class="dlc-card-left">
            <div class="dlc-thumb-badge ${dlc.image ? "has-image" : ""}" aria-hidden="true">
              ${dlc.image ? `<img src="${dlc.image}" alt="">` : `<span>${dlc.icon || "☉"}</span>`}
            </div>
            <div class="dlc-card-info">
              <h3 class="dlc-title">${escapeHTML(dlc.title)}</h3>
              <p class="dlc-description">${escapeHTML(dlc.description)} · Requiere ${escapeHTML(name)}</p>
            </div>
          </div>
          <div class="dlc-card-right">
            <span class="dlc-price">${formatPrice(dlc.price)}</span>
            <button type="button" class="btn-dlc-add" data-dlc="${dlc.id}" ${owned ? "disabled" : ""}>
              ${owned ? `${ICON("check")} En el carrito` : "Agregar"}
            </button>
          </div>
        </article>`;
      })
      .join("");
  }
  dlcList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dlc]");
    if (!btn) return;
    const card = btn.closest(".dlc-card");
    Nexo.addToCart(product.id, { platform, dlcId: btn.dataset.dlc, sourceImg: $("img", card) || cover });
  });

  /* ---------- Ficha técnica ---------- */
  const row = (k, v) => `<div class="req-spec-row"><dt class="req-label">${k}</dt><dd class="req-value">${escapeHTML(v)}</dd></div>`;
  $("#spec-game").innerHTML = [
    row("Desarrollador", product.developer),
    row("Editor", product.publisher),
    row("Lanzamiento", String(product.year)),
    row("Género", GENRES[product.genre]),
    row("Modo de juego", product.players),
    row("Formato", "Clave digital")
  ].join("");
  $("#spec-platforms").innerHTML = product.platforms.map((k) => row(PLATFORMS[k].label, PLATFORMS[k].short)).join("");

  /* ---------- Relacionados ---------- */
  const related = PRODUCTS.filter((p) => p.id !== product.id)
    .map((p) => ({ p, score: (p.genre === product.genre ? 2 : 0) + (p.developer === product.developer ? 3 : 0) + p.platforms.filter((k) => product.platforms.includes(k)).length * 0.3 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x, i) => Nexo.gameCardHTML(x.p, i));
  $(".related-grid").innerHTML = related.join("");

  /* ---------- Barra de compra fija ---------- */
  const sticky = $(".sticky-buy");
  $(".sticky-buy-img").src = product.image;
  $(".sticky-buy-title").textContent = name;
  $(".sticky-buy-price").textContent = formatPrice(product.price);
  const stickyBtn = $(".sticky-buy-btn");
  stickyBtn.addEventListener("click", () => Nexo.addToCart(product.id, { platform, sourceImg: $(".sticky-buy-img"), button: stickyBtn }));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      const show = !en.isIntersecting && en.boundingClientRect.top < 0;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", String(!show));
      stickyBtn.tabIndex = show ? 0 : -1;
    }).observe($(".product-purchase-box"));
  }

  Nexo.onChange(() => {
    updateCartState();
    paintWish();
  });
  updateCartState();
})();
