import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const { currentUser, isLead, can, pendingUsers, openResets, logout } = useAuth();
  const { tickets, kavroRecords, backendOnline, backendStatusText } = useData();

  const openTicketsCount = tickets.filter(t => t.status !== 'Resolved').length;
  const lockedKavroCount = kavroRecords.filter(r => (r.credlockStatus || '').toLowerCase() === 'locked').length;
  const pendingApprovalsCount = pendingUsers().length + openResets().length;

  const handleNavClick = (view: string) => {
    if (view === 'admin' && !can('admin') && !isLead()) return;
    if (view === 'approvals' && !can('approvals') && !isLead()) return;
    if (view === 'lead-dash' && !can('lead-dash') && !isLead()) return;
    if (!can(view)) return;

    onNavigate(view);
    onClose();
  };

  const navItemClass = (view: string) => {
    const isActive = currentView === view;
    return `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left ${
      isActive
        ? 'bg-gradient-to-r from-[#3B5BDB] to-[#4F6EF7] text-white shadow-sm font-semibold'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;
  };

  const roleLabel = (role?: string) => {
    if (role === 'lead') return 'Team Lead';
    if (role === 'admin') return 'Admin';
    if (role === 'viewer') return 'Viewer';
    return 'Support Officer';
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-[260px] min-w-[260px] bg-[#060527] text-white flex flex-col fixed top-0 left-0 bottom-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-xl`}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <img
            src="https://credlockng.com/brand/credlock-logo.png"
            alt="Credlock"
            className="h-7 w-auto object-contain brightness-0 invert"
          />
          <div>
            <div className="font-bold text-sm tracking-tight">Tech Support</div>
            <div className="text-[11px] opacity-60">Operations portal</div>
          </div>
        </div>

        {/* Backend status pill */}
        <div className="flex items-center gap-2 mx-3.5 my-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/75">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="truncate">{backendStatusText}</span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2.5 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {/* Operations */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-3 pt-3 pb-1">
            Operations
          </div>

          {(isLead() || can('lead-dash')) && (
            <button
              type="button"
              className={navItemClass('lead-dash')}
              onClick={() => handleNavClick('lead-dash')}
            >
              <span className="w-4 text-center text-xs">◆</span>
              <span>Lead Dashboard</span>
            </button>
          )}

          {can('dashboard') && (
            <button
              type="button"
              className={navItemClass('dashboard')}
              onClick={() => handleNavClick('dashboard')}
            >
              <span className="w-4 text-center text-xs">■</span>
              <span>Dashboard</span>
            </button>
          )}

          {can('tickets') && (
            <button
              type="button"
              className={navItemClass('tickets')}
              onClick={() => handleNavClick('tickets')}
            >
              <span className="w-4 text-center text-xs">☰</span>
              <span>Tickets</span>
              {openTicketsCount > 0 && (
                <span className="ml-auto bg-white/20 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {openTicketsCount}
                </span>
              )}
            </button>
          )}

          {can('kavro') && (
            <button
              type="button"
              className={navItemClass('kavro')}
              onClick={() => handleNavClick('kavro')}
            >
              <span className="w-4 text-center text-xs">📱</span>
              <span>Kavro Issues</span>
              {lockedKavroCount > 0 && (
                <span className="ml-auto bg-[#DC2626] text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {lockedKavroCount}
                </span>
              )}
            </button>
          )}

          {can('new-ticket') && (
            <button
              type="button"
              className={navItemClass('new-ticket')}
              onClick={() => handleNavClick('new-ticket')}
            >
              <span className="w-4 text-center font-bold text-sm">+</span>
              <span>New Ticket</span>
            </button>
          )}

          {can('rota') && (
            <button
              type="button"
              className={navItemClass('rota')}
              onClick={() => handleNavClick('rota')}
            >
              <span className="w-4 text-center text-xs">◱</span>
              <span>Coverage Rota</span>
            </button>
          )}

          {/* Reports */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-3 pt-3.5 pb-1">
            Reports
          </div>

          {can('daily') && (
            <button
              type="button"
              className={navItemClass('daily')}
              onClick={() => handleNavClick('daily')}
            >
              <span className="w-4 text-center text-xs">◐</span>
              <span>Daily</span>
            </button>
          )}

          {can('weekly') && (
            <button
              type="button"
              className={navItemClass('weekly')}
              onClick={() => handleNavClick('weekly')}
            >
              <span className="w-4 text-center text-xs">◫</span>
              <span>Weekly</span>
            </button>
          )}

          {can('monthly') && (
            <button
              type="button"
              className={navItemClass('monthly')}
              onClick={() => handleNavClick('monthly')}
            >
              <span className="w-4 text-center text-xs">◪</span>
              <span>Monthly</span>
            </button>
          )}

          {can('officer-reports') && (
            <button
              type="button"
              className={navItemClass('officer-reports')}
              onClick={() => handleNavClick('officer-reports')}
            >
              <span className="w-4 text-center text-xs">⇣</span>
              <span>Officer Reports</span>
            </button>
          )}

          {can('monthly-reports') && (
            <button
              type="button"
              className={navItemClass('monthly-reports')}
              onClick={() => handleNavClick('monthly-reports')}
            >
              <span className="w-4 text-center text-xs">📅</span>
              <span>Monthly Reports</span>
            </button>
          )}

          {can('analytics') && (
            <button
              type="button"
              className={navItemClass('analytics')}
              onClick={() => handleNavClick('analytics')}
            >
              <span className="w-4 text-center text-xs">◉</span>
              <span>Analytics</span>
            </button>
          )}

          {can('ai-insights') && (
            <button
              type="button"
              className={navItemClass('ai-insights')}
              onClick={() => handleNavClick('ai-insights')}
            >
              <span className="w-4 text-center text-xs">✦</span>
              <span>AI Insights</span>
            </button>
          )}

          {/* Team & Tools */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-3 pt-3.5 pb-1">
            Team & Tools
          </div>

          {can('team') && (
            <button
              type="button"
              className={navItemClass('team')}
              onClick={() => handleNavClick('team')}
            >
              <span className="w-4 text-center text-xs">○</span>
              <span>Team</span>
            </button>
          )}

          {can('templates') && (
            <button
              type="button"
              className={navItemClass('templates')}
              onClick={() => handleNavClick('templates')}
            >
              <span className="w-4 text-center text-xs">✉</span>
              <span>Templates</span>
            </button>
          )}

          {can('notifications') && (
            <button
              type="button"
              className={navItemClass('notifications')}
              onClick={() => handleNavClick('notifications')}
            >
              <span className="w-4 text-center text-xs">🔔</span>
              <span>Notifications</span>
            </button>
          )}

          {(isLead() || can('approvals')) && (
            <button
              type="button"
              className={navItemClass('approvals')}
              onClick={() => handleNavClick('approvals')}
            >
              <span className="w-4 text-center text-xs">✓</span>
              <span>Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-auto bg-[#DC2626] text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {can('my-work') && (
            <button
              type="button"
              className={navItemClass('my-work')}
              onClick={() => handleNavClick('my-work')}
            >
              <span className="w-4 text-center text-xs">★</span>
              <span>My Work</span>
            </button>
          )}

          {(isLead() || can('admin')) && (
            <button
              type="button"
              className={navItemClass('admin')}
              onClick={() => handleNavClick('admin')}
            >
              <span className="w-4 text-center text-xs">⛨</span>
              <span>Admin Panel</span>
            </button>
          )}

          {can('settings') && (
            <button
              type="button"
              className={navItemClass('settings')}
              onClick={() => handleNavClick('settings')}
            >
              <span className="w-4 text-center text-xs">⚙</span>
              <span>Settings</span>
            </button>
          )}
        </nav>

        {/* Footer with user bar */}
        <div className="p-3 border-t border-white/10 bg-[#050422]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B5BDB] to-[#6366F1] text-white grid place-items-center font-bold text-xs uppercase shadow-xs">
              {currentUser?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs truncate leading-tight">
                {currentUser?.name || 'User'}
              </div>
              <div className="text-[10px] opacity-60 truncate">
                {roleLabel(currentUser?.role)}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="text-white/60 hover:text-white px-2 py-1 rounded text-xs hover:bg-white/10 transition-colors font-medium"
            >
              Out
            </button>
          </div>
          <div className="text-[10px] text-white/30 text-center mt-2">
            Portal v4.0 · Credlock
          </div>
        </div>
      </aside>
    </>
  );
};
