# Progress — Varadero Taxi

Registro de sesiones y resultados, con la evidencia ejecutada. Última entrada: 2026-09-26 (Buffy). Se conserva el historial de OpenCode, Codex y Hermes. El plan vive en `task_plan.md` y la investigación en `findings.md`: aquí no se repiten.

## Sesión 2026-09-20 — Pasos 1-10 completados + push

### Paso 1 — Base
- Instalado Next 15 + Tailwind v4 (+ deps: next-intl, zustand, framer-motion, zod, lucide-react, @supabase/supabase-js).
- globals.css con todos los tokens de MASTER.md → `@theme`; fonts compartidos en `lib/fonts.ts`.
- Resultado: `npm run build` + `tsc --noEmit` OK.

### Paso 2 — i18n + datos
- next-intl v4 con `app/[locale]`, middleware, dicts; `lib/routes.ts`, `vehicles.ts`, `schemas.ts`, `bookingStore.ts`, `config.ts`.
- Resultado: build OK. Commit `b134605`.

### Paso 3 — UI + ajustes
- Store con skipHydration/version/partialize/migrate; aumento superRefine (flight a aeropuerto, antelación desde `config`).
- 4 components `ui/` + 7 `booking/` (widget con nav 3 pasos).
- Resultado: build OK. Commit `14a5e00`.

### Paso 4 — Flujo E2E
- ContactSheet (honeypot, consent, errores inline), BookingSuccess (check animado, wa.me), API `/api/bookings` (zod, computePrice server, rate-limit in-memory, ref única, Supabase service_role, Telegram async), migración 001, `/privacidad`, `.env.example`.
- Resultado: build OK. Commit `step 4`.

### Paso 5 — Web
- Layout completo (header/menu/CTA/footer), HeroBanner (foto priority), FleetCarousel, deep-links.
- Resultado: build OK. Commit `4380aa0`.

### Paso 6 — Contenido/SEO/pulido
- Features/How/FAQ/CTA; metadata + OG + hreflang + sitemap/robots/icon; JSON-LD; not-found/loading/skip-link; security headers; README.
- Commit `f4a1da5`; + `ALLOW_INDEXING noindex` `31d1d70`.
- Lighthouse: no ejecutable local entonces (sin navegador de sistema). **Ya no es un bloqueo**: el Chromium que descarga Playwright sirve para medirlo (ver `findings.md`).

### Fix — contact sheet portal
- Root cause: `backdrop-filter` en `GlassCard` = containing block para `fixed`, recortado por `overflow-hidden`. Solución: `createPortal` a `document.body`, `z-[80]`, scroll interno, Escape, body lock, focus return. Commit `0b75075`.

### Paso 7 — Dirección + miniaturas + zonas
- Miniaturas 16/10 object-cover (thumbPosition); `direction from/to` con segmentado, rutas internas; resumen trayecto; ContactSheet contextual; superRefine; API/WhatsApp/Success; migración 002; `lib/routes.ts` a zonas + kind.
- Resultado: build + typecheck OK. Commit `70d5344`.

### Paso 8 — Deploy (parcial, automatizado)
- supabase init + link + db push (migraciones 001 + 002 aplicadas a varaderotaxi).
- .env.local creado (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; Telegram vacío; ALLOW_INDEXING=false).
- Verificación RLS: tabla bookings existe con RLS ON; anon SELECT → 0 filas (bloqueado); anon INSERT → Unauthorized; service_role SELECT/INSERT/DELETE → 200 OK.
- npm run build OK (Next.js 15.5.25, 11 páginas estáticas, API /api/bookings dinámica). tsc --noEmit OK.

