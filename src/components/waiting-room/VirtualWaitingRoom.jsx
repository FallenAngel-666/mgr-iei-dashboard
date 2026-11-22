/**
 * IEI MGR Student Chapter — Enterprise Virtual Waiting Room UI
 * Real-Time FIFO Queue Position, Dynamic Wait Time & Automatic Admission
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';

export function VirtualWaitingRoom({ onAdmitted, targetPath = '/' }) {
  const [visitorId, setVisitorId] = useState(() => {
    let id = localStorage.getItem('iei_waiting_visitor_id');
    if (!id) {
      id = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('iei_waiting_visitor_id', id);
    }
    return id;
  });

  const [queueState, setQueueState] = useState({
    status: 'QUEUED', // 'QUEUED' | 'ADMITTED' | 'ERROR'
    position: null,
    totalWaiting: 0,
    estimatedWaitSeconds: null,
    loadState: 'HIGH LOAD'
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState(null);
  const pollTimerRef = useRef(null);

  // Poll status from server
  const pollStatus = async () => {
    try {
      const activeUser = JSON.parse(localStorage.getItem('iei_mgr_active_user') || 'null');
      const role = activeUser?.role || 'GUEST';

      const res = await fetch(`/api/queue/status?visitorId=${encodeURIComponent(visitorId)}&role=${encodeURIComponent(role)}`);
      
      if (!res.ok) {
        throw new Error(`Queue service returned HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.status === 'ADMITTED' && data.token) {
        // Save admission token
        localStorage.setItem('iei_waiting_room_token', data.token);
        document.cookie = `iei_qtoken=${encodeURIComponent(data.token)}; path=/; max-age=900; SameSite=Lax`;
        
        setQueueState(prev => ({ ...prev, status: 'ADMITTED', position: 0 }));
        
        // Notify parent or redirect
        if (onAdmitted) {
          onAdmitted(data.token);
        } else {
          setTimeout(() => {
            window.location.hash = targetPath || '#/';
          }, 1200);
        }
        return;
      }

      if (data.status === 'QUEUED') {
        setQueueState({
          status: 'QUEUED',
          position: data.position,
          totalWaiting: data.totalWaiting,
          estimatedWaitSeconds: data.estimatedWaitSeconds,
          loadState: data.loadState || 'HIGH LOAD'
        });
        setLastUpdated(new Date());
        setErrorMsg(null);
      }
    } catch (err) {
      console.warn('[WaitingRoom] Polling error:', err.message);
      setErrorMsg('Reconnecting to chapter traffic engine...');
    }
  };

  useEffect(() => {
    // Initial join / check
    pollStatus();

    // Poll every 4 seconds
    pollTimerRef.current = setInterval(pollStatus, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [visitorId]);

  // Format estimated wait time
  const formatWaitTime = (seconds) => {
    if (!seconds || seconds <= 0) return 'Less than a minute';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `~${secs} seconds`;
    if (secs === 0) return `~${mins} min`;
    return `~${mins} min ${secs} sec`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-iei-navy-950 to-slate-950 flex flex-col justify-center items-center px-4 py-8 text-white">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-iei-gold-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-iei-navy-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Institution Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border border-slate-200 mb-3">
            <img 
              src="/assets/website-logo.png" 
              alt="IEI Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }} 
            />
            <ShieldCheck className="w-9 h-9 text-iei-navy-950" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-iei-gold-400/20 border border-iei-gold-400/30 text-iei-gold-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-iei-gold-400" />
            <span>Official Virtual Waiting Room</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            High Traffic — Please Wait
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Dr. M.G.R. Educational and Research Institute (Deemed to be University)
          </p>
        </div>

        {/* Admission Granted Banner */}
        {queueState.status === 'ADMITTED' ? (
          <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-emerald-200">
              Admission Granted!
            </h2>
            <p className="text-xs text-emerald-100">
              Capacity is available. Secure admission token generated. Redirecting you to the portal now...
            </p>
            <div className="pt-2">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto text-emerald-300" />
            </div>
          </div>
        ) : (
          /* Live Queue Card */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed text-center">
              "Thank you for visiting <strong>MGR IEI STUDENTS CHAPTER</strong>. Our website is currently experiencing high demand. You are safely placed in the waiting queue. Please keep this page open. We will automatically let you in when capacity becomes available."
            </div>

            {/* Position & Time Counters */}
            <div className="grid grid-cols-2 gap-3">
              {/* Position */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                  <Users className="w-3.5 h-3.5 text-iei-gold-400" />
                  <span>Your Position</span>
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {queueState.position !== null ? `#${queueState.position}` : 'Calculating...'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {queueState.totalWaiting} member{queueState.totalWaiting === 1 ? '' : 's'} in queue
                </div>
              </div>

              {/* Estimated Time */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Estimated Wait</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono py-1">
                  {formatWaitTime(queueState.estimatedWaitSeconds)}
                </div>
                <div className="text-[10px] text-emerald-300 font-semibold">
                  Automatic Admission
                </div>
              </div>
            </div>

            {/* Progress Animation Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Fair FIFO Queue Queueing</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <RefreshCw className="w-3 h-3 animate-spin text-iei-gold-400" />
                  <span>Live sync</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-iei-gold-400 to-emerald-400 rounded-full animate-pulse w-3/4" />
              </div>
            </div>

            {/* Reassurance Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Do not refresh or close this tab</strong>
                <span>Your position is locked and securely maintained in the queue. Refreshing will not speed up admission.</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-300 text-center font-medium">
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Charter 1935 • Tamil Nadu State Centre</span>
          <span className="font-mono">Load State: {queueState.loadState}</span>
        </div>
      </div>
    </div>
  );
}
