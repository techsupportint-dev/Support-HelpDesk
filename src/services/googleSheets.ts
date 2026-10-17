import { Ticket, KavroRecord, Priority, TicketStatus, RequesterType, Channel } from '../types';

export interface SheetMetadata {
  title: string;
  sheetNames: string[];
}

export interface GoogleSheetsSyncResult {
  spreadsheetTitle: string;
  tickets: Ticket[];
  kavroRecords: KavroRecord[];
  officers?: string[];
  rawTabs: string[];
}

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Fetch spreadsheet metadata to get list of sheet tabs
 */
export async function getSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SheetMetadata> {
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}?includeGridData=false`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch spreadsheet metadata (${res.status})`);
  }
  const data = await res.json();
  const title = data.properties?.title || 'Google Sheet';
  const sheetNames = (data.sheets || []).map((s: { properties?: { title?: string } }) => s.properties?.title || '').filter(Boolean);
  return { title, sheetNames };
}

/**
 * Fetch values for a given sheet / range
 */
export async function getSheetValues(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<string[][]> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch range ${range} (${res.status})`);
  }
  const data = await res.json();
  return data.values || [];
}

/**
 * Append a row to a sheet tab
 */
export async function appendSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowValues: (string | number | boolean)[],
  accessToken: string
): Promise<boolean> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowValues]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to append row (${res.status})`);
  }
  return true;
}

/**
 * Update an existing range/row in a sheet
 */
