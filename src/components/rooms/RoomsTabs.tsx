/**
 * RoomsTabs Component
 * Tab navigation for rooms - Glimmora Design System v5.0
 * Pill style matching Channel Manager Promotions page
 */

import { Home, Check, Users, AlertTriangle, XCircle } from 'lucide-react';

export default function RoomsTabs({ activeTab, onTabChange, counts }) {
  const tabs = [
    { id: 'all', label: 'All Rooms', icon: Home, count: counts?.all },
    { id: 'available', label: 'Available', icon: Check, count: counts?.available },
    { id: 'occupied', label: 'Occupied', icon: Users, count: counts?.occupied },
    { id: 'dirty', label: 'Dirty', icon: AlertTriangle, count: counts?.dirty },
    { id: 'out_of_service', label: 'Out of Service', icon: XCircle, count: counts?.out_of_service }
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
