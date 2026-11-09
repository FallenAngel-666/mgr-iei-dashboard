import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CalendarCheck, 
  Plus, 
  FileDown, 
  Users, 
  Clock, 
  ShieldCheck, 
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { canRecordAttendance } from '../../config/roles';
import { RecordAttendanceModal } from './RecordAttendanceModal';
import { Modal } from '../common/Modal';
import { generateAttendancePDF } from '../../services/pdfService';

export function AttendanceList({ attendance = [], events = [], members = [] }) {
  const { currentUser } = useAuth();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const canRecord = canRecordAttendance(currentUser?.role);

  const filteredAttendance = attendance.filter((a) =>
    a.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.recordedByName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <CalendarCheck className="w-4 h-4" />
              <span>Statutory Compliance</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Committee Meeting & Event Attendance
            </h2>
            <p className="text-xs text-slate-500">
              Official attendance logs strictly associated with IEI Student Chapter committee meetings and official events.
            </p>
          </div>

          {canRecord && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-iei-gold-400" />
              <span>Record Meeting Attendance</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meeting, category, or recorder..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredAttendance.length} statutory records preserved
          </span>
        </div>
      </div>

      {/* Attendance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAttendance.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No attendance records found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Select an official committee meeting or event to create an attendance log.
            </p>
          </div>
        ) : (
          filteredAttendance.map((att) => {
            const records = att.records || [];
            const presentCount = records.filter((r) => r.status === 'Present').length;
            const absentCount = records.filter((r) => r.status === 'Absent').length;
            const excusedCount = records.filter((r) => r.status === 'Excused').length;
            const total = records.length;
            const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

            return (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {att.category || 'Committee Meeting'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {att.date}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-iei-navy-950">
                    {att.eventTitle}
                  </h3>

                  {att.notes && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{att.notes}"
                    </p>
                  )}

                  {/* Attendance Stats Pills */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Present</span>
                      <span className="text-base font-black text-emerald-900">{presentCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent</span>
                      <span className="text-base font-black text-rose-900">{absentCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Excused</span>
                      <span className="text-base font-black text-amber-900">{excusedCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500">
                    Recorded by: <strong>{att.recordedByName}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRecord(att)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      View Roll Call
                    </button>
                    <button
                      onClick={() => generateAttendancePDF(att)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-iei-navy-900 hover:bg-iei-navy-800 text-white font-semibold"
                      title="Download Signed Attendance Sheet PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 text-iei-gold-400" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Attendance Modal */}
      <RecordAttendanceModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        events={events}
        members={members}
      />

      {/* Roll Call Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Roll Call — ${selectedRecord.eventTitle}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Meeting Date</span>
                <span className="font-bold text-slate-800">{selectedRecord.date}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Category</span>
                <span className="font-bold text-slate-800">{selectedRecord.category}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Official Recorder</span>
                <span className="font-bold text-slate-800">{selectedRecord.recordedByName}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Member Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRecord.records?.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold text-iei-navy-950">{r.name}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{r.role}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Excused'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => generateAttendancePDF(selectedRecord)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-iei-navy-900 text-white text-xs font-bold"
              >
                <FileDown className="w-3.5 h-3.5 text-iei-gold-400" />
                <span>Export Official PDF Sheet</span>
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
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
