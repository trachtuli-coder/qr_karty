"use client";

import { useRef, useState, useEffect } from "react";
import { CardSlotState } from "@/lib/types";

interface CardSlotProps {
  slot: CardSlotState;
  onImageUpdate: (id: number, data: Partial<CardSlotState>) => void;
  onAudioSelect: (id: number, file: File) => void;
  onVideoSelect: (id: number, file: File) => void;
  audioAccept: string;
  videoAccept: string;
}

 async function uploadFile(file: File): Promise<string> {
   const formData = new FormData();
   formData.append('file', file);

   const res = await fetch('/api/upload', {
     method: 'POST',
     body: formData,
   });

   if (!res.ok) {
     throw new Error('Upload failed');
   }

   const data = (await res.json()) as { url: string };
   return data.url;
 }

export function CardSlot({ 
  slot, 
  onImageUpdate, 
  onAudioSelect, 
  onVideoSelect,
  audioAccept,
  videoAccept 
}: CardSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(30); // 30 sekund
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Timer pro nahrávání
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && recordingTime < maxRecordingTime) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxRecordingTime - 1) {
            handleStopRecording();
            return maxRecordingTime;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTime, maxRecordingTime]);

  // Cleanup při unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  // Načíst uložené hodnoty při inicializaci
  useEffect(() => {
    if (slot.crop) {
      setDragStart({ x: slot.crop.x, y: slot.crop.y });
    }
  }, [slot.crop]);

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try {
        mediaRecorder.stop();
        console.log('MediaRecorder stopped successfully');
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }
    setIsRecording(false);
    setIsProcessing(true);
    setRecordingTime(0);
  };

  const handleMicrophoneClick = async () => {
    if (isRecording) {
      // Zastavit nahrávání
      handleStopRecording();
    } else {
      // Začít nahrávání
      try {
        console.log('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
        
        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = () => {
          console.log('MediaRecorder stopped, processing audio...');
          const audioBlob = new Blob(chunks, { 
            type: recorder.mimeType || 'audio/webm' 
          });
          
          // Vytvořit soubor z blobu
          const audioFile = new File([audioBlob], `recording_${slot.id}.webm`, { 
            type: recorder.mimeType || 'audio/webm' 
          });
          
          // Zastavit stream
          stream.getTracks().forEach(track => track.stop());
          
          // Zavolat callback
          onAudioSelect(slot.id, audioFile);
          setIsProcessing(false);
          setMediaRecorder(null);
        };
        
        recorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setIsRecording(false);
          setIsProcessing(false);
          setRecordingTime(0);
          stream.getTracks().forEach(track => track.stop());
        };
        
        // Začít nahrávání
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingTime(0);
        setIsProcessing(false);
        console.log('Recording started successfully');
        
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setIsRecording(false);
        setIsProcessing(false);
        setRecordingTime(0);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    try {
      const url = await uploadFile(file);
      onImageUpdate(slot.id, {
        hasImage: true,
        imagePreviewUrl: url,
        imageFile: file,
        crop: { x: 0, y: 0 },
        zoom: 1
      });
    } catch {
      // ignore
    }
  };

  const handleZoomChange = (newZoom: number) => {
    if (slot.hasImage) {
      onImageUpdate(slot.id, {
        ...slot,
        zoom: newZoom
      });
    }
  };

  const handleCropChange = (newCrop: { x: number; y: number }) => {
    if (slot.hasImage) {
      onImageUpdate(slot.id, {
        ...slot,
        crop: newCrop
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const currentCrop = slot.crop || { x: 0, y: 0 };
    setDragStart({
      x: e.clientX - currentCrop.x,
      y: e.clientY - currentCrop.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newCrop = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    handleCropChange(newCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const currentZoom = slot.zoom || 1;
    const newZoom = Math.max(0.5, Math.min(3, currentZoom + delta));
    handleZoomChange(newZoom);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newCrop = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      handleCropChange(newCrop);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, dragStart]);

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ 
      backgroundColor: '#D1D1D1'
    }}>
      <div className="rounded-lg overflow-hidden relative" style={{ 
        width: '300px', 
        height: '400px',
        backgroundColor: '#f5f5f5',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        
        {/* ZOBRAZENÍ OBSAHU KARTY */}
        {slot.hasVideo && slot.videoPreviewUrl ? (
          <video src={slot.videoPreviewUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : slot.hasImage && slot.imagePreviewUrl ? (
          <div className="relative w-full h-full overflow-hidden" style={{ padding: '10px' }}>
            {/* Vnitřní rámeček (pasparta) s vnitřním stínem */}
            <div className="relative w-full h-full bg-white overflow-hidden" style={{ 
              aspectRatio: '3/4',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15)'
            }}>
              <img 
                src={slot.imagePreviewUrl} 
                className="absolute inset-0 select-none"
                style={{
                  transform: `translate(${slot.crop?.x || 0}px, ${slot.crop?.y || 0}px) scale(${slot.zoom || 1})`,
                  objectFit: 'cover',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
                alt={`Karta ${slot.id}`}
                draggable={false}
              />
            </div>
            {/* Neviditelná vrstva pro zachytávání událostí myši */}
            <div 
              className="absolute inset-0 w-full h-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9D9798" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </div>

      {/* HLAVNÍ OBSAH KARTY */}
      <div className="flex flex-col items-center justify-center gap-3">
        {/* TŘI OVLÁDACÍ IKONY - ŘADA */}
        <div className="flex gap-3">
          {/* FOTO IKONA - SPOUŠTĚČ */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 relative"
            style={{ 
              backgroundColor: slot.hasImage ? '#C89933' : 'transparent',
              border: `2px solid #C89933`
            }}
            title="Nahrát fotku"
          >
            {slot.hasImage ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C89933" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </button>
          
          {/* VIDEO IKONA - SPOUŠTĚČ */}
          <button 
            onClick={() => videoInputRef.current?.click()}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 relative"
            style={{ 
              backgroundColor: slot.hasVideo ? '#C89933' : 'transparent',
              border: `2px solid #C89933`
            }}
            title="Nahrát video"
          >
            {slot.hasVideo ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C89933" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            )}
          </button>
          
          {/* ZVUK IKONA - SPOUŠTĚČ S PULZACÍ */}
          <button 
            onClick={handleMicrophoneClick}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 relative ${
              isRecording ? 'animate-pulse' : ''
            }`}
            style={{ 
              backgroundColor: slot.hasAudio || isRecording ? '#C89933' : 'transparent',
              border: `2px solid #C89933`,
              boxShadow: isRecording ? '0 0 20px rgba(200, 153, 51, 0.5)' : ''
            }}
            title={isRecording ? 'Zastavit nahrávání' : 'Nahrát zvuk'}
          >
            {slot.hasAudio || isRecording ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C89933" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
            {isRecording && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
        </div>

        {/* ČASOVAČ NAHRÁVÁNÍ - POUZE PŘI NÁHRÁVÁNÍ */}
        {isRecording && (
          <div className="text-xs font-sans text-center" style={{ color: '#2D2D2A' }}>
            Nahrávám... {maxRecordingTime - recordingTime}s
          </div>
        )}

        {/* TLAČÍTKO VYMAZAT - PODMÍNĚNĚ */}
        {(slot.hasImage || slot.hasVideo || slot.hasAudio) && (
          <button 
            onClick={() => {
              // Vymazání všech souborů ze slotu
              onImageUpdate(slot.id, {
                hasImage: false,
                hasVideo: false,
                hasAudio: false,
                imagePreviewUrl: null,
                videoPreviewUrl: null,
                audioPreviewUrl: null,
                crop: { x: 0, y: 0 },
                zoom: 1
              });
            }}
            className="px-4 py-2 rounded-lg text-sm font-sans transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: '#9D9798', 
              color: '#F5F5F5'
            }}
          >
            Vymazat
          </button>
        )}
      </div>

      {/* SKRYTÉ VSTUPY PRO SOUBORY */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <input type="file" ref={videoInputRef} className="hidden" accept={videoAccept} onChange={(e) => e.target.files?.[0] && onVideoSelect(slot.id, e.target.files[0])} />
      <input type="file" ref={audioInputRef} className="hidden" accept={audioAccept} onChange={(e) => e.target.files?.[0] && onAudioSelect(slot.id, e.target.files[0])} />
    </div>
  );
}
