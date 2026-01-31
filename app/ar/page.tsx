"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), { ssr: false });

export default function ARPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Simulace detekce obrazu (v reálné aplikaci by zde bylo WebXR/AR.js)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsDetecting(true);
      
      // Simulace detekce po 3 sekundách
      setTimeout(() => {
        setIsDetecting(false);
        setIsARActive(true);
        // Zde by se načetlo video podle detekovaného QR kódu
        setVideoSrc('/sample-video.mp4'); // Placeholder
      }, 3000);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Canvas animace pro detekční rámec
  useEffect(() => {
    if (isDetecting && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let pulseRadius = 0;
      let growing = true;

      const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Pulzující kruh v barvě #C89933
        ctx.strokeStyle = '#C89933';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + (Math.sin(pulseRadius * 0.05) + 1) * 0.35;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80 + Math.sin(pulseRadius * 0.05) * 20;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Vnitřní kruh
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
        ctx.stroke();
        
        pulseRadius += growing ? 1 : -1;
        if (pulseRadius > 100 || pulseRadius < 0) growing = !growing;
        
        animationRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isDetecting]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2D2D2A' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" 
               style={{ borderTopColor: '#C89933' }}></div>
          <p className="text-xl font-sans" style={{ color: '#F5F5F5' }}>Načítání...</p>
        </div>
      </div>
    );
  }

  if (isDetecting) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ backgroundColor: '#2D2D2A' }}>
        {/* Kamera pohled (simulace) */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
        
        {/* Detekční rámec */}
        <canvas 
          ref={canvasRef}
          width={300}
          height={300}
          className="absolute z-10"
        />
        
        {/* UI prvky */}
        <div className="absolute top-8 left-0 right-0 text-center z-20">
          <h1 className="text-2xl font-bold font-sans mb-2" style={{ color: '#C89933' }}>
            Mluvící karty
          </h1>
          <p className="text-lg font-sans" style={{ color: '#F5F5F5' }}>
            Namiřte kameru na přední stranu fotky...
          </p>
        </div>
        
        {/* Spodní instrukce */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" 
               style={{ backgroundColor: 'rgba(45, 45, 42, 0.8)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#C89933' }}></div>
            <span className="text-sm font-sans" style={{ color: '#F5F5F5' }}>
              Hledám obrázek...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isARActive && videoSrc) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ backgroundColor: '#2D2D2A' }}>
        {/* Video přehrávač */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        
        {/* Přechodová vrstva (fade-in efekt) */}
        <div className="absolute inset-0 pointer-events-none" 
             style={{ 
               background: 'radial-gradient(circle, transparent 0%, rgba(45, 45, 42, 0.3) 100%)',
               animation: 'fadeIn 2s ease-out'
             }}></div>
        
        {/* AR ovládací prvky */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-20">
          <button className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                  style={{ backgroundColor: '#C89933', color: '#F5F5F5' }}
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                      } else {
                        videoRef.current.pause();
                      }
                    }
                  }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          </button>
          
          <button className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                  style={{ backgroundColor: '#C89933', color: '#F5F5F5' }}
                  onClick={() => {
                    // Sdílení funkce
                    if (navigator.share) {
                      navigator.share({
                        title: 'Mluvící karta',
                        text: 'Podívej se na mou mluvící kartu!',
                        url: window.location.href
                      });
                    }
                  }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
        
        {/* Zpět button */}
        <button className="absolute top-8 left-8 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg z-20"
                style={{ backgroundColor: 'rgba(45, 45, 42, 0.8)', color: '#F5F5F5' }}
                onClick={() => window.history.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
      </div>
    );
  }

  return null;
}

// CSS pro fade-in animaci
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
