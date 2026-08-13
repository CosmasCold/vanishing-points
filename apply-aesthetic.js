const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- EXTREME RECOVERY");
console.log("  SYSTEM-7B MAP WORKSTATION CALIBRATION: BULLETPROOF ATLAS REPAIR");
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

  // Print existing transform assignments for visibility before making any modifications
  log('info', "Scanning existing style.transform alignments inside file...");
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('style.transform')) {
      log('info', `[Line ${i + 1}] -> ${line.trim()}`);
    }
  });

  // Extremely robust regex that matches translate3d(...) followed optionally by scale(...) 
  // It handles double quotes, single quotes, backticks, or complete absence of quotes!
  const transformRegex = /mapContentRef\.current\.style\.transform\s*=\s*(['"`]?)(translate(?:3d)?\([^;]+?\)(?:\s*scale\([^;]+?\))?)\1;?/g;

  if (transformRegex.test(content)) {
    // Reset regex index for safe replacement
    transformRegex.lastIndex = 0;
    
    content = content.replace(transformRegex, (match, quote, expr) => {
      const cleanExpr = expr.trim().replace(/^['"`]/, '').replace(/['"`]$/, '');
      const replacement = `mapContentRef.current.style.transform = \`${cleanExpr}\`;`;
      log('success', `✓ Surgically normalized: \`${cleanExpr}\` to safe backticks.`);
      fixed = true;
      return replacement;
    });
  }

  if (fixed) {
    fs.writeFileSync(mapPath, content, 'utf8');
    log('success', "✓ Saved all Atlas Map direct-DOM transform updates successfully!");
    return true;
  } else {
    log('warn', "Could not match translate3d templates. Checking for other syntax patterns...");
    return false;
  }
}

const mapFixed = patchAtlasMap();

console.log("\n--------------------------------------------------------------------");
if (mapFixed) {
  log('success', "EMERGENCY SYSTEM CALIBRATION COMPLETED!");
  log('info', "Run 'node fix-atlas-crashing-v2.js' locally on your workstation.");
} else {
  log('warn', "Atlas Map is already fully patched or did not match alignment vectors.");
}
console.log("--------------------------------------------------------------------\n");
