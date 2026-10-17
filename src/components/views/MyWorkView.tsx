import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Ticket } from '../../types';

export const MyWorkView: React.FC<{ onEditTicket: (id: string) => void }> = ({ onEditTicket }) => {
  const { currentUser } = useAuth();
  const { tickets, kavroRecords, upsertTicket, addToast } = useData();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  if (!currentUser) return null;

  const myName = (currentUser.name || '').toLowerCase().trim();
  const myFirst = myName.split(' ')[0];

  const myTickets = tickets.filter(t => {
    const owner = (t.owner || '').toLowerCase().trim();
    return owner === myName || owner.includes(myFirst);
  });

  const myOpen = myTickets.filter(t => t.status !== 'Resolved');
  const myP1 = myOpen.filter(t => t.priority === 'P1 Critical');
  const myResolved = myTickets.filter(t => t.status === 'Resolved');

  const myKavroFollowUps = kavroRecords.flatMap(r =>
    (r.followUps || [])
      .filter(f => f.status !== 'Done' && (f.owner || '').toLowerCase().includes(myFirst))
      .map(f => ({ ...f, deviceId: r.id, imei: r.imei, customer: `${r.firstName} ${r.lastName}` }))
  );

  const quickResolve = (t: Ticket) => {
    const updated: Ticket = {
      ...t,
      status: 'Resolved',
      resolvedAt: new Date().toISOString().slice(0, 16),
      nextAction: 'Closed',
      resolutionNotes: t.resolutionNotes || 'Resolved'
    };
    upsertTicket(updated);
    setSelectedTicket(null);
    addToast(`Ticket ${t.id} marked as Resolved`, 'success');
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">My Personal Work Queue</strong> — Tickets, investigations, and device follow-ups assigned to <em>{currentUser.name}</em>.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">My Open Tickets</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{myOpen.length}</div>
        </div>

        <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs ${myP1.length ? 'border-red-300' : ''}`}>
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">My P1 Critical</div>
          <div className={`text-2xl sm:text-3xl font-extrabold ${myP1.length ? 'text-red-600' : 'text-[#060527]'}`}>{myP1.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Resolved by Me</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{myResolved.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Kavro Follow-ups</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706]">{myKavroFollowUps.length}</div>
        </div>
      </div>

      {/* My Open Tickets Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC]">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">My Active Tickets Queue</span>
        </div>

        <div className="overflow-x-auto">
          {myOpen.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No open tickets assigned to you right now. Great job!
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Requester</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Next Action</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myOpen.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{t.requester}</div>
                      <div className="text-[11px] text-slate-400">{t.channel}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{t.category}</td>
                    <td className="py-2.5 px-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium text-xs max-w-[200px] truncate">{t.nextAction}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1 border border-[#E2E8F0] rounded text-xs font-semibold hover:bg-slate-100 text-slate-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* My Kavro Follow-ups */}
      {myKavroFollowUps.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">My Assigned Device Follow-ups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Device / IMEI</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myKavroFollowUps.map((fu, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{fu.deviceId} · {fu.imei}</td>
                    <td className="py-2.5 px-3 text-slate-700">{fu.customer}</td>
                    <td className="py-2.5 px-3 font-bold text-[#3B5BDB]">{fu.type}</td>
                    <td className="py-2.5 px-3 font-medium text-amber-700">{fu.dueDate}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{fu.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket ${selectedTicket.id}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedTicket.id;
                  setSelectedTicket(null);
                  onEditTicket(id);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold shadow-xs"
              >
                Edit
              </button>
              {selectedTicket.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => quickResolve(selectedTicket)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-xs"
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
            <div><strong>Status:</strong> <StatusBadge status={selectedTicket.status} /></div>
            <div><strong>Issue Description:</strong><br />{selectedTicket.description}</div>
            <div><strong>Next Action:</strong> {selectedTicket.nextAction}</div>
          </div>
        </Modal>
      )}
    </div>
  );
};
