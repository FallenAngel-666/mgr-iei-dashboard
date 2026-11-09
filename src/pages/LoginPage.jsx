import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Building2,
  KeyRound,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export function LoginPage({ onBackToWelcome }) {
  const { login, resetPassword, loading, authError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!identifier.trim() || !password) return;

    const res = await login(identifier.trim(), password);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    const res = await resetPassword(forgotEmail.trim());
    setForgotStatus(res.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-iei-navy-950 to-iei-navy-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Banner with University Credentials */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-iei-gold-500 text-iei-navy-950 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide">
            NAAC A+ ACCREDITED
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Dr. M.G.R. Educational and Research Institute (Deemed to be University)
          </span>
        </div>
        <div className="text-slate-400 text-[11px] font-medium">
          MJR IAE DASHBOARD â€¢ Committee Login
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        {onBackToWelcome && (
          <button
            onClick={onBackToWelcome}
            className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Homepage</span>
          </button>
        )}
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header with Official Website Logo & APK Crest */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/90 p-6 border-b border-slate-200/80 text-center">
            {/* Website Logo - Original Proportions Maintained */}
            <div className="flex justify-center mb-3">
              <img 
                src="/assets/website-logo.png" 
                alt="Dr. M.G.R. Educational and Research Institute University Logo"
                className="h-14 sm:h-16 w-auto object-contain max-w-[280px]"
              />
            </div>

            {/* IEI Royal Charter Crest */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <img 
                src="/assets/apk-logo.png" 
                alt="Institution of Engineers (India) Crest"
                className="w-10 h-10 object-contain rounded-full shadow-xs bg-white p-0.5 border border-slate-200"
              />
              <div className="text-left">
                <h2 className="text-xs font-bold text-iei-navy-950 uppercase tracking-wide font-serif">
                  THE INSTITUTION OF ENGINEERS (INDIA)
                </h2>
                <p className="text-[10px] font-bold text-amber-600">
                  MJR IAE DASHBOARD
                </p>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-iei-navy-950">
                Member Portal Sign In
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in with your official IEI username or registered email.
              </p>
            </div>

            {(errorMessage || authError) && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage || authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username or Registered Email *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    required
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. sriman.chair-01 or member email"
                    autoComplete="username"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 focus:border-iei-navy-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(identifier.includes('@') ? identifier : '');
                      setForgotStatus(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-iei-navy-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    autoComplete="current-password"
                    className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 focus:border-iei-navy-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-iei-gold-400" />
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Institutional Chapter Management System &bull; Dr. M.G.R. DU
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between py-3 border-t border-white/10 text-[11px] text-slate-400 gap-2">
        <div>
          Copyright &copy; 2026 The Institution of Engineers (India) &bull; MGR Student Chapter
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Chartered by Royal Charter 1935</span>
          <span>ISO 21001:2018 Certified</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <Modal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          title="Reset Institutional Account Password"
        >
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered institutional or personal email address. A password reset confirmation link will be dispatched or verified with the Chapter Staff Coordinator.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Email Address *
              </label>
              <input
                required
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="e.g. srimannarayanamoorthysridhar@gmail.com"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
              />
            </div>

            {forgotStatus && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-iei-navy-900 text-white text-xs font-bold hover:bg-iei-navy-800"
              >
                Dispatch Reset
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
