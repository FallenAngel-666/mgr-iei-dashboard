import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';

export function PhotoCarousel({ photos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Fallback default photos if empty
  const activePhotos = Array.isArray(photos) && photos.length > 0 ? photos : [
    { id: 'p1', url: './assets/website-logo.png', title: 'Dr. M.G.R. University', caption: 'NAAC A+ Accredited Campus' },
    { id: 'p2', url: './assets/apk-logo.png', title: 'IEI Crest', caption: 'Royal Charter 1935' },
    { id: 'p3', url: './assets/website-logo.png', title: 'Technical Directorate', caption: 'Student Chapter Initiatives' },
    { id: 'p4', url: './assets/apk-logo.png', title: 'Centenary Heritage', caption: 'Advancing Engineering Excellence' },
    { id: 'p5', url: './assets/website-logo.png', title: 'Research & Innovation', caption: 'Maduravoyal, Chennai-95' }
  ];

  // Automatic rotation: changes every ONE SECOND (1000ms) continuously in a loop
  useEffect(() => {
    if (isPaused || activePhotos.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activePhotos.length);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, activePhotos.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activePhotos.length) % activePhotos.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activePhotos.length);
  };

  const currentPhoto = activePhotos[currentIndex] || activePhotos[0];

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-700/60 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 16:9 / 21:9 Aspect Ratio Container ensuring zero distortion */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full flex items-center justify-center bg-radial from-slate-800 to-slate-950 p-4">
        {activePhotos.map((photo, index) => (
          <div
            key={photo.id || index}
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-opacity duration-300 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Image display strictly preserving natural proportions without stretching */}
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={photo.url}
                alt={photo.title || `IEI Chapter Photo ${index + 1}`}
                className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-xl transition-transform duration-500 hover:scale-102"
              />
            </div>

            {/* Bottom Caption Overlay */}
            {(photo.title || photo.caption) && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-8 sm:right-8 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 text-center text-white shadow-lg">
                {photo.title && (
                  <h4 className="text-xs sm:text-sm font-bold text-iei-gold-300 truncate">
                    {photo.title}
                  </h4>
                )}
                {photo.caption && (
                  <p className="text-[11px] sm:text-xs text-slate-300 truncate mt-0.5">
                    {photo.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Previous Photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-all opacity-70 group-hover:opacity-100 cursor-pointer shadow-md"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-all opacity-70 group-hover:opacity-100 cursor-pointer shadow-md"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Top Banner Indicator (1-Second Auto-Rotation Badge) */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-slate-950/70 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-iei-gold-300">
        <Sparkles className="w-3 h-3 text-iei-gold-400 animate-spin" />
        <span>Auto-Rotation (1s loop)</span>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="ml-1 text-slate-300 hover:text-white"
          title={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>
      </div>

      {/* Bottom Progress Dots */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
        {activePhotos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`transition-all rounded-full ${
              i === currentIndex
                ? 'w-5 h-1.5 bg-iei-gold-400'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Jump to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
