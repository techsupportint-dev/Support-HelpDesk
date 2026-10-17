import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Ticket,
  KavroRecord,
  RotaData,
  NotifySettings,
  NotifyLogEntry,
  MonthlyUploadedReport,
  MonthlyDoc,
  ToastMessage
} from '../types';
import { getSampleTickets } from '../data/sampleTickets';
import { INITIAL_KAVRO_RECORDS } from '../data/kavroSeed';
import { DEFAULT_NOTIFY, getDefaultRota } from '../data/constants';
import { PORTAL_CONFIG } from '../data/config';
import { playSound } from '../utils/audio';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  getGoogleAccessToken
} from '../services/googleAuth';
import {
  syncDirectFromGoogleSheet,
  getSpreadsheetMetadata,
  arrangeAndStandardizeKavroSheet
} from '../services/googleSheets';

const STORAGE_KEY = 'credlock_ts_tickets_v1';
const KAVRO_KEY = 'credlock_ts_kavro_v1';
const ROTA_KEY = 'credlock_ts_rota_v1';
const NOTIFY_KEY = 'credlock_ts_notify_v1';
const NOTIFY_LOG_KEY = 'credlock_ts_notify_log_v1';
const MONTHLY_REPORTS_KEY = 'credlock_monthly_reports_v1';
const MONTHLY_DOC_KEY = 'credlock_monthly_builder_v1';
const API_URL_KEY = 'credlock_ts_api_url';
const SHEET_ID_KEY = 'credlock_ts_sheet_id';

