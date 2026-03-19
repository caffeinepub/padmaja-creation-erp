# Padmaja Creation ERP

## Current State
New project — no existing application files.

## Requested Changes (Diff)

### Add
- Full Garment Manufacturing ERP with blockchain backend on ICP (Motoko)
- Username/password authentication with RBAC (Admin + Supervisor roles)
- 14 Admin modules: Dashboard, Employee Mgmt, Operation Mgmt, Bundle Mgmt, Production Entries, Attendance, Salary Sheet, Bundle Progress Tracker, Performance Ranking, Target vs Production, Reports, Supervisor Mgmt, Inventory, Quality Control
- Supervisor mobile-first panel: Attendance, Production Entry (with QR scan flow), QR Scanner, Offline Mode
- Camera-based QR code generator and scanner for bundle tracking
- Excel export (xlsx) for salary sheet and reports
- Real-time data sync across all devices via ICP backend
- Audit logging for all create/edit actions
- Offline mode for supervisors (IndexedDB queue, sync on reconnect)

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko — single canister with modular actor)
- AuthCanister: login(username, password) → session token; createSupervisor; getRole
- EmployeeCanister: addEmployee, updateEmployee, deleteEmployee, getEmployees, getEmployeeById
- OperationCanister: addOperation, updateOperation, deleteOperation, getOperations
- BundleCanister: createBundle (auto QR), updateBundleStatus, getBundles, getBundleByQR
- ProductionCanister: addEntry, getEntries (filters: date/employee/bundle), getTodaySummary
- AttendanceCanister: markAttendance, getAttendance (daily/monthly), getMonthlySummary
- InventoryCanister: addItem, updateStock, issueToBundle, getLowStockItems
- QualityCanister: addQCRecord, updateReworkStatus, getQCByBundle
- ReportsCanister: getDailyReport, getMonthlyReport, getPerformanceRanking, getSalarySheet

### Frontend
- Login page (username/password, role detection)
- Admin layout with sidebar navigation (14 modules)
- Supervisor layout with bottom nav (mobile-first, 4 tabs)
- Dashboard: KPI cards, efficiency chart, top/low performers
- Employee Mgmt: CRUD table with search/filter/infinite scroll
- Operation Mgmt: CRUD table
- Bundle Mgmt: Create form with auto QR, print label, status tracker
- Production Entries: Filter form + table with totals
- Attendance: Daily tap-marking + monthly calendar/summary
- Salary Sheet: Auto-calc table + Excel export
- Bundle Progress Tracker: Operation-wise completion progress bars
- Performance Ranking: Ranked table with efficiency %
- Target vs Production: Comparison table with status badges
- Reports: 4 report types with Excel export
- Supervisor Mgmt: Create/delete supervisors
- Inventory: Stock table, issue dialog, low-stock alerts
- Quality Control: QC records, rejection reasons, rework status
- Supervisor Panel: QR scanner (camera), production entry wizard, attendance tap, offline queue with sync
