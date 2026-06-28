'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { 
  MapPin, 
  Calendar, 
  Info,
  Globe,
  Award,
  Sparkles,
  Inbox,
  ArrowRight
} from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';
import { APP_CONFIG } from '@/lib/appConfig';

export default function UeberUnsPage() {
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

  const shelter = useLiveQuery(() => db.shelters.limit(1).first());

  const defaultUi = {
    DE: {
      title: 'Über Uns & Das Team',
      subtitle: 'Wie aus Liebe zu hilflosen Seelen eine Lebensaufgabe wurde – und warum wir jede helfende Hand brauchen.',
      homeLink: 'Startseite',
      galleryLink: 'Zur Katzen-Galerie',
      historyTitle: 'Unsere Geschichte: Ein Weg aus Liebe und Schweiß',
      historyText1: 'Hinter unserem Tierheim steht kein reicher Großsponsor und kein staatliches Budget. Alles begann vor einigen Jahren, als Tierfreunde die Not der Straßentiere nicht mehr mitansehen konnten. Was als private Rettungsaktion im kleinen Kreis begann, ist zu einer permanenten Zuflucht angewachsen. Wir gehen täglich an unsere körperlichen und finanziellen Grenzen, um diesen wunderbaren Geschöpfen Schutz zu bieten.',
      historyText2: 'Unser oberstes Ziel ist einfach, aber lebenswichtig: Jedes gerettete Tier soll spüren, dass es geliebt wird, während wir medizinische Notversorgung leisten und nach einem endgültigen Zuhause suchen. Wir arbeiten unermüdlich ehrenamtlich als Brücke ins neue Leben und vermitteln Adoptionen.',
      containerTitle: 'Das Container-Projekt 🐈',
      containerSubtitle: 'Gebaut mit unseren eigenen Händen',
      containerText: 'Als der Platz im Tierheim nicht mehr reichte und wir Tiere hätten abweisen müssen, haben wir beschlossen zu kämpfen. Die Idee: Jedes Tier verdient ein sicheres Plätzchen. Mit privatem Schweiß, Spenden und der Hilfe von freiwilligen Helfern haben wir Räumlichkeiten isoliert, klimatisiert und gemütlich ausgestattet.',
      teamTitle: 'Das Team vor Ort & International',
      galinaTitle: APP_CONFIG.shelter.representatives[0].name,
      galinaDesc: APP_CONFIG.shelter.representatives[0].roleDe,
      zanaTitle: APP_CONFIG.shelter.representatives[1].name,
      zanaDesc: APP_CONFIG.shelter.representatives[1].roleDe,
      contactDe: 'Deutscher Support E-Mail',
      contactLt: 'Litauen E-Mail',
      regCode: 'Registrierungscode',
      donationTitle: 'Unterstütze unsere Herzensarbeit',
      donationText: 'Jeder Cent, jede Stunde und jede Zeile Code wird privat beigetragen. Wir erhalten keine staatliche Förderung. Deine Spende fließt zu 100 % direkt in Futter, dringend benötigte Medikamente und den Ausbau der warmen Container.',
      bankName: 'Bank',
      iban: 'IBAN',
      bic: 'BIC / SWIFT',
      purpose: 'Verwendungszweck',
      paypal: 'PayPal-Konto'
    },
    LT: {
      title: 'Apie mus ir komandą',
      subtitle: 'Kaip meilė bejėgiams gyvūnams tapo gyvenimo tikslu ir kodėl mums reikia kiekvienos pagalbos rankos.',
      homeLink: 'Pradžia',
      galleryLink: 'Kačių galerija',
      historyTitle: 'Mūsų istorija: kelias, grįstas meile ir rūpesčiu',
      historyText1: 'Už mūsų prieglaudos stovi ne turtingi rėmėjai ar valstybės biudžetas. Viskas prasidėjo, kai gyvūnų mylėtojai priglaudė pirmuosiuos sužeistus gyvūnus. Tai, kas prasidėjo kaip nedidelė gelbėjimo akcija, išaugo į nuolatinį prieglobstį. Kiekvieną dieną mes atiduodame paskutines savo jėgas ir asmenines lėšas, kad apsaugotume šias nuostabias sielas.',
      historyText2: 'Mūsų pagrindinis tikslas paprastas, bet gyvybiškai svarbus: kiekviena išgelbėta siela turi pajusti, kad yra mylima, kol mes suteikiame skubią pagalbą ir ieškome jai tikrųjų namų. Mes nenuilstamai savanoriaujame padėdami rasti namus ir organizuodami keliones.',
      containerTitle: 'Konteinerių projektas 🐈',
      containerSubtitle: 'Pastatyta mūsų pačių rankomis',
      containerText: 'Kai prieglaudoje pritrūko vietos, nusprendėme kovoti. Kilusi idėja: kiekvienas gyvūnas nusipelno saugios vietos. Savo rankomis, savanorių pagalba ir asmeninėmis lėšomis apšiltinome patalpas, įrengėme oro kondicionavimą ir jaukius guolius.',
      teamTitle: 'Vietinė ir tarptautinė komanda',
      galinaTitle: APP_CONFIG.shelter.representatives[0].name,
      galinaDesc: APP_CONFIG.shelter.representatives[0].roleLt,
      zanaTitle: APP_CONFIG.shelter.representatives[1].name,
      zanaDesc: APP_CONFIG.shelter.representatives[1].roleLt,
      contactDe: 'Vokietijos paramos el. paštas',
      contactLt: 'Lietuvos el. paštas',
      regCode: 'Įmonės kodas',
      donationTitle: 'Paremk mūsų širdies darbą',
      donationText: 'Kiekvienas centas, kiekviena valanda ir kiekviena kodo eilutė yra aukojami privačiai. Mes negauname valstybės paramos. Jūsų parama 100 % skiriama maistui, vaistams ir šiltų konteinerių erdvių išlaikymui.',
      bankName: 'Bankas',
      iban: 'Sąskaita (IBAN)',
      bic: 'BIC / SWIFT',
      purpose: 'Mokėjimo paskirtis',
      paypal: 'PayPal sąskaita'
    }
  };

  const uiTexts = useLiveQuery(() => db.uiTexts.toArray());
  const customBlocks = useLiveQuery(() => db.customBlocks.toArray());
  const ui = { ...defaultUi[lang] };
  if (uiTexts) {
    uiTexts.forEach((item) => {
      if (item.key.startsWith('ueberuns.')) {
        const subKey = item.key.split('.')[1];
        if (subKey in ui) {
          (ui as any)[subKey] = item[lang] || (ui as any)[subKey];
        }
      }
    });
  }

  const pageBlocks = customBlocks
    ?.filter((b) => b.page === 'about')
    .sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      
      {/* Header */}
      <header className="px-4 py-4 bg-white/80 border-b border-stone-200 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          {APP_CONFIG.theme.logoType === 'image' ? (
            <img src={APP_CONFIG.theme.logoImage} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brandpink-500 flex items-center justify-center shadow-md shadow-brandpink-500/10">
              <CatHeartLogo className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <NextLink href="/" className="font-bold text-sm tracking-wide bg-gradient-to-r from-brandpink-600 to-emerald-600 bg-clip-text text-transparent">
              {APP_CONFIG.theme.logoText}
            </NextLink>
            <span className="text-[9px] text-stone-500 block">{APP_CONFIG.shelter.locationShort}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setLang(lang === 'DE' ? 'LT' : 'DE')}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-100 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors border border-stone-200"
          >
            <Globe className="w-3.5 h-3.5 text-brandpink-600" />
            <span>{lang}</span>
          </button>

          <NextLink
            href="/katzen-ratgeber"
            className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
          >
            {lang === 'DE' ? 'Ratgeber' : 'Gidas'}
          </NextLink>
          
          <NextLink
            href="/katzen"
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition-colors"
          >
            {ui.galleryLink}
          </NextLink>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-8 pb-16">
        
        {/* Title */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">{ui.title}</h1>
          <p className="text-xs text-stone-500 mt-2">{ui.subtitle}</p>
        </div>

        {/* 1. History Section */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2 border-b border-stone-100 pb-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>{ui.historyTitle}</span>
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {ui.historyText1}
          </p>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {ui.historyText2}
          </p>

          {/* Documentary Photo of Crowded Shelter Cages */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold block">
              {lang === 'DE' ? 'Die Realität vor Ort: Viele Tiere warten auf Hilfe' : 'Realybė prieglaudoje: daug gyvūnų laukia pagalbos'}
            </span>
            <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-stone-200 shadow-inner bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/shelter_conditions.png" 
                alt="Shelter conditions cages" 
                className="w-full h-full object-cover" 
              />
            </div>
            <p className="text-[10px] text-stone-500 italic leading-normal">
              {lang === 'DE' 
                ? 'Aktuelle Situation: Aufgrund akuter räumlicher Notlagen müssen viele gerettete Katzen vorübergehend in Käfigen untergebracht werden, bis Platz frei wird oder sie ein Zuhause finden.' 
                : 'Šiuo metu dėl didelio vietos trūkumo kai kurios išgelbėtos katės prieglaudoje laikinai laikomos narvuose, kol atsilaisvina erdvė.'
              }
            </p>
          </div>
        </section>

        {/* 2. Container Project Section */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-brandpink-500/5 rounded-full blur-xl"></div>
          
          <h2 className="text-lg font-bold text-stone-900 flex flex-col">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              {ui.containerSubtitle}
            </span>
            <span className="text-stone-900">{ui.containerTitle}</span>
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed font-light border-l-2 border-brandpink-500 pl-4 py-1">
            {ui.containerText}
          </p>
        </section>

        {/* 3. Team Section */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2 border-b border-stone-100 pb-2">
            <Info className="w-5 h-5 text-brandpink-600" />
            <span>{ui.teamTitle}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Galina */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">{ui.galinaTitle}</h3>
                <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider block mt-0.5">
                  {lang === 'DE' ? 'Leitung' : 'Vadovas'}
                </span>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed font-light">
                  {ui.galinaDesc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-200 text-[10px] text-stone-500">
                <span className="block font-bold">{ui.contactLt}</span>
                <span className="text-stone-600">{shelter?.emailLt || APP_CONFIG.shelter.emailLt}</span>
              </div>
            </div>

            {/* Zana */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">{ui.zanaTitle}</h3>
                <span className="text-[10px] text-brandpink-600 font-semibold uppercase tracking-wider block mt-0.5">
                  {lang === 'DE' ? 'Auslands-Vermittlung' : 'Tarptautinis bendradarbiavimas'}
                </span>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed font-light">
                  {ui.zanaDesc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-200 text-[10px] text-stone-500">
                <span className="block font-bold">{ui.contactDe}</span>
                <span className="text-stone-600">{shelter?.emailDe || APP_CONFIG.shelter.emailDe}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Donation Section */}
        <section className="bg-white border border-stone-200 shadow-sm p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
            <Inbox className="w-5 h-5 text-emerald-600" />
            <span>{ui.donationTitle}</span>
          </h2>
          
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {ui.donationText}
          </p>

          {/* Transparent Cost Breakdown Table */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 shadow-inner">
            <span className="font-bold text-stone-500 block text-[10px] uppercase tracking-wider">
              {lang === 'DE' ? 'Wie deine Spende hilft' : 'Kaip jūsų parama padeda'}
            </span>
            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-800 font-bold">💰 10 €</span>
                <span className="text-stone-600 font-light">{lang === 'DE' ? '1 Woche gesundes Futter für eine Katze' : '1 savaitė pilnaverčio maisto vienai katei'}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-800 font-bold">🩺 25 €</span>
                <span className="text-stone-600 font-light">{lang === 'DE' ? 'Impfliste, Entwurmung & Flohschutz' : 'Skiepai, nukirminimas ir apsauga nuo parazitų'}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-800 font-bold">🐈 50 €</span>
                <span className="text-stone-600 font-light">{lang === 'DE' ? 'Kastration, Microchip & EU-Heimtierausweis' : 'Kastracija, čipavimas ir ES gyvūno pasas'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-800 font-bold">🔥 100 €</span>
                <span className="text-stone-600 font-light">{lang === 'DE' ? '1 Monat Raumheizung im kalten Winter' : '1 mėnuo patalpų šildymo šaltą žiemą'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Swedbank info */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs font-mono">
              <span className="font-bold text-stone-500 block font-sans text-[10px] uppercase tracking-wider">
                Bankverbindung
              </span>
              <div className="grid grid-cols-2 gap-2 text-stone-600">
                <div>
                  <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.bankName}</span>
                  <span className="text-stone-700">{shelter?.bankName || APP_CONFIG.shelter.bankName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.bic}</span>
                  <span className="text-stone-700">{shelter?.bic || APP_CONFIG.shelter.bic}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.iban}</span>
                  <span className="text-stone-900 select-all text-sm">{shelter?.iban || APP_CONFIG.shelter.iban}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.purpose}</span>
                  <span className="text-stone-700 font-sans">{shelter?.donationPurposeDe || APP_CONFIG.shelter.donationPurposeDe}</span>
                </div>
              </div>
            </div>

            {/* PayPal and Registration details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider mb-0.5">PayPal</span>
                <a 
                  href={`https://www.paypal.com/donate/?business=${shelter?.paypalEmail || APP_CONFIG.shelter.paypalEmail}`}
                  target="_blank" 
                  className="text-brandpink-600 font-mono hover:text-brandpink-700 truncate block mt-1"
                >
                  {shelter?.paypalEmail || APP_CONFIG.shelter.paypalEmail}
                </a>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                <span className="text-[9px] text-stone-500 font-bold block uppercase tracking-wider mb-0.5">
                  {ui.regCode}
                </span>
                <span className="text-stone-700 font-mono block mt-1">
                  {shelter?.code || APP_CONFIG.shelter.code}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic CMS Blocks */}
        {pageBlocks.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-stone-200">
            {pageBlocks.map((block) => {
              const textContent = lang === 'DE' ? block.de : block.lt;
              if (block.type === 'title') {
                return (
                  <h2 key={block.id} className="text-xl font-bold text-stone-900 tracking-tight mt-6 first:mt-0 text-center sm:text-left">
                    {textContent}
                  </h2>
                );
              }
              if (block.type === 'paragraph') {
                return (
                  <p key={block.id} className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-wrap">
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

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 text-center text-xs text-stone-500 bg-stone-100/60">
        <p>© 2026 {APP_CONFIG.shelter.name}. {APP_CONFIG.shelter.locationShort}.</p>
        <p className="mt-2">
          {lang === 'DE' ? 'App entwickelt mit ❤️ von' : 'Programėlę su ❤️ sukūrė'}{' '}
          <a
            href={APP_CONFIG.app.developerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brandpink-600 hover:text-brandpink-700 font-semibold hover:underline"
          >
            {APP_CONFIG.app.developerName}
          </a>
        </p>
        <div className="mt-2 flex items-center justify-center space-x-3">
          <NextLink href="/" className="text-stone-500 hover:text-stone-700 hover:underline">
            ← {ui.homeLink}
          </NextLink>
          <span className="text-stone-300">|</span>
          <NextLink href="/impressum" className="text-stone-500 hover:text-stone-700 hover:underline font-medium">
            {lang === 'DE' ? 'Impressum' : 'Teisinė informacija'}
          </NextLink>
        </div>
      </footer>
    </div>
  );
}
