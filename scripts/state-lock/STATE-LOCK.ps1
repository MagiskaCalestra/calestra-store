Param(
  [Parameter(Position=0,Mandatory=$false)]
  [string]$Version = "vX.Y"
)

$ErrorActionPreference = "Stop"

# --- paths ---
$RepoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$Stamp    = Get-Date -Format "yyyyMMdd_HHmmss"
$OutDir   = Join-Path $RepoRoot "backups"
$Label    = "STATE-LOCK_${Stamp}_${Version}"
$ZipPath  = Join-Path $OutDir "$Label.zip"
$ManifestPath = Join-Path $OutDir "$Label.manifest.json"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# --- includes / excludes ---
$IncludeRoots = @("apps","services","docs","packages","scripts",
  "package.json","package-lock.json",".gitignore",".env",".env.example",".env.local"
)

$ExcludeParts = @("node_modules","dist",".vite",".DS_Store","backups")

function Get-RelPath([string]$base,[string]$full) {
  $uBase = [Uri]("$base" + [IO.Path]::DirectorySeparatorChar)
  $uFull = [Uri]$full
  $rel = $uBase.MakeRelativeUri($uFull).ToString()
  return [Uri]::UnescapeDataString($rel).Replace('/','\')
}

# --- collect files ---
$Files = @()
foreach ($root in $IncludeRoots) {
  $abs = Join-Path $RepoRoot $root
  if (-not (Test-Path $abs)) { continue }

  if ((Get-Item $abs).PSIsContainer) {
    $Files += Get-ChildItem -Path $abs -File -Recurse -Force | Where-Object {
      $rel = Get-RelPath $RepoRoot $_.FullName
      -not ($ExcludeParts | ForEach-Object { $rel -match [Regex]::Escape($_) })
    }
  } else {
    $Files += Get-Item $abs -Force
  }
}

# --- manifest (sha256 + bytes) ---
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$manifestItems = foreach ($f in $Files) {
  $fs = [IO.File]::OpenRead($f.FullName)
  try {
    $hash = ($sha256.ComputeHash($fs) | ForEach-Object { $_.ToString("x2") }) -join ""
  } finally { $fs.Close() }
  [pscustomobject]@{
    path   = Get-RelPath $RepoRoot $f.FullName
    bytes  = $f.Length
    sha256 = $hash
  }
}
$manifestItems | ConvertTo-Json -Depth 3 | Out-File -Encoding UTF8 -FilePath $ManifestPath

# --- stage to temp (to keep folder structure) ---
$Stage = Join-Path $env:TEMP $Label
if (Test-Path $Stage) { Remove-Item $Stage -Force -Recurse }
New-Item -ItemType Directory -Force -Path $Stage | Out-Null

foreach ($f in $Files) {
  $rel = Get-RelPath $RepoRoot $f.FullName
  $destFile = Join-Path $Stage $rel
  $destDir  = Split-Path $destFile -Parent
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  Copy-Item -Path $f.FullName -Destination $destFile -Force
}

# include manifest at stage root
Copy-Item -Path $ManifestPath -Destination (Join-Path $Stage (Split-Path $ManifestPath -Leaf)) -Force

# --- zip using built-in Compress-Archive ---
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path (Join-Path $Stage '*') -DestinationPath $ZipPath -CompressionLevel Optimal -Force

# cleanup stage (keep manifest + zip in backups)
Remove-Item $Stage -Recurse -Force

Write-Host "STATE-LOCK created:"
Write-Host " - $ZipPath"
Write-Host " - $ManifestPath"
