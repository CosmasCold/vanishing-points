const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE REPAIR PROTOCOL // LEVEL-4 UTILITY");
console.log("   TARGETING: PRIORITY-3 TELEMETRY & 3D ALIGNMENT UPGRADES (v2)");
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

/**
 * REPAIR 01: Physical Alignment Gates & State Coupling
 * Injects state hooks to trigger unlocks on exact matching parameters
 */
function applyP3Upgrades() {
  const possiblePaths = [
    path.join(process.cwd(), 'components', 'artifacts', 'ArtifactViewer.tsx'),
    path.join(process.cwd(), 'components', 'ArtifactViewer.tsx'),
    path.join(process.cwd(), 'src', 'components', 'artifacts', 'ArtifactViewer.tsx'),
    path.join(process.cwd(), 'src', 'components', 'ArtifactViewer.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate ArtifactViewer.tsx in any standard directories.');
    return false;
  }

  log('info', `Reading Specimen Scanner at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  // Normalize CRLF to LF for reliable regex matching
  content = content.replace(/\r\n/g, '\n');

  // 1. Ensure useUIStore is imported
  if (!content.includes('useUIStore') && !content.includes('uiStore')) {
    log('info', 'Injecting useUIStore state manager imports...');
    const importStoreRegex = /import\s+\{\s*useArtifactStore\s*\}\s+from\s+['"]@\/state\/artifactStore['\"];/;
    if (content.match(importStoreRegex)) {
      content = content.replace(importStoreRegex, "import { useArtifactStore } from '@/state/artifactStore';\nimport { useUIStore } from '@/state/uiStore';");
    } else {
      content = "import { useUIStore } from '@/state/useUIStore';\n" + content;
    }
  }

  // Define the v2 alignment gate code block
  const p3AlignmentGateCode = [
    "  // PRIORITY-3: Alignment gate state coupling logic",
    "  React.useEffect(() => {",
    "    if (!activeArtifact) return;",
    "    const rot = rotation % 360;",
    "    const normRot = rot < 0 ? rot + 360 : rot;",
    "    ",
    "    let aligned = false;",
    "    let gateMsg = \"\";",
    "    ",
    "    if (activeArtifact.id === 'art-solenoid' && lampMode === 'uv' && normRot >= 165 && normRot <= 195 && zoom >= 1.5) {",
    "      aligned = true;",
    "      gateMsg = \"BUNKER_7: Fused Solenoid Core vector locked at \" + Math.round(normRot) + \"° [UV FLUX OVERLAP]. Unredacting Lebanon coordinates: 38.000°N, 97.000°W.\";",
    "    } else if (activeArtifact.id === 'art-core' && lampMode === 'uv' && normRot >= 75 && normRot <= 105 && zoom >= 1.8) {",
    "      aligned = true;",
    "      gateMsg = \"BUNKER_7: Kola segment mineral fractures aligned at \" + Math.round(normRot) + \"° [BEDROCK SIGNAL LOCK]. Triangulating 4.5 Hz seismic carrier signal.\";",
    "    } else if (activeArtifact.id === 'art-watch' && lampMode === 'uv' && normRot >= 255 && normRot <= 285 && zoom >= 2.0) {",
    "      aligned = true;",
    "      gateMsg = \"BUNKER_7: Pocketwatch dial gears meshed at \" + Math.round(normRot) + \"° [TEMPORAL SLIP DISPLACEMENT LOCK]. Hands locked forever at 01:23:45 AM.\";",
    "    } else if (activeArtifact.id === 'art-asbestos' && lampMode === 'standard' && zoom >= 1.8) {",
    "      aligned = true;",
    "      gateMsg = \"BUNKER_7: Wittenoom Blue Crocidolite base stamp scanned under standard lighting [WITTENOOM ERASURE EXPOSURE]. Degazetted coordinates unredacted: -22.14°S, 118.33°E.\";",
    "    } else if (activeArtifact.id === 'art-scale' && lampMode === 'uv' && normRot >= 105 && normRot <= 135 && zoom >= 2.0) {",
    "      aligned = true;",
    "      gateMsg = \"BUNKER_7: Humberstone scale weight calibrated at \" + Math.round(normRot) + \"° [ORGAN MASS ALIGNMENT]. Etched coordinates secured: -20.2085°S, -69.7945°W. Mass aligned: 1.2 kg.\";",
    "    }",
    "",
    "    if (aligned && !activeArtifact.hasBeenScanned) {",
    "      const audio = useAudioStore.getState();",
    "      const ui = useUIStore.getState();",
    "      ",
    "      // Trigger a deep resonant geophone confirmation chime",
    "      if (audio && typeof audio.play === 'function') {",
    "        audio.play('return');",
    "      }",
    "      ",
    "      // Update local artifact database state in store",
    "      useArtifactStore.getState().updateArtifact(activeArtifact.id, { hasBeenScanned: true });",
    "      ",
    "      // Award Dust for unredaction sequence",
    "      ui.updateStatus({",
    "        dustIndex: Math.min(100, ui.status.dustIndex + 8),",
    "        sessionWorkDone: ui.status.sessionWorkDone + 1",
    "      });",
    "      ",
    "      log('success', gateMsg);",
    "    }",
    "  }, [rotation, zoom, lampMode, activeArtifact]);"
  ].join("\n");

  const p3RotationTickCode = [
    "  // PRIORITY-3: Dynamic Web Audio drag friction solenoid tick loop",
    "  const prevRotationRef = React.useRef(rotation);",
    "  React.useEffect(() => {",
    "    if (rotation !== prevRotationRef.current) {",
    "      const delta = Math.abs(rotation - prevRotationRef.current);",
    "      prevRotationRef.current = rotation;",
    "      ",
    "      // Play high-fidelity mechanical click on drag threshold crossing",
    "      if (delta > 1.5) {",
    "        const audio = useAudioStore.getState();",
    "        if (audio && typeof audio.play === 'function') {",
    "          audio.play('type'); // procedural click",
    "        }",
    "      }",
    "    }",
    "  }, [rotation]);"
  ].join("\n");

  // Case A: File was already patched with v1
  const searchAnchor = "// PRIORITY-3: Alignment gate state coupling logic";
  const startIdx = content.indexOf(searchAnchor);
  
  if (startIdx !== -1) {
    log('info', 'Found existing Priority-3 alignment gates. Upgrading to include v2 5-specimen matrices...');
    const endToken = "}, [rotation, zoom, lampMode, activeArtifact]);";
    const endIdx = content.indexOf(endToken, startIdx);
    
    if (endIdx !== -1) {
      const fullReplacementPoint = endIdx + endToken.length;
      content = content.substring(0, startIdx) + p3AlignmentGateCode + content.substring(fullReplacementPoint);
      fs.writeFileSync(targetPath, content, 'utf8');
      log('success', 'Successfully upgraded existing ArtifactViewer.tsx file to v2 spec!');
      return true;
    }
  }

  // Case B: File is unpatched, apply clean baseline v2 patch
  const hooksAnchor = "export const ArtifactViewer: React.FC = () => {";
  const hooksAnchorIdx = content.indexOf(hooksAnchor);
  
  if (hooksAnchorIdx !== -1) {
    log('info', 'Injecting baseline Solenoid, Kola, Watch, Wittenoom, and Humberstone alignment matrix...');
    const activeArtifactDestructure = "useArtifactStore();";
    const destructureIdx = content.indexOf(activeArtifactDestructure, hooksAnchorIdx);
    
    if (destructureIdx !== -1) {
      const insertionPoint = content.indexOf('\n', destructureIdx) + 1;
      const combinedPatches = "\n" + p3RotationTickCode + "\n\n" + p3AlignmentGateCode + "\n";
      
      content = content.substring(0, insertionPoint) + combinedPatches + content.substring(insertionPoint);
      fs.writeFileSync(targetPath, content, 'utf8');
      log('success', 'Successfully injected unified v2 alignment gates and sound loops in ArtifactViewer.tsx!');
      return true;
    }
  }

  log('warn', 'Could not locate suitable insertion points inside ArtifactViewer.tsx.');
  return false;
}

// Execute repair
const success = applyP3Upgrades();

console.log("\n-------------------------------------------------------");
if (success) {
  log('success', "Priority-3 Specimen Upgrades (v2) completed. Re-run 'npm run dev' to activate all 5 specimens!");
} else {
  log('warn', "Patches not applied. Verify your working directories.");
}
console.log("-------------------------------------------------------\n");
