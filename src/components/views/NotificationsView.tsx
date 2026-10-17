import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { OFFICERS } from '../../data/constants';
import { isSoundEnabled, setSoundEnabled, playSound } from '../../utils/audio';

export const NotificationsView: React.FC = () => {
  const { notifySettings, updateNotifySettings, notifyLog, clearNotifyLog, addToast } = useData();

  const [enabled, setEnabled] = useState(notifySettings.enabled);
  const [teamLeadEmail, setTeamLeadEmail] = useState(notifySettings.teamLeadEmail);
  const [engineeringEmail, setEngineeringEmail] = useState(notifySettings.engineeringEmail);
  const [opsEmail, setOpsEmail] = useState(notifySettings.opsEmail);
  const [officerEmails, setOfficerEmails] = useState<Record<string, string>>(notifySettings.officerEmails);
  const [rules, setRules] = useState(notifySettings.rules);

  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const handleSoundToggle = (checked: boolean) => {
    setSoundOn(checked);
    setSoundEnabled(checked);
    if (checked) {
      playSound('ticket');
      addToast('Sound alerts enabled', 'success');
    } else {
      addToast('Sound alerts muted', 'info');
    }
  };

  const handleOfficerEmailChange = (officer: string, email: string) => {
    setOfficerEmails(prev => ({ ...prev, [officer]: email }));
  };

  const handleRuleToggle = (ruleKey: keyof typeof rules) => {
    setRules(prev => ({ ...prev, [ruleKey]: !prev[ruleKey] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotifySettings({
      enabled,
      teamLeadEmail,
      engineeringEmail,
      opsEmail,
      officerEmails,
      rules
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Email Notifications &amp; Alerts:</strong> Email notifications prepare standard operational dispatches using your mail client (mailto). Configure addresses and rules below.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Settings Form */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Notification Settings</span>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                  className="rounded text-[#3B5BDB] focus:ring-[#3B5BDB]"
                />
                Enable Email Notification Prompts
              </label>

              {/* Sound toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={e => handleSoundToggle(e.target.checked)}
                  className="rounded text-[#3B5BDB]"
                />
                Sound Beeps
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team Lead Email</label>
                <input
                  type="email"
                  value={teamLeadEmail}
                  onChange={e => setTeamLeadEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Engineering Email</label>
                  <input
                    type="email"
                    value={engineeringEmail}
                    onChange={e => setEngineeringEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operations Email</label>
                  <input
                    type="email"
                    value={opsEmail}
                    onChange={e => setOpsEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Officer Direct Emails
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {OFFICERS.map(o => (
                    <div key={o}>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{o}</label>
                      <input
                        type="email"
                        value={officerEmails[o] || ''}
                        onChange={e => handleOfficerEmailChange(o, e.target.value)}
                        placeholder={`${o.toLowerCase()}@credlock.africa`}
                        className="w-full px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Auto-Prompt Rules
                </label>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.onP1}
                      onChange={() => handleRuleToggle('onP1')}
                      className="rounded text-[#3B5BDB]"
                    />
                    Prompt on P1 Critical ticket creation
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.onP2}
                      onChange={() => handleRuleToggle('onP2')}
                      className="rounded text-[#3B5BDB]"
                    />
                    Prompt on P2 High ticket creation
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.onAssign}
                      onChange={() => handleRuleToggle('onAssign')}
                      className="rounded text-[#3B5BDB]"
                    />
                    Prompt when ticket is assigned to officer
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.onEscalation}
                      onChange={() => handleRuleToggle('onEscalation')}
                      className="rounded text-[#3B5BDB]"
                    />
                    Prompt when escalation is recorded
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs rounded-lg shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Info & Sound Test */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-[#060527] mb-2">How Notifications Work</h3>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>Enter real addresses for each officer and for Engineering / Operations.</li>
              <li>When a <strong>P1</strong> or <strong>P2</strong> ticket is created, the portal asks whether to open a notification draft.</li>
              <li>From any ticket, clicking <strong>✉ Email notify</strong> allows quick dispatch to owner, lead, or both.</li>
              <li>Your default mail client opens with pre-filled ticket details and recipients.</li>
              <li>Every opened notification is archived in the audit log below.</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="text-xs font-bold text-slate-700 mb-2">Sound Alert Test</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => playSound('ticket')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
              >
                Test Ticket Chime
              </button>
              <button
                type="button"
                onClick={() => playSound('success')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
              >
                Test Success Chime
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification log */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-between">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">Notification Audit Log (Last 30)</span>
          {notifyLog.length > 0 && (
            <button
              type="button"
              onClick={clearNotifyLog}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Clear Log
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {notifyLog.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No notifications triggered yet
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Recipient(s)</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifyLog.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                      {new Date(n.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{n.ticketId}</td>
                    <td className="py-2.5 px-3 text-slate-700">{n.purpose}</td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]">{n.to}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
