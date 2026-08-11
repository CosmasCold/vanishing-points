'use client';

import React from 'react';
import { Place } from '@/types/places';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, microform } from '@/styles/theme';
import { 
  MapPin, 
  Clock, 
  Skull, 
  Eye, 
  Compass, 
  Activity, 
  ShieldAlert, 
  Sparkles,
  Database
} from 'lucide-react';

interface PlaceDetailProps {
  place: Place;
}

export const PlaceDetail: React.FC<PlaceDetailProps> = ({ place }) => {
  const { click } = useAudioStore();

  const getStatusStyle = (status: Place['status']) => {
    switch (status) {
      case 'sealed':
        return { color: colors.archive.red, border: `1px solid ${colors.archive.red}`, bg: 'rgba(168, 93, 93, 0.08)' };
      case 'whispered':
        return { color: colors.archive.blue, border: `1px solid ${colors.archive.blue}`, bg: 'rgba(99, 102, 241, 0.08)' };
      case 'mirage':
        return { color: '#bf9f62', border: '1px solid #bf9f62', bg: 'rgba(191, 159, 98, 0.08)' };
      default:
        return { color: colors.archive.green, border: `1px solid ${colors.archive.green}`, bg: 'rgba(122, 158, 122, 0.08)' };
    }
  };

  const statusStyle = getStatusStyle(place.status);

  return (
    <div className="flex flex-col gap-5 p-4 font-mono text-xs select-none">
      {/* Title Block */}
      <div className="border-b pb-3" style={{ borderColor: colors.archive.grayDark || '#2d2924' }}>
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <span className="text-[8.5px] uppercase tracking-widest text-[#bf9f62] font-bold">
              GEODETIC REGISTRY ENTRY // ACT_IV
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              {place.name}
            </h2>
          </div>
          <span
            className="px-1.5 py-0.5 text-[8.5px] font-bold scale-90 shrink-0"
            style={{
              color: statusStyle.color,
              borderColor: statusStyle.color,
              border: statusStyle.border,
              backgroundColor: statusStyle.bg,
            }}
          >
            {place.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Geodetic Coordinates Bar */}
      <div 
        className="p-3 border rounded-[1px] flex justify-between items-center bg-[#070503]"
        style={{ borderColor: 'rgba(26, 17, 10, 0.4)' }}
      >
        <div className="flex items-center gap-2">
          <Compass size={13} style={{ color: colors.archive.amber }} className="animate-spin-slow" />
          <div className="flex flex-col">
            <span className="text-[7.5px] text-stone-500 uppercase tracking-widest">COORDINATE CENTROID</span>
            <span style={{ color: microform.halogen }} className="text-[10px] font-bold">
              {place.coordinates ? `${place.coordinates[1].toFixed(4)}°N, ${place.coordinates[0].toFixed(4)}°W` : 'DRIFTING INDEX'}
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[7.5px] text-stone-500 uppercase tracking-widest">DANGER LEVEL</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
            <Skull size={10} /> D{place.dangerLevel || 1}
          </span>
        </div>
      </div>

      {/* Narrative History */}
      <div className="space-y-2">
        <span className="text-[8px] uppercase tracking-widest text-stone-500 block">
          ARCHIVAL TIMELINE & RECONSTRUCTION
        </span>
        <p 
          className="text-[11.5px] leading-relaxed select-text"
          style={{ 
            color: colors.archive.grayLight,
            fontFamily: typography.serif || 'Georgia, serif'
          }}
        >
          {place.history}
        </p>
      </div>

      {/* Photo Attachment (If Available) */}
      {place.photos && place.photos.length > 0 && (
        <div className="space-y-2">
          <span className="text-[8px] uppercase tracking-widest text-stone-500 block">
            ATTACHED SILVER NITRATE CAPTURE
          </span>
          <div className="relative border p-1 bg-[#090807] overflow-hidden" style={{ borderColor: colors.archive.grayDark || '#2d2924' }}>
            {/* Holographic light scanlines overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent pointer-events-none opacity-30 animate-pulse" />
            <img 
              src={place.photos[0]} 
              alt={place.name}
              className="w-full aspect-video object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300 rounded-[1px]"
            />
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 border border-stone-800 text-[7.5px] text-stone-400">
              FRAME // REF_00{Math.floor(Math.random() * 90) + 10}
            </div>
          </div>
        </div>
      )}

      {/* Haunting Reports & Anomalous Telementry */}
      {place.hauntingReports && place.hauntingReports.length > 0 && (
        <div className="space-y-2">
          <span className="text-[8px] uppercase tracking-widest text-stone-500 block">
            CONCURRENCY ANOMALY TELEMENTRY
          </span>
          <div className="space-y-2">
            {place.hauntingReports.map((report, idx) => (
              <div 
                key={idx}
                className="p-2.5 border rounded-[1px] bg-[#050403]/80 border-[#2d1b15]/30 text-stone-400 text-[10px] leading-relaxed flex gap-2"
              >
                <ShieldAlert size={12} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="select-text" style={{ fontFamily: typography.mono }}>{report}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solstice Resonance Note */}
      {place.resonanceNote && (
        <div className="space-y-2">
          <span className="text-[8px] uppercase tracking-widest text-stone-500 block">
            RECONSTRUCTED NOTES IN THE MARGIN
          </span>
          <div 
            className="p-3 border rounded-[1px] text-[10px] bg-amber-950/5 text-[#bf9f62] border-amber-900/20 leading-relaxed relative overflow-hidden flex gap-2"
          >
            <div className="absolute top-0 right-0 w-8 h-8 opacity-10 pointer-events-none transform translate-x-2 -translate-y-2">
              <Sparkles size={32} />
            </div>
            <Activity size={12} className="shrink-0 mt-0.5 animate-pulse text-[#bf9f62]" />
            <p className="italic select-text" style={{ fontFamily: typography.mono }}>
              "{place.resonanceNote}"
            </p>
          </div>
        </div>
      )}

      {/* Technical Specifications Footnote */}
      <div 
        className="pt-3 border-t flex justify-between items-center text-[7.5px] text-stone-500"
        style={{ borderColor: colors.archive.grayDark || '#2d2924' }}
      >
        <span className="flex items-center gap-1">
          <Database size={8} />
          REG_STAMP: {place.yearAbandoned ? `Y_${place.yearAbandoned}` : 'LOST_CYCLE'}
        </span>
        <span>
          MDL_7B // RECONSTRUCTED
        </span>
      </div>
    </div>
  );
};

export default PlaceDetail;
