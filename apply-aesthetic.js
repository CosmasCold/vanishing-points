const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- GENERAL RECOVERY");
console.log("  SYSTEM-7B MAP WORKSTATION RECOVERY: HARDWARE GRAPHICS COLLISION REPAIR");
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

// 1. Repair AtlasMap.tsx GPU Compositing / SVG Filter Collision (The Split-Pane Quadrants)
function patchAtlasMap() {
  const mapPath = findFile('AtlasMap.tsx', ['components', 'atlas']) || findFile('AtlasMap.tsx', ['components']);
  if (!mapPath) {
    log('error', "Could not locate 'AtlasMap.tsx' in your standard directories.");
    return false;
  }

  log('info', `Located AtlasMap.tsx at: ${mapPath}`);
  let content = fs.readFileSync(mapPath, 'utf8').replace(/\r\n/g, '\n');
  let fixed = false;

  // Change translate3d back to standard 2D translate
  // This solves the fatal browser bug where 3D hardware-accelerated layers (translate3d)
  // rendered under an active SVG CSS filter (crt-lens-curvature) fragment into quadrants (Screenshot 2)
  const oldTranslate3dSync = "translate3d(${transform.x}px, ${transform.y}px, 0px)";
  const oldTranslate3dMove = "translate3d(${dx}px, ${dy}px, 0px)";
  
  if (content.includes(oldTranslate3dSync) || content.includes(oldTranslate3dMove)) {
    content = content.replace(/translate3d\(([^,]+),\s*([^,]+),\s*0px\)/g, 'translate($1, $2)');
    log('success', "✓ Reverted 3D-composite 'translate3d' back to safe, filter-compatible 2D 'translate'.");
    fixed = true;
  } else {
    // Check if there are other translate3d matches to clean up
    if (content.includes('translate3d')) {
      content = content.replace(/translate3d\(([^,]+),\s*([^,]+),\s*0px\)/g, 'translate($1, $2)');
      log('success', "✓ Cleaned up custom unescaped translate3d loops inside map rendering ref.");
      fixed = true;
    }
  }

  if (fixed) {
    fs.writeFileSync(mapPath, content, 'utf8');
    log('success', "✓ Saved Atlas Map hardware rendering repairs!");
  } else {
    log('info', "• Atlas Map transforms already set to safe 2D paint modes.");
  }
  return true;
}

// 2. Repair CRTOverlay.tsx Layout Spacing & Filter Edge Boundaries (The Dark Center Box & Clipping)
function patchCRTOverlay() {
  const crtPath = findFile('CRTOverlay.tsx', ['components']) || findFile('CRTOverlay.tsx', ['components', 'effects']) || findFile('CRTOverlay.tsx', ['src', 'components']);
  if (!crtPath) {
    log('warn', "Could not locate 'CRTOverlay.tsx' in your standard directories. Skipping CRT optimization.");
    return false;
  }

  log('info', `Located CRTOverlay.tsx at: ${crtPath}`);
  let content = fs.readFileSync(crtPath, 'utf8').replace(/\r\n/g, '\n');
  let fixed = false;

  // A. Hide the raw SVG filter element from the document layout flow
  // If the enclosing <svg> element does not have absolute sizing and hidden overflow,
  // the browser defaults to rendering a blank 300x150 block in the page layout (the dark rectangle in Screenshot 1!)
  const rawSvgRegex = /<svg\s*>/;
  const hiddenSvgTag = '<svg className="absolute pointer-events-none w-0 h-0 opacity-0 overflow-hidden" width="0" height="0" style={{ position: "absolute", zIndex: -9999 }}>';
  
  if (rawSvgRegex.test(content)) {
    content = content.replace(rawSvgRegex, hiddenSvgTag);
    log('success', "✓ Sealed raw SVG filter tag: removed from document flow to dissolve the central dark layout box.");
    fixed = true;
  } else if (content.includes('<svg') && !content.includes('opacity-0')) {
    // Custom SVG tags present, let's inject absolute hidden styles
    const anySvgRegex = /<svg([^>]*?)>/;
    content = content.replace(anySvgRegex, (match, attrs) => {
      if (attrs.includes('crt-lens-curvature') || content.includes('crt-lens-curvature')) {
        return `<svg className="absolute pointer-events-none w-0 h-0 opacity-0 overflow-hidden" width="0" height="0" style={{ position: "absolute", zIndex: -9999 }} ${attrs}>`;
      }
      return match;
    });
    log('success', "✓ Hidden existing SVG wrapper tags in CRT overlay module.");
    fixed = true;
  }

  // B. Expand filter boundaries to prevent edge-clipping splits
  // Default SVG filters clip target contents precisely at their boundaries. Setting wide bounds prevents clipping lines.
  const narrowFilter = '<filter id="crt-lens-curvature">';
  const wideFilter = '<filter id="crt-lens-curvature" x="-20%" y="-20%" width="140%" height="140%">';
  if (content.includes(narrowFilter)) {
    content = content.replace(narrowFilter, wideFilter);
    log('success', "✓ Expanded crt-lens-curvature bounding boundaries to 140% to secure edge compositions.");
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(crtPath, content, 'utf8');
    log('success', "✓ Saved CRT Overlay layout optimizations!");
  } else {
    log('info', "• CRT Overlay is already optimized and hidden from flow.");
  }
  return true;
}

// Execute Recovery
const mapDone = patchAtlasMap();
const crtDone = patchCRTOverlay();

console.log("\n--------------------------------------------------------------------");
if (mapDone || crtDone) {
  log('success', "EMERGENCY GRAPHICS RE-ALIGNMENT PROTOCOL SUCCESSFULLY COMPLETED!");
  log('info', "Deploy the script, execute 'node fix-atlas-crashing-v3.js', and restart your Next.js server.");
} else {
  log('warn', "No modifications were necessary. Alignment matrices appear clear.");
}
console.log("--------------------------------------------------------------------\n");
