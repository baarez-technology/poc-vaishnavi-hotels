/**
 * POC Configuration — Vaishnavi Group of Hotels, Hyderabad (7-day trial)
 *
 * Set POC_MODE = false (or delete this file and its imports) when the POC period ends.
 * Do NOT merge this into role-level RBAC — it is a temporary global override.
 */

// TEMP: POC mode toggle – set to false to restore full access
export const POC_MODE = true;

// Sidebar section IDs to hide entirely during POC
export const POC_HIDDEN_SIDEBAR_SECTIONS = new Set([
  'finance',   // Night Audit, POS Closure, Cashier Sessions, AR Ledger, etc.
  'channel',   // Channel Manager, OTA Connections, Rate Sync, etc.
  'revenue',   // Revenue Dashboard, Rate Calendar, Forecast, Revenue AI, etc.
  'ai',        // Reputation AI, CRM AI, ReConnect AI
  'system',    // Settings, Audit Logs, Multi-Room
]);

// Specific route paths to hide within otherwise-visible sidebar sections
export const POC_HIDDEN_ROUTES = new Set<string>([]);

// Route prefixes that are accessible during POC.
// Any pathname that starts with one of these is allowed through.
export const POC_ALLOWED_ROUTE_PREFIXES = [
  '/admin/dashboard',
  '/admin/bookings',
  '/admin/guests',
  '/admin/rooms',
  '/admin/room-moves',
  '/admin/staff',
  '/admin/housekeeping',
  '/admin/maintenance',
  '/admin/cms',
  '/admin/reports',
  '/admin/rate-check',
  '/admin/profile',
  '/admin/access-denied',
];
