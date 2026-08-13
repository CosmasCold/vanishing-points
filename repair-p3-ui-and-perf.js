const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE REPAIR PROTOCOL // LEVEL-4 UTILITY");
console.log("   TARGETING: PRIORITY-3 UI POLISH & PERF OPTIMIZATIONS (v2)");
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

// Support mock path testing if running via our test script
const rootDir = process.env.TEST_MOCK_PROJECT ? path.join(__dirname, 'mock_project') : process.cwd();

/**
 * REPAIR 01: Optimize Navigation Rail Contrast & z-index
 */
function repairNavigationRail() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'NavigationRail.tsx'),
    path.join(rootDir, 'src', 'components', 'NavigationRail.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate NavigationRail.tsx. Skipping.');
    return false;
  }

  log('info', `Reading NavigationRail at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  // Normalize Windows line-endings
  content = content.replace(/\r\n/g, '\n');

  let fixed = false;

  // 1. Elevate z-index to sit above vignette and blur overlays
  if (content.includes('z-30')) {
    content = content.replace('z-30', 'z-[61]');
    log('success', 'Elevated Navigation Rail z-index to z-[61] to sit above CRT vignette and blur.');
    fixed = true;
  }

  // 2. Enhance text visibility for unselected tabs (increase opacity from 0.4/0.5 to 0.75)
  if (content.includes('opacity: isActive ? 1.0 : 0.4') || content.includes('opacity: isActive ? 1 : 0.4')) {
    content = content.replace('opacity: isActive ? 1.0 : 0.4', 'opacity: isActive ? 1.0 : 0.75');
    content = content.replace('opacity: isActive ? 1 : 0.4', 'opacity: isActive ? 1 : 0.75');
    log('success', 'Enhanced unselected menu icon opacity to 0.75 for crisp readability.');
    fixed = true;
  }

  // 3. Enhance text color contrast from gray to grayLight for unselected state
  if (content.includes('colors.archive.gray') && !content.includes('colors.archive.grayLight /* active shadow */')) {
    // Replace unselected color with grayLight
    content = content.replace(
      'color: isActive ? colors.archive.amber : colors.archive.gray',
      'color: isActive ? colors.archive.amber : colors.archive.grayLight'
    );
    log('success', 'Upgraded unselected menu text color to colors.archive.grayLight for high-contrast visibility.');
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
  } else {
    log('info', 'Navigation Rail is already calibrated.');
  }

  return true;
}

/**
 * REPAIR 02: Confine Telemetry Widgets to the SYS Panel view
 */
function repairDashboardShell() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'DashboardShell.tsx'),
    path.join(rootDir, 'src', 'components', 'DashboardShell.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate DashboardShell.tsx. Skipping.');
    return false;
  }

  log('info', `Reading DashboardShell at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  content = content.replace(/\r\n/g, '\n');

  // Define the target overlay widgets block
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
    log('success', 'Successfully wrapped Strowger and Geiger widgets inside an activeModule === "system" conditional check.');
    return true;
  }

  log('info', 'Dashboard Shell widgets are already restricted to System Module or already updated.');
  return true;
}

/**
 * REPAIR 03: Optimize AtlasMap.tsx for Zero-Lag GPU direct translation
 */