export interface DataContextType {
  tickets: Ticket[];
  kavroRecords: KavroRecord[];
  rota: RotaData;
  notifySettings: NotifySettings;
  notifyLog: NotifyLogEntry[];
  monthlyReports: Record<string, MonthlyUploadedReport>;
  apiUrl: string;
  sheetId: string;
  backendOnline: boolean;
  backendStatusText: string;
  googleUser: User | null;
  isGoogleConnected: boolean;
  googleSheetTitle: string;
  toasts: ToastMessage[];
  addToast: (msg: string, type?: ToastMessage['type'], title?: string) => void;
  removeToast: (id: string) => void;
  upsertTicket: (ticket: Ticket) => void;
  deleteTicket: (id: string) => void;
  saveRota: (newRota: RotaData) => void;
  updateNotifySettings: (settings: NotifySettings) => void;
  clearNotifyLog: () => void;
  addNotifyLogEntry: (entry: Omit<NotifyLogEntry, 'id' | 'at'>) => void;
  updateKavroRecord: (record: KavroRecord) => void;
  saveMonthlyUpload: (monthKey: string, report: MonthlyUploadedReport) => void;
  getMonthlyDoc: (monthKey: string) => MonthlyDoc;
  saveMonthlyDoc: (monthKey: string, doc: MonthlyDoc) => void;
  syncFromSheets: () => Promise<void>;
  syncDirectGoogleSheets: () => Promise<void>;
  arrangeKavroGoogleSheet: () => Promise<{ ok: boolean; count: number; message: string }>;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  testApiConnection: () => Promise<{ ok: boolean; message: string }>;
  setApiUrl: (url: string) => void;
  setSheetId: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type, title }]);

    if (type === 'success') playSound('success');
    else if (type === 'ticket') playSound('ticket');
    else if (type === 'warn' || type === 'error') playSound('warn');

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ── Sheet ID & API URL ──
  const [sheetId, setSheetIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(SHEET_ID_KEY) || PORTAL_CONFIG.SHEET_ID || '1qOySvKFNS5kkMGjHoyr51-qJJ3bQavTzk83k5owZbIo';
    } catch {
      return PORTAL_CONFIG.SHEET_ID || '1qOySvKFNS5kkMGjHoyr51-qJJ3bQavTzk83k5owZbIo';
    }
  });

  const setSheetId = (newId: string) => {
    const clean = newId.trim();
    setSheetIdState(clean);
    try {
      localStorage.setItem(SHEET_ID_KEY, clean);
    } catch {}
  };

  const [apiUrl, setApiUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem(API_URL_KEY) || PORTAL_CONFIG.API_URL || '';
    } catch {
      return PORTAL_CONFIG.API_URL || '';
    }
  });

  const setApiUrl = (url: string) => {
    setApiUrlState(url);
    try {
      localStorage.setItem(API_URL_KEY, url);
    } catch {}
  };

  // ── Google OAuth & Direct Sheets Connection ──
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [googleSheetTitle, setGoogleSheetTitle] = useState<string>('Credlock TS Database');

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsGoogleConnected(true);
        // Verify sheet connection
        getSpreadsheetMetadata(sheetId, token)
          .then(meta => {
            setGoogleSheetTitle(meta.title);
            setBackendOnline(true);
            setBackendStatusText(`Google Sheet: ${meta.title}`);
          })
          .catch(() => {});
      },
      () => {
        setGoogleUser(null);
        setIsGoogleConnected(false);
      }
    );
    return () => unsubscribe();
  }, [sheetId]);

  const connectGoogle = async (): Promise<boolean> => {
    try {
      addToast('Signing in to Google Sheets…', 'info');
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
      setIsGoogleConnected(true);
      addToast(`Connected with Google as ${res.user.email}`, 'success');

      // Fetch metadata and sync
      const meta = await getSpreadsheetMetadata(sheetId, res.accessToken);
      setGoogleSheetTitle(meta.title);
      setBackendOnline(true);
      setBackendStatusText(`Google Sheet: ${meta.title}`);
      addToast(`Connected directly to "${meta.title}" (${meta.sheetNames.length} tabs)`, 'success');

      // Auto sync once connected
      await syncDirectGoogleSheets();
      return true;
    } catch (err: any) {
      console.error('Google connect error:', err);
      addToast(err?.message || 'Failed to connect with Google Sheets', 'error');
      return false;
    }
  };

  const disconnectGoogle = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    setIsGoogleConnected(false);
    setBackendOnline(false);
    setBackendStatusText('Offline · Local DB');
    addToast('Disconnected from Google Sheets', 'info');
  };

  // ── Tickets ──
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const seeded = getSampleTickets();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  });

  const upsertTicket = (ticket: Ticket) => {
    setTickets(prev => {
      const idx = prev.findIndex(t => t.id === ticket.id);
      let updated: Ticket[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = ticket;
        addToast(`Ticket ${ticket.id} updated`, 'success');
      } else {
        updated = [ticket, ...prev];
        addToast(`Ticket ${ticket.id} created`, 'ticket');
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteTicket = (id: string) => {
    setTickets(prev => {
      const updated = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      addToast(`Ticket ${id} deleted`, 'info');
      return updated;
    });
  };

  // ── Kavro Records ──
  const [kavroRecords, setKavroRecords] = useState<KavroRecord[]>(() => {
    try {
      const raw = localStorage.getItem(KAVRO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem(KAVRO_KEY, JSON.stringify(INITIAL_KAVRO_RECORDS));
    return INITIAL_KAVRO_RECORDS;
  });

  const updateKavroRecord = (record: KavroRecord) => {
    setKavroRecords(prev => {
      const idx = prev.findIndex(r => r.imei === record.imei || r.id === record.id);
      let updated: KavroRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = record;
      } else {
        updated = [record, ...prev];
      }
      try {
        localStorage.setItem(KAVRO_KEY, JSON.stringify(updated));
      } catch {}
      addToast(`Kavro record ${record.imei} updated`, 'success');
      return updated;
    });
  };

  // ── Rota ──
  const [rota, setRota] = useState<RotaData>(() => {
    try {
      const raw = localStorage.getItem(ROTA_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const def = getDefaultRota();
    localStorage.setItem(ROTA_KEY, JSON.stringify(def));
    return def;
  });

  const saveRota = (newRota: RotaData) => {
    setRota(newRota);
    try {
      localStorage.setItem(ROTA_KEY, JSON.stringify(newRota));
      addToast('Coverage rota saved', 'success');
    } catch {}
  };

  // ── Notifications ──
  const [notifySettings, setNotifySettings] = useState<NotifySettings>(() => {
    try {
      const raw = localStorage.getItem(NOTIFY_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_NOTIFY;
  });

  const updateNotifySettings = (settings: NotifySettings) => {
    setNotifySettings(settings);
    try {
      localStorage.setItem(NOTIFY_KEY, JSON.stringify(settings));
      addToast('Notification settings saved', 'success');
    } catch {}
  };

  const [notifyLog, setNotifyLog] = useState<NotifyLogEntry[]>(() => {
    try {
      const raw = localStorage.getItem(NOTIFY_LOG_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const addNotifyLogEntry = (entry: Omit<NotifyLogEntry, 'id' | 'at'>) => {
    const newEntry: NotifyLogEntry = {
      ...entry,
      id: 'nl-' + Date.now(),
      at: new Date().toISOString()
    };
    setNotifyLog(prev => {
      const updated = [newEntry, ...prev.slice(0, 99)];
      try {
        localStorage.setItem(NOTIFY_LOG_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearNotifyLog = () => {
    setNotifyLog([]);
    try {
      localStorage.removeItem(NOTIFY_LOG_KEY);
      addToast('Notification log cleared', 'info');
    } catch {}
  };

  // ── Monthly Reports ──
  const [monthlyReports, setMonthlyReports] = useState<Record<string, MonthlyUploadedReport>>(() => {
    try {
      const raw = localStorage.getItem(MONTHLY_REPORTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const saveMonthlyUpload = (monthKey: string, report: MonthlyUploadedReport) => {
    setMonthlyReports(prev => {
      const updated = { ...prev, [monthKey]: report };
      try {
        localStorage.setItem(MONTHLY_REPORTS_KEY, JSON.stringify(updated));
        addToast(`Report for ${report.yearMonth} saved`, 'success');
      } catch {}
      return updated;
    });
  };

  const getMonthlyDoc = (monthKey: string): MonthlyDoc => {
    try {
      const raw = localStorage.getItem(`${MONTHLY_DOC_KEY}_${monthKey}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      title: `Credlock Support Monthly Review – ${monthKey}`,
      preparedBy: 'Joseph Olayemi',
      department: 'Technical Support',
      executiveSummary: '',
      highlights: '',
      challenges: '',
      actionsNext: '',
      notes: ''
    };
  };

  const saveMonthlyDoc = (monthKey: string, doc: MonthlyDoc) => {
    try {
      localStorage.setItem(`${MONTHLY_DOC_KEY}_${monthKey}`, JSON.stringify(doc));
      addToast('Monthly report document draft saved', 'success');
    } catch {}
  };

  // ── Backend Status ──
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [backendStatusText, setBackendStatusText] = useState<string>('Offline · Local DB');

  // Direct Google Sheets API sync
  const syncDirectGoogleSheets = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      addToast('Please connect to Google Sheets with your account first', 'warn');
      return;
    }
    addToast(`Syncing directly with Google Sheet ${sheetId}…`, 'info');
    try {
      const result = await syncDirectFromGoogleSheet(sheetId, token);
      if (result.tickets.length > 0) {
        setTickets(result.tickets);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.tickets));
        } catch {}
      }
      if (result.kavroRecords.length > 0) {
        setKavroRecords(result.kavroRecords);
        try {
          localStorage.setItem(KAVRO_KEY, JSON.stringify(result.kavroRecords));
        } catch {}
      }
      setGoogleSheetTitle(result.spreadsheetTitle);
      setBackendOnline(true);
      setBackendStatusText(`Google Sheet: ${result.spreadsheetTitle}`);
      addToast(
        `Successfully synced ${result.tickets.length} tickets and ${result.kavroRecords.length} Kavro devices from "${result.spreadsheetTitle}"`,
        'success'
      );
    } catch (err: any) {
      console.error('Direct Google Sheets sync error:', err);
      addToast(`Google Sheets Sync Error: ${err?.message || 'Check Sheet ID & permissions'}`, 'error');
    }
  };

  /**
   * Arrange all records and enforce only ONE single header in the Google Sheet WHERE KAVRO_Devices
   */
  const arrangeKavroGoogleSheet = async (): Promise<{ ok: boolean; count: number; message: string }> => {
    let token = getGoogleAccessToken();
    if (!token) {
      addToast('Connecting to your authorized Google account…', 'info');
      const ok = await connectGoogle();
      if (!ok) {
        const msg = 'Google account authorization required to modify spreadsheet';
        addToast(msg, 'warn');
        return { ok: false, count: 0, message: msg };
      }
      token = getGoogleAccessToken();
      if (!token) {
        const msg = 'Unable to retrieve active Google access token';
        addToast(msg, 'error');
        return { ok: false, count: 0, message: msg };
      }
    }

    addToast('Standardizing KAVRO_Devices tab: stripping duplicate headers & arranging columns…', 'info');
    try {
      const res = await arrangeAndStandardizeKavroSheet(sheetId, token, kavroRecords);
      // Update local state with the cleaned, ordered records
      setKavroRecords(res.cleanedRecords);
      localStorage.setItem(KAVRO_KEY, JSON.stringify(res.cleanedRecords));

      addToast(
        `Google Sheet standardized! Arranged ${res.count} records with only 1 locked header in "${res.tabName}".`,
        'success'
      );
      return {
        ok: true,
        count: res.count,
        message: `Successfully arranged ${res.count} records and applied only 1 header in "${res.tabName}"`
      };
    } catch (err: any) {
      console.error('Error arranging KAVRO_Devices:', err);
      const msg = err?.message || 'Failed to arrange KAVRO_Devices in Google Sheet';
      addToast(msg, 'error');
      return { ok: false, count: 0, message: msg };
    }
  };

  // Apps Script sync fallback or auto-sync
  const syncFromSheets = async () => {
    // If Google OAuth is connected, prefer direct Google Sheets API
    if (isGoogleConnected && getGoogleAccessToken()) {
      await syncDirectGoogleSheets();
      return;
    }

    addToast('Syncing with Google Sheets endpoint…', 'info');
    if (!apiUrl) {
      addToast('No Google Sheets Web App URL configured. Connect with Google or set URL in Settings.', 'warn');
      return;
    }
    try {
      const url = apiUrl + (apiUrl.includes('?') ? '&' : '?') + 'action=listTickets';
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      const list = data.tickets || (Array.isArray(data) ? data : null);
      if (list && list.length) {
        setTickets(list);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        setBackendOnline(true);
        setBackendStatusText('Google Sheets live');
        addToast(`Synced ${list.length} tickets from Google Sheets`, 'success');
      } else {
        setBackendOnline(true);
        setBackendStatusText('Google Sheets connected');
        addToast('Synced with Google Sheets (no new tickets)', 'info');
      }
    } catch (e) {
      setBackendOnline(false);
      setBackendStatusText('Offline · Local DB');
      addToast('Could not reach Google Sheets endpoint; using local storage', 'warn');
    }
  };

  const testApiConnection = async (): Promise<{ ok: boolean; message: string }> => {
    if (isGoogleConnected && getGoogleAccessToken()) {
      try {
        const meta = await getSpreadsheetMetadata(sheetId, getGoogleAccessToken()!);
        return { ok: true, message: `Connected to Google Sheet: "${meta.title}" (${meta.sheetNames.join(', ')})` };
      } catch (e: any) {
        return { ok: false, message: e.message || 'Cannot read Google Sheet' };
      }
    }

    if (!apiUrl) {
      return { ok: false, message: 'No Apps Script Web App URL configured' };
    }
    try {
      const url = apiUrl + (apiUrl.includes('?') ? '&' : '?') + 'action=ping';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        return { ok: true, message: 'Connected to Apps Script Web App' };
      }
      return { ok: false, message: data.error || 'Server returned not OK' };
    } catch (e: any) {
      return { ok: false, message: e.message || 'Failed to fetch Web App URL' };
    }
  };

  return (
    <DataContext.Provider
      value={{
        tickets,
        kavroRecords,
        rota,
        notifySettings,
        notifyLog,
        monthlyReports,
        apiUrl,
        sheetId,
        backendOnline,
        backendStatusText,
        googleUser,
        isGoogleConnected,
        googleSheetTitle,
        toasts,
        addToast,
        removeToast,
        upsertTicket,
        deleteTicket,
        saveRota,
        updateNotifySettings,
        clearNotifyLog,
        addNotifyLogEntry,
        updateKavroRecord,
        saveMonthlyUpload,
        getMonthlyDoc,
        saveMonthlyDoc,
        syncFromSheets,
        syncDirectGoogleSheets,
        arrangeKavroGoogleSheet,
        connectGoogle,
        disconnectGoogle,
        testApiConnection,
        setApiUrl,
        setSheetId
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
