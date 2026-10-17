import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS, CATEGORIES } from '../../data/constants';
import { responseOk } from '../../utils/helpers';

export const MonthlyReportView: React.FC = () => {
  const { tickets } = useData();

  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const startDate = new Date(monthStart);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  const endStr = endDate.toISOString().slice(0, 10);

  const received = tickets.filter(t => t.date >= monthStart && t.date <= endStr);
  const resolved = tickets.filter(t => t.resolvedAt && t.resolvedAt.slice(0, 10) >= monthStart && t.resolvedAt.slice(0, 10) <= endStr);
  const withResp = received.filter(t => t.firstResponse);
  const ok = withResp.filter(t => responseOk(t) === true).length;
  const compliance = withResp.length ? Math.round((ok / withResp.length) * 100) : 0;
  const rate = received.length ? Math.round((resolved.length / received.length) * 100) : 0;
  const open = tickets.filter(t => t.status !== 'Resolved');

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-xs flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700">Month:</label>
        <input
          type="date"
          value={monthStart}
          onChange={e => setMonthStart(e.target.value)}
          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
        />
        <span className="text-xs text-slate-500 hidden sm:inline">
          ({monthStart} → {endStr})
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Total Received</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{received.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Total Resolved</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{resolved.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Resolution Rate</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{rate}%</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Response Compliance</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{compliance}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Volume by Category</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Ticket Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIES.map(c => {
                  const n = received.filter(t => t.category === c).length;
                  return n > 0 ? (
                    <tr key={c} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{c}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-700">{n}</td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Officer Scorecard */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Monthly Officer Performance</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Owned</th>
                  <th className="py-2.5 px-3">Resolved</th>
                  <th className="py-2.5 px-3">Open Backlog</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OFFICERS.map(o => (
                  <tr key={o} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{o}</td>
                    <td className="py-2.5 px-3">{received.filter(t => t.owner === o).length}</td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700">{resolved.filter(t => t.owner === o).length}</td>
                    <td className="py-2.5 px-3">{open.filter(t => t.owner === o).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
