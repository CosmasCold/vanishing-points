const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE REPAIR - TYPESCRIPT COMPILER FIX");
console.log("   TARGETING: ArtifactViewer.tsx CALIPER POINTS TYPE");
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
  log('error', "Could not locate 'ArtifactViewer.tsx' in your project.");
  log('info', "Please place this script in your Next.js project root folder and execute.");
  process.exit(1);
}

log('info', `Located target at: ${targetPath}`);

try {
  let content = fs.readFileSync(targetPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldStateStr = "const [caliperPoints, setCaliperPoints] = useState([]);";
  const newStateStr = "const [caliperPoints, setCaliperPoints] = useState<{ x: number; y: number }[]>([]);";

  if (content.includes(newStateStr)) {
    log('success', "✓ 'caliperPoints' is already explicitly typed as { x: number; y: number }[].");
  } else if (content.includes(oldStateStr)) {
    content = content.replace(oldStateStr, newStateStr);
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Successfully patched 'caliperPoints' state initialization with TypeScript type parameters!");
    log('info', "The type compiler will now recognize 'x' and 'y' fields on caliperPoints elements.");
  } else {
    // If the file is typed slightly differently, let's do a regex replacement
    const regex = /const\s+\[\s*caliperPoints\s*,\s*setCaliperPoints\s*\]\s*=\s*useState\(\s*\[\s*\]\s*\);/;
    if (content.match(regex)) {
      content = content.replace(regex, newStateStr);
      fs.writeFileSync(targetPath, content, 'utf8');
      log('success', "✓ Successfully matched and patched 'caliperPoints' using regex constraints!");
    } else {
      log('warn', "Could not find the target state definition for 'caliperPoints'. It may already be typed or structured differently.");
    }
  }

} catch (err) {
  log('error', `Failed to execute patch: ${err.message}`);
}

console.log("\n-------------------------------------------------------");
log('info', "TypeScript compilation fix complete.");
console.log("-------------------------------------------------------\n");
