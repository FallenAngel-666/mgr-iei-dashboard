import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { createCommunityUpdate } from '../../services/firebaseService';
import { uploadInstitutionalImage } from '../../utils/uploadHelper';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  X, 
  Sparkles,
  ShieldCheck,
  Clock,
  AlertCircle 
} from 'lucide-react';

export function PostUpdateModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [minutesWorked, setMinutesWorked] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!content.trim() || !currentUser) return;

    const h = parseInt(hoursWorked, 10) || 0;
    const m = parseInt(minutesWorked, 10) || 0;

    if (h === 0 && m === 0) {
      setFormError('Please enter the actual time spent on this work (at least 1 minute or hour).');
      return;
    }

    if (h < 0 || h > 24) {
      setFormError('Hours worked must be between 0 and 24.');
      return;
    }

    if (m < 0 || m > 59) {
      setFormError('Minutes worked must be between 0 and 59.');
      return;
    }

    setLoading(true);
    try {
      await createCommunityUpdate({
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        },
        content: content.trim(),
        hoursWorked: h,
        minutesWorked: m,
        totalMinutes: (h * 60) + m,
        imageUrl: previewImage || (imageUrl.trim() ? imageUrl.trim() : null),
        attachmentName: attachmentName.trim() || null
      });

      setContent('');
      setHoursWorked('');
      setMinutesWorked('');
      setImageUrl('');
      setAttachmentName('');
      setPreviewImage(null);
      setFormError('');
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to publish work update.');
      setLoading(false);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const result = await uploadInstitutionalImage(file, 'community-updates');
      setPreviewImage(result.url);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Work Progress with IEI Community">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Author badge preview */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'IEI')}&background=0B2545&color=fff`}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-slate-300"
          />
          <div>
            <div className="text-xs font-bold text-iei-navy-950">
              {currentUser?.name}
            </div>
            <div className="text-[11px] font-semibold text-iei-gold-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentUser?.role}</span>
            </div>
          </div>
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
        )}

        {/* Text Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Work Description & Highlights *
          </label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (formError) setFormError('');
            }}
            placeholder="Describe what work you have completed or ongoing progress for your assigned responsibilities..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 focus:border-iei-navy-500 resize-none"
          />
        </div>

        {/* Duration Tracking: Hours & Minutes Worked */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-iei-navy-950 font-bold text-xs">
            <Clock className="w-4 h-4 text-iei-gold-600" />
            <span>Actual Time Spent on this Work *</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hours Worked *
              </label>
              <input
                type="number"
                min="0"
                max="24"
                placeholder="e.g. 2"
                value={hoursWorked}
                onChange={(e) => {
                  setHoursWorked(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-iei-navy-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Minutes Worked (0–59) *
              </label>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="e.g. 30"
                value={minutesWorked}
                onChange={(e) => {
                  setMinutesWorked(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-iei-navy-500"
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

        {/* Image Attachment (File or URL) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Work Photo / Proof (Optional)
          </label>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors">
              <ImageIcon className="w-4 h-4 text-slate-600" />
              <span>{uploading ? 'Optimizing & Uploading...' : 'Choose Image File'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-400">or enter image URL:</span>
          </div>

          {uploadError && (
            <p className="text-[11px] font-semibold text-rose-600 mt-1.5">{uploadError}</p>
          )}

          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              if (e.target.value) setPreviewImage(e.target.value);
            }}
            placeholder="https://example.com/photo.jpg"
            className="w-full text-xs p-2.5 mt-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
          />

          {previewImage && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-48">
              <img src={previewImage} alt="Preview" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-1 bg-slate-900/70 text-white rounded-full hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Document Attachment Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Document Reference Name (Optional)
          </label>
          <div className="relative">
            <Paperclip className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="e.g. Technovation_Budget_V2.pdf or ECM_Minutes.docx"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg shadow-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-iei-gold-400" />
            <span>{loading ? 'Posting...' : 'Publish Update'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
