const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE REPAIR PROTOCOL // LEVEL-4 UTILITY");
console.log("   TARGETING: PRIORITY-1 PROGRESSION AND NARRATIVE ALIGNMENT (V4)");
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
 * REPAIR 01: Unify CORE_CASE_SLUGS in EvidenceBoard.tsx
 * Allows all 40 canonical case folders to render on the React Flow canvas
 */
function repairEvidenceBoardSlugs() {
  const possiblePaths = [
    path.join(process.cwd(), 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
    path.join(process.cwd(), 'components', 'evidence', 'EvidenceBoard.tsx'),
    path.join(process.cwd(), 'components', 'EvidenceBoard.tsx'),
    path.join(process.cwd(), 'src', 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
    path.join(process.cwd(), 'src', 'components', 'evidence', 'EvidenceBoard.tsx'),
    path.join(process.cwd(), 'src', 'components', 'EvidenceBoard.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('error', 'Could not locate EvidenceBoard.tsx in any expected directories (including components/evidenceBoard/EvidenceBoard.tsx).');
    log('info', 'Please verify your active directory or check if you are in the project root.');
    return false;
  }

  log('info', `Reading EvidenceBoard at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  const newSlugsBlock = `const CORE_CASE_SLUGS = new Set([
  'beelitz-surgery-basement',
  'bhangarh-fort',
  'blackwood-hospital',
  'bodie-ghost-town',
  'borovsko-bridge',
  'byberry-state-hospital',
  'canfranc-international-railway-station',
  'cheyenne-mountain-complex',
  'chteau-de-brissac',
  'copemish-masonic-temple',
  'duga-control-room',
  'duga-radar-array',
  'eastern-state-penitentiary',
  'eloise-psychiatric-hospital',
  'gila-river-relocation-center',
  'hashima-island',
  'humberstone-saltpeter-morgue',
  'humberstone-saltpeter-works',
  'isla-de-las-muecas',
  'kuldhara',
  'letchworth-village',
  'mount-weather-emergency-operations-center',
  'nara-dreamland',
  'nocton-hall-raf-hospital',
  'oradour-church-crypt',
  'poveglia-island',
  'poveglia-subterranean-ward',
  'pripyat-hospital-126',
  'pripyat-amusement-park',
  'raven-rock-mountain-complex',
  'rhyolite',
  'sedlec-ossuary',
  'spreepark-berlin',
  'stelmo-light',
  'teufelsberg-echo-dome',
  'the-grid-null-point',
  'the-leap-castle-bloody-chapel',
  'the-vanishing-hospital',
  'willard-asylum-suitcases',
  'wittenoom'
]);`;

  if (content.includes('const CORE_CASE_SLUGS = new Set([')) {
    const startIdx = content.indexOf('const CORE_CASE_SLUGS = new Set([');
    const endIdx = content.indexOf(']);', startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
      content = content.substring(0, startIdx) + newSlugsBlock + content.substring(endIdx + 3);
      fs.writeFileSync(targetPath, content, 'utf8');
      log('success', 'Successfully expanded CORE_CASE_SLUGS in EvidenceBoard.tsx to include all 40 canonical case folders!');
      return true;
    }
  }

  log('warn', 'Could not locate CORE_CASE_SLUGS definition inside EvidenceBoard.tsx.');
  return false;
}

/**
 * REPAIR 02: Synchronize useResonanceTriangulation geodetic slugs
 * Ensures correct connection calculation triggers the Lebanon Null Point unlock
 */
function repairTriangulationHook() {
  const possiblePaths = [
    path.join(process.cwd(), 'hooks', 'useResonanceTriangulation.ts'),
    path.join(process.cwd(), 'src', 'hooks', 'useResonanceTriangulation.ts')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate hooks/useResonanceTriangulation.ts. Skipping.');
    return false;
  }

  log('info', `Reading triangulation hook at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  if (content.includes('mount-weather') && !content.includes('mount-weather-emergency-operations-center')) {
    content = content.replace(/'mount-weather'/g, "'mount-weather-emergency-operations-center'");
    content = content.replace(/'cheyenne-mountain'/g, "'cheyenne-mountain-complex'");
    content = content.replace(/'raven-rock'/g, "'raven-rock-mountain-complex'");
    
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', 'Successfully synchronized useResonanceTriangulation geodetic slugs with canonical place definitions.');
    return true;
  } else if (content.includes('mount-weather-emergency-operations-center')) {
    log('info', 'useResonanceTriangulation.ts is already configured with correct canonical slugs.');
    return true;
  }

  log('warn', 'Could not find old geodetic slugs inside hooks/useResonanceTriangulation.ts.');
  return false;
}

/**
 * REPAIR 03: Register `/time-sync` cheat command inside logic/commands/system.ts
 * Spoofer class intercepts client Date instances on demand to bypass temporal locks
 */
function repairSystemCommands() {
  const possiblePaths = [
    path.join(process.cwd(), 'logic', 'commands', 'system.ts'),
    path.join(process.cwd(), 'src', 'logic', 'commands', 'system.ts')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate logic/commands/system.ts. Skipping.');
    return false;
  }

  log('info', `Reading system commands at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  if (content.includes("name: 'time-sync'") || content.includes('name: "time-sync"')) {
    log('info', 'time-sync command is already registered in system.ts.');
    return true;
  }

  const dateIdx = content.indexOf("name: 'date'");
  const dateIdxDouble = content.indexOf('name: "date"');
  const idx = dateIdx !== -1 ? dateIdx : dateIdxDouble;

  if (idx !== -1) {
    const closingIdx = content.indexOf('});', idx);
    if (closingIdx !== -1) {
      const insertionPoint = closingIdx + 3;
      
      const timeSyncCode = [
        "",
        "  // 6. /time-sync command: mock current system time dynamically for testing",
        "  registry.register({",
        "    name: 'time-sync',",
        "    description: 'Sync or mock the terminal system clock to bypass temporal lockouts',",
        "    usage: 'time-sync [HH:MM]',",
        "    aliases: ['sync-time', 'mock-time'],",
        "    handler: (args: string[]) => {",
        "      if (typeof window === 'undefined') {",
        "        return { output: 'Time-sync is only available in the client terminal environment.', type: 'error' as const };",
        "      }",
        "      const time = args[0];",
        "      if (!time) {",
        "        delete (window as any).__mockTime;",
        "        return { output: 'BUNKER_7: Time synchronization aligned with real-time atomic clock.', type: 'success' as const };",
        "      }",
        "      if (!/^\\d{2}:\\d{2}$/.test(time)) {",
        "        return { output: 'Usage: /time-sync [HH:MM] (e.g., /time-sync 03:14)', type: 'error' as const };",
        "      }",
        "      (window as any).__mockTime = time;",
        "      ",
        "      // Inject global Date class override on-demand to prevent hydration mismatches",
        "      if (!(window as any).__dateOverridden) {",
        "        const OriginalDate = window.Date;",
        "        const CustomDate = function(...args: any[]) {",
        "          if (args.length === 0 && (window as any).__mockTime) {",
        "            const d = new OriginalDate();",
        "            const [h, m] = (window as any).__mockTime.split(':').map(Number);",
        "            d.setHours(h);",
        "            d.setMinutes(m);",
        "            d.setSeconds(0);",
        "            return d;",
        "          }",
        "          return new (OriginalDate as any)(...args);",
        "        };",
        "        CustomDate.prototype = OriginalDate.prototype;",
        "        CustomDate.now = function() {",
        "          if ((window as any).__mockTime) {",
        "            const d = new OriginalDate();",
        "            const [h, m] = (window as any).__mockTime.split(':').map(Number);",
        "            d.setHours(h);",
        "            d.setMinutes(m);",
        "            d.setSeconds(0);",
        "            return d.getTime();",
        "          }",
        "          return OriginalDate.now();",
        "        };",
        "        Object.getOwnPropertyNames(OriginalDate).forEach(key => {",
        "          if (!(key in CustomDate)) {",
        "            try { (CustomDate as any)[key] = (OriginalDate as any)[key]; } catch(e){}",
        "          }",
        "        });",
        "        window.Date = CustomDate as any;",
        "        (window as any).__dateOverridden = true;",
        "      }",
        "      ",
        "      return { output: `BUNKER_7: Terminal clock spoofed to [${time}]. Geodetic temporal gates aligned.`, type: 'success' as const };",
        "    }",
        "  });"
      ].join("\n");

      content = content.substring(0, insertionPoint) + timeSyncCode + content.substring(insertionPoint);
      fs.writeFileSync(targetPath, content, 'utf8');
      log('success', 'Successfully registered `/time-sync` and dynamic client-side Date overrides inside logic/commands/system.ts!');
      return true;
    }
  }

  log('warn', 'Could not locate date command registration to append time-sync.');
  return false;
}

// Perform repairs
const boardFixed = repairEvidenceBoardSlugs();
const triangulationFixed = repairTriangulationHook();
const systemCommandsFixed = repairSystemCommands();

console.log("\n-------------------------------------------------------");
if (boardFixed || triangulationFixed || systemCommandsFixed) {
  log('success', "Priority-1 Repairs complete. Re-run 'npm run dev' to boot aligned cores!");
} else {
  log('warn', "No patches applied. Confirm you are in the correct Next.js project root subdirectory.");
}
console.log("-------------------------------------------------------\n");
