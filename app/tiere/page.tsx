'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Animal, formatAge } from '@/lib/db';
import SharePanel from '@/components/SharePanel';
import { syncWithCloud } from '@/lib/syncManager';
import { 
  Search, 
  MapPin, 
  Activity, 
  Filter, 
  HelpCircle,
  ShieldCheck,
  Globe,
  Share2,
  Cloud,
  CloudOff,
  Video
} from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';
import PublicHeader from '@/components/PublicHeader';
import { APP_CONFIG } from '@/lib/appConfig';

export default function PublicGalleryPage() {
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
    if (saved && (saved === 'DE' || saved === 'LT')) {
      setLang(saved);
    }
  }, []);

  // Save language to localStorage on change
  useEffect(() => {
    localStorage.setItem('bmd_lang', lang);
  }, [lang]);

  if (!APP_CONFIG.features.enableGallery) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
        <PublicHeader lang={lang} setLang={setLang} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-500 mx-auto">
            <HelpCircle className="w-8 h-8" />
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedShareAnimal, setSelectedShareAnimal] = useState<Animal | null>(null);

  // Sync with cloud on page mount
  useEffect(() => {
    syncWithCloud().catch((err) => {
      console.error('Gallery sync failed:', err);
    });
  }, []);

  // Query only published animals up for adoption
  const animals = useLiveQuery(() => 
    db.animals
      .filter(a => a.is_published && a.status_aktuell === 'zu vermitteln')
      .toArray()
  );

  const shelter = useLiveQuery(() => db.shelters.limit(1).first());

  // Filter Logic
  const filteredAnimals = animals?.filter((animal) => {
    const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (animal.reason_for_shelter || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = filterGender === 'all' || animal.gender === filterGender;
    const matchesType = filterType === 'all' || animal.type === filterType;
    
    let matchesAge = true;
    if (filterAge === 'young') {
      matchesAge = animal.age_years <= 1;
    } else if (filterAge === 'adult') {
      matchesAge = animal.age_years > 1 && animal.age_years <= 7;
    } else if (filterAge === 'senior') {
      matchesAge = animal.age_years > 7;
    }

    return matchesSearch && matchesGender && matchesAge && matchesType;
  });

  const ui = {
    DE: {
      title: 'Unsere Schützlinge suchen ein Zuhause 🏡',
      subtitle: 'Triff unsere liebevollen Tiere und finde deinen neuen Lebensgefährten',
      statsTiere: '148 glückliche Fellnasen vermittelt 🏡',
      statsGeld: '12.450 € für Tierarztkosten finanziert 🩺',
      searchPlaceholder: 'Tier suchen...',
      all: 'Alle',
      female: 'Weiblich',
      male: 'Männlich',
      allAges: 'Jedes Alter',
      young: 'Kitten/Jung (0-1 J.)',
      adult: 'Erwachsen (2-7 J.)',
      senior: 'Senior (8+ J.)',
      noCats: 'Aktuell suchen keine Tiere ein Zuhause, die den Filtern entsprechen.',
      detailsBtn: 'Profil ansehen',
      emergency: 'Sorgenfell / Dringend 🆘',
      shelterBadge: 'Būk mano draugas',
      years: 'Jahre',
      year: 'Jahr',
      typeLabel: 'Tierart',
      genderLabel: 'Geschlecht',
      ageLabel: 'Alter',
      cats: 'Katzen',
      dogs: 'Hunde',
      others: 'Andere',
      noMedia: 'Keine Medien',
      noDesc: 'Zurzeit liegt keine detaillierte Beschreibung vor. Klicke auf Details für Kontaktdaten.',
      regCode: 'Registrierungs-Code',
      shareTitle: 'Teilen'
    },
    LT: {
      title: 'Mūsų globotiniai ieško namų 🏡',
      subtitle: 'Susipažinkite su gyvūnais ir raskite ištikimą gyvenimo draugą',
      statsTiere: '148 sėkmingai rado namus 🏡',
      statsGeld: '12.450 € surinkta skubiam gydymui 🩺',
      searchPlaceholder: 'Ieškoti gyvūno...',
      all: 'Visi',
      female: 'Patelė',
      male: 'Patinas',
      allAges: 'Bet koks amžius',
      young: 'Jaunikliai (0-1 m.)',
      adult: 'Suaugę (2-7 m.)',
      senior: 'Senjorai (8+ m.)',
      noCats: 'Šiuo metu nėra gyvūnų, atitinkančių jūsų filtrus.',
      detailsBtn: 'Peržiūrėti profilį',
      emergency: 'Skubi pagalba 🆘',
      shelterBadge: 'Būk mano draugas',
      years: 'metai',
      year: 'metai',
      typeLabel: 'Rūšis',
      genderLabel: 'Lytis',
      ageLabel: 'Amžius',
      cats: 'Katės',
      dogs: 'Šunys',
      others: 'Kiti',
      noMedia: 'Nėra medijos',
      noDesc: 'Šiuo metu detalaus aprašymo nėra. Spustelėkite peržiūrėti profilį norėdami pamatyti kontaktus.',
      regCode: 'Registracijos kodas',
      shareTitle: 'Dalintis'
    }
  }[lang];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      
      {/* Public Header */}
      <PublicHeader lang={lang} setLang={setLang} />

      {/* Stats Board */}
      <div className="mx-4 mt-4 bg-white border border-stone-200 shadow-sm rounded-xl p-3 flex flex-col sm:flex-row justify-around items-center space-y-1 sm:space-y-0 text-xs text-stone-600">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-stone-800">{ui.statsTiere}</span>
        </div>
        <div className="hidden sm:block text-stone-300">|</div>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-brandpink-600" />
          <span className="font-medium text-stone-800">{ui.statsGeld}</span>
        </div>
      </div>

      {/* Hero Banner */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">{ui.title}</h1>
          <p className="text-xs text-stone-500 mt-1">{ui.subtitle}</p>
        </div>

        {/* Filters & Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={ui.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 transition-colors text-sm shadow-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">{ui.typeLabel}</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-2 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:border-brandpink-500 shadow-sm"
              >
                <option value="all">{ui.all}</option>
                <option value="Katze">{ui.cats}</option>
                <option value="Hund">{ui.dogs}</option>
                <option value="Andere">{ui.others}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">{ui.genderLabel}</label>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full px-2 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:border-brandpink-500 shadow-sm"
              >
                <option value="all">{ui.all}</option>
                <option value="Weiblich">{ui.female}</option>
                <option value="Männlich">{ui.male}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">{ui.ageLabel}</label>
              <select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                className="w-full px-2 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:border-brandpink-500 shadow-sm"
              >
                <option value="all">{ui.allAges}</option>
                <option value="young">{ui.young}</option>
                <option value="adult">{ui.adult}</option>
                <option value="senior">{ui.senior}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Animals Grid */}
        <div className="space-y-4 pt-2">
          {filteredAnimals && filteredAnimals.length > 0 ? (
            filteredAnimals.map((animal) => (
              <div 
                key={animal.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-stone-300 transition-all shadow-sm hover:shadow-md group flex flex-col"
              >
                {/* Photo Header */}
                <div className="aspect-[4/3] bg-stone-100 relative w-full overflow-hidden flex items-center justify-center border-b border-stone-100">
                  {(() => {
                    const firstPhoto = animal.media_urls?.[0];
                    const firstVideo = animal.video_urls?.[0] || (animal.local_videos?.[0] && animal.local_videos[0].blob ? URL.createObjectURL(animal.local_videos[0].blob) : null);
                    const firstMediaUrl = firstPhoto || firstVideo;
                    const hasVideo = (animal.video_urls && animal.video_urls.length > 0) || (animal.local_videos && animal.local_videos.length > 0);

                    return (
                      <>
                        {firstPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={firstPhoto} 
                            alt={animal.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : firstVideo ? (
                          <video 
                            src={firstVideo} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-stone-400">
                            <HelpCircle className="w-8 h-8 mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">{ui.noMedia}</span>
                          </div>
                        )}

                        {/* Video Indicator Badge */}
                        {hasVideo && (
                          <div className="absolute bottom-3 left-3 select-none">
                            <span className="p-1 rounded-md bg-stone-900/60 text-white shadow-sm flex items-center justify-center" title="Video vorhanden">
                              <Video className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        )}

                        {/* Sync Status Badge */}
                        {firstMediaUrl && (
                          <div className="absolute top-3 right-3 select-none">
                            {firstMediaUrl.startsWith('data:') || firstMediaUrl.startsWith('blob:') ? (
                              <span className="p-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 shadow-sm flex items-center justify-center" title="Nur lokal gespeichert">
                                <CloudOff className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="p-1 rounded-md bg-emerald-50 border border-emerald-250 text-emerald-700 shadow-sm flex items-center justify-center" title="Online synchronisiert">
                                <Cloud className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-1">
                    {animal.is_emergency && (
                      <span className="px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-extrabold tracking-wider uppercase shadow-sm">
                        {ui.emergency}
                      </span>
                    )}
                  </div>
                  
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-stone-900/70 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10 flex items-center">
                      <MapPin className="w-3 h-3 text-emerald-400 mr-1" />
                      {ui.shelterBadge}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-baseline mb-2">
                    <h2 className="text-xl font-bold text-stone-900 group-hover:text-brandpink-600 transition-colors">
                      {animal.name}
                    </h2>
                    <span className="text-xs text-stone-500">
                      {animal.gender === 'Weiblich' ? ui.female : ui.male} • {formatAge(animal, lang)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-3 mb-5 leading-relaxed flex-1">
                    {animal.reason_for_shelter || ui.noDesc}
                  </p>

                  <div className="flex space-x-2">
                    <NextLink
                      href={`/tiere/${animal.id}`}
                      className="flex-1 py-3 bg-brandpink-500 hover:bg-brandpink-600 text-white text-xs font-extrabold rounded-xl shadow-sm active:scale-98 transition-all flex items-center justify-center text-center"
                    >
                      <span>{ui.detailsBtn}</span>
                    </NextLink>
                    <button
                      onClick={() => setSelectedShareAnimal(animal)}
                      className="px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200 rounded-xl shadow-sm active:scale-98 transition-all flex items-center justify-center"
                      title={ui.shareTitle}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center bg-stone-100/50 border border-dashed border-stone-200 rounded-2xl">
              <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs text-stone-500">{ui.noCats}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 text-center text-xs text-stone-500 bg-stone-100/60 mt-12">
        <p>© 2026 VšĮ "Būk mano draugas". Kaukėnų g. 9, Glaudėnai, Litauen.</p>
        <p className="mt-1">{ui.regCode}: 302639996</p>
      </footer>

      {selectedShareAnimal && (
        <SharePanel 
          animal={selectedShareAnimal} 
          onClose={() => setSelectedShareAnimal(null)} 
        />
      )}
    </div>
  );
}
