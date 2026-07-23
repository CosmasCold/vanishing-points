const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      country TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      intensity INTEGER DEFAULT 1,
      yearAbandoned TEXT,
      imageUrl TEXT,
      sourceUrl TEXT,
      status TEXT DEFAULT 'pending',
      submittedBy TEXT,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) console.error('Error creating table:', err);
    else seedInitialData();
  });
}

// Seed with the original 100 places
function seedInitialData() {
  db.get("SELECT COUNT(*) as count FROM places WHERE status = 'approved'", [], (err, row) => {
    if (err) return;
    if (row.count > 0) return; // Already seeded

    const places = [
      // Ghost Cities
      { name: "Kangbashi District", location: "Ordos, Inner Mongolia", country: "China", lat: 39.608, lng: 109.781, category: "Ghost Cities", description: "A massive planned city built for 300,000 people that remains largely empty. Vast boulevards, modern architecture, and an opera house stand silent among a population of just a few thousand.", intensity: 4, yearAbandoned: "2010s" },
      { name: "Pripyat", location: "Kyiv Oblast", country: "Ukraine", lat: 51.404, lng: 30.054, category: "Ghost Cities", description: "The city that housed Chernobyl's workers was evacuated in 86 hours in 1986. Schools, amusement parks, and apartment blocks remain frozen in time, slowly being reclaimed by the forest.", intensity: 5, yearAbandoned: "1986" },
      { name: "Varosha", location: "Famagusta", country: "Cyprus", lat: 35.115, lng: 33.957, category: "Ghost Cities", description: "Once a glamorous resort city hosting Elizabeth Taylor and Brigitte Bardot, Varosha was abandoned during the 1974 Turkish invasion. High-rise hotels now stand empty behind barbed wire.", intensity: 4, yearAbandoned: "1974" },
      { name: "Plymouth", location: "Montserrat", country: "United Kingdom", lat: 16.706, lng: -62.216, category: "Ghost Cities", description: "The capital of Montserrat was buried by volcanic eruptions from Soufrière Hills between 1995-1997. Pyroclastic flows destroyed the city, leaving only the upper floors of buildings visible.", intensity: 5, yearAbandoned: "1997" },
      { name: "Craco", location: "Basilicata", country: "Italy", lat: 40.376, lng: 16.440, category: "Ghost Cities", description: "A medieval hilltop town abandoned due to landslides, earthquakes, and difficult agricultural conditions. Its crumbling towers and stone streets have served as a backdrop for films including The Passion of the Christ.", intensity: 3, yearAbandoned: "1963" },
      { name: "Bodie", location: "California", country: "USA", lat: 38.212, lng: -119.012, category: "Ghost Towns", description: "A gold-mining boomtown that produced over $34 million in gold. At its peak in 1880, Bodie had 10,000 residents, 65 saloons, and a reputation as one of the most lawless towns in the West.", intensity: 3, yearAbandoned: "1940s" },
      { name: "Rhyolite", location: "Nevada", country: "USA", lat: 36.903, lng: -116.828, category: "Ghost Towns", description: "Born from a gold rush in 1904, Rhyolite grew to 5,000 residents with electricity, water mains, and a stock exchange. By 1920, it was empty. The Bottle House, made of 50,000 beer bottles, still stands.", intensity: 3, yearAbandoned: "1920" },
      { name: "Centralia", location: "Pennsylvania", country: "USA", lat: 40.804, lng: -76.340, category: "Ghost Towns", description: "A coal mine fire has been burning beneath this town since 1962. Toxic gases, subsidence, and temperatures exceeding 400°C forced evacuation. The fire may burn for another 250 years.", intensity: 5, yearAbandoned: "1980s" },
      { name: "Kolmanskop", location: "Namib Desert", country: "Namibia", lat: -26.704, lng: 15.231, category: "Ghost Towns", description: "A diamond-mining town built in 1908 where miners lived in German colonial luxury. When diamond fields were exhausted, the desert reclaimed it. Sand now fills the rooms of once-grand houses.", intensity: 4, yearAbandoned: "1954" },
      { name: "Humberstone", location: "Atacama Desert", country: "Chile", lat: -20.206, lng: -69.794, category: "Ghost Towns", description: "A nitrate mining town that once produced the fertilizer that fed the world. Its theater, hotel, and swimming pool now stand in the driest desert on Earth, preserved by the lack of rain.", intensity: 3, yearAbandoned: "1960" },
      { name: "Fordlândia", location: "Pará", country: "Brazil", lat: -3.829, lng: -55.496, category: "Ghost Towns", description: "Henry Ford's attempt to build a rubber-producing American town in the Amazon jungle. Social engineering, clashing cultures, and rubber tree blight doomed the project. The American-style houses rot in the jungle.", intensity: 4, yearAbandoned: "1934" },
      { name: "Hashima Island", location: "Nagasaki Prefecture", country: "Japan", lat: 32.628, lng: 129.738, category: "Islands", description: "A concrete island that housed 5,000 coal miners in brutal conditions. Abandoned in 1974, it became a decaying labyrinth of apartments, schools, and mineshafts. Known as 'Battleship Island' for its silhouette.", intensity: 5, yearAbandoned: "1974" },
      { name: "Poveglia", location: "Venice Lagoon", country: "Italy", lat: 45.382, lng: 12.331, category: "Islands", description: "A quarantine island for plague victims, later a mental asylum where a doctor allegedly experimented on patients before throwing himself from the bell tower. Access is forbidden by the Italian government.", intensity: 5, yearAbandoned: "1968" },
      { name: "Ross Island", location: "Andaman Islands", country: "India", lat: 11.674, lng: 92.764, category: "Islands", description: "The former British administrative headquarters of the penal colony. Earthquakes and Japanese occupation left it in ruins. Wild deer now graze among the crumbling church and ballroom.", intensity: 3, yearAbandoned: "1940s" },
      { name: "Hart Island", location: "Bronx, New York", country: "USA", lat: 40.853, lng: -73.770, category: "Islands", description: "America's largest public burial ground, with over 1 million people buried in mass graves. The island also housed a Civil War prison, a tuberculosis sanatorium, and a boys' reformatory.", intensity: 4, yearAbandoned: "Active burial site" },
      { name: "Daksa", location: "Dubrovnik", country: "Croatia", lat: 42.668, lng: 18.070, category: "Islands", description: "In 1944, 53 suspected Nazi collaborators were executed here and left unburied. The island was abandoned for decades. A Franciscan monastery stands among the remains of the victims.", intensity: 5, yearAbandoned: "1944" },
      { name: "Waverly Hills Sanatorium", location: "Louisville, Kentucky", country: "USA", lat: 38.162, lng: -85.844, category: "Hospitals & Asylums", description: "A massive tuberculosis hospital where over 6,000 patients died. The 'body chute' carried corpses discreetly to hearses below. Shadow figures, disembodied voices, and phantom children are frequently reported.", intensity: 5, yearAbandoned: "1961" },
      { name: "Beelitz-Heilstätten", location: "Beelitz", country: "Germany", lat: 52.259, lng: 12.929, category: "Hospitals & Asylums", description: "A sprawling military hospital complex where Hitler was treated in 1916. Later used by the Soviet Army until 1994. Over 60 buildings stand decaying in the forest, some with surgical equipment still inside.", intensity: 4, yearAbandoned: "1994" },
      { name: "Aradale Mental Hospital", location: "Ararat, Victoria", country: "Australia", lat: -37.282, lng: 142.918, category: "Hospitals & Asylums", description: "An asylum that operated for 130 years, housing up to 2,000 patients at its peak. Lobotomies, electroshock, and isolation were common treatments. Over 13,000 people died here and were buried in unmarked graves.", intensity: 5, yearAbandoned: "1998" },
      { name: "Willard Asylum", location: "Willard, New York", country: "USA", lat: 42.679, lng: -76.876, category: "Hospitals & Asylums", description: "When it closed in 1995, hundreds of suitcases were discovered in the attic—belongings of patients who died there, never reclaimed. The suitcases revealed lives interrupted: photographs, letters, keepsakes.", intensity: 4, yearAbandoned: "1995" },
      { name: "Hellingly Hospital", location: "East Sussex", country: "England", lat: 50.888, lng: 0.258, category: "Hospitals & Asylums", description: "A Victorian asylum with its own railway line to transport coal and patients. The main hall featured a ballroom where patients danced. Now a ruin, its corridors echo with the footsteps of urban explorers.", intensity: 3, yearAbandoned: "1994" },
      { name: "Eastern State Penitentiary", location: "Philadelphia, Pennsylvania", country: "USA", lat: 39.968, lng: -75.172, category: "Prisons", description: "The world's first true penitentiary, designed to induce penitence through solitary confinement. Prisoners lived in complete isolation with only a Bible. Al Capone was held here. Now a ruin open for tours.", intensity: 4, yearAbandoned: "1971" },
      { name: "Port Arthur", location: "Tasmania", country: "Australia", lat: -43.146, lng: 147.851, category: "Prisons", description: "A 19th-century penal colony for Britain's hardest criminals. The Separate Prison used psychological torture—silence, hoods, and isolation. The 1996 massacre added another layer of tragedy to the site.", intensity: 5, yearAbandoned: "1877" },
      { name: "Boggo Road Gaol", location: "Brisbane, Queensland", country: "Australia", lat: -27.495, lng: 153.030, category: "Prisons", description: "Queensland's most notorious prison, home to rooftop protests, riots, and executions. The No. 2 Division was built by prisoners in 1903 using stone quarried on-site. Ghosts of executed prisoners are claimed.", intensity: 3, yearAbandoned: "2002" },
      { name: "Sedlec Ossuary", location: "Kutná Hora", country: "Czech Republic", lat: 49.948, lng: 15.268, category: "Churches & Temples", description: "A chapel decorated with the bones of 40,000 plague victims. Chandeliers, coats of arms, and even a Schwarzenberg family crest are crafted from human skulls and femurs. The largest bone church in the world.", intensity: 4, yearAbandoned: "N/A (Active chapel)" },
      { name: "St. George's Church", location: "Luková", country: "Czech Republic", lat: 49.538, lng: 13.647, category: "Churches & Temples", description: "Abandoned after a roof collapse in 1968, artist Jakub Hadrava placed 30 ghostly plaster figures in the pews—representing the Sudeten Germans expelled after WWII. They sit in silent congregation.", intensity: 3, yearAbandoned: "1968" },
      { name: "Angkor Wat", location: "Siem Reap Province", country: "Cambodia", lat: 13.412, lng: 103.867, category: "Churches & Temples", description: "The largest religious monument in the world, abandoned to the jungle for centuries after the Khmer Empire fell. Massive silk-cotton and strangler fig trees have shattered its stone corridors.", intensity: 3, yearAbandoned: "15th century" },
      { name: "Bran Castle", location: "Transylvania", country: "Romania", lat: 45.515, lng: 25.367, category: "Castles & Forts", description: "Though never home to Vlad the Impaler, this fortress perched on a cliff embodies the Gothic ideal. Tunnels, secret passages, and medieval torture chambers create an atmosphere of genuine medieval dread.", intensity: 3, yearAbandoned: "N/A (Museum)" },
      { name: "Tower of London", location: "London", country: "England", lat: 51.508, lng: -0.076, category: "Castles & Forts", description: "A thousand years of imprisonment, torture, and execution. Anne Boleyn, Lady Jane Grey, and the Princes in the Tower all died here. Ravens are kept on site—legend says the kingdom will fall if they leave.", intensity: 4, yearAbandoned: "N/A (Active site)" },
      { name: "Edinburgh Castle", location: "Edinburgh", country: "Scotland", lat: 55.949, lng: -3.200, category: "Castles & Forts", description: "Built on an extinct volcano, the castle has served as a fortress, royal residence, and prison. The dungeons held American prisoners of the Revolutionary War. A headless drummer boy is said to appear before disaster.", intensity: 3, yearAbandoned: "N/A (Active site)" },
      { name: "Maunsell Sea Forts", location: "Thames Estuary", country: "England", lat: 51.465, lng: 1.032, category: "Castles & Forts", description: "Concrete and steel towers built during WWII to defend against German aircraft. Abandoned since the 1950s, they stand rusting in the sea like something from a dystopian future. Project Redsand seeks to preserve them.", intensity: 4, yearAbandoned: "1950s" },
      { name: "Château de Noisy", location: "Celles", country: "Belgium", lat: 50.228, lng: 5.012, category: "Castles & Forts", description: "A neo-Gothic castle built in 1866, later an orphanage and holiday camp. Abandoned since 1991, its clock tower, grand staircase, and chapel slowly collapsed. Demolition began in 2016 but was halted.", intensity: 3, yearAbandoned: "1991" },
      { name: "Miranda Castle", location: "Celles", country: "Belgium", lat: 50.234, lng: 5.007, category: "Castles & Forts", description: "Also known as Château de Noisy's neighbor, this 19th-century castle was requisitioned as an orphanage during WWII. Abandoned since the 1990s, its ornate rooms and chapel are being reclaimed by nature.", intensity: 3, yearAbandoned: "1990s" },
      { name: "Aokigahara", location: "Yamanashi Prefecture", country: "Japan", lat: 35.475, lng: 138.608, category: "Forests", description: "The 'Sea of Trees' at the base of Mount Fuji is the world's second most popular suicide site. Compasses malfunction due to magnetic iron deposits. Signs urge visitors to reconsider and seek help.", intensity: 5, yearAbandoned: "N/A (Active forest)" },
      { name: "Hoia Baciu", location: "Cluj-Napoca", country: "Romania", lat: 46.775, lng: 23.523, category: "Forests", description: "Known as the 'Bermuda Triangle of Transylvania.' Visitors report nausea, anxiety, and time loss. A clearing in the center where nothing grows has been studied but never explained. UFO sightings date to 1968.", intensity: 5, yearAbandoned: "N/A (Active forest)" },
      { name: "Dow Hill", location: "Kurseong", country: "India", lat: 26.883, lng: 88.283, category: "Forests", description: "A Victorian boarding school surrounded by dense pine forest. The 'Death Road' between the school and forest office is said to echo with footsteps of a headless boy. Several murders occurred in the forest.", intensity: 4, yearAbandoned: "N/A (Active site)" },
      { name: "Old Changi Hospital", location: "Singapore", country: "Singapore", lat: 1.390, lng: 103.982, category: "Hospitals & Asylums", description: "Built in 1935, used as a prison camp by the Japanese during WWII where torture and executions were common. The morgue and operating theaters are said to be particularly active with paranormal phenomena.", intensity: 5, yearAbandoned: "1997" },
      { name: "Gonjiam Psychiatric Hospital", location: "Gwangju", country: "South Korea", lat: 37.362, lng: 127.335, category: "Hospitals & Asylums", description: "One of South Korea's most famous abandoned sites. The hospital closed suddenly in the 1990s amid rumors of patient deaths. Featured in the horror film 'Gonjiam: Haunted Asylum.'", intensity: 4, yearAbandoned: "1990s" },
      { name: "Pennhurst Asylum", location: "Spring City, Pennsylvania", country: "USA", lat: 40.180, lng: -75.618, category: "Hospitals & Asylums", description: "An institution for the 'feeble-minded' that became infamous for abuse and neglect. A 1968 TV exposé led to its closure. The tunnels connecting buildings are said to be haunted by former residents.", intensity: 5, yearAbandoned: "1987" },
      { name: "Trans-Allegheny Lunatic Asylum", location: "Weston, West Virginia", country: "USA", lat: 39.039, lng: -80.472, category: "Hospitals & Asylums", description: "The second-largest hand-cut stone building in the world. Designed for 250 patients, it housed 2,400 by the 1950s. Lobotomies, ice baths, and electroshock were routine. Ghost tours now operate here.", intensity: 5, yearAbandoned: "1994" },
      { name: "Rolling Hills Asylum", location: "East Bethany, New York", country: "USA", lat: 42.914, lng: -78.130, category: "Hospitals & Asylums", description: "Originally the Genesee County Poor House, it housed the destitute, mentally ill, and criminals together. Over 1,700 deaths occurred here. The morgue and electroshock room are focal points for paranormal investigators.", intensity: 4, yearAbandoned: "1974" },
      { name: "Letchworth Village", location: "Thiells, New York", country: "USA", lat: 41.210, lng: -74.017, category: "Hospitals & Asylums", description: "An institution for the developmentally disabled that became synonymous with neglect. The unmarked graves of residents lie in the woods. The buildings are now crumbling ruins in an overgrown campus.", intensity: 4, yearAbandoned: "1996" },
      { name: "Kings Park Psychiatric Center", location: "Kings Park, New York", country: "USA", lat: 40.897, lng: -73.243, category: "Hospitals & Asylums", description: "A self-contained psychiatric village with its own power plant, farms, and railroad. Building 93, a 13-story tower, dominates the skyline. The campus is now a state park, but the buildings remain off-limits.", intensity: 4, yearAbandoned: "1996" },
      { name: "Danvers State Hospital", location: "Danvers, Massachusetts", country: "USA", lat: 42.568, lng: -70.972, category: "Hospitals & Asylums", description: "The inspiration for Arkham Asylum in Batman. Its Gothic Kirkbride Plan design featured a central administration building with wings for male and female patients. Partially demolished for apartments.", intensity: 5, yearAbandoned: "1992" },
      { name: "Byberry Mental Hospital", location: "Philadelphia, Pennsylvania", country: "USA", lat: 40.116, lng: -74.972, category: "Hospitals & Asylums", description: "Conditions were so horrific that a 1946 Life magazine exposé called it a 'snake pit.' Patients were found naked, covered in feces, and eating from troughs. The city eventually shut it down.", intensity: 5, yearAbandoned: "1990" },
      { name: "Forest Haven", location: "Laurel, Maryland", country: "USA", lat: 39.084, lng: -76.852, category: "Hospitals & Asylums", description: "An institution for the developmentally disabled where over 400 residents died from abuse and neglect between 1960-2009. A class-action lawsuit finally closed it. The graves are unmarked in a nearby field.", intensity: 5, yearAbandoned: "1991" },
      { name: "Picher", location: "Oklahoma", country: "USA", lat: 36.983, lng: -94.833, category: "Ghost Towns", description: "A lead and zinc mining town where the ground is so contaminated that children suffered lead poisoning. The Army Corps of Engineers declared it uninhabitable. Sinkholes swallow buildings whole.", intensity: 5, yearAbandoned: "2009" },
      { name: "Cahawba", location: "Alabama", country: "USA", lat: 32.319, lng: -87.104, category: "Ghost Towns", description: "Alabama's first capital, abandoned after the Civil War when the Cahaba River flooded repeatedly. The ruins of a Civil War prison camp, an abandoned cemetery, and a ghostly 'crooked bridge' remain.", intensity: 3, yearAbandoned: "1865" },
      { name: "Thurmond", location: "West Virginia", country: "USA", lat: 37.962, lng: -81.082, category: "Ghost Towns", description: "A coal town where the railroad was the only street. At its peak, it had a population of 500 and no automobiles. Now part of the New River Gorge National Park, with just a handful of residents.", intensity: 2, yearAbandoned: "1950s" },
      { name: "Terlingua", location: "Texas", country: "USA", lat: 29.321, lng: -103.616, category: "Ghost Towns", description: "A mercury mining town where workers died of poisoning. The cemetery is filled with miners who succumbed to 'the tremors.' Now home to a chili cook-off and a few hardy residents.", intensity: 3, yearAbandoned: "1940s" },
      { name: "Garnet", location: "Montana", country: "USA", lat: 46.826, lng: -113.339, category: "Ghost Towns", description: "Montana's most intact ghost town, with 30 buildings preserved by the Bureau of Land Management. A gold mining boomtown that produced $1 million in ore before the mines played out.", intensity: 2, yearAbandoned: "1940s" },
      { name: "St. Elmo", location: "Colorado", country: "USA", lat: 38.703, lng: -106.346, category: "Ghost Towns", description: "One of Colorado's best-preserved ghost towns, with the general store still operating in summer. Founded in 1880 for gold and silver mining. The last residents left in the 1950s.", intensity: 2, yearAbandoned: "1950s" },
      { name: "Kuldhara", location: "Jaisalmer District", country: "India", lat: 26.461, lng: 70.624, category: "Abandoned Villages", description: "An entire village abandoned overnight in 1825 by Paliwal Brahmins to escape the tyranny of a local ruler. Legend says they cursed the village so no one could ever settle there again. The curse seems to hold.", intensity: 4, yearAbandoned: "1825" },
      { name: "Nagoro Doll Village", location: "Tokushima Prefecture", country: "Japan", lat: 34.016, lng: 134.306, category: "Abandoned Villages", description: "A village where the population has dwindled to 27, but artist Ayano Tsukimi has placed 350 life-sized dolls representing former residents. The dolls sit in classrooms, fields, and bus stops.", intensity: 4, yearAbandoned: "Ongoing decline" },
      { name: "Oradour-sur-Glane", location: "Haute-Vienne", country: "France", lat: 45.933, lng: 1.033, category: "Abandoned Villages", description: "A martyr village where 642 men, women, and children were massacred by the SS in 1944. The ruins were left exactly as they were, with rusted cars, sewing machines, and the church where women and children burned.", intensity: 5, yearAbandoned: "1944" },
      { name: "Tyneham", location: "Dorset", country: "England", lat: 50.622, lng: -2.178, category: "Abandoned Villages", description: "Requisitioned by the military for D-Day training in 1943, the 225 residents were never allowed to return. 'Please treat the church and houses with care' reads the note they left. The village remains a military firing range.", intensity: 3, yearAbandoned: "1943" },
      { name: "Belchite", location: "Zaragoza", country: "Spain", lat: 41.306, lng: -0.754, category: "Abandoned Villages", description: "Destroyed during the Spanish Civil War in 1937, Franco ordered the ruins left as a monument to 'the glory of his victory.' The church, with its shattered dome and bullet-riddled walls, still stands.", intensity: 4, yearAbandoned: "1937" },
      { name: "Mandu", location: "Madhya Pradesh", country: "India", lat: 22.367, lng: 75.400, category: "Abandoned Villages", description: "A fortress city abandoned since the 16th century. The Jahaz Mahal (Ship Palace) appears to float between two lakes. The romantic legend of Baz Bahadur and Rani Roopmati permeates the ruins.", intensity: 2, yearAbandoned: "16th century" },
      { name: "Petra", location: "Ma'an Governorate", country: "Jordan", lat: 30.329, lng: 35.444, category: "Ruins & Geoglyphs", description: "The 'Rose City' carved into red sandstone cliffs by the Nabataeans. Abandoned after earthquakes and trade route shifts. The Treasury, Monastery, and hundreds of tombs remain, half-buried in sand.", intensity: 2, yearAbandoned: "7th century" },
      { name: "Nazca Lines", location: "Nazca Desert", country: "Peru", lat: -14.739, lng: -75.130, category: "Ruins & Geoglyphs", description: "Massive geoglyphs etched into the desert floor between 500 BCE and 500 CE. The 'Astronaut,' spider, and hummingbird are visible only from above. Their purpose—astronomical, religious, or alien—remains debated.", intensity: 3, yearAbandoned: "500 CE" },
      { name: "Chichen Itza", location: "Yucatán", country: "Mexico", lat: 20.684, lng: -88.568, category: "Ruins & Geoglyphs", description: "A Maya city where human sacrifices were thrown into the Sacred Cenote. The Temple of Kukulcan aligns with the equinox, casting a serpent shadow down its steps. Abandoned before Spanish contact.", intensity: 3, yearAbandoned: "15th century" },
      { name: "Dead Cities", location: "Aleppo Governorate", country: "Syria", lat: 36.334, lng: 36.844, category: "Ruins & Geoglyphs", description: "Over 700 abandoned settlements from the 1st-7th centuries. Churches, villas, and olive presses stand intact in the hills. The inhabitants vanished—possibly due to trade route changes or Arab conquest.", intensity: 2, yearAbandoned: "8th century" },
      { name: "Maree Man", location: "Finnis Springs", country: "Australia", lat: -29.953, lng: 137.466, category: "Ruins & Geoglyphs", description: "A 4.2 km tall geoglyph of an Indigenous man carved into the desert in 1998. No one has claimed responsibility. It depicts a figure holding a throwing stick, visible only from the air.", intensity: 3, yearAbandoned: "1998" },
      { name: "Great Zimbabwe", location: "Masvingo Province", country: "Zimbabwe", lat: -20.268, lng: 30.930, category: "Ruins & Geoglyphs", description: "A medieval city built between the 11th and 15th centuries. The massive stone walls—built without mortar—enclosed a royal palace. The civilization vanished, possibly due to resource depletion.", intensity: 2, yearAbandoned: "15th century" },
      { name: "Palenque", location: "Chiapas", country: "Mexico", lat: 17.485, lng: -92.046, category: "Ruins & Geoglyphs", description: "A Maya city deep in the jungle, abandoned around 800 CE. The Temple of the Inscriptions contains the tomb of Pakal the Great. The jungle has reclaimed most of the city, with only a fraction excavated.", intensity: 2, yearAbandoned: "800 CE" },
      { name: "Tikal", location: "Petén Department", country: "Guatemala", lat: 17.222, lng: -89.624, category: "Ruins & Geoglyphs", description: "One of the largest Maya cities, with temples rising above the rainforest canopy. Abandoned around 900 CE for unknown reasons—possibly drought, warfare, or overpopulation. Howler monkeys now inhabit the plazas.", intensity: 2, yearAbandoned: "900 CE" },
      { name: "Machu Picchu", location: "Cusco Region", country: "Peru", lat: -13.163, lng: -72.545, category: "Ruins & Geoglyphs", description: "An Incan citadel built in the 15th century and abandoned a century later, possibly during the Spanish Conquest. Never found by the conquistadors, it was rediscovered by Hiram Bingham in 1911.", intensity: 2, yearAbandoned: "1572" },
      { name: "Teotihuacan", location: "State of Mexico", country: "Mexico", lat: 19.693, lng: -98.845, category: "Ruins & Geoglyphs", description: "A city of 125,000 people that was the center of a powerful culture. The Pyramid of the Sun and Moon dominate the Avenue of the Dead. The city was burned and abandoned around 550 CE for unknown reasons.", intensity: 3, yearAbandoned: "550 CE" },
      { name: "Angkor", location: "Siem Reap Province", country: "Cambodia", lat: 13.441, lng: 103.858, category: "Ruins & Geoglyphs", description: "The largest pre-industrial city in the world, with a population near 1 million. Abandoned in the 15th century, likely due to water management failure. The temples were swallowed by jungle for 400 years.", intensity: 2, yearAbandoned: "15th century" },
      { name: "Palmyra", location: "Homs Governorate", country: "Syria", lat: 34.551, lng: 38.267, category: "Ruins & Geoglyphs", description: "A wealthy caravan city that blended Greco-Roman and Persian architecture. Queen Zenobia rebelled against Rome and was defeated. ISIS destroyed several monuments in 2015, but much remains.", intensity: 4, yearAbandoned: "273 CE" },
      { name: "Baalbek", location: "Baalbek", country: "Lebanon", lat: 34.007, lng: 36.204, category: "Ruins & Geoglyphs", description: "The Temple of Jupiter features stones weighing up to 800 tons—no modern crane can lift them. The quarry contains two 1,000-ton monoliths left unfinished. Roman, or something older?", intensity: 2, yearAbandoned: "N/A (Active site)" },
      { name: "Catacombs of Paris", location: "Paris", country: "France", lat: 48.834, lng: 2.332, category: "Other", description: "The bones of 6 million Parisians were moved here from overcrowded cemeteries. 'Arrête! C'est ici l'empire de la Mort' (Stop! This is the empire of Death) greets visitors. Over 200 miles of tunnels exist, mostly unmapped.", intensity: 4, yearAbandoned: "N/A (Active site)" },
      { name: "Darvaza Gas Crater", location: "Karakum Desert", country: "Turkmenistan", lat: 40.253, lng: 58.440, category: "Other", description: "The 'Door to Hell'—a burning natural gas crater that has been alight since 1971. Soviet geologists set it on fire to burn off poisonous gas after a drilling accident. It was expected to burn for weeks. It has been 50 years.", intensity: 4, yearAbandoned: "1971" },
      { name: "Duga Radar", location: "Chernobyl Exclusion Zone", country: "Ukraine", lat: 51.306, lng: 30.067, category: "Other", description: "A massive over-the-horizon radar array known as the 'Russian Woodpecker' for its tapping interference on shortwave radio. Abandoned after the Chernobyl disaster. The antenna towers over the forest.", intensity: 4, yearAbandoned: "1986" },
      { name: "Salton Sea", location: "California", country: "USA", lat: 33.314, lng: -115.837, category: "Other", description: "An accidental lake created by a Colorado River irrigation failure in 1905. Once a resort destination, agricultural runoff made it toxic. Fish die-offs created beaches of bleached bones. The smell is overwhelming.", intensity: 4, yearAbandoned: "1980s" },
      { name: "Moynaq Ship Graveyard", location: "Karakalpakstan", country: "Uzbekistan", lat: 43.768, lng: 59.026, category: "Other", description: "Rusty fishing vessels sit in the sand where the Aral Sea once was. Soviet irrigation projects diverted the rivers feeding the sea, which has shrunk by 90%. The town's economy and population collapsed.", intensity: 5, yearAbandoned: "1980s" },
      { name: "Fly Geyser", location: "Black Rock Desert", country: "USA", lat: 40.859, lng: -119.331, category: "Other", description: "A man-made geothermal geyser created by a drilling accident in 1964. Dissolved minerals have built up into a multi-colored mound of travertine. It sits on private land in the Nevada desert.", intensity: 2, yearAbandoned: "1964" },
      { name: "Sedan Nuclear Crater", location: "Nevada Test Site", country: "USA", lat: 37.177, lng: -116.046, category: "Other", description: "A 320-foot deep crater created by a 104-kiloton nuclear test in 1962. Part of Project Plowshare, which sought peaceful uses for nuclear explosions. It displaced 12 million tons of earth.", intensity: 4, yearAbandoned: "1962" },
      { name: "Zone Rouge", location: "Northeastern France", country: "France", lat: 49.250, lng: 5.000, category: "Other", description: "An area of former WWI battlefields where the ground is so contaminated by unexploded ordnance and chemical weapons that human habitation is forbidden. The forest has grown over the trenches.", intensity: 5, yearAbandoned: "1918" },
      { name: "Bhangarh Fort", location: "Rajasthan", country: "India", lat: 27.096, lng: 76.287, category: "Castles & Forts", description: "Considered the most haunted place in India. A legend says a sorcerer cursed the city so no one could rebuild it. The Archaeological Survey of India forbids entry between sunset and sunrise.", intensity: 5, yearAbandoned: "1783" },
      { name: "Château de Brissac", location: "Brissac-Quincé", country: "France", lat: 47.355, lng: -0.450, category: "Castles & Forts", description: "The tallest castle in France, home to the 'Green Lady'—the ghost of Charlotte de Brézé, murdered by her husband in the 15th century. Her moans are said to echo through the chapel at dawn.", intensity: 4, yearAbandoned: "N/A (Inhabited)" },
      { name: "Leap Castle", location: "Coolderry", country: "Ireland", lat: 53.033, lng: -7.800, category: "Castles & Forts", description: "Built on a Druidic site, it has a history of massacres and betrayals. The 'Bloody Chapel' saw a priest murdered by his brother during mass. A hidden dungeon with spikes was discovered in the 1900s.", intensity: 5, yearAbandoned: "N/A (Privately owned)" },
      { name: "Château de Machecoul", location: "Machecoul", country: "France", lat: 46.994, lng: -1.823, category: "Castles & Forts", description: "The castle of Gilles de Rais, companion of Joan of Arc and one of history's most prolific serial killers. He allegedly murdered 140 children in the castle's chapel and towers. The castle was destroyed in the 16th century.", intensity: 5, yearAbandoned: "16th century" },
      { name: "Island of the Dolls", location: "Xochimilco", country: "Mexico", lat: 19.272, lng: -99.106, category: "Islands", description: "A chinampa island covered in hundreds of decaying dolls hung by former caretaker Julián Santana Barrera, who claimed they were haunted by the spirit of a drowned girl. He drowned in the same canal in 2001.", intensity: 5, yearAbandoned: "2001" },
      { name: "Stull Cemetery", location: "Stull, Kansas", country: "USA", lat: 38.971, lng: -95.456, category: "Other", description: "A tiny cemetery rumored to be one of the 'Seven Gateways to Hell.' Pope John Paul II allegedly ordered his plane to avoid flying over it. The church was torn down in 2002, but the legend persists.", intensity: 4, yearAbandoned: "N/A (Active cemetery)" },
      { name: "Bachelor's Grove", location: "Midlothian, Illinois", country: "USA", lat: 41.630, lng: -87.770, category: "Other", description: "A desecrated cemetery where over 100 instances of paranormal phenomena have been documented. A 'ghost house' appears in photographs where no house exists. Orbs, apparitions, and phantom vehicles are common.", intensity: 4, yearAbandoned: "N/A (Active cemetery)" },
      { name: "Highgate Cemetery", location: "London", country: "England", lat: 51.567, lng: -0.147, category: "Other", description: "A Victorian cemetery where Karl Marx is buried. Overgrown and atmospheric, it inspired the 'Highgate Vampire' panic of the 1970s. Egyptian Avenue and the Circle of Lebanon create a Gothic labyrinth.", intensity: 3, yearAbandoned: "N/A (Active cemetery)" },
      { name: "La Recoleta", location: "Buenos Aires", country: "Argentina", lat: -34.588, lng: -58.393, category: "Other", description: "A cemetery of ornate mausoleums where Argentina's elite are buried. Rufina Cambacérès was buried alive in 1902—her coffin was opened to find scratch marks. She is said to wander the alleys.", intensity: 3, yearAbandoned: "N/A (Active cemetery)" },
      { name: "Capuchin Catacombs", location: "Palermo", country: "Italy", lat: 38.112, lng: 13.339, category: "Other", description: "Over 8,000 mummified bodies line the walls, dressed in their finest clothes. The 'most beautiful mummy'—two-year-old Rosalia Lombardo—looks as if she is sleeping. She died in 1920.", intensity: 4, yearAbandoned: "1920s" },
      { name: "Hoia-Baciu Forest", location: "Cluj County", country: "Romania", lat: 46.775, lng: 23.523, category: "Forests", description: "A dense forest known for UFO sightings, magnetic anomalies, and missing persons. A circular clearing where nothing grows has been studied extensively. Visitors report nausea, anxiety, and electronics failure.", intensity: 5, yearAbandoned: "N/A (Active forest)" },
      { name: "Aokigahara Forest", location: "Yamanashi Prefecture", country: "Japan", lat: 35.475, lng: 138.608, category: "Forests", description: "The 'Sea of Trees' at Mount Fuji's base is the world's second most popular suicide site. Compasses malfunction due to magnetic iron deposits. Rangers conduct annual body sweeps. Signs urge visitors to seek help.", intensity: 5, yearAbandoned: "N/A (Active forest)" },
      { name: "Suicide Forest", location: "Aokigahara", country: "Japan", lat: 35.475, lng: 138.608, category: "Forests", description: "Another entry for Aokigahara, emphasizing its reputation. The forest floor is littered with abandoned cars, tents, and personal items. The silence is profound, broken only by wind through the trees.", intensity: 5, yearAbandoned: "N/A (Active forest)" },
      { name: "Chernobyl Exclusion Zone", location: "Kyiv Oblast", country: "Ukraine", lat: 51.276, lng: 30.221, category: "Other", description: "A 1,000-square-mile zone where radiation levels remain dangerous. The ghost city of Pripyat, the Duga radar, and the reactor itself are contained within. Nature has reclaimed the area, with wolves and bears returning.", intensity: 5, yearAbandoned: "1986" },
      { name: "Fukushima Exclusion Zone", location: "Fukushima Prefecture", country: "Japan", lat: 37.421, lng: 141.033, category: "Other", description: "The area around the Fukushima Daiichi nuclear plant, evacuated after the 2011 tsunami and meltdown. Towns remain frozen in time—abandoned cars, convenience stores with products on shelves, overgrown gardens.", intensity: 5, yearAbandoned: "2011" },
      { name: "Varosha Beach Resort", location: "Famagusta", country: "Cyprus", lat: 35.115, lng: 33.957, category: "Ghost Cities", description: "The beachfront hotels of Varosha, once hosting celebrities and royalty. The sand has blown into lobbies, trees grow through balconies, and the sea slowly claims the shoreline. A time capsule of 1974 luxury.", intensity: 4, yearAbandoned: "1974" },
      { name: "Nara Dreamland", location: "Nara", country: "Japan", lat: 34.698, lng: 135.829, category: "Other", description: "A Disneyland-inspired theme park that closed in 2006. The roller coaster, castle, and rides were left to rust. Urban explorers documented its decay until demolition began in 2016. Only foundations remain.", intensity: 3, yearAbandoned: "2006" },
      { name: "Six Flags New Orleans", location: "New Orleans, Louisiana", country: "USA", lat: 30.054, lng: -89.935, category: "Other", description: "Flooded by Hurricane Katrina in 2005 and never reopened. Rides stand rusting in 4-7 feet of floodwater. The Jester roller coaster and Zydeco Scream are slowly being reclaimed by the swamp.", intensity: 4, yearAbandoned: "2005" },
      { name: "Pripyat Amusement Park", location: "Pripyat", country: "Ukraine", lat: 51.408, lng: 30.056, category: "Other", description: "The Ferris wheel was scheduled to open on May 1, 1986. The Chernobyl disaster occurred on April 26. The wheel turned exactly once—for decontamination workers. The bumper cars and swing boats remain.", intensity: 5, yearAbandoned: "1986" },
      { name: "Spreepark", location: "Berlin", country: "Germany", lat: 52.483, lng: 13.493, category: "Other", description: "An East German amusement park that closed in 2002 after the owner fled to Peru with a bribe and a broken leg. The Ferris wheel, dinosaur statues, and swan boats decayed until partial demolition in 2014.", intensity: 3, yearAbandoned: "2002" },
      { name: "Gulliver's Kingdom", location: "Kawaguchi", country: "Japan", lat: 35.501, lng: 138.767, category: "Other", description: "A theme park built near Aokigahara Forest and the 'Suicide Forest.' The 147-foot statue of Gulliver lay bound to the ground. The park closed in 2001 after poor attendance. Demolished in 2007.", intensity: 3, yearAbandoned: "2001" },
      { name: "Wonderland", location: "Chenzhuang", country: "China", lat: 40.289, lng: 116.636, category: "Other", description: "An abandoned Disneyland knockoff 45 minutes from Beijing. Construction stopped in 1998 due to disputes. The half-built castle, medieval walls, and empty parking lot were reclaimed by farmers. Demolished in 2013.", intensity: 2, yearAbandoned: "1998" },
      { name: "Dadipark", location: "Dadizeele", country: "Belgium", lat: 50.883, lng: 2.850, category: "Other", description: "The oldest amusement park in Belgium, closed in 2002 after a boy lost his arm on the 'Nautic Jet' ride. The rusting rides, overgrown paths, and peeling paint made it a popular urban exploration site.", intensity: 3, yearAbandoned: "2002" },
      { name: "Takakanonuma Greenland", location: "Date", country: "Japan", lat: 37.817, lng: 140.567, category: "Other", description: "A theme park in a remote forest that closed in 1973, reopened in 1986, and closed permanently in 1999. The Ferris wheel and roller coaster stand rusting in the fog. The park is completely overgrown.", intensity: 4, yearAbandoned: "1999" },
      { name: "Nazi Rally Grounds", location: "Nuremberg", country: "Germany", lat: 49.434, lng: 11.128, category: "Other", description: "The Zeppelinfeld and Congress Hall built for Nazi party rallies. The scale is overwhelming—designed to hold 400,000 people. The ruins serve as a documentation center and a warning.", intensity: 4, yearAbandoned: "1945" },
      { name: "Kolmanskop Hospital", location: "Namib Desert", country: "Namibia", lat: -26.704, lng: 15.231, category: "Hospitals & Asylums", description: "The hospital wing of the diamond town, where workers were treated for the harsh conditions of the desert. Sand now fills the operating theater and wards. Medical equipment lies buried in drifts.", intensity: 4, yearAbandoned: "1954" },
      { name: "Sanzhi UFO Houses", location: "New Taipei City", country: "Taiwan", lat: 25.209, lng: 121.687, category: "Other", description: "Futuristic pod-shaped houses built in 1978 as a resort. Construction halted after investment losses and several worker deaths. The UFO-shaped buildings were demolished in 2008, but the site remains eerie.", intensity: 3, yearAbandoned: "1980" },
      { name: "Ryugyong Hotel", location: "Pyongyang", country: "North Korea", lat: 39.037, lng: 125.731, category: "Other", description: "A 105-story pyramid hotel that has been under construction since 1987. It would be the tallest hotel in the world if completed. The concrete shell stood empty for decades. A glass facade was added in 2011, but it remains unopened.", intensity: 4, yearAbandoned: "Ongoing" },
      { name: "City of the Dead", location: "Cairo", country: "Egypt", lat: 30.047, lng: 31.275, category: "Other", description: "A cemetery that has become a living neighborhood. Over 500,000 people live among the tombs, mausoleums, and shrines. The contrast between the dead and the living creates an otherworldly atmosphere.", intensity: 3, yearAbandoned: "N/A (Active settlement)" },
      { name: "Kowloon Walled City", location: "Kowloon", country: "Hong Kong", lat: 22.332, lng: 114.190, category: "Other", description: "A lawless enclave of 33,000 people living in 6.5 acres. No building codes, no sanitation, no sunlight. Triads ran brothels and opium dens. Demolished in 1994 and replaced with a park. Only photographs remain.", intensity: 4, yearAbandoned: "1994" },
      { name: "Soviet Submarine Base", location: "Balaklava", country: "Ukraine", lat: 44.501, lng: 33.605, category: "Other", description: "An underground base carved into a mountain, capable of withstanding a nuclear strike. It housed submarines, torpedoes, and a nuclear arsenal. Declassified in 2000, it now operates as a museum.", intensity: 3, yearAbandoned: "1993" },
      { name: "Maginot Line", location: "Northeastern France", country: "France", lat: 49.119, lng: 6.176, category: "Other", description: "A massive line of fortifications built before WWII. The fortresses featured underground railways, hospitals, and barracks. It was bypassed by German forces, rendering it militarily obsolete. Many sections remain.", intensity: 3, yearAbandoned: "1940" },
      { name: "Orford Ness", location: "Suffolk", country: "England", lat: 52.083, lng: 1.574, category: "Other", description: "A shingle spit used for military testing, including nuclear bomb components and radar. The 'pagodas'—concrete structures designed to collapse inward in an explosion—dominate the landscape. Now a nature reserve.", intensity: 3, yearAbandoned: "1987" },
      { name: "RAF Stenigot", location: "Lincolnshire", country: "England", lat: 53.317, lng: -0.117, category: "Other", description: "A Cold War radar station with massive parabolic dishes. Part of the NATO early warning system. The dishes were sold for scrap, but the concrete towers and operations building remain. Sheep graze among the ruins.", intensity: 2, yearAbandoned: "1980s" },
      { name: "Teufelsberg", location: "Berlin", country: "Germany", lat: 52.497, lng: 13.241, category: "Other", description: "A man-made hill built from WWII rubble, topped with a Cold War listening station. The radar domes are covered in graffiti. The hill offers panoramic views of Berlin. The echoes inside the domes are extraordinary.", intensity: 2, yearAbandoned: "1999" },
      { name: "Buzludzha", location: "Shipka Pass", country: "Bulgaria", lat: 42.739, lng: 25.394, category: "Other", description: "A brutalist monument built by the Bulgarian communist regime, shaped like a flying saucer. The interior featured a 500-square-meter mosaic of Marx and Engels. Abandoned after the fall of communism in 1989.", intensity: 4, yearAbandoned: "1989" },
      { name: "Cité Radieuse", location: "Briey", country: "France", lat: 49.250, lng: 5.933, category: "Other", description: "A Le Corbusier-inspired brutalist housing complex that was abandoned for decades. The concrete utopia became a dystopian ruin. Recently partially renovated, but much remains decayed.", intensity: 2, yearAbandoned: "1980s" }
    ];

    const stmt = db.prepare(`
      INSERT INTO places (id, name, location, country, lat, lng, category, description, intensity, yearAbandoned, status, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1)
    `);

    places.forEach(place => {
      stmt.run(
        uuidv4(),
        place.name,
        place.location,
        place.country,
        place.lat,
        place.lng,
        place.category,
        place.description,
        place.intensity,
        place.yearAbandoned
      );
    });

    stmt.finalize();
    console.log(`Seeded ${places.length} initial places`);
  });
}

