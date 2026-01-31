"use client";

import { useState, useRef } from "react";
import { CardSlotState, SLOT_COUNT } from "@/lib/types";

export default function PrintPDFPage() {
  const [slots, setSlots] = useState<CardSlotState[]>(
    Array.from({ length: SLOT_COUNT }, (_, i) => ({
      id: i + 1,
      hasImage: false,
      hasVideo: false,
      hasAudio: false,
      imagePreviewUrl: null,
      audioPreviewUrl: null,
      videoPreviewUrl: null,
      imageFile: null,
      audioFile: null,
      videoFile: null,
      crop: { x: 0, y: 0 },
      zoom: 1
    }))
  );

  const printRef = useRef<HTMLDivElement>(null);

  // Převod mm na px pro A4 (210mm × 297mm při 96 DPI)
  const mmToPx = (mm: number) => (mm * 96) / 25.4;
  
  // Rozměry karet v mm
  const cardWidthMm = 85;
  const cardHeightMm = 55;
  
  // Rozměry karet v px
  const cardWidthPx = mmToPx(cardWidthMm);
  const cardHeightPx = mmToPx(cardHeightMm);
  
  // Mezery mezi kartami (mm)
  const gapMm = 5;
  const gapPx = mmToPx(gapMm);
  
  // Ořezové značky
  const cropMarkLength = 10; // mm
  const cropMarkWidth = 0.1; // pt

  // Filtrujeme pouze 8 karet pro tisk
  const eightSlots = slots.slice(0, 8);

  const handleImageUpdate = (id: number, data: Partial<CardSlotState>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, slotId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        handleImageUpdate(slotId, {
          hasImage: true,
          imagePreviewUrl: imageUrl,
          crop: { x: 0, y: 0 },
          zoom: 1
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = printRef.current.innerHTML;
        const printStyles = `
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .print-container {
              width: 210mm;
              height: 297mm;
              position: relative;
              background: white;
            }
            .card {
              position: absolute;
              width: ${cardWidthMm}mm;
              height: ${cardHeightMm}mm;
              overflow: hidden;
            }
            .card img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              object-position: center;
            }
            .qr-card {
              background-color: #F5F5F5;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .crop-mark {
              position: absolute;
              background-color: #9D9798;
              width: ${cropMarkWidth}pt;
            }
            .crop-mark-horizontal {
              height: ${cropMarkLength}mm;
            }
            .crop-mark-vertical {
              width: ${cropMarkLength}mm;
              height: ${cropMarkWidth}pt;
            }
          </style>
        `;
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tisk karet - Strana A (Fotky)</title>
              ${printStyles}
            </head>
            <body>
              <div class="print-container">
                ${generatePrintHTML('front')}
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Po tisku první strany vytiskneme druhou
        setTimeout(() => {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Tisk karet - Strana B (QR kódy)</title>
                ${printStyles}
              </head>
              <body>
                <div class="print-container">
                  ${generatePrintHTML('back')}
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
        }, 100);
      }
    }
  };

  const generatePrintHTML = (side: 'front' | 'back') => {
    let html = '';
    
    // Přidání ořezových značek
    for (let col = 0; col < 2; col++) {
      for (let row = 0; row < 4; row++) {
        const x = col * (cardWidthMm + gapMm);
        const y = row * (cardHeightMm + gapMm);
        
        // Vnější ořezové značky
        html += `<div class="crop-mark crop-mark-horizontal" style="left: ${x}mm; top: ${y - cropMarkLength}mm; width: ${cardWidthMm}mm;"></div>`;
        html += `<div class="crop-mark crop-mark-horizontal" style="left: ${x}mm; top: ${y + cardHeightMm}mm; width: ${cardWidthMm}mm;"></div>`;
        html += `<div class="crop-mark crop-mark-vertical" style="left: ${x - cropMarkLength}mm; top: ${y}mm; height: ${cardHeightMm}mm;"></div>`;
        html += `<div class="crop-mark crop-mark-vertical" style="left: ${x + cardWidthMm}mm; top: ${y}mm; height: ${cardHeightMm}mm;"></div>`;
      }
    }
    
    // Generování karet
    eightSlots.forEach((slot, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      let x, y;
      
      if (side === 'front') {
        // Strana A (fotky) - standardní řazení
        x = col * (cardWidthMm + gapMm);
        y = row * (cardHeightMm + gapMm);
      } else {
        // Strana B (QR kódy) - horizontální zrcadlení
        x = (1 - col) * (cardWidthMm + gapMm); // Zrcadlení sloupců
        y = row * (cardHeightMm + gapMm);
      }
      
      if (side === 'front') {
        // Strana s fotkami
        html += `
          <div class="card" style="left: ${x}mm; top: ${y}mm;">
            ${slot.hasImage && slot.imagePreviewUrl ? 
              `<img src="${slot.imagePreviewUrl}" alt="Karta ${slot.id}" />` : 
              `<div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #ccc;">Prázdná karta ${slot.id}</div>`
            }
          </div>
        `;
      } else {
        // Strana s QR kódy
        html += `
          <div class="card qr-card" style="left: ${x}mm; top: ${y}mm;">
            <div style="width: 35mm; height: 35mm;">
              <div style="width: 100%; height: 100%;">
                <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" fill="#F5F5F5"/>
                  <g fill="#2D2D2A">
                    <!-- Zjednodušený QR kód pro demo -->
                    <rect x="10" y="10" width="15" height="15"/>
                    <rect x="75" y="10" width="15" height="15"/>
                    <rect x="10" y="75" width="15" height="15"/>
                    <rect x="35" y="35" width="30" height="30" fill="none" stroke="#2D2D2A" stroke-width="2"/>
                    <text x="50" y="52" text-anchor="middle" fill="#2D2D2A" font-size="8" font-family="Arial">${slot.id}</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        `;
      }
    });
    
    return html;
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#D1D1D1' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#2D2D2A' }}>
          Tisk PDF pro oboustranný tisk
        </h1>
        
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3" style={{ color: '#2D2D2A' }}>
            Náhled tiskového rozvržení
          </h2>
          <p className="mb-4" style={{ color: '#2D2D2A' }}>
            Formát: A4 (210×297mm) • 8 karet (2×4) • Rozměr karty: 85×55mm
          </p>
          <button 
            onClick={handlePrint}
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: '#C89933', color: '#F5F5F5' }}
          >
            Generovat tiskové PDF 🖨️
          </button>
        </div>

        {/* Náhled karet pro upload */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {eightSlots.map((slot, index) => (
            <div key={slot.id} className="bg-white p-4 rounded-lg shadow">
              <div className="mb-3">
                <div className="w-full h-32 bg-gray-100 rounded mb-2 overflow-hidden">
                  {slot.hasImage && slot.imagePreviewUrl ? (
                    <img 
                      src={slot.imagePreviewUrl} 
                      className="w-full h-full object-cover" 
                      alt={`Karta ${slot.id}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9D9798" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-center" style={{ color: '#2D2D2A' }}>
                  Karta {slot.id}
                </p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileSelect(e, slot.id)}
                className="hidden"
                id={`file-${slot.id}`}
              />
              <label 
                htmlFor={`file-${slot.id}`}
                className="block w-full px-3 py-2 text-center rounded cursor-pointer transition-all duration-300 hover:scale-105 text-sm"
                style={{ backgroundColor: '#C89933', color: '#F5F5F5' }}
              >
                Nahrát fotku
              </label>
            </div>
          ))}
        </div>

        {/* Skrytý kontejner pro generování tiskového HTML */}
        <div ref={printRef} className="hidden">
          {generatePrintHTML('front')}
          {generatePrintHTML('back')}
        </div>
      </div>
    </div>
  );
}
