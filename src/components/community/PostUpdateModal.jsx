import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { createCommunityUpdate } from '../../services/firebaseService';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  X, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

export function PostUpdateModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    setLoading(true);
    try {
      await createCommunityUpdate({
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        },
        content: content.trim(),
        imageUrl: previewImage || (imageUrl.trim() ? imageUrl.trim() : null),
        attachmentName: attachmentName.trim() || null
      });

      setContent('');
      setImageUrl('');
      setAttachmentName('');
      setPreviewImage(null);
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
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

        {/* Text Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Work Description & Highlights *
          </label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe what work you have completed or ongoing progress for your assigned responsibilities..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 focus:border-iei-navy-500 resize-none"
          />
        </div>

        {/* Image Attachment (File or URL) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Work Photo / Proof (Optional)
          </label>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors">
              <ImageIcon className="w-4 h-4 text-slate-600" />
              <span>Choose Image File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-400">or enter image URL:</span>
          </div>

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
