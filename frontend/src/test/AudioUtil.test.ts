import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playCelebrationSound } from '../utils/audio.util';

describe('playCelebrationSound Audio Utility', () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockAudioContext: any;

  beforeEach(() => {
    mockOscillator = {
      type: 'triangle',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => ({ ...mockOscillator })),
      createGain: vi.fn(() => ({ ...mockGain })),
      close: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal(
      'AudioContext',
      vi.fn().mockImplementation(() => mockAudioContext)
    );
  });

  it('creates oscillators and gain nodes for festive pop and fanfare notes', () => {
    playCelebrationSound();

    expect(window.AudioContext).toHaveBeenCalled();
    // 1 pop oscillator + 4 fanfare oscillators = 5 oscillators total
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(5);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(5);
  });

  it('resumes suspended audio context gracefully on user interaction', () => {
    mockAudioContext.state = 'suspended';
    playCelebrationSound();

    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('handles environment without AudioContext without throwing exceptions', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);

    expect(() => {
      playCelebrationSound();
    }).not.toThrow();
  });
});
