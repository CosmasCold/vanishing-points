// Immediately print to prove the file is executing
console.log("\n=============================================");
console.log("  DEBUG: Node.js process initialized successfully!");
console.log("=============================================");

const fs = require('fs');
const path = require('path');

// Let's resolve the path relative to the script itself
const INPUT_FILE = path.resolve(__dirname, 'mapped-places-clean.json');
const OUTPUT_FILE = path.resolve(__dirname, 'mapped-places-clean.json');

console.log(`Targeting dataset at: ${INPUT_FILE}`);

function cleanConnectionWeb() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`\x1b[31mError: Target file not found at ${INPUT_FILE}\x1b[0m`);
    console.log("Please check if 'mapped-places-clean.json' is in your 'scripts' folder.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
  let data;
  try {
    data = JSON.parse(rawData);
  } catch (err) {
    console.error(`\x1b[31mError parsing JSON: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  const places = Array.isArray(data) ? data : data.places;
  if (!Array.isArray(places)) {
    console.error('\x1b[31mError: Invalid dataset structure. Missing places list.\x1b[0m');
    process.exit(1);
  }

  let totalNullsRemoved = 0;
  let placesModifiedCount = 0;

  places.forEach((place) => {
    if (place && Array.isArray(place.connectedTo)) {
      const originalLength = place.connectedTo.length;
      
      // Filter out null elements, non-strings, or empty entries
      place.connectedTo = place.connectedTo.filter(
        (slug) => slug !== null && typeof slug === 'string' && slug.trim() !== ""
      );

      const nullsFound = originalLength - place.connectedTo.length;
      if (nullsFound > 0) {
        placesModifiedCount++;
        totalNullsRemoved += nullsFound;
        console.log(`  • Cleansed ${place.name || place.slug}: Removed ${nullsFound} null connection(s)`);
      }
    }
  });

  if (totalNullsRemoved === 0) {
    console.log('\x1b[32m✔ Success: Connection web is already completely clean! No null elements detected.\x1b[0m');
    return;
  }

  const finalOutput = Array.isArray(data) ? places : { ...data, places };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2), 'utf-8');
  console.log(`\x1b[32m✔ Success! Cleaned ${totalNullsRemoved} nulls across ${placesModifiedCount} places.\x1b[0m`);
}

// Execute the function
cleanConnectionWeb();