const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B WORKSTATION - ADVANCED AESTHETIC OVERHAUL V5");
console.log("   TARGETING: FLOATING TELEMETRY WIDGET CONFINEMENT [BUGFIX]");
console.log("              NAVIGATION COLUMN SCALE & TYPOGRAPHY READABILITY,");
console.log("              CASE FILE SCREEN CONSOLE WARMTH & BAKELITE DECK");
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

// 1. Bulletproof JSX-targeted order-agnostic container resolution inside DashboardShell.tsx
function patchDashboardShell() {
  const shellPath = findFile('DashboardShell.tsx', ['components']);
  if (!shellPath) {
    log('warn', 'Could not locate DashboardShell.tsx. Skipping widget gating.');
    return false;
  }

  log('info', `Located DashboardShell at: ${shellPath}`);
  let content = fs.readFileSync(shellPath, 'utf8').replace(/\r\n/g, '\n');

  if (content.includes('StrowgerStepper') && content.includes('GeigerHUD')) {
    // Check if the widgets are already conditionalized
    if (content.includes("activeModule === 'system'") || content.includes('activeModule === "system"')) {
      log('info', '• Dashboard Shell floating widgets are already wrapped in system check.');
      return true;
    }

    // Locate indices using exact JSX tag definitions to bypass top-level imports and component declarations!
    const stepperIdx = content.indexOf('<StrowgerStepper');
    const geigerIdx = content.indexOf('<GeigerHUD');

    if (stepperIdx !== -1 && geigerIdx !== -1) {
      // Find the first occurring JSX tag index to trace backwards for the opening <div
      const firstWidgetIdx = Math.min(stepperIdx, geigerIdx);
      const beforeFirst = content.substring(0, firstWidgetIdx);
      const lastDivOpenIdx = beforeFirst.lastIndexOf('<div');

      // Find the second occurring JSX tag index to trace forwards for the closing </div>
      const secondWidgetIdx = Math.max(stepperIdx, geigerIdx);
      const afterSecond = content.substring(secondWidgetIdx);
      const closeDivIdx = afterSecond.indexOf('</div>');

      if (lastDivOpenIdx !== -1 && closeDivIdx !== -1) {
        const absoluteCloseDivIdx = secondWidgetIdx + closeDivIdx + '</div>'.length;
        const fullWidgetBlock = content.substring(lastDivOpenIdx, absoluteCloseDivIdx);

        if (fullWidgetBlock.includes('StrowgerStepper') && 
            fullWidgetBlock.includes('GeigerHUD') && 
            fullWidgetBlock.includes('absolute')) {
          
          const patchedBlock = `{\n      activeModule === 'system' && (\n        ${fullWidgetBlock.trim()}\n      )\n    }`;
          content = content.substring(0, lastDivOpenIdx) + patchedBlock + content.substring(absoluteCloseDivIdx);
          
          fs.writeFileSync(shellPath, content, 'utf8');
          log('success', '✓ Robustly wrapped Geiger and Strowger widgets in activeModule conditional guard (Order-Agnostic JSX Solver!).');
          return true;
        }
      }
    }
    log('warn', 'Could not cleanly resolve container boundaries in DashboardShell.tsx.');
  } else {
    log('info', '• Geiger or Strowger widgets are not active in this shell instance.');
  }
  return false;
}

// 2. Widen Navigation Rail column & establish crisp contrast inside NavigationRail.tsx
function patchNavigationRail() {
  const railPath = findFile('NavigationRail.tsx', ['components']);
  if (!railPath) {
    log('warn', 'Could not locate NavigationRail.tsx. Skipping.');
    return false;
  }

  log('info', `Located NavigationRail at: ${railPath}`);
  let content = fs.readFileSync(railPath, 'utf8').replace(/\r\n/g, '\n');
  let updated = false;

  // Elevate container z-index to sit cleanly above CRT vignetting overlays
  if (content.includes('z-30')) {
    content = content.replace('z-30', 'z-[61]');
    updated = true;
    log('success', '✓ Elevated Navigation Rail z-index to z-[61].');
  }

  // Enhance icon text labels contrast from archive.gray to high-visibility archive.grayLight
  const oldBtnPattern = `color: isActive ? colors.archive.amber : colors.archive.gray`;
  const newBtnPattern = `color: isActive ? colors.archive.amber : colors.archive.grayLight`;
  if (content.includes(oldBtnPattern)) {
    content = content.replace(oldBtnPattern, newBtnPattern);
    updated = true;
    log('success', '✓ Upgraded unselected menu colors to colors.archive.grayLight.');
  }

  // Elevate unselected buttons' opacity from dim 0.4 to clear 0.75
  const oldOpacity1 = 'opacity: isActive ? 1.0 : 0.4';
  const oldOpacity2 = 'opacity: isActive ? 1 : 0.4';
  if (content.includes(oldOpacity1)) {
    content = content.replace(oldOpacity1, 'opacity: isActive ? 1.0 : 0.75');
    updated = true;
  } else if (content.includes(oldOpacity2)) {
    content = content.replace(oldOpacity2, 'opacity: isActive ? 1 : 0.75');
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(railPath, content, 'utf8');
    log('success', '✓ Saved Navigation Rail contrast and layout refinements.');
  } else {
    log('info', '• Navigation Rail is already calibrated.');
  }
  return true;
}

// 3. Apply high-contrast text rendering and layout scaling in global.css
function patchGlobalsCSS() {
  const globalsPath = findFile('globals.css', ['app']);
  if (!globalsPath) {
    log('warn', 'Could not locate globals.css inside app/ directory.');
    return false;
  }

  log('info', `Located globals.css at: ${globalsPath}`);
  let content = fs.readFileSync(globalsPath, 'utf8').replace(/\r\n/g, '\n');
  let updated = false;

  const overridesMarker = '/* CLASSIFIED NAVIGATION OVERRIDES BLOCK V5 */';
  if (!content.includes(overridesMarker)) {
    const overrides = `
${overridesMarker}
/* Adjust navigation columns dynamically */
.fixed.left-0.top-0.bottom-0[style*="spacing.rail"], div[style*="spacing.rail"] {
  width: 4.75rem !important;
}

/* Force text inside buttons of the navigation rail to expand and scale uppercase */
div[style*="spacing.rail"] button span:last-child, .fixed.left-0.top-0.bottom-0 button span:last-child {
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
  opacity: 0.95 !important;
}

/* Ensure icons are beautifully sized */
div[style*="spacing.rail"] button span:first-child, .fixed.left-0.top-0.bottom-0 button span:first-child {
  font-size: 1.4rem !important;
}
`;
    content += overrides;
    fs.writeFileSync(globalsPath, content, 'utf8');
    log('success', '✓ Injected vertical-rail layout and text size overrides to globals.css.');
    updated = true;
  } else {
    log('info', '• CSS overrides already registered.');
  }
  return updated;
}

// Execute Repairs
const shellDone = patchDashboardShell();
const railDone = patchNavigationRail();
const globalsDone = patchGlobalsCSS();

console.log("\n=======================================================");
if (shellDone || railDone || globalsDone) {
  log('success', "Aesthetic calibration successfully integrated!");
} else {
  log('warn', "No modifications were necessary.");
}
console.log("-------------------------------------------------------\n");
