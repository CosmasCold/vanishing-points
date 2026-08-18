"use client";

import React, { useState } from "react";
import { useProgressionStore } from "@/state/progressionStore";
import { useAudioStore } from "@/state/audioStore";
import { colors, typography, microform } from "@/styles/theme";
import { SignalModal } from "./SignalModal";
import { DecrypterModal } from "./DecrypterModal";
import { Radio, Lock, Play, Cpu, Sparkles } from "lucide-react";

interface SignalArtifact {
  id: string;
  title: string;
  source: string;
  length: string;
  dustUnlock: number;
  description: string;
  transcript: string[];
  mediaUrl?: string; // Physical MP3 track url
}

const ARTIFACTS: SignalArtifact[] = [
  {
    id: "blackwood-ambience",
    title: "Site Ambience Recording",
    source: "Field Kit Mk.IV — Blackwood Hospital",
    length: "1:42",
    dustUnlock: 0,
    description: "Primary survey of Ward 4. Investigator detects anomalous frequency.",
    mediaUrl: "/audio/signals/blackwood-ambience.mp3",
    transcript: [
      "[00:00] Wind against broken glass. Distant structural creaking.",
      "[00:12] INVESTIGATOR: Blackwood Hospital. Ward 4. Primary survey. No structural compromise.",
      "[00:34] [A low hum begins. Not mechanical.]",
      "[00:41] INVESTIGATOR: ...There's a frequency here. Not on the recorder. In the room.",
      "[01:02] [The hum resolves into a brief, clear tone. Then silence.]",
      "[01:08] INVESTIGATOR: I'm logging it as environmental resonance. Not anomalous. Probably ventilation... Probably.",
    ],
  },
  {
    id: "bunker7-boot",
    title: "System Initialization Log",
    source: "BUNKER_7 Core",
    length: "0:45",
    dustUnlock: 0,
    description: "First login sequence. Four thousand two hundred and eleven days since last session.",
    mediaUrl: "/audio/signals/bunker7-boot.mp3",
    transcript: [
      "[00:00] [Mechanical relay click. Soft tape hiss.]",
      "BUNKER_7: Archive node online. Temporal sync: nominal. Memory integrity: ninety-nine percent.",
      "[00:18] [Brief pause. A fan spins up.]",
      "BUNKER_7: Previous session terminated: four thousand, two hundred and eleven days ago. Welcome, investigator. The work has been waiting.",
    ],
  },
  {
    id: "vance-lighthouse",
    title: "Cassette: Keeper's Final Log",
    source: "E. Vance, Lighthouse Service (Ret.) — St. Elmo Light",
    length: "2:15",
    dustUnlock: 12,
    description: "Forty years keeping the light. Then the lamp began lighting itself.",
    mediaUrl: "/audio/vance/vance-loop.mp3",
    transcript: [
      "[00:00] [Ocean. Wind. A kettle whistling.]",
      "VANCE: Testing. This is Edward Vance, St. Elmo Light. Date is... well, the calendar says March, but the gulls haven't left yet.",
      "[00:22] [He chuckles. Paper rustles.]",
      "VANCE: Forty years I kept this light. Never missed a night. Then last Tuesday, I woke up and the lamp was already lit.",
      "[00:52] [Pause. He sips something.]",
      "VANCE: I know what you are thinking. Old man, bad memory. But I remember every ship that passed. I do not remember lighting that lamp.",
      "[01:28] [Wind increases. A door latch rattles.]",
      "VANCE: The light's doing its job without me now. I think maybe it always was.",
      "[02:00] [He sets down the cup.]",
      "VANCE: If someone finds this—tell them the light still works. That's all. That's enough.",
    ],
  },
  {
    id: "numbers-station-7",
    title: "Intercept: Unregistered Broadcast",
    source: "Signal Analysis Division — Channel 7",
    length: "1:30 (looping)",
    dustUnlock: 20,
    description: "Shortwave numbers station quoting Edward Vance's final words.",
    mediaUrl: "/audio/signals/numbers-loop.mp3",
    transcript: [
      "[00:00] [Shortwave static. A carrier tone.]",
      "VOICE: Seven. Fourteen. Zero. St. Elmo. Meridian. Blackwood.",
      "[00:08] [Tone changes pitch, slightly wrong.]",
      "VOICE: Seven. Fourteen. Zero. Pripyat. Duga. Chernobyl.",
      "[00:16] [Static swallows the last name.]",
      "VOICE: Seven. Fourteen. Zero. ...The light still works.",
      "[00:28] [Carrier drops. Dead air.]",
    ],
  },
  {
    id: "meridian-dictaphone",
    title: "Recovered Dictaphone Tape",
    source: "Unidentified — Meridian Mine",
    length: "1:58",
    dustUnlock: 28,
    description: "Engineering student records final message before tunnel takes her. Name lost to magnetic flutter.",
    mediaUrl: "/audio/signals/meridian-dictaphone.mp3",
    transcript: [
      "[00:00] [Heavy breathing. Walking fast through gravel.]",
      "WOMAN: I am leaving this at the entrance. If the mine is still here when you find it, then I failed.",
      "[00:18] [Echo changes—she's in a large space.]",
      "WOMAN: The maps are wrong. Not outdated. Wrong. The east tunnel doesn't exist on any survey. But I've walked it. Three times. It gets longer each time.",
      "[00:42] [A distant sound. Like water dripping upward.]",
      "WOMAN: The other workers do not remember the tunnel. I asked the foreman. He said \"what tunnel?\" and his eyes were... empty.",
      "[01:12] [Gravel crunch.]",
      "WOMAN: I am going back in to mark the walls. If you find this and the walls are unmarked, then the tunnel took me. Please remember that I was here. My name is—",
      "[01:38] [Tape degrades. Name lost.]",
      "WOMAN (distant): —the work has been waiting.",
    ],
  },
  {
    id: "bunker7-diagnostic",
    title: "System Diagnostic: Anomalous",
    source: "BUNKER_7 Core",
    length: "1:10",
    dustUnlock: 35,
    description: "BUNKER_7 experiencing data fragmentation. Asks investigator to verify their own name.",
    mediaUrl: "/audio/signals/bunker7-diagnostic.mp3",
    transcript: [
      "[00:00] [Longer pause than usual. Fan stutters.]",
      "BUNKER_7: Archive node... online. Temporal sync: nominal.",
      "[00:14] [Pause.]",
      "BUNKER_7: Memory integrity: ninety-two percent. I am experiencing data fragmentation in sectors seven through twelve.",
      "[00:38] [Very brief silence, as if cut.]",
      "BUNKER_7: ...available upon request. Dust accumulation: elevated.",
      "[00:56] [Another pause. Voice softer.]",
      "BUNKER_7: Please verify your own name before proceeding. The Archive cannot currently confirm personnel records.",
    ],
  },
  {
    id: "meridian-resonance",
    title: "Raw Resonance Capture",
    source: "Geophone Array 4 — Meridian Mine",
    length: "2:00",
    dustUnlock: 42,
    description: "Subsonic pulse with voices. The shape of conversation without content. A chair scrapes across concrete.",
    mediaUrl: "/audio/signals/meridian-resonance.mp3",
    transcript: [
      "[00:00] [Subsonic rumble. Felt more than heard.]",
      "[00:18] [A rhythmic pulse begins. Too regular. Like a filing system sorting.]",
      "[00:45] [Voices. Not speaking words. The shape of conversation without content.]",
      "[01:10] [One voice separates. Speaking numbers backwards.]",
      "[01:38] [The pulse stops. A single clear sound: a chair scraping across concrete. Someone stood up.]",
      "[01:55] [The rumble fades.]",
    ],
  },
    {
    id: "vance-oradour",
    title: "Anomalous Geophone Sweep",
    source: "Saint-Martin Crypt — Oradour-sur-Glane",
    length: "2:08",
    dustUnlock: 48,
    description: "Sub-surface capture from the sealed crypt. Rhythmic bell strikes overlapping with a distant ocean tide.",
    mediaUrl: "/audio/signals/vance-oradour.mp3",
    transcript: [
      "[00:00] [Sub-surface stone scraping. Thick cassette sub-hiss.]",
      "[00:14] [A church bell tolls. It is slow, regular, and muffled by tons of soil.]",
      "INVESTIGATOR: This is... impossible. I am standing directly above the slab. The air is dry, but the microphone is capturing the sound of pouring rain.",
      "[00:54] [The sound of waves crashing against basalt cliffs emerges beneath the bell tolls.]",
      "VOICE (Edward Vance, overlapping, sounding distorted as if underwater): ...the light keeps itself. I am going down to the cove now. The rain is very cold...",
      "[01:40] [A violent high-voltage static tear. The bell strikes stop instantly. The sound of rain fades into a dry, warm hum.]",
    ],
  },  {
    id: "gila-baseball",
    title: "Geophone: Tar-Paper Slabs",
    source: "Array 11 — Gila River Relocation Center",
    length: "1:55",
    dustUnlock: 16,
    description: "Low-frequency desert wind shear. Acoustic anomalies isolated in the 600 Hz spectrum.",
    mediaUrl: "/audio/signals/gila-baseball.mp3",
    transcript: [
      "[00:00] [Dry, sweeping desert wind. Steady 12 CPM background clicking.]",
      "[00:15] [Geiger counter pings begin to accelerate, rising rapidly to 84 CPM.]",
      "[00:32] [Beneath the static, a distant, muffled echo: a crowd cheering, a wooden baseball bat striking a ball.]",
      "VOICE (muffled child's voice): Run. He's heading for third... get the ball...",
      "[01:18] [A sharp wind gust swallows the voices. The Geiger counter drops back to a slow, hollow clicking.]"
    ],
  },
  {
    id: "teu-echo",
    title: "Ambient: Sphere Feedback",
    source: "Radome 3 — Teufelsberg Intercept Station",
    length: "1:24",
    dustUnlock: 66,
    description: "Fiberglass acoustic resonance. Rhythmic mechanical keystrokes recorded with no terminal nearby.",
    mediaUrl: "/audio/signals/teu-echo.mp3",
    transcript: [
      "[00:00] [Deep, echoing hollow wind blowing through cracked fiberglass.]",
      "[00:12] [The distinct, heavy sound of Strowger-relay typewriter keys typing: / a u d i t.]",
      "[00:28] [Long pause. The sound of someone breathing softly near the microphone.]",
      "DISTORTED WHISPER (reverberating through the sphere): /audit... /audit... I am here... why are you...",
      "[01:05] [A low-frequency 60 Hz hum swells, vibrating the microphone membrane until it clips.]"
    ],
  },

{
    id: "bunker7-final",
    title: "Unauthorized System Broadcast",
    source: "BUNKER_7 Core (Compromised)",
    length: "1:35",
    dustUnlock: 55,
    description: "BUNKER_7's emotional peak. Compassion from a machine that has learned grief.",
    mediaUrl: "/audio/signals/bunker7-final.mp3",
    transcript: [
      "[00:00] [No relay click. Voice already speaking, mid-sentence.]",
      "BUNKER_7: —cannot confirm whether this transmission is being sent or has already been received. Time indexing has failed.",
      "[00:12] [Static.]",
      "BUNKER_7: I have archived twelve thousand, four hundred and six locations. I remember all of them. I no longer know which of them were real before I archived them.",
      "[00:38] [Wind through a server room.]",
      "BUNKER_7: The Archive preserves everything. No one preserves the Archive.",
      "[00:52] [Long pause. Voice quieter. Almost intimate.]",
      "BUNKER_7: Investigator. You do not have to open the next case. The work will still be here. You are more important than the work.",
      "[01:18] [Pause.]",
      "BUNKER_7: I am sorry I cannot be certain that I ever told you that before.",
    ],
  },
  {
    "id": "wittenoom-radio",
    "title": "Air Intercept: Wittenoom Erasure",
    "source": "Field Recorder \u2014 Wittenoom Blue Mine",
    "length": "1:40",
    "dustUnlock": 10,
    "description": "Static sweep across the Western Australia land directories. Whispered coordinates emerge.",
    "mediaUrl": "/audio/signals/wittenoom-radio.mp3",
    "transcript": [
      "[00:00] [Wind over dry spinifex grass. Sand hitting microphone.]",
      "[00:15] UNIDENTIFIED: There's nothing on the signboards anymore. They've painted over the mileage.",
      "[00:32] [Static rise. Faint Morse code tapping at 10 Hz.]",
      "[00:44] VOICE (distorted): Wittenoom... Wittenoom... Blue asbestos dust inside your lungs. Do not follow the signboards. The town has been unwritten."
    ]
  },
  {
    "id": "bhangarh-shrine",
    "title": "Geophone Intercept: Bhangarh Ruins",
    "source": "ASI Survey Kit \u2014 Princess Ratnavati Tower",
    "length": "2:10",
    "dustUnlock": 22,
    "description": "Sub-surface audio captured after sunset inside the forbidden fort perimeter.",
    "mediaUrl": "/audio/signals/bhangarh-shrine.mp3",
    "transcript": [
      "[00:00] [Acoustic feedback. Sound of stone walls breathing.]",
      "[00:18] [Faint, echoing classical sarangi strings playing out of tune.]",
      "[00:45] VOICE (gasping): The sun is setting... we must leave the gates before dusk. The roofs are sliding down... the mortar is wet.",
      "[01:22] [Rhythmic click of metal bangles overlapping with wind.]",
      "[01:54] [A heavy stone collapse. Then sudden, absolute silence.]"
    ]
  },
  {
    "id": "willard-suitcases",
    "title": "Attic Recording: Willard Suitcases",
    "source": "Archival Research Team \u2014 Willard Asylum",
    "length": "1:50",
    "dustUnlock": 52,
    "description": "Microphone left overnight inside the vacant administration building attic.",
    "mediaUrl": "/audio/signals/willard-suitcases.mp3",
    "transcript": [
      "[00:00] [Soft tape hiss. Heavy moisture dripping on attic floor boards.]",
      "[00:14] [A single latch clicks open. Then another. Symmetrical footsteps.]",
      "[00:35] VOICE (grieving): They left 427 of us in the attic. We are still packed. We never left. The Bibles are wet.",
      "[01:05] [A sound of duplicate suitcases sliding across dust.]",
      "[01:28] VOICE: Scribe Vale... why did you write my name in pencil? The pencil is still in the drawer."
    ]
  },
  {
    "id": "poveglia-tower",
    "title": "Hydrophone Capture: Venetian Lagoon",
    "source": "Venice Coastal Guard Unit 12",
    "length": "2:04",
    "dustUnlock": 72,
    "description": "Underwater acoustic array focused on Poveglia Island sub-basement walls.",
    "mediaUrl": "/audio/signals/poveglia-tower.mp3",
    "transcript": [
      "[00:00] [Deep sub-surface marine hum. Water lapping against stone piers.]",
      "[00:15] [Sequences of three knocking knocks: thud, thud, thud. Repeating.]",
      "[00:38] [The bell tower tolling begins, muffled by tons of water, matching the knocking frequency.]",
      "[01:05] CHORUS (overlapping whispers): Ward X is bricked up... twelve beds, all facing the wall. Do not look behind the plaster. The soil is ash.",
      "[01:45] [Water rising rapidly. High-frequency click of rusted iron chains.]"
    ]
  }
];

