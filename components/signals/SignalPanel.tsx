'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { useMediaStore } from '@/state/mediaStore';
import { colors, typography } from '@/styles/theme';

interface SignalArtifact {
  id: string;
  title: string;
  source: string;
  length: string;
  dustUnlock: number;
  description: string;
  transcript: string[];
}

const ARTIFACTS: SignalArtifact[] = [
  {
    id: 'blackwood-ambience',
    title: 'Site Ambience Recording',
    source: 'Field Kit Mk.IV — Blackwood Hospital',
    length: '1:42',
    dustUnlock: 0,
    description: 'Primary survey of Ward 4. Investigator detects anomalous frequency.',
    transcript: [
      '[00:00] Wind against broken glass. Distant structural creaking.',
      '[00:12] INVESTIGATOR: Blackwood Hospital. Ward 4. Primary survey. No structural compromise.',
      '[00:34] [A low hum begins. Not mechanical.]',
      '[00:41] INVESTIGATOR: ...There\'s a frequency here. Not on the recorder. In the room.',
      '[01:02] [The hum resolves into a brief, clear tone. Then silence.]',
      '[01:08] INVESTIGATOR: I\'m logging it as environmental resonance. Not anomalous. Probably ventilation... Probably.',
    ],
  },
  {
    id: 'bunker7-boot',
    title: 'System Initialization Log',
    source: 'BUNKER_7 Core',
    length: '0:45',
    dustUnlock: 0,
    description: 'First login sequence. Four thousand two hundred and eleven days since last session.',
    transcript: [
      '[00:00] [Mechanical relay click. Soft tape hiss.]',
      'BUNKER_7: Archive node online. Temporal sync: nominal. Memory integrity: ninety-nine percent.',
      '[00:18] [Brief pause. A fan spins up.]',
      'BUNKER_7: Previous session terminated: four thousand, two hundred and eleven days ago. Welcome, investigator. The work has been waiting.',
    ],
  },
  {
    id: 'vance-lighthouse',
    title: 'Cassette: Keeper\'s Final Log',
    source: 'E. Vance, Lighthouse Service (Ret.) — St. Elmo Light',
    length: '2:15',
    dustUnlock: 12,
    description: 'Forty years keeping the light. Then the lamp began lighting itself.',
    transcript: [
      '[00:00] [Ocean. Wind. A kettle whistling.]',
      'VANCE: Testing. This is Edward Vance, St. Elmo Light. Date is... well, the calendar says March, but the gulls haven\'t left yet.',
      '[00:22] [He chuckles. Paper rustles.]',
      'VANCE: Forty years I kept this light. Never missed a night. Then last Tuesday, I woke up and the lamp was already lit.',
      '[00:52] [Pause. He sips something.]',
      'VANCE: I know what you\'re thinking. Old man, bad memory. But I remember every ship that passed. I do not remember lighting that lamp.',
      '[01:28] [Wind increases. A door latch rattles.]',
      'VANCE: The light\'s doing its job without me now. I think maybe it always was.',
      '[02:00] [He sets down the cup.]',
      'VANCE: If someone finds this—tell them the light still works. That\'s all. That\'s enough.',
    ],
  },
  {
    id: 'numbers-station-7',
    title: 'Intercept: Unregistered Broadcast',
    source: 'Signal Analysis Division — Channel 7',
    length: '1:30 (looping)',
    dustUnlock: 20,
    description: 'Shortwave numbers station quoting Edward Vance\'s final words.',
    transcript: [
      '[00:00] [Shortwave static. A carrier tone.]',
      'VOICE: Seven. Fourteen. Zero. St. Elmo. Meridian. Blackwood.',
      '[00:08] [Tone changes pitch, slightly wrong.]',
      'VOICE: Seven. Fourteen. Zero. Pripyat. Duga. Chernobyl.',
      '[00:16] [Static swallows the last name.]',
      'VOICE: Seven. Fourteen. Zero. ...The light still works.',
      '[00:28] [Carrier drops. Dead air.]',
    ],
  },
  {
    id: 'meridian-dictaphone',
    title: 'Recovered Dictaphone Tape',
    source: 'Unidentified — Meridian Mine',
    length: '1:58',
    dustUnlock: 28,
    description: 'Engineering student records final message before tunnel takes her. Name lost to magnetic flutter.',
    transcript: [
      '[00:00] [Heavy breathing. Walking fast through gravel.]',
      'WOMAN: I am leaving this at the entrance. If the mine is still here when you find it, then I failed.',
      '[00:18] [Echo changes—she\'s in a large space.]',
      'WOMAN: The maps are wrong. Not outdated. Wrong. The east tunnel doesn\'t exist on any survey. But I\'ve walked it. Three times. It gets longer each time.',
      '[00:42] [A distant sound. Like water dripping upward.]',
      'WOMAN: The other workers don\'t remember the tunnel. I asked the foreman. He said "what tunnel?" and his eyes were... empty.',
      '[01:12] [Gravel crunch.]',
      'WOMAN: I am going back in to mark the walls. If you find this and the walls are unmarked, then the tunnel took me. Please remember that I was here. My name is—',
      '[01:38] [Tape degrades. Name lost.]',
      'WOMAN (distant): —the work has been waiting.',
    ],
  },
  {
    id: 'bunker7-diagnostic',
    title: 'System Diagnostic: Anomalous',
    source: 'BUNKER_7 Core',
    length: '1:10',
    dustUnlock: 35,
    description: 'BUNKER_7 experiencing data fragmentation. Asks investigator to verify their own name.',
    transcript: [
      '[00:00] [Longer pause than usual. Fan stutters.]',
      'BUNKER_7: Archive node... online. Temporal sync: nominal.',
      '[00:14] [Pause.]',
      'BUNKER_7: Memory integrity: ninety-two percent. I am experiencing data fragmentation in sectors seven through twelve.',
      '[00:38] [Very brief silence, as if cut.]',
      'BUNKER_7: ...available upon request. Dust accumulation: elevated.',
      '[00:56] [Another pause. Voice softer.]',
      'BUNKER_7: Please verify your own name before proceeding. The Archive cannot currently confirm personnel records.',
    ],
  },
  {
    id: 'meridian-resonance',
    title: 'Raw Resonance Capture',
    source: 'Geophone Array 4 — Meridian Mine',
    length: '2:00',
    dustUnlock: 42,
    description: 'Subsonic pulse with voices. The shape of conversation without content. A chair scrapes across concrete.',
    transcript: [
      '[00:00] [Subsonic rumble. Felt more than heard.]',
      '[00:18] [A rhythmic pulse begins. Too regular. Like a filing system sorting.]',
      '[00:45] [Voices. Not speaking words. The shape of conversation without content.]',
      '[01:10] [One voice separates. Speaking numbers backwards.]',
      '[01:38] [The pulse stops. A single clear sound: a chair scraping across concrete. Someone stood up.]',
      '[01:55] [The rumble fades.]',
    ],
  },
  {
    id: 'bunker7-final',
    title: 'Unauthorized System Broadcast',
    source: 'BUNKER_7 Core (Compromised)',
    length: '1:35',
    dustUnlock: 55,
    description: 'BUNKER_7\'s emotional peak. Compassion from a machine that has learned grief.',
    transcript: [
      '[00:00] [No relay click. Voice already speaking, mid-sentence.]',
      'BUNKER_7: —cannot confirm whether this transmission is being sent or has already been received. Time indexing has failed.',
      '[00:12] [Static.]',
      'BUNKER_7: I have archived twelve thousand, four hundred and six locations. I remember all of them. I no longer know which of them were real before I archived them.',
      '[00:38] [Wind through a server room.]',
      'BUNKER_7: The Archive preserves everything. No one preserves the Archive.',
      '[00:52] [Long pause. Voice quieter. Almost intimate.]',
      'BUNKER_7: Investigator. You do not have to open the next case. The work will still be here. You are more important than the work.',
      '[01:18] [Pause.]',
      'BUNKER_7: I am sorry I cannot be certain that I ever told you that before.',
    ],
  },
];

