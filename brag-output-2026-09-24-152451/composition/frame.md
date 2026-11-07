---
version: alpha
name: Varadero Taxi — Frame (video layer)
description: >
  Frame-scale companion to the Varadero Taxi design system (design-system/varadero-taxi/MASTER.md).
  The unit is the frame (1080×1920, vertical 9:16 for WhatsApp). Brand atoms are sacred — the
  dark warm palette (#0B0E12 deep), gold #E8A94B accent, Playfair Display display type + Inter body,
  glass surfaces with 16px radius and gold hairlines, expo-out motion. Composition and frame scale
  are rewritten for video: type scales up, borders thicken, decorative opacity rises.
unit: the frame — 1080×1920 vertical (9:16); WhatsApp in-feed viewing
principle: brand atoms are sacred · composition is free · copy comes verbatim from lib/i18n

colors:
  deep: "#0B0E12"
  base: "#131920"
  elevated: "#1C242D"
  gold: "#E8A94B"
  gold-hover: "#F6C66B"
  gold-pressed: "#B97A1E"
  teal: "#22B8CF"
  cream: "#F5F1EA"
  muted: "#A9B1BA"
  success: "#3E8E5A"
  glass: "rgba(28,36,45,0.55)"
  gold-line: "rgba(232,169,75,0.18)"
  gold-line-strong: "rgba(232,169,75,0.45)"

typography:
  # — body / UI ramp (Inter, bundled 400 · 700 · 900 — never 500/600, those synthesize) —
  micro:       { fontFamily: "Inter", px: 24, weight: 700, tracking: "0.24em", upper: true, color: "gold" }
  label:       { fontFamily: "Inter", px: 26, weight: 700, tracking: "0.18em", upper: true, color: "muted" }
  body:        { fontFamily: "Inter", px: 34, weight: 400, lineHeight: 1.5, color: "cream" }
  body-sm:     { fontFamily: "Inter", px: 28, weight: 400, lineHeight: 1.45, color: "muted" }
  data:        { fontFamily: "Inter", px: 32, weight: 700, tabular: true, color: "gold" }
  button:      { fontFamily: "Inter", px: 38, weight: 700, tracking: "0.04em", color: "deep" }
  # — display ramp (Playfair Display, bundled 400 · 700 · 900 — sentence case, tracking -0.03em) —
  h3:          { fontFamily: "Playfair Display", px: 56, weight: 400, lineHeight: 1.15, color: "cream" }
  h2:          { fontFamily: "Playfair Display", px: 84, weight: 400, lineHeight: 1.08, color: "cream" }
  h1:          { fontFamily: "Playfair Display", px: 104, weight: 400, lineHeight: 1.04, color: "cream" }
  logo:        { fontFamily: "Playfair Display", px: 132, weight: 700, lineHeight: 1.0, color: "cream" }

spacing:
  pad-x: "72px"
  pad-y: "96px"
  gap-xl: "48px"
  gap-lg: "32px"
  gap-md: "20px"

components:
  glass-card:
    backgroundColor: "rgba(28,36,45,0.55)"
    border: "3px solid {colors.gold-line}"
    rounded: "28px"
    backdrop: "blur(16px) — degrade a solid rgba fill si el blur cuesta en render"
    description: "La tarjeta del widget de reserva. Es el objeto estrella del video."
  hairline:
    rule: "3px solid {colors.gold-line}"
    description: "Todo separador es este filete dorado. Refuerza a 4-6px cuando sea focal."
  gold-button:
    backgroundColor: "{colors.gold}"
    color: "{colors.deep}"
    rounded: "24px"
    padding: "34px 64px"
    typography: "{typography.button}"
    description: "CTA dorado real del proyecto (GoldButton) — 'Reservar ahora'."
  chip:
    backgroundColor: "rgba(28,36,45,0.75)"
    border: "3px solid {colors.gold-line}"
    rounded: "24px"
    typography: "{typography.body} + {typography.data} para precios"
    description: "Chip de ruta / chip de confianza. Precio siempre en oro y tabular."
  fleet-card:
    backgroundColor: "{colors.elevated}"
    border: "3px solid {colors.gold-line}"
    rounded: "28px"
    typography: "{typography.h3} (nombre) + {typography.body-sm} (pax · maletas)"
    description: "Tarjeta de flota con foto real del proyecto, degradado inferior base."
  lang-pill:
    border: "3px solid {colors.gold-line}"
    rounded: "999px"
    typography: "Inter 700, 32px, tracking 0.1em"
    description: "Pastilla ES/EN de la cabecera (LanguageSwitcher). Activo = relleno oro."
  step-dot:
    size: "56px circle"
    active: "relleno gold, número en deep"
    done: "relleno gold/20, número en gold"
    pending: "relleno elevated, número en muted"
    description: "Números de paso 1-4 del widget de reserva."
---

# Varadero Taxi — Frame

## Overview

El proyecto es un servicio de traslados privados de lujo en Varadero. El video vertical (1080×1920)
tiene que leerse **sin sonido** en WhatsApp: cada claim importante está escrito en pantalla, en
español con su equivalente en inglés cuando toca.

Atmosfera: **dark warm + glassmorphism + gold hairline**. Fondo `#0B0E12` en todas las escenas (una
sola atmósfera, nunca cambia), contenido sobre glass `rgba(28,36,45,0.55)` con borde dorado, y el
dorado `#E8A94B` reservado para lo que importa: precios, CTA, pasos activos y filetes.

Voz tipográfica: **Playfair Display** para todo lo que se declara (titular, logotipo, nombres de
vehículo) e **Inter** para todo lo que se opera (chips, precios, etiquetas, botón). Peso 700 para
etiquetas y datos — el bundle no trae pesos intermedios; pedir 500/600 sintetiza raro.

## The Frame

- Titular hero a 96-104px, máximo 2 líneas, ancho ~86% del frame.
- Etiquetas kicker en mayúsculas con tracking amplio y color oro — son la señal "esto es la marca".
- Precios siempre `font-variant-numeric: tabular-nums` en oro.
- Body mínimo 28px (in-feed WhatsApp, el video se ve pequeño). Nada por debajo de 24px.
- Reloj de lectura: etiqueta corta ≥0.8s asentada; frase ≥0.3s por palabra.

## Composition Rules

- Nunca una escena "página web": zonas ancladas a bordes, no pilotos centrados flotando.
- 2 puntos focales por escena como mínimo (ej. card + titular; grid + título).
- Relleno de marca VISIBLE: el oro no puede quedar en 5% de opacidad. Atmosférico 15-25%, focal a
  saturación plena.
- Degradados lineales a pantalla completa sobre fondo oscuro: prohibidos (banding H.264). Usar
  radioles / relleno sólido / glow local.
- Decorativos por escena: glow radial dorado tenue, filete dorado animado, texto fantasma ("VARADERO"
  al 6%), grano sutil. Todos con movimiento ambiental lento (breathe/drift). Nunca estáticos.
- Movimiento: entradas 0.3-0.6s, expo-out `cubic-bezier(0.16,1,0.3,1)` (la ease del proyecto),
  3+ direcciones/eases por escena.

## Don'ts

- No inventar colores fuera de la paleta del proyecto.
- No añadir claims que el producto no tiene: **nada de pago online**, nada de "reserva en cualquier
  ciudad", nada de "chofer profesional" (marca `TODO-CONFIRMAR` en el código).
- No usar "chofer profesional" ni dominios/telefonos por confirmar (`+5355555555`,
  `varadero-taxi.vercel.app` son TODO-CONFIRMAR) — no salen en pantalla.
- No gradients de texto, no neón, no emojis, no barras de ecualizador.
- No titular a más de 3 líneas. No más de 3 ideas por escena.
