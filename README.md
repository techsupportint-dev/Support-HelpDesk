# Credlock Africa – Tech Support Operations Portal

Operations portal for the Credlock Africa Technical Support team (managing tickets, Kavro device issues, coverage rota, officer performance analytics, AI insights & SWOT, and admin access control).

Rewritten as a modern React application with TypeScript, Vite, and Tailwind CSS.

## Team Lead Sign-In Credentials

| Field | Value |
|-------|-------|
| Email | `techsupport.int@gmail.com` |
| PIN | `6424` |

Officers can register in the portal; the Team Lead approves registrations under **Approvals** or the **Admin Panel**.

## Key Features

- **Operations**:
  - **Lead Dashboard**: Executive overview of P1 critical incidents, SLA compliance, pending approvals, and officer workloads.
  - **Dashboard**: Operational KPIs, SLA tracking, priority mix, and intake volume.
  - **Tickets**: Master ticket register with search, status & priority filtering, detailed modal, inline editing, and email notification drafting.
  - **Kavro Issues**: Kavro device tracking with lock status, follow-ups, and auto-generated action dates.
  - **New Ticket**: Ticket creation and editing form with priority SLA targets.
  - **Coverage Rota**: Support coverage rota by day of the week.
- **Reporting & Analytics**:
  - **Daily, Weekly & Monthly Reports**: Breakdown of received, resolved, compliance %, and backlogs.
  - **Officer Reports**: Individual officer activity breakdowns with export capabilities.
  - **Monthly Document Archives**: Monthly reports archive and builder.
  - **Analytics**: Operations analytics and officer efficiency scoring.
  - **AI Insights**: Rules-based operational analysis and SWOT analysis per support officer.
- **Team & Administration**:
  - **Team**: Support team roster and focus areas.
  - **Templates**: Standard operational reply templates with one-click copy.
  - **Notifications**: Notification rules, audit log, and Web Audio API alerts.
  - **Approvals**: User registration and PIN reset approval workflow.
  - **My Work**: Personalized officer queue showing assigned tickets and urgent tasks.
  - **Admin Panel**: Role management and granular permission matrix.
  - **Settings**: Direct Google Sheets API connection with OAuth authentication, configurable Sheet ID (`1qOySvKFNS5kkMGjHoyr51-qJJ3bQavTzk83k5owZbIo`), Apps Script fallback sync, and JSON backup exports.

## Connected Google Sheet

- **Spreadsheet ID**: `1qOySvKFNS5kkMGjHoyr51-qJJ3bQavTzk83k5owZbIo`
- **Spreadsheet URL**: [https://docs.google.com/spreadsheets/d/1qOySvKFNS5kkMGjHoyr51-qJJ3bQavTzk83k5owZbIo/edit](https://docs.google.com/spreadsheets/d/1qOySvKFNS5kkMGjHoyr51-qJJ3bQavTzk83k5owZbIo/edit)
- **Tabs Synced**:
  - `Tickets`: Master support tickets register
  - `KAVRO_Devices`: BNPL & device IMEI records, lock status, recovery officers
  - `Officers`: Support and recovery officers roster
  - `Rota`: Phone coverage rota
  - `Config`: Alert settings and contact rules
  - `Summary`: Aggregate KPIs
  - `HOME`: Operating principles and reference documentation

## Development & Build

```bash
# Run local development server (port 3000)
npm run dev

# Compile and build production bundle
npm run build
```
