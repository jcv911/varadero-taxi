/**
 * ¿Qué revisión está ejecutando este proceso?
 *
 * Los despliegues son asíncronos: tras un push, producción sigue sirviendo la compilación
 * anterior hasta que la nueva está sana. Sin poder preguntárselo al proceso vivo, "¿ya
 * salió mi cambio?" solo se puede adivinar por comportamiento. Railway documenta y
 * recomienda exponer `RAILWAY_GIT_COMMIT_SHA` en un endpoint precisamente para esto.
 *
 * Se lee en cada llamada (no al cargar el módulo) para reflejar el entorno del proceso
 * vivo. Módulo puro: cubierto por scripts/test-booking.cjs.
 */

export type VersionSource = "railway" | "vercel" | "env" | "unknown";

export interface DeploymentInfo {
  /** Hash completo del commit desplegado, o null si el host no expone nada. */
  commit: string | null;
  /** Los 7 primeros caracteres, la forma que muestra `git log --oneline`. */
  commitShort: string | null;
  /** Rama que disparó el despliegue, cuando el host la informa. */
  branch: string | null;
  /** Nombre del entorno de despliegue, cuando el host lo informa. */
  environment: string | null;
  /** De dónde salió el dato: sirve para saber por qué `commit` está vacío. */
  source: VersionSource;
}

/**
 * En orden de precedencia. Railway va primero porque es donde se despliega hoy; los
 * genéricos cubren CI propio (`GIT_COMMIT`) y hosts tipo Heroku (`SOURCE_VERSION`).
 */
const CANDIDATES: ReadonlyArray<{
  source: VersionSource;
  commit: readonly string[];
  branch: readonly string[];
  environment: readonly string[];
}> = [
  {
    source: "railway",
    commit: ["RAILWAY_GIT_COMMIT_SHA"],
    branch: ["RAILWAY_GIT_BRANCH"],
    environment: ["RAILWAY_ENVIRONMENT_NAME"],
  },
  {
    source: "vercel",
    commit: ["VERCEL_GIT_COMMIT_SHA"],
    branch: ["VERCEL_GIT_COMMIT_REF"],
    environment: ["VERCEL_ENV"],
  },
  {
    source: "env",
    commit: ["GIT_COMMIT", "COMMIT_SHA", "SOURCE_VERSION", "BUILD_COMMIT"],
    branch: ["GIT_BRANCH", "BRANCH"],
    environment: ["GIT_ENV"],
  },
];

function firstValue(
  env: Record<string, string | undefined>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return null;
}

export function deploymentInfo(
  env: Record<string, string | undefined> = process.env
): DeploymentInfo {
  for (const candidate of CANDIDATES) {
    const commit = firstValue(env, candidate.commit);
    if (!commit) continue;
    return {
      commit,
      commitShort: commit.slice(0, 7),
      branch: firstValue(env, candidate.branch),
      environment: firstValue(env, candidate.environment),
      source: candidate.source,
    };
  }

  // Sin datos: se dice explícitamente en vez de inventar un valor.
  return { commit: null, commitShort: null, branch: null, environment: null, source: "unknown" };
}
