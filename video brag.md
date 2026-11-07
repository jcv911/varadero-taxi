# Video Brag — Memoria de instrucciones

> Cómo convertir el proyecto actual en un video promo corto con el skill **`/brag`** + **Hyperframes**.
> Caso real documentado: **Varadero Taxi** (video vertical WhatsApp, 23 s, sin voz).
> Fecha: 2026-09-24 · Output: `brag-output-2026-09-24-152451/`

---

## 1. Qué es este flujo

`/brag` lee el código del proyecto actual (sin URL ni screenshots), planea un concepto, arma un storyboard, delega la composición a Hyperframes, valida, renderiza y escribe copy para compartir.

- **Ángulo creativo**: el producto haciend **su trabajo** (widget real, fotos reales, copy verbatim), no describirlo.
- **Duración**: 15–25 s. **Formato por defecto**: landscape; acepta `vertical` / `square`.
- **Ley 1**: el video debe leerse sin sonido → todo claim importante está escrito en pantalla, en los idiomas del producto.
- **Ley 2**: sin lenguaje SaaS genérico ("streamline", "seamless"). Copy verbatim del proyecto.
- **Ley 3**: el hook (primeros 2–3 s) define todo. Patrón: Hook → Reveal → 2-3 highlights → Punchline/outro.

---

## 2. Entorno y herramientas (el que funcionó)

| Herramienta | Versión / nota |
|---|---|
| Skill `/brag` | `C:\Users\jonny\.config\opencode\skills\brag\` (SKILL.md + references + assets + scripts) |
| Hyperframes CLI | `0.8.73` vía `npx --no-install hyperframes` (proyecto con pin: `package.json` → `hyperframes@0.8.73`) |
| Python | `C:\Users\jonny\AppData\Local\Programs\Python\Python312\python.exe` (3.12) · numpy 2.5.1 · PIL |
| ffmpeg / ffprobe | `8.1.2` (Gyan, vía WinGet, está en PATH) |
| uv | disponible — para `analyze_music_cues.py` si se necesita |
| Modelo | IMPORTANTE: `/brag` hace dispatch según el modelo. En Opus 5.5 usa `/brag-slim` a menos que pidas `--full`. Este caso corrió con modelo "nuevo" (9router/nuevo) → flujo completo `/brag`. Si un futuro agente responde con `/brag-slim`, pedir "usar el full brag" para recuperar este flujo. |

**Skills Hyperframes instalados** (en `~\.claude\skills\` y `~\.agents\skills\`):
`hyperframes-core`, `hyperframes-animation`, `hyperframes-audio`, `hyperframes-cli`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-registry`, `hyperframes-studio`, `media-use`.

**Nota**: `/brag` es su propio workflow — **no** entrar en la entrevista de intención de `/hyperframes` ni en su workflow genérico de promo/launch.

---

## 3. Flujo completo (pasos + gates + comandos)

### Paso 0 — Invocación y output
```
/brag [--tone <preset|dirección creativa>] [--format vertical|landscape|square] [--duration s] [--no-music] [--no-sfx] [--title "..."] [--voice]
```
- Output: `brag-output/` o con timestamp `brag-output-YYYY-MM-DD-HHmmss/` si ya existe uno.
- Tones: `default`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `cinematic`, `app-store`. La dirección creativa libre refina el preset.

### Paso 1 — Inspect (leer `references/step-1-inspect.md`)
Escaneo del proyecto: gate es responder el rubric de 9 preguntas (qué es, angle, UI real a recrear, claims, copy, datos, restricciones).

### Paso 2 — Plan (leer `references/step-2-plan.md`)
Escribir `<output-dir>/brag-plan.md`: rubrica + angle + storyboard beat-by-beat + guía de cues musicales.
**Gate**: existe `brag-plan.md` completo; escenas suman 15–25 s.

