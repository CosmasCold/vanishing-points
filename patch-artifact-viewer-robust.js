const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - SPECTROMETER SCANNERS REPAIR");
console.log("   TARGETING: TACTILE MOUSE DRAGS & GEODETIC CALIPERS");
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
  log('error', "Could not locate 'ArtifactViewer.tsx' in your workspace.");
  log('info', "Please place this script in your Next.js project root folder and execute.");
  process.exit(1);
}

log('info', `Located target at: ${targetPath}`);

try {
  let content = fs.readFileSync(targetPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Step 1: Inject states, refs, and pointer event handlers right after useArtifactStore destructuring
  const targetStoreDestructure = "useArtifactStore();";
  const injectBlock = `
  // --- INJECTED TACTILE SCANNER STATE CONTROLS ---
  const [caliperPoints, setCaliperPoints] = useState([]);
  const [isDraggingSpecimen, setIsDraggingSpecimen] = useState(false);
  const dragStartRef = useRef(0);

  const caliperDistance = useMemo(() => {
    if (caliperPoints.length !== 2) return 0;
    const dx = caliperPoints[0].x - caliperPoints[1].x;
    const dy = caliperPoints[0].y - caliperPoints[1].y;
    return Math.sqrt(dx * dx + dy * dy) * 0.45; // scale factor to mm
  }, [caliperPoints]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (lampMode === 'measure') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCaliperPoints(prev => {
        if (prev.length >= 2) return [{ x, y }];
        return [...prev, { x, y }];
      });
      if (typeof play === 'function') play('type');
      return;
    }
    setIsDraggingSpecimen(true);
    dragStartRef.current = e.clientX;
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingSpecimen) return;
    const deltaX = e.clientX - dragStartRef.current;
    dragStartRef.current = e.clientX;
    if (typeof rotate === 'function') rotate(deltaX * 0.5);
  };

  const handlePointerUp = (e) => {
    setIsDraggingSpecimen(false);
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Reset calipers when changing modes
  useEffect(() => {
    setCaliperPoints([]);
  }, [lampMode, activeArtifact]);
  `;

  let updated = false;

  if (content.includes(targetStoreDestructure)) {
    if (!content.includes('caliperPoints')) {
      content = content.replace(targetStoreDestructure, targetStoreDestructure + injectBlock);
      log('success', "✓ Injected pointer coordinates, drag states, and caliper math loops.");
      updated = true;
    } else {
      log('info', "• Pointer controls and caliper variables are already active in scope.");
    }
  } else {
    log('error', "Could not find useArtifactStore destructuring index inside ArtifactViewer.tsx.");
    process.exit(1);
  }

  // Step 2: Replace renderArtifactGraphic completely with our high-fidelity Pointer-handling div
  const startMarker = "const renderArtifactGraphic = () => {";
  const startIdx = content.indexOf(startMarker);
  
  if (startIdx !== -1) {
    const returnIdx = content.indexOf("return (", startIdx);
    const functionEndIdx = content.indexOf("};", returnIdx);
    
    if (functionEndIdx !== -1) {
      const oldBlock = content.substring(startIdx, functionEndIdx + 2);
      
      const newBlock = `const renderArtifactGraphic = () => {
    return (
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-[512px] h-[512px] flex items-center justify-center border border-stone-900 bg-[#070503] cursor-grab active:cursor-grabbing touch-none select-none" 
        style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.95)', }}
      >
        {/* Render our gorgeous, high-fidelity WebGL 3D Specimen Scanner */}
        <ThreeSpecimenRenderer
          id={activeArtifact.id}
          rotation={rotation}
          zoom={zoom}
          lampMode={lampMode}
          className="absolute inset-0 z-0"
        />

        {/* Geodetic Calipers Laser Layer */}
        {lampMode === 'measure' && (
          <svg className="absolute inset-0 z-10 pointer-events-none w-full h-full">
            {/* Grid coordinates overlay */}
            <g stroke="#34d399" strokeWidth={1} opacity={0.35} strokeDasharray="4,4">
              <line x1="50%" y1="0" x2="50%" y2="100%" />
              <line x1="0" y1="50%" x2="100%" y2="50%" />
            </g>
            {caliperPoints.length > 0 && (
              <g>
                {caliperPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r={6} fill="#34d399" />
                    <circle cx={pt.x} cy={pt.y} r={12} stroke="#34d399" strokeWidth={1.5} fill="none" className="animate-ping" />
                    <text x={pt.x + 10} y={pt.y - 10} fill="#34d399" className="font-mono text-[9px]">
                      {idx === 0 ? 'POINT_α' : 'POINT_β'}
                    </text>
                  </g>
                ))}
                {caliperPoints.length === 2 && (
                  <>
                    <line 
                      x1={caliperPoints[0].x} 
                      y1={caliperPoints[0].y} 
                      x2={caliperPoints[1].x} 
                      y2={caliperPoints[1].y} 
                      stroke="#34d399" 
                      strokeWidth={1.5} 
                    />
                    <g transform={\`translate(\${(caliperPoints[0].x + caliperPoints[1].x) / 2 - 50}, \${(caliperPoints[0].y + caliperPoints[1].y) / 2 - 12})\`}>
                      <rect 
                        width={100} 
                        height={18} 
                        fill="#070503" 
                        stroke="#34d399" 
                        strokeWidth={1} 
                      />
                      <text 
                        x={50} 
                        y={12} 
                        fill="#34d399" 
                        textAnchor="middle" 
                        className="font-mono text-[8px] font-bold"
                      >
                        SPAN: {caliperDistance.toFixed(1)} mm
                      </text>
                    </g>
                  </>
                )}
              </g>
            )}
          </svg>
        )}
      </div>
    );
  };`;
      
      content = content.replace(oldBlock, newBlock);
      log('success', "✓ Successfully patched renderArtifactGraphic with active Pointer drag nodes and SVGs.");
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Specimen Scanner tactile mechanics successfully compiled and saved!");
  } else {
    log('info', "• No changes needed (already patched).");
  }

} catch (err) {
  log('error', `Failed to execute patch: ${err.message}`);
}

console.log("\n-------------------------------------------------------");
log('info', "Spectrometer scanning calibrations complete.");
console.log("-------------------------------------------------------\n");
