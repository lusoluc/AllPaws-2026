'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, HeartHandshake } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');

  useEffect(() => {
    const saved = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
    if (saved && (saved === 'DE' || saved === 'LT')) {
      setLang(saved);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      <PublicHeader lang={lang} setLang={setLang} />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-brandpink-50 border border-brandpink-200 flex items-center justify-center text-brandpink-600 shadow-sm mx-auto animate-bounce">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl font-black text-stone-850 tracking-tight">
            {lang === 'DE' ? 'Seite nicht gefunden (404)' : 'Puslapis nerastas (404)'}
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed font-normal">
            {lang === 'DE'
              ? 'Die angeforderte Seite existiert nicht oder das Tier wurde bereits in ein liebevolles Zuhause vermittelt.'
              : 'Ieškomas puslapis neegzistuoja arba gyvūnas jau surado mylinčius namus.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/tiere"
            className="px-5 py-3 bg-brandpink-600 hover:bg-brandpink-500 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>{lang === 'DE' ? 'Zur Tier-Galerie' : 'Į gyvūnų galeriją'}</span>
          </Link>
          <Link
            href="/"
            className="px-5 py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 active:scale-98 transition-all flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'DE' ? 'Zur Startseite' : 'Į pagrindinį'}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
