import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authPassword, settings, email } = body;

    // Check Auth - Server-only environment variables are preferred for server validation
    const devPass = process.env.DEV_PASSWORD || process.env.NEXT_PUBLIC_DEV_PASSWORD || 'DEVBMD2026';
    const staffPass = process.env.DASHBOARD_PASSWORD || process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'BMD2026';

    if (!authPassword || (authPassword !== devPass && authPassword !== staffPass)) {
      return NextResponse.json(
        { success: false, error: 'Ungültiges Passwort für Helfer-Portal / Neteisingas slaptažodis' },
        { status: 401 }
      );
    }

    if (!email || !email.to || !email.subject || !email.body) {
      return NextResponse.json(
        { success: false, error: 'E-Mail-Empfänger, Betreff oder Inhalt fehlt.' },
        { status: 400 }
      );
    }

    const provider = settings?.provider || 'simulation';

    if (provider === 'simulation') {
      return NextResponse.json({ success: true, message: 'Simulation erfolgreich (keine echte Mail gesendet).' });
    }

    if (provider === 'resend') {
      const apiKey = settings.resendApiKey;
      const fromEmail = settings.resendFrom || 'onboarding@resend.dev';

      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'Resend API-Key fehlt.' },
          { status: 400 }
        );
      }

      // Format API key to ensure it has Bearer prefixed correctly
      const formattedKey = apiKey.trim().startsWith('Bearer ') ? apiKey.trim() : `Bearer ${apiKey.trim()}`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': formattedKey,
        },
        body: JSON.stringify({
          from: fromEmail.trim(),
          to: [email.to.trim()],
          subject: email.subject,
          html: email.body.replace(/\n/g, '<br>'),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const resendError = errData?.message || `HTTP Fehler ${res.status}`;
        return NextResponse.json(
          { success: false, error: `Resend API Fehler: ${resendError}` },
          { status: 400 }
        );
      }

      const resData = await res.json();
      return NextResponse.json({ success: true, data: resData });
    }

    if (provider === 'smtp') {
      const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = settings;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        return NextResponse.json(
          { success: false, error: 'Unvollständige SMTP-Konfiguration. Bitte alle Pflichtfelder ausfüllen.' },
          { status: 400 }
        );
      }

      const portNum = parseInt(smtpPort, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json(
          { success: false, error: 'Ungültiger Port. Muss eine Zahl zwischen 1 und 65535 sein.' },
          { status: 400 }
        );
      }

      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost.trim(),
          port: portNum,
          secure: !!smtpSecure, // true for port 465, false for other ports
          auth: {
            user: smtpUser.trim(),
            pass: smtpPass,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 10000,
        });

        await transporter.sendMail({
          from: `"${smtpUser.split('@')[0]}" <${smtpUser.trim()}>`,
          to: email.to.trim(),
          subject: email.subject,
          text: email.body,
          html: email.body.replace(/\n/g, '<br>'),
        });

        return NextResponse.json({ success: true });
      } catch (smtpError: any) {
        console.error('SMTP Error:', smtpError);
        let errorMsg = smtpError?.message || 'Unbekannter SMTP Fehler';

        // Add helpful hints for typical errors
        if (errorMsg.includes('EAUTH') || errorMsg.includes('Authentication failed')) {
          if (smtpHost.toLowerCase().includes('gmail')) {
            errorMsg = 'Gmail-Authentifizierung fehlgeschlagen. Du musst ein Google "App-Passwort" verwenden, kein normales Gmail-Passwort! Bitte aktiviere 2FA und generiere ein App-Passwort.';
          } else {
            errorMsg = 'Authentifizierung fehlgeschlagen. Bitte überprüfe Benutzername und Passwort/App-Passwort.';
          }
        } else if (errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ESOCKET')) {
          errorMsg = `Verbindungs-Timeout zu ${smtpHost}:${smtpPort}. Überprüfe Hostname, Port und ob deine Firewall/dein Hoster diesen Port blockiert (z.B. Port 25/587 bei manchen Anbietern gesperrt).`;
        } else if (errorMsg.includes('ECONNREFUSED')) {
          errorMsg = `Verbindung von ${smtpHost} auf Port ${smtpPort} abgelehnt. Bitte überprüfe, ob der Port und Host korrekt sind.`;
        }

        return NextResponse.json(
          { success: false, error: `SMTP Fehler: ${errorMsg}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Ungültiger E-Mail-Provider angegeben.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API send-email error:', error);
    return NextResponse.json(
      { success: false, error: `Serverfehler: ${error?.message || 'Unbekannt'}` },
      { status: 500 }
    );
  }
}
