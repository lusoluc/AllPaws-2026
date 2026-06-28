'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, formatAge } from '@/lib/db';
import { logger } from '@/lib/logger';
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
  Video
} from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';

export default function CatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const catId = parseInt(resolvedParams.id);
  const router = useRouter();
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
  
  // State for image carousel
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
  // State for simulated donation increment
  const [extraDonation, setExtraDonation] = useState(0);

  // Share States & Methods
  const [shareCopied, setShareCopied] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      
      {/* Dynamic Header */}
      <header className="px-4 py-4 bg-white/80 border-b border-stone-200 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <NextLink href="/katzen" className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors border border-stone-200">
            <ArrowLeft className="w-4.5 h-4.5" />
          </NextLink>
          <span className="font-bold text-sm text-stone-900">{cat.name}</span>
        </div>

        <div className="flex items-center space-x-2">
          <NextLink
            href="/katzen-ratgeber"
            className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
          >
            {lang === 'DE' ? 'Ratgeber' : 'Gidas'}
          </NextLink>
          
          <button 
            onClick={() => setLang(lang === 'DE' ? 'LT' : 'DE')}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-100 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors border border-stone-200"
          >
            <Globe className="w-3.5 h-3.5 text-brandpink-600" />
            <span>{lang}</span>
          </button>
        </div>
      </header>

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

          {/* Dots Indicator / Thumbnail list */}
          {mediaItems.length > 1 && (
            <div className="flex space-x-1.5 justify-center p-3 overflow-x-auto bg-stone-900/10 backdrop-blur-sm border-t border-stone-200/60">
              {mediaItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activePhotoIndex ? 'bg-brandpink-500 scale-125' : 'bg-stone-300'} flex items-center justify-center`}
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

          {/* Medical Checks List */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-100 pb-2">
              {ui.medicalStatus}
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.castrated}</span>
                {renderBadge(cat.is_castrated)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.chipped}</span>
                {renderBadge(cat.is_chipped)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.rabies}</span>
                {renderBadge(cat.has_rabies_vaccine)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.catFlu}</span>
                {renderBadge(cat.has_cat_flu_vaccine)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.dewormed}</span>
                {renderBadge(cat.is_dewormed)}
              </div>
              <div className="flex justify-between items-center pb-0.5">
                <span className="text-stone-600">{ui.passport}</span>
                {renderBadge(cat.has_eu_passport)}
              </div>
            </div>
          </div>

          {/* Behavior / Compatibility List */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-100 pb-2">
              {ui.temperament}
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.compatCats}</span>
                {renderBadge(cat.compat_cats)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.compatDogs}</span>
                {renderBadge(cat.compat_dogs)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.compatChildren}</span>
                {renderBadge(cat.compat_children)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.traitCurious}</span>
                {renderBadge(cat.trait_curious)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.traitPlayful}</span>
                {renderBadge(cat.trait_playful)}
              </div>
              <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                <span className="text-stone-600">{ui.traitCuddly}</span>
                {renderBadge(cat.trait_cuddly)}
              </div>
              <div className="flex justify-between items-center pb-0.5">
                <span className="text-stone-600">{ui.traitFearful}</span>
                {renderBadge(cat.trait_fearful)}
              </div>
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
                ? 'Hilf uns, ein Zuhause zu finden! Teile das Profil direkt mit Freunden oder in sozialen Netzwerken.' 
                : 'Padėkite mums rasti namus! Pasidalinkite profiliu su draugais arba socialiniuose tinkluose.'}
            </p>
            
            {/* Share Buttons Row */}
            <div className="flex flex-wrap gap-2.5">
              {/* WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366] text-white hover:bg-[#20ba56] transition-colors shadow-sm"
                title="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 0 0-6.98-2.879C6.222 1.01 1.797 5.381 1.793 10.81c-.001 1.639.425 3.24 1.232 4.679l-.992 3.626 3.716-.975zM17.47 15.39c-.3-.15-1.77-.874-2.04-.972-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.18.2-.35.22-.65.07-1.125-.56-1.92-1.077-2.69-2.39-.2-.35.2-.32.57-1.07.1-.2.05-.38-.02-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.11 3.22 5.11 4.52.71.31 1.27.5 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3 0-1.42-.05-.15-.25-.22-.55-.37z"/>
                </svg>
              </button>

              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] text-white hover:bg-[#166fe5] transition-colors shadow-sm"
                title="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              {/* Instagram */}
              <button
                onClick={handleShareInstagram}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:opacity-90 transition-opacity shadow-sm"
                title="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </button>

              {/* Email */}
              <button
                onClick={handleShareEmail}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-600 text-white hover:bg-stone-700 transition-colors shadow-sm"
                title="Email"
              >
                <Mail className="w-5 h-5" />
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors shadow-sm ${
                  shareCopied ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                title={lang === 'DE' ? 'Link kopieren' : 'Kopijuoti nuorodą'}
              >
                {shareCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Notification message inside card */}
            {shareNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] rounded-lg animate-fade-in font-medium leading-relaxed">
                {shareNotification}
              </div>
            )}
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
            onClick={handleCopyLink}
            className={`p-4 rounded-xl shadow-sm border active:scale-95 transition-all flex items-center justify-center ${
              shareCopied ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
            }`}
            title={lang === 'DE' ? 'Link kopieren' : 'Kopijuoti nuorodą'}
          >
            {shareCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
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
    </div>
  );
}
