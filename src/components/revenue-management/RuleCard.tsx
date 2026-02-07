import { useState } from 'react';
import {
  Play,
  Pause,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  TrendingDown,
  Lock,
  Target,
  Activity,
  BarChart3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../ui2/Modal';
import { revenueIntelligenceService } from '../../api/services/revenue-intelligence.service';

interface PricingRuleCondition {
  type: string;
  value: number | string | boolean | { min: number; max: number } | string[];
}

interface PricingRuleAction {
  type: string;
  value: number | boolean;
}

interface PricingRule {
  id: number;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  roomTypes: string[];
  conditions: PricingRuleCondition[];
  actions: PricingRuleAction[];
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  timesTriggered: number;
  executionStatus?: 'success' | 'error' | 'pending' | 'running';
  lastExecutionMessage?: string;
}

interface RuleCardProps {
  rule: PricingRule;
  onEdit: (rule: PricingRule) => void;
  onDelete: (rule: PricingRule) => void;
  onToggle?: (rule: PricingRule) => void;
  onRuleUpdated?: () => void;
  isSelected?: boolean;
  onClick?: () => void;
}

const RuleCard = ({
  rule,
  onEdit,
  onDelete,
  onToggle,
  onRuleUpdated,
  isSelected = false,
  onClick,
}: RuleCardProps) => {
  const { success, error: showError } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return { bg: 'bg-rose-100', text: 'text-rose-700' };
      case 2:
        return { bg: 'bg-gold-100', text: 'text-gold-700' };
      case 3:
        return { bg: 'bg-ocean-100', text: 'text-ocean-700' };
      case 4:
        return { bg: 'bg-sage-100', text: 'text-sage-700' };
      case 5:
        return { bg: 'bg-neutral-100', text: 'text-neutral-600' };
      default:
        return { bg: 'bg-neutral-100', text: 'text-neutral-600' };
    }
  };

  const formatCondition = (condition: PricingRuleCondition) => {
    const { type, value } = condition;
    switch (type) {
      case 'occupancy_above':
        return `Occupancy > ${value}%`;
      case 'occupancy_below':
        return `Occupancy < ${value}%`;
      case 'pickup_above':
        return `Pickup > ${value}%`;
      case 'pickup_below':
        return `Pickup < ${value}%`;
      case 'competitor_higher':
        return `Comp +${value}%`;
      case 'competitor_lower':
        return `Comp -${value}%`;
      case 'days_to_arrival':
        return `${(value as { min: number; max: number }).min}-${(value as { min: number; max: number }).max} days`;
      case 'day_of_week':
        return Array.isArray(value) ? value.join(', ') : String(value);
      case 'demand_level':
        return `${value} demand`;
      case 'event_active':
        return value ? 'Event active' : 'No event';
      default:
        return type;
    }
  };

  const formatAction = (action: PricingRuleAction) => {
    const { type, value } = action;
    switch (type) {
      case 'increase_percent':
        return `+${value}%`;
      case 'decrease_percent':
        return `-${value}%`;
      case 'set_rate':
        return `$${value}`;
      case 'set_min_rate':
        return `Min $${value}`;
      case 'set_max_rate':
        return `Max $${value}`;
      case 'apply_min_stay':
        return `${value}N min`;
      case 'apply_cta':
        return value ? 'CTA' : 'Open';
      case 'apply_ctd':
        return value ? 'CTD' : 'Open';
      case 'apply_stop_sell':
        return value ? 'Stop' : 'Open';
      default:
        return type;
    }
  };

  const getActionIcon = (type: string) => {
    if (type.includes('increase'))
      return <TrendingUp className="w-3.5 h-3.5 text-sage-500" />;
    if (type.includes('decrease'))
      return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
    if (
      type.includes('min_stay') ||
      type.includes('cta') ||
      type.includes('ctd') ||
      type.includes('stop')
    ) {
      return <Lock className="w-3.5 h-3.5 text-gold-500" />;
    }
    return <Zap className="w-3.5 h-3.5 text-ocean-500" />;
  };

  const getExecutionStatusBadge = () => {
    if (!rule.executionStatus) return null;

    switch (rule.executionStatus) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-sage-50 text-sage-600">
            <CheckCircle2 className="w-3 h-3" />
            Success
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-600">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-ocean-50 text-ocean-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-gold-50 text-gold-600">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);

    try {
      if (onToggle) {
        const maybePromise = onToggle(rule);
        if (maybePromise && typeof (maybePromise as Promise<unknown>)?.then === 'function') {
          await maybePromise;
        }
        return;
      }

      const result = await revenueIntelligenceService.togglePricingRule(rule.id);
      const newActive = result?.is_active ?? !rule.isActive;

      success(
        newActive
          ? `Rule "${rule.name}" has been enabled`
          : `Rule "${rule.name}" has been disabled`,
        { duration: 3000 }
      );

      if (onRuleUpdated) {
        onRuleUpdated();
      }
    } catch (err) {
      showError('Failed to toggle rule. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      await revenueIntelligenceService.deletePricingRule(rule.id);

      success(`Rule "${rule.name}" has been deleted`, { duration: 3000 });

      setShowDeleteConfirm(false);
      onDelete(rule);

      if (onRuleUpdated) {
        onRuleUpdated();
      }
    } catch (err) {
      showError('Failed to delete rule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(rule);
  };

  const formatLastTriggered = (timestamp?: string) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const priorityColor = getPriorityColor(rule.priority);

  return (
    <>
      <div
        className={`rounded-[10px] transition-all ${
          isSelected
            ? 'bg-white border-2 border-terra-500 ring-2 ring-terra-500/20'
            : 'bg-white border border-neutral-100'
        } ${!rule.isActive ? 'opacity-60' : ''}`}
      >
        {/* Main Row */}
        <div className="p-5 flex items-center gap-6">
          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              rule.isActive
                ? 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={rule.isActive ? 'Disable' : 'Enable'}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : rule.isActive ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0" onClick={onClick}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-[14px] font-semibold text-neutral-800 truncate">
                {rule.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${priorityColor.bg} ${priorityColor.text}`}
              >
                P{rule.priority}
              </span>
              {rule.isActive && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sage-50 text-sage-600">
                  Active
                </span>
              )}
              {getExecutionStatusBadge()}
            </div>
            <p className="text-[12px] text-neutral-500">{rule.description}</p>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                Triggers
              </p>
              <p className="text-xl font-bold text-neutral-900">
                {rule.timesTriggered.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                Last Run
              </p>
              <p className="text-[14px] font-semibold text-neutral-700">
                {formatLastTriggered(rule.lastTriggered)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                Conditions
              </p>
              <p className="text-[14px] font-semibold text-neutral-700">
                {rule.conditions.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                Actions
              </p>
              <p className="text-[14px] font-semibold text-neutral-700">
                {rule.actions.length}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleEditClick}
              className="p-2 text-neutral-400 hover:text-terra-600 hover:bg-terra-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className={`p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Delete"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={`p-2 rounded-lg transition-all ${
                isExpanded
                  ? 'text-terra-600 bg-terra-50'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-neutral-100">
            <div className="pt-4 grid grid-cols-3 gap-6">
              {/* Conditions */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                  IF Conditions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {rule.conditions.map((condition, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-[11px] font-medium bg-ocean-50 text-ocean-700 rounded"
                    >
                      {formatCondition(condition)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                  THEN Actions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {rule.actions.map((action, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-sage-50 text-sage-700 rounded"
                    >
                      {getActionIcon(action.type)}
                      {formatAction(action)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Room Types */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                  Applies to
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {rule.roomTypes.map((roomType) => (
                    <span
                      key={roomType}
                      className="px-2 py-1 text-[11px] font-medium bg-neutral-100 text-neutral-600 rounded"
                    >
                      {roomType === 'ALL' ? 'All Rooms' : roomType}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Last Execution Info */}
            {rule.lastTriggered && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Last triggered:{' '}
                      {new Date(rule.lastTriggered).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {rule.lastExecutionMessage && (
                    <span className="text-[11px] text-neutral-500 italic">
                      {rule.lastExecutionMessage}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Pricing Rule"
        description={`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`}
        variant="danger"
        confirmText={isDeleting ? 'Deleting...' : 'Delete Rule'}
        cancelText="Cancel"
      />
    </>
  );
};

// Rule Summary KPI Cards - Matching Segmentation pattern exactly
interface RuleSummaryProps {
  rules: PricingRule[];
}

export const RuleSummary = ({ rules }: RuleSummaryProps) => {
  const activeRules = rules.filter((r) => r.isActive);
  const totalTriggers = rules.reduce((sum, r) => sum + r.timesTriggered, 0);
  const avgTriggersPerRule = rules.length > 0 ? Math.round(totalTriggers / rules.length) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-[10px] bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-terra-50">
            <Target className="w-4 h-4 text-terra-600" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Total Rules
          </p>
        </div>
        <p className="text-[28px] font-semibold tracking-tight text-neutral-900">{rules.length}</p>
        <p className="text-[11px] text-sage-600 font-medium mt-1">{activeRules.length} active</p>
      </div>

      <div className="rounded-[10px] bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sage-50">
            <Activity className="w-4 h-4 text-sage-600" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Total Triggers
          </p>
        </div>
        <p className="text-[28px] font-semibold tracking-tight text-neutral-900">
          {totalTriggers.toLocaleString()}
        </p>
      </div>

      <div className="rounded-[10px] bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ocean-50">
            <BarChart3 className="w-4 h-4 text-ocean-600" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Avg Triggers
          </p>
        </div>
        <p className="text-[28px] font-semibold tracking-tight text-neutral-900">
          {avgTriggersPerRule}
        </p>
        <p className="text-[11px] text-neutral-400 font-medium mt-1">per rule</p>
      </div>

      <div className="rounded-[10px] bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gold-50">
            <Zap className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            By Priority
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((p) => {
            const count = rules.filter((r) => r.priority === p).length;
            return (
              <div
                key={p}
                className={`flex-1 h-8 rounded flex items-center justify-center text-[11px] font-bold ${
                  count > 0
                    ? p === 1
                      ? 'bg-rose-100 text-rose-700'
                      : p === 2
                        ? 'bg-gold-100 text-gold-700'
                        : p === 3
                          ? 'bg-ocean-100 text-ocean-700'
                          : 'bg-neutral-100 text-neutral-600'
                    : 'bg-neutral-50 text-neutral-300'
                }`}
              >
                {count}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RuleCard;
