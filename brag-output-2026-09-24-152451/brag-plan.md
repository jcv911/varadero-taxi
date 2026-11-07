# Brag Plan: Varadero Taxi

## What is this app?
Web de reserva de traslados privados de lujo en Varadero (Next.js + Tailwind + next-intl es/en): eliges ruta con precio fijo en USD, eliges clase de vehículo, envías la solicitud y pagas en efectivo al llegar.

## The angle
Pieza de marca premium para mandar por WhatsApp a la empresa: 23 s en vertical, sin sonido y sin voz en off. Todo se lee en pantalla. El video *muestra el producto haciendo su trabajo* — el widget de reserva con precios reales, la flota real con fotos del propio proyecto, y el conmutador ES/EN real de la cabecera — en vez de describirlo. Lujo quieto: tipografía serif, mucho negro, dorado solo donde importa.

## Hook (first 2-3 seconds)
Foto real del sedán del proyecto (`/fleet/sedan-blanco.jpg`) oscurecida con el gradiente del propio hero. Entra el kicker dorado "TRASLADOS PRIVADOS EN VARADERO" y slam del titular real en Playfair: **"Varadero en lujo, de puerta a puerta"**. Se gana la escena con la promesa + la prueba visual del coche.

## Key moments (the middle)
- **Widget de reserva real**: barra de pasos 1 Ruta · 2 Fecha · 3 Vehículo · 4 Resumen, toggle "Desde Varadero", y los chips de ruta entrando uno a uno con precio real: Aeropuerto (VRA) 25 min · desde $30 y Centro de Varadero 15 min · desde $15. Cierra con la barra de resumen "Total $30 · Pagas en efectivo al llegar".
- **Flota real**: 4 tarjetas con las fotos del proyecto entrando en secuencia — Sedán 3 pax · 2 maletas, SUV 4 · 3, Minivan 6 · 5, Van 14 · 10.
- **Cambio de idioma**: la pastilla ES/EN de la cabecera gira y el titular cambia "Varadero en lujo, de puerta a puerta" ⇄ "Varadero in luxury, door to door".

## Outro / punchline
Fondo deep, filete dorado, "Varadero Taxi" en Playfair a tamaño logotipo y el botón dorado real **"Reservar ahora"**, con dos líneas de cierre honestas: "Precio fijo en USD" y "Pago en efectivo al llegar".

## User flow worth showing
El flujo real de la app: elegir ruta con precio fijo → elegir clase de vehículo → enviar solicitud y pagar en efectivo al llegar. Se muestra comprimido: escena 2 = paso 1 (ruta + total + efectivo), escena 3 = paso 3 (vehículo), escena 5 = CTA "Reservar ahora".

## Tone
- Preset: `polished`
- Creative direction: "elegante y premium, servicio de taxi de lujo para turistas en Varadero" + refinamiento del usuario: "elegante, premium y directo"
- Interpretación: pocas escenas, holds largos y legibles, entradas rápidas con easing expo-out del proyecto (`--ease-lux`), cero gritos. La energía viene del movimiento y de los cortes, nunca de texto apresurado.

## Format: vertical — 1080x1920
## Duration: 23s (5 escenas)

## Visual identity (from the project)
- Background: `#0B0E12` (deep) / `#131920` (base)
- Surface: `#1C242D` (elevated) + glass `rgba(28,36,45,0.55)` con borde dorado 0.18
- Accent: `#E8A94B` (gold), hover `#F6C66B`
- Text: `#F5F1EA` (cream) / secundario `#A9B1BA` (muted)
- Display font: **Playfair Display** (títulos) — Body font: **Inter** (texto, precios `tabular-nums`)
- Strongest visual element: glass card del widget con hairline dorado + chips de ruta con precio en oro; tarjetas de flota con foto real y borde dorado.

## Share copy (draft)
Varadero Taxi: reserva tu traslado privado en segundos, precio fijo en USD y pago en efectivo al llegar. Sedán, SUV, minivan y van — en español e inglés.

## Audio direction
- Role: sparse professional accents sobre cama continua (tono polished: 2-3 SFX suaves, nada agresivo)
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady and clean, el track recomendado para `polished`)
- Music treatment: entra a 0.35 de volumen desde 0s, sin fade-in largo; al final baja suave bajo el logotipo (fade-out en el último 1.2s)
- Music cue guidance: preset leído — `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` (109.96 BPM). Strong cues usados: **8.74s** (total del widget), **17.47s** (segundo volteo de idioma), **19.66s** (logotipo). Beat grid para secuencias: 4.39 / 4.91 / 6.00 (toggle y chips de ruta), 10.37 / 11.46 / 12.55 / 13.64 (flota, cada 2 beats para respetar la lectura), 15.84 (primer volteo de idioma).
- Audio-reactive treatment: subtle; la línea/glow dorada y la presencia de la glass card respiran con el RMS del track. Sin ondas, sin ecualizador, sin estrobing.
- SFX posture: sparse. Un click de UI al activar el toggle de dirección, un click al girar ES/EN, un drop suave por chip/tarjeta (acento solo en la primera y la última de cada secuencia), y un bong/campana suave al asentar el logotipo.
- Audio-coupled moments: chips de ruta entrando al beat, tarjetas de flota entrando al beat, volteo de idioma con sonido de conmutador, total del widget con acento en el strong cue 8.74s.
- Restraint rule: nada de impactos pesados, nada de ráfagas, el video debe sonar tan calmado como se ve.

