import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Eye } from "lucide-react";
import { Metadata } from "next";
import dbConnect, { PlaceModel } from "@/lib/db";
import PhotoGallery from "@/components/PhotoGallery";
import DangerIndicator from "@/components/DangerIndicator";
import StatusBadge from "@/components/StatusBadge";
import { Place } from "@/types";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await dbConnect();
  const doc = await PlaceModel.findOne({ slug: params.slug }).lean();
  const place = doc as unknown as Place | null;

  if (!place) return { title: "Not Found | Vanishing Points" };

  return {
    title: `${place.name} | Vanishing Points`,
    description: place.history.slice(0, 160),
  };
}

export default async function PlacePage({ params }: Props) {
  await dbConnect();
  const doc = await PlaceModel.findOne({ slug: params.slug }).lean();
  const place = doc as unknown as Place | null;

  if (!place) notFound();

  return (
    <main className="submit-page min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/list"
          className="inline-flex items-center gap-2 text-[#8b7355] hover:text-[#c9b896] transition-colors text-sm font-mono mb-6"
        >
          <ArrowLeft size={14} />
          Return to archives
        </Link>

        <div className="submit-card rounded-xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <StatusBadge category={place.category} variant="light" />
                <h1 className="font-cinzel text-3xl font-medium text-[#2a1f14] mt-3 leading-tight">
                  {place.name}
                </h1>
                <div className="flex items-center gap-1.5 mt-2 text-[#5a4a3a] font-mono text-xs">
                  <MapPin size={11} />
                  <span>
                    {place.address.city}, {place.address.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Meta bar */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[rgba(62,43,26,0.12)]">
              {place.yearAbandoned && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#8b7355]" />
                  <span className="font-mono text-[10px] text-[#5a4a3a] uppercase tracking-wider">
                    Abandoned {place.yearAbandoned}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-[#8b7355]" />
                <span className="font-mono text-[10px] text-[#5a4a3a] uppercase tracking-wider">
                  Danger
                </span>
                <DangerIndicator level={place.dangerLevel} variant="parchment" />
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Eye size={12} className="text-[#8b7355]" />
                <span className="font-mono text-[10px] text-[#5a4a3a] uppercase tracking-wider">
                  {place.viewCount || 0} views
                </span>
              </div>
            </div>

            {/* Photos */}
            {place.photos && place.photos.length > 0 && (
              <div className="mb-8">
                <h3 className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#4a3a28] mb-3">
                  Visual Evidence
                </h3>
                <div className="specimen-frame rounded-lg overflow-hidden bg-[#c9b896]">
                  <PhotoGallery photos={place.photos} />
                </div>
              </div>
            )}

            {/* History */}
            <div className="mb-8">
              <h3 className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#4a3a28] mb-3">
                Historical Record
              </h3>
              <p className="text-[#3a2a1a] text-sm leading-[1.8]">
                {place.history}
              </p>
            </div>

            {/* Haunting Reports */}
            {place.hauntingReports && place.hauntingReports.length > 0 && (
              <div className="mb-8">
                <h3 className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#4a3a28] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6b3020]" />
                  Spectral Accounts
                </h3>
                <div className="space-y-3">
                  {place.hauntingReports.map((report: string, i: number) => (
                    <p
                      key={i}
                      className="relative pl-4 text-[#3a2a1a] text-sm italic leading-[1.7] border-l border-[rgba(107,48,32,0.2)]"
                    >
                      <span className="absolute left-0 text-[#8b7355] font-mono">
                        —
                      </span>
                      {report}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Footer stamp */}
            <div className="pt-4 border-t border-[rgba(62,43,26,0.1)] flex items-center justify-between">
              <span className="font-mono text-[9px] text-[#8b7355] tracking-[0.2em] uppercase opacity-60">
                Ref. {place.slug?.toUpperCase() || "UNKNOWN"}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < place.dangerLevel
                        ? "bg-[#6b3020]"
                        : "border border-[#8b7355] bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}