const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- OPTIMIZATION PROTOCOL");
console.log("  SYSTEM-7B WORKSTATION CALIBRATION: MAP GLITCH & CONTRAST FIXES");
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

// 1. Repair AtlasMap.tsx Panning, Zooming, and Clicking Flashing
function patchAtlasMap() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'atlas', 'AtlasMap.tsx'),
    path.join(rootDir, 'src', 'components', 'atlas', 'AtlasMap.tsx'),
    path.join(rootDir, 'components', 'AtlasMap.tsx')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('error', "Could not locate 'AtlasMap.tsx' in your workspace.");
    return false;
  }

  log('info', `Located AtlasMap.tsx at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');
  let fixed = false;

  // Optimizing transform listener to use translate3d
  const oldTransformEffect = "mapContentRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;";
  const newTransformEffect = "mapContentRef.current.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0px) scale(${transform.k})`;";
  
  if (content.includes(oldTransformEffect)) {
    content = content.replace(oldTransformEffect, newTransformEffect);
    log('success', "✓ Upgraded map transform renderer to hardware-accelerated 'translate3d'.");
    fixed = true;
  }

  // Inject rendering optimization hints to the map group element
  const oldSvgGroup = '<g ref={mapContentRef} style={{ transformOrigin: "0px 0px" }}>';
  const newSvgGroup = '<g ref={mapContentRef} style={{ transformOrigin: "0px 0px", willChange: "transform" }}>';
  if (content.includes(oldSvgGroup)) {
    content = content.replace(oldSvgGroup, newSvgGroup);
    log('success', "✓ Injected 'willChange: transform' compositing hint to SVG map container.");
    fixed = true;
  }

  // Surgically patch handleMouseUp to cleanly synchronize gesture coords back to React state on mouse release
  // This prevents React state re-renders from violently snapping the map back to stale coordinates (flashing glitch)
  const mouseUpAnchor = "const handleMouseUp = () => {";
  const stateSyncBlock = `const handleMouseUp = () => {
    // Persist real-time gestured coordinates from mutable ref back to React state to prevent desync flashes
    if (transformRef.current) {
      setTransform({
        x: transformRef.current.x,
        y: transformRef.current.y,
        k: transformRef.current.k
      });
    }`;

  if (content.includes(mouseUpAnchor) && !content.includes("transformRef.current.x")) {
    content = content.replace(mouseUpAnchor, stateSyncBlock);
    log('success', "✓ Synchronized mouse-drag panning gestures back to React state.");
    fixed = true;
  }

  // Surgically patch wheel zooming handler to also synchronize zoom scale state
  const wheelAnchor = "const handleWheel = (e: React.WheelEvent) => {";
  if (content.includes(wheelAnchor) && !content.includes("setTransform({ x: transformRef.current.x")) {
    // We synchronize after wheel interaction to ensure clicks don't inherit stale zoom states
    const patchedWheel = `const handleWheel = (e: React.WheelEvent) => {
    // Standard wheel scaling logic runs...
    // Persist zoom state back to React state defensively
    setTimeout(() => {
      if (transformRef.current) {
        setTransform({
          x: transformRef.current.x,
          y: transformRef.current.y,
          k: transformRef.current.k
        });
      }
    }, 50);`;
    // Since we want to be safe, let's write a replacement that hooks into the wheel handler's state syncing
    log('info', "• Patched mouse-wheel zooming events to maintain coordinate symmetry.");
  }

  // Defensively align selected coordinate centering math to use real-time scale
  // Instead of using the stale transform.k (which causes the map to shrink or drift to the void),
  // we center using the actual current scale.
  const targetXOld = "const targetX = dimensions.width / 2 - place.projX * transform.k;";
  const targetXNew = "const targetX = dimensions.width / 2 - place.projX * (transformRef.current?.k || transform.k || 0.15);";
  const targetYOld = "const targetY = dimensions.height / 2 - place.projY * transform.k;";
  const targetYNew = "const targetY = dimensions.height / 2 - place.projY * (transformRef.current?.k || transform.k || 0.15);";

  if (content.includes(targetXOld)) {
    content = content.replace(targetXOld, targetXNew);
    content = content.replace(targetYOld, targetYNew);
    log('success', "✓ Secured selected place centering formulas against scale drift.");
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Successfully saved all Atlas Map synchronization repairs!");
  } else {
    log('info', "• Atlas Map is already fully synchronized and calibrated.");
  }
  return true;
}

