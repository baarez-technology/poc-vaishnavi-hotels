import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Check,
  Shield,
  Lock,
  Sun,
  Moon,
  Monitor,
  Camera
} from 'lucide-react';
import Button from '../../../components/staff-portal/ui/Button';
import { FormModal } from '../../../components/staff-portal/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useStaffProfile } from '@/hooks/staff-portal/useStaffApi';
import { userService } from '@/api/services/user.service';

/**
 * Glimmora Design System v4.0 - Staff Portal Profile Page
 * Matching admin dashboard styling patterns
 */

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { data: profile, loading } = useStaffProfile();

  // Form states
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [originalForm, setOriginalForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Preferences state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });

  // Initialize form
  useEffect(() => {
    if (user) {
      const initialForm = {
        name: (user as any)?.name || '',
        email: (user as any)?.email || '',
        phone: (user as any)?.phone || ''
      };
      setEditForm(initialForm);
      setOriginalForm(initialForm);
    }
  }, [user]);

  // Auto-dismiss toast
  useEffect(() => {
    if (showSaveSuccess) {
      const timer = setTimeout(() => setShowSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSaveSuccess]);

  // Helpers
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      housekeeping: 'Housekeeping Staff',
      maintenance: 'Maintenance Technician',
      runner: 'Runner / Bell Staff',
      admin: 'Administrator'
    };
    return labels[role] || role;
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const hasFormChanges = () => {
    return (
      editForm.name !== originalForm.name ||
      editForm.email !== originalForm.email ||
      editForm.phone !== originalForm.phone
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handlers
  const handleSaveChanges = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    updateUser(editForm);
    setOriginalForm(editForm);
    setIsSaving(false);
    setShowSaveSuccess(true);
  };

  const handlePasswordSubmit = async () => {
    setPasswordError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setIsChangingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
      setShowSaveSuccess(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to change password';
      setPasswordError(errorMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-terra-50 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-terra-600" />
        </div>
        <span className="text-[13px] text-neutral-500 font-medium">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  const displayData = { ...profile, ...user };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Page Header - matching admin dashboard */}
      <header className="px-1 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-800">
          My Profile
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage your account settings and preferences
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Profile Card - matching admin dashboard */}
        <div className="col-span-1 xl:col-span-8 rounded-[10px] p-4 sm:p-6 bg-white">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            {/* Avatar and User Info Container for Mobile */}
            <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold bg-terra-100 text-terra-600">
                  {getInitials(displayData.name || '')}
                </div>
                <button className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">
                  {displayData.name || 'User'}
                </h2>
                <p className="text-[13px] text-neutral-500 mt-0.5 truncate">
                  {displayData.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sage-50 text-sage-700 border border-sage-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage-500"></span>
                    Active
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600">
                    <Shield className="w-3 h-3" />
                    {getRoleLabel(displayData.role || '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button - Full width on mobile */}
            <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-shrink-0">
              {showSaveSuccess && (
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-sage-600">
                  <Check className="w-4 h-4" />
                  Saved
                </span>
              )}
              <Button
                variant="primary"
                onClick={handleSaveChanges}
                disabled={!hasFormChanges() || isSaving}
                isLoading={isSaving}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="pt-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-4 sm:mb-5">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-medium text-neutral-500">
                      Email Address
                    </label>
                    <span className="text-[10px] text-neutral-400">Cannot be changed</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={editForm.email}
                      disabled
                      className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-lg text-[13px] bg-neutral-50 border border-neutral-200 text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="col-span-1 xl:col-span-4 rounded-[10px] p-4 sm:p-6 bg-white">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4 sm:mb-5">
            Account Information
          </h3>
          <div className="space-y-3">
            <InfoRow
              icon={Shield}
              label="Account Status"
              value="Active"
              valueClassName="text-sage-600"
            />
            <InfoRow
              icon={User}
              label="Role"
              value={getRoleLabel(displayData.role || '')}
            />
            <InfoRow
              icon={Calendar}
              label="Member Since"
              value={formatDate(displayData.hire_date || (displayData as any).hireDate || (displayData as any).createdAt)}
            />
            <InfoRow
              icon={Mail}
              label="Email Verified"
              value="Yes"
              valueClassName="text-sage-600"
            />
          </div>
        </div>

        {/* Security Card */}
        <div className="col-span-1 xl:col-span-6 rounded-[10px] p-4 sm:p-6 bg-white">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4 sm:mb-5">
            Security
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-neutral-700">
                Password
              </p>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Last changed: Never
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Lock}
              onClick={() => setShowPasswordModal(true)}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Change Password
            </Button>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="col-span-1 xl:col-span-6 rounded-[10px] p-4 sm:p-6 bg-white">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4 sm:mb-5">
            Preferences
          </h3>

          {/* Theme Selection */}
          <div className="mb-6">
            <p className="text-[13px] font-medium text-neutral-700 mb-3">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <ThemeButton
                icon={Sun}
                label="Light"
                active={theme === 'light'}
                onClick={() => setTheme('light')}
              />
              <ThemeButton
                icon={Moon}
                label="Dark"
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
              />
              <ThemeButton
                icon={Monitor}
                label="System"
                active={theme === 'system'}
                onClick={() => setTheme('system')}
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div>
            <p className="text-[13px] font-medium text-neutral-700 mb-3">
              Notifications
            </p>
            <div className="space-y-1 sm:space-y-3">
              <CheckboxItem
                label="Email notifications"
                description="Receive updates and alerts via email"
                checked={notifications.email}
                onChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
              />
              <CheckboxItem
                label="Push notifications"
                description="Receive browser push notifications"
                checked={notifications.push}
                onChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
              />
              <CheckboxItem
                label="SMS notifications"
                description="Receive text messages for urgent alerts"
                checked={notifications.sms}
                onChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <FormModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError(null);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        onSubmit={handlePasswordSubmit}
        title="Change Password"
        subtitle="Enter your current password and choose a new one"
        submitText={isChangingPassword ? "Updating..." : "Update Password"}
        isLoading={isChangingPassword}
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-[13px] border border-rose-200">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Enter current password"
              disabled={isChangingPassword}
              className="w-full h-11 sm:h-10 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Enter new password"
              disabled={isChangingPassword}
              className="w-full h-11 sm:h-10 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              disabled={isChangingPassword}
              className="w-full h-11 sm:h-10 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <p className="text-[11px] text-neutral-500">
            Password must be at least 6 characters.
          </p>
        </div>
      </FormModal>
    </div>
  );
};

// Info Row Component - matching admin dashboard
function InfoRow({
  icon: Icon,
  label,
  value,
  valueClassName
}: {
  icon: any;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-3 rounded-xl bg-neutral-50 min-h-[56px] sm:min-h-0">
      <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-neutral-200">
        <Icon className="w-4 h-4 text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          {label}
        </p>
        <p className={`text-[13px] font-semibold truncate ${valueClassName || 'text-neutral-800'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// Theme Button Component - matching admin dashboard
function ThemeButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 min-h-[48px] sm:min-h-0 rounded-xl text-[12px] sm:text-[13px] font-medium transition-all duration-200 ${active
          ? 'bg-terra-50 text-terra-700 border border-terra-200'
          : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 active:bg-neutral-50'
        }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// Checkbox Item Component - matching admin dashboard
function CheckboxItem({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors min-h-[48px] sm:min-h-0 sm:p-0 sm:mx-0 sm:hover:bg-transparent">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`w-5 h-5 sm:w-4 sm:h-4 rounded border transition-all ${checked
            ? 'bg-terra-500 border-terra-500'
            : 'bg-white border-neutral-300 hover:border-neutral-400'
          }`}>
          {checked && (
            <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-white absolute top-0.5 left-0.5 sm:top-0.5 sm:left-0.5" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-neutral-900">{label}</p>
        <p className="text-[11px] text-neutral-500 leading-relaxed">{description}</p>
      </div>
    </label>
  );
}

export default Profile;
