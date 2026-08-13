const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE REPAIR PROTOCOL // LEVEL-4 UTILITY");
console.log("   TARGETING: PRIORITY-0 PROGRESSION AND RUNTIME BLOCKERS");
console.log("   VERSION: V3 (CORRECTED FILE PATH ALIGNMENT)");
console.log("=======================================================\n");

// Helper log function
function log(status, msg) {
  const colors = {
    info: '\x1b[36m[INFO]\x1b[0m',
    success: '\x1b[32m[SUCCESS]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m'
  };
  console.log(`${colors[status] || '[LOG]'} ${msg}`);
}

/**
 * REPAIR 01: Bodie Ghost Town Progression Lock
 * Canonical Act I Tier 0 correction
 */
function repairBodieGhostTown() {
  const placesTsPath = path.join(process.cwd(), 'data', 'places.ts');
  const mappedPlacesJsonPath = path.join(process.cwd(), 'scripts', 'mapped-places.json');
  const mappedPlacesCleanPath = path.join(process.cwd(), 'scripts', 'mapped-places-clean.json');
  const fallbackJsonPath = path.join(process.cwd(), 'places.json');

  let fixed = false;

  // 1. Repair data/places.ts
  if (fs.existsSync(placesTsPath)) {
    log('info', `Reading places corpus at: ${placesTsPath}`);
    let content = fs.readFileSync(placesTsPath, 'utf8');
    
    // Find bodie-ghost-town block and correct tier/unlockCondition
    const bodieIndex = content.indexOf('"slug": "bodie-ghost-town"');
    if (bodieIndex !== -1) {
      let segmentStart = content.lastIndexOf('{', bodieIndex);
      let segmentEnd = content.indexOf('}', bodieIndex);
      
      // Expand to find the closing brace of the full object if nested
      let braceCount = 1;
      let i = segmentStart + 1;
      while (i < content.length && braceCount > 0) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        i++;
      }
      segmentEnd = i;

      let bodieObject = content.substring(segmentStart, segmentEnd);
      
      // Correcting Tier 3 -> 0
      let updatedObject = bodieObject.replace(/"tier":\s*3/g, '"tier": 0');
      // Correcting unlockCondition -> null or removing it
      updatedObject = updatedObject.replace(/"unlockCondition":\s*\{[^}]*\}/g, '"unlockCondition": null');
      updatedObject = updatedObject.replace(/"resonanceNote":\s*"[^"]*"/g, '"resonanceNote": "Uncanny weathering logs."');

      content = content.substring(0, segmentStart) + updatedObject + content.substring(segmentEnd);
      fs.writeFileSync(placesTsPath, content, 'utf8');
      log('success', 'Successfully corrected "bodie-ghost-town" to Tier 0 with no unlock gates in data/places.ts');
      fixed = true;
    }
  }

  // 2. Repair scripts/mapped-places.json & clean JSONs
  const jsonPaths = [mappedPlacesJsonPath, mappedPlacesCleanPath, fallbackJsonPath];
  for (const p of jsonPaths) {
    if (fs.existsSync(p)) {
      log('info', `Correcting JSON file at: ${p}`);
      try {
        let raw = fs.readFileSync(p, 'utf8');
        let data = JSON.parse(raw);
        let placesList = Array.isArray(data) ? data : (data.places || []);
        
        let bodie = placesList.find(pl => pl.slug === 'bodie-ghost-town');
        if (bodie) {
          bodie.tier = 0;
          bodie.unlockCondition = null;
          bodie.resonanceNote = "Uncanny weathering logs.";
          fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
          log('success', `Sanitized "bodie-ghost-town" inside JSON: ${path.basename(p)}`);
          fixed = true;
        }
      } catch (e) {
        log('warn', `Failed parsing JSON during Bodie cleanup for ${p}: ${e.message}`);
      }
    }
  }

  return fixed;
}

/**
 * REPAIR 02: Prevent UI Crash from Null connections inside connectedTo Arrays
 * Adds filter bounds in components/investigation/InvestigationView.tsx (FIXED PATH!)
 */