### Paso 3 — Handoff a Hyperframes (leer `references/step-3-compose.md` y `references/audio.md`)
1. Escribir `<output-dir>/composition-brief.md` (objetivo, source material, copy verbatim, prohibiciones, identidad visual, storyboard, audio, instrucciones).
2. Copiar audio a assets:
   ```bash
   mkdir -p <output-dir>/composition/assets/music
   mkdir -p <output-dir>/composition/assets/sfx/interface
   cp <skill-dir>/assets/music/<track>.mp3  <output-dir>/composition/assets/music/
   # sfx elegidos: cp <skill-dir>/assets/sfx/<categoría>/<archivo>.ogg <output-dir>/composition/assets/sfx/<categoría>/
   ```
   Rutas en HTML **relativas a `composition/`** (nunca absolutas: fallan en render).
3. Inicializar composición:
   ```bash
   cd <output-dir>/composition
   npx hyperframes init --example blank --resolution portrait --non-interactive --skill brag
   ```
4. Autorar `index.html` (toda la pieza), copiar imágenes del proyecto a `composition/assets/`.
5. Audioreactividad (si hay música y tratamiento ≠ none): extraer datos por frame con el helper del skill `hyperframes-creative` → `assets/audio-data/<track>-<dur>s.js` con `window.__AUDIO_DATA` (en este caso 690 frames @30fps, 23 s). Vincular al menos un elemento visual (p. ej. glow de fondo respira con la banda bass) vía vars CSS `--ab`/`--arms`.
6. Beat sync: fuente de cues = preset del track (`assets/music/cues/*.music-cues.json`), o `analyze_music_cues.py` vía uv, o `npx hyperframes beats <composition>`.
   - `strongCues` → 1-3 momentos fuertes dentro de ±0.15s, marcado `// beat-locked: 8.74s`.
   - `beats` → eventos secuenciales en la parrilla dentro de ±0.10s, marcado `// beat-grid: ...`.
   - Leer textos: si los beats quedan <0.6s, snap a cada 2 beats; la legibilidad manda, ignorar cues que la dañen.
7. **Gate**: `npx hyperframes check` con **0 errores** (lint, runtime, layout, motion, contrast WCAG). Es la única puerta antes de render.

### Paso 4 — Validar, renderizar, entregar (leer `references/step-4-deliver.md`)
```bash
cd <output-dir>/composition
npx hyperframes snapshot --at 2.6,5.6,8.9,...   # PNG keyframes para gut-check visual
npx hyperframes preview                          # URL localhost para que el usuario apruebe
npx hyperframes render --quality draft --output ../brag.mp4   # iteración rápida
npx hyperframes render --quality high --output ../brag.mp4    # final (11.2 MB / 23 s en ~46 s)
```
- **Poster frame**: extraer en un beat asentado el momento más fuerte (hook o logo): `ffmpeg -ss <t>\ -i ../brag.mp4 -frames:v 1 -q:v 2 ../brag.jpg`.
  (En el caso real se copió `snapshots/frame-02-at-21.2s.png` → `poster.png`. `brag.jpg` = convención del skill.)
- **Bake frame 0** (thumbnails idle en todas las plataformas):
  ```bash
  cd <output-dir>
  ffmpeg -y -i brag.mp4 -i brag.jpg -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]" \
    -map "[v]" -map 0:a? -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart \
    brag.poster.mp4 && mv brag.poster.mp4 brag.mp4
  ```
- Escribir `<output-dir>/share-copy.txt` (1–3 frases, postable tal cual, tone-matched; variantes opcionales en `share-copy-variants.md`).
- **Gate final**: `brag.mp4` existe + poster elegido y bakeado en frame 0 + share copy escrito.

Estructura final de `<output-dir>/`:
```
brag.mp4 · brag.jpg · brag-plan.md · composition-brief.md · share-copy.txt · composition/
```

---

## 4. Prompts de instrucción reutilizables

### 4.1 Prompt de arranque de `/brag` (el que funcionó en este caso)
```
/brag --tone "elegante y premium, servicio de taxi de lujo para turistas en Varadero"
```
seguido del refinamiento del cliente:
```
/brag --tone "elegante, premium y directo"
```
(tone presets mapeados: `polished`).