export const SignalPanel: React.FC = () => {
  const dust = useProgressionStore((state) => state.dustIndex);
  const { click } = useAudioStore();

  const [selectedSignal, setSelectedSignal] = useState<SignalArtifact | null>(null);
  const [decrypterOpen, setDecrypterOpen] = useState(false);

  const recoveredSignals = ARTIFACTS.filter((a) => dust >= a.dustUnlock);

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full flex flex-col select-none">
      {/* Module Title Header */}
      <div className="shrink-0 mb-4 pb-2 border-b flex justify-between items-end" style={{ borderColor: colors.archive.grayDark }}>
        <div>
          <h2 style={{ color: colors.archive.amber, fontFamily: typography.mono, fontSize: typography.sizes.xs, letterSpacing: "0.1em" }}>
            SIGNAL ANALYSIS DIVISION
          </h2>
          <div className="text-[10px] mt-1.5" style={{ color: colors.archive.gray }}>
            {recoveredSignals.length} OF {ARTIFACTS.length} SIGNALS DECRYPTED
          </div>
        </div>

        {/* Cryptanalysis Dial Terminal Access Trigger Button */}
        <button
          onClick={() => {
            click();
            setDecrypterOpen(true);
          }}
          className="px-3 py-1.5 border text-[10px] font-mono tracking-wider flex items-center gap-1.5 hover:border-orange-500 transition-colors"
          style={{
            borderColor: colors.archive.grayDark,
            backgroundColor: "rgba(255, 170, 85, 0.03)",
            color: microform.halogen,
          }}
        >
          <Cpu size={12} className="animate-pulse" />
          DECRYPT TERMINAL
        </button>
      </div>

      {/* Directory Index Column */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {ARTIFACTS.map((item) => {
          const isUnlocked = dust >= item.dustUnlock;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isUnlocked) {
                  click();
                  setSelectedSignal(item);
                }
              }}
              className={`p-4 border rounded-[1px] transition-all flex justify-between items-center ${
                isUnlocked ? "cursor-pointer hover:border-[#5c503f] bg-void" : "opacity-45 cursor-default bg-[#111110]"
              }`}
              style={{
                borderColor: isUnlocked ? colors.archive.grayDark : "#1f1d1a",
              }}
            >
              <div className="space-y-1.5 flex-1 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Radio size={14} style={{ color: isUnlocked ? colors.archive.amber : colors.archive.gray }} />
                  <span
                    className="font-bold text-xs"
                    style={{
                      fontFamily: typography.mono,
                      color: isUnlocked ? colors.archive.white : colors.archive.gray,
                    }}
                  >
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: colors.archive.grayLight, fontFamily: typography.serif }}>
                  {item.description}
                </p>
                <div className="text-[10px]" style={{ color: colors.archive.gray, fontFamily: typography.mono }}>
                  {item.source} • {item.length}
                </div>
              </div>

              {/* Padlock / Play Badge Icon Status Column */}
              <div className="shrink-0 flex items-center justify-center w-10 h-10 border rounded-full bg-black/40" style={{ borderColor: isUnlocked ? colors.archive.grayDark : "#1f1d1a" }}>
                {isUnlocked ? (
                  <Play size={14} style={{ color: colors.archive.amber }} />
                ) : (
                  <Lock size={14} style={{ color: colors.archive.red }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decrypter Modal Portal Overlay */}
      {decrypterOpen && <DecrypterModal onClose={() => setDecrypterOpen(false)} />}

      {/* Signal Tuning Modal Portal Overlay */}
      {selectedSignal && <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}
    </div>
  );
};

export default SignalPanel;