export async function updateSheetRange(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][],
  accessToken: string
): Promise<boolean> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to update range (${res.status})`);
  }
  return true;
}

/**
 * Sync all core data directly from the Google Sheet
 */
export async function syncDirectFromGoogleSheet(
  spreadsheetId: string,
  accessToken: string
): Promise<GoogleSheetsSyncResult> {
  // 1. Get metadata to confirm available sheet tabs
  const meta = await getSpreadsheetMetadata(spreadsheetId, accessToken);
  const tabs = meta.sheetNames;

  const tickets: Ticket[] = [];
  const kavroRecords: KavroRecord[] = [];
  const officers: string[] = [];

  // Find matching tab names case-insensitively
  const findTab = (candidates: string[]) => {
    return tabs.find(t => candidates.some(c => t.toLowerCase() === c.toLowerCase()));
  };

  const ticketsTab = findTab(['Tickets', 'Ticket', 'TS_Tickets']);
  const kavroTab = findTab(['KAVRO_Devices', 'Kavro_Devices', 'Kavro', 'Devices', 'KAVRO']);
  const officersTab = findTab(['Officers', 'Team', 'Staff']);

  // 2. Fetch Tickets tab if present
  if (ticketsTab) {
    const rows = await getSheetValues(spreadsheetId, ticketsTab, accessToken);
    if (rows.length > 1) {
      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      const col = (name: string, fallbackIdx = -1) => {
        const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
        return idx !== -1 ? idx : fallbackIdx;
      };

      const cId = col('id', 0);
      const cDate = col('date', 1);
      const cTime = col('time', 2);
      const cRequester = col('requester', 3);
      const cType = col('type', 4);
      const cChannel = col('channel', 5);
      const cCat = col('category', 6);
      const cDesc = col('desc', 7);
      const cPri = col('priority', 8);
      const cOwner = col('owner', 9);
      const cStatus = col('status', 10);
      const cImei = col('imei', 11);
      const cNext = col('next action', 12);
      const cEsc = col('escalation', 13);
      const cResp = col('first response', 14);
      const cResAt = col('resolved at', 15);
      const cNotes = col('resolution note', 16);

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every(cell => !cell || !String(cell).trim())) continue;

        const id = (r[cId] || `TS-${i}`).trim();
        const date = (r[cDate] || '').trim();
        const timeIn = (r[cTime] || '').trim();
        const requester = (r[cRequester] || 'Anonymous').trim();
        const type = (r[cType] || 'Customer') as RequesterType;
        const channel = (r[cChannel] || 'WhatsApp') as Channel;
        const category = (r[cCat] || 'General Inquiry').trim();
        const description = (r[cDesc] || '').trim();
        const rawPri = (r[cPri] || 'P3 Normal').trim();
        const priority: Priority = rawPri.includes('P1') ? 'P1 Critical'
          : rawPri.includes('P2') ? 'P2 High'
          : rawPri.includes('P4') ? 'P4 Low' : 'P3 Normal';
        const owner = (r[cOwner] || '').trim();
        const status = (r[cStatus] || 'New') as TicketStatus;
        const imei = (r[cImei] || '').trim();
        const nextAction = (r[cNext] || '').trim();
        const escalation = (r[cEsc] || '').trim();
        const firstResponse = (r[cResp] || '').trim();
        const resolvedAt = (r[cResAt] || '').trim();
        const resolutionNotes = (r[cNotes] || '').trim();

        tickets.push({
          id,
          date,
          timeIn,
          requester,
          type,
          channel,
          category,
          description,
          priority,
          owner,
          status,
          imei,
          nextAction,
          escalation,
          firstResponse,
          resolvedAt,
          resolutionNotes,
          lastUpdate: date || new Date().toISOString().slice(0, 10)
        });
      }
    }
  }

  // 3. Fetch KAVRO_Devices tab if present
  if (kavroTab) {
    const rows = await getSheetValues(spreadsheetId, kavroTab, accessToken);
    if (rows.length > 1) {
      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      const col = (name: string, fallbackIdx = -1) => {
        const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
        return idx !== -1 ? idx : fallbackIdx;
      };

      const cImei = col('imei', 0);
      const cOfficer = col('recovery officer', col('officer', 1));
      const cFirst = col('first name', col('first', 2));
      const cLast = col('last name', col('last', 3));
      const cName = col('customer name', col('name', -1));
      const cPhone = col('phone', 4);
      const cBrand = col('brand', 5);
      const cModel = col('model', 6);
      const cStatus = col('credlock status', col('status', 7));
      const cLockDate = col('lock date', 8);
      const cDays = col('days overdue', 9);
      const cNotes = col('notes', 10);

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every(cell => !cell || !String(cell).trim())) continue;

        const imei = (r[cImei] || '').trim();
        if (!imei) continue;

        let firstName = (r[cFirst] || '').trim();
        let lastName = (r[cLast] || '').trim();
        if (!firstName && cName !== -1 && r[cName]) {
          const parts = r[cName].trim().split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        kavroRecords.push({
          id: `KV-${String(i).padStart(4, '0')}`,
          imei,
          recoveryOfficer: (r[cOfficer] || '').trim(),
          firstName,
          lastName,
          phone: (r[cPhone] || '').trim(),
          deviceBrand: (r[cBrand] || '').trim(),
          deviceModel: (r[cModel] || '').trim(),
          credlockStatus: (r[cStatus] || 'Unlocked').trim(),
          priority: 'P3 Normal',
          daysOverdue: Number(r[cDays]) || 0,
          outstandingBalance: 0,
          state: '',
          city: '',
          serialNumber: '',
          email: '',
          merchantName: '',
          notes: r[cNotes] ? [{ text: String(r[cNotes]).trim(), by: 'Google Sheet Sync', at: new Date().toISOString() }] : [],
          followUps: [],
          actions: []
        });
      }
    }
  }

  // 4. Fetch Officers if present
  if (officersTab) {
    const rows = await getSheetValues(spreadsheetId, officersTab, accessToken);
    if (rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        const name = (rows[i][0] || '').trim();
        if (name && !officers.includes(name)) {
          officers.push(name);
        }
      }
    }
  }

  return {
    spreadsheetTitle: meta.title,
    tickets,
    kavroRecords,
    officers,
    rawTabs: tabs
  };
}

/**
 * Clear values in a range or sheet tab
 */
export async function clearSheetRange(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<boolean> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to clear range ${range} (${res.status})`);
  }
  return true;
}

