const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- COMPILER FIX");
console.log("  SYSTEM-7B WORKSTATION RECOVERY: DUPLICATE JSX ATTRIBUTES REPAIR");
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
    path.join(rootDir, 'src', ...subdirs, filename)
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function patchCRTOverlay() {
  const crtPath = findFile('CRTOverlay.tsx', ['components']);
  if (!crtPath) {
    log('error', "Could not locate 'CRTOverlay.tsx' in your components folder.");
    return false;
  }

  log('info', `Located CRTOverlay.tsx at: ${crtPath}`);
  let content = fs.readFileSync(crtPath, 'utf8').replace(/\r\n/g, '\n');
  let fixed = false;

  // Pattern matching the line with duplicate className and style attributes
  const brokenSvgPattern = /<svg\s+className="absolute pointer-events-none w-0 h-0 opacity-0 overflow-hidden"\s+width="0"\s+height="0"\s+style=\{\{\s*position:\s*"absolute",\s*zIndex:\s*-9999\s*\}\}\s+className="absolute w-0 h-0 pointer-events-none"\s+style=\{\{\s*visibility:\s*"hidden"\s*\}\}\s+aria-hidden="true"\s*>/;

  const correctedSvgTag = '<svg className="absolute pointer-events-none w-0 h-0 opacity-0 overflow-hidden" width="0" height="0" style={{ position: "absolute", zIndex: -9999, visibility: "hidden" }} aria-hidden="true">';

  if (brokenSvgPattern.test(content)) {
    content = content.replace(brokenSvgPattern, correctedSvgTag);
    log('success', "✓ Purged duplicate className and style attributes from lens-curvature SVG.");
    fixed = true;
  } else {
    // Alternate format check in case spacing differs slightly
    const alternatePattern = /<svg[^>]*crt-lens-curvature[^>]*className=[^>]*className=[^>]*>/;
    // Let's do a more generic search-and-replace for the svg line above defs
    const targetBlockIndex = content.indexOf('filter id="crt-lens-curvature"');
    if (targetBlockIndex !== -1) {
      const beforeFilter = content.substring(0, targetBlockIndex);
      const lastSvgOpenIdx = beforeFilter.lastIndexOf('<svg');
      const firstDefsOpenIdx = content.indexOf('<defs>', targetBlockIndex);
      
      if (lastSvgOpenIdx !== -1 && firstDefsOpenIdx !== -1) {
        log('info', "Using index-fallback resolver to normalize duplicate SVG parameters...");
        content = content.substring(0, lastSvgOpenIdx) + correctedSvgTag + "\n        " + content.substring(firstDefsOpenIdx);
        fixed = true;
      }
    }
  }

  if (fixed) {
    fs.writeFileSync(crtPath, content, 'utf8');
    log('success', "✓ CRTOverlay.tsx compilation issues successfully fixed!");
    return true;
  } else {
    log('warn', "• CRTOverlay.tsx looks clean or already compile-safe.");
    return false;
  }
}

const crtFixed = patchCRTOverlay();

console.log("\n--------------------------------------------------------------------");
if (crtFixed) {
  log('success', "EMERGENCY CRT OVERLAY COMPILER RECOVERY SUCCESSFUL!");
  log('info', "Run your local production build 'npm run build' or deploy on Vercel.");
} else {
  log('warn', "No modifications were required. Your CRT Overlay file appears compile-safe.");
}
console.log("--------------------------------------------------------------------\n");
