# Findings — Varadero Taxi

Investigación, descubrimientos técnicos y errores. Última entrada: 2026-09-26 (Buffy). Las entradas anteriores se conservan como historial de OpenCode y Codex. Lo que ya no aplica se marca como resuelto en vez de dejarlo como pendiente.

## Errores encontrados

| Error | Intentos | Solución |
|---|---|---|
| npm install timeout 120s (red) | 2 | Timeout >240s + reintento |
| @next/swc-win32 warning: 193 | 1 | No bloquea build, ignorar |
| Zod `z.input` deduce tipos parciales | 1 | `BookingState` explícito |
| `useBookingStore.persist.rehydrate` undefined en SSR | 1 | mount guard (`useState` + `useEffect`) + `onFinishHydration` |
| framer-motion `HTMLMotionProps` choca con React `onDrag` types | 1 | Props tipados manualmente en GoldButton |
| zod path type `PropertyKey[]` vs `string[]` | 1 | `PropertyKey[]` en fieldError |
| `object-[...]` dinámico no compila con Tailwind JIT | 1 | `style={{ objectPosition }}` |
| `// TODO-CONFIRMAR` dentro de JSON rompe parse | 1 | Solo comentarios en TS/config, nunca en `.json` |
| ContactSheet recortado: `backdrop-filter` en ancestro crea containing block para `fixed` + `overflow-hidden` | 1 | `createPortal` a `document.body`, `z-[80]` |
| edit accidental borró `minDate` en schemas | 1 | releído y restaurado |
| `handleCloseSheet` usado antes de declararse (TS2448) | 1 | mover `useCallback` antes del effect |
| `npm run build`/`npx next build` devuelven "clean — nothing to commit" (wrapper npm/npx interferido) | 2 | Invocar `node_modules/.bin/next.cmd build` directamente |
| `supabase db remote exec` no existe como subcomando CLI | 1 | Verificar RLS vía REST API (PostgREST) con curl |
| `$env:SUPABASE_DB_PASSWORD` ausente al arrancar deploy | 1 | Detenerse y pedirla; luego configurar y continuar |
| error TS1128 `</content>` basura al final de SiteHeader tras reescritura | 1 | revisar final de archivo y eliminar |
| Desbordamiento horizontal móvil: grid del hero sin `grid-cols-1` | 1 | columna implícita `auto` crece al max-content y el `overflow-hidden` de la sección la recorta sin scroll → `grid-cols-1` + `min-w-0` en columnas + `text-wrap: balance` |
| Menú hamburguesa colapsado a 60px al abrirse | 1 | `backdrop-filter` del header (glass al `menuOpen`) crea containing block → el overlay `fixed inset-0` se ancla al header. Fix: `createPortal(document.body)` + guard `mounted` para SSR |
| Tarjetas de carrusel descentradas con `%` de padding/ancho | 1 | padding % y width % reaccionan contra el content-box (feedback) → usar `w-[72vw]` + `px-[calc(14vw-16px)]` (unidades vw absolutas) para centrado exacto |
| Flecha scroll hero sobre el precio | 1 | `absolute bottom-20` caía sobre el summary bar → moverla a flow bajo el widget (`mt-10`, `sm:hidden`) |
| Paso 2 saltaba al paso 3 al elegir hora | 1 | `setStep(3)` dentro del click de hora → quitar auto-avance; selección visible (dorado) + botón Continuar |
| Continuar deshabilitado con "Otro destino" | 1 | `disabled={!routeId && trip}` bloqueaba rutas custom (routeId null) en cualquier paso → exigir solo en paso 1 (`!routeId && !customDestination`) |
| Horas del paso 2 ocultas en móvil (rail horizontal) | 1 | el `overflow-x-auto` enseñaba ~4 y el resto se deslizaba fuera de vista → `grid grid-cols-4 sm:flex sm:flex-col` muestra las 8 |
| ServiceModeToggle confuso en pasos 2-5 | 1 | el toggle cambiaba de modo pero el paso 2 (calendario) es igual en ambos modos → solo mostrarlo en paso 1 donde tiene función (RoutePicker vs HoursPicker) |
| "Salto al paso 1" al dar Continuar en móvil | 1 | la barra fija móvil "Reservar ahora" (`fixed bottom-0 z-40`) se superpone al "Continuar" del widget y al tocarla llama `scrollToBooking()` (scroll de vuelta al widget). Fix: `IntersectionObserver` en `#widget` — ocultar la CTA mientras el widget está en vista |
| `Get-Process node | Stop-Process` mata procesos ajenos | 1 | mataba el router del usuario (Node). Ahora: guardar PID al arrancar el dev server y matar SOLO ese PID |
| Verificación build colgada tras imprimir 200 | 2 | `Start-Process` con stdout/stderr redirigidos pero SIN stdin deja al hijo (next dev, no termina) sujetando el handle de consola del padre → el pipe del runner no cierra. Fix (scripts/check-server.ps1): `-RedirectStandardInput` a archivo vacío único `[IO.Path]::GetTempFileName()` (la cadena `\\.\NUL` es rechazada por Start-Process; mejor "NUL" literal o archivo). Además: detecta "ya corriendo" y mata por PUERTO (`Get-NetTCPConnection`), no por PID del wrapper cmd |

