const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - VICTORIAN LIBRARY & TACTILE OVERHAUL");
console.log("   TARGETING: FLAT LINES, HARD CORNERS, & TYPOGRAPHY SKEW");
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

// 1. Update globals.css with Molded Corners, Manila cards, and Rivets
function overhaulGlobalsCss() {
  const possiblePaths = [
    path.join(process.cwd(), 'app', 'globals.css'),
    path.join(process.cwd(), 'src', 'app', 'globals.css'),
    path.join(process.cwd(), 'globals.css')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('warn', 'Could not locate globals.css. Skipping.');
    return false;
  }

  log('info', `Located globals.css at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

  // Inject molded corners, manila-sheet, and brass rivets classes
  const aestheticAdditions = `
/* ═══════════════════════════════════════════════════════════════
   VICTORIAN ARCHIVE & TACTILE OVERHAUL INJECTIONS
═══════════════════════════════════════════════════════════════ */

/* Molded rounded corners mimicking 1950s stamped steel/bakelite moldings */
.btn-tactile {
  border-radius: 4px !important;
}
.modal-chassis {
  border-radius: 6px !important;
}
.sunken-panel {
  border-radius: 4px !important;
  box-shadow: 
    inset 0 3px 10px rgba(0, 0, 0, 0.95), 
    0 1px 0 rgba(255, 255, 255, 0.02) !important;
}

/* Immersive, weathered manila cardstock for archival paper documents */
.manila-sheet {
  background-color: #f1ebd9 !important; /* Muted antique manila folder */
  background-image: 
    linear-gradient(rgba(139, 90, 43, 0.02) 1px, transparent 1px), /* Faint ruled lines */
    radial-gradient(circle at 10% 10%, rgba(0,0,0,0) 60%, rgba(139, 90, 43, 0.05) 100%) !important; /* Aging stain */
  background-size: 100% 24px, 100% 100% !important;
  color: #2b231a !important; /* Faded carbon-black/sepia typewriter ink */
  border: 1px solid #c8bea9 !important;
  border-right: 2px solid #bdae96 !important;
  border-bottom: 3px solid #b09f83 !important;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.65), 
    inset 0 0 40px rgba(139, 90, 43, 0.08) !important;
  border-radius: 3px !important;
}

/* Redacted text boxes inside manila documents */
.manila-redaction {
  background-color: #1e1914 !important;
  color: #1e1914 !important;
  border-radius: 1px !important;
  padding: 0 2px !important;
}

/* Brass Rivets absolute positioning decoration */
.brass-rivet {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e1af6a 0%, #a47c3f 50%, #4f3310 100%) !important;
  box-shadow: 
    0 1.5px 3px rgba(0, 0, 0, 0.85), 
    inset 0 -1px 1px rgba(0, 0, 0, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.3) !important;
  z-index: 10;
}

/* Dark leather-embossed backing texture for case notebooks */
.leather-notepad {
  background-color: #110e0c !important; /* Rich very dark mahogany */
  background-image: 
    radial-gradient(circle at center, rgba(32, 22, 18, 0.3) 0%, transparent 100%),
    url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/feTurbulence%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E") !important; /* Thick textured animal grain */
  border: 2px solid #201815 !important;
  border-radius: 5px !important;
  box-shadow: 
    inset 0 2px 10px rgba(0, 0, 0, 0.95), 
    0 8px 32px rgba(0, 0, 0, 0.8) !important;
}
`;

  if (!content.includes('manila-sheet')) {
    content += aestheticAdditions;
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', '✓ Injected Molded Corners, Manila cardstock, Brass rivets, and Leather textures into globals.css.');
    return true;
  }
  log('info', '• globals.css is already upgraded with tactile styles.');
  return true;
}

// 2. Overhaul DocumentViewer.tsx to render Serif text on Manila paper
function overhaulDocumentViewer() {
  const possiblePaths = [
    path.join(process.cwd(), 'components', 'documents', 'DocumentViewer.tsx'),
    path.join(process.cwd(), 'src', 'components', 'documents', 'DocumentViewer.tsx')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('warn', 'Could not locate DocumentViewer.tsx. Skipping.');
    return false;
  }

  log('info', `Located DocumentViewer.tsx at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');
  let updated = false;

  // Swap the paper display sheet classes
  // Locate the layout div representing the printed sheet and swap its dark theme classes with manila paper styles
  if (content.includes('font-mono') && !content.includes('manila-sheet')) {
    content = content.replace(
      /className="max-w-2xl mx-auto my-auto p-8 border bg-[^"]+"/,
      'className="max-w-2xl mx-auto my-auto p-10 manila-sheet font-serif relative"'
    );
    content = content.replace(
      /className="w-\[600px\] min-h-\[750px\] p-12 border bg-[^"]+"/,
      'className="w-[600px] min-h-[750px] p-12 manila-sheet font-serif relative"'
    );

    // Inject 4 brass rivets into the corners of the document layout context to sell the heavy bolted instrument board illusion!
    const rivetInjections = `
        {/* Immersive Victorian Brass Rivets bolted into the desk chassis corners */}
        <div className="brass-rivet top-3 left-3" />
        <div className="brass-rivet top-3 right-3" />
        <div className="brass-rivet bottom-3 left-3" />
        <div className="brass-rivet bottom-3 right-3" />`;

    if (content.includes('manila-sheet') && !content.includes('brass-rivet')) {
      content = content.replace(
        'className="max-w-2xl mx-auto my-auto p-10 manila-sheet font-serif relative">',
        'className="max-w-2xl mx-auto my-auto p-10 manila-sheet font-serif relative">\n' + rivetInjections
      );
      content = content.replace(
        'className="w-[600px] min-h-[750px] p-12 manila-sheet font-serif relative">',
        'className="w-[600px] min-h-[750px] p-12 manila-sheet font-serif relative">\n' + rivetInjections
      );
    }

    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', '✓ Patched DocumentViewer.tsx to render gorgeous Serif typewriter content on antique manila cardstock sheets.');
    updated = true;
  }

  return updated;
}

