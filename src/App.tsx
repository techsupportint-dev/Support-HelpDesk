import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { AuthShell } from './components/auth/AuthShell';
import { Sidebar } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import { ToastContainer } from './components/common/ToastContainer';
import { isOverdue } from './utils/helpers';

// Views
import { DashboardView } from './components/views/DashboardView';
import { LeadDashboardView } from './components/views/LeadDashboardView';
import { TicketsView } from './components/views/TicketsView';
import { KavroView } from './components/views/KavroView';
import { NewTicketView } from './components/views/NewTicketView';
import { RotaView } from './components/views/RotaView';
import { DailyReportView } from './components/views/DailyReportView';
import { WeeklyReportView } from './components/views/WeeklyReportView';
import { MonthlyReportView } from './components/views/MonthlyReportView';
import { OfficerReportsView } from './components/views/OfficerReportsView';
import { MonthlyReportsView } from './components/views/MonthlyReportsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { AiInsightsView } from './components/views/AiInsightsView';
import { TeamView } from './components/views/TeamView';
import { TemplatesView } from './components/views/TemplatesView';
import { NotificationsView } from './components/views/NotificationsView';
import { ApprovalsView } from './components/views/ApprovalsView';
import { MyWorkView } from './components/views/MyWorkView';
import { AdminView } from './components/views/AdminView';
import { SettingsView } from './components/views/SettingsView';

const VIEW_TITLES: Record<string, string> = {
  'lead-dash': 'Lead Dashboard',
  'dashboard': 'Support Operations Dashboard',
  'tickets': 'Master Tickets Register',
  'kavro': 'Kavro Device Management',
  'new-ticket': 'New Support Ticket',
  'rota': 'Coverage Rota',
  'daily': 'Daily Operations Report',
  'weekly': 'Weekly Operations Report',
  'monthly': 'Monthly Operations Report',
  'officer-reports': 'Officer Performance Reports',
  'monthly-reports': 'Monthly Document Archives',
  'analytics': 'Operations Analytics',
  'ai-insights': 'AI Operational Insights & SWOT',
  'team': 'Support Team Directory',
  'templates': 'Standard Communication Templates',
  'notifications': 'Notification Rules & Alert Logs',
  'approvals': 'Access & Reset Approvals',
  'my-work': 'My Assigned Tickets & Tasks',
  'admin': 'Admin & Security Matrix',
  'settings': 'Settings & Google Sheets Sync'
};

const PortalMain: React.FC = () => {
  const { currentUser, isLead, can } = useAuth();
  const { tickets } = useData();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editTicketId, setEditTicketId] = useState<string | null>(null);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  if (!currentUser) {
    return <AuthShell />;
  }

  // Calculate overdue or critical items for reminder bar
  const openTickets = tickets.filter(t => t.status !== 'Resolved');
  const overdueTickets = openTickets.filter(isOverdue);
  const p1CriticalTickets = openTickets.filter(t => t.priority === 'P1 Critical');
  const unassignedTickets = openTickets.filter(t => !t.owner);

  const hasReminder = !reminderDismissed && (overdueTickets.length > 0 || p1CriticalTickets.length > 0);

  const handleNavigate = (view: string) => {
    if (view === 'new-ticket') {
      setEditTicketId(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTicket = (id: string) => {
    setEditTicketId(id);
    setCurrentView('new-ticket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickNew = () => {
    setEditTicketId(null);
    setCurrentView('new-ticket');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'lead-dash':
        return <LeadDashboardView onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'tickets':
        return (
          <TicketsView
            onEditTicket={handleEditTicket}
            onNewTicket={handleQuickNew}
          />
        );
      case 'kavro':
        return <KavroView />;
      case 'new-ticket':
        return (
          <NewTicketView
            editId={editTicketId}
            onDone={() => {
              setEditTicketId(null);
              setCurrentView('tickets');
            }}
          />
        );
      case 'rota':
        return <RotaView />;
      case 'daily':
        return <DailyReportView />;
      case 'weekly':
        return <WeeklyReportView />;
      case 'monthly':
        return <MonthlyReportView />;
      case 'officer-reports':
        return <OfficerReportsView />;
      case 'monthly-reports':
        return <MonthlyReportsView />;
      case 'analytics':
        return <AnalyticsView onNavigate={handleNavigate} />;
      case 'ai-insights':
        return <AiInsightsView />;
      case 'team':
        return <TeamView onNavigate={handleNavigate} />;
      case 'templates':
        return <TemplatesView />;
      case 'notifications':
        return <NotificationsView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'my-work':
        return <MyWorkView onEditTicket={handleEditTicket} />;
      case 'admin':
        return <AdminView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F1F5F9]">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-[260px]">
        {/* Urgent reminder banner if overdue or P1 */}
        {hasReminder && (
          <div className="bg-gradient-to-r from-red-700 to-rose-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Attention Required
              </span>
              <span>
                {p1CriticalTickets.length > 0 && `${p1CriticalTickets.length} P1 Critical ticket(s)`}
                {p1CriticalTickets.length > 0 && overdueTickets.length > 0 && ' · '}
                {overdueTickets.length > 0 && `${overdueTickets.length} SLA overdue ticket(s)`}
                {unassignedTickets.length > 0 && ` · ${unassignedTickets.length} unassigned`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('tickets')}
                className="underline hover:no-underline font-semibold text-xs"
              >
                View Tickets
              </button>
              <button
                type="button"
                onClick={() => setReminderDismissed(true)}
                className="text-white/80 hover:text-white text-base leading-none ml-2"
                title="Dismiss reminder"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Topbar */}
        <TopBar
          title={VIEW_TITLES[currentView] || 'Tech Support Portal'}
          onOpenSidebar={() => setSidebarOpen(true)}
          onQuickNewTicket={handleQuickNew}
        />

        {/* View Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Toast Stack */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <PortalMain />
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
