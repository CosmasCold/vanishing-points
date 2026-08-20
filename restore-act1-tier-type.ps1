$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root "data\act1Cases.ts"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing expected file: $path"
}

$backup = "$path.before-tier-restoration.bak"
if (-not (Test-Path -LiteralPath $backup)) {
    Copy-Item -LiteralPath $path -Destination $backup -Force
}

$text = Get-Content -LiteralPath $path -Raw

# The previous adapter inserted phase using a pattern anchored to the old
# tier field and accidentally removed tier from the Act1CaseSpec interface.
# The authored Act I objects still legitimately contain tier: 0, so restore
# that interface property. Do not alter the eight case objects.
if ($text -notmatch "(?m)^\s*tier:\s*0;\s*$") {
    throw "Could not find any authored tier: 0 case data. Refusing to guess."
}

# Add tier immediately after the shared Act/phase fields if the interface
# currently lacks it. This targets the interface declaration, not case objects.
if ($text -notmatch "(?s)export interface Act1CaseSpec\s*\{.*?\btier:\s*0;") {
    $pattern = "(export interface Act1CaseSpec\s*\{.*?act:\s*Extract<CanonicalAct,\s*1>;\r?\n\s*phase:\s*Extract<CanonicalPhase,\s*'GROUND STATE'>;)"
    $replacement = '$1' + "`r`n  tier: 0;"
    $updated = [regex]::Replace($text, $pattern, $replacement, 1)

    if ($updated -eq $text) {
        throw "Act1CaseSpec interface shape was not matched. Refusing to make a broad edit."
    }

    $text = $updated
}

Set-Content -LiteralPath $path -Value $text -Encoding UTF8

Write-Host ""
Write-Host "Restored tier: 0 to Act1CaseSpec." -ForegroundColor Green
Write-Host "No case object data was changed." -ForegroundColor Cyan
Write-Host "Backup: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run the TypeScript check now."