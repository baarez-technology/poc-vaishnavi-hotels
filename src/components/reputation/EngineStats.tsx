import { useState, useEffect } from 'react';
import {
  Activity,
  Brain,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Cpu,
  Loader2
} from 'lucide-react';
import { useReputation } from '@/context/ReputationContext';

interface StatsData {
  status: 'active' | 'inactive' | 'error';
  nlp_model_version: string;
  sentiment_accuracy: number;
  auto_replies_sent_today: number;
  auto_replies_sent_week: number;
  reviews_processed_today: number;
  avg_response_time_hours: number;
  last_sync: string;
  queue_size: number;
  error_rate: number;
}

const STATUS_CONFIG = {
  active: { color: 'text-green-600', bg: 'bg-green-100', label: 'Active' },
  inactive: { color: 'text-neutral-500', bg: 'bg-neutral-100', label: 'Inactive' },
  error: { color: 'text-red-600', bg: 'bg-red-100', label: 'Error' }
};

export default function EngineStats() {
  const { engineStats, loadEngineStats, isLoading } = useReputation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo data when API not connected
  const stats: StatsData = engineStats || {
    status: 'active',
    nlp_model_version: 'GPT-3.5-turbo',
    sentiment_accuracy: 94.2,
    auto_replies_sent_today: 12,
    auto_replies_sent_week: 87,
    reviews_processed_today: 45,
    avg_response_time_hours: 1.5,
    last_sync: new Date().toISOString(),
    queue_size: 3,
    error_rate: 0.8
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadEngineStats();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const statusConfig = STATUS_CONFIG[stats.status];

  const statItems = [
    {
      label: 'Sentiment Accuracy',
      value: `${stats.sentiment_accuracy.toFixed(1)}%`,
      icon: Brain,
      color: 'text-[#5C9BA4]',
      bgColor: 'bg-[#5C9BA4]/10'
    },
    {
      label: 'Reviews Today',
      value: stats.reviews_processed_today.toString(),
      icon: BarChart3,
      color: 'text-[#A57865]',
      bgColor: 'bg-[#A57865]/10'
    },
    {
      label: 'Auto-Replies Today',
      value: stats.auto_replies_sent_today.toString(),
      icon: Zap,
      color: 'text-[#CDB261]',
      bgColor: 'bg-[#CDB261]/10'
    },
    {
      label: 'Avg Response Time',
      value: `${stats.avg_response_time_hours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-[#4E5840]',
      bgColor: 'bg-[#4E5840]/10'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5C9BA4]/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[#5C9BA4]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">AI Engine Status</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Real-time processing metrics</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg}`}>
              {stats.status === 'active' ? (
                <Activity className={`w-3.5 h-3.5 ${statusConfig.color}`} />
              ) : stats.status === 'error' ? (
                <AlertTriangle className={`w-3.5 h-3.5 ${statusConfig.color}`} />
              ) : (
                <Clock className={`w-3.5 h-3.5 ${statusConfig.color}`} />
              )}
              <span className={`text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <span className="text-xs text-neutral-500">
              Model: {stats.nlp_model_version}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {stats.auto_replies_sent_week} replies this week
            </span>
            <span>
              Queue: {stats.queue_size}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-md ${item.bgColor} flex items-center justify-center`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-xs text-neutral-500">{item.label}</span>
              </div>
              <div className="text-lg font-semibold text-neutral-900">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-neutral-500">
                Error Rate: <span className={stats.error_rate < 2 ? 'text-green-600' : 'text-red-600'}>
                  {stats.error_rate.toFixed(1)}%
                </span>
              </span>
              <span className="text-neutral-500">
                Last Sync: {new Date(stats.last_sync).toLocaleTimeString()}
              </span>
            </div>
            {stats.queue_size > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing {stats.queue_size} items
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
