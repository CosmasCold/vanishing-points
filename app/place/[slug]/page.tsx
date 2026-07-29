import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Eye } from "lucide-react";
import { Metadata } from "next";
import dbConnect, { PlaceModel } from "@/lib/db";
import PhotoGallery from "@/components/PhotoGallery";
import DangerIndicator from "@/components/DangerIndicator";
import StatusBadge from "@/components/StatusBadge";
import TypewriterText from "@/components/TypewriterText";
import ClassifiedText from "@/components/ClassifiedText";
import MarginaliaComments from "@/components/MarginaliaComments";
import { Place } from "@/types";
import ShareButton from "@/components/ShareButton";
import PrintButton from "@/components/PrintButton";

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
    openGraph: {
      title: place.name,
      description: `${place.address.city}, ${place.address.country} · Abandoned ${place.yearAbandoned || "Unknown"} · Danger ${place.dangerLevel}/5`,
      images: place.photos?.[0] ? [{ url: place.photos[0], width: 1200, height: 800 }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: place.name,
      description: place.history.slice(0, 120),
      images: place.photos?.[0] ? [place.photos[0]] : [],
    },
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
          className="inline-flex items-center gap-2 text-[#9a8a72] hover:text-[#c4b8a4] transition-colors text-sm font-mono mb-6"
        >
          <ArrowLeft size={14} />
          Return to archives
        </Link>

        <div className="submit-card rounded-xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <StatusBadge category={place.category} variant="light" />
                <h1 className="font-cinzel text-3xl font-medium text-[#3d3228] mt-3 leading-tight">
                  {place.name}
                </h1>
                <div className="flex items-center gap-1.5 mt-2 text-[#7a6e5e] font-mono text-xs">
                  <MapPin size={11} />
                  <span>
                    {place.address.city}, {place.address.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[rgba(62,50,40,0.1)]">
              {place.yearAbandoned && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#9a8a72]" />
                  <span className="font-mono text-[10px] text-[#7a6e5e] uppercase tracking-wider">
                    Abandoned {place.yearAbandoned}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-[#9a8a72]" />
                <span className="font-mono text-[10px] text-[#7a6e5e] uppercase tracking-wider">
                  Danger
                </span>
                <DangerIndicator level={place.dangerLevel} variant="parchment" />
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Eye size={12} className="text-[#9a8a72]" />
                <span className="font-mono text-[10px] text-[#7a6e5e] uppercase tracking-wider">
                  {place.viewCount || 0} views
                </span>
              </div>
              <ShareButton url={`/place/${place.slug}`} title={place.name} />
              <PrintButton />
            </div>

            {place.photos && place.photos.length > 0 && (
              <div className="mb-8">
                <h3 className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#5a4e42] mb-3">
                  Visual Evidence
                </h3>
                <div className="specimen-frame rounded-lg overflow-hidden bg-[#c9b896]">
                  <PhotoGallery photos={place.photos} />
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#5a4e42] mb-3">
                Historical Record
              </h3>
              <p className="text-[#4a3e32] text-sm leading-[1.8]">
                <TypewriterText text={place.history} speed={12} />
              </p>
            </div>

            {place.hauntingReports && place.hauntingReports.length > 0 && (
              <div className="mb-8">
                <h3 className="font-cinzel text-[10px] uppercase tracking-[0.15em] text-[#5a4e42] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7a3a2a]" />
                  Spectral Accounts
                </h3>
                <div className="space-y-3">
                  {place.hauntingReports.map((report: string, i: number) => (
                    <p
                      key={i}
                      className="relative pl-4 text-[#4a3e32] text-sm leading-[1.7] border-l border-[rgba(122,82,72,0.15)]"
                    >
                      <span className="absolute left-0 text-[#9a8a72] font-mono">
                        —
                      </span>
                      <ClassifiedText text={report} />
                    </p>
                  ))}
                </div>
              </div>
            )}

            <MarginaliaComments placeSlug={place.slug} />

            <div className="pt-4 border-t border-[rgba(62,50,40,0.08)] flex items-center justify-between mt-6">
              <span className="font-mono text-[9px] text-[#9a8a72] tracking-[0.2em] uppercase opacity-60">
                Ref. {place.slug?.toUpperCase() || "UNKNOWN"}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < place.dangerLevel
                        ? "bg-[#7a3a2a]"
                        : "border border-[#9a8a72] bg-transparent"
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