// Web Audio API primitives — no external files, everything generated in-browser

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode }[] = [];
let isInitialized = false;

export function initAudio(): AudioContext {
  if (isInitialized && ctx) return ctx;
  ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.4;
  masterGain.connect(ctx.destination);
  isInitialized = true;
  return ctx;
}

export function getAudioContext(): AudioContext | null {
  return ctx;
}

// ─── AMBIENT LAYER ───
export function startAmbient(dust: number = 0, corruption: number = 0, timeOfDay: string = "night") {
  if (!ctx || !masterGain) return () => {};
  
  // Stop existing
  ambientNodes.forEach(n => { n.osc.stop(); n.lfo.stop(); });
  ambientNodes = [];

  const baseFreq = timeOfDay === "night" ? 55 : timeOfDay === "dusk" ? 82 : 110;
  const dustDetune = dust * 0.5; // Higher dust = slightly sharper, more uncomfortable
  const corruptionGain = corruption * 0.08;

  // Drone 1: Fundamental
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = baseFreq + dustDetune;
  const gain1 = ctx.createGain();
  gain1.gain.value = 0.08 + (dust / 1000);
  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1.start();

  // Drone 2: Detuned fifth
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.value = baseFreq * 1.5 + (dustDetune * 0.3);
  const gain2 = ctx.createGain();
  gain2.gain.value = 0.03;
  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2.start();

  // LFO modulation on drone 2 (breathing effect)
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.08 + (corruption * 0.02); // Corruption speeds up breathing
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 2 + corruption;
  lfo.connect(lfoGain);
  lfoGain.connect(osc2.frequency);
  lfo.start();

  // Corruption layer: low rumble
  if (corruption >= 2) {
    const rumble = ctx.createOscillator();
    rumble.type = "sawtooth";
    rumble.frequency.value = 30 + (corruption * 5);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = corruptionGain;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 120;
    rumble.connect(filter);
    filter.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    rumble.start();
    ambientNodes.push({ osc: rumble, gain: rumbleGain, lfo });
  }

  ambientNodes.push({ osc: osc1, gain: gain1, lfo });
  ambientNodes.push({ osc: osc2, gain: gain2, lfo });

  return () => stopAmbient();
}

export function stopAmbient() {
  ambientNodes.forEach(n => {
    try { n.osc.stop(); } catch {}
    try { n.lfo.stop(); } catch {}
  });
  ambientNodes = [];
}

// ─── PLACE RESONANCE ───
export function playPlaceResonance(category: string, atmosphere: number) {
  if (!ctx || !masterGain) return;
  
  const now = ctx.currentTime;
  const baseFreq = category === "haunted" ? 880 : category === "abandoned" ? 330 : 550;
  const atmosphereDetune = atmosphere * 20; // 1-5 atmosphere maps to 20-100 cents
  
  // Main tone
  const osc = ctx.createOscillator();
  osc.type = category === "haunted" ? "sine" : "triangle";
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 2.5);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
  
  // Reverb-ish delay
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.4;
  const delayGain = ctx.createGain();
  delayGain.gain.value = 0.3;
  
  osc.connect(gain);
  gain.connect(masterGain);
  gain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(masterGain);
  delayGain.connect(delay); // Feedback loop
  
  osc.start(now);
  osc.stop(now + 3.2);

  // Haunted places get a high harmonic that rings
  if (category === "haunted" || category === "both") {
    const harmonic = ctx.createOscillator();
    harmonic.type = "sine";
    harmonic.frequency.value = baseFreq * 2 + atmosphereDetune;
    const hGain = ctx.createGain();
    hGain.gain.setValueAtTime(0, now);
    hGain.gain.linearRampToValueAtTime(0.04, now + 0.3);
    hGain.gain.exponentialRampToValueAtTime(0.001, now + 4);
    harmonic.connect(hGain);
    hGain.connect(masterGain);
    harmonic.start(now);
    harmonic.stop(now + 4.2);
  }
}

// ─── UI TACTILE ───
export function playUIClick() {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.12);
}

export function playUIHover() {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 440 + Math.random() * 80;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.015, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.08);
}

// ─── TERMINAL STATIC ───
export function playStaticBurst(duration: number = 0.3, intensity: number = 0.1) {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * intensity;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(intensity, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  // Bandpass filter to make it sound like radio static
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2000 + Math.random() * 1000;
  filter.Q.value = 0.5;
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(now);
}

// ─── TYPING SOUNDS ───
export function playKeystroke() {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  
  // Mechanical switch click + subtle room tone
  const click = ctx.createOscillator();
  click.type = "square";
  click.frequency.value = 800 + Math.random() * 200;
  const clickGain = ctx.createGain();
  clickGain.gain.value = 0.02;
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = "highpass";
  clickFilter.frequency.value = 2000;
  
  click.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(masterGain);
  click.start(now);
  click.stop(now + 0.02);
}

// ─── THE OTHER'S INTERFERENCE ───
export function playOtherInterference() {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  
  // Glitchy, corrupted tone
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.linearRampToValueAtTime(50, now + 0.5);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.7);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0, now + 1.2);
  
  const filter = ctx.createBiquadFilter();
  filter.type = "notch";
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.linearRampToValueAtTime(2000, now + 1);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 1.3);
  
  playStaticBurst(1.0, 0.08);
}

// ─── MASTER CONTROL ───
export function setMasterVolume(vol: number) {
  if (masterGain) masterGain.gain.value = vol;
}

export function fadeOutAll(duration: number = 2) {
  if (!masterGain || !ctx) return;
  const now = ctx.currentTime;
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0, now + duration);
  setTimeout(() => {
    stopAmbient();
    if (ctx?.state === "running") ctx.suspend();
  }, duration * 1000);
}