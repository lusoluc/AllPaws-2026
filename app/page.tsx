'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Globe, ShieldCheck, HeartHandshake, BookOpen, Mail, CheckCircle2 } from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';
import PublicHeader from '@/components/PublicHeader';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncWithCloud } from '@/lib/syncManager';

export default function HomePage() {
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');
  const [nlEmail, setNlEmail] = useState('');
  const [nlName, setNlName] = useState('');
  const [nlPrefs, setNlPrefs] = useState<string[]>(['adoptions']);
  const [nlStatus, setNlStatus] = useState<'idle' | 'success' | 'duplicate' | 'invalid'>('idle');
  const [nlSubmitting, setNlSubmitting] = useState(false);

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

  const defaultUi = {
    DE: {
      heroTag: '🐾 Ein privates Herzensprojekt von Tierfreunden',
      title: 'Weil jede Pfote ein weiches Körbchen verdient',
      subtitle: 'Hinter dieser App steckt kein großes Unternehmen. Wir sind ein kleines Team aus ehrenamtlichen Helfern und Katzenliebhabern, die jede freie Minute und eigenes Geld spenden. Wir wollen der Tierrettung in Litauen helfen, Zeit zu sparen – Zeit, die zu 100 % den Tieren zugutekommt. Finde heute deinen neuen treuen Begleiter oder unterstütze unsere Rettungsarbeit!',
      ctaGalleryTitle: 'Unsere Schützlinge',
      ctaGalleryDesc: 'Triff unsere liebenswerten Samtpfoten, die sehnsüchtig auf eine zweite Chance und ein liebevolles Zuhause warten.',
      ctaGalleryBtn: 'Werd Teil der Rettungscrew',
      ctaAboutTitle: 'Über uns & Spenden',
      ctaAboutDesc: 'Wir stoßen oft an unsere körperlichen und finanziellen Grenzen. Erfahre mehr über uns und wie jeder Cent direkt den Tieren hilft.',
      ctaAboutBtn: 'Unterstütze unsere Herzensarbeit',
      ctaGuideTitle: 'Katzen-Ratgeber & FAQ',
      ctaGuideDesc: 'Ehrliche, praktische Ratschläge für ein harmonisches Zusammenleben, von der Eingewöhnung bis zum Spielverhalten.',
      ctaGuideBtn: 'Ratgeber lesen',
      memberLogin: 'Helfer-Portal',
      footerText: '© 2026 VšĮ "Būk mano draugas". Kaukėnų g. 9, Glaudėnai, Litauen.',
      regCode: 'Registrierungscode',
      visionTitle: 'Unsere Vision: Ein liebevolles Zuhause',
      realityTitle: 'Die Realität vor Ort: Leben im Käfig',
      realityNote: 'Aufgrund extremer räumlicher Notlagen müssen viele unserer 600 geretteten Katzen vorübergehend in Käfigen leben. Unterstütze uns durch eine Adoption oder Spende, um ihnen den Weg in eine bessere Zukunft zu ermöglichen.',
      guideLink: 'Katzen-Ratgeber',
      storyTitle: 'Aus dem Tagebuch unserer Helfer: Mimis große Reise 🐾',
      storyText: 'Mimi wurde klitschnass und zitternd vor Kälte in einem Graben bei Klaipėda gefunden. Sie wog kaum ein Kilo und hatte die Hoffnung schon aufgegeben. In unserem beheizten Rettungs-Container fand sie Schutz, Futter und die nötige Liebe, um wieder zu vertrauen. Heute ist Mimi gesund, verspielt und sucht Menschen, die ihr ein echtes Zuhause schenken wollen. Es sind Geschichten wie diese, für die wir alles geben.',
      newsletterTitle: 'Bleib auf dem Laufenden 🐾',
      newsletterDesc: 'Du willst wissen, wenn neue Fellnasen ankommen, wann die nächste Hilfsaktion startet oder einfach mal ehrliche Tipps aus dem Katzen-Alltag bekommen? Dann trag dich ein – wir melden uns nur, wenn es wirklich was zu erzählen gibt.',
      newsletterEmail: 'Deine E-Mail-Adresse',
      newsletterName: 'Dein Vorname (optional)',
      newsletterPrefAdoptions: 'Neues aus dem Heim & Tier-Adoptionen',
      newsletterPrefEvents: 'Nächste Hilfsaktionen & Events',
      newsletterPrefGuides: 'Erste-Hilfe-Tipps & Ratgeber',
      newsletterBtn: 'Ich bin dabei! 💌',
      newsletterSuccess: 'Danke, du bist jetzt dabei! 🎉 Wir freuen uns riesig über dein großes Herz.',
      newsletterDuplicate: 'Du bist bereits angemeldet! Danke für dein großes Herz. 💛',
      newsletterInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      authorCredit: 'App entwickelt mit ❤️ von'
    },
    LT: {
      heroTag: '🐾 Asmeninis gyvūnų mylėtojų širdies projektas',
      title: 'Nes kiekviena pėdutė nusipelno mylinčių namų',
      subtitle: 'Šią programėlę sukūrė ne įmonė, o nedidelė savanorių ir kačių mylėtojų komanda, aukojanti savo laisvą laiką ir asmenines lėšas. Mūsų tikslas – palengvinti prieglaudos darbą Lietuvoje, kad daugiau laiko liktų kačių priežiūrai ir gelbėjimui. Raskite savo naują šeimos narį arba prisidėkite prie mūsų veiklos!',
      ctaGalleryTitle: 'Mūsų globotiniai',
      ctaGalleryDesc: 'Susipažinkite su mūsų katėmis, kurios nekantriai ieško antrojo šanso ir šiltų bei mylinčių namų.',
      ctaGalleryBtn: 'Prisijunk prie gelbėtojų',
      ctaAboutTitle: 'Apie mus ir parama',
      ctaAboutDesc: 'Mes dažnai pasiekiame savo fizinių ir finansinių galimybių ribas. Sužinokite, kaip kiekvienas centas tiesiogiai padeda katėms.',
      ctaAboutBtn: 'Paremk mūsų širdies darbą',
      ctaGuideTitle: 'Kačių gidas ir DUK',
      ctaGuideDesc: 'Nuoširdūs, praktiški patarimai darniam gyvenimui kartu – nuo pripratinimo iki elgsenos sprendimų.',
      ctaGuideBtn: 'Skaityti gidą',
      memberLogin: 'Savanorių portalas',
      footerText: '© 2026 VšĮ „Būk mano draugas“. Kaukėnų g. 9, Glaudėnai, Lietuva.',
      regCode: 'Įmonės kodas',
      visionTitle: 'Mūsų vizija: Mylintys namai',
      realityTitle: 'Realybė prieglaudoje: Gyvenimas narvuose',
      realityNote: 'Dėl didelio vietos trūkumo daugelis iš 600 išgelbėtų kačių laikinai gyvena narvuose. Paremkite mus arba priglauskite katę, kad suteiktumėte joms geresnį rytojų.',
      guideLink: 'Kačių gidas',
      storyTitle: 'Iš mūsų savanorių dienoraščio: Didžioji Mimi kelionė 🐾',
      storyText: 'Mimi buvo rasta visiškai šlapia ir drebanti nuo šalčio griovyje netoli Klaipėdos. Ji svėrė vos kilogramą ir jau buvo praradusi viltį. Mūsų šildomame konteineryje ji rado prieglobstį, maistą ir meilę, kad vėl pradėtų pasitikėti. Šiandien Mimi yra sveika, žaisminga ir ieško žmonių, kurie suteiktų jai tikrus namus. Būtent dėl tokių istorijų mes aukojame kiekvieną savo laisvą minutę.',
      newsletterTitle: 'Būk su mumis 🐾',
      newsletterDesc: 'Nori sužinoti, kai į prieglaudą atvyksta nauji gyventojai, kada vyks kita akcija ar tiesiog gauti patarimų apie kačių priežiūrą? Užsiregistruok – rašysime tik tada, kai tikrai bus ką papasakoti.',
      newsletterEmail: 'Tavo el. paštas',
      newsletterName: 'Tavo vardas (neprivaloma)',
      newsletterPrefAdoptions: 'Naujienos iš prieglaudos ir įvaikinimas',
      newsletterPrefEvents: 'Artėjančios akcijos ir renginiai',
      newsletterPrefGuides: 'Pirmosios pagalbos patarimai',
      newsletterBtn: 'Prisijungiu! 💌',
      newsletterSuccess: 'Ačiū, dabar esi su mumis! 🎉 Labai džiaugiamės tavo didele širdimi.',
      newsletterDuplicate: 'Jau esi registruotas/a! Ačiū už tavo didelę širdį. 💛',
      newsletterInvalid: 'Prašome įvesti galiojantį el. pašto adresą.',
      authorCredit: 'Programėlę su ❤️ sukūrė'
    }
  };

  const uiTexts = useLiveQuery(() => db.uiTexts.toArray());
  const customBlocks = useLiveQuery(() => db.customBlocks.toArray());
  
  const ui = { ...defaultUi[lang] };
  if (uiTexts) {
    uiTexts.forEach((item) => {
      if (item.key.startsWith('home.')) {
        const subKey = item.key.split('.')[1];
        if (subKey in ui) {
          (ui as any)[subKey] = item[lang] || (ui as any)[subKey];
        }
      }
    });
  }

  const pageBlocks = customBlocks
    ?.filter((b) => b.page === 'home')
    .sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <PublicHeader lang={lang} setLang={setLang} />

      {/* Hero & Mascot Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-4xl mx-auto space-y-10">
        
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-brandpink-500/20 bg-brandpink-50/80 text-brandpink-800 text-xs font-semibold">
            <span>{ui.heroTag}</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight">
            {ui.title}
          </h1>
          
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-light">
            {ui.subtitle}
          </p>
        </div>

        {/* Comparison Section: Vision vs Reality */}
        <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
          {/* Vision card */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-emerald-500/30 transition-colors">
            <div className="p-3 border-b border-stone-100 bg-stone-50/50 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                💚 {ui.visionTitle}
              </span>
            </div>
            <div className="aspect-[4/3] relative bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/cozy_cat_hero.png" 
                alt="Cozy Cat Hero" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Reality card */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-brandpink-500/30 transition-colors">
            <div className="p-3 border-b border-stone-100 bg-stone-50/50 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brandpink-700">
                ⚠️ {ui.realityTitle}
              </span>
            </div>
            <div className="aspect-[4/3] relative bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/shelter_conditions.png" 
                alt="Shelter Conditions Cages" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Reality statement banner */}
        <div className="w-full max-w-2xl px-4 text-center">
          <p className="text-xs text-stone-600 leading-relaxed max-w-lg mx-auto bg-brandpink-50/50 border border-brandpink-200/40 rounded-xl p-3.5 italic">
            &ldquo;{ui.realityNote}&rdquo;
          </p>
        </div>

        {/* Micro-Storytelling Section */}
        <div className="w-full max-w-2xl px-4">
          <div className="bg-brandpink-50/30 border border-brandpink-200/40 rounded-2xl p-6 space-y-3 relative overflow-hidden shadow-inner">
            <div className="absolute right-4 top-4 text-brandpink-500/10 pointer-events-none">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h3 className="text-xs font-bold text-stone-900 tracking-tight flex items-center space-x-1.5">
              <span>{ui.storyTitle}</span>
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed font-light italic">
              {ui.storyText}
            </p>
          </div>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl px-4">
          <Link 
            href="/katzen"
            className="group flex flex-col items-center text-center p-6 bg-white hover:bg-stone-50 border border-stone-200 hover:border-brandpink-500/60 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-brandpink-50 text-brandpink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold mb-2 text-stone-900 group-hover:text-brandpink-600 transition-colors">
              {ui.ctaGalleryTitle}
            </h2>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed flex-1 font-light">
              {ui.ctaGalleryDesc}
            </p>
            <span className="text-xs font-semibold text-brandpink-600 group-hover:underline mt-auto">
              {ui.ctaGalleryBtn} →
            </span>
          </Link>

          <Link 
            href="/katzen-ratgeber"
            className="group flex flex-col items-center text-center p-6 bg-white hover:bg-stone-50 border border-stone-200 hover:border-brandpink-500/60 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-brandpink-50 text-brandpink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold mb-2 text-stone-900 group-hover:text-brandpink-600 transition-colors">
              {ui.ctaGuideTitle}
            </h2>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed flex-1 font-light">
              {ui.ctaGuideDesc}
            </p>
            <span className="text-xs font-semibold text-brandpink-600 group-hover:underline mt-auto">
              {ui.ctaGuideBtn} →
            </span>
          </Link>

          <Link 
            href="/ueber-uns"
            className="group flex flex-col items-center text-center p-6 bg-white hover:bg-stone-50 border border-stone-200 hover:border-emerald-500/60 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold mb-2 text-stone-900 group-hover:text-emerald-600 transition-colors">
              {ui.ctaAboutTitle}
            </h2>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed flex-1 font-light">
              {ui.ctaAboutDesc}
            </p>
            <span className="text-xs font-semibold text-emerald-600 group-hover:underline mt-auto">
              {ui.ctaAboutBtn} →
            </span>
          </Link>
        </div>

        {/* Dynamic CMS Blocks */}
        {pageBlocks.length > 0 && (
          <div className="w-full max-w-2xl px-4 space-y-6 pt-6 border-t border-stone-200">
            {pageBlocks.map((block) => {
              const textContent = lang === 'DE' ? block.de : block.lt;
              if (block.type === 'title') {
                return (
                  <h2 key={block.id} className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-6 first:mt-0 text-center sm:text-left">
                    {textContent}
                  </h2>
                );
              }
              if (block.type === 'paragraph') {
                return (
                  <p key={block.id} className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light whitespace-pre-wrap">
                    {textContent}
                  </p>
                );
              }
              if (block.type === 'image') {
                const imgUrl = lang === 'DE' ? block.de : block.lt;
                return (
                  <div key={block.id} className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imgUrl} 
                      alt="CMS Block" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

      </main>

      {/* Newsletter Signup Section */}
      <section className="bg-gradient-to-b from-stone-50 to-amber-50/30 border-t border-stone-200 px-6 py-12">
        <div className="max-w-xl mx-auto text-center space-y-6">
          {nlStatus === 'success' ? (
            <div className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-sm space-y-3 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-stone-800">{ui.newsletterSuccess}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/60 border border-amber-200/60 text-amber-800 text-xs font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Newsletter</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">{ui.newsletterTitle}</h2>
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-light">{ui.newsletterDesc}</p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setNlSubmitting(true);
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(nlEmail)) {
                  setNlStatus('invalid');
                  setNlSubmitting(false);
                  return;
                }
                try {
                  const existing = await db.subscribers.where('email').equalsIgnoreCase(nlEmail.trim()).first();
                  if (existing) {
                    setNlStatus('duplicate');
                    setNlSubmitting(false);
                    return;
                  }

                  // Fetch user's public IP address with timeout
                  let ipAddress = 'Unbekannt';
                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 1500);
                    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (ipRes.ok) {
                      const ipData = await ipRes.json();
                      if (ipData && ipData.ip) {
                        ipAddress = ipData.ip;
                      }
                    }
                  } catch (e) {
                    console.warn('IP fetch failed or timed out:', e);
                  }

                   await db.subscribers.add({
                    email: nlEmail.trim().toLowerCase(),
                    name: nlName.trim(),
                    created_at: new Date().toISOString(),
                    preferences: nlPrefs.length > 0 ? nlPrefs : ['adoptions'],
                    ip_address: ipAddress,
                    sync_pending: 1,
                    updated_at: new Date().toISOString(),
                  });
                  
                  // Trigger background sync
                  syncWithCloud().catch((err) => {
                    console.error('Background sync failed after newsletter signup:', err);
                  });

                  setNlStatus('success');
                } catch {
                  setNlStatus('invalid');
                } finally {
                  setNlSubmitting(false);
                }
              }} className="max-w-md mx-auto space-y-4 text-left">
                <div>
                  <input
                    type="email"
                    value={nlEmail}
                    onChange={(e) => { setNlEmail(e.target.value); setNlStatus('idle'); }}
                    placeholder={ui.newsletterEmail}
                    required
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 focus:ring-1 focus:ring-brandpink-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={nlName}
                    onChange={(e) => setNlName(e.target.value)}
                    placeholder={ui.newsletterName}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 focus:ring-1 focus:ring-brandpink-500 transition-all text-sm"
                  />
                </div>

                {/* Topic preferences */}
                <div className="space-y-2">
                  {[
                    { key: 'adoptions', label: `🐾 ${ui.newsletterPrefAdoptions}` },
                    { key: 'events', label: `🗓️ ${ui.newsletterPrefEvents}` },
                    { key: 'guides', label: `🩺 ${ui.newsletterPrefGuides}` },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-stone-200 cursor-pointer hover:border-brandpink-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={nlPrefs.includes(key)}
                        onChange={(e) => {
                          setNlPrefs(prev =>
                            e.target.checked ? [...prev, key] : prev.filter(p => p !== key)
                          );
                        }}
                        className="w-4 h-4 rounded border-stone-300 text-brandpink-600 focus:ring-brandpink-500"
                      />
                      <span className="text-xs text-stone-700 font-medium">{label}</span>
                    </label>
                  ))}
                </div>

                {nlStatus === 'duplicate' && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{ui.newsletterDuplicate}</p>
                )}
                {nlStatus === 'invalid' && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{ui.newsletterInvalid}</p>
                )}

                <button
                  type="submit"
                  disabled={nlSubmitting}
                  className="w-full py-3.5 bg-brandpink-600 hover:bg-brandpink-500 disabled:bg-brandpink-300 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm"
                >
                  {nlSubmitting ? '...' : ui.newsletterBtn}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200/80 text-center text-xs text-stone-500 bg-stone-100/40">
        <p>{ui.footerText}</p>
        <p className="mt-1">{ui.regCode}: 302639996</p>
        <p className="mt-2">
          {ui.authorCredit}{' '}
          <a
            href="https://www.linkedin.com/in/director-it-development/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brandpink-600 hover:text-brandpink-700 font-semibold hover:underline"
          >
            Carlos Lucas
          </a>
        </p>
        <p className="mt-2">
          <Link href="/impressum" className="text-stone-500 hover:text-stone-700 hover:underline font-medium">
            {lang === 'DE' ? 'Impressum' : 'Teisinė informacija'}
          </Link>
        </p>
      </footer>
    </div>
  );
}
