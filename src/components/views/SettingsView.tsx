import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { isSoundEnabled, setSoundEnabled, playSound } from '../../utils/audio';
import { downloadBlob, todayStr } from '../../utils/helpers';

export const SettingsView: React.FC = () => {
  const {
    apiUrl,
    setApiUrl,
    sheetId,
    setSheetId,
    backendOnline,
    backendStatusText,
    googleUser,
    isGoogleConnected,
    googleSheetTitle,
    connectGoogle,
    disconnectGoogle,
    syncDirectGoogleSheets,
    arrangeKavroGoogleSheet,
    syncFromSheets,
    testApiConnection,
    addToast,
    tickets
  } = useData();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [inputSheetId, setInputSheetId] = useState(sheetId);
  const [testing, setTesting] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [arrangingKavro, setArrangingKavro] = useState(false);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  const handleSaveSheetId = () => {
    setSheetId(inputSheetId.trim());
    addToast(`Google Sheet ID saved: ${inputSheetId.trim()}`, 'success');
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      await connectGoogle();
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleSyncDirect = async () => {
    setSyncingGoogle(true);
    try {
      await syncDirectGoogleSheets();
    } finally {
      setSyncingGoogle(false);
    }
  };

  const handleArrangeKavro = async () => {
    setArrangingKavro(true);
    try {
      await arrangeKavroGoogleSheet();
    } finally {
      setArrangingKavro(false);
    }
  };

  const handleSaveUrl = async () => {
    setApiUrl(inputUrl.trim());
    addToast('Apps Script URL saved. Testing connection…', 'info');
    setTesting(true);
    const res = await testApiConnection();
    setTesting(false);
    if (res.ok) {
      addToast(res.message, 'success');
    } else {
      addToast(res.message, 'warn');
    }
  };

  const handleSoundToggle = (val: boolean) => {
    setSoundEnabled(val);
    setSoundActive(val);
    addToast(val ? 'Sound alerts enabled' : 'Sound alerts muted', 'info');
    if (val) playSound('success');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({
      exportedAt: new Date().toISOString(),
      tickets
    }, null, 2);
    downloadBlob(`credlock_backup_${todayStr()}.json`, 'application/json', dataStr);
    addToast('Backup exported successfully', 'success');
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#060527] to-[#1e1b4b] rounded-xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1.5 flex items-center gap-2">
              <span>Direct Google Sheets Database</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                backendOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {backendOnline ? 'Connected' : 'Local Storage'}
              </span>
            </h2>
            <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
              Connected directly to Google Sheets database (ID: <code className="text-[#93c5fd] font-mono bg-white/10 px-1 py-0.5 rounded">{sheetId}</code>).
              Tickets, KAVRO device records, and coverage schedules sync directly in real time.
            </p>
          </div>
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold transition text-white shrink-0"
          >
            <span>Open Google Sheet</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </div>

      {/* Primary: Direct Google Sheets Integration Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <span>Google Sheets Direct Connection</span>
              {isGoogleConnected && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reads and updates your Google Sheet directly using Google Sheets API v4 with your authorized account.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isGoogleConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                  {googleUser?.email}
                </span>
                <button
                  type="button"
                  onClick={handleSyncDirect}
                  disabled={syncingGoogle}
                  className="px-3 py-1.5 bg-[#3B5BDB] hover:bg-[#2A3FBF] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span className={syncingGoogle ? 'animate-spin' : ''}>↻</span>
                  <span>{syncingGoogle ? 'Syncing…' : 'Sync Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={disconnectGoogle}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={connectingGoogle}
                className="inline-flex items-center gap-2.5 px-4 py-2 border border-slate-300 rounded-lg shadow-xs bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{connectingGoogle ? 'Signing in…' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Google Sheet ID input & details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Connected Google Sheet ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputSheetId}
                onChange={(e) => setInputSheetId(e.target.value)}
                placeholder="Google Sheet ID"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] bg-white"
              />
              <button
                type="button"
                onClick={handleSaveSheetId}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
              >
                Save ID
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The spreadsheet ID from the URL <code className="bg-slate-200/70 px-1 py-0.5 rounded">docs.google.com/spreadsheets/d/[ID]/edit</code>.
            </p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Spreadsheet Info</div>
            <div className="text-sm font-bold text-slate-800 truncate" title={googleSheetTitle}>
              {googleSheetTitle}
            </div>
            <div className="text-xs text-slate-600 mb-2">
              Status: <span className="font-semibold text-slate-800">{backendStatusText}</span>
            </div>
            <button
              type="button"
              onClick={handleArrangeKavro}
              disabled={arrangingKavro}
              className="w-full px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <span className={arrangingKavro ? 'animate-spin' : ''}>⚡</span>
              <span>{arrangingKavro ? 'Arranging Sheet…' : 'Arrange KAVRO Devices (1 Header)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Connections: Apps Script Fallback & Audio Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apps Script Web App Connection (Fallback) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Apps Script Web App Endpoint</h3>
              <p className="text-xs text-slate-500">Alternative webhook endpoint (<code className="font-mono">Code.gs</code>)</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
              Optional Webhook
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Apps Script Web App URL
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/30 focus:border-[#3B5BDB] font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveUrl}
              disabled={testing}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              {testing ? 'Testing…' : 'Save URL'}
            </button>
            <button
              type="button"
              onClick={() => syncFromSheets()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              ↻ Sync Via Endpoint
            </button>
          </div>
        </div>

        {/* Audio Alerts & Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base">Sound & Audio Alerts</h3>
            <span className="text-xs text-slate-500">Web Audio API</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <div className="text-sm font-semibold text-slate-800">Sound Notifications</div>
              <div className="text-xs text-slate-500">Play tone on ticket creation, update, and critical alert</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundActive}
                onChange={(e) => handleSoundToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B5BDB]"></div>
            </label>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Test Audio Cues</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { playSound('ticket'); addToast('New ticket alert sound played', 'ticket'); }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 transition"
              >
                🔔 Ticket Alert
              </button>
              <button
                type="button"
                onClick={() => { playSound('success'); addToast('Action completed sound played', 'success'); }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200 transition"
              >
                ✓ Success Chime
              </button>
              <button
                type="button"
                onClick={() => { playSound('warn'); addToast('Warning alert sound played', 'warn'); }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium border border-amber-200 transition"
              >
                ⚠ Escalation Ping
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Database backup</span>
            <button
              type="button"
              onClick={handleExportData}
              className="text-xs font-semibold text-[#3B5BDB] hover:underline flex items-center gap-1"
            >
              <span>Download JSON Backup</span>
              <span>↓</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sheet Structure & Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base mb-3 border-b border-slate-100 pb-2">
          Database Tabs in Spreadsheet ({sheetId})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Tab Name</th>
                <th className="py-2.5 px-3">Role & Contents</th>
                <th className="py-2.5 px-3">Sync Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#3B5BDB] font-mono">Tickets</td>
                <td className="py-2.5 px-3">Master tech support tickets (ID, priority, status, category, owner, dates)</td>
                <td className="py-2.5 px-3 font-medium text-emerald-600">Read & Write (Two-Way)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#3B5BDB] font-mono">KAVRO_Devices</td>
                <td className="py-2.5 px-3">All unique BNPL / device records tracked by IMEI, lock status, recovery officer</td>
                <td className="py-2.5 px-3 font-medium text-emerald-600">Read & Write (Two-Way)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#3B5BDB] font-mono">Officers</td>
                <td className="py-2.5 px-3">Support team members, recovery officers, and primary focus areas</td>
                <td className="py-2.5 px-3 text-slate-600">Read</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#3B5BDB] font-mono">Rota</td>
                <td className="py-2.5 px-3">Weekly phone coverage schedule by officer and day</td>
                <td className="py-2.5 px-3 font-medium text-emerald-600">Read & Write (Two-Way)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#3B5BDB] font-mono">Config</td>
                <td className="py-2.5 px-3">Email recipients, notification rules, and operational thresholds</td>
                <td className="py-2.5 px-3 text-slate-600">Read</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#3B5BDB] font-mono">Summary</td>
                <td className="py-2.5 px-3">Operational KPIs and aggregate support performance</td>
                <td className="py-2.5 px-3 text-slate-600">Read</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#3B5BDB] font-mono">HOME</td>
                <td className="py-2.5 px-3">Welcome, operating principles, and portal documentation</td>
                <td className="py-2.5 px-3 text-slate-600">Reference</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
