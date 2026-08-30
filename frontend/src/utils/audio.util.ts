/**
 * Audio synthesis utility for celebration effects (e.g. RSVP confirmed).
 * Uses the standard Web Audio API with zero external asset dependencies.
 */

export const playCelebrationSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 1. Gentle festive pop impact at time 0
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(320, now);
    popOsc.frequency.exponentialRampToValueAtTime(70, now + 0.07);

    popGain.gain.setValueAtTime(0.25, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    popOsc.connect(popGain);
    popGain.connect(ctx.destination);

    popOsc.start(now);
    popOsc.stop(now + 0.07);

    // 2. Harmonious cheerful fanfare notes (F5, A5, C6, F6)
    const notes = [
      { freq: 698.46, time: 0.02, duration: 0.22 }, // F5
      { freq: 880.0, time: 0.09, duration: 0.25 }, // A5
      { freq: 1046.5, time: 0.16, duration: 0.28 }, // C6
      { freq: 1396.91, time: 0.24, duration: 0.45 }, // F6
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Warm, melodic tone with triangle wave
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      // Smooth attack & exponential decay
      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.18, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });

    // Clean up audio context after playback finishes
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 1000);
  } catch (err) {
    // Non-blocking fallback for environments without audio support
  }
};
