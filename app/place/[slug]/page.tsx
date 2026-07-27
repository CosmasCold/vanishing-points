import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Eye, User } from "lucide-react";
import { PlaceModel } from "@/lib/db";
import dbConnect from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import DangerIndicator from "@/components/DangerIndicator";
import PhotoGallery from "@/components/PhotoGallery";
import { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await dbConnect();
  const place = await PlaceModel.findOne({ slug: params.slug, status: "verified" }).lean();

  if (!place) {
    return { title: "Not Found | Vanishing Points" };
  }

  return {
    title: `${(place as any).name} | Vanishing Points`,
    description: (place as any).history?.slice(0, 160),
    openGraph: {
      title: (place as any).name,
      description: (place as any).history?.slice(0, 160),
      images: (place as any).photos?.[0] ? [(place as any).photos[0]] : [],
    },
  };
}

export default async function PlacePage({ params }: Props) {
  await dbConnect();
  const place = await PlaceModel.findOneAndUpdate(
    { slug: params.slug, status: "verified" },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).lean();

  if (!place) {
    notFound();
  }

  const p = place as any;

  return (
    <main className="min-h-screen bg-void">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ash hover:text-bone transition-colors text-sm font-mono mb-8"
        >
          <ArrowLeft size={14} />
          Return to atlas
        </Link>

        <StatusBadge category={p.category} />
        <h1 className="font-cinzel text-4xl md:text-5xl font-medium text-bone mt-4 leading-tight">
          {p.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-ash font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} />
            {p.address.city}, {p.address.country}
          </span>
          {p.yearAbandoned && (
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              Abandoned {p.yearAbandoned}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <AlertTriangle size={12} />
            Danger: <DangerIndicator level={p.dangerLevel} />
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={12} />
            {p.viewCount.toLocaleString()} views
          </span>
        </div>

        {p.photos?.length > 0 && (
          <div className="mt-8">
            <PhotoGallery photos={p.photos} />
          </div>
        )}

        <section className="mt-10">
          <h2 className="font-cinzel text-sm uppercase tracking-widest text-ash mb-4">
            The archives
          </h2>
          <div className="text-bone/80 text-[16px] leading-[1.8] whitespace-pre-line">
            {p.history}
          </div>
        </section>

        {p.hauntingReports?.length > 0 && (
          <section className="mt-10">
            <h2 className="font-cinzel text-sm uppercase tracking-widest text-ash mb-4">
              Spectral accounts
            </h2>
            <ul className="space-y-3">
              {p.hauntingReports.map((report: string, i: number) => (
                <li
                  key={i}
                  className="text-bone/70 text-[15px] leading-relaxed pl-5 border-l-2 border-specter/30"
                >
                  {report}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 pt-6 border-t border-fog/30">
          <div className="font-mono text-[10px] text-ash/40 tracking-wider">
            {p.coordinates[1].toFixed(6)}, {p.coordinates[0].toFixed(6)}
          </div>
          <div className="flex items-center gap-2 mt-3 text-ash/60 font-mono text-[11px]">
            <User size={11} />
            <span>
              Discovered by {p.contributor.name} on{" "}
              {new Date(p.submittedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}