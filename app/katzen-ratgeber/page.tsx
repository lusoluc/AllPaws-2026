'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { guideItems, GuideItem, iconMap } from '@/lib/ratgeberData';
import { 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Smile, 
  Activity, 
  Utensils, 
  Home, 
  ShieldAlert,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';
import PublicHeader from '@/components/PublicHeader';

type Category = 'all' | 'behavior' | 'bodyLanguage' | 'nutrition' | 'safety' | 'problems';

export default function KatzenRatgeberPage() {
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
  const [activeTab, setActiveTab] = useState<Category>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const shelter = useLiveQuery(() => db.shelters.limit(1).first());
  const dbGuideItems = useLiveQuery(() => db.guideItems.toArray());
  const uiTexts = useLiveQuery(() => db.uiTexts.toArray());
  const customBlocks = useLiveQuery(() => db.customBlocks.toArray());

  const pageBlocks = customBlocks
    ?.filter((b) => b.page === 'guide')
    .sort((a, b) => a.sort_order - b.sort_order) || [];

  const defaultUi = {
    DE: {
      title: 'Katzen-Ratgeber & FAQ 📖',
      subtitle: 'Alles, was neue Katzenbesitzer und Stadtmenschen über Haltung, Verhalten und Pflege wissen sollten.',
      homeLink: 'Startseite',
      galleryLink: 'Zur Katzen-Galerie',
      tabs: {
        all: 'Alle Themen',
        behavior: 'Verhalten & Eingewöhnung',
        bodyLanguage: 'Körpersprache',
        nutrition: 'Ernährung & Gesundheit',
        safety: 'Wohnung & Sicherheit',
        problems: 'Problematisches Verhalten'
      },
      warningTitle: 'Wichtiger Hinweis für Stadtwohnungen',
      warningDesc: 'Katzen benötigen in Wohnungen ausreichend Beschäftigung, Kratzmöglichkeiten und vor allem gesicherte Fenster (Kippschutz!), um ein glückliches und sicheres Leben zu führen.',
      noItems: 'Keine Einträge in dieser Kategorie gefunden.',
      footerText: '© 2026 VšĮ "Būk mano draugas". Kaukėnų g. 9, Glaudėnai, Litauen.',
      regCode: 'Registrierungscode'
    },
    LT: {
      title: 'Kačių gidas ir DUK 📖',
      subtitle: 'Viskas, ką nauji kačių šeimininkai ir miesto žmonės turėtų žinoti apie kačių elgseną, priežiūrą bei saugumą.',
      homeLink: 'Pradžia',
      galleryLink: 'Kačių galerija',
      tabs: {
        all: 'Visos temos',
        behavior: 'Elgsena ir pripratinimas',
        bodyLanguage: 'Kūno kalba',
        nutrition: 'Mityba ir sveikata',
        safety: 'Saugumas ir butas',
        problems: 'Probleminis elgesys'
      },
      warningTitle: 'Svarbi pastaba gyvenantiems butuose',
      warningDesc: 'Katėms butuose reikia pakankamai veiklos, vietų draskymui ir ypač apsaugotų langų (apsaugos nuo atvertimo!), kad jos gyventų laimingą ir saugų gyvenimą.',
      noItems: 'Šioje kategorijoje įrašų nerasta.',
      footerText: '© 2026 VšĮ „Būk mano draugas“. Kaukėnų g. 9, Glaudėnai, Lietuva.',
      regCode: 'Įmonės kodas'
    }
  };

  const ui = { ...defaultUi[lang] };
  if (uiTexts) {
    uiTexts.forEach((item) => {
      if (item.key.startsWith('ratgeber.')) {
        const subKey = item.key.split('.')[1];
        if (subKey in ui) {
          (ui as any)[subKey] = item[lang] || (ui as any)[subKey];
        }
      }
    });
  }

  // Resolve guide items (either from IndexedDB or static fallback)
  const activeGuideItems = (dbGuideItems && dbGuideItems.length > 0)
    ? dbGuideItems.map(item => ({
        id: item.id,
        category: item.category,
        icon: iconMap[item.iconName] || iconMap['Smile'],
        question: item.question,
        answer: item.answer
      }))
    : guideItems;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredItems = activeTab === 'all' 
    ? activeGuideItems 
    : activeGuideItems.filter(item => item.category === activeTab);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      
      {/* Header */}
      <PublicHeader lang={lang} setLang={setLang} />

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6 pb-16">
        
        {/* Back navigation link */}
        <div>
          <NextLink href="/" className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'DE' ? 'Zurück zur Startseite' : 'Atgal į pradžią'}</span>
          </NextLink>
        </div>

        {/* Title */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">{ui.title}</h1>
          <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">{ui.subtitle}</p>
        </div>

        {/* Important Warning Banner */}
        <section className="bg-brandpink-50/50 border border-brandpink-200/50 rounded-2xl p-5 flex items-start space-x-3.5">
          <ShieldAlert className="w-5 h-5 text-brandpink-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-stone-900">{ui.warningTitle}</h3>
            <p className="text-[11px] text-stone-600 leading-relaxed font-light">
              {ui.warningDesc}
            </p>
          </div>
        </section>

        {/* Category Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 pb-2">
          {(Object.keys(ui.tabs) as Array<keyof typeof ui.tabs>).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive 
                    ? 'bg-stone-900 border-stone-950 text-white shadow-sm' 
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                {ui.tabs[tab]}
              </button>
            );
          })}
        </div>

        {/* Q&A Accordion List */}
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const IconComponent = item.icon;
              const isExpanded = !!expandedIds[item.id];
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:border-stone-300 transition-colors"
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full text-left p-5 flex items-center justify-between space-x-3 hover:bg-stone-50/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.category === 'problems' ? 'bg-red-50 text-red-600' :
                        item.category === 'safety' ? 'bg-rose-50 text-rose-600' :
                        item.category === 'nutrition' ? 'bg-emerald-50 text-emerald-600' :
                        item.category === 'bodyLanguage' ? 'bg-brandpink-50 text-brandpink-600' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        <IconComponent className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 leading-snug">
                        {item.question[lang]}
                      </span>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-stone-100 bg-stone-50/20">
                      <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-line">
                        {item.answer[lang]}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-2xl text-stone-500 text-xs">
              {ui.noItems}
            </div>
          )}
        </div>

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
      <footer className="py-6 border-t border-stone-200/80 text-center text-xs text-stone-500 bg-stone-100/40 mt-auto">
        <p>{ui.footerText}</p>
        <p className="mt-1">{ui.regCode}: 302639996</p>
      </footer>
    </div>
  );
}
