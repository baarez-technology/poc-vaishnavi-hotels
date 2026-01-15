import { useState } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  Check,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { useReputation } from '@/context/ReputationContext';
import { Drawer, ConfirmDrawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { SelectDropdown, Input } from '../ui2/Input';
import DatePicker from '../ui2/DatePicker';

const METRIC_OPTIONS = [
  { value: 'rating', label: 'Average Rating' },
  { value: 'response_rate', label: 'Response Rate' },
  { value: 'nps', label: 'NPS Score' }
];

interface Goal {
  id: number;
  metric_type: string;
  target_value: number;
  current_value: number | null;
  baseline_value: number;
  progress_percentage: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface GoalFormData {
  metricType: string;
  targetValue: number;
  startDate: string;
  endDate: string;
}

interface GoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
  initialData?: Goal | null;
  mode: 'create' | 'edit';
}

function GoalDrawer({ isOpen, onClose, onSubmit, initialData, mode }: GoalDrawerProps) {
  const [metricType, setMetricType] = useState(initialData?.metric_type || 'rating');
  const [targetValue, setTargetValue] = useState(initialData?.target_value || 4.5);
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ metricType, targetValue, startDate, endDate });
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form="goal-form">
        {mode === 'create' ? 'Create Goal' : 'Save Changes'}
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Performance Goal' : 'Edit Goal'}
      subtitle={mode === 'create' ? 'Set a new target to track' : 'Modify goal settings'}
      maxWidth="max-w-md"
      footer={footer}
    >
      <form id="goal-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
            Metric Type
          </label>
          <SelectDropdown
            value={metricType}
            onChange={(value) => setMetricType(value)}
            options={METRIC_OPTIONS}
            size="md"
            disabled={mode === 'edit'}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
            Target Value
          </label>
          <Input
            type="number"
            step="0.1"
            value={targetValue}
            onChange={(e) => setTargetValue(parseFloat(e.target.value))}
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            {metricType === 'rating' && 'Rating target (1.0 - 5.0)'}
            {metricType === 'response_rate' && 'Response rate percentage (0 - 100)'}
            {metricType === 'nps' && 'Net Promoter Score (-100 to 100)'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={(value) => setStartDate(value)}
              placeholder="Select start date"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
              End Date
            </label>
            <DatePicker
              value={endDate}
              onChange={(value) => setEndDate(value)}
              placeholder="Select end date"
              minDate={startDate}
              className="w-full"
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
}

