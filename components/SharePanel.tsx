'use client';

import { useState, useEffect, useRef } from 'react';
import { Animal, formatAge } from '@/lib/db';
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  Facebook, 
  Mail,
  Upload
} from 'lucide-react';

interface SharePanelProps {
  animal: Animal;
  onClose: () => void;
}

export default function SharePanel({ animal, onClose }: SharePanelProps) {
  const [lang, setLang] = useState<'DE' | 'LT'>('DE');
  const [copied, setCopied] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  
  // New States for Social Graphic
  const [activeTab, setActiveTab] = useState<'text' | 'graphic'>('text');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate Facebook/WhatsApp Post Template
  const generatePostText = () => {
    const activeTraits: string[] = [];
    if (animal.trait_cuddly === 'JA' || (animal.trait_cuddly as any) === true) {
      activeTraits.push(lang === 'DE' ? 'verschmust' : 'meilus (-i)');
    }
    if (animal.trait_playful === 'JA' || (animal.trait_playful as any) === true) {
      activeTraits.push(lang === 'DE' ? 'verspielt' : 'žaismingas (-a)');
    }
    if (animal.trait_curious === 'JA' || (animal.trait_curious as any) === true) {
      activeTraits.push(lang === 'DE' ? 'neugierig' : 'smalsus (-i)');
    }
    if (animal.trait_trusting) {
      activeTraits.push(lang === 'DE' ? 'zutraulich' : 'patiklus (-i)');
    }
    if (animal.trait_people_oriented) {
      activeTraits.push(lang === 'DE' ? 'sehr menschenbezogen' : 'labai orientuotas (-a) į žmones');
    }
    if (animal.trait_active) {
      activeTraits.push(lang === 'DE' ? 'aktiv' : 'aktyvus (-i)');
    }
    if (animal.trait_fearful === 'JA' || (animal.trait_fearful as any) === true) {
      activeTraits.push(lang === 'DE' ? 'ängstlich / unsicher' : 'baimingas (-a) / nesaugus (-i)');
    }

    const traits = activeTraits.join(', ');
    const traitsLineDe = traits ? `Über mich: Ich bin ${traits}! 💕` : '';
    const traitsLineLt = traits ? `Koks aš esu: aš esu ${traits}! 💕` : '';

    // Adoption/housing criteria
    const activeReqs: string[] = [];
    if (animal.slow_integration) activeReqs.push(lang === 'DE' ? 'langsame Zusammenführung' : 'lėtas supažindinimas');
    if (animal.partner_needed) activeReqs.push(lang === 'DE' ? 'Vermittlung mit Partner' : 'reikalingas antram gyvūnui');
    if (animal.no_single_animal) activeReqs.push(lang === 'DE' ? 'keine Einzelhaltung' : 'ne vienišas laikymas');
    if (animal.needs_outdoor) activeReqs.push(lang === 'DE' ? 'braucht Freigang' : 'reikia lauko sąlygų');
    if (animal.indoor_only) activeReqs.push(lang === 'DE' ? 'nur Wohnungshaltung' : 'tik bute');
    if (animal.secured_balcony) activeReqs.push(lang === 'DE' ? 'gesicherter Balkon' : 'apsaugotas balkonas');
    if (animal.for_beginners) activeReqs.push(lang === 'DE' ? 'für Anfänger geeignet' : 'tinka pradedantiesiems');
    if (animal.for_experienced) activeReqs.push(lang === 'DE' ? 'für katzenerfahrene Menschen' : 'tinka turintiems patirties');
    if (animal.no_small_children) activeReqs.push(lang === 'DE' ? 'keine kleinen Kinder' : 'be mažų vaikų');
    if (animal.suitable_families) activeReqs.push(lang === 'DE' ? 'familiengeeignet' : 'tinka šeimai');

    const requirementsText = activeReqs.length > 0 
      ? (lang === 'DE' ? `🏡 Mein Traumzuhause: ${activeReqs.join(', ')}` : `🏡 Mano svajonių namai: ${activeReqs.join(', ')}`)
      : '';

    const medicalDe = `Gechipt: ${animal.is_chipped ? 'Ja' : 'Nein'} | Kastriert: ${animal.is_castrated ? 'Ja' : 'Nein'} | EU-Ausweis: ${animal.has_eu_passport ? 'Ja' : 'Nein'}`;
    const medicalLt = `Paženklintas: ${animal.is_chipped ? 'Taip' : 'Ne'} | Kastruotas: ${animal.is_castrated ? 'Taip' : 'Ne'} | ES pasas: ${animal.has_eu_passport ? 'Taip' : 'Ne'}`;

    if (lang === 'DE') {
      return `🐈 ICH SUCHE DICH! MEIN NAME IST ${animal.name} 🐾

Hallo... hörst du mich? Ich sitze im Tierheim in Litauen und hoffe so sehr, dass mich jemand sieht. Ich bin ${formatAge(animal, 'DE')} alt und bereit, mein ganzes Katzenherz zu verschenken.

📍 Mein aktueller Aufenthaltsort: VšĮ "Būk mano draugas" (Klaipėda, Litauen)
${traitsLineDe ? `\n✨ ${traitsLineDe}` : ''}${requirementsText ? `\n${requirementsText}` : ''}
🩺 Mein Gesundheits-Check:
${medicalDe}

📖 Meine Geschichte:
"${animal.reason_for_shelter || 'Ich wurde auf der Straße gefunden und warte nun voller Hoffnung im Tierheim.'}"

Wer schenkt mir ein warmes Plätzchen und ganz viel Liebe? 🏡 Bitte teilt meinen Beitrag, damit mich mein Herzensmensch findet!
📧 Anfragen an: Tierheimbmg@gmail.com

#AdoptDontShop #Katzenhilfe #TierheimKatze #BukManoDraugas`;
    } else {
      return `🐈 AŠ LABAI TAVĘS LAUKIU! MANO VARDAS ${animal.name} 🐾

Labas... Ar matai mane? Aš esu prieglaudoje ir labai tikiuosi rasti savo tikruosius namus. Man yra ${formatAge(animal, 'LT')} ir aš labai noriu tapti tavo geriausiu draugu.

📍 Kur aš esu: VšĮ „Būk mano draugas“ (Klaipėdos raj.)
${traitsLineLt ? `\n✨ ${traitsLineLt}` : ''}${requirementsText ? `\n${requirementsText}` : ''}
🩺 Mano sveikatos būklė:
${medicalLt}

📖 Mano istorija:
„${animal.reason_for_shelter || 'Buvau rastas gatvėje ir priglaustas prieglaudoje. Dabar laukiu tavęs.'}“

Kas nori pasidalinti savo namų šiluma ir meile su manimi? 🏡 Prašau pasidalinti šiuo įrašu – padėkite man rasti namus!
📧 Užklausos el. paštu: bukmanodraugas@inbox.lt

#BeglobiaiGyvunai #BukManoDraugas #IeskoNamu`;
    }
  };

  const postText = generatePostText();
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/katzen/${animal.id}` : '';

  // Helpers for text wrapping inside canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  // Draw paw graphics
  const drawSinglePaw = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - r * 0.9, cy - r * 0.9, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.3, cy - r * 1.3, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 1.3, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.9, cy - r * 0.9, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPaws = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = 'rgba(217, 70, 239, 0.05)'; // soft pink primary color accent
    drawSinglePaw(ctx, 980, 150, 30);
    drawSinglePaw(ctx, 880, 750, 45);
    ctx.restore();
  };

  // Draw texts on canvas
  const drawTexts = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // 1. Category/Status Badge
    const isEmergency = !!animal.is_emergency;
    const badgeColor = isEmergency ? '#EF4444' : '#DB2777'; // red or pink
    const badgeText = isEmergency 
      ? (lang === 'DE' ? 'NOTFALL 🚨' : 'SKUBUS 🚨')
      : (lang === 'DE' ? 'SUCHT EIN ZUHAUSE 🏡' : 'IEŠKO NAMŲ 🏡');
      
    ctx.fillStyle = badgeColor;
    const badgeX = 540;
    const badgeY = 120;
    const badgeW = isEmergency ? 200 : 380;
    const badgeH = 54;
    const badgeR = 27;
    
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + 24, badgeY + badgeH / 2);
    
    // 2. Name of Kätzchen
    ctx.fillStyle = '#1C1917'; // Stone-900
    ctx.font = 'bold 96px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(animal.name.toUpperCase(), 540, 270);
    
    // 3. Sub-info (Age, Gender)
    ctx.fillStyle = '#78716C'; // Stone-500
    ctx.font = '600 32px system-ui, -apple-system, sans-serif';
    const ageStr = formatAge(animal, lang);
    const genderStr = animal.gender === 'Weiblich' 
      ? (lang === 'DE' ? 'Weiblich' : 'Patelė') 
      : (lang === 'DE' ? 'Männlich' : 'Patinas');
    ctx.fillText(`${ageStr} • ${genderStr}`, 540, 330);
    
    // 4. Quote / Story
    const quoteText = animal.reason_for_shelter || (lang === 'DE' ? 'Ich wurde auf der Straße gefunden und warte nun voller Hoffnung.' : 'Buvau rastas gatvėje ir priglaustas prieglaudoje. Dabar laukiu tavęs.');
    
    // Draw quote vertical line
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.2)'; 
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(540, 380);
    ctx.lineTo(540, 540);
    ctx.stroke();
    
    ctx.fillStyle = '#44403C'; // Stone-700
    ctx.font = 'italic 24px system-ui, -apple-system, sans-serif';
    
    const lines = wrapText(ctx, `"${quoteText}"`, 480);
    let currentY = 415;
    lines.slice(0, 5).forEach((line) => {
      ctx.fillText(line, 555, currentY);
      currentY += 32;
    });
    
    // 5. Traits Bullet Points
    let traitsY = 600;
    const traits = [
      { label: lang === 'DE' ? 'Kastriert' : 'Kastruotas', val: animal.is_castrated },
      { label: lang === 'DE' ? 'Gechipt' : 'Paženklintas', val: animal.is_chipped },
      { label: lang === 'DE' ? 'EU-Pass' : 'ES pasas', val: animal.has_eu_passport }
    ];
    
    traits.forEach((t) => {
      // Draw tick circle
      ctx.fillStyle = t.val ? '#10B981' : '#78716C'; 
      ctx.beginPath();
      ctx.arc(555, traitsY - 8, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw checkmark or dash inside circle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (t.val) {
        ctx.moveTo(549, traitsY - 9);
        ctx.lineTo(553, traitsY - 5);
        ctx.lineTo(561, traitsY - 13);
      } else {
        ctx.moveTo(550, traitsY - 8);
        ctx.lineTo(560, traitsY - 8);
      }
      ctx.stroke();
      
      // Write label
      ctx.fillStyle = '#1C1917';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(t.label, 580, traitsY);
      
      traitsY += 45;
    });
    
    // 6. Call to Action (CTA)
    ctx.fillStyle = '#DB2777'; // BMG brandpink
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    const ctaText = lang === 'DE' ? 'WERD TEIL DER RETTUNGSCREW 🐾' : 'TAPK GELBĖTOJŲ KOMANDOS DALIMI 🐾';
    ctx.fillText(ctaText, 540, 840);
    
    // 7. Footer
    ctx.strokeStyle = 'rgba(120, 113, 108, 0.2)'; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(540, 890);
    ctx.lineTo(1020, 890);
    ctx.stroke();
    
    ctx.fillStyle = '#78716C'; 
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('VšĮ "Būk mano draugas"', 540, 930);
    
    ctx.font = '500 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(lang === 'DE' 
      ? 'Anfragen an: Tierheimbmg@gmail.com' 
      : 'Užklausos: bukmanodraugas@inbox.lt', 
      540, 965
    );
    
    ctx.fillText(lang === 'DE' 
      ? 'Website: bukmanodraugas.lt/en' 
      : 'Svetainė: bukmanodraugas.lt', 
      540, 995
    );
    
    ctx.restore();
  };

  // Canvas drawing lifecycle
  useEffect(() => {
    if (activeTab === 'graphic') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, 1080, 1080);
      
      // Fill canvas background
      ctx.fillStyle = '#FAFAF9';
      ctx.fillRect(0, 0, 1080, 1080);
      
      const img = new Image();
      let photoUrl = animal.media_urls?.[selectedPhotoIndex];
      
      if (photoUrl) {
        if (photoUrl.startsWith('http')) {
          img.crossOrigin = 'anonymous';
          // Append cache buster to prevent browser cache CORS issues
          photoUrl = photoUrl + (photoUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();
        }
        img.src = photoUrl;
      } else {
        // Fallback cozy hero image
        img.src = '/cozy_cat_hero_1782045725824.png';
      }

      const completeDrawing = () => {
        // Draw border line
        ctx.strokeStyle = '#D946EF'; 
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(500, 0);
        ctx.lineTo(420, 1080);
        ctx.stroke();
        
        // Draw right half background (warm pastel pink primary tint: #FDF2F8)
        ctx.save();
        ctx.fillStyle = '#FDF2F8';
        ctx.beginPath();
        ctx.moveTo(500, 0);
        ctx.lineTo(1080, 0);
        ctx.lineTo(1080, 1080);
        ctx.lineTo(420, 1080);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        drawPaws(ctx);
        drawTexts(ctx);
      };

      img.onload = () => {
        // Draw photo in clipped area (left column)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(500, 0);
        ctx.lineTo(420, 1080);
        ctx.lineTo(0, 1080);
        ctx.closePath();
        ctx.clip();
        
        const imgRatio = img.width / img.height;
        const targetWidth = 500;
        const targetHeight = 1080;
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;
        
        if (imgRatio > targetWidth / targetHeight) {
          drawWidth = targetHeight * imgRatio;
          offsetX = (targetWidth - drawWidth) / 2;
        } else {
          drawHeight = targetWidth / imgRatio;
          offsetY = (targetHeight - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
        
        completeDrawing();
      };

      img.onerror = () => {
        // Fallback solid light background if image fails
        ctx.save();
        ctx.fillStyle = '#FFF1F2'; 
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(500, 0);
        ctx.lineTo(420, 1080);
        ctx.lineTo(0, 1080);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        completeDrawing();
      };
    }
  }, [activeTab, selectedPhotoIndex, lang, animal]);

  // Copy text template to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    setShareNotification(lang === 'DE' ? 'Beschreibung kopiert!' : 'Aprašymas nukopijuotas!');
    setTimeout(() => {
      setCopied(false);
      setShareNotification(null);
    }, 2000);
  };

  // Trigger Native Web Share API
  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Adoptionsaufruf: ${animal.name}`,
          text: postText,
          url: shareUrl
        });
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          console.error('Web Share failed', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  // Social Share Handlers
  const handleShareInstagram = () => {
    navigator.clipboard.writeText(postText);
    setShareNotification(lang === 'DE' 
      ? 'Post-Text kopiert! Leite zu Instagram weiter... 📸' 
      : 'Nukopijuota! Nukreipiama į „Instagram“... 📸'
    );
    setTimeout(() => {
      setShareNotification(null);
      window.open('https://www.instagram.com/', '_blank');
    }, 1500);
  };

  const handleShareTikTok = () => {
    navigator.clipboard.writeText(shareUrl);
    setShareNotification(lang === 'DE' 
      ? 'Link kopiert! Leite zu TikTok weiter... 🎵' 
      : 'Nuoroda nukopijuota! Nukreipiama į „TikTok“... 🎵'
    );
    setTimeout(() => {
      setShareNotification(null);
      window.open('https://www.tiktok.com/', '_blank');
    }, 1500);
  };

  // Dynamic Graphic Actions
  const handleDownloadGraphic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `adopt_${animal.name.toLowerCase()}_social.png`;
      link.href = dataUrl;
      link.click();
      
      setShareNotification(lang === 'DE' 
        ? 'Grafik-Download gestartet! 📥' 
        : 'Atsisiuntimas pradėtas! 📥'
      );
      setTimeout(() => setShareNotification(null), 3000);
    } catch (err) {
      console.error('Failed to export canvas', err);
      setShareNotification(lang === 'DE' ? 'Download-Fehler!' : 'Klaida siunčiant!');
      setTimeout(() => setShareNotification(null), 3000);
    }
  };

  const handleShareGraphic = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `adopt_${animal.name.toLowerCase()}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Adoptionsaufruf: ${animal.name}`,
              text: lang === 'DE' ? `Schenk ${animal.name} ein Zuhause! 🐾` : `Suteik namus ${animal.name}! 🐾`
            });
          } catch (shareErr) {
            if ((shareErr as any).name !== 'AbortError') {
              console.error('Web Share failed', shareErr);
              handleDownloadGraphic();
            }
          }
        } else {
          handleDownloadGraphic();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to share graphic', err);
      handleDownloadGraphic();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-stone-900 animate-fade-in">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/80 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-brandpink-500" />
            <h3 className="font-bold text-sm text-stone-900">Social-Media Export: {animal.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs selector */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'text' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
            >
              Text-Vorlage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('graphic')}
              className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'graphic' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
            >
              Grafik-Beitrag
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Language selector */}
          <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <span className="text-xs text-stone-500 font-semibold">Sprache des Posts:</span>
            <div className="flex space-x-1 bg-white p-0.5 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setLang('DE')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${lang === 'DE' ? 'bg-brandpink-500 text-white' : 'text-stone-500'}`}
              >
                DE
              </button>
              <button
                type="button"
                onClick={() => setLang('LT')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${lang === 'LT' ? 'bg-brandpink-500 text-white' : 'text-stone-500'}`}
              >
                LT
              </button>
            </div>
          </div>

          {activeTab === 'text' ? (
            <>
              {/* Social Icons row */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Direkt teilen / Pasidalinti</span>
                <div className="flex space-x-2.5">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(postText + '\n\nMehr Infos: ' + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#25D366] text-white hover:bg-[#20ba56] transition-colors cursor-pointer"
                    title="WhatsApp"
                  >
                    <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 0 0-6.98-2.879C6.222 1.01 1.797 5.381 1.793 10.81c-.001 1.639.425 3.24 1.232 4.679l-.992 3.626 3.716-.975zM17.47 15.39c-.3-.15-1.77-.874-2.04-.972-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.18.2-.35.22-.65.07-1.125-.56-1.92-1.077-2.69-2.39-.2-.35.2-.32.57-1.07.1-.2.05-.38-.02-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.11 3.22 5.11 4.52.71.31 1.27.5 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3 0-1.42-.05-.15-.25-.22-.55-.37z"/>
                    </svg>
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1877F2] text-white hover:bg-[#166fe5] transition-colors cursor-pointer"
                    title="Facebook"
                  >
                    <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  <button
                    type="button"
                    onClick={handleShareInstagram}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:opacity-90 transition-opacity cursor-pointer"
                    title="Instagram"
                  >
                    <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareTikTok}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white hover:bg-stone-900 transition-colors cursor-pointer"
                    title="TikTok"
                  >
                    <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.94-1.78-.22-.22-.41-.47-.58-.73v7.02c0 1.87-.45 3.76-1.57 5.21-1.63 2.11-4.32 3.19-6.93 2.87-2.61-.31-4.99-2.07-5.91-4.54-.92-2.47-.53-5.38 1.02-7.46 1.48-1.99 3.97-3.04 6.46-2.77v4.14c-1.6-.33-3.37.33-4.17 1.76-.79 1.43-.54 3.32.58 4.45 1.13 1.13 3.01 1.25 4.28.28 1.01-.77 1.34-2.14 1.34-3.39V0z"/>
                    </svg>
                  </button>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(lang === 'DE' ? `Hilfe für ${animal.name} gesucht!` : `Ieškoma pagalba katei ${animal.name}!`)}&body=${encodeURIComponent(postText + '\n\nLink: ' + shareUrl)}`}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-600 text-white hover:bg-stone-700 transition-colors cursor-pointer"
                    title="Email"
                  >
                    <Mail className="w-4.5 h-4.5" />
                  </a>
                </div>
              </div>

              {/* Social Textbox Area */}
              <div className="relative border border-stone-200 rounded-xl bg-stone-50 p-4 font-mono text-[11px] text-stone-700 leading-relaxed min-h-[160px] whitespace-pre-wrap select-all">
                {postText}
              </div>
            </>
          ) : (
            <>
              {/* Graphic Canvas Area */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                <canvas
                  ref={canvasRef}
                  width={1080}
                  height={1080}
                  className="w-full max-w-[280px] aspect-square mx-auto border border-stone-200 rounded-xl shadow-md bg-white select-none"
                />
              </div>

              {/* Photo selector (Thumbnails) */}
              {animal.media_urls && animal.media_urls.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Foto für Beitrag wählen
                  </span>
                  <div className="flex space-x-2 overflow-x-auto pb-1 max-w-full">
                    {animal.media_urls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          selectedPhotoIndex === idx 
                            ? 'border-brandpink-500 ring-2 ring-brandpink-100 scale-95 shadow-sm' 
                            : 'border-stone-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Notification feedback bar */}
          {shareNotification && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[10px] rounded-lg animate-fade-in font-medium">
              {shareNotification}
            </div>
          )}
          
        </div>

        {/* Modal Footer (Daumen-optimiert) */}
        <div className="p-4 bg-stone-50 border-t border-stone-150 flex space-x-2.5">
          {activeTab === 'text' ? (
            <>
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center space-x-1.5 py-3.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Text kopieren</span>
                  </>
                )}
              </button>

              <button
                onClick={handleWebShare}
                className="flex-1 flex items-center justify-center space-x-1.5 py-3.5 bg-brandpink-500 hover:bg-brandpink-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Teilen</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDownloadGraphic}
                className="flex-1 flex items-center justify-center space-x-1.5 py-3.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 rotate-180" />
                <span>Herunterladen</span>
              </button>

              <button
                onClick={handleShareGraphic}
                className="flex-1 flex items-center justify-center space-x-1.5 py-3.5 bg-brandpink-500 hover:bg-brandpink-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Grafik teilen</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
