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
  Users
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

  // Subscribe to live public profile updates from Firestore
  useEffect(() => {
    const unsubProfile = subscribeToPublicProfile(setProfile);
    const unsubEvents = subscribeToPublicEvents(setPublicEvents);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-iei-gold-500 selection:text-iei-navy-950">
      {/* 1. THEATRICAL CURTAIN OPENING ANIMATION */}
      {showCurtain && (
        <CurtainAnimation onComplete={() => setShowCurtain(false)} />
      )}

      {/* INSTITUTIONAL HEADER & TOP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        {/* Top Accreditation Strip */}
        <div className="bg-iei-navy-950 text-white text-[11px] py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-iei-gold-500 text-iei-navy-950 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                NAAC A+ ACCREDITED
              </span>
              <span className="font-semibold text-slate-300 hidden md:inline truncate">
                Dr. M.G.R. Educational and Research Institute (Deemed to be University)
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 font-medium">
              <span className="hidden sm:inline">IEI Chapter Code: MGR-SC-1935</span>
              <span>ISO 21001:2018 Certified</span>
            </div>
          </div>
        </div>

        {/* Main Branding Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* University Logo Banner */}
            <img
              src="./assets/website-logo.png"
              alt="Dr. M.G.R. Educational and Research Institute"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            {/* IEI Emblem */}
            <div className="flex items-center gap-2">
              <img
                src={profile.aboutIeiLogo || './assets/apk-logo.png'}
                alt="IEI Emblem"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full shadow-xs border border-slate-200 p-0.5 bg-white"
              />
              <div className="hidden lg:block text-left">
                <span className="text-[11px] font-black text-iei-navy-950 uppercase tracking-wide block leading-tight">
                  The Institution of Engineers (India)
                </span>
                <span className="text-[10px] font-bold text-iei-gold-700 block">
                  MGR Student Chapter Portal
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700">
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
              onClick={() => scrollToSection('membership')}
              className="hover:text-iei-navy-900 transition-colors cursor-pointer"
            >
              Membership
            </button>
            <button 
              onClick={() => scrollToSection('events')}
              className="hover:text-iei-navy-900 transition-colors cursor-pointer"
            >
              Events
            </button>
            <button 
              onClick={() => scrollToSection('contacts')}
              className="hover:text-iei-navy-900 transition-colors cursor-pointer"
            >
              Contact
            </button>

            {/* PART 2: SEPARATE COMMITTEE MEMBER LOGIN BUTTON */}
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-4 py-2 bg-iei-navy-950 hover:bg-iei-navy-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:shadow-md cursor-pointer border border-iei-gold-500/30"
              title="Protected Committee Member Portal Login"
            >
              <LogIn className="w-3.5 h-3.5 text-iei-gold-400" />
              <span>Committee Member Login</span>
            </button>
          </nav>

          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onNavigateToLogin}
              className="px-2.5 py-1.5 bg-iei-navy-950 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 border border-iei-gold-400/40"
            >
              <LogIn className="w-3 h-3 text-iei-gold-400" />
              <span>Login</span>
            </button>
            <button
              onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Side Menu"
            >
              {isSideMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* SIDE SLIDE-OUT NAVIGATION DRAWER */}
      {isSideMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSideMenuOpen(false)}
          />
          <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-iei-navy-950">
                Portal Navigation
              </span>
              <button 
                onClick={() => setIsSideMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-3 text-sm font-bold text-slate-800">
              <button
                onClick={() => scrollToSection('about-iei')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900"
              >
                <span>About IEI</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('about-chapter')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900"
              >
                <span>MGR Student Chapter</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('gallery')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900"
              >
                <span>Photo Carousel</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('membership')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900"
              >
                <span>Apply for Membership</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('events')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900"
              >
                <span>Upcoming Events</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('contacts')}
                className="flex items-center justify-between py-2 border-b border-slate-50 text-left hover:text-iei-navy-900"
              >
                <span>Contact Persons</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </nav>

            {/* Mobile Committee Member Login Link in Drawer */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-iei-navy-950 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border border-iei-gold-500/40"
              >
                <LogIn className="w-4 h-4 text-iei-gold-400" />
                <span>Committee Member Login</span>
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Protected institutional governance dashboard
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HERO HEROIC BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-iei-navy-950 via-iei-navy-900 to-slate-900 text-white py-14 sm:py-20 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-iei-gold-500/15 border border-iei-gold-400/30 text-iei-gold-300 text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-iei-gold-400" />
            <span>Chartered Institutional Student Chapter • 1935</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Dr. M.G.R. Educational &amp; Research Institute <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-iei-gold-300 via-iei-gold-400 to-amber-300">
              The Institution of Engineers (India)
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mt-4 font-normal leading-relaxed">
            Welcome to the official institutional student portal of the MGR IEI Student Chapter. 
            Fostering technical innovation, professional leadership, and engineering excellence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => scrollToSection('membership')}
              className="px-6 py-3 bg-iei-gold-500 hover:bg-iei-gold-400 text-iei-navy-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-103 cursor-pointer"
            >
              Get IEI Student Membership
            </button>
            <button
              onClick={() => scrollToSection('about-chapter')}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              Discover Chapter Initiatives
            </button>
          </div>
        </div>
      </section>

      {/* 2. ABOUT IEI SECTION */}
      <section id="about-iei" className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-center">
            {/* IEI Official Emblem with Zero Distortion */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-50 border-4 border-iei-gold-400/40 p-3 shadow-xl flex items-center justify-center">
                <img
                  src={profile.aboutIeiLogo || './assets/apk-logo.png'}
                  alt="Institution of Engineers (India) Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-black text-iei-navy-950 uppercase tracking-widest mt-4">
                The Institution of Engineers (India)
              </span>
              <span className="text-[11px] font-semibold text-iei-gold-700">
                Incorporated by Royal Charter 1935
              </span>
            </div>

            {/* About IEI Content */}
            <div className="md:col-span-8">
              <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Statutory Engineering Body</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight">
                {profile.aboutIeiHeading || 'About IEI'}
              </h2>
              <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed space-y-3 font-normal">
                <p>
                  {profile.aboutIeiContent}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-iei-gold-600 font-bold block text-lg">1920</span>
                    <span className="text-slate-600 font-medium">Established in Kolkata</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-iei-gold-600 font-bold block text-lg">1935</span>
                    <span className="text-slate-600 font-medium">Royal Charter</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-iei-gold-600 font-bold block text-lg">125+</span>
                    <span className="text-slate-600 font-medium">Centres Across India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT MGR IEI STUDENT CHAPTER SECTION */}
      <section id="about-chapter" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-iei-gold-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Campus Chapter Directorate</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight">
              {profile.aboutChapterHeading || 'About MGR IEI Student Chapter'}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
              {profile.aboutChapterContent}
            </p>

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

      {/* 4. FIVE-PHOTO AUTOMATIC IMAGE CAROUSEL SECTION */}
      <section id="gallery" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-iei-gold-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-iei-gold-400" />
            <span>Chapter Highlights &amp; Activities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Institutional Photo Gallery
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Five-photo automatic carousel rotating continuously every 1 second in a smooth loop
          </p>
        </div>

        {/* The 5-Photo 1-Second Carousel */}
        <PhotoCarousel photos={profile.carouselPhotos} />
      </section>

      {/* 5. GET IEI MEMBERSHIP SECTION */}
      <section id="membership" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-iei-navy-950 via-iei-navy-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-iei-navy-900 to-slate-900 p-8 sm:p-12 rounded-3xl border border-iei-gold-400/30 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-iei-gold-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-1.5 bg-iei-gold-500/20 text-iei-gold-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-iei-gold-400/30">
            <Users className="w-3.5 h-3.5 text-iei-gold-400" />
            <span>Join the Global Engineering Network</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Get IEI Membership
          </h2>

          <p className="text-slate-300 text-sm max-w-xl mx-auto mt-3 leading-relaxed">
            Apply today to receive your official IEI Student Membership Card and unlock access to national technical symposiums, research journals, professional engineering credentials, and industrial masterclasses.
          </p>

          <div className="mt-8">
            <a
              href={profile.membershipFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-iei-gold-500 via-amber-400 to-iei-gold-500 hover:from-iei-gold-400 hover:to-amber-300 text-iei-navy-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-transform hover:scale-105 cursor-pointer"
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

      {/* 6. CONTACT PERSONS SECTION */}
      <section id="contacts" className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-iei-gold-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Phone className="w-4 h-4" />
              <span>Chapter Leadership Inquiry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight">
              Contact Persons
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
                    <span className="text-[11px] font-bold text-iei-gold-700 uppercase tracking-widest bg-iei-gold-50 px-2.5 py-1 rounded-lg border border-iei-gold-200">
                      {c.role || 'Chapter Lead'}
                    </span>
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-iei-navy-950">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.department || 'Engineering'} • MGR IEI Student Chapter
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-2">
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-2 text-xs font-bold text-iei-navy-950 hover:text-iei-gold-600 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-iei-navy-950 text-iei-gold-400 flex items-center justify-center shrink-0">
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

      {/* 7. UPCOMING EVENTS SECTION */}
      <section id="events" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-iei-gold-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Public Programs &amp; Symposiums</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-iei-navy-950 tracking-tight">
              Upcoming Events
            </h2>
          </div>

          {/* Conditional Display: Empty State vs. Published Events */}
          {publicEvents && publicEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publicEvents.map((ev) => (
                <div 
                  key={ev.id} 
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {ev.posterUrl && (
                    <div className="h-48 sm:h-56 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                      <img 
                        src={ev.posterUrl} 
                        alt={ev.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-iei-gold-700 uppercase tracking-wider mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{ev.date || 'Scheduled'} {ev.time ? `• ${ev.time}` : ''}</span>
                    </div>
                    <h3 className="text-lg font-bold text-iei-navy-950">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {ev.description}
                    </p>
                    {ev.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-iei-navy-950">
                Upcoming events will be updated soon.
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Official chapter workshops, national symposiums, and lecture schedules will be announced here by the committee directorate.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="bg-iei-navy-950 text-white pt-12 pb-8 px-4 sm:px-6 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="./assets/website-logo.png"
                alt="Dr. M.G.R. University Logo"
                className="h-10 w-auto object-contain bg-white/5 p-1 rounded-lg"
              />
              <img
                src="./assets/apk-logo.png"
                alt="IEI Emblem"
                className="w-10 h-10 object-contain rounded-full bg-white p-0.5"
              />
            </div>
            <h4 className="text-sm font-bold text-iei-gold-400">
              Dr. M.G.R. Educational and Research Institute
            </h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-md">
              (Deemed to be University with Graded Autonomy Status) • An ISO 21001:2018 Certified Institution.
              Periyar E.V.R. High Road, Maduravoyal, Chennai-95. Tamilnadu, India.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 text-iei-gold-400">
              Institutional Links
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => scrollToSection('about-iei')} className="hover:text-white transition-colors cursor-pointer">About The IEI</button></li>
              <li><button onClick={() => scrollToSection('about-chapter')} className="hover:text-white transition-colors cursor-pointer">MGR Student Chapter</button></li>
              <li><button onClick={() => scrollToSection('membership')} className="hover:text-white transition-colors cursor-pointer">Membership Form</button></li>
              <li><button onClick={() => scrollToSection('contacts')} className="hover:text-white transition-colors cursor-pointer">Chairpersons Directory</button></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 text-iei-gold-400">
              Committee Portal
            </h5>
            <p className="text-slate-400 text-xs mb-3">
              Protected governance portal for chapter chairmen, secretaries, and directors.
            </p>
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-4 py-2 bg-iei-gold-500 hover:bg-iei-gold-400 text-iei-navy-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Committee Member Login</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
          <span>&copy; {new Date().getFullYear()} Dr. M.G.R. Educational and Research Institute • The Institution of Engineers (India)</span>
          <span>Chapter Code: MGR-SC-1935 • Royal Charter 1935</span>
        </div>
      </footer>
    </div>
  );
}
