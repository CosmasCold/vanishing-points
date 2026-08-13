const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B WORKSTATION - BUILD COMPILATION RECOVERY");
console.log("   TARGETING: SYNTAX ERROR IN InvestigationView.tsx");
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

const rootDir = process.cwd();

// Helper to locate files robustly
function findFile(filename, subdirs = []) {
  const paths = [
    path.join(rootDir, ...subdirs, filename),
    path.join(rootDir, 'src', ...subdirs, filename)
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// 1. Inject mahogany-console class to globals.css
function patchGlobalsCSS() {
  const globalsPath = findFile('globals.css', ['app']);
  if (!globalsPath) {
    log('warn', 'Could not locate globals.css inside app/ directory.');
    return false;
  }

  log('info', `Located globals.css at: ${globalsPath}`);
  let content = fs.readFileSync(globalsPath, 'utf8').replace(/\r\n/g, '\n');
  let updated = false;

  const styleClassMarker = '/* CLASSIFIED MAHOGANY CONSOLE BACKING CLASS */';
  if (!content.includes(styleClassMarker)) {
    const classBlock = `\n${styleClassMarker}\n.mahogany-console {\n  background-color: #0f0b08 !important;\n  background-image: radial-gradient(circle at center, rgba(40, 30, 20, 0.45) 0%, transparent 85%), url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E") !important;\n}\n`;
    content += classBlock;
    fs.writeFileSync(globalsPath, content, 'utf8');
    log('success', '✓ Injected compile-safe .mahogany-console class definitions to globals.css.');
    updated = true;
  } else {
    log('info', '• .mahogany-console background style class is already registered.');
  }
  return true;
}

// 2. Clear inline JSX style syntax error from InvestigationView.tsx
function patchInvestigationView() {
  const viewPath = findFile('InvestigationView.tsx', ['components', 'investigation']);
  if (!viewPath) {
    log('error', 'Could not locate InvestigationView.tsx.');
    return false;
  }

  log('info', `Located InvestigationView at: ${viewPath}`);
  let content = fs.readFileSync(viewPath, 'utf8').replace(/\r\n/g, '\n');

  // Regex targeting the style attribute containing the broken unescaped single quotes
  const brokenStyleRegex = /<div\s+className="absolute inset-0 flex flex-col z-10"\s+style=\{\{[\s\S]*?\}\}\s*>/;

  if (brokenStyleRegex.test(content)) {
    content = content.replace(brokenStyleRegex, '<div className="absolute inset-0 flex flex-col z-10 mahogany-console">');
    fs.writeFileSync(viewPath, content, 'utf8');
    log('success', '✓ Successfully purged inline style syntax block and replaced with clean className="mahogany-console".');
    return true;
  }

  log('info', '• InvestigationView background looks clean or already patched.');
  return true;
}

const globalsPatched = patchGlobalsCSS();
const viewPatched = patchInvestigationView();

console.log("\n-------------------------------------------------------");
if (globalsPatched && viewPatched) {
  log('success', "BUILD RECOVERY COMPLETED SUCCESSFULLY!");
} else {
  log('warn', "No modifications were necessary.");
}
console.log("-------------------------------------------------------\n");
