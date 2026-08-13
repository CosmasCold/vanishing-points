const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- EXTREME RECOVERY");
console.log("  SYSTEM-7B MAP WORKSTATION RECOVERY: MULTI-LINE ATLAS STABILIZER");
console.log("====================================================================\n");

function log(status, msg) {
  const colors = {
    info: '\x1b[36m[INFO]\x1b[0m',
    success: '\x1b[32m[SUCCESS]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m'
  };
  console.log(`${colors[status] || '[LOG]'} ${msg}`);
}

const rootDir = process.cwd();

// Helper to locate files robustly
function findFile(filename, subdirs = []) {
  const paths = [
    path.join(rootDir, ...subdirs, filename),
    path.join(rootDir, 'src', ...subdirs, filename),
    path.join(rootDir, 'components', 'atlas', filename),
    path.join(rootDir, 'src', 'components', 'atlas', filename)
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function patchAtlasMap() {
  const mapPath = findFile('AtlasMap.tsx', ['components', 'atlas']) || findFile('AtlasMap.tsx', ['components']);
  if (!mapPath) {
    log('error', "Could not locate 'AtlasMap.tsx' in your Next.js directory tree.");
    return false;
  }

  log('info', `Located AtlasMap.tsx at: ${mapPath}`);
  let content = fs.readFileSync(mapPath, 'utf8').replace(/\r\n/g, '\n');
  let fixed = false;

  // Pattern 1: useEffect synchronization block
  const effectPattern = /(useEffect\s*\(\s*\(\s*\)\s*=>\s*\{\s*transformRef\.current\s*=\s*transform;\s*if\s*\(\s*mapContentRef\.current\s*\)\s*\{)[\s\S]*?(\}\s*\},?\s*\[\s*transform\s*\]\s*\);?)/g;
  const cleanEffectBody = "\n      mapContentRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;\n    ";

  if (effectPattern.test(content)) {
    effectPattern.lastIndex = 0;
    content = content.replace(effectPattern, (match, prefix, suffix) => {
      log('success', "✓ Located and stabilized useEffect coordinate synchronization block.");
      fixed = true;
      return prefix + cleanEffectBody + suffix;
    });
  }

  // Pattern 2: handleMouseMove direct DOM write block
  const mousemovePattern = /(const\s+handleMouseMove\s*=\s*\([^)]*?\)\s*=>\s*\{[\s\S]*?if\s*\(\s*mapContentRef\.current\s*\)\s*\{)[\s\S]*?(\}\s*\};?)/g;
  const cleanMouseMoveBody = "\n      mapContentRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${transformRef.current.k})`;\n    ";

  if (mousemovePattern.test(content)) {
    mousemovePattern.lastIndex = 0;
    content = content.replace(mousemovePattern, (match, prefix, suffix) => {
      log('success', "✓ Located and stabilized handleMouseMove drag deflection loops.");
      fixed = true;
      return prefix + cleanMouseMoveBody + suffix;
    });
  }

  if (fixed) {
    fs.writeFileSync(mapPath, content, 'utf8');
    log('success', "✓ Saved all Atlas Map direct-DOM transform updates successfully!");
    return true;
  } else {
    log('warn', "• Atlas Map did not match standard search blocks or was already fully stabilized.");
    return false;
  }
}

const mapFixed = patchAtlasMap();

console.log("\n--------------------------------------------------------------------");
if (mapFixed) {
  log('success', "EMERGENCY SYSTEM CALIBRATION COMPLETED!");
  log('info', "Execute 'node fix-atlas-crashing-v5.js' locally on your workstation.");
} else {
  log('warn', "No modifications were necessary. The map file appears healthy.");
}
console.log("--------------------------------------------------------------------\n");
