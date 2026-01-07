/**
 * GuestsTabs Component
 * Tab navigation for guests - Glimmora Design System v5.0
 * Underline style matching Bookings tabs
 */

import { Users, RefreshCw, Star, UserX } from 'lucide-react';

export default function GuestsTabs({ activeTab, onTabChange, counts }) {
  const tabs = [
    { id: 'all', label: 'All Guests', icon: Users, count: counts?.all },
    { id: 'returning', label: 'Returning', icon: RefreshCw, count: counts?.returning },
    { id: 'vip', label: 'VIP', icon: Star, count: counts?.vip },
    { id: 'blacklisted', label: 'Blacklisted', icon: UserX, count: counts?.blacklisted }
  ];

  return (
    <div className="flex items-center gap-0.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-3 text-[13px] font-semibold transition-all duration-150 ${
              isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                    isActive ? 'bg-terra-500 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-terra-500 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
