/**
 * NEXO PLAY · Catálogo de juegos
 * ------------------------------------------------------------
 * Para añadir un juego, copia un objeto del array y cambia sus datos.
 * - id:        identificador único (se usa en la URL: product.html?id=...)
 * - platforms: claves de PLATFORMS (abajo). La primera es la predeterminada.
 * - genre:     clave de GENRES (abajo).
 * - focus:     posición de la imagen cuando se recorta (CSS object-position).
 * - dlcs:      contenido descargable (opcional).
 */

const PLATFORMS = {
  ps5: { label: "PlayStation 5", short: "PS5", family: "playstation" },
  ps4: { label: "PlayStation 4", short: "PS4", family: "playstation" },
  "xbox-series": { label: "Xbox Series X|S", short: "XSX|S", family: "xbox" },
  "xbox-one": { label: "Xbox One", short: "XB1", family: "xbox" },
  switch2: { label: "Nintendo Switch 2", short: "NS2", family: "nintendo" },
  switch: { label: "Nintendo Switch", short: "NSW", family: "nintendo" },
  pc: { label: "PC", short: "PC", family: "pc" }
};

const PLATFORM_FAMILIES = {
  playstation: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  pc: "PC"
};

const GENRES = {
  "accion-aventura": "Acción y aventura",
  "rpg-accion": "RPG de acción",
  jrpg: "JRPG",
  plataformas: "Plataformas",
  carreras: "Carreras"
};

