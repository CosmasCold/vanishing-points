// components/PlacePanel.tsx
'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Unlock,
  Flame,
  Skull,
  Wind,
  MapPin,
  ChevronRight,
  Radio,
  Shield,
  AlertTriangle,
  FileText,
  Eye,
} from 'lucide-react';
import { type Place } from '@/logic/gameState';

import { redact } from '@/utilities/redact';
import { usePlaceProgression } from '@/hooks/usePlaceProgression';
import { usePlaceDossier } from '@/hooks/usePlaceDossier';
import { useExpeditionGating } from '@/hooks/useExpeditionGating';
import { getExpedition } from '@/lib/expeditions';
import ExpeditionModal from './ExpeditionModal';

interface Props {
  place: Place;
  onClose: () => void;
}

export default function PlacePanel({ place, onClose }: Props) {
  const {
    tier,
    unlockedReports,
    isExpeditionComplete,
    completeExpedition,
    sealRecord,
  } = usePlaceProgression(place._id || place.slug, place.name, place.slug);

  const { dossier, isUnlocked: dossierUnlocked } = usePlaceDossier(place.slug);
  const { isOpen: expeditionOpen, openExpedition, closeExpedition } = useExpeditionGating();

  const expedition = useMemo(() => getExpedition(place), [place]);

  const summary =
    place.history?.split('. ').slice(0, 2).join('. ') + '.' ||
    'No summary available.';

  const hasSignalDossier = !!dossier;

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[28rem] flex flex-col border-l"
        style={{
          background: '#0c0a08',
          borderColor: 'rgba(154,138,114,0.15)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden w-full flex justify-center pt-2 pb-1">
          <div
            className="w-8 h-1 rounded-full"
            style={{ background: 'rgba(221,208,188,0.15)' }}
          />
        </div>

        {/* Header Image */}
        <div className="relative h-40 md:h-48 flex-shrink-0">
          {place.photos?.[0] ? (
            <img
              src={place.photos[0]}
              alt={place.name}
              className="w-full h-full object-cover"
              style={{ opacity: 0.8 }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'rgba(20,16,12,0.8)' }}
            >
              <span className="font-mono text-xs" style={{ color: '#9a8a72' }}>
                No visual record
              </span>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, #0c0a08, rgba(12,10,8,0.4), transparent)',
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-95 border"
            style={{
              background: 'rgba(12,10,8,0.5)',
              borderColor: 'rgba(221,208,188,0.08)',
              color: 'rgba(221,208,188,0.6)',
            }}
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2
              className="font-cinzel text-lg md:text-xl leading-tight"
              style={{ color: '#ddd0bc' }}
            >
              {place.name}
            </h2>
            <p
              className="text-[10px] font-mono uppercase tracking-wider mt-1"
              style={{ color: '#9a8a72' }}
            >
              {place.address.city}, {place.address.country}
            </p>
          </div>
        </div>

        {/* Tier Bar */}
        <div
          className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b"
          style={{ borderColor: 'rgba(154,138,114,0.08)' }}
        >
          {(['surface', 'surveyed', 'documented', 'sealed'] as const).map(
            (t, i) => {
              const active = tier === t;
              const unlocked =
                t === 'surface' ||
                (t === 'surveyed' && tier !== 'surface') ||
                (t === 'documented' &&
                  (tier === 'documented' || tier === 'sealed')) ||
                (t === 'sealed' && tier === 'sealed');

              return (
                <div key={t} className="flex items-center gap-2 shrink-0">
                  {i > 0 && (
                    <ChevronRight
                      size={10}
                      className="shrink-0"
                      style={{ color: 'rgba(154,138,114,0.2)' }}
                    />
                  )}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors"
                    style={{
                      borderColor: active
                        ? 'rgba(154,138,114,0.3)'
                        : unlocked
                        ? 'rgba(154,138,114,0.12)'
                        : 'rgba(221,208,188,0.04)',
                      color: active
                        ? '#ddd0bc'
                        : unlocked
                        ? 'rgba(154,138,114,0.5)'
                        : 'rgba(221,208,188,0.12)',
                      background: active
                        ? 'rgba(154,138,114,0.08)'
                        : 'transparent',
                    }}
                  >
                    {unlocked ? (
                      active ? (
                        <Eye size={10} />
                      ) : (
                        <Unlock size={10} />
                      )
                    ) : (
                      <Lock size={10} />
                    )}
                    {t}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* ── Surface tier ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={12} style={{ color: '#9a8a72' }} />
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: '#9a8a72' }}
              >
                Surface Scan
              </span>
            </div>
            <p
              className="text-sm leading-relaxed font-light"
              style={{ color: '#b8a99a' }}
            >
              {summary}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono border"
                style={{
                  borderColor: 'rgba(154,138,114,0.15)',
                  color: 'rgba(154,138,114,0.5)',
                }}
              >
                {place.category}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1"
                style={{
                  borderColor: 'rgba(196,120,90,0.15)',
                  color: 'rgba(196,120,90,0.5)',
                }}
              >
                <AlertTriangle size={9} />
                Danger {place.dangerLevel}/5
              </span>
              {place.coordinates && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono border"
                  style={{
                    borderColor: 'rgba(221,208,188,0.06)',
                    color: 'rgba(221,208,188,0.15)',
                  }}
                >
                  {place.coordinates[0].toFixed(4)},{' '}
                  {place.coordinates[1].toFixed(4)}
                </span>
              )}
            </div>
          </section>

          {/* ── Surveyed tier ── */}
          <AnimatePresence>
            {(tier === 'surveyed' ||
              tier === 'documented' ||
              tier === 'sealed') && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wind size={12} style={{ color: '#9a8a72' }} />
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: '#9a8a72' }}
                  >
                    Surveyed Depth
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed font-light"
                  style={{ color: 'rgba(184,169,154,0.8)' }}
                >
                  {place.history}
                </p>

                {/* Haunting reports */}
                {place.hauntingReports && place.hauntingReports.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skull
                        size={12}
                        style={{ color: 'rgba(196,120,90,0.4)' }}
                      />
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: 'rgba(196,120,90,0.4)' }}
                      >
                        Haunting Reports ({place.hauntingReports.length})
                      </span>
                    </div>
                    {place.hauntingReports.map((report, idx) => {
                      const isUnlocked = unlockedReports.includes(idx);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded border text-xs leading-relaxed"
                          style={{
                            borderColor: isUnlocked
                              ? 'rgba(154,138,114,0.12)'
                              : 'rgba(221,208,188,0.04)',
                            background: isUnlocked
                              ? 'rgba(154,138,114,0.03)'
                              : 'rgba(221,208,188,0.01)',
                            color: isUnlocked
                              ? '#b8a99a'
                              : 'rgba(221,208,188,0.1)',
                          }}
                        >
                          {isUnlocked ? (
                            <>
                              <span
                                className="text-[10px] font-mono block mb-1"
                                style={{ color: 'rgba(154,138,114,0.3)' }}
                              >
                                REPORT #{String(idx + 1).padStart(2, '0')}
                              </span>
                              {report}
                            </>
                          ) : (
                            <span className="font-mono">{redact(report)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expedition button */}
                {expedition && tier !== 'documented' && tier !== 'sealed' && (
                  <button
                    onClick={() => openExpedition(10)}
                    className="w-full mt-4 py-3 px-4 rounded border text-xs font-mono uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      color: '#ddd0bc',
                      borderColor: 'rgba(154,138,114,0.2)',
                      background: 'rgba(154,138,114,0.06)',
                    }}
                  >
                    <Flame size={14} />
                    Begin Expedition
                  </button>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Documented tier ── */}
          <AnimatePresence>
            {(tier === 'documented' || tier === 'sealed') && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <FileText size={12} style={{ color: '#9a8a72' }} />
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: '#9a8a72' }}
                  >
                    Documented Evidence
                  </span>
                </div>

                {/* Signal dossier */}
                {hasSignalDossier && dossierUnlocked && dossier && (
                  <div
                    className="p-3 rounded border"
                    style={{
                      borderColor: 'rgba(196,120,90,0.12)',
                      background: 'rgba(196,120,90,0.03)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Radio
                        size={12}
                        style={{ color: 'rgba(196,120,90,0.5)' }}
                      />
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: 'rgba(196,120,90,0.5)' }}
                      >
                        {dossier.title}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed font-mono"
                      style={{ color: 'rgba(221,208,188,0.5)' }}
                    >
                      {dossier.text}
                    </p>
                  </div>
                )}

                {/* Signal not yet decoded */}
                {dossier && !dossierUnlocked && (
                  <div
                    className="p-3 rounded border"
                    style={{
                      borderColor: 'rgba(221,208,188,0.04)',
                      background: 'rgba(221,208,188,0.01)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lock
                        size={12}
                        style={{ color: 'rgba(221,208,188,0.1)' }}
                      />
                      <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: 'rgba(221,208,188,0.1)' }}
                      >
                        Encrypted Dossier
                      </span>
                    </div>
                    <p
                      className="text-xs font-mono"
                      style={{ color: 'rgba(221,208,188,0.06)' }}
                    >
                      {redact(
                        'Awaiting signal authentication. Tune to the frequency associated with this location.'
                      )}
                    </p>
                  </div>
                )}

                {/* Seal button */}
                {tier !== 'sealed' && (
                  <button
                    onClick={sealRecord}
                    className="w-full py-3 px-4 rounded border text-xs font-mono uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      color: 'rgba(122,154,106,0.7)',
                      borderColor: 'rgba(122,154,106,0.15)',
                      background: 'rgba(122,154,106,0.04)',
                    }}
                  >
                    <Shield size={14} />
                    Seal Record
                  </button>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Sealed tier ── */}
          <AnimatePresence>
            {tier === 'sealed' && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 rounded border"
                style={{
                  borderColor: 'rgba(122,154,106,0.1)',
                  background: 'rgba(122,154,106,0.02)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield
                    size={14}
                    style={{ color: 'rgba(122,154,106,0.4)' }}
                  />
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: 'rgba(122,154,106,0.4)' }}
                  >
                    Record Sealed
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'rgba(122,154,106,0.25)' }}
                >
                  This location has been sealed by BUNKER_7 protocol. All
                  anomalous activity has been contained. The archive considers
                  this file closed.
                </p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Expedition Modal */}
      {expedition && (
        <ExpeditionModal
          isOpen={expeditionOpen}
          onClose={closeExpedition}
          place={place}
          expedition={expedition}
          onComplete={completeExpedition}
        />
      )}
    </>
  );
}