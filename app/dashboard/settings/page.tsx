'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Mail, 
  Settings2, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { APP_CONFIG } from '@/lib/appConfig';

interface EmailSettings {
  provider: 'simulation' | 'resend' | 'smtp';
  resendApiKey: string;
  resendFrom: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
}

const DEFAULT_SETTINGS: EmailSettings = {
  provider: 'simulation',
  resendApiKey: '',
  resendFrom: 'newsletter@bukmanodraugas.lt',
  smtpHost: 'smtp.gmail.com',
  smtpPort: '465',
  smtpUser: '',
  smtpPass: '',
  smtpSecure: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');
  const [settingsTab, setSettingsTab] = useState<'email' | 'shelter' | 'features'>('email');

  // Shelter Details Form State
  const [shelterName, setShelterName] = useState('');
  const [shelterWebsite, setShelterWebsite] = useState('');
  const [shelterEmailDe, setShelterEmailDe] = useState('');
  const [shelterEmailLt, setShelterEmailLt] = useState('');
  const [shelterPhone, setShelterPhone] = useState('');
  const [shelterAddress, setShelterAddress] = useState('');
  const [shelterRegCode, setShelterRegCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankBic, setBankBic] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Feature Toggles State
  const [featGallery, setFeatGallery] = useState(true);
  const [featGuide, setFeatGuide] = useState(true);
  const [featEmergency, setFeatEmergency] = useState(true);
  const [featAboutUs, setFeatAboutUs] = useState(true);
  const [featNewsletter, setFeatNewsletter] = useState(true);
  const [featInquiries, setFeatInquiries] = useState(true);
  const [featSponsorship, setFeatSponsorship] = useState(true);
  
  // Form State
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  
  // UI Accordions / Status
  const [showGmailGuide, setShowGmailGuide] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Test Email State
  const [testRecipient, setTestRecipient] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  // Authentication Check & Load Settings
  useEffect(() => {
    const session = localStorage.getItem('bmd_session');
    if (session !== 'authenticated') {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      
      // Load saved settings
      const saved = localStorage.getItem('allpaws_email_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse email settings from localStorage:', e);
        }
      }
      
      // Load language preference
      const savedLang = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
      if (savedLang) {
        setLang(savedLang);
      }

      // Load shelter settings from IndexedDB
      db.shelters.get(1).then((s) => {
        if (s) {
          setShelterName(s.name || '');
          setShelterWebsite(s.websiteUrl || '');
          setShelterEmailDe(s.emailDe || '');
          setShelterEmailLt(s.emailLt || '');
          setShelterPhone(s.phone || '');
          setShelterAddress(s.address || '');
          setShelterRegCode(s.regCode || '');
          setBankName(s.bankName || '');
          setBankIban(s.iban || '');
          setBankBic(s.bic || '');
          setDonationPurpose(s.donationPurposeDe || '');
          setPaypalEmail(s.paypalEmail || '');
        }
      });

      // Load features toggles from localStorage (falling back to APP_CONFIG defaults)
      const loadFeat = (key: string, defaultVal: boolean): boolean => {
        const saved = localStorage.getItem(`allpaws_feature_${key}`);
        return saved !== null ? saved === 'true' : defaultVal;
      };
      setFeatGallery(loadFeat('enableGallery', APP_CONFIG.features.enableGallery));
      setFeatGuide(loadFeat('enableGuide', APP_CONFIG.features.enableGuide));
      setFeatEmergency(loadFeat('enableEmergencyPage', APP_CONFIG.features.enableEmergencyPage));
      setFeatAboutUs(loadFeat('enableAboutUs', APP_CONFIG.features.enableAboutUs));
      setFeatNewsletter(loadFeat('enableNewsletter', APP_CONFIG.features.enableNewsletter));
      setFeatInquiries(loadFeat('enableInteractiveInquiryForm', APP_CONFIG.features.enableInteractiveInquiryForm));
      setFeatSponsorship(loadFeat('enableSponsorship', APP_CONFIG.features.enableSponsorship));
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center">
        <span className="w-8 h-8 border-4 border-brandpink-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  // Field validation
  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (settings.provider === 'resend') {
      if (!settings.resendApiKey.trim()) {
        newErrors.resendApiKey = lang === 'DE' ? 'API-Key wird benötigt.' : 'API raktas yra privalomas.';
      } else if (!settings.resendApiKey.trim().startsWith('re_')) {
        newErrors.resendApiKey = lang === 'DE' 
          ? 'Hinweis: Der API-Key sollte mit "re_" beginnen.' 
          : 'Pastaba: API raktas turėtų prasidėti „re_“.';
      }
      
      if (!settings.resendFrom.trim()) {
        newErrors.resendFrom = lang === 'DE' ? 'Absender-E-Mail wird benötigt.' : 'Siuntėjo el. paštas yra privalomas.';
      } else if (!emailRegex.test(settings.resendFrom.trim())) {
        newErrors.resendFrom = lang === 'DE' ? 'Ungültiges E-Mail-Format.' : 'Neteisingas el. pašto formatas.';
      }
    }

    if (settings.provider === 'smtp') {
      if (!settings.smtpHost.trim()) {
        newErrors.smtpHost = lang === 'DE' ? 'SMTP-Host wird benötigt.' : 'SMTP serveris yra privalomas.';
      } else if (settings.smtpHost.includes('://') || settings.smtpHost.includes(' ')) {
        newErrors.smtpHost = lang === 'DE' 
          ? 'Geben Sie nur den Hostnamen ein (z. B. smtp.gmail.com), ohne http://' 
          : 'Įveskite tik serverio adresą (pvz., smtp.gmail.com), be http://';
      }

      const port = parseInt(settings.smtpPort, 10);
      if (!settings.smtpPort.trim()) {
        newErrors.smtpPort = lang === 'DE' ? 'Port wird benötigt.' : 'Prievadas yra privalomas.';
      } else if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.smtpPort = lang === 'DE' 
          ? 'Port muss eine Zahl zwischen 1 und 65535 sein.' 
          : 'Prievadas turi būti skaičius nuo 1 iki 65535.';
      }

      if (!settings.smtpUser.trim()) {
        newErrors.smtpUser = lang === 'DE' ? 'Benutzername/E-Mail wird benötigt.' : 'Vartotojo vardas yra privalomas.';
      } else if (!emailRegex.test(settings.smtpUser.trim())) {
        newErrors.smtpUser = lang === 'DE' 
          ? 'Benutzername sollte eine E-Mail-Adresse sein.' 
          : 'Vartotojo vardas turėtų būti el. pašto adresas.';
      }

      if (!settings.smtpPass.trim()) {
        newErrors.smtpPass = lang === 'DE' ? 'Passwort/App-Passwort wird benötigt.' : 'Slaptažodis yra privalomas.';
      } else if (settings.smtpHost.includes('gmail') && settings.smtpPass.replace(/\s/g, '').length !== 16) {
        // Warning for Gmail users who might enter their personal password instead of app password
        newErrors.smtpPass = lang === 'DE'
          ? 'Hinweis: Gmail verlangt ein 16-stelliges App-Passwort (ohne Leerzeichen).'
          : 'Pastaba: „Gmail“ reikalauja 16 ženklų programos slaptažodžio.';
      }
    }

    setErrors(newErrors);
    // Filter warnings that don't block saving
    const criticalErrors = Object.keys(newErrors).filter(k => !newErrors[k].startsWith('Hinweis') && !newErrors[k].startsWith('Pastaba'));
    return criticalErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }
    
    localStorage.setItem('allpaws_email_settings', JSON.stringify(settings));
    setSaveSuccess(true);
    await logger.info('Settings', `E-Mail-Einstellungen gespeichert. Provider: ${settings.provider}`);
    
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleSaveShelter = async () => {
    try {
      await db.shelters.put({
        id: 1,
        name: shelterName.trim(),
        websiteUrl: shelterWebsite.trim(),
        emailDe: shelterEmailDe.trim(),
        emailLt: shelterEmailLt.trim(),
        phone: shelterPhone.trim(),
        address: shelterAddress.trim(),
        regCode: shelterRegCode.trim(),
        bankName: bankName.trim(),
        iban: bankIban.trim(),
        bic: bankBic.trim(),
        donationPurposeDe: donationPurpose.trim(),
        paypalEmail: paypalEmail.trim(),
        sync_pending: 1
      });
      setSaveSuccess(true);
      await logger.info('Settings', 'Vereins- und Bankdaten im Dashboard aktualisiert.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert('Fehler beim Speichern der Vereinsdaten: ' + e.message);
    }
  };

  const handleSaveFeatures = async () => {
    const saveFeat = (key: string, val: boolean) => {
      localStorage.setItem(`allpaws_feature_${key}`, String(val));
    };
    saveFeat('enableGallery', featGallery);
    saveFeat('enableGuide', featGuide);
    saveFeat('enableEmergencyPage', featEmergency);
    saveFeat('enableAboutUs', featAboutUs);
    saveFeat('enableNewsletter', featNewsletter);
    saveFeat('enableInteractiveInquiryForm', featInquiries);
    saveFeat('enableSponsorship', featSponsorship);

    setSaveSuccess(true);
    await logger.info('Settings', 'Feature-Aktivierungsflags im Dashboard aktualisiert.');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendTestMail = async () => {
    setTestError('');
    setTestStatus('idle');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!testRecipient.trim() || !emailRegex.test(testRecipient.trim())) {
      setTestError(lang === 'DE' ? 'Bitte gib eine gültige Empfänger-E-Mail ein.' : 'Įveskite galiojantį gavėjo el. pašto adresą.');
      setTestStatus('error');
      return;
    }

    if (!validateFields()) {
      setTestError(lang === 'DE' ? 'Bitte behebe zuerst die Validierungsfehler.' : 'Pirmiausia ištaisykite klaidas.');
      setTestStatus('error');
      return;
    }

    setTestStatus('loading');

    const authPass = localStorage.getItem('bmd_user_pass') || 'BMD2026';

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authPassword: authPass,
          settings,
          email: {
            to: testRecipient.trim(),
            subject: '🐾 AllPaws 2026 — Verbindungstest / Bandomasis laiškas',
            body: `Hallo! Dies ist eine Test-E-Mail von AllPaws 2026.\nDeine Verbindungseinstellungen (${settings.provider.toUpperCase()}) funktionieren einwandfrei! 🎉\n\nLabas! Tai bandomasis laiškas iš AllPaws 2026.\nTavo el. pašto nustatymai (${settings.provider.toUpperCase()}) veikia puikiai! 🎉`
          }
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setTestStatus('success');
        await logger.info('Settings', `Erfolgreicher Test-E-Mail-Versand an ${testRecipient}`);
      } else {
        setTestError(resData.error || 'Fehler beim Senden.');
        setTestStatus('error');
        await logger.error('Settings', `Fehlgeschlagener Test-E-Mail-Versand: ${resData.error}`);
      }
    } catch (e: any) {
      setTestError(e.message || 'Verbindungsfehler zum API-Endpunkt.');
      setTestStatus('error');
      await logger.error('Settings', `Netzwerkfehler beim Test-Mail-Versand: ${e.message}`);
    }
  };

  const text = {
    DE: {
      title: 'E-Mail & Server-Einstellungen',
      subtitle: 'Newsletter-Zustellung konfigurieren',
      providerLabel: 'Aktiver Versand-Provider',
      simulationLabel: 'Simulation (Lokal zum Testen)',
      resendLabel: 'Resend API (Entwickler)',
      smtpLabel: 'SMTP (Gmail, Eigener Server)',
      simulationDesc: 'E-Mails werden lokal simuliert. Keine echten E-Mails werden gesendet. Ideal zum gefahrlosen Testen von Kampagnen.',
      resendApiKey: 'Resend API-Key (Authorization Bearer Key)',
      resendFrom: 'Absender E-Mail-Adresse (from)',
      resendFromHelp: 'Diese Domain muss in deinem Resend-Dashboard verifiziert sein.',
      smtpHost: 'SMTP-Host (Serveradresse)',
      smtpPort: 'SMTP-Port',
      smtpUser: 'Benutzername / E-Mail',
      smtpPass: 'Passwort / App-Passwort',
      smtpPassHelp: 'Bei Gmail MUSS dies das 16-stellige App-Passwort sein.',
      smtpSecure: 'Sichere Verbindung (SSL/TLS aktivieren)',
      smtpPortHelp: 'Port 465 nutzt meist SSL/TLS. Port 587 nutzt STARTTLS.',
      saveBtn: 'Einstellungen speichern',
      savedMsg: 'Einstellungen erfolgreich gespeichert! ✅',
      testTitle: 'Verbindung testen',
      testPlaceholder: 'Empfänger E-Mail-Adresse',
      testBtn: 'Test-Mail senden',
      testSuccess: 'Test-Mail erfolgreich versendet! Überprüfe dein Postfach. 🎉',
      gmailGuideTitle: 'Gmail Einrichtungshilfe (Schritt für Schritt)',
    },
    LT: {
      title: 'El. pašto ir serverio nustatymai',
      subtitle: 'Naujienlaiškių siuntimo konfigūravimas',
      providerLabel: 'Aktyvus siuntimo teikėjas',
      simulationLabel: 'Simuliacija (vietinis testavimas)',
      resendLabel: 'Resend API (kūrėjams)',
      smtpLabel: 'SMTP (Gmail, asmeninis serveris)',
      simulationDesc: 'El. laiškai yra tik simuliuojami. Tikri laiškai nebus siunčiami. Puikiai tinka išbandyti programėlę.',
      resendApiKey: 'Resend API raktas (Authorization Bearer Key)',
      resendFrom: 'Siuntėjo el. pašto adresas (from)',
      resendFromHelp: 'Šis domenas turi būti patvirtintas jūsų Resend paskyroje.',
      smtpHost: 'SMTP serveris (adresas)',
      smtpPort: 'SMTP prievadas (Port)',
      smtpUser: 'Vartotojo vardas / El. paštas',
      smtpPass: 'Slaptažodis / Programos slaptažodis',
      smtpPassHelp: 'Naudojant „Gmail“, čia PRIVALO būti 16 ženklų programos slaptažodis.',
      smtpSecure: 'Saugus ryšys (įjungti SSL/TLS)',
      smtpPortHelp: 'Prievadas 465 dažniausiai naudoja SSL/TLS. Prievadas 587 naudoja STARTTLS.',
      saveBtn: 'Išsaugoti nustatymus',
      savedMsg: 'Nustatymai sėkmingai išsaugoti! ✅',
      testTitle: 'Išbandyti ryšį',
      testPlaceholder: 'Gavėjo el. pašto adresas',
      testBtn: 'Siųsti bandomąjį laišką',
      testSuccess: 'Bandomasis laiškas išsiųstas! Patikrinkite pašto dėžutę. 🎉',
      gmailGuideTitle: 'Gmail nustatymo instrukcija (žingsnis po žingsnio)',
    }
  }[lang];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="px-4 py-4 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-stone-850">{text.title}</h1>
            <p className="text-[10px] text-stone-500">{text.subtitle}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            const nextLang = lang === 'DE' ? 'LT' : 'DE';
            setLang(nextLang);
            localStorage.setItem('bmd_lang', nextLang);
          }}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors border border-stone-200 shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-stone-500" />
          <span>{lang}</span>
        </button>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Settings Tab Switcher */}
        <div className="bg-white border border-stone-200 p-1 rounded-xl flex space-x-1 shadow-sm">
          <button
            onClick={() => setSettingsTab('email')}
            className={`flex-1 py-2 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              settingsTab === 'email'
                ? 'bg-brandpink-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {lang === 'DE' ? '📧 E-Mail / SMTP' : '📧 El. paštas'}
          </button>
          <button
            onClick={() => setSettingsTab('shelter')}
            className={`flex-1 py-2 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              settingsTab === 'shelter'
                ? 'bg-brandpink-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {lang === 'DE' ? '🏡 Vereinsdaten' : '🏡 Prieglaudos duomenys'}
          </button>
          <button
            onClick={() => setSettingsTab('features')}
            className={`flex-1 py-2 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              settingsTab === 'features'
                ? 'bg-brandpink-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {lang === 'DE' ? '⚙️ Features' : '⚙️ Funkcijos'}
          </button>
        </div>

        {/* EMAIL SETTINGS TAB */}
        {settingsTab === 'email' && (
          <>
            {/* Settings Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
                <Settings2 className="w-5 h-5 text-brandpink-600" />
                <h2 className="text-sm font-bold text-stone-800">{lang === 'DE' ? 'Versandeinstellungen' : 'Siuntimo nustatymai'}</h2>
              </div>

              {/* Provider Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">{text.providerLabel}</label>
                <select
                  value={settings.provider}
                  onChange={e => {
                    setSettings(prev => ({ ...prev, provider: e.target.value as any }));
                    setErrors({});
                  }}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brandpink-500 bg-white"
                >
                  <option value="simulation">{text.simulationLabel}</option>
                  <option value="resend">{text.resendLabel}</option>
                  <option value="smtp">{text.smtpLabel}</option>
                </select>
              </div>

              {/* SIMULATION DESC */}
              {settings.provider === 'simulation' && (
                <div className="p-3.5 bg-brandpink-50/50 border border-brandpink-100 rounded-xl text-xs text-stone-600 leading-relaxed font-light">
                  🐾 {text.simulationDesc}
                </div>
              )}

              {/* RESEND FIELDS */}
              {settings.provider === 'resend' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">{text.resendApiKey}</label>
                    <input
                      type="password"
                      placeholder="re_123456789..."
                      value={settings.resendApiKey}
                      onChange={e => setSettings(prev => ({ ...prev, resendApiKey: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none ${
                        errors.resendApiKey ? 'border-amber-500 focus:border-amber-500' : 'border-stone-300 focus:border-brandpink-500'
                      }`}
                    />
                    {errors.resendApiKey && (
                      <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.resendApiKey}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">{text.resendFrom}</label>
                    <input
                      type="email"
                      placeholder="newsletter@deine-domain.lt"
                      value={settings.resendFrom}
                      onChange={e => setSettings(prev => ({ ...prev, resendFrom: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brandpink-500"
                    />
                    <p className="text-[10px] text-stone-400 font-light mt-0.5">{text.resendFromHelp}</p>
                    {errors.resendFrom && (
                      <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.resendFrom}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* SMTP FIELDS */}
              {settings.provider === 'smtp' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-stone-700">{text.smtpHost}</label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com"
                        value={settings.smtpHost}
                        onChange={e => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brandpink-500"
                      />
                      {errors.smtpHost && (
                        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.smtpHost}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-700">{text.smtpPort}</label>
                      <input
                        type="text"
                        placeholder="465"
                        value={settings.smtpPort}
                        onChange={e => setSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brandpink-500 text-center"
                      />
                      {errors.smtpPort && (
                        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.smtpPort}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">{text.smtpUser}</label>
                    <input
                      type="text"
                      placeholder="dein-name@gmail.com"
                      value={settings.smtpUser}
                      onChange={e => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brandpink-500"
                    />
                    {errors.smtpUser && (
                      <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.smtpUser}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700">{text.smtpPass}</label>
                    <input
                      type="password"
                      placeholder="App-Passwort eingeben"
                      value={settings.smtpPass}
                      onChange={e => setSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none ${
                        errors.smtpPass?.startsWith('Pastaba') || errors.smtpPass?.startsWith('Hinweis') 
                          ? 'border-amber-500 focus:border-amber-500' 
                          : 'border-stone-300 focus:border-brandpink-500'
                      }`}
                    />
                    <p className="text-[10px] text-stone-400 font-light mt-0.5">{text.smtpPassHelp}</p>
                    {errors.smtpPass && (
                      <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.smtpPass}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="smtpSecure"
                      checked={settings.smtpSecure}
                      onChange={e => setSettings(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                      className="rounded border-stone-300 text-brandpink-600 focus:ring-brandpink-500"
                    />
                    <label htmlFor="smtpSecure" className="text-xs font-semibold text-stone-700 select-none">
                      {text.smtpSecure}
                    </label>
                  </div>
                  <p className="text-[10px] text-stone-400 font-light leading-relaxed">{text.smtpPortHelp}</p>

                  {/* GMAIL GUIDE ACCORDION */}
                  {settings.smtpHost.toLowerCase().includes('gmail') && (
                    <div className="border border-stone-200 rounded-xl overflow-hidden mt-2 bg-stone-50">
                      <button
                        type="button"
                        onClick={() => setShowGmailGuide(!showGmailGuide)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-150 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-brandpink-600" />
                          {text.gmailGuideTitle}
                        </span>
                        {showGmailGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      {showGmailGuide && (
                        <div className="p-3.5 text-[11px] text-stone-600 space-y-2 border-t border-stone-250 leading-relaxed font-light bg-white">
                          {lang === 'DE' ? (
                            <>
                              <p className="font-semibold text-brandpink-800">Da Google direkte Anmeldungen blockiert, musst du ein App-Passwort generieren:</p>
                              <ol className="list-decimal pl-4 space-y-1">
                                <li>Öffne dein Google-Konto unter <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-brandpink-650 underline font-semibold">myaccount.google.com</a>.</li>
                                <li>Klicke links auf <span className="font-semibold">Sicherheit</span>.</li>
                                <li>Stelle sicher, dass die <span className="font-semibold">Bestätigung in zwei Schritten</span> aktiviert ist.</li>
                                <li>Suche im oberen Suchfeld nach <span className="font-semibold">"App-Passwörter"</span> oder rufe es in der Sicherheits-Rubrik auf.</li>
                                <li>Wähle App: <span className="font-semibold">E-Mail</span> und Gerät: <span className="font-semibold">Andere</span> (gib z.B. "AllPaws 2026" ein).</li>
                                <li>Klicke auf <span className="font-semibold">Generieren</span>.</li>
                                <li>Kopiere das generierte gelbe Passwort (<span className="font-semibold">16 Buchstaben</span>).</li>
                                <li>Füge dieses Passwort (ohne Leerzeichen) oben im Passwortfeld ein und wähle oben <span className="font-semibold">Port 465</span> und aktiviere das <span className="font-semibold">SSL/TLS-Häkchen</span>.</li>
                              </ol>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-brandpink-800">Kadangi „Google“ blokuoja tiesioginį prisijungimą, turite sukurti programos slaptažodį:</p>
                              <ol className="list-decimal pl-4 space-y-1">
                                <li>Atidarykite „Google“ paskyrą adresu <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-brandpink-650 underline font-semibold">myaccount.google.com</a>.</li>
                                <li>Kairėje pasirinkite <span className="font-semibold">Sauga (Security)</span>.</li>
                                <li>Įsitikinkite, kad įjungtas <span className="font-semibold">Patvirtinimas dviem veiksmais</span>.</li>
                                <li>Viršutiniame paieškos laukelyje įveskite <span className="font-semibold">„Programų slaptažodžiai“ (App Passwords)</span>.</li>
                                <li>Pasirinkite programą: <span className="font-semibold">El. paštas</span> ir įrenginį: <span className="font-semibold">Kita</span> (įveskite pvz., „AllPaws 2026“).</li>
                                <li>Bakstelėkite <span className="font-semibold">Generuoti</span>.</li>
                                <li>Nukopijuokite sugeneruotą slaptažodį (<span className="font-semibold">16 geltonų raidžių</span>).</li>
                                <li>Įklijuokite jį aukščiau be tarpų, pasirinkite prievadą <span className="font-semibold">465</span> bei įjunkite <span className="font-semibold">SSL/TLS varnelę</span>.</li>
                              </ol>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SAVE BUTTON */}
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center space-x-1.5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{text.saveBtn}</span>
              </button>
              
              {saveSuccess && (
                <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  {text.savedMsg}
                </p>
              )}
            </div>

            {/* Test Connection Card */}
            {settings.provider !== 'simulation' && (
              <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm font-bold text-stone-800">{text.testTitle}</h2>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder={text.testPlaceholder}
                    value={testRecipient}
                    onChange={e => { setTestRecipient(e.target.value); setTestStatus('idle'); setTestError(''); }}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:border-brandpink-500"
                  />
                  <button
                    onClick={handleSendTestMail}
                    disabled={testStatus === 'loading'}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-55"
                  >
                    {testStatus === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{text.testBtn}</span>
                  </button>
                </div>

                {testError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-normal flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{lang === 'DE' ? 'Verbindung fehlgeschlagen:' : 'Ryšys nepavyko:'}</span>{' '}
                      {testError}
                    </div>
                  </div>
                )}

                {testStatus === 'success' && (
                  <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {text.testSuccess}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* SHELTER SETTINGS TAB */}
        {settingsTab === 'shelter' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <Settings2 className="w-5 h-5 text-brandpink-600" />
              <h2 className="text-sm font-bold text-stone-850">
                {lang === 'DE' ? 'Vereins- & Bankdaten bearbeiten' : 'Prieglaudos ir banko duomenys'}
              </h2>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-800 text-xs font-medium flex items-center space-x-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'DE' ? 'Erfolgreich gespeichert! ✅' : 'Nustatymai sėkmingai išsaugoti! ✅'}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  {lang === 'DE' ? 'Name des Vereins' : 'Prieglaudos pavadinimas'}
                </label>
                <input
                  type="text"
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'E-Mail (DE Support)' : 'El. paštas (Vokiečių k.)'}
                  </label>
                  <input
                    type="email"
                    value={shelterEmailDe}
                    onChange={(e) => setShelterEmailDe(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'E-Mail (LT Support)' : 'El. paštas (Lietuvių k.)'}
                  </label>
                  <input
                    type="email"
                    value={shelterEmailLt}
                    onChange={(e) => setShelterEmailLt(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'Telefon' : 'Telefonas'}
                  </label>
                  <input
                    type="text"
                    value={shelterPhone}
                    onChange={(e) => setShelterPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'Website URL' : 'Svetainės adresas'}
                  </label>
                  <input
                    type="text"
                    value={shelterWebsite}
                    onChange={(e) => setShelterWebsite(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  {lang === 'DE' ? 'Adresse des Heims' : 'Adresas'}
                </label>
                <input
                  type="text"
                  value={shelterAddress}
                  onChange={(e) => setShelterAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'Registrierungscode' : 'Įmonės kodas'}
                  </label>
                  <input
                    type="text"
                    value={shelterRegCode}
                    onChange={(e) => setShelterRegCode(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'PayPal E-Mail' : 'PayPal el. paštas'}
                  </label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                  />
                </div>
              </div>

              <div className="border-t border-stone-150 pt-3 space-y-3">
                <h3 className="text-xs font-bold text-stone-750">{lang === 'DE' ? 'Bankverbindung' : 'Banko sąskaita'}</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      {lang === 'DE' ? 'Bankname' : 'Banko pavadinimas'}
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      {lang === 'DE' ? 'BIC / SWIFT' : 'BIC / SWIFT'}
                    </label>
                    <input
                      type="text"
                      value={bankBic}
                      onChange={(e) => setBankBic(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'IBAN Kontonummer' : 'Sąskaitos numeris (IBAN)'}
                  </label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    {lang === 'DE' ? 'Verwendungszweck' : 'Paskirtis'}
                  </label>
                  <input
                    type="text"
                    value={donationPurpose}
                    onChange={(e) => setDonationPurpose(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brandpink-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveShelter}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-brandpink-600 hover:bg-brandpink-500 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'DE' ? 'Daten speichern' : 'Išsaugoti rekvizitus'}</span>
            </button>
          </div>
        )}

        {/* FEATURES CONFIG TAB */}
        {settingsTab === 'features' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <Settings2 className="w-5 h-5 text-brandpink-600" />
              <h2 className="text-sm font-bold text-stone-850">
                {lang === 'DE' ? 'Features & Seiten aktivieren' : 'Funkcijų valdymas'}
              </h2>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-800 text-xs font-medium flex items-center space-x-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'DE' ? 'Erfolgreich gespeichert! ✅' : 'Nustatymai sėkmingai išsaugoti! ✅'}</span>
              </div>
            )}

            <p className="text-[10px] text-stone-500 leading-relaxed font-light">
              {lang === 'DE'
                ? 'Schalte Bereiche und Seiten der App aus, falls dein Verein sie nicht benötigt. Menülinks und Home-CTAs passen sich automatisch an.'
                : 'Išjunkite nereikalingas programėlės skiltis. Nuorodos ir meniu paslėpiami automatiškai.'}
            </p>

            <div className="space-y-2 pt-1.5">
              {[
                { state: featGallery, setState: setFeatGallery, labelDe: 'Tier-Galerie (/tiere)', labelLt: 'Gyvūnų galerija (/tiere)' },
                { state: featGuide, setState: setFeatGuide, labelDe: 'Ratgeber & FAQ (/ratgeber)', labelLt: 'Gidas ir DUK (/ratgeber)' },
                { state: featEmergency, setState: setFeatEmergency, labelDe: 'Notfall-Hilfe (/notfall)', labelLt: 'Skubi pagalba (/notfall)' },
                { state: featAboutUs, setState: setFeatAboutUs, labelDe: 'Über Uns & Spenden (/ueber-uns)', labelLt: 'Apie mus ir parama (/ueber-uns)' },
                { state: featNewsletter, setState: setFeatNewsletter, labelDe: 'Newsletter-Kampagnen', labelLt: 'Naujienlaiškių siuntimas' },
                { state: featInquiries, setState: setFeatInquiries, labelDe: 'Interaktive Adoptionsformulare (Selbstauskunft)', labelLt: 'Interaktyvios įvaikinimo anketos' },
                { state: featSponsorship, setState: setFeatSponsorship, labelDe: 'Patenschaften (Bankverbindung bei Tieren)', labelLt: 'Rėmimas (banko rekvizitai)' },
              ].map(({ state, setState, labelDe, labelLt }, idx) => (
                <label key={idx} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200 hover:border-brandpink-300 transition-colors cursor-pointer select-none">
                  <span className="text-xs font-semibold text-stone-700">{lang === 'DE' ? labelDe : labelLt}</span>
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => setState(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-brandpink-600 focus:ring-brandpink-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={handleSaveFeatures}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-brandpink-600 hover:bg-brandpink-500 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'DE' ? 'Feature-Flags speichern' : 'Išsaugoti funkcijų nustatymus'}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
