import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollTo for jsdom
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}
