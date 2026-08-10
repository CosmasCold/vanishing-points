const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  switch (type) {
    case 'success':
      console.log(`${colors.green}✔ ${message}${colors.reset}`);
      break;
    case 'warn':
      console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
      break;
    case 'error':
      console.error(`${colors.red}✘ ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
      break;
    default:
      console.log(message);
  }
}

/**
 * REPAIR 1: Fix the Bodie Ghost Town progression lock
 * Path: data/places.ts (or data/places.json if compiled)
 */
function repairBodieGhostTown() {
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'places.ts'),
    path.join(process.cwd(), 'data', 'places.json')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate data/places.ts or data/places.json in the current working directory. Please ensure you are running this from your project root.');
    return false;
  }

  log('info', `Reading places database at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  if (targetPath.endsWith('.json')) {
    try {
      const places = JSON.parse(content);
      const bodie = places.find(p => p.slug === 'bodie-ghost-town');
      if (bodie) {
        if (bodie.tier === 3 || bodie.unlockCondition) {
          bodie.tier = 0;
          bodie.unlockCondition = null; // Removed lock for Act I tutorial
          fs.writeFileSync(targetPath, JSON.stringify(places, null, 2), 'utf8');
          log('success', 'Successfully corrected "bodie-ghost-town" to Tier 0 and removed its unlockCondition in places.json.');
          return true;
        } else {
          log('info', '"bodie-ghost-town" is already configured as Tier 0 with no unlockCondition.');
          return true;
        }
      }
    } catch (e) {
      log('error', `Failed to parse places.json: ${e.message}`);
    }
  } else if (targetPath.endsWith('.ts')) {
    const indexOfBodie = content.indexOf('"slug": "bodie-ghost-town"');
    if (indexOfBodie !== -1) {
      let startIdx = content.lastIndexOf('{', indexOfBodie);
      let endIdx = content.indexOf('}', indexOfBodie);
      
      if (startIdx !== -1 && endIdx !== -1) {
        let objectStr = content.slice(startIdx, endIdx + 1);
        
        let modifiedStr = objectStr
          .replace(/"tier"\s*:\s*\d+/, '"tier": 0')
          .replace(/"unlockCondition"\s*:\s*{[^}]*}/, '"unlockCondition": undefined');
        
        if (modifiedStr.includes('"unlockCondition": undefined')) {
          // clean up
        } else {
          modifiedStr = modifiedStr.replace(/"unlockCondition"\s*:\s*\{[^}]*\},?/, '"unlockCondition": undefined,');
        }

        content = content.slice(0, startIdx) + modifiedStr + content.slice(endIdx + 1);
        fs.writeFileSync(targetPath, content, 'utf8');
        log('success', 'Successfully repaired "bodie-ghost-town" to Tier 0 and unset its unlockCondition in data/places.ts.');
        return true;
      }
    }
  }

  log('warn', 'Could not find "bodie-ghost-town" entry inside places database.');
  return false;
}

/**
 * REPAIR 2: Fix the geodetic triangulation hook slug mismatch
 * Path: hooks/useResonanceTriangulation.ts
 */
function repairTriangulationHook() {
  const targetPath = path.join(process.cwd(), 'hooks', 'useResonanceTriangulation.ts');

  if (!fs.existsSync(targetPath)) {
    log('warn', 'Could not locate hooks/useResonanceTriangulation.ts. Ensure this script is placed in your project root.');
    return false;
  }

  log('info', `Reading triangulation hook at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  const oldAnchors = "['mount-weather', 'cheyenne-mountain', 'raven-rock']";
  const newAnchors = "['mount-weather-emergency-operations-center', 'cheyenne-mountain-complex', 'raven-rock-mountain-complex']";

  if (content.includes('mount-weather') && !content.includes('mount-weather-emergency-operations-center')) {
    content = content.replace(
      /requiredAnchors\s*=\s*\[\s*'mount-weather'\s*,\s*'cheyenne-mountain'\s*,\s*'raven-rock'\s*\]/g,
      `requiredAnchors = ${newAnchors}`
    );
    
    content = content.replace(
      "['mount-weather', 'cheyenne-mountain', 'raven-rock']",
      newAnchors
    );

    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', 'Successfully updated useResonanceTriangulation.ts anchors to match database slugs.');
    return true;
  } else if (content.includes('mount-weather-emergency-operations-center')) {
    log('info', 'useResonanceTriangulation.ts is already configured with correct canonical slugs.');
    return true;
  }

  log('warn', 'Could not find the expected "requiredAnchors" line inside hooks/useResonanceTriangulation.ts.');
  return false;
}

// Execution Block
console.log(`${colors.bright}${colors.cyan}--- Vanishing Points System Repair Tool ---${colors.reset}\n`);
const bodieRepaired = repairBodieGhostTown();
const triangulationRepaired = repairTriangulationHook();

console.log('');
if (bodieRepaired || triangulationRepaired) {
  log('success', 'Repair process completed. Please run "npm run dev" to verify your state updates.');
} else {
  log('warn', 'No modifications were applied. Ensure this script is executed inside your local project root folder.');
}
