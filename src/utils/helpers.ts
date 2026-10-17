import { Ticket, KavroRecord, Priority } from '../types';
import { RESPONSE_TARGETS } from '../data/constants';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function genId(date: Date | string, seq: number): string {
  const d = date instanceof Date ? date : new Date(date);
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `TS-${y}${m}${day}-${String(seq).padStart(3, '0')}`;
}

export function getMonday(d: Date | string): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export function responseOk(ticket: Ticket): boolean | null {
  if (!ticket.firstResponse || !ticket.timeIn || !ticket.priority) return null;
  const target = RESPONSE_TARGETS[ticket.priority];
  if (!target) return null;
  const [h1, m1] = ticket.timeIn.split(':').map(Number);
  const [h2, m2] = ticket.firstResponse.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  return mins <= target;
}

export function isOverdue(ticket: Ticket): boolean {
  if (ticket.status === 'Resolved' || !ticket.date) return false;
  const created = new Date(ticket.date + 'T' + (ticket.timeIn || '00:00'));
  const now = new Date();
  const mins = (now.getTime() - created.getTime()) / 60000;
  const thresholds: Record<Priority, number> = {
    'P1 Critical': 30,
    'P2 High': 120,
    'P3 Normal': 480,
    'P4 Low': 1440
  };
  return mins > (thresholds[ticket.priority] || 1440);
}

export function activityForUser(name: string, tickets: Ticket[]) {
  const n = (name || '').toLowerCase().trim();
  const nFirst = n.split(' ')[0];
  const mine = tickets.filter(t => {
    const owner = (t.owner || '').toLowerCase().trim();
    return owner === n || owner.includes(nFirst);
  });
  const open = mine.filter(t => t.status !== 'Resolved');
  const resolved = mine.filter(t => t.status === 'Resolved');
  const p1 = open.filter(t => t.priority === 'P1 Critical');
  return { mine, open, resolved, p1 };
}

export function computeOfficerStats(name: string, tickets: Ticket[]) {
  const a = activityForUser(name, tickets);
  const withResp = a.mine.filter(t => t.firstResponse);
  const ok = withResp.filter(t => responseOk(t) === true).length;
  const compliance = withResp.length ? Math.round((ok / withResp.length) * 100) : null;
  const resolutionRate = a.mine.length ? Math.round((a.resolved.length / a.mine.length) * 100) : 0;
  const overdue = a.open.filter(isOverdue).length;

  let score = resolutionRate * 0.45;
  if (compliance != null) score += compliance * 0.4;
  else score += 20;
  score += Math.max(0, 15 - overdue * 3);
  score = Math.round(Math.min(100, Math.max(0, score)));

  return {
    name,
    total: a.mine.length,
    open: a.open.length,
    resolved: a.resolved.length,
    p1: a.p1.length,
    overdue,
    compliance,
    resolutionRate,
    score
  };
}

export function scoreClass(score: number): 'high' | 'mid' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

