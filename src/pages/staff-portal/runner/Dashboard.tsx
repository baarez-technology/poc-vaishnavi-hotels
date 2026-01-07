import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  ChevronRight,
  Play,
  MapPin,
  User,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { DashboardHeader } from '../../../layouts/staff-portal/PageHeader';
import Card, { StatCard } from '../../../components/staff-portal/ui/Card';
import { StatusBadge, PriorityBadge } from '../../../components/staff-portal/ui/Badge';
import Button from '../../../components/staff-portal/ui/Button';
import { useProfile } from '@/hooks/staff-portal/useStaffPortal';
import {
  useMyRunnerDashboard,
  usePickupRequests,
  useDeliveries,
  useNotifications,
  useRunnerActions
} from '@/hooks/staff-portal/useStaffApi';

const RunnerDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();

  // API hooks for real data
  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = useMyRunnerDashboard();
  const { data: pickupRequests, loading: pickupsLoading, refetch: refetchPickups } = usePickupRequests({ status: 'pending' });
  const { data: inProgressPickups, refetch: refetchInProgressPickups } = usePickupRequests({ status: 'in_progress' });
  const { data: deliveriesData, loading: deliveriesLoading, refetch: refetchDeliveries } = useDeliveries({ status: 'pending' });
  const { data: inTransitDeliveries, refetch: refetchInTransitDeliveries } = useDeliveries({ status: 'in_transit' });
  const { data: notifications } = useNotifications({ is_read: false, limit: 10 });
  const { acceptPickup, completePickup, acceptDelivery, completeDelivery, loading: actionLoading } = useRunnerActions();

  // Combine pickups and deliveries
  const allPickups = useMemo(() => {
    return [...(pickupRequests || []), ...(inProgressPickups || [])];
  }, [pickupRequests, inProgressPickups]);

  const allDeliveries = useMemo(() => {
    return [...(deliveriesData || []), ...(inTransitDeliveries || [])];
  }, [deliveriesData, inTransitDeliveries]);

  // Stats from dashboard API
  const stats = useMemo(() => ({
    pendingPickups: dashboardData?.active_pickups || 0,
    inProgressPickups: inProgressPickups?.length || 0,
    urgentPickups: allPickups.filter(p => p.priority === 'urgent').length,
    pendingDeliveries: dashboardData?.active_deliveries || 0,
    inTransitDeliveries: inTransitDeliveries?.length || 0,
    completedPickups: dashboardData?.completed_today || 0,
    deliveredDeliveries: 0,
    totalPickups: allPickups.length,
    totalDeliveries: allDeliveries.length
  }), [dashboardData, allPickups, allDeliveries, inProgressPickups, inTransitDeliveries]);

  const averageCompletionTime = useMemo(() => {
    if (dashboardData?.avg_completion_time) {
      return `${dashboardData.avg_completion_time}m`;
    }
    return '0m';
  }, [dashboardData]);

  const activePickups = useMemo(() => {
    return allPickups
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      })
      .slice(0, 3);
  }, [allPickups]);

  const activeDeliveries = useMemo(() => {
    return allDeliveries
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      })
      .slice(0, 3);
  }, [allDeliveries]);

  const urgentNotifications = useMemo(() => {
    if (!notifications) return [];
    return notifications
      .filter(n => n.notification_type === 'alert' || n.notification_type === 'task_assigned')
      .slice(0, 3);
  }, [notifications]);

  // Refetch data after actions
  const refetchAll = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchPickups(),
      refetchInProgressPickups(),
      refetchDeliveries(),
      refetchInTransitDeliveries()
    ]);
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleAcceptPickup = async (pickup: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await acceptPickup(pickup.id);
    if (success) refetchAll();
  };

  const handleCompletePickup = async (pickup: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await completePickup(pickup.id);
    if (success) refetchAll();
  };

  const handleAcceptDelivery = async (delivery: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await acceptDelivery(delivery.id);
    if (success) refetchAll();
  };

  const handleCompleteDelivery = async (delivery: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await completeDelivery(delivery.id);
    if (success) refetchAll();
  };

  // Show loading state
  const isLoading = dashboardLoading || pickupsLoading || deliveriesLoading;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'luggage':
        return '🧳';
      case 'laundry':
        return '👔';
      case 'amenity_request':
        return '🎁';
      case 'room_service':
        return '🍽️';
      case 'package':
        return '📦';
      default:
        return '📋';
    }
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
          title="Active Pickups"
          value={stats.pendingPickups + stats.inProgressPickups}
          subtitle={`${stats.urgentPickups} urgent`}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="Active Deliveries"
          value={stats.pendingDeliveries + stats.inTransitDeliveries}
          subtitle={`${stats.inTransitDeliveries} in transit`}
          icon={Truck}
          color="teal"
        />
        <StatCard
          title="Avg Completion Time"
          value={averageCompletionTime}
          subtitle="Per delivery"
          icon={Clock}
          color="gold"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedPickups + stats.deliveredDeliveries}
          subtitle="Pickups & deliveries"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Requests */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-text">Active Pickups</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/staff/runner/pickups')}
                icon={ChevronRight}
                iconPosition="right"
              >
                View All
              </Button>
            </div>

            {activePickups.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-light">No active pickups</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activePickups.map((pickup) => (
                  <div
                    key={pickup.id}
                    className={`
                      p-4 rounded-[12px] transition-colors
                      ${pickup.priority === 'urgent' ? 'bg-danger-light/30 border border-danger/20' :
                        pickup.status === 'in_progress' ? 'bg-warning-light/30' :
                        'bg-neutral hover:bg-neutral-dark'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getTypeIcon(pickup.pickup_type)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-text">Room {pickup.room_number}</span>
                          <StatusBadge status={pickup.status} />
                          {pickup.priority !== 'normal' && <PriorityBadge priority={pickup.priority} />}
                        </div>

                        <p className="text-sm text-text-light mt-1 truncate">{pickup.items_description}</p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{pickup.guest_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(pickup.scheduled_time)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {pickup.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(e) => handleAcceptPickup(pickup, e)}
                            disabled={actionLoading}
                          >
                            Accept
                          </Button>
                        )}
                        {pickup.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={(e) => handleCompletePickup(pickup, e)}
                            disabled={actionLoading}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Deliveries */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal" />
                <h2 className="text-lg font-semibold text-text">Active Deliveries</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/staff/runner/deliveries')}
                icon={ChevronRight}
                iconPosition="right"
              >
                View All
              </Button>
            </div>

            {activeDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-light">No active deliveries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className={`
                      p-4 rounded-[12px] transition-colors
                      ${delivery.status === 'in_transit' ? 'bg-info-light/30 border border-info/20' :
                        'bg-neutral hover:bg-neutral-dark'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getTypeIcon(delivery.delivery_type)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-text">Room {delivery.room_number}</span>
                          <StatusBadge status={delivery.status} />
                          {delivery.priority !== 'normal' && <PriorityBadge priority={delivery.priority} />}
                        </div>

                        <p className="text-sm text-text-light mt-1 truncate">{delivery.items_description}</p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{delivery.origin_location} → {delivery.destination_location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>ETA: {formatTime(delivery.estimated_delivery_time)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {delivery.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(e) => handleAcceptDelivery(delivery, e)}
                            disabled={actionLoading}
                          >
                            Accept
                          </Button>
                        )}
                        {delivery.status === 'in_transit' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={(e) => handleCompleteDelivery(delivery, e)}
                            disabled={actionLoading}
                          >
                            Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={Package}
                onClick={() => navigate('/staff/runner/pickups')}
              >
                View All Pickups
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={Truck}
                onClick={() => navigate('/staff/runner/deliveries')}
              >
                View All Deliveries
              </Button>
            </div>
          </Card>

          {/* Stats Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-text mb-4">Today's Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-text-light">Total Pickups</span>
                </div>
                <span className="font-semibold text-text">{stats.totalPickups}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-teal" />
                  </div>
                  <span className="text-sm text-text-light">Total Deliveries</span>
                </div>
                <span className="font-semibold text-text">{stats.totalDeliveries}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-sm text-text-light">Completed</span>
                </div>
                <span className="font-semibold text-text">
                  {stats.completedPickups + stats.deliveredDeliveries}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-warning-light flex items-center justify-center">
                    <Clock className="w-4 h-4 text-warning" />
                  </div>
                  <span className="text-sm text-text-light">In Progress</span>
                </div>
                <span className="font-semibold text-text">
                  {stats.inProgressPickups + stats.inTransitDeliveries}
                </span>
              </div>
            </div>
          </Card>

          {/* Urgent Alerts */}
          {urgentNotifications.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <h2 className="text-lg font-semibold text-text">Urgent Alerts</h2>
              </div>
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

export default RunnerDashboard;





