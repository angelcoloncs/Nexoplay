/**
 * NEXO PLAY · Confirmación del pedido + confeti
 */
(function () {
  "use strict";
  const { $, formatPrice, escapeHTML, ICON, Orders } = Nexo;

  const id = new URLSearchParams(location.search).get("id");
  const order = (id && Orders.find(id)) || Orders.all()[0];

  if (!order) {
    $(".confirm-title").textContent = "No encontramos ese pedido.";
    $(".confirm-text").innerHTML = 'Puede que ya lo hayas consultado en otro dispositivo. <a class="link-underline" href="index.html#catalog">Volver al catálogo</a>.';
    $(".confirm-badge").innerHTML = ICON("info");
    $(".confirm-keys-title").hidden = true;
    $(".confirm-total").hidden = true;
    return;
  }

  const date = new Date(order.date);
  $(".confirm-meta").innerHTML = `
    <span>Pedido <strong>${escapeHTML(order.id)}</strong></span>
    <span>${date.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })} · ${date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</span>
    <span>Enviado a <strong>${escapeHTML(order.email)}</strong></span>
    <span>Pago: <strong>${escapeHTML(order.method)}</strong></span>`;

  $(".confirm-keys").innerHTML = order.lines
    .map(
      (l, i) => `
      <div class="key-row" style="--i:${i}">
        <img src="${l.image}" alt="" />
        <div class="key-info">
          <strong>${escapeHTML(l.title)}</strong>
          <span>${PLATFORMS[l.platform].label} · ${formatPrice(l.price)}</span>
          <code class="key-code is-hidden"><span class="key-code-text">${l.key}</span></code>
        </div>
        <div class="key-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-reveal>Mostrar</button>
          <button type="button" class="btn btn-secondary btn-sm" data-copy="${l.key}">Copiar</button>
        </div>
      </div>`
    )
    .join("");

  $(".confirm-total").innerHTML = `
    <span>${order.totals.discount ? `Descuento ${escapeHTML(order.totals.promo || "")}: −${formatPrice(order.totals.discount)} · ` : ""}Total pagado</span>
    <strong>${formatPrice(order.totals.total)}</strong>`;

  $(".confirm-keys").addEventListener("click", (e) => {
    const reveal = e.target.closest("[data-reveal]");
    if (reveal) {
      const code = reveal.closest(".key-row").querySelector(".key-code");
      const hidden = code.classList.toggle("is-hidden");
      reveal.textContent = hidden ? "Mostrar" : "Ocultar";
      return;
    }
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      const done = () => {
        copy.textContent = "¡Copiada!";
        copy.classList.add("is-added");
        Nexo.toast("Clave copiada", "Canjéala en la tienda de tu plataforma.", "success");
        setTimeout(() => {
          copy.textContent = "Copiar";
          copy.classList.remove("is-added");
        }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(copy.dataset.copy).then(done, done);
      else done();
    }
  });

  /* ---------- Confeti pixelado ---------- */
  if (Nexo.prefersReducedMotion) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const colors = ["#d5ff52", "#f4f2ff", "#a99ce0", "#4b3f8a", "#7dffb0"];
  let w, h;
  const resize = () => {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  };
  resize();
  addEventListener("resize", resize);
  const parts = Array.from({ length: 160 }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 200,
    y: h * 0.35,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 14 - 4,
    s: Math.random() * 6 + 5,
    c: colors[Math.floor(Math.random() * colors.length)],
    r: Math.random() * Math.PI
  }));
  const start = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, w, h);
    const alpha = Math.max(0, 1 - (now - start) / 3500);
    ctx.globalAlpha = alpha;
    parts.forEach((p) => {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += 0.1;
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.round(p.r / (Math.PI / 4)) * (Math.PI / 4));
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      ctx.restore();
    });
    if (alpha > 0) requestAnimationFrame(frame);
    else canvas.remove();
  })(start);
})();
