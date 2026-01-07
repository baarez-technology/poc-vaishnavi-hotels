/**
 * StaffTabs Component
 * Tab navigation for staff - Glimmora Design System v5.0
 * Pill style matching Channel Manager Promotions page
 */

import { Users, UserCheck, Home, Wrench, Shield } from 'lucide-react';

export default function StaffTabs({ activeTab, onTabChange, counts }) {
  const tabs = [
    { id: 'all', label: 'All Staff', icon: Users, count: counts?.all },
    { id: 'frontdesk', label: 'Front Desk', icon: UserCheck, count: counts?.frontdesk },
    { id: 'housekeeping', label: 'Housekeeping', icon: Home, count: counts?.housekeeping },
    { id: 'management', label: 'Management', icon: Shield, count: counts?.management },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, count: counts?.maintenance }
  ];

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-semibold rounded-md transition-all ${
              isActive
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count !== null && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
                isActive ? 'bg-terra-500 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
