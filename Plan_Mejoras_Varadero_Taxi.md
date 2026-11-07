# 🚖 Plan de Mejoras — Varadero Taxi
**Sitio:** https://varadero-taxi-production.up.railway.app/es
**Actualizado:** Noviembre 2026
**Objetivo:** subir conversiones, confianza y funcionalidad sin duplicar trabajo ya hecho.

> ⚠️ **Esta versión sustituye al plan original de Noviembre 2026.** Aquel diagnóstico describía una versión
> antigua del sitio (HTML estático, sin formulario funcional, FAQ sin respuestas) y marcaba como pendiente
> trabajo que ya está en producción. La web real es Next.js 15 con API propia, base de datos y reservas de
> principio a fin funcionando. El estado técnico detallado vive en `task_plan.md` (plan) y `PROGRESS.md`
> (evidencia); este documento solo prioriza lo que queda.

---

## 🔍 Estado real del proyecto (lo ya hecho)

Stack: **Next.js 15 (App Router) + TypeScript + Tailwind v4 + next-intl (es/en) + Zustand + Supabase**, desplegado en Railway como servidor Node (`next start`, Node 22, deploy en cada push). CI en GitHub Actions (`npm ci` → typecheck → tests → build) + E2E Playwright.

| Funcionalidad | Estado |
|---|---|
| Formulario de reserva E2E (ruta → fecha/hora → vehículo → resumen → contacto) | ✅ Hecho y en producción |
| API `POST /api/bookings` (zod, precio calculado solo en servidor, rate-limit, ref única `VT-`, honeypot, consentimiento, idempotencia migración 003) | ✅ Hecho |
| Base de datos Supabase (`bookings`, RLS sin políticas `anon`, solo el servidor escribe con `service_role`) | ✅ Hecho |
| Fallback de reserva y soporte por WhatsApp (`+5358117692`, número real) | ✅ Hecho |
| FAQ con respuestas visibles en acordeón (4 preguntas, ES/EN) | ✅ Hecho (2 respuestas provisionales, ver abajo) |
| Flota (4 clases) con precios por ruta y vehículo | ✅ Hecho (precios marcados provisionales por el negocio) |
| SEO base: metadata por idioma, Open Graph, Twitter, canonical + hreflang, sitemap.xml, robots.txt, JSON-LD `TaxiService`, favicon | ✅ Hecho |
| Página `/privacidad` (ES) | ✅ Hecho **provisional** (el propio texto lo declara) |
| Notificaciones Telegram | ✅ Código listo, **desactivado por decisión del negocio** (se compensa con el panel del gestor) |
| Salud de producción: `/api/health` con checks de Supabase, migración 003 y commit desplegado | ✅ Hecho |
| Rendimiento y accesibilidad: Lighthouse medido (2026-09-26), CLS y mejoras de accesibilidad aplicadas (2026-10-01) | ✅ Mayoría hecha |

Además, las «Opciones» de implementación del plan original ya se resolvieron solas: la **Opción B** (backend +
base de datos) es la que vive en producción; la Opción A (estático puro) quedó atrás y la Opción C (plataforma
de reservas externa) se descartó con la evolución del proyecto.

---

## ⚠️ Lo verdaderamente pendiente (priorizado)

### 🔴 CRÍTICO — bloquea captar o gestionar reservas

#### 1. Cerrar las confirmaciones comerciales pendientes (`TODO-CONFIRMAR`)
Nada de contenido nuevo (salida pública, textos de garantía, JSON-LD completo) debería publicarse antes de
cerrar esto. Lista viva en `PROGRESS.md § TODO-CONFIRMAR`:
- [ ] **Política de espera del conductor** (la respuesta FAQ q4 es un placeholder: "coordinamos el tiempo de espera").
- [ ] **Política de cancelación** (necesaria para la página legal y la FAQ).
- [ ] **Texto final de la política de privacidad** (la actual se declara provisional).
- [ ] **Dirección postal / datos fiscales del titular** (los pide el JSON-LD `TaxiService`).
- [ ] **Nombres reales de los vehículos y fotos reales** (hoy las imágenes son referenciales).
- [ ] Redes sociales del negocio (para footer / perfil de marca).
- ✅ Ya confirmados: teléfono/WhatsApp real (2026-09-25), precios vigentes (2026-09-25, siguen provisionales hasta el próximo ajuste del negocio), chofer profesional como garantía (2026-09-25).

