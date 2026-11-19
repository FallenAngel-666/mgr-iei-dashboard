import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Edit3, 
  Trash2,
  Building,
  KeyRound,
  Copy,
  Check,
  UserCheck,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { canManageMembers, isStaffCoordinator, isMasterAdmin, ROLE_LIST, ROLES } from '../../config/roles';
import { MemberFormModal } from './MemberFormModal';
import { deleteMember } from '../../services/firebaseService';
import { subscribeToPublicProfile, DEFAULT_PUBLIC_PROFILE } from '../../services/publicProfileService';
import { formatCredentialNotice } from '../../services/credentialService';
import { Modal } from '../common/Modal';

export function MembersList({ members = [] }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [publicProfile, setPublicProfile] = useState(DEFAULT_PUBLIC_PROFILE);

  useEffect(() => {
    const unsub = subscribeToPublicProfile((prof) => {
      if (prof) setPublicProfile(prof);
    });
    return () => unsub();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Credentials viewing modal for Admin
  const [viewingCredentialsMember, setViewingCredentialsMember] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const isMaster = isMasterAdmin(currentUser?.role);
  const canEdit = canManageMembers(currentUser) || isMaster;
  const isAdmin = isStaffCoordinator(currentUser?.role) || isMaster;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Pagination state (scales cleanly for 1,500+ registered members)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m) => {
      const matchesSearch =
        !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.username && m.username.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.membershipId && m.membershipId.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMembers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, safePage, pageSize]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove member "${name}" from the active IEI chapter directory?`)) {
      await deleteMember(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Chapter Administration</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              IEI Committee & Membership Directory
            </h2>
            <p className="text-xs text-slate-500">
              Official roll of Office Bearers, Executive Committee Members, and Staff Coordinator at Dr. M.G.R. DU.
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => {
                setEditingMember(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-iei-gold-400" />
              <span>Add Committee Member</span>
            </button>
          )}
        </div>

        {/* Institutional Patronage: Mentor, Faculty Advisor & Official IEI Mail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pb-4 border-b border-slate-100">
          <div className="p-3.5 rounded-xl bg-iei-navy-950 text-white border border-iei-navy-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-400/15 text-amber-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                {publicProfile.mentor?.roleLabel || 'Mentor'}
              </span>
              <p className="text-xs font-bold text-white truncate">
                {publicProfile.mentor?.name || 'Dr. L. Ramesh'}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {publicProfile.mentor?.designation || 'Past Chairman'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-iei-navy-950 text-white border border-iei-navy-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-400/15 text-amber-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                {publicProfile.facultyAdvisor?.roleLabel || 'Faculty Advisor'}
              </span>
              <p className="text-xs font-bold text-white truncate">
                {publicProfile.facultyAdvisor?.name || 'Dr. Antony Xavier Bronson'}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {publicProfile.facultyAdvisor?.designation || 'Add. Secretary'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-iei-navy-950 text-amber-400 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Official IEI Mail ID
              </span>
              <a
                href={`mailto:${publicProfile.officialEmail || 'iei@drmgrdu.ac.in'}`}
                className="text-xs font-bold text-iei-navy-950 hover:text-amber-700 block truncate transition-colors mt-0.5"
              >
                {publicProfile.officialEmail || 'iei@drmgrdu.ac.in'}
              </a>
              <p className="text-[10px] text-slate-500 mt-0.5">
                MGR IEI Student Chapter Office
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, username, email, ID..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">All Roles ({members.length})</option>
              {ROLE_LIST.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No committee members match your search</h4>
          </div>
        ) : (
          paginatedMembers.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=0B2545&color=fff`}
                      alt={m.name}
                      loading="lazy"
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-2xs shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-iei-navy-950 leading-tight">
                        {m.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.role === ROLES.ADMINISTRATOR
                          ? 'bg-purple-100 text-purple-900 border border-purple-300 font-extrabold'
                          : m.role === ROLES.STAFF_COORDINATOR
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      } mt-1`}>
                        <ShieldCheck className={`w-3 h-3 ${m.role === ROLES.ADMINISTRATOR ? 'text-purple-600' : m.role === ROLES.STAFF_COORDINATOR ? 'text-blue-600' : 'text-amber-600'}`} />
                        {m.role === ROLES.ADMINISTRATOR ? 'Master Administrator' : m.role}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.status}
                  </span>
                </div>

                {/* Username Pill */}
                <div className="mt-3.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Username:
                  </span>
                  <span className="font-mono font-bold text-iei-navy-950">
                    {m.username || 'N/A'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{m.department || 'Engineering'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  {m.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{m.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>ID: {m.membershipId || 'N/A'}</span>

                <div className="flex items-center gap-1">
                  {/* View Credentials (for Admin/Staff Coordinator) */}
                  {isAdmin && m.username && (
                    <button
                      onClick={() => setViewingCredentialsMember(m)}
                      className="p-1.5 rounded-lg text-iei-gold-700 hover:text-iei-gold-800 hover:bg-amber-50"
                      title="View Member Credentials & Copy Details"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMember(m);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-iei-navy-900 hover:bg-slate-100"
                        title="Edit Member Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {m.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar (activates automatically as directory scales to 1,500+ members) */}
      {filteredMembers.length > pageSize && (
        <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-medium">
            Showing <span className="font-bold text-iei-navy-950">{(safePage - 1) * pageSize + 1}</span>–
            <span className="font-bold text-iei-navy-950">{Math.min(safePage * pageSize, filteredMembers.length)}</span> of{' '}
            <span className="font-bold text-iei-navy-950">{filteredMembers.length}</span> members
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
              aria-label="Members per page"
            >
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
              <option value={96}>96 / page</option>
            </select>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2 font-bold text-iei-navy-950">
              Page {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Member Form Modal (Add / Edit) */}
      <MemberFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        memberToEdit={editingMember}
      />

      {/* Admin Credentials Inspection Modal */}
      {viewingCredentialsMember && (
        <Modal
          isOpen={!!viewingCredentialsMember}
          onClose={() => setViewingCredentialsMember(null)}
          title="Member Login Credentials"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={viewingCredentialsMember.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingCredentialsMember.name)}&background=0B2545&color=fff`}
                alt={viewingCredentialsMember.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-300 shadow-xs"
              />
              <div>
                <h4 className="text-sm font-bold text-iei-navy-950">
                  {viewingCredentialsMember.name}
                </h4>
                <div className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-iei-navy-900 text-iei-gold-400 text-[10px] font-bold">
                  {viewingCredentialsMember.role}
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Official Portal Username
                  </span>
                  <span className="font-mono font-bold text-iei-navy-950 text-sm">
                    {viewingCredentialsMember.username}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(viewingCredentialsMember.username, 'username')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 font-semibold text-[11px]"
                >
                  {copiedField === 'username' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Username</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Institutional Password Security
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-700 text-xs">
                      ••••••••••••••••
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Encrypted
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(formatCredentialNotice(viewingCredentialsMember), 'notice')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 font-semibold text-[11px]"
                >
                  {copiedField === 'notice' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied Notice</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Credentials Notice</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Email:</span>
                  <span className="truncate block font-medium">{viewingCredentialsMember.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number:</span>
                  <span className="truncate block font-medium">{viewingCredentialsMember.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => copyToClipboard(formatCredentialNotice(viewingCredentialsMember), 'notice')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-iei-gold-500 hover:bg-iei-gold-600 text-iei-navy-950 text-xs font-bold shadow-xs flex items-center justify-center gap-2"
              >
                {copiedField === 'notice' ? (
                  <>
                    <Check className="w-4 h-4 text-iei-navy-950" />
                    <span>Credentials Notice Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-iei-navy-950" />
                    <span>Copy Complete Notice (WhatsApp / Email)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewingCredentialsMember(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
