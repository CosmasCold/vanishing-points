$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root "data\act1Cases.contract.ts"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing: $path"
}

$backup = "$path.before-shared-canonical-contract.bak"
if (-not (Test-Path -LiteralPath $backup)) {
    Copy-Item -LiteralPath $path -Destination $backup -Force
}

$text = Get-Content -LiteralPath $path -Raw

# Import the shared act/phase vocabulary without changing the existing
# Act I runtime data shape. Act1CaseSpec remains source-compatible.
if ($text -notmatch "from '@/data/canonicalCaseTypes'") {
    $text = "import type { CanonicalAct, CanonicalPhase } from '@/data/canonicalCaseTypes';`r`n`r`n" + $text
}

# Replace the hard-coded Act 1 literal with the shared canonical vocabulary.
$text = $text -replace "act: 1;", "act: Extract<CanonicalAct, 1>;"

# Add the canonical phase to the interface only if it is not already present.
# This is a structural metadata field and does not alter existing runtime
# completion behavior.
if ($text -notmatch "^\s*phase:\s*Extract<CanonicalPhase,\s*'GROUND STATE'>;" -and
    $text -notmatch "^\s*phase:\s*CanonicalPhase;") {
    $text = $text -replace "(?m)^(\s*tier: 0;\r?\n)", '$1  phase: Extract<CanonicalPhase, ''GROUND STATE''>;`r`n'
}

# Populate the phase on each Act I case object immediately after tier: 0.
$text = [regex]::Replace(
    $text,
    "(?m)^(\s*tier:\s*0;)(\r?\n)",
    '$1$2    phase: ''GROUND STATE'',$2',
    [System.Text.RegularExpressions.RegexOptions]::Multiline
)

Set-Content -LiteralPath $path -Value $text -Encoding UTF8

Write-Host ""
Write-Host "Act I contract now references shared canonical act/phase types." -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor Cyan
Write-Host ""
Write-Host "No runtime consumers were changed."