export type Priority = 'P1 Critical' | 'P2 High' | 'P3 Normal' | 'P4 Low';
export type TicketStatus = 'New' | 'Assigned' | 'In Progress' | 'Pending' | 'Resolved';
export type RequesterType = 'Merchant' | 'Customer' | 'Enrollment Officer' | 'Internal Staff' | 'Other';
export type Channel = 'Phone 1 External' | 'Phone 2 Enrollment' | 'WhatsApp' | 'Call' | 'Missed Call' | 'Ticketing System' | 'Internal Chat' | 'Other';

export interface Ticket {
  id: string;
  date: string;
  timeIn: string;
  requester: string;
  type: RequesterType;
  channel: Channel;
  category: string;
  description: string;
  priority: Priority;
  impact?: string;
  owner: string;
  assignedAt?: string;
  firstResponse?: string;
  status: TicketStatus;
  lastUpdate: string;
  nextAction: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  escalation?: string;
  imei?: string;
}

export interface KavroNote {
  text: string;
  by: string;
  at: string;
}

export interface KavroFollowUp {
  type: string;
  owner: string;
  dueDate: string;
  reason: string;
  status: 'Open' | 'Done';
  fromNote?: string;
  createdAt: string;
  doneAt?: string;
}

export interface KavroAction {
  type: string;
  by: string;
  at: string;
  note?: string;
}

export interface KavroRecord {
  id: string;
  imei: string;
  recoveryOfficer: string;
  firstName: string;
  lastName: string;
  phone: string;
  credlockStatus: 'Locked' | 'Unlocked' | string;
  priority: Priority;
  deviceBrand: string;
  deviceModel: string;
  daysOverdue: string | number;
  outstandingBalance: string | number;
  outstanding?: string | number;
  state: string;
  city: string;
  serialNumber: string;
  email: string;
  merchantName: string;
  notes: KavroNote[];
  followUps: KavroFollowUp[];
  actions: KavroAction[];
  currentAction?: string;
}

export type UserRole = 'lead' | 'admin' | 'officer' | 'viewer';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string;
  status: UserStatus;
  permissions: string[];
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface ResetRequest {
  email: string;
  token: string;
  createdAt: string;
  used: boolean;
  issuedBy?: string;
}

export interface RotaData {
  weekStart: string;
  slots: Record<string, string[]>;
}

export interface NotificationRuleConfig {
  onP1: boolean;
  onP2: boolean;
  onEscalation: boolean;
  onAssign: boolean;
  onResolve: boolean;
  onOverdue: boolean;
}

export interface NotifySettings {
  enabled: boolean;
  teamLeadEmail: string;
  engineeringEmail: string;
  opsEmail: string;
  officerEmails: Record<string, string>;
  rules: NotificationRuleConfig;
}

export interface NotifyLogEntry {
  id: string;
  at: string;
  ticketId: string;
  purpose: string;
  to: string;
  priority?: string;
  status: string;
}

export interface MonthlyUploadedReport {
  yearMonth: string;
  fileName: string;
  records: number;
  uploadedAt: string;
  preview: string;
}

export interface MonthlyDoc {
  title: string;
  preparedBy: string;
  department: string;
  executiveSummary: string;
  highlights: string;
  challenges: string;
  actionsNext: string;
  notes: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'ticket';
  title?: string;
}
