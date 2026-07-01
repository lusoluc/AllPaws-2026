import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Polyfill TextEncoder and crypto.subtle for JSDOM test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
if (typeof global.crypto === 'undefined' || !global.crypto.subtle) {
  const webcrypto = require('crypto').webcrypto;
  if (webcrypto && webcrypto.subtle) {
    global.crypto = webcrypto;
  } else {
    global.crypto = {
      subtle: {
        digest: async (algo: string, data: Uint8Array) => {
          const shasum = require('crypto').createHash(algo.toLowerCase().replace('-', ''));
          shasum.update(data);
          return shasum.digest();
        }
      }
    } as any;
  }
}

// Bind to window.crypto for JSDOM context compatibility
if (typeof window !== 'undefined' && window.crypto) {
  if (!window.crypto.subtle) {
    Object.defineProperty(window.crypto, 'subtle', {
      value: global.crypto.subtle,
      writable: true,
      configurable: true
    });
  }
}

// Polyfill global Request for Node/Jest environment if not present
if (typeof global.Request === 'undefined') {
  global.Request = class {} as any;
}

// Mock next/server to isolate the handler and avoid loading real NextRequest code
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
      };
    }),
  },
}));

const { POST: sendEmailHandler } = require('@/app/api/send-email/route');
import DashboardPage from '@/app/dashboard/page';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      prefetch: () => null,
    };
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Dexie db
jest.mock('@/lib/db', () => ({
  db: {
    animals: {
      toArray: () => Promise.resolve([]),
    },
    inquiries: {
      toArray: () => Promise.resolve([]),
    },
    systemLogs: {
      toArray: () => Promise.resolve([]),
    },
    shelters: {
      limit: () => ({
        first: () => Promise.resolve({ name: 'Test Shelter' }),
      }),
    },
  },
}));

describe('Security Posture Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD = 'BMD2026';
    process.env.NEXT_PUBLIC_DEV_PASSWORD = 'DEVBMD2026';
  });

  describe('1. Server API Email Route Security', () => {
    test('rejects POST request with missing password (401 Unauthorized)', async () => {
      const request = {
        json: async () => ({
          settings: { provider: 'simulation' },
          email: { to: 'attacker@example.com', subject: 'XSS', body: 'Payload' },
        }),
      } as any;

      const response = await sendEmailHandler(request);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Ungültiges Passwort');
    });

    test('rejects POST request with incorrect password (401 Unauthorized)', async () => {
      const request = {
        json: async () => ({
          authPassword: 'wrong_password_123',
          settings: { provider: 'simulation' },
          email: { to: 'attacker@example.com', subject: 'XSS', body: 'Payload' },
        }),
      } as any;

      const response = await sendEmailHandler(request);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('rejects SMTP config with invalid out-of-bounds port (400 Bad Request)', async () => {
      const request = {
        json: async () => ({
          authPassword: 'BMD2026',
          settings: {
            provider: 'smtp',
            smtpHost: 'smtp.gmail.com',
            smtpPort: '99999', // Out of range port (max 65535)
            smtpUser: 'test@gmail.com',
            smtpPass: 'password',
          },
          email: { to: 'test@example.com', subject: 'Hi', body: 'Test' },
        }),
      } as any;

      const response = await sendEmailHandler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Ungültiger Port');
    });
  });

  describe('2. Client-Side Access Controls & Session Security', () => {
    test('enforces login redirect if session is unauthenticated', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('permits page load if session is valid ("authenticated")', async () => {
      localStorage.setItem('bmd_session', 'authenticated');
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/login');
      });
    });
  });
});
