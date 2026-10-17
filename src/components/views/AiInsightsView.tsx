import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { OFFICERS } from '../../data/constants';
import { generateOfficerAIInsight, generateOfficerSWOT, scoreClass } from '../../utils/helpers';

export const AiInsightsView: React.FC = () => {
  const { tickets } = useData();
  const { currentUser, isLead, can } = useAuth();

  const canAll = isLead() || can('admin') || can('analytics');
  const officerList = canAll ? OFFICERS : (currentUser ? [currentUser.name] : OFFICERS);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#060527] via-[#1e1b4b] to-[#3B5BDB] text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-extrabold tracking-tight">AI Insights &amp; SWOT Analysis</h2>
        <p className="text-xs sm:text-[13px] opacity-85 mt-1 leading-relaxed">
          Rule-based operational analysis of workload, compliance, resolution, and risk for each support officer — grounded directly in real ticket telemetry.
        </p>
      </div>

      {/* Cards for each officer */}
      <div className="space-y-4">
        {officerList.map(name => {
          const ai = generateOfficerAIInsight(name, tickets);
          const swot = generateOfficerSWOT(name, tickets);
          const s = ai.stats;
          const cl = scoreClass(s.score);
          const badgeColor = cl === 'high' ? 'bg-[#16A34A]' : cl === 'mid' ? 'bg-[#D97706]' : 'bg-[#DC2626]';

          return (
            <div key={name} className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-between">
                <span className="font-bold text-sm text-[#060527]">{name} · AI insight &amp; SWOT</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-extrabold text-white text-xs ${badgeColor}`}>
                  {s.score}
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Insights Box */}
                <div className="bg-gradient-to-br from-[#EEF2FF] to-[#F8FAFC] border border-[#E0E7FF] rounded-xl p-4 space-y-3">
                  <div>
                    <div className="text-[11px] font-extrabold text-[#3B5BDB] uppercase tracking-wider mb-1.5">
                      Operational Telemetry Insights
                    </div>
                    <ul className="list-disc pl-5 text-xs sm:text-[13px] text-slate-800 space-y-1">
                      {ai.insights.map((ins, i) => (
                        <li key={i}>{ins}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-[11px] font-extrabold text-[#3B5BDB] uppercase tracking-wider mb-1.5">
                      Recommended Next Actions
                    </div>
                    <ul className="list-disc pl-5 text-xs sm:text-[13px] text-slate-800 space-y-1">
                      {ai.actions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* SWOT 4-Quadrant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Strengths */}
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#047857] mb-2">
                      Strengths
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1">
                      {swot.strengths.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#B91C1C] mb-2">
                      Weaknesses
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1">
                      {swot.weaknesses.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#1D4ED8] mb-2">
                      Opportunities
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1">
                      {swot.opportunities.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3.5">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#C2410C] mb-2">
                      Threats
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1">
                      {swot.threats.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
