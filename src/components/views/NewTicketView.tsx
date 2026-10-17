import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS, PRIORITIES, CATEGORIES, TYPES, STATUSES } from '../../data/constants';
import { Priority, RequesterType, TicketStatus, Ticket } from '../../types';
import { todayStr, genId, buildTicketEmailBody, buildMailto } from '../../utils/helpers';

interface NewTicketViewProps {
  editId: string | null;
  onDone: () => void;
}

export const NewTicketView: React.FC<NewTicketViewProps> = ({ editId, onDone }) => {
  const { tickets, upsertTicket, notifySettings, addNotifyLogEntry } = useData();
  const isEdit = !!editId;

  const existingTicket = editId ? tickets.find(t => t.id === editId) : null;

  const [date, setDate] = useState(todayStr());
  const [timeIn, setTimeIn] = useState(new Date().toTimeString().slice(0, 5));
  const [requester, setRequester] = useState('');
  const [type, setType] = useState<RequesterType>('Merchant');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P3 Normal');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<TicketStatus>('New');
  const [imei, setImei] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [impact, setImpact] = useState('');
  const [escalation, setEscalation] = useState('');
  const [firstResponse, setFirstResponse] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (existingTicket) {
      setDate(existingTicket.date || todayStr());
      setTimeIn(existingTicket.timeIn || '09:00');
      setRequester(existingTicket.requester || '');
      setType(existingTicket.type || 'Merchant');
      setCategory(existingTicket.category || CATEGORIES[0]);
      setDescription(existingTicket.description || '');
      setPriority(existingTicket.priority || 'P3 Normal');
      setOwner(existingTicket.owner || '');
      setStatus(existingTicket.status || 'New');
      setImei(existingTicket.imei || '');
      setNextAction(existingTicket.nextAction || '');
      setImpact(existingTicket.impact || '');
      setEscalation(existingTicket.escalation || '');
      setFirstResponse(existingTicket.firstResponse || '');
      setResolutionNotes(existingTicket.resolutionNotes || '');
    }
  }, [existingTicket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requester.trim()) return;
    if (!description.trim()) return;
    if (!nextAction.trim()) return;

    const nowIso = new Date().toISOString().slice(0, 16);

    let finalTicket: Ticket;
    if (isEdit && existingTicket) {
      finalTicket = {
        ...existingTicket,
        date,
        timeIn,
        requester: requester.trim(),
        type,
        category,
        description: description.trim(),
        priority,
        owner,
        status,
        imei: imei.trim(),
        nextAction: nextAction.trim(),
        impact: impact.trim(),
        escalation: escalation.trim(),
        firstResponse: firstResponse.trim(),
        resolutionNotes: resolutionNotes.trim(),
        lastUpdate: nowIso,
        resolvedAt: status === 'Resolved' && !existingTicket.resolvedAt ? nowIso : existingTicket.resolvedAt
      };
    } else {
      const sameDay = tickets.filter(t => t.date === date);
      const seq = sameDay.length + 1;
      const newId = genId(date, seq);

      finalTicket = {
        id: newId,
        date,
        timeIn,
        requester: requester.trim(),
        type,
        channel: 'Phone 1 External',
        category,
        description: description.trim(),
        priority,
        impact: impact.trim(),
        owner,
        assignedAt: owner ? timeIn : '',
        firstResponse: firstResponse.trim(),
        status,
        lastUpdate: nowIso,
        nextAction: nextAction.trim(),
        escalation: escalation.trim(),
        resolutionNotes: resolutionNotes.trim(),
        resolvedAt: status === 'Resolved' ? nowIso : '',
        imei: imei.trim()
      };
    }

    upsertTicket(finalTicket);

    // Prompt email notification if P1 Critical or P2 High is created
    if (!isEdit && notifySettings.enabled) {
      if (finalTicket.priority === 'P1 Critical' && notifySettings.rules.onP1) {
        const recipients = [notifySettings.teamLeadEmail, notifySettings.officerEmails[finalTicket.owner]].filter(Boolean);
        if (recipients.length && window.confirm(`P1 Critical ticket created.\nOpen email notification to:\n${recipients.join(', ')}?`)) {
          const body = buildTicketEmailBody(finalTicket, 'P1 Critical – Immediate attention required');
          const mailto = buildMailto(recipients.join(','), `[P1 Critical] ${finalTicket.id} – Alert`, body);
          window.location.href = mailto;
          addNotifyLogEntry({
            ticketId: finalTicket.id,
            purpose: 'P1 Critical alert',
            to: recipients.join(','),
            priority: 'P1 Critical',
            status: 'opened-mail-client'
          });
        }
      }
    }

    onDone();
  };

  return (
    <div className="max-w-[620px] mx-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base text-[#060527]">
            {isEdit ? `Edit Ticket ${existingTicket?.id}` : 'Create New Support Ticket'}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Only essentials required. Extra fields remain optional.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Time In *</label>
            <input
              type="time"
              required
              value={timeIn}
              onChange={e => setTimeIn(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            />
          </div>
        </div>

        {/* Requester & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Requester *</label>
            <input
              type="text"
              required
              value={requester}
              onChange={e => setRequester(e.target.value)}
              placeholder="e.g. Merchant Apex / Customer Adamu"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as RequesterType)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            >
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority *</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Issue Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">What is the issue? *</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the problem reported, error message, or transaction ID..."
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
          />
        </div>

        {/* Owner & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Owner *</label>
            <select
              required
              value={owner}
              onChange={e => setOwner(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            >
              <option value="">— Select Owner —</option>
              {OFFICERS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TicketStatus)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* IMEI (Kavro connection) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Device IMEI (optional – links to Kavro record)
          </label>
          <input
            type="text"
            value={imei}
            onChange={e => setImei(e.target.value)}
            placeholder="e.g. 861244075120636"
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:border-[#3B5BDB]"
          />
        </div>

        {/* Next Action */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Next Action *</label>
          <input
            type="text"
            required
            value={nextAction}
            onChange={e => setNextAction(e.target.value)}
            placeholder="e.g. Test unlock via Manager App; report by 14:00"
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
          />
        </div>

        {/* First response & Escalation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">First Response Time (HH:MM)</label>
            <input
              type="text"
              value={firstResponse}
              onChange={e => setFirstResponse(e.target.value)}
              placeholder="e.g. 09:12"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Impact</label>
            <input
              type="text"
              value={impact}
              onChange={e => setImpact(e.target.value)}
              placeholder="e.g. Merchant sales blocked"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
            />
          </div>
        </div>

        {/* Escalation & Resolution */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Escalation / Dependency (optional)</label>
          <input
            type="text"
            value={escalation}
            onChange={e => setEscalation(e.target.value)}
            placeholder="e.g. Awaiting database query from engineering"
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#3B5BDB]"
          />
        </div>

        {status === 'Resolved' && (
          <div>
            <label className="block text-xs font-semibold text-emerald-800 mb-1">Resolution Notes</label>
            <textarea
              rows={2}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="Explain how the ticket was resolved..."
              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-emerald-50/50"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
          >
            {isEdit ? 'Save Changes' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};
