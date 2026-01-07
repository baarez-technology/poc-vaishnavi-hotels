import { useMemo } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  XCircle,
  TrendingUp,
  Package
} from 'lucide-react';
import { calculateMaintenanceKPIs } from '../../utils/maintenance';

export default function WOKPI({ workOrders, technicians, rooms, inventory }) {
  const kpis = useMemo(() => {
    const metrics = calculateMaintenanceKPIs(workOrders, technicians, rooms);

    // Calculate low stock items
    const lowStockCount = inventory?.filter(item => item.stockLevel <= item.minStock).length || 0;

    return { ...metrics, lowStockCount };
  }, [workOrders, technicians, rooms, inventory]);

  const kpiCards = [
    {
      label: 'Total Work Orders',
      value: kpis.total,
      icon: Wrench,
      bgColor: 'bg-[#A57865]/10',
      iconColor: 'text-[#A57865]',
      borderColor: 'border-[#A57865]/20'
    },
    {
      label: 'Open',
      value: kpis.open,
      icon: Clock,
      bgColor: 'bg-[#CDB261]/10',
      iconColor: 'text-[#CDB261]',
      borderColor: 'border-[#CDB261]/20'
    },
    {
      label: 'In Progress',
      value: kpis.inProgress,
      icon: TrendingUp,
      bgColor: 'bg-[#5C9BA4]/10',
      iconColor: 'text-[#5C9BA4]',
      borderColor: 'border-[#5C9BA4]/20'
    },
    {
      label: 'Completed',
      value: kpis.completed,
      icon: CheckCircle,
      bgColor: 'bg-[#5C9BA4]/10',
      iconColor: 'text-[#5C9BA4]',
      borderColor: 'border-[#5C9BA4]/20'
    },
    {
      label: 'High Priority',
      value: kpis.highPriority,
      icon: AlertTriangle,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      highlight: kpis.highPriority > 0
    },
    {
      label: 'Avg Resolution',
      value: `${kpis.avgResolutionTime}h`,
      icon: Clock,
      bgColor: 'bg-neutral-50',
      iconColor: 'text-neutral-600',
      borderColor: 'border-neutral-200'
    },
    {
      label: 'Techs On Duty',
      value: kpis.techsOnDuty,
      icon: Users,
      bgColor: 'bg-[#5C9BA4]/10',
      iconColor: 'text-[#5C9BA4]',
      borderColor: 'border-[#5C9BA4]/20'
    },
    {
      label: 'Rooms OOO',
      value: kpis.roomsOOO,
      icon: XCircle,
      bgColor: kpis.roomsOOO > 0 ? 'bg-rose-50' : 'bg-neutral-50',
      iconColor: kpis.roomsOOO > 0 ? 'text-rose-600' : 'text-neutral-600',
      borderColor: kpis.roomsOOO > 0 ? 'border-rose-200' : 'border-neutral-200',
      highlight: kpis.roomsOOO > 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {kpiCards.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded-[10px] p-6"
        >
          {/* Header with Icon and Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
              <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              {kpi.label}
            </p>
          </div>

          {/* Value Row */}
          <div className="flex items-center justify-between">
            <p className="text-[28px] font-semibold tracking-tight text-neutral-900">
              {kpi.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
