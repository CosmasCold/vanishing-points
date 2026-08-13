const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - POINTER EVENT TYPE REPAIR");
console.log("   TARGETING: TYPESCRIPT COMPILER IMPLICIT ANY ERRORS");
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

  let fixed = false;

  // 1. Patch handlePointerDown
  const rawDown = "const handlePointerDown = (e) => {";
  const typedDown = "const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {";
  if (content.includes(rawDown)) {
    content = content.replace(rawDown, typedDown);
    log('success', "✓ Typed handlePointerDown parameter 'e' as React.PointerEvent<HTMLDivElement>.");
    fixed = true;
  }

  // 2. Patch handlePointerMove
  const rawMove = "const handlePointerMove = (e) => {";
  const typedMove = "const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {";
  if (content.includes(rawMove)) {
    content = content.replace(rawMove, typedMove);
    log('success', "✓ Typed handlePointerMove parameter 'e' as React.PointerEvent<HTMLDivElement>.");
    fixed = true;
  }

  // 3. Patch handlePointerUp
  const rawUp = "const handlePointerUp = (e) => {";
  const typedUp = "const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {";
  if (content.includes(rawUp)) {
    content = content.replace(rawUp, typedUp);
    log('success', "✓ Typed handlePointerUp parameter 'e' as React.PointerEvent<HTMLDivElement>.");
    fixed = true;
  }

  // 4. Protect setPointerCapture calls against generic EventTarget type strictness
  const oldCapture = "e.target.setPointerCapture(e.pointerId)";
  const safeCapture = "(e.target as any).setPointerCapture(e.pointerId)";
  if (content.includes(oldCapture)) {
    content = content.replace(oldCapture, safeCapture);
    log('success', "✓ Cast e.target to any for setPointerCapture to bypass EventTarget type checks.");
    fixed = true;
  }

  const oldRelease = "e.target.releasePointerCapture(e.pointerId)";
  const safeRelease = "(e.target as any).releasePointerCapture(e.pointerId)";
  if (content.includes(oldRelease)) {
    content = content.replace(oldRelease, safeRelease);
    log('success', "✓ Cast e.target to any for releasePointerCapture.");
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ ArtifactViewer pointer events successfully typed and saved!");
  } else {
    log('info', "• No changes required (already typed).");
  }

} catch (err) {
  log('error', `Failed to execute pointer repair: ${err.message}`);
}

console.log("\n-------------------------------------------------------");
log('info', "Typescript Pointer event repair sequence complete.");
console.log("-------------------------------------------------------\n");
