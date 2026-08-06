'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '@/types/investigation';
import { colors, typography } from '@/styles/theme';

interface TimelineViewProps {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
        No timeline events recorded.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-0">
      {events.map((event, index) => {
        const certaintyColor =
          event.certainty === 'confirmed' ? colors.archive.green :
          event.certainty === 'suspected' ? colors.archive.amber :
          colors.archive.blue;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="flex gap-4 py-3 border-b"
            style={{ borderColor: colors.archive.gray }}
          >
            {/* Date column */}
            <div className="w-32 shrink-0 pt-1">
              <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                {event.date}
              </div>
              <div
                className="mt-1 px-1.5 py-0.5 inline-block border text-xs"
                style={{
                  borderColor: certaintyColor,
                  color: certaintyColor,
                  fontFamily: typography.mono,
                  fontSize: '0.625rem',
                }}
              >
                {event.certainty.toUpperCase()}
              </div>
            </div>

            {/* Content column */}
            <div className="flex-1">
              <div
                style={{
                  color: colors.archive.white,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.sm,
                  marginBottom: '0.25rem',
                }}
              >
                {event.title}
              </div>
              <p
                style={{
                  color: colors.archive.gray,
                  fontFamily: typography.serif,
                  fontSize: typography.sizes.xs,
                  lineHeight: '1.5',
                }}
              >
                {event.description}
              </p>
              {event.evidenceIds.length > 0 && (
                <div
                  className="mt-2"
                  style={{
                    color: colors.archive.amber,
                    fontSize: '0.625rem',
                    fontFamily: typography.mono,
                  }}
                >
                  LINKED EVIDENCE: {event.evidenceIds.length}
                </div>
              )}
            </div>

            {/* Category indicator */}
            <div className="w-1 shrink-0" style={{ backgroundColor: certaintyColor, opacity: 0.6 }} />
          </motion.div>
        );
      })}
    </div>
  );
};