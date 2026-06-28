import { POST } from '@/app/api/send-email/route';
import nodemailer from 'nodemailer';

// Mock Next.js server response spec extension
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

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: () => null,
    };
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Send-Email API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD = 'BMD2026';
    process.env.NEXT_PUBLIC_DEV_PASSWORD = 'DEVBMD2026';
  });

  test('returns 401 for invalid password', async () => {
    const request = {
      json: async () => ({
        authPassword: 'wrong-password',
        settings: { provider: 'simulation' },
        email: { to: 'test@example.com', subject: 'Hi', body: 'Test' }
      })
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Ungültiges Passwort');
  });

  test('succeeds in simulation mode', async () => {
    const request = {
      json: async () => ({
        authPassword: 'BMD2026',
        settings: { provider: 'simulation' },
        email: { to: 'test@example.com', subject: 'Hi', body: 'Test' }
      })
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Simulation erfolgreich');
  });

  test('calls global fetch for Resend provider', async () => {
    // Mock global fetch
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'resend-id-123' }),
    });
    global.fetch = mockFetch;

    const request = {
      json: async () => ({
        authPassword: 'BMD2026',
        settings: {
          provider: 'resend',
          resendApiKey: 're_mock_key',
          resendFrom: 'newsletter@bukmanodraugas.lt',
        },
        email: { to: 'test@example.com', subject: 'Hi', body: 'Test' }
      })
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer re_mock_key',
        }),
      })
    );
  });

  test('calls nodemailer for SMTP provider', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'smtp-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const request = {
      json: async () => ({
        authPassword: 'DEVBMD2026',
        settings: {
          provider: 'smtp',
          smtpHost: 'smtp.gmail.com',
          smtpPort: '465',
          smtpUser: 'test@gmail.com',
          smtpPass: 'abcd efgh ijkl mnop',
          smtpSecure: true,
        },
        email: { to: 'test@example.com', subject: 'SMTP Hi', body: 'SMTP Test' }
      })
    } as any;

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@gmail.com',
          pass: 'abcd efgh ijkl mnop',
        },
      })
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'SMTP Hi',
      })
    );
  });
});
