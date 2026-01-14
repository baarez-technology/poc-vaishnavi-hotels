/**
 * HousekeepingTabs Component
 * Tab navigation for housekeeping - Glimmora Design System v5.0
 * Underline style matching CMS Bookings pattern
 */

import { Home, AlertTriangle, Clock, CheckCircle, XCircle, Users, Building } from 'lucide-react';

export default function HousekeepingTabs({ activeTab, onTabChange, counts }) {
  const tabs = [
    { id: 'all', label: 'All Rooms', icon: Home, count: counts.total },
    { id: 'dirty', label: 'Dirty', icon: AlertTriangle, count: counts.dirty },
    { id: 'in_progress', label: 'In Progress', icon: Clock, count: counts.in_progress },
    { id: 'clean', label: 'Clean', icon: CheckCircle, count: counts.clean },
    { id: 'inspected', label: 'Inspected', icon: CheckCircle, count: counts.inspected },
    { id: 'out_of_service', label: 'Out of Service', icon: XCircle, count: counts.out_of_service },
    { id: 'by-staff', label: 'By Staff', icon: Users, count: null },
    { id: 'by-floor', label: 'By Floor', icon: Building, count: null }
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
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                  isActive ? 'bg-terra-500 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
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
