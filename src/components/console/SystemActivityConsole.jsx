import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canAccessActivityConsole, ROLES } from '../../config/roles';
import { subscribeToAuditLogs, AUDIT_MODULES, AUDIT_ACTIONS } from '../../services/auditService';
import {
  Terminal,
  Search,
  Filter,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Lock,
  Clock,
  User,
  Database,
  RefreshCw,
  Hash
} from 'lucide-react';

export function SystemActivityConsole() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedId, setCopiedId] = useState(null);

  // Subscribe to live audit stream
  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((liveLogs) => {
      setLogs(liveLogs);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorized = canAccessActivityConsole(currentUser);

  // Filter logs based on search, module, status, action, and date range
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actorName = (log.actorName || '').toLowerCase();
        const actorUsername = (log.actorUsername || '').toLowerCase();
        const actorUid = (log.actorUid || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const targetId = (log.targetId || '').toLowerCase();
        const correlationId = (log.correlationId || '').toLowerCase();

        const matches =
          actorName.includes(q) ||
          actorUsername.includes(q) ||
          actorUid.includes(q) ||
          action.includes(q) ||
          details.includes(q) ||
          targetId.includes(q) ||
          correlationId.includes(q);

        if (!matches) return false;
      }

      // 2. Module Filter
      if (selectedModule !== 'ALL' && log.module !== selectedModule) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'ALL' && (log.status || '').toUpperCase() !== selectedStatus) {
        return false;
      }

      // 4. Action Filter
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }

      // 5. Date From
      if (dateFrom) {
        const logDate = new Date(log.timestamp);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (logDate < fromDate) return false;
      }

      // 6. Date To
      if (dateTo) {
        const logDate = new Date(log.timestamp);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (logDate > toDate) return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedModule, selectedStatus, selectedAction, dateFrom, dateTo]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedModule, selectedStatus, selectedAction, dateFrom, dateTo, pageSize]);

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  // Security guard check
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-[#0b0f19] border-2 border-rose-600/40 rounded-2xl shadow-2xl font-mono text-slate-200">
        <div className="flex items-center gap-3 text-rose-500 mb-4 pb-3 border-b border-rose-900/50">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-rose-400">
              Access Denied — Security Clearance Level 5 Required
            </h2>
            <p className="text-xs text-rose-300/80">
              MGR IEI SEC-ENGINE // VIOLATION_CODE: 403_FORBIDDEN_ROLE
            </p>
          </div>
        </div>
        <div className="space-y-3 text-xs leading-relaxed text-slate-300 bg-rose-950/20 p-4 rounded-xl border border-rose-900/40">
          <p>
            <span className="text-rose-400 font-bold">[DENIED]:</span> The System Activity Console contains immutable institutional audit records.
          </p>
          <p>
            Access is strictly restricted to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-200 ml-2">
            <li><strong className="text-emerald-400">CBN Joint Secretary</strong> (Sri Priyan S)</li>
            <li><strong className="text-emerald-400">Master Administrator</strong> (System Superuser)</li>
          </ul>
          <p className="text-slate-400 pt-2 border-t border-rose-900/40">
            Attempted Identity: <span className="text-amber-400">{currentUser?.name || 'Unknown'}</span> ({currentUser?.role || 'Guest'})
          </p>
        </div>
      </div>
    );
  }

  // Export filtered logs as JSON for external statutory audit
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MGR_IEI_Audit_Log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyToClipboard = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedModule('ALL');
    setSelectedStatus('ALL');
    setSelectedAction('ALL');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-4 font-mono text-slate-200">
      {/* TERMINAL WINDOW FRAME */}
      <div className="bg-[#0a0e17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Terminal Header Bar */}
        <div className="bg-[#0f1524] px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Window control dots + title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block border border-rose-600"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block border border-amber-600"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block border border-emerald-600"></span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-100 tracking-wider">
                MGR-IEI-SEC-CORE :: SYSTEM ACTIVITY CONSOLE
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                IMMUTABLE AUDIT STREAM
              </span>
            </div>
          </div>

          {/* User clearance badge & export */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/60 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Clearance:</span>
              <span className="text-[11px] font-bold text-emerald-400">
                {currentUser?.role === ROLES.ADMINISTRATOR ? 'MASTER ADMIN' : 'CBN JOINT SECRETARY'}
              </span>
            </div>

            <button
              onClick={handleExportJSON}
              title="Export filtered records for official audit"
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-500/40 rounded-md transition-all text-[11px] font-semibold active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Live Metrics & Terminal Prompt Status */}
        <div className="bg-[#070b12] px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">iei-sec@mgr-srv01:~$</span>
            <span className="text-slate-300">audit-tail --immutable --collection=system_audit_logs</span>
            <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-pulse ml-0.5"></span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div>
              <span className="text-slate-400">Total Recorded: </span>
              <strong className="text-emerald-400 font-bold">{logs.length}</strong>
            </div>
            <div>
              <span className="text-slate-400">Matching Filter: </span>
              <strong className="text-amber-400 font-bold">{filteredLogs.length}</strong>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Live Feed</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-[#0d1322] border-b border-slate-800 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search username, UID, action, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080c16] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
              />
            </div>

            {/* Module Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full bg-[#080c16] border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
              >
                <option value="ALL">Module: ALL</option>
                {Object.values(AUDIT_MODULES).map((mod) => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#080c16] border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
              >
                <option value="ALL">Status: ALL</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="DENIED">DENIED</option>
              </select>
            </div>

            {/* Date From */}
            <div className="md:col-span-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Filter Date From"
                className="w-full bg-[#080c16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
              />
            </div>

            {/* Date To */}
            <div className="md:col-span-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Filter Date To"
                className="w-full bg-[#080c16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Quick Filter Badges + Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Quick Filter:
              </span>
              {['AUTH', 'WORK', 'EVENTS', 'MEMBERS', 'SECURITY'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setSelectedModule(selectedModule === mod ? 'ALL' : mod)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    selectedModule === mod
                      ? 'bg-emerald-600 text-slate-950 border-emerald-400'
                      : 'bg-[#080c16] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {mod}
                </button>
              ))}
              {selectedStatus !== 'ALL' || selectedModule !== 'ALL' || searchQuery || dateFrom || dateTo ? (
                <button
                  onClick={resetFilters}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-amber-400 hover:text-amber-300 underline ml-2"
                >
                  Reset Filters
                </button>
              ) : null}
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-2 text-slate-400">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#080c16] border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-300 text-[11px] focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Stream Table / Feed */}
        <div className="overflow-x-auto">
          {pagedLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs">
              <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p>[NO_MATCHING_AUDIT_RECORDS_FOUND]</p>
              <p className="text-[11px] text-slate-600 mt-1">Adjust search terms or reset date and module filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 font-mono text-xs">
              {pagedLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isSuccess = log.status === 'SUCCESS';
                const isDenied = log.status === 'DENIED';
                const isFailed = log.status === 'FAILED';

                // Status tag styling
                const statusBadge = isSuccess ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SUCCESS
                  </span>
                ) : isDenied ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> DENIED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> FAILED
                  </span>
                );

                // Module tag styling
                const moduleBadgeColor = {
                  AUTH: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30',
                  PROFILE: 'text-purple-400 border-purple-500/30 bg-purple-950/30',
                  CHAT: 'text-blue-400 border-blue-500/30 bg-blue-950/30',
                  WORK: 'text-amber-400 border-amber-500/30 bg-amber-950/30',
                  EVENTS: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
                  GALLERY: 'text-pink-400 border-pink-500/30 bg-pink-950/30',
                  MEMBERS: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/30',
                  SECURITY: 'text-rose-400 border-rose-500/30 bg-rose-950/30'
                }[log.module] || 'text-slate-300 border-slate-700 bg-slate-900';

                const formattedTime = new Date(log.timestamp).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                });

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 transition-colors ${
                      isExpanded ? 'bg-[#0f172a]' : 'hover:bg-[#0e1424]'
                    }`}
                  >
                    {/* Main Log Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Left: Timestamp + Status + Module + Action */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-400 text-[11px] select-all">
                          [{formattedTime}]
                        </span>
                        {statusBadge}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${moduleBadgeColor}`}>
                          [{log.module}]
                        </span>
                        <span className="font-bold text-white tracking-wide">
                          {log.action}
                        </span>
                      </div>

                      {/* Right: Actor info + Expand button */}
                      <div className="flex items-center gap-3">
                        <div className="text-[11px] text-right">
                          <span className="text-emerald-300 font-semibold">{log.actorName}</span>
                          <span className="text-slate-400 ml-1.5 font-mono">
                            (@{log.actorUsername || 'user'})
                          </span>
                          <span className="hidden md:inline text-amber-300/80 ml-1.5 text-[10px]">
                            [{log.actorRole}]
                          </span>
                        </div>

                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition-all"
                        >
                          <span>{isExpanded ? 'COLLAPSE' : 'DETAILS'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Short Details Preview */}
                    <div className="mt-1.5 text-[11px] text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">&gt;&gt;</span>
                      <span className="flex-1 select-text">{log.details}</span>
                      {log.targetId && log.targetId !== 'N/A' && (
                        <span className="text-slate-400 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          target: {log.targetId}
                        </span>
                      )}
                    </div>

                    {/* EXPANDED FULL AUDIT METADATA VIEW */}
                    {isExpanded && (
                      <div className="mt-3 p-3.5 bg-[#050811] rounded-xl border border-slate-800 text-[11px] space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                          <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            IMMUTABLE AUDIT LOG RECORD (READ-ONLY)
                          </span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(log, null, 2), log.id)}
                            className="text-[10px] text-slate-400 hover:text-emerald-300 underline font-mono"
                          >
                            {copiedId === log.id ? 'COPIED TO CLIPBOARD' : 'COPY RAW JSON'}
                          </button>
                        </div>

                        {/* Record grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                          <div><span className="text-slate-400">Log ID: </span><span className="text-white select-all">{log.id}</span></div>
                          <div><span className="text-slate-400">Timestamp: </span><span className="text-white select-all">{log.timestamp}</span></div>
                          <div><span className="text-slate-400">Actor UID: </span><span className="text-emerald-300 select-all">{log.actorUid}</span></div>
                          <div><span className="text-slate-400">Actor Role: </span><span className="text-amber-300">{log.actorRole}</span></div>
                          <div><span className="text-slate-400">Correlation ID: </span><span className="text-cyan-300 select-all">{log.correlationId || 'N/A'}</span></div>
                          <div><span className="text-slate-400">Target ID: </span><span className="text-slate-200 select-all">{log.targetId || 'N/A'}</span></div>
                        </div>

                        {/* Previous & New Values JSON (Sanitized) */}
                        {(log.previousValues || log.newValues) && (
                          <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {log.previousValues && (
                              <div>
                                <span className="text-rose-400 font-bold block mb-1">Previous Values:</span>
                                <pre className="bg-[#090d18] p-2 rounded border border-rose-950/40 text-[10px] text-slate-300 overflow-x-auto max-h-32">
                                  {JSON.stringify(log.previousValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <span className="text-emerald-400 font-bold block mb-1">New Values:</span>
                                <pre className="bg-[#090d18] p-2 rounded border border-emerald-950/40 text-[10px] text-slate-300 overflow-x-auto max-h-32">
                                  {JSON.stringify(log.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 truncate">
                          User Agent: {log.userAgent || 'Unknown'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Terminal Footer with Pagination & Immutability Notice */}
        <div className="bg-[#0f1524] px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Immutability Guarantee Notice */}
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>TAMPER-PROOF AUDIT GUARANTEE:</strong> System log records are permanently append-only. No edit or delete commands exist.
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px]">
              Showing <strong className="text-white">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-white">{Math.min(startIndex + pageSize, totalItems)}</strong> of{' '}
              <strong className="text-white">{totalItems}</strong> entries
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-1 rounded bg-[#070a13] text-emerald-400 font-bold text-[11px] border border-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
