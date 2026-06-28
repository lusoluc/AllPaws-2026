import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LogsPage from '@/app/dashboard/logs/page';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

// Unmock logger since it is mocked globally in jest.setup.js
jest.unmock('@/lib/logger');

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

// Mock syncWithCloud
jest.mock('@/lib/syncManager', () => ({
  syncWithCloud: jest.fn().mockResolvedValue(undefined),
}));

// Mock db
const mockSystemLogsAdd = jest.fn().mockResolvedValue(1);
const mockSystemLogsClear = jest.fn().mockResolvedValue(undefined);
const mockSystemLogsToArray = jest.fn().mockResolvedValue([
  { id: 1, timestamp: '2026-06-21T10:00:00.000Z', level: 'info', context: 'Auth', message: 'User logged in successfully' },
  { id: 2, timestamp: '2026-06-21T10:05:00.000Z', level: 'warn', context: 'Auth', message: 'Failed password attempt' },
  { id: 3, timestamp: '2026-06-21T10:10:00.000Z', level: 'error', context: 'Database', message: 'Failed to write record', stack_trace: 'Error: DB failure at line 42' },
]);

jest.mock('@/lib/db', () => ({
  db: {
    systemLogs: {
      add: (...args: any[]) => mockSystemLogsAdd(...args),
      clear: (...args: any[]) => mockSystemLogsClear(...args),
      toArray: (...args: any[]) => mockSystemLogsToArray(...args),
    },
    uiTexts: {
      toArray: () => Promise.resolve([]),
    },
    guideItems: {
      toArray: () => Promise.resolve([]),
    },
    customBlocks: {
      toArray: () => Promise.resolve([]),
    },
  },
}));

// Mock dexie-react-hooks useLiveQuery to return mock values synchronously/asynchronously
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn((callback) => {
    // Return a mocked value state structure
    const [data, setData] = React.useState<any>(null);
    React.useEffect(() => {
      Promise.resolve(callback()).then(setData);
    }, []);
    return data;
  }),
}));

// Mock navigator.clipboard
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  configurable: true,
});

// Mock window.confirm
const mockConfirm = jest.fn().mockReturnValue(true);
window.confirm = mockConfirm;

describe('System Logger Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logger.info adds log to db', async () => {
    await logger.info('TestCtx', 'Test message info');
    expect(mockSystemLogsAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        context: 'TestCtx',
        message: 'Test message info',
        timestamp: expect.any(String),
      })
    );
  });

  test('logger.warn adds log to db', async () => {
    await logger.warn('TestCtx', 'Test message warning');
    expect(mockSystemLogsAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'warn',
        context: 'TestCtx',
        message: 'Test message warning',
        timestamp: expect.any(String),
      })
    );
  });

  test('logger.error extracts stack trace and adds log to db', async () => {
    const testError = new Error('Database connection failed');
    await logger.error('TestCtx', 'Database write error', testError);
    expect(mockSystemLogsAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        context: 'TestCtx',
        message: 'Database write error',
        stack_trace: testError.stack,
        timestamp: expect.any(String),
      })
    );
  });
});

describe('Logs Dashboard Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('redirects to login if user is not authenticated', async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  test('redirects to dashboard if user is authenticated but not developer', async () => {
    localStorage.setItem('bmd_session', 'authenticated');
    localStorage.setItem('bmd_dev_mode', 'false');
    render(<LogsPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('renders logs viewer if authenticated as developer', async () => {
    localStorage.setItem('bmd_session', 'authenticated');
    localStorage.setItem('bmd_dev_mode', 'true');
    render(<LogsPage />);

    // Wait for the mock logs to be returned by useLiveQuery
    await waitFor(() => {
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
      expect(screen.getByText('Failed password attempt')).toBeInTheDocument();
      expect(screen.getByText('Failed to write record')).toBeInTheDocument();
    });

    expect(screen.getByText('Bug Tracker & Entwickler-Panel')).toBeInTheDocument();
  });

  test('allows filtering logs by log level', async () => {
    localStorage.setItem('bmd_session', 'authenticated');
    localStorage.setItem('bmd_dev_mode', 'true');
    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
    });

    // Click "Fehler" filter
    const errorFilterBtn = screen.getByRole('button', { name: /Fehler \(/ });
    fireEvent.click(errorFilterBtn);

    await waitFor(() => {
      // Info logs should be filtered out
      expect(screen.queryByText('User logged in successfully')).not.toBeInTheDocument();
      // Error log should remain
      expect(screen.getByText('Failed to write record')).toBeInTheDocument();
    });
  });

  test('allows searching logs by search term', async () => {
    localStorage.setItem('bmd_session', 'authenticated');
    localStorage.setItem('bmd_dev_mode', 'true');
    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Durchsuche Logs/);
    fireEvent.change(searchInput, { target: { value: 'password' } });

    await waitFor(() => {
      expect(screen.queryByText('User logged in successfully')).not.toBeInTheDocument();
      expect(screen.getByText('Failed password attempt')).toBeInTheDocument();
    });
  });

  test('allows clearing system logs', async () => {
    localStorage.setItem('bmd_session', 'authenticated');
    localStorage.setItem('bmd_dev_mode', 'true');
    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
    });

    const clearBtn = screen.getByTitle('Protokolle löschen');
    fireEvent.click(clearBtn);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockSystemLogsClear).toHaveBeenCalled();
  });

  test('allows copying logs to clipboard as JSON', async () => {
    localStorage.setItem('bmd_session', 'authenticated');
    localStorage.setItem('bmd_dev_mode', 'true');
    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
    });

    const copyBtn = screen.getByTitle('Kopieren als JSON');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });
});
