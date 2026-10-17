import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { OFFICERS } from '../../data/constants';
import { activityForUser, downloadBlob, csvEsc, safeFileName, todayStr } from '../../utils/helpers';

export const OfficerReportsView: React.FC = () => {
  const { tickets, addToast } = useData();
  const { currentUser, isLead, can } = useAuth();

  const canAll = isLead() || can('admin') || can('weekly') || can('analytics');
  const officerNames = canAll
    ? OFFICERS
    : currentUser
    ? [currentUser.name]
    : [];

  const officerActivityReport = (name: string) => {
    const a = activityForUser(name, tickets);
    const all = a.mine.slice().sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')));
    return {
      name,
      generatedAt: new Date().toISOString(),
      total: all.length,
      open: a.open.length,
      resolved: a.resolved.length,
      p1: a.p1.length,
      tickets: all
    };
  };

  const exportOfficerExcel = (name: string) => {
    const r = officerActivityReport(name);
    const lines: string[] = [
      'Credlock Tech Support – Officer Activity Report',
      `Officer,${csvEsc(r.name)}`,
      `Generated,${csvEsc(r.generatedAt)}`,
      `Total tickets,${r.total}`,
      `Open,${r.open}`,
      `Resolved,${r.resolved}`,
      `P1 open,${r.p1}`,
      '',
      'Ticket ID,Date,Time,Requester,Category,Priority,Status,Owner,Next Action,Description'
    ];

    r.tickets.forEach(t => {
      lines.push([
        t.id, t.date, t.timeIn || '', t.requester, t.category,
        t.priority, t.status, t.owner, t.nextAction, t.description
      ].map(csvEsc).join(','));
    });

    const stamp = todayStr().replace(/-/g, '');
    downloadBlob(
      `Credlock_Officer_${safeFileName(name)}_${stamp}.csv`,
      'text/csv;charset=utf-8',
      '\uFEFF' + lines.join('\n')
    );
    addToast(`Excel report downloaded for ${name}`, 'success');
  };

  const getReportHtml = (name: string, forPrint: boolean) => {
    const r = officerActivityReport(name);
    const rows = r.tickets.map(t => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${t.id}</td>
        <td style="padding:6px;border:1px solid #ddd">${t.date}</td>
        <td style="padding:6px;border:1px solid #ddd">${t.requester}</td>
        <td style="padding:6px;border:1px solid #ddd">${t.priority}</td>
        <td style="padding:6px;border:1px solid #ddd">${t.status}</td>
        <td style="padding:6px;border:1px solid #ddd">${t.nextAction || ''}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Officer Report – ${name}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #060527; margin: 32px; font-size: 13px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #3B5BDB; }
    h2 { font-size: 14px; margin: 20px 0 8px; }
    .meta { color: #5B6478; margin-bottom: 16px; font-size: 12px; }
    .kpis { display: flex; gap: 12px; margin: 12px 0 20px; }
    .kpi { border: 1px solid #E2E8F5; border-radius: 8px; padding: 10px 14px; min-width: 90px; }
    .kpi b { display: block; font-size: 18px; color: #060527; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #060527; color: #fff; padding: 6px; text-align: left; }
    ${forPrint ? '@media print { body { margin: 12px; } }' : ''}
  </style>
</head>
<body>
  <h1>Credlock Africa · Technical Support</h1>
  <div class="meta">Officer Activity Report · <strong>${name}</strong> · Generated ${r.generatedAt.slice(0, 19).replace('T', ' ')}</div>
  <div class="kpis">
    <div class="kpi"><span>Total</span><b>${r.total}</b></div>
    <div class="kpi"><span>Open</span><b>${r.open}</b></div>
    <div class="kpi"><span>Resolved</span><b>${r.resolved}</b></div>
    <div class="kpi"><span>P1 Open</span><b>${r.p1}</b></div>
  </div>
  <h2>Tickets Detail</h2>
  <table>
    <thead><tr><th>ID</th><th>Date</th><th>Requester</th><th>Priority</th><th>Status</th><th>Next action</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6">No tickets recorded</td></tr>'}</tbody>
  </table>
  <p class="meta" style="margin-top:24px">Credlock Africa · Confidential · Internal Technical Support Portal</p>
</body>
</html>`;
  };

  const exportOfficerPdf = (name: string) => {
    const html = getReportHtml(name, true);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      addToast('Please allow popups to print/save PDF', 'warn');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
    addToast(`PDF print preview opened for ${name}`, 'success');
  };

  const exportOfficerWord = (name: string) => {
    const html = getReportHtml(name, false);
    const stamp = todayStr().replace(/-/g, '');
    downloadBlob(
      `Credlock_Officer_${safeFileName(name)}_${stamp}.doc`,
      'application/msword',
      html
    );
    addToast(`Word report downloaded for ${name}`, 'success');
  };

  const exportAllOfficersExcel = () => {
    const lines = ['Officer,Total,Open,Resolved,P1 open'];
    OFFICERS.forEach(name => {
      const r = officerActivityReport(name);
      lines.push([name, r.total, r.open, r.resolved, r.p1].map(csvEsc).join(','));
    });
    lines.push('');
    lines.push('Ticket ID,Officer,Date,Requester,Priority,Status,Category,Next Action');
    tickets.forEach(t => {
      lines.push([
        t.id, t.owner, t.date, t.requester, t.priority, t.status, t.category, t.nextAction
      ].map(csvEsc).join(','));
    });

    downloadBlob(
      `Credlock_All_Officers_${todayStr().replace(/-/g, '')}.csv`,
      'text/csv;charset=utf-8',
      '\uFEFF' + lines.join('\n')
    );
    addToast('Team activity report downloaded', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Officer activity reports</strong> — Export individual or team performance into Excel (CSV), PDF (printable), or Word (.doc).
      </div>

      {canAll && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={exportAllOfficersExcel}
            className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            Download All Officers (Excel)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {officerNames.map(name => {
          const r = officerActivityReport(name);
          return (
            <div key={name} className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B5BDB] to-[#060527] text-white font-bold grid place-items-center text-sm shadow-xs">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#060527]">{name}</div>
                    <div className="text-[11px] text-slate-400">Activity Report</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="font-extrabold text-base text-slate-800">{r.total}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="font-extrabold text-base text-amber-600">{r.open}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Open</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="font-extrabold text-base text-emerald-700">{r.resolved}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Done</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => exportOfficerExcel(name)}
                  className="px-2 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold rounded-lg text-center"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportOfficerPdf(name)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg text-center border border-slate-200"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportOfficerWord(name)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg text-center border border-slate-200"
                >
                  Word
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
