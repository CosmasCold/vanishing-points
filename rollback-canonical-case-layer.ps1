$ErrorActionPreference = "Stop"

$root = (Get-Location).Path

$files = @(
    "data\canonicalEvidence.ts",
    "logic\progression\caseCompletion.ts",
    "lib\evidenceBoard\relationshipResolver.ts"
)

foreach ($relative in $files) {
    $path = Join-Path $root $relative
    $backup = "$path.before-canonical-case-layer.bak"

    if (-not (Test-Path -LiteralPath $backup)) {
        throw "Backup not found: $backup"
    }

    Copy-Item -LiteralPath $backup -Destination $path -Force
    Write-Host "Restored $relative" -ForegroundColor Green
}

Write-Host ""
Write-Host "Rollback complete." -ForegroundColor Green
Write-Host "The existing Act I runtime lookup path is restored." -ForegroundColor Yellow
Write-Host "The new data/canonicalCases.ts remains in place." -ForegroundColor Cyan
Write-Host ""
Write-Host "Do not run the previous migration script again."