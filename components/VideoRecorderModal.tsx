import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Square, RefreshCw, AlertTriangle } from 'lucide-react';

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordComplete: (file: File) => void;
}

export default function VideoRecorderModal({ isOpen, onClose, onRecordComplete }: VideoRecorderModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera stream
  const startCamera = async (currentFacingMode: 'user' | 'environment') => {
    setError(null);
    // Stop existing stream tracks first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 }
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
    } catch (err: any) {
      console.error("Failed to access camera/microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Kamera- oder Mikrofon-Berechtigung wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.");
      } else {
        setError("Kamera konnte nicht gestartet werden. Bitte überprüfe, ob eine andere App sie blockiert.");
      }
    }
  };

  // Bind stream when it is set and the video preview element mounts
  useEffect(() => {
    if (stream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = stream;
      videoPreviewRef.current.play().catch(err => {
        console.error("Preview play failed:", err);
      });
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      startCamera(facingMode);
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, facingMode]);

  const cleanup = () => {
    document.body.style.overflow = '';
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    stopTimer();
    setIsRecording(false);
    setRecordingSeconds(0);
    recordedChunksRef.current = [];
    mediaRecorderRef.current = null;
  };

  // Helper to check supported mime types
  const getSupportedMimeType = (): string => {
    const types = [
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/quicktime'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    setError(null);

    const mimeType = getSupportedMimeType();
    try {
      const options = mimeType ? { mimeType, videoBitsPerSecond: 1200000 } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('quicktime') ? 'mov' : 'webm';
        const file = new File(
          [blob],
          `aufnahme_${Date.now()}.${ext}`,
          { type: mimeType || 'video/webm' }
        );
        onRecordComplete(file);
        onClose();
      };

      recorder.start(500); // chunk every 500ms
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      setError("Aufnahme konnte nicht gestartet werden. Mime-Type wird möglicherweise nicht unterstützt.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
    setIsRecording(false);
  };

  const startTimer = () => {
    stopTimer();
    setRecordingSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        const next = prev + 1;
        // Auto-stop at 5 minutes (300 seconds)
        if (next >= 300) {
          stopRecording();
          return 300;
        }
        return next;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const toggleFacingMode = () => {
    if (isRecording) return; // Disable camera flip while recording
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-stone-50 border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-stone-200 shrink-0">
          <h3 className="font-bold text-stone-800 flex items-center space-x-2 text-sm uppercase tracking-wide">
            <Camera className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Video aufnehmen</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isRecording}
            className="p-1 rounded-lg bg-stone-200 text-stone-500 hover:text-stone-900 border border-stone-300 transition-colors disabled:opacity-50"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Preview Area */}
        <div className="relative bg-stone-950 aspect-video flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-xs text-stone-300 font-semibold">{error}</p>
            </div>
          ) : !stream ? (
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-stone-400">Kamera wird geladen...</p>
            </div>
          ) : (
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Recording Timer Overlay */}
          {isRecording && (
            <div className="absolute top-3 left-3 bg-red-600/90 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-md">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
              <span>
                {Math.floor(recordingSeconds / 60)}:
                {(recordingSeconds % 60).toString().padStart(2, '0')} / 5:00
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-5 flex flex-col items-center space-y-4 shrink-0 bg-stone-100/50">
          <div className="flex items-center justify-center space-x-8 w-full">
            
            {/* Flip Camera Button */}
            <button
              type="button"
              onClick={toggleFacingMode}
              disabled={isRecording || !stream}
              className="p-3.5 bg-white text-stone-700 hover:text-stone-900 border border-stone-250 rounded-full transition-all shadow-sm active:scale-95 disabled:opacity-40"
              title="Kamera wechseln"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Record / Stop Button */}
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="p-5 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all shadow-lg active:scale-95 border-4 border-white flex items-center justify-center"
                title="Aufnahme stoppen"
              >
                <Square className="w-6 h-6 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={!stream}
                className="p-5 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 transition-all shadow-lg active:scale-95 border-4 border-white flex items-center justify-center disabled:opacity-50"
                title="Aufnahme starten"
              >
                <span className="w-6 h-6 bg-white rounded-full" />
              </button>
            )}

            {/* Empty element for symmetric spacing */}
            <div className="w-[48px]" />
          </div>

          <div className="text-center text-[10px] text-stone-400 font-medium max-w-xs leading-relaxed">
            Nimm ein kurzes, aussagekräftiges Video des Tiers auf. Die maximale Länge beträgt 5 Minuten.
          </div>
        </div>

      </div>
    </div>
  );
}
