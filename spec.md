# Padmaja Creation ERP

## Current State
New project. No existing modules. Standard Caffeine scaffold with empty backend and frontend.

## Requested Changes (Diff)

### Add

**Backend (Motoko)**
- Employee management: CRUD for employees (id, name, phone, department, salaryType, joinDate, status)
- Operation management: CRUD for operations (id, name, ratePerPiece, department, dailyTarget)
- Bundle management: CRUD for bundles (id auto-generated as B+number, styleNumber, size, color, quantity, createdDate, status Running/Completed)
- Production entry: create/query entries (date, employeeId, operationId, bundleId, quantity, rate, amount calculated = qty × rate)
- Attendance: mark/query daily attendance (date, employeeId, status: Present/Absent/HalfDay)
- Targets: set/query daily targets per operation
- Dashboard queries: total production today, total running bundles, total employees working today, top performers, low performers, operator efficiency, target vs actual
- Salary automation: monthly salary calculation = Σ(quantity × rate) per employee filtered by month
- Bundle tracking: per-bundle operation progress (which operations completed vs pending)
- Role-based access: Admin and Supervisor roles via authorization component
- QR code: generate QR per bundle containing Bundle ID

**Frontend**
- Login page (Admin + Supervisor)
- Admin Dashboard: KPI cards (production today, running bundles, employees working, top/low performer), operator ranking table, efficiency table, target vs production table
- Admin: Employee Management (list, add, edit, delete)
- Admin: Operation Management (list, add, edit, delete)
- Admin: Bundle Management (list, add, edit, delete, QR code display + print label)
- Admin: Production Entries (list view with filters by date/employee/bundle)
- Admin: Attendance view (read-only overview)
- Admin: Bundle Progress Tracker (per-bundle operation status)
- Admin: Salary Report (monthly salary sheet per employee)
- Admin: Excel Export (Production Report, Salary Report, Monthly Production Report by operation/employee/bundle)
- Supervisor Panel (mobile-first): Mark Attendance, Enter Production (multi-operation per employee, QR scan for bundle), View own entries
- QR Scanner integration using camera for bundle ID auto-fill

### Modify
- None (new project)

### Remove
- None

## Implementation Plan

1. Select Caffeine components: authorization, qr-code
2. Generate Motoko backend with all collections: Employees, Operations, Bundles, ProductionEntries, Attendance, Targets
3. Frontend: login/auth flow with role routing
4. Frontend: Admin dashboard with real-time KPI cards and performance tables
5. Frontend: Employee, Operation, Bundle management modules with full CRUD
6. Frontend: Bundle QR code generation and printable label
7. Frontend: Production Entry with multi-operation rows, auto rate loading, running total
8. Frontend: QR scanner on supervisor production entry screen
9. Frontend: Attendance marking (supervisor) and overview (admin)
10. Frontend: Bundle progress tracker showing operation completion status
11. Frontend: Salary automation - monthly calculation and salary sheet
12. Frontend: Excel export for production report, salary report, monthly report
13. Frontend: Supervisor mobile-optimized panel (attendance + production + QR scan)
14. Apply OKLCH design system, responsive layout, mobile-first for supervisor views