#### 2. Panel del gestor de reservas
**Urgente porque nadie ve las reservas** hasta que exista: Telegram está desactivado por decisión del negocio,
así que hoy una reserva guardada solo se puede ver entrando a Supabase. Es el punto 1 de los «Paneles
planificados» en `task_plan.md`: lista de reservas, detalle, cambio de estado y datos de contacto. El código ya
marca el camino: `bookings` tiene `status` (default `pendiente`) y `ref` único; la lectura es server-side con
`service_role` (RLS sin políticas para `anon`, nunca desde el navegador).

#### 3. Contacto ampliado
El footer solo expone WhatsApp + enlace a privacidad. Pendiente:
- Email de soporte en el footer y (si el negocio lo confirma) en una página de contacto.
- Decidir si se ofrece un formulario de contacto aparte o basta con el de reserva, para no duplicar canales.
- CTA flotante de WhatsApp en escritorio (en móvil ya existe `StickyMobileCTA`, que se oculta sobre el widget de reserva).

#### 4. Indexado y dominio propios
Hoy el sitio está **deliberadamente fuera de buscadores** (`ALLOW_INDEXING=false`, robots `Disallow: /`). La
salida pública requiere decisión del negocio y una línea de configuración:
- [ ] Confirmar la decisión de indexar → `ALLOW_INDEXING=true` en Railway (el código ya lo lee, sin cambios de código).
- [ ] Dominio propio (pospuesto por decisión del negocio el 2026-09-25) → `NEXT_PUBLIC_SITE_URL` para fijar
  canonical, hreflang, Open Graph y sitemap. Mientras tanto el canonical apunta al host de Railway que sí sirve la web.

### 🟡 ALTA — confianza y información comercial

#### 5. Páginas legales restantes
Existe solo `/privacidad`. Falta:
- `/terminos` (términos y condiciones).
- `/cancelacion` (o sección dentro de términos), tras confirmar la política en el punto 1.
- Reescribir `/privacidad` con el texto final — imprescindible antes de indexar: el consentimiento del formulario ya enlaza a ella.
- Servir también la versión EN (los diccionarios next-intl ya montan la estructura para privacidad).

#### 6. Prueba social (testimonios)
No hay reseñas ni testimonios en el proyecto. Punto legítimo del plan original que sigue abierto:
- Sección en la home con 4–6 testimonios provisionales marcados como tales hasta tener reseñas verificadas
  (Google Maps/TripAdvisor si existen).
- La puntuación media (⭐) solo se muestra cuando exista y esté verificada.

#### 7. Fotos y nombres reales de la flota
Las 4 fotos en `public/fleet/` funcionan, pero el negocio marcó «nombres y fotos reales de los vehículos» como
pendiente de entrega.

### 🟢 MEDIA — SEO y experiencia

#### 8. SEO restante (detrás del punto 4)
- El básico ya está hecho (metadata, sitemap, robots, Open Graph, JSON-LD `TaxiService`).
- Añadir JSON-LD `FAQPage` cuando las respuestas de la FAQ sean definitivas.
- OG image dedicada (hoy reutiliza `public/fleet/sedan-blanco.jpg` a 1200×1200).
- Revisión de estructura de headings y URLs legales antes de indexar.

#### 9. Rendimiento restante
Ya medido y mejorado; quedan dos optimizaciones menores conocidas:
- Zod en el bundle del cliente (evaluar extracción del esquema compartido).
- `sizes` y `fetchPriority` optimizados para la imagen del hero.
- Meta continua: Lighthouse >90 en las cuatro categorías.

