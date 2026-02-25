/**
 * Glimmora RBAC – Role-Based Access Control Configuration
 * Central config for the 10 staff roles and 13 permission modules.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type StaffRole =
  | 'admin'
  | 'general_manager'
  | 'front_office_manager'
  | 'duty_manager'
  | 'receptionist'
  | 'reservation_manager'
  | 'housekeeping_manager'
  | 'housekeeper'
  | 'revenue_manager'
  | 'accounts_manager';

export type PermissionModule =
  | 'dashboard'
  | 'bookings'
  | 'guests'
  | 'rooms'
  | 'staff'
  | 'housekeeping'
  | 'maintenance'
  | 'aiAssistant'
  | 'revenueAI'
  | 'reputationAI'
  | 'crmAI'
  | 'reports'
  | 'settings';

export interface ModulePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionMap = Record<PermissionModule, ModulePermission>;

// ── Role metadata ────────────────────────────────────────────────────────────

export interface RoleMeta {
  value: StaffRole;
  label: string;
  department: string;
  description: string;
}

export const STAFF_ROLES: RoleMeta[] = [
  { value: 'admin',                label: 'Administrator',         department: 'management',   description: 'Full system access with all permissions' },
  { value: 'general_manager',      label: 'General Manager',       department: 'management',   description: 'Senior management with broad operational access' },
  { value: 'front_office_manager', label: 'Front Office Manager',  department: 'frontdesk',    description: 'Manages front desk operations and guest services' },
  { value: 'duty_manager',         label: 'Duty Manager',          department: 'operations',   description: 'On-duty operational oversight and incident handling' },
  { value: 'receptionist',         label: 'Receptionist',          department: 'frontdesk',    description: 'Handles check-ins, check-outs and guest queries' },
  { value: 'reservation_manager',  label: 'Reservation Manager',   department: 'reservations', description: 'Manages bookings, availability and channel distribution' },
  { value: 'housekeeping_manager', label: 'Housekeeping Manager',  department: 'housekeeping', description: 'Oversees room cleaning and housekeeping staff' },
  { value: 'housekeeper',          label: 'Housekeeper',           department: 'housekeeping', description: 'Performs room cleaning and maintenance tasks' },
  { value: 'revenue_manager',      label: 'Revenue Manager',       department: 'revenue',      description: 'Manages pricing, revenue optimization and analytics' },
  { value: 'accounts_manager',     label: 'Accounts Manager',      department: 'finance',      description: 'Handles financial reporting and billing operations' },
];

// ── Module metadata (for UI display) ─────────────────────────────────────────

export interface ModuleMeta {
  id: PermissionModule;
  label: string;
  icon?: string; // lucide icon name for reference
}

export const PERMISSION_MODULES: ModuleMeta[] = [
  { id: 'dashboard',     label: 'Dashboard',       icon: 'LayoutDashboard' },
  { id: 'bookings',      label: 'Bookings',        icon: 'CalendarCheck' },
  { id: 'guests',        label: 'Guests',          icon: 'Users' },
  { id: 'rooms',         label: 'Rooms',           icon: 'BedDouble' },
  { id: 'staff',         label: 'Staff',           icon: 'UserCheck' },
  { id: 'housekeeping',  label: 'Housekeeping',    icon: 'ClipboardCheck' },
  { id: 'maintenance',   label: 'Maintenance',     icon: 'Wrench' },
  { id: 'aiAssistant',   label: 'AI Assistant',    icon: 'Sparkles' },
  { id: 'revenueAI',     label: 'Revenue AI',      icon: 'BarChart3' },
  { id: 'reputationAI',  label: 'Reputation AI',   icon: 'MessageSquare' },
  { id: 'crmAI',         label: 'CRM AI',          icon: 'Contact' },
  { id: 'reports',       label: 'Reports',         icon: 'FileText' },
  { id: 'settings',      label: 'Settings',        icon: 'Settings' },
];

// ── Helper ───────────────────────────────────────────────────────────────────

const p = (view: boolean, edit: boolean, del: boolean): ModulePermission => ({ view, edit, delete: del });
const NONE = p(false, false, false);
const V    = p(true,  false, false);
const VE   = p(true,  true,  false);
const VED  = p(true,  true,  true);

// ── Default permission matrix per role ───────────────────────────────────────

export const DEFAULT_PERMISSIONS: Record<StaffRole, PermissionMap> = {
  admin: {
    dashboard:    VED, bookings: VED, guests: VED, rooms: VED,
    staff:        VED, housekeeping: VED, maintenance: VED,
    aiAssistant:  VED, revenueAI: VED, reputationAI: VED, crmAI: VED,
    reports:      VED, settings: VED,
  },
  general_manager: {
    dashboard:    VE,  bookings: VED, guests: VED, rooms: VED,
    staff:        VE,  housekeeping: VE,  maintenance: VE,
    aiAssistant:  VE,  revenueAI: VED, reputationAI: VE, crmAI: VE,
    reports:      VED, settings: V,
  },
  front_office_manager: {
    dashboard:    V,   bookings: VED, guests: VED, rooms: VE,
    staff:        V,   housekeeping: NONE, maintenance: NONE,
    aiAssistant:  V,   revenueAI: V,   reputationAI: V, crmAI: VE,
    reports:      V,   settings: NONE,
  },
  duty_manager: {
    dashboard:    V,   bookings: VE,  guests: VE,  rooms: VE,
    staff:        V,   housekeeping: NONE, maintenance: VE,
    aiAssistant:  V,   revenueAI: NONE, reputationAI: V, crmAI: NONE,
    reports:      V,   settings: NONE,
  },
  receptionist: {
    dashboard:    V,   bookings: VE,  guests: VE,  rooms: V,
    staff:        NONE, housekeeping: NONE, maintenance: NONE,
    aiAssistant:  V,   revenueAI: NONE, reputationAI: NONE, crmAI: NONE,
    reports:      NONE, settings: NONE,
  },
  reservation_manager: {
    dashboard:    V,   bookings: VED, guests: VE,  rooms: VE,
    staff:        NONE, housekeeping: NONE, maintenance: NONE,
    aiAssistant:  V,   revenueAI: V,   reputationAI: NONE, crmAI: VE,
    reports:      V,   settings: NONE,
  },
  housekeeping_manager: {
    dashboard:    V,   bookings: V,   guests: V,   rooms: VE,
    staff:        V,   housekeeping: VED, maintenance: VE,
    aiAssistant:  V,   revenueAI: NONE, reputationAI: NONE, crmAI: NONE,
    reports:      V,   settings: NONE,
  },
  housekeeper: {
    dashboard:    NONE, bookings: NONE, guests: NONE, rooms: V,
    staff:        NONE, housekeeping: VE, maintenance: VE,
    aiAssistant:  V,   revenueAI: NONE, reputationAI: NONE, crmAI: NONE,
    reports:      NONE, settings: NONE,
  },
  revenue_manager: {
    dashboard:    V,   bookings: VE,  guests: NONE, rooms: V,
    staff:        NONE, housekeeping: NONE, maintenance: NONE,
    aiAssistant:  V,   revenueAI: VED, reputationAI: V, crmAI: V,
    reports:      VED, settings: NONE,
  },
  accounts_manager: {
    dashboard:    V,   bookings: VE,  guests: VE,  rooms: NONE,
    staff:        NONE, housekeeping: NONE, maintenance: NONE,
    aiAssistant:  NONE, revenueAI: V,  reputationAI: NONE, crmAI: NONE,
    reports:      VED, settings: NONE,
  },
};

// ── Sidebar route → module mapping ───────────────────────────────────────────

export const ROUTE_MODULE_MAP: Record<string, PermissionModule> = {
  '/admin':                  'dashboard',
  '/admin/dashboard':        'dashboard',
  '/admin/bookings':         'bookings',
  '/admin/guests':           'guests',
  '/admin/rooms':            'rooms',
  '/admin/staff':            'staff',
  '/admin/housekeeping':     'housekeeping',
  '/admin/maintenance':      'maintenance',
  '/admin/runner':           'maintenance',
  // CMS — availability & rate management
  '/admin/cms':              'revenueAI',
  // Channel Manager — distribution management
  '/admin/channel-manager':  'revenueAI',
  // Revenue management
  '/admin/revenue':          'revenueAI',
  '/admin/rms':              'revenueAI',
  // AI tools
  '/admin/ai/reputation':    'reputationAI',
  '/admin/ai/crm':           'crmAI',
  '/admin/ai/crm-dashboard': 'crmAI',
  '/admin/ai/ab-testing':    'crmAI',
  '/admin/ai/ota-conversion':'crmAI',
  '/admin/ai/member-tiers':  'crmAI',
  '/admin/ai/ai-segments':   'crmAI',
  '/admin/ai/recovery':      'crmAI',
  // Reports & Settings
  '/admin/reports':          'reports',
  '/admin/analytics':        'reports',
  '/admin/settings':         'settings',
};

// ── Utility functions ────────────────────────────────────────────────────────

/** Get default permissions for a role */
export function getDefaultPermissions(role: StaffRole): PermissionMap {
  return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS[role]));
}

