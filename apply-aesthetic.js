const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("  DEPARTMENT OF DEFENSE // FEMA ARCHIVAL DIVISION -- EMERGENCY REPAIR");
console.log("  SYSTEM-7B WORKSTATION CALIBRATION: SCREEN FLASHING & WIDGET GATING");
console.log("====================================================================\n");

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

// 1. Inject compile-safe .mahogany-console class definitions to globals.css
function patchGlobalsCSS() {
  const globalsPath = findFile('globals.css', ['app']);
  if (!globalsPath) {
    log('warn', 'Could not locate globals.css inside app/ directory. Skipping CSS definition.');
    return false;
  }

  log('info', `Located globals.css at: ${globalsPath}`);
  let content = fs.readFileSync(globalsPath, 'utf8').replace(/\r\n/g, '\n');
  let updated = false;

  const styleClassMarker = '/* CLASSIFIED MAHOGANY CONSOLE BACKING CLASS */';
  if (!content.includes(styleClassMarker) && !content.includes('.mahogany-console')) {
    const classBlock = `\n${styleClassMarker}\n.mahogany-console {\n  background-color: #0f0b08 !important;\n  background-image: radial-gradient(circle at center, rgba(40, 30, 20, 0.45) 0%, transparent 85%), url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E") !important;\n}\n`;
    content += classBlock;
    fs.writeFileSync(globalsPath, content, 'utf8');
    log('success', '✓ Injected compile-safe .mahogany-console class definitions to globals.css.');
    updated = true;
  } else {
    log('info', '• .mahogany-console background style class is already registered in globals.css.');
  }
  return true;
}

// 2. Clear inline JSX style syntax error from InvestigationView.tsx
function patchInvestigationView() {
  const viewPath = findFile('InvestigationView.tsx', ['components', 'investigation']);
  if (!viewPath) {
    log('error', 'Could not locate InvestigationView.tsx. Skipping JSX compile fix.');
    return false;
  }

  log('info', `Located InvestigationView at: ${viewPath}`);
  let content = fs.readFileSync(viewPath, 'utf8').replace(/\r\n/g, '\n');

  // Multi-line regex targeting style attribute with unescaped single quotes inside the main div container
  const brokenStyleRegex = /<div\s+className="absolute inset-0 flex flex-col z-10"\s+style=\{\{[\s\S]*?\}\}\s*>/;

  if (brokenStyleRegex.test(content)) {
    content = content.replace(brokenStyleRegex, '<div className="absolute inset-0 flex flex-col z-10 mahogany-console">');
    fs.writeFileSync(viewPath, content, 'utf8');
    log('success', '✓ Successfully purged inline style syntax block and replaced with clean className="mahogany-console".');
    return true;
  }

  // Generic fallback if className is slightly different
  const brokenStyleGenericRegex = /<div\s+className="([^"]+)"\s+style=\{\{[\s\S]*?(?:radial-gradient|feTurbulence)[\s\S]*?\}\}\s*>/;
  if (brokenStyleGenericRegex.test(content)) {
    content = content.replace(brokenStyleGenericRegex, (match, classes) => {
      const cleanClasses = classes.includes("mahogany-console") ? classes : `${classes} mahogany-console`;
      return `<div className="${cleanClasses}">`;
    });
    fs.writeFileSync(viewPath, content, 'utf8');
    log('success', '✓ Successfully cleaned up generic background style tag on InvestigationView.');
    return true;
  }

  log('info', '• InvestigationView background looks clean or is already compiled-safe.');
  return true;
}

// 3. Bulletproof gating of Strowger and Geiger widgets to only appear inside system panel
function patchDashboardShell() {
  const shellPath = findFile('DashboardShell.tsx', ['components']);
  if (!shellPath) {
    log('error', 'Could not locate DashboardShell.tsx. Skipping widget gating.');
    return false;
  }

  log('info', `Located DashboardShell at: ${shellPath}`);
  let content = fs.readFileSync(shellPath, 'utf8').replace(/\r\n/g, '\n');

  // Check if already wrapped
  if (content.includes("activeModule === 'system'") || content.includes('activeModule === "system"')) {
    log('info', '• Dashboard Shell floating widgets are already wrapped in system check.');
    return true;
  }

  // Matches the absolute container that wraps GeigerHUD and StrowgerStepper regardless of their tag orders
  const containerPattern = /(<div\s+className="absolute[^"]*right-4[^"]*"[\s\S]*?>[\s\S]*?(?:<GeigerHUD|<StrowgerStepper)[\s\S]*?(?:<GeigerHUD|<StrowgerStepper)[\s\S]*?<\/div>)/;

  if (containerPattern.test(content)) {
    content = content.replace(containerPattern, (match, block) => {
      return `{\n    activeModule === 'system' && (\n      ${block.trim()}\n    )\n  }`;
    });
    fs.writeFileSync(shellPath, content, 'utf8');
    log('success', '✓ Wrapped Geiger and Strowger widgets in activeModule conditional guard.');
    return true;
  }

  log('warn', '• Could not find floating widgets absolute container in DashboardShell.tsx.');
  return false;
}

const globalsDone = patchGlobalsCSS();
const viewDone = patchInvestigationView();
const shellDone = patchDashboardShell();

console.log("\n--------------------------------------------------------------------");
if (globalsDone || viewDone || shellDone) {
  log('success', "EMERGENCY SYSTEM-7B RECOVERY COMPLETED SUCCESSFULLY!");
  log('info', "Run your local production build 'npm run build' to confirm absolute sync.");
} else {
  log('warn', "No modifications were necessary. Cores appear in consensus alignment.");
}
console.log("--------------------------------------------------------------------\n");