/**
 * Fetch detailed spreadsheet data including sheet numeric IDs and grid properties
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  accessToken: string
) {
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}?includeGridData=false`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch spreadsheet metadata (${res.status})`);
  }
  return await res.json();
}

/**
 * Standard Canonical Headers for KAVRO_Devices
 */
export const KAVRO_CANONICAL_HEADERS = [
  'IMEI',
  'Recovery Officer',
  'First Name',
  'Last Name',
  'Phone',
  'Credlock Status',
  'Device Brand',
  'Device Model',
  'Days Overdue',
  'Outstanding Balance (₦)',
  'Lock Date',
  'Notes'
];

/**
 * Apply styling and freeze the single header row on KAVRO_Devices
 */
export async function formatKavroHeaderRow(
  spreadsheetId: string,
  numericSheetId: number,
  columnCount: number,
  accessToken: string
): Promise<void> {
  try {
    const requests = [
      // Freeze row 1
      {
        updateSheetProperties: {
          properties: {
            sheetId: numericSheetId,
            gridProperties: {
              frozenRowCount: 1
            }
          },
          fields: 'gridProperties.frozenRowCount'
        }
      },
      // Format header row (Dark Navy #060527 background, white text, bold, centered)
      {
        repeatCell: {
          range: {
            sheetId: numericSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: columnCount
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.024, green: 0.02, blue: 0.153 },
              horizontalAlignment: 'CENTER',
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
                fontSize: 10
              }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      }
    ];

    await fetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  } catch (err) {
    console.warn('Could not apply visual formatting to sheet header:', err);
  }
}

/**
 * Arrange all device records and apply ONLY ONE single header in the Google Sheet WHERE KAVRO_Devices.
 * Filters out all duplicate or repeated header rows, normalizes every device record,
 * de-duplicates, cleans trailing garbage, and freezes row 1.
 */
