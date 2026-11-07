<#
  check-server.ps1 — Arranca next dev en background sin colgarse, espera HTTP 200 y reporta.

  Por qué existe: Start-Process con -RedirectStandardOutput/-RedirectStandardError
  pero SIN -RedirectStandardInput deja el proceso hijo (next dev, nunca termina)
  con un handle abierto a la consola del padre → el pipe del runner nunca se cierra
  y la verificación termina en "Tool execution aborted" aunque imprima 200.

  Fix: -RedirectStandardInput a \\.\NUL (null device) para que el hijo no retenga
  la entrada estándar del padre. Además guardamos el PID y solo lo matamos a él
  (nunca `Get-Process node | Stop-Process` — hay servicios Node ajenos, p.ej. routers).

  Uso:
    pwsh scripts/check-server.ps1 [-Port 4123]
    pwsh scripts/check-server.ps1 -Stop
#>

param(
  [int]$Port = 4123,
  [string]$Route = "/es",
  [switch]$Stop
)

$pidFile = Join-Path $env:TEMP "opencode\vtx-dev.pid"
New-Item -ItemType Directory -Path (Split-Path $pidFile) -Force | Out-Null

function Get-ListenerPid {
  $c = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  return $c.OwningProcess
}

if ($Stop) {
  $found = $false
  foreach ($id in @((Get-Content $pidFile -ErrorAction SilentlyContinue), (Get-ListenerPid)) | Where-Object { $_ }) {
    if (Get-Process -Id $id -ErrorAction SilentlyContinue) {
      Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
      Write-Output "server parado (PID $id)"
      $found = $true
    }
  }
  if (-not $found) { Write-Output "sin proceso vivo que parar" }
  Remove-Item $pidFile -ErrorAction SilentlyContinue
  exit 0
}

if (Get-ListenerPid) {
  Write-Output "SERVER YA CORRIENDO (PID $(Get-ListenerPid)) en :$Port"
  exit 0
}

$log       = Join-Path $env:TEMP "opencode\vtx-dev.log"
$errlog    = Join-Path $env:TEMP "opencode\vtx-dev-err.log"
$stdinFile = [System.IO.Path]::GetTempFileName()
Remove-Item $log, $errlog -ErrorAction SilentlyContinue

$p = Start-Process -FilePath "node_modules\.bin\next.cmd" `
  -ArgumentList "dev", "-p", "$Port" `
  -WorkingDirectory (Get-Location) `
  -RedirectStandardOutput $log `
  -RedirectStandardError $errlog `
  -RedirectStandardInput $stdinFile `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $pidFile -Value $p.Id

for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$Port$Route" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) {
      Write-Output "OK: $Route -> $($r.StatusCode) (PID $($p.Id), puerto $Port)"
      exit 0
    }
  } catch {
    # server aún arrancando
  }
}

Write-Output "FALLO: sin 200 en 20s (PID $($p.Id), puerto $Port). Ultimas lineas del errlog:"
if (Test-Path $errlog) { Get-Content $errlog -Tail 10 }
exit 1