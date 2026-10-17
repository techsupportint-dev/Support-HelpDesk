import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS, PRIORITIES } from '../../data/constants';
import { isOverdue, responseOk, todayStr } from '../../utils/helpers';
import { PriorityBadge } from '../common/Badge';

export const DailyReportView: React.FC = () => {
  const { tickets, addToast } = useData();
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const received = tickets.filter(t => t.date === selectedDate);
  const withResp = received.filter(t => t.firstResponse);
  const ok = withResp.filter(t => responseOk(t) === true).length;
  const compliance = withResp.length ? Math.round((ok / withResp.length) * 100) : 0;
  const resolved = tickets.filter(t => t.resolvedAt && t.resolvedAt.startsWith(selectedDate));
  const open = tickets.filter(t => t.status !== 'Resolved');
  const overdue = open.filter(isOverdue);
  const unassigned = open.filter(t => !t.owner);
  const pending = open.filter(t => t.status === 'Pending');

  const copySummary = () => {
    const text = `Date: ${selectedDate} | Received: ${received.length} | 1st response in target: ${ok} (${compliance}%) | Resolved: ${resolved.length} | Open backlog: ${open.length} | Overdue: ${overdue.length} | Unassigned: ${unassigned.length} | Pending: ${pending.length}`;
    navigator.clipboard.writeText(text).then(() => {
      addToast('Daily summary copied to clipboard', 'success');
    });
  };

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-xs flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700">Report Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
        />
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Received Today</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{received.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Response in Target</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{compliance}%</div>
          <div className="text-xs text-[#64748B] mt-1">{ok}/{withResp.length} SLA compliant</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Resolved Today</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{resolved.length}</div>
        </div>

        <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs ${overdue.length ? 'border-red-300' : ''}`}>
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Overdue Now</div>
          <div className={`text-2xl sm:text-3xl font-extrabold ${overdue.length ? 'text-red-600' : 'text-[#060527]'}`}>{overdue.length}</div>
        </div>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Officer activity */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Officer Operational Activity</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Open Queue</th>
                  <th className="py-2.5 px-3">Resolved Today</th>
                  <th className="py-2.5 px-3">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OFFICERS.map(o => (
                  <tr key={o} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{o}</td>
                    <td className="py-2.5 px-3">{open.filter(t => t.owner === o).length}</td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700">{resolved.filter(t => t.owner === o).length}</td>
                    <td className="py-2.5 px-3">{pending.filter(t => t.owner === o).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Intake by Priority</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Logged Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PRIORITIES.map(p => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3"><PriorityBadge priority={p} /></td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {received.filter(t => t.priority === p).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ready-to-send summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">Ready-to-Send Daily Operational Summary</span>
          <button
            type="button"
            onClick={copySummary}
            className="px-3 py-1 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white rounded-lg text-xs font-semibold"
          >
            Copy Summary
          </button>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-relaxed select-all">
          Date: <strong>{selectedDate}</strong> | Received: <strong>{received.length}</strong> | 1st response in target: <strong>{ok} ({compliance}%)</strong> | Resolved: <strong>{resolved.length}</strong> | Open backlog: <strong>{open.length}</strong> | Overdue: <strong>{overdue.length}</strong> | Unassigned: <strong>{unassigned.length}</strong> | Pending: <strong>{pending.length}</strong>
        </div>
      </div>
    </div>
  );
};
