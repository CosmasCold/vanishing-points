import { NextRequest, NextResponse } from "next/server";
import dbConnect, { PlaceModel } from "@/lib/db";
import { slugify } from "@/lib/utils";

const SEED_DATA = [
  {
    name: "Pripyat Amusement Park",
    category: "abandoned" as const,
    coordinates: [30.0542, 51.4061] as [number, number],
    address: {
      city: "Pripyat",
      country: "Ukraine",
      formatted: "Pripyat, Kyiv Oblast, Ukraine",
    },
    yearAbandoned: 1986,
    history: `The Ferris wheel never turned for paying customers. Scheduled to open on May 1, 1986, the park stood ready for only a handful of test rides before the evacuation order came on April 27. The air already carried something wrong — a metallic taste, a silence in the pines. Within 36 hours of the Chernobyl explosion, 49,000 people left their apartments forever. The bumper cars remain locked in their grid. A radiation meter near the river still ticks. Nature has begun its slow repossession: birch saplings crack the asphalt of Lenin Avenue, and wolves move through the school corridors at dusk. The park is not frozen in time; it is dissolving into it.`,
    hauntingReports: [],
    dangerLevel: 4,
    photos: [
      "https://picsum.photos/seed/pripyat1/1200/800",
      "https://picsum.photos/seed/pripyat2/1200/800",
    ],
  },
  {
    name: "Eastern State Penitentiary",
    category: "haunted" as const,
    coordinates: [-75.1727, 39.9683] as [number, number],
    address: {
      city: "Philadelphia",
      country: "United States",
      formatted: "2027 Fairmount Avenue, Philadelphia, PA",
    },
    yearAbandoned: 1971,
    history: `When it opened in 1829, Eastern State was the most expensive building in America. Its radial floor plan — seven cell blocks extending from a central hub like the spokes of a wheel — became the architectural model for over 300 prisons worldwide. The philosophy was radical isolation: inmates lived in vaulted, skylit cells, hooded whenever they left their rooms, permitted no human contact. The silence was engineered. By the 1960s, overcrowding had collapsed the system into shared, squalid quarters. The last prisoners walked out in 1971. Today the stone corridors amplify footsteps that do not belong to tour groups. Cellblock 12 is said to echo with laughter. Cellblock 6 with whispered conversations. The guard tower at night reports movement where sensors detect none.`,
    hauntingReports: [
      "Tour guides report disembodied laughter echoing from Cellblock 12, audible only when standing at the corridor's exact midpoint.",
      "A figure in guard uniform has been photographed in the central rotunda; no guard was on duty at the time.",
      "Visitors describe sudden temperature drops of 20°F in Cellblock 4, accompanied by the smell of tobacco smoke.",
      "Shadows cast by nonexistent sources move across the chapel walls during evening tours.",
    ],
    dangerLevel: 2,
    photos: [
      "https://picsum.photos/seed/easternstate1/1200/800",
      "https://picsum.photos/seed/easternstate2/1200/800",
    ],
  },
  {
    name: "Isla de las Muñecas",
    category: "both" as const,
    coordinates: [-99.0151, 19.2833] as [number, number],
    address: {
      city: "Xochimilco",
      country: "Mexico",
      formatted: "Isla de las Muñecas, Xochimilco, Mexico City",
    },
    yearAbandoned: 2001,
    history: `Don Julián Santana Barrera lived alone on a chinampa in the canals of Xochimilco. In the 1950s, he found the body of a young girl drowned in the canal. Shortly after, he discovered a doll floating in the same water — perhaps hers, perhaps not. He hung it from a tree to appease her spirit. Then he hung another. And another. Over five decades, the island accumulated an estimated 1,500 dolls: decapitated, eyeless, bleached by sun and rain, crawling with spiders. Don Julián died in 2001, found floating in the exact spot where the girl had been. His cousin now maintains the island. The dolls watch. Their heads turn, visitors say, when no wind blows.`,
    hauntingReports: [
      "Dolls have been observed opening and closing their eyes independently of one another.",
      "Visitors report hearing a child's voice calling from the canal's edge, though no child is present on the boats.",
      "At night, the dolls' plastic limbs produce a clicking sound, as if tapping against the tree bark in sequence.",
      "Photographs taken on the island frequently show orbs clustered around dolls that were not the subject of the frame.",
    ],
    dangerLevel: 3,
    photos: [
      "https://picsum.photos/seed/dollisland1/1200/800",
      "https://picsum.photos/seed/dollisland2/1200/800",
    ],
  },
  {
    name: "Bodie Ghost Town",
    category: "abandoned" as const,
    coordinates: [-119.0123, 38.2121] as [number, number],
    address: {
      city: "Bodie",
      country: "United States",
      formatted: "Bodie State Historic Park, California",
    },
    yearAbandoned: 1942,
    history: `In 1879, Bodie had 10,000 residents, 65 saloons, and a murder every other day. It was the third-largest city in California, built on $34 million in gold and silver ore pulled from the Bodie Hills. The Standard Company mill ran 24 hours, its stamps audible for miles. Then the ore ran out. The railroad stopped service in 1919. The last mine closed in 1942. What remains is not a museum replica but a state of arrested decay: tables still set for dinner, a barber's chair still waiting, schoolbooks open to lessons never finished. The air is thin at 8,375 feet. The winters bury the town in snow. In summer, dust devils move through Main Street carrying the weight of a place that ended without saying goodbye.`,
    hauntingReports: [],
    dangerLevel: 2,
    photos: [
      "https://picsum.photos/seed/bodie1/1200/800",
      "https://picsum.photos/seed/bodie2/1200/800",
    ],
  },
  {
    name: "Aokigahara Forest",
    category: "haunted" as const,
    coordinates: [138.6573, 35.475] as [number, number],
    address: {
      city: "Yamanashi",
      country: "Japan",
      formatted: "Aokigahara, Yamanashi Prefecture, Japan",
    },
    yearAbandoned: undefined,
    history: `At the northwest base of Mount Fuji lies a forest grown on 30 square kilometers of volcanic rock. The trees are dense, the canopy thick enough to block GPS signals and wind. The ground is pitted with ice caves that maintain freezing temperatures year-round. For centuries, Aokigahara has been associated with yūrei — ghosts of the dead who cannot depart. The forest absorbs sound. Compasses spin. Volunteers who patrol the trails find tents abandoned mid-meal, shoes neatly arranged beside empty sleeping bags. The roots twist in patterns that resemble grasping hands. It is beautiful, and it is final.`,
    hauntingReports: [
      "Campers report hearing footsteps circling their tents all night, yet dawn reveals no tracks in the volcanic soil.",
      "A pervasive sensation of being watched persists even in the deepest, most isolated sectors of the forest.",
      "Electronic devices drain batteries at abnormal rates; some report hearing voices through static on disabled radios.",
      "Local rangers describe encountering figures in white between the trees who vanish when approached.",
    ],
    dangerLevel: 5,
    photos: [
      "https://picsum.photos/seed/aokigahara1/1200/800",
      "https://picsum.photos/seed/aokigahara2/1200/800",
    ],
  },
  {
    name: "Duga Radar Array",
    category: "abandoned" as const,
    coordinates: [30.067, 51.306] as [number, number],
    address: {
      city: "Chernobyl-2",
      country: "Ukraine",
      formatted: "Chernobyl-2, Kyiv Oblast, Ukraine",
    },
    yearAbandoned: 1989,
    history: `NATO called it the Russian Woodpecker — a sharp, repetitive tapping that interfered with shortwave radios worldwide throughout the 1970s and 80s. The source was a massive over-the-horizon radar built to detect American missile launches, concealed in a classified settlement near Chernobyl. Two arrays, each 150 meters tall and 500 meters long, constructed of rusting steel lattice and cantilevered against the sky. The settlement that housed its 1,000 operators and families was erased from maps. After the 1986 disaster, the radar operated for three more years before abandonment. The steel groans in wind. The control rooms hold logbooks open to dates in 1986. The tapping has stopped, but the structure remains, a cathedral of paranoia.`,
    hauntingReports: [],
    dangerLevel: 4,
    photos: [
      "https://picsum.photos/seed/duga1/1200/800",
      "https://picsum.photos/seed/duga2/1200/800",
    ],
  },
  {
    name: "Bhangarh Fort",
    category: "haunted" as const,
    coordinates: [76.2878, 27.0964] as [number, number],
    address: {
      city: "Bhangarh",
      country: "India",
      formatted: "Bhangarh, Alwar District, Rajasthan, India",
    },
    yearAbandoned: 1783,
    history: `Built in 1573 by Raja Bhagwant Das for his son Madho Singh, Bhangarh was a prosperous city of 10,000 souls. Its markets, temples, and palaces stood at the edge of the Sariska forest. The legend holds that a tantrik named Singhia fell in love with the princess Ratnavati. When she rejected him, he cursed the entire city: no roof would remain standing, and no soul would find peace within its walls. A year later, the fort was sacked in a battle with a neighboring state. The population fled overnight. Today, the Archaeological Survey of India legally prohibits entry between sunset and sunrise. The bazaar still has shops. The temples still have idols. But no one lives there, and no one has for 240 years.`,
    hauntingReports: [
      "Visitors who have entered after dark report hearing classical music and the sound of bangles from the princess's quarters.",
      "The aroma of incense and sandalwood has been detected near the temple complex where no fires burn.",
      "Locals claim that anyone who builds a roof within the fort walls will find it collapsed by morning.",
      "Audio recordings captured in the courtyard contain rhythmic chanting in a dialect not spoken in Rajasthan for centuries.",
    ],
    dangerLevel: 3,
    photos: [
      "https://picsum.photos/seed/bhangarh1/1200/800",
      "https://picsum.photos/seed/bhangarh2/1200/800",
    ],
  },
  {
    name: "North Brother Island",
    category: "abandoned" as const,
    coordinates: [-73.899, 40.801] as [number, number],
    address: {
      city: "New York",
      country: "United States",
      formatted: "North Brother Island, Bronx, New York",
    },
    yearAbandoned: 1963,
    history: `In the East River between the Bronx and Rikers Island sits 20 acres of forbidden ground. It began as a quarantine hospital in 1885, most infamous for housing Typhoid Mary — Mary Mallon — for nearly 30 years until her death in 1938. The island later served as a treatment center for adolescent drug addicts, shuttered in 1963 after staff corruption scandals. Since then, it has been a bird sanctuary, closed to the public. The Riverside Hospital complex stands exactly as left: operating tables, gurneys, wheelchairs, a morgue with porcelain slabs. Vines pull the brick walls apart. The tuberculosis pavilion's solarium faces the Manhattan skyline across water too polluted to cross without permission. It is the city's most inaccessible ruin, decaying in full view of 8 million people.`,
    hauntingReports: [],
    dangerLevel: 3,
    photos: [
      "https://picsum.photos/seed/northbrother1/1200/800",
      "https://picsum.photos/seed/northbrother2/1200/800",
    ],
  },
  {
    name: "Humberstone Saltpeter Works",
    category: "abandoned" as const,
    coordinates: [-69.794, -20.208] as [number, number],
    address: {
      city: "Humberstone",
      country: "Chile",
      formatted: "Humberstone, Tarapacá Region, Chile",
    },
    yearAbandoned: 1960,
    history: `In the Atacama Desert — the driest place on Earth — a company town rose from nothing to process sodium nitrate for fertilizer and explosives. At its peak in the 1930s, Humberstone and its sister town Santa Laura housed 3,500 workers from Chile, Peru, and Bolivia in a self-contained world: a theater, a hotel, a swimming pool filled with water shipped from the coast. The workers were paid in tokens redeemable only at the company store. When synthetic nitrate was invented in Germany after World War II, the industry collapsed instantly. The towns emptied in weeks. The pool still holds stagnant water. The theater's velvet seats face a screen that has shown nothing for 64 years. The desert does not reclaim quickly; it preserves.`,
    hauntingReports: [],
    dangerLevel: 2,
    photos: [
      "https://picsum.photos/seed/humberstone1/1200/800",
      "https://picsum.photos/seed/humberstone2/1200/800",
    ],
  },
  {
    name: "Château de Brissac",
    category: "haunted" as const,
    coordinates: [-0.449, 47.355] as [number, number],
    address: {
      city: "Brissac-Quincé",
      country: "France",
      formatted: "Château de Brissac, Maine-et-Loire, France",
    },
    yearAbandoned: undefined,
    history: `The tallest castle in France, seven stories of limestone and slate, has been inhabited by the same family since 1502. But not all its residents are Cossé-Brissacs. In the 15th century, Jacques de Brézé caught his wife Charlotte in flagrante with a huntsman. He murdered them both on the spot. Charlotte — la Dame Verte, the Green Lady — is said to still wander the tower chapel in the dress she died in. Her moans are audible during summer nights. The family has grown accustomed to her. They do not rent the chapel wing to guests. They do not enter it after 10 PM. The castle is open for tours, wine tastings, and weddings. The Green Lady is not mentioned in the brochure, but she is the reason the staff counts the chairs twice before locking up.`,
    hauntingReports: [
      "Guests in the chapel wing report a woman in green standing at the foot of their bed, her face bearing the wounds of a sword.",
      "The chapel organ plays chords at 3:00 AM; no one has touched the instrument in decades.",
      "A portrait of Charlotte in the grand gallery has been observed weeping by multiple tour guides.",
      "The smell of rotting flowers permeates the tower staircase every year on the anniversary of her death.",
    ],
    dangerLevel: 2,
    photos: [
      "https://picsum.photos/seed/brissac1/1200/800",
      "https://picsum.photos/seed/brissac2/1200/800",
    ],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Unauthorized. Provide ?key=ADMIN_PASSWORD" },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    const existing = await PlaceModel.countDocuments();
    if (existing > 0) {
      return NextResponse.json({
        message: "Database already seeded",
        count: existing,
      });
    }

    const docs = SEED_DATA.map((data) => ({
      ...data,
      slug: slugify(data.name),
      status: "verified" as const,
      contributor: {
        name: "The Archivist",
        email: "archivist@vanishingpoints.app",
      },
      viewCount: Math.floor(Math.random() * 5000) + 100,
      submittedAt: new Date(),
      verifiedAt: new Date(),
      verifiedBy: "system",
    }));

    await PlaceModel.insertMany(docs);

    return NextResponse.json({
      message: "Archives populated",
      seeded: docs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to seed" },
      { status: 500 }
    );
  }
}