## Descubrimientos

- **`backdrop-filter` ≠ none crea containing block para descendientes fixed** (spec css-filter-effects-2). Cualquier overlay `fixed` dentro de un card glass se recorta → portal.
- **Deep-links `?vehicle=` `?to=`** deben aplicarse tras `persist.onFinishHydration` (el merge de rehidratación pisa la preselección). Patrón `setPendingDeepLink/consumePendingDeepLink`.
- **StickyMobileCTA** necesita padding inferior en el wrapper (`pb-16 sm:pb-0`) para no tapar contenido.
- **Modelo de rutas refactorizado a zonas**: `ZoneId` (varadero, varadero-center, vra-airport, havana, matanzas, cardenas) + `kind` (`transfer|airport|excursion`) + `internal` + `match[]` para deep-links. Labels en dicts `zones.*`.
- **Sentido del trayecto**: `direction: from|to` (Varadero base). Rutas internas ocultan segmentado y exigen recogida + destino. `journeyLabel()` es la fuente de resúmenes.
- **JSON-LD**: `openingHoursSpecification` con "Mo-Su" inválido en schema.org → se omitió (y los campos `address`/`openingHours` de `lib/config.ts` se retiraron por no leerlos nadie). Queda **pendiente** corregir el `openGraph`: declara 1200×1200 para una imagen real de 720×1280, y así se está sirviendo.
- **sharp** viene como dependencia de `next` (dentro de su árbol, `sharp@0.35.4`); no requiere instalación separada para `next/image` en `next start`.
- **`next start` respeta `PORT` nativamente** (bind 0.0.0.0). Railway lo inyecta; en local se prueba con `PORT=4000`.
- **RLS verificado funcionalmente vía REST**: anon SELECT → 200 `[]`, anon INSERT → Unauthorized, service_role SELECT 200 / INSERT 201 / DELETE 200. Patrón reutilizable sin `supabase db exec`.
- **`gh` y el scope `workflow`** (lo de "no reconocido en PATH" era de una sesión anterior y ya no aplica: está en el PATH). Lo que sí sigue vigente: git usa el helper `manager`, cuya credencial guardada no tiene el permiso `workflow`, así que GitHub rechaza cualquier push que toque `.github/workflows/`. Se empuja con la credencial de `gh` solo para ese comando (`git -c credential.helper='!gh auth git-credential' push`) o se arregla de raíz con `gh auth setup-git`.
- **Trust points del hero**: «chofer profesional» era TODO-CONFIRMAR; **confirmado por el negocio el 2026-09-25**. Los otros dos (precio fijo en USD, pago en efectivo al llegar) siempre fueron afirmaciones reales.
- **Overflow móvil recortado sin scroll**: `overflow-hidden` en una sección recorta contenido desbordado → `scrollWidth === clientWidth` puede ser verde con elementos visiblemente cortados. La verificación válida combina ambos: (1) scrollWidth===clientWidth y (2) snippet de rects cruzando bordes, excluyendo el carrusel (`#fleet`) que desborda por diseño con scroll interno.
- **Playwright headless**: no requería Chrome de sistema; `npm i --no-save playwright` + `npx playwright install chromium` descarga su propio headless-shell. Útil para verificación responsive sin navegador de sistema — pero, al instalarse con `--no-save`, `scripts/verify-*.cjs` y `e2e-browser.mjs` **no corren en un clon limpio**: playwright no está en `package.json`.
- **Lighthouse sí se mide sin Chrome de sistema** (2026-09-26): basta `CHROME_PATH` apuntando al Chromium de Playwright —`%LOCALAPPDATA%\ms-playwright\chromium-1243\chrome-win64\chrome.exe`, ojo, `chrome-win64`, no `chrome-win`—. Dos detalles del entorno: `chrome-launcher` deja un `EPERM` al borrar su carpeta temporal en Windows y el CLI muere **después** de escribir el informe (el JSON es válido), y `lighthouse` se instala con `--no-save` sin tocar el lockfile. No hace falta Chrome de sistema en ningún caso.
- **Antes de creerle a Lighthouse las "oportunidades" de imagen, mirar el DPR de su emulación**: con `deviceScaleFactor: 1.75`, `image-delivery-insight` compara el archivo con el tamaño mostrado a DPR 1 y reporta 235 KiB de ahorro que en un móvil real no existen (la variante servida era la correcta y ya en WebP). El control es aritmético y barato: ancho del hueco × DPR frente a la variante que el navegador pidió de verdad.
- **Grid de columna única implícita = trampa**: sin `grid-cols-1`, un `grid {...} lg:grid-cols-[...]` en móvil crea una columna `auto` que se expande a max-content (texto de una línea completa) y desborda el contenedor.
- **iOS safe-area**: `env(safe-area-inset-bottom)` requiere `viewport-fit=cover` en el meta viewport (Next: `export const viewport: Viewport = { viewportFit: "cover" }`) para que tenga efecto.
- **backdrop-filter = containing block (otra vez)**: no solo afecta a overlays dentro de GlassCards; un header que se vuelve glass al abrir un menú rompe CUALLIER overlay `fixed` hijo. Regla: cualquier `fixed` dentro de un ancestro con `backdrop-filter` debe ir a `createPortal(document.body)`.
- **createPortal + SSR**: `createPortal(x, document.body)` se evalúa en render (incl. pre-render) → extent crash `document is not defined`. Necesita guard `mounted` (useState+useEffect) antes de portalear.
- **Carousel snap-center**: para centrar la primera tarjeta, NO mezcles `%` de padding con `%` de ancho (ambos resuelven contra el content-box → nunca encajan). Unidades vw absolutas (`w-[72vw]` + `px-[calc(14vw-16px)]`) dan centrado exacto; `sm:` breakpoint para volver a `snap-start` en desktop.
- **Auto-scroll tras seleccionar vehículo**: `scrollIntoView({block:"center"})` evita que la barra quede oculta tras el `StickyMobileCTA` (un `block:"nearest"/"end"` alinearía al fondo del viewport donde está la barra fija).
- **`getDefaultDate()` usa `toISOString()` (UTC)**: la fecha puede desplazarse ±1 día por zona horaria si se formatea con `new Date(date)`. Para mostrar fechas localizadas usar parse manual `[y,m,d] = date.split("-")` → `new Date(y, m-1, d)`. (Se aplica en BookingReview; el resto del flujo usa `toKey()` con fecha local y es consistente.)
- **Pasos 1-5**: `BookingStep` ampliado en `schemas.ts`; al añadir un paso hay que revisar TODAS las comparaciones de `step === 4`/`step < 4` (widget, summary, sheet). El sheet/contacto ahora es el paso 5.