// Circular Progress Component
function CircularProgress({ percentage, size = 48, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, percentage) / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return '#4E5840'; // Sage green for achieved
    if (percentage >= 75) return '#5C9BA4'; // Blue for good progress
    if (percentage >= 50) return '#CDB261'; // Gold for moderate
    return '#A57865'; // Terra for low
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E5E5E5"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={getColor()}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-neutral-900">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

// Calculate days remaining
function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function GoalsPanel() {
  const { goals, createGoal, updateGoalProgress, deleteGoal, isLoading } = useReputation();
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Check className="w-4 h-4 text-[#4E5840]" />;
      case 'active':
        return <Clock className="w-4 h-4 text-[#5C9BA4]" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Target className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-[#4E5840]/10 text-[#4E5840] border border-[#4E5840]/20';
      case 'active':
        return 'bg-[#5C9BA4]/10 text-[#5C9BA4] border border-[#5C9BA4]/20';
      case 'expired':
        return 'bg-neutral-100 text-neutral-500 border border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border border-neutral-200';
    }
  };

  const getMetricLabel = (metricType: string) => {
    switch (metricType) {
      case 'rating':
        return 'Average Rating';
      case 'response_rate':
        return 'Response Rate';
      case 'nps':
        return 'NPS Score';
      default:
        return metricType;
    }
  };

  const formatValue = (metricType: string, value: number | null) => {
    if (value === null) return '-';
    if (metricType === 'rating') return value.toFixed(1);
    if (metricType === 'response_rate') return `${value.toFixed(0)}%`;
    return value.toFixed(0);
  };

  const handleCreateGoal = async (data: GoalFormData) => {
    try {
      await createGoal(data.metricType, data.targetValue, data.startDate, data.endDate);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleEditGoal = async (data: GoalFormData) => {
    // In a real implementation, this would call an API to update the goal
    console.log('Editing goal:', editingGoal?.id, data);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async () => {
    if (deletingGoal) {
      try {
        await deleteGoal(deletingGoal.id);
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
      setDeletingGoal(null);
    }
  };

  const openCreateDrawer = () => {
    setEditingGoal(null);
    setShowDrawer(true);
  };

  const openEditDrawer = (goal: Goal) => {
    setEditingGoal(goal);
    setShowDrawer(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
        <div className="h-5 bg-neutral-200 rounded w-1/3 mb-5" />
        <div className="space-y-3">
          <div className="h-24 bg-neutral-100 rounded-lg" />
          <div className="h-24 bg-neutral-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[10px] border border-neutral-200">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Performance Goals</h3>
            <p className="text-[13px] text-neutral-500 mt-0.5">Track and manage your targets</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openCreateDrawer}
          >
            Add Goal
          </Button>
        </div>
      </div>

      {/* Goals List */}
      <div className="p-6">
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => {
              const daysRemaining = getDaysRemaining(goal.end_date);

              return (
                <div
                  key={goal.id}
                  className="bg-neutral-50 rounded-[8px] p-5 border border-neutral-100 hover:border-neutral-200 transition-colors"
                >
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CircularProgress percentage={goal.progress_percentage || 0} />
                      <div>
                        <p className="text-[14px] font-semibold text-neutral-900">
                          {getMetricLabel(goal.metric_type)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide ${getStatusBadge(goal.status)}`}>
                            {goal.status}
                          </span>
                          {goal.status === 'active' && daysRemaining > 0 && (
                            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {daysRemaining} days left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDrawer(goal)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                        title="Edit goal"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Values Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2.5 bg-white rounded-[6px] border border-neutral-100">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">Base</p>
                      <p className="text-[13px] font-bold text-neutral-600">
                        {formatValue(goal.metric_type, goal.baseline_value)}
                      </p>
                    </div>
                    <div className="text-center p-2.5 bg-white rounded-[6px] border border-neutral-100">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">Curf</p>
                      <p className="text-[13px] font-bold text-[#5C9BA4]">
                        {formatValue(goal.metric_type, goal.current_value)}
                      </p>
                    </div>
                    <div className="text-center p-2.5 bg-white rounded-[6px] border border-neutral-100">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">Target</p>
                      <p className="text-[13px] font-bold text-[#4E5840]">
                        {formatValue(goal.metric_type, goal.target_value)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-neutral-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${goal.progress_percentage >= 100 ? 'bg-[#4E5840]' : 'bg-[#A57865]'
                          }`}
                        style={{ width: `${Math.min(100, goal.progress_percentage || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(goal.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span>to</span>
                    <span>
                      {new Date(goal.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Update Button */}
                  {goal.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={TrendingUp}
                      onClick={() => updateGoalProgress(goal.id)}
                      className="w-full mt-3"
                    >
                      Refresh Progress
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-neutral-300" />
            </div>
            <p className="text-[15px] font-medium text-neutral-600 mb-1">No goals set yet</p>
            <p className="text-[13px] text-neutral-400 mb-4">Create a performance goal to start tracking progress</p>
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreateDrawer}>
              Create Your First Goal
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Drawer */}
      <GoalDrawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setEditingGoal(null);
        }}
        onSubmit={editingGoal ? handleEditGoal : handleCreateGoal}
        initialData={editingGoal}
        mode={editingGoal ? 'edit' : 'create'}
      />

      {/* Delete Confirmation */}
      <ConfirmDrawer
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal"
        description={`Are you sure you want to delete the "${deletingGoal ? getMetricLabel(deletingGoal.metric_type) : ''}" goal? This action cannot be undone.`}
        confirmText="Delete Goal"
        cancelText="Keep Goal"
        variant="danger"
        icon={Trash2}
      />
    </div>
  );
}
