'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useBootStore } from '@/state/bootStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography } from '@/styles/theme';

export const SystemPanel: React.FC = () => {
  const { status, ground, restoreStability } = useUIStore();
  const { isComplete } = useBootStore();
  const { click } = useAudioStore();
  const [activeTab, setActiveTab] = useState<'status' | 'commands' | 'logs'>('status');

  const commands = [
    { cmd: 'status', desc: 'Check observer status and dust levels' },
    { cmd: 'ground', desc: 'Perform grounding ritual to reduce dust' },
    { cmd: 'restore', desc: 'Restore observer stability' },
    { cmd: 'dust', desc: 'Check dust index and thresholds' },
    { cmd: 'stability', desc: 'Check observer stability' },
    { cmd: 'guide', desc: 'Open operator briefing' },
    { cmd: 'help', desc: 'List available commands' },
  ];

  const logs = [
    { time: '00:00:00', level: 'INFO', msg: 'Archive node online' },
    { time: '00:00:02', level: 'INFO', msg: 'Temporal sync: nominal' },
    { time: '00:00:04', level: 'INFO', msg: 'Memory integrity: 99%' },
    { time: '00:00:06', level: 'WARN', msg: 'Previous session terminated: 4211 days ago' },
    { time: '00:00:08', level: 'INFO', msg: 'BUNKER_7 core initialized' },
    { time: '00:00:12', level: 'INFO', msg: 'Atlas sector view loaded' },
    { time: '00:00:15', level: 'WARN', msg: 'Dust accumulation in local sector: within tolerance' },
    { time: '00:00:18', msg: 'Investigator authenticated' },
  ];

  const logColor = (level: string) => {
    switch (level) {
      case 'WARN': return colors.archive.amber;
      case 'ERROR': return colors.archive.red;
      case 'ALERT': return colors.archive.redBright;
      default: return colors.archive.green;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="shrink-0 flex border-b" style={{ borderColor: colors.archive.grayDark }}>
        {(['status', 'commands', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { click(); setActiveTab(tab); }}
            className="px-6 py-3 transition-colors"
            style={{
              color: activeTab === tab ? colors.archive.amber : colors.archive.gray,
              fontFamily: typography.mono,
              fontSize: typography.sizes.xs,
              letterSpacing: '0.05em',
              borderBottom: activeTab === tab ? `2px solid ${colors.archive.amber}` : '2px solid transparent',
              textTransform: 'uppercase',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'status' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-xl">
            <div className="p-4 border" style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.surface }}>
              <div style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.1em', marginBottom: '1rem' }}>
                BUNKER_7 SYSTEM STATUS
              </div>
              <div className="space-y-2" style={{ fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
                <div className="flex justify-between">
                  <span style={{ color: colors.archive.gray }}>NODE STATUS</span>
                  <span style={{ color: colors.archive.green }}>ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.archive.gray }}>BOOT SEQUENCE</span>
                  <span style={{ color: isComplete ? colors.archive.green : colors.archive.amber }}>
                    {isComplete ? 'COMPLETE' : 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.archive.gray }}>TEMPORAL SYNC</span>
                  <span style={{ color: colors.archive.green }}>NOMINAL</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.archive.gray }}>MEMORY INTEGRITY</span>
                  <span style={{ color: status.dustIndex > 50 ? colors.archive.amber : colors.archive.green }}>
                    {status.dustIndex > 50 ? 'DEGRADED' : '99%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.archive.gray }}>DUST ACCUMULATION</span>
                  <span style={{ color: status.dustIndex > 25 ? colors.archive.amber : colors.archive.green }}>
                    {status.dustIndex > 50 ? 'ELEVATED' : status.dustIndex > 25 ? 'MODERATE' : 'WITHIN TOLERANCE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.archive.gray }}>ACTIVE ALERTS</span>
                  <span style={{ color: status.activeAlerts > 0 ? colors.archive.red : colors.archive.green }}>
                    {status.activeAlerts}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { click(); ground(); }}
                className="flex-1 py-3 border hover:border-amber-700 transition-colors"
                style={{ borderColor: colors.archive.amber, color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.sm }}
              >
                GROUND
              </button>
              <button
                onClick={() => { click(); restoreStability(); }}
                className="flex-1 py-3 border hover:border-green-700 transition-colors"
                style={{ borderColor: colors.archive.green, color: colors.archive.green, fontFamily: typography.mono, fontSize: typography.sizes.sm }}
              >
                RESTORE STABILITY
              </button>
            </div>

            <div className="p-4 border" style={{ borderColor: colors.archive.blue, backgroundColor: 'rgba(107, 143, 163, 0.05)' }}>
              <div style={{ color: colors.archive.blue, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginBottom: '0.5rem' }}>
                BUNKER_7 MESSAGE
              </div>
              <p style={{ color: colors.archive.blueBright, fontFamily: typography.serif, fontSize: typography.sizes.sm, lineHeight: '1.5' }}>
                {status.dustIndex > 50
                  ? 'Investigator. Your Dust index is elevated. I recommend immediate grounding procedures. The Archive cannot afford to lose another.'
                  : status.dustIndex > 25
                  ? 'Dust levels are moderate. Continue monitoring. Ground yourself between investigations.'
                  : 'All systems nominal. You are safe to proceed with archival work.'}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'commands' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-2">
            <div className="mb-4" style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
              TERMINAL COMMAND REFERENCE
            </div>
            {commands.map((c, i) => (
              <motion.div
                key={c.cmd}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 border"
                style={{ borderColor: colors.archive.grayDark }}
              >
                <span
                  className="px-2 py-0.5 border"
                  style={{ borderColor: colors.archive.amber, color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
                >
                  {c.cmd}
                </span>
                <span style={{ color: colors.archive.grayLight, fontFamily: typography.mono, fontSize: typography.sizes.sm }}>
                  {c.desc}
                </span>
              </motion.div>
            ))}
            <div className="mt-4 p-3 border" style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
              Type these commands into the terminal (press ` or click TERM)
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-1">
            <div className="mb-4" style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
              SYSTEM BOOT LOG
            </div>
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 py-1" style={{ fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                <span style={{ color: colors.archive.gray, minWidth: '5rem' }}>{log.time}</span>
                {'level' in log && (
                  <span style={{ color: logColor(log.level || 'INFO'), minWidth: '3rem' }}>{log.level || 'INFO'}</span>
                )}
                <span style={{ color: colors.archive.grayLight }}>{log.msg}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};