import { NotifySettings, Priority, RequesterType, Channel, RotaData } from '../types';

export const OFFICERS = ['Tosin', 'Peter', 'Zainab', 'Joseph Olayemi'];

export const PRIORITIES: Priority[] = ['P1 Critical', 'P2 High', 'P3 Normal', 'P4 Low'];

export const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved'];

export const CATEGORIES = [
  'Merchant Support', 'Customer Support', 'Enrollment', 'Device/MDM',
  'Application/Platform', 'Payment/Transaction', 'Access/Account',
  'Internal Request', 'Incident/Outage', 'Other'
];

export const CHANNELS: Channel[] = [
  'Phone 1 External', 'Phone 2 Enrollment', 'WhatsApp', 'Call',
  'Missed Call', 'Ticketing System', 'Internal Chat', 'Other'
];

export const TYPES: RequesterType[] = ['Merchant', 'Customer', 'Enrollment Officer', 'Internal Staff', 'Other'];

export const RESPONSE_TARGETS: Record<Priority, number> = {
  'P1 Critical': 5,
  'P2 High': 10,
  'P3 Normal': 30,
  'P4 Low': 120
};

export const TEAM_INFO: Record<string, { role: string; focus: string }> = {
  'Tosin': {
    role: 'Queue & Frontline',
    focus: 'Monitor incoming messages & missed calls; acknowledge; create tickets; categorize & route; follow up unanswered; maintain daily intake count.'
  },
  'Peter': {
    role: 'Devices & Enrollment',
    focus: 'Device, MDM/KAVRO, Manager App, lock/unlock, device validation, IMEI & enrollment cases. Escalate elevated needs.'
  },
  'Zainab': {
    role: 'Quality & Backup',
    focus: 'Review unassigned, overdue & pending tickets; back up intake; check update quality; identify recurring issues; daily operational summary.'
  },
  'Joseph Olayemi': {
    role: 'Team Lead',
    focus: 'Departmental performance, workload balancing, critical escalations, cross-dept coordination, coaching, management reporting.'
  }
};

export const TEMPLATES = [
  {
    name: 'Acknowledgement',
    text: 'Hello, thank you for contacting Credlock Technical Support. We have received your request and are reviewing it. Your ticket reference is [Ticket ID]. The next step is [next action]. We will provide an update by [time/date].'
  },
  {
    name: 'Need more information',
    text: 'Hello, we are investigating ticket [Ticket ID]. Please provide [specific details/screenshots/error message] so we can continue. Please avoid sending passwords, OTPs, or unnecessary sensitive personal information.'
  },
  {
    name: 'Pending update',
    text: 'Hello, an update on ticket [Ticket ID]: we have completed [work done]. The issue is currently awaiting [dependency/action]. [Owner/team] is following up, and our next update is due by [time/date].'
  },
  {
    name: 'Resolution confirmation',
    text: 'Hello, ticket [Ticket ID] has been addressed. The action taken was [brief resolution], and the result was [test/confirmation]. Please let us know promptly if the same issue persists.'
  },
  {
    name: 'Internal escalation',
    text: 'Ticket: [ID]. Priority: [P1–P4]. Impact: [users/process affected]. Started: [time]. Steps attempted: [list]. Current status: [status]. Assistance required: [specific request]. Next stakeholder update due: [time].'
  }
];

export const ALL_PERMS = [
  'dashboard', 'lead-dash', 'tickets', 'tickets_all', 'kavro', 'kavro_actions',
  'new-ticket', 'rota', 'rota_edit', 'daily', 'weekly', 'monthly', 'monthly-reports', 'officer-reports', 'analytics', 'ai-insights',
  'team', 'templates', 'notifications', 'approvals', 'my-work',
  'settings', 'admin', 'export', 'resolve_any', 'assign_any'
];

export const ROLE_PRESETS: Record<string, string[]> = {
  lead: ALL_PERMS.slice(),
  admin: ALL_PERMS.slice(),
  officer: [
    'dashboard', 'tickets', 'kavro', 'kavro_actions', 'new-ticket',
    'rota', 'daily', 'weekly', 'monthly', 'monthly-reports', 'officer-reports', 'analytics', 'ai-insights', 'team', 'templates',
    'notifications', 'my-work'
  ],
  viewer: [
    'dashboard', 'tickets', 'kavro', 'daily', 'weekly', 'monthly', 'monthly-reports', 'officer-reports', 'analytics', 'ai-insights', 'team', 'my-work'
  ]
};

export const DEFAULT_NOTIFY: NotifySettings = {
  enabled: true,
  teamLeadEmail: 'joseph.olayemi@credlock.africa',
  engineeringEmail: 'engineering@credlock.africa',
  opsEmail: 'operations@credlock.africa',
  officerEmails: {
    'Tosin': 'tosin@credlock.africa',
    'Peter': 'peter@credlock.africa',
    'Zainab': 'zainab@credlock.africa',
    'Joseph Olayemi': 'joseph.olayemi@credlock.africa'
  },
  rules: {
    onP1: true,
    onP2: true,
    onEscalation: true,
    onAssign: true,
    onResolve: false,
    onOverdue: true
  }
};

export function getDefaultRota(): RotaData {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff)).toISOString().slice(0, 10);

  return {
    weekStart: monday,
    slots: {
      'Opening': ['All', 'All', 'All', 'All', 'All'],
      'Phone 1 AM': ['Tosin', 'Tosin', 'Tosin', 'Tosin', 'Tosin'],
      'Phone 2 AM': ['Peter', 'Peter', 'Peter', 'Peter', 'Peter'],
      'Midday': ['Zainab', 'Zainab', 'Zainab', 'Zainab', 'Zainab'],
      'Phone 1 PM': ['Tosin', 'Tosin', 'Tosin', 'Tosin', 'Tosin'],
      'Phone 2 PM': ['Peter', 'Peter', 'Peter', 'Peter', 'Peter'],
      'Closing': ['All', 'All', 'All', 'All', 'All'],
      'Backup': ['Zainab', 'Joseph Olayemi', 'Zainab', 'Joseph Olayemi', 'Zainab']
    }
  };
}
