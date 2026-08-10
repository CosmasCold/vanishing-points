/**
 * VANISHING POINTS — Database Sanitizer & Repair Script (v2.0)
 * ===========================================================
 * Super-robust placeholder-based parser that handles advanced formatting leaks
 * and resolves local copy-paste/pasting collisions on the fly.
 * 
 * Instructions:
 * 1. Open your terminal at your project root.
 * 2. If you had a copy-paste accident in scripts/mapped-places.json, run:
 *    git checkout -- scripts/mapped-places.json
 *    (or restore your original corrupted file from your backup).
 * 3. Save this script as "sanitize-mapped-places-v2.js" in your project root.
 * 4. Run the script:
 *    node sanitize-mapped-places-v2.js
 */

const fs = require('fs');
const path = require('path');

// Target file paths to try
const possiblePaths = [
  path.join(process.cwd(), 'scripts', 'mapped-places.json'),
  path.join(process.cwd(), 'mapped-places.json'),
  path.join(__dirname, 'mapped-places.json'),
  path.join(__dirname, 'scripts', 'mapped-places.json')
];

let targetPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    targetPath = p;
    break;
  }
}

if (!targetPath) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: Could not find scripts/mapped-places.json or mapped-places.json in the current folder.');
  process.exit(1);
}

console.log(`\x1b[36m%s\x1b[0m`, `🔍 Found database targeting: ${targetPath}`);
let rawContent = fs.readFileSync(targetPath, 'utf8');

// CHECK FOR PASTING COLLISION
if (rawContent.includes('"address": {{') || rawContent.match(/"address":\s*\{\s*\{\s*"meta"/)) {
  console.error('\x1b[31m%s\x1b[0m', '\n⚠️ WARNING: PASTING COLLISION DETECTED!');
  console.log('It looks like your local scripts/mapped-places.json file is corrupted.');
  console.log('The 16-place JSON dataset was accidentally pasted inside the first place\'s "address" block of your 159-place file.');
  console.log('This created a nesting collision ("address": {{ "meta": ... }).\n');
  console.log('👉 Please restore your original file before running this script.');
  console.log('   You can do this by running:');
  console.log('   git checkout -- scripts/mapped-places.json');
  console.log('   (or restoring your backup of the corrupted 159-place file).\n');
  process.exit(1);
}

console.log('🧹 Scrubbing markdown syntax leakages and corruptions...');

let cleanContent = rawContent;

// 1. Clean up URL formatting leaks inside photo arrays BEFORE stripping asterisks
// E.g. "Penitentiary* - *Philadelphia" -> "Penitentiary_-_Philadelphia"
cleanContent = cleanContent.replace(/\*\s*-\s*\*|\*\s*-\s*_/gi, '_-_');
cleanContent = cleanContent.replace(/_-\s*\*/gi, '_-_');
cleanContent = cleanContent.replace(/\*\s*-_/gi, '_-_');

// 2. Normalize and protect valid MongoDB _id and $oid combinations with placeholders
cleanContent = cleanContent.replace(
  /"[\s*]*id"\s*:\s*\{\s*[\s\S]*?oid[\s\S]*?:\s*"([^"]+)"[\s\S]*?\}[\s*]*,?[\s*]*/gi,
  '___ID_OID___$1___'
);

// 3. Normalize and protect date fields
cleanContent = cleanContent.replace(
  /"(submittedAt|verifiedAt|createdAt|updatedAt)"\s*:\s*\{\s*[\s\S]*?date[\s\S]*?:\s*"([^"]+)"[\s\S]*?\}[\s*]*,?[\s*]*/gi,
  '___DATE_FIELD___$1___$2___'
);

// 4. Remove all literal asterisks (*) and remaining dollar signs ($) (markdown residue)
cleanContent = cleanContent.replace(/\*/g, '');
cleanContent = cleanContent.replace(/\$/g, '');

// 5. Restore protected structures to clean, standard, valid JSON
// Restore _id & $oid: ___ID_OID___VALUE___ -> "_id": { "$oid": "VALUE" }
cleanContent = cleanContent.replace(
  /___ID_OID___([^_]+)___/g,
  '"_id": { "$oid": "$1" },\n'
);

// Restore date fields: ___DATE_FIELD___FIELD___VALUE___ -> "FIELD": { "$date": "VALUE" }
cleanContent = cleanContent.replace(
  /___DATE_FIELD___([^_]+)___([^_]+)___/g,
  '"$1": { "$date": "$2" },\n'
);

// 6. Clean up array boundaries
cleanContent = cleanContent.replace(/\[\s*"/g, '["');
cleanContent = cleanContent.replace(/"\s*\]/g, '"]');
cleanContent = cleanContent.replace(/"\s*,\s*"/g, '", "');

// 7. Remove nulls inside connectedTo
cleanContent = cleanContent.replace(/null\s*,\s*/g, '');
cleanContent = cleanContent.replace(/,\s*null/g, '');

// 8. Clean up trailing commas before braces or double commas
cleanContent = cleanContent.replace(/,\s*\}/g, '\n}');
cleanContent = cleanContent.replace(/,\s*\]/g, '\n]');
cleanContent = cleanContent.replace(/,[\s,]*\n/g, ',\n');

// 9. Attempt parsing to confirm JSON validity
try {
  const parsed = JSON.parse(cleanContent);
  
  // 10. Programmatically remove remaining null connections defensively
  let prunedNullsCount = 0;
  if (parsed.places && Array.isArray(parsed.places)) {
    parsed.places.forEach(place => {
      if (place && Array.isArray(place.connectedTo)) {
        const originalLength = place.connectedTo.length;
        place.connectedTo = place.connectedTo.filter(slug => typeof slug === 'string' && slug.length > 0);
        prunedNullsCount += (originalLength - place.connectedTo.length);
      }
    });
  }
  
  // 11. Write back beautiful clean JSON
  fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf8');
  console.log('\x1b[32m%s\x1b[0m', '✔ SUCCESS: Your mapped-places.json file is now perfectly formatted and valid JSON!');
  if (prunedNullsCount > 0) {
    console.log(`✔ Pruned ${prunedNullsCount} null connection blocks from place arrays.`);
  }
} catch (err) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: Failed to parse JSON even after sanitization.');
  console.error(`Message: ${err.message}`);
  
  // Debug context helper
  const match = err.message.match(/at position (\d+)/);
  if (match) {
    const pos = parseInt(match[1], 10);
    const lines = cleanContent.slice(0, pos).split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;
    
    console.log(`\nCrash site detected near line ${lineNum}, column ${colNum}:`);
    const surroundingLines = cleanContent.split('\n').slice(Math.max(0, lineNum - 4), lineNum + 3);
    surroundingLines.forEach((line, idx) => {
      const currentLineNum = Math.max(1, lineNum - 3) + idx;
      const isCrashLine = currentLineNum === lineNum;
      console.log(`${isCrashLine ? '▶ ' : '  '}[${currentLineNum}] ${line}`);
    });
  }
}