### 4.2 Plantilla genérica para cualquier proyecto futuro (pegar al agente)
```
Haz un /brag del proyecto actual.

Requisitos:
- Formato: --format vertical (1080x1920, 9:16) — para WhatsApp. (cambiarlo si el canal es otro)
- Duración: 15-25s, escenas que sumen exacto.
- SIN voz en off ni narración. El video debe entenderse MUTEADO: cada claim clave está escrito en pantalla.
- Idioma: mostrar el copy verbatim del proyecto (incluye el equivalente en los idiomas de la app).
- --tone "<dirección creativa del cliente>".
- Escenas obligatorias:
  1. Hook (2-3s): el gifle visual más fuerte del producto + titular real.
  2. Reveal del producto trabajando: UI/widget REAL recreado con datos REALES del código.
  3. 2-3 highlights: características/fotos reales del proyecto.
  4. Outro: nombre/marca + CTA real + condiciones honestas.
- PROHIBIDO en pantalla: features que la app no tiene, datos personales, teléfonos/dominios placeholder (marca TODO-CONFIRMAR en el código), claims genéricos.
- Audio: música del skill /brag acorde al tone + 2-5 SFX suaves; audioreactividad sutil (glow), beat-lock 1-3 momentos fuertes a strongCues y secuencias a beats.
- Antes de render: npx hyperframes check en verde (0 errores). Ver clases: hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes, hyperframes-cli. /brag es su propio workflow.
- Al final: render high, poster frame en el momento más fuerte asentado, share copy, y dame la ruta final + copy ES/EN.
```

### 4.3 Prompt de iteración (nuevo render con ajustes)
```
Usa el contexto del video de Varadero Taxi (output brag-output-2026-09-24-152451/).
Cambio: <quí la petición, p. ej. "otra pista de música", "versión más corta 15s",
 "escena de idioma rebalanceada", "nuevo poster en el hook" >.
Aplica en composition/index.html, corre npx hyperframes check (0 errores),
re-snapshot de las escenas tocadas, y re-render high a ../brag.mp4.
```

---

## 5. Caso aplicado: Varadero Taxi (config exacta reutilizable)

### 5.1 Identidad visual (desde `design-system/varadero-taxi/MASTER.md` → `composition/frame.md`)
- Fondos: deep `#0B0E12`, base `#131920`, elevated `#1C242D`
- Acento: gold `#E8A94B` (hover `#F6C66B`, pressed `#B97A1E`) · teal `#22B8CF` · success `#3E8E5A`
- Texto: cream `#F5F1EA` · muted `#A9B1BA`
- Glass card: `rgba(28,36,45,0.55)` · hairline gold `rgba(232,169,75,0.18)` / fuerte `0.45`
- Display: **Playfair Display** (400/700 — nunca 500/600, sintetizan mal) · Body: **Inter** (400/700)
- Precios: `font-variant-numeric: tabular-nums` en oro siempre
- Ease proyecto: `cubic-bezier(0.16,1,0.3,1)` (expo-out), entradas 0.3–0.6 s
- Body mínimo 28px; etiqueta corta ≥0.8 s asentada; frase ~0.3 s/palabra
- Decorativos por escena: glow radial dorado + ring + movimiento ambiental lento (nunca estático); sin gradients lineales a pantalla llena (banding H.264)

### 5.2 Copy verbatim (fuente: `lib/i18n/es.json` / `en.json`)
- kicker: "Traslados privados en Varadero" / "Private transfers in Varadero"
- hero.title: "Varadero en lujo, de puerta a puerta" / "Varadero in luxury, door to door"
- hero.subtitle: "Reserva tu traslado privado en segundos." / "Book your private transfer in seconds."
- trust: "Precio fijo en USD" · "Pago en efectivo al llegar"
- booking: "Reserva tu traslado" · "Elige tu ruta" · toggle "Desde Varadero" / "Hacia Varadero" · "Tu reserva" · "Continuar" · "Total"
- fleet: "Nuestra flota" · "Elige la comodidad que se ajusta a tu viaje."
- outro: "Varadero Taxi" · "Traslados de lujo en Varadero" · CTA "Reservar ahora"
- vehículos: Sedán / SUV / Minivan / Van

