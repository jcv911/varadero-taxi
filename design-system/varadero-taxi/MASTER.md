# Design System Master — Varadero Taxi

> **LOGIC:** Para una página, primero leer `design-system/pages/[page].md` (si existe, overrides este Master). Si no, seguir este Master.

**Proyecto:** Varadero Taxi · Lujo
**Rebuild:** 2026-09-20 (corregido: paleta cliente + error/success + USD)
**Estilo:** Dark warm + glassmorphism + gold hairline
**Moneda:** USD (pago efectivo al llegar; pasarela futura)

---

## Color (fijos del cliente — NO inventar)

| Token | Hex | Tailwind `@theme` | Uso |
|---|---|---|---|
| `--color-deep` | `#0B0E12` | `bg-deep` | fondo base |
| `--color-base` | `#131920` | `bg-base` | secciones alternas |
| `--color-elevated` | `#1C242D` | `bg-elevated` | cards / inputs |
| `--color-gold` | `#E8A94B` | `bg-gold text-gold` | CTA, acentos |
| `--color-gold-hover` | `#F6C66B` | `bg-gold-hover` | hover gold |
| `--color-gold-pressed` | `#B97A1E` | `bg-gold-pressed` | active |
| `--color-teal` | `#22B8CF` | `bg-teal text-teal` | secundario / activo |
| `--color-cream` | `#F5F1EA` | `text-cream` | texto principal |
| `--color-muted` | `#A9B1BA` | `text-muted` | texto secundario (contraste ≥7:1 ✓) |
| `--color-error` | `#E5484D` | `bg-error text-error` | errores (APROBADO del cliente) |
| `--color-success` | `#3E8E5A` | `bg-success text-success` | éxito (APROBADO del cliente) |
| `--color-glass` | `rgba(28,36,45,0.55)` | `bg-glass` | superficie glass |
| `--color-gold-line` | `rgba(232,169,75,0.18)` | `border-gold-line` | hairline dorado |
| `--color-gold-line-strong` | `rgba(232,169,75,0.45)` | `border-gold-line-strong` | hairline hover |

**Precios:** siempre en USD, con `tabular-nums` (sin CLS al animar). Nunca mostrar otro símbolo.

## Tipografía

- **Display:** Playfair Display (títulos, h1–h3, serif lujo)
- **Body:** Inter (texto, formularios, precios `tabular-nums`)
- Cargados con `next/font` (`font-display: swap`), vars `--font-playfair` / `--font-inter`.

## Motion (tokens unificados)

- `--ease-lux: cubic-bezier(0.16, 1, 0.3, 1)` — expo-out para todo
- Micro 150–300ms · reveal 350ms · compleja ≤400ms
- Exit más corto que enter (~60–70%)
- `prefers-reduced-motion: reduce` → desactivar animaciones
- Animación solo transform/opacity (jamás width/height/top/left)

## Glassmorphism

- `backdrop-blur` 16px · superficie `rgba(28,36,45,0.55)` · borde 1px gold `0.18` (hover `0.45`)
- Cards radius 16px · botones 12px

## Focus & a11y CRÍTICO (siempre)

- Focus ring visible: 2px `--color-gold`, offset 2px
- Contraste texto ≥4.5:1 · touch ≥44px · spacing ≥8px
- Labels visibles en inputs (nunca placeholder-only) · errores inline bajo campo
- Icons SVG (Lucide), stroke 1.5px consistente — nada de emojis
- Navegación: header glass al scroll >80px · StickyMobileCTA en móvil

## Pre-Delivery Checklist (home)

- [ ] Precios USD + tabular-nums, fuente única `lib/routes.ts` (server recalcula, nunca confiar cliente)
- [ ] `next/image` priority en hero (9:16 → recorte desktop con `object-position`), CLS <0.1
- [ ] Ref reserva `VT-` + deep-link `?vehicle=` `?to=`
- [ ] Fecha default: mañana + antelación mínima configurable
- [ ] API: zod + honeypot/rate-limit + Supabase RLS (solo insert) + notif. operador
- [ ] POST falla → mensaje error + botón "Reservar por WhatsApp" (sin fallback offline localStorage)
- [ ] Consentimiento datos + link privacidad