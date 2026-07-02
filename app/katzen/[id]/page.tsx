'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatAge } from '@/lib/db';
import { logger } from '@/lib/logger';
import PublicHeader from '@/components/PublicHeader';
import SharePanel from '@/components/SharePanel';
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Calendar, 
  Info,
  Check,
  X,
  Send,
  Coins,
  Globe,
  Sparkles,
  HelpCircle,
  Share2,
  Mail,
  Copy,
  AlertTriangle,
  Cloud,
  CloudOff,
  Video,
  Mic,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';

export default function CatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const catId = parseInt(resolvedParams.id);
  const router = useRouter();
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');
  const [isStaff, setIsStaff] = useState(false);

  // Load language and staff session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
    if (saved && (saved === 'DE' || saved === 'LT')) {
      setLang(saved);
    }
    const session = localStorage.getItem('bmd_session');
    if (session === 'authenticated') {
      setIsStaff(true);
    }
  }, []);

  // Save language to localStorage on change
  useEffect(() => {
    localStorage.setItem('bmd_lang', lang);
  }, [lang]);
  
  // State for image carousel
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [autoSwipeTick, setAutoSwipeTick] = useState(0);
  
  // State for simulated donation increment
  const [extraDonation, setExtraDonation] = useState(0);

  // Share States & Methods
  const [shareCopied, setShareCopied] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);

  const getShareText = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/katzen/${cat?.id}` : '';
    if (lang === 'DE') {
      return `Ich suche ein liebevolles Zuhause! Mein Name ist ${cat?.name}. Ich bin ${formatAge(cat, 'DE')} alt, ${cat?.gender === 'Weiblich' ? 'weiblich' : 'männlich'} und lebe im Tierheim "Būk mano draugas" in Litauen. Bitte teile mein Profil, damit mein Herzensmensch mich findet! 🐾 Link: ${url}`;
    } else {
      return `Ieškau mylinčių namų! Mano vardas ${cat?.name}. Man yra ${formatAge(cat, 'LT')}, esu ${cat?.gender === 'Weiblich' ? 'katė' : 'katinas'} ir šiuo metu gyvenu prieglaudoje „Būk mano draugas“. Prašau pasidalinti mano profiliu! 🐾 Nuoroda: ${url}`;
    }
  };

  const getShareUrl = () => {
    return typeof window !== 'undefined' ? `${window.location.origin}/katzen/${cat?.id}` : '';
  };

  const handleShareWhatsApp = () => {
    const text = getShareText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareInstagram = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text);
    setShareNotification(lang === 'DE' 
      ? 'Text & Link wurden kopiert! Du kannst sie jetzt in deiner Instagram Story oder Nachricht einfügen. 📸' 
      : 'Tekstas ir nuoroda nukopijuoti! Galite juos įklijuoti savo „Instagram“ istorijoje ar žinutėje. 📸'
    );
    setTimeout(() => setShareNotification(null), 5000);
  };

  const handleShareEmail = () => {
    const url = getShareUrl();
    const subject = lang === 'DE' ? `Adoptionsaufruf für Katze ${cat?.name}` : `Pagalba katei ${cat?.name}`;
    const body = getShareText();
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (typeof window !== 'undefined' && (window as any).mockLocationAssign) {
      (window as any).mockLocationAssign(mailtoUrl);
    } else {
      window.location.assign(mailtoUrl);
    }
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setShareNotification(lang === 'DE' ? 'Link in die Zwischenablage kopiert! 🔗' : 'Nuoroda nukopijuota! 🔗');
    setTimeout(() => {
      setShareCopied(false);
      setShareNotification(null);
    }, 3000);
  };

  const [loading, setLoading] = useState(true);
  const cat = useLiveQuery(async () => {
    if (isNaN(catId)) {
      setLoading(false);
      return null;
    }
    const res = await db.animals.get(catId);
    setLoading(false);
    return res || null;
  }, [catId]);

  const [localVideoUrls, setLocalVideoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const loadOpfsVideos = async () => {
      if (!cat || !cat.local_videos) return;
      
      const newUrls: Record<string, string> = {};
      for (const lv of cat.local_videos) {
        if (lv.opfsKey && !lv.blob) {
          try {
            const { readFromOpfs } = await import('@/lib/opfsStorage');
            const blob = await readFromOpfs(lv.opfsKey);
            if (blob && active) {
              newUrls[lv.opfsKey] = URL.createObjectURL(blob);
            }
          } catch (e) {
            console.error("Failed to load local video from OPFS:", e);
          }
        }
      }
      
      if (active) {
        setLocalVideoUrls(newUrls);
      }
    };

    loadOpfsVideos();
    
    return () => {
      active = false;
    };
  }, [cat]);

  const shelter = useLiveQuery(() => db.shelters.limit(1).first());

  // Compile all photos and videos (synced and unsynced)
  const mediaItems: { type: 'photo' | 'video'; url: string }[] = [];
  if (cat) {
    if (cat.media_urls) {
      cat.media_urls.forEach((url) => {
        mediaItems.push({ type: 'photo', url });
      });
    }
    if (cat.video_urls) {
      cat.video_urls.forEach((url) => {
        mediaItems.push({ type: 'video', url });
      });
    }
    if (cat.local_videos) {
      cat.local_videos.forEach((lv) => {
        if (lv.blob) {
          try {
            const url = URL.createObjectURL(lv.blob);
            mediaItems.push({ type: 'video', url });
          } catch (e) {
            console.error(e);
          }
        } else if (lv.opfsKey && localVideoUrls[lv.opfsKey]) {
          mediaItems.push({ type: 'video', url: localVideoUrls[lv.opfsKey] });
        }
      });
    }
  }

  // Auto-swipe effect
  useEffect(() => {
    if (mediaItems.length <= 1) return;
    
    // Do not auto-swipe if active item is a video
    const currentItem = mediaItems[activePhotoIndex];
    if (currentItem && currentItem.type === 'video') return;

    const interval = setInterval(() => {
      setActivePhotoIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    }, 5000); // Slow, gentle 5-second swipe

    return () => clearInterval(interval);
  }, [mediaItems.length, activePhotoIndex, autoSwipeTick]);

  const resetAutoSwipe = () => {
    setAutoSwipeTick((prev) => prev + 1);
  };

  useEffect(() => {
    if (!loading && !cat) {
      logger.warn('AnimalDetails', `Tier mit ID "${resolvedParams.id}" nicht gefunden oder ID ungültig.`);
    }
  }, [loading, cat, resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center flex-col space-y-4">
        <span className="w-8 h-8 border-4 border-brandpink-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-stone-500 text-xs">Katze wird geladen...</span>
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center flex-col space-y-4 p-4 text-center">
        <AlertTriangle className="w-12 h-12 text-brandpink-500" />
        <h2 className="text-xl font-bold text-stone-800">
          {lang === 'DE' ? 'Katze nicht gefunden' : 'Katė nerasta'}
        </h2>
        <p className="text-sm text-stone-600 max-w-xs">
          {lang === 'DE' 
            ? 'Das gesuchte Tier existiert leider nicht oder wurde bereits vermittelt.' 
            : 'Ieškomas gyvūnas neegzistuoja arba jam jau buvo surasti namai.'}
        </p>
        <button
          onClick={() => router.push('/katzen')}
          className="mt-4 px-4 py-2 bg-brandpink-500 hover:bg-brandpink-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-md"
        >
          {lang === 'DE' ? 'Zurück zur Galerie' : 'Atgal į galeriją'}
        </button>
      </div>
    );
  }

  // Pre-calculate mock donation goals for the MVP if not set
  const mockDonationTarget = cat.is_emergency ? 250 : 100;
  const mockDonationCurrent = (cat.id || 0) * 15 % mockDonationTarget; // deterministic mock start
  const donationProgress = Math.min(
    100, 
    Math.round(((mockDonationCurrent + extraDonation) / mockDonationTarget) * 100)
  );

  // Email CTA Template generator
  const handleInquiryEmail = () => {
    const subject = encodeURIComponent(lang === 'DE' 
      ? `Adoptionsanfrage für ${cat.name} (ID: ${cat.id})` 
      : `Užklausa dėl katės įvaikinimo: ${cat.name} (ID: ${cat.id})`
    );
    const bodyDe = `Hallo Team Būk mano draugas,\n\nich interessiere mich sehr für ${cat.name} und möchte mich nach dem Adoptionsablauf erkundigen.\n\nUm Ihnen die Einschätzung zu erleichtern, hier einige Infos zu meiner Lebenssituation:\n- Name & Wohnort:\n- Telefonnummer:\n- Wohnungsgröße (qm) & Balkon (gesichert?):\n- Freigang möglich? (ja/nein):\n- Gibt es bereits andere Tiere im Haushalt?:\n- Liegt die Erlaubnis des Vermieters zur Tierhaltung vor?:\n- Meine Erfahrung mit Katzen:\n\nIch freue mich auf Ihre Rückmeldung!\n\nViele Grüße`;
    const bodyLt = `Sveiki, VšĮ „Būk mano draugas“ komanda,\n\ndomiuosi kate ${cat.name} ir norėčiau sužinoti apie įvaikinimo eigą.\n\nMano kontaktinė informacija:\n- Vardas, pavardė:\n- Telefono numeris:\n- Gyvenamoji vieta (miestas, būstas):\n- Ar auginate kitų gyvūnų?:\n\nLauksiu jūsų atsakymo.\n\nSu linkėjimais`;
    const body = encodeURIComponent(lang === 'DE' ? bodyDe : bodyLt);
    
    const shelterEmail = lang === 'DE' ? 'Tierheimbmg@gmail.com' : 'bukmanodraugas@inbox.lt';
    const mailtoUrl = `mailto:${shelterEmail}?subject=${subject}&body=${body}`;
    if (typeof window !== 'undefined' && (window as any).mockLocationAssign) {
      (window as any).mockLocationAssign(mailtoUrl);
    } else {
      window.location.assign(mailtoUrl);
    }
  };

  // PayPal redirect CTA
  const handleDonationPayPal = (amount: number) => {
    // Increment local state to show reactivity in PWA
    setExtraDonation(prev => prev + amount);
    // Open real Swedbank / Paypal info
    const paypalUrl = `https://www.paypal.com/donate/?business=bukmanodraugas@inbox.lt&currency_code=EUR&no_recurring=0&item_name=Spende%20fuer%20Katze%20${encodeURIComponent(cat.name)}%20(Betrag%20${amount}EUR)`;
    window.open(paypalUrl, '_blank');
  };

  const ui = {
    DE: {
      backBtn: 'Zurück zur Galerie',
      age: 'Alter',
      gender: 'Geschlecht',
      arrival: 'Im Tierheim seit',
      reason: 'Geschichte / Abgabegrund',
      restrictions: 'Besonderheiten & Pflege',
      misc: 'Sonstiges',
      medicalStatus: 'Gesundheits-Check',
      temperament: 'Charaktereigenschaften',
      castrated: 'Kastriert',
      chipped: 'Gechipt',
      rabies: 'Tollwutimpfung',
      catFlu: 'Katzenschnupfen',
      dewormed: 'Entwurmt',
      passport: 'EU-Pass vorhanden',
      compatCats: 'Mit Katzen verträglich',
      compatDogs: 'Mit Hunden verträglich',
      compatChildren: 'Mit Kindern verträglich',
      traitCurious: 'Neugierig',
      traitPlayful: 'Verspielt',
      traitAggressive: 'Aggressiv',
      traitFearful: 'Ängstlich',
      traitCuddly: 'Verschmust',
      donationTitle: 'Spenden & Leben retten 🐾',
      donationSub: 'Deine Spende finanziert Futter, medizinische Erstversorgung und ein sicheres Plätzchen für',
      donationTarget: 'Spendenziel',
      donationCurrent: 'bereits gesammelt',
      donationCTA: 'Spenden',
      wishlistLink: 'Zur Amazon/Sachspenden Wunschliste',
      inquiryCTA: 'Interesse an einer Adoption? Kontakt aufnehmen',
      sponsorTitle: 'Unterstützung im Tierheim',
      sponsorText: 'Dieses Tier wird gefördert durch Spenden an',
      bankDetailsTitle: 'Direkte Banküberweisung',
      bankName: 'Bank',
      iban: 'IBAN',
      bic: 'BIC / SWIFT',
      purpose: 'Verwendungszweck',
      emergency: 'Sorgenfell / Dringend'
    },
    LT: {
      backBtn: 'Atgal į galeriją',
      age: 'Amžius',
      gender: 'Lytis',
      arrival: 'Prieglaudoje nuo',
      reason: 'Istorija / Priežastis',
      restrictions: 'Sveikatos ypatumai',
      misc: 'Kita informacija',
      medicalStatus: 'Medicininė būklė',
      temperament: 'Charakterio savybės',
      castrated: 'Kastruotas / sterilizuota',
      chipped: 'Paženklintas (čipas)',
      rabies: 'Skiepas nuo pasiutligės',
      catFlu: 'Skiepas nuo virusų',
      dewormed: 'Nukirmintas',
      passport: 'EU pasas',
      compatCats: 'Sutaria su katėmis',
      compatDogs: 'Sutaria su šunimis',
      compatChildren: 'Sutaria su vaikais',
      traitCurious: 'Smalsumas',
      traitPlayful: 'Žaismingumas',
      traitAggressive: 'Agresyvumas',
      traitFearful: 'Baimingumas',
      traitCuddly: 'Meilumas',
      donationTitle: 'Paremkite ir išgelbėkite gyvybę 🐾',
      donationSub: 'Mūsų kasdienė priežiūra ir skubus gydymas priklauso nuo jūsų paramos gyvūnui',
      donationTarget: 'Tikslas',
      donationCurrent: 'jau surinkta',
      donationCTA: 'Paaukoti',
      wishlistLink: 'Pirkinių / dovanų sąrašas',
      inquiryCTA: 'Domina įvaikinimas? Susisiekite',
      sponsorTitle: 'Rėmimas prieglaudoje',
      sponsorText: 'Šį gyvūną prieglaudoje remia paramos teikėjai organizacijai',
      bankDetailsTitle: 'Tiesioginis bankinis pavedimas',
      bankName: 'Bankas',
      iban: 'Sąskaita (IBAN)',
      bic: 'BIC / SWIFT',
      purpose: 'Mokėjimo paskirtis',
      emergency: 'Skubi pagalba'
    }
  }[lang];

  const renderBadge = (value: boolean | 'JA' | 'NEIN' | 'unbekannt') => {
    if (value === true || value === 'JA') {
      return (
        <span className="p-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
          <Check className="w-3.5 h-3.5" />
        </span>
      );
    } else if (value === false || value === 'NEIN') {
      return (
        <span className="p-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700">
          <X className="w-3.5 h-3.5" />
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-500 text-[10px] font-semibold">
          Unbekannt
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      
      {/* Dynamic Header */}
      <PublicHeader lang={lang} setLang={setLang} />

      <main className="flex-1 max-w-lg mx-auto w-full pb-32">
        {/* Photo & Video Gallery with Slider */}
        <div className="relative bg-stone-100 border-b border-stone-200">
          <div className="aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
            {mediaItems.length > 0 ? (
              mediaItems[activePhotoIndex].type === 'photo' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={mediaItems[activePhotoIndex].url} 
                  alt={`${cat.name} photo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={mediaItems[activePhotoIndex].url} 
                  controls
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-stone-400">
                <HelpCircle className="w-12 h-12 mb-2" />
                <span className="text-xs uppercase font-bold tracking-wider">Keine Medien vorhanden</span>
              </div>
            )}
          </div>

          {/* Sync Status Badge */}
          {mediaItems.length > 0 && (
            <div className="absolute top-3 right-3 select-none z-10">
              {mediaItems[activePhotoIndex].url.startsWith('data:') || mediaItems[activePhotoIndex].url.startsWith('blob:') ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold tracking-wider uppercase flex items-center space-x-1 shadow-sm">
                  <CloudOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Lokal</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase flex items-center space-x-1 shadow-sm">
                  <Cloud className="w-3.5 h-3.5 shrink-0" />
                  <span>Online</span>
                </span>
              )}
            </div>
          )}

          {/* Urgent / Emergency SOS tag */}
          <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
            {cat.is_emergency && (
              <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                {ui.emergency}
              </span>
            )}
          </div>

          {/* Navigation Arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setActivePhotoIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
                  resetAutoSwipe();
                }}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/75 hover:bg-white border border-stone-200/50 shadow-md transition-all text-stone-750 hover:text-stone-900 z-10 cursor-pointer flex items-center justify-center backdrop-blur-xs active:scale-95"
                title="Vorheriges Bild"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePhotoIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
                  resetAutoSwipe();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/75 hover:bg-white border border-stone-200/50 shadow-md transition-all text-stone-750 hover:text-stone-900 z-10 cursor-pointer flex items-center justify-center backdrop-blur-xs active:scale-95"
                title="Nächstes Bild"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Media Count Badge */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-16 right-3.5 px-2.5 py-1 rounded-full bg-stone-900/60 backdrop-blur-xs text-white text-[10px] font-extrabold tracking-wider z-10 select-none border border-white/10 shadow-sm">
              {activePhotoIndex + 1} / {mediaItems.length}
            </div>
          )}

          {/* Dots Indicator / Thumbnail list */}
          {mediaItems.length > 1 && (
            <div className="flex space-x-1.5 justify-center p-3 overflow-x-auto bg-stone-900/10 backdrop-blur-sm border-t border-stone-200/60">
              {mediaItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActivePhotoIndex(idx);
                    resetAutoSwipe();
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activePhotoIndex ? 'bg-brandpink-500 scale-125' : 'bg-stone-300'} flex items-center justify-center cursor-pointer`}
                  title={item.type === 'video' ? 'Video abspielen' : 'Foto anzeigen'}
                >
                  {item.type === 'video' && <Video className="w-1.5 h-1.5 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content details */}
        <div className="p-4 space-y-6">
          
          {/* Cat Name and Age Header */}
          <div className="border-b border-stone-200 pb-4">
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {cat.name}
            </h1>
            <p className="text-xs text-stone-500 mt-1.5">
              {formatAge(cat, lang)} • {cat.gender === 'Weiblich' ? (lang === 'DE' ? 'Weiblich' : 'Patelė') : (lang === 'DE' ? 'Männlich' : 'Patinas')}
            </p>
          </div>

          {/* General specs */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">{ui.gender}</span>
              <span className="text-sm font-bold text-stone-900 mt-1 block">
                {cat.gender === 'Weiblich' ? (lang === 'DE' ? 'Weiblich' : 'Patelė') : (lang === 'DE' ? 'Männlich' : 'Patinas')}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">{ui.age}</span>
              <span className="text-sm font-bold text-stone-900 mt-1 block">
                {formatAge(cat, lang)}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">{ui.arrival}</span>
              <span className="text-[11px] font-bold text-stone-900 mt-1 block">
                {cat.shelter_admission_date ? (() => {
                  const [y, m] = cat.shelter_admission_date.split('-');
                  return `${m}/${y}`;
                })() : 'Unbekannt'}
              </span>
            </div>
          </div>

          {/* Description Story */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-brandpink-500" />
              <span>{ui.reason}</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              {cat.reason_for_shelter || 'Keine Geschichte hinterlegt.'}
            </p>
          </div>

          {cat.restrictions && (
            <div className="space-y-2 bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                {ui.restrictions}
              </h3>
              <p className="text-xs leading-relaxed font-light">
                {cat.restrictions}
              </p>
            </div>
          )}

          {/* Audio voice descriptions */}
          {isStaff && ((cat.audio_urls && cat.audio_urls.length > 0) || (cat.local_audios && cat.local_audios.length > 0)) && (
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5 border-b border-stone-100 pb-2">
                <Mic className="w-4 h-4 text-brandpink-500" />
                <span>{lang === 'DE' ? 'Sprachbeschreibungen' : 'Balso aprašymai'}</span>
              </h3>
              
              <div className="space-y-2">
                {/* Synced remote audios */}
                {cat.audio_urls?.map((url, index) => (
                  <div key={`remote-${index}`} className="flex items-center space-x-2 bg-stone-50 border border-stone-150 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-stone-500 min-w-[45px] shrink-0">
                      {lang === 'DE' ? `Beschreibung #${index + 1}` : `Aprašymas #${index + 1}`}
                    </span>
                    <audio src={url} controls className="w-full max-h-8 outline-none" />
                  </div>
                ))}

                {/* Local unsynced audios */}
                {cat.local_audios?.map((la, index) => {
                  if (!la.blob) return null;
                  const url = URL.createObjectURL(la.blob);
                  const offset = cat.audio_urls ? cat.audio_urls.length : 0;
                  return (
                    <div key={`local-${index}`} className="flex items-center space-x-2 bg-stone-50 border border-stone-150 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-stone-500 min-w-[45px] shrink-0">
                        {lang === 'DE' ? `Beschreibung #${offset + index + 1}` : `Aprašymas #${offset + index + 1}`}
                      </span>
                      <audio src={url} controls className="w-full max-h-8 outline-none" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vermittlung / Haltungsbedingungen */}
          {(cat.slow_integration || cat.partner_needed || cat.no_single_animal || cat.needs_outdoor || 
            cat.indoor_only || cat.secured_balcony || cat.for_beginners || cat.for_experienced || 
            cat.quiet_home || cat.patient_people || cat.needs_attention || cat.no_small_children || 
            cat.suitable_seniors || cat.suitable_families) && (
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-100 pb-2">
                {lang === 'DE' ? 'Vermittlung & Haltungsbedingungen' : 'Dovanojimo ir laikymo sąlygos'}
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {cat.slow_integration && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🤝 <span className="ml-1">{lang === 'DE' ? 'langsame Zusammenführung' : 'lėtas supažindinimas'}</span>
                  </span>
                )}
                {cat.partner_needed && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🐱 <span className="ml-1">{lang === 'DE' ? 'Vermittlung nur mit Partnertier' : 'dovanojama tik su kitu gyvūnu'}</span>
                  </span>
                )}
                {cat.no_single_animal && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🐱 <span className="ml-1">{lang === 'DE' ? 'Keine Einzelhaltung' : 'negalima laikyti vieno'}</span>
                  </span>
                )}
                {cat.needs_outdoor && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🌳 <span className="ml-1">{lang === 'DE' ? 'braucht Freigang' : 'reikia galimybės išeiti į lauką'}</span>
                  </span>
                )}
                {cat.indoor_only && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🏠 <span className="ml-1">{lang === 'DE' ? 'nur Wohnungshaltung' : 'tik laikymui bute/namuose'}</span>
                  </span>
                )}
                {cat.secured_balcony && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🏢 <span className="ml-1">{lang === 'DE' ? 'gesicherter Balkon/Terrasse' : 'apsaugotas balkonas/terasa'}</span>
                  </span>
                )}
                {cat.for_beginners && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🔰 <span className="ml-1">{lang === 'DE' ? 'für Anfänger geeignet' : 'tinka pradedantiesiems'}</span>
                  </span>
                )}
                {cat.for_experienced && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🧠 <span className="ml-1">{lang === 'DE' ? 'für katzenerfahrene Menschen' : 'tik patyrusiems kačių augintojams'}</span>
                  </span>
                )}
                {cat.quiet_home && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🤫 <span className="ml-1">{lang === 'DE' ? 'ruhiges Zuhause' : 'ramūs namai'}</span>
                  </span>
                )}
                {cat.patient_people && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    🧘 <span className="ml-1">{lang === 'DE' ? 'geduldige Menschen' : 'kantrūs šeimininkai'}</span>
                  </span>
                )}
                {cat.needs_attention && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    💖 <span className="ml-1">{lang === 'DE' ? 'viel Aufmerksamkeit' : 'reikia daug dėmesio'}</span>
                  </span>
                )}
                {cat.no_small_children && (
                  <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 font-medium flex items-center">
                    🚫👶 <span className="ml-1">{lang === 'DE' ? 'keine kleinen Kinder' : 'be mažų vaikų'}</span>
                  </span>
                )}
                {cat.suitable_seniors && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    👵 <span className="ml-1">{lang === 'DE' ? 'Seniorenhaushalt geeignet' : 'tinka senjorams'}</span>
                  </span>
                )}
                {cat.suitable_families && (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium flex items-center">
                    👨‍👩‍👧‍👦 <span className="ml-1">{lang === 'DE' ? 'Familien geeignet' : 'tinka šeimoms'}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Medical Checks List */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-100 pb-2">
              {lang === 'DE' ? 'Gesundheit' : 'Sveikata'}
            </h3>
            
            <div className="flex flex-wrap gap-2 text-xs">
              {cat.has_eu_passport && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  🇪🇺 {lang === 'DE' ? 'EU-Heimtierausweis' : 'ES augintinio pasas'}
                </span>
              )}
              {cat.is_chipped && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  📍 {lang === 'DE' ? 'gechipt' : 'paženklintas čipu'}
                </span>
              )}
              {cat.is_castrated && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  ✂️ {lang === 'DE' ? 'kastriert' : 'kastruotas/sterilizuota'}
                </span>
              )}
              {cat.not_castrated && (
                <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 font-medium">
                  ✂️ {lang === 'DE' ? 'nicht kastriert' : 'nekastruotas/nesterilizuota'}
                </span>
              )}
              {cat.has_rabies_vaccine && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  💉 {lang === 'DE' ? 'Tollwutimpfung' : 'skiepas nuo pasiutligės'}
                </span>
              )}
              {cat.has_cat_plague_vaccine && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  💉 {lang === 'DE' ? 'Katzenseuche-Impfung' : 'skiepas nuo kačių maro'}
                </span>
              )}
              {cat.has_cat_flu_vaccine && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  💉 {lang === 'DE' ? 'Katzenschnupfen-Impfung' : 'skiepas nuo kačių slogos'}
                </span>
              )}
              {cat.vaccination_status_unknown && (
                <span className="px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-medium">
                  ❓ {lang === 'DE' ? 'Impfstatus unbekannt' : 'skiepų statusas nežinomas'}
                </span>
              )}
              {cat.fiv_negative && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  🦠 {lang === 'DE' ? 'FIV negativ' : 'FIV neigiamas'}
                </span>
              )}
              {cat.felv_negative && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  🦠 {lang === 'DE' ? 'FeLV negativ' : 'FeLV neigiamas'}
                </span>
              )}
              {cat.fiv_positive && (
                <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-250/50 font-semibold">
                  ⚠️ {lang === 'DE' ? 'FIV positiv' : 'FIV teigiamas'}
                </span>
              )}
              {cat.felv_positive && (
                <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-250/50 font-semibold">
                  ⚠️ {lang === 'DE' ? 'FeLV positiv' : 'FeLV teigiamas'}
                </span>
              )}
              {cat.fip_positive && (
                <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-250/50 font-semibold">
                  ⚠️ {lang === 'DE' ? 'FIP positiv' : 'FIP teigiamas'}
                </span>
              )}
              {cat.is_dewormed && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  ✨ {lang === 'DE' ? 'entwurmt' : 'nukirmintas'}
                </span>
              )}
              {cat.flea_mite_treatment && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-medium">
                  ✨ {lang === 'DE' ? 'Floh-/Milbenbehandlung' : 'gydymas nuo parazitų'}
                </span>
              )}
            </div>
            {cat.handicaps && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-relaxed font-normal">
                <strong>{lang === 'DE' ? 'Handicap / Einschränkung:' : 'Fizinis trūkumas / negalia:'}</strong> {cat.handicaps}
              </div>
            )}
          </div>

          {/* Behavior / Compatibility List */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-100 pb-2">
              {lang === 'DE' ? 'Charakter / Verhalten' : 'Charakteris / Elgsena'}
            </h3>
            
            <div className="flex flex-wrap gap-2 text-xs">
              {((cat.trait_cuddly as any) === 'JA' || (cat.trait_cuddly as any) === true) && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  ❤️ {lang === 'DE' ? 'verschmust' : 'meilus (-i)'}
                </span>
              )}
              {cat.trait_trusting && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🤝 {lang === 'DE' ? 'zutraulich' : 'patiklus (-i)'}
                </span>
              )}
              {cat.trait_people_oriented && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🧑‍🤝‍🧑 {lang === 'DE' ? 'sehr menschenbezogen' : 'labai orientuotas (-a) į žmones'}
                </span>
              )}
              {((cat.trait_playful as any) === 'JA' || (cat.trait_playful as any) === true) && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🧶 {lang === 'DE' ? 'verspielt' : 'žaismingas (-a)'}
                </span>
              )}
              {cat.trait_quiet && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  💤 {lang === 'DE' ? 'ruhig' : 'ramus (-i)'}
                </span>
              )}
              {cat.trait_active && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  ⚡ {lang === 'DE' ? 'aktiv' : 'aktyvus (-i)'}
                </span>
              )}
              {((cat.trait_curious as any) === 'JA' || (cat.trait_curious as any) === true) && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  👀 {lang === 'DE' ? 'neugierig' : 'smalsus (-i)'}
                </span>
              )}
              {((cat.trait_fearful as any) === 'JA' || (cat.trait_fearful as any) === true) && (
                <span className="px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-250 font-medium">
                  😰 {lang === 'DE' ? 'ängstlich / unsicher' : 'baimingas (-a) / nesaugus (-i)'}
                </span>
              )}
              {cat.trait_needs_time && (
                <span className="px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-250 font-medium">
                  ⏳ {lang === 'DE' ? 'braucht Zeit zum Vertrauen' : 'reikia laiko pasitikėjimui įgyti'}
                </span>
              )}
              {cat.trait_allows_touch && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🖐️ {lang === 'DE' ? 'lässt sich anfassen' : 'leidžiasi glostomas (-a)'}
                </span>
              )}
              {cat.trait_allows_lift && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🤲 {lang === 'DE' ? 'lässt sich hochheben' : 'leidžiasi pakeliamas (-a)'}
                </span>
              )}
              {cat.trait_allows_brush && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🧹 {lang === 'DE' ? 'lässt sich bürsten' : 'leidžiasi šukuojamas (-a)'}
                </span>
              )}
              {cat.trait_shows_limits && (
                <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 font-medium">
                  ⚠️ {lang === 'DE' ? 'zeigt Grenzen deutlich' : 'aiškiai rodo savo ribas'}
                </span>
              )}
              {cat.trait_seeks_cats && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🐱 {lang === 'DE' ? 'sucht Kontakt zu anderen Katzen' : 'ieško kontakto su kitomis katėmis'}
                </span>
              )}
              {cat.trait_insecure_cats && (
                <span className="px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-250 font-medium">
                  🐱 {lang === 'DE' ? 'unsicher mit anderen Katzen' : 'nesaugus (-i) su kitomis katėmis'}
                </span>
              )}
              {cat.trait_compat_cats && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🐈 {lang === 'DE' ? 'verträglich mit anderen Katzen' : 'sutaria su kitomis katėmis'}
                </span>
              )}
              {cat.trait_compat_dogs && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🐕 {lang === 'DE' ? 'verträglich mit Hunden' : 'sutaria su šunimis'}
                </span>
              )}
              {cat.trait_compat_children && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  👶 {lang === 'DE' ? 'verträglich mit Kindern' : 'sutaria su vaikais'}
                </span>
              )}
              {cat.trait_dominant && (
                <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 font-medium">
                  👑 {lang === 'DE' ? 'dominant' : 'dominantinis (-ė)'}
                </span>
              )}
              {cat.trait_submissive && (
                <span className="px-3 py-1.5 rounded-full bg-brandpink-50 text-brandpink-850 border border-brandpink-200/50 font-medium">
                  🙇 {lang === 'DE' ? 'unterwürfig' : 'paklusnus (-i)'}
                </span>
              )}
              {cat.trait_sensitive_noise && (
                <span className="px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-250 font-medium">
                  🔊 {lang === 'DE' ? 'reagiert empfindlich auf laute Geräusche' : 'jautriai reaguoja į garsius triukšmus'}
                </span>
              )}
              {cat.trait_litter_box && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-250/50 font-medium">
                  🚽 {lang === 'DE' ? 'benutzt Katzenklo zuverlässig' : 'patikimai naudojasi kraiko dėžute'}
                </span>
              )}
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
              <Share2 className="w-4 h-4 text-brandpink-500" />
              <span>{lang === 'DE' ? 'Diesen Schützling teilen' : 'Pasidalinkite šiuo profiliu'}</span>
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed font-light">
              {lang === 'DE' 
                ? 'Erstelle eine wunderschöne Grafik für Social Media oder teile das Tierprofil direkt mit deinen Freunden, um die Vermittlungschancen zu erhöhen!' 
                : 'Sukurkite gražų paveikslėlį socialiniams tinklams arba pasidalinkite profiliu su draugais, kad padidintumėte šio augintinio šansus rasti namus!'}
            </p>
            
            <button
              onClick={() => setIsSharePanelOpen(true)}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-brandpink-50 hover:bg-brandpink-100 text-brandpink-700 font-extrabold rounded-xl border border-brandpink-200/50 shadow-sm transition-all cursor-pointer text-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>{lang === 'DE' ? 'Grafik erstellen & Profil teilen' : 'Sukurti paveikslėlį ir dalintis'}</span>
            </button>
          </div>

          {/* Virtual Food Bowl Spendenmodul */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-stone-50 border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/donation_photo.png" alt="Donation" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">{ui.donationTitle}</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">{ui.donationSub} {cat.name}.</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-stone-600">
                <span>{ui.donationCurrent}: <strong className="text-stone-900">{mockDonationCurrent + extraDonation} €</strong></span>
                <span>{ui.donationTarget}: <strong className="text-stone-700">{mockDonationTarget} €</strong></span>
              </div>
              <div className="w-full bg-stone-150 rounded-full h-2.5 overflow-hidden border border-stone-200/50">
                <div 
                  className="bg-gradient-to-r from-brandpink-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${donationProgress}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-stone-500 font-semibold">{donationProgress}% gefüllt</div>
            </div>

            {/* Quick donation CTA buttons (Cost Breakdowns) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDonationPayPal(10)}
                className="flex flex-col items-center py-2 px-1 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 rounded-xl text-center transition-all hover:border-brandpink-500/50 shadow-sm"
              >
                <span className="text-xs font-extrabold text-brandpink-600">10 €</span>
                <span className="text-[9px] text-stone-500 mt-0.5">{lang === 'DE' ? '1 Wo. Futter' : '1 sav. maistas'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDonationPayPal(25)}
                className="flex flex-col items-center py-2 px-1 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 rounded-xl text-center transition-all hover:border-brandpink-500/50 shadow-sm"
              >
                <span className="text-xs font-extrabold text-brandpink-600">25 €</span>
                <span className="text-[9px] text-stone-500 mt-0.5">{lang === 'DE' ? 'Impfung' : 'Skiepai'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDonationPayPal(50)}
                className="flex flex-col items-center py-2 px-1 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 rounded-xl text-center transition-all hover:border-brandpink-500/50 shadow-sm"
              >
                <span className="text-xs font-extrabold text-brandpink-600">50 €</span>
                <span className="text-[9px] text-stone-500 mt-0.5">{lang === 'DE' ? 'Ausreise' : 'Kastracija'}</span>
              </button>
            </div>

            {/* Direct Bank Info Details */}
            <div className="border-t border-stone-150 pt-3 space-y-2 text-[10px]">
              <span className="font-bold text-stone-500 block uppercase tracking-wider">{ui.bankDetailsTitle}</span>
              
              <div className="grid grid-cols-2 gap-1.5 font-mono text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div>
                  <span className="text-[9px] text-stone-500 block uppercase">{ui.bankName}</span>
                  <span className="text-stone-700">{shelter?.bankName || 'Swedbank'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 block uppercase">{ui.bic}</span>
                  <span className="text-stone-700">{shelter?.bic || 'HABALT22'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-stone-500 block uppercase">{ui.iban}</span>
                  <span className="text-stone-900 select-all text-xs">{shelter?.iban || 'LT97 7300 0101 2750 0736'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-stone-500 block uppercase">{ui.purpose}</span>
                  <span className="text-stone-700">{shelter?.donationPurposeDe || 'Donate Germany'} / Katze {cat.name}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons (Share & Email Inquiry) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-stone-200/85 backdrop-blur-md p-4 max-w-lg mx-auto z-40 flex space-x-3">
          <button
            onClick={() => setIsSharePanelOpen(true)}
            className="p-4 rounded-xl shadow-sm border active:scale-95 transition-all flex items-center justify-center bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200 cursor-pointer"
            title={lang === 'DE' ? 'Grafik erstellen & Profil teilen' : 'Sukurti paveikslėlį ir dalintis'}
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleInquiryEmail}
            className="flex-1 flex items-center justify-center space-x-2 py-4 bg-brandpink-500 hover:bg-brandpink-600 text-white font-extrabold rounded-xl shadow-md active:scale-98 transition-all text-xs"
          >
            <Send className="w-4.5 h-4.5" />
            <span>{ui.inquiryCTA}</span>
          </button>
        </div>

      </main>

      {isSharePanelOpen && cat && (
        <SharePanel 
          animal={cat} 
          onClose={() => setIsSharePanelOpen(false)} 
        />
      )}
    </div>
  );
}