- **`PGRST204` y `42703` son dos códigos distintos para lo mismo**: al insertar en una columna inexistente, PostgREST responde `PGRST204` ("Could not find the 'x' column … in the schema cache") y Postgres responde `42703` (`undefined_column`). Cualquier código que añada una columna debe aceptar los DOS si quiere poder desplegarse antes de aplicar la migración.
- **Un índice único parcial (`where col is not null`) es la forma limpia de añadir idempotencia** sobre una tabla con filas históricas sin clave: las filas antiguas (NULL) no chocan entre sí y los envíos sin clave se comportan exactamente como antes.
- **Clasificar el error de unicidad por texto es frágil pero necesario**: PostgREST solo informa del nombre del constraint (`bookings_ref_key`) o del detalle (`Key (ref)=(VT-1234) already exists.`). Confundir la colisión de `ref` con la de la clave de idempotencia convertiría un reintento inofensivo en una reserva duplicada o en un 500. Extracto en `lib/supabase/errors.ts`, cubierto por `scripts/test-booking.cjs`.
- **Un `SELECT` de comprobación + `INSERT` no es una reserva de nombre**: entre ambos hay una ventana de carrera. El patrón correcto es insertar y tratar el `23505` como "vuelve a dibujar", apoyándose en el índice único.
- **Pacing mal medido = falsos 429**: en `scripts/e2e-api.mjs`, guardar en `lastHit` la marca temporal tomada ANTES del `sleep` hacía que la llamada siguiente calculase una espera de ~0 y disparase de inmediato: las peticiones salían en parejas (16 s + 0 s) justo en el borde del límite de 5/min y el limitador convertía casos de validación válidos en 429 intermitentes. El promedio (16 s) parece correcto, y por eso el fallo es fácil de pasar por alto: lo que importa es la separación mínima, no la media. Corregido guardando la marca después del `sleep` (27 OK / 0 FAIL).
- **La idempotencia se comprueba de verdad con dos envíos idénticos y un `count`**: no basta con que el segundo devuelva 200; hay que verificar que en la tabla hay UNA fila con esa clave (caso A6 de `e2e-api.mjs` y caso 3 de `test-bookings-api.cjs`).

