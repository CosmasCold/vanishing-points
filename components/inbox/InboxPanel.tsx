'use client';

import React from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';

export const InboxPanel: React.FC = () => {
  const { inboxItems, markInboxRead } = useSessionStore();
  const { click } = useAudioStore();

  const handleClick = (id: string) => {
    click();
    markInboxRead(id);
  };

  if (inboxItems.length === 0) {
    return (
      <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
        No messages. Archive queue empty.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inboxItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleClick(item.id)}
          className="p-3 border cursor-pointer transition-colors hover:border-amber-700"
          style={{
            borderColor: item.read ? colors.archive.gray : colors.archive.amber,
            backgroundColor: colors.archive.surface,
            opacity: item.read ? 0.7 : 1,
          }}
        >
          <div className="flex justify-between items-baseline mb-1">
            <span
              style={{
                color:
                  item.type === 'alert'
                    ? colors.archive.red
                    : item.type === 'message'
                    ? colors.archive.blue
                    : item.type === 'system'
                    ? colors.archive.green
                    : colors.archive.white,
                fontSize: typography.sizes.sm,
                fontFamily: typography.mono,
              }}
            >
              {item.read ? '' : '[NEW] '}
              {item.title}
            </span>
            <span style={{ color: colors.archive.gray, fontSize: typography.sizes.xs, fontFamily: typography.mono }}>
              {item.timestamp}
            </span>
          </div>
          <p
            style={{
              color: colors.archive.gray,
              fontSize: typography.sizes.sm,
              lineHeight: '1.5',
              fontFamily: typography.serif,
            }}
          >
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
};