function repairAtlasMap() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'atlas', 'AtlasMap.tsx'),
    path.join(rootDir, 'src', 'components', 'atlas', 'AtlasMap.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate AtlasMap.tsx. Skipping.');
    return false;
  }

  log('info', `Reading AtlasMap at: ${targetPath}`);  let content = fs.readFileSync(targetPath, 'utf8');

  content = content.replace(/\r\n/g, '\n');

  let fixed = false;

  // 1. Replace the render-blocking useEffect with a direct GPU hardware translation effect
  const oldEffect = [
    '  useEffect(() => {',
    '    transformRef.current = transform;',
    '    if (mapContentRef.current) {',
    '      mapContentRef.current.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;',
    '    }',
    '  }, [transform]);'
  ].join('\n');

  const newEffect = [
    '  useEffect(() => {',
    '    transformRef.current = transform;',
    '    if (mapContentRef.current) {',
    '      // Use hardware accelerated translate3d to bypass virtual DOM paints and offload to GPU compositor',
    '      mapContentRef.current.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0px) scale(${transform.k})`;',
    '    }',
    '  }, [transform]);'
  ].join('\n');

  if (content.includes(oldEffect)) {
    content = content.replace(oldEffect, newEffect);
    log('success', 'Upgraded Atlas Map transform syncing to hardware-accelerated translate3d.');
    fixed = true;
  }

  // 2. Optimize handleMouseMove to do zero-re-render direct DOM writes during drag, syncing to state ONLY on mouseup
  const oldMouseMove = [
    '  const handleMouseMove = (e: React.MouseEvent) => {',
    '    if (!isDragging) return;',
    '    const dx = e.clientX - dragStart.current.x;',
    '    const dy = e.clientY - dragStart.current.y;',
    '    setTransform({ x: dx, y: dy, k: transformRef.current.k });',
    '  };'
  ].join('\n');

  const newMouseMove = [
    '  const handleMouseMove = (e: React.MouseEvent) => {',
    '    if (!isDragging) return;',
    '    const dx = e.clientX - dragStart.current.x;',
    '    const dy = e.clientY - dragStart.current.y;',
    '    ',
    '    // Bypasses React state updates during active pan/drag to run fluidly at 60fps',
    '    transformRef.current.x = dx;',
    '    transformRef.current.y = dy;',
    '    if (mapContentRef.current) {',
    '      mapContentRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0px) scale(${transformRef.current.k})`;',
    '    }',
    '  };'
  ].join('\n');

  // Let's also verify handleMouseUp updates the state at the end of the gesture
  const oldMouseUp = [
    '  const handleMouseUp = () => {',
    '    setIsDragging(false);',
    '  };'
  ].join('\n');

  const newMouseUp = [
    '  const handleMouseUp = () => {',
    '    setIsDragging(false);',
    '    // Sync coordinates back to React state only at the end of the panning gesture',
    '    setTransform({ ...transformRef.current });',
    '  };'
  ].join('\n');

  if (content.includes(oldMouseMove)) {
    content = content.replace(oldMouseMove, newMouseMove);
    log('success', 'Optimized handleMouseMove to write directly to DOM styles at 0% React render overhead.');
    fixed = true;
  }

  if (content.includes(oldMouseUp)) {
    content = content.replace(oldMouseUp, newMouseUp);
    log('success', 'Configured handleMouseUp to cleanly persist gestured map coordinates to state on drag release.');
    fixed = true;
  }

  // 3. Inject CSS hardware transition layers hint
  if (content.includes('<g ref={mapContentRef} style={{ transformOrigin: "0px 0px" }}>')) {
    content = content.replace(
      '<g ref={mapContentRef} style={{ transformOrigin: "0px 0px" }}>',
      '<g ref={mapContentRef} style={{ transformOrigin: "0px 0px", willChange: "transform" }}>'
    );
    log('success', 'Injected \"willChange: transform\" rendering hint to SVG map layer.');
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
  } else {
    log('info', 'AtlasMap rendering layers are already optimized.');
  }

  return true;
}

/**
 * REPAIR 04: Optimize EvidenceBoard.tsx felt canvas and edge rendering (Idempotent V2)
 */
