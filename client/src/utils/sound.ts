interface Tone {
  freq: number;
  type: OscillatorType;
  gain: number;
  duration: number;
  delay: number;
}

function playTones(tones: Tone[]) {
  const ctx = new AudioContext();
  tones.forEach(({ freq, type, gain: gainVal, duration, delay }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + delay;
    gainNode.gain.setValueAtTime(gainVal, start);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration);
  });
}

export function playAlertLow() {
  playTones([
    { freq: 800, type: 'square', gain: 0.15, duration: 0.6, delay: 0 },
    { freq: 600, type: 'square', gain: 0.15, duration: 0.4, delay: 0.8 },
  ]);
}

export function playAlertFull() {
  playTones([
    { freq: 523, type: 'sine', gain: 0.12, duration: 0.5, delay: 0 },
    { freq: 659, type: 'sine', gain: 0.12, duration: 0.5, delay: 0.65 },
  ]);
}
