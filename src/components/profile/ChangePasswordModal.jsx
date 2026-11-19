import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { validatePasswordPolicy } from '../../services/credentialService';
import { Shield, ShieldCheck, AlertCircle, Eye, EyeOff, Check, X, KeyRound, Loader2 } from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose }) {
  const { currentUser, updateUserPassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const policy = validatePasswordPolicy(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  // Criteria checks
  const criteria = [
    { label: 'Minimum 12 characters', met: newPassword.length >= 12 },
    { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
    { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(newPassword) },
    { label: 'Number (0-9)', met: /[0-9]/.test(newPassword) },
    { label: 'Special character (!@#$%^&*...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword) },
    { label: 'No predictable or compromised sequence', met: policy.errors.every(e => !e.includes('predictable')) }
  ];

  const getStrengthColor = () => {
    switch (policy.strength) {
      case 'Excellent': return 'bg-emerald-500';
      case 'Strong': return 'bg-blue-500';
      case 'Good': return 'bg-amber-500';
      case 'Fair': return 'bg-orange-500';
      default: return 'bg-rose-500';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!policy.isValid) {
      setStatusMsg({ type: 'error', text: 'Please ensure your new password satisfies all institutional security requirements.' });
      return;
    }
    if (!passwordsMatch) {
      setStatusMsg({ type: 'error', text: 'New password and confirmation password do not match.' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      if (updateUserPassword) {
        await updateUserPassword(currentPassword, newPassword);
      }
      setStatusMsg({ type: 'success', text: 'Password successfully updated and encrypted across your institutional account.' });
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setStatusMsg({ type: '', text: '' });
        onClose();
      }, 1500);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update password. Please check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Institutional Password Security">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Institutional policy notice banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-iei-navy-950 font-bold mb-1">
            <Shield className="w-4 h-4 text-iei-gold-600" />
            <span>Institutional Password Standard (12+ Characters)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All IEI MGR Students Chapter accounts require complex credentials to safeguard administrative workflows, attendance registries, and member records.
          </p>
        </div>

        {statusMsg.text && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusMsg.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Current Password *
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your existing password"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            New Secure Password *
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 12 chars with upper, lower, numbers & symbols"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Bar */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-500 uppercase tracking-wider">Password Strength:</span>
                <span className={`px-2 py-0.5 rounded text-white ${getStrengthColor()}`}>
                  {policy.strength}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${Math.min(100, (policy.score / 5) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Policy Checklist */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Institutional Security Requirements
          </span>
          {criteria.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              {item.met ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={item.met ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Confirm New Password *
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-iei-navy-900 pr-10 ${
                confirmPassword && !passwordsMatch ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-[10px] text-rose-600 font-bold mt-1">
              Passwords do not match.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !policy.isValid || !passwordsMatch}
            className="px-5 py-2 rounded-xl bg-iei-navy-950 hover:bg-slate-900 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Encrypting & Updating...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
