# Task Plan — Varadero Taxi

> **Este archivo es el plan**: objetivo, fases y lo que queda por hacer. El registro de lo ya hecho —con la
> evidencia ejecutada— vive en `PROGRESS.md`, y la investigación técnica en `findings.md`. Aquí no se copian los
> detalles de sesión: el plan apunta a ellos.

## Objetivo
Web de reserva de traslados privados de lujo en Varadero (Cuba). Next.js 15 + Tailwind v4 + next-intl (en/es) + Zustand + Supabase + Railway (Node `next start`). Diseño según `design-system/varadero-taxi/` (MASTER.md + pages/home.md).

## Estado actual
Pasos 1-11 funcionales y pusheados a `master` (`https://github.com/jcv911/varadero-taxi`, privado). **Producción
verificada**: `https://varadero-taxi-production.up.railway.app` responde 200 en `/es` y `/en`, y `/api/health` 200 con
`checks{supabase:true, telegram:false, migration003:true (verificada el 2026-09-25 en PROGRESS.md; el health del 2026-11-07 devolvió null por timeout de la sonda)}` y el commit desplegado en `version.commit`.
**Lo que queda no es código de la web:** (a) los **dos paneles del negocio** (abajo), (b) las **confirmaciones
comerciales** (TODO-CONFIRMAR) y (c) el **dominio propio**, pospuesto por decisión del negocio. El historial —fixes
móviles, calendario, endurecimiento, idempotencia, health, CI, npm 10 y prueba de estrés— está en `PROGRESS.md` con
su evidencia; aquí no se repite. Referencia del último commit verificado en producción: `f4b4b78`.

## Fases

### ✅ Paso 1 — Base del proyecto
- Next.js 15 App Router + TS + Tailwind v4, compila.
- `globals.css` con @theme de tokens MASTER + motion + reduced-motion.
- `next/font` Playfair Display + Inter (`lib/fonts.ts`).

### ✅ Paso 2 — i18n + capa de datos
- next-intl v4 (`app/[locale]`, es/en default en, middleware, dicts `lib/i18n/*.json`).
- `lib/routes.ts` (rutas, precios USD, `formatUsd`), `lib/vehicles.ts` (4 clases), `lib/schemas.ts` (zod), `lib/bookingStore.ts` (Zustand persist), `lib/config.ts`.
- Commit `b134605`.

### ✅ Paso 3 — Componentes UI + ajustes de datos
- Ajustes: hora default 10:00, `MIN_LEAD_HOURS` en config, skipHydration + version + partialize (solo contacto/preferencias), bookingToAPI sin precio, phone regex, superRefine aeropuerto/antelación.
- `components/ui/*` (GoldButton, GlassCard, Chip, PriceDisplay) y `components/booking/*` (widget 3 pasos).
- Commit `14a5e00`.

### ✅ Paso 4 — Flujo reserva E2E
- ContactSheet (sheet glass, errores inline zod, honeypot, consentimiento), BookingSuccess (check animado, ref VT-, WhatsApp, nueva reserva), API `/api/bookings` (zod + computePrice server + rate-limit IP + ref única + Supabase service_role + Telegram async), migración 001, pagina privacidad, `.env.example`.
- Commit `step 4: booking flow end to end`.

### ✅ Paso 5 — Web visible
- SiteHeader (glass al scroll), LanguageSwitcher, MobileMenu, StickyMobileCTA, Footer, HeroBanner (foto priority, widget protagonista), FleetCarousel (snap, flechas, reselect), deep-links `?vehicle=` `?to=`.
- Commit `4380aa0`.

### ✅ Paso 6 — Contenido, SEO, pulido
- FeaturesGrid, HowItWorks, FAQAccordion, CTAZone; metadata por idioma + OG + hreflang + canonical, sitemap/robots/icon, JSON-LD TaxiService, not-found, loading, skip-link, security headers, README.
- Commit `f4a1da5`. / + chore noindex `31d1d70`.

### ✅ Paso 7 — Miniatura + dirección + zonas
- VehicleClassSelector aspect 16/10 object-cover (`thumbPosition`), `direction` from/to (segmentado, rutas internas), resumen de trayecto, ContactSheet contextual, superRefine, API/WhatsApp/Success, migración 002.
- `lib/routes.ts` → zonas (`ZoneId`) + kinds (`transfer | airport | excursion`) + `internal` + `match`.
- Commit `70d5344`. + fix portal contact sheet `0b75075`.

