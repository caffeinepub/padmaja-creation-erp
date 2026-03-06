# Padmaja Creation ERP

## Current State
- Supervisor Attendance page shows all active employees in a flat daily list, no monthly view, no department filter.
- Supervisor Production page shows all active employees in the employee dropdown regardless of salary type.
- Admin Attendance page has Daily/Monthly tabs but no department filter.
- Operations page has no department quick-filter; all operations shown together.
- Employees can already be tagged with a department (free-text field).

## Requested Changes (Diff)

### Add
- **Supervisor Attendance**: Daily/Monthly tab toggle (same as Admin side). In Daily tab, add a department filter toggle (All / Finishing) so supervisor can quickly mark attendance only for Finishing department employees. Monthly tab shows per-employee present/absent/half-day counts with same All/Finishing filter.
- **Supervisor Production**: Filter employee dropdown to show only **Piece Rate** salary-type employees (since finishing/piece-rate workers are paid per piece). Add a small label note explaining the filter.
- **Admin Attendance**: Add a department filter (All / Finishing) to both Daily and Monthly tabs — mirrors supervisor side.
- **Admin Production**: Add a department/salary-type filter toggle (All / Piece Rate / Monthly) to the existing filter row so admin can view finishing employee entries separately.
- **"Finishing" as a suggested department**: Add "Finishing" to the department autocomplete suggestions in the Add/Edit Employee dialog so users can easily tag finishing employees.

### Modify
- `SupervisorAttendance.tsx`: Wrap existing daily view in tabs; add Monthly tab (reuse admin MonthlyTab logic); add Finishing dept filter chip on both tabs.
- `SupervisorProduction.tsx`: Filter `employees` list to only `salaryType === "Piece Rate"`.
- `AttendancePage.tsx` (Admin): Add department filter chips (All / Finishing) to DailyTab and MonthlyTab.
- `ProductionPage.tsx` (Admin): Add salary type filter to filter row.
- `EmployeesPage.tsx`: Add "Finishing" to department suggestions datalist.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `EmployeesPage.tsx` — add "Finishing" to department suggestions datalist.
2. Update `SupervisorProduction.tsx` — filter employees to Piece Rate only; show info note.
3. Update `SupervisorAttendance.tsx` — add Daily/Monthly tabs + All/Finishing dept filter on both tabs.
4. Update `AttendancePage.tsx` (Admin) — add All/Finishing dept filter chips to both tabs.
5. Update `ProductionPage.tsx` (Admin) — add salary type filter dropdown to filters row.
