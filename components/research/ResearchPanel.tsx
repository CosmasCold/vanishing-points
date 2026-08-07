'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';
import { colors, typography } from '@/styles/theme';

export const ResearchPanel: React.FC = () => {
  const { status } = useUIStore();

  const dust = status.dustIndex;
  const stability = status.observerStability;

  const dustLevel =
    dust >= DUST_THRESHOLDS.EXTREME ? 'EXTREME' :
    dust >= DUST_THRESHOLDS.HIGH ? 'HIGH' :
    dust >= DUST_THRESHOLDS.MODERATE ? 'MODERATE' :
    dust >= DUST_THRESHOLDS.LOW ? 'LOW' : 'NOMINAL';

  const stabilityLevel =
    stability >= STABILITY_THRESHOLDS.NOMINAL ? 'NOMINAL' :
    stability >= STABILITY_THRESHOLDS.STABLE ? 'STABLE' :
    stability >= STABILITY_THRESHOLDS.DEGRADED ? 'DEGRADED' :
    stability >= STABILITY_THRESHOLDS.CRITICAL ? 'CRITICAL' : 'UNSTABLE';

  const entries = [
    {
      title: 'DUST: RESIDUAL INFORMATIONAL PARTICULATE',
      date: '1983-10-14',
      body: `Dust is not magic. Dust is not corruption. Dust is not radiation. Dust is the physical residue left behind whenever reality rewrites itself.

Imagine reality as countless layers of paper. Every time history changes, one sheet is quietly removed. Tiny fibers remain. Those fibers are Dust.

Nobody notices them. Except investigators.

Observable Properties:
- Almost invisible under normal light
- Glows faintly blue under resonance scanners
- High concentrations distort light, sound, memory, navigation, electronic equipment, film, and human perception
- Measurable but never fully understood`,
    },
    {
      title: 'THE OTHER: PHENOMENON 0',
      date: 'CLASSIFIED',
      body: `No investigator has ever observed The Other directly. No photograph has ever captured it. No recording has ever preserved it.

Official designation: Phenomenon 0
Alias: The Other

Not because it came first. Because every other anomaly eventually leads back to it.

The Other is not evil. It has no known desires. It does not hunt, punish, or tempt. It is a condition of existence. Not an antagonist.

Its effects are terrifying because they are completely indifferent.

The Erosion of Certainty: Around The Other, certainty begins dissolving. People remember different histories. Photographs disagree. Coordinates drift. Buildings become impossible to verify.

The Silence: Wherever The Other has influenced a location, there is always silence. Not the absence of sound. The absence of expectation.`,
    },
    {
      title: 'OBSERVER STABILITY: FIELD GUIDE',
      date: '1991-03-22',
      body: `Dust measures what the investigator can perceive. Observer Stability measures what they can still trust.

High Stability means memories remain reliable. Low Stability introduces doubt — carefully controlled uncertainty.

Managing Dust:
- Review verified evidence
- Listen to authenticated recordings
- Compare documents against preserved originals
- Organize the Archive
- Catalogue discoveries
- Ground yourself often

The game encourages periods of calm between unsettling discoveries. Players are rewarded for being careful archivists, not fearless adventurers.`,
    },
    {
      title: 'WHY INVESTIGATORS DISAPPEAR',
      date: '1978-11-03',
      body: `Investigators rarely die. Instead, their accumulated Dust eventually exceeds what ordinary reality can tolerate.

Some disappear. Some continue existing only inside Archive records. Some become impossible to remember.

The tragedy is that many were extraordinary people. The Archive remembers them when no one else can.

Dust does not make investigators insane. It allows them to perceive more reality than the human mind was designed to process.

Experienced investigators often report:
- Dreams that feel historical rather than personal
- Recognizing buildings they've never visited
- Remembering conversations that officially never occurred
- Feeling nostalgia for places that no longer exist
- Occasionally mourning people they cannot prove ever lived`,
    },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Status summary */}
      <div className="mb-6 p-4 border" style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginBottom: '0.25rem' }}>
              CURRENT DUST INDEX
            </div>
            <div className="flex items-center gap-3">
              <span
                style={{
                  color:
                    dust >= DUST_THRESHOLDS.EXTREME ? colors.archive.red :
                    dust >= DUST_THRESHOLDS.HIGH ? colors.archive.amber :
                    colors.archive.green,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xl,
                }}
              >
                {dust}
              </span>
              <span
                className="px-2 py-0.5 border text-xs"
                style={{
                  borderColor:
                    dust >= DUST_THRESHOLDS.EXTREME ? colors.archive.red :
                    dust >= DUST_THRESHOLDS.HIGH ? colors.archive.amber :
                    colors.archive.green,
                  color:
                    dust >= DUST_THRESHOLDS.EXTREME ? colors.archive.red :
                    dust >= DUST_THRESHOLDS.HIGH ? colors.archive.amber :
                    colors.archive.green,
                  fontFamily: typography.mono,
                }}
              >
                {dustLevel}
              </span>
            </div>
          </div>
          <div>
            <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginBottom: '0.25rem' }}>
              OBSERVER STABILITY
            </div>
            <div className="flex items-center gap-3">
              <span
                style={{
                  color:
                    stability <= STABILITY_THRESHOLDS.CRITICAL ? colors.archive.red :
                    stability <= STABILITY_THRESHOLDS.DEGRADED ? colors.archive.amber :
                    colors.archive.green,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xl,
                }}
              >
                {stability.toFixed(0)}%
              </span>
              <span
                className="px-2 py-0.5 border text-xs"
                style={{
                  borderColor:
                    stability <= STABILITY_THRESHOLDS.CRITICAL ? colors.archive.red :
                    stability <= STABILITY_THRESHOLDS.DEGRADED ? colors.archive.amber :
                    colors.archive.green,
                  color:
                    stability <= STABILITY_THRESHOLDS.CRITICAL ? colors.archive.red :
                    stability <= STABILITY_THRESHOLDS.DEGRADED ? colors.archive.amber :
                    colors.archive.green,
                  fontFamily: typography.mono,
                }}
              >
                {stabilityLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Threshold bars */}
        <div className="mt-4 space-y-2">
          <div>
            <div className="flex justify-between" style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: '0.5rem' }}>
              <span>DUST THRESHOLDS</span>
            </div>
            <div className="flex h-1 mt-1">
              {[
                { label: 'LOW', val: DUST_THRESHOLDS.LOW, color: colors.archive.green },
                { label: 'MOD', val: DUST_THRESHOLDS.MODERATE, color: colors.archive.amber },
                { label: 'HIGH', val: DUST_THRESHOLDS.HIGH, color: colors.archive.redBright },
                { label: 'EXT', val: DUST_THRESHOLDS.EXTREME, color: colors.archive.red },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex-1 flex items-center justify-center"
                  style={{
                    backgroundColor: dust >= t.val ? t.color : colors.archive.grayDark,
                    opacity: dust >= t.val ? 1 : 0.3,
                  }}
                >
                  <span style={{ color: colors.archive.black, fontFamily: typography.mono, fontSize: '0.4rem' }}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Research entries */}
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 border"
            style={{ borderColor: colors.archive.grayDark }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.sm, letterSpacing: '0.05em' }}>
                {entry.title}
              </h3>
              <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                {entry.date}
              </span>
            </div>
            <div
              className="leading-[1.7] space-y-3"
              style={{ color: colors.archive.grayLight, fontFamily: typography.serif, fontSize: typography.sizes.base }}
            >
              {entry.body.split('\n\n').map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};