// API Routes

// Get all approved places
app.get('/api/places', (req, res) => {
  const { category, search } = req.query;
  let query = "SELECT * FROM places WHERE status = 'approved'";
  const params = [];

  if (category && category !== 'all') {
    query += " AND category = ?";
    params.push(category);
  }

  if (search) {
    query += " AND (name LIKE ? OR location LIKE ? OR country LIKE ? OR description LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single place by ID
app.get('/api/places/:id', (req, res) => {
  db.get("SELECT * FROM places WHERE id = ? AND status = 'approved'", [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Place not found' });
      return;
    }
    res.json(row);
  });
});

// Submit a new place (goes to pending)
app.post('/api/places', (req, res) => {
  const { name, location, country, lat, lng, category, description, intensity, yearAbandoned, submittedBy } = req.body;

  if (!name || !location || !country || !lat || !lng || !category || !description) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const id = uuidv4();
  db.run(`
    INSERT INTO places (id, name, location, country, lat, lng, category, description, intensity, yearAbandoned, submittedBy, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `, [id, name, location, country, lat, lng, category, description, intensity || 1, yearAbandoned || '', submittedBy || 'Anonymous'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id, message: 'Place submitted for review' });
  });
});

// Admin: Get pending places
app.get('/api/admin/pending', (req, res) => {
  db.all("SELECT * FROM places WHERE status = 'pending' ORDER BY submittedAt DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Admin: Approve a place
app.post('/api/admin/approve/:id', (req, res) => {
  db.run("UPDATE places SET status = 'approved', verified = 1 WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Place approved' });
  });
});

// Admin: Reject a place
app.post('/api/admin/reject/:id', (req, res) => {
  db.run("DELETE FROM places WHERE id = ? AND status = 'pending'", [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Place rejected' });
  });
});

// Get categories with counts
app.get('/api/categories', (req, res) => {
  db.all(`
    SELECT category, COUNT(*) as count 
    FROM places 
    WHERE status = 'approved' 
    GROUP BY category 
    ORDER BY count DESC
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Vanishing Points server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error(err.message);
    else console.log('Database connection closed');
    process.exit(0);
  });
});