### ✅ Paso 8 — Configuración Supabase + .env + RLS
- `supabase init` (config.toml, supabase/.gitignore) + `supabase link --project-ref mqfkqfxoczyvnrjxgtut` (proyecto `varaderotaxi`).
- `supabase db push` aplicó migraciones 001 (tabla bookings + RLS sin políticas) y 002 (direction + other_address).
- `.env.local` creado con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Telegram vacío, ALLOW_INDEXING=false). Nunca se muestra ni se lee.
- Verificación RLS: tabla existe con RLS ON; anon SELECT → [] (bloqueado); anon INSERT → Unauthorized; service_role SELECT/INSERT/DELETE → 200 OK.
- Build + typecheck OK. Commit `aab364d`.

### ✅ Paso 9 — Hero con contexto y confianza + nav desktop
- SiteHeader desktop (≥1024px): enlaces scroll suave a #fleet/#how/#faq/#contact + LanguageSwitcher + GoldButton "Reservar" → widget. Hamburgesa solo en <1024.
- HeroBanner 2 columnas desktop (kicker, h1, subtítulo, 3 trust points con iconos Lucide | BookingWidget); móvil: título/subtítulo compactos, trust en una línea, widget above the fold, flecha scroll discreta (transform/opacity, desactivada con prefers-reduced-motion).
- Trust points alineados con FeaturesGrid (precio fijo USD, pago en efectivo al llegar, chofer profesional — **confirmado por el negocio el 2026-09-25**).
- Diccionarios es/en (`hero.*`, `nav.fleet/how/faq/contact`), `[id] scroll-margin-top` en globals.css.
- Commit `7d8b61b`.

## Notificaciones Telegram — decision del negocio (2026-09-25)

**Estado: DESACTIVADO por decision del negocio. No es un bug.** (Detalle y verificación: `PROGRESS.md`.)

El aviso a Telegram no se activa hoy. En su lugar, las reservas se consultaran en un **panel web para el gestor**
(ver "Paneles planificados" abajo). Telegram quedara como canal opcional en el futuro, no como dependencia.

`TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` **no se definen en producción** y el código está preparado para eso:
`notifyTelegram()` hace early-return si falta cualquiera de las dos, se invoca como `void notifyTelegram(...)`
(fire-and-forget) y su `catch` es no-op, así que una notificación fallida **nunca** puede tumbar una reserva ya
guardada. Sin variables el envío se omite en silencio: ni error ni log de fallo.

**Consecuencia aceptada:** una reserva guardada no avisa al móvil; hay que entrar al panel (o a Supabase) para
verla — ese es exactamente el hueco que cubre el panel del gestor.

**Si se activa en el futuro:** pegar las dos variables en Railway; no requiere cambio de código. Se comprueba con
`GET /api/health` -> `checks.telegram: true`.

## Paneles planificados (pedido del negocio, 2026-09-25)

Dos paneles, en este orden. **Ninguno existe todavía**; se documentan aquí para no perderlos. Las trampas del
código que condicionan su diseño están en `PROGRESS.md` § Paneles pendientes; aquí queda solo el plan.

### 1. Panel del gestor — ver y gestionar reservas

Para el operador del negocio: lista de reservas, detalle, cambio de estado y datos de contacto.
Es el reemplazo de Telegram como canal de aviso.

Restricciones que impone el código actual (detalle en `PROGRESS.md` § Paneles pendientes):
- `bookings` ya tiene `status` (default `pendiente`) y `ref` único: el panel es dar pantalla a ese estado.
- RLS activado **sin políticas** para `anon`: lectura server-side con `service_role`, nunca desde el navegador.
- El rate-limit es un `Map` en memoria (fiable con **una** réplica): migrar a Redis/Upstash antes de escalar.
- `hotel_pickup` y `other_address` son texto libre: el panel debería ofrecerlos en desplegable.

### 2. Panel administrativo — flota, disponibilidad y tarifas

Para editar la flota y la disponibilidad segun las reservas del dia.

Decisiones que el panel tendrá que respetar (detalle en `PROGRESS.md` § Paneles pendientes):
- Las tarifas viven en `lib/routes.ts` (`priceUsd` por ruta y vehículo): editarlas implica moverlas a la base de datos.
- "Disponibilidad según reservas del día" = cruce de `bookings` (`date` + `vehicle_id` + `time`) con la flota. Y
  `bookings.date` es **texto `YYYY-MM-DD` en hora de Cuba** (`lib/bookingDate.ts`), no un `timestamptz`: se compara
  texto, no fechas SQL.
