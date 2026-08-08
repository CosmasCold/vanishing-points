const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables securely from .env.local if available
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const URI = process.env.MONGODB_URI;

if (!URI) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: MONGODB_URI environment variable is not defined.');
  console.error('Please make sure you have a secure .env.local file configured at your project root.');
  console.error('Example contents:');
  console.error('MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.owp8s2t.mongodb.net/vanishing-points?retryWrites=true&w=majority\n');
  process.exit(1);
}

async function main() {
  const filePath = path.join(__dirname, 'mapped-places.json');
  if (!fs.existsSync(filePath)) {
    console.error('\x1b[31m%s\x1b[0m', `ERROR: Source data file not found at: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { places } = JSON.parse(raw);
  
  console.log(`\x1b[36m%s\x1b[0m`, `Connecting to secure database to seed ${places.length} places...`);
  
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db('vanishing-points');

    // Wipe previous collections safely and perform a clean upsert
    await db.collection('places').deleteMany({});
    const result = await db.collection('places').insertMany(places);

    console.log(`\x1b[32m%s\x1b[0m`, `Successfully seeded database!`);
    console.log(`Inserted ${result.insertedCount} locations into the places collection.`);
    
    // Print stats to confirm successful seed
    const dist = places.reduce((acc, p) => {
      acc[p.tier] = (acc[p.tier] || 0) + 1;
      return acc;
    }, {});
    console.log('Tier distribution mapped:', dist);
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Database operation failed: ${error.message}`);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
