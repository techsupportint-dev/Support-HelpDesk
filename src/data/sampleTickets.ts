import { Ticket } from '../types';

export function getSampleTickets(): Ticket[] {
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);

  const todayStr = today.toISOString().slice(0, 10);
  const yestStr = yest.toISOString().slice(0, 10);
  const yestCode = yestStr.replace(/-/g, '').slice(2);
  const todayCode = todayStr.replace(/-/g, '').slice(2);

  return [
    {
      id: `TS-${yestCode}-001`,
      date: yestStr,
      timeIn: '09:05',
      requester: 'Merchant Apex',
      type: 'Merchant',
      channel: 'Phone 1 External',
      category: 'Device/MDM',
      description: 'Device locked after payment – cannot unlock in manager app',
      priority: 'P2 High',
      impact: 'Sales blocked',
      owner: 'Peter',
      assignedAt: '09:08',
      firstResponse: '09:12',
      status: 'Resolved',
      lastUpdate: `${yestStr}T10:25`,
      nextAction: 'Closed',
      resolutionNotes: 'Unlocked via Manager App; merchant confirmed device operational',
      resolvedAt: `${yestStr}T10:25`,
      escalation: '',
      imei: '861244075120636'
    },
    {
      id: `TS-${yestCode}-002`,
      date: yestStr,
      timeIn: '09:22',
      requester: 'EO - Fatima',
      type: 'Enrollment Officer',
      channel: 'Phone 2 Enrollment',
      category: 'Enrollment',
      description: 'IMEI validation fails on new device batch from Kwara distributor',
      priority: 'P3 Normal',
      impact: 'Enrollment delayed',
      owner: 'Peter',
      assignedAt: '09:25',
      firstResponse: '09:30',
      status: 'Pending',
      lastUpdate: `${yestStr}T11:00`,
      nextAction: 'Await MDM elevated rights – follow-up tomorrow 09:00',
      resolutionNotes: '',
      resolvedAt: '',
      escalation: 'Escalated to Joseph – elevated access needed'
    },
    {
      id: `TS-${yestCode}-003`,
      date: yestStr,
      timeIn: '10:15',
      requester: 'Customer K.O.',
      type: 'Customer',
      channel: 'WhatsApp',
      category: 'Payment/Transaction',
      description: 'Transaction declined during pay trigger settlement – needs investigation',
      priority: 'P2 High',
      impact: 'Payment blocked',
      owner: 'Tosin',
      assignedAt: '10:18',
      firstResponse: '10:22',
      status: 'In Progress',
      lastUpdate: `${yestStr}T14:00`,
      nextAction: 'Gateway check – update by 15:00',
      resolutionNotes: '',
      resolvedAt: '',
      escalation: ''
    },
    {
      id: `TS-${todayCode}-001`,
      date: todayStr,
      timeIn: '08:30',
      requester: 'Merchant Zenith',
      type: 'Merchant',
      channel: 'Phone 1 External',
      category: 'Application/Platform',
      description: 'Manager App crashes on login when switching stores',
      priority: 'P3 Normal',
      impact: 'Cannot manage devices',
      owner: 'Zainab',
      assignedAt: '08:35',
      firstResponse: '08:40',
      status: 'Assigned',
      lastUpdate: `${todayStr}T09:00`,
      nextAction: 'Reproduce + collect device crash logs – due 12:00 today',
      resolutionNotes: '',
      resolvedAt: '',
      escalation: ''
    },
    {
      id: `TS-${todayCode}-002`,
      date: todayStr,
      timeIn: '09:00',
      requester: 'Staff - Audit',
      type: 'Internal Staff',
      channel: 'Internal Chat',
      category: 'Access/Account',
      description: 'Temporary elevated access for quarterly audit review',
      priority: 'P4 Low',
      impact: 'No immediate impact',
      owner: 'Joseph Olayemi',
      assignedAt: '09:10',
      firstResponse: '09:15',
      status: 'New',
      lastUpdate: `${todayStr}T09:15`,
      nextAction: 'Review & approve/reject by EOD',
      resolutionNotes: '',
      resolvedAt: '',
      escalation: ''
    },
    {
      id: `TS-${todayCode}-003`,
      date: todayStr,
      timeIn: '09:45',
      requester: 'Merchant Nova',
      type: 'Merchant',
      channel: 'Missed Call',
      category: 'Merchant Support',
      description: 'Missed call – returned; query on weekly BNPL settlement report',
      priority: 'P3 Normal',
      impact: 'Report access',
      owner: 'Tosin',
      assignedAt: '09:50',
      firstResponse: '09:55',
      status: 'In Progress',
      lastUpdate: `${todayStr}T10:30`,
      nextAction: 'Guide merchant on report path – confirm by 14:00',
      resolutionNotes: '',
      resolvedAt: '',
      escalation: ''
    }
  ];
}
