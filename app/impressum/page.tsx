'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Globe, ArrowLeft } from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';
import PublicHeader from '@/components/PublicHeader';

export default function ImpressumPage() {
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');

  useEffect(() => {
    const saved = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
    if (saved && (saved === 'DE' || saved === 'LT')) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('bmd_lang', lang);
  }, [lang]);

  const ui = {
    DE: {
      title: 'Impressum',
      subtitle: 'Angaben gemäß § 5 TMG / Informationspflicht laut litauischem Recht',
      orgTitle: 'Verantwortliche Organisation',
      orgName: 'VšĮ „Būk mano draugas"',
      orgType: 'Gemeinnützige Einrichtung (VšĮ – Viešoji įstaiga)',
      regCode: 'Registrierungscode',
      address: 'Anschrift',
      addressValue: 'Kaukėnų g. 9, LT-92336 Glaudėnai\nKlaipėda raj., Sendvario sen.\nLitauen / Lietuva',
      phone: 'Telefon',
      emailTitle: 'E-Mail',
      emailDe: 'Deutscher Support',
      emailLt: 'Litauischer Kontakt',
      representedBy: 'Vertretungsberechtigt',
      galinaRole: 'Gründerin & Leiterin des Tierheims',
      zanaRole: 'Internationale Vermittlung (Deutschland, Österreich, Schweiz)',
      contentResponsible: 'Inhaltlich verantwortlich (§ 55 Abs. 2 RStV)',
      contentPerson: 'Galina Kučinskienė (Anschrift wie oben)',
      appDev: 'App-Entwicklung & Technik',
      appDevDesc: 'AllPaws 2026 wurde ehrenamtlich und privat entwickelt von',
      appDevNote: 'Die App ist ein privates Herzensprojekt und wird zu 100 % kostenlos für den Verein zur Verfügung gestellt. Es besteht kein kommerzielles Interesse.',
      disclaimerTitle: 'Haftungsausschluss',
      disclaimerContent: 'Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.',
      disclaimerContent2: 'Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.',
      copyrightTitle: 'Urheberrecht',
      copyrightContent: 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.',
      dataProtectionTitle: 'Datenschutz-Hinweis',
      dataProtectionContent: 'Diese App speichert Daten primär lokal auf Ihrem Gerät (IndexedDB / OPFS). Eine optionale Cloud-Synchronisation erfolgt über Supabase. Es werden keine personenbezogenen Daten zu Werbezwecken erhoben oder an Dritte weitergegeben. Newsletter-Anmeldungen werden ausschließlich für den Versand von Tierheim-Neuigkeiten verwendet.',
      homeLink: '← Zurück zur Startseite',
      donationTitle: 'Spendenkonto',
      bankName: 'Bank',
      iban: 'IBAN',
      bic: 'BIC / SWIFT',
      purpose: 'Verwendungszweck',
    },
    LT: {
      title: 'Teisinė informacija',
      subtitle: 'Informacija pagal Lietuvos teisės aktus ir Vokietijos TMG § 5',
      orgTitle: 'Atsakinga organizacija',
      orgName: 'VšĮ „Būk mano draugas"',
      orgType: 'Viešoji įstaiga (VšĮ)',
      regCode: 'Įmonės kodas',
      address: 'Adresas',
      addressValue: 'Kaukėnų g. 9, LT-92336 Glaudėnai\nKlaipėdos raj., Sendvario sen.\nLietuva',
      phone: 'Telefonas',
      emailTitle: 'El. paštas',
      emailDe: 'Vokietijos parama',
      emailLt: 'Lietuvos kontaktas',
      representedBy: 'Atstovaujama',
      galinaRole: 'Prieglaudos įkūrėja ir vadovė',
      zanaRole: 'Tarptautinis bendradarbiavimas (Vokietija, Austrija, Šveicarija)',
      contentResponsible: 'Už turinį atsakinga',
      contentPerson: 'Galina Kučinskienė (adresas kaip aukščiau)',
      appDev: 'Programėlės kūrimas ir technika',
      appDevDesc: 'AllPaws 2026 buvo sukurta savanoriškai ir privačiai',
      appDevNote: 'Programėlė yra asmeninis širdies projektas ir 100 % nemokamai teikiama organizacijai. Jokio komercinio intereso nėra.',
      disclaimerTitle: 'Atsakomybės apribojimas',
      disclaimerContent: 'Nepaisant kruopštaus turinio patikrinimo, mes neprisiimame atsakomybės už išorinių nuorodų turinį. Už susietų puslapių turinį atsako tik jų valdytojai.',
      disclaimerContent2: 'Mūsų puslapių turinys buvo sukurtas su didžiausiu rūpestingumu. Tačiau negalime garantuoti turinio tikslumo, išsamumo ir aktualumo.',
      copyrightTitle: 'Autorių teisės',
      copyrightContent: 'Puslapių turiniui taikoma autorių teisių apsauga. Dauginti, redaguoti ar platinti turinį galima tik gavus raštišką autoriaus sutikimą.',
      dataProtectionTitle: 'Privatumo politika',
      dataProtectionContent: 'Ši programėlė saugo duomenis pirmiausia vietiniame jūsų įrenginyje (IndexedDB / OPFS). Pasirenkama debesijos sinchronizacija vykdoma per Supabase. Jokie asmens duomenys nerenkami reklamai ar neperduodami trečiosioms šalims. Naujienlaiškio registracijos naudojamos tik prieglaudos naujienoms siųsti.',
      homeLink: '← Atgal į pagrindinį',
      donationTitle: 'Paramos sąskaita',
      bankName: 'Bankas',
      iban: 'Sąskaita (IBAN)',
      bic: 'BIC / SWIFT',
      purpose: 'Mokėjimo paskirtis',
    },
  }[lang];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <PublicHeader lang={lang} setLang={setLang} />

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6 pb-16">
        {/* Title */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">{ui.title}</h1>
          <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">{ui.subtitle}</p>
        </div>

        {/* Organisation Details */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.orgTitle}</h2>
          <div className="space-y-3 text-xs text-stone-700">
            <div>
              <span className="font-bold text-stone-900 block">{ui.orgName}</span>
              <span className="text-stone-500">{ui.orgType}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[9px] text-stone-500 uppercase font-semibold tracking-wider block">{ui.regCode}</span>
                <span className="font-mono text-stone-800">302639996</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-500 uppercase font-semibold tracking-wider block">{ui.phone}</span>
                <a href="tel:+37061436617" className="text-brandpink-600 hover:underline">+370 614 36617</a>
              </div>
            </div>
            <div>
              <span className="text-[9px] text-stone-500 uppercase font-semibold tracking-wider block">{ui.address}</span>
              <span className="whitespace-pre-line text-stone-800">{ui.addressValue}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[9px] text-stone-500 uppercase font-semibold tracking-wider block">{ui.emailDe}</span>
                <a href="mailto:Tierheimbmg@gmail.com" className="text-brandpink-600 hover:underline break-all">Tierheimbmg@gmail.com</a>
              </div>
              <div>
                <span className="text-[9px] text-stone-500 uppercase font-semibold tracking-wider block">{ui.emailLt}</span>
                <a href="mailto:bukmanodraugas@inbox.lt" className="text-brandpink-600 hover:underline break-all">bukmanodraugas@inbox.lt</a>
              </div>
            </div>
          </div>
        </section>

        {/* Represented By */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.representedBy}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <p className="text-sm font-bold text-stone-900">Galina Kučinskienė</p>
              <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mt-0.5">{ui.galinaRole}</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <p className="text-sm font-bold text-stone-900">Žana Baskytė</p>
              <p className="text-[10px] text-brandpink-600 font-semibold uppercase tracking-wider mt-0.5">{ui.zanaRole}</p>
            </div>
          </div>
        </section>

        {/* Content Responsibility */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-2">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.contentResponsible}</h2>
          <p className="text-xs text-stone-700">{ui.contentPerson}</p>
        </section>

        {/* App Development */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.appDev}</h2>
          <p className="text-xs text-stone-700">
            {ui.appDevDesc}{' '}
            <a
              href="https://www.linkedin.com/in/director-it-development/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brandpink-600 hover:text-brandpink-700 font-semibold hover:underline"
            >
              Carlos Lucas
            </a>.
          </p>
          <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-lg border border-stone-200">
            {ui.appDevNote}
          </p>
        </section>

        {/* Donation Account */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.donationTitle}</h2>
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 text-stone-600">
              <div>
                <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.bankName}</span>
                <span className="text-stone-700">Swedbank</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.bic}</span>
                <span className="text-stone-700">HABALT22</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.iban}</span>
                <span className="text-stone-900 select-all text-sm">LT97 7300 0101 2750 0736</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] text-stone-500 block font-sans uppercase">{ui.purpose}</span>
                <span className="text-stone-700 font-sans">Donate Germany</span>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.disclaimerTitle}</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{ui.disclaimerContent}</p>
          <p className="text-xs text-stone-600 leading-relaxed">{ui.disclaimerContent2}</p>
        </section>

        {/* Copyright */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.copyrightTitle}</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{ui.copyrightContent}</p>
        </section>

        {/* Data Protection */}
        <section className="bg-white border border-stone-200 shadow-sm rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">{ui.dataProtectionTitle}</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{ui.dataProtectionContent}</p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 text-center text-xs text-stone-500 bg-stone-100/60">
        <p>© 2026 VšĮ &quot;Būk mano draugas&quot;. Kaukėnų g. 9, Glaudėnai, Litauen.</p>
        <NextLink href="/" className="mt-2 text-stone-500 hover:text-stone-700 inline-block text-xs">
          {ui.homeLink}
        </NextLink>
      </footer>
    </div>
  );
}
