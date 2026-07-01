import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

import LoginPage from '@/app/login/page';

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

describe('LoginPage Security & Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD = 'BMD2026';
    process.env.NEXT_PUBLIC_DEV_PASSWORD = 'DEVBMD2026';
  });

  test('Happy Path: logs in successfully with the correct password and sets standard session', async () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByPlaceholderText('Passwort eingeben');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(passwordInput, { target: { value: 'BMD2026' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('bmd_session')).toBe('authenticated');
      expect(localStorage.getItem('bmd_dev_mode')).toBe('false');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('Happy Path: logs in successfully with the developer password and sets developer session', async () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByPlaceholderText('Passwort eingeben');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(passwordInput, { target: { value: 'DEVBMD2026' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('bmd_session')).toBe('authenticated');
      expect(localStorage.getItem('bmd_dev_mode')).toBe('true');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('Negative Path: rejects wrong password and displays error banner', async () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByPlaceholderText('Passwort eingeben');
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });

    fireEvent.change(passwordInput, { target: { value: 'WRONG_PASSWORD_123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Ungültiges Passwort. Bitte versuche es erneut.')).toBeInTheDocument();
      expect(localStorage.getItem('bmd_session')).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  test('Negative Path: does not allow blank/empty password submissions', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: 'Anmelden' });
    
    fireEvent.click(submitButton);

    // Form validation should trigger (HTML5 required attribute)
    const passwordInput = screen.getByPlaceholderText('Passwort eingeben') as HTMLInputElement;
    expect(passwordInput.validity.valueMissing).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('Edge Case: SQL Injection and XSS payload attempts are safely rejected and do not crash the app', async () => {
    const payloads = [
      "' OR '1'='1",
      "' OR 1=1 --",
      "admin'--",
      "<script>alert('hack')</script>",
      "\" OR \"\" = \""
    ];

    for (const payload of payloads) {
      const { unmount } = render(<LoginPage />);
      
      const passwordInput = screen.getByPlaceholderText('Passwort eingeben');
      const submitButton = screen.getByRole('button', { name: 'Anmelden' });

      fireEvent.change(passwordInput, { target: { value: payload } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Ungültiges Passwort. Bitte versuche es erneut.')).toBeInTheDocument();
        expect(localStorage.getItem('bmd_session')).toBeNull();
      });

      unmount();
    }
  });
});
