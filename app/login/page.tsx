'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertTriangle, HelpCircle, Smartphone, Database, Wifi } from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';
import { logger } from '@/lib/logger';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [guideLang, setGuideLang] = useState<'DE' | 'LT'>('DE');

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
    if (saved && (saved === 'DE' || saved === 'LT')) {
      setGuideLang(saved);
    }
  }, []);

  // Save language to localStorage on change
  useEffect(() => {
    localStorage.setItem('bmd_lang', guideLang);
  }, [guideLang]);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate small latency for premium UI feel
    setTimeout(async () => {
      const securePassword = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'BMD2026';
      const devPassword = process.env.NEXT_PUBLIC_DEV_PASSWORD || 'DEVBMD2026';
      
      if (password === devPassword) {
        localStorage.setItem('bmd_session', 'authenticated');
        localStorage.setItem('bmd_dev_mode', 'true');
        localStorage.setItem('bmd_user_pass', password);
        await logger.info('Authentication', 'Erfolgreiche Anmeldung als Entwickler.');
        router.push('/dashboard');
      } else if (password === securePassword) {
        localStorage.setItem('bmd_session', 'authenticated');
        localStorage.setItem('bmd_dev_mode', 'false');
        localStorage.setItem('bmd_user_pass', password);
        await logger.info('Authentication', 'Erfolgreiche Anmeldung am Mitarbeiter-Dashboard.');
        router.push('/dashboard');
      } else {
        await logger.warn('Authentication', 'Fehlgeschlagene Anmeldung: Falsches Passwort eingegeben.');
        setError(guideLang === 'DE' ? 'Ungültiges Passwort. Bitte versuche es erneut.' : 'Neteisingas slaptažodis. Bandykite dar kartą.');
        setIsLoading(false);
      }
    }, 600);
  };

  const guide = {
    DE: {
      title: 'Wie funktioniert diese PWA-App? 🐾',
      intro: 'Hinter dieser App steckt kein großes IT-Unternehmen, sondern ehrenamtliche Katzenfreunde. Damit du auch im Tierheim ohne Empfang Tiere erfassen kannst, funktioniert die App komplett offline.',
      step1Title: '1. Auf dem Handy installieren (PWA)',
      step1Desc: 'Öffne die Seite im Browser. Auf Android tippe auf die drei Punkte ➔ „Zum Startbildschirm hinzufügen“. Auf dem iPhone tippe auf Teilen ➔ „Zum Home-Bildschirm“. Danach verhält sie sich wie eine normale App!',
      step2Title: '2. Offline-Erfassung vor Ort',
      step2Desc: 'Du kannst neue Katzen registrieren, Fotos hinzufügen oder Sprachnotizen aufnehmen, selbst wenn du komplett offline bist. Alle Daten bleiben sicher in deinem Browser gespeichert.',
      step3Title: '3. Automatische Cloud-Sync',
      step3Desc: 'Sobald du wieder Internet hast, werden alle Katzenprofile und Änderungen im Hintergrund mit unserer zentralen Supabase-Datenbank synchronisiert.',
      backBtn: '← Zurück zur Startseite'
    },
    LT: {
      title: 'Kaip veikia ši PWA programėlė? 🐾',
      intro: 'Šią programėlę sukūrė savanoriai kačių mylėtojai. Kad galėtumėte registruoti gyvūnus net ten, kur nėra ryšio, ši programėlė veikia visiškai be interneto.',
      step1Title: '1. Įdiegimas telefone (PWA)',
      step1Desc: 'Atidarykite svetainę naršyklėje. „Android“ įrenginyje bakstelėkite tris taškelius ➔ „Pridėti prie pagrindinio ekrano“. „iPhone“ telefone pasirinkite Bendrinti ➔ „Įtraukti į pagrindinį ekraną“.',
      step2Title: '2. Registravimas be interneto',
      step2Desc: 'Galite registruoti naujas kates, kelti nuotraukas ar įrašyti balso pastabas visiškai be ryšio. Duomenys saugiai lieka jūsų įrenginyje.',
      step3Title: '3. Automatinis sinchronizavimas',
      step3Desc: 'Kai telefonas vėl prisijungs prie interneto, visi įvesti profiliai fone bus automatiškai išsaugoti mūsų centrinėje „Supabase“ duomenų bazėje.',
      backBtn: '← Atgal į pagrindinį'
    }
  }[guideLang];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 justify-center items-center py-12 px-4 text-stone-900">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-brandpink-600 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(221,15,123,0.3)]">
          <CatHeartLogo className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-850">Būk mano draugas</h1>
        <p className="text-sm text-stone-500 mt-1">Interne Tiererfassung</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white border border-stone-200/80 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-stone-50 rounded-lg text-stone-600 border border-stone-100">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800">{guideLang === 'DE' ? 'Bereich gesichert' : 'Zona saugoma'}</h2>
            <p className="text-xs text-stone-500">{guideLang === 'DE' ? 'Bitte gib das Zugangspasswort ein.' : 'Įveskite prieigos slaptažodį.'}</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              {guideLang === 'DE' ? 'Passwort' : 'Slaptažodis'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={guideLang === 'DE' ? 'Passwort eingeben' : 'Įveskite slaptažodį'}
              className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 focus:ring-1 focus:ring-brandpink-500 transition-all text-base focus:ring-offset-0"
              required
            />
          </div>

          {error && (
            <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-brandpink-600 hover:bg-brandpink-500 disabled:bg-brandpink-850 text-white font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(221,15,123,0.15)] hover:shadow-[0_4px_20px_rgba(221,15,123,0.3)] active:scale-98 flex items-center justify-center text-sm"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{guideLang === 'DE' ? 'Prüfen...' : 'Tikrinama...'}</span>
              </span>
            ) : (
              guideLang === 'DE' ? 'Anmelden' : 'Prisijungti'
            )}
          </button>
        </form>
      </div>

      {/* Bilingual PWA User Guide */}
      <div className="w-full max-w-sm bg-white border border-stone-200/80 rounded-2xl p-6 mt-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-brandpink-600">
            <HelpCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Anleitung / Gidas</span>
          </div>
          <div className="flex space-x-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              onClick={() => setGuideLang('DE')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${guideLang === 'DE' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-850'}`}
            >
              DE
            </button>
            <button
              onClick={() => setGuideLang('LT')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${guideLang === 'LT' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-850'}`}
            >
              LT
            </button>
          </div>
        </div>

        <h3 className="text-sm font-bold text-stone-850 mb-2">{guide.title}</h3>
        <p className="text-xs text-stone-500 leading-relaxed mb-4">{guide.intro}</p>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-brandpink-600 mt-0.5">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-stone-700">{guide.step1Title}</h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{guide.step1Desc}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-brandpink-600 mt-0.5">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-stone-700">{guide.step2Title}</h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{guide.step2Desc}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-brandpink-600 mt-0.5">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-stone-700">{guide.step3Title}</h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{guide.step3Desc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => router.push('/')}
          className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          {guide.backBtn}
        </button>
      </div>
    </div>
  );
}
