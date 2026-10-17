import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS, PRIORITIES } from '../../data/constants';
import { PriorityBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { KavroRecord, Priority } from '../../types';
import { autoFollowUpFromNote, dueDateFromDays } from '../../utils/helpers';

export const KavroView: React.FC = () => {
  const {
    kavroRecords,
    updateKavroRecord,
    addToast,
    sheetId,
    arrangeKavroGoogleSheet,
    isGoogleConnected
  } = useData();

  const [search, setSearch] = useState('');
  const [filterLock, setFilterLock] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterOfficer, setFilterOfficer] = useState('');

  const [selectedRecord, setSelectedRecord] = useState<KavroRecord | null>(null);
  const [isArranging, setIsArranging] = useState(false);
  const [showArrangeModal, setShowArrangeModal] = useState(false);

  // Note taking state
  const [noteText, setNoteText] = useState('');
  const [noteBy, setNoteBy] = useState(OFFICERS[0]);

  const lockedCount = kavroRecords.filter(r => (r.credlockStatus || '').toLowerCase() === 'locked').length;
  const unlockedCount = kavroRecords.length - lockedCount;
  const withOpenFollowUps = kavroRecords.filter(r => (r.followUps || []).some(f => f.status !== 'Done')).length;

  const officersList = useMemo(() => {
    return Array.from(new Set(kavroRecords.map(r => r.recoveryOfficer).filter(Boolean))).sort();
  }, [kavroRecords]);

  const filteredRecords = useMemo(() => {
    return kavroRecords.filter(r => {
      if (filterLock && (r.credlockStatus || '').toLowerCase() !== filterLock.toLowerCase()) return false;
      if (filterPriority && r.priority !== filterPriority) return false;
      if (filterOfficer && r.recoveryOfficer !== filterOfficer) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          r.id,
          r.imei,
          r.firstName,
          r.lastName,
          r.phone,
          r.recoveryOfficer,
          r.merchantName,
          r.serialNumber,
          r.deviceBrand,
          r.deviceModel
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const prioRank = (p: Priority | string) => {
        if (p === 'P1 Critical') return 0;
        if (p === 'P2 High') return 1;
        if (p === 'P3 Normal') return 2;
        return 3;
      };
      const pa = prioRank(a.priority);
      const pb = prioRank(b.priority);
      if (pa !== pb) return pa - pb;
      return (parseInt(String(b.daysOverdue || 0), 10) || 0) - (parseInt(String(a.daysOverdue || 0), 10) || 0);
    });
  }, [kavroRecords, search, filterLock, filterPriority, filterOfficer]);

  // Suggested follow up calculation in real-time as user types
  const liveSuggestion = useMemo(() => {
    if (!selectedRecord || !noteText.trim()) return null;
    return autoFollowUpFromNote(noteText, selectedRecord);
  }, [noteText, selectedRecord]);

  const handleAddNote = () => {
    if (!selectedRecord || !noteText.trim()) {
      addToast('Please enter a note', 'warn');
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const sug = autoFollowUpFromNote(noteText, selectedRecord);

    const updatedNotes = [...(selectedRecord.notes || []), { text: noteText.trim(), by: noteBy, at: now }];
    const updatedFollowUps = [
      {
        type: sug.type,
        owner: sug.owner,
        dueDate: dueDateFromDays(sug.dueInDays),
        reason: sug.reason,
        status: 'Open' as const,
        fromNote: noteText.slice(0, 80),
        createdAt: now
      },
      ...(selectedRecord.followUps || [])
    ];
    const updatedActions = [
      ...(selectedRecord.actions || []),
      { type: 'Note + Follow-up', by: noteBy, at: now, note: sug.type }
    ];

    const updated: KavroRecord = {
      ...selectedRecord,
      notes: updatedNotes,
      followUps: updatedFollowUps,
      actions: updatedActions
    };

    updateKavroRecord(updated);
    setSelectedRecord(updated);
    setNoteText('');
    addToast(`Note saved · Follow-up scheduled: ${sug.type}`, 'success');
  };

  const handleQuickAction = (type: string) => {
    if (!selectedRecord) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const sug = autoFollowUpFromNote(type.toLowerCase(), selectedRecord);

    const updatedActions = [
      ...(selectedRecord.actions || []),
      { type, by: noteBy || 'Portal User', at: now, note: '' }
    ];

    const updatedFollowUps = [
      {
        type: sug.type,
        owner: sug.owner,
        dueDate: dueDateFromDays(sug.dueInDays),
        reason: `From action: ${type}`,
        status: 'Open' as const,
        createdAt: now
      },
      ...(selectedRecord.followUps || [])
    ];

    const updated: KavroRecord = {
      ...selectedRecord,
      currentAction: type,
      actions: updatedActions,
      followUps: updatedFollowUps
    };

    updateKavroRecord(updated);
    setSelectedRecord(updated);
    addToast(`${type} recorded · Follow-up created`, 'success');
  };

  const handleCompleteFollowUp = (index: number) => {
    if (!selectedRecord || !selectedRecord.followUps) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updatedFu = [...selectedRecord.followUps];
    updatedFu[index] = {
      ...updatedFu[index],
      status: 'Done',
      doneAt: now
    };

    const updated: KavroRecord = {
      ...selectedRecord,
      followUps: updatedFu
    };

    updateKavroRecord(updated);
    setSelectedRecord(updated);
    addToast('Follow-up marked as completed', 'success');
  };

  const handleExecuteArrange = async () => {
    setIsArranging(true);
    try {
      const res = await arrangeKavroGoogleSheet();
      if (res.ok) {
        setShowArrangeModal(false);
      }
    } finally {
      setIsArranging(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Principle */}
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Kavro / Device Issues</strong> — Locked &amp; unlocked Credlock devices linked to BNPL loans.
        Add notes → system auto-suggests follow-up action, owner, and due date based on note context.
      </div>

      {/* Google Sheets KAVRO_Devices Standardization Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold grid place-items-center text-lg shrink-0 shadow-xs">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-emerald-950">
                Google Sheets: <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono text-xs">KAVRO_Devices</code>
              </span>
              <span className="text-[10px] bg-emerald-200/90 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Single Header Enforced
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-800/80 mt-0.5">
              Strip all duplicate headers, normalize columns, arrange records, and lock exactly 1 canonical header row.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
            title="Open spreadsheet in Google Sheets"
          >
            <span>Open Sheet</span>
            <span className="text-[10px]">↗</span>
          </a>
          <button
            type="button"
            onClick={() => setShowArrangeModal(true)}
            disabled={isArranging}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <span className={isArranging ? 'animate-spin' : ''}>⚡</span>
            <span>{isArranging ? 'Arranging Sheet…' : 'Arrange & Apply 1 Header'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Total Devices</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{kavroRecords.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">Locked Devices</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#DC2626]">{lockedCount}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Unlocked</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#16A34A]">{unlockedCount}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Open Follow-ups</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706]">{withOpenFollowUps}</div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search IMEI, customer name, phone, officer, merchant..."
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
          />
        </div>

        <select
          value={filterLock}
          onChange={e => setFilterLock(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#3B5BDB]"
        >
          <option value="">All lock status</option>
          <option value="Locked">Locked</option>
          <option value="Unlocked">Unlocked</option>
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#3B5BDB]"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterOfficer}
          onChange={e => setFilterOfficer(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#3B5BDB]"
        >
          <option value="">All recovery officers</option>
          {officersList.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Kavro Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-2xl mb-1">📱</div>
              <div className="font-semibold text-sm">No Kavro device records match</div>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">IMEI / Model</th>
                  <th className="py-2.5 px-3">Lock Status</th>
                  <th className="py-2.5 px-3">Overdue</th>
                  <th className="py-2.5 px-3">Outstanding</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Recovery Officer</th>
                  <th className="py-2.5 px-3">Follow-up</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(r => {
                  const openFu = (r.followUps || []).filter(f => f.status !== 'Done');
                  const lastFu = openFu[0];
                  const isLocked = (r.credlockStatus || '').toLowerCase() === 'locked';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{r.id}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{r.firstName} {r.lastName}</div>
                        <div className="text-[11px] text-slate-400">{r.phone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <code className="text-[11px] font-mono text-slate-700 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">
                          {r.imei}
                        </code>
                        <div className="text-[11px] text-slate-500 mt-0.5">{r.deviceBrand} {r.deviceModel}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEE2E2] text-[#B91C1C]">Locked</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">Unlocked</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {r.daysOverdue}d
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                        ₦{Number(r.outstandingBalance || r.outstanding || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3"><PriorityBadge priority={r.priority} /></td>
                      <td className="py-2.5 px-3 text-slate-700">{r.recoveryOfficer || '—'}</td>
                      <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                        {lastFu ? (
                          <div>
                            <span className="font-semibold text-slate-800">{lastFu.type}</span>
                            <div className="text-slate-400">{lastFu.dueDate}</div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(r);
                            setNoteText('');
                          }}
                          className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Kavro Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`${selectedRecord.id} · ${selectedRecord.firstName} ${selectedRecord.lastName}`}
          maxWidth="max-w-[680px]"
          footer={
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="px-4 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4">
            {/* Spec info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
              <div><strong>IMEI:</strong> <br /><code className="font-mono text-[11px]">{selectedRecord.imei}</code></div>
              <div><strong>Serial Number:</strong> <br />{selectedRecord.serialNumber || '—'}</div>
              <div><strong>Device:</strong> <br />{selectedRecord.deviceBrand} {selectedRecord.deviceModel}</div>
              <div><strong>Status:</strong> <br />{(selectedRecord.credlockStatus || '').toLowerCase() === 'locked' ? <span className="font-bold text-red-600">Locked</span> : <span className="font-bold text-emerald-600">Unlocked</span>}</div>
              <div><strong>Days Overdue:</strong> <br /><strong>{selectedRecord.daysOverdue}</strong> days</div>
              <div><strong>Outstanding Balance:</strong> <br />₦{Number(selectedRecord.outstandingBalance || selectedRecord.outstanding || 0).toLocaleString()}</div>
              <div><strong>Priority:</strong> <br /><PriorityBadge priority={selectedRecord.priority} /></div>
              <div><strong>Recovery Officer:</strong> <br />{selectedRecord.recoveryOfficer || '—'}</div>
              <div><strong>Customer Phone:</strong> <br />{selectedRecord.phone}</div>
              <div><strong>Merchant:</strong> <br />{selectedRecord.merchantName || '—'}</div>
              <div><strong>Location:</strong> <br />{selectedRecord.city}, {selectedRecord.state}</div>
              <div><strong>Email:</strong> <br />{selectedRecord.email || '—'}</div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100">
              <strong className="block text-xs uppercase text-slate-500 mb-2">Quick Operations</strong>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAction('Request Unlock')}
                  className="px-3 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Request Unlock
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('Confirm Lock')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200"
                >
                  Confirm Lock
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('Call Customer')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200"
                >
                  Call Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('Escalate')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200"
                >
                  Escalate
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('Technical Check')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200"
                >
                  Technical Check
                </button>
              </div>
            </div>

            {/* Note taking with auto NLP follow-up */}
            <div className="pt-2 border-t border-slate-100">
              <strong className="block text-xs uppercase text-slate-500 mb-2">
                Add Note (with intelligent auto follow-up scheduling)
              </strong>
              <textarea
                rows={2}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="e.g. Customer promised partial payment on Friday — call to verify unlock..."
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
              />

              {liveSuggestion && (
                <div className="mt-1.5 text-xs bg-indigo-50 text-indigo-900 border border-indigo-100 p-2 rounded-lg">
                  Suggested follow-up: <strong className="font-bold">{liveSuggestion.type}</strong> assigned to <strong className="font-bold">{liveSuggestion.owner}</strong> in {liveSuggestion.dueInDays}d ({liveSuggestion.reason})
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <select
                  value={noteBy}
                  onChange={e => setNoteBy(e.target.value)}
                  className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                >
                  {OFFICERS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-3.5 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Add note + auto follow-up
                </button>
              </div>
            </div>

            {/* Follow-ups list */}
            <div className="pt-2 border-t border-slate-100">
              <strong className="block text-xs uppercase text-slate-500 mb-2">
                Follow-ups ({(selectedRecord.followUps || []).length})
              </strong>
              {(selectedRecord.followUps || []).length === 0 ? (
                <div className="text-xs text-slate-400">No scheduled follow-ups</div>
              ) : (
                <div className="space-y-2">
                  {selectedRecord.followUps.map((fu, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {fu.type} → {fu.owner} <span className="font-normal text-slate-500">· due {fu.dueDate}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{fu.reason}</div>
                      </div>
                      <div>
                        {fu.status === 'Done' ? (
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            Done
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCompleteFollowUp(i)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs shadow-xs"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes history */}
            <div className="pt-2 border-t border-slate-100">
              <strong className="block text-xs uppercase text-slate-500 mb-2">
                Notes History ({(selectedRecord.notes || []).length})
              </strong>
              {(selectedRecord.notes || []).length === 0 ? (
                <div className="text-xs text-slate-400">No notes recorded yet</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedRecord.notes.slice().reverse().map((n, i) => (
                    <div key={i} className="p-2.5 bg-white border border-slate-100 rounded-lg text-xs">
                      <div className="text-slate-800 font-medium">{n.text}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{n.by} · {n.at}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Log */}
            <div className="pt-2 border-t border-slate-100">
              <strong className="block text-xs uppercase text-slate-500 mb-2">
                Action Log ({(selectedRecord.actions || []).length})
              </strong>
              {(selectedRecord.actions || []).length === 0 ? (
                <div className="text-xs text-slate-400">No actions logged</div>
              ) : (
                <div className="space-y-1 text-xs text-slate-500 max-h-32 overflow-y-auto">
                  {selectedRecord.actions.slice().reverse().map((act, i) => (
                    <div key={i}>
                      {act.at} · <strong className="text-slate-700">{act.type}</strong> by {act.by} {act.note ? `— ${act.note}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Arrange KAVRO_Devices Modal */}
      {showArrangeModal && (
        <Modal
          isOpen={showArrangeModal}
          onClose={() => setShowArrangeModal(false)}
          title="Standardize Google Sheet WHERE KAVRO_Devices"
          maxWidth="max-w-[620px]"
        >
          <div className="space-y-4 text-xs sm:text-[13px] text-slate-700">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 leading-relaxed text-emerald-950">
              <strong className="font-bold">Automated Sheet Standardization:</strong> This operation inspects and organizes the <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-emerald-200">KAVRO_Devices</code> tab in Google Sheet <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-emerald-200">{sheetId}</code>:
              <ul className="list-disc list-inside mt-2 space-y-1 text-emerald-900 text-xs">
                <li>Detects and eliminates all scattered, duplicate, or repeated header rows.</li>
                <li>Applies <strong>only ONE unified header row</strong> at Row 1 and freezes it.</li>
                <li>Aligns every record strictly across standard column positions.</li>
                <li>De-duplicates device records by IMEI and sorts by locked status and overdue balance.</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Single Canonical Header Row (Row 1):
              </div>
              <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                {[
                  'IMEI',
                  'Recovery Officer',
                  'First Name',
                  'Last Name',
                  'Phone',
                  'Credlock Status',
                  'Device Brand',
                  'Device Model',
                  'Days Overdue',
                  'Outstanding Balance (₦)',
                  'Lock Date',
                  'Notes'
                ].map((col, idx) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold"
                  >
                    {idx + 1}. {col}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
              <span>Current records in queue: <strong className="font-bold text-slate-800">{kavroRecords.length}</strong></span>
              <span className={isGoogleConnected ? 'text-emerald-700 font-semibold flex items-center gap-1' : 'text-amber-700 font-semibold'}>
                {isGoogleConnected ? '✓ Google Account Connected' : 'Google Sign-in Prompt will open'}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowArrangeModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteArrange}
                disabled={isArranging}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className={isArranging ? 'animate-spin' : ''}>⚡</span>
                <span>{isArranging ? 'Standardizing Google Sheet…' : 'Execute & Apply 1 Header Now'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