- **`head: true` DESACTIVA la validación de esquema en PostgREST**: comprobado contra el proyecto real, `select("col", { head: true })` sobre una **tabla inexistente** responde `204 No Content` **sin error**, y sobre una **columna inexistente** responde `400` con `{"message":""}` (sin `code` y sin mensaje). O sea: una sonda de esquema con `head` da luz verde a una base sin migrar, y ningún clasificador puede leer el error. La forma correcta es una consulta normal (`select("col").limit(1)`), que se trae como mucho una fila de una columna y sí valida contra la caché de esquema.
- **Códigos reales de PostgREST en este proyecto** (observados, no deducidos): columna inexistente en `SELECT` → `42703` `column bookings.x does not exist`; columna inexistente en `INSERT` → `PGRST204` `Could not find the 'x' column of 'bookings' in the schema cache`; tabla inexistente → `PGRST205` `Could not find the table 'public.x' in the schema cache`. Son los tres códigos de los que dependen la degradación del POST y la sonda de esquema del health.
- **Se puede sondear un camino de error en producción sin efectos**: un `INSERT` con una columna desconocida **y** un campo `NOT NULL` omitido no puede escribir ninguna fila, sea cual sea la validación que corra primero; aun así revela qué error llega (fue `PGRST204`). Útil para comprobar supuestos contra la base real sin ensuciarla.
- **Un healthcheck no debe llevar sonda sin límite de tiempo**: si Supabase no responde, la instancia se queda "no sana" a ojos del orquestador y el despliegue no promociona. La sonda se rinde a los 3 s y se declara "no se sabe".

