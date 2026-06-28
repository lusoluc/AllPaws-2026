'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { logger } from '@/lib/logger';
import { db, type Animal } from '@/lib/db';
import { syncWithCloud } from '@/lib/syncManager';
import {
  ArrowLeft,
  Users,
  PenLine,
  ListChecks,
  Search,
  Trash2,
  UserPlus,
  Send,
  Zap,
  PawPrint,
  Mail,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';

type TabKey = 'subscribers' | 'compose' | 'queue';

export default function NewsletterPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');
  const [activeTab, setActiveTab] = useState<TabKey>('subscribers');

  // Subscriber tab state
  const [subSearch, setSubSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [addError, setAddError] = useState('');

  // Compose tab state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetPref, setTargetPref] = useState<string>('all');
  const [composeError, setComposeError] = useState('');

  // Queue tab state
  const [speedMode, setSpeedMode] = useState(false);
  const [queueLogs, setQueueLogs] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth check
  useEffect(() => {
    const session = localStorage.getItem('bmd_session');
    if (session !== 'authenticated') {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    const saved = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
    if (saved && (saved === 'DE' || saved === 'LT')) setLang(saved);
  }, [router]);

  // Live data
  const subscribers = useLiveQuery(() => db.subscribers.toArray());
  const campaigns = useLiveQuery(() => db.newsletterCampaigns.orderBy('created_at').reverse().toArray());
  const queueItems = useLiveQuery(() => db.newsletterQueue.toArray());
  const animals = useLiveQuery(() => db.animals.toArray());

  // Currently active campaign (last sending one)
  const activeCampaign = campaigns?.find(c => c.status === 'sending') || campaigns?.[0];

  // Filtered subscribers
  const filteredSubs = subscribers?.filter(s =>
    s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(subSearch.toLowerCase())
  );

  // Add subscriber manually
  const handleAddSubscriber = async () => {
    setAddError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSubEmail)) {
      setAddError(lang === 'DE' ? 'Ungültige E-Mail-Adresse.' : 'Neteisingas el. pašto adresas.');
      return;
    }
    const existing = await db.subscribers.where('email').equalsIgnoreCase(newSubEmail.trim()).first();
    if (existing) {
      setAddError(lang === 'DE' ? 'Diese E-Mail ist bereits registriert.' : 'Šis el. paštas jau registruotas.');
      return;
    }
    await db.subscribers.add({
      email: newSubEmail.trim().toLowerCase(),
      name: newSubName.trim(),
      created_at: new Date().toISOString(),
      preferences: ['adoptions', 'events', 'guides'],
      ip_address: lang === 'DE' ? 'Helper-Portal' : 'Savanorių portalas',
      sync_pending: 1,
      updated_at: new Date().toISOString(),
    });
    setNewSubEmail('');
    setNewSubName('');
    setShowAddForm(false);
    await logger.info('Newsletter', `Neuer Abonnent manuell hinzugefügt: ${newSubEmail}`);
    
    // Trigger background sync
    syncWithCloud().catch((err) => {
      console.error('Background sync failed after manual subscriber creation:', err);
    });
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (id: number, email: string) => {
    await db.subscribers.delete(id);
    await logger.info('Newsletter', `Abonnent entfernt: ${email}`);
    
    // Delete from Supabase if online
    const { supabase } = await import('@/lib/supabaseClient');
    if (supabase) {
      await supabase.from('subscribers').delete().eq('email', email);
    }
  };

  // Insert animal snippet into body
  const insertAnimalSnippet = (animal: Animal) => {
    const snippet = `\n🐾 ${animal.name} (${animal.age_years} ${lang === 'DE' ? 'Jahre' : 'metai'}, ${animal.status_aktuell}): ${animal.reason_for_shelter || (lang === 'DE' ? 'Wartet auf ein liebevolles Zuhause!' : 'Laukia mylinčių namų!')}\n`;
    setBody(prev => prev + snippet);
  };

  // Start campaign dispatch
  const handleStartCampaign = async () => {
    setComposeError('');
    if (!subject.trim() || !body.trim()) {
      setComposeError(lang === 'DE' ? 'Betreff und Inhalt dürfen nicht leer sein.' : 'Tema ir turinys negali būti tušti.');
      return;
    }

    // Filter subscribers by preference
    let recipients = subscribers || [];
    if (targetPref !== 'all') {
      recipients = recipients.filter(s => s.preferences.includes(targetPref));
    }
    if (recipients.length === 0) {
      setComposeError(lang === 'DE' ? 'Keine Abonnenten für diese Auswahl gefunden.' : 'Nerasta prenumeratorių pagal pasirinktą filtrą.');
      return;
    }

    // Create campaign
    const campaignId = await db.newsletterCampaigns.add({
      subject: subject.trim(),
      body: body.trim(),
      created_at: new Date().toISOString(),
      sent_count: 0,
      total_recipients: recipients.length,
      status: 'sending',
    });

    // Create queue items with staggered scheduling
    const BATCH_SIZE = 20;
    const DELAY_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    for (let i = 0; i < recipients.length; i++) {
      const batchIndex = Math.floor(i / BATCH_SIZE);
      const scheduledFor = new Date(now + batchIndex * DELAY_MS).toISOString();
      await db.newsletterQueue.add({
        campaign_id: campaignId as number,
        subscriber_email: recipients[i].email,
        subject: subject.trim(),
        body: body.trim(),
        status: 'pending',
        scheduled_for: scheduledFor,
      });
    }

    await logger.info('Newsletter', `Kampagne "${subject}" gestartet mit ${recipients.length} Empfängern.`);
    setQueueLogs([`[${new Date().toLocaleTimeString()}] ${lang === 'DE' ? 'Newsletter-Kampagne gestartet!' : 'Naujienlaiškio kampanija pradėta!'} ${recipients.length} ${lang === 'DE' ? 'Empfänger' : 'gavėjai'}.`]);
    setActiveTab('queue');

    // Start processing
    processQueue(campaignId as number);
  };

  // Process the queue in batches
  const processQueue = useCallback(async (campaignId: number) => {
    const BATCH_SIZE = 20;
    const intervalMs = speedMode ? 5000 : 5 * 60 * 1000;

    const processBatch = async () => {
      const pendingItems = await db.newsletterQueue
        .where('campaign_id').equals(campaignId)
        .and(item => item.status === 'pending')
        .limit(BATCH_SIZE)
        .toArray();

      if (pendingItems.length === 0) {
        // All done
        await db.newsletterCampaigns.update(campaignId, { status: 'completed' });
        setQueueLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${lang === 'DE' ? 'Alle Mails versendet! Kampagne abgeschlossen.' : 'Visi laiškai išsiųsti! Kampanija baigta.'}`]);
        if (timerRef.current) clearInterval(timerRef.current);
        await logger.info('Newsletter', 'Kampagne abgeschlossen.');
        return;
      }

      // Send batch based on provider settings
      const batchEmails: string[] = [];
      const failedEmails: string[] = [];

      let emailSettings: any = { provider: 'simulation' };
      try {
        const saved = localStorage.getItem('allpaws_email_settings');
        if (saved) {
          emailSettings = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Error loading email settings:', e);
      }

      const provider = emailSettings.provider || 'simulation';
      const authPass = localStorage.getItem('bmd_user_pass') || '';

      for (const item of pendingItems) {
        if (provider === 'simulation') {
          await db.newsletterQueue.update(item.id!, {
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
          batchEmails.push(item.subscriber_email);
        } else {
          try {
            const res = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                authPassword: authPass,
                settings: emailSettings,
                email: {
                  to: item.subscriber_email,
                  subject: item.subject,
                  body: item.body,
                }
              })
            });
            const resData = await res.json().catch(() => ({}));

            if (res.ok && resData.success) {
              await db.newsletterQueue.update(item.id!, {
                status: 'sent',
                sent_at: new Date().toISOString(),
              });
              batchEmails.push(item.subscriber_email);
            } else {
              const errMsg = resData.error || 'Server-Fehler beim Versenden';
              await db.newsletterQueue.update(item.id!, {
                status: 'failed',
              });
              failedEmails.push(`${item.subscriber_email} (${errMsg})`);
            }
          } catch (err: any) {
            await db.newsletterQueue.update(item.id!, {
              status: 'failed',
            });
            failedEmails.push(`${item.subscriber_email} (${err.message || 'Netzwerkfehler'})`);
          }
        }
      }

      // Update campaign sent count
      const campaign = await db.newsletterCampaigns.get(campaignId);
      if (campaign) {
        await db.newsletterCampaigns.update(campaignId, {
          sent_count: campaign.sent_count + batchEmails.length,
        });
      }

      const remaining = await db.newsletterQueue
        .where('campaign_id').equals(campaignId)
        .and(item => item.status === 'pending')
        .count();

      setQueueLogs(prev => [
        ...prev,
        ...(batchEmails.length > 0 ? [
          `[${new Date().toLocaleTimeString()}] 📨 Batch (${batchEmails.length} Mails) ${lang === 'DE' ? 'gesendet an' : 'išsiųsta'}: ${batchEmails.slice(0, 3).join(', ')}${batchEmails.length > 3 ? '...' : ''}`
        ] : []),
        ...(failedEmails.length > 0 ? [
          `[${new Date().toLocaleTimeString()}] ❌ ${lang === 'DE' ? 'Fehler bei' : 'Klaidos siunčiant'}: ${failedEmails.join(', ')}`
        ] : []),
        ...(remaining > 0 ? [`[${new Date().toLocaleTimeString()}] ⏳ ${remaining} ${lang === 'DE' ? 'Mails verbleibend. Nächster Batch in' : 'laiškų liko. Kitas siuntimas po'} ${speedMode ? '5s' : '5min'}.`] : []),
      ]);
    };

    // Process first batch immediately
    await processBatch();

    // Schedule remaining batches
    timerRef.current = setInterval(processBatch, intervalMs);
  }, [speedMode, lang]);

  // Toggle speed mode
  const toggleSpeedMode = useCallback(() => {
    setSpeedMode(prev => !prev);
    // If a campaign is active, restart with new timing
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (activeCampaign && activeCampaign.status === 'sending' && activeCampaign.id) {
      processQueue(activeCampaign.id);
    }
  }, [activeCampaign, processQueue]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center">
        <span className="w-8 h-8 border-4 border-brandpink-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const activeQueueItems = queueItems?.filter(q => activeCampaign && q.campaign_id === activeCampaign.id) || [];
  const sentCount = activeQueueItems.filter(q => q.status === 'sent').length;
  const totalCount = activeQueueItems.length;
  const progress = totalCount > 0 ? (sentCount / totalCount) * 100 : 0;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'subscribers', label: lang === 'DE' ? 'Abonnenten' : 'Prenumeratoriai', icon: <Users className="w-4 h-4" /> },
    { key: 'compose', label: lang === 'DE' ? 'Kampagne' : 'Kampanija', icon: <PenLine className="w-4 h-4" /> },
    { key: 'queue', label: lang === 'DE' ? 'Warteschlange' : 'Eilė', icon: <ListChecks className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="px-4 py-4 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-stone-850">
              {lang === 'DE' ? 'Newsletter-Zentrale' : 'Naujienlaiškių centras'}
            </h1>
            <p className="text-[10px] text-stone-500">AllPaws 2026</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLang(lang === 'DE' ? 'LT' : 'DE')}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors border border-stone-200 shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500" />
            <span>{lang}</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-stone-200 px-4 py-2 flex space-x-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-brandpink-50 text-brandpink-700 border border-brandpink-200'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50 border border-transparent'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* ===== TAB 1: SUBSCRIBERS ===== */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm text-center">
                <div className="text-[10px] text-stone-500 font-semibold">{lang === 'DE' ? 'Gesamt' : 'Iš viso'}</div>
                <div className="text-xl font-extrabold text-stone-850">{subscribers?.length || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm text-center">
                <div className="text-[10px] text-stone-500 font-semibold">{lang === 'DE' ? 'Adoptionen' : 'Įvaikinimas'}</div>
                <div className="text-xl font-extrabold text-brandpink-600">{subscribers?.filter(s => s.preferences.includes('adoptions')).length || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm text-center">
                <div className="text-[10px] text-stone-500 font-semibold">{lang === 'DE' ? 'Events' : 'Renginiai'}</div>
                <div className="text-xl font-extrabold text-amber-600">{subscribers?.filter(s => s.preferences.includes('events')).length || 0}</div>
              </div>
            </div>

            {/* Search + Add */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder={lang === 'DE' ? 'Abonnent suchen...' : 'Ieškoti prenumeratoriaus...'}
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm"
                />
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-1 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-semibold transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'DE' ? 'Hinzufügen' : 'Pridėti'}</span>
              </button>
            </div>

            {/* Add subscriber form */}
            {showAddForm && (
              <div className="bg-white border border-emerald-200 rounded-xl p-4 space-y-3 shadow-sm">
                <input
                  type="email"
                  placeholder={lang === 'DE' ? 'E-Mail-Adresse' : 'El. paštas'}
                  value={newSubEmail}
                  onChange={e => { setNewSubEmail(e.target.value); setAddError(''); }}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-brandpink-500"
                />
                <input
                  type="text"
                  placeholder={lang === 'DE' ? 'Name (optional)' : 'Vardas (neprivaloma)'}
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-brandpink-500"
                />
                {addError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{addError}</p>
                )}
                <button
                  onClick={handleAddSubscriber}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {lang === 'DE' ? 'Abonnent hinzufügen' : 'Pridėti prenumeratorių'}
                </button>
              </div>
            )}

            {/* Subscriber list */}
            <div className="space-y-2">
              {filteredSubs?.map(sub => (
                <div key={sub.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{sub.name || '—'}</p>
                    <p className="text-xs text-stone-500 truncate">{sub.email}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-stone-400 font-light">
                      <span>
                        📅 {sub.created_at ? new Date(sub.created_at).toLocaleString(lang === 'DE' ? 'de-DE' : 'lt-LT', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '—'}
                      </span>
                      {sub.ip_address && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span>🌐 {sub.ip_address}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {sub.preferences.map(p => (
                        <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                          {p === 'adoptions' ? '🐾' : p === 'events' ? '🗓️' : '🩺'} {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => sub.id && handleDeleteSubscriber(sub.id, sub.email)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                    title={lang === 'DE' ? 'Entfernen' : 'Pašalinti'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredSubs?.length === 0 && (
                <p className="text-center text-xs text-stone-500 py-8">
                  {lang === 'DE' ? 'Keine Abonnenten gefunden.' : 'Prenumeratorių nerasta.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB 2: COMPOSE ===== */}
        {activeTab === 'compose' && (
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold text-stone-800 flex items-center space-x-2">
                <PenLine className="w-4 h-4 text-brandpink-600" />
                <span>{lang === 'DE' ? 'Newsletter schreiben' : 'Rašyti naujienlaiškį'}</span>
              </h2>

              {/* Target filter */}
              <div>
                <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block mb-1">
                  {lang === 'DE' ? 'Zielgruppe' : 'Tikslinė grupė'}
                </label>
                <select
                  value={targetPref}
                  onChange={e => setTargetPref(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-brandpink-500 bg-white"
                >
                  <option value="all">{lang === 'DE' ? 'Alle Abonnenten' : 'Visi prenumeratoriai'} ({subscribers?.length || 0})</option>
                  <option value="adoptions">🐾 {lang === 'DE' ? 'Adoptionen' : 'Įvaikinimas'} ({subscribers?.filter(s => s.preferences.includes('adoptions')).length || 0})</option>
                  <option value="events">🗓️ Events ({subscribers?.filter(s => s.preferences.includes('events')).length || 0})</option>
                  <option value="guides">🩺 {lang === 'DE' ? 'Ratgeber' : 'Patarimai'} ({subscribers?.filter(s => s.preferences.includes('guides')).length || 0})</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block mb-1">
                  {lang === 'DE' ? 'Betreff' : 'Tema'}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={lang === 'DE' ? 'z.B. Neue Fellnasen suchen ein Zuhause! 🐾' : 'Pvz. Nauji gyventojai ieško namų! 🐾'}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-brandpink-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block mb-1">
                  {lang === 'DE' ? 'Inhalt' : 'Turinys'}
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={lang === 'DE' ? 'Schreibe hier deinen Newsletter-Text...' : 'Rašyk naujienlaiškio tekstą čia...'}
                  rows={8}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-brandpink-500 resize-y"
                />
              </div>

              {/* Animal Insertion Helper */}
              {animals && animals.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center space-x-1">
                    <PawPrint className="w-3.5 h-3.5" />
                    <span>{lang === 'DE' ? 'Tier-Profil einfügen' : 'Įterpti gyvūno profilį'}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {animals.filter(a => a.is_published).map(animal => (
                      <button
                        key={animal.id}
                        onClick={() => insertAnimalSnippet(animal)}
                        className="px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                      >
                        🐾 {animal.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {composeError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{composeError}</span>
                </p>
              )}

              <button
                onClick={handleStartCampaign}
                disabled={activeCampaign?.status === 'sending'}
                className="w-full py-3.5 bg-brandpink-600 hover:bg-brandpink-500 disabled:bg-stone-300 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'DE' ? 'Versand starten' : 'Pradėti siuntimą'}</span>
              </button>
              {activeCampaign?.status === 'sending' && (
                <p className="text-xs text-amber-700 text-center">
                  {lang === 'DE' ? '⏳ Eine Kampagne läuft bereits...' : '⏳ Kampanija jau vyksta...'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ===== TAB 3: QUEUE MONITOR ===== */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Progress Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-stone-800 flex items-center space-x-2">
                  <ListChecks className="w-4 h-4 text-brandpink-600" />
                  <span>{lang === 'DE' ? 'Versand-Status' : 'Siuntimo būsena'}</span>
                </h2>
                <button
                  onClick={toggleSpeedMode}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    speedMode
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{lang === 'DE' ? (speedMode ? 'Turbo aktiv!' : 'Simulation beschleunigen') : (speedMode ? 'Turbo aktyvus!' : 'Pagreitinti simuliaciją')}</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>{lang === 'DE' ? 'Fortschritt' : 'Progresas'}</span>
                  <span className="font-semibold text-stone-700">{sentCount} / {totalCount}</span>
                </div>
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brandpink-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Campaign info */}
              {activeCampaign && (
                <div className="flex items-center space-x-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <Mail className="w-4 h-4 text-brandpink-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 truncate">{activeCampaign.subject || '—'}</p>
                    <p className="text-stone-500">
                      {activeCampaign.status === 'sending' && (
                        <span className="text-amber-600 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{lang === 'DE' ? 'Wird versendet...' : 'Siunčiama...'}</span>
                        </span>
                      )}
                      {activeCampaign.status === 'completed' && (
                        <span className="text-emerald-600 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lang === 'DE' ? 'Abgeschlossen' : 'Baigta'}</span>
                        </span>
                      )}
                      {activeCampaign.status === 'draft' && (
                        <span className="text-stone-500">{lang === 'DE' ? 'Entwurf' : 'Juodraštis'}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Event Log */}
            <div className="bg-stone-900 rounded-2xl p-4 shadow-lg border border-stone-700">
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider mb-3">
                {lang === 'DE' ? '📋 Live-Protokoll' : '📋 Tiesioginis protokolas'}
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono">
                {queueLogs.length > 0 ? (
                  queueLogs.map((log, i) => (
                    <p key={i} className="text-xs text-emerald-400 leading-relaxed">{log}</p>
                  ))
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    {lang === 'DE' ? 'Noch keine Aktivität. Starte eine Kampagne!' : 'Kol kas nėra veiklos. Pradėk kampaniją!'}
                  </p>
                )}
              </div>
            </div>

            {/* Queue items list */}
            {activeQueueItems.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                  {lang === 'DE' ? 'Einzelne Mails' : 'Atskiri laiškai'}
                </p>
                {activeQueueItems.slice(0, 30).map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-stone-200 text-xs">
                    <span className="text-stone-700 truncate flex-1">{item.subscriber_email}</span>
                    {item.status === 'sent' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : item.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                  </div>
                ))}
                {activeQueueItems.length > 30 && (
                  <p className="text-xs text-stone-500 text-center py-2">
                    +{activeQueueItems.length - 30} {lang === 'DE' ? 'weitere' : 'daugiau'}...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-stone-200 text-center text-[10px] text-stone-500 bg-stone-100/40">
        <p>
          {lang === 'DE' ? 'App entwickelt mit ❤️ von' : 'Programėlę su ❤️ sukūrė'}{' '}
          <a href="https://www.linkedin.com/in/director-it-development/" target="_blank" rel="noopener noreferrer" className="text-brandpink-600 hover:underline font-semibold">Carlos Lucas</a>
        </p>
      </footer>
    </div>
  );
}
