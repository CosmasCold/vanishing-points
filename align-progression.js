const fs = require('fs');
const path = require('path');

console.log("\n====================================================================");
console.log("   SYSTEM-7B ARCHIVE - NARRATIVE PROGRESSION ALIGNMENT SYSTEM");
console.log("   IMPORTS: COGNITIVE GATING MATCH & BOARD SLUGS AUDIT");
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

// --------------------------------------------------------------------
// 1. CANONICAL COGNITIVE GATES FROM MASTER INDEX (ACT I - ACT V)
// --------------------------------------------------------------------
const CANONICAL_GATES = {
  // ACT I - Tier 0
  'stelmo-light': { tier: 0, type: null, value: 0, message: null },
  'bodie-ghost-town': { tier: 0, type: null, value: 0, message: null },
  'borovsko-bridge': { tier: 0, type: null, value: 0, message: null },
  'wittenoom': { tier: 0, type: null, value: 0, message: null },
  'sedlec-ossuary': { tier: 0, type: null, value: 0, message: null },
  'canfranc-international-railway-station': { tier: 0, type: null, value: 0, message: null },
  'spreepark-berlin': { tier: 0, type: null, value: 0, message: null },
  'rhyolite': { tier: 0, type: null, value: 0, message: null },

  // ACT II - Tier 1
  'gila-river-relocation-center': { tier: 1, type: 'dust', value: 15, message: "The camp barracks are gone, but the outlines remain sterile. The grid requires more dust to resolve this internment block." },
  'pripyat-amusement-park': { tier: 1, type: 'dust', value: 15, message: "The Ferris wheel never turned for paying customers. The bumper cars remain locked. Accumulate dust to map what was cancelled." },
  'hashima-island': { tier: 1, type: 'dust', value: 20, message: "Concrete towers on a basalt battleship. The mine has been flooded since 1974. Earn more dust to cross the seawall." },
  'bhangarh-fort': { tier: 1, type: 'dust', value: 20, message: "The roofs are collapsing and the mortar is wet. Entry forbidden between sunset and sunrise. Higher dust is required to enter the gates." },
  'isla-de-las-muecas': { tier: 1, type: 'dust', value: 25, message: "The dolls hang from the branches, eyes tracking movement. The canal carries too much static residue. Accumulate dust to land." },
  'kuldhara': { tier: 1, type: 'dust', value: 25, message: "Eighty-four Paliwal villages abandoned in a single night. The curse is still wet in the wells. Significant dust required to map." },
  'aokigahara-forest': { tier: 1, type: 'dust', value: 30, message: "The forest absorbs all sound. Compasses spin in volcanic rock. The grid requires maximum dust of Act II to map these roots." },
  'nara-dreamland': { tier: 1, type: 'dust', value: 30, message: "A silent fairytale kingdom rotting behind barbed wire. The plaster castles shiver. Accumulate dust to unlock." },

  // ACT III - Tier 2
  'pripyat-hospital-126': { tier: 2, type: 'dust', value: 40, message: "The basement holds the liquidators' uniforms, too hot to move. The Geiger counter is listening. Extreme dust required." },
  'duga-radar-array': { tier: 2, type: 'dust', value: 40, message: "NATO called it the Russian Woodpecker. The lattice groans in the radioactive wind. The grid requires more dust to track its signal." },
  'duga-control-room': { tier: 2, type: 'dust', value: 45, message: "Receivers and master clocks frozen at the reactor's fatal second. The printout paper extends itself. Unlocks at dust 45." },
  'letchworth-village': { tier: 2, type: 'dust', value: 45, message: "Grave markers in the woods are numbered bronze spikes. The skipped numbers form a counterclockwise spiral pointing to the medical center. Dust 45+ required." },
  'willard-asylum-suitcases': { tier: 2, type: 'dust', value: 50, message: "Four hundred twenty-seven suitcases left in the attic. They are empty, but the emptiness is recent. The grid needs significant dust to map what was left behind." },
  'humberstone-saltpeter-works': { tier: 2, type: 'dust', value: 50, message: "The Atacama Desert preserves everything. The theater seats still face a blank screen. Significant dust required to open this case." },
  'humberstone-saltpeter-morgue': { tier: 2, type: 'dust', value: 55, message: "The pine organ scale registers 1.2 kilograms with nothing on it. The bloodstain is a map drawn before the town was built. Dust 55+ required." },
  'eloise-psychiatric-hospital': { tier: 2, type: 'dust', value: 55, message: "subterranean tunnels filled with concrete that remains soft and sweating coal tar. Handprints appear overnight. Dust 55+ required." },

  // ACT IV - Tier 3
  'teufelsberg-echo-dome': { tier: 3, type: 'dust', value: 66, message: "NSA Dome 3 is an acoustic test facility. Whisper and the mountain whispers back. Whispered inputs shiver the terminal. Unlocks at dust 66." },
  'byberry-state-hospital': { tier: 3, type: 'dust', value: 66, message: "Demolished in 2006, yet the basement cages still contain fresh straw and rattle. The cracks form the word HUNGRY. Dust 66+ required." },
  'poveglia-subterranean-ward': { tier: 3, type: 'dust', value: 70, message: "Orderlies found catatonic behind a plaster wall. Twelve iron beds, all facing the wall. Bricks weep saltwater. Dust 70+ required." },
  'poveglia-island': { tier: 3, type: 'dust', value: 70, message: "The soil is fifty percent plague ash. Compasses fail and the water moves when the silent tower tolls. Unlocks at dust 70." },
  'chteau-de-brissac': { tier: 3, type: 'dust', value: 75, message: "Jacques de Brézé caught his wife Charlotte in flagrante. She wanders the chapel tower in green. The chapel organ plays itself. Dust 75+ required." },
  'nocton-hall-raf-hospital': { tier: 3, type: 'dust', value: 75, message: "A Victorian manor used as a military burn unit. The gray lady walks the staircase crying. Dust 75+ required." },
  'the-leap-castle-bloody-chapel': { tier: 3, type: 'dust', value: 80, message: "The priest was stabbed at the altar. The oubliette contained one hundred and fifty skeletons missing their feet. Dust 80+ required." },
  'copemish-masonic-temple': { tier: 3, type: 'dust', value: 80, message: "The windows are painted black. Forty chairs are arranged in a semicircle facing east, dusted and vacuumed by no one. Dust 80+ required." },

  // ACT V - Tier 3 (Mirages)
  'mount-weather-emergency-operations-center': { tier: 3, type: 'dust', value: 85, status: 'mirage', message: "Classified underground bunkers vibrating at a synchronized 4.5 Hz granite carrier hum. solstices folding space. Unlocks at dust 85." },
  'cheyenne-mountain-complex': { tier: 3, type: 'dust', value: 85, status: 'mirage', message: "All communication lines fold into the empty Kansas field. The mountain is breathing. Mirage resolves at dust 85." },
  'raven-rock-mountain-complex': { tier: 3, type: 'dust', value: 85, status: 'mirage', message: "A phantom phone call at 03:14 on the winter solstice emitting a child's laughter. Resonance active. Resolves at dust 85." },
  'the-grid-null-point': { tier: 3, type: null, value: 0, status: 'mirage', message: "It is not a place. It is a coordinate where mapping fails. The wheat grows in a counterclockwise rotating spiral. Unlocks strictly via geodetic centroid felt connection." }
};

