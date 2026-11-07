# Home — Varadero Taxi (override del Master)

> Este archivo **overridea** `MASTER.md` para la página home. Aprobado por cliente 2026-09-20 con 12 cambios.

## Objetivo UX Max
Reserva de lujo con fricción cero: **3–5 clics hasta confirmar**, widget protagonista por encima del fold, todo prefilled con defaults inteligentes. Habitación sin testimonios ni features sin comprobar.

## Componentes (orden en DOM)

1. **`SiteHeader`** — transparente sobre hero → glass al scroll >80px (`blur(16px)`, borde gold hairline). Logo `scale(.92→1)` al load. Incluye `LanguageSwitcher` (ES/EN, crossfade 200ms) y `MobileMenu` (sheet derecha, 300ms spring).
2. **`HeroBanner`** — **jerarquía 0–2s**: imagen `next/image` priority (fotos 9:16 → recorte desktop con `object-position`, `width/height` fijos, CLS 0) + titular serif corto + **`BookingWidget` protagonista**. Sin video. Parallax sutil 5% solo scroll.
3. **`BookingWidget`** (NÚCLEO) — card glass con navbar de pasos 1–2–3–4 + progress. En móvil: sheet full-height al tocar "Reservar".
   - `ServiceModeToggle`: **Trayecto | Horas** (default Trayecto), deslizador 200ms expo.
   - `RoutePicker`: chips rutas fijas con **precio USD siempre visible**. 5 rutas mock en `lib/routes.ts` (cliente pone las reales). Clic = selecciona y marca (NO auto-avanza). «Otro destino» retirado temporalmente por petición del cliente hasta confirmar sus precios.
   - `DateTimePicker`: calendario inline mínimo + rail de horas. **Fecha default: mañana** (no hoy), antelación mínima configurable en config. Seleccionar hora **no** auto-avanza (el usuario ve el día/hora marcados y pulsa Continuar).
   - `VehicleClassSelector`: 4 tarjetas compactas.
   - `BookingReview` (paso 4): mini resumen — trayecto/horas, fecha, hora, vehículo, total USD — antes del formulario de contacto.
   - `BookingSummaryBar`: sticky, resumen + único CTA gold.
4. **`FleetCarousel`** — 4 clases. Card: foto real, capacidad (pasajeros+maletas), "desde $USD", botón "Reservar esta clase" → prefill widget + scroll al hero. Drag + arrows (móvil sin scroll forzado horizontal). Hover: imagen scale 1.05 / tarjeta levanta.
5. **`FeaturesGrid`** — **solo garantías REALES** (pendiente confirmación del cliente). Sin placeholders falsos.
6. **`HowItWorks`** — 3 pasos minimales.
7. **`FAQAccordion`** — aria-expanded, 200ms transform/opacity.
8. **`CTAZone`** — CTA gold final.
9. **`StickyMobileCTA`** — barra fija inferior móvil "Reservar ahora" → abre sheet.

## `ContactSheet` (paso 4 del flujo — campos APROBADOS)

- **Hotel o dirección de recogida** *(obligatorio)*
- **Nº de vuelo** *(solo si ruta = aeropuerto, conditional)*
- **Pasajeros / maletas**
- Nombre · WhatsApp/tel · email (opcional) · nota (opcional)
- **Checkbox consentimiento datos + link a privacidad** *(obligatorio)*
- Autofill localStorage (nombre/tel/email), labels visibles, error inline bajo campo.

## `BookingSuccess`

- Ref `VT-XXXX`, check SVG trazo spring 400ms, glow dorado.
- Acciones: "Enviar por WhatsApp" (deep-link wa.me) / "Descargar" / "Nueva reserva".
- Texto pago: **"Pagas en efectivo al llegar"** — si pasarela, aparece sol solitada el campo (sin "próximamente").
- Deep-link entrante: `/reserva?vehicle=suv&to=lahavana` prefill widget.

