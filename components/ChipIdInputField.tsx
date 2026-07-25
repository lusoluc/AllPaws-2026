'use client';

import { useState, useEffect, useRef } from 'react';
import { lookupChipInRegistries, RegistryLookupResult } from '@/lib/services/missingPetLookupService';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Globe, 
  Keyboard,
  Info,
  Check
} from 'lucide-react';

interface ChipIdInputFieldProps {
  value: string;
  onChange: (val: string) => void;
  onLookupComplete?: (result: RegistryLookupResult) => void;
  lang?: 'DE' | 'LT';
}

export default function ChipIdInputField({
  value,
  onChange,
  onLookupComplete,
  lang = 'DE'
}: ChipIdInputFieldProps) {
  const [lookupResult, setLookupResult] = useState<RegistryLookupResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [forceSoftKeyboard, setForceSoftKeyboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ISO 3166 3-digit country/manufacturer prefix check
  const sanitized = value.replace(/\D/g, '');
  const isValidLength = sanitized.length === 15;
  const prefix = sanitized.substring(0, 3);
  const countryName = prefix === '276' ? 'Deutschland (276)' : prefix === '440' ? 'Litauen (440)' : prefix.startsWith('9') ? 'Hersteller-Code (' + prefix + ')' : 'EU Code (' + prefix + ')';

  // Scanner Buffer Sanitizer & Auto-Trigger
  const handleInputChange = (raw: string) => {
    // Strip extraneous control characters (STX, ETX, CRLF, spaces)
    const cleaned = raw.replace(/\D/g, '');
    
    // Handle double scan buffer overrun (e.g. 30 digits) by taking first 15 digits
    const finalVal = cleaned.length > 15 ? cleaned.substring(0, 15) : cleaned;
    onChange(finalVal);

    if (finalVal.length === 15) {
      triggerLookup(finalVal);
    } else {
      setLookupResult(null);
    }
  };

  const triggerLookup = async (chipToLookup: string) => {
    setIsChecking(true);
    setLookupResult({
      chipId: chipToLookup,
      status: 'checking',
      matchedRegistries: [],
      scannedAt: new Date().toISOString()
    });

    const res = await lookupChipInRegistries(chipToLookup);
    setIsChecking(false);
    setLookupResult(res);
    if (onLookupComplete) {
      onLookupComplete(res);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {/* 🚨 REGISTRY MATCH & CONTACT INFO CARD - POSITIONED DIRECTLY ABOVE CHIP FIELD */}
      {lookupResult && lookupResult.status === 'foundRegistered' && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 animate-bounce" />
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                {lang === 'DE' ? '🚨 Registrierung & Notfall-Eintrag Gefunden!' : '🚨 Registracija ir dingusio gyvūno įrašas rastas!'}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-extrabold rounded-full">
              {lookupResult.matchedRegistries.join(', ')}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5 text-xs text-stone-800">
            {lookupResult.petName && (
              <div className="font-bold text-stone-900 text-sm">
                🐾 {lang === 'DE' ? 'Tier-Name:' : 'Vardas:'} <span className="text-brandpink-600">{lookupResult.petName}</span> ({lookupResult.petSpecies || 'Fellnase'})
              </div>
            )}
            {lookupResult.ownerName && (
              <div>
                👤 <span className="font-semibold">{lang === 'DE' ? 'Registrierter Halter:' : 'Savininkas:'}</span> {lookupResult.ownerName}
              </div>
            )}
            {lookupResult.ownerPhone && (
              <div className="flex items-center space-x-1 font-bold text-emerald-700">
                <Phone className="w-3.5 h-3.5" />
                <span>{lang === 'DE' ? 'Notfall-Kontakt:' : 'Tel. numeris:'} {lookupResult.ownerPhone}</span>
              </div>
            )}
            {lookupResult.ownerEmail && (
              <div className="flex items-center space-x-1 text-stone-600 text-[11px]">
                <Mail className="w-3.5 h-3.5" />
                <span>{lookupResult.ownerEmail}</span>
              </div>
            )}
          </div>

          {/* Direct Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {lookupResult.ownerPhone && (
              <a
                href={`tel:${lookupResult.ownerPhone}`}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 text-center"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{lang === 'DE' ? 'Halter anrufen' : 'Skambinti savininkui'}</span>
              </a>
            )}
            {lookupResult.ownerEmail && (
              <a
                href={`mailto:${lookupResult.ownerEmail}?subject=Aufnahme-Meldung%20Tierheim&body=Guten%20Tag,%20Ihr%20Tier%20mit%20Transponder-ID%20${sanitized}%20wurde%20im%20Tierheim%20aufgenommen.`}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 text-center"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{lang === 'DE' ? 'E-Mail senden' : 'Rašyti el. laišką'}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* CHIP UNFOUND / NOTIFICATION BADGE */}
      {lookupResult && lookupResult.status === 'notFound' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              {lang === 'DE' 
                ? 'Nicht in Vermissten-Datenbanken registriert. Wird automatisch bei TASSO / Europetnet indexiert.' 
                : 'Prieglaudos įrašas automatiškai indeksuojamas Europetnet / TASSO.'}
            </span>
          </div>
          <span className="px-2 py-0.5 bg-blue-200 text-blue-900 text-[10px] font-bold rounded">
            Auto-Index ⚡
          </span>
        </div>
      )}

      {/* CHIP INPUT FIELD LABEL & SOFT KEYBOARD TOGGLE */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center space-x-1.5">
          <span>{lang === 'DE' ? 'Mikrochip / Transponder ID (ISO 11784/11785)' : 'Mikroschemos / Transponderio ID'}</span>
        </label>
        <button
          type="button"
          onClick={() => {
            setForceSoftKeyboard(!forceSoftKeyboard);
            if (inputRef.current) inputRef.current.focus();
          }}
          className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center space-x-1 bg-stone-100 px-2 py-0.5 rounded border border-stone-200"
          title="Tastatur-Modus erzwingen"
        >
          <Keyboard className="w-3 h-3 text-stone-600" />
          <span>{forceSoftKeyboard ? (lang === 'DE' ? 'Soft-Tastatur an' : 'Klaviatūra įj.') : (lang === 'DE' ? 'Bluetooth Scanner' : 'Bluetooth skeneris')}</span>
        </button>
      </div>

      {/* INPUT BOX WITH LIVE BADGES & LOOKUP BUTTON */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          inputMode={forceSoftKeyboard ? 'numeric' : 'text'}
          pattern="[0-9]*"
          maxLength={15}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="z. B. 276098100123456 (15 Ziffern)"
          className={`w-full pl-3 pr-24 py-3 bg-white border-2 rounded-xl text-sm font-mono font-extrabold tracking-widest text-stone-900 focus:outline-none transition-all ${
            isValidLength 
              ? lookupResult?.status === 'foundRegistered'
                ? 'border-amber-400 focus:border-amber-500 bg-amber-50/20'
                : 'border-emerald-500 focus:border-emerald-600'
              : value.length > 0
              ? 'border-amber-300 focus:border-amber-400'
              : 'border-stone-300 focus:border-brandpink-500'
          }`}
        />

        {/* Action Controls & Badges inside Input */}
        <div className="absolute right-2 flex items-center space-x-1.5">
          {isChecking ? (
            <RefreshCw className="w-4 h-4 text-brandpink-600 animate-spin" />
          ) : isValidLength ? (
            <button
              type="button"
              onClick={() => triggerLookup(sanitized)}
              className="px-2.5 py-1 bg-brandpink-600 hover:bg-brandpink-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm flex items-center space-x-1"
            >
              <Search className="w-3 h-3" />
              <span>{lang === 'DE' ? 'Prüfen' : 'Tikrinti'}</span>
            </button>
          ) : (
            <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              {sanitized.length}/15
            </span>
          )}
        </div>
      </div>

      {/* HELPER TEXT & ISO ORIGIN BADGE */}
      {sanitized.length > 0 && (
        <div className="flex items-center justify-between text-[11px] px-1 text-stone-500">
          <span>ISO Prefix: <strong className="text-stone-700">{countryName}</strong></span>
          {!isValidLength && (
            <span className="text-amber-700 font-semibold">
              {15 - sanitized.length} {lang === 'DE' ? 'Ziffern fehlen' : 'skaitmenų trūksta'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
