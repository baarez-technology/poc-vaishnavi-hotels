import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Play,
  AlertCircle,
  Calendar,
  Loader2
} from 'lucide-react';
import { DashboardHeader } from '../../../layouts/staff-portal/PageHeader';
import Card, { StatCard } from '../../../components/staff-portal/ui/Card';
import { StatusBadge, SeverityBadge } from '../../../components/staff-portal/ui/Badge';
import Button from '../../../components/staff-portal/ui/Button';
import { useStaffProfile, useMyMaintenanceDashboard, useWorkOrders, useEquipmentIssues, useNotifications, useMaintenanceActions } from '@/hooks/staff-portal/useStaffApi';

const MaintenanceDashboard = () => {
  const navigate = useNavigate();
  const { data: profile } = useStaffProfile();
  const { data: dashboard, loading: dashboardLoading } = useMyMaintenanceDashboard();
  const { data: pendingWorkOrders, loading: pendingLoading, refetch: refetchPending } = useWorkOrders({ status: 'pending' });
  const { data: inProgressWorkOrders, loading: inProgressLoading, refetch: refetchInProgress } = useWorkOrders({ status: 'in_progress' });
  const { data: completedWorkOrders } = useWorkOrders({ status: 'completed' });
  const { data: equipmentIssues } = useEquipmentIssues();
  const { data: notifications } = useNotifications();
  const { acceptWorkOrder } = useMaintenanceActions();

  // Combine all work orders
  const workOrders = useMemo(() => {
    return [...(pendingWorkOrders || []), ...(inProgressWorkOrders || []), ...(completedWorkOrders || [])];
  }, [pendingWorkOrders, inProgressWorkOrders, completedWorkOrders]);

  const refetchAll = async () => {
    await Promise.all([refetchPending(), refetchInProgress()]);
  };

  const isLoading = dashboardLoading || pendingLoading || inProgressLoading;

  // Calculate stats from data
  const stats = useMemo(() => ({
    pendingWorkOrders: pendingWorkOrders?.length || 0,
    inProgressWorkOrders: inProgressWorkOrders?.length || 0,
    completedWorkOrders: completedWorkOrders?.length || 0,
    criticalWorkOrders: workOrders.filter(wo => wo.priority === 'critical' && wo.status !== 'completed').length,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    pendingIssues: equipmentIssues?.filter(i => i.status === 'pending').length || 0
  }), [pendingWorkOrders, inProgressWorkOrders, completedWorkOrders, workOrders, equipmentIssues]);

  const recentWorkOrders = useMemo(() => {
    return workOrders
      .filter(wo => wo.status !== 'completed')
      .sort((a, b) => {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (severityOrder[a.priority] || 2) - (severityOrder[b.priority] || 2);
      })
      .slice(0, 4);
  }, [workOrders]);

  const recentActivity = useMemo(() => {
    const activities = workOrders.map(wo => ({
      id: wo.id,
      type: 'work_order',
      title: wo.title,
      status: wo.status,
      timestamp: wo.updated_at || wo.created_at,
      priority: wo.priority
    }));

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [workOrders]);

  const urgentNotifications = useMemo(() => {
    const notificationsList = notifications || [];
    return notificationsList
      .filter(n => !n.is_read && (n.priority === 'urgent' || n.priority === 'high'))
      .slice(0, 3);
  }, [notifications]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStartWorkOrder = async (workOrder: any) => {
    const success = await acceptWorkOrder(workOrder.id);
    if (success) refetchAll();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text-light">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader name={profile?.name} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Open Work Orders"
          value={stats.pendingWorkOrders + stats.inProgressWorkOrders}
          subtitle={`${stats.pendingWorkOrders} pending`}
          icon={Wrench}
          color="primary"
        />
        <StatCard
          title="Critical Issues"
          value={stats.criticalWorkOrders}
          subtitle="Require immediate action"
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="Tasks Due Today"
          value={stats.pendingTasks + stats.inProgressTasks}
          subtitle={`${stats.inProgressTasks} in progress`}
          icon={ClipboardList}
          color="gold"
        />
        <StatCard
          title="Completed This Week"
          value={stats.completedWorkOrders + stats.completedTasks}
          subtitle="Work orders & tasks"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Work Orders */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Recent Work Orders</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/staff/maintenance/work-orders')}
                icon={ChevronRight}
                iconPosition="right"
              >
                View All
              </Button>
            </div>

            {recentWorkOrders.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-light">No open work orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="flex items-center gap-4 p-4 rounded-[12px] bg-neutral hover:bg-neutral-dark transition-colors cursor-pointer"
                    onClick={() => navigate(`/staff/maintenance/work-orders/${wo.id}`)}
                  >
                    <div className={`
                      w-12 h-12 rounded-[10px] flex items-center justify-center flex-shrink-0
                      ${wo.priority === 'critical' ? 'bg-danger-light' :
                        wo.priority === 'high' ? 'bg-warning-light' :
                        'bg-primary/10'}
                    `}>
                      {wo.priority === 'critical' ? (
                        <AlertCircle className="w-6 h-6 text-danger" />
                      ) : (
                        <Wrench className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text truncate">{wo.title}</span>
                        <SeverityBadge severity={wo.priority} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-text-light">
                        <span>{wo.location}</span>
                        <span>•</span>
                        <span>{wo.issue_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {wo.status === 'pending' && (
                        <Button
                          size="sm"
                          icon={Play}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartWorkOrder(wo);
                          }}
                        >
                          Start
                        </Button>
                      )}
                      <StatusBadge status={wo.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-text mb-4">Recent Activity</h2>

            {recentActivity.length === 0 ? (
              <p className="text-text-light text-center py-4">No recent activity</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={`${activity.type}-${activity.id}`} className="relative flex gap-4 pl-10">
                      <div className={`
                        absolute left-2 w-5 h-5 rounded-full flex items-center justify-center
                        ${activity.status === 'completed' ? 'bg-success' :
                          activity.status === 'in_progress' ? 'bg-warning' :
                          'bg-neutral-dark'}
                      `}>
                        {activity.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 text-white" />
                        ) : activity.status === 'in_progress' ? (
                          <Clock className="w-3 h-3 text-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-text-muted" />
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-text">{activity.title}</p>
                            <p className="text-xs text-text-muted capitalize">
                              {activity.type.replace('_', ' ')} • {activity.status.replace('_', ' ')}
                            </p>
                          </div>
                          <span className="text-xs text-text-muted whitespace-nowrap">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Equipment Issues Alert */}
          {stats.pendingIssues > 0 && (
            <Card className="border-warning">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-warning-light flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">Equipment Issues</h3>
                  <p className="text-sm text-text-light">{stats.pendingIssues} pending</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/staff/maintenance/equipment')}
              >
                View Issues
              </Button>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={Wrench}
                onClick={() => navigate('/staff/maintenance/work-orders')}
              >
                View Work Orders
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={ClipboardList}
                onClick={() => navigate('/staff/maintenance/tasks')}
              >
                View Tasks
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={AlertTriangle}
                onClick={() => navigate('/staff/maintenance/equipment')}
              >
                Equipment Issues
              </Button>
            </div>
          </Card>

          {/* Urgent Alerts */}
          {urgentNotifications.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-text mb-4">Urgent Alerts</h2>
              <div className="space-y-3">
                {urgentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-[10px] border-l-3 border-l-danger bg-danger-light/30"
                  >
                    <p className="text-sm font-medium text-text">{notif.title}</p>
                    <p className="text-xs text-text-light mt-0.5 line-clamp-2">{notif.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;





