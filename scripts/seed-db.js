const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const URI = "mongodb://coldcosmas_db_user:Ridgewater@cluster0-shard-00-00.owp8s2t.mongodb.net:27017,cluster0-shard-00-01.owp8s2t.mongodb.net:27017,cluster0-shard-00-02.owp8s2t.mongodb.net:27017/vanishing-points?ssl=true&replicaSet=atlas-xyz-shard-0&authSource=admin&retryWrites=true&w=majority";

async function main() {
  const filePath = path.join(__dirname, 'mapped-places.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { places } = JSON.parse(raw);

  console.log(`Seeding ${places.length} places...`);

  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db('vanishing-points');

  await db.collection('places').deleteMany({});
  const result = await db.collection('places').insertMany(places);

  console.log(`Inserted ${result.insertedCount} places`);
  console.log('Tier distribution:', places.reduce((acc, p) => {
    acc[p.tier] = (acc[p.tier] || 0) + 1;
    return acc;
  }, {}));

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});