const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE REPAIR PROTOCOL // BUILD RECOVERY");
console.log("   TARGETING: TYPESCRIPT COMPILER NULL ASSIGNMENT ERROR");
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

function repairBuildTypes() {
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'places.ts'),
    path.join(process.cwd(), 'src', 'data', 'places.ts')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    log('warn', 'Could not locate data/places.ts or src/data/places.ts. Skipping.');
    return false;
  }

  log('info', `Reading places corpus at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8');

  // Normalize CRLF to LF
  content = content.replace(/\r\n/g, '\n');

  // We look for "unlockCondition": null, and remove it entirely.
  // In TypeScript, optional properties can be omitted (undefined), but cannot be assigned null.
  const nullPattern = /"unlockCondition":\s*null,?\n?/g;

  if (nullPattern.test(content)) {
    content = content.replace(nullPattern, '');
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', `Successfully removed all "unlockCondition": null assignments from ${targetPath}!`);
    return true;
  } else {
    log('info', 'No literal null assignments for unlockCondition detected in places.ts.');
    return true;
  }
}

const success = repairBuildTypes();

console.log("\n-------------------------------------------------------");
if (success) {
  log('success', "TypeScript compilation build alignment complete. Re-run 'npm run build' or deploy to Vercel!");
} else {
  log('warn', "No patches applied. Ensure you are in your project root.");
}
console.log("-------------------------------------------------------\n");
