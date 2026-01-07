import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Play,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  RefreshCw,
  Square,
  CheckSquare
} from 'lucide-react';
import PageHeader from '../../../layouts/staff-portal/PageHeader';
import Card from '../../../components/staff-portal/ui/Card';
import { StatusBadge, PriorityBadge } from '../../../components/staff-portal/ui/Badge';
import Button from '../../../components/staff-portal/ui/Button';
import { SearchInput, Select, Textarea } from '../../../components/staff-portal/ui/Input';
import Input from '../../../components/staff-portal/ui/Input';
import { FormModal } from '../../../components/staff-portal/ui/Modal';
import { useMaintenance, useProfile } from '@/hooks/staff-portal/useStaffPortal';

const MaintenanceTasks = () => {
  const { profile } = useProfile();
  const { tasks, addMTTask, updateMTTask, updateMTTaskStatus, updateMTTaskChecklist, stats } = useMaintenance();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    location: '',
    category: 'general',
    priority: 'normal',
    recurring: false,
    recurringSchedule: 'weekly'
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
      const statusOrder: Record<string, number> = { in_progress: 0, todo: 1, completed: 2 };

      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, searchQuery, statusFilter]);

  const tasksByStatus = useMemo(() => ({
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed')
  }), [tasks]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getChecklistProgress = (checklist: any[]) => {
    if (!checklist || checklist.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = checklist.filter(c => c.completed).length;
    return {
      completed,
      total: checklist.length,
      percentage: Math.round((completed / checklist.length) * 100)
    };
  };

  const handleAddTask = () => {
    addMTTask({
      ...newTask,
      status: 'todo',
      assignedTo: profile?.name,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      checklist: [
        { id: 'ck1', item: 'Initial inspection', completed: false },
        { id: 'ck2', item: 'Perform maintenance', completed: false },
        { id: 'ck3', item: 'Test operation', completed: false },
        { id: 'ck4', item: 'Document findings', completed: false }
      ]
    });
    setNewTask({
      title: '',
      description: '',
      location: '',
      category: 'general',
      priority: 'normal',
      recurring: false,
      recurringSchedule: 'weekly'
    });
    setShowAddModal(false);
  };

  const handleStartTask = (task: any) => {
    updateMTTaskStatus(task.id, 'in_progress');
  };

  const handleCompleteTask = (task: any) => {
    updateMTTaskStatus(task.id, 'completed');
  };

  const handleChecklistToggle = (taskId: string, checklistId: string, completed: boolean) => {
    updateMTTaskChecklist(taskId, checklistId, completed);
  };

  const categoryOptions = [
    { value: 'general', label: 'General Maintenance' },
    { value: 'safety', label: 'Safety Inspection' },
    { value: 'equipment', label: 'Equipment Maintenance' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'preventive', label: 'Preventive Maintenance' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' }
  ];

  const scheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  return (
    <div>
      <PageHeader
        title="Maintenance Tasks"
        subtitle={`${stats.pendingTasks + stats.inProgressTasks} tasks pending`}
        actions={
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Task
          </Button>
        }
      />

      {/* Kanban-style Status View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'todo' ? 'bg-beige/30 ring-2 ring-beige' : 'bg-white border border-border hover:border-beige'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'todo' ? 'all' : 'todo')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Square className="w-5 h-5 text-beige" />
              <span className="font-semibold text-text">To Do</span>
            </div>
            <span className="text-xl font-bold text-text">{tasksByStatus.todo.length}</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'in_progress' ? 'bg-warning-light ring-2 ring-warning' : 'bg-white border border-border hover:border-warning'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              <span className="font-semibold text-text">In Progress</span>
            </div>
            <span className="text-xl font-bold text-text">{tasksByStatus.in_progress.length}</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-[14px] cursor-pointer transition-all ${
            statusFilter === 'completed' ? 'bg-success-light ring-2 ring-success' : 'bg-white border border-border hover:border-success'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-semibold text-text">Completed</span>
            </div>
            <span className="text-xl font-bold text-text">{tasksByStatus.completed.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No tasks found</h3>
          <p className="text-text-light mb-4">Create a new task to get started</p>
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Task
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const progress = getChecklistProgress(task.checklist);
            const isExpanded = expandedTask === task.id;

            return (
              <Card key={task.id} className="overflow-hidden">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${task.status === 'completed' ? 'bg-success-light' :
                      task.status === 'in_progress' ? 'bg-warning-light' :
                      'bg-neutral-dark'}
                  `}>
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-warning" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-text-muted" />
                    )}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-semibold text-text ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                          {task.recurring && (
                            <span className="inline-flex items-center gap-1 text-xs text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                              <RefreshCw className="w-3 h-3" />
                              {task.recurringSchedule}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.status === 'todo' && (
                          <Button
                            size="sm"
                            icon={Play}
                            onClick={() => handleStartTask(task)}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="success"
                            icon={CheckCircle}
                            onClick={() => handleCompleteTask(task)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-text-light mt-2">{task.description}</p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{task.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(task.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClipboardList className="w-4 h-4" />
                        <span>{progress.completed}/{progress.total} items</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {task.checklist && task.checklist.length > 0 && (
                      <div className="mt-3">
                        <div className="w-full h-2 bg-neutral-dark rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress.percentage === 100 ? 'bg-success' :
                              progress.percentage > 50 ? 'bg-teal' :
                              progress.percentage > 0 ? 'bg-warning' :
                              'bg-neutral-dark'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Expandable Checklist */}
                    <button
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      className="text-sm text-primary mt-3 hover:underline"
                    >
                      {isExpanded ? 'Hide checklist' : 'Show checklist'}
                    </button>

                    {isExpanded && task.checklist && (
                      <div className="mt-3 space-y-2">
                        {task.checklist.map((item: any) => (
                          <label
                            key={item.id}
                            className={`
                              flex items-center gap-3 p-2 rounded-[8px] cursor-pointer transition-all
                              ${item.completed
                                ? 'bg-success-light/50'
                                : 'bg-neutral hover:bg-neutral-dark'}
                            `}
                          >
                            <button
                              onClick={() => handleChecklistToggle(task.id, item.id, !item.completed)}
                              className={`
                                w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                                ${item.completed
                                  ? 'bg-success text-white'
                                  : 'border-2 border-border bg-white'}
                              `}
                            >
                              {item.completed && <CheckSquare className="w-4 h-4" />}
                            </button>
                            <span className={`text-sm ${item.completed ? 'line-through text-text-light' : 'text-text'}`}>
                              {item.item}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTask}
        title="Add Maintenance Task"
        submitText="Create Task"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="Enter task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="Enter task description..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            rows={3}
          />

          <Input
            label="Location"
            placeholder="e.g., Pool Area, Floors 1-3"
            value={newTask.location}
            onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categoryOptions}
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
            />

            <Select
              label="Priority"
              options={priorityOptions}
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-neutral rounded-[10px]">
            <input
              type="checkbox"
              id="recurring"
              checked={newTask.recurring}
              onChange={(e) => setNewTask({ ...newTask, recurring: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary"
            />
            <label htmlFor="recurring" className="text-sm text-text cursor-pointer">
              This is a recurring task
            </label>
          </div>

          {newTask.recurring && (
            <Select
              label="Recurring Schedule"
              options={scheduleOptions}
              value={newTask.recurringSchedule}
              onChange={(e) => setNewTask({ ...newTask, recurringSchedule: e.target.value })}
            />
          )}
        </div>
      </FormModal>
    </div>
  );
};

export default MaintenanceTasks;





