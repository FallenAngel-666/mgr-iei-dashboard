import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CurtainAnimation({ onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Automatically initiate smooth curtain opening after brief entrance pause (1.2 seconds)
    const openTimer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    // Complete animation and reveal underlying welcome page
    const finishTimer = setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 2800);

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
    }, 600);
  };

  if (isFinished) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden bg-slate-950 flex items-center justify-center">
      {/* LEFT THEATRICAL CURTAIN */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1/2 z-20 transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          isOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(90deg, #071527 0%, #0B2545 40%, #133E68 70%, #0B2545 100%)',
          boxShadow: 'inset -25px 0 50px rgba(0,0,0,0.8), 10px 0 30px rgba(0,0,0,0.7)'
        }}
      >
        {/* Fabric Folds and Pleat Highlights */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,215,0,0.08) 45px, rgba(0,0,0,0.5) 80px)'
          }}
        />
        {/* Gold Fringe Border on the right edge */}
        <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-b from-iei-gold-400 via-iei-gold-500 to-iei-gold-600 shadow-md">
          <div className="h-full w-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_6px] opacity-40" />
        </div>
      </div>

      {/* RIGHT THEATRICAL CURTAIN */}
      <div
        className={`absolute top-0 bottom-0 right-0 w-1/2 z-20 transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          isOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(270deg, #071527 0%, #0B2545 40%, #133E68 70%, #0B2545 100%)',
          boxShadow: 'inset 25px 0 50px rgba(0,0,0,0.8), -10px 0 30px rgba(0,0,0,0.7)'
        }}
      >
        {/* Fabric Folds and Pleat Highlights */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'repeating-linear-gradient(270deg, transparent, transparent 40px, rgba(255,215,0,0.08) 45px, rgba(0,0,0,0.5) 80px)'
          }}
        />
        {/* Gold Fringe Border on the left edge */}
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-b from-iei-gold-400 via-iei-gold-500 to-iei-gold-600 shadow-md">
          <div className="h-full w-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_6px] opacity-40" />
        </div>
      </div>

      {/* CENTRAL HERALDIC BADGE */}
      <div
        className={`relative z-30 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-4 transition-all duration-700 ease-out ${
          isOpen ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        {/* University & IEI Emblems */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src="./assets/website-logo.png"
            alt="Dr. M.G.R. University"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
          />
          <img
            src="./assets/apk-logo.png"
            alt="IEI Royal Charter Emblem"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-full bg-white p-1 shadow-lg border-2 border-iei-gold-400"
          />
        </div>

        {/* Accreditations */}
        <div className="inline-flex items-center gap-2 bg-iei-gold-500/20 border border-iei-gold-400/40 text-iei-gold-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-iei-gold-400" />
          <span>NAAC A+ Accredited • ISO 21001:2018 Certified</span>
        </div>

        {/* Theatrical Greeting Heading */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
          Welcome to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-iei-gold-300 via-iei-gold-400 to-amber-300">
            MGR IEI Student Chapter
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mt-3 leading-relaxed drop-shadow-sm">
          Dr. M.G.R. Educational and Research Institute (Deemed to be University)
          <span className="block text-[11px] text-iei-gold-300/90 mt-1">
            The Institution of Engineers (India) • Royal Charter 1935
          </span>
        </p>

        {/* Instant Entry Action Button so animation never blocks visitors */}
        <button
          onClick={handleSkipOrOpenNow}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-iei-gold-500 to-amber-500 hover:from-iei-gold-400 hover:to-amber-400 text-iei-navy-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer"
        >
          <span>Enter Welcome Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
