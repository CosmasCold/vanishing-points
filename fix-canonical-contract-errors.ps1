$ErrorActionPreference = "Stop"

$root = (Get-Location).Path

# 1. Restore canonicalCases.ts to the clean pre-convergence state.
$canonical = Join-Path $root "data\canonicalCases.ts"
$canonicalBackup = "$canonical.before-shared-type-convergence.bak"

if (Test-Path -LiteralPath $canonicalBackup) {
    Copy-Item -LiteralPath $canonicalBackup -Destination $canonical -Force
    Write-Host "Restored canonicalCases.ts from its pre-convergence backup." -ForegroundColor Green
} else {
    throw "Missing backup: $canonicalBackup"
}

# 2. Fix the shared status vocabulary.
# Existing Act I source data legitimately uses 'source' and 'proposed'.
# The canonical outline additionally needs 'approved-outline'.
$types = Join-Path $root "data\canonicalCaseTypes.ts"
if (-not (Test-Path -LiteralPath $types)) {
    throw "Missing: $types"
}

$typesBackup = "$types.before-status-vocabulary-fix.bak"
if (-not (Test-Path -LiteralPath $typesBackup)) {
    Copy-Item -LiteralPath $types -Destination $typesBackup -Force
}

$text = Get-Content -LiteralPath $types -Raw
$text = $text -replace "export type CaseContentStatus =\s*\r?\n\s*\| 'proposed'\s*\r?\n\s*\| 'approved-outline'\s*\r?\n\s*\| 'authored-source';",
@"
export type CaseContentStatus =
  | 'source'
  | 'proposed'
  | 'approved-outline';
"@
Set-Content -LiteralPath $types -Value $text -Encoding UTF8

# 3. The Act I adapter changed the old ContentStatus alias correctly,
# but its roleStatus/status fields also use that alias. The expanded
# shared vocabulary now accepts their existing 'source' values.
Write-Host "Updated canonicalCaseTypes.ts status vocabulary." -ForegroundColor Green

# 4. Remove the accidental runtime edits from the previous migration if
# their backups exist. These are the files that were changed by the earlier
# bad migration. Restore only if the backup is present.
$runtimeFiles = @(
    "data\canonicalEvidence.ts",
    "logic\progression\caseCompletion.ts",
    "lib\evidenceBoard\relationshipResolver.ts"
)

foreach ($relative in $runtimeFiles) {
    $path = Join-Path $root $relative
    $backup = "$path.before-canonical-case-layer.bak"
    if (Test-Path -LiteralPath $backup) {
        Copy-Item -LiteralPath $backup -Destination $path -Force
        Write-Host "Restored $relative" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Status vocabulary and runtime state corrected." -ForegroundColor Green
Write-Host "canonicalCases.ts restored before the failed convergence." -ForegroundColor Green
Write-Host ""
Write-Host "Now run the TypeScript check. Do NOT run the earlier migration scripts."