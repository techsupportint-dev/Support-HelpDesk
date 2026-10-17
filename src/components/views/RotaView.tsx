import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS } from '../../data/constants';

export const RotaView: React.FC = () => {
  const { rota, saveRota } = useData();

  const [weekStart, setWeekStart] = useState(rota.weekStart);
  const [slots, setSlots] = useState<Record<string, string[]>>(rota.slots);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const slotNames = Object.keys(slots);

  const handleOfficerChange = (slot: string, dayIndex: number, value: string) => {
    setSlots(prev => {
      const currentSlot = prev[slot] ? [...prev[slot]] : ['', '', '', '', ''];
      currentSlot[dayIndex] = value;
      return {
        ...prev,
        [slot]: currentSlot
      };
    });
  };

  const handleSave = () => {
    saveRota({
      weekStart,
      slots
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Operating principle:</strong> Publish who monitors each phone. Explicit handover required before breaks, lunch, meetings or end of day.
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Week commencing:</span>
            <input
              type="date"
              value={weekStart}
              onChange={e => setWeekStart(e.target.value)}
              className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            Save Rota
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-44">Period / Phone</th>
                {days.map(d => (
                  <th key={d} className="py-3 px-3 text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slotNames.map(slot => (
                <tr key={slot} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-800">{slot}</td>
                  {days.map((_, dayIndex) => {
                    const currentVal = slots[slot]?.[dayIndex] || '';
                    return (
                      <td key={dayIndex} className="py-2 px-2 text-center">
                        <select
                          value={currentVal}
                          onChange={e => handleOfficerChange(slot, dayIndex, e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-lg text-xs font-semibold text-center focus:outline-none focus:border-[#3B5BDB] ${
                            currentVal === 'All'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : currentVal
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <option value="">— Unassigned —</option>
                          <option value="All">All</option>
                          {OFFICERS.map(o => (
                            <option key={o} value={o}>
                              {o.split(' ')[0]}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFBFC] flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            Save Rota
          </button>
        </div>
      </div>
    </div>
  );
};
