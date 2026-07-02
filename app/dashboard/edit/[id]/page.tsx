'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Animal } from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';

import { logger } from '@/lib/logger';
import { syncWithCloud, uploadMediaBlob, pruneRevisions } from '@/lib/syncManager';
import { isOpfsSupported, saveToOpfs, removeFromOpfs } from '@/lib/opfsStorage';
import HelpBottomSheet from '@/components/HelpBottomSheet';
import VideoRecorderModal from '@/components/VideoRecorderModal';
import { helpContent } from '@/lib/helpContent';
import { 
  ArrowLeft, 
  Wifi, 
  WifiOff, 
  Camera, 
  Upload,
  Video, 
  Trash2, 
  Save, 
  CheckCircle,
  AlertTriangle,
  FileImage,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mic,
  Square,
  Cloud,
  CloudOff,
  HelpCircle,
  Plus,
  Eye,
  Download,
  Globe
} from 'lucide-react';
import { appendAudioBlobs } from '@/lib/audioStitcher';

export default function EditCatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const catId = parseInt(resolvedParams.id);
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(true);
  const [activeSection, setActiveSection] = useState<'basic' | 'medical' | 'behavior' | 'media' | 'revisions'>('basic');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [helpKey, setHelpKey] = useState<string | null>(null);
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('bmd_lang') as 'DE' | 'LT';
      if (savedLang && (savedLang === 'DE' || savedLang === 'LT')) {
        setLang(savedLang);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bmd_lang', lang);
  }, [lang]);

  const defaultUi = {
    DE: {
      name: 'Name *',
      namePlaceholder: 'z.B. Luna',
      room: 'Raum',
      roomPlaceholder: 'z.B. Container 1',
      cage: 'Käfig / Box',
      cagePlaceholder: 'z.B. Box 3',
      gender: 'Geschlecht',
      genderFemale: 'Weiblich',
      genderMale: 'Männlich',
      ageLabel: 'Alter Angeben',
      ageModeRange: 'Von-Bis',
      ageModeExact: 'Exakt',
      ageModeYear: 'Jahr',
      ageEstimate: 'Alter schätzen (Jahre)',
      ageMin: 'Minimum',
      ageMax: 'Maximum',
      ageExactLabel: 'Exaktes Alter',
      ageYearsUnit: 'Jahre',
      birthYear: 'Jahr',
      birthMonth: 'Monat',
      birthDay: 'Tag',
      birthMonthPlaceholder: 'unbekannt',
      birthDayPlaceholder: 'unbekannt',
      typeLabel: 'Tierart',
      typeCat: 'Katze',
      typeDog: 'Hund',
      typeOther: 'Andere',
      admissionDate: 'Seit wann im Tierheim?',
      reasonForShelter: 'Warum im Tierheim?',
      reasonPlaceholder: 'Hintergründe der Abgabe...',
      restrictions: 'Einschränkungen (z.B. Krankheiten)',
      restrictionsPlaceholder: 'z.B. Nierendiät, mag keine Katzen...',
      misc: 'Sonstiges',
      miscPlaceholder: 'Besonderheiten der Katze...',
      publishLabel: 'Galerie veröffentlichen',
      publishDesc: 'Öffentlich anzeigen',
      emergencyLabel: 'Sorgenfell / Notfall',
      emergencyDesc: 'SOS rote Markierung',
      status: 'Status',
      statusAvailable: 'zu vermitteln',
      statusReserved: 'reserviert',
      statusAdopted: 'vermittelt',
      saveBtn: 'Änderungen speichern',
      saving: 'Wird gespeichert...',
      
      // Media Tab
      uploadMediaHeader: 'Fotos & Videos hochladen',
      deviceCheckHeader: 'Geräte- & Speicher-Check',
      deviceCheckSub: 'Berechtigungen für Kamera & Mikrofon',
      recheckBtn: 'Erneut prüfen',
      checkingText: 'Prüft...',
      cameraStatusLabel: 'Kamera',
      micStatusLabel: 'Mikrofon',
      storageTypeLabel: 'Speicher-Typ',
      storageProtectionLabel: 'Speicher-Schutz',
      readyText: 'Bereit',
      blockedText: 'Blockiert',
      uncheckedText: 'Ungeprüft',
      optimizedText: 'Optimiert',
      standardText: 'Standard',
      protectedText: 'Geschützt',
      temporaryText: 'Temporär',
      
      opfsNote: 'Dein Gerät unterstützt das moderne OPFS-Dateisystem nicht. Videos werden im Standard-Datenbankspeicher abgelegt. Bitte lade Videos vorzugsweise hoch, wenn du online bist, um Speicher-Engpesste zu vermeiden.',
      persistentNote: 'Der Speicher ist als temporär eingestufen. Falls der Speicher deines Handys sehr voll wird, könnte der Browser ungesynchronisierte Entwürfe löschen. Synchronisiere deine Einträge bitte zeitnah!',
      howToAllowHeader: 'Wie du den Zugriff erlauben kannst:',
      howToAllowCam: 'Klicke oben links neben der Webadresse (in der Adressleiste deines Browsers) auf das Schloss-Symbol 🔒 und stelle Kamera auf "Zulassen" / "Erlauben".',
      howToAllowMic: 'Klicke ebenfalls auf das Schloss-Symbol 🔒 und erlaube den Zugriff auf das Mikrofon, damit du Sprachnotizen aufnehmen kannst.',
      howToAllowMobile: 'Gehe in die Handy-Einstellungen unter Apps → Browser (z.B. Chrome/Safari) → Berechtigungen und erlaube dort Kamera/Mikrofon. Lade danach diese Seite neu.',
      
      galleryPhotosHeader: 'Galeriefotos (max. 20)',
      galleryPhotosSub: 'Bilder für die Vermittlungsgalerie',
      passportPhotosHeader: 'Dokumente / Impfpässe (max. 5)',
      passportPhotosSub: 'Nur intern für Mitarbeiter sichtbar',
      videosHeader: 'Videos (max. 5, max. 5 Min., unter 200 MB)',
      videosSub: 'Direkter Cloud-Upload & Offline-Speicherung (OPFS) unterstützt',
      videoTip: 'Direkt in der App aufgenommene Videos werden automatisch optimal komprimiert. Größere Videos aus der Galerie werden im Hintergrund verkleinert, oder du teilst sie vorab kurz per WhatsApp/Telegram, um sie sofort zu schrumpfen.',
      
      cameraBtn: 'Kamera',
      galleryBtn: 'Galerie',
      recordBtn: 'Aufnehmen',
      uploadBtn: 'Galerie',
      
      noPhotosText: 'Keine Fotos aufgenommen.',
      noPassportsText: 'Keine Pässe aufgenommen.',
      noVideosText: 'Keine Videos geladen.',
      localBadge: 'Lokal',
      onlineBadge: 'Online',
      
      optimizingText: 'Optimierung',
      compressProgressText: 'Video wird für den schnellen Upload verkleinert, bitte warten...',
      
      audioHeader: 'Sprachnotizen',
      audioSub: 'Nimm bis zu 10 Sprachnotizen auf oder führe eine bestehende fort',
      newAudioBtn: 'Neue Sprachnotiz',
      addingAudioText: 'Hinzufügen läuft...',
      recordingAudioText: 'Aufnahme läuft...',
      stopRecordingBtn: 'Aufnahme stoppen & speichern',
      noAudioText: 'Keine Sprachnotizen aufgenommen. Klicke oben auf "Neue Sprachnotiz", um zu starten.',
      continueBtn: 'Fortsetzen',
      deleteBtn: 'Löschen',
      
      editedByLabel: 'Wer nimmt diese Änderung vor? *',
      editedByPlaceholder: 'Dein Name oder Kürzel (z.B. Carlos)',
      editedByDesc: 'Dies hilft dem Team nachzuvollziehen, wer welche Version bearbeitet hat.',
      
      // Revisions Tab
      revisionsHeader: 'Versionsverlauf (Die letzten 10 Änderungen)',
      revisionsSub: 'Hier siehst du, wer dieses Profil wann bearbeitet hat. Du kannst eine frühere Version direkt in das Formular laden, um sie zu überprüfen und wieder aktiv zu speichern.',
      loadingRevisions: 'Versionsverlauf wird geladen...',
      noRevisions: 'Bisher wurden keine früheren Versionen für dieses Tier gespeichert.',
      compareBtn: 'Vergleichen',
      restoreConfirm: 'Möchten Sie das Formular wirklich auf den Stand vom {date} zurücksetzen? Ungespeicherte aktuelle Änderungen gehen dabei verloren.',
      identicalBadge: 'Aktuell identisch',
      diffOne: 'Unterschied',
      diffMany: 'Unterschiede'
    },
    LT: {
      name: 'Vardas *',
      namePlaceholder: 'pvz., Luna',
      room: 'Patalpa/Kambarys',
      roomPlaceholder: 'pvz., 1 konteineris',
      cage: 'Narvas / Boksas',
      cagePlaceholder: 'pvz., 3 boksas',
      gender: 'Lytis',
      genderFemale: 'Patelė',
      genderMale: 'Patinas',
      ageLabel: 'Nurodyti amžių',
      ageModeRange: 'Nuo-Iki',
      ageModeExact: 'Tikslus',
      ageModeYear: 'Metai',
      ageEstimate: 'Amžiaus vertinimas (metais)',
      ageMin: 'Minimumas',
      ageMax: 'Maximumas',
      ageExactLabel: 'Tikslus amžius',
      ageYearsUnit: 'metai',
      birthYear: 'Metai',
      birthMonth: 'Mėnuo',
      birthDay: 'Diena',
      birthMonthPlaceholder: 'nežinoma',
      birthDayPlaceholder: 'nežinoma',
      typeLabel: 'Gyvūno rūšis',
      typeCat: 'Katė',
      typeDog: 'Šuo',
      typeOther: 'Kita',
      admissionDate: 'Nuo kada prieglaudoje?',
      reasonForShelter: 'Kodėl prieglaudoje?',
      reasonPlaceholder: 'Priėmimo aplinkybės...',
      restrictions: 'Apribojimai (pvz., ligos)',
      restrictionsPlaceholder: 'pvz., inkstų dieta, nemėgsta kitų kačių...',
      misc: 'Kita',
      miscPlaceholder: 'Gyvūno ypatybės...',
      publishLabel: 'Viešinti galerijoje',
      publishDesc: 'Rodyti viešai',
      emergencyLabel: 'Ypatingas dėmesys / SOS',
      emergencyDesc: 'SOS raudona žyma',
      status: 'Būsena',
      statusAvailable: 'ieško namų',
      statusReserved: 'rezervuota',
      statusAdopted: 'dovanota',
      saveBtn: 'Išsaugoti pakeitimus',
      saving: 'Saugoma...',
      
      // Media Tab
      uploadMediaHeader: 'Įkelti nuotraukas ir vaizdo įrašus',
      deviceCheckHeader: 'Įrenginio ir atminties patikra',
      deviceCheckSub: 'Kameros ir mikrofono leidimai',
      recheckBtn: 'Tikrinti iš naujo',
      checkingText: 'Tikrinama...',
      cameraStatusLabel: 'Kamera',
      micStatusLabel: 'Mikrofonas',
      storageTypeLabel: 'Atminties tipas',
      storageProtectionLabel: 'Atminties apsauga',
      readyText: 'Paruošta',
      blockedText: 'Blokuojama',
      uncheckedText: 'Netikrinta',
      optimizedText: 'Optimizuota',
      standardText: 'Standartinė',
      protectedText: 'Apsaugota',
      temporaryText: 'Laikina',
      
      opfsNote: 'Jūsų įrenginys nepalaiko modernios OPFS failų sistemų. Vaizdo įrašai bus saugomi standartinėje duomenų bazėje. Rekomenduojame vaizdo įrašus kelti prisijungus prie interneto, kad išvengtumėte atminties trūkumo.',
      persistentNote: 'Atmintis pažymėta kaip laikina. Jei telefono atmintis bus pilna, naršyklė gali ištrinti nesinchronizuotus juodraščius. Prašome kuo greičiau sinchronizuoti įrašus!',
      howToAllowHeader: 'Kaip suteikti prieigą:',
      howToAllowCam: 'Spustelėkite spynos piktogramą 🔒 šalia interneto adreso (naršyklės adreso juostoje) ir nustatykite Kamerą į „Leisti“.',
      howToAllowMic: 'Taip pat spustelėkite spynos piktogramą 🔒 ir leiskite prieigą prie mikrofono, kad galėtumėte įrašyti balso pastabas.',
      howToAllowMobile: 'Telefono nustatymuose eikite į Programos → Naršyklė (pvz., Chrome/Safari) → Leidimai ir ten leiskite kamerą/mikrofoną. Tada atnaujinkite šį puslapį.',
      
      galleryPhotosHeader: 'Galerijos nuotraukos (maks. 20)',
      galleryPhotosSub: 'Nuotraukos viešai galerijai',
      passportPhotosHeader: 'Dokumentai / Skiepų pasai (maks. 5)',
      passportPhotosSub: 'Matoma tik darbuotojams (vidiniam naudojimui)',
      videosHeader: 'Vaizdo įrašai (maks. 5, maks. 5 min., iki 200 MB)',
      videosSub: 'Palaikomas tiesioginis įkėlimas į debesį ir saugojimas neprisijungus (OPFS)',
      videoTip: 'Tiesiogiai programėlėje įrašyti vaizdo įrašai yra automatiškai optimizuojami. Didesni vaizdo įrašai iš galerijos bus sumažinti fone, arba galite prieš tai juos trumpai pasidalinti per WhatsApp/Telegram, kad iškart sumažintumėte dydį.',
      
      cameraBtn: 'Kamera',
      galleryBtn: 'Galerija',
      recordBtn: 'Įrašyti',
      uploadBtn: 'Galerija',
      
      noPhotosText: 'Nuotraukų nėra.',
      noPassportsText: 'Dokumentų nėra.',
      noVideosText: 'Vaizdo įrašų nėra.',
      localBadge: 'Vietinis',
      onlineBadge: 'Internetinis',
      
      optimizingText: 'Optimizavimas',
      compressProgressText: 'Vaizdo įrašas mažinamas greitesniam įkėlimui, prašome palaukti...',
      
      audioHeader: 'Balso pastabos',
      audioSub: 'Įrašykite iki 10 balso pastabų arba tęskite esamą',
      newAudioBtn: 'Nauja balso pastaba',
      addingAudioText: 'Pridedama...',
      recordingAudioText: 'Įrašoma...',
      stopRecordingBtn: 'Sustabdyti ir išsaugoti',
      noAudioText: 'Balso pastabų nėra. Spustelėkite „Nauja balso pastaba“ viršuje, kad pradėtumėte.',
      continueBtn: 'Tęsti',
      deleteBtn: 'Ištrinti',
      
      editedByLabel: 'Kas atlieka šį pakeitimą? *',
      editedByPlaceholder: 'Jūsų vardas arba inicialai (pvz., Karolis)',
      editedByDesc: 'Tai padeda komandai sekti, kas redagavo kurią versiją.',
      
      // Revisions Tab
      revisionsHeader: 'Versijų istorija (Paskutiniai 10 pakeitimų)',
      revisionsSub: 'Čia galite matyti, kas ir kada redagavo šį profilį. Galite įkelti ankstesnę versiją tiesiai į formą, kad ją peržiūrėtumėte ir vėl išsaugotumėte.',
      loadingRevisions: 'Kraunama istorija...',
      noRevisions: 'Šiam gyvūnui ankstesnių versijų dar neišsaugota.',
      compareBtn: 'Palyginti',
      restoreConfirm: 'Ar tikrai norite atkurti formos būseną iš {date}? Neišsaugoti dabartiniai pakeitimai bus prarasti.',
      identicalBadge: 'Šiuo metu identiška',
      diffOne: 'skirtumas',
      diffMany: 'skirtumai'
    }
  };

  const uiTexts = useLiveQuery(() => db.uiTexts.toArray());
  const ui = { ...defaultUi[lang] };
  if (uiTexts) {
    uiTexts.forEach((item) => {
      if (item.key.startsWith('edit.')) {
        const subKey = item.key.split('.')[1];
        if (subKey in ui) {
          (ui as any)[subKey] = item[lang] || (ui as any)[subKey];
        }
      }
    });
  }
  
  // Loading & Entity State
  const [loading, setLoading] = useState(true);
  const [existingAnimal, setExistingAnimal] = useState<Animal | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Weiblich' | 'Männlich'>('Weiblich');
  const [statusAktuell, setStatusAktuell] = useState<'zu vermitteln' | 'reserviert' | 'vermittelt'>('zu vermitteln');
  const [ageYears, setAgeYears] = useState(0);
  const [ageMode, setAgeMode] = useState<'range' | 'exact' | 'birthyear'>('range');
  const [ageMin, setAgeMin] = useState(2);
  const [ageMax, setAgeMax] = useState(3);
  const [ageExact, setAgeExact] = useState(2);
  const [birthYear, setBirthYear] = useState(2024);
  const [birthMonth, setBirthMonth] = useState<number | undefined>(undefined);
  const [birthDay, setBirthDay] = useState<number | undefined>(undefined);
  
  const [shelterMonth, setShelterMonth] = useState('06');
  const [shelterYear, setShelterYear] = useState('2026');
  const [roomName, setRoomName] = useState('');
  const [cageName, setCageName] = useState('');

  const [audioItems, setAudioItems] = useState<{ url: string; isSynced: boolean }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null); // null = new, number = append index
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [reasonForShelter, setReasonForShelter] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [notesMiscellaneous, setNotesMiscellaneous] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);

  // Vermittlung / Haltung State
  const [slowIntegration, setSlowIntegration] = useState(false);
  const [partnerNeeded, setPartnerNeeded] = useState(false);
  const [noSingleAnimal, setNoSingleAnimal] = useState(false);
  const [needsOutdoor, setNeedsOutdoor] = useState(false);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [securedBalcony, setSecuredBalcony] = useState(false);
  const [forBeginners, setForBeginners] = useState(false);
  const [forExperienced, setForExperienced] = useState(false);
  const [quietHome, setQuietHome] = useState(false);
  const [patientPeople, setPatientPeople] = useState(false);
  const [needsAttention, setNeedsAttention] = useState(false);
  const [noSmallChildren, setNoSmallChildren] = useState(false);
  const [suitableSeniors, setSuitableSeniors] = useState(false);
  const [suitableFamilies, setSuitableFamilies] = useState(false);

  // Gesundheit State
  const [notCastrated, setNotCastrated] = useState(false);
  const [hasCatPlagueVaccine, setHasCatPlagueVaccine] = useState(false);
  const [vaccinationStatusUnknown, setVaccinationStatusUnknown] = useState(false);
  const [fivNegative, setFivNegative] = useState(false);
  const [felvNegative, setFelvNegative] = useState(false);
  const [fivPositive, setFivPositive] = useState(false);
  const [felvPositive, setFelvPositive] = useState(false);
  const [fipPositive, setFipPositive] = useState(false);
  const [fleaMiteTreatment, setFleaMiteTreatment] = useState(false);
  const [handicaps, setHandicaps] = useState('');

  // Charakter / Verhalten State
  const [traitTrusting, setTraitTrusting] = useState(false);
  const [traitPeopleOriented, setTraitPeopleOriented] = useState(false);
  const [traitQuiet, setTraitQuiet] = useState(false);
  const [traitActive, setTraitActive] = useState(false);
  const [traitNeedsTime, setTraitNeedsTime] = useState(false);
  const [traitAllowsTouch, setTraitAllowsTouch] = useState(false);
  const [traitAllowsLift, setTraitAllowsLift] = useState(false);
  const [traitAllowsBrush, setTraitAllowsBrush] = useState(false);
  const [traitShowsLimits, setTraitShowsLimits] = useState(false);
  const [traitSeeksCats, setTraitSeeksCats] = useState(false);
  const [traitInsecureCats, setTraitInsecureCats] = useState(false);
  const [traitDominant, setTraitDominant] = useState(false);
  const [traitSubmissive, setTraitSubmissive] = useState(false);
  const [traitSensitiveNoise, setTraitSensitiveNoise] = useState(false);
  const [traitLitterBox, setTraitLitterBox] = useState(false);
  const [traitCompatCats, setTraitCompatCats] = useState(false);
  const [traitCompatDogs, setTraitCompatDogs] = useState(false);
  const [traitCompatChildren, setTraitCompatChildren] = useState(false);


  // Versioning States
  const [staffName, setStaffName] = useState('');
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [expandedRevisionId, setExpandedRevisionId] = useState<number | null>(null);

  const getChangedFields = (revData: any) => {
    const changes: { label: string; oldVal: string; newVal: string }[] = [];
    const isDe = lang === 'DE';
    const yesText = isDe ? 'Ja' : 'Taip';
    const noText = isDe ? 'Nein' : 'Ne';

    const compare = (labelDe: string, labelLt: string, oldVal: any, newVal: any) => {
      const formattedOld = oldVal === true ? yesText : oldVal === false ? noText : String(oldVal ?? '-').trim();
      const formattedNew = newVal === true ? yesText : newVal === false ? noText : String(newVal ?? '-').trim();
      if (formattedOld !== formattedNew) {
        changes.push({ label: isDe ? labelDe : labelLt, oldVal: formattedOld, newVal: formattedNew });
      }
    };

    compare('Name', 'Vardas', revData.name, name);
    compare('Raum', 'Kambarys', revData.room_name, roomName);
    compare('Käfig', 'Narvas', revData.cage_name, cageName);
    compare('Geschlecht', 'Lytis', revData.gender, gender);
    compare('Status', 'Statusas', revData.status_aktuell, statusAktuell);
    
    // Age comparisons
    compare('Alter-Modus', 'Amžiaus režimas', revData.age_mode, ageMode);
    if (ageMode === 'range') {
      compare('Mindestalter (Jahre)', 'Minimalus amžius (metais)', revData.age_min, ageMin);
      compare('Maximalalter (Jahre)', 'Maksimalus amžius (metais)', revData.age_max, ageMax);
    } else if (ageMode === 'exact') {
      compare('Exaktes Alter (Jahre)', 'Tikslus amžius (metais)', revData.age_years, ageExact);
    } else if (ageMode === 'birthyear') {
      compare('Geburtsjahr', 'Gimimo metai', revData.birth_year, birthYear);
      compare('Geburtsmonat', 'Gimimo mėnuo', revData.birth_month, birthMonth);
      compare('Geburtstag', 'Gimimo diena', revData.birth_day, birthDay);
    }

    compare('Aufnahmedatum (Jahr-Monat)', 'Priėmimo data (metai-mėnuo)', revData.shelter_admission_date, `${shelterYear}-${shelterMonth}`);
    compare('Grund für Aufnahme', 'Priėmimo priežastis', revData.reason_for_shelter, reasonForShelter);
    compare('Einschränkungen', 'Apribojimai', revData.restrictions, restrictions);
    compare('Interne Notizen / Beschreibung', 'Vidinės pastabos / aprašymas', revData.notes_miscellaneous, notesMiscellaneous);
    compare('Öffentlich sichtbar', 'Viešai matomas', revData.is_published, isPublished);
    compare('Dringender Notfall', 'Skubus atvejis', revData.is_emergency, isEmergency);
    
    compare('Kastriert', 'Kastruotas', revData.is_castrated, isCastrated);
    compare('Gechipt', 'Paženklintas mikroschema', revData.is_chipped, isChipped);
    compare('Tollwut-Impfung', 'Skiepas nuo pasiutligės', revData.has_rabies_vaccine, hasRabiesVaccine);
    compare('Katzenschnupfen-Impfung', 'Skiepas nuo kačių gripo', revData.has_cat_flu_vaccine, hasCatFluVaccine);
    compare('Entwurmt', 'Nukirmintas', revData.is_dewormed, isDewormed);
    compare('EU-Heimtierausweis', 'ES gyvūno augintinio pasas', revData.has_eu_passport, hasEuPassport);
    
    compare('Katzen-Verträglichkeit', 'Suderinamumas su katėmis', revData.compat_cats, compatCats);
    compare('Hunde-Verträglichkeit', 'Suderinamumas su šunimis', revData.compat_dogs, compatDogs);
    compare('Kinder-Verträglichkeit', 'Suderinamumas su vaikais', revData.compat_children, compatChildren);
    
    compare('Neugierig', 'Smalsus', revData.trait_curious, traitCurious);
    compare('Verspielt', 'Žaismingas', revData.trait_playful, traitPlayful);
    compare('Aggressiv', 'Agresyvus', revData.trait_aggressive, traitAggressive);
    compare('Ängstlich', 'Baimingas', revData.trait_fearful, traitFearful);
    compare('Verschmust', 'Meilus', revData.trait_cuddly, traitCuddly);
    
    return changes;
  };



  const loadRevisions = async () => {
    if (isNaN(catId)) return;
    try {
      setLoadingRevisions(true);
      const revList = await db.animalRevisions
        .where('animal_id')
        .equals(catId)
        .toArray();
      revList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRevisions(revList);
    } catch (err) {
      console.error('Failed to load animal revisions:', err);
    } finally {
      setLoadingRevisions(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'revisions') {
      loadRevisions();
    }
  }, [activeSection, catId]);

  // Medical Toggles
  const [isCastrated, setIsCastrated] = useState(true);
  const [isChipped, setIsChipped] = useState(true);
  const [hasRabiesVaccine, setHasRabiesVaccine] = useState(true);
  const [hasCatFluVaccine, setHasCatFluVaccine] = useState(true);
  const [isDewormed, setIsDewormed] = useState(true);
  const [hasEuPassport, setHasEuPassport] = useState(false);

  // Temperament Selects
  const [compatCats, setCompatCats] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [compatDogs, setCompatDogs] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [compatChildren, setCompatChildren] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitCurious, setTraitCurious] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitPlayful, setTraitPlayful] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitAggressive, setTraitAggressive] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitFearful, setTraitFearful] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitCuddly, setTraitCuddly] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');

  // Media
  const [photos, setPhotos] = useState<string[]>([]); // mixture of remote and local URLs
  const [passportPhotos, setPassportPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<{ 
    name: string; 
    blob?: Blob; 
    opfsKey?: string; 
    isSynced?: boolean; 
    url?: string;
    isUploading?: boolean;
  }[]>([]);

  // Device & Storage Diagnostics State
  const [opfsSupported, setOpfsSupported] = useState(false);
  const [storagePersistent, setStoragePersistent] = useState(false);

  // Permission Checks State
  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [deviceCheckRun, setDeviceCheckRun] = useState(false);
  const [deviceCheckLoading, setDeviceCheckLoading] = useState(false);

  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'warn'; text: string } | null>(null);

  const photoCameraInputRef = useRef<HTMLInputElement>(null);
  const photoGalleryInputRef = useRef<HTMLInputElement>(null);
  const passportCameraInputRef = useRef<HTMLInputElement>(null);
  const passportGalleryInputRef = useRef<HTMLInputElement>(null);
  const videoCameraInputRef = useRef<HTMLInputElement>(null);
  const videoGalleryInputRef = useRef<HTMLInputElement>(null);

  // Video recording & compression states
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [compressingVideoName, setCompressingVideoName] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Diagnostics check on mount
  useEffect(() => {
    setOpfsSupported(isOpfsSupported());
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('bmd_staff_name');
      if (savedName) {
        setStaffName(savedName);
      }
      if (navigator.storage && navigator.storage.persisted) {
        navigator.storage.persisted().then((persisted) => {
          setStoragePersistent(persisted);
        });
      }
    }
  }, []);


  // Authenticate Check
  useEffect(() => {
    const session = localStorage.getItem('bmd_session');
    if (session !== 'authenticated') {
      router.push('/login');
    }
  }, [router]);

  // Online status listening
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Fetch Cat Details
  useEffect(() => {
    async function fetchAnimal() {
      try {
        setLoading(true);
        if (isNaN(catId)) return;
        const animal = await db.animals.get(catId);
        if (animal) {
          setExistingAnimal(animal);
          setName(animal.name || '');
          setGender(animal.gender || 'Weiblich');
          setStatusAktuell(animal.status_aktuell || 'zu vermitteln');
          setAgeYears(animal.age_years || 0);
          setAgeMode(animal.age_mode || 'range');
          if (animal.age_mode === 'range') {
            setAgeMin(animal.age_min ?? 2);
            setAgeMax(animal.age_max ?? 3);
          }
          if (animal.age_mode === 'exact') {
            setAgeExact(animal.age_years ?? 2);
          }
          if (animal.age_mode === 'birthyear') {
            setBirthYear(animal.birth_year ?? 2024);
            setBirthMonth(animal.birth_month);
            setBirthDay(animal.birth_day);
          }
          if (animal.shelter_admission_date) {
            const parts = animal.shelter_admission_date.split('-');
            if (parts.length === 2) {
              setShelterYear(parts[0]);
              setShelterMonth(parts[1]);
            }
          }
          setRoomName(animal.room_name || '');
          setCageName(animal.cage_name || '');
          setReasonForShelter(animal.reason_for_shelter || '');
          setRestrictions(animal.restrictions || '');
          setNotesMiscellaneous(animal.notes_miscellaneous || '');
          setIsPublished(animal.is_published ?? true);
          setIsEmergency(animal.is_emergency ?? false);

          setSlowIntegration(animal.slow_integration ?? false);
          setPartnerNeeded(animal.partner_needed ?? false);
          setNoSingleAnimal(animal.no_single_animal ?? false);
          setNeedsOutdoor(animal.needs_outdoor ?? false);
          setIndoorOnly(animal.indoor_only ?? false);
          setSecuredBalcony(animal.secured_balcony ?? false);
          setForBeginners(animal.for_beginners ?? false);
          setForExperienced(animal.for_experienced ?? false);
          setQuietHome(animal.quiet_home ?? false);
          setPatientPeople(animal.patient_people ?? false);
          setNeedsAttention(animal.needs_attention ?? false);
          setNoSmallChildren(animal.no_small_children ?? false);
          setSuitableSeniors(animal.suitable_seniors ?? false);
          setSuitableFamilies(animal.suitable_families ?? false);

          setNotCastrated(animal.not_castrated ?? false);
          setHasCatPlagueVaccine(animal.has_cat_plague_vaccine ?? false);
          setVaccinationStatusUnknown(animal.vaccination_status_unknown ?? false);
          setFivNegative(animal.fiv_negative ?? false);
          setFelvNegative(animal.felv_negative ?? false);
          setFivPositive(animal.fiv_positive ?? false);
          setFelvPositive(animal.felv_positive ?? false);
          setFipPositive(animal.fip_positive ?? false);
          setFleaMiteTreatment(animal.flea_mite_treatment ?? false);
          setHandicaps(animal.handicaps || '');

          setTraitTrusting(animal.trait_trusting ?? false);
          setTraitPeopleOriented(animal.trait_people_oriented ?? false);
          setTraitQuiet(animal.trait_quiet ?? false);
          setTraitActive(animal.trait_active ?? false);
          setTraitNeedsTime(animal.trait_needs_time ?? false);
          setTraitAllowsTouch(animal.trait_allows_touch ?? false);
          setTraitAllowsLift(animal.trait_allows_lift ?? false);
          setTraitAllowsBrush(animal.trait_allows_brush ?? false);
          setTraitShowsLimits(animal.trait_shows_limits ?? false);
          setTraitSeeksCats(animal.trait_seeks_cats ?? false);
          setTraitInsecureCats(animal.trait_insecure_cats ?? false);
          setTraitDominant(animal.trait_dominant ?? false);
          setTraitSubmissive(animal.trait_submissive ?? false);
          setTraitSensitiveNoise(animal.trait_sensitive_noise ?? false);
          setTraitLitterBox(animal.trait_litter_box ?? false);
          setTraitCompatCats(animal.trait_compat_cats ?? false);
          setTraitCompatDogs(animal.trait_compat_dogs ?? false);
          setTraitCompatChildren(animal.trait_compat_children ?? false);

          setIsCastrated(animal.is_castrated ?? true);
          setIsChipped(animal.is_chipped ?? true);
          setHasRabiesVaccine(animal.has_rabies_vaccine ?? true);
          setHasCatFluVaccine(animal.has_cat_flu_vaccine ?? true);
          setIsDewormed(animal.is_dewormed ?? true);
          setHasEuPassport(animal.has_eu_passport ?? false);

          setCompatCats(animal.compat_cats || 'unbekannt');
          setCompatDogs(animal.compat_dogs || 'unbekannt');
          setCompatChildren(animal.compat_children || 'unbekannt');
          setTraitCurious(animal.trait_curious || 'unbekannt');
          setTraitPlayful(animal.trait_playful || 'unbekannt');
          setTraitAggressive(animal.trait_aggressive || 'unbekannt');
          setTraitFearful(animal.trait_fearful || 'unbekannt');
          setTraitCuddly(animal.trait_cuddly || 'unbekannt');

          setPhotos(animal.media_urls || []);
          setPassportPhotos(animal.passport_urls || []);

          // Load videos
          const mappedVideos: typeof videos = [];
          if (animal.video_urls && animal.video_urls.length > 0) {
            animal.video_urls.forEach((url) => {
              mappedVideos.push({ name: url.split('/').pop() || 'Video', isSynced: true, url });
            });
          }
          if (animal.local_videos && animal.local_videos.length > 0) {
            animal.local_videos.forEach((lv) => {
              mappedVideos.push({ name: lv.name, blob: lv.blob, opfsKey: lv.opfsKey, isSynced: false });
            });
          }
          setVideos(mappedVideos);

          // Load audios
          const mappedAudios: { url: string; isSynced: boolean }[] = [];
          if (animal.audio_urls && animal.audio_urls.length > 0) {
            animal.audio_urls.forEach((url) => {
              mappedAudios.push({ url, isSynced: true });
            });
          } else if (animal.audio_draft_url) {
            if (animal.audio_draft_url.startsWith('[')) {
              try {
                const parsed: string[] = JSON.parse(animal.audio_draft_url);
                parsed.forEach(url => mappedAudios.push({ url, isSynced: url.startsWith('http') }));
              } catch (e) {
                mappedAudios.push({ url: animal.audio_draft_url, isSynced: animal.audio_draft_url.startsWith('http') });
              }
            } else {
              mappedAudios.push({ url: animal.audio_draft_url, isSynced: animal.audio_draft_url.startsWith('http') });
            }
          }
          
          if (animal.local_audios && animal.local_audios.length > 0) {
            for (const la of animal.local_audios) {
              if (la.blob) {
                try {
                  const url = URL.createObjectURL(la.blob);
                  mappedAudios.push({ url, isSynced: false });
                } catch (e) {
                  console.error('Failed to create object URL for local audio:', e);
                }
              }
            }
          }
          setAudioItems(mappedAudios);
        }
      } catch (err) {
        console.error('Failed to retrieve animal details:', err);
        logger.error('AnimalEdit', `Fehler beim Laden des Tiers mit ID ${catId}`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnimal();
  }, [catId]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const base64ToBlob = (base64: string): Blob => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const runDeviceCheck = async (requestAccess: boolean) => {
    setDeviceCheckLoading(true);
    setDeviceCheckRun(true);
    
    let camPermission: 'prompt' | 'granted' | 'denied' = 'prompt';
    let micPermission: 'prompt' | 'granted' | 'denied' = 'prompt';

    // 1. Check Camera
    try {
      if (requestAccess) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        camPermission = 'granted';
      } else {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoLabels = devices.some(device => device.kind === 'videoinput' && device.label !== '');
        camPermission = hasVideoLabels ? 'granted' : 'prompt';
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        camPermission = 'denied';
      } else {
        camPermission = 'prompt';
      }
    }

    // 2. Check Microphone
    try {
      if (requestAccess) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        micPermission = 'granted';
      } else {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioLabels = devices.some(device => device.kind === 'audioinput' && device.label !== '');
        micPermission = hasAudioLabels ? 'granted' : 'prompt';
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        micPermission = 'denied';
      } else {
        micPermission = 'prompt';
      }
    }

    setCameraStatus(camPermission);
    setMicStatus(micPermission);
    setDeviceCheckLoading(false);
  };

  // Automatically check permissions when user selects the "Medien" tab
  useEffect(() => {
    if (activeSection === 'media') {
      runDeviceCheck(true);
    }
  }, [activeSection]);

  // Compress Image (Resizes to max 1024px and outputs JPEG at 0.75 quality)
  const compressImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const isTestEnv = typeof window !== 'undefined' && 
        (window.navigator.userAgent.includes('Node.js') || window.navigator.userAgent.includes('jsdom') || process.env.NODE_ENV === 'test');
      
      if (isTestEnv || !file.type.startsWith('image/')) {
        return fileToBase64(file).then(resolve).catch(reject);
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fileToBase64(file).then(resolve).catch(reject);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        let format = 'image/jpeg';
        try {
          const webpData = canvas.toDataURL('image/webp');
          if (webpData.startsWith('data:image/webp')) {
            format = 'image/webp';
          }
        } catch (e) {}

        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        fileToBase64(file).then(resolve).catch(reject);
      };
    });
  };

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(-1);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Upload Photos (max 20)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setAlertMessage(null);
    const files = Array.from(e.target.files);

    if (photos.length + files.length > 20) {
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Maximal 20 Bilder pro Tier erlaubt.' : 'Leidžiama įkelti ne daugiau kaip 20 nuotraukų.'
      });
      return;
    }

    // Pre-upload validation checks
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setAlertMessage({ 
          type: 'error', 
          text: lang === 'DE'
            ? `Huch! Die Datei "${file.name}" ist kein Foto. Bitte wähle nur Bilddateien (PNG, JPG, HEIC).`
            : `Oi! Failas „${file.name}“ nėra nuotrauka. Prašome pasirinkti tik paveikslėlių failus (PNG, JPG, HEIC).`
        });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setAlertMessage({ 
          type: 'error', 
          text: lang === 'DE'
            ? `Das Foto "${file.name}" ist mit ${(file.size / (1024 * 1024)).toFixed(1)} MB etwas zu groß. Wir bitten dich, Fotos unter 15 MB auszuwählen.`
            : `Nuotrauka „${file.name}“ užima ${(file.size / (1024 * 1024)).toFixed(1)} MB ir yra per didelė. Prašome pasirinkti nuotrauką iki 15 MB.`
        });
        return;
      }
    }

    try {
      const compressedBase64s = await Promise.all(
        files.map(file => compressImage(file))
      );
      setPhotos(prev => [...prev, ...compressedBase64s]);
    } catch (err) {
      console.error(err);
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Ein Fehler ist beim Verkleinern der Fotos aufgetreten.' : 'Klaida mažinant nuotraukas.'
      });
    }
  };

  // Upload Passport Photos (max 5)
  const handlePassportPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setAlertMessage(null);
    const files = Array.from(e.target.files);

    if (passportPhotos.length + files.length > 5) {
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Maximal 5 Impfpässe pro Tier erlaubt.' : 'Leidžiama įkelti ne daugiau kaip 5 skiepų pasus.'
      });
      return;
    }

    // Pre-upload validation checks
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setAlertMessage({ 
          type: 'error', 
          text: lang === 'DE'
            ? `Huch! Die Datei "${file.name}" ist kein Foto. Bitte wähle nur Bilddateien (PNG, JPG).`
            : `Oi! Failas „${file.name}“ nėra nuotrauka. Prašome pasirinkti tik paveikslėlių failus (PNG, JPG).`
        });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setAlertMessage({ 
          type: 'error', 
          text: lang === 'DE'
            ? `Die Datei "${file.name}" ist mit ${(file.size / (1024 * 1024)).toFixed(1)} MB zu groß. Bitte unter 15 MB bleiben.`
            : `Failas „${file.name}“ užima ${(file.size / (1024 * 1024)).toFixed(1)} MB ir yra per didelis. Prašome pasirinkti failą iki 15 MB.`
        });
        return;
      }
    }

    try {
      const compressedBase64s = await Promise.all(
        files.map(file => compressImage(file))
      );
      setPassportPhotos(prev => [...prev, ...compressedBase64s]);
    } catch (err) {
      console.error(err);
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Fehler beim Komprimieren des Reisepasses.' : 'Klaida suspaudžiant pasą.'
      });
    }
  };

  // Helper to determine supported media recorder mime types
  const getSupportedMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/quicktime'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Background video compression function (Option 4 + Option 3)
  const compressVideoFile = (file: File, onProgress: (pct: number) => void): Promise<File> => {
    return new Promise((resolve, reject) => {
      const isTestEnv = typeof window !== 'undefined' && 
        (window.navigator.userAgent.includes('Node.js') || window.navigator.userAgent.includes('jsdom') || process.env.NODE_ENV === 'test');
      
      if (isTestEnv || typeof window === 'undefined') {
        return resolve(file);
      }

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(file);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let animId: number;
      let progressInterval: NodeJS.Timeout;
      let isCleanedUp = false;

      const cleanupResources = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        clearInterval(progressInterval);
        cancelAnimationFrame(animId);
        window.URL.revokeObjectURL(video.src);
      };

      video.onloadedmetadata = async () => {
        let width = video.videoWidth || 640;
        let height = video.videoHeight || 480;
        const maxDim = 1280;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        
        let audioTrack: MediaStreamTrack | null = null;
        let audioContext: AudioContext | null = null;
        let audioDest: MediaStreamAudioDestinationNode | null = null;
        let audioSource: MediaElementAudioSourceNode | null = null;
        
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioContext = new AudioContextClass();
            audioDest = audioContext.createMediaStreamDestination();
            audioSource = audioContext.createMediaElementSource(video);
            audioSource.connect(audioDest);
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
            }
            if (audioDest.stream.getAudioTracks().length > 0) {
              audioTrack = audioDest.stream.getAudioTracks()[0];
            }
          }
        } catch (err) {
          console.warn("AudioContext capture failed, proceeding video-only:", err);
        }
        
        // Capture canvas stream at 24fps
        let canvasStream: MediaStream;
        try {
          canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(24) : (canvas as any).mozCaptureStream(24);
        } catch (e) {
          cleanupResources();
          return resolve(file); // fallback to original file if canvas.captureStream is not supported
        }

        const videoTrack = canvasStream.getVideoTracks()[0];
        const tracks: MediaStreamTrack[] = [videoTrack];
        if (audioTrack) {
          tracks.push(audioTrack);
        }
        const combinedStream = new MediaStream(tracks);
        
        const mimeType = getSupportedMimeType() || 'video/webm';
        
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(combinedStream, {
            mimeType: mimeType,
            videoBitsPerSecond: 1200000
          });
        } catch (e) {
          cleanupResources();
          return resolve(file); // fallback to original file if MediaRecorder fails
        }
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          cleanupResources();
          combinedStream.getTracks().forEach(t => t.stop());
          canvasStream.getTracks().forEach(t => t.stop());
          if (audioDest) audioDest.stream.getTracks().forEach(t => t.stop());
          if (audioContext) audioContext.close().catch(() => {});
          
          const blob = new Blob(chunks, { type: mimeType });
          const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('quicktime') ? 'mov' : 'webm';
          const compressedFile = new File([blob], `compressed_${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.${ext}`, {
            type: mimeType
          });
          resolve(compressedFile);
        };
        
        progressInterval = setInterval(() => {
          if (video.duration) {
            const progress = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
            onProgress(progress);
          }
        }, 250);
        
        const drawFrame = () => {
          if (!video.paused && !video.ended) {
            ctx?.drawImage(video, 0, 0, width, height);
            animId = requestAnimationFrame(drawFrame);
          }
        };
        
        video.onplay = () => {
          drawFrame();
        };
        
        video.onended = () => {
          onProgress(100);
          recorder.stop();
        };
        
        video.onerror = (err) => {
          cleanupResources();
          recorder.stop();
          reject(new Error("Video playback error during compression"));
        };
        
        recorder.start();
        video.play().catch(err => {
          cleanupResources();
          resolve(file); // fallback to original file on play failure
        });
      };
      
      video.onerror = (err) => {
        cleanupResources();
        resolve(file); // fallback to original file
      };
    });
  };

  const processAndUploadVideo = async (file: File) => {
    // If offline, show error and abort upload
    if (!isOnline) {
      setAlertMessage({
        type: 'error',
        text: lang === 'DE'
          ? 'Video-Upload erfordert eine stabile Internetverbindung. Bitte im Online-Bereich hochladen.'
          : 'Vaizdo įrašų įkėlimui reikalingas stabilus interneto ryšys. Prašome įkelti prisijungus prie interneto.'
      });
      return;
    }

    if (videos.length >= 5) {
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Maximal 5 Videos pro Tier erlaubt.' : 'Leidžiama įkelti ne daugiau kaip 5 vaizdo įrašus.'
      });
      return;
    }

    if (!file.type.startsWith('video/')) {
      setAlertMessage({ 
        type: 'error', 
        text: lang === 'DE'
          ? `Huch! Die Datei "${file.name}" ist kein Video. Bitte wähle nur Videodateien (z.B. MP4).`
          : `Oi! Failas „${file.name}“ nėra vaizdo įrašas. Prašome pasirinkti tik vaizdo failus (pvz., MP4).`
      });
      return;
    }

    // Check size limit: 200 MB
    if (file.size > 200 * 1024 * 1024) {
      setAlertMessage({ 
        type: 'error', 
        text: lang === 'DE'
          ? `Das Video "${file.name}" ist mit ${(file.size / (1024 * 1024)).toFixed(1)} MB zu groß. Bitte wähle ein Video unter 200 MB.`
          : `Vaizdo įrašas „${file.name}“ užima ${(file.size / (1024 * 1024)).toFixed(1)} MB ir yra per didelis. Prašome pasirinkti vaizdo įrašą iki 200 MB.`
      });
      return;
    }

    const duration = await checkVideoDuration(file);
    if (duration > 300) {
      setAlertMessage({ 
        type: 'error', 
        text: lang === 'DE'
          ? `Das Video "${file.name}" überschreitet die maximale Länge von 5 Minuten (${Math.round(duration)} Sek).`
          : `Vaizdo įrašas „${file.name}“ viršija maksimalią 5 minučių trukmę (${Math.round(duration)} sek).`
      });
      return;
    }

    // Check if background compression is needed (if file size > 15MB)
    let finalFile = file;
    if (file.size > 15 * 1024 * 1024) {
      try {
        setCompressingVideoName(file.name);
        setCompressionProgress(0);
        finalFile = await compressVideoFile(file, (progress) => {
          setCompressionProgress(progress);
        });
      } catch (err) {
        console.warn("Background video compression failed, uploading original:", err);
      } finally {
        setCompressingVideoName(null);
      }
    }

    // Add temporary uploading item
    const finalName = finalFile.name;
    setVideos(prev => [...prev, { name: finalName, isUploading: isOnline, isSynced: false }]);

    let uploadedUrl: string | null = null;
    let uploadSuccess = false;

    if (isOnline) {
      try {
        uploadedUrl = await uploadMediaBlob('videos', finalName, finalFile);
        if (uploadedUrl) {
          uploadSuccess = true;
          // Update state with synced URL
          setVideos(prev => prev.map(v => 
            v.name === finalName && !v.isSynced ? { name: finalName, url: uploadedUrl!, isSynced: true, isUploading: false } : v
          ));
        }
      } catch (err) {
        console.error('Immediate video upload failed, falling back to local OPFS storage:', err);
      }
    }

    // Fallback local storage
    if (!uploadSuccess) {
      const opfsOk = isOpfsSupported();
      if (opfsOk) {
        try {
          const opfsKey = `video_${Date.now()}_${finalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          await saveToOpfs(opfsKey, finalFile);
          setVideos(prev => prev.map(v => 
            v.name === finalName && v.isUploading ? { name: finalName, opfsKey, isSynced: false, isUploading: false } : v
          ));
        } catch (opfsErr) {
          console.error('Failed to save to OPFS, falling back to IndexedDB blob:', opfsErr);
          setVideos(prev => prev.map(v => 
            v.name === finalName && v.isUploading ? { name: finalName, blob: finalFile, isSynced: false, isUploading: false } : v
          ));
        }
      } else {
        setVideos(prev => prev.map(v => 
          v.name === finalName && v.isUploading ? { name: finalName, blob: finalFile, isSynced: false, isUploading: false } : v
        ));
      }
    }
  };

  // Upload Videos (max 5, attempts immediate upload if online, fallback to OPFS/IDB)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setAlertMessage(null);
    const files = Array.from(e.target.files);

    if (videos.length + files.length > 5) {
      setAlertMessage({ type: 'error', text: 'Maximal 5 Videos pro Tier erlaubt.' });
      return;
    }

    // Process files sequentially to avoid high concurrent resource usage
    for (const file of files) {
      await processAndUploadVideo(file);
    }
  };

  const deletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const deletePassportPhoto = (index: number) => {
    setPassportPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const deleteVideo = async (index: number) => {
    const videoToDelete = videos[index];
    if (videoToDelete && videoToDelete.opfsKey) {
      try {
        await removeFromOpfs(videoToDelete.opfsKey);
      } catch (err) {
        console.error('Failed to delete OPFS video entry:', err);
      }
    }
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  // Audio Recording helpers
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async (indexToAppend: number | null = null) => {
    if (audioItems.length >= 10 && indexToAppend === null) {
      alert(lang === 'DE' ? 'Du kannst maximal 10 Audio-Aufnahmen pro Schützling speichern.' : 'Vienam gyvūnui galite išsaugoti ne daugiau kaip 10 balso pastabų.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const newBlob = new Blob(chunks, { type: 'audio/webm' });
        
        let finalBlob = newBlob;
        if (indexToAppend !== null) {
          const existingItem = audioItems[indexToAppend];
          try {
            const res = await fetch(existingItem.url);
            const existingBlob = await res.blob();
            finalBlob = await appendAudioBlobs(existingBlob, newBlob);
          } catch (e) {
            console.error('Failed to append audio blobs:', e);
            alert(lang === 'DE' ? 'Das Audio konnte nicht fortgesetzt werden. Es wurde stattdessen ein neues Audio erstellt.' : 'Nepavyko pratęsti garso įrašo. Vietoj to buvo sukurtas naujas įrašas.');
          }
        }

        const reader = new FileReader();
        reader.readAsDataURL(finalBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (indexToAppend !== null) {
            setAudioItems(prev => prev.map((item, idx) => idx === indexToAppend ? { url: base64data, isSynced: false } : item));
          } else {
            setAudioItems(prev => [...prev, { url: base64data, isSynced: false }]);
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      setRecordingIndex(indexToAppend);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert(lang === 'DE' ? 'Zugriff auf das Mikrofon verweigert oder nicht unterstützt.' : 'Prieiga prie mikrofono atmesta arba nepalaikoma.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const deleteAudio = (index: number) => {
    setAudioItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAnimal = async () => {
    if (!window.confirm(lang === 'DE' 
      ? 'Möchten Sie dieses Tierprofil wirklich endgültig löschen? Dieser Schritt kann nicht rückgängig gemacht werden.' 
      : 'Ar tikrai norite visam laikui ištrinti šį gyvūno profilį? Šio veiksmo atšaukti nebus įmanoma.'
    )) {
      return;
    }

    try {
      // 1. Delete locally from Dexie
      if (catId) {
        await db.animals.delete(catId);
        
        // Also delete local OPFS files if any
        if (existingAnimal?.local_videos) {
          for (const lv of existingAnimal.local_videos) {
            if (lv.opfsKey) {
              await removeFromOpfs(lv.opfsKey).catch((e) => console.warn(e));
            }
          }
        }

        await logger.info('AnimalEdit', `Tierprofil gelöscht: ${name} (ID: ${catId})`);
      }

      // 2. Delete from Supabase if online and configured
      if (isOnline && supabase && catId) {
        const { error } = await supabase
          .from('animals')
          .delete()
          .eq('id', catId);
        if (error) {
          console.error('Failed to delete animal from Supabase:', error);
          await logger.error('AnimalEdit', `Supabase Löschfehler für Tier ID ${catId}:`, error);
        } else {
          await logger.info('AnimalEdit', `Tierprofil aus Supabase gelöscht: ID ${catId}`);
        }
      }

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      await logger.error('AnimalEdit', `Fehler beim Löschen des Tiers: ${name}`, err);
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Fehler beim Löschen des Tierprofils.' : 'Klaida trinant gyvūno profilį.'
      });
    }
  };

  // Submit updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    if (!name.trim()) {
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Bitte gib einen Namen für das Tier ein.' : 'Prašome įvesti gyvūno vardą.'
      });
      setActiveSection('basic');
      return;
    }

    if (!staffName.trim()) {
      setAlertMessage({
        type: 'error',
        text: lang === 'DE'
          ? 'Bitte gib deinen Namen oder dein Kürzel an, damit wir wissen, wer die Änderung vorgenommen hat.'
          : 'Prašome įvesti savo vardą arba inicialus, kad žinotume, kas atliko pakeitimą.'
      });
      return;
    }

    if (!existingAnimal) {
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Fehler: Zu bearbeitendes Tier wurde nicht gefunden.' : 'Klaida: nerastas redaguojamas gyvūnas.'
      });
      return;
    }

    try {
      const syncedVideos = videos.filter(v => v.isSynced && v.url).map(v => v.url as string);
      const localVideos = videos.filter(v => !v.isSynced).map(v => ({ name: v.name, blob: v.blob, opfsKey: v.opfsKey }));

      const animalData = {
        ...existingAnimal,
        name,
        gender,
        status_aktuell: statusAktuell,
        age_years: ageMode === 'exact' ? ageExact : ageYears,
        age_mode: ageMode,
        age_min: ageMode === 'range' ? ageMin : undefined,
        age_max: ageMode === 'range' ? ageMax : undefined,
        birth_year: ageMode === 'birthyear' ? birthYear : undefined,
        birth_month: ageMode === 'birthyear' ? birthMonth : undefined,
        birth_day: ageMode === 'birthyear' ? birthDay : undefined,
        shelter_admission_date: `${shelterYear}-${shelterMonth}`,
        reason_for_shelter: reasonForShelter,
        restrictions,
        notes_miscellaneous: notesMiscellaneous,
        is_published: isPublished,
        is_emergency: isEmergency,
        
        slow_integration: slowIntegration,
        partner_needed: partnerNeeded,
        no_single_animal: noSingleAnimal,
        needs_outdoor: needsOutdoor,
        indoor_only: indoorOnly,
        secured_balcony: securedBalcony,
        for_beginners: forBeginners,
        for_experienced: forExperienced,
        quiet_home: quietHome,
        patient_people: patientPeople,
        needs_attention: needsAttention,
        no_small_children: noSmallChildren,
        suitable_seniors: suitableSeniors,
        suitable_families: suitableFamilies,

        not_castrated: notCastrated,
        has_cat_plague_vaccine: hasCatPlagueVaccine,
        vaccination_status_unknown: vaccinationStatusUnknown,
        fiv_negative: fivNegative,
        felv_negative: felvNegative,
        fiv_positive: fivPositive,
        felv_positive: felvPositive,
        fip_positive: fipPositive,
        flea_mite_treatment: fleaMiteTreatment,
        handicaps: handicaps.trim() || undefined,

        trait_trusting: traitTrusting,
        trait_people_oriented: traitPeopleOriented,
        trait_quiet: traitQuiet,
        trait_active: traitActive,
        trait_needs_time: traitNeedsTime,
        trait_allows_touch: traitAllowsTouch,
        trait_allows_lift: traitAllowsLift,
        trait_allows_brush: traitAllowsBrush,
        trait_shows_limits: traitShowsLimits,
        trait_seeks_cats: traitSeeksCats,
        trait_insecure_cats: traitInsecureCats,
        trait_dominant: traitDominant,
        trait_submissive: traitSubmissive,
        trait_sensitive_noise: traitSensitiveNoise,
        trait_litter_box: traitLitterBox,
        trait_compat_cats: traitCompatCats,
        trait_compat_dogs: traitCompatDogs,
        trait_compat_children: traitCompatChildren,
        
        is_castrated: isCastrated,
        is_chipped: isChipped,
        has_rabies_vaccine: hasRabiesVaccine,
        has_cat_flu_vaccine: hasCatFluVaccine,
        is_dewormed: isDewormed,
        has_eu_passport: hasEuPassport,
        
        compat_cats: compatCats,
        compat_dogs: compatDogs,
        compat_children: compatChildren,
        trait_curious: traitCurious,
        trait_playful: traitPlayful,
        trait_aggressive: traitAggressive,
        trait_fearful: traitFearful,
        trait_cuddly: traitCuddly,

        media_urls: photos,
        passport_urls: passportPhotos,
        video_urls: syncedVideos,
        room_name: roomName.trim() || undefined,
        cage_name: cageName.trim() || undefined,
        audio_draft_url: audioItems.length > 0 ? JSON.stringify(audioItems.map(item => item.url)) : undefined,
        audio_urls: audioItems.filter(item => item.isSynced).map(item => item.url),

        // Update local unsynced binary files
        local_photos: [
          ...(existingAnimal.local_photos || []).filter(p => photos.includes(p.name)),
          ...photos.filter(p => p.startsWith('data:') || p.startsWith('blob:')).map((base64, index) => ({
            name: `photo_new_${Date.now()}_${index}.jpg`,
            blob: base64ToBlob(base64)
          }))
        ],
        local_passports: [
          ...(existingAnimal.local_passports || []).filter(p => passportPhotos.includes(p.name)),
          ...passportPhotos.filter(p => p.startsWith('data:') || p.startsWith('blob:')).map((base64, index) => ({
            name: `passport_new_${Date.now()}_${index}.jpg`,
            blob: base64ToBlob(base64)
          }))
        ],
        local_videos: localVideos,
        local_audios: audioItems.filter(item => !item.isSynced).map((item, index) => ({
          name: `audio_new_${Date.now()}_${index}.wav`,
          blob: base64ToBlob(item.url)
        })),

        sync_pending: 1,
        media_pending: (photos.some(p => p.startsWith('data:') || p.startsWith('blob:')) || passportPhotos.some(p => p.startsWith('data:') || p.startsWith('blob:')) || localVideos.length > 0 || audioItems.some(item => !item.isSynced)) ? 1 : 0,
        updated_at: new Date().toISOString()
      };

      if (existingAnimal && catId) {
        try {
          const snapshotData = {
            animal_id: catId,
            version_data: JSON.stringify(existingAnimal),
            edited_by: staffName.trim() || 'Mitarbeiter',
            created_at: new Date().toISOString(),
            sync_pending: 1,
            updated_at: new Date().toISOString()
          };
          await db.animalRevisions.add(snapshotData);
          await pruneRevisions(catId);
        } catch (e) {
          console.error('Failed to save animal revision snapshot:', e);
        }
      }

      await db.animals.put(animalData);
      await logger.info('AnimalEdit', `Profil aktualisiert für: ${animalData.name} (${animalData.type})`);
      
      // Trigger cloud synchronization
      syncWithCloud().catch((err) => {
        console.error('Background sync failed after animal edit:', err);
      });
      
      setSaveSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err) {
      console.error(err);
      await logger.error('AnimalEdit', `Fehler beim Editieren des Tiers: ${name}`, err);
      setAlertMessage({
        type: 'error',
        text: lang === 'DE' ? 'Fehler beim Speichern in der lokalen Datenbank.' : 'Klaida išsaugant vietinėje duomenų bazėje.'
      });
    }
  };

  const HelpButton = ({ section }: { section: string }) => (
    <button
      type="button"
      onClick={() => setHelpKey(section)}
      className="p-0.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0 align-middle ml-1"
      title="Hilfe anzeigen"
    >
      <HelpCircle className="w-3.5 h-3.5" />
    </button>
  );

  // Helper toggle UI
  const ToggleSelect = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: boolean; 
    onChange: (v: boolean) => void 
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-4 py-3 rounded-xl font-bold text-xs border transition-all text-center flex items-center justify-center h-12 select-none ${
        value 
          ? 'bg-brandpink-600 border-brandpink-600 text-white shadow-sm' 
          : 'bg-white border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50'
      }`}
    >
      {label}
    </button>
  );

  // Triple status chip (JA / NEIN / unbekannt)
  const TripleSelect = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: 'JA' | 'NEIN' | 'unbekannt'; 
    onChange: (v: 'JA' | 'NEIN' | 'unbekannt') => void 
  }) => (
    <div className="flex flex-col space-y-1 bg-white border border-stone-200 p-3 rounded-xl shadow-sm">
      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">{label}</span>
      <div className="grid grid-cols-3 gap-1">
        {(['JA', 'NEIN', 'unbekannt'] as const).map((opt) => {
          const style = opt === value 
            ? 'bg-brandpink-600 border-brandpink-600 text-white shadow-sm'
            : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-800';
          
          const text = opt === 'unbekannt' ? 'Unbekannt' : opt;
          
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`py-2 rounded-lg font-bold text-[10px] border transition-all select-none ${style}`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-stone-50 items-center justify-center">
        <span className="w-8 h-8 border-4 border-brandpink-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!existingAnimal) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
        <h2 className="text-lg font-bold text-stone-850">Katze nicht gefunden</h2>
        <p className="text-xs text-stone-500 max-w-xs">
          Das Tier mit ID <strong>{catId}</strong> existiert leider nicht in der lokalen Datenbank.
        </p>
        <Link href="/dashboard" className="px-5 py-2.5 bg-brandpink-600 text-white text-xs font-bold rounded-xl shadow-md">
          Zurück zum Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="px-4 py-4 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <Link 
            href="/dashboard"
            className="p-1 rounded bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-stone-850">
              {lang === 'DE' ? 'Profil bearbeiten' : 'Redaguoti profilį'}
            </h1>
            <p className="text-[9px] text-stone-500 font-medium">{name || 'Katze'}</p>
          </div>
        </div>

        {/* Connection status and language selector */}
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <button 
            type="button"
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

          {isOnline ? (
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-emerald-700 text-[10px] font-bold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-amber-700 text-[10px] font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline-Modus</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Form content */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24">
        
        {saveSuccess && (
          <div className="mb-4 bg-emerald-50 border border-emerald-250 p-4 rounded-xl shadow-sm text-center space-y-2 animate-fade-in">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-xs font-bold text-emerald-800">Änderungen gespeichert!</h3>
            <p className="text-[10px] text-emerald-600 font-medium">Das Profil wurde erfolgreich aktualisiert und wird synchronisiert.</p>
          </div>
        )}

        {alertMessage && (
          <div className={`mb-4 border p-3 rounded-xl text-xs font-semibold flex items-start space-x-2 ${
            alertMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{alertMessage.text}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="grid grid-cols-5 gap-1 bg-stone-200/60 p-1 rounded-xl border border-stone-300/80 mb-5">
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'basic' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            {lang === 'DE' ? 'Eckdaten' : 'Pagrindiniai duomenys'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('medical')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'medical' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            {lang === 'DE' ? 'Gesundheit' : 'Sveikata'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('behavior')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'behavior' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            {lang === 'DE' ? 'Charakter / Verhalten' : 'Charakteris / Elgsena'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('media')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'media' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            {lang === 'DE' ? 'Medien' : 'Medija'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('revisions')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'revisions' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            {lang === 'DE' ? 'Verlauf' : 'Istorija'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. BASIC INFORMATION */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.name}<HelpButton section="name" /></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ui.namePlaceholder}
                  className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 placeholder-stone-400 text-xs font-semibold shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.room}<HelpButton section="roomCage" /></label>
                  <input 
                    type="text" 
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={ui.roomPlaceholder}
                    className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 placeholder-stone-400 text-xs font-semibold shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.cage}<HelpButton section="roomCage" /></label>
                  <input 
                    type="text" 
                    value={cageName}
                    onChange={(e) => setCageName(e.target.value)}
                    placeholder={ui.cagePlaceholder}
                    className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 placeholder-stone-400 text-xs font-semibold shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.gender}<HelpButton section="gender" /></label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Weiblich' | 'Männlich')}
                    className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 text-xs font-semibold shadow-xs h-11"
                  >
                    <option value="Weiblich">{ui.genderFemale}</option>
                    <option value="Männlich">{ui.genderMale}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.status}<HelpButton section="status" /></label>
                  <select 
                    value={statusAktuell}
                    onChange={(e) => setStatusAktuell(e.target.value as 'zu vermitteln' | 'reserviert' | 'vermittelt')}
                    className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 text-xs font-semibold shadow-xs h-11"
                  >
                    <option value="zu vermitteln">{ui.statusAvailable}</option>
                    <option value="reserviert">{ui.statusReserved}</option>
                    <option value="vermittelt">{ui.statusAdopted}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.ageLabel}<HelpButton section="age" /></span>
                  <div className="grid grid-cols-3 gap-1 bg-stone-200/50 p-0.5 rounded-lg border border-stone-300">
                    {(['range', 'exact', 'birthyear'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAgeMode(mode)}
                        className={`py-1.5 rounded text-[8px] font-bold uppercase transition-all select-none ${
                          ageMode === mode 
                            ? 'bg-white text-stone-850 shadow-xs' 
                            : 'text-stone-500 hover:text-stone-850'
                        }`}
                      >
                        {mode === 'range' ? ui.ageModeRange : mode === 'exact' ? ui.ageModeExact : ui.ageModeYear}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Age Mode Selectors */}
              <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl shadow-xs">
                {ageMode === 'range' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase">
                      <span>{ui.ageEstimate}</span>
                      <span className="text-brandpink-600">{ageMin} - {ageMax} {ui.ageYearsUnit}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 flex flex-col space-y-1">
                        <span className="text-[9px] font-semibold text-stone-400">{ui.ageMin}</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="20" 
                          value={ageMin} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setAgeMin(val);
                            if (val > ageMax) setAgeMax(val);
                          }} 
                          className="w-full accent-brandpink-600 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 flex flex-col space-y-1">
                        <span className="text-[9px] font-semibold text-stone-400">{ui.ageMax}</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="20" 
                          value={ageMax} 
                          onChange={(e) => setAgeMax(Math.max(parseInt(e.target.value), ageMin))} 
                          className="w-full accent-brandpink-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {ageMode === 'exact' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase">
                      <span>{ui.ageExactLabel}</span>
                      <span className="text-brandpink-600">{ageExact} {ui.ageYearsUnit}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      value={ageExact} 
                      onChange={(e) => setAgeExact(parseInt(e.target.value))} 
                      className="w-full accent-brandpink-600 cursor-pointer"
                    />
                  </div>
                )}

                {ageMode === 'birthyear' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">{ui.birthYear}</label>
                      <input 
                        type="number" 
                        min="2000" 
                        max="2026" 
                        value={birthYear}
                        onChange={(e) => setBirthYear(parseInt(e.target.value) || 2026)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-stone-900 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">{ui.birthMonth}</label>
                      <select
                        value={birthMonth || ''}
                        onChange={(e) => setBirthMonth(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-2 py-2 bg-white border border-stone-300 rounded-lg text-stone-900 text-xs font-semibold focus:outline-none h-[34px]"
                      >
                        <option value="">{ui.birthMonthPlaceholder}</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">{ui.birthDay}</label>
                      <select
                        value={birthDay || ''}
                        onChange={(e) => setBirthDay(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-2 py-2 bg-white border border-stone-300 rounded-lg text-stone-900 text-xs font-semibold focus:outline-none h-[34px]"
                      >
                        <option value="">{ui.birthDayPlaceholder}</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Admission Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.admissionDate}<HelpButton section="arrivalDate" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={shelterMonth}
                    onChange={(e) => setShelterMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 text-xs font-semibold shadow-xs h-11"
                  >
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={shelterYear}
                    onChange={(e) => setShelterYear(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 text-xs font-semibold shadow-xs h-11"
                  >
                    {Array.from({ length: 15 }, (_, i) => (2026 - i).toString()).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.reasonForShelter}<HelpButton section="reason" /></label>
                <textarea 
                  value={reasonForShelter}
                  onChange={(e) => setReasonForShelter(e.target.value)}
                  placeholder={ui.reasonPlaceholder}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 placeholder-stone-400 text-xs font-semibold shadow-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.restrictions}<HelpButton section="restrictions" /></label>
                <input 
                  type="text" 
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder={ui.restrictionsPlaceholder}
                  className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 placeholder-stone-400 text-xs font-semibold shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">{ui.misc}<HelpButton section="misc" /></label>
                <input 
                  type="text" 
                  value={notesMiscellaneous}
                  onChange={(e) => setNotesMiscellaneous(e.target.value)}
                  placeholder={ui.miscPlaceholder}
                  className="w-full px-4 py-3 bg-white border border-stone-350 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 placeholder-stone-400 text-xs font-semibold shadow-xs"
                />
              </div>

              {/* Vermittlung / Haltung Grid */}
              <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">
                  {lang === 'DE' ? 'Vermittlung / Haltung' : 'Dovanojimas / Laikymo sąlygos'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={slowIntegration}
                      onChange={(e) => setSlowIntegration(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'langsame Zusammenführung' : 'lėtas supažindinimas'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={partnerNeeded}
                      onChange={(e) => setPartnerNeeded(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Vermittlung nur mit Partnertier' : 'dovanojama tik su kitu gyvūnu'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noSingleAnimal}
                      onChange={(e) => setNoSingleAnimal(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Keine Einzelhaltung' : 'negalima laikyti vieno'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={needsOutdoor}
                      onChange={(e) => setNeedsOutdoor(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'braucht Freigang' : 'reikia galimybės išeiti į lauką'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={indoorOnly}
                      onChange={(e) => setIndoorOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'nur Wohnungshaltung' : 'tik laikymui bute/namuose'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={securedBalcony}
                      onChange={(e) => setSecuredBalcony(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'gesicherter Balkon/Terrasse' : 'reikalingas apsaugotas balkonas/terasa'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={forBeginners}
                      onChange={(e) => setForBeginners(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'für Anfänger geeignet' : 'tinka pradedantiesiems'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={forExperienced}
                      onChange={(e) => setForExperienced(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'für katzenerfahrene Menschen' : 'tik turintiems kačių auginimo patirties'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={quietHome}
                      onChange={(e) => setQuietHome(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'ruhiges Zuhause' : 'ramūs namai'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={patientPeople}
                      onChange={(e) => setPatientPeople(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'geduldige Menschen' : 'kantrūs žmonės'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={needsAttention}
                      onChange={(e) => setNeedsAttention(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'viel Aufmerksamkeit' : 'reikia daug dėmesio'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noSmallChildren}
                      onChange={(e) => setNoSmallChildren(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'keine kleinen Kinder' : 'be mažų vaikų'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={suitableSeniors}
                      onChange={(e) => setSuitableSeniors(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Seniorenhaushalt geeignet' : 'tinka senjorų namams'}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={suitableFamilies}
                      onChange={(e) => setSuitableFamilies(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Familien geeignet' : 'tinka šeimoms'}</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-3 bg-white border border-stone-200 p-3 rounded-xl shadow-xs select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4.5 h-4.5 accent-brandpink-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-700 block flex items-center">{ui.publishLabel}<HelpButton section="publish" /></span>
                    <span className="text-[8px] text-stone-450 font-medium">{ui.publishDesc}</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 bg-white border border-stone-200 p-3 rounded-xl shadow-xs select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="w-4.5 h-4.5 accent-brandpink-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-700 block flex items-center">{ui.emergencyLabel}<HelpButton section="emergency" /></span>
                    <span className="text-[8px] text-stone-450 font-medium">{ui.emergencyDesc}</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 2. GESUNDHEIT */}
          {activeSection === 'medical' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center">
                {lang === 'DE' ? 'Gesundheit' : 'Sveikata'}
                <HelpButton section="medical" />
              </h3>

              <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* EU-Heimtierausweis */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasEuPassport}
                      onChange={(e) => setHasEuPassport(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'EU-Heimtierausweis' : 'ES augintinio pasas'}</span>
                  </label>

                  {/* gechipt */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChipped}
                      onChange={(e) => setIsChipped(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'gechipt' : 'paženklintas mikroschema (čipu)'}</span>
                  </label>

                  {/* kastriert */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isCastrated}
                      onChange={(e) => {
                        setIsCastrated(e.target.checked);
                        if (e.target.checked) setNotCastrated(false);
                      }}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'kastriert' : 'kastruotas / sterilizuota'}</span>
                  </label>

                  {/* nicht kastriert */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notCastrated}
                      onChange={(e) => {
                        setNotCastrated(e.target.checked);
                        if (e.target.checked) setIsCastrated(false);
                      }}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'nicht kastriert' : 'nekastruotas / nesterilizuota'}</span>
                  </label>

                  {/* Tollwutimpfung */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasRabiesVaccine}
                      onChange={(e) => setHasRabiesVaccine(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Tollwutimpfung' : 'skiepas nuo pasiutligės'}</span>
                  </label>

                  {/* Katzenseuche-Impfung */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasCatPlagueVaccine}
                      onChange={(e) => setHasCatPlagueVaccine(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Katzenseuche-Impfung' : 'skiepas nuo kačių maro'}</span>
                  </label>

                  {/* Katzenschnupfen-Impfung */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasCatFluVaccine}
                      onChange={(e) => setHasCatFluVaccine(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Katzenschnupfen-Impfung' : 'skiepas nuo kačių slogos'}</span>
                  </label>

                  {/* Impfstatus unbekannt */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={vaccinationStatusUnknown}
                      onChange={(e) => setVaccinationStatusUnknown(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Impfstatus unbekannt' : 'skiepų statusas nežinomas'}</span>
                  </label>

                  {/* FIV-Test negativ */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={fivNegative}
                      onChange={(e) => {
                        setFivNegative(e.target.checked);
                        if (e.target.checked) setFivPositive(false);
                      }}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'FIV-Test negativ' : 'FIV testas neigiamas'}</span>
                  </label>

                  {/* FeLV-Test negativ */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={felvNegative}
                      onChange={(e) => {
                        setFelvNegative(e.target.checked);
                        if (e.target.checked) setFelvPositive(false);
                      }}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'FeLV-Test negativ' : 'FeLV testas neigiamas'}</span>
                  </label>

                  {/* FIV positiv */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={fivPositive}
                      onChange={(e) => {
                        setFivPositive(e.target.checked);
                        if (e.target.checked) setFivNegative(false);
                      }}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'FIV positiv' : 'FIV teigiamas'}</span>
                  </label>

                  {/* FeLV positiv */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={felvPositive}
                      onChange={(e) => {
                        setFelvPositive(e.target.checked);
                        if (e.target.checked) setFelvNegative(false);
                      }}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'FeLV positiv' : 'FeLV teigiamas'}</span>
                  </label>

                  {/* FIP positiv */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={fipPositive}
                      onChange={(e) => setFipPositive(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'FIP positiv' : 'FIP teigiamas'}</span>
                  </label>

                  {/* Entwurmung */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDewormed}
                      onChange={(e) => setIsDewormed(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Entwurmung' : 'nukirmintas'}</span>
                  </label>

                  {/* Floh-/Milbenbehandlung */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={fleaMiteTreatment}
                      onChange={(e) => setFleaMiteTreatment(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'Floh-/Milbenbehandlung' : 'gydymas nuo parazitų (blusų/erkių)'}</span>
                  </label>
                </div>

                {/* Handicaps Field */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    {lang === 'DE' ? 'Handicaps (z.B. Behinderungen, Blindheit)' : 'Fiziniai trūkumai / negalios'}
                  </label>
                  <textarea
                    placeholder={lang === 'DE' ? 'Details zu eventuellen Handicaps...' : 'Informacija apie fizinius trūkumus...'}
                    value={handicaps}
                    onChange={(e) => setHandicaps(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm h-20 focus:ring-1 focus:ring-brandpink-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. CHARAKTER / VERHALTEN */}
          {activeSection === 'behavior' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center">
                {lang === 'DE' ? 'Charakter / Verhalten' : 'Charakteris / Elgsena'}
                <HelpButton section="behavior" />
              </h3>

              <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* verschmust */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitCuddly === 'JA'}
                      onChange={(e) => setTraitCuddly(e.target.checked ? 'JA' : 'NEIN')}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'verschmust' : 'meilus (-i)'}</span>
                  </label>

                  {/* zutraulich */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitTrusting}
                      onChange={(e) => setTraitTrusting(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'zutraulich' : 'patiklus (-i)'}</span>
                  </label>

                  {/* sehr menschenbezogen */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitPeopleOriented}
                      onChange={(e) => setTraitPeopleOriented(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'sehr menschenbezogen' : 'labai orientuotas (-a) į žmones'}</span>
                  </label>

                  {/* verspielt */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitPlayful === 'JA'}
                      onChange={(e) => setTraitPlayful(e.target.checked ? 'JA' : 'NEIN')}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'verspielt' : 'žaismingas (-a)'}</span>
                  </label>

                  {/* ruhig */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitQuiet}
                      onChange={(e) => setTraitQuiet(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'ruhig' : 'ramus (-i)'}</span>
                  </label>

                  {/* aktiv */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitActive}
                      onChange={(e) => setTraitActive(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'aktiv' : 'aktyvus (-i)'}</span>
                  </label>

                  {/* neugierig */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitCurious === 'JA'}
                      onChange={(e) => setTraitCurious(e.target.checked ? 'JA' : 'NEIN')}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'neugierig' : 'smalsus (-i)'}</span>
                  </label>

                  {/* ängstlich / unsicher */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitFearful === 'JA'}
                      onChange={(e) => setTraitFearful(e.target.checked ? 'JA' : 'NEIN')}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'ängstlich / unsicher' : 'baimingas (-a) / nesaugus (-i)'}</span>
                  </label>

                  {/* braucht Zeit zum Vertrauen */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitNeedsTime}
                      onChange={(e) => setTraitNeedsTime(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'braucht Zeit zum Vertrauen' : 'reikia laiko pasitikėjimui įgyti'}</span>
                  </label>

                  {/* lässt sich anfassen */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitAllowsTouch}
                      onChange={(e) => setTraitAllowsTouch(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'lässt sich anfassen' : 'leidžiasi glostomas (-a)'}</span>
                  </label>

                  {/* lässt sich hochheben */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitAllowsLift}
                      onChange={(e) => setTraitAllowsLift(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'lässt sich hochheben' : 'leidžiasi pakeliamas (-a)'}</span>
                  </label>

                  {/* lässt sich bürsten */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitAllowsBrush}
                      onChange={(e) => setTraitAllowsBrush(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'lässt sich bürsten' : 'leidžiasi šukuojamas (-a)'}</span>
                  </label>

                  {/* zeigt Grenzen deutlich */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitShowsLimits}
                      onChange={(e) => setTraitShowsLimits(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'zeigt Grenzen deutlich' : 'aiškiai rodo savo ribas'}</span>
                  </label>

                  {/* sucht Kontakt zu anderen Katzen */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitSeeksCats}
                      onChange={(e) => setTraitSeeksCats(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'sucht Kontakt zu anderen Katzen' : 'ieško kontakto su kitomis katėmis'}</span>
                  </label>

                  {/* unsicher mit anderen Katzen */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitInsecureCats}
                      onChange={(e) => setTraitInsecureCats(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'unsicher mit anderen Katzen' : 'nesaugus (-i) su kitomis katėmis'}</span>
                  </label>

                  {/* verträglich mit anderen Katzen */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitCompatCats}
                      onChange={(e) => setTraitCompatCats(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'verträglich mit anderen Katzen' : 'sutaria su kitomis katėmis'}</span>
                  </label>

                  {/* verträglich mit Hunden */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitCompatDogs}
                      onChange={(e) => setTraitCompatDogs(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'verträglich mit Hunden' : 'sutaria su šunimis'}</span>
                  </label>

                  {/* verträglich mit Kindern */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitCompatChildren}
                      onChange={(e) => setTraitCompatChildren(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'verträglich mit Kindern' : 'sutaria su vaikais'}</span>
                  </label>

                  {/* dominant */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitDominant}
                      onChange={(e) => setTraitDominant(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'dominant' : 'dominantinis (-ė)'}</span>
                  </label>

                  {/* unterwürfig */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitSubmissive}
                      onChange={(e) => setTraitSubmissive(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'unterwürfig' : 'paklusnus (-i)'}</span>
                  </label>

                  {/* reagiert empfindlich auf laute Geräusche */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitSensitiveNoise}
                      onChange={(e) => setTraitSensitiveNoise(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'reagiert empfindlich auf laute Geräusche' : 'jautriai reaguoja į garsius triukšmus'}</span>
                  </label>

                  {/* benutzt Katzenklo zuverlässig */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={traitLitterBox}
                      onChange={(e) => setTraitLitterBox(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-stone-700 font-medium">{lang === 'DE' ? 'benutzt Katzenklo zuverlässig' : 'patikimai naudojasi kraiko dėžute'}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 4. MEDIA MANAGEMENT */}
          {activeSection === 'media' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center">
                {ui.uploadMediaHeader}
                <HelpButton section="media" />
              </h3>
              
              {/* Permission check Card */}
              <div className="bg-stone-100/60 border border-stone-250 p-4 rounded-2xl shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-brandpink-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-850 uppercase tracking-wide">{ui.deviceCheckHeader}</h4>
                      <p className="text-[10px] text-stone-500 font-medium">{ui.deviceCheckSub}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => runDeviceCheck(true)}
                    disabled={deviceCheckLoading}
                    className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold rounded-lg border border-stone-300 transition-all select-none disabled:opacity-50"
                  >
                    {deviceCheckLoading ? ui.checkingText : ui.recheckBtn}
                  </button>
                </div>
 
                <div className="grid grid-cols-2 gap-3">
                  {/* Camera Status */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 ${
                    cameraStatus === 'granted'
                      ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
                      : cameraStatus === 'denied'
                      ? 'bg-amber-50/50 border-amber-150 text-amber-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{ui.cameraStatusLabel}</span>
                      {cameraStatus === 'granted' ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : cameraStatus === 'denied' ? (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-stone-400 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {cameraStatus === 'granted' ? `${ui.readyText} 📸` : cameraStatus === 'denied' ? `${ui.blockedText} 🔒` : `${ui.uncheckedText} 🔍`}
                    </span>
                  </div>
 
                  {/* Mic Status */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 ${
                    micStatus === 'granted'
                      ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
                      : micStatus === 'denied'
                      ? 'bg-amber-50/50 border-amber-150 text-amber-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{ui.micStatusLabel}</span>
                      {micStatus === 'granted' ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : micStatus === 'denied' ? (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-stone-400 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {micStatus === 'granted' ? `${ui.readyText} 🎤` : micStatus === 'denied' ? `${ui.blockedText} 🔒` : `${ui.uncheckedText} 🔍`}
                    </span>
                  </div>
                </div>
 
                {/* Speicher- und Verbindungs-Diagnose */}
                <div className="grid grid-cols-2 gap-3 mt-3 border-t border-stone-200/80 pt-3">
                  {/* Speicher-Typ Status */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 ${
                    opfsSupported
                      ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
                      : 'bg-amber-50/50 border-amber-150 text-amber-800'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{ui.storageTypeLabel}</span>
                      {opfsSupported ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {opfsSupported ? `${ui.optimizedText} ⚡` : `${ui.standardText} 📦`}
                    </span>
                  </div>
 
                  {/* Speicher-Schutz Status */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 ${
                    storagePersistent
                      ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
                      : 'bg-amber-50/50 border-amber-150 text-amber-800'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{ui.storageProtectionLabel}</span>
                      {storagePersistent ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {storagePersistent ? `${ui.protectedText} 🛡️` : `${ui.temporaryText} ⏳`}
                    </span>
                  </div>
                </div>
 
                {/* Storage Explanations/Troubleshooting */}
                {(!opfsSupported || !storagePersistent) && (
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-[10px] text-stone-600 leading-relaxed font-normal space-y-1.5 mt-2">
                    {!opfsSupported && (
                      <p>
                        ⚠️ <strong>{lang === 'DE' ? 'Hinweis zum Speicher-Typ:' : 'Pastaba dėl atminties tipo:'}</strong> {ui.opfsNote}
                      </p>
                    )}
                    {!storagePersistent && (
                      <p>
                        ⚠️ <strong>{lang === 'DE' ? 'Hinweis zum Speicher-Schutz:' : 'Pastaba dėl atminties apsaugos:'}</strong> {ui.persistentNote}
                      </p>
                    )}
                  </div>
                )}
 
                {/* troubleshooting help */}
                {(cameraStatus === 'denied' || micStatus === 'denied') && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed font-medium space-y-1.5 shadow-sm">
                    <span className="font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{ui.howToAllowHeader}</span>
                    </span>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-[10px]">
                      {cameraStatus === 'denied' && (
                        <li>
                          <strong>{lang === 'DE' ? 'Kamera freigeben:' : 'Leisti kamerą:'}</strong> {ui.howToAllowCam}
                        </li>
                      )}
                      {micStatus === 'denied' && (
                        <li>
                          <strong>{lang === 'DE' ? 'Mikrofon freigeben:' : 'Leisti mikrofoną:'}</strong> {ui.howToAllowMic}
                        </li>
                      )}
                      <li>
                        <strong>{lang === 'DE' ? 'Am Handy:' : 'Telefonu:'}</strong> {ui.howToAllowMobile}
                      </li>
                    </ol>
                  </div>
                )}
              </div>
 
              {/* Main Animal photos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">{ui.galleryPhotosHeader}</h3>
                    <p className="text-[10px] text-stone-400">{ui.galleryPhotosSub}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => photoCameraInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-brandpink-50 text-brandpink-700 hover:bg-brandpink-100 rounded-lg text-[10px] font-bold border border-brandpink-250 transition-all shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1" />
                      <span>{ui.cameraBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => photoGalleryInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold border border-stone-250 transition-all shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>{ui.galleryBtn}</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    ref={photoCameraInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={photoGalleryInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 border border-stone-200 rounded-xl p-3 bg-stone-50 min-h-[90px] items-center">
                  {photos.length === 0 ? (
                    <div className="col-span-4 py-4 text-center text-xs text-stone-400">
                      {ui.noPhotosText}
                    </div>
                  ) : (
                    photos.map((urlOrBase64, index) => (
                      <div key={index} className="relative aspect-square bg-stone-100 border border-stone-200 rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urlOrBase64} alt={`Photo ${index}`} className="w-full h-full object-cover" />
                        
                        {urlOrBase64.startsWith('data:') || urlOrBase64.startsWith('blob:') ? (
                          <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-amber-50/90 border border-amber-200 text-amber-700 text-[8px] font-bold flex items-center space-x-0.5 backdrop-blur-sm select-none">
                            <CloudOff className="w-2.5 h-2.5 text-amber-500" />
                            <span>{ui.localBadge}</span>
                          </div>
                        ) : (
                          <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-emerald-50/90 border border-emerald-250 text-emerald-700 text-[8px] font-bold flex items-center space-x-0.5 backdrop-blur-sm select-none">
                            <Cloud className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{ui.onlineBadge}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => deletePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-655 hover:bg-red-700 text-white rounded-md shadow-xs opacity-80 hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Passport scans */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">{ui.passportPhotosHeader}</h3>
                    <p className="text-[10px] text-stone-400">{ui.passportPhotosSub}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => passportCameraInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-brandpink-50 text-brandpink-700 hover:bg-brandpink-100 rounded-lg text-[10px] font-bold border border-brandpink-250 transition-all shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1" />
                      <span>{ui.cameraBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => passportGalleryInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold border border-stone-250 transition-all shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>{ui.galleryBtn}</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    ref={passportCameraInputRef}
                    onChange={handlePassportPhotoUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={passportGalleryInputRef}
                    onChange={handlePassportPhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 border border-stone-200 rounded-xl p-3 bg-stone-50 min-h-[90px] items-center">
                  {passportPhotos.length === 0 ? (
                    <div className="col-span-4 py-4 text-center text-xs text-stone-400">
                      {ui.noPassportsText}
                    </div>
                  ) : (
                    passportPhotos.map((urlOrBase64, index) => (
                      <div key={index} className="relative aspect-square bg-stone-100 border border-stone-200 rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urlOrBase64} alt={`Passport ${index}`} className="w-full h-full object-cover" />
                        
                        {urlOrBase64.startsWith('data:') || urlOrBase64.startsWith('blob:') ? (
                          <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-amber-50/90 border border-amber-200 text-amber-700 text-[8px] font-bold flex items-center space-x-0.5 backdrop-blur-sm select-none">
                            <CloudOff className="w-2.5 h-2.5 text-amber-500" />
                            <span>{ui.localBadge}</span>
                          </div>
                        ) : (
                          <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-emerald-50/90 border border-emerald-250 text-emerald-700 text-[8px] font-bold flex items-center space-x-0.5 backdrop-blur-sm select-none">
                            <Cloud className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{ui.onlineBadge}</span>
                          </div>
                        )}

                        <div className="absolute top-1 left-1 flex space-x-1">
                          <a
                            href={urlOrBase64}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 bg-emerald-650 hover:bg-emerald-700 text-white rounded-md shadow-xs opacity-85 hover:opacity-100 transition-all cursor-pointer flex items-center justify-center"
                            title="Dokument anzeigen"
                          >
                            <Eye className="w-3 h-3" />
                          </a>
                          <a
                            href={urlOrBase64}
                            download={`document_${index}.jpg`}
                            className="p-1 bg-stone-700 hover:bg-stone-850 text-white rounded-md shadow-xs opacity-85 hover:opacity-100 transition-all cursor-pointer flex items-center justify-center"
                            title="Dokument herunterladen"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => deletePassportPhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-655 hover:bg-red-700 text-white rounded-md shadow-xs opacity-80 hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Videos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">{ui.videosHeader}</h3>
                    <p className="text-[10px] text-stone-400">{ui.videosSub}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowVideoRecorder(true)}
                      disabled={!!compressingVideoName}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1" />
                      <span>{ui.recordBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => videoGalleryInputRef.current?.click()}
                      disabled={!!compressingVideoName}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold border border-stone-250 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>{ui.galleryBtn}</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    ref={videoCameraInputRef}
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    ref={videoGalleryInputRef}
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>

                {/* 💡 Video size warning tip */}
                <div className="text-[10px] text-stone-500 bg-stone-100 border border-stone-200/60 rounded-lg p-2.5 flex items-start space-x-1.5">
                  <span className="shrink-0 text-amber-600 font-bold">{lang === 'DE' ? '💡 Tipp:' : '💡 Patarimas:'}</span>
                  <span>{ui.videoTip}</span>
                </div>

                <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 space-y-2 min-h-[70px] flex flex-col justify-center">
                  {compressingVideoName && (
                    <div className="flex flex-col space-y-1.5 p-3 bg-brandpink-50/50 border border-brandpink-100 rounded-lg text-xs">
                      <div className="flex justify-between font-semibold text-brandpink-800">
                        <span className="truncate max-w-[250px]">{ui.optimizingText}: {compressingVideoName}</span>
                        <span>{compressionProgress}%</span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-brandpink-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${compressionProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400">{ui.compressProgressText}</p>
                    </div>
                  )}

                  {videos.length === 0 ? (
                    <div className="py-2 text-center text-xs text-stone-400">
                      {ui.noVideosText}
                    </div>
                  ) : (
                    videos.map((vid, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white border border-stone-200 rounded-lg text-xs shadow-sm">
                        <div className="flex items-center space-x-2 truncate">
                          {vid.isSynced ? (
                            <span title={lang === 'DE' ? "Online hochgeladen" : "Įkelta į debesį"} className="shrink-0 flex items-center">
                              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                            </span>
                          ) : (
                            <span title={vid.opfsKey 
                              ? (lang === 'DE' ? "Lokal gesichert (OPFS) ⚡" : "Išsaugota lokaliai (OPFS) ⚡")
                              : (lang === 'DE' ? "Lokal gesichert (IndexedDB) 📦" : "Išsaugota lokaliai (IndexedDB) 📦")
                            } className="shrink-0 flex items-center">
                              <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                          <span className="truncate max-w-[200px] text-stone-750 font-mono">{vid.name}</span>
                        </div>
                        {vid.isUploading ? (
                          <span className="w-3.5 h-3.5 border-2 border-brandpink-500 border-t-transparent rounded-full animate-spin shrink-0"></span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => deleteVideo(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audio records */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">{ui.audioHeader} ({audioItems.length}/10)</h3>
                    <p className="text-[10px] text-stone-400">{ui.audioSub}</p>
                  </div>
                  {!isRecording && audioItems.length < 10 && (
                    <button
                      type="button"
                      onClick={() => startRecording(null)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-brandpink-50 text-brandpink-700 border-brandpink-200/50 hover:bg-brandpink-100 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{ui.newAudioBtn}</span>
                    </button>
                  )}
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
                  {isRecording ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-xs font-semibold text-red-500">
                          {recordingIndex !== null ? ui.addingAudioText : ui.recordingAudioText}
                        </span>
                      </div>
                      <span className="text-2xl font-mono text-stone-700">
                        {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold animate-pulse hover:bg-red-100 transition-all cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>{ui.stopRecordingBtn}</span>
                      </button>
                    </div>
                  ) : audioItems.length > 0 ? (
                    <div className="space-y-2">
                      {audioItems.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-stone-200 p-2.5 rounded-xl shadow-sm gap-2">
                          <div className="flex items-center space-x-2 flex-1">
                            {item.isSynced ? (
                              <span title={lang === 'DE' ? "Online synchronisiert" : "Sinchronizuota su debesimi"} className="flex items-center">
                                <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              </span>
                            ) : (
                              <span title={lang === 'DE' ? "Lokal gespeichert" : "Išsaugota lokaliai"} className="flex items-center">
                                <CloudOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-stone-500 min-w-[45px] shrink-0">Note #{index + 1}</span>
                            <audio src={item.url} controls className="w-full max-h-8 outline-none accent-brandpink-500" />
                          </div>
                          
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => startRecording(index)}
                              className="px-2 py-1 bg-stone-100 hover:bg-brandpink-55 hover:text-brandpink-700 text-stone-600 text-[10px] font-bold rounded border border-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                              title={lang === 'DE' ? "Diese Sprachnotiz fortsetzen" : "Tęsti šią balso pastabą"}
                            >
                              <Mic className="w-3 h-3 text-brandpink-500" />
                              <span>{ui.continueBtn}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAudio(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                              title={ui.deleteBtn}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-stone-400">
                      {ui.noAudioText}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Edited By staff name field */}
          {activeSection !== 'revisions' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3 mt-4">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider">
                {ui.editedByLabel}
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => {
                  setStaffName(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('bmd_staff_name', e.target.value);
                  }
                }}
                placeholder={ui.editedByPlaceholder}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 focus:border-brandpink-500 focus:outline-none rounded-xl text-stone-900 placeholder-stone-400 text-xs font-semibold shadow-xs"
              />

              <p className="text-[10px] text-stone-400">
                {ui.editedByDesc}
              </p>
            </div>
          )}

          {/* 5. REVISIONS HISTORY */}
          {activeSection === 'revisions' && (
            <div className="space-y-4 pb-20">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-stone-850 uppercase tracking-wider">{ui.revisionsHeader}</h3>
                <p className="text-[10px] text-stone-400">
                  {ui.revisionsSub}
                </p>
                
                {loadingRevisions ? (
                  <div className="py-6 text-center text-xs text-stone-500 font-semibold">
                    {ui.loadingRevisions}
                  </div>
                ) : revisions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-400 font-medium bg-stone-50 rounded-xl border border-dashed border-stone-250">
                    {ui.noRevisions}
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {revisions.map((rev) => {
                      let data: any = {};
                      try {
                        data = JSON.parse(rev.version_data);
                      } catch (e) {
                        console.error(e);
                      }
                      const formattedDate = new Date(rev.created_at).toLocaleString(lang === 'DE' ? 'de-DE' : 'lt-LT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      const isExpanded = expandedRevisionId === rev.id;
                      const changes = getChangedFields(data);

                      return (
                        <div key={rev.id} className="py-4 border-b border-stone-100 last:border-0 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-stone-850 block">
                                {formattedDate} {lang === 'DE' ? 'Uhr' : 'val.'}
                              </span>
                              <span className="text-[10px] text-stone-500 font-medium block mt-0.5">
                                {lang === 'DE' ? 'Geändert von: ' : 'Pakeitė: '} <strong className="text-stone-700">{rev.edited_by}</strong>
                              </span>
                              <div className="flex items-center space-x-2 mt-1.5">
                                {changes.length === 0 ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                                    {ui.identicalBadge}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-250">
                                    {changes.length} {changes.length === 1 ? ui.diffOne : ui.diffMany}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setExpandedRevisionId(isExpanded ? null : rev.id)}
                                className="px-2 py-1.5 hover:bg-stone-105 text-stone-500 hover:text-stone-800 text-[10px] font-bold rounded-lg border border-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                              >
                                <span>{ui.compareBtn}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(ui.restoreConfirm.replace('{date}', formattedDate))) {
                                    setName(data.name || '');
                                    setGender(data.gender || 'Weiblich');
                                    setStatusAktuell(data.status_aktuell || 'zu vermitteln');
                                    setAgeYears(data.age_years || 0);
                                    setAgeMode(data.age_mode || 'range');
                                    setAgeMin(data.age_min ?? 2);
                                    setAgeMax(data.age_max ?? 3);
                                    setAgeExact(data.age_years ?? 2);
                                    setBirthYear(data.birth_year ?? 2024);
                                    setBirthMonth(data.birth_month);
                                    setBirthDay(data.birth_day);
                                    
                                    if (data.shelter_admission_date) {
                                      const parts = data.shelter_admission_date.split('-');
                                      if (parts.length === 2) {
                                        setShelterYear(parts[0]);
                                        setShelterMonth(parts[1]);
                                      }
                                    }
                                    setRoomName(data.room_name || '');
                                    setCageName(data.cage_name || '');
                                    setReasonForShelter(data.reason_for_shelter || '');
                                    setRestrictions(data.restrictions || '');
                                    setNotesMiscellaneous(data.notes_miscellaneous || '');
                                    setIsPublished(data.is_published ?? true);
                                    setIsEmergency(data.is_emergency ?? false);
                                    
                                    setIsCastrated(data.is_castrated ?? true);
                                    setIsChipped(data.is_chipped ?? true);
                                    setHasRabiesVaccine(data.has_rabies_vaccine ?? true);
                                    setHasCatFluVaccine(data.has_cat_flu_vaccine ?? true);
                                    setIsDewormed(data.is_dewormed ?? true);
                                    setHasEuPassport(data.has_eu_passport ?? false);
                                    
                                    setCompatCats(data.compat_cats || 'unbekannt');
                                    setCompatDogs(data.compat_dogs || 'unbekannt');
                                    setCompatChildren(data.compat_children || 'unbekannt');
                                    setTraitCurious(data.trait_curious || 'unbekannt');
                                    setTraitPlayful(data.trait_playful || 'unbekannt');
                                    setTraitAggressive(data.trait_aggressive || 'unbekannt');
                                    setTraitFearful(data.trait_fearful || 'unbekannt');
                                    setTraitCuddly(data.trait_cuddly || 'unbekannt');
                                    
                                    setPhotos(data.media_urls || []);
                                    setPassportPhotos(data.passport_urls || []);
                                    setVideos(data.video_urls?.map((url: string) => ({ name: url.substring(url.lastIndexOf('/') + 1), url, isSynced: true })) || []);
                                    
                                    const histAudios: { url: string; isSynced: boolean }[] = [];
                                    if (data.audio_urls && data.audio_urls.length > 0) {
                                      data.audio_urls.forEach((url: string) => histAudios.push({ url, isSynced: true }));
                                    } else if (data.audio_draft_url) {
                                      if (data.audio_draft_url.startsWith('[')) {
                                        try {
                                          const parsed: string[] = JSON.parse(data.audio_draft_url);
                                          parsed.forEach(url => histAudios.push({ url, isSynced: url.startsWith('http') }));
                                        } catch (e) {
                                          histAudios.push({ url: data.audio_draft_url, isSynced: data.audio_draft_url.startsWith('http') });
                                        }
                                      } else {
                                        histAudios.push({ url: data.audio_draft_url, isSynced: data.audio_draft_url.startsWith('http') });
                                      }
                                    }
                                    setAudioItems(histAudios);
                                    
                                    setActiveSection('basic');
                                    setAlertMessage({
                                      type: 'warn',
                                      text: lang === 'DE'
                                        ? 'Die historische Version wurde geladen. Bitte überprüfe die Daten und klicke zum Übernehmen unten auf "Änderungen speichern".'
                                        : 'Istorinė versija sėkmingai įkelta. Prašome patikrinti duomenis ir spustelėti „Išsaugoti pakeitimus“ puslapio apačioje.'
                                    });
                                  }
                                }}
                                className="px-3 py-1.5 bg-brandpink-50 hover:bg-brandpink-100 text-brandpink-700 text-[10px] font-bold rounded-lg border border-brandpink-200 transition-colors cursor-pointer"
                              >
                                {lang === 'DE' ? 'Laden' : 'Įkelti'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-3 text-[11px] animate-fade-in">
                              {changes.length === 0 ? (
                                <p className="text-stone-500 font-medium text-center py-1">
                                  {lang === 'DE'
                                    ? 'Diese Version entspricht exakt den aktuellen Werten im Bearbeitungsformular.'
                                    : 'Ši versija tiksliai atitinka dabartines redagavimo formos reikšmes.'}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <span className="font-bold text-stone-600 block text-[10px] uppercase tracking-wider">
                                    {lang === 'DE' ? 'Unterschiede zur aktuellen Ansicht:' : 'Skirtumai nuo dabartinio vaizdo:'}
                                  </span>
                                  <div className="overflow-hidden border border-stone-200 rounded-lg bg-white">
                                    <table className="min-w-full divide-y divide-stone-200 text-left">
                                      <thead className="bg-stone-50 font-bold text-stone-500 text-[9px] uppercase">
                                        <tr>
                                          <th className="px-3 py-2">{lang === 'DE' ? 'Feld' : 'Laukas'}</th>
                                          <th className="px-3 py-2 text-amber-700">{lang === 'DE' ? 'Diese Version' : 'Ši versija'}</th>
                                          <th className="px-3 py-2 text-stone-500">{lang === 'DE' ? 'Aktuell im Formular' : 'Dabartinė formoje'}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-stone-150 text-stone-700">
                                        {changes.map((ch, i) => (
                                          <tr key={i} className="hover:bg-stone-50">
                                            <td className="px-3 py-2 font-bold text-stone-600">{ch.label}</td>
                                            <td className="px-3 py-2 font-semibold text-amber-800 bg-amber-50/40">{ch.oldVal}</td>
                                            <td className="px-3 py-2 text-stone-500">{ch.newVal}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              
                              <div className="pt-2.5 border-t border-stone-200/80 grid grid-cols-2 gap-2 text-[10px] text-stone-500">
                                <div>
                                  <span className="font-semibold block text-stone-400 uppercase text-[8px] tracking-wider">
                                    {lang === 'DE' ? 'Name in dieser Version:' : 'Vardas šioje versijoje:'}
                                  </span>
                                  <span className="text-stone-700 font-medium">{data.name || '-'}</span>
                                </div>
                                <div>
                                  <span className="font-semibold block text-stone-400 uppercase text-[8px] tracking-wider">
                                    {lang === 'DE' ? 'Raum / Box:' : 'Kambarys / Narvas:'}
                                  </span>
                                  <span className="text-stone-700 font-medium">
                                    {data.room_name || data.cage_name 
                                      ? `${data.room_name || '-'} / ${data.cage_name || '-'}`
                                      : '-'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-stone-200 backdrop-blur-md p-4 flex space-x-3 max-w-lg mx-auto z-40">
            <button
              type="button"
              onClick={handleDeleteAnimal}
              className="px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              title="Profil löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-250 transition-colors"
            >
              {lang === 'DE' ? 'Abbrechen' : 'Atšaukti'}
            </button>
            <button
              type="submit"
              disabled={!!compressingVideoName}
              className="flex-1 flex items-center justify-center space-x-1.5 py-3.5 bg-brandpink-600 hover:bg-brandpink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brandpink-900/10 active:scale-98 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isOnline 
                  ? (lang === 'DE' ? 'Änderungen speichern' : 'Išsaugoti pakeitimus') 
                  : (lang === 'DE' ? 'Lokal speichern' : 'Išsaugoti lokaliai')}
              </span>
            </button>
          </div>

        </form>

        <HelpBottomSheet 
          isOpen={!!helpKey} 
          onClose={() => setHelpKey(null)} 
          title={helpKey ? helpContent[helpKey].title : ''} 
          content={helpKey ? helpContent[helpKey].body : ''} 
        />

        <VideoRecorderModal
          isOpen={showVideoRecorder}
          onClose={() => setShowVideoRecorder(false)}
          onRecordComplete={(file) => {
            processAndUploadVideo(file);
          }}
        />
      </main>
    </div>
  );
}
