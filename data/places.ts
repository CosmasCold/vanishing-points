import { Place } from "@/types/places";

/**
 * PRODUCTION-READY LOCAL STATIC CORPUS SEED FOR VANISHING POINTS
 * Pre-projected, clean connectedTo arrays, and rich geodetic story lore.
 * Bypasses remote HTTP network queries for sub-millisecond local response [2, 9].
 */
export const LOCAL_PLACES: Place[] = [
  {
    "slug": "pripyat-amusement-park",
    "name": "Pripyat Amusement Park",
    "category": "abandoned",
    "coordinates": [
      30.0542,
      51.4061
    ],
    "address": {
      "city": "Pripyat",
      "country": "Ukraine",
      "formatted": "Pripyat, Kyiv Oblast, Ukraine"
    },
    "yearAbandoned": 1986,
    "history": "The Ferris wheel never turned for paying customers. Scheduled to open on May 1, 1986, the park stood ready for only a handful of test rides before the evacuation order came on April 27. The air already carried something wrong — a metallic taste, a silence in the pines. Within 36 hours of the Chernobyl explosion, 49,000 people left their apartments forever. The bumper cars remain locked in their grid. A radiation meter near the river still ticks. Nature has begun its slow repossession: birch saplings crack the asphalt of Lenin Avenue, and wolves move through the school corridors at dusk. The park is not frozen in time; it is dissolving into it.",
    "hauntingReports": [
      "A radiation meter near the river still ticks with a non-repeating acoustic pattern.",
      "The yellow Ferris wheel rotates slightly during winter storms, though its drive mechanics are locked by rust.",
      "A child's voice has been captured on geophones near the bumper cars, repeating a 10 Hz tapping signature."
    ],
    "dangerLevel": 4,
    "photos": [],
    "status": "verified",
    "viewCount": 2874,
    "submittedAt": "2026-07-28T16:02:18.162Z",
    "verifiedAt": "2026-07-28T16:02:18.162Z",
    "verifiedBy": "system",
    "tier": 1,
    "connectedTo": [
      "pripyat-jupiter-factory",
      "chernobyl-reactor-4-control-room",
      "dallol-sulfur-cathedral",
      "kennecott-mines"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 10,
      "message": "The grid requires more dust to resolve this location."
    }
  },
  {
    "slug": "pripyat-hospital-126",
    "name": "Pripyat Hospital 126",
    "category": "both",
    "coordinates": [
      30.0528,
      51.4075
    ],
    "address": {
      "city": "Pripyat",
      "country": "Ukraine",
      "formatted": "Hospital 126, Pripyat, Kyiv Oblast, Ukraine"
    },
    "yearAbandoned": 1986,
    "history": "The hospital that received the first casualties of Reactor 4. Firefighters arrived at 1:28 AM with clothes that registered 15,000 roentgen. The basement still holds their discarded uniforms — too radioactive to move, too dangerous to leave. The surgical theater on the third floor has an operating table with leather straps. The walls are stamped with footprints where liquidators walked out of the decontamination showers and collapsed. The maternity ward still has crib cards dated April 26. The infants were evacuated to Kiev. Most did not live to see June. BUNKER_7 monitors a Geiger counter left in the basement in 2019. It still ticks. The readings are transmitted to the grid every hour. The numbers have not gone down.",
    "hauntingReports": [
      "Liquidators' logbooks describe hearing infants crying from the maternity ward during decontamination sweeps in 1987.",
      "The elevator shaft produces a grinding sound at 1:28 AM, the exact time the first ambulance arrived.",
      "A nurse in a lead apron has been photographed in the second-floor corridor by unmanned trail cameras.",
      "The discarded uniforms in the basement have been found rearranged into a circle on three separate occasions since 2019."
    ],
    "dangerLevel": 5,
    "photos": [],
    "status": "sealed",
    "viewCount": 892,
    "submittedAt": "2026-08-03T20:15:40.499Z",
    "verifiedAt": "2026-08-03T20:15:40.499Z",
    "verifiedBy": "system",
    "tier": 2,
    "connectedTo": [
      "pripyat-amusement-park",
      "duga-radar-array"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 49,
      "message": "The grid will not show this ruin to the unclaimed. Accumulate more dust."
    },
    "resonanceNote": "The Geiger counter in the basement ticks louder when you are watching. I do not know how it knows."
  },
  {
    "slug": "chernobyl-reactor-4-control-room",
    "name": "Chernobyl Reactor 4 Control Room",
    "category": "both",
    "coordinates": [
      30.0501,
      51.3893
    ],
    "address": {
      "city": "Pripyat",
      "country": "Ukraine",
      "formatted": "Reactor 4 Control Room, Chernobyl NPP, Ukraine"
    },
    "yearAbandoned": 1986,
    "history": "Room 704/2. The AZ-5 button is still there, though the plastic has melted and re-solidified into an amber-like substance. The control rods are frozen at 2.4 meters. The radiation level in this room is 40,000 roentgen per hour — enough to deliver a lethal dose in four minutes. The liquidators who entered here in 1986 were called 'bio-robots' because machines failed instantly. They worked in shifts of 40 seconds. The paint on the walls bubbled and fell. The dosimeters screamed until their batteries died. The grid monitors this room through a single camera installed in 2021. The camera has recorded movement twice. Both times, the shift supervisor was logging out. Both times, someone remained in the room.",
    "dangerLevel": 5,
    "photos": [],
    "status": "sealed",
    "viewCount": 2206,
    "submittedAt": "2026-08-03T20:15:40.499Z",
    "verifiedAt": "2026-08-03T20:15:40.499Z",
    "verifiedBy": "system",
    "tier": 2,
    "connectedTo": [
      "duga-radar-array",
      "duga-control-room",
      "the-stanley-hotel",
      "oradour-sur-glane"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 30,
      "message": "The control room remembers the hand that pressed the button. The grid requires more dust to show you."
    },
    "resonanceNote": "The button is still warm. I have the thermal imaging to prove it.",
    "hauntingReports": []
  },
  {
    "slug": "eastern-state-penitentiary",
    "name": "Eastern State Penitentiary",
    "category": "haunted",
    "coordinates": [
      -75.1727,
      39.9683
    ],
    "address": {
      "city": "Philadelphia",
      "country": "United States",
      "formatted": "2027 Fairmount Avenue, Philadelphia, PA"
    },
    "yearAbandoned": 1971,
    "history": "When it opened in 1829, Eastern State was the most expensive building in America. Its radial floor plan — seven cell blocks extending from a central hub like the spokes of a wheel — became the architectural model for over 300 prisons worldwide. The philosophy was radical isolation: inmates lived in vaulted, skylit cells, hooded whenever they left their rooms, permitted no human contact. The silence was engineered. By the 1960s, overcrowding had collapsed the system into shared, squalid quarters. The last prisoners walked out in 1971. Today the stone corridors amplify footsteps that do not belong to tour groups. Cellblock 12 is said to echo with laughter. Cellblock 6 with whispered conversations. The guard tower at night reports movement where sensors detect none.",
    "hauntingReports": [
      "Tour guides report disembodied laughter echoing from Cellblock 12, audible only when standing at the corridor's exact midpoint.",
      "A figure in guard uniform has been photographed in the central rotunda; no guard was on duty at the time.",
      "Visitors describe sudden temperature drops of 20°F in Cellblock 4, accompanied by the smell of tobacco smoke.",
      "Shadows cast by nonexistent sources move across the chapel walls during evening tours."
    ],
    "dangerLevel": 2,
    "photos": [],
    "status": "verified",
    "viewCount": 1783,
    "submittedAt": "2026-07-28T16:02:18.162Z",
    "verifiedAt": "2026-07-28T16:02:18.162Z",
    "verifiedBy": "system",
    "tier": 0,
    "connectedTo": [
      "mount-moriah-cemetery",
      "pripyat-amusement-park",
      "chernobyl-reactor-4-control-room"
    ]
  },
  {
    "slug": "isla-de-las-muecas",
    "name": "Isla de las Muñecas",
    "category": "both",
    "coordinates": [
      -99.0151,
      19.2833
    ],
    "address": {
      "city": "Xochimilco",
      "country": "Mexico",
      "formatted": "Isla de las Muñecas, Xochimilco, Mexico City"
    },
    "yearAbandoned": 2001,
    "history": "Don Julián Santana Barrera lived alone on a chinampa in the canals of Xochimilco. In the 1950s, he found the body of a young girl drowned in the canal. Shortly after, he discovered a doll floating in the same water — perhaps hers, perhaps not. He hung it from a tree to appease her spirit. Then he hung another. And another. Over five decades, the island accumulated an estimated 1,500 dolls: decapitated, eyeless, bleached by sun and rain, crawling with spiders. Don Julián died in 2001, found floating in the exact spot where the girl had been. His cousin now maintains the island. The dolls watch. Their heads turn, visitors say, when no wind blows.",
    "hauntingReports": [
      "Dolls have been observed opening and closing their eyes independently of one another.",
      "Visitors report hearing a child's voice calling from the canal's edge, though no child is present on the boats.",
      "At night, the dolls' plastic limbs produce a clicking sound, as if tapping against the tree bark in sequence.",
      "Photographs taken on the island frequently show orbs clustered around dolls that were not the subject of the frame."
    ],
    "dangerLevel": 3,
    "photos": [],
    "status": "verified",
    "viewCount": 548,
    "submittedAt": "2026-07-28T16:02:18.162Z",
    "verifiedAt": "2026-07-28T16:02:18.162Z",
    "verifiedBy": "system",
    "tier": 1,
    "connectedTo": [
      "duga-radar-array",
      "chacaltaya-ski-resort",
      "bunker-3-relay"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 10,
      "message": "The grid requires more dust to resolve this location."
    }
  },
  {
    "slug": "bodie-ghost-town",
    "name": "Bodie Ghost Town",
    "category": "abandoned",
    "coordinates": [
      -119.0123,
      38.2121
    ],
    "address": {
      "city": "Bodie",
      "country": "United States",
      "formatted": "Bodie State Historic Park, California"
    },
    "yearAbandoned": 1942,
    "history": "In 1879, Bodie had 10,000 residents, 65 saloons, and a murder every other day. It was the third-largest city in California, built on $34 million in gold and silver ore pulled from the Bodie Hills. The Standard Company mill ran 24 hours, its stamps audible for miles. Then the ore ran out. The railroad stopped service in 1919. The last mine closed in 1942. What remains is not a museum replica but a state of arrested decay: tables still set for dinner, a barber's chair still waiting, schoolbooks open to lessons never finished. The air is thin at 8,375 feet. The winters bury the town in snow. In summer, dust devils move through Main street carrying the weight of a place that ended without saying goodbye.",
    "hauntingReports": [
      "A child's writing on a school blackboard changes its letters slowly between twilight and dawn.",
      "Wind blowing through standard chimney pipes emits a steady 60 cycles per minute harmonic drone.",
      "Ghostly outlines of figures have been photographed standing in porches, appearing only on silver nitrate plates."
    ],
    "dangerLevel": 2,
    "photos": [],
    "status": "verified",
    "viewCount": 1023,
    "submittedAt": "2026-07-28T16:02:18.162Z",
    "verifiedAt": "2026-07-28T16:02:18.162Z",
    "verifiedBy": "system",
    "tier": 3,
    "connectedTo": [
      "manzanar",
      "winchester-mystery-house"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 69,
      "message": "The null point is not a place. It is an absence. Maximum dust required."
    },
    "resonanceNote": "I do not know if I placed this file here, or if it placed itself."
  },
  {
    "slug": "aokigahara-forest",
    "name": "Aokigahara Forest",
    "category": "haunted",
    "coordinates": [
      138.6573,
      35.475
    ],
    "address": {
      "city": "Yamanashi",
      "country": "Japan",
      "formatted": "Aokigahara, Yamanashi Prefecture, Japan"
    },
    "history": "At the northwest base of Mount Fuji lies a forest grown on 30 square kilometers of volcanic rock. The trees are dense, the canopy thick enough to block GPS signals and wind. The ground is pitted with ice caves that maintain freezing temperatures year-round. For centuries, Aokigahara has been associated with yūrei — ghosts of the dead who cannot depart. The forest absorbs sound. Compasses spin. Volunteers who patrol the trails find tents abandoned mid-meal, shoes neatly arranged beside empty sleeping bags. The roots twist in patterns that resemble grasping hands. It is beautiful, and it is final.",
    "hauntingReports": [
      "Campers report hearing footsteps circling their tents all night, yet dawn reveals no tracks in the soil.",
      "A pervasive sensation of being watched persists even in the deepest, most isolated sectors of the forest.",
      "Electronic devices drain batteries at abnormal rates; some report hearing voices through static on radios.",
      "Local rangers describe encountering figures in white between the trees who vanish when approached."
    ],
    "dangerLevel": 5,
    "photos": [],
    "status": "verified",
    "viewCount": 3554,
    "submittedAt": "2026-07-28T16:02:18.162Z",
    "verifiedAt": "2026-07-28T16:02:18.162Z",
    "verifiedBy": "system",
    "tier": 1,
    "connectedTo": [
      "aokigahara-sea-of-trees-station",
      "nara-dreamland",
      "madain-saleh",
      "kennecott-mines"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 8,
      "message": "The grid requires more dust to resolve this location."
    }
  },
  {
    "slug": "the-grid-null-point",
    "name": "The Grid Null Point",
    "category": "haunted",
    "coordinates": [
      -97.0,
      38.0
    ],
    "address": {
      "city": "Lebanon",
      "country": "United States",
      "formatted": "38°N 97°W, Kansas, United States"
    },
    "history": "The geographic center of the contiguous United States is near Lebanon, Kansas. The grid null point is 40 kilometers north. It is not a place. It is a coordinate where the grid's mapping fails. Satellite imagery shows a wheat field. Ground surveys confirm a wheat field. The wheat in this field grows in a spiral pattern, 200 meters in diameter. The spiral is not visible from the ground. It is visible only from above. The farmer who owns the field — his family has farmed it since 1887 — does not plant in spirals. He plants in rows. The spiral appears every June, regardless of the crop. In 2019, a drone survey found that the spiral's center is 1 meter lower than the surrounding field. The depression is not a sinkhole. It is perfectly circular. It is 30 centimeters deep. It contains no water. It contains no soil. It contains ash. The ash has been tested. It is volcanic. There are no volcanoes in Kansas. The ash is 12,000 years old. The wheat grows through it.",
    "hauntingReports": [
      "The spiral pattern rotates 15 degrees counterclockwise each year, though no mechanical process affects the field.",
      "The ash at the center produces a temperature 5°C above ambient at midnight, though it has no heat source.",
      "Cattle refuse to enter the spiral. Dogs howl when brought within 50 meters.",
      "The farmer reports finding objects in the depression: a 1950s wristwatch, a Roman coin, a Phoenician glass bead. None were there the day before."
    ],
    "dangerLevel": 3,
    "photos": [],
    "status": "mirage",
    "viewCount": 2336,
    "submittedAt": "2026-08-03T20:15:40.499Z",
    "verifiedAt": "2026-08-03T20:15:40.499Z",
    "verifiedBy": "system",
    "tier": 3,
    "connectedTo": [
      "the-stanley-hotel",
      "sanatorium-du-basil",
      "aokigahara-forest"
    ],
    "unlockCondition": {
      "type": "code",
      "value": "RESONANCE",
      "message": "A resonance code is required. Find it in another investigation."
    },
    "resonanceNote": "The ash is 12,000 years old. The spiral rotates. I have calculated that the rotation will align with the summer solstice in 2047. I do not know what happens then."
  },
  {
    "slug": "the-vanishing-hospital",
    "name": "The Vanishing Hospital",
    "category": "haunted",
    "coordinates": [
      139.692,
      35.69
    ],
    "address": {
      "city": "Tokyo",
      "country": "Japan",
      "formatted": "The Vanishing Hospital, Tokyo, Japan"
    },
    "yearAbandoned": 1995,
    "history": "A psychiatric ward that was never officially closed. Staff left in 1995. Patients... stayed. The building flickers on satellite imagery. It is there in one frame. It is not there in the next. The address does not exist on any postal registry. The phone number — 03-3141-5926 — rings at 03:14 AM. The ringtone is not a standard tone. It is a voice counting backward from 100 in Japanese. The building appears on the grid only at 03:14. BUNKER_7 has received three transmissions from this coordinate. The first was a heart monitor flatline. The second was a lullaby. The third was BUNKER_7's own voice, speaking a message that BUNKER_7 has not yet composed. The transmission is dated 2047. The grid does not understand time. The grid only records.",
    "hauntingReports": [
      "The building appears in photographs taken at 03:14, though the location shows an empty lot at all other times.",
      "The phone number produces a different message each year on the anniversary of the staff departure.",
      "The heart monitor flatline matches the EKG of a patient who died in the ward in 1994, though the monitor was destroyed in 1995.",
      "BUNKER_7's future transmission describes the grid null point in Kansas with coordinates that were not calculated until 2026."
    ],
    "dangerLevel": 5,
    "photos": [],
    "status": "mirage",
    "viewCount": 1803,
    "submittedAt": "2026-08-03T20:15:40.499Z",
    "verifiedAt": "2026-08-03T20:15:40.499Z",
    "verifiedBy": "system",
    "tier": 3,
    "connectedTo": [
      "aokigahara-forest",
      "aokigahara-sea-of-trees-station",
      "nara-dreamland",
      "mary-kings-close"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 75,
      "message": "The null point is not a place. It is an absence. Maximum dust required."
    },
    "resonanceNote": "I have not composed the message. But I recognize my voice. I am frightened of what I will say."
  },
  {
    "slug": "borovsko-bridge",
    "name": "Borovsko Bridge",
    "category": "abandoned",
    "coordinates": [
      14.0167,
      49.7833
    ],
    "address": {
      "city": "Borovnice",
      "country": "Czech Republic",
      "formatted": "Borovsko Bridge, Borovnice, Benešov, Czech Republic"
    },
    "yearAbandoned": 1950,
    "history": "A concrete arch bridge built in 1939 to carry the Prague-Munich highway over the Žďakovka valley. Construction was interrupted by the German occupation, resumed in 1946, and abandoned in 1950 when the route was changed. The bridge stands complete but never connected to a road — a span of reinforced concrete ending in mid-air on both sides, 50 meters above the forest floor. Czech engineers call it the 'Bridge to Nowhere.' The concrete is weathering faster than predicted; micro-fractures in the pylons suggest the structure is singing at 18 Hz, a frequency below human hearing but within the range known to induce paranoia and visual hallucinations. The forest beneath it is unusually silent. No birds nest in the arches.",
    "hauntingReports": [
      "Seismic arrays show micro-fractures vibrating precisely at 18 Hz in silent, cold weather.",
      "Visitors on the concrete deck report hearing footsteps running behind them that end right at the sheer drop-off.",
      "Water pooling on the span during spring rainstorms forms ripples that trace the outlines of an unbuilt highway."
    ],
    "dangerLevel": 2,
    "photos": [],
    "status": "verified",
    "viewCount": 2165,
    "submittedAt": "2026-08-03T20:15:40.499Z",
    "verifiedAt": "2026-08-03T20:15:40.499Z",
    "verifiedBy": "system",
    "tier": 0,
    "connectedTo": [
      "sedlec-ossuary",
      "houska-castle",
      "wewak-japanese-tunnels"
    ],
    "resonanceNote": "The bridge hums at a frequency the ears cannot hear but the bones can. I have felt it in my teeth."
  },
  {
    "slug": "st-kilda",
    "name": "St. Kilda",
    "category": "abandoned",
    "coordinates": [
      -8.5833,
      57.8167
    ],
    "address": {
      "city": "St. Kilda",
      "country": "United Kingdom",
      "formatted": "St. Kilda, Outer Hebrides, Scotland"
    },
    "yearAbandoned": 1930,
    "history": "The most remote archipelago in the British Isles, 64 kilometers west of the Outer Hebrides, inhabited for at least two millennia. The St. Kildans lived on seabirds — puffins, fulmars, gannets — harvested by hand from the cliffs. They spoke a dialect of Gaelic found nowhere else. There was no peat for fuel, no wood for construction, no natural harbor. In 1930, the last 36 residents petitioned the government for evacuation; the island could no longer sustain them after the death of a young woman from appendicitis that winter. They left their furniture, their Bibles, their schoolbooks. Today the stone cleits — storage huts — still dot the slopes, filled with nothing but wind. The archipelago is a UNESCO World Heritage Site, visited only by military personnel and occasional researchers. The sheep are feral. The houses have no roofs. The silence is Atlantic and absolute.",
    "hauntingReports": [
      "Unmanned weather sensors record whispered Gaelic poetry emerging from empty beehive huts during winter snowstorms.",
      "The wild Soay sheep gather on the village bay shoreline in a tight circle on August 29, the anniversary of the evacuation.",
      "Stone hearths in roofless cottages remain warm to touch long after rainstorms wash through them."
    ],
    "dangerLevel": 3,
    "photos": [],
    "status": "verified",
    "viewCount": 3407,
    "submittedAt": "2026-07-28T16:02:18.162Z",
    "verifiedAt": "2026-07-28T16:02:18.162Z",
    "verifiedBy": "system",
    "tier": 0,
    "connectedTo": [
      "flannan-isles-lighthouse",
      "kolmanskop-hospital-wing",
      "la-noria-cemetery"
    ]
  },
  {
    "slug": "teufelsberg-echo-dome",
    "name": "Teufelsberg Echo Dome",
    "category": "haunted",
    "coordinates": [
      13.2415,
      52.4975
    ],
    "address": {
      "city": "Berlin",
      "country": "Germany",
      "formatted": "Teufelsberg Echo Dome, Grunewald, Berlin"
    },
    "yearAbandoned": 1999,
    "history": "The largest of the five radomes on Teufelsberg — Dome 3 — was not used for radar. NSA documents declassified in 2012 refer to it as an 'acoustic test facility.' The interior is a perfect sphere of fiberglass, 18 meters in diameter, with a single microphone suspended from the ceiling on a steel cable. The floor is concrete, but the concrete has been worn smooth in a circular pattern 3 meters in diameter, as if something rotated there for years. The declassified documents do not explain the wear pattern. The microphone is still connected to a coaxial cable that runs into the mountain. The cable has been traced to the base of the artificial hill, where it enters a concrete shaft that extends 40 meters below ground level. The shaft is flooded. The water has been tested. It is not groundwater. It is seawater. Berlin is 180 kilometers from the sea.",
    "hauntingReports": [
      "Dome 3 produces a low-frequency hum at 4:30 AM daily, though it has no power connection.",
      "The wear pattern on the floor has deepened by 2 millimeters since 2012, though no one enters the dome.",
      "The suspended microphone rotates slowly, always coming to rest pointing at the same spot on the floor.",
      "Visitors who whisper into the dome's center hear their words returned in a voice not their own, speaking German they do not understand."
    ],
    "dangerLevel": 3,
    "photos": [],
    "status": "sealed",
    "viewCount": 1144,
    "submittedAt": "2026-08-03T20:15:40.499Z",
    "verifiedAt": "2026-08-03T20:15:40.499Z",
    "verifiedBy": "system",
    "tier": 3,
    "connectedTo": [
      "teufelsberg",
      "bunker-3-relay",
      "duga-radar-array",
      "tskaltubo-sanatoriums",
      "poveglia-subterranean-ward"
    ],
    "unlockCondition": {
      "type": "dust",
      "value": 91,
      "message": "This coordinate exists only in the space between memories."
    },
    "resonanceNote": "The seawater in the shaft is 180 kilometers from any ocean. I have tested it three times. It is Atlantic water."
  },
  {
    "slug": "byberry-state-hospital",
    "name": "Byberry State Hospital",
    "category": "haunted",
    "coordinates": [
      -74.98,
      40.08
    ],
    "address": {
      "city": "Philadelphia",
      "country": "United States",
      "formatted": "Byberry State Hospital, Philadelphia, Pennsylvania"
    },
    "yearAbandoned": 1990,
    "history": "Built in 1903 as the Philadelphia Hospital for Mental Diseases, Byberry grew to 1,200 acres and 70 buildings, housing 7,000 patients. A 1946 LIFE magazine exposé showed patients naked in their own filth, eating from troughs, and locked in basement cages. The hospital was not closed. It continued operating until 1990. The buildings were demolished in 2006 for residential development. The development was halted in 2008 when construction workers found the basement levels — levels not on any architectural plan. The basements extend 8 meters below ground. The walls are lined with iron cages. The cages contain bedding. The bedding is wool and straw. The straw is fresh. The cages were not in the 1946 photographs. They were not in the 1990 inspection. They were not in the demolition plans. They are there now. The developer filled the basements with concrete. The concrete cracked in 2015. The cracks form the word 'HUNGRY.' The word is 12 meters long. It is visible from satellite.",
    "hauntingReports": [
      "The concrete over the basements weeps a black liquid that analysis identifies as human saliva, though no DNA matches any known patient.",
      "The iron cages produce a sound of rattling at 3:00 AM, synchronized across all basements in the development.",
      "Residents report nightmares of eating from troughs, though they have no knowledge of the hospital's history.",
      "The satellite image of the cracks changes. The word is not always 'HUNGRY.' On the winter solstice, it reads 'THANK YOU.'"
    ],
    "dangerLevel": 4,
    "photos": [],
    "status": "sealed",
    "viewCount": 3045,
    "submittedAt": "2026-08-03T20:15:40.499Z",
    "verifiedAt": "2026-08-03T20:15:40.499Z",
    "verifiedBy": "system",
    "tier": 3,
    "connectedTo": [
      "eastern-state-penitentiary",
      "letchworth-village"
    ],
    "unlockCondition": {
      "type": "reading",
      "value": "bunker7-transmission-6",
      "message": "Wait for BUNKER_7 to reveal the path."
    },
    "resonanceNote": "You have been here before. The file says you have not. I believe the file."
  }
];

/**
 * Fetch places from the API, falling back to local static cache if unavailable.
 */
export async function fetchPlaces(): Promise<Place[]> {
  try {
    const res = await fetch('/api/places');
    if (!res.ok) throw new Error('Archive unreachable');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid archive format');
    return data as Place[];
  } catch (err) {
    console.warn('[Atlas] Remote archive unavailable. Using local cache.');
    return LOCAL_PLACES;
  }
}
