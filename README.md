# Varadero Taxi

Web de reserva de traslados privados de lujo en Varadero, Cuba. Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + next-intl (es/en) + Zustand + framer-motion + Supabase. Desplegada en **Railway** (`next start` sobre `master`, automático en cada push).

## Puesta en marcha

Requisitos: **Node.js 22 con npm 10**, la misma versión que usa Railway. El `package-lock.json` está generado con npm 10 (ver `packageManager` en `package.json`) y `.npmrc` activa `engine-strict`, así que **un npm más nuevo se niega a instalar en este proyecto** en vez de escribir un lock que el CI tumbará después. No es un capricho: un npm más nuevo poda la entrada anidada que `next-intl` necesita y `npm ci` falla con `Missing: @swc/helpers` (verificado).

```bash
npx npm@10 ci                            # instalar
npx npm@10 install <paquete>             # añadir una dependencia
npx npm@10 install --package-lock-only   # regenerar el lock sin tocar node_modules
```

Si tu npm ya es el 10, lo de siempre:

```bash
npm install
npm run dev
```

Los scripts (`npm run typecheck`, `npm test`, `npm run build`) funcionan con cualquier npm: el guardarraíl solo interviene en las instalaciones.

Abre http://localhost:3000. El idioma por defecto es `en` (`/es` para español).

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

| Variable | Uso |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave `service_role` (solo servidor, nunca con prefijo `NEXT_PUBLIC_`) |
| `TELEGRAM_BOT_TOKEN` | Token del bot para notificar reservas (opcional) |
| `TELEGRAM_CHAT_ID` | Chat destino del operador (opcional) |
| `ALLOW_INDEXING` | `true` para indexar en buscadores. Por defecto la web queda `noindex,nofollow` con `robots.txt` en `Disallow: /` y sitemap vacío |
| `NEXT_PUBLIC_SITE_URL` | Origen público del sitio (`https://…`, sin barra final) para canonical, hreflang, Open Graph, JSON-LD y sitemap. Si queda vacía se usa `RAILWAY_PUBLIC_DOMAIN` y, en último caso, el dominio de producción conocido |

Variables sin valor (vacías) desactivan la funcionalidad asociada (p. ej. sin token de Telegram no se envían notificaciones).

## Base de datos

Aplica las migraciones de `supabase/migrations/` en orden (`supabase db push`, o pegando cada `.sql` en el SQL Editor). La tabla `bookings` tiene RLS activado sin políticas para `anon`: solo el servidor escribe con la `service_role`.

`003_booking_idempotency.sql` añade `bookings.idempotency_key` (índice único parcial) para que reintentar un envío no duplique la reserva. La API funciona con o sin esa migración aplicada, así que puede aplicarse en cualquier momento.

## Scripts

```bash
npm run dev        # dev server
npm run build      # build de producción
npm run start      # servidor de producción
npm run typecheck  # tsc --noEmit
npm test           # pruebas de dominio y de la API (sin red ni base de datos)
```

`.github/workflows/ci.yml` ejecuta `npm ci`, `npm run typecheck`, `npm test` y `npm run build` en cada push, para que un build roto se vea ahí y no en el despliegue. No necesita ningún secreto: el build solo lee variables opcionales (`ALLOW_INDEXING`, `NEXT_PUBLIC_SITE_URL`, `RAILWAY_PUBLIC_DOMAIN`) y las de Supabase se usan en runtime dentro de las rutas, nunca al compilar. Usa `npm ci` a propósito, para que falle si `package-lock.json` y `package.json` se desincronizan en vez de "arreglarlos" en silencio.

## Editar contenido

- **Rutas y precios**: `lib/routes.ts` (+ `lib/vehicles.ts` para las 4 clases).
- **Textos**: `lib/i18n/en.json` y `lib/i18n/es.json`.
- **Tokens de diseño**: `MASTER.md` en `design-system/varadero-taxi/` y `app/globals.css`.
- **Datos de contacto/sitio**: `lib/config.ts`.
- **Número de WhatsApp**: `lib/config.ts` → `booking.whatsappNumber`.

## Despliegue

**Railway** sirve la rama `master` como servidor Node (`next start`, respeta `PORT`) y despliega en cada push. No hay
otra plataforma configurada: el script `start` de `package.json` es lo que corre en producción.

1. Servicio desde el repositorio, con la orden de arranque en `npm start`.
2. Variables de entorno: las mismas del `.env.local` (incluida `ALLOW_INDEXING`; ponla en `true` solo cuando quieras salir al público).
3. Healthcheck: `/api/health`.
4. `NEXT_PUBLIC_SITE_URL` con el dominio definitivo cuando exista; mientras tanto se resuelve por entorno (ver arriba).

Antes de llegar ahí, cada push pasa por `.github/workflows/ci.yml` (`npm ci` → typecheck → tests → build). Tras el
deploy verifica: `/api/health` (200 y el `version.commit` desplegado), `/sitemap.xml`, `/robots.txt`, favicon y las
cabeceras de seguridad (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`).

### Saber qué revisión está en producción

`GET /api/health` incluye `version` (`commit`, `commitShort`, `branch`, `environment`, `source`) y la cabecera `X-Deployed-Commit`, leídos en runtime de las variables que inyecta el host: `RAILWAY_GIT_COMMIT_SHA` / `RAILWAY_GIT_BRANCH` en Railway, `VERCEL_GIT_COMMIT_SHA` en Vercel, o `GIT_COMMIT` / `GIT_BRANCH` en cualquier otro. Sin ninguna de ellas responde `source: "unknown"` en vez de inventar una versión.

La respuesta va con `Cache-Control: no-store`: una respuesta cacheada informaría del despliegue anterior, que es justo la pregunta que el endpoint resuelve. Sirve para confirmar que un push ya está vivo, porque los despliegues son asíncronos y la compilación previa sigue sirviendo hasta que la nueva está sana.

### Saber si la base va al día con el código

`checks.migration003` y `warnings` avisan cuando el esquema de la base va por detrás: si falta `bookings.idempotency_key` (migración 003 sin aplicar) o si ni siquiera existe la tabla. Es un desajuste distinto del de las variables: estas pueden estar bien y faltar la migración.

Ese desajuste **no** cambia el código HTTP, a propósito. Las reservas siguen funcionando sin idempotencia, y un 503 haría que el healthcheck de Railway no promoviese el despliegue que precisamente degrada con gracia: convertiría "funciona sin idempotencia" en "no despliega". `checks.migration003` vale `true` (presente), `false` (falta) o `null` (no se pudo comprobar). La sonda solo lee, se rinde a los 3 s y nunca puede tumbar el healthcheck.

## Notas

- Marca todo lo que falta confirmar del negocio con `TODO-CONFIRMAR` en el código y en `PROGRESS.md`.
- Documentación del proyecto: el plan y lo que queda, `task_plan.md`; el registro de sesiones con su evidencia,
  `PROGRESS.md`; la investigación y los errores encontrados, `findings.md`.