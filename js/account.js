/**
 * NEXO PLAY · Mi cuenta
 * Inicio de sesión / registro (demostración local), pedidos y favoritos.
 */
(function () {
  "use strict";
  const { $, $$, formatPrice, escapeHTML, User, Orders, Wishlist } = Nexo;

  const guest = $("#account-guest");
  const dash = $("#account-dashboard");
  const form = $("#account-form");
  const message = $(".account-form-message");
  let mode = "login";

  /* ---------- Cambiar entre iniciar sesión y registrarse ---------- */
  function setMode(next) {
    mode = next;
    const reg = mode === "register";
    $$(".account-tab").forEach((t) => {
      const on = t.dataset.mode === mode;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    $$("[data-register-only]").forEach((el) => (el.hidden = !reg));
    $$("[data-login-only]").forEach((el) => (el.hidden = reg));
    $(".account-card-step").textContent = reg ? "01 / CREA TU PERFIL" : "01 / IDENTIFÍCATE";
    $(".account-card-title").textContent = reg ? "Crear cuenta" : "Iniciar sesión";
    $(".account-card-subtitle").textContent = reg ? "Solo necesitas un nombre, un correo y una contraseña." : "Introduce tus datos para continuar.";
    $(".account-submit-btn").textContent = reg ? "Crear mi cuenta →" : "Entrar en NEXO →";
    $(".account-card-bottom-text").textContent = reg ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?";
    $("[data-switch]").textContent = reg ? "Iniciar sesión ↗" : "Crear cuenta ↗";
    $("#account-password").autocomplete = reg ? "new-password" : "current-password";
    message.textContent = "";
    $$(".field", form).forEach((f) => {
      f.classList.remove("has-error");
      $(".field-error", f).textContent = "";
    });
    const card = $(".account-card");
    card.classList.remove("is-switching");
    void card.offsetWidth;
    card.classList.add("is-switching");
  }

  $$(".account-tab").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));
  $("[data-switch]").addEventListener("click", () => setMode(mode === "login" ? "register" : "login"));

  /* ---------- Mostrar contraseña ---------- */
  const pwd = $("#account-password");
  $("#account-toggle-password").addEventListener("click", (e) => {
    const show = pwd.type === "password";
    pwd.type = show ? "text" : "password";
    e.currentTarget.textContent = show ? "Ocultar" : "Mostrar";
    pwd.focus();
  });

  /* ---------- Medidor de fuerza ---------- */
  const meter = $(".pwd-meter");
  pwd.addEventListener("input", () => {
    if (mode !== "register") return;
    const v = pwd.value;
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) score++;
    meter.dataset.score = score;
  });

  /* ---------- ¿Olvidaste tu contraseña? ---------- */
  $(".account-link-forgot").addEventListener("click", () => {
    const email = $("#account-email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      setError(email, "Escribe tu correo y te enviaremos un enlace.");
      email.focus();
      return;
    }
    message.className = "account-form-message is-success";
    message.textContent = `Si existe una cuenta con ${email.value.trim()}, recibirás un enlace para restablecer la contraseña.`;
  });

  /* ---------- Validación y envío ---------- */
  function setError(input, msg) {
    const field = input.closest(".field");
    field.classList.toggle("has-error", !!msg);
    $(".field-error", field).textContent = msg || "";
    return !msg;
  }

  $$(".field-input", form).forEach((i) => i.addEventListener("input", () => setError(i, "")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#account-name");
    const email = $("#account-email");
    let ok = true;
    if (mode === "register") ok = setError(name, name.value.trim().length >= 2 ? "" : "Escribe tu nombre.") && ok;
    ok = setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "" : "Escribe un correo válido.") && ok;
    ok = setError(pwd, pwd.value.length >= 6 ? "" : "La contraseña debe tener al menos 6 caracteres.") && ok;
    if (!ok) {
      Nexo.shake($(".account-card"));
      return;
    }

    const btn = $(".account-submit-btn");
    btn.classList.add("is-loading");
    setTimeout(() => {
      btn.classList.remove("is-loading");
      const mail = email.value.trim().toLowerCase();
      const fallbackName = mail.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      User.login({ name: mode === "register" ? name.value.trim() : fallbackName, email: mail, since: new Date().toISOString() });
      Nexo.toast(mode === "register" ? "¡Cuenta creada!" : "¡Bienvenido de nuevo!", "Tu progreso queda guardado en este navegador.", "success");
      form.reset();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  });

  /* ---------- Panel ---------- */
  $("#btn-logout").addEventListener("click", () => {
    User.logout();
    Nexo.toast("Sesión cerrada", "¡Hasta la próxima partida!", "info");
    render();
  });

  function renderOrders() {
    const orders = Orders.all();
    const el = $(".orders-list");
    if (!orders.length) {
      el.innerHTML = `<div class="dash-empty"><p>Aún no tienes pedidos.</p><a class="btn btn-primary btn-sm" href="index.html#catalog">Explorar catálogo →</a></div>`;
      return;
    }
    el.innerHTML = orders
      .map((o, idx) => {
        const d = new Date(o.date);
        return `
        <details class="order-card" ${idx === 0 ? "open" : ""}>
          <summary class="order-head">
            <span class="order-id">${escapeHTML(o.id)}</span>
            <span class="order-date">${d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</span>
            <span class="order-count">${o.lines.length} ${o.lines.length === 1 ? "clave" : "claves"}</span>
            <span class="order-status">Completado</span>
            <strong class="order-total">${formatPrice(o.totals.total)}</strong>
          </summary>
          <ul class="order-lines">
            ${o.lines
              .map(
                (l) => `
              <li class="order-line">
                <img src="${l.image}" alt="">
                <div><strong>${escapeHTML(l.title)}</strong><span>${PLATFORMS[l.platform].label}</span></div>
                <code class="order-key">${l.key}</code>
                <button type="button" class="btn btn-secondary btn-sm" data-copy="${l.key}">Copiar</button>
              </li>`
              )
              .join("")}
          </ul>
        </details>`;
      })
      .join("");
  }

  $(".orders-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const done = () => {
      b.textContent = "¡Copiada!";
      Nexo.toast("Clave copiada", b.dataset.copy, "success");
      setTimeout(() => (b.textContent = "Copiar"), 1500);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, done);
    else done();
  });

  function renderWishlist() {
    const ids = Wishlist.ids();
    const grid = $(".wishlist-grid");
    if (!ids.length) {
      grid.innerHTML = `<div class="dash-empty"><p>Todavía no tienes favoritos. Pulsa ♥ en cualquier juego para guardarlo aquí.</p><a class="btn btn-secondary btn-sm" href="index.html#catalog">Buscar juegos →</a></div>`;
      return;
    }
    grid.innerHTML = ids.map((id, i) => Nexo.gameCardHTML(getProduct(id), i)).join("");
  }

  function render() {
    const user = User.get();
    guest.hidden = !!user;
    dash.hidden = !user;
    if (user) {
      const initials = user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
      $(".dash-avatar").textContent = initials;
      $(".dash-title").textContent = `Hola, ${user.name.split(" ")[0]}.`;
      $(".dash-email").textContent = user.email;
      const orders = Orders.all();
      $("#stat-orders").textContent = orders.length;
      $("#stat-games").textContent = orders.reduce((n, o) => n + o.lines.length, 0);
      $("#stat-wish").textContent = Wishlist.ids().length;
      $("#stat-spent").textContent = formatPrice(orders.reduce((n, o) => n + o.totals.total, 0));
      renderOrders();
      const label = $(".account-btn-label");
      if (label) label.textContent = user.name.split(" ")[0];
    } else {
      const label = $(".account-btn-label");
      if (label) label.textContent = "Mi cuenta";
    }
    renderWishlist();
  }

  Nexo.onChange(() => {
    renderWishlist();
    const user = User.get();
    if (user) $("#stat-wish").textContent = Wishlist.ids().length;
  });

  render();

  // Ir a la sección indicada por la URL
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target && !target.closest("[hidden]")) setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 200);
  }
})();