## Pendiente / barreras

Nada de la web está bloqueado: producción sirve `master` y `/api/health` informa del commit desplegado. Lo abierto:

- **Paneles del gestor y administrativo**: sin empezar. El plan y su orden están en `task_plan.md` § Paneles
  planificados.
- **Dominio propio**: pospuesto por decisión del negocio; mientras tanto `site.url` se resuelve por entorno, así que
  canonical, hreflang y Open Graph ya apuntan al host que sirve la web.
- **Lighthouse**: **medido el 2026-09-26** (local 84/95/100/61 · producción 83/95/100/69, móvil emulado; resultados,
  falsos positivos descartados y mejoras concretas en `PROGRESS.md` § Lighthouse). Las dos mejoras de accesibilidad y
  el CLS de 0,44 están aplicados y medidos el 2026-10-01 (§ Accesibilidad y CLS): accesibilidad 100 sin auditorías
  fallidas y CLS 0,001. Quedan las mejoras menores (zod en el bundle del cliente, `sizes`/`fetchPriority` del hero).
- **e2e**: los tres scripts quedaron atados el 2026-10-01 (`playwright@1.63.0` fijado en `package.json`, scripts
  `e2e:api` / `e2e:browser` / `e2e:cleanup` y un job `e2e` que levanta el servidor, corre las suites y limpia
  siempre). Falta poner los secretos `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en GitHub: sin ellos el job se
  omite con un aviso en vez de ponerse rojo.
- **Un script versionado con la ruta absoluta de una máquina no corre en ningún otro sitio, y además esconde que
  está roto**: `e2e-browser.mjs` llevaba de fábrica un `C:\Users\jonny\...\chrome.exe` y dentro un
  `ctx.setViewportSize()` —que es de la página, no del contexto— que lo reventaba en el primer escenario. Como el
  CI no lo llamaba, nadie lo notó. Ahora usa el chromium de Playwright y la ruta propia solo si se pide con
  `E2E_CHROME_PATH`.
- **`hasText` con expresión regular no sirve para texto concatenado**: `filter({ hasText: /\bVan\b/ })` devolvía 0
  porque el `textContent` de las tarjetas se pega sin separadores ("Grupos VIPVan14 pax10 maletasTotal$165") y ahí
  no hay límites de palabra. Por nombre accesible (`getByRole("button", { name: /Van/ })`) sí funciona; con texto
  plano hay que recordar además que "Van" casa también con "Minivan".
- **Una suite que golpea su propia app choca con sus propios límites**: el endpoint de reservas permite 5 envíos por
  minuto, así que el sexto escenario de la suite de navegador recibía un 429 y fallaba por el límite, no por el
  formulario. Ahora espera 16 s entre envíos, igual que la suite de API.
- **Las comprobaciones sobre fechas caducan**: «el calendario avanza un mes» falla el día 1 si la ventana de reserva
  es de 30 días, porque el mes siguiente no tiene días reservables y el botón no avanza (a propósito). Hay que medir
  la regla —avanza si el mes siguiente entra en la ventana— y no un resultado concreto que depende de qué día sea.
- **Playwright baja tres navegadores en su postinstall** aunque solo se use chromium: en el CI conviene
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` para el `npm ci` e instalar después `npx playwright install --with-deps
  chromium`; en Railway esa variable solo ahorra tiempo de build.
