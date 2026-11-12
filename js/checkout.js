/**
 * NEXO PLAY · Pago (checkout.html)
 * Validación del formulario, tarjeta animada y creación del pedido.
 */
(function () {
  "use strict";
  const { $, $$, formatPrice, escapeHTML, Cart, User, Orders } = Nexo;

  const form = $("#checkout-form");
  const payBtn = $("#co-pay");
  const items = Cart.items();

  /* ---------- Carrito vacío ---------- */
  if (!items.length) {
    form.hidden = true;
    $(".checkout-empty").hidden = false;
    $(".checkout-summary").hidden = true;
    return;
  }

  /* ---------- Resumen ---------- */
  function renderSummary() {
    const t = Cart.totals();
    $(".checkout-items").innerHTML = Cart.items()
      .map((i) => {
        const p = getProduct(i.productId);
        const dlcs = i.dlcs.map((id) => getDlc(p, id)).filter(Boolean);
        return `
        <li class="checkout-item">
          <img src="${p.image}" alt="" style="object-position:${p.focus}" />
          <div class="checkout-item-info">
            <strong>${escapeHTML(Nexo.getName(p))}</strong>
            <span>${PLATFORMS[i.platform].label}${i.qty > 1 ? ` · x${i.qty}` : ""}</span>
            ${dlcs.map((d) => `<span class="checkout-item-dlc">↳ ${escapeHTML(d.title)} · ${formatPrice(d.price)}</span>`).join("")}
          </div>
          <span class="checkout-item-price">${formatPrice(p.price * i.qty)}</span>
        </li>`;
      })
      .join("");
    $("#co-subtotal").textContent = formatPrice(t.subtotal);
    $("#co-discount-row").hidden = !t.discount;
    $("#co-discount-label").textContent = `Descuento ${t.promo || ""}`;
    $("#co-discount").textContent = "−" + formatPrice(t.discount);
    $("#co-total").textContent = formatPrice(t.total);
    payBtn.textContent = `Pagar ${formatPrice(t.total)} →`;
  }
  renderSummary();

  /* ---------- Prefill con la cuenta ---------- */
  const user = User.get();
  if (user) {
    $("#co-email").value = user.email || "";
    $("#co-name").value = user.name || "";
  }

  /* ---------- Método de pago ---------- */
  const cardPanel = $("#card-panel");
  const paypalPanel = $("#paypal-panel");
  const method = () => $('input[name="method"]:checked').value;
  $$('input[name="method"]').forEach((r) =>
    r.addEventListener("change", () => {
      cardPanel.hidden = method() !== "card";
      paypalPanel.hidden = method() !== "paypal";
    })
  );

  /* ---------- Tarjeta animada ---------- */
  const preview = $(".card-preview");
  const cardInput = $("#co-card");
  const expInput = $("#co-exp");
  const cvcInput = $("#co-cvc");
  const nameInput = $("#co-name");

  function brand(num) {
    if (/^4/.test(num)) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(num)) return "MASTERCARD";
    if (/^3[47]/.test(num)) return "AMEX";
    return "NEXO";
  }

  cardInput.addEventListener("input", () => {
    const digits = cardInput.value.replace(/\D/g, "").slice(0, 16);
    cardInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
    const padded = (digits + "•".repeat(16 - digits.length)).replace(/(.{4})/g, "$1 ").trim();
    $(".card-number").textContent = padded;
    $(".card-brand").textContent = brand(digits);
    preview.dataset.brand = brand(digits).toLowerCase();
  });

  expInput.addEventListener("input", (e) => {
    let v = expInput.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
    else if (v.length === 2 && e.inputType !== "deleteContentBackward") v += "/";
    expInput.value = v;
    $(".card-exp").textContent = v || "MM/AA";
  });

  cvcInput.addEventListener("input", () => {
    cvcInput.value = cvcInput.value.replace(/\D/g, "").slice(0, 4);
    $(".card-cvc").textContent = cvcInput.value ? "•".repeat(cvcInput.value.length) : "•••";
  });
  cvcInput.addEventListener("focus", () => preview.classList.add("is-flipped"));
  cvcInput.addEventListener("blur", () => preview.classList.remove("is-flipped"));

  const syncName = () => ($(".card-holder").textContent = nameInput.value.trim().toUpperCase() || "TU NOMBRE");
  nameInput.addEventListener("input", syncName);
  syncName();

  /* ---------- Validación ---------- */
  function luhn(num) {
    let sum = 0;
    let dbl = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = Number(num[i]);
      if (dbl) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      dbl = !dbl;
    }
    return num.length >= 13 && sum % 10 === 0;
  }

  function setError(input, msg) {
    const field = input.closest(".field");
    field.classList.toggle("has-error", !!msg);
    $(".field-error", field).textContent = msg || "";
    return !msg;
  }

  function validate() {
    let ok = true;
    const email = $("#co-email");
    ok = setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "" : "Escribe un correo válido.") && ok;
    ok = setError(nameInput, nameInput.value.trim().length >= 3 ? "" : "Escribe tu nombre completo.") && ok;

    if (method() === "card") {
      const digits = cardInput.value.replace(/\D/g, "");
      ok = setError(cardInput, luhn(digits) ? "" : "El número de tarjeta no es válido.") && ok;

      const m = expInput.value.match(/^(\d{2})\/(\d{2})$/);
      let expMsg = "Usa el formato MM/AA.";
      if (m) {
        const month = Number(m[1]);
        const year = 2000 + Number(m[2]);
        const now = new Date();
        if (month < 1 || month > 12) expMsg = "El mes no es válido.";
        else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) expMsg = "La tarjeta está vencida.";
        else expMsg = "";
      }
      ok = setError(expInput, expMsg) && ok;
      ok = setError(cvcInput, /^\d{3,4}$/.test(cvcInput.value) ? "" : "CVC de 3 o 4 dígitos.") && ok;
    }

    const terms = $("#co-terms");
    $(".terms-error").textContent = terms.checked ? "" : "Debes aceptar los términos para continuar.";
    ok = terms.checked && ok;
    return ok;
  }

  // Quitar el error al corregir
  $$(".field-input", form).forEach((input) =>
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("has-error")) setError(input, "");
    })
  );
  $("#co-terms").addEventListener("change", () => ($(".terms-error").textContent = ""));

  /* ---------- Envío ---------- */
  function makeKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const block = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `${block()}-${block()}-${block()}`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      Nexo.shake(form);
      const first = $(".has-error .field-input", form) || $("#co-terms");
      first.focus();
      Nexo.toast("Revisa el formulario", "Hay campos que necesitan tu atención.", "error");
      return;
    }

    payBtn.classList.add("is-loading");
    payBtn.textContent = "Procesando pago";

    setTimeout(() => {
      const t = Cart.totals();
      const order = {
        id: "NX-" + Date.now().toString(36).toUpperCase().slice(-6),
        date: new Date().toISOString(),
        email: $("#co-email").value.trim(),
        name: nameInput.value.trim(),
        method: method() === "card" ? `${brand(cardInput.value.replace(/\D/g, ""))} •••• ${cardInput.value.slice(-4)}` : "PayPal",
        totals: t,
        lines: Cart.items().flatMap((i) => {
          const p = getProduct(i.productId);
          const lines = [];
          for (let n = 0; n < i.qty; n++) {
            lines.push({ productId: p.id, title: Nexo.getName(p), platform: i.platform, price: p.price, image: p.image, key: makeKey() });
          }
          i.dlcs.forEach((id) => {
            const d = getDlc(p, id);
            lines.push({ productId: p.id, title: `${d.title} (DLC de ${Nexo.getName(p)})`, platform: i.platform, price: d.price, image: d.image || p.image, key: makeKey(), dlc: true });
          });
          return lines;
        })
      };
      Orders.create(order);
      Cart.clear();
      location.href = `order-confirmation.html?id=${encodeURIComponent(order.id)}`;
    }, 1600);
  });

  Nexo.onChange(renderSummary);
})();