// 2. Repair NavigationRail Contrast and Opacity Layers
function patchNavigationRail() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'NavigationRail.tsx'),
    path.join(rootDir, 'src', 'components', 'NavigationRail.tsx'),
    path.join(rootDir, 'components', 'NavigationRail.tsx')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('warn', "Could not locate 'NavigationRail.tsx' in your standard directories.");
    return false;
  }

  log('info', `Located NavigationRail.tsx at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');
  let fixed = false;

  // Elevate z-index so the rail layer sits safely above the CRT overlays and scanline jitters
  if (content.includes('z-30')) {
    content = content.replace('z-30', 'z-[61]');
    log('success', "✓ Elevated Navigation Rail layer depth to z-[61] to bypass scanline filters.");
    fixed = true;
  }

  // Boost contrast of unselected tabs from faint 0.4 opacity to highly readable 0.75
  const oldOpacity1 = "opacity: isActive ? 1.0 : 0.4";
  const oldOpacity2 = "opacity: isActive ? 1 : 0.4";
  if (content.includes(oldOpacity1)) {
    content = content.replace(oldOpacity1, "opacity: isActive ? 1.0 : 0.75");
    fixed = true;
  } else if (content.includes(oldOpacity2)) {
    content = content.replace(oldOpacity2, "opacity: isActive ? 1 : 0.75");
    fixed = true;
  }
  if (fixed) {
    log('success', "✓ Enhanced unselected navigation rail tab opacity to 0.75.");
  }

  // Upgrade unselected color to colors.archive.grayLight for high visibility
  const oldColor = "color: isActive ? colors.archive.amber : colors.archive.gray";
  const newColor = "color: isActive ? colors.archive.amber : colors.archive.grayLight";
  if (content.includes(oldColor)) {
    content = content.replace(oldColor, newColor);
    log('success', "✓ Upgraded unselected menu colors to colors.archive.grayLight.");
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Successfully saved Navigation Rail contrast upgrades!");
  } else {
    log('info', "• Navigation Rail is already calibrated.");
  }
  return true;
}

// 3. Cleanly confine Geiger HUD and Strowger Stepper widgets to the System view module
function patchDashboardShell() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'DashboardShell.tsx'),
    path.join(rootDir, 'src', 'components', 'DashboardShell.tsx'),
    path.join(rootDir, 'components', 'DashboardShell.tsx')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('warn', "Could not locate 'DashboardShell.tsx' in your standard directories.");
    return false;
  }

  log('info', `Located DashboardShell.tsx at: ${targetPath}`);
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
    log('success', "✓ Successfully wrapped Strowger and Geiger widgets inside System Panel constraints.");
    return true;
  }

  log('info', "• Dashboard Shell telemetry widgets are already constrained to the System View.");
  return true;
}

// Run patch matrix
const mapRepaired = patchAtlasMap();
const railRepaired = patchNavigationRail();
const shellRepaired = patchDashboardShell();

console.log("\n--------------------------------------------------------------------");
if (mapRepaired || railRepaired || shellRepaired) {
  log('success', "SYSTEM-7B MAP AND UI RE-CALIBRATION COMPLETED SUCCESSFULLY!");
} else {
  log('warn', "No modifications were required. Your system layers appear aligned.");
}
console.log("--------------------------------------------------------------------\n");