export async function arrangeAndStandardizeKavroSheet(
  spreadsheetId: string,
  accessToken: string,
  fallbackRecords: KavroRecord[] = []
): Promise<{
  ok: boolean;
  count: number;
  tabName: string;
  cleanedRecords: KavroRecord[];
}> {
  // 1. Fetch spreadsheet details
  const details = await getSpreadsheetDetails(spreadsheetId, accessToken);
  const sheetsList: Array<{ properties: { sheetId: number; title: string } }> = details.sheets || [];

  // 2. Find or match the KAVRO_Devices tab
  let kavroTabObj = sheetsList.find(s =>
    ['kavro_devices', 'kavro', 'devices', 'kavro devices', 'kavro-devices'].includes(
      s.properties.title.trim().toLowerCase()
    )
  );

  let tabName = kavroTabObj ? kavroTabObj.properties.title : 'KAVRO_Devices';
  let numericSheetId = kavroTabObj ? kavroTabObj.properties.sheetId : 0;

  // If the sheet tab does not exist at all, create it
  if (!kavroTabObj) {
    const addRes = await fetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: 'KAVRO_Devices'
              }
            }
          }
        ]
      })
    });
    const addData = await addRes.json().catch(() => ({}));
    numericSheetId = addData?.replies?.[0]?.addSheet?.properties?.sheetId || 0;
    tabName = 'KAVRO_Devices';
  }

  // 3. Fetch all current raw rows from the sheet
  let rawRows: string[][] = [];
  try {
    rawRows = await getSheetValues(spreadsheetId, tabName, accessToken);
  } catch (err) {
    console.warn(`Could not read existing rows from ${tabName}:`, err);
    rawRows = [];
  }

  // 4. Parse rows, discard duplicate headers and format records
  const recordsMap = new Map<string, KavroRecord>();

  // Helper to test if a row is a header row
  const isHeaderRow = (row: string[]): boolean => {
    if (!row || row.length === 0) return true;
    const joined = row.map(c => String(c || '').trim().toLowerCase()).join(' ');
    if (
      joined.includes('imei') ||
      joined.includes('recovery officer') ||
      joined.includes('first name') ||
      joined.includes('phone') ||
      joined.includes('credlock status') ||
      joined.includes('days overdue') ||
      joined.includes('brand') ||
      joined.includes('model')
    ) {
      return true;
    }
    // Also row with mostly column name words
    const firstCell = String(row[0] || '').trim().toLowerCase();
    if (['imei', 'recovery officer', '#', 's/n', 'sn', 'device id', 'id', 'officer'].includes(firstCell)) {
      return true;
    }
    return false;
  };

  // Process existing sheet rows (skipping all header rows)
  let foundHeaders: string[] = [];
  let headerIndexMap: Record<string, number> = {};

  if (rawRows.length > 0 && isHeaderRow(rawRows[0])) {
    foundHeaders = rawRows[0].map(h => String(h || '').trim().toLowerCase());
    foundHeaders.forEach((h, idx) => {
      headerIndexMap[h] = idx;
    });
  }

  const getCol = (names: string[], fallbackIdx: number): number => {
    for (const n of names) {
      const idx = foundHeaders.findIndex(h => h.includes(n.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return fallbackIdx;
  };

  const cImei = getCol(['imei'], 0);
  const cOfficer = getCol(['recovery officer', 'officer'], 1);
  const cFirst = getCol(['first name', 'first'], 2);
  const cLast = getCol(['last name', 'last'], 3);
  const cName = getCol(['customer name', 'name'], -1);
  const cPhone = getCol(['phone', 'mobile'], 4);
  const cStatus = getCol(['credlock status', 'status', 'lock status'], 5);
  const cBrand = getCol(['device brand', 'brand'], 6);
  const cModel = getCol(['device model', 'model'], 7);
  const cDays = getCol(['days overdue', 'overdue', 'days'], 8);
  const cBal = getCol(['outstanding balance', 'balance', 'outstanding'], 9);
  const cLock = getCol(['lock date', 'date'], 10);
  const cNotes = getCol(['notes', 'note', 'remarks'], 11);

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.every(cell => !cell || !String(cell).trim())) continue;
    if (isHeaderRow(row)) continue; // Discard every repeating header row!

    let rawImei = String(row[cImei] || '').trim().replace(/[^0-9A-Za-z]/g, '');
    // If first column isn't IMEI, check if any cell looks like a 14-16 digit IMEI
    if (!rawImei || rawImei.length < 10) {
      const imeiCell = row.find(c => {
        const clean = String(c || '').trim();
        return /^\d{14,16}$/.test(clean);
      });
      if (imeiCell) {
        rawImei = String(imeiCell).trim();
      }
    }

    if (!rawImei) continue;

    let firstName = String(row[cFirst] || '').trim();
    let lastName = String(row[cLast] || '').trim();
    if (!firstName && cName !== -1 && row[cName]) {
      const parts = String(row[cName]).trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const rawStatus = String(row[cStatus] || '').trim();
    const credlockStatus = rawStatus.toLowerCase().includes('lock') && !rawStatus.toLowerCase().includes('unlock')
      ? 'Locked'
      : 'Unlocked';

    const daysOverdue = parseInt(String(row[cDays] || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const balance = parseFloat(String(row[cBal] || '0').replace(/[^0-9.]/g, '')) || 0;

    const record: KavroRecord = {
      id: `KV-${String(recordsMap.size + 1).padStart(4, '0')}`,
      imei: rawImei,
      recoveryOfficer: String(row[cOfficer] || '').trim(),
      firstName,
      lastName,
      phone: String(row[cPhone] || '').trim(),
      deviceBrand: String(row[cBrand] || '').trim(),
      deviceModel: String(row[cModel] || '').trim(),
      credlockStatus,
      priority: credlockStatus === 'Locked' ? 'P2 High' : 'P3 Normal',
      daysOverdue,
      outstandingBalance: balance,
      state: '',
      city: '',
      serialNumber: '',
      email: '',
      merchantName: '',
      notes: row[cNotes] ? [{ text: String(row[cNotes]).trim(), by: 'Google Sheet Sync', at: new Date().toISOString() }] : [],
      followUps: [],
      actions: []
    };

    recordsMap.set(rawImei, record);
  }

  // 5. Merge with local records (if any local records have richer info or were missing)
  fallbackRecords.forEach(localRec => {
    if (!localRec.imei) return;
    const existing = recordsMap.get(localRec.imei);
    if (!existing) {
      recordsMap.set(localRec.imei, localRec);
    } else {
      // Enrich with any non-empty fields
      if (!existing.firstName && localRec.firstName) existing.firstName = localRec.firstName;
      if (!existing.lastName && localRec.lastName) existing.lastName = localRec.lastName;
      if (!existing.recoveryOfficer && localRec.recoveryOfficer) existing.recoveryOfficer = localRec.recoveryOfficer;
      if (!existing.phone && localRec.phone) existing.phone = localRec.phone;
      if (!existing.deviceBrand && localRec.deviceBrand) existing.deviceBrand = localRec.deviceBrand;
      if (!existing.deviceModel && localRec.deviceModel) existing.deviceModel = localRec.deviceModel;
      if (!existing.daysOverdue && localRec.daysOverdue) existing.daysOverdue = localRec.daysOverdue;
      if (!existing.outstandingBalance && localRec.outstandingBalance) existing.outstandingBalance = localRec.outstandingBalance;
      if (localRec.notes && localRec.notes.length && (!existing.notes || !existing.notes.length)) {
        existing.notes = localRec.notes;
      }
    }
  });

  // 6. Convert to arranged array and sort
  const sortedRecords = Array.from(recordsMap.values()).sort((a, b) => {
    // Locked devices first, then by days overdue descending, then IMEI
    if (a.credlockStatus === 'Locked' && b.credlockStatus !== 'Locked') return -1;
    if (a.credlockStatus !== 'Locked' && b.credlockStatus === 'Locked') return 1;
    const dayA = parseInt(String(a.daysOverdue || 0), 10) || 0;
    const dayB = parseInt(String(b.daysOverdue || 0), 10) || 0;
    if (dayB !== dayA) return dayB - dayA;
    return a.imei.localeCompare(b.imei);
  });

  // 7. Format all data rows strictly aligning to KAVRO_CANONICAL_HEADERS
  const outputRows: (string | number)[][] = [
    KAVRO_CANONICAL_HEADERS // ONLY ONE HEADER ROW AT THE TOP
  ];

  sortedRecords.forEach((r, idx) => {
    r.id = `KV-${String(idx + 1).padStart(4, '0')}`;
    const latestNote = r.notes && r.notes.length ? r.notes[r.notes.length - 1].text : '';
    const lockDate = r.actions && r.actions.length ? r.actions[0].at.slice(0, 10) : '';

    outputRows.push([
      r.imei,
      r.recoveryOfficer || 'Unassigned',
      r.firstName || '',
      r.lastName || '',
      r.phone || '',
      r.credlockStatus || 'Unlocked',
      r.deviceBrand || '',
      r.deviceModel || '',
      Number(r.daysOverdue) || 0,
      Number(r.outstandingBalance) || 0,
      lockDate,
      latestNote
    ]);
  });

  // 8. Clear the entire sheet tab first to wipe all old duplicate headers and leftover rows
  try {
    await clearSheetRange(spreadsheetId, `${tabName}!A1:Z5000`, accessToken);
  } catch (err) {
    console.warn('Failed clearing range, proceeding to overwrite:', err);
  }

  // 9. Write the single header and all clean records into A1
  await updateSheetRange(spreadsheetId, `${tabName}!A1`, outputRows, accessToken);

  // 10. Format and freeze row 1
  await formatKavroHeaderRow(spreadsheetId, numericSheetId, KAVRO_CANONICAL_HEADERS.length, accessToken);

  return {
    ok: true,
    count: sortedRecords.length,
    tabName,
    cleanedRecords: sortedRecords
  };
}
