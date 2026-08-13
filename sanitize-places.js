const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE DATABASE SANITIZATION SEQUENCE");
console.log("   TARGETING: BODIE PROGRESSION LOCK & NULL CONNECTIONS");
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

const targets = [
  path.join(process.cwd(), 'scripts', 'mapped-places.json'),
  path.join(process.cwd(), 'scripts', 'mapped-places-clean.json'),
  path.join(process.cwd(), 'places.json'),
  path.join(process.cwd(), 'data', 'mapped-places.json')
];

let filesPatched = 0;

targets.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    log('info', `Target file not found at: ${filePath}. Skipping.`);
    return;
  }

  log('info', `Processing dataset: ${filePath}`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(raw);
    let placesList = Array.isArray(data) ? data : (data.places || []);

    if (!Array.isArray(placesList)) {
      log('error', `Invalid JSON structure in ${filePath}. Places list must be an array.`);
      return;
    }

    let nullsCleaned = 0;
    let bodieAligned = false;

    placesList.forEach(place => {
      if (!place) return;

      // Align Bodie Ghost Town to Tier 0 (Act I onboarding state)
      if (place.slug === 'bodie-ghost-town') {
        if (place.tier !== 0 || place.unlockCondition !== null) {
          place.tier = 0;
          place.unlockCondition = null; // Strips the 69 Dust lock
          bodieAligned = true;
        }
      }

      // Clean connectedTo array of nulls, undefineds, or empty strings
      if (Array.isArray(place.connectedTo)) {
        const originalLength = place.connectedTo.length;
        place.connectedTo = place.connectedTo.filter(c => typeof c === 'string' && c.trim().length > 0);
        nullsCleaned += (originalLength - place.connectedTo.length);
      }
    });

    // Write the beautifully formatted JSON back
    const updatedData = Array.isArray(data) ? placesList : { ...data, places: placesList };
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');

    if (bodieAligned) {
      log('success', `✓ Aligned 'bodie-ghost-town' to Tier 0 (No restrictions).`);
    }
    if (nullsCleaned > 0) {
      log('success', `✓ Pruned ${nullsCleaned} null or empty connection pointers.`);
    }
    if (!bodieAligned && nullsCleaned === 0) {
      log('info', `• No changes required (already clean).`);
    }

    filesPatched++;
  } catch (err) {
    log('error', `Failed to parse or write ${filePath}: ${err.message}`);
  }
});

console.log("\n-------------------------------------------------------");
if (filesPatched > 0) {
  log('success', `Database sanitization completed successfully across ${filesPatched} files!`);
  log('info', "Next steps: Run your local db seed script if you are using an external database.");
} else {
  log('warn', "No files were modified. Ensure this script is placed in your project root.");
}
console.log("-------------------------------------------------------\n");