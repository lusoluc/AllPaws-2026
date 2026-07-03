'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { APP_CONFIG } from '@/lib/appConfig';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Mail, 
  Info,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  ArrowLeft,
  Search,
  Eye,
  Heart
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export default function NotfallPage() {
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');

  // Load language from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
    if (saved && (saved === 'DE' || saved === 'LT')) {
      setLang(saved);
    }
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('bmd_lang', lang);
  }, [lang]);

  if (!APP_CONFIG.features.enableEmergencyPage) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
        <PublicHeader lang={lang} setLang={setLang} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-500 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">
            {lang === 'DE' ? 'Bereich nicht aktiv' : 'Ši skiltis neaktyvi'}
          </h1>
          <p className="text-xs text-stone-500 max-w-sm">
            {lang === 'DE' 
              ? 'Diese Seite wurde vom Administrator deaktiviert.' 
              : 'Šį puslapį administratorius išjungė.'}
          </p>
          <NextLink href="/" className="inline-block px-4 py-2 bg-brandpink-600 hover:bg-brandpink-500 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer">
            {lang === 'DE' ? 'Zur Startseite' : 'Į pagrindinį'}
          </NextLink>
        </main>
      </div>
    );
  }

  const shelter = useLiveQuery(() => db.shelters.limit(1).first());

  const ui = {
    DE: {
      title: 'Tierschutz-Notfall & Leitfaden 🚨',
      subtitle: 'Was tun im Ernstfall? Hier findest du schnelle Hilfe und Kontaktadressen.',
      section1Title: '1. Haustier vermisst 🔍',
      section1Desc: 'Dein geliebtes Tier ist entlaufen? Verliere keine Zeit:',
      section1Step1: 'Melde den Verlust sofort bei Haustierregistern (wie TASSO e.V. oder FINDEFIX).',
      section1Step2: 'Informiere uns im Tierheim mit Foto, Chipnummer und Verlustort.',
      section1Step3: 'Hänge Suchplakate in der Nachbarschaft auf und suche zu ruhigen Zeiten (nachts).',
      section2Title: '2. Haustier gefunden 🐾',
      section2Desc: 'Du hast ein herrenloses Tier entdeckt? So verhältst du dich richtig:',
      section2Step1: 'Sichere das Tier vorsichtig (nur wenn gefahrlos möglich).',
      section2Step2: 'Lass bei einem Tierarzt oder bei uns den Mikrochip auslesen (kostenlos).',
      section2Step3: 'Melde das Fundtier offiziell bei der Gemeinde/Polizei (Fundrecht).',
      section3Title: '3. Wildtier in Not 🦆',
      section3Desc: 'Verletzte Vögel, Igel oder Eichhörnchen gefunden?',
      section3Step1: 'Beobachte das Tier mit Abstand – oft sind Jungtiere nicht verlassen.',
      section3Step2: 'Füttere Wildtiere nicht eigenmächtig mit Kuhmilch oder ungeeigneter Nahrung.',
      section3Step3: 'Kontaktiere eine spezialisierte Wildvogel- oder Wildtierstation vor Ort.',
      section4Title: '4. Tierquälerei melden ⚖️',
      section4Desc: 'Du beobachtest Vernachlässigung oder Misshandlung?',
      section4Step1: 'Dokumentiere deine Beobachtungen (Datum, Uhrzeit, Ort, Fotos/Videos).',
      section4Step2: 'Sende uns die Details. Wir behandeln deine Meldung absolut vertraulich.',
      section4Step3: 'In akuten Notfällen alarmiere direkt die örtliche Polizei oder das Veterinäramt.',
      contactTitle: 'Schnellkontakt Tierheim',
      phone: 'Telefon',
      email: 'E-Mail',
      address: 'Adresse',
      footerText: '© 2026 VšĮ "Būk mano draugas". Kaukėnų g. 9, Glaudėnai, Litauen.',
      regCode: 'Registrierungscode'
    },
    LT: {
      title: 'Skubi pagalba ir instrukcijos 🚨',
      subtitle: 'Ką daryti skubiu atveju? Čia rasite naudingus patarimus ir kontaktus.',
      section1Title: '1. Dingo augintinis 🔍',
      section1Desc: 'Pabėgo jūsų mylimas šeimos narys? Negaiškite laiko:',
      section1Step1: 'Praneškite apie dingimą gyvūnų registrams bei vietinėms grupėms.',
      section1Step2: 'Atsiųskite mums informaciją su nuotrauka, čipo numeriu ir dingimo vieta.',
      section1Step3: 'Iškabinkite skelbimus kaimynystėje ir ieškokite ramiu paros metu (naktį).',
      section2Title: '2. Rastas gyvūnas 🐾',
      section2Desc: 'Radote pasiklydusį ar apleistą gyvūną? Kaip elgtis:',
      section2Step1: 'Atsargiai sugaukite gyvūną (tik jei tai saugu jūsų sveikatai).',
      section2Step2: 'Nuvežkite pas veterinarą arba pas mus, kad nemokamai nuskaitytų mikroschemą (čipą).',
      section2Step3: 'Oficialiai praneškite apie rastą gyvūną savivaldybei arba policijai.',
      section3Title: '3. Pagalba laukiniams gyvūnams 🦆',
      section3Desc: 'Radote sužeistą paukštį, ežį ar kitą laukinį gyvūną?',
      section3Step1: 'Stebėkite gyvūną iš tolo – dažnai jaunikliai nėra palikti vieni.',
      section3Step2: 'Savarankiškai nemaitinkite laukinių gyvūnų karvės pienu ar netinkamu maistu.',
      section3Step3: 'Kreipkitės į specializuotas laukinių gyvūnų globos tarnybas.',
      section4Title: '4. Pranešti apie žiaurų elgesį ⚖️',
      section4Desc: 'Praneškite apie kankinamą ar neprižiūrimą gyvūną?',
      section4Step1: 'Užfiksuokite pastebėjimus (data, laikas, vieta, nuotraukos/vaizdo įrašai).',
      section4Step2: 'Atsiųskite informaciją mums. Mes garantuojame visišką konfidencialumą.',
      section4Step3: 'Skubiais atvejais kreipkitės tiesiai į policiją arba Valstybinę maisto ir veterinarijos tarnybą.',
      contactTitle: 'Greitas susisiekimas su prieglauda',
      phone: 'Telefonas',
      email: 'El. paštas',
      address: 'Adresas',
      footerText: '© 2026 VšĮ „Būk mano draugas“. Kaukėnų g. 9, Glaudėnai, Lietuva.',
      regCode: 'Įmonės kodas'
    }
  }[lang];

  const currentShelterName = shelter?.name || APP_CONFIG.shelter.name;
  const currentShelterPhone = shelter?.phone || APP_CONFIG.shelter.phone;
  const currentShelterEmail = lang === 'DE' 
    ? (shelter?.emailDe || APP_CONFIG.shelter.emailDe) 
    : (shelter?.emailLt || APP_CONFIG.shelter.emailLt);
  const currentShelterAddress = shelter?.address || APP_CONFIG.shelter.address;

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      <PublicHeader lang={lang} setLang={setLang} />

      <main className="flex-1 p-6 max-w-xl mx-auto w-full space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-stone-950 tracking-tight leading-tight">
            {ui.title}
          </h1>
          <p className="text-xs text-stone-600 font-light leading-relaxed">
            {ui.subtitle}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1: Vermisst */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/25 transition-colors">
            <h2 className="text-base font-bold text-stone-950 flex items-center space-x-2">
              <span>{ui.section1Title}</span>
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-light">{ui.section1Desc}</p>
            <ul className="text-xs text-stone-600 list-disc list-inside space-y-1.5 pl-1 leading-relaxed font-light">
              <li>{ui.section1Step1}</li>
              <li>{ui.section1Step2}</li>
              <li>{ui.section1Step3}</li>
            </ul>
          </div>

          {/* Section 2: Gefunden */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-sm hover:border-emerald-500/25 transition-colors">
            <h2 className="text-base font-bold text-stone-950 flex items-center space-x-2">
              <span>{ui.section2Title}</span>
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-light">{ui.section2Desc}</p>
            <ul className="text-xs text-stone-600 list-disc list-inside space-y-1.5 pl-1 leading-relaxed font-light">
              <li>{ui.section2Step1}</li>
              <li>{ui.section2Step2}</li>
              <li>{ui.section2Step3}</li>
            </ul>
          </div>

          {/* Section 3: Wildtier */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-sm hover:border-sky-500/25 transition-colors">
            <h2 className="text-base font-bold text-stone-950 flex items-center space-x-2">
              <span>{ui.section3Title}</span>
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-light">{ui.section3Desc}</p>
            <ul className="text-xs text-stone-600 list-disc list-inside space-y-1.5 pl-1 leading-relaxed font-light">
              <li>{ui.section3Step1}</li>
              <li>{ui.section3Step2}</li>
              <li>{ui.section3Step3}</li>
            </ul>
          </div>

          {/* Section 4: Tierquälerei */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-sm hover:border-rose-500/25 transition-colors">
            <h2 className="text-base font-bold text-rose-750 flex items-center space-x-2">
              <span>{ui.section4Title}</span>
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-light">{ui.section4Desc}</p>
            <ul className="text-xs text-stone-600 list-disc list-inside space-y-1.5 pl-1 leading-relaxed font-light">
              <li>{ui.section4Step1}</li>
              <li>{ui.section4Step2}</li>
              <li>{ui.section4Step3}</li>
            </ul>
          </div>
        </div>

        {/* Shelter Contact Board */}
        <div className="bg-stone-100 border border-stone-250 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-extrabold text-stone-900 tracking-wide uppercase">
            {ui.contactTitle}
          </h3>
          
          <div className="space-y-3 text-xs text-stone-750">
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[9px] text-stone-500 uppercase tracking-wider">{ui.address}</span>
                <span className="leading-relaxed font-light">{currentShelterAddress}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[9px] text-stone-500 uppercase tracking-wider">{ui.phone}</span>
                <a href={`tel:${currentShelterPhone}`} className="text-brandpink-600 hover:underline">{currentShelterPhone}</a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[9px] text-stone-500 uppercase tracking-wider">{ui.email}</span>
                <a href={`mailto:${currentShelterEmail}`} className="text-brandpink-600 hover:underline">{currentShelterEmail}</a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 text-center text-xs text-stone-500 bg-stone-100/60 mt-12">
        <p>{ui.footerText}</p>
        <p className="mt-1">{ui.regCode}: {shelter?.code || APP_CONFIG.shelter.code}</p>
      </footer>
    </div>
  );
}
