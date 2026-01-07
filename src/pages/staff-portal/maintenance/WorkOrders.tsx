import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  MapPin,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import PageHeader from '../../../layouts/staff-portal/PageHeader';
import Card from '../../../components/staff-portal/ui/Card';
import { StatusBadge, SeverityBadge } from '../../../components/staff-portal/ui/Badge';
import Button, { ButtonGroup, ButtonGroupItem } from '../../../components/staff-portal/ui/Button';
import { SearchInput, Select, Textarea } from '../../../components/staff-portal/ui/Input';
import Input from '../../../components/staff-portal/ui/Input';
import { FormModal } from '../../../components/staff-portal/ui/Modal';
import { useWorkOrders, useMaintenanceActions, useStaffProfile } from '@/hooks/staff-portal/useStaffApi';

const WorkOrders = () => {
  const navigate = useNavigate();
  const { data: profile } = useStaffProfile();

  // API hooks for real data
  const { data: pendingWorkOrders, loading: pendingLoading, refetch: refetchPending } = useWorkOrders({ status: 'pending' });
  const { data: inProgressWorkOrders, loading: inProgressLoading, refetch: refetchInProgress } = useWorkOrders({ status: 'in_progress' });
  const { data: completedWorkOrders, loading: completedLoading, refetch: refetchCompleted } = useWorkOrders({ status: 'completed' });
  const { acceptWorkOrder, completeWorkOrder, loading: actionLoading } = useMaintenanceActions();

  // Combine all work orders
  const workOrders = useMemo(() => {
    return [...(pendingWorkOrders || []), ...(inProgressWorkOrders || []), ...(completedWorkOrders || [])];
  }, [pendingWorkOrders, inProgressWorkOrders, completedWorkOrders]);

  // Stats
  const stats = useMemo(() => ({
    pendingWorkOrders: pendingWorkOrders?.length || 0,
    inProgressWorkOrders: inProgressWorkOrders?.length || 0,
    completedWorkOrders: completedWorkOrders?.length || 0
  }), [pendingWorkOrders, inProgressWorkOrders, completedWorkOrders]);

  const refetchAll = async () => {
    await Promise.all([refetchPending(), refetchInProgress(), refetchCompleted()]);
  };

  const isLoading = pendingLoading || inProgressLoading || completedLoading;

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [newWorkOrder, setNewWorkOrder] = useState({
    title: '',
    description: '',
    location: '',
    room: '',
    issueType: 'General',
    severity: 'medium',
    estimatedHours: 1
  });

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      const matchesSearch =
        wo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const statusOrder: Record<string, number> = { in_progress: 0, pending: 1, completed: 2 };

      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return (severityOrder[a.priority] || 2) - (severityOrder[b.priority] || 2);
    });
  }, [workOrders, searchQuery, statusFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleAddWorkOrder = () => {
    addWorkOrder({
      ...newWorkOrder,
      status: 'pending',
      reportedBy: profile?.name || 'Staff',
      assignedTo: profile?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + newWorkOrder.estimatedHours * 3600000).toISOString(),
      comments: [],
      photos: [],
      parts: []
    });
    setNewWorkOrder({
      title: '',
      description: '',
      location: '',
      room: '',
      issueType: 'General',
      severity: 'medium',
      estimatedHours: 1
    });
    setShowAddModal(false);
  };

  const handleAddComment = () => {
    if (selectedWorkOrder && newComment.trim()) {
      addWorkOrderComment(selectedWorkOrder.id, {
        author: profile?.name || 'Staff',
        text: newComment
      });
      setNewComment('');
      setShowCommentModal(false);
      setSelectedWorkOrder(null);
    }
  };

  const handleStartWorkOrder = async (wo: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await acceptWorkOrder(wo.id);
    if (success) refetchAll();
  };

  const handleCompleteWorkOrder = async (wo: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await completeWorkOrder(wo.id);
    if (success) refetchAll();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text-light">Loading work orders...</span>
      </div>
    );
  }

  const issueTypeOptions = [
    { value: 'General', label: 'General' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'Plumbing', label: 'Plumbing' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Elevator', label: 'Elevator' },
    { value: 'Structural', label: 'Structural' },
    { value: 'Appliance', label: 'Appliance' },
    { value: 'Safety', label: 'Safety' }
  ];

  const severityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  return (
    <div>
      <PageHeader
        title="Work Orders"
        subtitle={`${stats.pendingWorkOrders + stats.inProgressWorkOrders} open work orders`}
        actions={
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Create Work Order
          </Button>
        }
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
            <span className="text-2xl font-bold text-text">{stats.pendingWorkOrders}</span>
          </div>
          <p className="text-sm text-text-light mt-1">Pending</p>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'in_progress' ? 'bg-primary/10 ring-2 ring-primary' : 'bg-white border border-border hover:border-primary'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-text">{stats.inProgressWorkOrders}</span>
          </div>
          <p className="text-sm text-text-light mt-1">In Progress</p>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'completed' ? 'bg-success-light ring-2 ring-success' : 'bg-white border border-border hover:border-success'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-text">{stats.completedWorkOrders}</span>
          </div>
          <p className="text-sm text-text-light mt-1">Completed</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search work orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Work Orders List */}
      {filteredWorkOrders.length === 0 ? (
        <Card className="text-center py-12">
          <Wrench className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No work orders found</h3>
          <p className="text-text-light mb-4">Create a new work order to get started</p>
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Create Work Order
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkOrders.map((wo) => (
            <Card key={wo.id} className="relative overflow-hidden">
              {/* Severity indicator */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                wo.priority === 'critical' ? 'bg-danger' :
                wo.priority === 'high' ? 'bg-warning' :
                wo.priority === 'medium' ? 'bg-gold' :
                'bg-info'
              }`} />

              <div className="pl-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
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

                    <div>
                      <h3 className="font-semibold text-text">{wo.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <SeverityBadge severity={wo.priority} />
                        <StatusBadge status={wo.status} />
                        <span className="text-sm text-text-light">{wo.issue_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {wo.status === 'pending' && (
                      <Button
                        size="sm"
                        icon={Play}
                        onClick={(e) => handleStartWorkOrder(wo, e)}
                      >
                        Start
                      </Button>
                    )}
                    {wo.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="success"
                        icon={CheckCircle}
                        onClick={(e) => handleCompleteWorkOrder(wo, e)}
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={MessageSquare}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkOrder(wo);
                        setShowCommentModal(true);
                      }}
                    >
                      {wo.comments?.length || 0}
                    </Button>
                  </div>
                </div>

                {wo.description && (
                  <p className="text-sm text-text-light mb-4 line-clamp-2">{wo.description}</p>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-text-muted" />
                    <span className="text-text-light">{wo.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-text-muted" />
                    <span className="text-text-light">{wo.assigned_to_name || 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-muted" />
                    <span className="text-text-light">Reported: {formatDate(wo.reported_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span className="text-text-light">Room: {wo.room_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Recent Comments */}
                {wo.comments && wo.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-text-muted mb-2">Latest comment:</p>
                    <div className="bg-neutral p-3 rounded-[10px]">
                      <p className="text-sm text-text">{wo.comments[wo.comments.length - 1].text}</p>
                      <p className="text-xs text-text-muted mt-1">
                        — {wo.comments[wo.comments.length - 1].author}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Work Order Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddWorkOrder}
        title="Create Work Order"
        submitText="Create"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Brief description of the issue"
            value={newWorkOrder.title}
            onChange={(e) => setNewWorkOrder({ ...newWorkOrder, title: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="Detailed description of the problem..."
            value={newWorkOrder.description}
            onChange={(e) => setNewWorkOrder({ ...newWorkOrder, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location"
              placeholder="e.g., Room 305, Lobby"
              value={newWorkOrder.location}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, location: e.target.value })}
              required
            />

            <Input
              label="Room Number (if applicable)"
              placeholder="e.g., 305"
              value={newWorkOrder.room}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, room: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Issue Type"
              options={issueTypeOptions}
              value={newWorkOrder.issueType}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, issueType: e.target.value })}
            />

            <Select
              label="Severity"
              options={severityOptions}
              value={newWorkOrder.severity}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, severity: e.target.value })}
            />
          </div>

          <Input
            label="Estimated Hours"
            type="number"
            min={0.5}
            step={0.5}
            value={newWorkOrder.estimatedHours}
            onChange={(e) => setNewWorkOrder({ ...newWorkOrder, estimatedHours: parseFloat(e.target.value) || 1 })}
          />
        </div>
      </FormModal>

      {/* Comment Modal */}
      <FormModal
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setSelectedWorkOrder(null);
          setNewComment('');
        }}
        onSubmit={handleAddComment}
        title="Add Comment"
        subtitle={selectedWorkOrder?.title}
        submitText="Add Comment"
        size="default"
      >
        <div className="space-y-4">
          {/* Existing Comments */}
          {selectedWorkOrder?.comments && selectedWorkOrder.comments.length > 0 && (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {selectedWorkOrder.comments.map((comment: any) => (
                <div key={comment.id} className="p-3 bg-neutral rounded-[10px]">
                  <p className="text-sm text-text">{comment.text}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {comment.author} • {formatDate(comment.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Textarea
            label="New Comment"
            placeholder="Add your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
        </div>
      </FormModal>
    </div>
  );
};

export default WorkOrders;





