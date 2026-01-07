import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronDown,
  Clock,
  Building2
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

  // Use auth user data with fallback to profile data
  const displayData = user || profile;

  if (!displayData) return null;

  if (collapsed) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-medium text-sm hover:bg-primary-600 transition-colors"
        >
          {getInitials(displayData.name || displayData.firstName)}
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-[14px] shadow-lg border border-neutral-300 overflow-hidden animate-scale-in z-50">
            <div className="p-4 border-b border-neutral-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-medium">
                  {getInitials(displayData.name || displayData.firstName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">{displayData.name || displayData.firstName}</p>
                  <p className="text-xs text-neutral-600">{getRoleLabel(displayData.role)}</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => { navigate('/staff/profile'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>

              {profile?.clockedIn ? (
                <button
                  onClick={() => { clockOut(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>Clock Out</span>
                  <span className="ml-auto text-xs text-neutral-500">
                    Since {formatClockInTime()}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => { clockIn(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>Clock In</span>
                </button>
              )}

              <div className="h-px bg-neutral-300 my-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 rounded-[12px] hover:bg-neutral-100 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-medium text-sm flex-shrink-0">
          {getInitials(displayData.name || displayData.firstName)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-sm text-neutral-900 truncate">{displayData.name || displayData.firstName}</p>
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Building2 className="w-3 h-3" />
            <span>{getRoleLabel(displayData.role)}</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-[14px] shadow-lg border border-neutral-300 overflow-hidden animate-scale-in z-50">
          <div className="p-3 border-b border-neutral-300">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-neutral-600">
                Shift: {(displayData as any).shiftStart || profile?.shiftStart} - {(displayData as any).shiftEnd || profile?.shiftEnd}
              </span>
            </div>
            {profile?.clockedIn && (
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                <span className="text-green-600 font-medium">
                  Clocked in since {formatClockInTime()}
                </span>
              </div>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={() => { navigate('/staff/profile'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </button>

            <div className="h-px bg-neutral-300 my-2" />

            {profile?.clockedIn ? (
              <button
                onClick={() => { clockOut(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Clock Out</span>
              </button>
            ) : (
              <button
                onClick={() => { clockIn(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Clock In</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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


