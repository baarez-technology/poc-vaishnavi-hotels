import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronDown,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/staff-portal/useStaffPortal';

interface ProfileMenuProps {
  collapsed?: boolean;
}

export default function ProfileMenu({ collapsed = false }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, clockIn, clockOut } = useProfile();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      housekeeping: 'Housekeeping',
      maintenance: 'Maintenance',
      runner: 'Runner'
    };
    return labels[role || ''] || role || '';
  };

  const formatClockInTime = () => {
    if (!profile?.clockInTime) return null;
    const time = new Date(profile.clockInTime);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/staff/login', { replace: true });
  };

  const displayData = user || profile;

  if (!displayData) return null;

  // Collapsed mode - circular avatar button
  if (collapsed) {
    return (
      <div ref={menuRef} className="relative flex justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-terra-500 to-terra-600 text-white text-xs font-medium hover:shadow-md transition-all duration-150"
        >
          {getInitials(displayData.name || displayData.firstName)}
        </button>

        {/* Collapsed Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden z-50">
            {/* User Info Header */}
            <div className="p-3 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-terra-500 to-terra-600 text-white flex items-center justify-center text-xs font-medium">
                  {getInitials(displayData.name || displayData.firstName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {displayData.name || displayData.firstName}
                  </p>
                  <p className="text-[11px] text-neutral-500">{getRoleLabel(displayData.role)}</p>
                </div>
              </div>
              {profile?.clockedIn && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-600 font-medium">
                    Clocked in since {formatClockInTime()}
                  </span>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-1.5">
              <button
                onClick={() => { navigate('/staff/profile'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800 rounded-md transition-colors"
              >
                <User className="w-4 h-4 text-neutral-400" />
                <span>My Profile</span>
              </button>

              <div className="h-px bg-neutral-100 my-1.5" />

              {profile?.clockedIn ? (
                <button
                  onClick={() => { clockOut(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>Clock Out</span>
                </button>
              ) : (
                <button
                  onClick={() => { clockIn(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-green-600 hover:bg-green-50 rounded-md transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>Clock In</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded mode - full profile card
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-150 ${
          isOpen
            ? 'bg-neutral-50 border-neutral-200'
            : 'bg-white border-neutral-100 hover:bg-neutral-50 hover:border-neutral-200'
        }`}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-terra-500 to-terra-600 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          {getInitials(displayData.name || displayData.firstName)}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-neutral-800 truncate">
            {displayData.name || displayData.firstName}
          </p>
          <div className="flex items-center gap-1.5">
            {profile?.clockedIn && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
            <p className="text-[11px] text-neutral-500">{getRoleLabel(displayData.role)}</p>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-150 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Expanded Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden z-50">
          {/* Shift Info Header */}
          <div className="p-3 border-b border-neutral-100 bg-neutral-50">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-terra-500" />
              <span className="text-neutral-600">
                Shift: {(displayData as any).shiftStart || profile?.shiftStart || '9:00 AM'} - {(displayData as any).shiftEnd || profile?.shiftEnd || '5:00 PM'}
              </span>
            </div>
            {profile?.clockedIn && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-600 font-medium">
                  Clocked in since {formatClockInTime()}
                </span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-1.5">
            <button
              onClick={() => { navigate('/staff/profile'); setIsOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800 rounded-md transition-colors"
            >
              <User className="w-4 h-4 text-neutral-400" />
              <span>My Profile</span>
            </button>

            <div className="h-px bg-neutral-100 my-1.5" />

            {profile?.clockedIn ? (
              <button
                onClick={() => { clockOut(); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Clock Out</span>
              </button>
            ) : (
              <button
                onClick={() => { clockIn(); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-green-600 hover:bg-green-50 rounded-md transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Clock In</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
