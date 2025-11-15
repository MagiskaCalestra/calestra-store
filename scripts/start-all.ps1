$ErrorActionPreference = "Stop"

# portar
$infinityPort = 14500
$corePort     = 14600
$storePort    = 5175
$webPort      = 5288

# Hitta scriptets katalog oavsett hur det körs i VS Code/terminal
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

Write-Host "Root: $root"

# Starta varje tjänst i egen PS-process (minimerat fönster)
Start-Process pwsh -WindowStyle Minimized -ArgumentList @(
  "-NoExit","-Command","npm -C `"$root\..\services\infinity`" run dev"
)

Start-Process pwsh -WindowStyle Minimized -ArgumentList @(
  "-NoExit","-Command","npm -C `"$root\..\services\c-core`" run dev"
)

Start-Process pwsh -WindowStyle Minimized -ArgumentList @(
  "-NoExit","-Command","npm -C `"$root\..\apps\store-classic`" run dev -- --port $storePort --strictPort"
)

Start-Process pwsh -WindowStyle Minimized -ArgumentList @(
  "-NoExit","-Command","npm -C `"$root\..\apps\web`" run dev -- --port $webPort --strictPort"
)

Start-Sleep -Seconds 4

Write-Host "Test-Endpoint `n  http://localhost:$infinityPort/products        = `t'Infinity'"
Write-Host "Test-Endpoint `n  http://localhost:$corePort/progress/summary     = `t'C-Core'"

Write-Host "Allt startat. Öppnar butik..." -ForegroundColor Cyan
Start-Process "http://localhost:$storePort/shop"
