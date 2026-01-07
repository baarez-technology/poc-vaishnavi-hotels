import React, { useState } from 'react';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useToast } from '../../../contexts/ToastContext';
import FormSection from '../../../components/settings/FormSection';
import UsersTable from '../../../components/settings/UsersTable';
import { UserPlus, Users as UsersIcon } from 'lucide-react';

/**
 * Users & Roles Page
 * User management and role assignment
 */
export default function UsersAndRoles() {
  const { users, roles, disableUser, enableUser } = useSettingsContext();
  const { success, error } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleEditUser = (user) => {
    success(`Opening edit form for ${user.name}`);
  };

  const handleToggleActive = (user) => {
    if (user.active) {
      const result = disableUser(user.id);
      if (result.success) {
        success(`${user.name} has been disabled`);
      } else {
        error(result.reason || 'Failed to disable user');
      }
    } else {
      enableUser(user.id);
      success(`${user.name} has been enabled`);
    }
  };

  const handleInviteUser = () => {
    setShowInviteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">
            Users & Roles
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Manage team members and their roles
          </p>
        </div>
        <button
          onClick={handleInviteUser}
          className="px-4 py-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:shadow transition-all flex items-center gap-2 text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Users Table */}
      <FormSection
        title={`Team Members (${users.length})`}
        description="View and manage all users in your organization"
      >
        <UsersTable
          users={users}
          onEdit={handleEditUser}
          onToggleActive={handleToggleActive}
        />
      </FormSection>

      {/* Roles Overview */}
      <FormSection
        title="Roles Overview"
        description="Available roles and their user counts"
      >
        <div className="grid grid-cols-4 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-4 bg-[#FAF8F6] border border-neutral-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: role.color + '20' }}
              >
                <UsersIcon className="w-5 h-5" style={{ color: role.color }} />
              </div>
              <h4 className="text-sm font-semibold text-neutral-800 mb-1">
                {role.name}
              </h4>
              <p className="text-xs text-neutral-600 mb-2">
                {role.description}
              </p>
              <p className="text-xs text-neutral-500">
                {users.filter(u => u.role === role.id).length} {users.filter(u => u.role === role.id).length === 1 ? 'user' : 'users'}
              </p>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Invite User Modal (Simple Version) */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-neutral-800 mb-4">
              Invite New User
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Role
                </label>
                <select className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-transparent">
                  {rolesData.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  alert('User invited!');
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:shadow transition-all text-sm font-medium"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
