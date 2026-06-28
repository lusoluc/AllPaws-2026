import '@testing-library/jest-dom';


// Mock URL APIs not available in jsdom
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn(() => 'blob:mock-video-url');
  window.URL.revokeObjectURL = jest.fn();
  
// Mock HTMLMediaElement prototype methods for checking video duration
  window.HTMLMediaElement.prototype.load = jest.fn();
  window.HTMLMediaElement.prototype.play = jest.fn();
  window.HTMLMediaElement.prototype.pause = jest.fn();
}

// Mock the system logger to avoid IndexedDB MissingAPIError in JSDOM
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
