$ErrorActionPreference = "Stop"

$root = (Get-Location).Path

$targets = @(
    "data\canonicalEvidence.ts",
    "logic\progression\caseCompletion.ts",
    "lib\evidenceBoard\relationshipResolver.ts"
)

foreach ($relative in $targets) {
    $path = Join-Path $root $relative
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing expected file: $path"
    }

    Copy-Item -LiteralPath $path -Destination "$path.before-canonical-case-layer.bak" -Force
}

# canonicalEvidence.ts
$path = Join-Path $root "data\canonicalEvidence.ts"
$text = Get-Content -LiteralPath $path -Raw
$text = $text -replace "import \{ ACT_I_CASES \} from '@/data/act1Cases';",
                    "import { getCanonicalAuthoredCase } from '@/data/canonicalCases';"
$text = $text -replace "const spec = ACT_I_CASES\.find\(\s*\(item\) => item\.slug === caseSlug,\s*\);",
                    "const spec = getCanonicalAuthoredCase(caseSlug);"
Set-Content -LiteralPath $path -Value $text -Encoding UTF8

# caseCompletion.ts
$path = Join-Path $root "logic\progression\caseCompletion.ts"
$text = Get-Content -LiteralPath $path -Raw
$text = $text -replace "import \{ ACT_I_CASES \} from '@/data/act1Cases';",
                    "import { getCanonicalAuthoredCase } from '@/data/canonicalCases';"
$text = $text -replace "const definition = ACT_I_CASES\.find\(\s*\(caseSpec\) => caseSpec\.slug === caseId,\s*\);",
                    "const definition = getCanonicalAuthoredCase(caseId);"
Set-Content -LiteralPath $path -Value $text -Encoding UTF8

# Evidence Board relationship resolver
$path = Join-Path $root "lib\evidenceBoard\relationshipResolver.ts"
$text = Get-Content -LiteralPath $path -Raw
$text = $text -replace "import \{ ACT_I_CASES \} from '@/data/act1Cases';",
                    "import { getCanonicalAuthoredCase, getCanonicalAuthoredCases } from '@/data/canonicalCases';"
$text = $text -replace "const sourceCase = ACT_I_CASES\.find\(\(item\) => item\.slug === source\);",
                    "const sourceCase = getCanonicalAuthoredCase(source);"
$text = $text -replace "const targetCase = ACT_I_CASES\.find\(\(item\) => item\.slug === target\);",
                    "const targetCase = getCanonicalAuthoredCase(target);"
$text = $text -replace "for \(const caseSpec of ACT_I_CASES\) \{",
                    "for (const caseSpec of getCanonicalAuthoredCases()) {"
Set-Content -LiteralPath $path -Value $text -Encoding UTF8

Write-Host ""
Write-Host "Canonical case lookup migration applied." -ForegroundColor Green
Write-Host ""
Write-Host "Updated:"
$targets | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "Backups created beside each file with:"
Write-Host "  .before-canonical-case-layer.bak"
Write-Host ""
Write-Host "Next: run the TypeScript/build checks before proceeding."