import { notFound } from "next/navigation";
import dbConnect, { PlaceModel } from "@/lib/db";

function formatCoord(n: number, isLat: boolean) {
  const dir = isLat ? (n >= 0 ? "N" : "S") : n >= 0 ? "E" : "W";
  const abs = Math.abs(n);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = Math.round(((abs - deg) * 60 - min) * 60);
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

export const dynamic = "force-dynamic";

export default async function DossierPage({
  params,
}: {
  params: { slug: string };
}) {
  await dbConnect();
  const place = await PlaceModel.findOne({ slug: params.slug }).lean();

  if (!place) notFound();

  const now = new Date();
  const ref = `DOSSIER-${place.slug.toUpperCase().slice(0, 6)}-${now
    .getFullYear()
    .toString()
    .slice(-2)}`;

  return (
    <main className="min-h-screen bg-[#e8dcc8] text-[#2a2018] font-mono p-8 md:p-16 print:p-8">
      <div className="max-w-3xl mx-auto border-2 border-[#3d3228] p-8 md:p-12 relative">
        {/* Stamp */}
        <div className="absolute top-6 right-6 border-2 border-[#7a3a2a] text-[#7a3a2a] px-3 py-1 text-[10px] font-bold tracking-widest uppercase rotate-3 opacity-70">
          ARCHIVED
        </div>

        <header className="mb-10 border-b-2 border-[#3d3228] pb-6">
          <p className="text-[10px] tracking-[0.4em] uppercase mb-2">
            Vanishing Points — Field Dossier
          </p>
          <h1 className="font-cinzel text-3xl md:text-4xl font-medium text-[#1a1410]">
            {place.name}
          </h1>
          <p className="text-sm mt-2 opacity-70">
            {place.address.city}, {place.address.country}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-6 mb-10 text-xs">
          <div>
            <p className="uppercase tracking-wider text-[10px] opacity-50 mb-1">
              Reference
            </p>
            <p className="font-bold">{ref}</p>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[10px] opacity-50 mb-1">
              Date Compiled
            </p>
            <p>{now.toLocaleDateString("en-GB")}</p>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[10px] opacity-50 mb-1">
              Coordinates
            </p>
            <p className="blur-sm hover:blur-none transition-all cursor-help select-none">
              {formatCoord(place.coordinates[1], true)} {formatCoord(place.coordinates[0], false)}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[10px] opacity-50 mb-1">
              Classification
            </p>
            <p className="uppercase">{place.category}</p>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[10px] opacity-50 mb-1">
              Danger Level
            </p>
            <p>{"★".repeat(place.dangerLevel)}{"☆".repeat(5 - place.dangerLevel)}</p>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[10px] opacity-50 mb-1">
              Status
            </p>
            <p>{place.yearAbandoned ? `Abandoned ${place.yearAbandoned}` : "Date unknown"}</p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="font-cinzel text-lg border-b border-[#3d3228]/30 pb-2 mb-4">
            Historical Record
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{place.history}</p>
        </section>

        {place.hauntingReports && place.hauntingReports.length > 0 && (
          <section className="mb-10">
            <h2 className="font-cinzel text-lg border-b border-[#3d3228]/30 pb-2 mb-4 text-[#7a3a2a]">
              Spectral Accounts
            </h2>
            <div className="space-y-4">
              {place.hauntingReports.map((r: string, i: number) => (
                <p key={i} className="text-sm italic border-l-2 border-[#7a3a2a]/30 pl-4">
                  {r}
                </p>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="font-cinzel text-lg border-b border-[#3d3228]/30 pb-2 mb-4">
            Field Notes
          </h2>
          <div className="h-32 border border-[#3d3228]/20 p-4 text-sm italic opacity-50">
            [ Personal observations to be recorded in the field. ]
          </div>
        </section>

        <footer className="mt-12 pt-6 border-t-2 border-[#3d3228] flex items-center justify-between text-[10px] uppercase tracking-widest opacity-50">
          <span>Vanishing Points Atlas</span>
          <span>{ref}</span>
        </footer>
      </div>

      <div className="max-w-3xl mx-auto mt-6 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#3d3228] text-[#e8dcc8] text-xs font-mono uppercase tracking-wider rounded hover:bg-[#2a2018] transition-colors"
        >
          Print / Save PDF
        </button>
      </div>
    </main>
  );
}