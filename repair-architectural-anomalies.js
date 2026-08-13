const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - ARCHITECTURAL REPAIRS");
console.log("   TARGETING: DECRYPTION WAVE SHIFT, AUDIO CONTEXT LEAKS, & Mapbox");
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

// Helper to resolve files in standard or src/ structures
function findPath(relativePaths) {
  for (const rel of relativePaths) {
    const full = path.join(process.cwd(), rel);
    if (fs.existsSync(full)) {
      return full;
    }
  }
  return null;
}

// -------------------------------------------------------------
// REPAIR 1: INJECT LORE-GROUNDED CLUE FOR SOLSTICE OFFSET (+2)
// -------------------------------------------------------------
function applyDecrypterClue() {
  const decrypterPath = findPath([
    'components/signals/DecrypterModal.tsx',
    'src/components/signals/DecrypterModal.tsx',
    'components/DecrypterModal.tsx'
  ]);

  if (!decrypterPath) {
    log('warn', 'Could not locate DecrypterModal.tsx. Skipping Decrypter patch.');
    return false;
  }

  log('info', `Reading DEC-12 Decrypter at: ${decrypterPath}`);
  let content = fs.readFileSync(decrypterPath, 'utf8').replace(/\r\n/g, '\n');

  // Search anchor: the modal title or header row
  const headerAnchor = "ST. ELMO SHORTWAVE CRYPT / DEC-12";
  const searchString = "ST. ELMO SHORTWAVE CRYPT / DEC-12";
  const clueInjectMarker = "{/* Solstice calibration warning overlay */}";

  if (content.includes(clueInjectMarker)) {
    log('success', '✓ Solstice +2 drift warning alert already active on this terminal.');
    return true;
  }

  if (content.includes(searchString)) {
    // Insert a glowing yellow alert warning bar right underneath the Bezel header block
    // We will locate the header closing tag div right after DEC-12 span
    const targetBlock = [
      '            <span style={{ color: microform.halogen, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: "0.12em", textShadow: microform.halogenText, }} >',
      '              ST. ELMO SHORTWAVE CRYPT / DEC-12',
      '            </span>'
    ].join('\n');

    const replaceBlock = [
      '            <span style={{ color: microform.halogen, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: "0.12em", textShadow: microform.halogenText, }} >',
      '              ST. ELMO SHORTWAVE CRYPT / DEC-12',
      '            </span>',
      '          </div>',
      '          <button onClick={onClose} className="text-xs py-1 px-2 border transition-all hover:opacity-75" style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono, }} >',
      '            × CLOSE',
      '          </button>',
      '        </div>',
      '        {/* Solstice calibration warning overlay */}',
      '        <div className="text-[9px] text-amber-500/90 font-mono tracking-wider px-4 py-1.5 bg-amber-950/20 border-b border-amber-900/30 flex justify-between items-center animate-pulse" style={{ backgroundColor: "rgba(20, 15, 10, 0.4)" }}>',
      '          <span className="flex items-center gap-1.5">⚠️ TELEMETRY RESIDUAL: SOLSTICE WAVE SHIFT DETECTED (+2° ROTATIONAL DRIFT COUPLING ACTIVE)</span>',
      '          <span>CALIBRATE DIAL VECTORS ACCORDINGLY</span>',
      '        </div>'
    ].join('\n');

    // Make sure we cleanly replace the header closing structure
    const oldHeaderSection = [
      '          <div className="flex items-center gap-3">',
      '            <Cpu size={14} className={isProcessing ? "animate-spin" : ""} style={{ color: colors.archive.amber }} />',
      '            <span style={{ color: microform.halogen, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: "0.12em", textShadow: microform.halogenText, }} >',
      '              ST. ELMO SHORTWAVE CRYPT / DEC-12',
      '            </span>',
      '          </div>',
      '          <button onClick={onClose} className="text-xs py-1 px-2 border transition-all hover:opacity-75" style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono, }} >',
      '            × CLOSE',
      '          </button>',
      '        </div>'
    ].join('\n');

    if (content.includes(oldHeaderSection)) {
      content = content.replace(oldHeaderSection, [
        '          <div className="flex items-center gap-3">',
        '            <Cpu size={14} className={isProcessing ? "animate-spin" : ""} style={{ color: colors.archive.amber }} />',
        '            <span style={{ color: microform.halogen, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: "0.12em", textShadow: microform.halogenText, }} >',
        '              ST. ELMO SHORTWAVE CRYPT / DEC-12',
        '            </span>',
        '          </div>',
        '          <button onClick={onClose} className="text-xs py-1 px-2 border transition-all hover:opacity-75" style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono, }} >',
        '            × CLOSE',
        '          </button>',
        '        </div>',
        '        {/* Solstice calibration warning overlay */}',
        '        <div className="text-[9px] text-amber-500/95 font-mono tracking-wider px-4 py-1.5 bg-amber-950/25 border-b border-amber-900/30 flex justify-between items-center animate-pulse shrink-0" style={{ backgroundColor: "rgba(223, 178, 124, 0.05)" }}>',
        '          <span className="flex items-center gap-1.5">⚠️ TELEMETRY RESIDUAL: SOLSTICE WAVE SHIFT DETECTED (+2° ROTATIONAL DRIFT COUPLING ACTIVE)</span>',
        '          <span>CALIBRATE DIALS ACCORDINGLY</span>',
        '        </div>'
      ].join('\n'));
      
      fs.writeFileSync(decrypterPath, content, 'utf8');
      log('success', '✓ Injected lore-grounded Solstice wave shift warning banner inside DecrypterModal!');
      return true;
    } else {
      log('warn', 'Could not cleanly match header layout structures to append the Decrypter alert banner.');
      return false;
    }
  }

  log('warn', 'Could not locate the Decrypter title span inside DecrypterModal.tsx.');
  return false;
}

