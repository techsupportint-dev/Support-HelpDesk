import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { TEAM_INFO } from '../../data/constants';

interface TeamViewProps {
  onNavigate?: (view: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ onNavigate }) => {
  const { tickets } = useData();
  const { users, isLead, can } = useAuth();

  const openTickets = tickets.filter(t => t.status !== 'Resolved');
  const hasAdminRights = isLead() || can('admin');

  // Active officers and leads from users database
  const activeStaff = users.filter(u => u.status === 'approved' && (u.role === 'officer' || u.role === 'lead' || u.role === 'admin'));

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div>
          <strong className="font-bold">Support Team Roster:</strong> Responsibilities, frontline focus areas, live ticket queues, and active assignments.
        </div>
        {hasAdminRights && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="px-3 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>⛨</span> Manage Users &amp; Access Directory
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeStaff.map(u => {
          const name = u.name;
          const info = TEAM_INFO[name] || {
            role: u.role === 'lead' ? 'Team Lead' : u.role === 'admin' ? 'Administrator' : 'Support Officer',
            focus: u.role === 'lead'
              ? 'Lead operations, escalation oversight, merchant escalations, and system integrity.'
              : 'General technical support, Kavro device issues, and ticketing operations.'
          };

          const myOpen = openTickets.filter(t => t.owner && t.owner.toLowerCase() === name.toLowerCase()).length;
          const myResolved = tickets.filter(t => t.owner && t.owner.toLowerCase() === name.toLowerCase() && t.status === 'Resolved').length;
          const myPending = openTickets.filter(t => t.owner && t.owner.toLowerCase() === name.toLowerCase() && t.status === 'Pending').length;

          return (
            <div key={u.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl text-white font-bold grid place-items-center text-base shadow-xs ${
                    u.role === 'lead'
                      ? 'bg-gradient-to-br from-purple-700 to-[#060527]'
                      : u.role === 'admin'
                      ? 'bg-gradient-to-br from-[#3B5BDB] to-[#1E293B]'
                      : 'bg-gradient-to-br from-emerald-600 to-[#060527]'
                  }`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-[#060527] leading-tight">{name}</h3>
                      {u.role === 'lead' && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">Lead</span>
                      )}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                      {info.role}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">{u.email}</div>
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mb-4">
                  {info.focus}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="font-extrabold text-lg text-slate-800">{myOpen}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Open</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="font-extrabold text-lg text-emerald-600">{myResolved}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Resolved</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <div className="font-extrabold text-lg text-amber-600">{myPending}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Pending</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
