# Hyperframes Composition Brief: Varadero Taxi

## Objective
Crear un video promo corto (brag) de Varadero Taxi: vertical 9:16, 23 s, sin sonido y sin voz en
off, que se entienda leyendo la pantalla. Muestra el widget de reserva real, la flota real y el
conmutador de idioma, y cierra con el nombre de la empresa + CTA.

## Output
- Composition directory: `brag-output-2026-09-24-152451/composition/`
- Rendered video: `brag-output-2026-09-24-152451/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 23 s (escenas en `brag-plan.md`, suman 23.0)

## Source Material
- Project root: `C:\Users\jonny\Desktop\varadero-taxi nuevo`
- Primary files read: `README.md`, `app/globals.css`, `lib/i18n/es.json`, `lib/i18n/en.json`,
  `lib/vehicles.ts`, `lib/routes.ts`, `lib/config.ts`, `design-system/varadero-taxi/MASTER.md`,
  `components/booking/BookingWidget.tsx`, `components/booking/RoutePicker.tsx`,
  `components/booking/VehicleClassSelector.tsx`, `components/home/HeroBanner.tsx`,
  `components/home/FleetCarousel.tsx`, `components/home/CTAZone.tsx`,
  `components/layout/SiteHeader.tsx`, `components/layout/LanguageSwitcher.tsx`
- Product name: **Varadero Taxi**
- Tagline / strongest claim: "Varadero en lujo, de puerta a puerta" (hero.title, es) /
  "Varadero in luxury, door to door" (en)
- Key UI or visual moment to recreate: el **GlassCard del BookingWidget** con su barra de pasos
  (1 Ruta · 2 Fecha · 3 Vehículo · 4 Resumen), el toggle de dirección "Desde Varadero / Hacia
  Varadero", los chips de ruta con precio real, y la barra de resumen con "Pagas en efectivo al
  llegar". Segundo momento: la pastilla ES/EN del `SiteHeader`.
- Copy that must appear verbatim (de `lib/i18n/*.json`):
  - "Traslados privados en Varadero" / "Private transfers in Varadero" (hero.kicker)
  - "Varadero en lujo, de puerta a puerta" / "Varadero in luxury, door to door" (hero.title)
  - "Reserva tu traslado privado en segundos." / "Book your private transfer in seconds." (hero.subtitle)
  - "Precio fijo en USD" · "Pago en efectivo al llegar" (hero.trust_fixed / trust_cash)
  - "Nuestra flota" / "Our fleet" · "Elige la comodidad que se ajusta a tu viaje." (fleet.*)
  - "Reserva tu traslado" (booking.title) · "Desde Varadero" / "From Varadero" (booking.direction_from)
  - "Pagas en efectivo al llegar" (booking.pay_cash) · "Total" (booking.total)
  - "Reservar ahora" / "Book now" (nav.book) · "Varadero Taxi" · "Traslados de lujo en Varadero"
  - Nombres de vehículos: Sedán / SUV / Minivan / Van (vehicles.*)
- Datos reales de producto permitidos en pantalla: rutas y precios de `lib/routes.ts`
  (Aeropuerto VRA 25 min desde $30 · Centro de Varadero 15 min desde $15), capacidades de
  `lib/vehicles.ts` (3/2, 4/3, 6/5, 14/10).
- **Prohibido en pantalla:** pago online, "reserva fuera de Varadero", "chofer profesional"
  (TODO-CONFIRMAR), teléfono/dominio por confirmar, cualquier otro dato personal o secreto.

## Creative Direction
- Tone preset: `polished`
- Creative direction: "elegante y premium, servicio de taxi de lujo para turistas en Varadero"
  + "elegante, premium y directo"
- Interpretación: pocas escenas, entradas rápidas y holds largos y legibles; el oro aparece solo en
  precios, pasos activos y CTA. Cero gritos, cero flashes, cero texto apresurado. La energía viene
  del movimiento y de los cortes limpios.
- Angle: el producto haciendo su trabajo en 23 s — widget con precios reales, flota con fotos
  reales, y el toggle ES/EN real — envuelto en la identidad dark + gold del proyecto.
- Hook: foto real del sedán con el gradiente del hero y el titular "Varadero en lujo, de puerta a
  puerta" entrando en Playfair.
- Outro: "Varadero Taxi" + filete dorado + botón dorado "Reservar ahora" + "Precio fijo en USD ·
  Pago en efectivo al llegar".
- Avoid:
  - Generic SaaS language ("streamline", "all-in-one", "seamless")
  - Abstract filler visuals (ondas, partículas, mapas genéricos)
  - Unrelated visual redesign — la paleta y el chrome salen de `frame.md` (MASTER.md del proyecto)

## Visual Identity
- Background: `#0B0E12` (deep), secciones `#131920` (base)
- Surface: `#1C242D` (elevated) + glass `rgba(28,36,45,0.55)` con borde `rgba(232,169,75,0.18)`
- Text: `#F5F1EA` (cream) / `#A9B1BA` (muted)
- Accent: `#E8A94B` (gold), hover `#F6C66B`
- Display font: **Playfair Display** (bundle HyperFrames, 400/700/900)
- Body font: **Inter** (bundle, 400/700/900 — usar 400 y 700, nunca 500/600)
- Visual references from the project: glass card del widget, chips de ruta con precio dorado,
  tarjetas de flota con foto + borde dorado, botón dorado "Reservar ahora", pastilla ES/EN,
  botón circular de flecha del carrusel.

## Storyboard
El storyboard contrato está en `<output-dir>/brag-plan.md`.

Scene summary:
1. Hook: el titular — 3.6s — kicker dorado + "Varadero en lujo, de puerta a puerta" + subtítulo + 2 chips de confianza sobre foto real del sedán.
2. Widget de reserva — 6.0s — pasos 1-4, toggle "Desde Varadero", chips VRA $30 / Centro $15, barra "Total $30 · Pagas en efectivo al llegar".
3. Nuestra flota — 5.0s — 4 tarjetas con foto real: Sedán, SUV, Minivan, Van con pax · maletas.
4. Español / English — 4.4s — cabecera con pastilla ES/EN y el titular alternando entre idiomas.
5. Logotipo + CTA — 4.0s — "Varadero Taxi" + "Traslados de lujo en Varadero" + botón "Reservar ahora" + condiciones.

## Audio
- Audio role: sparse professional accents sobre cama continua
- Audio arc: cama a volumen constante bajo; los acentos marcan interacción (toggle, chips, cards,
  volteo de idioma) y el cierre de marca; fade-out en el último segundo.
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM, preset
  leído en `assets/music/cues/...-vol-12.music-cues.json` del skill brag)
- Music treatment: `data-volume` 0.35, empieza en 0s, `data-fade-out` 1.2s. Nunca por encima de 0.5.
- Music cue guidance:   preset disponible. Strong cues usados: 8.74s (total del widget), 17.47s (segundo volteo de
  idioma), 19.66s (logotipo). Beat grid para secuencias: toggle/chips 4.39 / 4.91 / 6.00; flota
  10.37 / 11.46 / 12.55 / 13.64 (cada 2 beats, para que cada etiqueta se pueda leer); primer
  volteo de idioma 15.84.
  Snap máx. ±0.15s en momentos fuertes, ±0.10s en secuencias; la legibilidad manda.
- Audio-reactive treatment: subtle — extraer bandas con
  `hyperframes-creative/scripts/extract-audio-data.py` y usar bands[0] (bass) para que el glow
  dorado de fondo y la presencia de la glass card respiren (3-6% de scale / glow). Si la extracción
  falla, anotarlo aquí y seguir sin reactividad — no bloquea el render.
- Audio-coupled moments:
  - Scene 2 — chips de ruta entrando al beat + click en el toggle de dirección
  - Scene 3 — tarjetas de flota entrando a beats consecutivos
  - Scene 4 — dos giros de la pastilla ES/EN con `interface/switch_007`
  - Scene 5 — logotipo asentando con `interface/bong_001`
- SFX selection guidance: polished = 2-5 acentos suaves, low HF risk según
  `<brag-skill>/assets/sfx/sfx-analysis.md`. Elegidos: `interface/click_003` (toggle),
  `interface/switch_007` (idioma), `interface/drop_001` (chips), `interface/drop_002` (tarjetas),
  `interface/bong_001` (logotipo). Volumen 0.55-0.7.
- Exact SFX choice: Hyperframes ajusta timestamps/densidad según la animación implementada.
- Audio files: ya copiados en `<output-dir>/composition/assets/`.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract +
`data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec `frame.md`,
beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), `hyperframes-cli`
(lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent
interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes
conventions over anything in `/brag`.

Requirements:
- Mostrar al menos un elemento real del proyecto (widget, cabecera, fotos de flota, copy verbatim).
- Todo el texto legible en el render final (check de contraste WCAG incluido).
- Duración total 23 s.
- Incluir la capa de música/SFX planificada.
- Tratar las notas de audio de `/brag` como guía, no como cue sheet fijo.
- Alinear 1-3 momentos fuertes a strong cues (marcar `// beat-locked`) y las secuencias a beats
  (`// beat-grid`), ignorando los cues si perjudican lectura o ritmo.
- Copiar audio e imágenes a `composition/assets/` (ya hecho).
- `npx hyperframes check` en verde antes de renderizar — única puerta de brag.
