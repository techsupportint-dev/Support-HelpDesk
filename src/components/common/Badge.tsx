import React from 'react';
import { Priority, TicketStatus } from '../../types';

export const PriorityBadge: React.FC<{ priority?: Priority | string }> = ({ priority }) => {
  if (!priority) return <span>—</span>;

  let bg = 'bg-yellow-100 text-yellow-800';
  if (priority.includes('P1') || priority.toLowerCase().includes('critical')) {
    bg = 'bg-[#FEE2E2] text-[#B91C1C]';
  } else if (priority.includes('P2') || priority.toLowerCase().includes('high')) {
    bg = 'bg-[#FFEDD5] text-[#C2410C]';
  } else if (priority.includes('P3') || priority.toLowerCase().includes('normal') || priority.toLowerCase().includes('medium')) {
    bg = 'bg-[#FEF9C3] text-[#A16207]';
  } else if (priority.includes('P4') || priority.toLowerCase().includes('low')) {
    bg = 'bg-[#DCFCE7] text-[#15803D]';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${bg}`}>
      {priority}
    </span>
  );
};

export const StatusBadge: React.FC<{ status?: TicketStatus | string }> = ({ status }) => {
  if (!status) return <span>—</span>;

  let bg = 'bg-blue-100 text-blue-800';
  const s = status.toLowerCase();

  if (s === 'new') {
    bg = 'bg-[#DBEAFE] text-[#1D4ED8]';
  } else if (s === 'assigned') {
    bg = 'bg-[#E0E7FF] text-[#4338CA]';
  } else if (s === 'in progress') {
    bg = 'bg-[#CFFAFE] text-[#0E7490]';
  } else if (s === 'pending' || s === 'waiting') {
    bg = 'bg-[#FFEDD5] text-[#C2410C]';
  } else if (s === 'resolved' || s === 'closed' || s === 'done') {
    bg = 'bg-[#DCFCE7] text-[#15803D]';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${bg}`}>
      {status}
    </span>
  );
};