/** Check if a permission map differs from the role's defaults */
export function hasCustomOverrides(role: StaffRole, permissions: PermissionMap): boolean {
  const defaults = DEFAULT_PERMISSIONS[role];
  for (const mod of PERMISSION_MODULES) {
    const def = defaults[mod.id];
    const cur = permissions[mod.id];
    if (def.view !== cur.view || def.edit !== cur.edit || def.delete !== cur.delete) {
      return true;
    }
  }
  return false;
}

/** Check if a specific module permission differs from the role default */
export function isOverridden(
  role: StaffRole,
  module: PermissionModule,
  permission: keyof ModulePermission,
  currentValue: boolean
): boolean {
  return DEFAULT_PERMISSIONS[role][module][permission] !== currentValue;
}

/**
 * Resolve permissions for a role, checking Settings customizations first.
 * Priority: user.permissions > localStorage glimmora_roles > DEFAULT_PERMISSIONS
 */
export function resolveRolePermissions(role: StaffRole): PermissionMap {
  try {
    const stored = localStorage.getItem('glimmora_roles');
    if (stored) {
      const roles = JSON.parse(stored) as { id: string; permissions?: PermissionMap }[];
      const match = roles.find(r => r.id === role);
      if (match?.permissions) {
        // Merge with defaults to ensure all 13 modules exist
        const merged = { ...DEFAULT_PERMISSIONS[role] };
        for (const mod of PERMISSION_MODULES) {
          if (match.permissions[mod.id]) {
            merged[mod.id] = match.permissions[mod.id];
          }
        }
        return merged;
      }
    }
  } catch {
    // localStorage parse error — fall through to defaults
  }
  return DEFAULT_PERMISSIONS[role];
}

