import { useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, Check, Clock, AlertCircle } from 'lucide-react';
// Icons used in content (status, goal details), not header
import { useReputation } from '@/contexts/ReputationContext';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { SelectDropdown, Input } from '../ui2/Input';
import DatePicker from '../ui2/DatePicker';

const METRIC_OPTIONS = [
  { value: 'rating', label: 'Average Rating' },
  { value: 'response_rate', label: 'Response Rate' },
  { value: 'nps', label: 'NPS Score' }
];

interface CreateGoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { metricType: string; targetValue: number; startDate: string; endDate: string }) => void;
}

function CreateGoalDrawer({ isOpen, onClose, onSubmit }: CreateGoalDrawerProps) {
  const [metricType, setMetricType] = useState('rating');
  const [targetValue, setTargetValue] = useState(4.5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      <Button variant="primary" type="submit" form="create-goal-form">
        Create Goal
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Performance Goal"
      subtitle="Set a new target to track"
      maxWidth="max-w-md"
      footer={footer}
    >
      <form id="create-goal-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Metric Type</label>
          <SelectDropdown
            value={metricType}
            onChange={(value) => setMetricType(value)}
            options={METRIC_OPTIONS}
            size="md"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Target Value</label>
          <Input
            type="number"
            step="0.1"
            value={targetValue}
            onChange={(e) => setTargetValue(parseFloat(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Start Date</label>
            <DatePicker
              value={startDate}
              onChange={(value) => setStartDate(value)}
              placeholder="Select start date"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">End Date</label>
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

export default function GoalsPanel() {
  const { goals, createGoal, updateGoalProgress, isLoading } = useReputation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Target className="w-5 h-5 text-neutral-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
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

  const handleCreateGoal = async (data: { metricType: string; targetValue: number; startDate: string; endDate: string }) => {
    try {
      await createGoal(data.metricType, data.targetValue, data.startDate, data.endDate);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[10px] p-6 animate-pulse">
        <div className="h-5 bg-neutral-200 rounded w-1/3 mb-5" />
        <div className="space-y-3">
          <div className="h-20 bg-neutral-100 rounded-[8px]" />
          <div className="h-20 bg-neutral-100 rounded-[8px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[10px] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-semibold text-neutral-900">Performance Goals</h3>
          <p className="text-[13px] text-neutral-500 mt-0.5">Track your targets</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          New Goal
        </Button>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-neutral-50 rounded-[8px] p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(goal.status)}
                  <div>
                    <p className="text-[14px] font-semibold text-neutral-900">{getMetricLabel(goal.metric_type)}</p>
                    <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${getStatusColor(goal.status)}`}>
                  {goal.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-neutral-500">
                    Current: <span className="font-semibold text-neutral-700">{goal.current_value?.toFixed(1) || goal.baseline_value?.toFixed(1)}</span>
                  </span>
                  <span className="text-neutral-500">
                    Target: <span className="font-semibold text-neutral-700">{goal.target_value?.toFixed(1)}</span>
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      goal.progress_percentage >= 100 ? 'bg-sage-600' : 'bg-terra-500'
                    }`}
                    style={{ width: `${Math.min(100, goal.progress_percentage || 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5 text-right font-medium">
                  {(goal.progress_percentage || 0).toFixed(0)}% complete
                </p>
              </div>

              {/* Update Button */}
              {goal.status === 'active' && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={TrendingUp}
                  onClick={() => updateGoalProgress(goal.id)}
                >
                  Update Progress
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-400">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-[14px] font-medium text-neutral-500">No goals set yet</p>
          <p className="text-[12px]">Create a goal to track progress</p>
        </div>
      )}

      <CreateGoalDrawer
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGoal}
      />
    </div>
  );
}
