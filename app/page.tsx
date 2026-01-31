"use client";

import { useState } from "react";
import { CardSlot } from "@/components/CardSlot";
import { CardSlotState, SLOT_COUNT } from "@/lib/types";
import dynamic from 'next/dynamic';
const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), { ssr: false });

// Funkce pro uložení do session (beze změny)
function savePrintSlotsToSession(slots: CardSlotState[]) {
  if (typeof window === 'undefined') return;
  const printSlots = slots.slice(0, 8).map((s) => ({
    id: s.id,
    hasImage: s.hasImage,
    imagePreviewUrl: s.imagePreviewUrl,
    crop: s.crop,
    zoom: s.zoom,
  }));
  sessionStorage.setItem('printSlots', JSON.stringify(printSlots));
}

export default function Home() {
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

  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  // OPRAVA: Nahrávání fotek nyní funguje lokálně v prohlížeči (stejně jako video)
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));

    setIsBatchUploading(true);

    const updatedSlots = [...slots];
    for (let index = 0; index < Math.min(sortedFiles.length, 8); index++) {
      const file = sortedFiles[index];
      const url = URL.createObjectURL(file); // Vytvoříme lokální odkaz místo nahrávání na server
      
      updatedSlots[index] = {
        ...updatedSlots[index],
        hasImage: true,
        imagePreviewUrl: url,
        imageFile: file,
        crop: { x: 0, y: 0 },
        zoom: 1,
      };
    }

    setSlots(updatedSlots);
    savePrintSlotsToSession(updatedSlots);
    setIsBatchUploading(false);
  };

  const handleImageUpdate = (id: number, data: Partial<CardSlotState>) => {
    setSlots((prev) => {
      const updatedSlots = prev.map((s) => s.id === id ? { ...s, ...data } : s);
      savePrintSlotsToSession(updatedSlots);
      return updatedSlots;
    });
  };

  const handleAudioSelect = (id: number, file: File) => {
    const url = URL.createObjectURL(file);
    setSlots((prev) => prev.map((s) =>
      s.id === id ? { ...s, hasAudio: true, audioPreviewUrl: url, audioFile: file } : s
    ));
  };

  const handleVideoSelect = (id: number, file: File) => {
    const url = URL.createObjectURL(file);
    setSlots((prev) => prev.map((s) =>
      s.id === id ? { ...s, hasVideo: true, videoPreviewUrl: url, videoFile: file } : s
    ));
  };

  // Zbytek kódu (renderování) zůstává stejný jako ve tvé verzi
  if (isPrintMode) {
    return (
      <div className="p-8 min-h-screen" style={{ backgroundColor: 'white' }}>
        <button onClick={() => setIsPrintMode(false)} className="mb-8 px-6 py-2 bg-stone-800 text-white rounded-lg print:hidden">
          ← Zpět do editoru
        </button>
        <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
          {slots.filter(s => s.hasImage || s.hasAudio || s.hasVideo).map(slot => (
            <div key={slot.id} className="flex items-center border-2 border-dashed border-stone-300 p-4 rounded-xl gap-8 page-break-inside-avoid">
              <div className="w-64 h-64 bg-stone-100 overflow-hidden relative rounded-lg border border-stone-200">
                {slot.hasImage && (
                  <img src={slot.imagePreviewUrl!} style={{ transform: `translate(${slot.crop?.x}px, ${slot.crop?.y}px) scale(${slot.zoom})`, position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
              <div className="h-64 border-l-2 border-dotted border-stone-400 flex items-center">
                <span className="bg-white px-2 text-stone-400 text-xs rotate-90">zde ohnout</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-white border border-stone-200 rounded-lg">
                  <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'https://moje-karty.cz'}/karta/${slot.id}`} size={150} />
                </div>
                <p className="text-stone-500 font-medium italic">Karta č. {slot.id}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center print:hidden">
          <button onClick={() => window.print()} className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition">
            Vytisknout karty 🖨️
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8" style={{ backgroundColor: '#D1D1D1' }}>
      <div className="max-w-6xl mx-auto" style={{ maxWidth: '1200px' }}>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold font-sans" style={{ color: '#2D2D2A' }}>Mluvící karty</h1>
            <p className="font-sans" style={{ color: '#2D2D2A' }}>Vytvořte si vlastní sadu karet s fotkou a zvukem</p>
          </div>
          <div className="flex gap-4">
            <input type="file" multiple accept="image/*" onChange={handleBatchUpload} className="hidden" id="batch-upload" />
            <button 
              onClick={() => document.getElementById('batch-upload')?.click()}
              disabled={isBatchUploading}
              className="px-6 py-3 font-bold rounded-xl shadow-md transition font-sans disabled:opacity-50"
              style={{ backgroundColor: isBatchUploading ? '#9D9798' : '#C89933', color: '#2D2D2A' }}
            >
              {isBatchUploading ? 'Zpracovávám...' : 'Nahrát sadu fotek (8) 📁'}
            </button>
            <button onClick={() => setIsPrintMode(true)} className="px-6 py-3 font-bold rounded-xl shadow-md transition font-sans" style={{ backgroundColor: '#C89933', color: '#2D2D2A' }}>
              Vytisknout 🖨️
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.slice(0, 8).map(slot => (
            <CardSlot key={slot.id} slot={slot} onImageUpdate={handleImageUpdate} onAudioSelect={handleAudioSelect} onVideoSelect={handleVideoSelect} audioAccept="audio/*" videoAccept="video/*" />
          ))}
        </div>
      </div>
    </main>
  );
}
