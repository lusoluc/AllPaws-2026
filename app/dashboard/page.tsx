'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Animal, formatAge } from '@/lib/db';
import { logger } from '@/lib/logger';
import { syncWithCloud } from '@/lib/syncManager';
import SharePanel from '@/components/SharePanel';
// ... existing lucide-react imports ...
import { 
  Plus, 
  MapPin, 
  Search, 
  ShieldAlert, 
  LogOut, 
  Eye, 
  Bookmark, 
  CheckCircle,
  HelpCircle,
  Activity,
  Globe, 
  Share2,
  Cloud,
  CloudOff,
  Video,
  Mail,
  Settings
} from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');
  const [selectedShareAnimal, setSelectedShareAnimal] = useState<Animal | null>(null);

  // Simple Auth Check
  useEffect(() => {
    const session = localStorage.getItem('bmd_session');
    if (session !== 'authenticated') {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      const devMode = localStorage.getItem('bmd_dev_mode') === 'true';
      setIsDev(devMode);
      
      const savedLang = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
      if (savedLang && (savedLang === 'DE' || savedLang === 'LT')) {
        setLang(savedLang);
      }

      logger.info('Dashboard', `Benutzer hat das Mitarbeiter-Dashboard aufgerufen (Entwickler-Modus: ${devMode}).`);
      
      // Trigger synchronization
      syncWithCloud().catch((err) => {
        console.error('Dashboard mount sync failed:', err);
      });
    }
  }, [router]);

  // Read items from Dexie db with live queries!
  const animals = useLiveQuery(() => db.animals.toArray());
  const shelter = useLiveQuery(() => db.shelters.limit(1).first());

  const handleLogout = async () => {
    await logger.info('Authentication', 'Mitarbeiter hat sich abgemeldet.');
    localStorage.removeItem('bmd_session');
    router.push('/login');
  };

  const handleShowRoute = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=55.787364,21.152453`, '_blank');
        },
        () => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=55.787364,21.152453`, '_blank');
        }
      );
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=55.787364,21.152453`, '_blank');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center">
        <span className="w-8 h-8 border-4 border-brandpink-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  // Filtering Logic
  const filteredAnimals = animals?.filter((animal) => {
    const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (animal.reason_for_shelter || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || animal.type === filterType;
    const matchesStatus = filterStatus === 'all' || animal.status_aktuell === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => (b.id || 0) - (a.id || 0));

  // UI dictionary
  const ui = {
    DE: {
      title: 'Intern',
      subtitle: 'Tiererfassung Klaipėda',
      addCat: 'Katze erfassen',
      routeBtn: 'Route zum Heim anzeigen',
      searchPlaceholder: 'Nach Name suchen...',
      all: 'Alle',
      cats: 'Katzen',
      dogs: 'Hunde',
      others: 'Andere',
      statusAll: 'Alle Status',
      statusAvailable: 'Zu vermitteln',
      statusReserved: 'Reserviert',
      statusAdopted: 'Vermittelt',
      totalAnimals: 'Gesamt erfasst',
      published: 'Veröffentlicht',
      emergency: 'Notfall / Sorgenfell',
      noAnimals: 'Keine Tiere erfasst. Starte mit der Erfassung!',
      male: 'Männlich',
      female: 'Weiblich',
      years: 'Jahre',
      viewPublic: 'Öffentliche Galerie',
      logout: 'Abmelden'
    },
    LT: {
      title: 'Internas',
      subtitle: 'Gyvūnų registracija Klaipėdoje',
      addCat: 'Registruoti katę',
      routeBtn: 'Rodyti maršrutą į prieglaudą',
      searchPlaceholder: 'Ieškoti pagal vardą...',
      all: 'Visi',
      cats: 'Katės',
      dogs: 'Šunys',
      others: 'Kiti',
      statusAll: 'Visos būsenos',
      statusAvailable: 'Ieško namų',
      statusReserved: 'Rezervuota',
      statusAdopted: 'Dovanota',
      totalAnimals: 'Iš viso užregistruota',
      published: 'Viešinama',
      emergency: 'Ypatingas dėmesys',
      noAnimals: 'Gyvūnų nerasta. Pradėkite registraciją!',
      male: 'Patinas',
      female: 'Patelė',
      years: 'metai',
      viewPublic: 'Vieša galerija',
      logout: 'Atsijungti'
    }
  }[lang];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="px-4 py-4 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-brandpink-600 flex items-center justify-center">
            <CatHeartLogo className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-stone-850">{ui.title}</h1>
            <p className="text-[10px] text-stone-500">{shelter?.name || 'VšĮ "Būk mano draugas"'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* System Logs / Bug Tracker Icon */}
          {isDev && (
            <Link
              href="/dashboard/logs"
              className="p-1.5 rounded-lg bg-white hover:bg-stone-50 text-amber-600 hover:text-amber-500 transition-colors border border-stone-200 shadow-sm flex items-center"
              title="Systemprotokolle / Bug Tracker"
            >
              <ShieldAlert className="w-4 h-4" />
            </Link>
          )}

          {/* E-Mail & Server-Einstellungen */}
          <Link
            href="/dashboard/settings"
            className="p-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors border border-stone-200 shadow-sm flex items-center"
            title={lang === 'DE' ? 'E-Mail & Server-Einstellungen' : 'El. pašto ir serverio nustatymai'}
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Language Selector */}
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
          
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-red-50 text-red-650 hover:bg-red-100 transition-colors border border-red-200"
            title={ui.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Info Stats bar */}
      <div className="p-4 bg-stone-100/50 border-b border-stone-200 grid grid-cols-3 gap-2 text-center">
        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-sm">
          <div className="text-[10px] text-stone-500 font-semibold">{ui.totalAnimals}</div>
          <div className="text-xl font-extrabold text-stone-850 mt-0.5">{animals?.length || 0}</div>
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-sm">
          <div className="text-[10px] text-stone-500 font-semibold">{ui.published}</div>
          <div className="text-xl font-extrabold text-brandpink-600 mt-0.5">
            {animals?.filter(a => a.is_published).length || 0}
          </div>
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-sm">
          <div className="text-[10px] text-stone-500 font-semibold">Notfälle</div>
          <div className="text-xl font-extrabold text-red-600 mt-0.5">
            {animals?.filter(a => a.is_emergency).length || 0}
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Navigation CTAs */}
        <div className="flex flex-col gap-2">
          <Link 
            href="/dashboard/create"
            className="flex items-center justify-center space-x-2 py-3.5 bg-brandpink-600 hover:bg-brandpink-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all w-full text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>{ui.addCat}</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShowRoute}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 shadow-sm transition-colors"
            >
              <MapPin className="w-4 h-4 text-brandpink-700" />
              <span>Route zeigen</span>
            </button>
            
            <Link
              href="/katzen"
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 shadow-sm transition-colors text-center"
            >
              <Eye className="w-4 h-4 text-brandpink-600" />
              <span>{ui.viewPublic}</span>
            </Link>
          </div>

          <Link
            href="/dashboard/newsletter"
            className="flex items-center justify-center space-x-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 shadow-sm transition-colors w-full"
          >
            <Mail className="w-4 h-4 text-amber-600" />
            <span>{lang === 'DE' ? 'Newsletter-Zentrale' : 'Naujienlaiškių centras'}</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={ui.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 transition-colors text-sm"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1">
            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-brandpink-500 shadow-sm"
            >
              <option value="all">{ui.all}</option>
              <option value="Katze">{ui.cats}</option>
              <option value="Hund">{ui.dogs}</option>
              <option value="Andere">{ui.others}</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-brandpink-500 shadow-sm"
            >
              <option value="all">{ui.statusAll}</option>
              <option value="zu vermitteln">{ui.statusAvailable}</option>
              <option value="reserviert">{ui.statusReserved}</option>
              <option value="vermittelt">{ui.statusAdopted}</option>
            </select>
          </div>
        </div>

        {/* List of Animals */}
        <div className="space-y-3">
          {filteredAnimals && filteredAnimals.length > 0 ? (
            filteredAnimals.map((animal) => {
              const statusColors = {
                'zu vermitteln': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'reserviert': 'bg-amber-50 text-amber-700 border-amber-200',
                'vermittelt': 'bg-stone-100 text-stone-500 border-stone-200'
              }[animal.status_aktuell];

              const statusText = {
                'zu vermitteln': ui.statusAvailable,
                'reserviert': ui.statusReserved,
                'vermittelt': ui.statusAdopted
              }[animal.status_aktuell];

              return (
                <div 
                  key={animal.id}
                  onClick={() => router.push(`/dashboard/edit/${animal.id}`)}
                  className="bg-white border border-stone-200/80 rounded-xl p-4 flex items-center space-x-4 hover:border-stone-300 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer shadow-sm select-none"
                >
                  {/* Photo/Video Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {(() => {
                      const firstPhoto = animal.media_urls?.[0];
                      let firstVideo: string | null = null;
                      if (animal.video_urls?.[0]) {
                        firstVideo = animal.video_urls[0];
                      } else if (animal.local_videos?.[0] && animal.local_videos[0].blob) {
                        try {
                          firstVideo = URL.createObjectURL(animal.local_videos[0].blob);
                        } catch (e) {
                          // Safe fallback in case URL.createObjectURL is not available in Node environment
                        }
                      }
                      const firstMediaUrl = firstPhoto || firstVideo;
                      const hasVideo = (animal.video_urls && animal.video_urls.length > 0) || (animal.local_videos && animal.local_videos.length > 0);

                      return (
                        <>
                          {firstPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={firstPhoto} 
                              alt={animal.name}
                              className="w-full h-full object-cover" 
                            />
                          ) : firstVideo ? (
                            <video 
                              src={firstVideo} 
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-stone-400">
                              <HelpCircle className="w-5 h-5 mb-0.5" />
                              <span className="text-[8px] uppercase font-bold tracking-wider text-center leading-none">Keine Medien</span>
                            </div>
                          )}

                          {/* Video Indicator Badge */}
                          {hasVideo && (
                            <span className="absolute bottom-0.5 left-0.5 p-0.5 rounded bg-stone-900/60 text-white shadow-sm flex items-center justify-center shadow-sm" title="Video vorhanden">
                              <Video className="w-2.5 h-2.5" />
                            </span>
                          )}

                          {/* Sync Status Badge */}
                          {firstMediaUrl && (
                            <div className="absolute bottom-0.5 right-0.5 select-none">
                              {firstMediaUrl.startsWith('data:') || firstMediaUrl.startsWith('blob:') ? (
                                <span className="p-0.5 rounded bg-amber-50/95 border border-amber-200 text-amber-700 shadow-sm flex items-center justify-center" title="Nur lokal gespeichert">
                                  <CloudOff className="w-2.5 h-2.5" />
                                </span>
                              ) : (
                                <span className="p-0.5 rounded bg-emerald-50/95 border border-emerald-250 text-emerald-700 shadow-sm flex items-center justify-center" title="Online synchronisiert">
                                  <Cloud className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-bold text-sm text-stone-850 truncate">{animal.name}</h3>
                      {animal.is_emergency && (
                        <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 text-[8px] font-bold tracking-wider uppercase">
                          SOS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {animal.gender === 'Weiblich' ? ui.female : ui.male} • {formatAge(animal, lang)}
                    </p>
                    {animal.room_name && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        📍 {animal.room_name}{animal.cage_name ? ` • Box ${animal.cage_name}` : ''}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusColors}`}>
                          {statusText}
                        </span>
                        
                        {animal.is_published ? (
                          <span className="flex items-center text-[10px] text-brandpink-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5 mr-0.5" />
                            {ui.published}
                          </span>
                        ) : (
                          <span className="flex items-center text-[10px] text-stone-400 font-medium">
                            <Activity className="w-3.5 h-3.5 mr-0.5" />
                            Entwurf
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShareAnimal(animal);
                        }}
                        className="p-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-colors border border-stone-200 shadow-sm"
                        title="Teilen"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center bg-stone-50/50 border border-dashed border-stone-250 rounded-2xl">
              <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-sm text-stone-500">{ui.noAnimals}</p>
            </div>
          )}
        </div>
      </main>

      {selectedShareAnimal && (
        <SharePanel 
          animal={selectedShareAnimal} 
          onClose={() => setSelectedShareAnimal(null)} 
        />
      )}
    </div>
  );
}
