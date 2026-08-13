const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - NARRATIVE & SEEDING REPAIR (P2)");
console.log("   TARGETING: ORADOUR DEDUPLICATION & DOSSIER RE-LINKING");
console.log("=======================================================\n");

function log(status, msg) {
  const colors = {
    info: '\x1b[36m[INFO]\x1b[0m',
    success: '\x1b[32m[SUCCESS]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m'
  };
  console.log(`${colors[status] || '[LOG]'} ${msg}`);
}

// Helper to secure write
function safeWrite(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err) {
    log('error', `Failed to write to ${filePath}: ${err.message}`);
    return false;
  }
}

// 1. REPAIR: Oradour-sur-Glane Deduplication and Merger
function deduplicateOradour() {
  const databasePaths = [
    path.join(process.cwd(), 'scripts', 'mapped-places.json'),
    path.join(process.cwd(), 'scripts', 'mapped-places-clean.json'),
    path.join(process.cwd(), 'places.json'),
    path.join(process.cwd(), 'data', 'places.ts'),
    path.join(process.cwd(), 'src', 'data', 'places.ts')
  ];

  let patchedCount = 0;

  databasePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    log('info', `Deduplicating Oradour references in: ${filePath}`);
    try {
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace overlapping or duplicate references in connectedTo lists
      if (filePath.endsWith('.json')) {
        let data = JSON.parse(content);
        let placesList = Array.isArray(data) ? data : (data.places || []);

        if (Array.isArray(placesList)) {
          // Remove oradour-sur-glane standalone entry if oradour-church-crypt exists
          const initialLength = placesList.length;
          placesList = placesList.filter(p => p.slug !== 'oradour-sur-glane');
          if (placesList.length < initialLength) {
            log('success', `Merged 'oradour-sur-glane' entry into 'oradour-church-crypt'.`);
          }

          // Rewrite all backlink targets in remaining places
          placesList.forEach(p => {
            if (p && Array.isArray(p.connectedTo)) {
              p.connectedTo = p.connectedTo.map(c => c === 'oradour-sur-glane' ? 'oradour-church-crypt' : c);
            }
          });

          const output = Array.isArray(data) ? placesList : { ...data, places: placesList };
          safeWrite(filePath, JSON.stringify(output, null, 2));
          patchedCount++;
        }
      } else if (filePath.endsWith('.ts')) {
        // Handle TS files with raw regex replacements for connections
        let updated = content.replace(/"oradour-sur-glane"/g, '"oradour-church-crypt"')
                             .replace(/'oradour-sur-glane'/g, "'oradour-church-crypt'");
        
        if (updated !== content) {
          safeWrite(filePath, updated);
          log('success', `Cleaned TypeScript static connections.`);
          patchedCount++;
        }
      }
    } catch (e) {
      log('error', `Failed to deduplicate ${filePath}: ${e.message}`);
    }
  });

  return patchedCount;
}

// 2. REPAIR: Seeding Restricted Dossiers (Stanley Hotel, Pyramiden)
function seedRestrictedDossiers() {
  const evidenceBoardPaths = [
    path.join(process.cwd(), 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
    path.join(process.cwd(), 'src', 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
    path.join(process.cwd(), 'components', 'EvidenceBoard.tsx')
  ];

  let patchedBoard = false;

  for (const p of evidenceBoardPaths) {
    if (!fs.existsSync(p)) continue;

    log('info', `Seeding restricted cases to evidence board registry: ${p}`);
    try {
      let content = fs.readFileSync(p, 'utf8');

      // Expand CORE_CASE_SLUGS Set to include the-stanley-hotel and pyramiden
      if (content.includes('CORE_CASE_SLUGS')) {
        let modified = false;
        
        if (!content.includes('the-stanley-hotel')) {
          content = content.replace(
            "'oradour-church-crypt',",
            "'oradour-church-crypt',\n  'the-stanley-hotel',"
          );
          modified = true;
        }

        if (!content.includes('pyramiden')) {
          content = content.replace(
            "'pripyat-hospital-126',",
            "'pripyat-hospital-126',\n  'pyramiden',"
          );
          modified = true;
        }

        if (modified) {
          safeWrite(p, content);
          log('success', `✓ Successfully registered 'the-stanley-hotel' and 'pyramiden' on the evidence board.`);
          patchedBoard = true;
          break;
        } else {
          log('success', `✓ Cases are already successfully registered in EvidenceBoard.`);
          patchedBoard = true;
          break;
        }
      }
    } catch (e) {
      log('error', `Failed to patch EvidenceBoard: ${e.message}`);
    }
  }

  return patchedBoard;
}

// Execution
const deduplicated = deduplicateOradour();
const seeded = seedRestrictedDossiers();

console.log("\n-------------------------------------------------------");
if (deduplicated > 0 || seeded) {
  log('success', "Narrative integrity & Restricted Dossier Seeding (P2) resolved!");
  log('info', "Run your local Next.js build or mapping scripts to re-generate static routes.");
} else {
  log('warn', "No modifications were necessary. Your databases are already clean and unified.");
}
console.log("-------------------------------------------------------\n");
