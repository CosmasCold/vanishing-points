$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$path = Join-Path $root "data\canonicalCases.ts"

if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing expected file: $path"
}

$backup = "$path.before-shared-type-convergence.bak"
if (-not (Test-Path -LiteralPath $backup)) {
    Copy-Item -LiteralPath $path -Destination $backup -Force
}

$text = Get-Content -LiteralPath $path -Raw

# Remove the locally duplicated type declarations and import the shared ones.
$importBlock = @"
import type {
  CanonicalAct,
  CanonicalCaseDefinition,
  CanonicalCaseCompletionContract,
  CanonicalPhase,
} from '@/data/canonicalCaseTypes';

"@

if ($text -notmatch "CanonicalCaseCompletionContract.*canonicalCaseTypes") {
    $text = $importBlock + $text
}

# Remove local definitions from the beginning of the file.
$text = [regex]::Replace(
    $text,
    "(?s)export type CanonicalAct = 1 \| 2 \| 3 \| 4 \| 5;\r?\n\r?\nexport type CanonicalCaseAuthoringStatus =.*?\r?\n\};\r?\n\r?\nexport interface CanonicalCaseDefinition \{.*?\r?\n\}\r?\n\r?\n",
    ""
)

# The shared contract uses `contentStatus` and a nested `narrative` object.
# Convert the existing outline's fields to the shared shape.
$text = $text -replace "authoringStatus: 'approved-outline',", "contentStatus: 'approved-outline',"
$text = $text -replace "narrativePurpose: ([^,\r\n]+),", "narrative: {`r`n      purpose: `$1,`r`n    },"

# Remove now-unused direct type references if the local declaration removal
# did not leave them relevant. Keep the shared imports intentionally explicit.
Set-Content -LiteralPath $path -Value $text -Encoding UTF8

Write-Host ""
Write-Host "canonicalCases.ts now imports the shared canonical case types." -ForegroundColor Green
Write-Host "Backup created: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "No runtime consumers were changed."