$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root "data\act1Cases.ts"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing expected file: $path"
}

$backup = "$path.before-shared-canonical-contract.bak"
if (-not (Test-Path -LiteralPath $backup)) {
    Copy-Item -LiteralPath $path -Destination $backup -Force
}

$text = Get-Content -LiteralPath $path -Raw

# Add shared canonical types without replacing the existing Act I data model.
if ($text -notmatch "canonicalCaseTypes") {
    $text = "import type { CanonicalAct, CanonicalPhase, CaseContentStatus } from '@/data/canonicalCaseTypes';`r`n`r`n" + $text
}

# Reuse the shared content-status vocabulary.
$text = $text -replace "export type ContentStatus = 'source' \| 'proposed';",
    "export type ContentStatus = CaseContentStatus;"

# Reuse the shared canonical act vocabulary while preserving the exact Act I constraint.
$text = $text -replace "act: 1;", "act: Extract<CanonicalAct, 1>;"

# Add phase to the Act I case interface after tier.
if ($text -notmatch "(?m)^\s*phase:\s*Extract<CanonicalPhase,\s*'GROUND STATE'>;") {
    $text = $text -replace "(?m)^(\s*tier:\s*0;\r?\n)", "$1  phase: Extract<CanonicalPhase, 'GROUND STATE'>;`r`n"
}

# Populate phase on each of the eight existing case objects.
# Only lines inside the case objects are matched because they follow tier: 0.
$text = [regex]::Replace(
    $text,
    "(?m)^(\s*tier:\s*0;)(\r?\n)(?!\s*phase:)",
    '$1$2    phase: ''GROUND STATE'',$2'
)

Set-Content -LiteralPath $path -Value $text -Encoding UTF8

Write-Host ""
Write-Host "Updated data\act1Cases.ts" -ForegroundColor Green
Write-Host "Shared canonical types are now referenced by the Act I contract." -ForegroundColor Cyan
Write-Host "Backup created: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "No runtime consumers were changed."