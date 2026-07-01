'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { syncWithCloud, uploadMediaBlob } from '@/lib/syncManager';
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
  Plus
} from 'lucide-react';
import { appendAudioBlobs } from '@/lib/audioStitcher';

export default function CreateCatPage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [activeSection, setActiveSection] = useState<'basic' | 'medical' | 'behavior' | 'media'>('basic');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [helpKey, setHelpKey] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Weiblich' | 'Männlich'>('Weiblich');
  const [ageYears, setAgeYears] = useState(0);
  const [ageMode, setAgeMode] = useState<'range' | 'exact' | 'birthyear'>('range');
  const [ageMin, setAgeMin] = useState(2);
  const [ageMax, setAgeMax] = useState(3);
  const [ageExact, setAgeExact] = useState(2);
  const [birthYear, setBirthYear] = useState(2024);
  const [birthMonth, setBirthMonth] = useState<number | undefined>(undefined);
  const [birthDay, setBirthDay] = useState<number | undefined>(undefined);

  // Adjust birthDay if it exceeds the days in the selected month/year
  useEffect(() => {
    if (birthMonth !== undefined && birthDay !== undefined) {
      const maxDays = new Date(birthYear, birthMonth, 0).getDate();
      if (birthDay > maxDays) {
        setBirthDay(maxDays);
      }
    }
  }, [birthYear, birthMonth, birthDay]);

  // Synchronize ageYears based on the current ageMode
  useEffect(() => {
    if (ageMode === 'range') {
      setAgeYears((ageMin + ageMax) / 2);
    } else if (ageMode === 'exact') {
      setAgeYears(ageExact);
    } else if (ageMode === 'birthyear') {
      const today = new Date();
      const currentYear = today.getFullYear();
      let calculatedAge = currentYear - birthYear;
      if (birthMonth !== undefined) {
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        if (currentMonth < birthMonth || (currentMonth === birthMonth && birthDay !== undefined && currentDay < birthDay)) {
          calculatedAge--;
        }
      }
      setAgeYears(Math.max(0, calculatedAge));
    }
  }, [ageMode, ageMin, ageMax, ageExact, birthYear, birthMonth, birthDay]);

  const [shelterMonth, setShelterMonth] = useState('06');
  const [shelterYear, setShelterYear] = useState('2026');
  const [roomName, setRoomName] = useState('');
  const [cageName, setCageName] = useState('');
  
  // Audio Recording State
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

  // Medical Toggles (Default Ja/True)
  const [isCastrated, setIsCastrated] = useState(true);
  const [isChipped, setIsChipped] = useState(true);
  const [hasRabiesVaccine, setHasRabiesVaccine] = useState(true);
  const [hasCatFluVaccine, setHasCatFluVaccine] = useState(true);
  const [isDewormed, setIsDewormed] = useState(true);
  // Default Nein/False
  const [hasEuPassport, setHasEuPassport] = useState(false);

  // Compatibility & Temperament (Default unbekannt)
  const [compatCats, setCompatCats] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [compatDogs, setCompatDogs] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [compatChildren, setCompatChildren] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitCurious, setTraitCurious] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitPlayful, setTraitPlayful] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitAggressive, setTraitAggressive] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitFearful, setTraitFearful] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');
  const [traitCuddly, setTraitCuddly] = useState<'JA' | 'NEIN' | 'unbekannt'>('unbekannt');

  // Media
  const [photos, setPhotos] = useState<string[]>([]); // Base64 data URLs
  const [passportPhotos, setPassportPhotos] = useState<string[]>([]); // Base64 passport documents
  const [videos, setVideos] = useState<{ 
    name: string; 
    blob?: Blob; 
    opfsKey?: string; 
    isSynced?: boolean; 
    url?: string;
    isUploading?: boolean;
  }[]>([]); // local/synced video files

  // Device & Storage Diagnostics State
  const [opfsSupported, setOpfsSupported] = useState(false);
  const [storagePersistent, setStoragePersistent] = useState(false);

  // Device Permissions State
  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [deviceCheckRun, setDeviceCheckRun] = useState(false);
  const [deviceCheckLoading, setDeviceCheckLoading] = useState(false);
  
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'warn'; text: string } | null>(null);

  // File Inputs references
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
    if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((persisted) => {
        setStoragePersistent(persisted);
      });
    }
  }, []);

  // Auth Guard
  useEffect(() => {
    const session = localStorage.getItem('bmd_session');
    if (session !== 'authenticated') {
      router.push('/login');
    }
  }, [router]);

  // Online / Offline Status monitoring
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Draft Autosave & Restore logic
  useEffect(() => {
    // Restore draft from localStorage if exists
    const draft = localStorage.getItem('bmd_cat_draft');
    if (draft) {
      try {
        const d = JSON.parse(draft);
        setName(d.name || '');
        setGender(d.gender || 'Weiblich');
        setAgeYears(d.ageYears ?? 0);
        setAgeMode(d.ageMode || 'range');
        setAgeMin(d.ageMin ?? 2);
        setAgeMax(d.ageMax ?? 3);
        setAgeExact(d.ageExact ?? 2);
        setBirthYear(d.birthYear ?? 2024);
        setBirthMonth(d.birthMonth);
        setBirthDay(d.birthDay);
        setShelterMonth(d.shelterMonth || '06');
        setShelterYear(d.shelterYear || '2026');
        setRoomName(d.roomName || '');
        setCageName(d.cageName || '');
        if (d.audioItems) {
          setAudioItems(d.audioItems);
        } else if (d.audioDraftUrl) {
          setAudioItems([{ url: d.audioDraftUrl, isSynced: false }]);
        }
        setReasonForShelter(d.reasonForShelter || '');
        setRestrictions(d.restrictions || '');
        setNotesMiscellaneous(d.notesMiscellaneous || '');
        setIsPublished(d.isPublished ?? true);
        setIsEmergency(d.isEmergency ?? false);
        
        setIsCastrated(d.isCastrated ?? true);
        setIsChipped(d.isChipped ?? true);
        setHasRabiesVaccine(d.hasRabiesVaccine ?? true);
        setHasCatFluVaccine(d.hasCatFluVaccine ?? true);
        setIsDewormed(d.isDewormed ?? true);
        setHasEuPassport(d.hasEuPassport ?? false);

        setCompatCats(d.compatCats || 'unbekannt');
        setCompatDogs(d.compatDogs || 'unbekannt');
        setCompatChildren(d.compatChildren || 'unbekannt');
        setTraitCurious(d.traitCurious || 'unbekannt');
        setTraitPlayful(d.traitPlayful || 'unbekannt');
        setTraitAggressive(d.traitAggressive || 'unbekannt');
        setTraitFearful(d.traitFearful || 'unbekannt');
        setTraitCuddly(d.traitCuddly || 'unbekannt');

        setPhotos(d.photos || []);
        setPassportPhotos(d.passportPhotos || []);
        setVideos(d.videos || []);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, []);

  // Write draft to localStorage on any state change
  useEffect(() => {
    const draftObject = {
      name, gender, ageYears, shelterMonth, shelterYear,
      ageMode, ageMin, ageMax, ageExact, birthYear, birthMonth, birthDay,
      roomName, cageName, audioItems,
      reasonForShelter, restrictions, notesMiscellaneous, isPublished, isEmergency,
      isCastrated, isChipped, hasRabiesVaccine, hasCatFluVaccine, isDewormed, hasEuPassport,
      compatCats, compatDogs, compatChildren,
      traitCurious, traitPlayful, traitAggressive, traitFearful, traitCuddly,
      photos, passportPhotos, videos
    };
    try {
      localStorage.setItem('bmd_cat_draft', JSON.stringify(draftObject));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Save draft without images to avoid crashing
        const textOnlyDraft = { ...draftObject, photos: [], passportPhotos: [], videos: [] };
        try {
          localStorage.setItem('bmd_cat_draft', JSON.stringify(textOnlyDraft));
          setAlertMessage({ 
            type: 'warn', 
            text: 'Speicherlimit des Browsers überschritten. Entwurfsbilder werden bei Neuladen nicht wiederhergestellt, aber alle Textfelder wurden lokal gesichert.' 
          });
        } catch (innerErr) {
          console.error('Failed to save even text draft', innerErr);
        }
      } else {
        console.error('Failed to save draft to localStorage', e);
      }
    }
  }, [
    name, gender, ageYears, shelterMonth, shelterYear,
    ageMode, ageMin, ageMax, ageExact, birthYear, birthMonth, birthDay,
    roomName, cageName, audioItems,
    reasonForShelter, restrictions, notesMiscellaneous, isPublished, isEmergency,
    isCastrated, isChipped, hasRabiesVaccine, hasCatFluVaccine, isDewormed, hasEuPassport,
    compatCats, compatDogs, compatChildren,
    traitCurious, traitPlayful, traitAggressive, traitFearful, traitCuddly,
    photos, passportPhotos, videos
  ]);

  // Convert File to Base64
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
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        fileToBase64(file).then(resolve).catch(reject);
      };
    });
  };

  // Video Duration Check
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
      setAlertMessage({ type: 'error', text: 'Maximal 20 Fotos pro Tier erlaubt.' });
      return;
    }

    // Pre-upload validation checks (size & type)
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setAlertMessage({ 
          type: 'error', 
          text: `Huch! Die Datei "${file.name}" ist kein Foto. Bitte wähle nur Bilddateien aus.` 
        });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setAlertMessage({ 
          type: 'error', 
          text: `Das Foto "${file.name}" ist mit ${(file.size / (1024 * 1024)).toFixed(1)} MB etwas zu groß. Bitte wähle ein Foto unter 15 MB.` 
        });
        return;
      }
    }

    try {
      const base64s = await Promise.all(files.map(f => compressImage(f)));
      setPhotos(prev => [...prev, ...base64s]);
    } catch (err) {
      console.error('Failed to compress upload photos:', err);
      setAlertMessage({ type: 'error', text: 'Fehler beim Verarbeiten der Fotos.' });
    }
  };

  // Upload Passport/Impfung documents
  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setAlertMessage(null);
    const files = Array.from(e.target.files);

    // Pre-upload validation checks (size & type)
    for (const file of files) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setAlertMessage({ 
          type: 'error', 
          text: `Die Datei "${file.name}" ist kein unterstütztes Dokument. Bitte wähle ein Foto oder eine PDF-Datei.` 
        });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setAlertMessage({ 
          type: 'error', 
          text: `Das Dokument "${file.name}" ist mit ${(file.size / (1024 * 1024)).toFixed(1)} MB zu groß. Bitte wähle ein Dokument unter 15 MB.` 
        });
        return;
      }
    }

    try {
      const base64s = await Promise.all(files.map(f => compressImage(f)));
      setPassportPhotos(prev => [...prev, ...base64s]);
    } catch (err) {
      console.error('Failed to compress passport scans:', err);
      setAlertMessage({ type: 'error', text: 'Fehler beim Verarbeiten der Dokumente.' });
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
          return resolve(file); // fallback to original file if captureStream is not supported
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
      setAlertMessage({ type: 'error', text: 'Video-Upload erfordert eine stabile Internetverbindung. Bitte im Online-Bereich hochladen.' });
      return;
    }

    if (videos.length >= 5) {
      setAlertMessage({ type: 'error', text: 'Maximal 5 Videos pro Tier erlaubt.' });
      return;
    }

    if (!file.type.startsWith('video/')) {
      setAlertMessage({ 
        type: 'error', 
        text: `Huch! Die Datei "${file.name}" ist kein Video. Bitte wähle nur Videodateien (z.B. MP4).` 
      });
      return;
    }

    // Check size limit: 200 MB
    if (file.size > 200 * 1024 * 1024) {
      setAlertMessage({ 
        type: 'error', 
        text: `Das Video "${file.name}" ist mit ${(file.size / (1024 * 1024)).toFixed(1)} MB zu groß. Bitte wähle ein Video unter 200 MB.` 
      });
      return;
    }

    const duration = await checkVideoDuration(file);
    if (duration > 300) {
      setAlertMessage({ 
        type: 'error', 
        text: `Das Video "${file.name}" überschreitet die maximale Länge von 5 Minuten (${Math.round(duration)} Sek).` 
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

  // Audio Recording Helper Functions
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
      alert('Du kannst maximal 10 Audio-Aufnahmen pro Schützling speichern.');
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
          // Stitching mode: merge existing audio with new audio
          const existingItem = audioItems[indexToAppend];
          try {
            const res = await fetch(existingItem.url);
            const existingBlob = await res.blob();
            finalBlob = await appendAudioBlobs(existingBlob, newBlob);
          } catch (e) {
            console.error('Failed to append audio blobs:', e);
            alert('Das Audio konnte nicht fortgesetzt werden. Es wurde stattdessen ein neues Audio erstellt.');
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
      alert('Zugriff auf das Mikrofon verweigert oder nicht unterstützt.');
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

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    if (!name.trim()) {
      setAlertMessage({ type: 'error', text: 'Bitte gib einen Namen für das Tier ein.' });
      setActiveSection('basic');
      return;
    }

    try {
      const animalData = {
        name,
        created_at: new Date().toISOString(),
        type: 'Katze' as const,
        status_aktuell: 'zu vermitteln' as const,
        gender,
        age_years: ageYears,
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
        video_urls: videos.filter(v => v.isSynced && v.url).map(v => v.url!),
        room_name: roomName.trim() || undefined,
        cage_name: cageName.trim() || undefined,
        audio_draft_url: audioItems.length > 0 ? JSON.stringify(audioItems.map(item => item.url)) : undefined,
        audio_urls: [],

        // Store binary media files locally for background sync upload
        local_photos: photos.map((base64, index) => ({
          name: `photo_${index}.jpg`,
          blob: base64ToBlob(base64)
        })),
        local_passports: passportPhotos.map((base64, index) => ({
          name: `passport_${index}.jpg`,
          blob: base64ToBlob(base64)
        })),
        local_videos: videos.filter(v => !v.isSynced).map((vid) => ({
          name: vid.name,
          blob: vid.blob,
          opfsKey: vid.opfsKey
        })),
        local_audios: audioItems.map((item, index) => ({
          name: `audio_note_${index}.wav`,
          blob: base64ToBlob(item.url)
        })),

        sync_pending: 1,
        media_pending: (photos.length > 0 || passportPhotos.length > 0 || videos.some(v => !v.isSynced) || audioItems.length > 0) ? 1 : 0,
        updated_at: new Date().toISOString()
      };

      await db.animals.add(animalData);
      await logger.info('AnimalCreation', `Erfolgreich ein neues Tier registriert: ${animalData.name} (${animalData.type})`);
      
      // Trigger cloud synchronization in the background
      syncWithCloud().catch((err) => {
        console.error('Background sync failed after animal creation:', err);
      });
      
      // Clear localStorage draft upon successful save
      localStorage.removeItem('bmd_cat_draft');
      setSaveSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err) {
      console.error(err);
      await logger.error('AnimalCreation', `Fehler beim Erstellen des Tiers: ${name}`, err);
      setAlertMessage({ type: 'error', text: 'Fehler beim Speichern in der lokalen Datenbank.' });
    }
  };

  function HelpButton({ section }: { section: string }) {
    return (
      <button
        type="button"
        onClick={() => setHelpKey(section)}
        className="p-0.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0 align-middle ml-1"
        title="Hilfe anzeigen"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    );
  }

  // Helper toggle UI: single button chip (violet when active, stone outlined when inactive)
  function ToggleSelect({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: boolean; 
    onChange: (v: boolean) => void 
  }) {
    return (
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
  }

  function TripleSelect({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: 'JA' | 'NEIN' | 'unbekannt'; 
    onChange: (v: 'JA' | 'NEIN' | 'unbekannt') => void 
  }) {
    return (
      <div className="flex flex-col space-y-2 bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
        <span className="text-xs font-bold text-stone-700">{label}</span>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
          <button
            type="button"
            onClick={() => onChange('JA')}
            className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${value === 'JA' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-850'}`}
          >
            Ja
          </button>
          <button
            type="button"
            onClick={() => onChange('NEIN')}
            className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${value === 'NEIN' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-850'}`}
          >
            Nein
          </button>
          <button
            type="button"
            onClick={() => onChange('unbekannt')}
            className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${value === 'unbekannt' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-850'}`}
          >
            Unbekannt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="px-4 py-4 bg-white border-b border-stone-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="p-1 rounded bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-stone-850">Katze registrieren</h1>
            <p className="text-[9px] text-stone-500 font-medium">Būk mano draugas</p>
          </div>
        </div>

        {/* Connection status indicator */}
        <div>
          {isOnline ? (
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-emerald-700 text-[10px] font-bold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-amber-700 text-[10px] font-bold">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span>Offline-Modus</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Form container */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24">
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center flex flex-col items-center justify-center space-y-2 shadow-sm">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <h3 className="font-bold">Katze erfolgreich erfasst!</h3>
            <p className="text-xs">Leite zum Dashboard weiter...</p>
          </div>
        )}

        {alertMessage && (
          <div className={`mb-4 p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs shadow-sm ${
            alertMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{alertMessage.text}</span>
          </div>
        )}

        {/* Section Tabs (Daumen-optimiert) */}
        <div className="grid grid-cols-4 gap-1 bg-stone-200/60 p-1 rounded-xl border border-stone-300/80 mb-5">
          <button
            onClick={() => setActiveSection('basic')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'basic' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Eckdaten
          </button>
          <button
            onClick={() => setActiveSection('medical')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'medical' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Medizin
          </button>
          <button
            onClick={() => setActiveSection('behavior')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'behavior' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Temperament
          </button>
          <button
            onClick={() => setActiveSection('media')}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all ${activeSection === 'media' ? 'bg-brandpink-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Medien
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. BASIC INFORMATION */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Name *<HelpButton section="name" /></label>
                <input
                  type="text"
                  placeholder="z.B. Luna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Raum<HelpButton section="roomCage" /></label>
                  <input
                    type="text"
                    placeholder="z.B. Container 1"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Käfig / Box<HelpButton section="roomCage" /></label>
                  <input
                    type="text"
                    placeholder="z.B. Box 3"
                    value={cageName}
                    onChange={(e) => setCageName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Geschlecht<HelpButton section="gender" /></label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Weiblich' | 'Männlich')}
                    className="w-full px-3 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                  >
                    <option value="Weiblich">Weiblich</option>
                    <option value="Männlich">Männlich</option>
                  </select>
                </div>
              </div>

              {/* Alter Section */}
              <div className="space-y-3 p-4 bg-stone-100/40 rounded-2xl border border-stone-200">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Alter Angeben<HelpButton section="age" />
                </label>
                
                {/* Segmented Control / Tabs */}
                <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setAgeMode('range')}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                      ageMode === 'range'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200/50'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Alter (von - bis)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgeMode('exact')}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                      ageMode === 'exact'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200/50'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Alter (exakt)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgeMode('birthyear')}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                      ageMode === 'birthyear'
                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200/50'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    Geburtsjahr
                  </button>
                </div>

                {/* Mode-Specific Inputs */}
                {ageMode === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">von (Min)</span>
                      <select
                        value={ageMin}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAgeMin(val);
                          if (val > ageMax) {
                            setAgeMax(val);
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                      >
                        {Array.from({ length: 21 }).map((_, i) => (
                          <option key={i} value={i}>{i} {i === 1 ? 'Jahr' : 'Jahre'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">bis (Max)</span>
                      <select
                        value={ageMax}
                        onChange={(e) => setAgeMax(parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                      >
                        {Array.from({ length: 21 }).map((_, i) => (
                          i >= ageMin && (
                            <option key={i} value={i}>{i} {i === 1 ? 'Jahr' : 'Jahre'}</option>
                          )
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {ageMode === 'exact' && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Genaues Alter</span>
                    <select
                      value={ageExact}
                      onChange={(e) => setAgeExact(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                    >
                      {Array.from({ length: 21 }).map((_, i) => (
                        <option key={i} value={i}>{i} {i === 1 ? 'Jahr' : 'Jahre'}</option>
                      ))}
                    </select>
                  </div>
                )}

                {ageMode === 'birthyear' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Geburtsjahr</span>
                        <select
                          value={birthYear}
                          onChange={(e) => setBirthYear(parseInt(e.target.value))}
                          className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                        >
                          {Array.from({ length: 23 }).map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <option key={year} value={year}>{year}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Monat (opt.)</span>
                        <select
                          value={birthMonth || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                            setBirthMonth(val);
                            if (!val) {
                              setBirthDay(undefined);
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 12 }).map((_, i) => {
                            const m = i + 1;
                            const mLabel = String(m).padStart(2, '0');
                            return <option key={m} value={m}>{mLabel}</option>;
                          })}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Tag (opt.)</span>
                        <select
                          value={birthDay || ''}
                          onChange={(e) => setBirthDay(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                          disabled={!birthMonth}
                        >
                          <option value="">--</option>
                          {birthMonth && Array.from({ length: new Date(birthYear, birthMonth, 0).getDate() }).map((_, i) => {
                            const d = i + 1;
                            const dLabel = String(d).padStart(2, '0');
                            return <option key={d} value={d}>{dLabel}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Admission Date range 01/2015 to 12/2027 */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Seit wann im Tierheim?<HelpButton section="arrivalDate" /></label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={shelterMonth}
                    onChange={(e) => setShelterMonth(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const m = String(i + 1).padStart(2, '0');
                      return <option key={m} value={m}>{m}</option>;
                    })}
                  </select>
                  <select
                    value={shelterYear}
                    onChange={(e) => setShelterYear(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-brandpink-500 text-sm focus:ring-1 focus:ring-brandpink-500"
                  >
                    {Array.from({ length: 13 }).map((_, i) => {
                      const y = String(2015 + i);
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Warum im Tierheim?<HelpButton section="reason" /></label>
                <textarea
                  placeholder="Hintergründe der Abgabe..."
                  value={reasonForShelter}
                  onChange={(e) => setReasonForShelter(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm h-20 focus:ring-1 focus:ring-brandpink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Einschränkungen (z.B. Krankheiten)<HelpButton section="restrictions" /></label>
                <textarea
                  placeholder="Besondere Pflegehinweise oder Allergien..."
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm h-20 focus:ring-1 focus:ring-brandpink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Sonstiges<HelpButton section="misc" /></label>
                <textarea
                  placeholder="Zusätzliche Freitextnotizen..."
                  value={notesMiscellaneous}
                  onChange={(e) => setNotesMiscellaneous(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brandpink-500 text-sm h-20 focus:ring-1 focus:ring-brandpink-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center bg-white border border-stone-200 p-3.5 rounded-xl shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-stone-700 block flex items-center">Galerie veröffentlichen<HelpButton section="publish" /></span>
                    <span className="text-[10px] text-stone-400">Direkt auf der öffentlichen Webseite anzeigen</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-5 h-5 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center bg-white border border-stone-200 p-3.5 rounded-xl shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-stone-700 block flex items-center">Sorgenfell / Notfall<HelpButton section="emergency" /></span>
                    <span className="text-[10px] text-stone-400">Markiert als Notfall (SOS)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="w-5 h-5 rounded border-stone-300 bg-stone-50 accent-brandpink-500 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. MEDICAL TOGGLES */}
          {activeSection === 'medical' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center">
                Medizinischer Status
                <HelpButton section="medical" />
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                <ToggleSelect label="Kastriert" value={isCastrated} onChange={setIsCastrated} />
                <ToggleSelect label="Gechipt" value={isChipped} onChange={setIsChipped} />
                <ToggleSelect label="Tollwutimpfung" value={hasRabiesVaccine} onChange={setHasRabiesVaccine} />
                <ToggleSelect label="Katzenschnupfen" value={hasCatFluVaccine} onChange={setHasCatFluVaccine} />
                <ToggleSelect label="Entwurmt" value={isDewormed} onChange={setIsDewormed} />
                <ToggleSelect label="EU-Heimtierausweis" value={hasEuPassport} onChange={setHasEuPassport} />
              </div>
            </div>
          )}

          {/* 3. TEMPERAMENT & COMPATIBILITY */}
          {activeSection === 'behavior' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center">
                Temperament &amp; Verträglichkeit
                <HelpButton section="behavior" />
              </h3>
              <TripleSelect label="Verträglich mit anderen Katzen" value={compatCats} onChange={setCompatCats} />
              <TripleSelect label="Verträglich mit Hunden" value={compatDogs} onChange={setCompatDogs} />
              <TripleSelect label="Verträglich mit Kindern" value={compatChildren} onChange={setCompatChildren} />
              <TripleSelect label="Neugierig" value={traitCurious} onChange={setTraitCurious} />
              <TripleSelect label="Verspielt" value={traitPlayful} onChange={setTraitPlayful} />
              <TripleSelect label="Aggressiv" value={traitAggressive} onChange={setTraitAggressive} />
              <TripleSelect label="Ängstlich" value={traitFearful} onChange={setTraitFearful} />
              <TripleSelect label="Verschmust" value={traitCuddly} onChange={setTraitCuddly} />
            </div>
          )}

          {/* 4. MEDIA MANAGEMENT (Camera upload & quotas) */}
          {activeSection === 'media' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center">
                Fotos &amp; Videos hochladen
                <HelpButton section="media" />
              </h3>
              
              {/* Geräte- & Speicher-Check Card */}
              <div className="bg-stone-100/60 border border-stone-250 p-4 rounded-2xl shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-brandpink-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-850 uppercase tracking-wide">Geräte- &amp; Speicher-Check</h4>
                      <p className="text-[10px] text-stone-500 font-medium">Berechtigungen für Kamera &amp; Mikrofon</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => runDeviceCheck(true)}
                    disabled={deviceCheckLoading}
                    className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold rounded-lg border border-stone-300 transition-all select-none disabled:opacity-50"
                  >
                    {deviceCheckLoading ? 'Prüft...' : 'Erneut prüfen'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Kamera Status */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 ${
                    cameraStatus === 'granted'
                      ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
                      : cameraStatus === 'denied'
                      ? 'bg-amber-50/50 border-amber-150 text-amber-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Kamera</span>
                      {cameraStatus === 'granted' ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : cameraStatus === 'denied' ? (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-stone-400 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {cameraStatus === 'granted' ? 'Bereit 📸' : cameraStatus === 'denied' ? 'Blockiert 🔒' : 'Ungeprüft 🔍'}
                    </span>
                  </div>

                  {/* Mikrofon Status */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 ${
                    micStatus === 'granted'
                      ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
                      : micStatus === 'denied'
                      ? 'bg-amber-50/50 border-amber-150 text-amber-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Mikrofon</span>
                      {micStatus === 'granted' ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : micStatus === 'denied' ? (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-stone-400 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {micStatus === 'granted' ? 'Bereit 🎤' : micStatus === 'denied' ? 'Blockiert 🔒' : 'Ungeprüft 🔍'}
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
                      <span className="text-[10px] font-bold uppercase tracking-wider">Speicher-Typ</span>
                      {opfsSupported ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {opfsSupported ? 'OPFS (Optimiert) ⚡' : 'IndexedDB (Standard) 📦'}
                    </span>
                  </div>

                  {/* Speicher-Schutz Status */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 ${
                    storagePersistent
                      ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
                      : 'bg-amber-50/50 border-amber-150 text-amber-800'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Speicher-Schutz</span>
                      {storagePersistent ? (
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-1">
                      {storagePersistent ? 'Geschützt 🛡️' : 'Temporär ⏳'}
                    </span>
                  </div>
                </div>

                {/* Storage Explanations/Troubleshooting */}
                {(!opfsSupported || !storagePersistent) && (
                  <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-[10px] text-stone-600 leading-relaxed font-normal space-y-1.5 mt-2">
                    {!opfsSupported && (
                      <p>
                        ⚠️ <strong>Hinweis zum Speicher-Typ:</strong> Dein Gerät unterstützt das moderne OPFS-Dateisystem nicht. Videos werden im Standard-Datenbankspeicher abgelegt. Bitte lade Videos vorzugsweise hoch, wenn du online bist, um Speicher-Engpässe zu vermeiden.
                      </p>
                    )}
                    {!storagePersistent && (
                      <p>
                        ⚠️ <strong>Hinweis zum Speicher-Schutz:</strong> Der Speicher ist als temporär eingestuft. Falls der Speicher deines Handys sehr voll wird, könnte der Browser ungesynchronisierte Entwürfe löschen. Synchronisiere deine Einträge bitte zeitnah!
                      </p>
                    )}
                  </div>
                )}

                {/* Hilfestellung bei blockierten Berechtigungen */}
                {(cameraStatus === 'denied' || micStatus === 'denied') && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed font-medium space-y-1.5 shadow-sm">
                    <span className="font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Wie du den Zugriff erlauben kannst:</span>
                    </span>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-[10px]">
                      {cameraStatus === 'denied' && (
                        <li>
                          <strong>Kamera freigeben:</strong> Klicke oben links neben der Webadresse (in der Adressleiste deines Browsers) auf das kleine Schloss-Symbol 🔒 und stelle <strong>Kamera</strong> auf &quot;Zulassen&quot; / &quot;Erlauben&quot;.
                        </li>
                      )}
                      {micStatus === 'denied' && (
                        <li>
                          <strong>Mikrofon freigeben:</strong> Klicke ebenfalls auf das Schloss-Symbol 🔒 und erlaube den Zugriff auf das <strong>Mikrofon</strong>, damit du Sprachnotizen aufnehmen kannst.
                        </li>
                      )}
                      <li>
                        <strong>Am Handy:</strong> Gehe in die Handy-Einstellungen unter <em>Apps &rarr; Browser (z.B. Chrome/Safari) &rarr; Berechtigungen</em> und erlaube dort Kamera/Mikrofon. Lade danach diese Seite neu.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Main animal photos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Galeriefotos (max. 20)</h3>
                    <p className="text-[10px] text-stone-400">Bilder für die Vermittlungsgalerie</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => photoCameraInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-brandpink-50 text-brandpink-700 hover:bg-brandpink-100 rounded-lg text-[10px] font-bold border border-brandpink-250 transition-all shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1" />
                      <span>Kamera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => photoGalleryInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold border border-stone-250 transition-all shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>Galerie</span>
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
                      Keine Fotos aufgenommen.
                    </div>
                  ) : (
                    photos.map((base64, index) => (
                      <div key={index} className="relative aspect-square bg-stone-100 border border-stone-200 rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={base64} alt={`Photo ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-amber-50/90 border border-amber-200 text-amber-700 text-[8px] font-bold flex items-center space-x-0.5 backdrop-blur-sm select-none">
                          <CloudOff className="w-2.5 h-2.5 text-amber-500" />
                          <span>Lokal</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deletePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Passport & Medical photos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Pässe &amp; Impfdokumente</h3>
                    <p className="text-[10px] text-stone-400">Nur zur internen Archivierung</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => passportCameraInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold border border-stone-250 transition-all shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1" />
                      <span>Scannen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => passportGalleryInputRef.current?.click()}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold border border-stone-250 transition-all shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>Datei wählen</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    ref={passportCameraInputRef}
                    onChange={handlePassportUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={passportGalleryInputRef}
                    onChange={handlePassportUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 border border-stone-200 rounded-xl p-3 bg-stone-50 min-h-[90px] items-center">
                  {passportPhotos.length === 0 ? (
                    <div className="col-span-4 py-4 text-center text-xs text-stone-400">
                      Keine Dokumentenscans.
                    </div>
                  ) : (
                    passportPhotos.map((base64, index) => (
                      <div key={index} className="relative aspect-square bg-stone-100 border border-stone-200 rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={base64} alt={`Document ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-amber-50/90 border border-amber-200 text-amber-700 text-[8px] font-bold flex items-center space-x-0.5 backdrop-blur-sm select-none">
                          <CloudOff className="w-2.5 h-2.5 text-amber-500" />
                          <span>Lokal</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deletePassportPhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Videos (max. 5, max. 5 Min., unter 200 MB)</h3>
                    <p className="text-[10px] text-stone-400">Direkter Cloud-Upload &amp; Offline-Speicherung (OPFS) unterstützt</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowVideoRecorder(true)}
                      disabled={!!compressingVideoName}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1" />
                      <span>Aufnehmen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => videoGalleryInputRef.current?.click()}
                      disabled={!!compressingVideoName}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold border border-stone-250 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>Galerie</span>
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
                  <span className="shrink-0 text-amber-600 font-bold">💡 Tipp:</span>
                  <span>
                    Direkt in der App aufgenommene Videos werden automatisch optimal komprimiert. Größere Videos aus der Galerie werden im Hintergrund verkleinert, oder du teilst sie vorab kurz per WhatsApp/Telegram, um sie sofort zu schrumpfen.
                  </span>
                </div>

                <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 space-y-2 min-h-[90px] flex flex-col justify-center">
                  {compressingVideoName && (
                    <div className="flex flex-col space-y-1.5 p-3 bg-brandpink-50/50 border border-brandpink-100 rounded-lg text-xs">
                      <div className="flex justify-between font-semibold text-brandpink-800">
                        <span className="truncate max-w-[250px]">Optimierung: {compressingVideoName}</span>
                        <span>{compressionProgress}%</span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-brandpink-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${compressionProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400">Video wird für den schnellen Upload verkleinert, bitte warten...</p>
                    </div>
                  )}

                  {videos.length === 0 ? (
                    <div className="py-4 text-center text-xs text-stone-400">
                      Keine Videos hochgeladen.
                    </div>
                  ) : (
                    videos.map((vid, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white border border-stone-200 rounded-lg text-xs shadow-sm">
                        <div className="flex items-center space-x-2 truncate">
                          {vid.isSynced ? (
                            <span title="Online hochgeladen" className="shrink-0 flex items-center">
                              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                            </span>
                          ) : (
                            <span title={vid.opfsKey ? "Lokal gesichert (OPFS) ⚡" : "Lokal gesichert (IndexedDB) 📦"} className="shrink-0 flex items-center">
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
                            className="p-1 text-red-650 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audio-Aufnahme (Sprachnotiz) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">Sprachnotizen ({audioItems.length}/10)</h3>
                    <p className="text-[10px] text-stone-400">Nimm bis zu 10 Sprachnotizen auf oder führe eine bestehende fort</p>
                  </div>
                  {!isRecording && audioItems.length < 10 && (
                    <button
                      type="button"
                      onClick={() => startRecording(null)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-brandpink-50 text-brandpink-700 border-brandpink-200/50 hover:bg-brandpink-100 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Neue Sprachnotiz</span>
                    </button>
                  )}
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
                  {isRecording ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-xs font-semibold text-red-500">
                          {recordingIndex !== null ? 'Hinzufügen läuft...' : 'Aufnahme läuft...'}
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
                        <span>Aufnahme stoppen & speichern</span>
                      </button>
                    </div>
                  ) : audioItems.length > 0 ? (
                    <div className="space-y-2">
                      {audioItems.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-stone-200 p-2.5 rounded-xl shadow-sm gap-2">
                          <div className="flex items-center space-x-2 flex-1">
                            <CloudOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-[10px] font-bold text-stone-500 min-w-[45px] shrink-0">Note #{index + 1}</span>
                            <audio src={item.url} controls className="w-full max-h-8 outline-none accent-brandpink-500" />
                          </div>
                          
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => startRecording(index)}
                              className="px-2 py-1 bg-stone-100 hover:bg-brandpink-55 hover:text-brandpink-700 text-stone-600 text-[10px] font-bold rounded border border-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Diese Sprachnotiz fortsetzen"
                            >
                              <Mic className="w-3 h-3 text-brandpink-500" />
                              <span>Fortsetzen</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAudio(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-stone-400">
                      Keine Sprachnotizen aufgenommen. Klicke oben auf &quot;Neue Sprachnotiz&quot;, um zu starten.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Action buttons (stick to bottom on mobile layout) */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-stone-200 backdrop-blur-md p-4 flex space-x-3 max-w-lg mx-auto z-40">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-250 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!!compressingVideoName}
              className="flex-1 flex items-center justify-center space-x-1.5 py-3.5 bg-brandpink-600 hover:bg-brandpink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brandpink-900/10 active:scale-98 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isOnline ? 'Speichern' : 'Lokal speichern'}</span>
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
