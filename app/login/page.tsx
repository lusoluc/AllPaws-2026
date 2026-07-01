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
      const inputHash = await sha256(password);
      
      const secureHash = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD_HASH || '465e25744db058cd9ec63f6fe36a6e5c9fc66255dec9de88ef9981b33651bd9d';
      const devHash = process.env.NEXT_PUBLIC_DEV_PASSWORD_HASH || '6a02c4469c9b7c5975f09fb41584283959644f604ed7278c19d1e351277eb399';
      
      if (inputHash === devHash) {
        localStorage.setItem('bmd_session', 'authenticated');
        localStorage.setItem('bmd_dev_mode', 'true');
        localStorage.setItem('bmd_user_pass', password);
        await logger.info('Authentication', 'Erfolgreiche Anmeldung als Entwickler.');
        router.push('/dashboard');
      } else if (inputHash === secureHash) {
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

  async function sha256(message: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback to pure JS below
      }
    }
    return sha256Fallback(message);
  }

  function sha256Fallback(ascii: string): string {
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }
    
    const words: number[] = [];
    const asciiLength = ascii.length;
    const hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let i: number, j: number;
    for (i = 0; i < asciiLength; i++) {
      words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    }
    words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
    const maxWordIndex = ((asciiLength + 8) >> 6) * 16 + 15;
    while (words.length <= maxWordIndex) {
      words.push(0);
    }
    words[maxWordIndex] = asciiLength * 8;

    for (i = 0; i < words.length; i += 16) {
      const w = words.slice(i, i + 16);
      for (j = 16; j < 64; j++) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
      let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

      for (j = 0; j < 64; j++) {
        const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
        const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g; g = f; f = e;
        e = (d + temp1) | 0;
        d = c; c = b; b = a;
        a = (temp1 + temp2) | 0;
      }

      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
    }

    let result = '';
    for (i = 0; i < 8; i++) {
      result += (hash[i] >>> 0).toString(16).padStart(8, '0');
    }
    return result;
  }

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