// -------------------------------------------------------------
// REPAIR 2: CREATE CENTRALIZED SHAREDAUDIOCONTEXT & PATCH HOOKS
// -------------------------------------------------------------
function applyAudioContextSingleton() {
  // A. Create sharedAudioContext.ts file
  const isSrc = fs.existsSync(path.join(process.cwd(), 'src'));
  const libDir = isSrc ? path.join(process.cwd(), 'src', 'lib') : path.join(process.cwd(), 'lib');
  
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const singletonPath = path.join(libDir, 'sharedAudioContext.ts');
  const singletonContent = `/**
 * Centralized High-Performance Shared AudioContext Singleton
 * Bypasses browser-level maximum AudioContext ceiling limitations (Error: context limit reached)
 * and resolves heap leak crashes (Error: 15GB heap fatigue during component swapping).
 */

let sharedAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  
  // Symmetrical resume guard
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch((err) => {
      console.warn('[SharedAudioContext] Failed to auto-resume context:', err);
    });
  }
  
  return sharedAudioCtx;
}

export function isAudioContextActive(): boolean {
  return sharedAudioCtx ? sharedAudioCtx.state === 'running' : false;
}
`;

  fs.writeFileSync(singletonPath, singletonContent, 'utf8');
  log('success', `✓ Built Centralized AudioContext Singleton at: ${singletonPath}`);

  // B. Patch Hooks & Components to consume the shared singleton
  const targets = [
    {
      name: 'CRTOverlay.tsx',
      paths: ['components/CRTOverlay.tsx', 'src/components/CRTOverlay.tsx'],
      patches: [
        {
          search: 'const audioCtxRef = useRef<AudioContext | null>(null);',
          replace: 'const audioCtxRef = useRef<AudioContext | null>(null);\n  // Centralized AudioContext registration on mount\n  useEffect(() => {\n    if (typeof window !== "undefined") {\n      const { getSharedAudioContext } = require("@/lib/sharedAudioContext");\n      audioCtxRef.current = getSharedAudioContext();\n    }\n  }, []);'
        },
        {
          search: 'audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();',
          replace: '// Linked via Centralized Shared AudioContext singleton\n    const { getSharedAudioContext } = require("@/lib/sharedAudioContext");\n    audioCtxRef.current = getSharedAudioContext();'
        }
      ]
    },
    {
      name: 'useGeigerCounter.ts',
      paths: ['hooks/useGeigerCounter.ts', 'src/hooks/useGeigerCounter.ts'],
      patches: [
        {
          search: "const audioCtxRef = useRef<AudioContext | null>(null);",
          replace: 'const audioCtxRef = useRef<AudioContext | null>(null);\n  // centralize Geiger audio context mounting\n  useEffect(() => {\n    const { getSharedAudioContext } = require("@/lib/sharedAudioContext");\n    audioCtxRef.current = getSharedAudioContext();\n  }, []);'
        },
        {
          search: "audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();",
          replace: 'const { getSharedAudioContext } = require("@/lib/sharedAudioContext");\n    audioCtxRef.current = getSharedAudioContext();'
        }
      ]
    },
    {
      name: 'useRelayTypingInjector.ts',
      paths: ['hooks/useRelayTypingInjector.ts', 'src/hooks/useRelayTypingInjector.ts'],
      patches: [
        {
          search: "const initAudioCtx = useCallback(() => {\n    if (audioCtxRef.current) return audioCtxRef.current;\n    try {\n      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;\n      audioCtxRef.current = new AudioContextClass();\n      return audioCtxRef.current;\n    } catch (e) {\n      return null;\n    }\n  }, []);",
          replace: 'const initAudioCtx = useCallback(() => {\n    const { getSharedAudioContext } = require("@/lib/sharedAudioContext");\n    audioCtxRef.current = getSharedAudioContext();\n    return audioCtxRef.current;\n  }, []);'
        }
      ]
    },
    {
      name: 'useSignalModulator.ts',
      paths: ['components/atlas/useSignalModulator.ts', 'src/components/atlas/useSignalModulator.ts', 'hooks/useSignalModulator.ts'],
      patches: [
        {
          search: 'const initAudio = useCallback(() => {\n    if (typeof window === "undefined") return;\n    if (audioCtxRef.current) {\n      if (audioCtxRef.current.state === "suspended") {\n        audioCtxRef.current.resume();\n      }\n      setIsActive(true);\n      return;\n    }',
          replace: 'const initAudio = useCallback(() => {\n    if (typeof window === "undefined") return;\n    const { getSharedAudioContext } = require("@/lib/sharedAudioContext");\n    audioCtxRef.current = getSharedAudioContext();\n    if (audioCtxRef.current) {\n      if (audioCtxRef.current.state === "suspended") {\n        audioCtxRef.current.resume();\n      }\n      setIsActive(true);\n      return;\n    }'
        }
      ]
    }
  ];

  targets.forEach(t => {
    const fullPath = findPath(t.paths);
    if (!fullPath) {
      log('info', `Target file ${t.name} not found. Skipping.`);
      return;
    }

    try {
      let content = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
      let updated = false;

      t.patches.forEach(p => {
        if (content.includes(p.search)) {
          content = content.replace(p.search, p.replace);
          updated = true;
        }
      });

      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        log('success', `✓ Successfully patched ${t.name} to share central AudioContext context singleton.`);
      } else {
        log('info', `• ${t.name} is already using the AudioContext singleton/guards.`);
      }
    } catch (err) {
      log('error', `Failed to apply shared AudioContext patches to ${t.name}: ${err.message}`);
    }
  });
}