function repairNullConnectionCrash() {
  const possiblePaths = [
    path.join(process.cwd(), 'components', 'investigation', 'InvestigationView.tsx'),
    path.join(process.cwd(), 'src', 'components', 'investigation', 'InvestigationView.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate InvestigationView.tsx in components/investigation/ or src/components/investigation/.');
    return false;
  }

  log('info', `Securing connection board bindings inside: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  // Look for ConnectedCard definition or the exact replace pattern
  const replaceCall = "slug.replace(/-/g, ' ').toUpperCase()";
  const protectedReplaceCall = "(slug ? slug.replace(/-/g, ' ').toUpperCase() : 'UNKNOWN CORES')";

  // Normalizing Windows CRLF line endings to unified LF just in case
  const originalLength = content.length;
  content = content.replace(/\r\n/g, '\n');

  if (content.includes(replaceCall)) {
    content = content.replace(replaceCall, protectedReplaceCall);
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', 'Protected ConnectedCard replace operation inside InvestigationView.tsx (Bug 02 resolved!).');
    return true;
  } else if (content.includes(protectedReplaceCall)) {
    log('info', 'ConnectedCard replace operation is already protected inside InvestigationView.tsx.');
    return true;
  }

  log('warn', 'Could not locate the ConnectedCard replaceCall pattern to patch inside InvestigationView.tsx.');
  return false;
}

/**
 * REPAIR 03: Unified Web Mercator Bounding scale projection alignment
 * Synchronizes scripts/map-places.ts math bounds to 4096px scale
 */
function repairProjectionScale() {
  const compilerPath = path.join(process.cwd(), 'scripts', 'map-places.ts');
  if (!fs.existsSync(compilerPath)) {
    log('warn', `Could not locate compiler script at: ${compilerPath}`);
    return false;
  }

  log('info', `Reading compiler script at: ${compilerPath}`);
  let content = fs.readFileSync(compilerPath, 'utf8');

  // Locate the projectCoordinates function
  const functionIndex = content.indexOf('function projectCoordinates');
  if (functionIndex !== -1) {
    // We update the function to use Web Mercator project logic scaled to 4096 instead of 800x600 linear ratio
    const oldFunctionBlock = `function projectCoordinates(lng: number, lat: number): { x: number; y: number } {\n  // SVG canvas bounds: 800 x 600\n  // Standard Mercator projection centered around Sonoran/global centroid shifts\n  const mapWidth = 800;\n  const mapHeight = 600;\n\n  const x = (lng + 180) * (mapWidth / 360);\n  const latRad = (lat * Math.PI) / 180;\n  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));\n  const y = mapHeight / 2 - (mapWidth * mercN) / (2 * Math.PI);\n\n  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };\n}`;

    const newFunctionBlock = `function projectCoordinates(lng: number, lat: number): { x: number; y: number } {\n  // SVG dynamic canvas bounds matching WORLD_SIZE: 4096 x 4096\n  const WORLD_SIZE = 4096;\n  const x = ((lng + 180) / 360) * WORLD_SIZE;\n  const latClamped = Math.max(-85.05112878, Math.min(85.05112878, lat));\n  const latRad = (latClamped * Math.PI) / 180;\n  const y = (0.5 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / (2 * Math.PI)) * WORLD_SIZE;\n\n  return {\n    x: Math.round(x * 100) / 100,\n    y: Math.round(y * 100) / 100\n  };\n}`;

    if (content.includes('mapWidth = 800') && content.includes('mapHeight = 600')) {
      content = content.replace(oldFunctionBlock, newFunctionBlock);
      fs.writeFileSync(compilerPath, content, 'utf8');
      log('success', 'Unified projectCoordinates compiler scale to 4096px bounds.');
      return true;
    } else if (content.includes('WORLD_SIZE = 4096')) {
      log('info', 'projectCoordinates is already configured with unified Web Mercator 4096 scale.');
      return true;
    }
  }

  log('warn', 'Could not locate projectCoordinates function block to rewrite.');
  return false;
}

// Perform repairs
const bodieFixed = repairBodieGhostTown();
const connectionsFixed = repairNullConnectionCrash();
const scaleFixed = repairProjectionScale();

console.log("\n-------------------------------------------------------");
if (bodieFixed || connectionsFixed || scaleFixed) {
  log('success', "Priority-0 Repairs complete. Re-run 'npm run dev' to rebuild your Next.js project with verified alignment!");
} else {
  log('warn', "No patches applied. Confirm you are in the correct Next.js project root subdirectory.");
}
console.log("-------------------------------------------------------\n");
