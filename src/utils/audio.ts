const SOUND_PREF_KEY = 'credlock_ts_sound_v1';

let audioCtx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(SOUND_PREF_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(SOUND_PREF_KEY, on ? '1' : '0');
  } catch {}
}

export function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08): void {
  if (!isSoundEnabled()) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainVal;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch {}
}

export function playSound(kind: 'success' | 'ticket' | 'alert' | 'warn'): void {
  if (!isSoundEnabled()) return;
  if (kind === 'success') {
    playTone(523.25, 0.08, 'sine', 0.07);
    setTimeout(() => playTone(659.25, 0.12, 'sine', 0.07), 90);
  } else if (kind === 'ticket') {
    playTone(880, 0.12, 'square', 0.05);
    setTimeout(() => playTone(1174.66, 0.18, 'square', 0.05), 140);
    setTimeout(() => playTone(880, 0.1, 'square', 0.04), 320);
  } else if (kind === 'alert') {
    playTone(400, 0.15, 'sawtooth', 0.06);
    setTimeout(() => playTone(320, 0.2, 'sawtooth', 0.06), 160);
  } else if (kind === 'warn') {
    playTone(440, 0.12, 'triangle', 0.06);
  }
}
