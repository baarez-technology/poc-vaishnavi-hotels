import { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PERMISSION_MODULES, defaultSettings } from '../../utils/settings';
import { Button } from '../ui2/Button';

const STORAGE_KEY = 'glimmora_roles';

export default function RolesPermissionsTab() {
  const [roles, setRoles] = useState([]);
  const [expandedRole, setExpandedRole] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRoles(JSON.parse(stored));
    } else {
      setRoles(defaultSettings.roles);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings.roles));
    }
  }, []);

  const saveRoles = (newRoles) => {
    setRoles(newRoles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoles));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePermission = (roleId, module, permission) => {
    const newRoles = roles.map((role) => {
      if (role.id !== roleId) return role;
      return {
        ...role,
        permissions: {
          ...role.permissions,
          [module]: {
            ...role.permissions[module],
            [permission]: !role.permissions[module]?.[permission]
          }
        }
      };
    });
    saveRoles(newRoles);
  };

  const toggleAllPermissions = (roleId, module, value) => {
    const newRoles = roles.map((role) => {
      if (role.id !== roleId) return role;
      const permissions = role.permissions[module] || {};
      const updated = {};
      Object.keys(permissions).forEach((key) => {
        updated[key] = value;
      });
      return {
        ...role,
        permissions: {
          ...role.permissions,
          [module]: updated
        }
      };
    });
    saveRoles(newRoles);
  };

  const getPermissionTypes = (module) => {
    if (module === 'reports') return ['view', 'edit', 'export'];
    if (module === 'dashboard' || module === 'revenueAI' || module === 'reputationAI' || module === 'crm' || module === 'settings' || module === 'aiAssistant') {
      return ['view', 'edit'];
    }
    return ['view', 'edit', 'delete'];
  };

  const countPermissions = (role) => {
    let total = 0;
    let enabled = 0;
    PERMISSION_MODULES.forEach((mod) => {
      const perms = role.permissions[mod.id] || {};
      Object.values(perms).forEach((val) => {
        total++;
        if (val) enabled++;
      });
    });
    return { total, enabled };
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Roles & Permissions
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure access levels and permissions for each role in your organization
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-50 text-sage-600 rounded-lg">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Saved</span>
          </div>
        )}
      </header>

      {/* Roles List */}
      <div className="space-y-3">
        {roles.map((role) => {
          const permCount = countPermissions(role);
          const isExpanded = expandedRole === role.id;

          return (
            <div
              key={role.id}
              className="bg-neutral-50/50 rounded-[10px] overflow-hidden"
            >
              {/* Role Header */}
              <button
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-100"
              >
                <div className="text-left">
                  <h3 className="text-sm font-medium text-neutral-900">{role.name}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{role.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {permCount.enabled}/{permCount.total}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">permissions</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
              </button>

              {/* Permissions Matrix */}
              {isExpanded && (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-100">
                          <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-500">
                            Module
                          </th>
                          <th className="text-center py-2.5 px-3 text-xs font-medium text-neutral-500 w-20">
                            View
                          </th>
                          <th className="text-center py-2.5 px-3 text-xs font-medium text-neutral-500 w-20">
                            Edit
                          </th>
                          <th className="text-center py-2.5 px-3 text-xs font-medium text-neutral-500 w-24">
                            Delete/Export
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_MODULES.map((mod, index) => {
                          const perms = role.permissions[mod.id] || {};
                          const permTypes = getPermissionTypes(mod.id);

                          return (
                            <tr
                              key={mod.id}
                              className={index !== PERMISSION_MODULES.length - 1 ? 'border-b border-neutral-100' : ''}
                            >
                              <td className="py-3 px-3">
                                <span className="text-sm text-neutral-700">
                                  {mod.label}
                                </span>
                              </td>
                              {permTypes.map((perm) => (
                                <td key={perm} className="py-3 px-3 text-center">
                                  <label className="inline-flex items-center justify-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={perms[perm] || false}
                                      onChange={() => togglePermission(role.id, mod.id, perm)}
                                      className="w-4 h-4 rounded border-neutral-300 text-terra-500 focus:ring-terra-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                  </label>
                                </td>
                              ))}
                              {permTypes.length < 3 && (
                                <td className="py-3 px-3 text-center">
                                  <span className="text-neutral-300">-</span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-4 mt-5 pt-4 border-t border-neutral-100">
                    <span className="text-xs text-neutral-500">Quick actions:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        PERMISSION_MODULES.forEach((mod) => {
                          toggleAllPermissions(role.id, mod.id, true);
                        });
                      }}
                    >
                      Grant all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        PERMISSION_MODULES.forEach((mod) => {
                          toggleAllPermissions(role.id, mod.id, false);
                        });
                      }}
                    >
                      Revoke all
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend Card */}
      <div className="bg-neutral-50/50 rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h4 className="text-sm font-medium text-neutral-900">Legend</h4>
          <p className="text-xs text-neutral-500 mt-0.5">Understanding permission indicators</p>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 rounded border-neutral-300 text-terra-500 focus:ring-terra-500 cursor-default"
              />
              <span className="text-xs text-neutral-600">Permission granted</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={false}
                readOnly
                className="w-4 h-4 rounded border-neutral-300 text-terra-500 focus:ring-terra-500 cursor-default"
              />
              <span className="text-xs text-neutral-600">Permission denied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-300 text-sm w-4 text-center">-</span>
              <span className="text-xs text-neutral-600">Not applicable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
