'use client';

import React from 'react';
import { TimelineEvent } from '@/types/investigation';
import { colors, typography } from '@/styles/theme';

interface TimelineViewProps {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" style={{ fontFamily: typography.mono }}>
        <div style={{ color: colors.archive.gray }}>NO TIMELINE EVENTS RECORDED</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-0">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: 
                  event.certainty === 'confirmed' ? colors.archive.green :
                  event.certainty === 'uncertain' ? colors.archive.amber :
                  colors.archive.blue,
              }}
            />
            {index < events.length - 1 && (
              <div className="w-px flex-1 my-1" style={{ backgroundColor: colors.archive.gray }} />
            )}
          </div>
          <div className="pb-6 flex-1">
            <div className="flex items-baseline gap-3 mb-1">
              <span style={{ color: colors.archive.amber, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
                {event.date}
              </span>
              <span 
                className="px-1.5 py-0.5 text-xs border"
                style={{ 
                  color: 
                    event.category === 'anomaly' ? colors.archive.red :
                    event.category === 'discovery' ? colors.archive.green :
                    colors.archive.gray,
                  borderColor: 
                    event.category === 'anomaly' ? colors.archive.red :
                    event.category === 'discovery' ? colors.archive.green :
                    colors.archive.gray,
                  fontFamily: typography.mono,
                }}
              >
                {event.category.toUpperCase()}
              </span>
            </div>
            <div style={{ color: colors.archive.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium }}>
              {event.title}
            </div>
            <p style={{ color: colors.archive.grayLight, fontSize: typography.sizes.sm, marginTop: '0.25rem', lineHeight: '1.5' }}>
              {event.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};