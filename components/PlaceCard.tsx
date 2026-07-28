"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Place } from "@/types";
import StatusBadge from "./StatusBadge";
import DangerIndicator from "./DangerIndicator";

interface Props {
  place: Place;
  index: number;
}

export default function PlaceCard({ place, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="archive-card rounded-xl overflow-hidden group"
    >
      <Link href={`/place/${place.slug}`} className="block relative z-10">
        <div className="relative h-48 overflow-hidden">
          {place.photos[0] ? (
            <Image
              src={place.photos[0]}
              alt={place.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={index < 3}
            />
          ) : (
            <div className="w-full h-full bg-[rgba(60,40,20,0.1)] flex items-center justify-center">
              <span className="text-[#8b7355] font-mono text-xs">No visual record</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StatusBadge category={place.category} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(42,31,20,0.6)] via-transparent to-transparent opacity-60" />
        </div>

        <div className="p-5">
          <h3 className="archive-title text-lg font-medium group-hover:text-[#1a120b] transition-colors">
            {place.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 archive-meta">
            <MapPin size={11} />
            <span>
              {place.address.city}, {place.address.country}
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(62,43,26,0.12)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#5a4a3a] font-mono">Danger</span>
              <DangerIndicator level={place.dangerLevel} variant="parchment" />
            </div>
            <span className="flex items-center gap-1 text-[#5a4a3a] text-xs font-mono group-hover:text-[#2a1f14] transition-colors">
              Read archives
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}