const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("   SYSTEM-7B ARCHIVE - NARRATIVE CONTAINMENT UTILITY");
console.log("   TARGETING: UNGATED R&D TABS & EARLY GAME LORE LEAKS");
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

// 1. Gate tabs in ResearchPanel.tsx
function patchResearchPanel() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'research', 'ResearchPanel.tsx'),
    path.join(rootDir, 'src', 'components', 'research', 'ResearchPanel.tsx'),
    path.join(rootDir, 'components', 'ResearchPanel.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }

  if (!targetPath) {
    log('warn', "Could not locate 'ResearchPanel.tsx'. Skipping.");
    return false;
  }

  log('info', `Reading R&D Panel at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

  // Verify if already patched
  if (content.includes("tab === 'spectrometer' && dust < 25")) {
    log('success', "✓ R&D Panel tabs are already gated behind correct Dust indices.");
    return true;
  }

  // Look for tab click handler
  const oldHandler = [
    "const handleTabChange = (tab: any) => {",
    "    click();",
    "    setActiveTab(tab);",
    "  };"
  ].join('\n');

  const oldHandlerAlt = [
    "const handleTabChange = (tab: any) => {",
    "    click();",
    "    setActiveTab(tab);",
    "  };"
  ].join('\n');

  const newHandler = [
    "const handleTabChange = (tab: any) => {",
    "    click();",
    "    if (tab === 'spectrometer' && dust < 25) {",
    "      if (typeof play === 'function') play('error');",
    "      return;",
    "    }",
    "    if (tab === 'convergence' && dust < 65) {",
    "      if (typeof play === 'function') play('error');",
    "      return;",
    "    }",
    "    setActiveTab(tab);",
    "  };"
  ].join('\n');

  // Let's also verify that we can inject lock indicators onto the Tab buttons themselves
  // Search for the button rendering block to style locked tabs
  let patched = false;
  if (content.includes("const handleTabChange = (tab: any) => {")) {
    // Replace handleTabChange
    const startIndex = content.indexOf("const handleTabChange = (tab: any) => {");
    const endIndex = content.indexOf("};", startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
      content = content.substring(0, startIndex) + newHandler + content.substring(endIndex + 2);
      patched = true;
    }
  }

  // Also style the tab bar button items to show as locked!
  const targetSpectrometerBtn = "onClick={() => handleTabChange('spectrometer')}";
  const targetConvergenceBtn = "onClick={() => handleTabChange('convergence')}";

  if (patched) {
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Successfully gated R&D Spectrometer (25+ Dust) and Solstice Grid (65+ Dust)!");
  } else {
    log('warn', "Could not find standard handler signatures inside ResearchPanel.tsx.");
  }
  return patched;
}

// 2. Gate B7 Initialization Log in DecrypterModal.tsx
function patchDecrypterModal() {
  const possiblePaths = [
    path.join(rootDir, 'components', 'signals', 'DecrypterModal.tsx'),
    path.join(rootDir, 'src', 'components', 'signals', 'DecrypterModal.tsx'),
    path.join(rootDir, 'components', 'DecrypterModal.tsx')
  ];

  let targetPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { targetPath = p; break; }
  }

  if (!targetPath) {
    log('warn', "Could not locate 'DecrypterModal.tsx'. Skipping.");
    return false;
  }

  log('info', `Reading DecrypterModal at: ${targetPath}`);
  let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

  const oldB7Channel = [
    '    id: "bunker7-boot",',
    '    title: "B7 Initialization Log",',
    '    source: "B7_CORE_BUS",',
    '    dustUnlock: 0,'
  ].join('\n');

  const oldB7ChannelAlt = [
    '    id: "bunker7-boot",',
    '    title: "B7 Initialization Log",',
    '    source: "B7_CORE_BUS",',
    '    dustUnlock: 0,'
  ].join('\n');

  const newB7Channel = [
    '    id: "bunker7-boot",',
    '    title: "B7 Initialization Log",',
    '    source: "B7_CORE_BUS",',
    '    dustUnlock: 20,'
  ].join('\n');

  if (content.includes('id: "bunker7-boot"') && content.includes('dustUnlock: 20,')) {
    log('success', "✓ B7 Initialization Log is already gated at 20+ Dust.");
    return true;
  }

  let fixed = false;
  // Let's target the pattern dynamically
  const targetPattern = /id:\s*"bunker7-boot",\s*title:\s*"B7\s+Initialization\s+Log",\s*source:\s*"B7_CORE_BUS",\s*dustUnlock:\s*0/g;
  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, 'id: "bunker7-boot",\n    title: "B7 Initialization Log",\n    source: "B7_CORE_BUS",\n    dustUnlock: 20');
    fixed = true;
  } else {
    // Try literal replace
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('id: "bunker7-boot"') || lines[i].includes('id: \'bunker7-boot\'')) {
        for (let j = i; j < i + 5; j++) {
          if (lines[j].includes('dustUnlock: 0')) {
            lines[j] = lines[j].replace('dustUnlock: 0', 'dustUnlock: 20');
            fixed = true;
            break;
          }
        }
      }
      if (fixed) break;
    }
    content = lines.join('\n');
  }

  if (fixed) {
    fs.writeFileSync(targetPath, content, 'utf8');
    log('success', "✓ Gated B7 Initialization Log decryption channel behind Dust level 20 (Act II onboarding).");
  } else {
    log('warn', "Could not match B7 boot channel initialization pattern in DecrypterModal.tsx.");
  }
  return fixed;
}

// 3. Align database gating metrics to the Master Progression Matrix
function patchPlacesProgressMatrix() {
  const databasePaths = [
    path.join(rootDir, 'scripts', 'mapped-places.json'),
    path.join(rootDir, 'scripts', 'mapped-places-clean.json'),
    path.join(rootDir, 'places.json'),
    path.join(rootDir, 'data', 'places.ts'),
    path.join(rootDir, 'src', 'data', 'places.ts')
  ];

  const masters = {
    'aokigahara-forest': { tier: 1, dust: 30 },
    'the-stanley-hotel': { tier: 1, dust: 15 },
    'letchworth-village': { tier: 2, dust: 45 },
    'eloise-psychiatric-hospital': { tier: 2, dust: 55 },
    'willard-asylum-suitcases': { tier: 2, dust: 50 },
    'humberstone-saltpeter-works': { tier: 2, dust: 50 },
    'humberstone-saltpeter-morgue': { tier: 2, dust: 55 },
    'teufelsberg-echo-dome': { tier: 3, dust: 66 },
    'byberry-state-hospital': { tier: 3, dust: 66 },
    'poveglia-island': { tier: 3, dust: 70 },
    'poveglia-subterranean-ward': { tier: 3, dust: 70 },
    'chteau-de-brissac': { tier: 3, dust: 75 },
    'nocton-hall-raf-hospital': { tier: 3, dust: 75 },
    'the-leap-castle-bloody-chapel': { tier: 3, dust: 80 },
    'copemish-masonic-temple': { tier: 3, dust: 80 }
  };

  let filesPatched = 0;

  databasePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    log('info', `Reading Database File: ${filePath}`);
    try {
      let content = fs.readFileSync(filePath, 'utf8');

      if (filePath.endsWith('.json')) {
        let data = JSON.parse(content);
        let list = Array.isArray(data) ? data : (data.places || []);

        if (Array.isArray(list)) {
          let count = 0;
          list.forEach(p => {
            if (p && masters[p.slug]) {
              const rule = masters[p.slug];
              if (p.tier !== rule.tier) {
                p.tier = rule.tier;
                count++;
              }
              if (p.unlockCondition && p.unlockCondition.type === 'dust') {
                if (p.unlockCondition.value !== rule.dust) {
                  p.unlockCondition.value = rule.dust;
                  p.unlockCondition.message = `The grid requires more dust to resolve this location (${rule.dust}% Dust threshold).`;
                  count++;
                }
              }
            }
          });
          if (count > 0) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            log('success', `✓ Synchronized ${count} pacing keys inside JSON at: ${filePath}`);
            filesPatched++;
          } else {
            log('info', `• JSON matches progress matrix.`);
          }
        }
      } else if (filePath.endsWith('.ts')) {
        let changed = false;
        Object.keys(masters).forEach(slug => {
          const rule = masters[slug];
          // We can find lines inside data/places.ts and surgically adjust them if they don't match
          // Because places.ts is a static TS file, we can do string replaces of the slug structures
          const slugRegex = new RegExp(`"slug":\\s*"${slug}"`);
          if (slugRegex.test(content)) {
            // Find block limits
            const slugIdx = content.indexOf(`"slug": "${slug}"`);
            if (slugIdx !== -1) {
              const blockStart = content.lastIndexOf('{', slugIdx);
              const blockEnd = content.indexOf('}', slugIdx);
              if (blockStart !== -1 && blockEnd !== -1) {
                let block = content.substring(blockStart, blockEnd + 1);
                
                // Replace tier inside the block
                const tierRegex = /"tier":\s*\d+/;
                if (tierRegex.test(block)) {
                  block = block.replace(tierRegex, `"tier": ${rule.tier}`);
                  changed = true;
                }
                
                // Replace unlock condition value inside the block
                const valRegex = /"value":\s*\d+/;
                if (valRegex.test(block) && block.includes('"type": "dust"')) {
                  block = block.replace(valRegex, `"value": ${rule.dust}`);
                  changed = true;
                }

                content = content.substring(0, blockStart) + block + content.substring(blockEnd + 1);
              }
            }
          }
        });
        if (changed) {
          fs.writeFileSync(filePath, content, 'utf8');
          log('success', `✓ Surgically updated places.ts static type definitions.`);
          filesPatched++;
        } else {
          log('info', `• places.ts matches progress matrix.`);
        }
      }
    } catch (e) {
      log('error', `Could not synchronize progression matrix for ${filePath}: ${e.message}`);
    }
  });
  return filesPatched > 0;
}

const researchPatched = patchResearchPanel();
const decrypterPatched = patchDecrypterModal();
const dbPatched = patchPlacesProgressMatrix();

console.log("\n-------------------------------------------------------");
if (researchPatched || decrypterPatched || dbPatched) {
  log('success', "Master narrative pacing sweep and progression locks aligned successfully!");
} else {
  log('warn', "No pacing mismatches identified.");
}
console.log("-------------------------------------------------------\n");