function repairEvidenceBoard() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
    path.join(rootDir, 'components', 'evidence', 'EvidenceBoard.tsx'),
    path.join(rootDir, 'components', 'EvidenceBoard.tsx'),
    path.join(rootDir, 'src', 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
    path.join(rootDir, 'src', 'components', 'evidence', 'EvidenceBoard.tsx'),
    path.join(rootDir, 'src', 'components', 'EvidenceBoard.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate EvidenceBoard.tsx. Skipping.');
    return false;
  }

  log('info', `Reading EvidenceBoard at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  content = content.replace(/\r\n/g, '\n');

  let fixed = false;

  // STEP 0: Revert previous buggy duplicate-attribute replacement if it exists
  const brokenPattern = '<ReactFlow\n        onlyRenderVisibleElements={true}\n        minZoom={0.25}\n        maxZoom={2.0}';
  if (content.includes(brokenPattern)) {
    log('info', 'Detected previous duplicate zoom attributes. Reverting and self-healing EvidenceBoard.tsx...');
    content = content.replace(brokenPattern, '<ReactFlow');
    fixed = true;
  }

  // STEP 1: Enable React Flow rendering optimization gates and adjust zoom bounds safely (no duplication)
  if (content.includes('<ReactFlow') && !content.includes('onlyRenderVisibleElements')) {
    // Insert onlyRenderVisibleElements={true} directly into the <ReactFlow tag opening
    content = content.replace(
      '<ReactFlow',
      '<ReactFlow\n        onlyRenderVisibleElements={true}'
    );
    
    // Safely update minZoom and maxZoom values inline instead of appending to prevent duplicate attribute JSX syntax errors
    content = content.replace(/maxZoom=\{[0-9.]+\}/g, 'maxZoom={2.0}');
    content = content.replace(/minZoom=\{[0-9.]+\}/g, 'minZoom={0.25}');
    
    log('success', 'Enabled onlyRenderVisibleElements and updated strict zoom bounds inside EvidenceBoard without duplication.');
    fixed = true;
  }

  // STEP 2: Replace costly high-radius SVG blur shadows inside RedWoolStringEdge with vector-native translucent outlines
  const oldEdgeShadow = [
    '      {/* Double-offset deep blurred drop-shadow (GPU composited) */}',
    '      <path',
    '        d={path}',
    '        fill="none"',
    "        stroke=\"rgba(0, 0, 0, 0.75)\"",
    '        strokeWidth={5}',
    '        strokeLinecap="round"',
    '        className="transition-opacity duration-300"',
    '        style={{',
    "          filter: 'blur(4px)',",
    "          transform: 'translate(4px, 14px)', // Physical offset simulating distance from felt backdrop",
    '          pointerEvents: \'none\',',
    '        }}',
    '      />'
  ].join('\n');

  const newEdgeShadow = [
    '      {/* Double-offset optimized drop-shadow using vector rendering instead of expensive blur filter */}',
    '      <path',
    '        d={path}',
    '        fill="none"',
    "        stroke=\"rgba(0, 0, 0, 0.16)\"",
    '        strokeWidth={7}',
    '        strokeLinecap="round"',
    '        className="transition-opacity duration-300"',
    '        style={{',
    "          transform: 'translate(3px, 9px)', // Physical offset simulating distance from felt backdrop",
    '          pointerEvents: \'none\',',
    '        }}',
    '      />'
  ].join('\n');

  // Let's also check for a slightly shorter style sequence used in other versions of the mock/real edge
  const alternateOldShadow = "filter: 'blur(4px)',\n          transform: 'translate(4px, 14px)',";
  const alternateNewShadow = "transform: 'translate(3px, 9px)',";

  if (content.includes(oldEdgeShadow)) {
    content = content.replace(oldEdgeShadow, newEdgeShadow);
    log('success', 'Replaced heavy filter: "blur()" edge shadow with high-performance vector-drawn drop-shadow.');
    fixed = true;
  } else if (content.includes(alternateOldShadow)) {
    content = content.replace(alternateOldShadow, alternateNewShadow);
    log('success', 'Replaced heavy SVG blur filters with native translated vector offsets inside custom edge.');
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
  } else {
    log('info', 'EvidenceBoard felt-mesh viewport already performance-optimized.');
  }

  return true;
}

// Perform audits
const navRailFixed = repairNavigationRail();
const shellFixed = repairDashboardShell();
const mapFixed = repairAtlasMap();
const boardFixed = repairEvidenceBoard();

console.log("\n-------------------------------------------------------");
if (navRailFixed || shellFixed || mapFixed || boardFixed) {
  log('success', "Priority-3 UI & Performance calibration completed successfully!");
} else {
  log('warn', "No modifications applied. Confirm file paths.");
}
console.log("-------------------------------------------------------\n");
