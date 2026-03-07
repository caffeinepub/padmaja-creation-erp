# Padmaja Creation ERP

## Current State
The app uses a fully local (localStorage-only) architecture. Admin and supervisor devices never communicate directly -- data is shared by:
1. Admin copies a "sync code" (base64 blob) → pastes in WhatsApp → supervisor pastes it in app
2. Supervisor copies an "upload code" (base64 blob) → pastes in WhatsApp → admin pastes it in app

Both flows are manual, error-prone, and tedious for factory staff.

## Requested Changes (Diff)

### Add
- **Auto-sync engine** (`useAutoSync.ts`) -- a polling mechanism that leverages the browser's `localStorage` + `BroadcastChannel` API (same-origin cross-tab) and a simple "shared sync store" backed by a unique 6-digit PIN
- Since this is a single-origin app (all users visit the same URL), we can use a **shared namespace in localStorage keyed by a PIN** that acts as a virtual "sync channel":
  - When admin saves data, it writes to `pc_sync_<PIN>_master` (employees, operations, bundles, supervisors)
  - Supervisor polls `pc_sync_<PIN>_master` every 30 seconds; if `updatedAt` changes, it auto-imports
  - Supervisor writes production entries to `pc_sync_<PIN>_entries_<supervisorUsername>`
  - Admin polls `pc_sync_<PIN>_entries_*` every 30 seconds and auto-imports new entries
  - BroadcastChannel fires instant update in the same browser; polling is the fallback for other devices
- **Auto-sync PIN setup** -- Admin sees a "Auto Sync" section in the Supervisors page:
  - Generates a 6-digit PIN (or lets admin pick one)
  - Shows a simple instruction: "Share this PIN with your supervisors once. They enter it in their app and everything syncs automatically."
  - "Enable Auto-Sync" toggle
- **Supervisor sync setup** -- On first login (or via a "Setup Auto-Sync" button in their header), supervisor enters the 6-digit PIN once and saves it. After that, syncing happens automatically.
- **Auto-sync status indicator** in supervisor header: small green dot when synced, spinning when syncing
- **Admin auto-import badge** on Production and Attendance pages showing "X new entries auto-imported" toast when new supervisor data arrives

### Modify
- `useAuth.ts` -- `exportSyncCode` and `importSyncCode` remain for backward compat, but now also write to the shared sync namespace when a PIN is active
- `SupervisorsPage.tsx` -- Add "Auto Sync" card section at the top with PIN display and enable/disable toggle. Keep existing manual sync as fallback.
- `SupervisorLayout.tsx` -- Add PIN setup dialog (one-time), replace manual refresh/upload workflow with auto-sync status. Keep manual buttons as fallback.
- Admin Layout -- add a polling hook that auto-imports supervisor entries when PIN is active

### Remove
- Nothing removed -- manual sync kept as fallback for devices without the PIN set up

## Implementation Plan
1. Create `src/frontend/src/hooks/useAutoSync.ts` -- core sync engine:
   - `initAdminSync(pin)` -- writes master data to shared namespace and starts polling for supervisor entries
   - `initSupervisorSync(pin, username)` -- reads master data from shared namespace, writes entries, polls for master updates
   - `generatePin()` -- returns a random 6-digit string
   - `getPinFromStorage()` / `savePinToStorage()` helpers
   - Uses `setInterval` for polling (30s) + `BroadcastChannel` for same-tab instant sync
2. Update `SupervisorsPage.tsx` -- add Auto Sync card with PIN, enable/disable, status
3. Update `SupervisorLayout.tsx` -- add PIN setup dialog, auto-sync status dot in header, auto-upload on submission
4. Update `useAuth.ts` `exportSyncCode` to also write to sync namespace when PIN exists
5. Update `useQueries.ts` or create a new `useAdminAutoSync` hook that polls and auto-imports supervisor entries into admin's localStorage