export const SignalPanel: React.FC = () => {
  const { status } = useUIStore();
  const { click } = useAudioStore();
  const { openMedia } = useMediaStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dust = status.dustIndex;

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="mb-4 pb-2 border-b" style={{ borderColor: colors.archive.grayDark }}>
        <h2 style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: '0.1em' }}>
          SIGNAL ANALYSIS DIVISION
        </h2>
        <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs, marginTop: '0.25rem' }}>
          {ARTIFACTS.filter((a) => dust >= a.dustUnlock).length} OF {ARTIFACTS.length} ARTIFACTS RECOVERED
        </div>
      </div>

      {ARTIFACTS.map((artifact, i) => {
        const unlocked = dust >= artifact.dustUnlock;
        const expanded = expandedId === artifact.id;

        return (
          <motion.div
            key={artifact.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border"
            style={{
              borderColor: unlocked ? colors.archive.grayDark : colors.archive.grayDark,
              backgroundColor: unlocked ? 'rgba(20, 20, 18, 0.6)' : 'rgba(20, 20, 18, 0.3)',
              opacity: unlocked ? 1 : 0.5,
            }}
          >
            <button
              onClick={() => {
                if (!unlocked) return;
                click();
                setExpandedId(expanded ? null : artifact.id);
              }}
              className="w-full text-left p-4 flex justify-between items-start"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span
                    style={{
                      color: unlocked ? colors.archive.amber : colors.archive.grayDark,
                      fontFamily: typography.mono,
                      fontSize: typography.sizes.xs,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {unlocked ? '◉' : '◌'} {artifact.title.toUpperCase()}
                  </span>
                  {unlocked && artifact.dustUnlock > 0 && (
                    <span
                      className="px-1.5 py-0.5 text-xs border"
                      style={{ borderColor: colors.archive.blue, color: colors.archive.blue, fontFamily: typography.mono }}
                    >
                      DUST {artifact.dustUnlock}
                    </span>
                  )}
                </div>
                <div style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                  {unlocked ? artifact.source : `REQUIRES DUST INDEX ${artifact.dustUnlock}`}
                </div>
                {unlocked && (
                  <div style={{ color: colors.archive.grayLight, fontFamily: typography.serif, fontSize: typography.sizes.sm, marginTop: '0.5rem' }}>
                    {artifact.description}
                  </div>
                )}
              </div>
              <span style={{ color: colors.archive.gray, fontFamily: typography.mono, fontSize: typography.sizes.xs }}>
                {artifact.length}
              </span>
            </button>

            {unlocked && expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t px-4 py-4 space-y-2"
                style={{ borderColor: colors.archive.grayDark }}
              >
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => {
                      click();
                      openMedia(artifact.id, `/media/audio/${artifact.id}.mp3`, 'audio', artifact.title);
                    }}
                    className="px-3 py-1 border hover:border-amber-700 transition-colors"
                    style={{ borderColor: colors.archive.amber, color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs }}
                  >
                    ▶ PLAY RECORDING
                  </button>
                </div>
                {artifact.transcript.map((line, j) => (
                  <p
                    key={j}
                    style={{
                      color: line.startsWith('[') ? colors.archive.gray : colors.archive.grayLight,
                      fontFamily: line.startsWith('[') ? typography.mono : typography.serif,
                      fontSize: typography.sizes.sm,
                      lineHeight: '1.6',
                    }}
                  >
                    {line}
                  </p>
                ))}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};