// --------------------------------------------------------------------
// 2. EXPANDED CORE_CASE_SLUGS REGISTRY INCLUDING AOKIGAHARA FOREST
// --------------------------------------------------------------------
const EXPANDED_CASE_SLUGS = [
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
  'wittenoom',
  'aokigahara-forest' // ← CRITICAL NARRATIVE RESTORATION (Aokigahara Forest added!)
].sort();

// --------------------------------------------------------------------
// 3. CODEBASE FILE SCANNING & ALIGNMENT
// --------------------------------------------------------------------

// Part A: Update CORE_CASE_SLUGS inside component files
const componentPaths = [
  path.join(process.cwd(), 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
  path.join(process.cwd(), 'components', 'investigation', 'InvestigationsPanel.tsx'),
  path.join(process.cwd(), 'src', 'components', 'evidenceBoard', 'EvidenceBoard.tsx'),
  path.join(process.cwd(), 'src', 'components', 'investigation', 'InvestigationsPanel.tsx'),
];

let componentsUpdated = 0;

componentPaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;

  log('info', `Found core slug definitions inside: ${filePath}`);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern matcher to find Set declarations of CORE_CASE_SLUGS
    const regex = /const\s+CORE_CASE_SLUGS\s+=\s+new\s+Set\(\[([\s\S]*?)\]\);/;
    const match = content.match(regex);

    if (match) {
      const existingBlock = match[1];
      
      // If it already includes aokigahara-forest, skip
      if (existingBlock.includes('aokigahara-forest')) {
        log('success', `✓ Slug registry is already fully integrated inside: ${path.basename(filePath)}`);
        componentsUpdated++;
        return;
      }

      // Generate replacement block with expanded sorted array
      const formattedSlugs = EXPANDED_CASE_SLUGS.map(s => `  '${s}'`).join(',\n');
      const replacement = `const CORE_CASE_SLUGS = new Set([\n${formattedSlugs}\n]);`;

      content = content.replace(regex, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      log('success', `✓ Successfully integrated 'aokigahara-forest' into slug index of: ${path.basename(filePath)}`);
      componentsUpdated++;
    } else {
      log('warn', `Could not match the CORE_CASE_SLUGS Set pattern in: ${filePath}`);
    }
  } catch (err) {
    log('error', `Error updating components index: ${err.message}`);
  }
});