- **Un layout shift sin fuentes atribuibles es una pista, no un misterio**: Lighthouse 13 puede reportar un CLS alto
  con `sources: []`. La traza sí lo trae (`--save-assets` escribe `*.trace.json`): el evento `LayoutShift` lleva
  `impacted_nodes` y, mejor aún, una sonda propia con `PerformanceObserver` da los nodos con nombre y clase. Así se
  supo que el CLS de 0,44 venía de las dos manchas doradas del hero —posicionadas con `top-1/4`/`bottom-1/4`, o sea
  en función de la altura del hero— y del enlace «Descubre más», todos movidos porque el widget de reserva no existía
  en el HTML y aparecía tras la hidratación. Moraleja: el CSS en porcentaje dentro de un contenedor que crece tarde
  multiplica el daño de cualquier montaje diferido.
- **Datos del negocio**: faltan la dirección postal exacta, los datos fiscales, la política de espera/cancelación y
  las fotos y nombres reales de los vehículos. La lista viva está en `PROGRESS.md` § TODO-CONFIRMAR. La FAQ
  (a3/a4), `/terminos`, `/cancelacion` y los testimonios ya declaran esa provisionalidad en el texto visible:
  al confirmar los datos, basta sustituir los renglones de `lib/i18n/*.json` y quitar las notas de provisionalidad.
- **Aviso local**: Next infiere el workspace root por lockfiles sueltos en el Escritorio; se silencia con
  `outputFileTracingRoot` y no afecta al build ni al despliegue.

## Editado por Codex — 2026-09-21

- «Otro destino» podía avanzar sin `routeId`, pero `computePrice` devuelve 0 para un trayecto sin ruta. La validación de reservas tampoco exigía una ruta del catálogo.
- Decisión del usuario: retirar temporalmente esa opción hasta confirmar precios, sin modificar los datos comerciales.
- Se elimina su entrada del selector y su promesa en «Cómo funciona» ES/EN. Continuar exige una ruta en modo Trayecto y el esquema compartido rechaza trayectos sin ruta. El modo Horas sigue admitiendo `routeId: null`.
- Se mantienen los campos `customDestination`/`custom_destination` para compatibilidad con registros históricos; no hay migraciones ni cambios de tarifas.
- La entrada histórica «Continuar deshabilitado con Otro destino» describe el comportamiento anterior y queda sustituida por esta decisión.
- Verificación: build con tipos OK; cinco casos de esquema OK (catálogo aceptado, ruta nula/custom/desconocida rechazadas, Horas sin ruta aceptado). Navegación local ES/EN, móvil 320/375 px y escritorio 1366 px; ruta hasta Contacto sin enviar, Horas avanza. Sin desbordamiento horizontal en vistas medidas ni errores de consola. RDD: disabled/unmanaged.

## Editado por Codex — 2026-09-21 · diagnóstico de calendario

- Reproducción en Railway antes del ajuste: seleccionar explícitamente 25 de septiembre y avanzar al paso 4 muestra correctamente 25 sept 2026. No se reprodujo una alteración general de cualquier día pulsado.
- Fallo confirmado en la fecha automática: con reloj 2026-09-21T01:30:00Z (20 de septiembre, 21:30 en Cuba), el cálculo anterior `setDate(+1)` seguido de `toISOString()` produce 22 de septiembre, aunque mañana en Cuba es 21.
- El servidor interpretaba fecha/hora usando su zona local, que puede ser distinta de Cuba. La corrección y sus pruebas deben compartir una referencia explícita al horario del servicio.
- Reserva real de prueba autorizada por el usuario; se usará identificación de prueba y no se enviará WhatsApp manualmente. **Ejecutada y cerrada**: ver § Verificación final OpenCode.

## Verificación final OpenCode — 2026-09-21 · revisión del calendario