- El precio se calcula en el servidor (`computePrice`) y el navegador nunca lo manda: invariante que se conserva
  cuando las tarifas pasen a la BD.

## Despliegue (estado real)

Railway sirve `master` con Node 22 y despliega en cada push. El bloqueante histórico de `POST /api/bookings` —500
por variables de Supabase ausentes— **está resuelto** y su rastro queda en `PROGRESS.md`; el health responde 503 con
`checks.supabase: false` si alguna vez volviera a faltar configuración, para que se vea sin probar una reserva.

Un build roto se ve antes de llegar aquí: `.github/workflows/ci.yml` ejecuta `npm ci` + typecheck + tests + build en
cada push, sin secretos.

### ✅ Paso 10 — Preparación deploy Railway

- `engines.node >=22.0.0` y npm 10 (la misma pareja que Railway), scripts build/start (`next start` respeta `PORT` nativo), `sharp` instalado para next/image.
- `GET /api/health` → 200 `{status:"ok"}` sin BD (healthcheck Railway).
- ⚠️ rate-limit en memoria válido solo con 1 réplica (multi-réplica → Redis/Upstash).
- Build + start local verificado con `PORT=4000` (/en, /es, /api/health, /robots.txt = 200).
- Repo GitHub privado `jcv911/varadero-taxi` pusheado (todos los commits). Commit `ac6c308`.

### ✅ Paso 11 — Deploy en Railway y verificaciones finales
- [x] Despliegue Railway disponible y comprobado (200 en `/es`, `/en`, `/api/health`).
- [x] Variables de entorno en Railway: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOW_INDEXING=false`, `NODE_VERSION=22` (PORT lo inyecta Railway). `TELEGRAM_*` queda vacía por decisión del negocio.
- [x] Revisión desplegada visible: `version.commit` y cabecera `X-Deployed-Commit` en `/api/health`.
- [x] `checks.migration003` en el health: avisa si la base va por detrás del código (sin cambiar el código HTTP).
- [x] Migración 003 aplicada en Supabase; idempotencia y colisiones de `ref` probadas contra la base real.
- [x] Prueba de estrés local contra Supabase real (`scripts/stress.cjs`), con limpieza verificada (0 filas).
- [x] `site.url` resuelto por entorno: el canonical de producción ya apunta al host que sirve la web.
- [ ] Health check path → `/api/health` (por confirmar en el panel de Railway; no es alcanzable desde esta máquina).
- [ ] Dominio propio — **pospuesto por decisión del negocio (2026-09-25)**.
- [x] e2e atados al CI (2026-10-01): `playwright@1.63.0` fijado en `package.json`, scripts `e2e:api` / `e2e:browser` / `e2e:cleanup` (más `e2e`) y job `e2e` que levanta el servidor en el 4000, espera `/api/health`, corre las dos suites y limpia siempre, aunque fallen.
- [ ] Secretos `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en GitHub Actions: sin ellos el job `e2e` se omite (a propósito) y las suites no corren solas.
- [ ] (Opcional) `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` en Railway: el postinstall de Playwright baja tres navegadores que el despliegue no usa; sin la variable solo se pierde tiempo de build.
- [ ] El botón «Mes siguiente» del calendario debería deshabilitarse cuando el mes siguiente queda fuera de `maxAdvanceDays`, en vez de no hacer nada en silencio.
- [ ] Lighthouse: medido (2026-09-26) con las mejoras de accesibilidad y de CLS ya aplicadas (2026-10-01); quedan las menores (zod en el bundle del cliente y `sizes`/`fetchPriority` del hero).
- [x] Páginas legales provisionales `/terminos` y `/cancelacion` (2026-11-05): texto ES/EN provisional, footer + sitemap; commit `8f8d178`.
- [x] Sección de testimonios en la home (2026-11-05): contenido de ejemplo con nota visible de provisionalidad; sustituir por reseñas verificadas cuando el negocio las entregue; commit `8f8d178`.
- [x] FAQ reforzada (2026-11-05): retraso de vuelo y espera del conductor declara en el texto visible lo que queda por confirmar (sin prometer "60 min gratis"); commit `8f8d178`.
- [ ] Confirmar TODO-CONFIRMAR del negocio (lista en `PROGRESS.md`); las FAQ y las páginas legales ya anuncian lo pendiente o su texto visible para no prometer de más.

