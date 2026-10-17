import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS } from '../../data/constants';
import { getMonday, isOverdue, responseOk } from '../../utils/helpers';

export const WeeklyReportView: React.FC = () => {
  const { tickets } = useData();

  const [weekStart, setWeekStart] = useState(() => {
    return getMonday(new Date()).toISOString().slice(0, 10);
  });

  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endStr = endDate.toISOString().slice(0, 10);

  const received = tickets.filter(t => t.date >= weekStart && t.date <= endStr);
  const resolved = tickets.filter(t => t.resolvedAt && t.resolvedAt.slice(0, 10) >= weekStart && t.resolvedAt.slice(0, 10) <= endStr);
  const withResp = received.filter(t => t.firstResponse);
  const ok = withResp.filter(t => responseOk(t) === true).length;
  const compliance = withResp.length ? Math.round((ok / withResp.length) * 100) : 0;
  const open = tickets.filter(t => t.status !== 'Resolved');
  const overdue = open.filter(isOverdue);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-xs flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700">Week Starting (Monday):</label>
        <input
          type="date"
          value={weekStart}
          onChange={e => setWeekStart(e.target.value)}
          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
        />
        <span className="text-xs text-slate-500 hidden sm:inline">
          Range: <strong>{weekStart}</strong> → <strong>{endStr}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Received This Week</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{received.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Resolved in Period</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{resolved.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">SLA Compliance</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{compliance}%</div>
        </div>

        <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs ${overdue.length ? 'border-red-300' : ''}`}>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Overdue Now</div>
          <div className={`text-2xl sm:text-3xl font-extrabold ${overdue.length ? 'text-red-600' : 'text-[#060527]'}`}>{overdue.length}</div>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">
            Officer Weekly Performance ({weekStart} → {endStr})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Officer</th>
                <th className="py-2.5 px-3">Owned &amp; Received</th>
                <th className="py-2.5 px-3">Resolved</th>
                <th className="py-2.5 px-3">Still Open</th>
                <th className="py-2.5 px-3">Pending Dependencies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {OFFICERS.map(o => (
                <tr key={o} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{o}</td>
                  <td className="py-2.5 px-3">{received.filter(t => t.owner === o).length}</td>
                  <td className="py-2.5 px-3 font-medium text-emerald-700">{resolved.filter(t => t.owner === o).length}</td>
                  <td className="py-2.5 px-3">{open.filter(t => t.owner === o).length}</td>
                  <td className="py-2.5 px-3">{open.filter(t => t.owner === o && t.status === 'Pending').length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
