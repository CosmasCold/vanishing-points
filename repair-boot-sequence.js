const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - BOOT SEQUENCE CALIBRATION");
console.log("   TARGETING: RETRO MAINMAIN COLD-BOOT LOGS & POST STAGE");
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
  path.join(process.cwd(), 'components', 'BootSequence.tsx'),
  path.join(process.cwd(), 'src', 'components', 'BootSequence.tsx'),
  path.join(process.cwd(), 'components', 'loading', 'BootSequence.tsx'),
];

let targetPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    targetPath = p;
    break;
  }
}

if (!targetPath) {
  log('error', "Could not locate 'BootSequence.tsx' in your project directory.");
  log('info', "Please make sure you place and run this script inside your Next.js project root folder.");
  process.exit(1);
}

log('info', `Located target at: ${targetPath}`);

try {
  let content = fs.readFileSync(targetPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  let fixed = false;

  // 1. Overhaul BOOT_LINES
  const oldBootLines = [
    'const BOOT_LINES = [',
    '  { text: "POWER RESTORED", color: "#6a9a5a" },',
    '  { text: "Loading Archive Kernel...", color: "#8a6000" },',
    '  { text: "Initializing Atlas...", color: "#8a6000" },',
    '  { text: "Checking Integrity...", color: "#8a6000" },',
    '  { text: "Loading Investigations...", color: "#8a6000" },',
    '  { text: "Synchronizing Evidence...", color: "#8a6000" },',
    '  { text: "Loading Local Cache...", color: "#8a6000" },',
    '  { text: "4,211 days since last session", color: "#a85d5d" },',
    '  { text: "Dust Index: Stable", color: "#6a9a5a" },',
    '  { text: "Good evening, Investigator.", color: "#e8e0d0" },',
    '];'
  ].join('\n');

  const newBootLines = [
    'const BOOT_LINES = [',
    '  { text: "ARCHIVE NODE SYSTEM 7-B ONLINE.", color: "#ffb000" },',
    '  { text: "FIRMWARE: V7.04-1962 BOOT PATH: /SYS/CORE", color: "#8a6000" },',
    '  { text: "MEMORY CONGRITY: 92% (DEGRADED)", color: "#8a6000" },',
    '  { text: "TEMPORAL SYNC: NOMINAL [SOLSTICE CALIBRATION DRIFT]", color: "#8a6000" },',
    '  { text: "PREVIOUS SESSION TERMINATED: 4,211 DAYS, 7 HOURS AGO.", color: "#a85d5d" },',
    '  { text: "IDENTIFICATION: INV_RED-7 (UNVERIFIED)", color: "#a85d5d" },',
    '  { text: "----------------------------------------", color: "#2a2520" },',
    '  { text: "ELECTROSTATIC DUST DEPOSIT: ELEVATED", color: "#ffaa55" },',
    '  { text: "WARN: COGNITIVE FOCUS RE-CALIBRATION PENDING.", color: "#ffaa55" },',
    '  { text: "THE WORK HAS BEEN WAITING.", color: "#e8e0d0" },',
    '];'
  ].join('\n');

  if (content.includes(oldBootLines)) {
    content = content.replace(oldBootLines, newBootLines);
    log('success', "✓ Overhauled console boot logs to use canonical, high-fidelity military mainboard diagnostics.");
    fixed = true;
  } else if (content.includes('FIRMWARE: V7.04-1962')) {
    log('info', "• Console boot lines are already aligned with declassified System-7B spec.");
  } else {
    log('warn', "Could not find standard BOOT_LINES block. Retrying with a flexible regex replacement...");
    
    // Fallback regex replacement for BOOT_LINES
    const bootLinesRegex = /const BOOT_LINES\s*=\s*\[[\s\S]*?\];/;
    if (content.match(bootLinesRegex)) {
      content = content.replace(bootLinesRegex, newBootLines);
      log('success', "✓ Successfully overhauled console boot logs via regex fallback.");
      fixed = true;
    } else {
      log('error', "Could not locate BOOT_LINES array in BootSequence.tsx.");
    }
  }

  // 2. Overhaul LOADING_STEPS (Replacing Unity 3D engine loading terms with hardware register sweeps)
  const oldLoadingSteps = [
    'const LOADING_STEPS = [',
    '  "> Initializing Archive kernel...",',
    '  "> Mounting asset volumes...",',
    '  "> Verifying geometry integrity...",',
    '  "> Loading texture banks...",',
    '  "> Synchronizing scene graph...",',
    '  "> Calibrating render pipeline...",',
    '];'
  ].join('\n');

  const newLoadingSteps = [
    'const LOADING_STEPS = [',
    '  "> POWER LEVEL: STABILIZED [6.3V HEATER ANODE RAILS]...",',
    '  "> POST STAGE: SCANNING 16KB MAGNETIC CORE REGISTER ARRAYS...",',
    '  "> INTEGRITY: DETECTED CORRUPTED SECTOR SEALS (AUTO-HEALING)...",',
    '  "> SEEKING REEL_RED-7 COAXIAL TAPE STORAGE CORES...",',
    '  "> MOUNTING RAW SYSTEM BLOCK /SYS/CORE [BLOCK SIZE 1024]...",',
    '  "> STABILIZING COMPROMISED SYSTEM DIAGNOSTIC KERNEL V7.04...",',
    '];'
  ].join('\n');

  if (content.includes(oldLoadingSteps)) {
    content = content.replace(oldLoadingSteps, newLoadingSteps);
    log('success', "✓ Replaced standard video-game loading descriptors with realistic low-level register POST scans.");
    fixed = true;
  } else if (content.includes('POWER LEVEL: STABILIZED')) {
    log('info', "• Hardware loading stages are already active.");
  } else {
    log('warn', "Could not find standard LOADING_STEPS block. Retrying with a flexible regex replacement...");
    
    const loadingStepsRegex = /const LOADING_STEPS\s*=\s*\[[\s\S]*?\];/;
    if (content.match(loadingStepsRegex)) {
      content = content.replace(loadingStepsRegex, newLoadingSteps);
      log('success', "✓ Successfully overhauled hardware loading steps via regex fallback.");
      fixed = true;
    } else {
      log('error', "Could not locate LOADING_STEPS array in BootSequence.tsx.");
    }
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Boot sequence updates cleanly written to disk! No compiler errors expected.");
  } else {
    log('info', "No modifications needed. File is already in its optimal cinematic state.");
  }

} catch (err) {
  log('error', `Failed to read or write the file: ${err.message}`);
}

console.log("\n-------------------------------------------------------");
log('info', "Calibration protocol complete.");
console.log("-------------------------------------------------------\n");
