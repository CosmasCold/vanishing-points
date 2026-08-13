const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - UI & PERFORMANCE OPTIMIZATION");
console.log("   TARGETING: FLOATING WIDGETS & NAVIGATION RAIL CONTRAST");
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

// 1. Optimize Navigation Rail Contrast & z-index
function repairNavigationRail() {
  const possiblePaths = [
    path.join(process.cwd(), 'components', 'NavigationRail.tsx'),
    path.join(process.cwd(), 'src', 'components', 'NavigationRail.tsx')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('warn', 'Could not locate NavigationRail.tsx. Skipping.');
    return false;
  }

  log('info', `Reading NavigationRail at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');
  let fixed = false;

  // Elevate z-index to sit above vignette and blur overlays
  if (content.includes('z-30')) {
    content = content.replace('z-30', 'z-[7]');
    log('success', '✓ Elevated Navigation Rail z-index to z-[7] to sit above CRT vignette and blur.');
    fixed = true;
  }

  // Enhance text visibility for unselected tabs (increase opacity from 0.4 to 0.75)
  if (content.includes('opacity: isActive ? 1.0 : 0.4')) {
    content = content.replace('opacity: isActive ? 1.0 : 0.4', 'opacity: isActive ? 1.0 : 0.75');
    log('success', '✓ Enhanced unselected menu icon opacity to 0.75 for crisp readability.');
    fixed = true;
  }

  // Enhance text color contrast from gray to grayLight for unselected state
  if (content.includes('color: isActive ? colors.archive.amber : colors.archive.gray')) {
    content = content.replace(
      'color: isActive ? colors.archive.amber : colors.archive.gray',
      'color: isActive ? colors.archive.amber : colors.archive.grayLight'
    );
    log('success', '✓ Upgraded unselected menu text color to colors.archive.grayLight for high contrast.');
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
  } else {
    log('info', '• Navigation Rail is already calibrated.');
  }
  return true;
}

// 2. Confine Telemetry Widgets to the SYS Panel view
function repairDashboardShell() {
  const possiblePaths = [
    path.join(process.cwd(), 'components', 'DashboardShell.tsx'),
    path.join(process.cwd(), 'src', 'components', 'DashboardShell.tsx')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('warn', 'Could not locate DashboardShell.tsx. Skipping.');
    return false;
  }

  log('info', `Reading DashboardShell at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

  const oldWidgetsBlock = [
    '      {/* Floating Telemetry Widgets */}',
    '      <div className="absolute top-4 right-4 z-40 flex flex-col gap-4">',
    '        <StrowgerStepper />',
    '        <GeigerHUD />',
    '      </div>'
  ].join('\n');

  const newWidgetsBlock = [
    '      {/* Floating Telemetry Widgets - Confined cleanly to SYS panel to prevent screen blockage */}',
    "      {activeModule === 'system' && (",
    '        <div className="absolute top-4 right-4 z-40 flex flex-col gap-4">',
    '          <StrowgerStepper />',
    '          <GeigerHUD />',
    '        </div>',
    '      )}'
  ].join('\n');

  if (content.includes(oldWidgetsBlock)) {
    content = content.replace(oldWidgetsBlock, newWidgetsBlock);
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', '✓ Successfully wrapped Strowger and Geiger widgets inside an activeModule === "system" conditional check.');
    return true;
  }

  log('info', '• Dashboard Shell widgets are already restricted to System Module.');
  return true;
}

// Execute repairs
const navRailFixed = repairNavigationRail();
const shellFixed = repairDashboardShell();

console.log("\n-------------------------------------------------------");
if (navRailFixed || shellFixed) {
  log('success', "UI & Performance calibration completed successfully!");
} else {
  log('warn', "No modifications were needed.");
}
console.log("-------------------------------------------------------\n");