import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS, PRIORITIES } from '../../data/constants';
import { isOverdue, responseOk, computeOfficerStats, scoreClass, todayStr } from '../../utils/helpers';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Ticket } from '../../types';

export const DashboardView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const {
    tickets,
    upsertTicket,
    addToast,
    isGoogleConnected,
    googleUser,
    connectGoogle,
    syncDirectGoogleSheets,
    sheetId,
    googleSheetTitle
  } = useData();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleQuickSync = async () => {
    setSyncing(true);
    try {
      if (isGoogleConnected) {
        await syncDirectGoogleSheets();
      } else {
        await connectGoogle();
      }
    } finally {
      setSyncing(false);
    }
  };

  const openTickets = tickets.filter(t => t.status !== 'Resolved');
  const overdueTickets = openTickets.filter(isOverdue);
  const unassignedTickets = openTickets.filter(t => !t.owner);

  const today = todayStr();
  const todayTickets = tickets.filter(t => t.date === today);
  const withResponse = todayTickets.filter(t => t.firstResponse);
  const okCount = withResponse.filter(t => responseOk(t) === true).length;
  const compliance = withResponse.length ? Math.round((okCount / withResponse.length) * 100) : 0;

  // Workload by officer
  const byOwner = OFFICERS.map(o => ({
    label: o,
    value: openTickets.filter(t => t.owner === o).length
  }));
  const maxOwnerLoad = Math.max(1, ...byOwner.map(x => x.value));

  // Priority mix
  const byPriority = PRIORITIES.map((p, i) => ({
    label: p.split(' ')[0],
    fullLabel: p,
    value: openTickets.filter(t => t.priority === p).length,
    colorClass: ['bg-gradient-to-r from-red-600 to-red-400', 'bg-gradient-to-r from-orange-500 to-amber-400', 'bg-gradient-to-r from-yellow-500 to-yellow-300', 'bg-gradient-to-r from-emerald-600 to-emerald-400'][i]
  }));
  const maxPriVal = Math.max(1, ...byPriority.map(x => x.value));

  // 7-day intake
  const last7Days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = tickets.filter(t => t.date === key).length;
    last7Days.push({ label: key.slice(5), value: count });
  }
  const maxIntake = Math.max(1, ...last7Days.map(x => x.value));

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
      {/* Google Sheets Connection Strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isGoogleConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#3B5BDB]'
          }`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-[#060527]">
                Google Sheet Database
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isGoogleConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {isGoogleConnected ? '● Live' : '○ Local'}
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 flex-wrap">
              <span>Sheet ID:</span>
              <code className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded text-[10px]">{sheetId}</code>
              <span>·</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B5BDB] hover:underline"
              >
                Open Spreadsheet ↗
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleQuickSync}
            disabled={syncing}
            className="px-3 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <span className={syncing ? 'animate-spin' : ''}>↻</span>
            <span>{isGoogleConnected ? (syncing ? 'Syncing…' : 'Sync Google Sheet') : (syncing ? 'Connecting…' : 'Connect Google Sheet')}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Principle banner */}
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Operating principle:</strong> No actionable request should depend on someone remembering a chat.
        Register it → Assign one owner → Record the next action → Follow until resolved or handed over.
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 relative overflow-hidden shadow-xs before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#3B5BDB]">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Open Tickets</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{openTickets.length}</div>
          <div className="text-xs text-[#64748B] mt-1">{tickets.length} total logged</div>
        </div>

        <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 relative overflow-hidden shadow-xs before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${overdueTickets.length ? 'before:bg-[#DC2626]' : 'before:bg-[#16A34A]'}`}>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Overdue</div>
          <div className={`text-2xl sm:text-3xl font-extrabold ${overdueTickets.length ? 'text-[#DC2626]' : 'text-[#060527]'}`}>{overdueTickets.length}</div>
          <div className="text-xs text-[#64748B] mt-1">Need immediate attention</div>
        </div>

        <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 relative overflow-hidden shadow-xs before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${unassignedTickets.length ? 'before:bg-[#D97706]' : 'before:bg-[#16A34A]'}`}>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Unassigned</div>
          <div className={`text-2xl sm:text-3xl font-extrabold ${unassignedTickets.length ? 'text-[#D97706]' : 'text-[#060527]'}`}>{unassignedTickets.length}</div>
          <div className="text-xs text-[#64748B] mt-1">Must have an owner</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 relative overflow-hidden shadow-xs before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#3B5BDB]">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Today's Compliance</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{compliance}%</div>
          <div className="text-xs text-[#64748B] mt-1">{okCount}/{withResponse.length} within SLA target</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Officer Workload */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Officer workload (open)</span>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-[#3B5BDB] hover:underline"
            >
              Full analytics →
            </button>
          </div>
          <div className="p-4 space-y-3">
            {byOwner.map(item => (
              <div key={item.label} className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="w-24 sm:w-28 font-medium text-slate-700 truncate">{item.label}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3B5BDB] to-[#6366F1] rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((item.value / maxOwnerLoad) * 100)}%` }}
                  />
                </div>
                <div className="w-8 text-right font-bold text-slate-600">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Mix */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Priority mix (open)</span>
          </div>
          <div className="p-4 space-y-3">
            {byPriority.map(item => (
              <div key={item.label} className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="w-24 sm:w-28 font-medium text-slate-700 truncate">{item.fullLabel}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.colorClass} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.round((item.value / maxPriVal) * 100)}%` }}
                  />
                </div>
                <div className="w-8 text-right font-bold text-slate-600">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: 7-day intake & Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-day intake */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">7-day intake trend</span>
          </div>
          <div className="p-4 space-y-3">
            {last7Days.map(item => (
              <div key={item.label} className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="w-20 font-medium text-slate-700 truncate">{item.label}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((item.value / maxIntake) * 100)}%` }}
                  />
                </div>
                <div className="w-8 text-right font-bold text-slate-600">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Officer Scores */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Officer scores</span>
            <button
              type="button"
              onClick={() => onNavigate('ai-insights')}
              className="text-xs font-semibold text-[#3B5BDB] hover:underline"
            >
              AI Insights →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Open</th>
                  <th className="py-2.5 px-3">Resolved</th>
                  <th className="py-2.5 px-3">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OFFICERS.map(o => {
                  const s = computeOfficerStats(o, tickets);
                  const cl = scoreClass(s.score);
                  const badgeColor = cl === 'high' ? 'bg-[#16A34A]' : cl === 'mid' ? 'bg-[#D97706]' : 'bg-[#DC2626]';
                  return (
                    <tr key={o} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#060527]">{o}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded-md font-bold text-white text-xs ${badgeColor}`}>
                          {s.score}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{s.open}</td>
                      <td className="py-2.5 px-3">{s.resolved}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {s.compliance == null ? '—' : `${s.compliance}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent / Open Tickets */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">Recent &amp; Open Tickets</span>
          <button
            type="button"
            onClick={() => onNavigate('tickets')}
            className="px-3 py-1 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            View all ({tickets.length})
          </button>
        </div>
        <div className="overflow-x-auto">
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
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {openTickets.slice(0, 8).map(t => {
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
                      <div className="text-[11px] text-slate-400">{t.timeIn}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{t.requester}</div>
                      <div className="text-[11px] text-slate-400">{t.type}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{t.category}</td>
                    <td className="py-2.5 px-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{t.owner || '—'}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
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
        </div>
      </div>

      {/* Ticket Detail Modal */}
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
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] font-semibold text-xs hover:bg-slate-100 text-slate-600"
              >
                Close
              </button>
              {selectedTicket.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => quickResolve(selectedTicket)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs shadow-xs"
                >
                  Mark Resolved
                </button>
              )}
            </>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-[13px]">
              <div><strong>Requester:</strong> {selectedTicket.requester} ({selectedTicket.type})</div>
              <div><strong>Channel:</strong> {selectedTicket.channel}</div>
              <div><strong>Category:</strong> {selectedTicket.category}</div>
              <div><strong>Priority:</strong> <PriorityBadge priority={selectedTicket.priority} /></div>
              <div><strong>Status:</strong> <StatusBadge status={selectedTicket.status} /></div>
              <div><strong>Owner:</strong> {selectedTicket.owner || 'Unassigned'}</div>
              <div><strong>Received:</strong> {selectedTicket.date} {selectedTicket.timeIn}</div>
              <div><strong>First Response:</strong> {selectedTicket.firstResponse || 'Not recorded'}</div>
              {selectedTicket.imei && <div><strong>IMEI:</strong> <code>{selectedTicket.imei}</code></div>}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <strong className="block text-xs uppercase text-slate-500 mb-1">Issue Description</strong>
              <div className="bg-slate-50 p-3 rounded-lg text-slate-800 text-xs sm:text-[13px]">
                {selectedTicket.description}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <strong className="block text-xs uppercase text-slate-500 mb-1">Next Action</strong>
              <div className="text-slate-800 text-xs sm:text-[13px] font-medium">
                {selectedTicket.nextAction || '—'}
              </div>
            </div>

            {selectedTicket.escalation && (
              <div className="pt-2 border-t border-slate-100">
                <strong className="block text-xs uppercase text-red-600 mb-1">Escalation</strong>
                <div className="bg-red-50 text-red-800 p-2.5 rounded-lg text-xs">
                  {selectedTicket.escalation}
                </div>
              </div>
            )}

            {selectedTicket.resolutionNotes && (
              <div className="pt-2 border-t border-slate-100">
                <strong className="block text-xs uppercase text-emerald-600 mb-1">Resolution Notes</strong>
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-xs">
                  {selectedTicket.resolutionNotes}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
