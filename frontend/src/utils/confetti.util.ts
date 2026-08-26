import confetti from 'canvas-confetti';
import { CONFETTI_COLORS } from '../constants/theme.constants';

const EXTENDED_CONFETTI_COLORS = [
  ...CONFETTI_COLORS,
  '#8b5cf6',
  '#3b82f6',
  '#f43f5e',
  '#10b981',
];

/**
 * Triggers a vibrant, multi-cannon celebration confetti animation
 * with top-level z-index ensuring visibility over all UI layers.
 */
export const triggerRsvpConfetti = () => {
  try {
    const fire =
      typeof confetti === 'function'
        ? confetti
        : (confetti as any)?.default || confetti;

    if (typeof fire !== 'function') {
      return;
    }

    // 1. Immediate Center Festive Pop
    fire({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: EXTENDED_CONFETTI_COLORS,
      zIndex: 99999,
      disableForReducedMotion: false,
    });

    // 2. Left and Right Cannon Bursts
    setTimeout(() => {
      fire({
        particleCount: 45,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.65 },
        colors: EXTENDED_CONFETTI_COLORS,
        zIndex: 99999,
        disableForReducedMotion: false,
      });

      fire({
        particleCount: 45,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.65 },
        colors: EXTENDED_CONFETTI_COLORS,
        zIndex: 99999,
        disableForReducedMotion: false,
      });
    }, 150);
  } catch (err) {
    // Non-blocking fallback
    console.warn('Confetti animation failed to trigger:', err);
  }
};
