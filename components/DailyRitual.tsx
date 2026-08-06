'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/state/sessionStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing } from '@/styles/theme';

const SYNC_LINES = [
  'Connecting to remote nodes...',
  'Verifying local cache integrity...',
  'Checking Atlas drift...',
  'Scanning for new evidence submissions...',
  'Processing signal intercepts...',
  'Updating personnel records...',
  'Archive synchronized.',
];

export const DailyRitual: React.FC = () => {
  const { inboxItems, ritualComplete, completeRitual, initializeSession } = useSessionStore();
  const { booted } = useUIStore();
  const { click } = useAudioStore();
  const [syncIndex, setSyncIndex] = useState(0);
  const [syncDone, setSyncDone] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  // Initialize on first boot
  useEffect(() => {
    if (booted && !ritualComplete) {
      initializeSession();
    }
  }, [booted, ritualComplete, initializeSession]);

  // Sync animation
  useEffect(() => {
    if (!booted || ritualComplete) return;
    if (syncIndex >= SYNC_LINES.length) {
      setSyncDone(true);
      setTimeout(() => setShowInbox(true), 400);
      return;
    }

    const delay = syncIndex === 0 ? 600 : Math.random() * 400 + 200;
    const timer = setTimeout(() => setSyncIndex((i) => i + 1), delay);
    return () => clearTimeout(timer);
  }, [booted, ritualComplete, syncIndex]);

  const handleBegin = () => {
    click();
    completeRitual();
  };

  if (ritualComplete || !booted) return null;

  const unreadCount = inboxItems.filter((i) => !i.read).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{
        marginLeft: spacing.rail,
        marginBottom: spacing.statusBar,
        backgroundColor: 'rgba(26, 26, 24, 0.97)',
      }}
    >
      <div className="w-full max-w-xl px-8">
        {/* Sync sequence */}
        <AnimatePresence>
          {!syncDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
              style={{ fontFamily: typography.mono, fontSize: typography.sizes.sm }}
            >
              {SYNC_LINES.slice(0, syncIndex).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    color:
                      i === syncIndex - 1 && line === 'Archive synchronized.'
                        ? colors.archive.green
                        : colors.archive.gray,
                  }}
                >
                  <span style={{ color: colors.archive.amber }}>&gt;</span> {line}
                </motion.div>
              ))}
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ color: colors.archive.amber }}
              >
                _
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inbox preview */}
        <AnimatePresence>
          {showInbox && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div
                style={{
                  color: colors.archive.green,
                  fontFamily: typography.mono,
                  fontSize: typography.sizes.xs,
                  letterSpacing: '0.1em',
                }}
              >
                ARCHIVE SYNCHRONIZED — {new Date().toLocaleDateString()}
              </div>

              <div className="space-y-3">
                <div
                  style={{
                    color: colors.archive.amber,
                    fontFamily: typography.mono,
                    fontSize: typography.sizes.xs,
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                  }}
                >
                  INBOX — {unreadCount} NEW
                </div>

                {inboxItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border"
                    style={{
                      borderColor: colors.archive.gray,
                      backgroundColor: colors.archive.surface,
                      opacity: item.read ? 0.6 : 1,
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
                              : colors.archive.white,
                          fontSize: typography.sizes.sm,
                          fontFamily: typography.mono,
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          color: colors.archive.gray,
                          fontSize: typography.sizes.xs,
                          fontFamily: typography.mono,
                        }}
                      >
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

                {inboxItems.length > 4 && (
                  <div
                    style={{
                      color: colors.archive.gray,
                      fontSize: typography.sizes.xs,
                      fontFamily: typography.mono,
                    }}
                  >
                    ...{inboxItems.length - 4} additional items
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleBegin}
                  className="px-8 py-3 border transition-colors hover:border-amber-700"
                  style={{
                    borderColor: colors.archive.amber,
                    color: colors.archive.amber,
                    fontFamily: typography.mono,
                    fontSize: typography.sizes.sm,
                    letterSpacing: '0.1em',
                  }}
                >
                  BEGIN WORK
                </button>
              </div>

              <div
                className="text-center"
                style={{
                  color: colors.archive.gray,
                  fontSize: typography.sizes.xs,
                  fontFamily: typography.mono,
                }}
              >
                What needs remembering today?
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};