export function generateOfficerAIInsight(name: string, tickets: Ticket[]) {
  const s = computeOfficerStats(name, tickets);
  const insights: string[] = [];

  if (s.score >= 80) insights.push('Strong overall performance with balanced resolution and responsiveness.');
  else if (s.score >= 60) insights.push('Solid baseline performance; focused coaching can push score into the top band.');
  else insights.push('Performance needs attention — prioritise overdue clearance and first-response discipline.');

  if (s.overdue > 2) insights.push(`${s.overdue} overdue tickets are dragging response quality; clear oldest items first.`);
  if (s.p1 > 0) insights.push(`${s.p1} open P1 ticket(s) require immediate ownership and Team Lead visibility.`);
  if (s.compliance != null && s.compliance < 70) insights.push(`Response-time compliance at ${s.compliance}% is below target; protect opening/closing coverage slots.`);
  if (s.compliance != null && s.compliance >= 90) insights.push(`Excellent response-time compliance (${s.compliance}%).`);
  if (s.resolutionRate >= 70) insights.push(`Healthy resolution rate (${s.resolutionRate}%) indicates good ticket closure hygiene.`);
  else if (s.total > 0) insights.push(`Resolution rate (${s.resolutionRate}%) suggests tickets may be lingering — review Pending and escalations.`);
  if (s.open > 8) insights.push(`High open load (${s.open}). Consider rebalancing with Team Lead.`);
  if (s.total === 0) insights.push('No tickets attributed yet — ensure owner field is set on intake.');

  const actions: string[] = [];
  if (s.overdue) actions.push('Clear overdue queue before taking new non-P1 work.');
  if (s.p1) actions.push('Update every P1 with next action and timestamp today.');
  if (s.compliance != null && s.compliance < 80) actions.push('Acknowledge new tickets within priority targets (P1: 5m, P2: 10m).');
  if (s.open > s.resolved && s.total > 5) actions.push('Block 30 minutes for resolution push on oldest open items.');
  if (!actions.length) actions.push('Maintain current rhythm; document known fixes for recurring categories.');

  return { stats: s, insights, actions, summary: insights[0] };
}

export function generateOfficerSWOT(name: string, tickets: Ticket[]) {
  const s = computeOfficerStats(name, tickets);
  const a = activityForUser(name, tickets);
  const cats: Record<string, number> = {};
  a.mine.forEach(t => {
    const c = t.category || 'Other';
    cats[c] = (cats[c] || 0) + 1;
  });
  const topCat = Object.keys(cats).sort((x, y) => cats[y] - cats[x])[0] || '—';

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  if (s.compliance != null && s.compliance >= 85) strengths.push(`High first-response compliance (${s.compliance}%)`);
  if (s.resolutionRate >= 65) strengths.push(`Strong ticket closure rate (${s.resolutionRate}%)`);
  if (s.score >= 75) strengths.push(`Overall performance score in top band (${s.score})`);
  if (s.p1 === 0 && s.open > 0) strengths.push('No open P1 backlog under this owner');
  if (topCat !== '—') strengths.push(`Domain volume concentrated in ${topCat}`);

  if (s.overdue > 0) weaknesses.push(`${s.overdue} overdue ticket(s)`);
  if (s.compliance != null && s.compliance < 75) weaknesses.push('Response compliance below 75%');
  if (s.resolutionRate < 50 && s.total >= 4) weaknesses.push('Low resolution rate relative to volume');
  if (s.open > 10) weaknesses.push('Elevated open workload may slow quality updates');
  if (!strengths.length) strengths.push('Baseline activity logged for coaching baseline');
  if (!weaknesses.length) weaknesses.push('No critical weakness flags from current metrics');

  opportunities.push(`Pair with peer review on ${topCat} for known-fix documentation`);
  opportunities.push('Use Officer Reports export for weekly 1:1 with Team Lead');
  if (s.score < 80) opportunities.push('Target +10 score points via overdue burn-down this week');
  opportunities.push('Cross-train on Kavro lock/unlock flows to absorb device peaks');

  if (s.p1 > 0) threats.push('Open P1 exposure can escalate to merchant/partner impact');
  if (s.overdue > 2) threats.push('Growing overdue queue risks SLA breaches and customer trust');
  threats.push('Unregistered chat requests outside tickets remain invisible to analytics');
  if (s.open > 12) threats.push('Capacity risk if intake spikes without reassignment');

  return { strengths, weaknesses, opportunities, threats, topCategory: topCat, stats: s };
}