// Part B: Update Places database JSON structures
const dbPaths = [
  path.join(process.cwd(), 'scripts', 'mapped-places.json'),
  path.join(process.cwd(), 'scripts', 'mapped-places-clean.json'),
  path.join(process.cwd(), 'places.json'),
  path.join(process.cwd(), 'data', 'mapped-places.json'),
];

let databasesPatched = 0;

dbPaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;

  log('info', `Found database records at: ${filePath}`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(raw);
    let placesList = Array.isArray(data) ? data : (data.places || []);

    if (!Array.isArray(placesList)) {
      log('error', `Failed to parse places database in ${filePath}. Invalid array.`);
      return;
    }

    let patchCount = 0;

    placesList.forEach(place => {
      if (!place || !place.slug) return;

      const canonical = CANONICAL_GATES[place.slug];
      if (canonical) {
        let changed = false;

        // Align Tier
        if (place.tier !== canonical.tier) {
          place.tier = canonical.tier;
          changed = true;
        }

        // Align Status for mirages
        if (canonical.status && place.status !== canonical.status) {
          place.status = canonical.status;
          changed = true;
        }

        // Align Unlock Conditions (Dust level values)
        if (canonical.type === 'dust') {
          if (!place.unlockCondition || place.unlockCondition.type !== 'dust' || place.unlockCondition.value !== canonical.value) {
            place.unlockCondition = {
              type: 'dust',
              value: canonical.value,
              message: canonical.message || `Accumulate dust to resolve ${place.name}.`
            };
            changed = true;
          }
        } else if (canonical.type === null) {
          if (place.unlockCondition !== null && place.slug !== 'the-grid-null-point') {
            place.unlockCondition = null;
            changed = true;
          }
        }

        if (changed) {
          patchCount++;
        }
      }
    });

    if (patchCount > 0) {
      const updatedData = Array.isArray(data) ? placesList : { ...data, places: placesList };
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
      log('success', `✓ Aligned ${patchCount} anomalous place unlock parameters inside: ${path.basename(filePath)}`);
      databasesPatched++;
    } else {
      log('success', `✓ All place gates inside ${path.basename(filePath)} are perfectly synchronized!`);
      databasesPatched++;
    }

  } catch (err) {
    log('error', `Error reading or compiling database files: ${err.message}`);
  }
});

console.log("\n--------------------------------------------------------------------");
if (componentsUpdated > 0 || databasesPatched > 0) {
  log('success', `Progression gating alignment completely resolved across ${componentsUpdated} files and ${databasesPatched} datasets!`);
  log('info', "The terminal is now fully compliant with level-4 Restricted System guidelines.");
} else {
  log('warn', "No target components or databases were resolved. Run this script directly in your Next.js project root.");
}
console.log("--------------------------------------------------------------------\n");
