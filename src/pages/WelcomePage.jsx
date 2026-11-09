import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ExternalLink, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Menu, 
  X, 
  LogIn, 
  ChevronRight,
  BookOpen,
  Award,
  Users,
  Image as ImageIcon
} from 'lucide-react';

import { CurtainAnimation } from '../components/welcome/CurtainAnimation';
import { PhotoCarousel } from '../components/welcome/PhotoCarousel';
import { 
  subscribeToPublicProfile, 
  subscribeToPublicEvents, 
  DEFAULT_PUBLIC_PROFILE 
} from '../services/publicProfileService';

export function WelcomePage({ onNavigateToLogin }) {
  const [profile, setProfile] = useState(DEFAULT_PUBLIC_PROFILE);
  const [publicEvents, setPublicEvents] = useState([]);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [showCurtain, setShowCurtain] = useState(true);

  // Subscribe to live public profile updates from Firestore / Local Cache
  useEffect(() => {
    const unsubProfile = subscribeToPublicProfile((data) => {
      if (data) setProfile(data);
    });
    const unsubEvents = subscribeToPublicEvents((events) => {
      if (Array.isArray(events)) setPublicEvents(events);
    });
    return () => {
      unsubProfile();
      unsubEvents();
    };
  }, []);

  const scrollToSection = (id) => {
    setIsSideMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Three lines breakdown for the Chapter introduction
  const chapterLines = Array.isArray(profile.aboutChapterLines) && profile.aboutChapterLines.length === 3
    ? profile.aboutChapterLines
    : (profile.aboutChapterContent || '').split('\n').filter(Boolean).slice(0, 3);

  const fallbackLines = [
    'Empowering future engineers through multidisciplinary technical symposiums, research, and innovation.',
    'Fostering academic excellence, professional ethics, and hands-on technological leadership across departments.',
    'Operating under the national charter of The Institution of Engineers (India) at Dr. M.G.R. Educational and Research Institute.'
  ];

  const displayLines = chapterLines.length === 3 ? chapterLines : fallbackLines;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. CINEMATIC THEATRE CURTAIN OPENING ANIMATION */}
      {showCurtain && (
        <CurtainAnimation onComplete={() => setShowCurtain(false)} />
      )}

      {/* INSTITUTIONAL HEADER & TOP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        {/* Top Accreditation Strip */}
        <div className="bg-iei-navy-950 text-white text-[11px] py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-iei-navy-950 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase shadow-xs">
                NAAC A+ ACCREDITED
              </span>
              <span className="font-semibold text-slate-300 hidden md:inline truncate">
                Dr. M.G.R. Educational and Research Institute (Deemed to be University)
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 font-medium text-[11px]">
              <span className="hidden sm:inline">Chapter Code: MGR-SC-1935</span>
              <span>ISO 21001:2018 Certified</span>
            </div>
          </div>
        </div>

        {/* Main Branding Bar with Top-Right "COMMITTEE LOGIN" button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* University Logo Banner */}
            <img
              src="/assets/website-logo.png"
              alt="Dr. M.G.R. Educational and Research Institute"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            {/* Official IEI Emblem & IEI DASHBOARD SYSTEM Title */}
            <div className="flex items-center gap-2.5">
              <img
                src={profile.aboutIeiLogo || '/assets/apk-logo.png'}
                alt="IEI Royal Charter Emblem"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full shadow-xs border border-slate-200 p-0.5 bg-white"
              />
              <div className="text-left">
                <span className="text-[12px] sm:text-sm font-black text-iei-navy-950 uppercase tracking-wide block leading-tight font-serif">
                  IEI DASHBOARD SYSTEM
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 block">
                  The Institution of Engineers (India)
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links and PROMINENT TOP-RIGHT "COMMITTEE LOGIN" BUTTON */}
          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-700">
              <button 
                onClick={() => scrollToSection('about-iei')}
                className="hover:text-iei-navy-900 transition-colors cursor-pointer"
              >
                About IEI
              </button>
              <button 
                onClick={() => scrollToSection('about-chapter')}
                className="hover:text-iei-navy-900 transition-colors cursor-pointer"
              >
                Student Chapter
              </button>
              <button 
                onClick={() => scrollToSection('gallery')}
                className="hover:text-iei-navy-900 transition-colors cursor-pointer"
              >
                Gallery
              </button>
              <button 
                onClick={() => scrollToSection('events')}
                className="hover:text-iei-navy-900 transition-colors cursor-pointer"
              >
                Upcoming Events
              </button>
              <button 
                onClick={() => scrollToSection('membership')}
                className="hover:text-iei-navy-900 transition-colors cursor-pointer"
              >
                IEI Membership
              </button>
              <button 
                onClick={() => scrollToSection('contacts')}
                className="hover:text-iei-navy-900 transition-colors cursor-pointer"
              >
                Contact Details
              </button>
            </nav>

            {/* D. COMMITTEE LOGIN – TOP-RIGHT CORNER BUTTON */}
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-iei-navy-950 to-slate-900 hover:from-slate-900 hover:to-iei-navy-950 text-white rounded-xl text-xs sm:text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:scale-103 cursor-pointer border border-amber-400/40 ring-2 ring-amber-400/20"
              title="Open Member Portal Sign In"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>COMMITTEE LOGIN</span>
            </button>

            {/* Mobile Navigation Drawer Toggle */}
            <button
              onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isSideMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OUT NAVIGATION DRAWER */}
      {isSideMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSideMenuOpen(false)}
          />
          <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-iei-navy-950 font-serif">
                MGR IEI Navigation
              </span>
              <button 
                onClick={() => setIsSideMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2.5 text-sm font-bold text-slate-800">
              <button
                onClick={() => scrollToSection('about-iei')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900 cursor-pointer"
              >
                <span>1. About IEI</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('about-chapter')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900 cursor-pointer"
              >
                <span>2. About Chapter (3-Lines)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('gallery')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900 cursor-pointer"
              >
                <span>3. Chapter Photo Gallery</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('events')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900 cursor-pointer"
              >
                <span>4. Upcoming Events</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('membership')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900 cursor-pointer"
              >
                <span>5. IEI Membership</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('contacts')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900 cursor-pointer"
              >
                <span>6. Contact Details</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-iei-navy-950 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border border-amber-400/40 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>COMMITTEE LOGIN</span>
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Protected committee member authentication
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-iei-navy-950 via-slate-900 to-iei-navy-950 text-white py-14 sm:py-20 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Chartered Institutional Student Chapter • 1935</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight font-serif">
            Dr. M.G.R. Educational &amp; Research Institute <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
              THE INSTITUTION OF ENGINEERS (INDIA)
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mt-4 font-normal leading-relaxed">
            Welcome to the official institutional student portal of MGR IEI Student Chapter. 
            Fostering technical innovation, professional leadership, and multidisciplinary engineering excellence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a
              href={profile.membershipFormUrl || 'https://docs.google.com/forms/d/e/1FAIpQLScd31MirxM6OjdMjEz_cL1AcwNJDdQ-y8nmyllHBmNkNarUlw/viewform?usp=publish-editor'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-103 cursor-pointer"
            >
              <span>Get IEI Student Membership</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => scrollToSection('about-chapter')}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              About Chapter
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 1. INSTITUTION LOGO AND ABOUT IEI                            */}
      {/* ============================================================ */}
      <section id="about-iei" className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-center">
            {/* Official Logo with Zero Distortion */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-50 border-4 border-amber-400/40 p-3 shadow-xl flex items-center justify-center">
                <img
                  src={profile.aboutIeiLogo || '/assets/apk-logo.png'}
                  alt="THE INSTITUTION OF ENGINEERS (INDIA) Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-black text-iei-navy-950 uppercase tracking-widest mt-4 font-serif">
                THE INSTITUTION OF ENGINEERS (INDIA)
              </span>
              <span className="text-[11px] font-semibold text-amber-600">
                Incorporated by Royal Charter 1935
              </span>
            </div>

            {/* About IEI Introduction */}
            <div className="md:col-span-8">
              <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Statutory Engineering Body</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight font-serif">
                {profile.aboutIeiHeading || 'THE INSTITUTION OF ENGINEERS (INDIA)'}
              </h2>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed space-y-3 font-normal">
                <p>
                  {profile.aboutIeiContent}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-amber-600 font-bold block text-lg">1920</span>
                    <span className="text-slate-600 font-medium">Established in Kolkata</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-amber-600 font-bold block text-lg">1935</span>
                    <span className="text-slate-600 font-medium">Royal Charter</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-amber-600 font-bold block text-lg">125+</span>
                    <span className="text-slate-600 font-medium">Centres Worldwide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. ABOUT MGR IEI STUDENT CHAPTER (EXACTLY THREE LINES)       */}
      {/* ============================================================ */}
      <section id="about-chapter" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Campus Chapter Directorate</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight font-serif">
              {profile.aboutChapterHeading || 'About MGR IEI Student Chapter'}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
            {/* Exactly Three Lines Display Container */}
            <div className="space-y-4">
              {displayLines.map((line, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-amber-400/40 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-iei-navy-950 text-amber-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
                    {line}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Host Institution</span>
                <p className="font-bold text-iei-navy-950 text-sm mt-1">Dr. M.G.R. Educational &amp; Research Institute</p>
                <p className="text-xs text-slate-500 mt-0.5">Maduravoyal, Chennai</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accreditations</span>
                <p className="font-bold text-iei-navy-950 text-sm mt-1">NAAC A+ Accredited</p>
                <p className="text-xs text-slate-500 mt-0.5">Graded Autonomy Status</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statutory Code</span>
                <p className="font-bold text-iei-navy-950 text-sm mt-1">MGR-SC-1935</p>
                <p className="text-xs text-slate-500 mt-0.5">IEI Student Chapter Division</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CHAPTER PHOTO GALLERY                                     */}
      {/* ============================================================ */}
      <section id="gallery" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Chapter Highlights &amp; Activities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-serif">
            Chapter Photo Gallery
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Official chapter photographs in continuous automatic slideshow rotation
          </p>
        </div>

        {/* Chapter Photo Carousel */}
        <PhotoCarousel photos={profile.carouselPhotos} />
      </section>

      {/* ============================================================ */}
      {/* 4. UPCOMING EVENTS (Posters, Names, Dates, Descriptions)     */}
      {/* Note: Must appear BEFORE IEI Membership                      */}
      {/* ============================================================ */}
      <section id="events" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Technical Symposiums &amp; Workshops</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight font-serif">
              Upcoming Events
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Official chapter events, national hackathons, and guest lectures
            </p>
          </div>

          {publicEvents && publicEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicEvents.map((evt) => (
                <div 
                  key={evt.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Event Poster */}
                  {evt.posterUrl ? (
                    <div className="h-48 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                      <img 
                        src={evt.posterUrl} 
                        alt={evt.title || 'Event Poster'} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-44 w-full bg-gradient-to-br from-iei-navy-950 to-slate-900 flex flex-col items-center justify-center text-amber-400 p-4 text-center">
                      <Calendar className="w-10 h-10 mb-2 opacity-80" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Official Chapter Event
                      </span>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{evt.date || 'Date Announced Soon'}</span>
                        {evt.time && <span>• {evt.time}</span>}
                      </div>

                      <h3 className="text-base font-bold text-iei-navy-950 line-clamp-2">
                        {evt.title}
                      </h3>

                      {evt.venue && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{evt.venue}</span>
                        </p>
                      )}

                      <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                        {evt.description || 'Join us for this exciting chapter program.'}
                      </p>
                    </div>

                    {evt.registrationLink && (
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <a
                          href={evt.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-iei-navy-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          <span>Register for Event</span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center p-10 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-iei-navy-950">
                Upcoming events will be updated soon.
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Our chapter committee is actively finalizing the calendar for upcoming symposiums, technical paper presentations, and industrial visits.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. IEI MEMBERSHIP (Card / Registration & Google Form)        */}
      {/* ============================================================ */}
      <section id="membership" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-iei-navy-950 via-slate-900 to-iei-navy-950 text-white">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-iei-navy-900 to-slate-900 p-8 sm:p-12 rounded-3xl border border-amber-400/30 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-amber-400/30">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Join the Global Engineering Network</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-serif">
            IEI Membership
          </h2>

          <p className="text-slate-300 text-sm max-w-xl mx-auto mt-3 leading-relaxed">
            Apply today to receive your official IEI Student Membership Card and unlock access to national technical symposiums, research journals, professional engineering credentials, and industrial masterclasses.
          </p>

          <div className="mt-8">
            <a
              href={profile.membershipFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-transform hover:scale-105 cursor-pointer"
            >
              <span>Apply for IEI Student Membership Card</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-[11px] text-slate-400 mt-3">
              Opens the official institutional Google Form in a new browser tab
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CONTACT DETAILS (Sriman Narayana Moorthy & Geethalakshmi) */}
      {/* ============================================================ */}
      <section id="contacts" className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Phone className="w-4 h-4" />
              <span>Chapter Leadership Inquiry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight font-serif">
              Contact Details
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Reach out directly to chapter student chairpersons for membership, event partnerships, or inquiries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {profile.contacts && profile.contacts.map((c) => (
              <div 
                key={c.id || c.name}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                      {c.role || 'Student Chairman Elect'}
                    </span>
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-black text-iei-navy-950">
                    {c.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>{c.department || 'Engineering'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-600">MGR IEI Student Chapter</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-2">
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-2 text-xs font-bold text-iei-navy-950 hover:text-amber-600 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-iei-navy-950 text-amber-400 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span>{c.displayPhone || c.phone}</span>
                  </a>

                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-iei-navy-950 transition-colors truncate"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{c.email}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="bg-iei-navy-950 text-white py-12 px-4 sm:px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/assets/apk-logo.png"
              alt="IEI Royal Charter Emblem"
              className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-md"
            />
            <div>
              <p className="text-sm font-black tracking-wide font-serif">
                IEI DASHBOARD SYSTEM
              </p>
              <p className="text-xs text-slate-400">
                The Institution of Engineers (India) • Dr. M.G.R. Educational and Research Institute
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-400">
            <span>Chapter Code: MGR-SC-1935</span>
            <span className="hidden sm:inline">•</span>
            <span>Maduravoyal, Chennai-600095</span>
            <span className="hidden sm:inline">•</span>
            <button
              onClick={onNavigateToLogin}
              className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-4 cursor-pointer"
            >
              Committee Member Portal Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