### 5.3 Datos reales permitidos (fuente: `lib/routes.ts`, `lib/vehicles.ts`)
- Ruta Aeropuerto VRA: 25 min · desde $30 · Ruta Centro de Varadero: 15 min · desde $15
- Flota (desde `getMinRoutePrice`): Sedán 3 pax · 2 maletas desde $15 · SUV 4/3 $20 · Minivan 6/5 $25 · Van 14/10 $35
- Resumen real: "Varadero → Aeropuerto Juan Gualberto Gómez (VRA) · Sedán" · "Total $30"

### 5.4 Prohibido en pantalla (marcas TODO-CONFIRMAR en código)
Pago online · reservas fuera de Varadero · "chofer profesional" · teléfono `+5355555555` · dominio `varadero-taxi.vercel.app`. Archivos a NO leer como fuentes de copy definitiva si tienen TODO: `lib/config.ts`, `HeroBanner.tsx`.

### 5.5 Escenas del video (23 s, 1080×1920)
| Escena | Ventana | Contenido |
|---|---|---|
| 1 Hook | 0–4.1 | Foto real sedán oscurecida (gradiente del hero) + kicker + titular Playfair + subtítulo + 2 chips de confianza |
| 2 Widget | 3.6–10.1 | Glass card del BookingWidget: pasos 1–4 (1 activo), toggle "Desde Varadero", 2 chips de ruta (VRA $30 / Centro $15), barra "Total $30 · Continuar" asentando en 8.74 s, 2 badges |
| 3 Flota | 9.6–15.1 | "Nuestra flota" + 2×2 grid fotos reales (400px) Sedán/SUV/Minivan/Van · foto "Imagen referencial" |
| 4 Idioma | 14.6–19.5 | Cabecera con pastilla ES/EN; titular cruza ES⇄EN (flips 15.84 y 17.47); chips bilingües cambian con las flips; regla dorada + nota |
| 5 Outro | 19.0–23.0 | Filete dorado + "Varadero Taxi" (logo, asienta en strong cue 19.66) + "Traslados de lujo en Varadero" + botón "Reservar ahora" + condiciones + "Español / English" |

### 5.6 Audio del caso
- Música: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM, "steady and clean", recomendada para `polished`). `data-volume="0.35"`, `data-fade-out="1.2"`. Nunca > 0.5 de cama.
- Cue preset: `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`
- **strongCues usados** (beat-locked): 8.74 s (total widget), 17.47 s (2º flip idioma), 19.66 s (logotipo).
- **Beat grid para secuencias**: 4.39 (toggle) · 4.91 / 6.00 (chips ruta, cada 2 beats) · 10.37 / 11.46 / 12.55 / 13.64 (flota, cada 2 beats por lectura) · 15.84 (1er flip idioma).
- **SFX elegidos (polished = 2-5 suaves, low HF-risk según `assets/sfx/sfx-analysis.md`)**: `interface/click_003` (toggle @4.39) · `interface/drop_001` (chip1 @4.91, total @8.74) · `interface/drop_002` (flota @10.37 y @13.64) · `interface/switch_007` (flips @15.84 y @17.47) · `interface/bong_001` (logo @19.66). Volumen 0.55–0.7; cada `<audio>` con `data-duration` = longitud real del clip.
- Audioreactividad: extraída en `assets/audio-data/music-vol12-23s.js` (`window.__AUDIO_DATA`, 690 frames); la línea/glow dorada y la glass card respiran con bands[0] (bass), scale/glow 3-6 %.

---

## 6. Detalles técnicos del composition (lecciones reales)

