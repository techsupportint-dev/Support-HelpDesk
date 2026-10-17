import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Modal } from '../common/Modal';
import { MonthlyDoc, Ticket } from '../../types';

export const MonthlyReportsView: React.FC = () => {
  const { monthlyReports, saveMonthlyUpload, getMonthlyDoc, saveMonthlyDoc, tickets, upsertTicket, addToast } = useData();

  const currentYear = new Date().getFullYear();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const [previewReport, setPreviewReport] = useState<{ month: string; content: string } | null>(null);

  // Builder state
  const [builderMonthKey, setBuilderMonthKey] = useState<string | null>(null);
  const [docState, setDocState] = useState<MonthlyDoc | null>(null);

  const handleFileUpload = async (monthKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      const records = Math.max(0, lines.length - 1);

      saveMonthlyUpload(monthKey, {
        yearMonth: monthKey,
        fileName: file.name,
        records,
        uploadedAt: new Date().toISOString(),
        preview: text.slice(0, 3000)
      });
    } catch {
      addToast('Error reading CSV file', 'error');
    }
  };

  const handleBulkIssuesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        addToast('CSV file is empty or only has headers', 'warn');
        return;
      }

      let count = 0;
      // Header: Ticket ID, Channel, Requester, Contact, Priority, Category, Summary, Owner, Status
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length < 3) continue;

        const [id, channel, req, , prio, cat, summary, owner, st] = parts;
        const newTicket: Ticket = {
          id: id || `TS-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().slice(0, 10),
          timeIn: '09:00',
          requester: req || 'Bulk Customer',
          type: 'Customer',
          channel: (channel as any) || 'Phone 1 External',
          category: cat || 'General',
          description: summary || 'Imported bulk ticket',
          priority: (prio as any) || 'P3 Normal',
          owner: owner || '',
          status: (st as any) || 'New',
          lastUpdate: new Date().toISOString().slice(0, 16),
          nextAction: 'Review and triage',
          resolvedAt: st === 'Resolved' ? new Date().toISOString().slice(0, 16) : ''
        };
        upsertTicket(newTicket);
        count++;
      }
      addToast(`Successfully imported ${count} tickets from bulk CSV`, 'success');
      e.target.value = '';
    } catch {
      addToast('Could not parse bulk CSV', 'error');
    }
  };

  const openBuilder = (monthKey: string) => {
    const doc = getMonthlyDoc(monthKey);
    setDocState(doc);
    setBuilderMonthKey(monthKey);
  };

  const handleSaveDoc = () => {
    if (builderMonthKey && docState) {
      saveMonthlyDoc(builderMonthKey, docState);
      setBuilderMonthKey(null);
    }
  };

  // Metrics calculation for the month in builder
  const getMonthStats = (ym: string) => {
    const start = ym + '-01';
    const [y, m] = ym.split('-').map(Number);
    const endDate = new Date(y, m, 0);
    const end = endDate.toISOString().slice(0, 10);

    const received = tickets.filter(t => t.date >= start && t.date <= end);
    const resolved = tickets.filter(t => t.resolvedAt && t.resolvedAt.slice(0, 10) >= start && t.resolvedAt.slice(0, 10) <= end);
    const open = tickets.filter(t => t.status !== 'Resolved');
    const rate = received.length ? Math.round((resolved.length / received.length) * 100) : 0;

    return { received: received.length, resolved: resolved.length, open: open.length, rate };
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Monthly Reports &amp; Archive</strong> — Track and upload CSV reports for January–December {currentYear}, build printable executive narrative reports, or import bulk issues.
      </div>

      {/* Uploads table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-between">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">{currentYear} Monthly Reports Tracker</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Month</th>
                <th className="py-2.5 px-4">Uploaded File</th>
                <th className="py-2.5 px-4">Records</th>
                <th className="py-2.5 px-4">Uploaded At</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {months.map((monthName, index) => {
                const monthKey = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
                const rec = monthlyReports[monthKey];

                return (
                  <tr key={monthKey} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{monthName}</td>
                    <td className="py-3 px-4 text-slate-600">{rec?.fileName || '—'}</td>
                    <td className="py-3 px-4 font-mono">{rec?.records ?? 0}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {rec?.uploadedAt ? rec.uploadedAt.slice(0, 16).replace('T', ' ') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <label className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-700 font-semibold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs">
                        Upload CSV
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={e => handleFileUpload(monthKey, e)}
                          className="hidden"
                        />
                      </label>

                      {rec && (
                        <button
                          type="button"
                          onClick={() => setPreviewReport({ month: monthName, content: rec.preview })}
                          className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-slate-700 text-xs font-semibold hover:bg-slate-50"
                        >
                          View CSV
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openBuilder(monthKey)}
                        className="px-2.5 py-1 rounded-lg bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold shadow-xs"
                      >
                        Report Narrative
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk issue importer */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <h3 className="font-bold text-xs sm:text-sm text-[#060527] mb-1">Bulk Issue Import (CSV)</h3>
        <p className="text-xs text-[#64748B] mb-3">
          Expected CSV Columns: <code>Ticket ID, Channel, Requester, Contact, Priority, Category, Summary, Owner, Status</code>
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleBulkIssuesUpload}
          className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#3B5BDB] file:text-white hover:file:bg-[#2A3FBF] cursor-pointer"
        />
      </div>

      {/* CSV Preview Modal */}
      {previewReport && (
        <Modal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={`Uploaded CSV Preview — ${previewReport.month}`}
          footer={
            <button
              type="button"
              onClick={() => setPreviewReport(null)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600"
            >
              Close
            </button>
          }
        >
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
            {previewReport.content}
          </pre>
        </Modal>
      )}

      {/* Monthly Report Builder Modal */}
      {builderMonthKey && docState && (
        <Modal
          isOpen={!!builderMonthKey}
          onClose={() => setBuilderMonthKey(null)}
          title={`Monthly Executive Report Builder — ${builderMonthKey}`}
          maxWidth="max-w-[760px]"
          footer={
            <>
              <button
                type="button"
                onClick={() => setBuilderMonthKey(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDoc}
                className="px-4 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold shadow-xs"
              >
                Save Report Narrative
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs sm:text-[13px]">
            {/* Computed KPIs */}
            {(() => {
              const st = getMonthStats(builderMonthKey);
              return (
                <div className="grid grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <div>
                    <div className="font-extrabold text-base text-slate-800">{st.received}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Received</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-emerald-600">{st.resolved}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolved</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-[#3B5BDB]">{st.rate}%</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolution Rate</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-amber-600">{st.open}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Open Backlog</div>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Report Title</label>
              <input
                type="text"
                value={docState.title}
                onChange={e => setDocState({ ...docState, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-bold text-[#060527]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prepared By</label>
                <input
                  type="text"
                  value={docState.preparedBy}
                  onChange={e => setDocState({ ...docState, preparedBy: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={docState.department}
                  onChange={e => setDocState({ ...docState, department: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Executive Summary</label>
              <textarea
                rows={3}
                value={docState.executiveSummary}
                onChange={e => setDocState({ ...docState, executiveSummary: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Highlights</label>
              <textarea
                rows={3}
                value={docState.highlights}
                onChange={e => setDocState({ ...docState, highlights: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Challenges &amp; Bottlenecks</label>
              <textarea
                rows={3}
                value={docState.challenges}
                onChange={e => setDocState({ ...docState, challenges: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actions for Next Month</label>
              <textarea
                rows={3}
                value={docState.actionsNext}
                onChange={e => setDocState({ ...docState, actionsNext: e.target.value })}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs leading-relaxed"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