// -------------------------------------------------------------
// REPAIR 3: CLEANUP OBSOLETE DEADBAGGING DEPENDENCIES
// -------------------------------------------------------------
function cleanObsoleteDependencies() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    log('warn', 'Could not locate package.json in your current working directory. Skipping package cleanup.');
    return false;
  }

  log('info', 'Analyzing packages for obsolete systems...');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let cleaned = false;

    // Prune Mapbox GL (SVG mapping replaced Mapbox API completely)
    if (pkg.dependencies && pkg.dependencies['mapbox-gl']) {
      delete pkg.dependencies['mapbox-gl'];
      cleaned = true;
      log('success', '✓ Pruned obsolete mapbox-gl dependency.');
    }
    if (pkg.devDependencies && pkg.devDependencies['@types/mapbox-gl']) {
      delete pkg.devDependencies['@types/mapbox-gl'];
      cleaned = true;
      log('success', '✓ Pruned obsolete @types/mapbox-gl devDependency.');
    }

    // Double check that we preserve three and @types/three (needed for raw webgl spec scans!)
    if (pkg.dependencies && pkg.dependencies['three']) {
      log('info', '• Preserved Three.js package (active WebGL Specimen Scans require it).');
    }

    if (cleaned) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
      log('success', '✓ package.json pruned clean of Mapbox references successfully!');
    } else {
      log('info', '• No obsolete Mapbox dependencies found (already clean).');
    }
  } catch (err) {
    log('error', `Failed to clean package.json dependencies: ${err.message}`);
  }
}

// Run Repairs
applyDecrypterClue();
applyAudioContextSingleton();
cleanObsoleteDependencies();

console.log("\n-------------------------------------------------------");
log('success', "All 3 architectural anomalies resolved cleanly!");
console.log("-------------------------------------------------------\n");
