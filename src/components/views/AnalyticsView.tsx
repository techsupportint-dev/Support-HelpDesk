import React from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS, PRIORITIES } from '../../data/constants';
import { computeOfficerStats, scoreClass } from '../../utils/helpers';

export const AnalyticsView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { tickets } = useData();

  const openTickets = tickets.filter(t => t.status !== 'Resolved');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
  const stats = OFFICERS.map(o => computeOfficerStats(o, tickets));
  const avgScore = stats.length ? Math.round(stats.reduce((acc, s) => acc + s.score, 0) / stats.length) : 0;

  // 7-day intake volume
  const volume: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = tickets.filter(t => t.date === key).length;
    volume.push({ label: key.slice(5), value: count });
  }
  const total7Day = volume.reduce((s, d) => s + d.value, 0);
  const maxIntake = Math.max(1, ...volume.map(x => x.value));

  // Officer workload
  const maxLoad = Math.max(1, ...stats.map(s => s.open));

  // Priority mix
  const byPrio = PRIORITIES.map((p, i) => ({
    label: p.split(' ')[0],
    value: openTickets.filter(t => t.priority === p).length,
    colorClass: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'][i]
  }));
  const maxPrio = Math.max(1, ...byPrio.map(p => p.value));

  // Status segments for donut
  const statusSegs = [
    { label: 'New', value: openTickets.filter(t => t.status === 'New').length, color: '#3B5BDB' },
    { label: 'Assigned', value: openTickets.filter(t => t.status === 'Assigned').length, color: '#6366F1' },
    { label: 'In Progress', value: openTickets.filter(t => t.status === 'In Progress').length, color: '#0EA5E9' },
    { label: 'Pending', value: openTickets.filter(t => t.status === 'Pending').length, color: '#D97706' }
  ];
  const totalStatus = statusSegs.reduce((s, x) => s + x.value, 0) || 1;

  let accDeg = 0;
  const donutGradient = statusSegs.map(seg => {
    const start = (accDeg / totalStatus) * 360;
    accDeg += seg.value;
    const end = (accDeg / totalStatus) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="space-y-4">
      {/* Analytics Hero */}
      <div className="bg-gradient-to-r from-[#060527] via-[#1e1b4b] to-[#3B5BDB] text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-extrabold tracking-tight">Officer Performance Analytics</h2>
        <p className="text-xs sm:text-[13px] opacity-85 mt-1">
          Workload, resolution velocity, response compliance, and 7-day intake trends ·{' '}
          <button
            type="button"
            onClick={() => onNavigate('ai-insights')}
            className="text-white underline font-semibold hover:opacity-90 cursor-pointer"
          >
            AI insights &amp; SWOT analysis →
          </button>
        </p>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Open Tickets</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{openTickets.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Resolved (All time)</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{resolvedTickets.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Team Average Score</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#3B5BDB]">{avgScore}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">7-Day Intake</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{total7Day}</div>
          <div className="flex items-end gap-1 h-5 mt-1">
            {volume.map((d, i) => (
              <span
                key={i}
                className="flex-1 bg-gradient-to-t from-[#3B5BDB] to-[#6366F1] rounded-t-xs min-h-[3px]"
                style={{ height: `${Math.max(15, Math.round((d.value / maxIntake) * 100))}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workload */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Officer Workload (Open)</span>
          </div>
          <div className="p-4 space-y-3">
            {stats.map(s => (
              <div key={s.name} className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="w-28 font-medium text-slate-700 truncate">{s.name}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3B5BDB] to-[#6366F1] rounded-full"
                    style={{ width: `${Math.round((s.open / maxLoad) * 100)}%` }}
                  />
                </div>
                <div className="w-8 text-right font-bold text-slate-600">{s.open}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority mix */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Priority Mix (Open)</span>
          </div>
          <div className="p-4 space-y-3">
            {byPrio.map(p => (
              <div key={p.label} className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="w-28 font-medium text-slate-700 truncate">{p.label}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${p.colorClass} rounded-full`}
                    style={{ width: `${Math.round((p.value / maxPrio) * 100)}%` }}
                  />
                </div>
                <div className="w-8 text-right font-bold text-slate-600">{p.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Open Status Breakdown</span>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div
              className="w-32 h-32 rounded-full relative flex items-center justify-center shadow-inner"
              style={{ background: openTickets.length ? `conic-gradient(${donutGradient})` : '#EEF2FF' }}
            >
              <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center text-center shadow-xs">
                <div className="font-extrabold text-lg text-[#060527] leading-tight">{openTickets.length}</div>
                <div className="text-[9px] uppercase font-bold text-slate-400">Open</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {statusSegs.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs" style={{ background: s.color }} />
                  <span className="text-slate-600 font-medium">{s.label}:</span>
                  <strong className="text-slate-800">{s.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7-day intake */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">7-Day Ticket Intake</span>
          </div>
          <div className="p-4 space-y-3">
            {volume.map(d => (
              <div key={d.label} className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="w-20 font-medium text-slate-700 truncate">{d.label}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${Math.round((d.value / maxIntake) * 100)}%` }}
                  />
                </div>
                <div className="w-8 text-right font-bold text-slate-600">{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Officer Performance Scorecard */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#FAFBFC]">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">Officer Performance Scorecard</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Officer</th>
                <th className="py-2.5 px-3">Score (0-100)</th>
                <th className="py-2.5 px-3">Total Assigned</th>
                <th className="py-2.5 px-3">Open</th>
                <th className="py-2.5 px-3">Resolved</th>
                <th className="py-2.5 px-3">Res. Rate</th>
                <th className="py-2.5 px-3">SLA Compliance</th>
                <th className="py-2.5 px-3">P1 Open</th>
                <th className="py-2.5 px-3">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map(s => {
                const cl = scoreClass(s.score);
                const badgeColor = cl === 'high' ? 'bg-[#16A34A]' : cl === 'mid' ? 'bg-[#D97706]' : 'bg-[#DC2626]';
                return (
                  <tr key={s.name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center justify-center min-w-[34px] h-6 px-1.5 rounded-md font-bold text-white text-xs ${badgeColor}`}>
                        {s.score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{s.total}</td>
                    <td className="py-2.5 px-3">{s.open}</td>
                    <td className="py-2.5 px-3 font-medium text-emerald-700">{s.resolved}</td>
                    <td className="py-2.5 px-3">{s.resolutionRate}%</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{s.compliance == null ? '—' : `${s.compliance}%`}</td>
                    <td className="py-2.5 px-3 font-bold text-red-600">{s.p1}</td>
                    <td className="py-2.5 px-3 font-bold text-red-600">{s.overdue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
