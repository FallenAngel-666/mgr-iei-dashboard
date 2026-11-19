import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSubmissionRules, updateSubmissionRules } from '../../services/firebaseService';
import { isMasterAdmin } from '../../config/roles';
import { Modal } from '../common/Modal';
import { Calendar, ToggleLeft, ToggleRight, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export function WeeklyRestrictionSettingsCard() {
  const { currentUser } = useAuth();
  const [rules, setRules] = useState({
    weeklyRestriction: true,
    description: 'Students can submit work only for the current week.',
    updatedAt: new Date().toISOString(),
    updatedByName: 'Administrator',
    updatedByRole: 'Administrator'
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingState, setPendingState] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const isAdmin = isMasterAdmin(currentUser?.role) || 
                  currentUser?.username === 'admin.master-01' || 
                  currentUser?.id === 'user-administrator' || 
                  currentUser?.role === 'Joint Secretary' || 
                  currentUser?.username === 'sripriyan.jsec-01';

  useEffect(() => {
    const unsub = subscribeToSubmissionRules((latest) => {
      if (latest) setRules(latest);
    });
    return () => unsub();
  }, []);

  const handleToggleClick = () => {
    if (!isAdmin) return;
    const targetState = !rules.weeklyRestriction;
    setPendingState(targetState);
    setIsConfirmOpen(true);
  };

  const handleConfirmChange = async () => {
    if (pendingState === null) return;
    setIsUpdating(true);
    setFeedbackMsg({ type: '', text: '' });
    try {
      await updateSubmissionRules(pendingState, currentUser);
      setFeedbackMsg({
        type: 'success',
        text: `Weekly Work Submission Restriction successfully set to ${pendingState ? 'ON' : 'OFF'}.`
      });
      setIsConfirmOpen(false);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 3500);
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to update submission restriction setting.'
      });
    } finally {
      setIsUpdating(false);
      setPendingState(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 ${rules.weeklyRestriction ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-iei-navy-950 uppercase tracking-wide">
                WEEKLY WORK SUBMISSION RESTRICTION
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                rules.weeklyRestriction 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                Current status: {rules.weeklyRestriction ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {rules.weeklyRestriction
                ? 'Students can submit work only for the current week.'
                : 'Students can submit work for any previous date.'}
            </p>
          </div>
        </div>

        {/* Admin Action Toggle */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleClick}
              disabled={isUpdating}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                rules.weeklyRestriction
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-amber-400'
              }`}
            >
              {rules.weeklyRestriction ? (
                <>
                  <ToggleRight className="w-4 h-4 text-white" />
                  <span>Switch to OFF</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-amber-400" />
                  <span>Switch to ON</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Audit meta strip */}
      <div className="bg-slate-50/70 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Last changed by: <strong className="text-slate-700">{rules.updatedByName || 'Administrator'}</strong> ({rules.updatedByRole || 'Administrator'})
          </span>
        </div>
        <div>
          <span>Timestamp: {rules.updatedAt ? new Date(rules.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Initial Setting'} IST</span>
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`p-3 text-xs font-semibold flex items-center gap-2 border-t ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <Modal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Confirm Submission Policy Modification"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>
                  Change Weekly Work Submission Restriction to {pendingState ? 'ON' : 'OFF'}?
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {pendingState
                  ? 'When ON: Students across all departments can submit work only for dates within the current week (Monday through Sunday, Asia/Kolkata). Backdated submissions for prior weeks will be rejected.'
                  : 'When OFF: Students will be allowed to submit work for any previous date, enabling retrospective entry of historical reports and hours.'}
              </p>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div><strong>Admin Actor:</strong> {currentUser?.name} ({currentUser?.role})</div>
              <div><strong>Current Setting:</strong> {rules.weeklyRestriction ? 'ON' : 'OFF'}</div>
              <div><strong>Target Setting:</strong> {pendingState ? 'ON' : 'OFF'}</div>
              <div><strong>Target Policy:</strong> {pendingState ? 'Current week only' : 'Any past date allowed'}</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleConfirmChange}
                className="px-4 py-2 rounded-xl bg-iei-navy-950 hover:bg-slate-900 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Apply Setting</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
