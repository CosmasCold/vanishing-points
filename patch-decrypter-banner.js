const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - CLINICAL DECRYPTER CLUE INJECTION");
console.log("   TARGETING: DEC-12 RESIDUAL SOLSTICE ALERT BANNER");
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
  path.join(process.cwd(), 'components', 'signals', 'DecrypterModal.tsx'),
  path.join(process.cwd(), 'src', 'components', 'signals', 'DecrypterModal.tsx'),
  path.join(process.cwd(), 'components', 'DecrypterModal.tsx')
];

let targetPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    targetPath = p;
    break;
  }
}

if (!targetPath) {
  log('error', "Could not locate 'DecrypterModal.tsx' in your signals directory.");
  process.exit(1);
}

log('info', `Reading Decrypter at: ${targetPath}`);

try {
  let content = fs.readFileSync(targetPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Define the Alert Banner component markup
  const alertBannerMarkup = `
        {/* Decrypter Alert Banner - Solstice Rotational Offset Clue */}
        <div className="bg-amber-950/20 border-b border-amber-900/40 px-4 py-2 flex items-center gap-2 text-[10px] text-amber-500 font-mono animate-pulse" style={{ borderColor: 'rgba(138, 90, 0, 0.15)' }}>
          <span className="text-amber-500 font-bold shrink-0">⚠️ TELEMETRY RESIDUAL:</span>
          <span className="truncate">SOLSTICE WAVE SHIFT DETECTED (+2° ROTATIONAL DRIFT COUPLING ACTIVE) // CALIBRATE DIALS ACCORDINGLY</span>
        </div>`;

  if (content.includes('SOLSTICE WAVE SHIFT DETECTED')) {
    log('success', "✓ Decrypter Alert Banner is already patched and active in DecrypterModal.tsx!");
    process.exit(0);
  }

  // Find the closing button tag of the header
  const buttonPattern = '× CLOSE';
  const buttonIdx = content.indexOf(buttonPattern);

  if (buttonIdx === -1) {
    log('error', "Could not locate '× CLOSE' button within the header bar structure.");
    process.exit(1);
  }

  // From the button, find the next closing button tag </button>
  const closingButtonTag = '</button>';
  const endButtonIdx = content.indexOf(closingButtonTag, buttonIdx);

  if (endButtonIdx === -1) {
    log('error', "Could not find matching '</button>' tag.");
    process.exit(1);
  }

  // From the closing button tag, find the next closing div tag </div> which closes the header bar
  const closingDivTag = '</div>';
  const endHeaderDivIdx = content.indexOf(closingDivTag, endButtonIdx);

  if (endHeaderDivIdx === -1) {
    log('error', "Could not find closing '</div>' of the header bar.");
    process.exit(1);
  }

  const insertPosition = endHeaderDivIdx + closingDivTag.length;

  // Perform surgical insertion
  const updatedContent = content.substring(0, insertPosition) + alertBannerMarkup + content.substring(insertPosition);

  fs.writeFileSync(targetPath, updatedContent, 'utf8');
  log('success', "✓ Successfully injected the Solstice wave alert banner after the header bar!");
  log('info', "The DEC-12 telemetry interface will now render the critical +2 rotational offset clue.");

} catch (err) {
  log('error', `Failed to execute surgical patch: ${err.message}`);
}

console.log("\n-------------------------------------------------------");
log('info', "Patch execution completed.");
console.log("-------------------------------------------------------\n");
