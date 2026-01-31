"use client";

import { useState, useEffect } from "react";
import { CardSlotState } from "@/lib/types";
import dynamic from 'next/dynamic';
const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), { ssr: false });

type PrintSlot = Pick<CardSlotState, 'id' | 'hasImage' | 'imagePreviewUrl' | 'crop' | 'zoom'>;

function loadPrintSlotsFromSession(): PrintSlot[] {
  if (typeof window === 'undefined') return [];
  const raw = sessionStorage.getItem('printSlots');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PrintSlot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export default function PrintPage() {
  const [slots, setSlots] = useState<PrintSlot[]>([]);

  const [isReadyToPrint, setIsReadyToPrint] = useState(false);

  useEffect(() => {
    setSlots(loadPrintSlotsFromSession().slice(0, 8));
  }, []);

  const eightSlots: PrintSlot[] = Array.from({ length: 8 }, (_, i) => {
    const s = slots[i];
    return (
      s ?? {
        id: i + 1,
        hasImage: false,
        imagePreviewUrl: null,
        crop: { x: 0, y: 0 },
        zoom: 1,
      }
    );
  });

  useEffect(() => {
    let cancelled = false;

    async function prepareAndPrint() {
      const hasAnyImage = eightSlots.some((s) => s.hasImage && !!s.imagePreviewUrl);
      if (!hasAnyImage) {
        return;
      }

      const imagesToLoad = eightSlots
        .filter((s) => s.hasImage && !!s.imagePreviewUrl)
        .map((s) => s.imagePreviewUrl!);

      await Promise.all(imagesToLoad.map((src) => preloadImage(src)));

      // necháme QR kódy vyrenderovat do DOM
      await new Promise((r) => setTimeout(r, 300));

      if (cancelled) return;
      setIsReadyToPrint(true);

      // počkáme ještě tick, pak print
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;
      window.print();
    }

    // tiskneme až po načtení slots ze sessionStorage (useEffect mount)
    if (!isReadyToPrint && slots.length > 0) {
      prepareAndPrint();
    }

    return () => {
      cancelled = true;
    };
  }, [eightSlots, isReadyToPrint, slots.length]);

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        body {
          background: #F5F5F5;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: #F5F5F5;
          }
          
          .no-print {
            display: none !important;
          }

          .print-actions {
            display: none !important;
          }
          
          .page-break {
            break-after: page;
          }

          .page-break:last-child {
            break-after: auto;
          }
          
          .print-grid {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 15mm;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: repeat(2, 85mm);
            grid-template-rows: repeat(4, 55mm);
            gap: 5mm;
            justify-content: center;
            align-items: center;
            page-break-inside: avoid;
          }
          
          .card {
            width: 85mm;
            height: 55mm;
            border: none;
            background: #F5F5F5;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-sizing: border-box;
            position: relative;
            box-shadow: none;
            page-break-inside: avoid;
          }
          
          .qr-card {
            background: #F5F5F5;
            flex-direction: column;
            gap: 2mm;
          }
          
          .qr-card svg {
            fill: #2D2D2A;
          }
          
          .qr-label {
            display: none;
          }
        }
        
        @media screen {
          .print-actions {
            width: 210mm;
            margin: 16px auto 0 auto;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          .print-btn {
            padding: 10px 16px;
            border-radius: 10px;
            background: #2D2D2A;
            color: #F5F5F5;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .print-btn:hover {
            opacity: 0.92;
          }

          .print-grid {
            width: 210mm;
            height: 297mm;
            margin: 20px auto;
            padding: 15mm;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            background: white;
            display: grid;
            grid-template-columns: repeat(2, 85mm);
            grid-template-rows: repeat(4, 55mm);
            gap: 5mm;
            justify-content: center;
            align-items: center;
            border: 2px dashed #ddd;
          }
          
          .card {
            width: 85mm;
            height: 55mm;
            border: none;
            background: #F5F5F5;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-sizing: border-box;
            position: relative;
            box-shadow: none;
          }
          
          .qr-card {
            background: #F5F5F5;
            flex-direction: column;
            gap: 2mm;
          }
          
          .qr-card svg {
            fill: #2D2D2A;
          }
          
          .qr-label {
            display: none;
          }
        }
      `}</style>

      <div className="print-actions">
        <button className="print-btn" onClick={() => window.print()}>
          TISK
        </button>
      </div>
      
      <div className="print-container">
        {/* První blok: Fotky v pořadí 1,2,3,4,5,6,7,8 */}
        <div className="page-break">
          <div className="print-grid">
            {eightSlots.map((slot, index) => {
              return (
                <div key={`front-${slot.id}`} className="card">
                  {slot.hasImage && slot.imagePreviewUrl ? (
                    <img 
                      src={slot.imagePreviewUrl} 
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${slot.crop?.x || 0}px, ${slot.crop?.y || 0}px) scale(${slot.zoom || 1})`,
                        objectPosition: 'center'
                      }}
                      alt={`Karta ${slot.id}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-white"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Druhý blok: QR kódy zrcadlově (4,3,2,1,8,7,6,5) */}
        <div className="page-break">
          <div className="print-grid">
            {[3, 2, 1, 0, 7, 6, 5, 4].map((slotIndex) => {
              const slot = eightSlots[slotIndex];
              return (
                <div key={`back-${slot.id}`} className="card qr-card">
                  <QRCodeSVG 
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://moje-karty.cz'}/karta/${slot.id}`} 
                    size={120} 
                    level="H"
                    bgColor="#F5F5F5"
                    fgColor="#2D2D2A"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