- **Estructura**: un `index.html` con `<section id="s1..s5" class="clip" data-start data-duration data-track-index>` (ventanas solapadas 0.5 s de crossfade: 0→4.1, 3.6→10.1, 9.6→15.1, 14.6→19.5, 19.0→23.0). Root `<div class="composition" data-duration="23">`. Timeline `main` registrado en `window.__timelines` (paused) con `window.__timelines["<id>"]`; los child timelines agregados al root no van paused.
- **Curriculum lint encontrado y resuelto**:
  - No animar transform en elementos `.glow` con GSAP: la reactividad usa CSS `transform: scale(calc(...))` con vars `--ab`/`--arms` → conflicto. Cambiar el tween a otra propiedad o dejar el CSS.
  - Textos EN en `#s4` comienzan `tl.set(opacity:0)` para no verse antes del flip.
  - Corregir line-height (1.36–1.4) en textos largos con bold para evitar overlap de tinta; marcar `data-layout-allow-overlap` solo en overlaps intencionales (headline ES/EN stack).
  - Duplicados de media: si se reutiliza la misma imagen, copiar como archivo con otro nombre (`hero-sedan.jpg`).
  - `data-duration` de SFX = longitud real del clip (0.05–0.62 s aquí).
- **Check**: `npx hyperframes check --json` → parsear el JSON de salida (los logs npm van a stderr; usar `2>$null` en PowerShell). Estructura: `ok` + `lint/runtime/layout/motion/contrast` con `errorCount`/`warningCount`/`findings`. 0 errores = verde (warnings no bloquean; aquí 6 warnings de composición grande + 2 content_overlap de headline intencional).
- **Revisión visual**: `npx hyperframes snapshot --at <times>` → PNGs; revisar con visión. Para confirmar balance vertical de forma determinista, calcular geometría desde el CSS (todo position absolute) o medir la banda de contenido con numpy (cuidado: glows cubren todo el frame, el test de píxeles solo sirve en escenas limpias). Márgenes objetivo: 220–320 px abajo.
- **Render**: `npx hyperframes render --quality high --output ../brag.mp4`. Verificar con `ffprobe` → h264 1080×1920 23.0 s + aac 23.0 s.

---

## 7. Checklist antes de entregar un video brag

- [ ] `npx hyperframes check` con 0 errores dentro de `composition/`
- [ ] Duración total 15–25 s exacta según el brief
- [ ] Al menos una escena muestra UI/foto/copy REAL del proyecto
- [ ] Todo el texto legible (check de contraste WCAG pasado) + leíble sin sonido
- [ ] Al menos 1 momento beat-locked (`// beat-locked`) y secuencias en `// beat-grid` (±0.15/±0.10 s)
- [ ] Audioreactividad presente (o fallo documentado)
- [ ] Música en `assets/music/`, SFX en `assets/sfx/` con `data-duration` correctos
- [ ] Sin datos prohibidos/placeholder en pantalla (TODO-CONFIRMAR)
- [ ] Snapshot visual de cada escena revisado (OCL: sin bandas muertas grandes, sin overlaps)
- [ ] Render high → `brag.mp4`; `ffprobe` ok
- [ ] Poster frame = momento más fuerte asentado, bakeado como frame 0 (brag.jpg)
- [ ] `share-copy.txt` escrito (1-3 frases, idiomas del cliente)

---

## 8. Rutas de referencia

- Skill `/brag`: `C:\Users\jonny\.config\opencode\skills\brag\` → `SKILL.md`, `references/step-1-inspect.md`, `step-2-plan.md`, `step-3-compose.md`, `step-4-deliver.md`, `audio.md`, `tones.md`, `assets/music/cues/*.json`, `assets/sfx/sfx-analysis.md`, `scripts/analyze_music_cues.py`
- Output del caso real: `C:\Users\jonny\Desktop\varadero-taxi nuevo\brag-output-2026-09-24-152451\`
  - `brag-plan.md` (contrato creativo + storyboard con timings finales)
  - `composition-brief.md` (brief de handoff completo)
  - `composition/index.html` (composición final, 1170 líneas)
  - `composition/frame.md` (spec de diseño → tokens del MASTER del proyecto)
  - `composition/snapshots/` (keyframes) · `composition/verify/` (frames del MP4)
  - `brag.mp4` (11.2 MB) · `poster.png`
- Proyecto: `lib/` (i18n, routes, vehicles, config, journey, bookingStore), `components/` (BookingWidget, RoutePicker, FleetCarousel, SiteHeader, LanguageSwitcher, CTAZone), `design-system/varadero-taxi/MASTER.md`