# NEXO PLAY · Tienda de videojuegos

Tienda web de videojuegos. El proyecto está construido con HTML, CSS y
JavaScript sin framework para que cada integrante pueda aportar una sección
de forma independiente.

## Estructura

```text
index.html                 Inicio: carrusel, novedades, catálogo con filtros, ofertas, FAQ
product.html               Ficha de juego (product.html?id=cyberpunk-2077)
cart.html                  Carrito (cantidades, plataforma, DLC, códigos promocionales)
checkout.html              Pago con validación y tarjeta animada
order-confirmation.html    Confirmación del pedido con claves y confeti
account.html               Iniciar sesión / crear cuenta, pedidos y favoritos
terms.html                 Términos y condiciones
main.css                   Variables, botones, tarjetas, toasts y animaciones globales
js/data.js                 Catálogo de juegos, plataformas, géneros y códigos promocionales
js/core.js                 Header, footer, carrito, favoritos, búsqueda y notificaciones
js/*.js                    Un script por página
Features/                  Estilos específicos por funcionalidad
assets/img/                Portadas de juegos y DLC
```

### Añadir un juego

Abre `js/data.js`, copia un objeto del array `PRODUCTS`, cambia sus datos y
pon la portada en `assets/img/games/`. El catálogo, la búsqueda, los filtros
y la ficha se generan solos.

### Códigos de prueba

- Cupones: `NEXO10`, `SOULS15`, `BIENVENIDA`
- Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC

Todo se guarda en el `localStorage` del navegador (carrito, favoritos,
sesión y pedidos). No hay servidor ni pagos reales.

## Flujo de trabajo

`main` debe mantenerse estable. Cada tarea se desarrolla en una rama propia
creada desde `main`:

```bash
git switch main
git pull origin main
git switch -c feature/nombre-de-la-tarea
```

Ejemplos de nombres:

```text
feature/home-page
feature/catalog
feature/product-page
feature/cart
feature/account
```

Al terminar, sube la rama y abre un Pull Request hacia `main`:

```bash
git add .
git commit -m "Añade estructura del catálogo"
git push -u origin feature/catalog
```

No se debe hacer `push` directamente a `main`. Antes de fusionar, otra
persona debe revisar el Pull Request y comprobar la página en el navegador.

## Convenciones

- Usa HTML semántico (`header`, `nav`, `main`, `section`, `article` y `footer`).
- Usa nombres de clases en minúsculas y `kebab-case`.
- Mantén los estilos específicos dentro de `Features/`.
- Usa `main.css` solo para estilos globales compartidos.
- No uses estilos inline.
- Añade `alt` descriptivo a las imágenes.
- Si una tarea requiere modificar un archivo compartido, indícalo en el Pull
  Request para coordinarlo con el resto del equipo.

## Comprobación local

Abre `index.html` en un navegador o usa una extensión de servidor local de
VS Code. Revisa los enlaces, la consola del navegador y la vista móvil antes
de crear el Pull Request.