#### 10. Tareas operativas menores
- [ ] Healthcheck path `/api/health` por confirmar en el panel de Railway.
- [ ] Secretos `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en GitHub Actions: sin ellos el job `e2e` del CI se omite (a propósito).
- [ ] (Opcional) `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` en Railway para no bajar navegadores en el build.
- [ ] Botón «Mes siguiente» del calendario deshabilitado cuando el mes queda fuera de `maxAdvanceDays`.

---

## 📋 Lista priorizada (reemplaza la tabla del plan original)

| # | Mejora | Prioridad | Estado real |
|---|--------|-----------|-------------|
| 1 | Cerrar `TODO-CONFIRMAR` del negocio (espera, cancelación, privacidad final, fiscal, fotos/vehículos) | 🔴 Crítica | ⬜ Pendiente |
| 2 | Panel del gestor de reservas | 🔴 Crítica | ⬜ Pendiente (plan en `task_plan.md`) |
| 3 | Contacto ampliado (email, CTA WhatsApp escritorio, contacto) | 🔴 Crítica | ⬜ Pendiente |
| 4 | Indexado (`ALLOW_INDEXING=true` si el negocio lo aprueba) + dominio propio | 🔴 Crítica | ⬜ Pendiente (decisión del negocio) |
| 5 | Páginas legales: `/terminos`, cancelación, privacidad final | 🟡 Alta | ⬜ Pendiente (privacidad provisional ya existe) |
| 6 | Testimonios / prueba social | 🟡 Alta | ⬜ Pendiente |
| 7 | Fotos y nombres reales de la flota | 🟡 Alta | ⬜ Pendiente |
| 8 | SEO restante (FAQPage, OG dedicada, revisión pre-indexado) | 🟢 Media | ⬜ Pendiente tras el #4 |
| 9 | Rendimiento (zod en cliente, hero) | 🟢 Media | 🟨 Parcialmente hecho |
| 10 | Tareas operativas del CI/despliegue | 🟢 Media | ⬜ Pendiente |

Marcado por el plan original como pendiente pero **ya hecho**:
- ✅ Formulario de reserva funcional → en producción, con API y base de datos.
- ✅ FAQ con respuestas → acordeón con 4 preguntas y respuestas visible.
- ✅ SEO base → metadata, sitemap, robots, Open Graph, JSON-LD, canonical/hreflang.
- ✅ «Opción B» de implementación → ya es la arquitectura real (Next.js API + Supabase + Railway).

---

## 🛠️ Criterios de implementación (invariantes a respetar)

- **El precio se calcula siempre en el servidor** (`computePrice`); el navegador nunca lo manda.
- **`bookings.date` es texto `YYYY-MM-DD` en hora de Cuba** (`lib/bookingDate.ts`): se compara texto, no fechas SQL.
- **Solo el servidor escribe en `bookings`** con `service_role` (RLS sin políticas `anon`).
- **Todo texto va en los diccionarios ES/EN** de `lib/i18n/`; nada cableado en el markup.
- **Datos comerciales sin confirmar** se marcan `TODO-CONFIRMAR` en código/dictos y se listan en `PROGRESS.md`; nunca se publican.
- No hace falta tocar el hosting: Railway ya despliega el servidor Node en cada push a `master`.

---

## 📝 Secuencia sugerida

- **Semana 1:** pedir al negocio la lista del punto 1 y arrancar el panel del gestor (punto 2) con los textos provisionales existentes.
- **Semana 2:** cerrar el panel del gestor; completar contacto (punto 3) con email provisional; con la política confirmada, escribir `/terminos`, `/cancelacion` y la privacidad final (punto 5).
- **Semana 3:** testimonios y fotos reales cuando el negocio los entregue (puntos 6–7); cerrar SEO restante y OG dedicada (punto 8).
- **Semana 4:** decisión de indexado + dominio con el negocio (punto 4); Lighthouse final + E2E completo; tareas operativas del punto 10.

## 📊 KPIs (se miden cuando el sitio salga a buscadores)

1. Tasa de conversión: % de visitantes que envían una reserva (objetivo >3%).
2. Reservas completadas por semana.
3. Lighthouse sostenido >90 (repasar tras cada tanda de mejoras).
4. Tiempo en página y tasa de rebote, con el contenido nuevo (FAQ fuerte, testimonios, legales).
5. Reservas que siguen `pendiente` tras 24 h en el panel del gestor (proxy de la capacidad de respuesta del negocio).

---

*Documento corregido sobre el código fuente real del repositorio (Noviembre 2026). El plan técnico detallado de
paneles, migraciones y despliegue sigue en `task_plan.md`; la evidencia de cada sesión, en `PROGRESS.md`.*
