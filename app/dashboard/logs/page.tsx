'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { syncWithCloud } from '@/lib/syncManager';
import { 
  ArrowLeft, 
  Trash2, 
  Copy, 
  Search, 
  AlertTriangle, 
  Info, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Check,
  Terminal,
  Activity,
  FileSpreadsheet,
  Globe
} from 'lucide-react';

export default function LogsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'logs' | 'texts'>('logs');
  const [textSection, setTextSection] = useState<'static' | 'faq' | 'cms'>('static');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // States for text editing
  const [editDe, setEditDe] = useState('');
  const [editLt, setEditLt] = useState('');
  const [editDeQ, setEditDeQ] = useState('');
  const [editLtQ, setEditLtQ] = useState('');
  const [editDeA, setEditDeA] = useState('');
  const [editLtA, setEditLtA] = useState('');
  const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'saving' | null>>({});

  // CMS Custom Blocks states
  const [blockPage, setBlockPage] = useState<'home' | 'about' | 'guide'>('home');
  const [blockType, setBlockType] = useState<'title' | 'paragraph' | 'image'>('title');
  const [blockDe, setBlockDe] = useState('');
  const [blockLt, setBlockLt] = useState('');
  const [blockSortOrder, setBlockSortOrder] = useState<number>(1);
  const [cmsSaveStatus, setCmsSaveStatus] = useState<string | null>(null);

  // Query custom UI texts from Dexie
  const uiTexts = useLiveQuery(() => db.uiTexts.toArray());
  // Query custom FAQ/guide items from Dexie
  const dbGuideItems = useLiveQuery(() => db.guideItems.toArray());
  // Query custom blocks from Dexie
  const customBlocks = useLiveQuery(() => db.customBlocks.toArray());

  // Simple Auth Check
  useEffect(() => {
    const session = localStorage.getItem('bmd_session');
    const devMode = localStorage.getItem('bmd_dev_mode');
    if (session !== 'authenticated') {
      router.push('/login');
    } else if (devMode !== 'true') {
      router.push('/dashboard');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Query logs sorted descending by timestamp
  const logs = useLiveQuery(async () => {
    const allLogs = await db.systemLogs.toArray();
    // Sort descending by timestamp (newest first)
    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  const handleClearLogs = async () => {
    if (confirm('Möchten Sie wirklich alle Systemprotokolle löschen?')) {
      await db.systemLogs.clear();
      await logger.info('SystemLogs', 'Systemprotokolle wurden vom Benutzer gelöscht.');
    }
  };

  const handleGenerateTestLogs = async () => {
    await logger.info('TestSystem', 'Dies ist ein Test-Info-Log zur Überprüfung des Loggers.');
    await logger.warn('TestSystem', 'Dies ist eine Test-Warnung. Eventuell fehlende Felder oder Validierungsfehler.');
    try {
      throw new Error('Testfehler: Simulierter Fehler für das Log-System.');
    } catch (e: any) {
      await logger.error('TestSystem', 'Ein simulierter Fehler ist aufgetreten.', e);
    }
  };

  const handleCopyToClipboard = () => {
    if (!logs) return;
    const jsonString = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startEditStatic = (key: string, currentDe: string, currentLt: string) => {
    setEditingKey(key);
    setEditDe(currentDe);
    setEditLt(currentLt);
  };

  const handleSaveStatic = async (key: string) => {
    setSaveStatus(prev => ({ ...prev, [key]: 'saving' }));
    try {
      const updatedAt = new Date().toISOString();
      await db.uiTexts.put({ key, DE: editDe, LT: editLt, sync_pending: 1, updated_at: updatedAt });
      setSaveStatus(prev => ({ ...prev, [key]: 'success' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [key]: null }));
        if (editingKey === key) setEditingKey(null);
      }, 1500);
      await logger.info('DeveloperTools', `Statische Übersetzung für Key "${key}" wurde aktualisiert.`);
      
      // Trigger background sync
      syncWithCloud().catch((err) => {
        console.error('Background sync failed after updating static text:', err);
      });
    } catch (err: any) {
      await logger.error('DeveloperTools', `Fehler beim Speichern von Key "${key}"`, err);
      alert('Fehler beim Speichern: ' + err.message);
      setSaveStatus(prev => ({ ...prev, [key]: null }));
    }
  };

  const startEditFaq = (id: string, deQ: string, ltQ: string, deA: string, ltA: string) => {
    setEditingKey(id);
    setEditDeQ(deQ);
    setEditLtQ(ltQ);
    setEditDeA(deA);
    setEditLtA(ltA);
  };

  const handleSaveFaq = async (id: string) => {
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await db.guideItems.update(id, {
        question: { DE: editDeQ, LT: editLtQ },
        answer: { DE: editDeA, LT: editLtA }
      });
      setSaveStatus(prev => ({ ...prev, [id]: 'success' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [id]: null }));
        if (editingKey === id) setEditingKey(null);
      }, 1500);
      await logger.info('DeveloperTools', `Ratgeber-Eintrag "${id}" wurde aktualisiert.`);
    } catch (err: any) {
      await logger.error('DeveloperTools', `Fehler beim Speichern von Ratgeber-Eintrag "${id}"`, err);
      alert('Fehler beim Speichern: ' + err.message);
      setSaveStatus(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDe.trim() || !blockLt.trim()) {
      alert('Bitte füllen Sie sowohl Deutsch als auch Litauisch aus. Bei Bildern wählen Sie bitte ein Foto für beide Sprachen.');
      return;
    }
    setCmsSaveStatus('saving');
    try {
      const updatedAt = new Date().toISOString();
      await db.customBlocks.add({
        page: blockPage,
        type: blockType,
        de: blockDe,
        lt: blockLt,
        sort_order: blockSortOrder,
        sync_pending: 1,
        updated_at: updatedAt,
      });
      setBlockDe('');
      setBlockLt('');
      setBlockSortOrder(prev => prev + 1);
      setCmsSaveStatus('success');
      setTimeout(() => setCmsSaveStatus(null), 2000);
      await logger.info('CMS', `Neuer CMS Block (${blockType}) zur Seite ${blockPage} hinzugefügt.`);
      
      // Trigger background sync
      syncWithCloud().catch((err) => {
        console.error('Background sync failed after adding CMS block:', err);
      });
    } catch (err: any) {
      await logger.error('CMS', 'Fehler beim Hinzufügen des CMS Blocks', err);
      setCmsSaveStatus('error');
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (confirm('Möchten Sie diesen Block wirklich löschen?')) {
      try {
        await db.customBlocks.delete(id);
        await logger.info('CMS', `CMS Block mit ID ${id} gelöscht.`);
        
        // Also delete from Supabase if online
        const { supabase } = await import('@/lib/supabaseClient');
        if (supabase) {
          await supabase.from('custom_blocks').delete().eq('id', id);
        }
      } catch (err: any) {
        await logger.error('CMS', 'Fehler beim Löschen des CMS Blocks', err);
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, lang: 'de' | 'lt') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (lang === 'de') {
          setBlockDe(base64String);
        } else {
          setBlockLt(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredLogs = logs?.filter((log) => {
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      log.message.toLowerCase().includes(searchLower) ||
      log.context.toLowerCase().includes(searchLower) ||
      (log.stack_trace || '').toLowerCase().includes(searchLower);
    
    return matchesLevel && matchesSearch;
  });

  const staticKeys = [
    { key: 'home.heroTag', label: 'Startseite - Hero Tag (Kleinüberschrift)', category: 'Startseite' },
    { key: 'home.title', label: 'Startseite - Titel (Großüberschrift)', category: 'Startseite' },
    { key: 'home.subtitle', label: 'Startseite - Untertitel / Beschreibung', category: 'Startseite' },
    { key: 'home.storyTitle', label: 'Startseite - Mimi Geschichte Titel', category: 'Startseite' },
    { key: 'home.storyText', label: 'Startseite - Mimi Geschichte Text', category: 'Startseite' },
    { key: 'home.realityNote', label: 'Startseite - Realität Hinweis', category: 'Startseite' },
    
    { key: 'ueberuns.title', label: 'Über uns - Titel', category: 'Über uns' },
    { key: 'ueberuns.subtitle', label: 'Über uns - Untertitel', category: 'Über uns' },
    { key: 'ueberuns.historyTitle', label: 'Über uns - Geschichte Überschrift', category: 'Über uns' },
    { key: 'ueberuns.historyText1', label: 'Über uns - Geschichte Absatz 1', category: 'Über uns' },
    { key: 'ueberuns.historyText2', label: 'Über uns - Geschichte Absatz 2', category: 'Über uns' },
    { key: 'ueberuns.containerTitle', label: 'Über uns - Container Überschrift', category: 'Über uns' },
    { key: 'ueberuns.containerSubtitle', label: 'Über uns - Container Untertitel', category: 'Über uns' },
    { key: 'ueberuns.containerText', label: 'Über uns - Container Text', category: 'Über uns' },
    { key: 'ueberuns.donationTitle', label: 'Über uns - Spenden Überschrift', category: 'Über uns' },
    { key: 'ueberuns.donationText', label: 'Über uns - Spenden Text', category: 'Über uns' },
    
    { key: 'ratgeber.title', label: 'Ratgeber - Titel', category: 'Ratgeber' },
    { key: 'ratgeber.subtitle', label: 'Ratgeber - Untertitel', category: 'Ratgeber' },
    { key: 'ratgeber.warningTitle', label: 'Ratgeber - Warnung Titel', category: 'Ratgeber' },
    { key: 'ratgeber.warningDesc', label: 'Ratgeber - Warnung Text', category: 'Ratgeber' },

    // Tier-Registrierung & Bearbeitung
    { key: 'edit.name', label: 'Formular - Name Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.namePlaceholder', label: 'Formular - Name Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.room', label: 'Formular - Raum Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.roomPlaceholder', label: 'Formular - Raum Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.cage', label: 'Formular - Käfig / Box Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.cagePlaceholder', label: 'Formular - Käfig / Box Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.gender', label: 'Formular - Geschlecht Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.genderFemale', label: 'Formular - Geschlecht Weiblich', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.genderMale', label: 'Formular - Geschlecht Männlich', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageLabel', label: 'Formular - Alter Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageModeRange', label: 'Formular - Alter Modus Von-Bis', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageModeExact', label: 'Formular - Alter Modus Exakt', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageModeYear', label: 'Formular - Alter Modus Geburtsjahr', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageEstimate', label: 'Formular - Alter Schätzen Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageMin', label: 'Formular - Alter Minimum Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageMax', label: 'Formular - Alter Maximum Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageExactLabel', label: 'Formular - Exaktes Alter Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.ageYearsUnit', label: 'Formular - Jahre Einheit', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.birthYear', label: 'Formular - Geburtsjahr Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.birthMonth', label: 'Formular - Geburtsmonat Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.birthDay', label: 'Formular - Geburtstag Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.birthMonthPlaceholder', label: 'Formular - Geburtsmonat Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.birthDayPlaceholder', label: 'Formular - Geburtstag Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.typeLabel', label: 'Formular - Tierart Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.typeCat', label: 'Formular - Tierart Katze', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.typeDog', label: 'Formular - Tierart Hund', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.typeOther', label: 'Formular - Tierart Andere', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.admissionDate', label: 'Formular - Seit wann im Tierheim Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.reasonForShelter', label: 'Formular - Warum im Tierheim Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.reasonPlaceholder', label: 'Formular - Warum im Tierheim Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.restrictions', label: 'Formular - Einschränkungen Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.restrictionsPlaceholder', label: 'Formular - Einschränkungen Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.misc', label: 'Formular - Sonstiges Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.miscPlaceholder', label: 'Formular - Sonstiges Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.publishLabel', label: 'Formular - Galerie veröffentlichen Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.publishDesc', label: 'Formular - Öffentlich anzeigen Beschreibung', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.emergencyLabel', label: 'Formular - Sorgenfell / Notfall Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.emergencyDesc', label: 'Formular - SOS rote Markierung Beschreibung', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.status', label: 'Formular - Status Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.statusAvailable', label: 'Formular - Status zu vermitteln', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.statusReserved', label: 'Formular - Status reserviert', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.statusAdopted', label: 'Formular - Status vermittelt', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.saveBtn', label: 'Formular - Registrieren / Speichern Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.saving', label: 'Formular - Wird registriert / gespeichert Text', category: 'Tier-Registrierung & Bearbeitung' },
    
    // Medien-Sektion
    { key: 'edit.uploadMediaHeader', label: 'Medien - Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.deviceCheckHeader', label: 'Medien - Geräte-Check Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.deviceCheckSub', label: 'Medien - Geräte-Check Untertitel', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.recheckBtn', label: 'Medien - Erneut prüfen Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.checkingText', label: 'Medien - Prüft... Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.cameraStatusLabel', label: 'Medien - Kamera Status Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.micStatusLabel', label: 'Medien - Mikrofon Status Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.storageTypeLabel', label: 'Medien - Speicher-Typ Status Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.storageProtectionLabel', label: 'Medien - Speicher-Schutz Status Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.readyText', label: 'Medien - Bereit Status Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.blockedText', label: 'Medien - Blockiert Status Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.uncheckedText', label: 'Medien - Ungeprüft Status Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.optimizedText', label: 'Medien - OPFS (Optimiert) Status Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.standardText', label: 'Medien - IndexedDB (Standard) Status Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.protectedText', label: 'Medien - Geschützt Status Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.temporaryText', label: 'Medien - Temporär Status Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.opfsNote', label: 'Medien - OPFS Hinweis Warnung', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.persistentNote', label: 'Medien - Speicher-Schutz Hinweis Warnung', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.howToAllowHeader', label: 'Medien - Wie du Zugriff erlaubst Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.howToAllowCam', label: 'Medien - Anleitung Kamera freigeben', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.howToAllowMic', label: 'Medien - Anleitung Mikrofon freigeben', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.howToAllowMobile', label: 'Medien - Anleitung am Handy', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.galleryPhotosHeader', label: 'Medien - Galeriefotos Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.galleryPhotosSub', label: 'Medien - Galeriefotos Untertitel', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.passportPhotosHeader', label: 'Medien - Dokumente/Impfpässe Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.passportPhotosSub', label: 'Medien - Dokumente/Impfpässe Untertitel', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.videosHeader', label: 'Medien - Videos Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.videosSub', label: 'Medien - Videos Untertitel', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.videoTip', label: 'Medien - Video Tipp', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.cameraBtn', label: 'Medien - Kamera Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.galleryBtn', label: 'Medien - Galerie Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.recordBtn', label: 'Medien - Aufnehmen Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.noPhotosText', label: 'Medien - Keine Fotos Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.noPassportsText', label: 'Medien - Keine Pässe Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.noVideosText', label: 'Medien - Keine Videos Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.localBadge', label: 'Medien - Lokal Badge', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.onlineBadge', label: 'Medien - Online Badge', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.optimizingText', label: 'Medien - Optimierung Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.compressProgressText', label: 'Medien - Komprimierung Info Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.audioHeader', label: 'Medien - Sprachnotizen Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.audioSub', label: 'Medien - Sprachnotizen Untertitel', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.newAudioBtn', label: 'Medien - Neue Sprachnotiz Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.addingAudioText', label: 'Medien - Hinzufügen läuft Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.recordingAudioText', label: 'Medien - Aufnahme läuft Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.stopRecordingBtn', label: 'Medien - Aufnahme stoppen Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.noAudioText', label: 'Medien - Keine Sprachnotizen Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.continueBtn', label: 'Medien - Fortsetzen Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.deleteBtn', label: 'Medien - Löschen Button', category: 'Tier-Registrierung & Bearbeitung' },
    
    // Bearbeitungsspezifische Felder
    { key: 'edit.editedByLabel', label: 'Wer nimmt diese Änderung vor Label', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.editedByPlaceholder', label: 'Wer nimmt diese Änderung vor Platzhalter', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.editedByDesc', label: 'Wer nimmt diese Änderung vor Beschreibung', category: 'Tier-Registrierung & Bearbeitung' },
    
    // Versionsverlauf
    { key: 'edit.revisionsHeader', label: 'Revisions - Header', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.revisionsSub', label: 'Revisions - Beschreibung', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.loadingRevisions', label: 'Revisions - Lädt... Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.noRevisions', label: 'Revisions - Keine Versionen Text', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.compareBtn', label: 'Revisions - Vergleichen Button', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.restoreConfirm', label: 'Revisions - Wiederherstellen Bestätigung', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.identicalBadge', label: 'Revisions - Aktuell identisch Badge', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.diffOne', label: 'Revisions - Unterschied Singular', category: 'Tier-Registrierung & Bearbeitung' },
    { key: 'edit.diffMany', label: 'Revisions - Unterschiede Plural', category: 'Tier-Registrierung & Bearbeitung' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center">
        <span className="w-8 h-8 border-4 border-brandpink-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="px-4 py-4 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Link 
            href="/dashboard" 
            className="p-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-colors border border-stone-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-stone-850 flex items-center">
              <Terminal className="w-4 h-4 mr-1.5 text-brandpink-600" />
              Bug Tracker & Entwickler-Panel
            </h1>
            <p className="text-[10px] text-stone-500">Systemprotokolle & Übersetzungsmanagement</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'logs' && (
            <>
              <button
                onClick={handleCopyToClipboard}
                className="p-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-colors border border-stone-200 shadow-sm flex items-center text-xs"
                title="Kopieren als JSON"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClearLogs}
                className="p-1.5 rounded-lg bg-red-50 text-red-650 hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
                title="Protokolle löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="px-4 bg-white border-b border-stone-200 flex space-x-6 text-sm font-semibold sticky top-[68px] z-40 shadow-sm">
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3.5 border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-brandpink-600 text-brandpink-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Systemprotokolle
        </button>
        <button
          onClick={() => setActiveTab('texts')}
          className={`py-3.5 border-b-2 transition-all ${
            activeTab === 'texts'
              ? 'border-brandpink-600 text-brandpink-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Texte bearbeiten
        </button>
      </div>

      {/* Developer Toolkit Box (Only for Logs tab) */}
      {activeTab === 'logs' && (
        <div className="p-4 bg-stone-100/50 border-b border-stone-200">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-stone-800 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-brandpink-700" />
                Entwickler-Werkzeuge
              </h2>
              <p className="text-[10px] text-stone-500 mt-0.5">Generieren Sie Test-Einträge, um die Logging-Pipeline live zu überprüfen.</p>
            </div>
            <button
              onClick={handleGenerateTestLogs}
              className="px-3 py-1.5 bg-brandpink-600 hover:bg-brandpink-500 active:scale-98 text-white font-bold rounded-lg text-xs transition-all shadow-sm shrink-0"
            >
              Test-Logs erzeugen
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
        {/* LOGS TAB CONTENT */}
        {activeTab === 'logs' && (
          <>
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Durchsuche Logs (Nachricht, Kontext, Stack-Trace)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 transition-colors text-sm"
                />
              </div>

              <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setLevelFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    levelFilter === 'all'
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 shadow-sm'
                  }`}
                >
                  Alle ({logs?.length || 0})
                </button>
                <button
                  onClick={() => setLevelFilter('info')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1 shrink-0 ${
                    levelFilter === 'info'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 shadow-sm'
                  }`}
                >
                  <Info className="w-3 h-3 text-emerald-600" />
                  <span>Info ({logs?.filter(l => l.level === 'info').length || 0})</span>
                </button>
                <button
                  onClick={() => setLevelFilter('warn')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1 shrink-0 ${
                    levelFilter === 'warn'
                      ? 'bg-amber-50 text-amber-700 border-amber-250'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 shadow-sm'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Warn ({logs?.filter(l => l.level === 'warn').length || 0})</span>
                </button>
                <button
                  onClick={() => setLevelFilter('error')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1 shrink-0 ${
                    levelFilter === 'error'
                      ? 'bg-red-50 text-red-700 border-red-250'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 shadow-sm'
                  }`}
                >
                  <XCircle className="w-3 h-3 text-red-600" />
                  <span>Fehler ({logs?.filter(l => l.level === 'error').length || 0})</span>
                </button>
              </div>
            </div>

            {/* Logs Table / List */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 flex items-center justify-between">
                <span>PROTOKOLLEINTRÄGE</span>
                <span className="text-[10px] text-stone-400 font-normal">
                  Zeige {filteredLogs?.length || 0} von {logs?.length || 0}
                </span>
              </div>

              <div className="divide-y divide-stone-200/60">
                {filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const formattedTime = new Date(log.timestamp).toLocaleString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3
                    } as any);

                    // Styling based on level
                    const levelConfig = {
                      info: {
                        icon: <Info className="w-3.5 h-3.5 text-emerald-600" />,
                        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                        label: 'INFO'
                      },
                      warn: {
                        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
                        bg: 'bg-amber-50 border-amber-200 text-amber-700',
                        label: 'WARN'
                      },
                      error: {
                        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
                        bg: 'bg-red-50 border-red-200 text-red-700',
                        label: 'ERROR'
                      }
                    }[log.level];

                    return (
                      <div key={log.id} className="transition-colors hover:bg-stone-50/50">
                        {/* Log Row */}
                        <div 
                          onClick={() => setExpandedLogId(isExpanded ? null : (log.id ?? null))}
                          className="p-3.5 flex items-start space-x-3 cursor-pointer select-none text-xs"
                        >
                          <div className="shrink-0 mt-0.5">
                            {levelConfig.icon}
                          </div>

                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2">
                            {/* Timestamp */}
                            <div className="md:col-span-2 text-stone-400 font-mono text-[11px] shrink-0">
                              {formattedTime}
                            </div>
                            {/* Context tag */}
                            <div className="md:col-span-2">
                              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold font-mono text-[10px] uppercase border border-stone-200">
                                {log.context}
                              </span>
                            </div>
                            {/* Message */}
                            <div className="md:col-span-8 text-stone-700 font-medium truncate">
                              {log.message}
                            </div>
                          </div>

                          <div className="shrink-0 text-stone-400 self-center">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Extended Details */}
                        {isExpanded && (
                          <div className="px-3.5 pb-4 pt-1 bg-stone-50 border-t border-stone-200/50 space-y-3 text-[11px] font-mono">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-stone-600 bg-white p-2.5 rounded-lg border border-stone-200 shadow-sm">
                              <div>
                                <span className="text-stone-400 font-bold">ID:</span> #{log.id}
                              </div>
                              <div>
                                <span className="text-stone-400 font-bold">Zeitstempel:</span> {log.timestamp}
                              </div>
                              <div>
                                <span className="text-stone-400 font-bold">Bereich:</span> {log.context}
                              </div>
                              <div>
                                <span className="text-stone-400 font-bold">Stufe:</span>{' '}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${levelConfig.bg}`}>
                                  {levelConfig.label}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-stone-400 font-bold">NACHRICHT:</div>
                              <div className="bg-white p-3 rounded-lg border border-stone-200 text-stone-850 whitespace-pre-wrap break-all shadow-sm">
                                {log.message}
                              </div>
                            </div>

                            {log.stack_trace && (
                              <div className="space-y-1">
                                <div className="text-red-650 font-bold flex items-center">
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  STACK-TRACE / FEHLER-DETAILS:
                                </div>
                                <pre className="bg-red-50/40 p-3 rounded-lg border border-red-200 text-red-800 whitespace-pre overflow-x-auto text-[10px] leading-relaxed max-h-60 shadow-sm">
                                  {log.stack_trace}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    Keine Protokolleinträge gefunden, die den Filtern entsprechen.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* TEXTS TAB CONTENT */}
        {activeTab === 'texts' && (
          <div className="space-y-6">
            {/* Section Switcher */}
            <div className="flex space-x-2 bg-stone-200/50 p-1 rounded-xl border border-stone-200 max-w-md shadow-sm">
              <button
                onClick={() => { setTextSection('static'); setEditingKey(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  textSection === 'static'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                Statische Texte
              </button>
              <button
                onClick={() => { setTextSection('faq'); setEditingKey(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  textSection === 'faq'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                Ratgeber & FAQ
              </button>
              <button
                onClick={() => { setTextSection('cms'); setEditingKey(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  textSection === 'cms'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                CMS Blöcke
              </button>
            </div>

            {/* Static UI Texts Section */}
            {textSection === 'static' && (
              <div className="space-y-4">
                {staticKeys.map((item) => {
                  const dbEntry = uiTexts?.find((t) => t.key === item.key);
                  const editDeDefaults: Record<string, string> = {
                    'edit.name': 'Name *',
                    'edit.namePlaceholder': 'z.B. Luna',
                    'edit.room': 'Raum',
                    'edit.roomPlaceholder': 'z.B. Container 1',
                    'edit.cage': 'Käfig / Box',
                    'edit.cagePlaceholder': 'z.B. Box 3',
                    'edit.gender': 'Geschlecht',
                    'edit.genderFemale': 'Weiblich',
                    'edit.genderMale': 'Männlich',
                    'edit.ageLabel': 'Alter Angeben',
                    'edit.ageModeRange': 'Von-Bis',
                    'edit.ageModeExact': 'Exakt',
                    'edit.ageModeYear': 'Jahr',
                    'edit.ageEstimate': 'Alter schätzen (Jahre)',
                    'edit.ageMin': 'Minimum',
                    'edit.ageMax': 'Maximum',
                    'edit.ageExactLabel': 'Exaktes Alter',
                    'edit.ageYearsUnit': 'Jahre',
                    'edit.birthYear': 'Jahr',
                    'edit.birthMonth': 'Monat',
                    'edit.birthDay': 'Tag',
                    'edit.birthMonthPlaceholder': 'unbekannt',
                    'edit.birthDayPlaceholder': 'unbekannt',
                    'edit.typeLabel': 'Tierart',
                    'edit.typeCat': 'Katze',
                    'edit.typeDog': 'Hund',
                    'edit.typeOther': 'Andere',
                    'edit.admissionDate': 'Seit wann im Tierheim?',
                    'edit.reasonForShelter': 'Warum im Tierheim?',
                    'edit.reasonPlaceholder': 'Hintergründe der Abgabe...',
                    'edit.restrictions': 'Einschränkungen (z.B. Krankheiten)',
                    'edit.restrictionsPlaceholder': 'z.B. Nierendiät, mag keine Katzen...',
                    'edit.misc': 'Sonstiges',
                    'edit.miscPlaceholder': 'Besonderheiten der Katze...',
                    'edit.publishLabel': 'Galerie veröffentlichen',
                    'edit.publishDesc': 'Öffentlich anzeigen',
                    'edit.emergencyLabel': 'Sorgenfell / Notfall',
                    'edit.emergencyDesc': 'SOS rote Markierung',
                    'edit.status': 'Status',
                    'edit.statusAvailable': 'zu vermitteln',
                    'edit.statusReserved': 'reserviert',
                    'edit.statusAdopted': 'vermittelt',
                    'edit.saveBtn': 'Tier registrieren / Speichern',
                    'edit.saving': 'Wird registriert / gespeichert...',
                    'edit.uploadMediaHeader': 'Fotos & Videos hochladen',
                    'edit.deviceCheckHeader': 'Geräte- & Speicher-Check',
                    'edit.deviceCheckSub': 'Berechtigungen für Kamera & Mikrofon',
                    'edit.recheckBtn': 'Erneut prüfen',
                    'edit.checkingText': 'Prüft...',
                    'edit.cameraStatusLabel': 'Kamera',
                    'edit.micStatusLabel': 'Mikrofon',
                    'edit.storageTypeLabel': 'Speicher-Typ',
                    'edit.storageProtectionLabel': 'Speicher-Schutz',
                    'edit.readyText': 'Bereit',
                    'edit.blockedText': 'Blockiert',
                    'edit.uncheckedText': 'Ungeprüft',
                    'edit.optimizedText': 'Optimiert',
                    'edit.standardText': 'Standard',
                    'edit.protectedText': 'Geschützt',
                    'edit.temporaryText': 'Temporär',
                    'edit.opfsNote': 'Dein Gerät unterstützt das moderne OPFS-Dateisystem nicht. Videos werden im Standard-Datenbankspeicher abgelegt. Bitte lade Videos vorzugsweise hoch, wenn du online bist, um Speicher-Engpässe zu vermeiden.',
                    'edit.persistentNote': 'Der Speicher ist als temporär eingestufen. Falls der Speicher deines Handys sehr voll wird, könnte der Browser ungesynchronisierte Entwürfe löschen. Synchronisiere deine Einträge bitte zeitnah!',
                    'edit.howToAllowHeader': 'Wie du den Zugriff erlauben kannst:',
                    'edit.howToAllowCam': 'Klicke oben links neben der Webadresse (in der Adressleiste deines Browsers) auf das kleine Schloss-Symbol 🔒 und stelle Kamera auf "Zulassen" / "Erlauben".',
                    'edit.howToAllowMic': 'Klicke ebenfalls auf das Schloss-Symbol 🔒 und erlaube den Zugriff auf das Mikrofon, damit du Sprachnotizen aufnehmen kannst.',
                    'edit.howToAllowMobile': 'Gehe in die Handy-Einstellungen unter Apps → Browser (z.B. Chrome/Safari) → Berechtigungen und erlaube dort Kamera/Mikrofon. Lade danach diese Seite neu.',
                    'edit.galleryPhotosHeader': 'Galeriefotos (max. 20)',
                    'edit.galleryPhotosSub': 'Bilder für die Vermittlungsgalerie',
                    'edit.passportPhotosHeader': 'Dokumente / Impfpässe (max. 5)',
                    'edit.passportPhotosSub': 'Nur intern für Mitarbeiter sichtbar',
                    'edit.videosHeader': 'Videos (max. 5, max. 5 Min., unter 200 MB)',
                    'edit.videosSub': 'Direkter Cloud-Upload & Offline-Speicherung (OPFS) unterstützt',
                    'edit.videoTip': 'Direkt in der App aufgenommene Videos werden automatisch optimal komprimiert. Größere Videos aus der Galerie werden im Hintergrund verkleinert, oder du teilst sie vorab kurz per WhatsApp/Telegram, um sie sofort zu schrumpfen.',
                    'edit.cameraBtn': 'Kamera',
                    'edit.galleryBtn': 'Galerie',
                    'edit.recordBtn': 'Aufnehmen',
                    'edit.uploadBtn': 'Galerie',
                    'edit.noPhotosText': 'Keine Fotos aufgenommen.',
                    'edit.noPassportsText': 'Keine Pässe aufgenommen.',
                    'edit.noVideosText': 'Keine Videos geladen.',
                    'edit.localBadge': 'Lokal',
                    'edit.onlineBadge': 'Online',
                    'edit.optimizingText': 'Optimierung',
                    'edit.compressProgressText': 'Video wird für den schnellen Upload verkleinert, bitte warten...',
                    'edit.audioHeader': 'Sprachnotizen',
                    'edit.audioSub': 'Nimm bis zu 10 Sprachnotizen auf oder führe eine bestehende fort',
                    'edit.newAudioBtn': 'Neue Sprachnotiz',
                    'edit.addingAudioText': 'Hinzufügen läuft...',
                    'edit.recordingAudioText': 'Aufnahme läuft...',
                    'edit.stopRecordingBtn': 'Aufnahme stoppen & speichern',
                    'edit.noAudioText': 'Keine Sprachnotizen aufgenommen. Klicke oben auf "Neue Sprachnotiz", um zu starten.',
                    'edit.continueBtn': 'Fortsetzen',
                    'edit.deleteBtn': 'Löschen',
                    'edit.editedByLabel': 'Wer nimmt diese Änderung vor? *',
                    'edit.editedByPlaceholder': 'Dein Name oder Kürzel (z.B. Carlos)',
                    'edit.editedByDesc': 'Dies hilft dem Team nachzuvollziehen, wer welche Version bearbeitet hat.',
                    'edit.revisionsHeader': 'Versionsverlauf (Die letzten 10 Änderungen)',
                    'edit.revisionsSub': 'Hier siehst du, wer dieses Profil wann bearbeitet hat. Du kannst eine frühere Version direkt in das Formular laden, um sie zu überprüfen und wieder aktiv zu speichern.',
                    'edit.loadingRevisions': 'Versionsverlauf wird geladen...',
                    'edit.noRevisions': 'Bisher wurden keine früheren Versionen für dieses Tier gespeichert.',
                    'edit.compareBtn': 'Vergleichen',
                    'edit.restoreConfirm': 'Möchten Sie das Formular wirklich auf den Stand vom {date} zurücksetzen? Ungespeicherte aktuelle Änderungen gehen dabei verloren.',
                    'edit.identicalBadge': 'Aktuell identisch',
                    'edit.diffOne': 'Unterschied',
                    'edit.diffMany': 'Unterschiede'
                  };

                  const editLtDefaults: Record<string, string> = {
                    'edit.name': 'Vardas *',
                    'edit.namePlaceholder': 'pvz., Luna',
                    'edit.room': 'Patalpa/Kambarys',
                    'edit.roomPlaceholder': 'pvz., 1 konteineris',
                    'edit.cage': 'Narvas / Boksas',
                    'edit.cagePlaceholder': 'pvz., 3 boksas',
                    'edit.gender': 'Lytis',
                    'edit.genderFemale': 'Patelė',
                    'edit.genderMale': 'Patinas',
                    'edit.ageLabel': 'Nurodyti amžių',
                    'edit.ageModeRange': 'Nuo-Iki',
                    'edit.ageModeExact': 'Tikslus',
                    'edit.ageModeYear': 'Metai',
                    'edit.ageEstimate': 'Amžiaus vertinimas (metais)',
                    'edit.ageMin': 'Minimumas',
                    'edit.ageMax': 'Maximumas',
                    'edit.ageExactLabel': 'Tikslus amžius',
                    'edit.ageYearsUnit': 'metai',
                    'edit.birthYear': 'Metai',
                    'edit.birthMonth': 'Mėnuo',
                    'edit.birthDay': 'Diena',
                    'edit.birthMonthPlaceholder': 'nežinoma',
                    'edit.birthDayPlaceholder': 'nežinoma',
                    'edit.typeLabel': 'Gyvūno rūšis',
                    'edit.typeCat': 'Katė',
                    'edit.typeDog': 'Šuo',
                    'edit.typeOther': 'Kita',
                    'edit.admissionDate': 'Nuo kada prieglaudoje?',
                    'edit.reasonForShelter': 'Kodėl prieglaudoje?',
                    'edit.reasonPlaceholder': 'Priėmimo aplinkybės...',
                    'edit.restrictions': 'Apribojimai (pvz., ligos)',
                    'edit.restrictionsPlaceholder': 'pvz., inkstų dieta, nemėgsta kitų kačių...',
                    'edit.misc': 'Kita',
                    'edit.miscPlaceholder': 'Gyvūno ypatybės...',
                    'edit.publishLabel': 'Viešinti galerijoje',
                    'edit.publishDesc': 'Rodyti viešai',
                    'edit.emergencyLabel': 'Ypatingas dėmesys / SOS',
                    'edit.emergencyDesc': 'SOS raudona žyma',
                    'edit.status': 'Būsena',
                    'edit.statusAvailable': 'ieško namų',
                    'edit.statusReserved': 'rezervuota',
                    'edit.statusAdopted': 'dovanota',
                    'edit.saveBtn': 'Registruoti / Išsaugoti gyvūną',
                    'edit.saving': 'Registruojama / Išsaugoma...',
                    'edit.uploadMediaHeader': 'Įkelti nuotraukas ir vaizdo įrašus',
                    'edit.deviceCheckHeader': 'Įrenginio ir atminties patikra',
                    'edit.deviceCheckSub': 'Kameros ir mikrofono leidimai',
                    'edit.recheckBtn': 'Tikrinti iš naujo',
                    'edit.checkingText': 'Tikrinama...',
                    'edit.cameraStatusLabel': 'Kamera',
                    'edit.micStatusLabel': 'Mikrofonas',
                    'edit.storageTypeLabel': 'Atminties tipas',
                    'edit.storageProtectionLabel': 'Atminties apsauga',
                    'edit.readyText': 'Paruošta',
                    'edit.blockedText': 'Blokuojama',
                    'edit.uncheckedText': 'Netikrinta',
                    'edit.optimizedText': 'Optimizuota',
                    'edit.standardText': 'Standartinė',
                    'edit.protectedText': 'Apsaugota',
                    'edit.temporaryText': 'Laikina',
                    'edit.opfsNote': 'Jūsų įrenginys nepalaiko modernios OPFS failų sistemų. Vaizdo įrašai bus saugomi standartinėje duomenų bazėje. Rekomenduojame vaizdo įrašus kelti prisijungus prie interneto, kad išvengtumėte atminties trūkumo.',
                    'edit.persistentNote': 'Atmintis pažymėta kaip laikina. Jei telefono atmintis bus pilna, naršyklė gali ištrinti nesinchronizuotus juodraščius. Prašome kuo greičiau sinchronizuoti įrašus!',
                    'edit.howToAllowHeader': 'Kaip suteikti prieigą:',
                    'edit.howToAllowCam': 'Spustelėkite spynos piktogramą 🔒 šalia interneto adreso (naršyklės adreso juostoje) ir nustatykite Kamerą į „Leisti“.',
                    'edit.howToAllowMic': 'Taip pat spustelėkite spynos piktogramą 🔒 ir leiskite prieigą prie mikrofono, kad galėtumėte įrašyti balso pastabas.',
                    'edit.howToAllowMobile': 'Telefono nustatymuose eikite į Programos → Naršyklė (pvz., Chrome/Safari) → Leidimai ir ten leiskite kamerą/mikrofoną. Tada atnaujinkite šį puslapį.',
                    'edit.galleryPhotosHeader': 'Galerijos nuotraukos (maks. 20)',
                    'edit.galleryPhotosSub': 'Nuotraukos viešai galerijai',
                    'edit.passportPhotosHeader': 'Dokumentai / Skiepų pasai (maks. 5)',
                    'edit.passportPhotosSub': 'Matoma tik darbuotojams (vidiniam naudojimui)',
                    'edit.videosHeader': 'Vaizdo įrašai (maks. 5, maks. 5 min., iki 200 MB)',
                    'edit.videosSub': 'Palaikomas tiesioginis įkėlimas į debesį ir saugojimas neprisijungus (OPFS)',
                    'edit.videoTip': 'Tiesiogiai programėlėje įrašyti vaizdo įrašai yra automatiškai optimizuojami. Didesni vaizdo įrašai iš galerijos bus sumažinti fone, arba galite prieš tai juos trumpai pasidalinti per WhatsApp/Telegram, kad iškart sumažintumėte dydį.',
                    'edit.cameraBtn': 'Kamera',
                    'edit.galleryBtn': 'Galerija',
                    'edit.recordBtn': 'Įrašyti',
                    'edit.uploadBtn': 'Galerija',
                    'edit.noPhotosText': 'Nuotraukų nėra.',
                    'edit.noPassportsText': 'Dokumentų nėra.',
                    'edit.noVideosText': 'Vaizdo įrašų nėra.',
                    'edit.localBadge': 'Vietinis',
                    'edit.onlineBadge': 'Internetinis',
                    'edit.optimizingText': 'Optimizavimas',
                    'edit.compressProgressText': 'Vaizdo įrašas mažinamas greitesniam įkėlimui, prašome palaukti...',
                    'edit.audioHeader': 'Balso pastabos',
                    'edit.audioSub': 'Įrašykite iki 10 balso pastabų arba tęskite esamą',
                    'edit.newAudioBtn': 'Nauja balso pastaba',
                    'edit.addingAudioText': 'Pridedama...',
                    'edit.recordingAudioText': 'Įrašoma...',
                    'edit.stopRecordingBtn': 'Sustabdyti ir išsaugoti',
                    'edit.noAudioText': 'Balso pastabų nėra. Spustelėkite „Nauja balso pastaba“ viršuje, kad pradėtumėte.',
                    'edit.continueBtn': 'Tęsti',
                    'edit.deleteBtn': 'Ištrinti',
                    'edit.editedByLabel': 'Kas atlieka šį pakeitimą? *',
                    'edit.editedByPlaceholder': 'Jūsų vardas arba inicialai (pvz., Karolis)',
                    'edit.editedByDesc': 'Tai padeda komandai sekti, kas redagavo kurią versiją.',
                    'edit.revisionsHeader': 'Versijų istorija (Paskutiniai 10 pakeitimų)',
                    'edit.revisionsSub': 'Čia galite matyti, kas ir kada redagavo šį profilį. Galite įkelti ankstesnę versiją tiesiai į formą, kad ją peržiūrėtumėte ir vėl išsaugotumėte.',
                    'edit.loadingRevisions': 'Kraunama istorija...',
                    'edit.noRevisions': 'Šiam gyvūnui ankstesnių versijų dar neišsaugota.',
                    'edit.compareBtn': 'Palyginti',
                    'edit.restoreConfirm': 'Ar tikrai norite atkurti formos būseną iš {date}? Neišsaugoti dabartiniai pakeitimai bus prarasti.',
                    'edit.identicalBadge': 'Šiuo metu identiška',
                    'edit.diffOne': 'skirtumas',
                    'edit.diffMany': 'skirtumai'
                  };

                  const defaultDe = editDeDefaults[item.key] || {
                    'home.heroTag': '🐾 Ein privates Herzensprojekt von Tierfreunden',
                    'home.title': 'Weil jede Pfote ein weiches Körbchen verdient',
                    'home.subtitle': 'Hinter dieser App steckt kein großes Unternehmen. Wir sind ein kleines Team aus ehrenamtlichen Helfern und Katzenliebhabern, die jede freie Minute und eigenes Geld spenden. Wir wollen der Tierrettung in Litauen helfen, Zeit zu sparen – Zeit, die zu 100 % den Tieren zugutekommt. Finde heute deinen neuen treuen Begleiter oder unterstütze unsere Rettungsarbeit!',
                    'home.storyTitle': 'Aus dem Tagebuch unserer Helfer: Mimis große Reise 🐾',
                    'home.storyText': 'Mimi wurde klitschnass und zitternd vor Kälte in einem Graben bei Klaipėda gefunden. Sie wog kaum ein Kilo und hatte die Hoffnung schon aufgegeben. In unserem beheizten Rettungs-Container fand sie Schutz, Futter und die nötige Liebe, um wieder zu vertrauen. Heute ist Mimi gesund, verspielt und sucht Menschen, die ihr ein echtes Zuhause schenken wollen. Es sind Geschichten wie diese, für die wir alles geben.',
                    'home.realityNote': 'Aufgrund extremer räumlicher Notlagen müssen viele unserer 600 geretteten Katzen vorübergehend in Käfigen leben. Unterstütze uns durch eine Adoption oder Spende, um ihnen den Weg in eine bessere Zukunft zu ermöglichen.',
                    'ueberuns.title': 'Über Uns & Das Team',
                    'ueberuns.subtitle': 'Wie aus Liebe zu hilflosen Seelen eine Lebensaufgabe wurde – und warum wir jede helfende Hand brauchen.',
                    'ueberuns.historyTitle': 'Unsere Geschichte: Ein Weg aus Liebe und Schweiß',
                    'ueberuns.historyText1': 'Hinter unserem Tierheim steht kein reicher Großsponsor und kein staatliches Budget. Alles begann im Jahr 2011, als Galina Kučinskienė die Not der Straßenkatzen in Klaipėda nicht mehr mitansehen konnte und die ersten verletzten Seelen bei sich aufnahm. Was als private Rettungsaktion im kleinen Kreis begann, ist über 13 Jahre hinweg zu einer permanenten Zuflucht für über 600 Hunde, Katzen und Wildtiere angewachsen. Wir gehen täglich an unsere körperlichen und finanziellen Grenzen, um diesen wunderbaren Geschöpfen Schutz zu bieten.',
                    'ueberuns.historyText2': 'Unser oberstes Ziel ist einfach, aber lebenswichtig: Jedes gerettete Tier soll spüren, dass es geliebt wird, während wir medizinische Notversorgung leisten und nach einem endgültigen Zuhause suchen. Um den Katzen in Deutschland eine voice/Stimme zu geben, arbeitet Žana Baskytė unermüdlich ehrenamtlich als Brücke ins neue Leben, vermittelt Adoptionen und organisiert lebensrettende Fahrten.',
                    'ueberuns.containerTitle': 'Das Container-Projekt 🐈',
                    'ueberuns.containerSubtitle': 'Gebaut mit unseren eigenen Händen',
                    'ueberuns.containerText': 'Als der Platz im Tierheim nicht mehr reichte und wir Tiere hätten abweisen müssen, haben wir beschlossen zu kämpfen. Die Idee: Ausgediente Überseecontainer zu Katzenparadiesen umzubauen. Mit privatem Schweiß, Spenden und der Hilfe von freiwilligen Handwerkern haben wir Container isoliert, klimatisiert und mit Kletterwänden, Kuschelecken und Spielzonen ausgestattet. Heute finden hier über 360 Katzen Schutz vor Frost und Hunger in gemütlichen Gruppen.',
                    'ueberuns.donationTitle': 'Unterstütze unsere Herzensarbeit',
                    'ueberuns.donationText': 'Jeder Cent, jede Stunde und jede Zeile Code wird privat beigetragen. Wir erhalten keine staatliche Förderung. Deine Spende fließt zu 100 % direkt in Futter, dringend benötigte Medikamente und den Ausbau der warmen Container.',
                    'ratgeber.title': 'Katzen-Ratgeber & FAQ 📖',
                    'ratgeber.subtitle': 'Alles, was neue Katzenbesitzer und Stadtmenschen über Haltung, Verhalten und Pflege wissen sollten.',
                    'ratgeber.warningTitle': 'Wichtiger Hinweis für Stadtwohnungen',
                    'ratgeber.warningDesc': 'Katzen benötigen in Wohnungen ausreichend Beschäftigung, Kratzmöglichkeiten und vor allem gesicherte Fenster (Kippschutz!), um ein glückliches und sicheres Leben zu führen.'
                  }[item.key] || '';
                  
                  const defaultLt = editLtDefaults[item.key] || {
                    'home.heroTag': '🐾 Asmeninis gyvūnų mylėtojų širdies projektas',
                    'home.title': 'Nes kiekviena pėdutė nusipelno mylinčių namų',
                    'home.subtitle': 'Šią programėlę sukūrė ne įmonė, o nedidelė savanorių ir kačių mylėtojų komanda, aukojanti savo laisvą laiką ir asmenines lėšas. Mūsų tikslas – palengvinti prieglaudos darbą Lietuvoje, kad daugiau laiko liktų kačių priežiūrai ir gelbėjimui. Raskite savo naują šeimos narį arba prisidėkite prie mūsų veiklos!',
                    'home.storyTitle': 'Iš mūsų savanorių dienoraščio: Didžioji Mimi kelionė 🐾',
                    'home.storyText': 'Mimi buvo rasta visiškai šlapia ir drebanti nuo šalčio griovyje netoli Klaipėdos. Ji svėrė vos kilogramą ir jau buvo praradusi viltį. Mūsų šildomame konteineryje ji rado prieglobstį, maistą ir meilę, kad vėl pradėtų pasitikėti. Šiandien Mimi yra sveika, žaisminga ir ieško žmonių, kurie suteiktų jai tikrus namus. Būtent dėl tokių istorijų mes aukojame kiekvieną savo laisvą minutę.',
                    'home.realityNote': 'Dėl didelio vietos trūkumo daugelis iš 600 išgelbėtų kačių laikinai gyvena narvuose. Paremkite mus arba priglauskite katę, kad suteiktumėte joms geresnį rytojų.',
                    'ueberuns.title': 'Apie mus ir komandą',
                    'ueberuns.subtitle': 'Kaip meilė bejėgiams gyvūnams tapo gyvenimo tikslu ir kodėl mums reikia kiekvienos pagalbos rankos.',
                    'ueberuns.historyTitle': 'Mūsų istorija: kelias, grįstas meile ir rūpesčiu',
                    'ueberuns.historyText1': 'Už mūsų prieglaudos stovi ne turtingi rėmėjai ar valstybės biudžetas. Viskas prasidėjo 2011 metais, kai Galina Kučinskienė nebegalėjo žiūrėti į Klaipėdos gatvės kačių kančias ir priglaudė pirmuosiuos sužeistus gyvūnus savo namuose. Tai, kas prasidėjo kaip nedidelė gelbėjimo akcija, per 13 metų išaugo į nuolatinį prieglobstį daugiau nei 600 šunų, kačių ir laukinių gyvūnų. Kiekvieną dieną mes atiduodame paskutines savo jėgas ir asmenines lėšas, kad apsaugotume šias nuostabias sielas.',
                    'ueberuns.historyText2': 'Mūsų pagrindinis tikslas paprastas, bet gyvybiškai svarbus: kiekviena išgelbėta siela turi pajusti, kad yra mylima, kol mes suteikiame skubią pagalbą ir ieškome jai tikrųjų namų. Kad suteiktų katėms balsą užsienyje, Žana Baskytė nenuilstamai savanoriauja kaip tiltas į naują gyvenimą, padėdama rasti namus Vokietijoje ir organizuodama keliones.',
                    'ueberuns.containerTitle': 'Konteinerių projektas 🐈',
                    'ueberuns.containerSubtitle': 'Pastatyta mūsų pačių rankomis',
                    'ueberuns.containerText': 'Kai prieglaudoje pritrūko vietos ir būtume turėję atsisakyti priimti gyvūnus, nusprendėme kovoti. Kilusi idėja: paversti senus jūrinius konteinerius kačių rojumi. Savo rankomis, savanorių pagalba ir asmeninėmis lėšomis apšiltinome konteinerius, įrengėme oro kondicionavimą, laipiojimo sieneles ir jaukius guolius. Šiandien čia saugų prieglobstį randa per 360 kačių.',
                    'ueberuns.donationTitle': 'Paremk mūsų širdies darbą',
                    'ueberuns.donationText': 'Kiekvienas centas, kiekviena valanda ir kiekviena kodo eilutė yra aukojami privačiai. Mes negauname valstybės paramos. Jūsų parama 100 % skiriama maistui, vaistams ir šiltų konteinerių erdvių išlaikymui.',
                    'ratgeber.title': 'Kačių gidas ir DUK 📖',
                    'ratgeber.subtitle': 'Viskas, ką nauji kačių šeimininkai ir miesto žmonės turėtų žinoti apie kačių elgseną, priežiūrą bei saugumą.',
                    'ratgeber.warningTitle': 'Svarbi pastaba gyvenantiems butuose',
                    'ratgeber.warningDesc': 'Katėms butuose reikia pakankamai veiklos, vietų draskymui ir ypač apsaugotų langų (apsaugos nuo atvertimo!), kad jos gyventų laimingą ir saugų gyvenimą.'
                  }[item.key] || '';

                  const currentDe = dbEntry ? dbEntry.DE : defaultDe;
                  const currentLt = dbEntry ? dbEntry.LT : defaultLt;
                  const isEditing = editingKey === item.key;
                  const status = saveStatus[item.key];

                  return (
                    <div key={item.key} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{item.category}</span>
                          <h4 className="text-xs font-bold text-stone-850">{item.label}</h4>
                          <code className="text-[9px] text-stone-400 font-mono">{item.key}</code>
                        </div>
                        
                        {!isEditing ? (
                          <button
                            onClick={() => startEditStatic(item.key, currentDe, currentLt)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-lg border border-stone-200 transition-colors shadow-sm"
                          >
                            Bearbeiten
                          </button>
                        ) : (
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => setEditingKey(null)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-250 text-stone-600 text-[10px] font-bold rounded-lg border border-stone-200 transition-colors"
                            >
                              Abbrechen
                            </button>
                            <button
                              onClick={() => handleSaveStatic(item.key)}
                              disabled={status === 'saving'}
                              className="px-2.5 py-1.5 bg-brandpink-600 hover:bg-brandpink-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1"
                            >
                              {status === 'saving' ? (
                                <span>Speichert...</span>
                              ) : status === 'success' ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <span>Speichern</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Display / Edit areas */}
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] font-bold text-stone-500 block mb-0.5">DEUTSCH</label>
                          {isEditing ? (
                            <textarea
                              value={editDe}
                              onChange={(e) => setEditDe(e.target.value)}
                              rows={3}
                              className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white focus:outline-none focus:border-brandpink-500 font-sans"
                            />
                          ) : (
                            <p className="text-xs text-stone-650 bg-stone-50/50 p-2.5 rounded-lg border border-stone-200/50 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap font-sans">
                              {currentDe}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-stone-500 block mb-0.5">LITAUISCH</label>
                          {isEditing ? (
                            <textarea
                              value={editLt}
                              onChange={(e) => setEditLt(e.target.value)}
                              rows={3}
                              className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white focus:outline-none focus:border-brandpink-500 font-sans"
                            />
                          ) : (
                            <p className="text-xs text-stone-650 bg-stone-50/50 p-2.5 rounded-lg border border-stone-200/50 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap font-sans">
                              {currentLt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FAQ & Ratgeber Items Section */}
            {textSection === 'faq' && (
              <div className="space-y-4">
                {dbGuideItems && dbGuideItems.length > 0 ? (
                  dbGuideItems.map((item) => {
                    const isEditing = editingKey === item.id;
                    const status = saveStatus[item.id];

                    return (
                      <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{item.category}</span>
                            <h4 className="text-xs font-bold text-stone-850">Ratgeber-Eintrag #{item.id}</h4>
                          </div>

                          {!isEditing ? (
                            <button
                              onClick={() => startEditFaq(item.id, item.question.DE, item.question.LT, item.answer.DE, item.answer.LT)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-lg border border-stone-200 transition-colors shadow-sm"
                            >
                              Bearbeiten
                            </button>
                          ) : (
                            <div className="flex space-x-1.5">
                              <button
                                onClick={() => setEditingKey(null)}
                                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-250 text-stone-600 text-[10px] font-bold rounded-lg border border-stone-200 transition-colors"
                              >
                                Abbrechen
                              </button>
                              <button
                                onClick={() => handleSaveFaq(item.id)}
                                disabled={status === 'saving'}
                                className="px-2.5 py-1.5 bg-brandpink-600 hover:bg-brandpink-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1"
                              >
                                {status === 'saving' ? (
                                  <span>Speichert...</span>
                                ) : status === 'success' ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <span>Speichern</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Fields */}
                        <div className="space-y-3">
                          {/* Question DE */}
                          <div>
                            <label className="text-[9px] font-bold text-stone-500 block mb-0.5">FRAGE (DE)</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDeQ}
                                onChange={(e) => setEditDeQ(e.target.value)}
                                className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white focus:outline-none focus:border-brandpink-500"
                              />
                            ) : (
                              <p className="text-xs font-bold text-stone-850">{item.question.DE}</p>
                            )}
                          </div>

                          {/* Question LT */}
                          <div>
                            <label className="text-[9px] font-bold text-stone-500 block mb-0.5">KLAUSIMAS (LT)</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editLtQ}
                                onChange={(e) => setEditLtQ(e.target.value)}
                                className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white focus:outline-none focus:border-brandpink-500"
                              />
                            ) : (
                              <p className="text-xs font-bold text-stone-850">{item.question.LT}</p>
                            )}
                          </div>

                          {/* Answer DE */}
                          <div>
                            <label className="text-[9px] font-bold text-stone-500 block mb-0.5">ANTWORT (DE)</label>
                            {isEditing ? (
                              <textarea
                                value={editDeA}
                                onChange={(e) => setEditDeA(e.target.value)}
                                rows={3}
                                className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white focus:outline-none focus:border-brandpink-500 font-sans"
                              />
                            ) : (
                              <p className="text-xs text-stone-600 bg-stone-50/50 p-2.5 rounded-lg border border-stone-200/50 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">
                                {item.answer.DE}
                              </p>
                            )}
                          </div>

                          {/* Answer LT */}
                          <div>
                            <label className="text-[9px] font-bold text-stone-500 block mb-0.5">ATSAKYMAS (LT)</label>
                            {isEditing ? (
                              <textarea
                                value={editLtA}
                                onChange={(e) => setEditLtA(e.target.value)}
                                rows={3}
                                className="w-full p-2 text-xs border border-stone-300 rounded-lg text-stone-900 bg-white focus:outline-none focus:border-brandpink-500 font-sans"
                              />
                            ) : (
                              <p className="text-xs text-stone-600 bg-stone-50/50 p-2.5 rounded-lg border border-stone-200/50 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">
                                {item.answer.LT}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    Keine FAQ-Einträge in der Datenbank vorhanden.
                  </div>
                )}
              </div>
            )}

            {/* CMS Custom Blocks Section */}
            {textSection === 'cms' && (
              <div className="space-y-6">
                
                {/* 1. Add Block Form */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Neuen Inhalts-Block hinzufügen (CMS)
                  </h3>
                  
                  <form onSubmit={handleAddBlock} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Page Select */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                          Seite
                        </label>
                        <select
                          value={blockPage}
                          onChange={(e) => setBlockPage(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-brandpink-500"
                        >
                          <option value="home">Startseite</option>
                          <option value="about">Über Uns</option>
                          <option value="guide">Katzen-Ratgeber</option>
                        </select>
                      </div>

                      {/* Type Select */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                          Typ
                        </label>
                        <select
                          value={blockType}
                          onChange={(e) => {
                            setBlockType(e.target.value as any);
                            setBlockDe('');
                            setBlockLt('');
                          }}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-brandpink-500"
                        >
                          <option value="title">Titel (Überschrift)</option>
                          <option value="paragraph">Absatz (Text)</option>
                          <option value="image">Bild (Datei)</option>
                        </select>
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                          Reihenfolge (Zahl)
                        </label>
                        <input
                          type="number"
                          value={blockSortOrder}
                          onChange={(e) => setBlockSortOrder(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-brandpink-500"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                      {blockType === 'image' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Image DE */}
                          <div className="space-y-1.5">
                            <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">
                              Bild für Deutsch (DE)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFileChange(e, 'de')}
                              className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-brandpink-50 file:text-brandpink-700 hover:file:bg-brandpink-100 cursor-pointer"
                            />
                            {blockDe && (
                              <div className="aspect-[16/9] w-full max-h-32 rounded-lg overflow-hidden border border-stone-200 mt-2 bg-stone-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={blockDe} alt="Preview DE" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>

                          {/* Image LT */}
                          <div className="space-y-1.5">
                            <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">
                              Bild für Litauisch (LT)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFileChange(e, 'lt')}
                              className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-brandpink-50 file:text-brandpink-700 hover:file:bg-brandpink-100 cursor-pointer"
                            />
                            {blockLt && (
                              <div className="aspect-[16/9] w-full max-h-32 rounded-lg overflow-hidden border border-stone-200 mt-2 bg-stone-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={blockLt} alt="Preview LT" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Text input DE */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                              Inhalt auf Deutsch (DE)
                            </label>
                            {blockType === 'title' ? (
                              <input
                                type="text"
                                value={blockDe}
                                onChange={(e) => setBlockDe(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-brandpink-500"
                                placeholder="z.B. Besondere Vermittlungshinweise"
                              />
                            ) : (
                              <textarea
                                value={blockDe}
                                onChange={(e) => setBlockDe(e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-brandpink-500 font-sans leading-relaxed"
                                placeholder="Geben Sie hier den deutschen Fließtext ein..."
                              />
                            )}
                          </div>

                          {/* Text input LT */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 ml-1">
                              Inhalt auf Litauisch (LT)
                            </label>
                            {blockType === 'title' ? (
                              <input
                                type="text"
                                value={blockLt}
                                onChange={(e) => setBlockLt(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-brandpink-500"
                                placeholder="z.B. Specialios globos rekomendacijos"
                              />
                            ) : (
                              <textarea
                                value={blockLt}
                                onChange={(e) => setBlockLt(e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-brandpink-500 font-sans leading-relaxed"
                                placeholder="Įveskite čia tekstą lietuvių kalba..."
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={cmsSaveStatus === 'saving'}
                        className="px-4 py-2 bg-brandpink-600 hover:bg-brandpink-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
                      >
                        {cmsSaveStatus === 'saving' ? (
                          <span>Speichert...</span>
                        ) : cmsSaveStatus === 'success' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Hinzugefügt!</span>
                          </>
                        ) : (
                          <span>Block hinzufügen</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Existing Blocks List */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Bestehende Blöcke bearbeiten / löschen
                  </h3>

                  {customBlocks && customBlocks.length > 0 ? (
                    (() => {
                      const sorted = [...customBlocks].sort((a, b) => a.sort_order - b.sort_order);
                      
                      return (
                        <div className="space-y-3">
                          {sorted.map((block) => {
                            const pageLabel = 
                              block.page === 'home' ? 'Startseite' : 
                              block.page === 'about' ? 'Über Uns' : 'Ratgeber';
                            const typeLabel = 
                              block.type === 'title' ? 'Titel' : 
                              block.type === 'paragraph' ? 'Absatz' : 'Bild';
                            
                            return (
                              <div 
                                key={block.id} 
                                className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4"
                              >
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 text-[9px] font-extrabold uppercase">
                                      {pageLabel}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-brandpink-50 border border-brandpink-200/50 text-brandpink-700 text-[9px] font-extrabold uppercase">
                                      {typeLabel}
                                    </span>
                                    <span className="text-[10px] text-stone-400 font-mono">
                                      Reihenfolge: #{block.sort_order}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-stone-700">
                                    <div>
                                      <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wide">DE</span>
                                      {block.type === 'image' ? (
                                        <div className="aspect-[16/9] w-28 max-h-16 rounded-md overflow-hidden border border-stone-200 mt-1 bg-stone-50">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={block.de} alt="de" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <p className="font-light italic line-clamp-3">{block.de}</p>
                                      )}
                                    </div>
                                    <div>
                                      <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-wide">LT</span>
                                      {block.type === 'image' ? (
                                        <div className="aspect-[16/9] w-28 max-h-16 rounded-md overflow-hidden border border-stone-200 mt-1 bg-stone-50">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={block.lt} alt="lt" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <p className="font-light italic line-clamp-3">{block.lt}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => block.id && handleDeleteBlock(block.id)}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 border border-red-150 transition-colors shadow-sm self-start"
                                  title="Block löschen"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
                                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="py-12 text-center bg-white border border-stone-200 rounded-2xl text-stone-400 text-xs shadow-sm">
                      Keine benutzerdefinierten CMS Blöcke vorhanden. Fügen Sie oben Ihren ersten Block hinzu!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
