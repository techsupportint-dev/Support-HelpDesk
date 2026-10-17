import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const ApprovalsView: React.FC = () => {
  const { isLead, pendingUsers, openResets, users, approveUser, rejectUser, issueResetToken } = useAuth();
  const { addToast } = useData();

  const [issueEmail, setIssueEmail] = useState('');
  const [issuedToken, setIssuedToken] = useState<string | null>(null);

  if (!isLead()) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <h3 className="font-bold text-lg text-slate-800">Team Lead Access Only</h3>
        <p className="text-xs text-slate-500 mt-1">Approvals are managed exclusively by the Team Lead.</p>
      </div>
    );
  }

  const pending = pendingUsers();
  const resets = openResets();
  const approved = users.filter(u => u.status === 'approved');

  const handleIssueReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueEmail.trim()) return;
    try {
      const t = issueResetToken(issueEmail.trim());
      setIssuedToken(t);
      addToast(`Token generated: ${t}`, 'success');
      setIssueEmail('');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3.5 sm:p-4 text-xs sm:text-[13px] text-[#312E81] leading-relaxed shadow-xs">
        <strong className="font-bold">Approvals &amp; Reset Management:</strong> Review pending officer registrations and share password reset tokens. Only Team Lead has authority to grant system access.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Pending Registrations</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706]">{pending.length}</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Open Reset Tokens</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#060527]">{resets.length}</div>
        </div>
      </div>

      {/* Pending registrations table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC]">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">Pending User Registrations</span>
        </div>

        <div className="overflow-x-auto">
          {pending.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No pending registrations awaiting approval
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-[13px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Requested Role</th>
                  <th className="py-2.5 px-3">Registered At</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.email}</td>
                    <td className="py-2.5 px-3 uppercase text-[11px] font-bold text-slate-600">{p.role}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs">
                      {p.createdAt ? p.createdAt.slice(0, 16).replace('T', ' ') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          approveUser(p.id);
                          addToast(`User ${p.name} approved`, 'success');
                        }}
                        className="px-3 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          rejectUser(p.id);
                          addToast(`User ${p.name} rejected`, 'warn');
                        }}
                        className="px-3 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Password reset tokens table & Issuer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token requests */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <span className="font-bold text-xs sm:text-sm text-[#060527]">Active Reset Tokens</span>
          </div>

          <div className="overflow-x-auto">
            {resets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active PIN reset tokens
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-[13px]">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Token Code</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resets.map(r => (
                    <tr key={r.token} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{r.email}</td>
                      <td className="py-2.5 px-3">
                        <code className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 select-all">
                          {r.token}
                        </code>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs">
                        {r.createdAt ? r.createdAt.slice(0, 16).replace('T', ' ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Manual token issue */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-[#060527] mb-1">Issue PIN Reset Token</h3>
            <p className="text-xs text-[#64748B] mb-3">
              Generate a unique authorization token for an officer who forgot their PIN.
            </p>

            <form onSubmit={handleIssueReset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Email</label>
                <input
                  type="email"
                  required
                  value={issueEmail}
                  onChange={e => setIssueEmail(e.target.value)}
                  placeholder="e.g. tosin@credlock.africa"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>

              {issuedToken && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  Generated Token: <code className="font-mono font-bold text-sm ml-1">{issuedToken}</code>
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Generate Token
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Approved Officers */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#FAFBFC]">
          <span className="font-bold text-xs sm:text-sm text-[#060527]">Approved Team Members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Approved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approved.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{u.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3 uppercase text-[11px] font-bold text-slate-600">{u.role}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Approved
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs">{u.approvedBy || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