## Flujo exacto (clic mínimo)

| # | Usuario | Sistema | Clics |
|---|---|---|---|
| 0 | Entra | Widget precargado: Trayecto, origen "Mi alojamiento", fecha **mañana**, hora +2h, clase Sedán | 0 |
| 1 | Toca chip "Aeropuerto Johann Gualberto Gómez (VRA)" | selecciona (marca) → Continuar → paso 2 | 1 |
| 2 | Toca hora (o acepta default) | marca (dorado) → Continuar → paso 3 | 2 |
| 3 | Toca tarjeta vehículo | resumen actualiza $USD animado | 3 |
| 4 | "Continuar" | paso 4 **BookingReview** (re-encuadra scroll en el widget): trayecto/fecha/hora/vehículo/total | 4 |
| 5 | "Continuar" | ContactSheet (autofill) | 5 |
| 6 | "Confirmar reserva" | POST `/api/bookings` → **pendiente** | 6 |

**Repetido (autofill): 4–5 clics.**

### Fallback error (APROBADO)
POST falla → toast error + botón **"Reservar por WhatsApp"** (con resumen armado). **Nada de offline localStorage.**

## API `/api/bookings` (contrato)

- **zod** validación completa (incl. consentimiento true, fecha/antelación mínima).
- **Honeypot** campo oculto + **rate limit** por IP.
- **Server recalcula precio** desde `lib/routes.ts`/vehicles — nunca confiar en el valor del cliente.
- **Supabase RLS `solo insert`** + política.
- Notificación operador (email o Telegram).
- Guardado como `pending` (efectivo al llegar).

## Microinteracciones de lujo

| Elemento | Comportamiento | Timing |
|---|---|---|
| CTA gold | hover ↑1px + glow dorado + sheen; press scale .97 | 200ms |
| Glass card | borde gold 0.18→0.45 | 300ms |
| Chip ruta | hover -2px; selec fill gold .14 + check | 150–250ms |
| Precio | tween USD, tabular-nums | 300ms |
| Header | transparente→glass | 200ms |
| Reveal | IO translateY 24 + fade, stagger 50ms | 350ms |
| Foto flota | scale 1.05 | 600ms |
| Success | check spring + glow ref | 400ms |
| ES/EN | crossfade + micro-slide | 200ms |

## Constraints

- **No inventar colores** excepto `--error`/`--success` ya aprobados.
- Sin Testimonials (quitado), sin features falsas.
- i18n es/en, `hreflang`, todo sin texto en imágenes.
- `prefers-reduced-motion` desactiva sheen/reveal/parallax.

## Editado por Codex — 2026-09-21

- Se actualiza únicamente el alcance de destinos: en Trayecto se exige una ruta del catálogo para continuar y para validar la reserva en la API.
- Horas no exige ruta. Los textos de «Cómo funciona» ES/EN dejan de ofrecer destinos escritos libremente.
- Se conservan las tarifas y los datos comerciales actuales, así como el historial de diseño previo. Verificación local completada y registrada en `PROGRESS.md`.

## Editado por Codex — 2026-09-21 · ampliación del flujo

- Fecha/hora del servicio referidas a Cuba. El día elegido se representa como fecha de calendario y se conserva en calendario, resumen y solicitud; se muestran selección y zona horaria.
- Tarjetas de vehículo: precio de la ruta elegida en Trayecto; tarifa por hora en Horas. Capacidad existente validada también en servidor; nombres ES/EN.
- Móvil: tarjeta de reserva limitada al alto disponible, contenido con desplazamiento interno y barra de total/Continuar fuera de ese desplazamiento; vehículos en dos columnas.
- Recepción: solicitud recibida, pendiente de confirmación por el operador. Recibir referencia no equivale a tener el viaje confirmado.
- Las tarifas y datos comerciales permanecen intactos. La evidencia de pruebas y la referencia de la reserva de prueba se registran en PROGRESS.md.
