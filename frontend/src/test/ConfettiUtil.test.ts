import { describe, it, expect, vi, beforeEach } from 'vitest';
import confetti from 'canvas-confetti';
import { triggerRsvpConfetti } from '../utils/confetti.util';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('triggerRsvpConfetti Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers center burst and delayed side cannons with high zIndex', async () => {
    vi.useFakeTimers();

    triggerRsvpConfetti();

    // First center burst
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 99999,
      })
    );

    // Fast-forward timer by 150ms for side cannons
    vi.advanceTimersByTime(150);

    expect(confetti).toHaveBeenCalledTimes(3);

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 45,
        angle: 60,
        origin: { x: 0.05, y: 0.65 },
        zIndex: 99999,
      })
    );

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 45,
        angle: 120,
        origin: { x: 0.95, y: 0.65 },
        zIndex: 99999,
      })
    );

    vi.useRealTimers();
  });
});