/** Get the module for a given route path (longest/most-specific prefix wins) */
export function getModuleForRoute(path: string): PermissionModule | null {
  // Exact match first
  if (ROUTE_MODULE_MAP[path]) return ROUTE_MODULE_MAP[path];
  // Prefix match — find the longest matching route for specificity
  let bestMatch: PermissionModule | null = null;
  let bestLen = 0;
  for (const [route, mod] of Object.entries(ROUTE_MODULE_MAP)) {
    if (path.startsWith(route + '/') && route.length > bestLen) {
      bestMatch = mod;
      bestLen = route.length;
    }
  }
  return bestMatch;
}

/** Check if user has view access to a given module */
export function canViewModule(permissions: PermissionMap | undefined, module: PermissionModule): boolean {
  if (!permissions) return false;
  return permissions[module]?.view === true;
}

/** Check if user has edit access to a given module */
export function canEditModule(permissions: PermissionMap | undefined, module: PermissionModule): boolean {
  if (!permissions) return false;
  return permissions[module]?.edit === true;
}

/** Check if user has delete access to a given module */
export function canDeleteModule(permissions: PermissionMap | undefined, module: PermissionModule): boolean {
  if (!permissions) return false;
  return permissions[module]?.delete === true;
}

/** Get role label from value */
export function getRoleLabel(role: StaffRole): string {
  return STAFF_ROLES.find(r => r.value === role)?.label || role;
}
