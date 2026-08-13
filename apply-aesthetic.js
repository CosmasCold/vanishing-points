const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- EXTREME RECOVERY");
console.log("  SYSTEM-7B MAP WORKSTATION RECOVERY: MOUSEMOVE VARIABLE RESTORATION");
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

  // Pattern 1: Find the broken handleMouseMove block where variables 'dx' and 'dy' are missing
  const brokenMouseMoveRegex = /const\s+handleMouseMove\s*=\s*\([^)]*?\)\s*=>\s*\{[\s\S]*?if\s*\(\s*mapContentRef\.current\s*\)\s*\{[\s\S]*?\}\s*\};?/g;

  const restoredMouseMoveBlock = `const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    // Bypasses React state updates during active pan/drag to run fluidly at 60fps
    transformRef.current.x = dx;
    transformRef.current.y = dy;
    if (mapContentRef.current) {
      mapContentRef.current.style.transform = \`translate(\${dx}px, \${dy}px) scale(\${transformRef.current.k})\`;
    }
  };`;

  if (brokenMouseMoveRegex.test(content)) {
    content = content.replace(brokenMouseMoveRegex, restoredMouseMoveBlock);
    log('success', "✓ Successfully restored missing variable definitions ('dx', 'dy') inside handleMouseMove.");
    fixed = true;
  }

  // Double check that we don't have any split syntax left in useEffect block
  const brokenEffectPattern = /style\.transform\s*=\s*`translate3d\(([^,]+),\s*([^,]+),\s*0px\)`\s*;\s*scale\(([^)]+)\);/g;
  if (brokenEffectPattern.test(content)) {
    content = content.replace(brokenEffectPattern, "style.transform = `translate($1, $2) scale($3)`;");
    log('success', "✓ Cleaned up any dangling split statements inside transform assignments.");
    fixed = true;
  }

  // Guarantee useEffect block is also standard 2D and perfectly compiled-safe
  const brokenUseEffectRegex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{\s*transformRef\.current\s*=\s*transform;\s*if\s*\(\s*mapContentRef\.current\s*\)\s*\{[\s\S]*?\}\s*\},?\s*\[\s*transform\s*\]\s*\);?/g;
  const restoredUseEffectBlock = `useEffect(() => {
    transformRef.current = transform;
    if (mapContentRef.current) {
      mapContentRef.current.style.transform = \`translate(\${transform.x}px, \${transform.y}px) scale(\${transform.k})\`;
    }
  }, [transform]);`;

  if (restoredUseEffectBlock && brokenUseEffectRegex.test(content)) {
    content = content.replace(brokenUseEffectRegex, restoredUseEffectBlock);
    log('success', "✓ Unified useEffect coordinate synchronization logic.");
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(mapPath, content, 'utf8');
    log('success', "✓ Saved all Atlas Map direct-DOM transform updates successfully!");
    return true;
  } else {
    log('warn', "• Atlas Map already has robust variable tracking or did not match broken templates.");
    return false;
  }
}

const mapFixed = patchAtlasMap();

console.log("\n--------------------------------------------------------------------");
if (mapFixed) {
  log('success', "EMERGENCY SYSTEM CALIBRATION COMPLETED!");
  log('info', "Execute 'node fix-atlas-crashing-v6.js' locally on your workstation.");
} else {
  log('warn', "No modifications were necessary. The map file appears healthy.");
}
console.log("--------------------------------------------------------------------\n");
