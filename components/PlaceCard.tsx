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
      className="group bg-shadow border border-fog/40 rounded-xl overflow-hidden hover:border-ash/30 transition-all duration-300 hover:shadow-lg hover:shadow-void/50"
    >
      <Link href={`/place/${place.slug}`} className="block">
        <div className="relative h-48 overflow-hidden">
          {place.photos[0] ? (
            <Image
              src={place.photos[0]}
              alt={place.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-fog/30 flex items-center justify-center">
              <span className="text-ash font-mono text-xs">No visual record</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StatusBadge category={place.category} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-shadow via-transparent to-transparent opacity-60" />
        </div>

        <div className="p-5">
          <h3 className="font-cinzel text-lg font-medium text-bone group-hover:text-bone/90 transition-colors">
            {place.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-ash font-mono text-xs">
            <MapPin size={11} />
            <span>
              {place.address.city}, {place.address.country}
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-fog/30">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ash font-mono">Danger</span>
              <DangerIndicator level={place.dangerLevel} />
            </div>
            <span className="flex items-center gap-1 text-ash text-xs font-mono group-hover:text-bone transition-colors">
              Read archives
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}