## Decisiones clave
- Moneda USD, precios desde `lib/routes.ts` (server recalcula con `computePrice`).
- Sin fallback offline localStorage; error → botón WhatsApp.
- RLS sin políticas anon (solo service_role inserta).
- rate-limit serverless en memoria = por instancia (para >1 réplica: Upstash/Redis).
- Todos los textos en dictos next-intl; TODO-CONFIRMAR marcado en código/config y listado en PROGRESS.md.
- AGENTS.md define las reglas para agentes de IA, incluido el entorno Windows.
- Deploy: Railway como servidor Node (`next start`, respeta PORT). Claves nunca en repo ni en pantalla.
- Build con `npm run build` (el envoltorio npm local funciona con normalidad; la recomendación antigua de invocar `node_modules/.bin/next.cmd` era de una sesión con el wrapper interferido).

## Comandos
`npm run dev` · `npm run build` · `npm start` con `PORT` · `npm run typecheck` (tsc --noEmit) · `npm test` (dominio + API, sin red ni base de datos).
Instalaciones **con npm 10**: `npx npm@10 ci` y `npx npm@10 install <paquete>`. El `.npmrc` activa `engine-strict`,
así que otro npm se niega de entrada en vez de podar el lockfile (ver README y `PROGRESS.md`).

## Editado por Codex — 2026-09-21

- [x] Retirar temporalmente «Otro destino» de la selección de trayecto hasta confirmar sus precios.
- [x] Exigir una ruta del catálogo tanto para continuar en modo Trayecto como en la validación compartida con la API; Horas sigue sin exigir ruta.
- [x] Actualizar los textos ES/EN de «Cómo funciona» para describir únicamente las rutas disponibles.
- [x] Conservar precios, datos comerciales, campos históricos y esquema de base de datos.
- [x] Identificar los cambios de Codex en los documentos existentes, conservando el historial de OpenCode.
- [x] Verificar tipos y compilación; cinco casos de esquema; navegador ES/EN a 320/375/1366 px, flujo Trayecto hasta Contacto y avance por Horas, sin enviar reservas.
- [x] Commit, push y comprobación de Railway: commit `0b6c229` pusheado a `origin/master`; Railway comprobado por OpenCode (`/es`, `/en`, `/api/health` → 200).

Alcance de reversión: selector de rutas, condición de Continuar, validación de ruta, textos ES/EN y esta documentación; no requiere revertir datos ni migraciones.

## Editado por Codex — 2026-09-21 · segunda ampliación

El usuario autoriza los demás ajustes propuestos, corregir el calendario y realizar una reserva de prueba para documentar el flujo completo. Se mantienen las tarifas y datos comerciales existentes; Otro destino continúa retirado.

Cerrado el 2026-09-21 y verificado después (detalle en `PROGRESS.md`):
- [x] Precio de la ruta en cada vehículo, sin cambiar tarifas.
- [x] Capacidad de pasajeros y maletas validada en interfaz **y** en servidor.
- [x] Calendario, resumen y fecha enviada unificados en hora de Cuba (`lib/bookingDate.ts`); límites de mes y DST comprobados.
- [x] Acceso móvil a total/Continuar y nombres de vehículos traducidos.
- [x] "Solicitud recibida, pendiente de confirmación" coherente con la base de datos.
- [x] Pruebas locales y reservas de prueba identificadas (PRUEBA CODEX / NO PRESTAR SERVICIO) en Railway, borradas después: 0 filas en `bookings`.
- [x] Resultados registrados, commit/push y producción verificada.

## Verificación final OpenCode — 2026-09-21 · trabajo de Codex revisado y cerrado

- [x] Corrección de calendario: `lib/bookingDate.ts` (hora de Cuba única), `getDefaultDate`, `DateTimePicker`, `schemas` y `bookingStore` en una sola referencia de zona.
- [x] Pruebas: `scripts/test-booking.cjs` PASS · `npm run typecheck` PASS · `next build` OK.
- [x] Etiquetas direccionales en selectores de ruta (cambio aprobado): "Hacia Varadero" → "Desde {zona}", "Desde Varadero" → "Hacia {zona}".
- [x] Commit + push a `origin/master`.
- [x] Verificado en Railway después (pasos manuales del usuario): las reservas de prueba se crearon y se borraron, y producción se comprueba hoy con `/api/health`.
