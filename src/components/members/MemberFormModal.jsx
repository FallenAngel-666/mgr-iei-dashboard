import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ROLE_LIST, ROLES } from '../../config/roles';
import { saveMember, getMembers } from '../../services/firebaseService';
import { 
  generateUsername, 
  generateStrongPassword, 
  formatCredentialNotice 
} from '../../services/credentialService';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  ShieldCheck, 
  KeyRound, 
  Copy, 
  Check, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export function MemberFormModal({ isOpen, onClose, memberToEdit = null, onSaved }) {
  const [name, setName] = useState(memberToEdit ? memberToEdit.name : '');
  const [email, setEmail] = useState(memberToEdit ? memberToEdit.email : '');
  const [role, setRole] = useState(memberToEdit ? memberToEdit.role : ROLES.EXECUTIVE_MEMBER);
  const [department, setDepartment] = useState(memberToEdit ? memberToEdit.department : 'Computer Science & Engineering');
  const [membershipId, setMembershipId] = useState(memberToEdit ? memberToEdit.membershipId : '');
  const [year, setYear] = useState(memberToEdit ? memberToEdit.year : 'Third Year (III)');
  const [phone, setPhone] = useState(memberToEdit ? memberToEdit.phone : '');
  const [status, setStatus] = useState(memberToEdit ? memberToEdit.status : 'Active');

  // Generated credentials
  const [username, setUsername] = useState(memberToEdit ? (memberToEdit.username || '') : '');
  const [password, setPassword] = useState(memberToEdit ? (memberToEdit.password || '') : '');
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Success dialog state after creating new member
  const [createdMemberData, setCreatedMemberData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    getMembers().then((list) => setAllMembers(list));
  }, [isOpen]);

  // Dynamically update username and password suggestions as user types name/role (only for new members)
  useEffect(() => {
    if (!memberToEdit && name.trim()) {
      const generatedUser = generateUsername(name, role, allMembers);
      setUsername(generatedUser);
      if (!password) {
        setPassword(generateStrongPassword(name));
      }
    }
  }, [name, role, memberToEdit, allMembers]);

  const handleRegeneratePassword = () => {
    setPassword(generateStrongPassword(name));
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const finalUsername = username.trim() || generateUsername(name, role, allMembers);
      const finalPassword = password.trim() || generateStrongPassword(name);

      const saved = await saveMember({
        id: memberToEdit ? memberToEdit.id : undefined,
        name: name.trim(),
        email: email.trim(),
        role,
        department,
        membershipId: membershipId.trim() || `IEI-MGR-${Math.floor(1000 + Math.random() * 9000)}`,
        year,
        phone: phone.trim(),
        username: finalUsername,
        password: finalPassword,
        status
      });

      setLoading(false);
      if (onSaved) onSaved(saved);

      if (!memberToEdit) {
        // Show created credentials modal
        setCreatedMemberData(saved);
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCloseAll = () => {
    setCreatedMemberData(null);
    onClose();
  };

  if (createdMemberData) {
    return (
      <Modal
        isOpen={true}
        onClose={handleCloseAll}
        title="Member Account & Credentials Created Successfully"
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                {createdMemberData.name} Registered
              </h4>
              <p className="text-xs text-emerald-700">
                Designated as <span className="font-bold">{createdMemberData.role}</span>. Provide these login credentials to the member.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            {/* Username Row */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Official Portal Username
                </span>
                <span className="font-mono font-bold text-iei-navy-950 text-sm">
                  {createdMemberData.username}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(createdMemberData.username, 'username')}
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

            {/* Password Row */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Generated Password
                </span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {createdMemberData.password}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(createdMemberData.password, 'password')}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 font-semibold text-[11px]"
              >
                {copiedField === 'password' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Password</span>
                  </>
                )}
              </button>
            </div>

            {/* Member Details Summary */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email:</span>
                <span className="truncate block font-medium">{createdMemberData.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone:</span>
                <span className="truncate block font-medium">{createdMemberData.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Copy Full Credentials Block */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => copyToClipboard(formatCredentialNotice(createdMemberData), 'all')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-iei-gold-500 hover:bg-iei-gold-600 text-iei-navy-950 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {copiedField === 'all' ? (
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
              onClick={handleCloseAll}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-sm"
            >
              Done & Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memberToEdit ? "Edit Committee Member Details" : "Register New Committee Member"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. SRIMAN NARAYANA MOORTHY S"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Email *
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. member@gmail.com"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Chapter Role *
            </label>
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white font-semibold"
            >
              {ROLE_LIST.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto-Generated Credentials Preview Box */}
        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-iei-navy-50/40 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-iei-navy-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-iei-gold-600" />
              Automatic Credentials Generator
            </span>
            <span className="text-[10px] text-slate-500">
              Format: &lt;firstname&gt;.&lt;role&gt;-&lt;num&gt;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                Generated Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="auto-generated username"
                  className="w-full text-xs font-mono font-bold p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">
                  Generated Password
                </label>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-[10px] text-iei-navy-700 hover:text-iei-navy-900 font-semibold flex items-center gap-1"
                  title="Generate new password"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="auto-generated strong password"
                className="w-full text-xs font-mono font-bold p-2 rounded-lg border border-slate-300 bg-white text-emerald-800"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication Engg">Electronics & Communication Engg</option>
              <option value="Electrical & Electronics Engg">Electrical & Electronics Engg</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Biomedical Engineering">Biomedical Engineering</option>
              <option value="Aeronautical Engineering">Aeronautical Engineering</option>
              <option value="General Engineering">General Engineering</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Academic Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="Final Year (IV)">Final Year (IV)</option>
              <option value="Third Year (III)">Third Year (III)</option>
              <option value="Second Year (II)">Second Year (II)</option>
              <option value="First Year (I)">First Year (I)</option>
              <option value="Faculty">Faculty Coordinator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Membership ID
            </label>
            <input
              type="text"
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
              placeholder="e.g. IEI-MGR-025"
              className="w-full text-xs p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending Verification</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-iei-gold-400" />
            <span>{loading ? 'Saving...' : memberToEdit ? 'Save Changes' : 'Register Member & Generate Credentials'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
