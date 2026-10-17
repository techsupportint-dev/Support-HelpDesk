import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { OFFICERS, PRIORITIES, STATUSES } from '../../data/constants';
import { isOverdue, responseOk, buildTicketEmailBody, buildMailto } from '../../utils/helpers';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Ticket } from '../../types';

export const TicketsView: React.FC<{
  onEditTicket: (id: string) => void;
  onNewTicket: () => void;
}> = ({ onEditTicket, onNewTicket }) => {
  const { tickets, upsertTicket, notifySettings, addNotifyLogEntry, addToast } = useData();
  const { isLead, currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [notifyModalTicket, setNotifyModalTicket] = useState<Ticket | null>(null);

  // Email notify modal state
  const [notifyPurpose, setNotifyPurpose] = useState('Update on ticket');
  const [notifyTo, setNotifyTo] = useState('owner');
  const [customEmail, setCustomEmail] = useState('');
  const [notifyNote, setNotifyNote] = useState('');

  // Officers view policy: if not lead, by default can view all or own
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterOwner && t.owner !== filterOwner) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [t.id, t.requester, t.description, t.category, t.owner, t.channel, t.imei]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
      if (b.status === 'Resolved' && a.status !== 'Resolved') return -1;
      return (b.date + (b.timeIn || '')).localeCompare(a.date + (a.timeIn || ''));
    });
  }, [tickets, search, filterStatus, filterOwner, filterPriority]);

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
  };

  const handleOpenNotify = (t: Ticket) => {
    setSelectedTicket(null);
    setNotifyModalTicket(t);
    setNotifyPurpose('Update on ticket');
    setNotifyTo('owner');
    setCustomEmail('');
    setNotifyNote('');
  };

  const handleSendEmailNotification = () => {
    if (!notifyModalTicket) return;
    const t = notifyModalTicket;

    let to = '';
    const ownerEmail = notifySettings.officerEmails[t.owner] || '';
    if (notifyTo === 'owner') to = ownerEmail;
    else if (notifyTo === 'lead') to = notifySettings.teamLeadEmail;
    else if (notifyTo === 'both') to = [ownerEmail, notifySettings.teamLeadEmail].filter(Boolean).join(',');
    else if (notifyTo === 'eng') to = notifySettings.engineeringEmail;
    else if (notifyTo === 'ops') to = notifySettings.opsEmail;
    else if (notifyTo === 'custom') to = customEmail;

    if (!to) {
      addToast('No recipient email specified', 'warn');
      return;
    }

    const subject = `[${t.priority}] ${t.id} – ${notifyPurpose}`;
    let body = buildTicketEmailBody(t, notifyPurpose);
    if (notifyNote) body += `\n\nNote: ${notifyNote}`;

    const mailto = buildMailto(to, subject, body);
    window.location.href = mailto;

    addNotifyLogEntry({
      ticketId: t.id,
      purpose: notifyPurpose,
      to,
      priority: t.priority,
      status: 'opened-mail-client'
    });

    setNotifyModalTicket(null);
    addToast('Email client draft opened for ' + notifyPurpose, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top filters bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets by ID, requester, keyword, IMEI..."
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#3B5BDB]"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterOwner}
          onChange={e => setFilterOwner(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#3B5BDB]"
        >
          <option value="">All owners</option>
          {OFFICERS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#3B5BDB]"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button
          type="button"
          onClick={onNewTicket}
          className="px-3 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs rounded-lg transition-colors ml-auto shadow-xs"
        >
          + New Ticket
        </button>
      </div>

      {/* Tickets table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-2xl mb-1">☰</div>
              <div className="font-semibold text-sm">No tickets match your filters</div>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Requester</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">SLA OK</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map(t => {
                  const ok = responseOk(t);
                  const overdue = isOverdue(t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {t.id}
                        {overdue && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        <div>{t.date}</div>
                        <div className="text-[11px] text-slate-400">{t.timeIn || '—'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{t.requester}</div>
                        <div className="text-[11px] text-slate-400">{t.type}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{t.category}</td>
                      <td className="py-2.5 px-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{t.owner || '—'}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
                      <td className="py-2.5 px-3">
                        {ok === true ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">YES</span>
                        ) : ok === false ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">NO</span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                        >
                          View
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

      {/* Ticket View Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket Details — ${selectedTicket.id}`}
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
                onClick={() => handleOpenNotify(selectedTicket)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                ✉ Email notify
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
          <div className="space-y-3.5 text-xs sm:text-[13px]">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div><strong>Requester:</strong> {selectedTicket.requester} ({selectedTicket.type})</div>
              <div><strong>Channel:</strong> {selectedTicket.channel}</div>
              <div><strong>Category:</strong> {selectedTicket.category}</div>
              <div><strong>Priority:</strong> <PriorityBadge priority={selectedTicket.priority} /></div>
              <div><strong>Owner:</strong> {selectedTicket.owner || '—'} (Assigned: {selectedTicket.assignedAt || '—'})</div>
              <div><strong>Status:</strong> <StatusBadge status={selectedTicket.status} /></div>
              <div><strong>Time In:</strong> {selectedTicket.date} {selectedTicket.timeIn}</div>
              <div><strong>1st Response:</strong> {selectedTicket.firstResponse || 'Pending'}</div>
              {selectedTicket.imei && <div><strong>IMEI / Device:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedTicket.imei}</code></div>}
              {selectedTicket.impact && <div><strong>Impact:</strong> {selectedTicket.impact}</div>}
            </div>

            <div>
              <strong className="block text-xs uppercase text-slate-500 mb-1">Issue Description</strong>
              <div className="bg-white border border-slate-200 p-3 rounded-lg text-slate-800 whitespace-pre-wrap">
                {selectedTicket.description}
              </div>
            </div>

            <div>
              <strong className="block text-xs uppercase text-slate-500 mb-1">Next Action</strong>
              <div className="font-medium text-slate-800">
                {selectedTicket.nextAction || '—'}
              </div>
            </div>

            {selectedTicket.escalation && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-800">
                <strong className="block text-xs uppercase mb-0.5">Escalation / Dependency:</strong>
                {selectedTicket.escalation}
              </div>
            )}

            {selectedTicket.resolutionNotes && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
                <strong className="block text-xs uppercase mb-0.5">Resolution Notes:</strong>
                {selectedTicket.resolutionNotes}
                {selectedTicket.resolvedAt && (
                  <div className="text-[11px] opacity-75 mt-1">Resolved at {selectedTicket.resolvedAt}</div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Email Notify Modal */}
      {notifyModalTicket && (
        <Modal
          isOpen={!!notifyModalTicket}
          onClose={() => setNotifyModalTicket(null)}
          title={`Email Notification — ${notifyModalTicket.id}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setNotifyModalTicket(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmailNotification}
                className="px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold shadow-xs"
              >
                Open Email Draft
              </button>
            </>
          }
        >
          <div className="space-y-3.5">
            <p className="text-xs text-slate-500 leading-relaxed">
              This prepares a formatted email draft with ticket metadata and launches your email client (Gmail, Outlook, etc.).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Subject</label>
              <select
                value={notifyPurpose}
                onChange={e => setNotifyPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
              >
                <option value="Update on ticket">Update on ticket</option>
                <option value="P1 Critical – Immediate attention">P1 Critical – Immediate attention</option>
                <option value="P2 High – Action required">P2 High – Action required</option>
                <option value="Escalation – assistance required">Escalation – assistance required</option>
                <option value="Ticket assigned to you">Ticket assigned to you</option>
                <option value="Ticket resolved">Ticket resolved</option>
                <option value="Overdue reminder">Overdue reminder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient</label>
              <select
                value={notifyTo}
                onChange={e => setNotifyTo(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
              >
                <option value="owner">Owner ({notifySettings.officerEmails[notifyModalTicket.owner] || 'Not set'})</option>
                <option value="lead">Team Lead ({notifySettings.teamLeadEmail})</option>
                <option value="both">Owner + Team Lead</option>
                <option value="eng">Engineering ({notifySettings.engineeringEmail})</option>
                <option value="ops">Operations ({notifySettings.opsEmail})</option>
                <option value="custom">Custom email address…</option>
              </select>
            </div>

            {notifyTo === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Email(s)</label>
                <input
                  type="text"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="recipient@credlock.africa"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Extra Note (optional)</label>
              <textarea
                rows={2}
                value={notifyNote}
                onChange={e => setNotifyNote(e.target.value)}
                placeholder="Additional instructions or questions for the recipient..."
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