const PRODUCTS = [
  {
    id: "god-of-war-ragnarok",
    title: "God of War",
    subtitle: "Ragnarök",
    price: 59.99,
    genre: "accion-aventura",
    platforms: ["ps5", "ps4", "pc"],
    year: 2022,
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    players: "1 jugador",
    image: "assets/img/games/god-of-war-ragnarok.jpg",
    focus: "center 30%",
    badge: "DESTACADO",
    featured: true,
    tagline: "El Fimbulwinter ya está aquí. Recorre los Nueve Reinos antes del fin.",
    description: [
      "La secuela de God of War (2018), aclamada por la crítica. God of War Ragnarök continúa con el Fimbulwinter en plena marcha: Kratos y Atreus deben viajar a cada uno de los Nueve Reinos en busca de respuestas mientras las fuerzas de Odín en Asgard se preparan para una batalla profetizada que acabará con el mundo.",
      "En el camino explorarán paisajes impresionantes y míticos, y se enfrentarán a dioses y monstruos nórdicos. A medida que Ragnarök se acerca, Kratos y Atreus deberán elegir entre la seguridad de su familia y la de los reinos."
    ]
  },
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk",
    subtitle: "2077",
    price: 59.99,
    genre: "rpg-accion",
    platforms: ["ps5", "xbox-series", "pc", "switch2", "ps4"],
    year: 2020,
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    players: "1 jugador",
    image: "assets/img/games/cyberpunk-2077.jpg",
    focus: "28% center",
    badge: "CON DLC",
    featured: true,
    tagline: "Night City no perdona. Busca el implante que concede la inmortalidad.",
    description: [
      "Cyberpunk 2077 es un RPG de acción de mundo abierto de CD Projekt Red, ambientado en Night City, una megalópolis obsesionada con el poder, el estilo y las modificaciones corporales.",
      "Juegas como V, un mercenario que busca un implante único que concede la inmortalidad. Tú decides cómo construir a tu personaje, con distintos estilos de combate (armas, hackeo o sigilo) y decisiones que influyen en la historia. En el reparto destaca Keanu Reeves como Johnny Silverhand."
    ],
    dlcs: [
      {
        id: "phantom-liberty",
        title: "Phantom Liberty",
        description: "Expansión de historia · Espionaje en Dogtown",
        price: 29.99,
        image: "assets/img/dlc/cyberpunk-phantom-liberty.jpg"
      }
    ]
  },
  {
    id: "zelda-ocarina-of-time",
    title: "The Legend of Zelda",
    subtitle: "Ocarina of Time",
    price: 69.99,
    genre: "accion-aventura",
    platforms: ["switch2"],
    year: 2026,
    developer: "Nintendo",
    publisher: "Nintendo",
    players: "1 jugador",
    image: "assets/img/games/zelda-ocarina-of-time.jpg",
    focus: "center",
    badge: "NOVEDAD",
    featured: true,
    tagline: "El clásico de 1998, rehecho desde cero para el 40.º aniversario.",
    description: [
      "The Legend of Zelda: Ocarina of Time (remake) es una reinterpretación completa del clásico de Nintendo 64 de 1998, anunciada oficialmente para Nintendo Switch 2 como parte del 40.º aniversario de la saga. Nintendo la reveló en un Nintendo Direct el 9 de junio de 2026.",
      "Es un remake hecho desde cero que añade salto manual, carrera, control libre de cámara, doblaje completo, un nuevo registro de misiones y gráficos reconstruidos. La historia sigue siendo la misma: acompañas a Link a través de dos épocas de Hyrule, resolviendo mazmorras para evitar que Ganondorf consiga la Trifuerza."
    ]
  },
  {
    id: "marvels-wolverine",
    title: "Marvel's",
    subtitle: "Wolverine",
    price: 69.99,
    genre: "accion-aventura",
    platforms: ["ps5"],
    year: 2026,
    developer: "Insomniac Games",
    publisher: "Sony Interactive Entertainment",
    players: "1 jugador",
    image: "assets/img/games/marvels-wolverine.jpg",
    focus: "center",
    badge: "NOVEDAD",
    featured: true,
    tagline: "Narrativa cinematográfica y combate rápido, de los creadores de Spider-Man.",
    description: [
      "Marvel's Wolverine es un juego de acción y aventura de un solo jugador, desarrollado por Insomniac Games (los creadores de la saga Marvel's Spider-Man) y publicado por Sony Interactive Entertainment.",
      "Es una exclusiva de PlayStation 5, con un enfoque en la historia de Wolverine que combina narrativa cinematográfica y combate rápido."
    ]
  },
  {
    id: "mario-kart-world",
    title: "Mario Kart",
    subtitle: "World",
    price: 79.99,
    genre: "carreras",
    platforms: ["switch2"],
    year: 2025,
    developer: "Nintendo EPD",
    publisher: "Nintendo",
    players: "Hasta 24 jugadores",
    image: "assets/img/games/mario-kart-world.jpg",
    focus: "center 20%",
    badge: "MULTIJUGADOR",
    tagline: "Mundo abierto, rally por eliminación y carreras de hasta 24 jugadores.",
    description: [
      "Mario Kart World (2025) es un juego de carreras de karts desarrollado por Nintendo EPD y publicado por Nintendo para Nintendo Switch 2. Como en entregas anteriores, controlas a personajes de la saga Mario y compites contra otros corredores.",
      "Introduce un diseño y un modo de mundo abierto, técnicas de conducción todoterreno, un modo de rally por eliminación y disfraces desbloqueables para los personajes. Las carreras admiten hasta 24 jugadores, el doble que su predecesor, Mario Kart 8 Deluxe."
    ]
  },
  {
    id: "phantom-blade-zero",
    title: "Phantom Blade",
    subtitle: "Zero",
    price: 59.99,
    genre: "rpg-accion",
    platforms: ["ps5", "xbox-series", "pc"],
    year: 2026,
    developer: "S-Game",
    publisher: "S-Game",
    players: "1 jugador",
    image: "assets/img/games/phantom-blade-zero.jpg",
    focus: "center",
    wide: true,
    badge: "NOVEDAD",
    tagline: "Te quedan sesenta y seis días de vida. Úsalos bien.",
    description: [
      "Phantom Blade Zero es un juego de rol de acción wuxia desarrollado y publicado por el estudio chino S-Game. El jugador asume el papel de Soul, un asesino de élite de la Orden, incriminado por el asesinato del Soberano de la Sombra y perseguido por sus antiguos compañeros.",
      "Con una herida fatal en el corazón y revivido con el corazón contaminado, sólo le quedan sesenta y seis días de vida. Ambientada en el Mundo Fantasma, la historia se centra en su misión de restaurar su corazón y desentrañar la conspiración que lo ha condenado."
    ]
  },
  {
    id: "god-of-war",
    title: "God of War",
    subtitle: "(2018)",
    price: 49.99,
    genre: "accion-aventura",
    platforms: ["ps4", "ps5", "pc"],
    year: 2018,
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    players: "1 jugador",
    image: "assets/img/games/god-of-war.jpg",
    focus: "center 40%",
    tagline: "Kratos y Atreus en tierras nórdicas: el reinicio de la saga.",
    description: [
      "God of War es un juego de acción y aventura desarrollado por Santa Monica Studio y publicado por Sony Interactive Entertainment para PlayStation 4 (y luego para PC en 2022).",
      "Funciona como un reinicio suave de la saga: Kratos deja atrás Grecia y, junto a su hijo Atreus, emprende un viaje por los reinos de la mitología nórdica."
    ]
  },
  {
    id: "ff7-rebirth",
    title: "Final Fantasy VII",
    subtitle: "Rebirth",
    price: 49.99,
    genre: "rpg-accion",
    platforms: ["ps5", "pc", "xbox-series", "switch2"],
    year: 2024,
    developer: "Square Enix",
    publisher: "Square Enix",
    players: "1 jugador",
    image: "assets/img/games/ff7-rebirth.jpg",
    focus: "center",
    tagline: "El viaje continúa más allá de Midgar, tras los pasos de Sephiroth.",
    description: [
      "Final Fantasy VII Rebirth es un juego de rol de acción de 2024 desarrollado y publicado por Square Enix. Es la secuela de Final Fantasy VII Remake (2020) y la segunda entrega de la trilogía que rehace el Final Fantasy VII de 1997.",
      "Combina acción en tiempo real con elementos estratégicos y de rol. Justo después de los eventos de Remake, Cloud Strife y AVALANCHE recorren el Planeta para evitar que Shinra explote el Mako y para derrotar al ex SOLDADO de élite Sephiroth, que busca unirse con el Planeta para lograr un mayor poder."
    ]
  },
  {
    id: "ff7-remake-intergrade",
    title: "Final Fantasy VII",
    subtitle: "Remake Intergrade",
    price: 39.99,
    genre: "rpg-accion",
    platforms: ["ps5", "ps4", "pc", "xbox-series", "switch2"],
    year: 2021,
    developer: "Square Enix",
    publisher: "Square Enix",
    players: "1 jugador",
    image: "assets/img/games/ff7-remake-intergrade.jpg",
    focus: "center",
    tagline: "Midgar, AVALANCHE y Shinra: la primera parte de la trilogía.",
    description: [
      "Final Fantasy VII Remake (2020) es un juego de rol de acción de Square Enix y la primera entrega de la trilogía que rehace el Final Fantasy VII original de 1997. La versión mejorada Intergrade llegó a PS5 y PC en 2021, y a Switch 2 y Xbox Series X|S en 2026.",
      "Se ambienta en Midgar, una metrópolis ciberpunk distópica, donde el mercenario Cloud Strife se une al grupo ecoterrorista AVALANCHE para frenar a la megacorporación Shinra, que usa la energía vital del planeta como fuente de energía. Su combate es en tiempo real, en lugar del sistema por turnos del original."
    ]
  },
  {
    id: "persona-5-royal",
    title: "Persona 5",
    subtitle: "Royal",
    price: 59.99,
    genre: "jrpg",
    platforms: ["ps5", "ps4", "xbox-series", "switch", "pc"],
    year: 2020,
    developer: "Atlus",
    publisher: "Sega",
    players: "1 jugador",
    image: "assets/img/games/persona-5-royal.jpg",
    focus: "center",
    tagline: "Estudiante de día, Ladrón Fantasma de noche. Roba sus corazones.",
    description: [
      "Persona 5 Royal es la edición definitiva del JRPG de Atlus. Encarnas a un estudiante de secundaria que de día lleva una vida normal en Tokio y de noche se une a los Ladrones Fantasma, un grupo que se infiltra en los «Palacios», versiones distorsionadas de los corazones de adultos corruptos, para robar sus deseos retorcidos y cambiar sus conductas.",
      "Combina combates por turnos con invocación de Personas, mazmorras llenas de puzles y una vida social en la que gestionas tu tiempo, estudias y haces amistades que mejoran tus habilidades."
    ]
  },
  {
    id: "persona-3-reload",
    title: "Persona 3",
    subtitle: "Reload",
    price: 59.99,
    genre: "jrpg",
    platforms: ["ps5", "ps4", "xbox-series", "pc", "switch2"],
    year: 2024,
    developer: "Atlus",
    publisher: "Sega",
    players: "1 jugador",
    image: "assets/img/games/persona-3-reload.jpg",
    focus: "center",
    tagline: "La Hora Oscura te espera entre un día y el siguiente.",
    description: [
      "Persona 3 Reload es el remake completo del clásico JRPG de Atlus, reconstruido desde cero con gráficos modernos, nueva banda sonora y mejoras de jugabilidad. Interpretas a un estudiante que se une a S.E.E.S. y descubre la «Hora Oscura», una hora oculta entre un día y otro en la que acechan las Sombras.",
      "Alterna combates por turnos y exploración de la torre Tártaro con la vida escolar, donde gestionas tu tiempo, estudias y fortaleces vínculos sociales que potencian a tu Persona. Su tono es más sombrío y emotivo que el de otros títulos de la saga."
    ]
  },
  {
    id: "dark-souls-3",
    title: "Dark Souls",
    subtitle: "III",
    price: 59.99,
    genre: "rpg-accion",
    platforms: ["ps4", "xbox-one", "pc"],
    year: 2016,
    developer: "FromSoftware",
    publisher: "Bandai Namco",
    players: "1 jugador · Online",
    image: "assets/img/games/dark-souls-3.jpg",
    focus: "center",
    badge: "CON DLC",
    tagline: "La Primera Llama se extingue. El último capítulo de la trilogía.",
    description: [
      "Dark Souls III es un juego de rol de acción desarrollado por FromSoftware y publicado por Bandai Namco para PS4, Xbox One y PC. Es la tercera y última entrega de la trilogía Dark Souls.",
      "Sigues al Ashen One, un guerrero «no encendido», en una misión que involucra a los Señores de la Ceniza y la Primera Llama que se extingue. Se juega en tercera persona, y usas armas, armaduras, magia, escudos y objetos consumibles para combatir a los enemigos."
    ],
    dlcs: [
      {
        id: "ashes-of-ariandel",
        title: "Ashes of Ariandel",
        description: "Expansión · El mundo pintado de Ariandel",
        price: 14.99,
        icon: "❄"
      },
      {
        id: "the-ringed-city",
        title: "The Ringed City",
        description: "Expansión final · El fin del mundo",
        price: 14.99,
        icon: "◎"
      }
    ]
  },
  {
    id: "dark-souls-remastered",
    title: "Dark Souls",
    subtitle: "Remastered",
    price: 39.99,
    genre: "rpg-accion",
    platforms: ["ps4", "xbox-one", "switch", "pc"],
    year: 2018,
    developer: "FromSoftware",
    publisher: "Bandai Namco",
    players: "1 jugador · Online",
    image: "assets/img/games/dark-souls-remastered.jpg",
    focus: "center",
    tagline: "Lordran te espera. ¿Sobrevivirás a un millón de muertes?",
    description: [
      "Dark Souls Remastered devuelve a una nueva generación el clásico de rol de acción de FromSoftware, ahora con mejoras gráficas y de rendimiento. Explora el sombrío reino de Lordran, un mundo interconectado lleno de trampas mortales, criaturas grotescas y jefes colosales.",
      "Aprende de cada muerte, descansa en las hogueras (a costa de que los enemigos reaparezcan) e interactúa con otros jugadores, ya sea invocándolos para cooperar o invadiendo sus mundos para combatir. ¿Podrás sobrevivir a un millón de muertes y forjar tu legado?"
    ]
  },
  {
    id: "dark-souls-2",
    title: "Dark Souls II",
    subtitle: "Scholar of the First Sin",
    price: 39.99,
    genre: "rpg-accion",
    platforms: ["pc", "ps4", "xbox-one"],
    year: 2015,
    developer: "FromSoftware",
    publisher: "Bandai Namco",
    players: "1 jugador · Online",
    image: "assets/img/games/dark-souls-2.jpg",
    focus: "center",
    wide: true,
    tagline: "La edición definitiva. Drangleic no perdona a los impacientes.",
    description: [
      "La edición definitiva del aclamado RPG de acción de FromSoftware. Adéntrate en el reino de Drangleic, una tierra sumida en la decadencia donde cada paso puede ser el último.",
      "Como Portador de la Maldición, deberás enfrentarte a jefes colosales, criaturas implacables y trampas mortales en busca de una cura para el Hollowing. Aquí no hay atajos: cada muerte te enseña algo, y cada victoria se gana con paciencia, habilidad y estrategia."
    ]
  },
  {
    id: "demons-souls",
    title: "Demon's",
    subtitle: "Souls",
    price: 69.99,
    genre: "rpg-accion",
    platforms: ["ps5"],
    year: 2020,
    developer: "Bluepoint Games · Japan Studio",
    publisher: "Sony Interactive Entertainment",
    players: "1 jugador · Online",
    image: "assets/img/games/demons-souls.jpg",
    focus: "center",
    tagline: "El origen de los Souls, rehecho para PlayStation 5.",
    description: [
      "Demon's Souls es un juego de rol de acción desarrollado por Japan Studio y Bluepoint Games, y publicado por Sony Interactive Entertainment para PS5. Es un remake del Demon's Souls original, creado por FromSoftware para PS3 en 2009.",
      "Recibió gran aclamación de la crítica, que elogió su jugabilidad, su apartado visual, sus aspectos técnicos y sus mejoras respecto al original, y vendió 1,857 millones de copias hasta 2022."
    ]
  },
  {
    id: "bloodborne",
    title: "Blood",
    subtitle: "borne",
    displayTitle: "Bloodborne",
    price: 19.99,
    genre: "rpg-accion",
    platforms: ["ps4"],
    year: 2015,
    developer: "FromSoftware",
    publisher: "Sony Computer Entertainment",
    players: "1 jugador · Online",
    image: "assets/img/games/bloodborne.jpg",
    focus: "center",
    badge: "CON DLC",
    tagline: "Yharnam está enferma. Caza o sé cazado.",
    description: [
      "Bloodborne es un juego de rol de acción de 2015 desarrollado por FromSoftware y publicado por Sony Computer Entertainment para PlayStation 4.",
      "El juego sigue a un cazador a través de la decrépita ciudad de Yharnam, inspirada en la época gótica y victoriana, cuyos habitantes padecen una enfermedad transmitida por la sangre. Al buscar la fuente de la plaga, desentrañarás los misterios de la ciudad mientras luchas contra bestias y seres sobrenaturales."
    ],
    dlcs: [
      {
        id: "the-old-hunters",
        title: "The Old Hunters",
        description: "Expansión · La pesadilla del cazador",
        price: 19.99,
        image: "assets/img/dlc/bloodborne-old-hunters.jpg"
      }
    ]
  },
  {
    id: "astro-bot",
    title: "Astro",
    subtitle: "Bot",
    displayTitle: "Astro Bot",
    price: 59.99,
    genre: "plataformas",
    platforms: ["ps5"],
    year: 2024,
    developer: "Team Asobi",
    publisher: "Sony Interactive Entertainment",
    players: "1 jugador",
    image: "assets/img/games/astro-bot.jpg",
    focus: "center",
    tagline: "Una celebración de los 30 años de PlayStation, en forma de plataformas.",
    description: [
      "Astro Bot es un juego de plataformas de 2024 desarrollado por Team Asobi y publicado por Sony Interactive Entertainment para PlayStation 5, en celebración del 30.º aniversario de PlayStation.",
      "Es el quinto juego de la serie Astro Bot, después de Astro's Playroom (2020), y el primer juego del equipo Asobi desde su separación de Japan Studio."
    ]
  }
];

/* Utilidades de datos ------------------------------------------------ */
function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function getProductName(p) {
  return p.displayTitle || `${p.title} ${p.subtitle}`;
}

const SOULS_IDS = ["dark-souls-3", "dark-souls-remastered", "dark-souls-2", "demons-souls", "bloodborne"];

function getDlc(product, dlcId) {
  return (product && product.dlcs ? product.dlcs : []).find((d) => d.id === dlcId) || null;
}

/* Códigos promocionales ------------------------------------------- */
const PROMO_CODES = {
  NEXO10: { type: "percent", value: 10, label: "10% de descuento" },
  SOULS15: { type: "percent", value: 15, label: "15% en juegos Souls", onlySouls: true },
  BIENVENIDA: { type: "fixed", value: 5, min: 50, label: "$5 en compras desde $50" }
};
