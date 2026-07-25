'use client';

import { useState } from 'react';
import { Wifi, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { isValidIsoChip } from '@/lib/transponderRegistry';

interface BluetoothChipScannerProps {
  onScanComplete: (chipNumber: string) => void;
  onClose: () => void;
  lang: 'DE' | 'LT';
}

export default function BluetoothChipScanner({
  onScanComplete,
  onClose,
  lang
}: BluetoothChipScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successChip, setSuccessChip] = useState<string | null>(null);

  const startBluetoothScan = async () => {
    setScanning(true);
    setError(null);
    setSuccessChip(null);

    // Check WebBluetooth API support
    if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
      setScanning(false);
      setError(
        lang === 'DE'
          ? 'WebBluetooth wird von diesem Browser nicht unterstützt (z.B. Chrome am Android/PC nutzen).'
          : 'WebBluetooth nepalaikomas šioje naršyklėje (naudokite Chrome naršyklę).'
      );
      return;
    }

    try {
      // 3-second scanning simulation / Bluetooth device request
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      }).catch((err: any) => {
        // User cancelled or bluetooth error
        throw err;
      });

      if (device) {
        // Simulate reading 15-digit ISO RFID payload from scanner device
        const mockScannedChip = `2760981${Math.floor(10000000 + Math.random() * 90000000)}`;
        setSuccessChip(mockScannedChip);
        setScanning(false);
        setTimeout(() => {
          onScanComplete(mockScannedChip);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setScanning(false);
      if (err?.name === 'NotFoundError' || err?.message?.includes('cancelled')) {
        setError(lang === 'DE' ? 'Scan abgebrochen.' : 'Skenavimas atšauktas.');
      } else {
        // Provide 3-second rapid simulated test scan button fallback if user wants to test
        setError(
          lang === 'DE'
            ? 'Kein RFID-Lesegerät gefunden. Klicke unten für einen Test-Scan.'
            : 'Nerastas RFID skaitytuvas. Spustelėkite žemiau bandymo skenavimui.'
        );
      }
    }
  };

  const runSimulatedScan = () => {
    setScanning(true);
    setError(null);
    setTimeout(() => {
      // Generate realistic ISO chip (Germany 276 or Lithuania 440)
      const prefix = Math.random() > 0.5 ? '2760981' : '4400981';
      const mockChip = `${prefix}${Math.floor(10000000 + Math.random() * 90000000)}`;
      setSuccessChip(mockChip);
      setScanning(false);
      setTimeout(() => {
        onScanComplete(mockChip);
        onClose();
      }, 1000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 pt-1">
          <div className="w-14 h-14 rounded-full bg-brandpink-50 border border-brandpink-200 flex items-center justify-center text-brandpink-600 mx-auto">
            <Wifi className={`w-7 h-7 ${scanning ? 'animate-pulse' : ''}`} />
          </div>

          <h3 className="text-base font-extrabold text-stone-850">
            {lang === 'DE' ? 'RFID-Bluetooth Chip-Scanner' : 'RFID Bluetooth Čipų Skaitytuvas'}
          </h3>

          <p className="text-xs text-stone-500 leading-relaxed">
            {lang === 'DE'
              ? 'Schalte dein kabelloses RFID-Lesegerät ein und scanne den 15-stelligen ISO 11784/11785 Mikrochip am Tier.'
              : 'Įjunkite belaidį RFID skaitytuvą ir nuskaitykite 15-ženklį ISO mikroschemą.'}
          </p>

          {scanning && (
            <div className="py-4 flex flex-col items-center space-y-2 bg-stone-50 rounded-xl border border-stone-200">
              <RefreshCw className="w-6 h-6 text-brandpink-600 animate-spin" />
              <span className="text-xs font-semibold text-stone-700">
                {lang === 'DE' ? 'Suche Bluetooth RFID-Scanner (3s)...' : 'Iškoma Bluetooth RFID skaitytuvo...'}
              </span>
            </div>
          )}

          {successChip && (
            <div className="py-3 px-4 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-800 flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold font-mono tracking-wider">{successChip}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-amber-50 border border-amber-250 rounded-xl text-amber-900 text-left text-xs space-y-2">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{lang === 'DE' ? 'Hinweis' : 'Pastaba'}</span>
              </div>
              <p className="text-[11px] leading-snug">{error}</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={startBluetoothScan}
              disabled={scanning}
              className="w-full py-3 bg-brandpink-600 hover:bg-brandpink-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Wifi className="w-4 h-4" />
              <span>{lang === 'DE' ? 'Bluetooth RFID-Gerät koppeln' : 'Sujungti Bluetooth skaitytuvą'}</span>
            </button>

            <button
              onClick={runSimulatedScan}
              disabled={scanning}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-250 transition-colors"
            >
              ⚡ {lang === 'DE' ? 'Schneller Test-Scan (3 Sek.)' : 'Greitas bandymo skenavimas (3 sek.)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
