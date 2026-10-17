import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PriorityBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Ticket } from '../../types';
import { computeOfficerStats, scoreClass } from '../../utils/helpers';

export const LeadDashboardView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { currentUser, isLead, pendingUsers } = useAuth();
  const { tickets, kavroRecords, upsertTicket, addToast } = useData();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  if (!isLead()) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <div className="text-3xl mb-2">◆</div>
        <h3 className="font-bold text-lg text-slate-800">Team Lead Access Only</h3>
        <p className="text-xs text-slate-500 mt-1">Please sign in as Team Lead (Joseph Olayemi) to view this dashboard.</p>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status !== 'Resolved');
  const p1Tickets = openTickets.filter(t => t.priority === 'P1 Critical');
  const p2Tickets = openTickets.filter(t => t.priority === 'P2 High');
  const overdueOrEscalated = openTickets.filter(t => t.escalation || t.status === 'Pending');
  const unassigned = openTickets.filter(t => !t.owner);

  const pending = pendingUsers();
  const lockedKavro = kavroRecords.filter(r => (r.credlockStatus || '').toLowerCase() === 'locked');
  const kavroP1 = kavroRecords.filter(r => r.priority === 'P1 Critical');

  const officers = ['Tosin', 'Peter', 'Zainab'];

  const quickResolve = (t: Ticket) => {
    const updated: Ticket = {
      ...t,
      status: 'Resolved',
      resolvedAt: new Date().toISOString().slice(0, 16),
      nextAction: 'Closed',
      resolutionNotes: t.resolutionNotes || 'Resolved by Lead'
    };
    upsertTicket(updated);
    setSelectedTicket(null);
    addToast(`Ticket ${t.id} marked as Resolved`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Lead Hero */}
      <div className="bg-gradient-to-r from-[#060527] to-[#3B5BDB] text-white rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Team Lead Command Dashboard</h2>
          <p className="text-xs sm:text-[13px] opacity-85 mt-1">
            Welcome, {currentUser?.name} · Full operations oversight ·{' '}
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('approvals')}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            Approvals {pending.length > 0 ? `(${pending.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('tickets')}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            All Tickets
          </button>
          <button
            type="button"
            onClick={() => onNavigate('kavro')}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            Kavro ({lockedKavro.length} Locked)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('weekly')}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            Weekly Report
          </button>
        </div>
      </div>

      {/* Alert strip */}
      <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
        {p1Tickets.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            ● {p1Tickets.length} open P1 Critical
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            ● No open P1 Critical
          </span>
        )}

        {unassigned.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            ● {unassigned.length} unassigned tickets
          </span>
        )}

        {pending.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            ● {pending.length} pending registration(s)
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
          ● {lockedKavro.length} Kavro devices locked
        </span>

        {kavroP1.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            ● {kavroP1.length} Kavro P1 issues
          </span>
        )}
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Open Tickets</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{openTickets.length}</div>
        </div>

        <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs ${p1Tickets.length ? 'border-red-300' : ''}`}>
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">P1 Critical</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600">{p1Tickets.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">P2 High</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{p2Tickets.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Escalated / Pending</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{overdueOrEscalated.length}</div>
        </div>
      </div>

      {/* Officer load cards */}
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2.5">
          Officer Operational Load
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {officers.map(name => {
            const mine = tickets.filter(t => (t.owner || '').toLowerCase().includes(name.toLowerCase()));
            const mineOpen = mine.filter(t => t.status !== 'Resolved');
            const mineDone = mine.filter(t => t.status === 'Resolved');
            const mineP1 = mineOpen.filter(t => t.priority === 'P1 Critical');
            const s = computeOfficerStats(name, tickets);

            return (
              <div key={name} className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B5BDB] to-[#060527] text-white font-bold grid place-items-center text-sm shadow-xs">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#060527]">{name}</div>
                      <div className="text-[11px] text-slate-400">Support Officer</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs text-white ${
                    scoreClass(s.score) === 'high' ? 'bg-[#16A34A]' : scoreClass(s.score) === 'mid' ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                  }`}>
                    {s.score}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="font-extrabold text-base text-slate-800">{mineOpen.length}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Open</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className={`font-extrabold text-base ${mineP1.length ? 'text-red-600' : 'text-slate-800'}`}>
                      {mineP1.length}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">P1</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="font-extrabold text-base text-emerald-700">{mineDone.length}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Done</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority attention & Recent tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Attention */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Critical &amp; High Priority Backlog</span>
          </div>
          <div className="overflow-x-auto">
            {[...p1Tickets, ...p2Tickets].length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active P1 or P2 tickets requiring attention
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...p1Tickets, ...p2Tickets].slice(0, 6).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{t.id}</td>
                      <td className="py-2.5 px-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="py-2.5 px-3 text-slate-600">{t.owner || '—'}</td>
                      <td className="py-2.5 px-3">{t.status}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className="px-2 py-1 rounded border border-[#E2E8F0] text-xs font-semibold hover:bg-slate-100 text-slate-700"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Latest Activity</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Requester</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.slice(0, 6).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.id}</td>
                    <td className="py-2.5 px-3 truncate max-w-[120px]">{t.requester}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.owner || '—'}</td>
                    <td className="py-2.5 px-3">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Lead Review: ${selectedTicket.id}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              {selectedTicket.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => quickResolve(selectedTicket)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-semibold"
                >
                  Mark Resolved
                </button>
              )}
            </>
          }
        >
          <div className="space-y-3 text-xs sm:text-[13px]">
            <div><strong>Requester:</strong> {selectedTicket.requester} ({selectedTicket.type})</div>
            <div><strong>Priority:</strong> <PriorityBadge priority={selectedTicket.priority} /></div>
            <div><strong>Owner:</strong> {selectedTicket.owner || 'Unassigned'}</div>
            <div><strong>Description:</strong><br />{selectedTicket.description}</div>
            <div><strong>Next Action:</strong> {selectedTicket.nextAction || '—'}</div>
            {selectedTicket.escalation && (
              <div className="p-2 bg-red-50 text-red-700 rounded-lg">
                <strong>Escalation:</strong> {selectedTicket.escalation}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