- Referencia única de zona para todo el booking: `lib/bookingDate.ts` usa `Intl.DateTimeFormat("...", { timeZone: "America/Havana" })`. Fechas calendario = `YYYY-MM-DD` en UTC puro (no instantes); el `date` que se envía nunca se corre por la zona del servidor/cliente.
- DST comprobado: 2026-09-25 10:00 Cuba → 14:00Z (UTC-4, verano); 2026-01-25 10:00 → 15:00Z (UTC-5, invierno). Hora saltada por transición → `bookingInstant` devuelve `null`.
- Decisión del usuario sobre selectores de ruta: distinguir sentido con prefijos "Desde/Hacia {zona}" según la dirección elegida; se mantienen intactos rutas, tarifas y nombres comerciales.
- Verificado test + typecheck + build antes del commit final (detalle anterior: lockfile extra `C:\Users\jonny\Desktop\package-lock.json` hace que Next avise de workspace root inferido; el build es correcto de todos modos).

## Prueba de estrés — 2026-09-25 (Buffy)

Medido contra el servidor local y la base real (`scripts/stress.cjs`), con las filas de prueba borradas después:
0 filas PRUEBA restantes. Nada de esto se midió contra producción.

1. **El rate limiter se esquiva rotando `x-forwarded-for`.** Se agota exactamente en la 6ª llamada desde una IP
   declarada, pero 25 peticiones con 25 valores distintos dieron 0 rechazos. La clave es el primer valor de la
   cabecera, y ese valor lo pone el cliente. Si un proxy añade la IP real *después* de la del cliente, el límite
   no protege de nadie que se moleste en rotarla. (Falta confirmar cómo lo hace Railway desde su red.)
2. **`ref` de 4 dígitos: la tasa de colisión crece con la tabla.** En 5×150 reservas simultáneas hubo 31
   colisiones, todas resueltas en el primer reintento (0 fallos, 750 filas, 750 refs únicas). El modelo
   `C(n,2)/9000 + n·(filas usadas)/9000` predice 31,2: cuadra, así que los sorteos son uniformes y la tasa es
   ≈ N/9000 por reserva. Con la tabla vacía no importa; con miles de filas, sí. Ampliar el espacio es barato.
3. **La idempotencia aguanta la concurrencia real.** 10 envíos simultáneos con la misma clave → una sola fila en
   Postgres, una sola ref y 9 respuestas `duplicate: true`. No es solo el test con cliente simulado.
4. **La memoria bajo carga no es una fuga** (detalle en PROGRESS.md): +345 MB durante 19 183 peticiones, pero el
   mismo volumen contra `/es` —que no toca el Map— subió más, y en reposo el proceso devolvió 510 → 155 MB. Es
   el heap de V8, no el `Map`. El defecto del Map sigue siendo real (no borra nunca entradas; su clave es
   falsificable), pero su coste es ~200 B por IP *única*: goteo lento, no bomba.
5. **Antes de atribuir un efecto a un componente, medirlo sin ese componente.** Culpé al Map de los +345 MB de
   mi primera lectura y el control lo desmintió. El test con stubs no podía decirlo: los stubs confirman que el
   código hace lo que crees; solo una medición independiente dice si lo que crees es verdad.
6. **`process.exit()` con sockets keep-alive en Windows** dispara un assert de libuv (`UV_HANDLE_CLOSING`) y
   corrompe el código de salida: una corrida con 0 fallos devolvió 127. Afecta a cualquier script del repo que
   termine así; el arnés ya lo evita (fija `process.exitCode` y deja drenar los handles).
7. **Throughput de reservas:** ~150/s en caliente (p50 ~650 ms por reserva) y, en frío, la primera ronda de 150
   concurrentes: p50 3,9 s. No es un problema de la app, pero conviene saberlo si algún día entra una campaña.
8. **Limpiar solo por `ref` deja huérfanos.** Si una prueba crea una fila y su respuesta se pierde, la `ref` nunca
   llega al archivo de referencias y la limpieza por referencia no la ve. `cleanup-e2e.mjs` borra también por el
   marcador de nombre (`PRUEBA - NO PRESTAR SERVICIO`), que es lo que permite verificar 0 filas al terminar.
