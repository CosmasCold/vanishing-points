const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Parsed local environment variables from .env.local');
} else {
  console.warn('WARNING: .env.local file not found in current directory. Using system env.');
}

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('ERROR: MONGODB_URI is not defined in your environment or .env.local.');
  console.log('Please make sure your .env.local contains: MONGODB_URI=mongodb://localhost:27017/vanishing-points');
  process.exit(1);
}

// Extract database name from connection string or default to 'vanishing-points'
let dbName = 'vanishing-points';
try {
  const urlParsed = new URL(URI);
  const pathDb = urlParsed.pathname.replace(/^\//, '');
  if (pathDb) {
    dbName = pathDb;
    console.log(`Detected database name from connection URI: "${dbName}"`);
  } else {
    console.warn(`No database name found in connection URI. Defaulting to: "${dbName}"`);
  }
} catch (e) {
  console.warn(`Could not parse MONGODB_URI cleanly. Defaulting database name to: "${dbName}"`);
}

async function runSeed() {
  // Locate mapped-places.json
  const possiblePaths = [
    path.join(process.cwd(), 'scripts', 'mapped-places.json'),
    path.join(process.cwd(), 'mapped-places.json'),
    path.join(process.cwd(), 'scripts', 'mapped-places-clean.json'),
  ];

  let rawData = null;
  let selectedPath = '';

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      rawData = fs.readFileSync(p, 'utf-8');
      selectedPath = p;
      break;
    }
  }

  if (!rawData) {
    console.error('ERROR: Could not locate your mapped places dataset file.');
    console.log('Searched in:');
    possiblePaths.forEach(p => console.log(`  - ${p}`));
    console.log('\nPlease run your mapping engine first: npm run map-places');
    process.exit(1);
  }

  console.log(`Loaded places dataset from: ${selectedPath}`);

  let dataset;
  try {
    dataset = JSON.parse(rawData);
  } catch (err) {
    console.error(`ERROR: Failed to parse JSON data: ${err.message}`);
    process.exit(1);
  }

  // Support both direct array format and { places: [...] } wrapping
  const places = Array.isArray(dataset) ? dataset : (dataset.places || []);
  if (!Array.isArray(places) || places.length === 0) {
    console.error('ERROR: Loaded dataset does not contain an array of places.');
    process.exit(1);
  }

  console.log(`Dataset contains ${places.length} places. Sanitizing entries...`);

  // Sanitize data: Clean up any literal null values in connectedTo arrays
  let nullsCleaned = 0;
  const sanitizedPlaces = places.map((place) => {
    const sanitized = { ...place };
    
    // Convert old string IDs to native BSON ObjectId if they exist
    if (sanitized._id && typeof sanitized._id === 'object' && sanitized._id.$oid) {
      sanitized._id = new ObjectId(sanitized._id.$oid);
    } else if (sanitized._id && typeof sanitized._id === 'string' && sanitized._id.length === 24) {
      sanitized._id = new ObjectId(sanitized._id);
    } else {
      delete sanitized._id; // Let MongoDB generate it automatically on insert
    }

    // Clean connections web on-the-fly
    if (Array.isArray(sanitized.connectedTo)) {
      const originalLen = sanitized.connectedTo.length;
      sanitized.connectedTo = sanitized.connectedTo.filter(
        (slug) => typeof slug === 'string' && slug.trim() !== ''
      );
      const diff = originalLen - sanitized.connectedTo.length;
      if (diff > 0) nullsCleaned += diff;
    } else {
      sanitized.connectedTo = [];
    }

    return sanitized;
  });

  if (nullsCleaned > 0) {
    console.log(`✔ Sanitized ${nullsCleaned} null/invalid connection entries on-the-fly.`);
  }

  console.log(`Connecting to MongoDB at: ${URI.replace(/:([^:@]+)@/, ':****@')}`);
  const client = new MongoClient(URI);

  try {
    await client.connect();
    console.log('✔ Successfully connected to database daemon.');
    
    const db = client.db(dbName);
    const collection = db.collection('places');

    console.log(`Seeding places into collection: "${dbName}.places"...`);

    // Perform Upserts on Slug to avoid duplicates while updating details
    let upsertCount = 0;
    for (const place of sanitizedPlaces) {
      await collection.updateOne(
        { slug: place.slug },
        { $set: place },
        { upsert: true }
      );
      upsertCount++;
    }

    console.log(`✔ Seeding complete. Successfully upserted ${upsertCount} places.`);

    // Run verification diagnostics
    const dbCount = await collection.countDocuments();
    console.log('\n--- DIAGNOSTIC VERIFICATION ---');
    console.log(`Total places in collection "${dbName}.places": ${dbCount}`);
    
    if (dbCount === 0) {
      console.warn('WARNING: Database contains 0 places. Seeding failed or wrote to wrong collection.');
    } else if (dbCount < places.length) {
      console.warn(`WARNING: Seeded ${places.length} places, but database only lists ${dbCount}.`);
    } else {
      console.log('✔ Verification passed: Collection has fully synced.');
    }

    // Fetch a sample place to verify Mongoose schema matching
    const sample = await collection.findOne({ slug: 'the-grid-null-point' });
    if (sample) {
      console.log(`✔ Sample check: "the-grid-null-point" successfully verified in database (Status: ${sample.status}).`);
    } else {
      console.warn('WARNING: Could not find "the-grid-null-point" anchor node. Check seeder outputs.');
    }
    console.log('-------------------------------\n');

  } catch (err) {
    console.error(`FATAL ERROR: Connection or seed routine failed: ${err.message}`);
  } finally {
    await client.close();
    console.log('Database connection cleanly released.');
  }
}

runSeed();
