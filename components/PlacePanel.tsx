"use client";

import { motion } from "framer-motion";
import { X, MapPin, Calendar, AlertTriangle, Eye, User } from "lucide-react";
import { Place } from "@/types";
import StatusBadge from "./StatusBadge";
import DangerIndicator from "./DangerIndicator";
import PhotoGallery from "./PhotoGallery";

interface Props {
  place: Place;
  onClose: () => void;
}

export default function PlacePanel({ place, onClose }: Props) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-0 right-0 h-full w-full max-w-lg bg-shadow/95 backdrop-blur-md border-l border-fog/40 z-50 overflow-y-auto"
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-fog/30 text-ash hover:text-bone hover:bg-fog/50 transition-all duration-200"
        aria-label="Close panel"
      >
        <X size={16} />
      </button>

      <div className="p-8 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatusBadge category={place.category} />
          <h2 className="font-cinzel text-2xl md:text-3xl font-medium text-bone mt-3 leading-tight">
            {place.name}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-ash font-mono text-xs">
            <MapPin size={12} />
            <span>
              {place.address.city}, {place.address.country}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-4 mt-6 py-4 border-y border-fog/30"
        >
          {place.yearAbandoned && (
            <div className="flex items-center gap-1.5 text-ash font-mono text-xs">
              <Calendar size={12} />
              <span>Abandoned {place.yearAbandoned}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-ash font-mono text-xs">
            <AlertTriangle size={12} />
            <span>
              Danger: <DangerIndicator level={place.dangerLevel} />
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-ash font-mono text-xs">
            <Eye size={12} />
            <span>{place.viewCount.toLocaleString()} views</span>
          </div>
        </motion.div>

        {place.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <PhotoGallery photos={place.photos} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h3 className="font-cinzel text-sm font-medium text-ash uppercase tracking-widest mb-3">
            The archives
          </h3>
          <div className="text-bone/80 text-[15px] leading-relaxed whitespace-pre-line">
            {place.history}
          </div>
        </motion.div>

        {place.hauntingReports && place.hauntingReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <h3 className="font-cinzel text-sm font-medium text-ash uppercase tracking-widest mb-3">
              Spectral accounts
            </h3>
            <ul className="space-y-2">
              {place.hauntingReports.map((report, i) => (
                <li
                  key={i}
                  className="text-bone/70 text-sm leading-relaxed pl-4 border-l-2 border-specter/30"
                >
                  {report}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 pt-4 border-t border-fog/30"
        >
          <div className="font-mono text-[10px] text-ash/50 tracking-wider">
            {place.coordinates[1].toFixed(6)}, {place.coordinates[0].toFixed(6)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-4 flex items-center gap-2 text-ash/60 font-mono text-[11px]"
        >
          <User size={11} />
          <span>
            Discovered by {place.contributor.name} on{" "}
            {new Date(place.submittedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}