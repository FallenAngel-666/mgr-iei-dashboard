import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Award, 
  Plus, 
  Download, 
  Search, 
  FileCheck, 
  Calendar, 
  User,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { createCertificate } from '../../services/firebaseService';

export function CertificatesList({ certificates = [], members = [] }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [issuedToName, setIssuedToName] = useState('');
  const [recipientRole, setRecipientRole] = useState('Executive Member');
  const [category, setCategory] = useState('Merit & Recognition');
  const [issuedBy, setIssuedBy] = useState('The Institution of Engineers (India) - MGR Chapter');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCertificates = certificates.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.issuedToName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !issuedToName.trim()) return;
    setLoading(true);
    try {
      await createCertificate({
        title: title.trim(),
        issuedToName: issuedToName.trim(),
        recipientRole,
        category,
        issuedBy: issuedBy.trim(),
        issueDate,
        fileUrl: fileUrl.trim() || 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&auto=format&fit=crop&q=80'
      });

      setTitle('');
      setIssuedToName('');
      setFileUrl('');
      setLoading(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Official Recognitions</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Certificates & Credentials Repository
            </h2>
            <p className="text-xs text-slate-500">
              Institutional certificates issued for symposium leadership, organizing committees, and national awards.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-iei-gold-400" />
            <span>Issue / Upload Certificate</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search certificate title, recipient..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredCertificates.length} verified certificates
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCertificates.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No certificates found</h4>
          </div>
        ) : (
          filteredCertificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {cert.fileUrl && (
                <div className="h-40 bg-slate-900 overflow-hidden relative">
                  <img
                    src={cert.fileUrl}
                    alt={cert.title}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                    {cert.category}
                  </span>
                </div>
              )}

              <div className="p-5 flex-1">
                <h3 className="text-sm font-bold text-iei-navy-950">
                  {cert.title}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <User className="w-3.5 h-3.5 text-iei-navy-700 shrink-0" />
                    <span>Issued To: {cert.issuedToName}</span>
                    <span className="text-[10px] text-slate-400">({cert.recipientRole})</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Authority: {cert.issuedBy}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Issued: {cert.issueDate}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Credential
                </span>

                <a
                  href={cert.fileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-iei-navy-700 hover:text-iei-navy-900 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Certificate Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Chapter Certificate">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Certificate Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Certificate of Appreciation — Technovation Organizing Lead"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient Member Name *
              </label>
              <input
                required
                type="text"
                value={issuedToName}
                onChange={(e) => setIssuedToName(e.target.value)}
                placeholder="e.g. N. Ananya"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Merit & Recognition">Merit & Recognition</option>
                <option value="Organizing Committee">Organizing Committee</option>
                <option value="Technical Symposium">Technical Symposium</option>
                <option value="Leadership Award">Leadership Award</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issuing Authority
              </label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Issue
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Certificate Image / PDF Link
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://example.com/certificate.pdf"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg shadow-sm"
            >
              {loading ? 'Registering...' : 'Save Certificate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
