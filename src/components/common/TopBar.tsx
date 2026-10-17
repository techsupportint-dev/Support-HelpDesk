import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { downloadBlob, todayStr } from '../../utils/helpers';

interface TopBarProps {
  title: string;
  onOpenSidebar: () => void;
  onQuickNewTicket: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onOpenSidebar, onQuickNewTicket }) => {
  const {
    syncFromSheets,
    tickets,
    addToast,
    isGoogleConnected,
    googleUser,
    connectGoogle
  } = useData();

  const [clock, setClock] = useState<string>('');
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      setClock(
        new Date().toLocaleString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFromSheets();
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(tickets, null, 2);
    downloadBlob(`credlock_tickets_${todayStr()}.json`, 'application/json', jsonStr);
    addToast('Tickets exported as JSON', 'success');
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="lg:hidden p-1.5 text-[#060527] hover:bg-slate-100 rounded-lg text-lg"
        title="Open navigation"
      >
        ☰
      </button>

      <h1 className="font-bold text-[15px] sm:text-base text-[#060527] flex-1 truncate">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <span className="hidden lg:inline-block text-xs text-[#64748B] font-mono mr-1">
          {clock}
        </span>

        {isGoogleConnected ? (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold"
            title={`Connected to Google Sheets as ${googleUser?.email}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sheets Connected
          </span>
        ) : (
          <button
            type="button"
            onClick={() => connectGoogle()}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition shadow-xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>Connect Sheets</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync'}
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-colors"
        >
          Export
        </button>

        <button
          type="button"
          onClick={onQuickNewTicket}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all"
        >
          + New Ticket
        </button>
      </div>
    </header>
  );
};