export function autoFollowUpFromNote(noteText: string, record: KavroRecord) {
  const t = (noteText || '').toLowerCase();
  const days = parseInt(String(record.daysOverdue || 0), 10) || 0;
  const locked = (record.credlockStatus || '').toLowerCase() === 'locked';

  if (/unlock|release|payment.?confirm|paid.?full|settled/.test(t)) {
    return { type: 'Unlock Device', dueInDays: 0, owner: 'Peter', reason: 'Note indicates payment/unlock request' };
  }
  if (/lock|re-?lock|default|no.?payment|refuse/.test(t)) {
    return { type: 'Confirm Lock', dueInDays: 0, owner: 'Peter', reason: 'Note indicates lock / default action' };
  }
  if (/call|phone|reach|contact.?customer|follow.?up.?call/.test(t)) {
    return { type: 'Call Customer', dueInDays: 1, owner: record.recoveryOfficer || 'Tosin', reason: 'Note requests customer contact' };
  }
  if (/visit|field|address|locate|home/.test(t)) {
    return { type: 'Field Visit', dueInDays: 2, owner: record.recoveryOfficer || 'Zainab', reason: 'Note suggests field recovery' };
  }
  if (/escalate|legal|police|fraud/.test(t)) {
    return { type: 'Escalate to Lead', dueInDays: 0, owner: 'Joseph Olayemi', reason: 'Note indicates escalation' };
  }
  if (/mdm|kavro|imei|serial|device.?issue|technical/.test(t)) {
    return { type: 'Technical Check', dueInDays: 1, owner: 'Peter', reason: 'Note indicates technical/MDM issue' };
  }
  if (/promise|will.?pay|callback|reschedule/.test(t)) {
    return { type: 'Payment Follow-up', dueInDays: 3, owner: record.recoveryOfficer || 'Tosin', reason: 'Customer promised payment / reschedule' };
  }

  if (locked && days >= 45) {
    return { type: 'Escalate Recovery', dueInDays: 1, owner: 'Joseph Olayemi', reason: 'Auto: locked + 45+ days overdue' };
  }
  if (locked && days >= 30) {
    return { type: 'Recovery Call', dueInDays: 1, owner: record.recoveryOfficer || 'Tosin', reason: 'Auto: locked + 30+ days overdue' };
  }
  if (locked) {
    return { type: 'Monitor Lock', dueInDays: 3, owner: 'Peter', reason: 'Auto: device locked' };
  }
  return { type: 'General Follow-up', dueInDays: 2, owner: record.recoveryOfficer || 'Tosin', reason: 'Auto: general note' };
}

export function dueDateFromDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + (n || 0));
  return d.toISOString().slice(0, 10);
}

export function buildTicketEmailBody(ticket: Ticket, purpose: string): string {
  return [
    `Credlock Technical Support – ${purpose}`,
    `────────────────────────────────────`,
    `Ticket ID:     ${ticket.id}`,
    `Priority:      ${ticket.priority}`,
    `Status:        ${ticket.status}`,
    `Requester:     ${ticket.requester} (${ticket.type || ''})`,
    `Channel:       ${ticket.channel || ''}`,
    `Category:      ${ticket.category || ''}`,
    `Received:      ${ticket.date} ${ticket.timeIn || ''}`,
    `Owner:         ${ticket.owner || 'Unassigned'}`,
    `Impact:        ${ticket.impact || '—'}`,
    ``,
    `Description:`,
    ticket.description || '—',
    ``,
    `Next action:   ${ticket.nextAction || '—'}`,
    `Escalation:    ${ticket.escalation || '—'}`,
    ``,
    `First response: ${ticket.firstResponse || 'Not yet'}`,
    `────────────────────────────────────`,
    `This message was prepared from the Tech Support Portal.`,
    `Please do not reply with passwords or OTPs.`
  ].join('\n');
}

export function buildMailto(to: string, subject: string, body: string, cc?: string): string {
  let url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (cc) url += `&cc=${encodeURIComponent(cc)}`;
  return url;
}

export function downloadBlob(filename: string, mime: string, content: string | Blob): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function csvEsc(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function safeFileName(n: string): string {
  return String(n || 'officer').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40);
}
