const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE REPAIR PROTOCOL // BUILD RECOVERY");
console.log("   TARGETING: FRONTEND BUILD TYPE ERROR (MISSING 'LOG')");
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

function repairArtifactViewerBuild() {
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
    log('warn', 'Could not locate ArtifactViewer.tsx to patch.');
    return false;
  }

  log('info', `Reading Specimen Scanner at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  // Normalize CRLF to LF
  content = content.replace(/\r\n/g, '\n');

  // Find the leaked log('success', gateMsg) and change to console.log(gateMsg)
  const leakedLogPattern = "log('success', gateMsg);";
  const safeLogPattern = "console.log(gateMsg);";

  if (content.includes(leakedLogPattern)) {
    content = content.replace(leakedLogPattern, safeLogPattern);
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', `Patched React build type error in ArtifactViewer.tsx! Swapped leaked 'log()' with 'console.log()'.`);
    return true;
  } else if (content.includes(safeLogPattern)) {
    log('info', 'ArtifactViewer.tsx is already protected with console.log() replacement.');
    return true;
  }

  log('warn', 'Could not find the leaked log pattern inside ArtifactViewer.tsx. It may have already been cleaned.');
  return false;
}

// Also correct repair-p3-upgrades-v2.js in process.cwd() if it exists to prevent re-introductions
function sanitizeUpgradesScript() {
  const scriptPath = path.join(process.cwd(), 'repair-p3-upgrades-v2.js');
  if (!fs.existsSync(scriptPath)) {
    return;
  }

  log('info', `Correcting local repair-p3-upgrades-v2.js template file...`);
  let content = fs.readFileSync(scriptPath, 'utf8');
  if (content.includes("log('success', gateMsg);")) {
    // Escape backslashes if needed, or just standard string replace
    content = content.replace("log('success', gateMsg);", "console.log(gateMsg);");
    fs.writeFileSync(scriptPath, content, 'utf8');
    log('success', `Sanitized local repair-p3-upgrades-v2.js template configuration.`);
  }
}

const viewerFixed = repairArtifactViewerBuild();
sanitizeUpgradesScript();

console.log("\n-------------------------------------------------------");
if (viewerFixed) {
  log('success', "Build recovery complete! Re-run 'npm run build' or 'vercel build' to deploy your aligned server.");
} else {
  log('warn', "No modifications applied. Confirm you are in your project root.");
}
console.log("-------------------------------------------------------\n");