// 3. Overhaul NotesPanel.tsx to feel like a heavy embossed leather notepad
function overhaulNotesPanel() {
  const possiblePaths = [
    path.join(process.cwd(), 'components', 'investigation', 'NotesPanel.tsx'),
    path.join(process.cwd(), 'src', 'components', 'investigation', 'NotesPanel.tsx')
  ];
  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }
  if (!targetPath) {
    log('warn', 'Could not locate NotesPanel.tsx. Skipping.');
    return false;
  }

  log('info', `Located NotesPanel.tsx at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

  // Replace the outer container and textarea class wrappers with the rich .leather-notepad style
  if (content.includes('NotesPanelProps') && !content.includes('leather-notepad')) {
    content = content.replace(
      'className="max-w-3xl h-full flex flex-col"',
      'className="max-w-3xl h-full flex flex-col p-6 leather-notepad relative"'
    );

    // Modify textarea properties (change background from surface to wood-leather charcoal and font to serif)
    content = content.replace(
      /backgroundColor:\s*colors\.archive\.surface/g,
      "backgroundColor: '#1b1411'"
    );
    content = content.replace(
      /fontFamily:\s*typography\.mono/g,
      "fontFamily: typography.serif"
    );
    content = content.replace(
      /color:\s*colors\.archive\.white/g,
      "color: '#ebd6be', textShadow: '0 0 2px rgba(223,178,124,0.1)'"
    );

    // Inject copper studs/rivets into the leather casing!
    const cornerStuds = `
        {/* Hand-hammered brass corner studs in leather-bound backing board */}
        <div className="brass-rivet top-2 left-2" />
        <div className="brass-rivet top-2 right-2" />
        <div className="brass-rivet bottom-2 left-2" />
        <div className="brass-rivet bottom-2 right-2" />`;

    content = content.replace(
      'className="max-w-3xl h-full flex flex-col p-6 leather-notepad relative">',
      'className="max-w-3xl h-full flex flex-col p-6 leather-notepad relative">\n' + cornerStuds
    );

    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', '✓ Upgraded NotesPanel.tsx to represent a leather-bound, brass-studded observer ledger with aged ivory ink.');
    return true;
  }

  log('info', '• NotesPanel.tsx already has its leather-bound overhaul.');
  return true;
}

// Execute repairs
const cssPatched = overhaulGlobalsCss();
const docPatched = overhaulDocumentViewer();
const notesPatched = overhaulNotesPanel();

console.log("\n-------------------------------------------------------");
if (cssPatched || docPatched || notesPatched) {
  log('success', "Victorian Library and Tactile Design Overhaul applied perfectly!");
} else {
  log('warn', "Workstation was already aligned to current aesthetic specifications.");
}
console.log("-------------------------------------------------------\n");
