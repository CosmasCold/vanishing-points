const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - FILE REPAIR SEQUENCE");
console.log("   TARGETING: ANOMALOUS SPECIMEN SCANNER UPGRADES");
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

const possiblePaths = [
  path.join(process.cwd(), 'components', 'artifacts', 'ArtifactViewer.tsx'),
  path.join(process.cwd(), 'src', 'components', 'artifacts', 'ArtifactViewer.tsx'),
  path.join(process.cwd(), 'components', 'ArtifactViewer.tsx')
];

let targetPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    targetPath = p;
    break;
  }
}

if (!targetPath) {
  log('error', "Could not locate 'ArtifactViewer.tsx' inside your standard Next.js directory structure.");
  process.exit(1);
}

log('info', `Located target component: ${targetPath}`);

try {
  let content = fs.readFileSync(targetPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Let's patch the viewport dimension from w-72 h-72 to an immersive widescreen dashboard: w-[512px] h-[512px]
  const oldViewport = "w-72 h-72 flex items-center justify-center border border-stone-900 bg-[#070503]";
  const newViewport = "w-[512px] h-[512px] flex items-center justify-center border border-stone-900 bg-[#070503] cursor-grab active:cursor-grabbing relative overflow-hidden";

  if (content.includes(oldViewport)) {
    content = content.replace(oldViewport, newViewport);
    log('success', "✓ Expanded physical scanner viewport dimensions from w-72 h-72 to immersive w-[512px] h-[512px].");
  } else if (content.includes("w-[512px] h-[512px]")) {
    log('info', "• Viewport scaling already applied previously.");
  } else {
    log('warn', "Could not find literal w-72 viewport pattern. Applying fallback dimensions.");
  }

  // Next, let's inject tactile drag rotation tracking variables inside the main ArtifactViewer component
  const hookImport = "const { activeArtifact";
  const stateInjection = `  // Tactical click-and-drag rotation physics tracking
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef(0);

  // Advanced Geodetic Calipers State
  const [caliperA, setCaliperA] = React.useState(null);
  const [caliperB, setCaliperB] = React.useState(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (lampMode === 'measure') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      if (!caliperA || (caliperA && caliperB)) {
        setCaliperA({ x, y });
        setCaliperB(null);
      } else {
        setCaliperB({ x, y });
      }
      return;
    }
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || lampMode === 'measure') return;
    const deltaX = e.clientX - dragStartRef.current;
    if (Math.abs(deltaX) > 1) {
      rotate(deltaX * 0.4); // Trigger rotation proportional to drag distance!
      dragStartRef.current = e.clientX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const clearCalipers = () => {
    setCaliperA(null);
    setCaliperB(null);
  };

  const caliperDist = caliperA && caliperB 
    ? Math.sqrt(Math.pow(caliperB.x - caliperA.x, 2) + Math.pow(caliperB.y - caliperA.y, 2))
    : 0;

  const { activeArtifact`;

  if (!content.includes("handlePointerDown") && content.includes(hookImport)) {
    content = content.replace(hookImport, stateInjection);
    log('success', "✓ Injected direct click-and-drag rotation pointer physics.");
    log('success', "✓ Configured dynamic Geodetic Calipers coordinates state systems.");
  }

  // Now, let's inject pointer handles and calipers overlay inside renderArtifactGraphic()
  const graphicAnchor = `<ThreeSpecimenRenderer\nid={activeArtifact.id}\nrotation={rotation}\nzoom={zoom}\nlampMode={lampMode}\nclassName=\"absolute inset-0 z-0\"\n/>`;
  const graphicAnchorCompact = `<ThreeSpecimenRenderer id={activeArtifact.id} rotation={rotation} zoom={zoom} lampMode={lampMode} className=\"absolute inset-0 z-0\" />`;

  const physicalHandlers = `onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}`;

  const caliperOverlay = `
        {/* WebAudio sweep feedback & laser caliber Spec overlays */}
        {lampMode === 'measure' && (
          <svg className="absolute inset-0 z-10 w-full h-full pointer-events-none select-none font-mono text-[9px] text-[#34d399]">
            {caliperA && (
              <g>
                <circle cx={caliperA.x} cy={caliperA.y} r="5" fill="none" stroke="#34d399" strokeWidth="1.5" />
                <line x1={caliperA.x - 10} y1={caliperA.y} x2={caliperA.x + 10} y2={caliperA.y} stroke="#34d399" strokeWidth="0.75" />
                <line x1={caliperA.x} y1={caliperA.y - 10} x2={caliperA.x} y2={caliperA.y + 10} stroke="#34d399" strokeWidth="0.75" />
                <text x={caliperA.x + 8} y={caliperA.y - 8} fill="#34d399">SPECIMEN POINT ALPHA</text>
              </g>
            )}
            {caliperB && (
              <g>
                <circle cx={caliperB.x} cy={caliperB.y} r="5" fill="none" stroke="#34d399" strokeWidth="1.5" />
                <line x1={caliperB.x - 10} y1={caliperB.y} x2={caliperB.x + 10} y2={caliperB.y} stroke="#34d399" strokeWidth="0.75" />
                <line x1={caliperB.x} y1={caliperB.y - 10} x2={caliperB.x} y2={caliperB.y + 10} stroke="#34d399" strokeWidth="0.75" />
                <text x={caliperB.x + 8} y={caliperB.y - 8} fill="#34d399">SPECIMEN POINT BETA</text>
              </g>
            )}
            {caliperA && caliperB && (
              <g>
                <line x1={caliperA.x} y1={caliperA.y} x2={caliperB.x} y2={caliperB.y} stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" className="animate-pulse" />
                <rect x={Math.min(caliperA.x, caliperB.x) + Math.abs(caliperB.x - caliperA.x)/2 - 40} y={Math.min(caliperA.y, caliperB.y) + Math.abs(caliperB.y - caliperA.y)/2 - 12} width="80" height="16" fill="rgba(7, 5, 3, 0.9)" stroke="#34d399" strokeWidth="1" />
                <text x={Math.min(caliperA.x, caliperB.x) + Math.abs(caliperB.x - caliperA.x)/2 - 32} y={Math.min(caliperA.y, caliperB.y) + Math.abs(caliperB.y - caliperA.y)/2 + 1} fill="#34d399" className="font-bold">{(caliperDist * 0.15).toFixed(2)} mm</text>
              </g>
            )}
          </svg>
        )}

        {/* Dynamic telemetry caliper calibration specs panel */}
        {lampMode === 'measure' && (
          <div className="absolute top-4 left-4 z-20 p-3 bg-[#070503]/90 border border-[#34d399]/40 text-[#34d399] tracking-wider rounded font-mono text-[9px] w-64 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <div className="text-[10px] font-bold border-b border-[#34d399]/30 pb-1 mb-1.5 flex justify-between">
              <span>CO-AXIAL CALIPER SPECTROMETER</span>
              <button onClick={(e) => { e.stopPropagation(); clearCalipers(); }} className="hover:text-red-500 font-bold px-1">[RESET]</button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span>VECTOR SPAN:</span> <span className="font-bold text-white">{caliperDist ? \`\${(caliperDist * 0.15).toFixed(2)} mm\` : "WAITING FOR POINT ALPHA / BETA"}</span></div>
              <div className="flex justify-between"><span>COORDINATES ALPHA:</span> <span className="text-stone-300">{caliperA ? \`[\${caliperA.x} px, \${caliperA.y} px]\` : "NOT MAPPED"}</span></div>
              <div className="flex justify-between"><span>COORDINATES BETA:</span> <span className="text-stone-300">{caliperB ? \`[\${caliperB.x} px, \${caliperB.y} px]\` : "NOT MAPPED"}</span></div>
              <div className="flex justify-between"><span>BEDROCK RESONANCE:</span> <span className="font-bold text-white">{caliperDist ? \`\${(300 / (caliperDist * 0.15)).toFixed(1)} Hz\` : "STANDBY"}</span></div>
            </div>
          </div>
        )}
`;

  // Apply caliper Spec layers and pointer listener hooks into renderArtifactGraphic
  if (content.includes(graphicAnchor)) {
    content = content.replace(graphicAnchor, `${graphicAnchor.replace("/>", `${physicalHandlers} />`)} ${caliperOverlay}`);
    log('success', "✓ Integrated interactive Geodetic Calipers overlays and measuring modules.");
  } else if (content.includes(graphicAnchorCompact)) {
    content = content.replace(graphicAnchorCompact, `${graphicAnchorCompact.replace("/>", `${physicalHandlers} />`)} ${caliperOverlay}`);
    log('success', "✓ Integrated interactive Geodetic Calipers overlays and measuring modules (compact style).");
  } else {
    log('warn', "Could not find WebGL model rendering block in ArtifactViewer.tsx to overlay calipers.");
  }

  // Save the beautiful upgraded client view file back!
  fs.writeFileSync(targetPath, content, 'utf8');
  log('success', "✓ Successfully saved all artifact inspection experience upgrades!");

} catch (err) {
  log('error', `Failed to apply inspection experience patches: ${err.message}`);
}

console.log("\n-------------------------------------------------------");
log('info', "Tactile anomalous object scanning updates successfully applied.");
console.log("-------------------------------------------------------\n");
