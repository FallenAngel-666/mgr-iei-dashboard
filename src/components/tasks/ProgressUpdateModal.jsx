import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { recordWorkProgress } from '../../services/approvalService';
import { isDateInCurrentWeekKolkata, getKolkataCurrentDateString } from '../../utils/dateUtils';
import { uploadFileSafely } from '../../utils/uploadHelper';
import { 
  Send, 
  Clock, 
  Calendar, 
  Upload, 
  Paperclip, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  FileText, 
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

export function ProgressUpdateModal({ isOpen, onClose, task, onProgressRecorded, weeklyRestriction = false }) {
  const { currentUser } = useAuth();
  const [progressPct, setProgressPct] = useState(task?.progress || 0);
  const [workDate, setWorkDate] = useState(getKolkataCurrentDateString());
  const [hoursWorked, setHoursWorked] = useState('');
  const [minutesWorked, setMinutesWorked] = useState('');
  const [description, setDescription] = useState('');
  const [completedWork, setCompletedWork] = useState('');
  const [remainingWork, setRemainingWork] = useState('');
  const [isFinalReport, setIsFinalReport] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !task) return null;

  // Real-time date policy check
  const isDateCompliant = !weeklyRestriction || isDateInCurrentWeekKolkata(workDate);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError(null);

    try {
      // Upload using secure institutional upload helper
      const uploadRes = await uploadFileSafely(file, 'work_evidence');
      const newAtt = {
        name: file.name,
        url: uploadRes.url,
        type: file.type || 'application/octet-stream',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toISOString()
      };
      setAttachments(prev => [...prev, newAtt]);
    } catch (err) {
      // Local fallback for offline/development resilience
      const reader = new FileReader();
      reader.onload = () => {
        const fallbackAtt = {
          name: file.name,
          url: reader.result,
          type: file.type || 'application/octet-stream',
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: new Date().toISOString()
        };
        setAttachments(prev => [...prev, fallbackAtt]);
        setUploadingFile(false);
      };
      reader.onerror = () => {
        setError('Failed to process evidence file: ' + err.message);
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
      return;
    }
    setUploadingFile(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() && !completedWork.trim()) {
      setError('Please provide a progress description or details of work completed so far.');
      return;
    }

    if (weeklyRestriction && !isDateInCurrentWeekKolkata(workDate)) {
      setError('Weekly submission restriction is active. You can only record work completed within the current week (Monday through Sunday).');
      return;
    }

    const h = parseInt(hoursWorked, 10) || 0;
    const m = parseInt(minutesWorked, 10) || 0;
    if (h === 0 && m === 0) {
      setError('Please enter the actual time spent on this work (at least 1 minute or hour).');
      return;
    }
    if (m < 0 || m > 59) {
      setError('Minutes worked must be between 0 and 59.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await recordWorkProgress(
        task,
        {
          progressPercentage: progressPct,
          workDate,
          hoursWorked: h,
          minutesWorked: m,
          description: description.trim(),
          completedWork: completedWork.trim(),
          remainingWork: remainingWork.trim(),
          isFinalReport,
          attachments
        },
        currentUser
      );

      setLoading(false);
      if (onProgressRecorded) onProgressRecorded(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit work progress.');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Work Progress: ${task.title}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Task Summary Banner */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>Assigned by: <strong className="text-slate-800">{task.assignedByName || 'Chapter Officer'}</strong></span>
            <span>Deadline: <strong className="text-slate-800">{task.deadline || 'Ongoing'}</strong></span>
          </div>
          <div className="font-bold text-iei-navy-950 text-sm">{task.title}</div>
          {task.description && (
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">{task.description}</p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Weekly Restriction Banner */}
        {weeklyRestriction && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Weekly Work Submission Restriction is ACTIVE. Work can only be recorded for the current week.</span>
          </div>
        )}

        {/* 1. Date of Progress Update */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date Work Was Performed *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border font-medium ${
                  !isDateCompliant ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
            </div>
            {!isDateCompliant && (
              <p className="text-[10px] text-rose-600 font-bold mt-1">
                Selected date is outside current week. Submission will be blocked while restriction is ON.
              </p>
            )}
          </div>

          {/* Progress Percentage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Work Progress Percentage:
              </label>
              <span className="font-bold text-iei-navy-950 text-xs">{progressPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgressPct(val);
                if (val === 100) setIsFinalReport(true);
              }}
              className="w-full accent-iei-navy-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>0% (Not Started)</span>
              <span>50% (Halfway)</span>
              <span>100% (Completed)</span>
            </div>
          </div>
        </div>

        {/* 2. Duration Tracking: Hours & Minutes Worked */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-iei-navy-950 font-bold">
            <Clock className="w-4 h-4 text-iei-gold-600" />
            <span>Actual Time Spent on this Work *</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hours Worked
              </label>
              <input
                type="number"
                min="0"
                max="24"
                placeholder="e.g. 2"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Minutes Worked (0–59)
              </label>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="e.g. 30"
                value={minutesWorked}
                onChange={(e) => setMinutesWorked(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
              />
            </div>
          </div>
          {(hoursWorked || minutesWorked) && (
            <div className="text-[11px] font-bold text-iei-navy-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <span>Total Session Duration:</span>
              <span className="font-mono text-emerald-700">
                {hoursWorked || 0} hr {minutesWorked || 0} min ({(((Number(hoursWorked) || 0) * 60) + (Number(minutesWorked) || 0))} minutes)
              </span>
            </div>
          )}
        </div>

        {/* 3. Progress Description & Deliverables */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Progress Description / Summary of Updates *
          </label>
          <textarea
            required
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you worked on, milestones achieved, or specific tasks performed..."
            className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Work Completed So Far
            </label>
            <textarea
              rows={2}
              value={completedWork}
              onChange={(e) => setCompletedWork(e.target.value)}
              placeholder="e.g., Prepared draft circular, organized meeting room..."
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remaining Work
            </label>
            <textarea
              rows={2}
              value={remainingWork}
              onChange={(e) => setRemainingWork(e.target.value)}
              placeholder="e.g., Awaiting final sign-off from staff advisor..."
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
            />
          </div>
        </div>

        {/* 4. Evidence / Document / Image Upload */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-iei-gold-600" />
              <span>Upload Work Evidence (Documents &amp; Images)</span>
            </span>
            <label className="px-3 py-1.5 rounded-lg bg-iei-navy-900 hover:bg-iei-navy-800 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Attach File</span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
            </label>
          </div>

          {uploadingFile && (
            <div className="flex items-center gap-2 text-xs text-iei-navy-900 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading evidence to secure storage...</span>
            </div>
          )}

          {attachments.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2 truncate">
                    {att.type?.startsWith('image') ? (
                      <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800 truncate">{att.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              No files attached yet. You can attach PDFs, screenshots, photos, or documents proving work completion.
            </p>
          )}
        </div>

        {/* 5. Final Work Report Submission Toggle */}
        <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="font-bold text-iei-navy-950 block text-xs">
              Submit as Final Work Report for Approval?
            </span>
            <span className="text-[11px] text-slate-600 block">
              Enters the official 2-level institutional approval workflow (First-Level Approver &rarr; Staff Coordinator).
            </span>
          </div>
          <input
            type="checkbox"
            checked={isFinalReport}
            onChange={(e) => {
              setIsFinalReport(e.target.checked);
              if (e.target.checked && progressPct < 100) setProgressPct(100);
            }}
            className="w-4 h-4 accent-iei-navy-900 cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploadingFile || !isDateCompliant}
            className="px-5 py-2 rounded-xl bg-iei-navy-950 hover:bg-slate-900 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Recording Progress...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isFinalReport ? 'Submit Final Report' : 'Save Progress Update'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
