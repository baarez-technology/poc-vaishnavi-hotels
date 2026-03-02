import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Calendar, Menu, Moon, Search, Settings, Sparkles, Sun, UserCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { IconButton } from '../ui2/IconButton';
import { Button } from '../ui2/Button';
import { apiClient } from '../../api/client';

function useBreadcrumb() {
  const location = useLocation();

  return useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const startIndex = segments[0] === 'admin' ? 1 : 0;

    const labelMap = {
      admin: 'Admin',
      cms: 'CMS',
      cbs: 'Central Booking',
      bookings: 'Bookings',
      calendar: 'Calendar',
      'rate-plans': 'Rate Plans',
      promotions: 'Promotions',
      revenue: 'Revenue',
      inventory: 'Inventory',
      'channel-manager': 'Channel Manager',
      reports: 'Reports',
      settings: 'Settings',
      dashboard: 'Dashboard',
      rooms: 'Rooms',
      guests: 'Guests',
      housekeeping: 'Housekeeping',
      maintenance: 'Maintenance',
      ai: 'AI',
      crm: 'CRM',
      reputation: 'Reputation',
      staff: 'Staff',
    };

    // Pages that should show a parent breadcrumb
    const parentMap = {
      analytics: 'Reports',
    };

    const formatLabel = (segment) =>
      labelMap[segment] ||
      segment
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const items = [];
    for (let i = startIndex; i < segments.length; i++) {
      const s = segments[i];
      if (!Number.isNaN(Number(s))) continue;
      // Add parent breadcrumb if defined
      if (parentMap[s]) {
        items.push(parentMap[s]);
      }
      items.push(formatLabel(s));
    }
    return items;
  }, [location.pathname]);
}

export function AdminTopbar({ onToggleMobileSidebar, onToggleAI, rightSlot }) {
  const { isDark, toggleTheme } = useTheme();
  const breadcrumb = useBreadcrumb();
  const [profileOpen, setProfileOpen] = useState(false);
  const [businessDate, setBusinessDate] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/v1/config/business-date')
      .then(res => setBusinessDate(res.data?.business_date))
      .catch(() => {}); // graceful fallback — badge just won't show
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'h-14',
        'bg-white/70 backdrop-blur-xl',
        'border-b border-neutral-200/70'
      )}
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-3">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <IconButton
            aria-label="Open sidebar"
            className="lg:hidden"
            variant="subtle"
            onClick={onToggleMobileSidebar}
          >
            <Menu className="w-5 h-5 text-neutral-700" />
          </IconButton>

          <nav className="hidden sm:flex items-center gap-2 min-w-0" aria-label="Breadcrumb">
            {breadcrumb.map((item, i) => (
              <div key={`${item}-${i}`} className="flex items-center gap-2 min-w-0">
                {i > 0 && <span className="text-neutral-300">/</span>}
                <span
                  className={cn(
                    'text-xs font-semibold truncate',
                    i === breadcrumb.length - 1 ? 'text-neutral-900' : 'text-neutral-500'
                  )}
                >
                  {item}
                </span>
              </div>
            ))}
          </nav>
        </div>

        {/* Business Date Badge */}
        {businessDate && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">
              {new Date(businessDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Center (optional) */}
        <div className="hidden xl:flex items-center gap-2">{rightSlot}</div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="subtle"
            size="sm"
            className="hidden md:inline-flex h-9 px-3"
            onClick={() => {
              // future: hook to global command palette
            }}
          >
            <Search className="w-4 h-4 text-neutral-600" />
            <span className="text-neutral-600">Search</span>
            <span className="ml-2 text-[10px] font-bold text-neutral-400 border border-neutral-200 rounded-md px-1.5 py-0.5 bg-white">
              ⌘ K
            </span>
          </Button>

          <IconButton aria-label="Toggle theme" variant="subtle" onClick={toggleTheme} title="Theme">
            {isDark ? <Sun className="w-5 h-5 text-neutral-700" /> : <Moon className="w-5 h-5 text-neutral-700" />}
          </IconButton>

          <IconButton aria-label="Settings" variant="subtle" title="Settings">
            <Settings className="w-5 h-5 text-neutral-700" />
          </IconButton>

          <IconButton aria-label="AI Assistant" variant="subtle" title="AI Assistant" onClick={onToggleAI}>
            <Sparkles className="w-5 h-5 text-primary" />
          </IconButton>

          <IconButton aria-label="Notifications" variant="subtle" title="Notifications">
            <div className="relative">
              <Bell className="w-5 h-5 text-neutral-700" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </div>
          </IconButton>

          <div className="relative ml-1">
            <IconButton
              aria-label="Profile"
              variant="outline"
              className="border-neutral-200/80 bg-white/70"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <UserCircle className="w-5 h-5 text-neutral-700" />
            </IconButton>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-neutral-200/80 bg-white shadow-none overflow-hidden z-50 animate-fade-slide-up">
                  <div className="px-4 py-3 border-b border-neutral-100/80">
                    <div className="text-sm font-semibold text-neutral-900">Sarah Admin</div>
                    <div className="text-xs text-neutral-500 mt-0.5">sarah@glimmora.com</div>
                  </div>
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-medium text-neutral-700 transition-colors">
                      View profile
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-50 text-sm font-medium text-neutral-700 transition-colors">
                      Preferences
                    </button>
                  </div>
                  <div className="p-2 border-t border-neutral-100/80">
                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-sm font-semibold text-rose-700 transition-colors">
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}







