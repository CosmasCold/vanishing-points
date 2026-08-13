const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - FILE REPAIR SEQUENCE");
console.log("   TARGETING: CONNECTION NULL-POINTER CRASH GUARDS");
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
  path.join(process.cwd(), 'components', 'investigation', 'InvestigationView.tsx'),
  path.join(process.cwd(), 'src', 'components', 'investigation', 'InvestigationView.tsx'),
  path.join(process.cwd(), 'components', 'InvestigationView.tsx')
];

let targetPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    targetPath = p;
    break;
  }
}

if (!targetPath) {
  log('error', "Could not locate 'InvestigationView.tsx' in your standard directory trees.");
  log('info', "Please place this script in your Next.js project root folder.");
  process.exit(1);
}

log('info', `Located target at: ${targetPath}`);

try {
  let content = fs.readFileSync(targetPath, 'utf8');
  
  // Clean CRLF line endings
  content = content.replace(/\r\n/g, '\n');
  
  const targetPattern = "slug.replace(/-/g, ' ').toUpperCase()";
  const securePattern = "(slug ? slug.replace(/-/g, ' ').toUpperCase() : 'UNKNOWN CORES')";

  if (content.includes(securePattern)) {
    log('success', "✓ Defensive nullish guard is already active inside your ConnectedCard component.");
  } else if (content.includes(targetPattern)) {
    content = content.replace(targetPattern, securePattern);
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Secured 'ConnectedCard' render path! Trailing nulls will now fail gracefully without crashing.");
  } else {
    log('warn', "Could not find the expected '.replace()' string inside the file. It may have been structurally altered.");
  }
} catch (err) {
  log('error', `Failed to read or write the file: ${err.message}`);
}

console.log("\n-------------------------------------------------------");
log('info', "Repair sequence complete.");
console.log("-------------------------------------------------------\n");