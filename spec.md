# Padmaja Creation ERP

## Current State

The app uses local username/password auth (no Internet Identity). All data — employees, operations, bundles, production entries, attendance — is stored in `localStorage` via `localStore.ts`. The ICP backend (`main.mo`) exists with all CRUD APIs but is NOT being used for data storage. This means data is per-device: when Admin adds employees/operations/bundles on their browser, supervisors on other devices see nothing.

The sync code currently only contains supervisor account credentials (no master data).

## Requested Changes (Diff)

### Add
- Shared data sync: employees, operations, and bundles created by Admin must be visible to supervisors on any device
- Auto-embed shared master data (employees, operations, bundles) into the sync code so supervisors receive them on import
- "Refresh Data" button in supervisor layout to re-import latest master data without re-entering credentials
- Auto-sync trigger: any time Admin saves/edits/deletes an employee, operation, or bundle, the shared data payload in localStorage is updated automatically

### Modify
- `exportSyncCode` in `useAuth.ts`: include employees, operations, and bundles in the exported payload alongside supervisor accounts
- `importSyncCode` in `useAuth.ts`: also import employees, operations, bundles from the payload into `localStorage`
- `SupervisorLayout.tsx`: add a "Refresh Data" UI trigger that allows supervisors to re-import updated master data using a new sync code from Admin
- Admin pages (EmployeesPage, OperationsPage, BundlesPage): after any create/update/delete, automatically update a shared sync payload in localStorage so Admin can always export the latest sync code

### Remove
- Nothing removed

## Implementation Plan

1. **Enhance sync code format**: Change the sync payload from `SupervisorAccount[]` to `{ supervisors: SupervisorAccount[], employees: Employee[], operations: Operation[], bundles: Bundle[] }`. Make it backward-compatible.
2. **Update `exportSyncCode`**: Read employees, operations, bundles from `localStore` and embed them in the exported base64 payload.
3. **Update `importSyncCode`**: After importing supervisors, also write employees/operations/bundles to `localStore` storage keys so they appear immediately in the supervisor app.
4. **Supervisor refresh flow**: Add a "Sync Data" option in SupervisorLayout that shows a modal where supervisors can paste a new sync code to pull the latest employees/operations/bundles from Admin.
5. **Auto-sync on Admin writes**: After any mutation in EmployeesPage/OperationsPage/BundlesPage succeeds, the data is already in localStorage — so the next `exportSyncCode` call will automatically include it. No extra work needed here.
