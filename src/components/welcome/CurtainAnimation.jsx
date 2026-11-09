import React, { useState, useEffect } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

export function CurtainAnimation({ onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Cinematic curtain pause (1.0s) then smoothly open
    const openTimer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    // Conclude animation and transition into the homepage
    const finishTimer = setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const handleSkipOrOpenNow = () => {
    setIsOpen(true);
    setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 500);
  };

  if (isFinished) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col items-center justify-center select-none"
      onClick={handleSkipOrOpenNow}
      title="Click anywhere to open curtains immediately"
    >
      {/* CINEMATIC WARM OVERHEAD SPOTLIGHT BEAM */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(ellipse 65% 85% at 50% 0%, rgba(255, 235, 175, 0.55) 0%, rgba(250, 190, 70, 0.22) 35%, rgba(15, 7, 2, 0.8) 85%, rgba(0,0,0,0.95) 100%)'
        }}
      />

      {/* LEFT THEATRE VELVET CURTAIN */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1/2 z-20 transition-transform duration-1200 ease-[cubic-bezier(0.75,0,0.2,1)] ${
          isOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(90deg, #2a0303 0%, #560606 20%, #7d0b0b 45%, #990f0f 65%, #620707 85%, #380303 100%)',
          boxShadow: 'inset -25px 0 60px rgba(0,0,0,0.9), 15px 0 35px rgba(0,0,0,0.8)'
        }}
      >
        {/* Realistic Vertical Pleats & Drape Shadow Highlights */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(0,0,0,0.55) 40px, rgba(255,220,180,0.12) 48px, rgba(0,0,0,0.6) 64px)'
          }}
        />
        {/* Golden Fringe Trim on the Inner Seam */}
        <div className="absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md">
          <div className="h-full w-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_5px] opacity-50" />
        </div>
      </div>

      {/* RIGHT THEATRE VELVET CURTAIN */}
      <div
        className={`absolute top-0 bottom-0 right-0 w-1/2 z-20 transition-transform duration-1200 ease-[cubic-bezier(0.75,0,0.2,1)] ${
          isOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(270deg, #2a0303 0%, #560606 20%, #7d0b0b 45%, #990f0f 65%, #620707 85%, #380303 100%)',
          boxShadow: 'inset 25px 0 60px rgba(0,0,0,0.9), -15px 0 35px rgba(0,0,0,0.8)'
        }}
      >
        {/* Realistic Vertical Pleats & Drape Shadow Highlights */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'repeating-linear-gradient(270deg, transparent, transparent 32px, rgba(0,0,0,0.55) 40px, rgba(255,220,180,0.12) 48px, rgba(0,0,0,0.6) 64px)'
          }}
        />
        {/* Golden Fringe Trim on the Inner Seam */}
        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md">
          <div className="h-full w-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_5px] opacity-50" />
        </div>
      </div>

      {/* CENTRAL STAGE PROSCENIUM TEXT & CONTROLS */}
      <div
        className={`relative z-30 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-4 transition-all duration-700 ease-out ${
          isOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        {/* Top Badge: Opening animation */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Opening animation</span>
        </div>

        {/* Welcome Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-wider uppercase font-serif drop-shadow-[0_6px_24px_rgba(0,0,0,0.9)] leading-tight">
          WELCOME TO <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
            MGR IEI STUDENT CHAPTER
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-amber-100/90 font-medium tracking-wide mt-3 drop-shadow-md">
          Cinema-style curtain opening animation
        </p>

        {/* Downward Arrow Circular Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkipOrOpenNow();
          }}
          className="mt-8 w-12 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all hover:scale-115 active:scale-95 cursor-pointer border-2 border-white/60 animate-bounce"
          aria-label="Open Curtains"
        >
          <ArrowDown className="w-6 h-6 stroke-[2.5]" />
        </button>

        <span className="text-[10px] text-amber-200/70 uppercase tracking-widest mt-3 font-semibold">
          Tap or click to reveal
        </span>
      </div>
    </div>
  );
}