## Storyboard

### Scene 1 — Hook: el titular — 3.6s
Foto real `/fleet/sedan-blanco.jpg` a pantalla completa con gradiente `from-deep/85 via-deep/75 to-deep`. Entra kicker dorado "TRASLADOS PRIVADOS EN VARADERO" (0.35s), slam de "Varadero en lujo, de puerta a puerta" en Playfair (~1.0s), subtítulo "Reserva tu traslado privado en segundos.", y dos chips dorados "Precio fijo en USD" y "Pago en efectivo al llegar" (texto corto, hold ≥0.8s).
Sequential/interaction: kicker → titular → subtítulo → 2 chips (stagger 0.15s).
Audio intent: apertura limpia, la cama entra sin llamar la atención.
Audio-coupled idea: beat-aligned reveal del titular (snap a 3.27s si no perjudica la lectura).
Music: vol-12 a 0.35.
Transition mood: soft slide/crossfade → Scene 2.

### Scene 2 — Widget de reserva — 6.0s
Fondo base. Glass card vertical recreada del widget real: cabecera con 4 pasos (1 Ruta activo en oro, 2/3/4 atenuados). Debajo, label "DIRECCIÓN" con toggle real "Desde Varadero | Hacia Varadero" (activo en oro). Aparecen 2 chips de ruta en secuencia con datos reales: "Aeropuerto Juan Gualberto Gómez (VRA) — 25 min — desde $30" y "Centro de Varadero — 15 min — desde $15". Al pie de la card, barra de resumen: "Total $30" en oro + "Pagas en efectivo al llegar". Titulo de escena fuera de la card: "Reserva en segundos".
Sequential/interaction: yes — toggle se activa (click simulado), luego chip 1, chip 2; la barra de total asienta en el strong cue 8.74s.
Audio intent: sensación de flujo que avanza; interacción concreta.
Audio-coupled idea: click en el toggle; drop suave en cada chip (acento en el primero y el último); acento de confirmación cuando aparece el total.
Music: vol-12; snap del total a strong cue 8.74s (`// beat-locked: 8.74s`).
Transition mood: clean → Scene 3.

### Scene 3 — Nuestra flota — 5.0s
Fondo deep. Título Playfair "Nuestra flota" + subtítulo "Elige la comodidad que se ajusta a tu viaje." Entra una fila de 4 tarjetas (foto real del proyecto, borde dorado) en secuencia: Sedán / SUV / Minivan / Van, cada una con su línea "3 pax · 2 maletas" etc. Texto corto: cada etiqueta se lee en el hold; el conjunto completo permanece en pantalla hasta el final de la escena.
Sequential/interaction: yes — 4 tarjetas una a una, en beats 10.37 / 11.46 / 12.55 / 13.64 (cada 2 beats, ±0.10s), con el conjunto completo en pantalla hasta el final de la escena.
Audio intent: ritmo de construcción, como repasar el garage.
Audio-coupled idea: card sounds ligeros; sin SFX en cada una si suena apretado — basta primero + última.
Music: vol-12.
Transition mood: clean → Scene 4.

### Scene 4 — Español / English — 4.4s
Barra de cabecera glass real (borde dorado inferior): "Varadero Taxi" a la izquierda, pastilla ES/EN a la derecha. Debajo, el titular gigante. La pastilla gira ES→EN y el titular pasa a "Varadero in luxury, door to door"; tras ~1.6s vuelve a ES con el titular original. Debajo, línea pequeña: "Español o inglés, tú eliges." / "Spanish or English, you choose." Hold suficiente en ambos idiomas (≥1.2s cada uno).
Sequential/interaction: yes — flip 1 en 15.84s (beat), flip 2 en 17.47s (strong cue); el ES inicial ya se leyó en la escena 1, y cada versión posterior se sostiene ~1.6-2s.
Audio intent: precisión mecánica, conmutador real.
Audio-coupled idea: sonido de conmutador en cada giro (`interface/switch_*`), alineado al frame del giro.
Music: vol-12.
Transition mood: soft → Scene 5.

### Scene 5 — Logotipo + CTA — 4.0s
Fondo deep limpio. Filete dorado fino entra. "Varadero Taxi" en Playfair grande asienta en el strong cue **19.66s** (`// beat-locked: 19.66s`), con el subtítulo real "Traslados de lujo en Varadero". Botón dorado real "Reservar ahora" debajo. Dos líneas finales en muted: "Precio fijo en USD · Pago en efectivo al llegar" y "Español / English". Todo el texto a ≥0.8s settled antes del final.
Sequential/interaction: filete → logotipo → subtítulo → botón → línea de condiciones.
Audio intent: cierre premium, un solo golpe suave y la cama se retira.
Audio-coupled idea: campana/bong suave al asentar el logotipo; fade-out musical en el último segundo.
Music: vol-12 con fade-out final.
Transition mood: fin.

**Music mood for this video:** steady, limpio, corporativo elegante (vol-12).
**Audio summary:** cama continua a volumen bajo con solo 4-5 acentos puntuales — chips, tarjetas, dos conmutadores de idioma y un golpe final de logotipo — y fade-out al cerrar.
