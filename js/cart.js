/**
 * NEXO PLAY · Página del carrito
 */
(function () {
  "use strict";
  const { $, $$, formatPrice, escapeHTML, ICON, Cart, Promo, prefersReducedMotion } = Nexo;

  const list = $("#cart-items-container");
  const notice = $("#cart-notice");
  const clearBtn = $("#btn-clear-cart");
  const checkout = $("#btn-checkout");

  /* ---------- Números animados en el resumen ---------- */
  const shown = {};
  function tween(id, value, prefix = "") {
    const el = document.getElementById(id);
    if (!el) return;
    const from = shown[id] ?? value;
    shown[id] = value;
    if (prefersReducedMotion || from === value) {
      el.textContent = prefix + formatPrice(value);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 450, 1);
      const v = from + (value - from) * (1 - Math.pow(1 - t, 3));
      el.textContent = prefix + formatPrice(v);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  /* ---------- Render ---------- */
  function itemHTML(item, index) {
    const p = getProduct(item.productId);
    const name = Nexo.getName(p);
    const key = `${p.id}|${item.platform}`;
    const dlcs = item.dlcs
      .map((id) => getDlc(p, id))
      .filter(Boolean)
      .map(
        (dlc) => `
        <div class="cart-item-row cart-item-dlc">
          <div class="cart-dlc-tag"><span class="cart-dlc-arrow">&#8627;</span> DLC para ${escapeHTML(name)} · Requiere el juego base</div>
          <div class="cart-dlc-content">
            <div class="cart-dlc-badge ${dlc.image ? "has-image" : ""}" aria-hidden="true">
              ${dlc.image ? `<img src="${dlc.image}" alt="">` : `<span>${dlc.icon || "☉"}</span>`}
            </div>
            <div class="cart-item-info">
              <h3 class="cart-item-title">${escapeHTML(dlc.title)}</h3>
              <p class="cart-item-meta">${PLATFORMS[item.platform].short} · Expansión digital · Cantidad: 1</p>
              <p class="cart-item-price">${formatPrice(dlc.price)}</p>
            </div>
            <div class="cart-item-actions">
              <button type="button" class="btn-remove-item" data-remove-dlc="${key}|${dlc.id}" aria-label="Eliminar ${escapeHTML(dlc.title)}">
                ${ICON("trash")}<span class="remove-text">Eliminar</span>
              </button>
            </div>
          </div>
        </div>`
      )
      .join("");

    const moreDlc = (p.dlcs || []).filter((d) => !item.dlcs.includes(d.id));
    const upsell = moreDlc.length
      ? `<div class="cart-upsell">
          <span>¿Completas la experiencia?</span>
          ${moreDlc.map((d) => `<button type="button" class="cart-upsell-btn" data-add-dlc="${key}|${d.id}">+ ${escapeHTML(d.title)} <strong>${formatPrice(d.price)}</strong></button>`).join("")}
        </div>`
      : "";

    return `
      <article class="cart-card ${item.dlcs.length ? "cart-card-bundle" : ""}" data-key="${key}" style="--i:${index}">
        <div class="cart-item-row cart-item-base">
          <a href="product.html?id=${p.id}&platform=${item.platform}" class="cart-item-media ${p.wide ? "is-wide" : ""}">
            <img src="${p.image}" alt="Portada de ${escapeHTML(name)}" class="cart-item-thumb" style="object-position:${p.focus}" />
          </a>
          <div class="cart-item-info">
            <h2 class="cart-item-title"><a href="product.html?id=${p.id}&platform=${item.platform}">${escapeHTML(p.displayTitle || p.title)}</a></h2>
            <p class="cart-item-edition">${escapeHTML(p.displayTitle ? GENRES[p.genre] : p.subtitle)}</p>
            <div class="cart-item-controls">
              <label class="cart-platform">
                <span class="visually-hidden">Plataforma</span>
                <select class="cart-platform-select" data-platform="${key}">
                  ${p.platforms.map((k) => `<option value="${k}" ${k === item.platform ? "selected" : ""}>${PLATFORMS[k].label}</option>`).join("")}
                </select>
              </label>
              <div class="qty-stepper" role="group" aria-label="Cantidad">
                <button type="button" data-qty="${key}|-1" aria-label="Quitar una copia" ${item.qty <= 1 ? "disabled" : ""}>−</button>
                <output aria-live="polite">${item.qty}</output>
                <button type="button" data-qty="${key}|1" aria-label="Añadir una copia" ${item.qty >= 5 ? "disabled" : ""}>+</button>
              </div>
            </div>
            <p class="cart-item-price">${formatPrice(p.price * item.qty)}${item.qty > 1 ? `<small>${formatPrice(p.price)} c/u</small>` : ""}</p>
          </div>
          <div class="cart-item-actions">
            <button type="button" class="btn-remove-item" data-remove="${key}" aria-label="Eliminar ${escapeHTML(name)}">
              ${ICON("trash")}<span class="remove-text">Eliminar</span>
            </button>
          </div>
        </div>
        ${dlcs}
        ${upsell}
      </article>`;
  }

  function emptyHTML() {
    const picks = PRODUCTS.filter((p) => p.featured).slice(0, 4);
    return `
      <div class="cart-empty">
        <div class="cart-empty-art" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <p class="cart-empty-title">GAME OVER… por ahora.</p>
        <p class="cart-empty-text">Tu carrito está vacío. Estos juegos están esperando un jugador:</p>
        <div class="cart-empty-picks">${picks.map((p, i) => Nexo.gameCardHTML(p, i)).join("")}</div>
      </div>`;
  }

  function render() {
    const items = Cart.items();
    const t = Cart.totals();

    if (!items.length) {
      list.innerHTML = emptyHTML();
    } else {
      list.innerHTML = items.map(itemHTML).join("");
    }
    notice.hidden = !items.some((i) => i.dlcs.length);
    clearBtn.hidden = !items.length;
    checkout.classList.toggle("is-disabled", !items.length);
    checkout.setAttribute("aria-disabled", String(!items.length));

    $("#cart-dynamic-subtitle").textContent = items.length
      ? `${t.gameCount + t.dlcCount} ${t.gameCount + t.dlcCount === 1 ? "artículo" : "artículos"} · ${t.gameCount} ${t.gameCount === 1 ? "juego" : "juegos"} y ${t.dlcCount} DLC · Entrega digital`
      : "Aún no has elegido tu próxima aventura.";
    $("#summary-games-label").textContent = `Juegos (${t.gameCount})`;
    $("#summary-dlc-label").textContent = `DLC (${t.dlcCount})`;
    $("#summary-discount-label").textContent = t.promo ? `Descuento ${t.promo}` : "Descuentos";
    tween("summary-games-price", t.games);
    tween("summary-dlc-price", t.dlc);
    tween("summary-subtotal", t.subtotal);
    tween("summary-discounts", t.discount, t.discount ? "−" : "");
    tween("summary-total-price", t.total);
    $("#summary-discounts").classList.toggle("is-discount", t.discount > 0);

    renderPromo();
  }

  /* ---------- Acciones sobre artículos ---------- */
  list.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      const [id, platform] = rm.dataset.remove.split("|");
      const items = Cart.items();
      const index = items.findIndex((i) => i.productId === id && i.platform === platform);
      const removed = JSON.parse(JSON.stringify(items[index]));
      const card = rm.closest(".cart-card");
      const done = () => {
        Cart.remove(id, platform);
        const extra = removed.dlcs.length ? ` y ${removed.dlcs.length} DLC` : "";
        Nexo.toast("Eliminado del carrito", `${Nexo.getName(getProduct(id))}${extra}.`, "info", {
          label: "Deshacer",
          onClick: () => {
            Cart.insert(removed, index);
            Nexo.toast("Restaurado", Nexo.getName(getProduct(id)), "success");
          }
        });
      };
      if (prefersReducedMotion) done();
      else {
        card.classList.add("is-removing");
        setTimeout(done, 320);
      }
      return;
    }

    const rmDlc = e.target.closest("[data-remove-dlc]");
    if (rmDlc) {
      const [id, platform, dlcId] = rmDlc.dataset.removeDlc.split("|");
      const row = rmDlc.closest(".cart-item-dlc");
      row.classList.add("is-removing");
      setTimeout(() => {
        Cart.removeDlc(id, platform, dlcId);
        Nexo.toast("DLC eliminado", getDlc(getProduct(id), dlcId).title, "info", {
          label: "Deshacer",
          onClick: () => Cart.add(id, platform, { dlcId })
        });
      }, prefersReducedMotion ? 0 : 280);
      return;
    }

    const addDlc = e.target.closest("[data-add-dlc]");
    if (addDlc) {
      const [id, platform, dlcId] = addDlc.dataset.addDlc.split("|");
      Nexo.addToCart(id, { platform, dlcId });
      return;
    }

    const qty = e.target.closest("[data-qty]");
    if (qty) {
      const [id, platform, delta] = qty.dataset.qty.split("|");
      const item = Cart.find(id, platform);
      if (item) Cart.setQty(id, platform, item.qty + Number(delta));
    }
  });

  list.addEventListener("change", (e) => {
    const sel = e.target.closest("[data-platform]");
    if (!sel) return;
    const [id, from] = sel.dataset.platform.split("|");
    Cart.changePlatform(id, from, sel.value);
    Nexo.toast("Plataforma actualizada", `${Nexo.getName(getProduct(id))} · ${PLATFORMS[sel.value].label}`, "success");
  });

  clearBtn.addEventListener("click", () => {
    const backup = Cart.items();
    const promo = Promo.get();
    Cart.clear();
    Nexo.toast("Carrito vaciado", `${backup.length} ${backup.length === 1 ? "juego eliminado" : "juegos eliminados"}.`, "info", {
      label: "Deshacer",
      onClick: () => {
        Cart.save(backup);
        if (promo) Promo.apply(promo);
      }
    });
  });

  checkout.addEventListener("click", (e) => {
    if (!Cart.items().length) {
      e.preventDefault();
      Nexo.toast("Tu carrito está vacío", "Añade al menos un juego para continuar.", "error");
    }
  });

  /* ---------- Código promocional ---------- */
  const promoForm = $("#promo-form");
  const promoInput = $("#promo-input");
  const promoFb = $(".promo-feedback");

  function renderPromo() {
    const code = Promo.get();
    if (code) {
      promoForm.classList.add("has-code");
      promoFb.className = "promo-feedback is-success";
      const t = Cart.totals();
      const rule = PROMO_CODES[code];
      let extra = "";
      if (rule.type === "fixed" && t.subtotal < rule.min) extra = ` (se activa desde ${formatPrice(rule.min)})`;
      if (rule.onlySouls && t.discount === 0 && t.subtotal > 0) extra = " (no hay juegos Souls en tu carrito)";
      promoFb.innerHTML = `<strong>${code}</strong> · ${rule.label}${extra} <button type="button" class="promo-remove">Quitar</button>`;
      $(".promo-remove", promoFb).addEventListener("click", () => {
        Promo.clear();
        Nexo.toast("Código eliminado", code, "info");
      });
    } else {
      promoForm.classList.remove("has-code");
      if (promoFb.classList.contains("is-success")) {
        promoFb.textContent = "";
        promoFb.className = "promo-feedback";
      }
    }
  }

  promoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!promoInput.value.trim()) {
      promoFb.className = "promo-feedback is-error";
      promoFb.textContent = "Escribe un código.";
      Nexo.shake(promoForm);
      return;
    }
    const res = Promo.apply(promoInput.value);
    if (!res.ok) {
      promoFb.className = "promo-feedback is-error";
      promoFb.textContent = res.message;
      Nexo.shake(promoForm);
      return;
    }
    promoInput.value = "";
    Nexo.toast("¡Código aplicado!", res.message, "success");
  });

  Nexo.onChange(render);
  render();
})();
