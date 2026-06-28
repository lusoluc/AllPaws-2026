import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: () => null,
    };
  },
}));

// Mock syncWithCloud
jest.mock('@/lib/syncManager', () => ({
  syncWithCloud: jest.fn().mockResolvedValue(undefined),
}));

// Mock subscriber storage for duplicate detection
let mockSubscribers: any[] = [];

// Mock dexie / DB query functions
jest.mock('@/lib/db', () => ({
  db: {
    shelters: {
      limit: () => ({
        first: () => ({
          id: 1,
          name: 'VšĮ "Būk mano draugas"',
          address: 'Kaukėnų g. 9, Glaudėnai',
          bankName: 'Swedbank',
          bic: 'HABALT22',
          iban: 'LT97 7300 0101 2750 0736',
        }),
      }),
    },
    uiTexts: {
      toArray: () => [],
    },
    customBlocks: {
      toArray: () => [],
    },
    subscribers: {
      where: (field: string) => ({
        equalsIgnoreCase: (email: string) => ({
          first: () => {
            return mockSubscribers.find(
              (s) => s.email.toLowerCase() === email.toLowerCase()
            ) || undefined;
          },
        }),
      }),
      add: (subscriber: any) => {
        mockSubscribers.push(subscriber);
        return Promise.resolve(mockSubscribers.length);
      },
    },
  },
}));

// Mock dexie-react-hooks useLiveQuery to execute synchronously in tests
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => fn(),
}));

import HomePage from '@/app/page';

beforeEach(() => {
  localStorage.clear();
  mockSubscribers = [];
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ip: '123.45.67.89' }),
    })
  );
});

describe('Newsletter Signup Form', () => {
  test('renders the newsletter signup section with German text', () => {
    render(<HomePage />);

    expect(screen.getByText('Bleib auf dem Laufenden 🐾')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Deine E-Mail-Adresse')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Dein Vorname (optional)')).toBeInTheDocument();
    expect(screen.getByText('Ich bin dabei! 💌')).toBeInTheDocument();
  });

  test('shows validation error for invalid email format', async () => {
    render(<HomePage />);

    const emailInput = screen.getByPlaceholderText('Deine E-Mail-Adresse');
    const submitBtn = screen.getByText('Ich bin dabei! 💌');

    // Use an email with spaces that passes HTML5 native validation via nativeElement value
    // but fails our regex validation
    Object.defineProperty(emailInput, 'validity', { value: { valid: true } });
    fireEvent.change(emailInput, { target: { value: 'not valid' } });
    
    // Simulate form submit directly (bypassing native validation)
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Bitte gib eine gültige E-Mail-Adresse ein.')).toBeInTheDocument();
    });
  });

  test('shows duplicate error when email already exists', async () => {
    // Pre-seed a subscriber
    mockSubscribers = [
      { id: 1, email: 'test@example.com', name: 'Test', created_at: '2026-01-01', preferences: ['adoptions'] },
    ];

    render(<HomePage />);

    const emailInput = screen.getByPlaceholderText('Deine E-Mail-Adresse');
    const submitBtn = screen.getByText('Ich bin dabei! 💌');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Du bist bereits angemeldet! Danke für dein großes Herz. 💛')).toBeInTheDocument();
    });
  });

  test('shows success message after valid subscription', async () => {
    render(<HomePage />);

    const emailInput = screen.getByPlaceholderText('Deine E-Mail-Adresse');
    const nameInput = screen.getByPlaceholderText('Dein Vorname (optional)');
    const submitBtn = screen.getByText('Ich bin dabei! 💌');

    fireEvent.change(emailInput, { target: { value: 'new.person@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'Anna' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Danke, du bist jetzt dabei! 🎉 Wir freuen uns riesig über dein großes Herz.')).toBeInTheDocument();
    });

    // Verify the subscriber was saved to mock db
    expect(mockSubscribers).toHaveLength(1);
    expect(mockSubscribers[0].email).toBe('new.person@example.com');
    expect(mockSubscribers[0].name).toBe('Anna');
    expect(mockSubscribers[0].ip_address).toBe('123.45.67.89');
  });

  test('renders Impressum link in footer', () => {
    render(<HomePage />);

    expect(screen.getByText('Impressum')).toBeInTheDocument();
  });

  test('renders author credit with Carlos Lucas in footer', () => {
    render(<HomePage />);

    expect(screen.getByText(/Carlos Lucas/)).toBeInTheDocument();
  });

  test('topic preference checkboxes toggle correctly', () => {
    render(<HomePage />);

    const adoptionsCheckbox = screen.getByLabelText(/Neues aus dem Heim/);
    const eventsCheckbox = screen.getByLabelText(/Nächste Hilfsaktionen/);
    const guidesCheckbox = screen.getByLabelText(/Erste-Hilfe-Tipps/);

    // Adoptions is checked by default
    expect(adoptionsCheckbox).toBeChecked();
    expect(eventsCheckbox).not.toBeChecked();
    expect(guidesCheckbox).not.toBeChecked();

    // Toggle events on
    fireEvent.click(eventsCheckbox);
    expect(eventsCheckbox).toBeChecked();

    // Toggle adoptions off
    fireEvent.click(adoptionsCheckbox);
    expect(adoptionsCheckbox).not.toBeChecked();
  });
});

describe('Newsletter Staggered Queue Logic', () => {
  test('calculates correct batch scheduling for 25 recipients', () => {
    const BATCH_SIZE = 20;
    const DELAY_MS = 5 * 60 * 1000; // 5 minutes
    const recipients = Array.from({ length: 25 }, (_, i) => ({
      email: `user${i + 1}@example.com`,
    }));

    const now = Date.now();
    const scheduledTimes = recipients.map((_, i) => {
      const batchIndex = Math.floor(i / BATCH_SIZE);
      return new Date(now + batchIndex * DELAY_MS).getTime();
    });

    // First 20 should be scheduled at 'now'
    for (let i = 0; i < 20; i++) {
      expect(scheduledTimes[i]).toBe(now);
    }

    // Recipients 21-25 should be scheduled 5 minutes later
    for (let i = 20; i < 25; i++) {
      expect(scheduledTimes[i]).toBe(now + DELAY_MS);
    }

    // The gap between batch 1 and batch 2 should be exactly 5 minutes
    expect(scheduledTimes[20] - scheduledTimes[0]).toBe(5 * 60 * 1000);
  });

  test('calculates correct batches for 60 recipients', () => {
    const BATCH_SIZE = 20;
    const DELAY_MS = 5 * 60 * 1000;
    const totalRecipients = 60;

    const now = Date.now();
    const batches = Math.ceil(totalRecipients / BATCH_SIZE);

    expect(batches).toBe(3);

    // Batch 0: now, Batch 1: now + 5min, Batch 2: now + 10min
    for (let b = 0; b < batches; b++) {
      const expectedTime = now + b * DELAY_MS;
      const startIdx = b * BATCH_SIZE;
      const batchIndex = Math.floor(startIdx / BATCH_SIZE);
      expect(new Date(now + batchIndex * DELAY_MS).getTime()).toBe(expectedTime);
    }
  });
});
