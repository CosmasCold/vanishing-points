import { create } from 'zustand';

interface AudioState {
  context: AudioContext | null;
  humNode: OscillatorNode | null;
  gainNode: GainNode | null;
  isPlaying: boolean;
  volume: number;
  
  init: () => void;
  startHum: () => void;
  stopHum: () => void;
  click: () => void;
  setVolume: (vol: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  context: null,
  humNode: null,
  gainNode: null,
  isPlaying: false,
  volume: 0.15,
  
  init: () => {
    if (get().context) return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = get().volume;
    set({ context: ctx, gainNode: gain });
  },
  
  startHum: () => {
    const { context, gainNode, isPlaying } = get();
    if (!context || !gainNode || isPlaying) return;
    
    // 60Hz electrical hum with slight detune for realism
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;
    
    const osc2 = context.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 120; // Harmonic
    
    const humGain = context.createGain();
    humGain.gain.value = 0.3;
    
    osc.connect(humGain);
    osc2.connect(humGain);
    humGain.connect(gainNode);
    
    osc.start();
    osc2.start();
    
    set({ humNode: osc, isPlaying: true });
  },
  
  stopHum: () => {
    const { humNode } = get();
    if (humNode) {
      humNode.stop();
      set({ humNode: null, isPlaying: false });
    }
  },
  
  click: () => {
    const { context, gainNode } = get();
    if (!context || !gainNode) return;
    
    const osc = context.createOscillator();
    const clickGain = context.createGain();
    
    osc.type = 'square';
    osc.frequency.value = 800;
    clickGain.gain.setValueAtTime(0.1, context.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
    
    osc.connect(clickGain);
    clickGain.connect(gainNode);
    
    osc.start();
    osc.stop(context.currentTime + 0.05);
  },
  
  setVolume: (vol) => {
    const { gainNode } = get();
    if (gainNode) gainNode.gain.value = vol;
    set({ volume: vol });
  },
}));