### Paso 9 — Hero con contexto y confianza + nav desktop
- SiteHeader desktop (>=lg): enlaces de navegación con scroll suave a secciones (#fleet, #how, #faq, #contact) + GoldButton "Reservar". Menú hamburguesa oculto en desktop, visible en móvil/tablet.
- HeroBanner dos columnas desktop: izquierda kicker + h1 + subtítulo + 3 puntos de confianza (precio fijo USD, pago efectivo al llegar, chofer profesional) con iconos Lucide. Derecha BookingWidget.
- HeroBanner móvil: h1 + subtítulo compacto, trust points en fila horizontal, widget visible above the fold, flecha animada al final del hero (transform/opacity, desactivada con prefers-reduced-motion).
- Puntos de confianza coinciden con FeaturesGrid (sin afirmaciones nuevas no confirmadas).
- Textos en diccionarios es/en (hero.kicker, hero.trust_fixed, hero.trust_cash, hero.trust_pro, hero.scroll_hint, nav.fleet, nav.how, nav.faq, nav.contact).
- Anclas de sección añadidas: id="fleet", id="how", id="faq", id="contact" + scroll-margin-top global en globals.css.
- Resultado: build + typecheck OK.

### Paso 10 — Preparación deploy Railway (next start)
- package.json: añadido `engines.node >=20.0.0` (LTS compatible); scripts `build: next build` y `start: next start` (respeta `PORT` nativamente); `sharp` instalado explícitamente para next/image en producción.
- Nuevo `GET /api/health` → 200 `{status:"ok"}` sin tocar BD (healthcheck Railway).
- ⚠️ **Rate limit en memoria** (`/api/bookings`) solo válido con UNA réplica. Con >1 réplica hará falta Redis/Upstash por instancia.
- Verificación local: `next build` OK (12 páginas, `/api/health` dinámico); `next start` con `PORT=4000` responde `/en`, `/es`, `/api/health`, `/robots.txt` (200).
- `git ls-files` verificado: no incluye `.env*` salvo `.env.example`, ni `.pem`/`.key`.
- Repo GitHub PRIVADO `jcv911/varadero-taxi` creado y pusheado (origin configurado, sincronizado en este commit).
- Commit `ac6c308`.
- Pendiente REAL para deploy en Railway: crear servicio desde el repo, rellenar variables de entorno, health path `/api/health`, dominio + `site.url`. **Resuelto después** (ver § Estado del despliegue y las secciones del health con la revisión desplegada).

## Paso 11 (parcial) — Fix desbordamiento horizontal móvil + escala hero

Bug: a 375px (móvil real) logo del header (corte reportado), h1, fila de confianza, stepper, filas de ruta y precios cortados a la derecha (peor en ES).

### Causa raíz
- Grid del hero en móvil sin `grid-cols-1`: columna única implícita `auto` → crece a max-content (394px en ES) → desborda el ancho. El `overflow-hidden` de la sección hero lo RECORTABA sin scroll (por eso `scrollWidth` no se movía pero el contenido se veía cortado).
- `Chip` ponía `truncate` (nowrap) sobre la fila minutos+precio → podía cortar el precio.

### Fix
- HeroBanner: `grid-cols-1` + `min-w-0` en columna texto y `#widget`; h1 con `text-balance` + clamp fluido `clamp(1.75rem,1.25rem+2vw,3rem)` (2 líneas a 320/375, nunca toca bordes); trust `li` con `min-w-0`.
- Chip: `sub` sin truncate → precio siempre visible; el nombre (label) mantiene truncate.
- Header: logo `whitespace-nowrap` + `min-w-0`, clúster derecho `shrink-0`.
- BookingSummaryBar: clúster precio+botón `shrink-0` (precio nunca cortado).
- StickyMobileCTA: `pb-[max(0.75rem,env(safe-area-inset-bottom))]` + layout `viewportFit: cover` para iOS.
- FleetCarousel: contenido en su track `overflow-x-auto` (no empuja la página).

### Verificación (Playwright + headless Chromium)
- `document.documentElement.scrollWidth === clientWidth` ✓ en 320/375/414 para `/en`, `/es`, `/en/privacidad`, `/es/privacidad`, `/reserva` (404).
- 0 elementos (fuera de #fleet) cruzando bordes. Carousel es scroll interno intencional.
- h1 = 2 líneas a 320/375/414 (max 3 pedidas).
- Única excepción: label "YOUR RESERVATION" trunca 5px con elipsis a 320px/EN (precio y botón intactos).
- `tsc --noEmit` OK · `next build` OK (commit `fix: mobile horizontal overflow and hero scale`).

## Fix móvil batch 2 — menú colapsado, idioma visible, flecha hero, flota + paso 3 (commit `ux: mobile menu, language, fleet, step3 price`)

### Bug crítico: menú hamburguesa colapsado a 60px
- Migas: al abrir el menú, el header activa `backdrop-blur-glass` con `menuOpen` → **`backdrop-filter` ≠ none crea containing block** para los `fixed` hijos, y el overlay `fixed inset-0` se ancla al header (60px) en vez del viewport.
- Fix: `MobileMenu` ahora se renderiza con `createPortal(document.body)` (mismo patrón que el ContactSheet ya portaleado) + guard `mounted` (SSR-safe porque `document` no existe al prerenderizar). Quitado `LanguageSwitcher` del panel (redundante).

### Selector de idioma móvil
- `<div className="hidden sm:block">` en el clúster móvil ocultaba ES/EN en teléfonos (<640px). Ahora `LanguageSwitcher` siempre visible en el header móvil (56×44px, junto al hamburguesa). Verificado: 2 buttons en el header, el del clúster móvil visible.

### Flecha hero sobre el precio
- La flecha scroll estaba `absolute bottom-20` → caía sobre la barra de precio/Continuar del widget. Ahora va en flow (centrada, `mt-10`) bajo el widget, `sm:hidden`. Geométricamente ya no intersecta: arrow y 1077-1121 vs summary 967-1036.

### Flota móvil: flechas + tarjetas centradas
- Flechas prev/next ahora visibles en móvil (`flex` en vez de `hidden sm:flex`).
- Tarjetas `w-[72vw] snap-center` + track `px-[calc(14vw-16px)]` → center exacto (card0Center=188=containerCenter). Ojo: porcentajes de padding y width reaccionan contra el content-box (feedback) y rompen el centrado — se resuelve con unidades vw absolutas. Desktop sigue `sm:w-[25vw] sm:snap-start sm:max-w-xs`.
- Peek simétrico a ambos lados, snap-mandatory corrige tras la flecha (card2 centrada 188 tras NEXT).

### Paso 3: auto-scroll al precio
- `BookingSummaryBar` con `id="booking-summary"`; `VehicleClassSelector` hace `scrollIntoView({behavior: smooth|auto, block:"center"})` al seleccionar vehículo (respeta reduced-motion). Verificado: scroll 0→1257, barra centrada a 446/812.

### Verificación (Playwright headless, 320/375/414)
- scrollWidth===clientWidth + 0 elementos (fuera de #fleet) cruzando bordes en /en /es /en/privacidad /es/privacidad /reserva. ALL GREEN.
- Menú a altura completa (812px). `tsc` OK · `next build` OK.

### Fix batch 3 — botón de flota eliminado (commit `ece5480`)
- Quitado "Reservar esta clase" de las tarjetas del carrusel: saltaba al paso 3 del widget con el flujo incompleto (sin ruta/hora). Tarjetas quedan informativas (foto, capacidad, "desde $X").
- Eliminados `reserve()` e imports muertos (`useBookingStore`, `scrollToBooking`, `VehicleId`); clave `reserve_class` borrada de es/en.json.
- `tsc` + `next build` OK.

## Paso 11 (parcial) — Calendario paso 2 + mini resumen paso 4 (commit `feat: review step + calendar no auto-jump`)

### Calendario paso 2
- Antes: tocar una hora **saltaba directo al paso 3** sin dejar ver la selección (`update({time}); setStep(3)` en el click).
- Ahora: seleccionar día y hora marca el estado (dorado) y el usuario pulsa "Continuar" para avanzar. `step`/`setStep` sin uso eliminados de DateTimePicker.

### Paso 4 — `BookingReview` (mini resumen antes del formulario)
- Nuevo componente `BookingReview.tsx`: filas trayecto/horas, fecha (con `Intl` locale, parse manual evitando TZ de `toISOString`), hora, vehículo (pax+maletas) y Total dorado + "Pagas en efectivo al llegar".
- Stepper pasa a 4 tabs (`step_review` "Resumen"); contacto ahora es **paso 5** (sheet, portal). `BOOKING_STEPS` 1-5.
- `BookingSummaryBar`: Continuar activo en pasos 1-4; condición disabled ahora solo en paso 1 (`!routeId && !customDestination`) — **fix bug latente**: con "Otro destino" (routeId null) el Continuar estaba siempre deshabilitado y la reserva custom era imposible.
- Flujo: ruta → fecha/hora (sin salto) → vehículo → **resumen** → formulario → POST.
- `home.md` actualizado al flujo de 6 clics.
- Verificación Playwright 320/375/414: scrollWidth===clientWidth en pasos 1-4. tsc + build OK.

### Fix paso 2 — toggle contextual + horas en grid (commit `fix: step2 toggle and hour grid`)
- `ServiceModeToggle` (Trayecto/Horas) solo en paso 1: en pasos 2-5 no cambiaba nada visible y confundía → oculto.
- Rail de horas `overflow-x-auto` (móvil mostraba 4 y ocultaba el resto) → `grid grid-cols-4 sm:flex sm:flex-col`: las 8 horas siempre visibles y seleccionables.
- Verificado Playwright 375px: toggle en paso1=2 radiogroups (modo+dirección), paso2=0; 8 horas dentro de pantalla; 16:00 se marca dorado; navegación septiembre→octubre y día 4 de octubre marcado.

### Fix "salto al paso 1" al volver + Continuar (commit `fix: hide sticky cta over booking widget`)
- Causa probable: la barra flotante móvil **"Reservar ahora"** (`fixed bottom-0 z-40`) se superpone al "Continuar" del widget en el flujo; al tocarla dispara `scrollToBooking()` → salto de vista al widget = parece volver a la selección de destino.
- Fix: `StickyMobileCTA` usa `IntersectionObserver` sobre `#widget` — oculta la barra mientras el widget de reserva está en pantalla (todo el flujo 1-5); reaparece al salir de la zona (ej. abajo en la web).
- Verificado (Playwright 375px): oculta en hero/flujo, visible al final de la página (top 743), paso1→Continuar→2 sin interferencia.
- Nota proceso: dejar de matar TODOS los procesos node (`Get-Process node | Stop-Process`) porque mata otros servicios del usuario (router). Ahora se mata solo el PID del dev server.

### Paso 11 — Legales provisionales, testimonios y FAQ reforzada (2026-11-05)
- Páginas `/terminos` y `/cancelacion` (mismo patrón que `/privacidad`): textos ES/EN provisionales, coherentes con el estado real de la BD (reserva "pendiente" hasta confirmar) y con los TODO-CONFIRMAR; la cancelación (24 h gratuita, retraso de vuelo, no-show) declara su provisionalidad en el texto.
- Footer con enlaces a las dos páginas + `/terminos` y `/cancelacion` en `app/sitemap.ts` (siguen sin emitirse con `ALLOW_INDEXING=false`).
- Sección de testimonios en la home entre HowItWorks y FAQ (`components/home/Testimonials.tsx`, grid 2x2 GlassCard, framer-motion como FeaturesGrid): contenido de ejemplo con nota visible de provisionalidad; reseñas verificadas pendientes del negocio.
- FAQ reforzada: `a3` (retraso de vuelo → WhatsApp con nº de vuelo, reprogramación sin cambiar el precio fijo; espera tras aterrizaje por definir) y `a4` (minutos de espera en cada recogida pendientes de confirmación final). TODO-CONFIRMAR ampliado en FAQAccordion (a3 y a4).
- Verificado: JSON ES/EN parseado + `npm run typecheck` OK. Commits `a4b5d95` (plan) y `8f8d178` (código), puntuados a `origin/master`.

## TODO-CONFIRMAR (datos reales del negocio)
- [x] Chofer profesional como garantía (trust point del hero) — **CONFIRMADO por el negocio 2026-09-25**.
- [x] Precios/rutas reales en `lib/routes.ts` — **actualizados por el negocio 2026-09-25** (sedán $40 aeropuerto, $100 La Habana; resto sin cambio). Siguen siendo **provisionales**: el negocio los ajustará de nuevo. No publicar como definitivos.
- [ ] Espera del conductor (FAQ q3 y q4) y política de cancelación — **pendiente de verificar por el negocio**. Ambas respuestas de FAQ y la página `/cancelacion` ya lo declaran en el texto visible ("pendiente de confirmación"); no prometen números (nada de "60 min gratis").
- [x] Datos de contacto: teléfono/WhatsApp `+5358117692` (**2026-09-25**). Redes pendientes.
- [ ] Política de privacidad final (placeholder actual).
- [ ] JSON-LD `TaxiService`: faltan dirección postal exacta y datos fiscales del titular (el teléfono y el rango de precios ya son reales y coinciden con `lib/routes.ts`).
- [ ] Nombres de los vehículos y fotos reales (imágenes referenciales; se subirán después).
- [ ] Dominio definitivo — **pospuesto por decisión del negocio (2026-09-25)**. Mientras tanto `site.url` se resuelve por entorno (`lib/config.ts`) y el canonical de producción apunta al host de Railway que sí sirve la web.

## Estado del despliegue — 2026-09-25

- **Railway con variables correctas**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `ALLOW_INDEXING=false` puestas vía `railway CLI`. `TELEGRAM_*` vacías por decisión del negocio (ver sección Telegram en `task_plan.md`).
- **Node 22**: `engines.node >=22.0.0` + `NODE_VERSION=22` en Railway (antes corría 20.20.2, deprecado por `@supabase/supabase-js`). Build de Railway reporta `node 22.23.2`.
- **Reservas funcionando**: `POST /api/bookings` → 200 con `ref` y precio. Probado en producción y borrado después cada registro de prueba; la tabla `bookings` está vacía.
- **`GET /api/health`** devuelve 503 + `checks.supabase:false` si faltan las variables, en vez de 200 en verde. Antes ocultaba el fallo.
- **Railway CLI 5.62.1** instalada global (`npm i -g @railway/cli`); proyecto enlazado con `railway link -p <id> -s varadero-taxi`.

## Arreglos de interfaz (2026-09-25)

- **Pantalla de solicitud recibida se cortaba en móviles pequeños**: a 320×568 la tarjeta medía 624px en 568px de pantalla y los botones de WhatsApp / "Nueva reserva" quedaban inalcanzables (`section#hero` con `overflow-hidden` + `min-h-dvh`). Ahora la tarjeta tiene `max-h-[92dvh]` + `overflow-y-auto` y se reencuadra al aparecer. Verificado en 6 pantallas con `scripts/verify-success-fix.cjs` (6/6 OK).
- **El formulario siempre abre en sedán**: `vehicleId` y `mode` ya no se persisten en localStorage (store `version: 2`). Antes el resumen mostraba el último vehículo que el visitante había tocado. Verificado con `scripts/verify-prices-default.cjs`.

## Paneles pendientes — el plan está en `task_plan.md`

Las dos pantallas, su orden y las restricciones que impone el código (RLS sin políticas para `anon`, el rate-limit
en memoria, `date` como texto en hora de Cuba, el precio calculado en servidor) están en `task_plan.md` § Paneles
planificados. No se duplican aquí.

Lo que sí queda registrado en este archivo es **por qué el primero es urgente**: mientras no exista el panel del
gestor, una reserva guardada no se ve salvo entrando a Supabase a mirar, porque Telegram está desactivado por
decisión del negocio.

## Editado por Hermes — 2026-09-25

- **Consejo de diseño aplicado** (`llm-council`): el consejo de 5 asesores concluyó que el cuello de botella
  no era el diseño sino datos + visibilidad. Se aplicó en ese orden y no se tocó el sistema visual.
- **Teléfono real** `+5358117692` en `config.site.phone` y `config.booking.whatsappNumber`. El número
  enmascarado `+535****5555` estaba **publicado en producción** (canonical, meta description, botón de
  WhatsApp del check-out y CTA).
- **Telegram**: desactivado por decisión del negocio; `notifyTelegram` ya era inerte sin env vars
  (`if (!token || !chatId) return;` + `catch` no-op + llamada `void`). Documentado, no se rompe nada.
- **Bug crítico de producción**: `POST /api/bookings` devolvía 500 (`Missing SUPABASE_URL or
  SUPABASE_SERVICE_ROLE_KEY`). El sitio cargaba bien (200) porque la landing no toca la base: el fallo solo
  aparecía al reservar. Resuelto poniendo las variables en Railway.
- **Precios**: sedán $40 aeropuerto, $100 La Habana (resto sin cambio).
- **Formulario siempre en sedán**: `vehicleId`/`mode` fuera del localStorage (store `version: 2`).
- **Móvil**: pantalla de solicitud recibida arreglada (6/6 pantallas verificadas).
- **Node 22** en Railway; CLI de Railway instalada.
- Base de datos: los 4 registros de prueba (`VT-8276`, `VT-4499`, `VT-4699`, `TMP-TEST-001`) borrados. Tabla vacía.

## Editado por Codex — 2026-09-21

- Petición: retirar temporalmente «Otro destino» hasta confirmar precios; conservar los datos comerciales existentes; actualizar los MD y publicar mediante commit/push para Railway.
- Implementado: selector limitado a las cinco rutas existentes, Continuar exige ruta en Trayecto y validación compartida cliente/API rechaza trayectos sin ruta. Horas conserva su flujo sin ruta obligatoria.
- Textos ES/EN de «Cómo funciona» ajustados a las rutas disponibles.
- Campos históricos de destino personalizado conservados; precios, contactos, dependencias y migraciones sin cambios.
- Documentos actualizados por Codex: `task_plan.md`, `findings.md`, `PROGRESS.md` y `design-system/varadero-taxi/pages/home.md`.
- Verificación local: `node node_modules/next/dist/bin/next build` OK (incluye tipos); cinco casos de validación en memoria OK: ruta válida, ruta nula rechazada, destino personalizado rechazado, ruta desconocida rechazada y Horas sin ruta aceptado. Navegador local: ES a 375 px hasta Contacto sin enviar; EN a 320 px y Horas avanza al calendario; escritorio a 1366 px. Sin desbordamiento horizontal en vistas medidas ni errores de consola. Aviso local no bloqueante: Next detecta otro package-lock.json en Desktop.
- Commit, push y comprobación de Railway: **hecho por OpenCode** (evidencia en sección siguiente).

## Verificación OpenCode — 2026-09-21

### Fix secuencia de pasos (commit `d3dd889 fix: step1 marks route, step4 frames review`)
- Paso 1: elegir ruta ya NO salta de paso — solo marca (dorado) y se avanza con Continuar (consistente con el calendario). Quitados `setStep(2)` del RoutePicker (chip y campo "Otro destino").
- Paso 4: al entrar en el resumen se re-encuadra el scroll en el widget (`scrollIntoView block:center` en `#widget`) — antes el auto-scroll del paso 3 dejaba la vista en la zona de la flota, no en el resumen. Respeta `prefers-reduced-motion`.
- Verificado Playwright 375px: ruta marca (La Habana · 110 min · $90) paso 1; Continuar→2; tras vehículo→resumen visible (review top 359, flota debajo).

### Tooling: script de chequeo del servidor (commit `b81ef5d chore: robust dev-server check script`)
- `scripts/check-server.ps1`: arranca `next dev` en background SIN colgarse (`-RedirectStandardInput` a archivo vacío único `[IO.Path]::GetTempFileName()` — `\\.\NUL` es rechazado por Start-Process), espera HTTP 200, guarda PID, `-Stop` mata por puerto (`Get-NetTCPConnection`) + PID.
- Nunca mata procesos node globales (protección: router del usuario). Ciclo T1-T4 verificado sin hang: T1 fresh 200 (14s), T2 ya-corriendo por puerto, T3 stop libera puerto, T4 fresh 200.

### Deploy Railway + control de procesos
- Railway vivo: `/es` 200 · `/en` 200 · `/api/health` 200.
- Git sincronizado con `origin/master` (todo pusheado).
- Narración: `Get-Process node | Stop-Process` NUNCA (mata procesos Node ajenos del usuario, p.ej. su router). Limpieza siempre por puerto/PID.

## Editado por Codex — 2026-09-21 · ajustes de reserva y calendario

Ampliación autorizada: precios mostrados según ruta, capacidad por vehículo, nombres localizados, estado de solicitud pendiente, acceso móvil al total y corrección de calendario. Se mantienen las tarifas, los contactos y los datos comerciales.

### Evidencia previa

- Codex publicó `0b6c229` y comprobó la retirada de Otro destino en Railway. OpenCode añadió después `b81ef5d` y `367d921`; se conserva su trabajo.
- Antes del segundo ajuste, elegir expresamente 25 de septiembre conservó 25 sept 2026 en el resumen. El fallo reproducido está en el día automático: la combinación de fecha local y UTC devuelve 22 en lugar de 21 al anochecer en Cuba.
- Prueba de funciones de fecha nuevas: el instante 2026-09-21T01:30:00Z produce mañana 2026-09-21 en Cuba, incluso ejecutando con TZ Havana/UTC/Tokyo/Honolulu. Etiqueta del 25 y recogida 10:00 de Cuba estables; cambio septiembre/octubre y fechas imposibles comprobados.

### Verificación pendiente → ejecutada después (ver § Verificación final OpenCode)

Build, pruebas de regresión, navegador local, publicación y una reserva de prueba en Railway. La reserva llevará PRUEBA CODEX / NO PRESTAR SERVICIO y datos ficticios; no se enviarán mensajes manuales de WhatsApp.

## Verificación final OpenCode — 2026-09-21 · revisión del trabajo de Codex

### Corrección de calendario (revisada, verificada)
- Bug raíz confirmado: mezcla de fecha local del cliente + `toISOString()` (UTC) en `getDefaultDate`/`DateTimePicker` → "mañana" calculada fuera de la zona del servicio; además el servidor interpretaba fecha/hora con su zona local.
- Fix central `lib/bookingDate.ts`: todas las fechas/horas del booking se refieren a `America/Havana`; fecha+día son CALENDARIO puro (UTC, nunca instantes locales); `bookingInstant` resuelve el offset de Cuba (±4h/±5h, convergencia) y devuelve `null` en hora saltada por cambio de hora; `bookingScheduleError` unifica la validación de rango (lead-time 2 h y 30 días).
- `getDefaultDate` = mañana en Cuba (`addCalendarDays(bookingClock().date, 1)`) — era el fallo del día.
- Calendario (`DateTimePicker`), resumen, validación server y fecha enviada ya comparten esta referencia única.

### Nuevo: etiquetas de ruta según dirección (petición del usuario)
- Antes los selectores solo decían "La Habana" y el cliente no distinguía salida de llegada.
- Ahora ("Hacia Varadero" → "Desde La Habana"; "Desde Varadero" → "Hacia La Habana"). Ruta interna (Centro de Varadero) sin prefijo. Precios, minutos y catálogo intactos.

### Verificación ejecutada
- `node scripts/test-booking.cjs` → PASS (TZ UTC/Havana/Tokyo/Honolulu, fechas inválidas, DST, lead-time, precios por ruta, capacidades, ajuste a vehículo menor).
- `npm run typecheck` → PASS. `next build` → OK (12 páginas; aviso de lockfile extra en Desktop, build correcto igualmente).

## Endurecimiento de producción — 2026-09-25 (Buffy)

Petición: cerrar cuatro fallos de producción detectados en una revisión de código.

### 1. URL del sitio fijada a un dominio muerto
- `lib/config.ts` clavaba `site.url = https://varadero-taxi.vercel.app` (404) mientras el sitio vive en Railway:
  canonical, hreflang, `metadataBase`, JSON-LD y la imagen de Open Graph apuntaban a un host que no sirve la web
  (las previsualizaciones al compartir en WhatsApp/Facebook salían rotas).
- Ahora `site.url` se resuelve por entorno: `NEXT_PUBLIC_SITE_URL` → `RAILWAY_PUBLIC_DOMAIN` (que Railway inyecta
  sola) → dominio de producción conocido. Se normaliza: `example.com` y `https://example.com/` → `https://example.com`.
- Verificado con 6 casos (sin env, dominio Railway, barra final, sin protocolo, env vacía, env inválida).
- `.env.example` y el README documentan la variable; retirada la línea basura `[TEMPLATE]` de `.env.example`.

### 2. La `ref` podía colisionar y perder una reserva con 500
- Antes: 5 intentos de `SELECT` de comprobación + `INSERT` (no atómico) sobre 9000 valores posibles con `unique`
  global. Dos peticiones simultáneas podían elegir la misma ref → el `INSERT` fallaba → 500 a un cliente válido.
- Ahora: se dibuja la ref y se inserta directamente; el índice único decide. Ante `23505` sobre `ref` se reintenta
  con otra ref (hasta 5 dibujos) y queda el aviso en el log. Desaparecen la ventana de carrera y la consulta previa.

### 3. Fallos de base de datos sin rastro en los logs
- `createSupabaseServer()` lanzaba una excepción sin capturar (500 opaco): ahora se registra y responde 503
  `server_misconfigured`. El fallo de `insert` registra `ref`, `code`, `message`, `details` y `hint`.
- `lib/supabase/errors.ts` (módulo puro, cubierto por tests) distingue colisión de `ref` de colisión de clave de
  idempotencia: es la decisión de la que dependen reintentar o devolver la reserva existente.

### 4. Sin idempotencia: un reintento duplicaba la reserva
- `supabase/migrations/003_booking_idempotency.sql`: `bookings.idempotency_key` + índice único **parcial**
  (`where idempotency_key is not null`), de modo que los envíos sin clave se comportan exactamente como antes.
- Cliente: `BookingWidget` genera una clave por intento (`crypto.randomUUID`, con respaldo) y la mantiene entre
  reintentos; se limpia al empezar una reserva nueva.
- Servidor: si el `23505` es de la clave de idempotencia, devuelve la reserva que ya existe (`duplicate: true`) en
  lugar de un error. La API tolera que la migración 003 no esté aplicada (`42703`/`PGRST204`): prescinde de la
  columna unos minutos en vez de devolver 500 a todos los visitantes.

### Verificación
- `tsc --noEmit` OK · `next build` OK (12 páginas).
- `node scripts/test-booking.cjs` PASS (añadidos: esquema de la clave de idempotencia y clasificación de errores de
  Postgres).
- **Nuevo `scripts/test-bookings-api.cjs`** (8 casos PASS): ejecuta el handler real de `POST /api/bookings` con un
  cliente de Supabase simulado — sin red ni base de datos. Cubre éxito, colisión de ref que se reintenta,
  idempotencia que devuelve la reserva existente, error de BD desconocido con contexto en el log, agotamiento de
  refs, falta de configuración (503) y **migración 003 sin aplicar** (el reintento deja de enviar la columna).
- `npm test` encadena ambas suites (sin red ni base de datos).

### Migración 003 aplicada + validación e2e real
- `supabase db push --linked --yes` aplicó `003_booking_idempotency.sql` (aditiva e idempotente; la tabla estaba
  vacía). Verificado después por REST con `service_role`: `idempotency_key` se lee sin error y `bookings` sigue en
  0 filas.
- Servidor de producción local (`next start`, `PORT=4000`) contra el Supabase real, con la suite `e2e-api.mjs`.
- **Corrida 1 — 24 OK / 3 FAIL**: A3d, A3e y A3g devolvieron 429 en vez de 400. No era la API sino el espaciado del
  propio script: `pacedPost` guardaba en `lastHit` la marca tomada **antes** del `sleep`, así que la llamada
  siguiente calculaba una espera de ~0 y disparaba de inmediato. Las peticiones salían en parejas (una a 16 s y la
  siguiente pegada), justo en el borde del límite de 5/min, y el limitador cortaba casos de validación legítimos de
  forma intermitente. Corregido guardando la marca **después** del `sleep`.
- **Corrida 2 — 27 OK / 0 FAIL**, incluido A6: dos envíos idénticos con la misma clave → misma `ref` (`VT-4748`),
  `duplicate: true` y **una sola fila** en la base. La corrida 1 ya había dado A6 en verde con `VT-1708`.
- El log del servidor registró `[bookings] duplicate submission ignored { ref: 'VT-4748' }`: el aviso funciona en el
  servidor real, no solo en el test con Supabase simulado.
- Limpieza: `cleanup-e2e.mjs` borró las 6 referencias de prueba y, reforzado para borrar también por nombre, dejó
  **0 filas** en `bookings` (verificado con `count` exacto).
- Servidor detenido por PID (nunca `Get-Process node | Stop-Process`, que tumbaría procesos ajenos del usuario);
  puerto 4000 libre.

### Pendiente / fuera de alcance
- El límite de tasa sigue siendo un `Map` en memoria: no purga IPs y el primer valor de `x-forwarded-for` es
  falsificable. Documentado, no tocado en este cambio.

## Revisión desplegada visible en /api/health — 2026-09-25 (Buffy)

Petición: poder saber de un vistazo si producción ya tiene el código empujado, sin sondear el comportamiento.

- **`lib/version.ts`** (nuevo, puro): resuelve el commit con precedencia Railway
  (`RAILWAY_GIT_COMMIT_SHA` / `RAILWAY_GIT_BRANCH` / `RAILWAY_ENVIRONMENT_NAME`) → Vercel → genéricas
  (`GIT_COMMIT`, `COMMIT_SHA`, `SOURCE_VERSION`, `BUILD_COMMIT`). Se lee en cada llamada, no al cargar el módulo.
  Sin datos devuelve `source: "unknown"` con `commit: null`, en vez de inventar un valor (el mismo criterio que ya
  aplica `/api/health` con las variables que faltan).
- **`GET /api/health`** ahora añade `version` al cuerpo y la cabecera `X-Deployed-Commit`. Los nombres de variable
  se confirmaron contra la referencia de Railway: los Git van en runtime (no como ARG de build), y su propia guía
  recomienda exponer el SHA en un endpoint para confirmar qué commit quedó vivo tras un merge.
- **`Cache-Control: no-store`**: sin esto, un proxy o CDN contestaría con el despliegue anterior, que es exactamente
  la pregunta que el endpoint resuelve. El campo `status`/`checks` no cambia, así que el healthcheck de Railway
  sigue funcionando igual.

### Verificación
- `tsc --noEmit` OK · `next build` OK · `npm test` PASS (añadidos: resolución de versión y precedencias en
  `test-booking.cjs`; `/api/health` con commit, cabecera, `no-store`, caso degradado y caso sin datos en
  `test-bookings-api.cjs`).
- Servidor local con el entorno de Railway simulado (`RAILWAY_GIT_COMMIT_SHA=e7ab8be… RAILWAY_GIT_BRANCH=master`):
  responde 200, `x-deployed-commit: e7ab8be`, `cache-control: no-store, max-age=0` y el objeto `version` completo con
  `source: "railway"`. Servidor detenido por PID; puerto 4000 libre.

### Nota de entorno
- Nada de la CLI ni del dashboard de Railway desde esta máquina: va por VPN y con la VPN activa Freebuff deja de
  funcionar. La web desplegada sí es accesible y es por donde se comprueba el despliegue.

## El health avisa si la base va por detrás del código — 2026-09-25 (Buffy)

Petición: que un despliegue con la base sin migrar se vea en el health y no al fallar una reserva.

- **`lib/supabase/schema.ts`** (nuevo): `probeBookingMigrations()` comprueba si `bookings.idempotency_key` existe.
  Distingue tres estados (`true` presente · `false` falta · `null` no se pudo comprobar) y devuelve el aviso
  accionable correspondiente. Solo lee: no migra nada.
- **`GET /api/health`**: añade `checks.migration003` y `warnings`. Las variables de entorno pueden estar bien y
  faltar la migración, que es un desajuste distinto del que ya cubría `checks.supabase`.
- **El drift NO cambia el código HTTP, a propósito.** Las reservas siguen funcionando sin idempotencia, y un 503
  aquí haría que el healthcheck de Railway no promoviese el despliegue que precisamente degrada con gracia:
  "funciona sin idempotencia" pasaría a "no despliega".
- La sonda se rinde a los 3 s (`Promise.race`; la versión instalada de `postgrest-js` no expone `abortSignal`) y va
  envuelta en try/catch: no puede colgar ni tumbar el healthcheck.
- `lib/supabase/errors.ts`: nuevo `isMissingTable()`. Tabla ausente ≠ columna ausente: lo primero impide escribir
  cualquier reserva, lo segundo solo quita la idempotencia; el aviso debe decir cuál de las dos es.

### Hallazgo: `head: true` mentía
La primera versión de la sonda usaba `select("idempotency_key", { head: true, count: "exact" })`. Contra el
Supabase real: una tabla inexistente responde **204 sin error** y una columna inexistente responde 400 con mensaje
vacío y sin código. Habría dado "esquema al día" en una base sin migrar — justo el fallo que esta tarea debía
evitar. Corregido a `select("idempotency_key").limit(1)`, y el cliente simulado de los tests ahora **modela** ese
comportamiento de PostgREST para que un futuro `head: true` rompa el test en vez de pasar desapercibido.

### Verificación
- `tsc --noEmit` OK · `next build` OK · `npm test` PASS (añadidos: `isMissingTable`, y sobre el health — esquema al
  día, migración 003 ausente, tabla ausente, sin configuración y sonda sin respuesta a los 50 ms).
- **Contra el PostgREST real** (solo lectura): columna inexistente en `SELECT` → `42703`; en `INSERT` →
  `PGRST204` (es la que dispara la degradación del POST; sondeada omitiendo a la vez un `NOT NULL`, de forma que no
  pudiera escribirse ninguna fila: 0 filas después); tabla inexistente → `PGRST205`. Los tres códigos de los que
  depende el código dejan de ser suposiciones.
- Servidor local apuntando al Supabase real: `{"checks":{"supabase":true,"telegram":false,"migration003":true}}`
  y sin `warnings`. Servidor detenido por PID; puerto 4000 libre.

## CI en GitHub Actions — 2026-09-25 (Buffy)

Petición: que un build roto no llegue a Railway.

- **`.github/workflows/ci.yml`** (nuevo): en cada push (cualquier rama), en PR y a mano
  (`workflow_dispatch`) ejecuta `npm ci` → `npm run typecheck` → `npm test` → `npm run build`, con
  Node 22 (coincide con `engines.node` y con `NODE_VERSION` de Railway), caché de npm y
  `timeout-minutes: 15`. `concurrency` cancela la ejecución anterior de la misma rama.
- **`npm ci` y no `npm install`**: falla si `package-lock.json` y `package.json` no están de
  acuerdo, que es justo lo que se quiere detectar; `install` los "arreglaría" en silencio.
- **Sin secretos**: comprobado con grep que en tiempo de compilación solo se leen variables
  opcionales (`ALLOW_INDEXING`, `NEXT_PUBLIC_SITE_URL`, `RAILWAY_PUBLIC_DOMAIN`); `SUPABASE_*` y
  `TELEGRAM_*` solo se usan en runtime dentro de las rutas. Si algún día el build de CI falla por
  una variable que falta, es un hallazgo: el código empezó a depender de ella al compilar.
- Ojo con una dependencia de red del build: `lib/fonts.ts` usa `next/font/google` (Inter y
  Playfair Display), así que la compilación descarga las fuentes. En los runners de GitHub hay
  salida a internet, pero es un punto de fallo externo al repositorio.

### Verificación
- YAML validado con PyYAML (estructura, pasos y `node-version`) antes de confiar en él.
- La secuencia exacta del flujo ejecutada en local: `npm run typecheck` 0 · `npm test` 0 ·
  `npm run build` 0.

### Primera corrida real (run `36195406959`) — encontró dos cosas
1. **Push rechazado por GitHub**: `refusing to allow a Personal Access Token to create or update
   workflow .github/workflows/ci.yml without workflow scope`. El commit quedó en local y el remoto
   no se movió. La causa no era el commit: git usa el helper `manager` (Credential Manager), cuya
   credencial guardada no tiene el permiso `workflow`, mientras que `gh` **sí** está autenticado
   como `jcv911` con `'gist', 'read:org', 'repo', 'workflow'`. Se empujó con la credencial de `gh`
   **solo para ese comando** (`git -c credential.helper= -c credential.helper='!gh auth git-credential' push`),
   sin tocar la configuración de git. Arreglo permanente para el día a día: `gh auth setup-git`.
2. **El flujo se creó y llegó a correr**, lo que de paso valida el YAML (GitHub lo parseó) y el
   disparador. **Falló en `npm ci`** — y era un hallazgo real, no un problema del flujo:
   `Missing: @swc/helpers@0.5.23 from lock file`. El `package-lock.json` lo escribió **npm 12**
   (esta máquina va con Node 24) y el runner tenía **npm 10** (Node 22), que no reconstruye el mismo
   árbol. Comprobado que el lock no está roto: `npm ci --dry-run` con el npm local pasa sin
   problemas.
   - Lo que de verdad importa: **Railway nunca se queja** porque instala de forma tolerante y
     resuelve al vuelo, así que la versión de `@swc/helpers` que usa producción **no está fijada en
     el lockfile**. Build no reproducible, invisible hasta ahora.
   - Decisión del usuario: **CI en Node 24**, la misma versión con la que se verificó todo en local
     y con la que se escribe el lockfile. No se toca el lock, así que no cambia nada de lo que
     Railway instala.
   - Deuda asumida, anotada en el propio flujo: el CI verifica en Node 24 mientras Railway sirve en
     Node 22. El arreglo de fondo es fijar una sola versión para todo (`packageManager` en
     `package.json` + `NODE_VERSION` en Railway) y volver a 22 en el CI.
- Las acciones suben a `actions/checkout@v7` y `actions/setup-node@v7`: las v4 tiraban aviso de
  deprecación de Node 20. Comprobado con `gh api` que los tags flotantes `v7` existen antes de
  usarlos, en vez de escribirlos de memoria.

## Una sola versión de Node para todo el proyecto — 2026-09-25 (Buffy)

Petición: fijar una única versión de Node y npm (`packageManager` + `NODE_VERSION` de Railway) y devolver el CI
à Node 22, cerrando la deuda anotada en el flujo.

**Cambiar Railway no hacía falta y no se ha tocado**: ya está en Node 22, que es justo la versión que se quería
para todo. (Y la CLI/dashboard de Railway no es alcanzable desde esta máquina: va por VPN y con la VPN activa
Freebuff deja de funcionar.) Lo que faltaba era otra cosa: que el lockfile fuese instalable por npm 10.

### Causa raíz, con el paquete ya identificado
`next-intl` exige `@swc/helpers >=0.5.17` y el lockfile solo tenía la entrada hoisteada `0.5.15` (la que pide
`next`), sin la anidada que next-intl necesita. **El lockfile no podía satisfacer el árbol que declaraba.**
- npm 10 lo rechaza (`Missing: @swc/helpers@0.5.23 from lock file`) → CI rojo en Node 22.
- npm 12 lo tolera → por eso en local nunca se notó.
- Railway instala de forma tolerante y resuelve al vuelo → **en producción corría un `@swc/helpers@0.5.23` que no
  estaba fijado en el lock**. Build no reproducible, invisible hasta que el CI lo dijo en voz alta.

### Arreglo
- `package-lock.json` regenerado con npm 10.9.9 (`npx npm@10 install --package-lock-only`, que no toca
  `node_modules`). Quirúrgico: **+7 entradas de paquete** (la anidada de next-intl y las 6 de
  `@tailwindcss/oxide-wasm32-wasi`), **0 versiones eliminadas** y dependencias de raíz idénticas. Sin churn
  transitivo. Integridad comprobada: 163 → 170 entradas de paquete, `lockfileVersion: 3`.
- `package.json`: `packageManager: "npm@10.9.9"`, que documenta la herramienta que produce el lock.
- El CI vuelve a **Node 22 con npm 10**, la MISMA versión que sirve Railway. Se mantienen las acciones v7.
- README: requisitos corregidos (decía «Node.js 20+») y la orden para regenerar el lock sin romper el CI.

### Verificación
- `npx npm@10 ci --dry-run` → 0 (antes fallaba con EUSAGE) · `npm ci --dry-run` con el npm 12 local → 0, así que
  la máquina de desarrollo sigue funcionando.
- YAML validado con PyYAML · typecheck, tests y build en local: 0 / 0 / 0.
- **Corrida real en GitHub Actions (run `36196303356`) en Node 22: VERDE**, con `Instalar dependencias`
  (`npm ci` de verdad) y `Build` entre los pasos. Es la prueba que valida el árbol de dependencias *fresco*, algo
  que el `node_modules` local no puede demostrar.

### Riesgo residual (en la máquina de desarrollo) — RESUELTO con guardarraíl
Esta máquina va con Node 24 y npm 12, así que un `npm install` suelto volvía a escribir el lock en la forma que
npm 10 rechaza. **Antes de decidir nada lo medimos**, en una copia aislada (el lock del repo nunca se tocó):
`npm install --package-lock-only` con el npm 12 de la máquina **elimina la entrada anidada
`node_modules/next-intl/node_modules/@swc/helpers@0.5.23`** (la ve como `optional`+`peer` y la poda) y el lock
queda inservible para npm 10: `npm ci` → `Missing: @swc/helpers@0.5.23 from lock file`. Es exactamente el error
con el que arrancó todo esto, así que **la inconsistencia original la creó este mismo mecanismo**, no un descuido.

Precisión: no es un «dialecto» del archivo (ambos escriben `lockfileVersion: 3`), es una **resolución distinta
del mismo árbol**.

**Decisión del usuario: guardarraíl en el proyecto, sin tocar la máquina.** Se descartaron `corepack enable npm`
(escribe shims en `Program Files`, afecta a toda la máquina) y no hacer nada (el CI lo detecta, pero después del
commit).

- `.npmrc` → `engine-strict=true` (con el porqué escrito en el propio archivo).
- `package.json` → `engines.npm: ">=10 <11"` (se mantiene `engines.node: ">=22.0.0"`).

**Verificación (todo en esta máquina, npm 12 del sistema):**
- `npm ci --dry-run` → **1** con `EBADENGINE` · `npm install --package-lock-only` → **1** y **el lock quedó con su
  md5 original** (`9c399594…`): el comando que envenenaba el lock ahora se niega antes de escribir nada.
- `npx npm@10 ci --dry-run` → **0**.
- Y lo que importaba no romper: `npm run typecheck` **0** · `npm test` **0** · `npm run build` **0** con el npm 12,
  porque `engine-strict` solo interviene en las instalaciones, no en los scripts.

**Supuesto no verificado desde aquí:** que Railway instale con npm 10 (Node 22) y por tanto satisfaga el rango.
Es lo esperado, pero la CLI/dashboard de Railway no es alcanzable desde esta máquina (VPN, ver arriba). Si algún
día se sube el Node de Railway, el install fallaría en voz alta con `EBADENGINE` — alarma, no deriva silenciosa —
y el arreglo es ampliar el rango o alinear `NODE_VERSION`.

## Prueba de estrés — 2026-09-25 (Buffy)

Petición: una prueba de estrés. Antes de disparar nada se acordó el blanco con el usuario: **local + Supabase
real, con limpieza**. Nunca contra producción: un POST válido escribe una fila real y manda un Telegram, así que
un generador de carga apuntando al sitio habría sido una avalancha de reservas falsas. Telegram queda inerte
porque sus dos variables están vacías en `.env.local` (comprobado leyendo solo los nombres, no los valores).

Herramienta nueva: `scripts/stress.cjs` (sin dependencias, `fetch` nativo). Fases seleccionables con
`STRESS_ONLY=read,limiter,mem,idem,burst`, **aborta si el destino no es loopback** (así nadie la apunta a
producción por descuido) e integra su limpieza con `cleanup-e2e.mjs` (mismo marcador y mismo `.e2e-refs.json`).

### Resultados (corrida completa)

- **Lectura**: 300-312 req/s con 20 concurrentes sobre `/es` y `/en` · p50 53-64 ms · p95 92-164 ms.
  `/api/health` (dos viajes a la base por llamada): ~13 req/s, p50 202-284 ms.
- **Rate limiter**: se agota **exactamente en la sexta** llamada (5 pasan, luego 429) y cuenta peticiones, no
  éxitos. Una reserva **válida** desde esa IP queda rechazada: 5 reservas/min por IP declarada.
- **La clave la elige el cliente**: 25 peticiones con 25 valores distintos de `x-forwarded-for` → **0 rechazos**.
- **Idempotencia bajo concurrencia real**: 10 envíos SIMULTÁNEOS con la misma clave → 10×200, **una sola ref**,
  9 respuestas `duplicate: true`, **una sola fila** en Postgres y 9 líneas `duplicate submission ignored` en el
  log del servidor. (Dos corridas: `VT-8615` y `VT-2897`.)
- **Ráfaga**: 5 rondas × 150 reservas simultáneas con claves distintas → **750/750 creadas, 750 refs únicas,
  0 errores 500, 0 fallos de insert** y **31 colisiones reales de `ref`**, todas resueltas en el primer reintento.

### La colisión de `ref`, medida

31 observadas frente a **31,2** esperadas por el modelo: por ronda, C(150,2)/9000 (dentro de la ronda) más
150 × (filas ya usadas)/9000. Que cuadre dice dos cosas: los sorteos son uniformes (no hay sesgo que agrupe
refs) y **la tasa de colisión crece con lo llena que esté la tabla**, ≈ N/9000 por reserva. Hoy, con la tabla
vacía, es irrelevante; con 4500 filas, la mitad de las reservas necesitaría un reintento y el log tendría un
aviso por reserva. No rompe nada —el reintento funciona y el cliente no lo nota— pero es motivo para ampliar el
espacio de 4 dígitos antes de que el panel acumule filas.

### Memoria: mi primera lectura era falsa y el control me corrigió

La fase de memoria mostró **+345 MB** tras 19 183 peticiones en 20 s y mi primer impulso fue culpar al `Map` de
IPs. Los controles lo desmintieron:

| carga (20 s, 50 concurrentes) | claves nuevas en el Map | ΔRSS |
| --- | --- | --- |
| POST con IPs nuevas (fase 4) | 19 183 | +345 MB |
| GET `/es` (no toca el Map) | 0 | **+266 MB** con la mitad de peticiones |
| POST con una sola IP (429) | 1 | +136 MB |
| POST con 1 000 IPs rotando | 1 000 | +0,9 MB |

Y tras unos segundos en reposo el RSS volvió de **510 MB a 155 MB**. Es expansión del heap de V8 bajo carga, que
el proceso devuelve: no hay fuga por entrada. Por eso la fase 4 quedó como **medición sin `check`**: no hay una
propiedad limpia que afirmar y preferí no escribir una mentira con formato de `OK`. El defecto del Map sigue
siendo real y ya estaba señalado (nunca borra entradas y su clave es falsificable), pero su coste es ~200 B por
IP *única*: un goteo lento, no una bomba.

### Un defecto del propio arnés, encontrado al usarlo

Una corrida con **0 fallos** devolvió código **127** y un assert de libuv (`UV_HANDLE_CLOSING`): `process.exit()`
con sockets de keep-alive a medio cerrar, en Windows. Corregido fijando `process.exitCode` y dejando que Node
drene sus handles (con un temporizador de 10 s sin `ref` como red). Verificado: salida limpia en 4,5 s.

### Limpieza

Todas las filas de prueba borradas por referencia **y** por nombre, con un conteo independiente posterior:
**0 filas PRUEBA** en `bookings`. Servidor parado por PID exacto (6440 y 7180, confirmando antes con
`Get-CimInstance` que eran mi `next start`), puerto 4000 libre.

Aviso: los tres `scripts/e2e-*.mjs` (que `stress.cjs` usa) quedaron versionados en `2df4f00`, así que ya no vale
 el «lo que no está commiteado no existe para el CI»: ahora el problema es el siguiente paso, que el CI tampoco los
 ejecuta y que `playwright` no está en `package.json` (solo los dos scripts que usan `@supabase/supabase-js` corren
 en un clon limpio).

## Lighthouse — 2026-09-26 (Buffy)

Medido de verdad, sin Chrome de sistema: Lighthouse 13.5 con el Chromium que ya descarga Playwright
(`CHROME_PATH=%LOCALAPPDATA%\ms-playwright\chromium-1243\chrome-win64\chrome.exe`), emulación móvil por defecto
(412×823, DPR 1,75, red y CPU ralentizadas). Dos blancos: `next start` en local y el sitio desplegado. Un pase por
blanco, así que las décimas de los números son indicativas; lo que importa es qué auditorías fallan.

| | Performance | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| local (`localhost:4000/es`) | 84 | 95 | 100 | 61 |
| producción (`…up.railway.app/es`) | 83 | 95 | 100 | 69 |

Métricas (local / prod): FCP 1,4 s / 1,7 s · **LCP 4,1 s / 3,8 s** · TBT 180 ms / 220 ms · CLS 0,004 / 0,004 ·
Speed Index 2,1 s / 4,0 s. En producción se transfirieron 763 KiB en 19 peticiones: imágenes 441, JS 215, fuentes
85. La diferencia de Speed Index es la latencia real de la red, que en local no existe.

### Dos cosas que el informe dice y NO son ciertas

- **Los 235 KiB "desperdiciados" en imágenes no existen.** `image-delivery-insight` compara el archivo con el
  tamaño *mostrado* a DPR 1, pero la emulación va a DPR 1,75: la tarjeta de 295 px pide 295×1,75 ≈ 516 px y el
  navegador bajó la variante de 640 px —la correcta— ya en WebP. Comprobado en el propio informe
  (`screenEmulation.deviceScaleFactor: 1.75`) y en la petición real (`mimeType: image/webp`, 86 KiB). Antes de
  "optimizar" aquí hay que mirar el DPR y la variante servida, no el titular del ahorro.
- **El hero ya está bien.** Lleva `rel="preload" as="image"` con su `imageSrcSet`, `priority`, `sizes="100vw"`, y
  la variante de 750 px es la que corresponde a una ventana de 412×1,75 ≈ 721 px. No hay nada que "arreglar" en
  la detección del LCP.

### Mejoras concretas, por impacto

1. **Accesibilidad, crítico (WCAG 4.1.2): el stepper del widget no tiene nombre accesible en móvil.** El número va
   en un `<span aria-hidden>` y la etiqueta del paso en `<span className="hidden sm:inline">`: por debajo de
   640 px el texto sale del árbol de accesibilidad y los cuatro botones quedan sin nombre. Arreglo:
   `aria-label={t(key)}` en el botón, conservando `aria-current="step"` (`components/booking/BookingWidget.tsx`).
2. **Accesibilidad, serio (WCAG 2.5.3): el selector de idioma.** `LanguageSwitcher` lleva
   `aria-label="Switch language to EN"` —en inglés fijo, además, en un sitio bilingüe— mientras el texto visible es
   "ES". El nombre accesible debe contener el texto visible: `aria-label={`${locale.toUpperCase()} — …`}` con una
   clave nueva en los diccionarios.
3. **50 KiB de JavaScript que se descargan y no se ejecutan.** El chunk de 82 KiB que Lighthouse marca como
   `unused-javascript` contiene **zod** (verificado en el bundle: `ZodError`, `Invalid input`, `ZodType`), además de
   framer-motion, lucide y zustand. zod entra al cliente porque `ContactSheet` importa `bookingSchema`, que solo
   hace falta al enviar el formulario: sacarlo del bundle inicial con un `await import("@/lib/schemas")` en el
   submit es también el mayor sospechoso del TBT de 180-220 ms.
4. **Hero en escritorio: `sizes="100vw"` donde el hueco es la mitad.** En ≥1024 px el hero es una columna de dos, así
   que `sizes="(min-width: 1024px) 50vw, 100vw"` evita bajar variantes de 1080+ para un hueco de ~600 px. Y conviene
   poner `fetchPriority="high"` explícito: Next preloadea la imagen, pero en el HTML desplegado **no** hay ningún
   `fetchpriority="high"` (solo un `low` en un script).
5. **Menores**: 8 KiB de CSS bloqueante (~100 ms en prod) y 11-12 KiB de "legacy JavaScript" (ayudas para
   navegadores viejos). Ninguno justifica tocar el diseño.

### Lo que no es un defecto

- **SEO 61-69**: `is-crawlable` falla porque la web va `noindex, nofollow` mientras `ALLOW_INDEXING` no sea `true`
  — decisión de negocio, no un fallo. El `canonical` que falla en la corrida local es un artefacto de medir en
  `localhost`: el canonical apunta al host real, como debe.
- **Buenas prácticas: 100** en los dos blancos.

### Nota de la herramienta

`chrome-launcher` no consigue borrar su carpeta temporal al terminar (`EPERM` en Windows) y el CLI muere con un
error **después** de escribir el informe: el JSON queda completo y se puede usar. Lighthouse se instaló con
`npx npm@10 install --no-save lighthouse`, así que ni `package.json` ni el lockfile cambiaron (md5
`9c399594…` comprobado antes y después); un `npm ci` lo borrará.

## Accesibilidad y CLS — 2026-10-01 (Buffy)

Cierre de las mejoras que quedaban pendientes de la medición de Lighthouse. Dos commits: `78de843`
(accesibilidad y contraste) y el que sigue a esta nota (CLS).

### Los dos fallos de accesibilidad, arreglados

- **Stepper del widget sin nombre accesible en móvil** (crítico, WCAG 4.1.2). El atajo obvio no sirve: con
  `aria-label={t(key)}` pasa `button-name` pero empieza a fallar `label-content-name-mismatch`, porque el número
  visible queda fuera del nombre. El nombre se arma ahora con el propio contenido: el número deja de ser
  decorativo (`aria-hidden` fuera) y la etiqueta pasa de `hidden sm:inline` a `sr-only sm:not-sr-only`. En móvil
  se sigue viendo solo `1 2 3 4` (comprobado: el texto queda en `position: absolute`, 1×1, `clip-path: inset(50%)`)
  y el árbol de accesibilidad anuncia `"1 Ruta"`, `"2 Fecha y hora"`, `"3 Vehículo"`, `"4 Resumen"`.
- **Selector de idioma** (serio, WCAG 2.5.3). Se anunciaba `"Switch language to EN"` —en inglés fijo— con el texto
  visible `"ES"`. Clave nueva `common.switch_language`: `"ES · Cambiar a EN"` y `"EN · Switch to ES"`.
- **Contraste**, medido sobre el DOM real resolviendo los `oklab()` del tema a sRGB: la línea de 11 px del footer
  pasa de 3,87:1 a **5,99:1** y los pasos inactivos del stepper (etiqueta y número) de 3,58:1 a **5,25:1**.

| Lighthouse, móvil emulado | Performance | Accesibilidad | LCP | TBT | CLS |
|---|---|---|---|---|---|
| producción antes (`dde86e6`) | 67 / 77 | 95 / 100 | 3,3 / 3,9 s | 240 / 240 ms | 0,442 / 0 |
| producción después (`78de843`) | 69 / 69 | **100 / 100** | 3,3 / 3,4 s | 180 / 180 ms | 0,442 / 0,443 |

Dos corridas por lado. La corrida «antes» con 100 y CLS 0 es la prueba de la varianza: es aquella en la que el
widget no llegó a montarse antes de la auditoría, así que no había botones que fallaran; el mismo commit dio 95 en
la otra. Aviso metodológico: Lighthouse 13 suma al CLS los desplazamientos aunque Chrome los marque
`had_recent_input` (el CLS de campo de esos usuarios sería 0), así que la métrica empeora pero el informe de
accesibilidad no: cuando el widget no está montado, las auditorías de accesibilidad no ven nada que fallar.

### El CLS de 0,442: causa y arreglo

Un A/B con `git stash` sobre servidor recién arrancado dejó claro que el CLS era anterior a los arreglos de
accesibilidad (el código sin ellos daba el mismo 0,442 y perf 63-68). Para atribuirlo hubo que sacar la traza
(`--save-assets`) y además una sonda temporal con `PerformanceObserver` en el layout, porque Lighthouse reportaba
`1 layout shift found` **sin fuentes**. Los nodos culpables:

```
DIV.pointer-events-none.absolute.-left-48    prev=[0,272,192,384]   cur=[0,354,192,384]
DIV.pointer-events-none.absolute.-right-48   prev=[181,310,192,384] cur=[181,557,192,287]
A.hero-scroll-hint.mx-auto.mt-10             prev=[165,480,44,44]   cur=[0,0,0,0]
```

Eran las dos manchas doradas del hero y el enlace «Descubre más»: el widget de reserva **no existía en el HTML**
(`if (!mounted) return null`) y aparecía tras la hidratación, así que la altura del hero crecía ~328 px y todo lo
posicionado en porcentaje respecto a esa altura (`top-1/4`, `bottom-1/4`) se movía con ella.

Arreglo: el widget se pinta en el servidor. Se puede porque el store usa `skipHydration: true`, el estado
persistido solo guarda `name`/`whatsapp`/`email` (nada que cambie el diseño) y la fecha por defecto se calcula en
hora de Cuba (`lib/bookingDate.ts`), así que servidor y cliente pintan lo mismo; el portal del paso 5 pasa a estar
guardado por `typeof document !== "undefined"`. El HTML crece 11 KB (79 → 90 KB) y el flujo completo se probó a
mano (ruta → fecha → vehículo → resumen → diálogo de contacto, sin crear ninguna reserva).

| Lighthouse, móvil emulado | Performance | Accesibilidad | TBT | CLS |
|---|---|---|---|---|
| antes del arreglo (3 corridas) | 67 / 68 / 68 | 100 | 80-140 ms | 0,442 · 0,443 · 0,442 |
| después del arreglo (3 corridas) | **83 / 84 / 86** | 100 | 140-270 ms | **0,001 · 0,001 · 0,001** |

La sonda se quitó del layout antes de medir (se revirtió con `git checkout` del archivo) y no se commiteó nunca.

## e2e en el CI — 2026-10-01 (Buffy)

Las suites existían desde el 2026-09-24 y no las ejecutaba nadie: sin script npm, sin job de CI y
con `playwright` instalado a mano con `--no-save`. Atarlas destapó que la de navegador **no
funcionaba** y que se había quedado atrás respecto a la interfaz.

- `playwright` entra como dependencia de desarrollo **fijada** (`1.63.0`, sin rango ni circunflejo):
  es la versión cuyo chromium (1243) usa la suite cuando no se le pasa `E2E_CHROME_PATH`.
- Scripts npm: `e2e:api`, `e2e:browser`, `e2e:cleanup` y `e2e` (las tres en orden).
- Job `e2e` en `.github/workflows/ci.yml`: corre en `master` y a mano —no en pull requests, porque
  escribe en la base real—, levanta `next start` en el 4000, espera `/api/health`, corre las dos
  suites y **siempre** limpia, aunque una falle. Los pantallazos van como artefacto (7 días).
- Si faltan los secretos `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, el job se omite con un aviso
  en lugar de ponerse rojo: en un fork no hay secretos y un rojo ahí no informaría de nada.

### Lo que estaba roto en la suite de navegador

`ctx.setViewportSize()` es de la página, no del contexto: el script reventaba en el primer
escenario con `not a function`. Como nunca corrió, nadie lo vio; arreglarlo fue solo el principio,
porque el resto de los selectores eran anteriores al rediseño de lujo:

| Qué fallaba | Por qué |
|---|---|
| `ctx.setViewportSize(viewport)` | Es `page.setViewportSize`; el contexto ya se crea con `{ viewport }`. |
| El botón WhatsApp de la pantalla de éxito | Esperaba 1 enlace en toda la página y ahora hay 2: el pie de página tiene el suyo. Se acota a `#widget`. |
| Las tarjetas de vehículo (`/^Van/`, `/^SUV/`) | El nombre ya no abre el texto: la insignia va delante ("Grupos VIP Van…"). |
| `filter({ hasText: /\bVan\b/ })` | El `textContent` se concatena sin separadores, así que no hay límites de palabra. Por nombre accesible sí funciona. |
| Los contadores de pasajeros | El selector pedía un `div` intermedio que no existe: los botones son hijos directos. |
| El rótulo del mes del calendario | `div.filter({ has: botón })` cogía el árbol entero de la página, así que la comparación no medía el mes. |
| Contar radios (`=== 2`) | Hay 4 en total (modo de servicio y dirección). Se acota al grupo de dirección. |
| El mes siguiente | El botón solo avanza si el mes siguiente entra en `maxAdvanceDays`: hoy, 1 de octubre, no entra y no hace nada. La comprobación pasa a medir esa regla, no un resultado. |
| El sexto envío (`429`) | El endpoint limita a 5 por minuto: la suite ahora espera 16 s entre envíos, igual que la de API. |

### Verificación local (servidor en el 4000, base real, chromium de Playwright)

- `npm run e2e:api`: **27 OK / 0 FAIL**.
- `npm run e2e:browser`: **9 escenarios OK / 0 FAIL**.
- `npm run e2e:cleanup`: 18 referencias borradas, **0 filas restantes** por referencia y por nombre
  (`CLEAN OK`). Incluye la fila que dejó una depuración a mano, borrada por nombre.
- `npm ci` con npm 10 acepta el lockfile nuevo; typecheck, pruebas y build siguen en verde.

### Pendiente que deja esto

- **Falta poner los secretos en GitHub** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`): sin ellos el
  job `e2e` se omite, así que las suites siguen sin correr solas hasta que estén.
- En Railway conviene `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`: el postinstall de Playwright baja
  chromium, firefox y webkit, y el despliegue no usa ninguno. Sin esa variable el build solo tarda
  más; no rompe nada.
- El botón «Mes siguiente» del calendario no avisa de que no puede avanzar (ni está deshabilitado)
  cuando el mes siguiente está fuera de plazo. Es una mejora de interfaz, no un fallo de datos.
