import { useState, useMemo } from 'react';
import {
  Truck,
  Clock,
  CheckCircle,
  User,
  MapPin,
  MessageSquare,
  ArrowRight,
  Loader2
} from 'lucide-react';
import PageHeader from '../../../layouts/staff-portal/PageHeader';
import Card from '../../../components/staff-portal/ui/Card';
import { StatusBadge, PriorityBadge } from '../../../components/staff-portal/ui/Badge';
import Button from '../../../components/staff-portal/ui/Button';
import { SearchInput } from '../../../components/staff-portal/ui/Input';
import { useDeliveries, useRunnerActions } from '@/hooks/staff-portal/useStaffApi';

const Deliveries = () => {
  // API hooks for real data
  const { data: pendingDeliveries, loading: pendingLoading, refetch: refetchPending } = useDeliveries({ status: 'pending' });
  const { data: inTransitDeliveries, loading: inTransitLoading, refetch: refetchInTransit } = useDeliveries({ status: 'in_transit' });
  const { data: deliveredDeliveries, loading: deliveredLoading, refetch: refetchDelivered } = useDeliveries({ status: 'delivered' });
  const { acceptDelivery, completeDelivery, loading: actionLoading } = useRunnerActions();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine all deliveries
  const allDeliveries = useMemo(() => {
    return [...(pendingDeliveries || []), ...(inTransitDeliveries || []), ...(deliveredDeliveries || [])];
  }, [pendingDeliveries, inTransitDeliveries, deliveredDeliveries]);

  // Stats
  const stats = useMemo(() => ({
    pendingDeliveries: pendingDeliveries?.length || 0,
    inTransitDeliveries: inTransitDeliveries?.length || 0,
    deliveredDeliveries: deliveredDeliveries?.length || 0
  }), [pendingDeliveries, inTransitDeliveries, deliveredDeliveries]);

  const filteredDeliveries = useMemo(() => {
    return allDeliveries.filter(delivery => {
      const matchesSearch =
        delivery.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.items_description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
      const statusOrder: Record<string, number> = { pending: 0, in_transit: 1, delivered: 2 };

      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
  }, [allDeliveries, searchQuery, statusFilter]);

  const refetchAll = async () => {
    await Promise.all([refetchPending(), refetchInTransit(), refetchDelivered()]);
  };

  const isLoading = pendingLoading || inTransitLoading || deliveredLoading;

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      room_service: 'Room Service',
      package: 'Package',
      laundry: 'Laundry Return',
      amenity: 'Amenity',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'room_service':
        return '🍽️';
      case 'package':
        return '📦';
      case 'laundry':
        return '👔';
      case 'amenity':
        return '🎁';
      default:
        return '📋';
    }
  };

  const handleAccept = async (delivery: any) => {
    const success = await acceptDelivery(delivery.id);
    if (success) refetchAll();
  };

  const handleComplete = async (delivery: any) => {
    const success = await completeDelivery(delivery.id);
    if (success) refetchAll();
  };

  const getDeliveryTimeDiff = (estimatedDelivery: string) => {
    if (!estimatedDelivery) return null;
    const estimated = new Date(estimatedDelivery);
    const now = new Date();
    const diffMs = estimated.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return { text: `${Math.abs(diffMins)}m overdue`, isLate: true };
    if (diffMins === 0) return { text: 'Due now', isLate: false };
    return { text: `${diffMins}m remaining`, isLate: false };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text-light">Loading deliveries...</span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle={`${stats.pendingDeliveries + stats.inTransitDeliveries} active deliveries`}
      />

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'pending' ? 'bg-warning-light ring-2 ring-warning' : 'bg-white border border-border hover:border-warning'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-2xl font-bold text-text">{stats.pendingDeliveries}</span>
          </div>
          <p className="text-sm text-text-light mt-1">Pending</p>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'in_transit' ? 'bg-info-light ring-2 ring-info' : 'bg-white border border-border hover:border-info'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'in_transit' ? 'all' : 'in_transit')}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-info" />
            <span className="text-2xl font-bold text-text">{stats.inTransitDeliveries}</span>
          </div>
          <p className="text-sm text-text-light mt-1">In Transit</p>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'delivered' ? 'bg-success-light ring-2 ring-success' : 'bg-white border border-border hover:border-success'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered')}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-text">{stats.deliveredDeliveries}</span>
          </div>
          <p className="text-sm text-text-light mt-1">Delivered</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search deliveries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Card className="text-center py-12">
          <Truck className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No deliveries found</h3>
          <p className="text-text-light">New deliveries will appear here</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => {
            const timeDiff = getDeliveryTimeDiff(delivery.estimated_delivery_time);

            return (
              <Card key={delivery.id} className="relative overflow-hidden">
                {/* Status indicator */}
                {delivery.status === 'in_transit' && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-info" />
                )}

                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className="text-3xl flex-shrink-0">{getTypeIcon(delivery.delivery_type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-semibold text-text">Room {delivery.room_number}</span>
                          <span className="text-sm text-teal font-medium">{getTypeLabel(delivery.delivery_type)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={delivery.status} />
                          {delivery.priority !== 'normal' && <PriorityBadge priority={delivery.priority} />}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {delivery.status === 'pending' && (
                          <Button onClick={() => handleAccept(delivery)}>
                            Accept
                          </Button>
                        )}
                        {delivery.status === 'in_transit' && (
                          <Button variant="success" onClick={() => handleComplete(delivery)}>
                            Mark Delivered
                          </Button>
                        )}
                        {delivery.status === 'delivered' && (
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Delivered</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-3 p-3 bg-neutral rounded-[10px]">
                      <p className="text-sm font-medium text-text">Items:</p>
                      <p className="text-sm text-text-light">{delivery.items_description}</p>
                    </div>

                    {/* Route */}
                    <div className="mt-4 p-3 bg-teal/5 rounded-[10px] border border-teal/20">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-text-muted">From</p>
                          <p className="text-sm font-medium text-text">{delivery.origin_location}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-teal flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-text-muted">To</p>
                          <p className="text-sm font-medium text-text">{delivery.destination_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-text-muted" />
                        <div>
                          <p className="text-text-muted text-xs">Guest</p>
                          <p className="text-text font-medium">{delivery.guest_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-text-muted" />
                        <div>
                          <p className="text-text-muted text-xs">ETA</p>
                          <p className="text-text font-medium">{formatTime(delivery.estimated_delivery_time)}</p>
                        </div>
                      </div>

                      {delivery.status !== 'delivered' && timeDiff && (
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${timeDiff.isLate ? 'text-danger' : 'text-success'}`} />
                          <div>
                            <p className="text-text-muted text-xs">Time Status</p>
                            <p className={`font-medium ${timeDiff.isLate ? 'text-danger' : 'text-success'}`}>
                              {timeDiff.text}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Special Instructions */}
                    {delivery.special_instructions && (
                      <div className="mt-4 p-3 bg-gold/10 rounded-[10px] border border-gold/20">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4 text-gold" />
                          <span className="text-xs font-medium text-gold">Special Instructions</span>
                        </div>
                        <p className="text-sm text-text-light">{delivery.special_instructions}</p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-text-muted">
                      <div className="flex items-center gap-4">
                        <span>Ordered: {formatDate(delivery.ordered_at)}</span>
                        {delivery.assigned_to_name && (
                          <span>Runner: <span className="text-text font-medium">{delivery.assigned_to_name}</span></span>
                        )}
                      </div>
                      {delivery.delivered_at && (
                        <span className="text-success">Delivered: {formatDate(delivery.delivered_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Deliveries;





