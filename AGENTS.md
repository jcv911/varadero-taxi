# Reglas para agentes de IA

Antes de cambiar algo, lee este archivo completo.

## Git
- NUNCA uses git push --force, git reset --hard ni git clean sobre master.
- NUNCA uses git add . sin antes correr git status y revisar la lista.
- NUNCA subas node_modules/, .next/, .env ni .env.local.
- Un commit por tarea, con mensaje claro en español.

## Archivos protegidos
- No borres ni modifiques sin pedir confirmación: tsconfig.json, package-lock.json, next.config.ts, middleware.ts, .gitignore.
- No borres carpetas ni archivos del proyecto para "arreglar" un error. Primero explica el error y propón la solución.

## Antes de cambios grandes
- Si el cambio toca más de 3 archivos o cambia la estructura, pide confirmación al usuario antes de empezar.

## Cuando algo falla
- Pega el error completo y explica la causa antes de tocar código.
- Si no sabes la causa, dilo. No inventes un arreglo.
## Entorno de trabajo (Windows)

- El sistema es Windows con PowerShell. No uses comandos de Linux (`for`, `sleep`, `jq`, `grep`, `cat` con pipes complejos).
- La herramienta de terminal se llama `shell`. No existe una herramienta `bash`.
- Para consultar una URL usa `Invoke-RestMethod`, una sola vez por tarea.
- Nunca hagas bucles de espera ni reintentos automáticos. Si algo tarda, reporta el estado y espera instrucciones.