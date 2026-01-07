import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

export default function AIInsights() {
  const insights = [
    {
      type: 'opportunity',
      icon: TrendingUp,
      title: 'Revenue Optimization Opportunity',
      description: 'Weekend rates are 15% below market average. Consider increasing ADR by $25-30 for Friday-Sunday nights.',
      impact: 'High',
      impactColor: 'green',
      action: 'Adjust Pricing'
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Demand Softness Detected',
      description: 'Bookings for dates 45-60 days out are trending 8% below last year. Early promotion recommended.',
      impact: 'Medium',
      impactColor: 'amber',
      action: 'Create Campaign'
    },
    {
      type: 'success',
      icon: CheckCircle,
      title: 'Strong Corporate Performance',
      description: 'Corporate segment revenue up 12% month-over-month. Maintain current contract rates and strengthen partnerships.',
      impact: 'Positive',
      impactColor: 'primary',
      action: 'Review Contracts'
    },
    {
      type: 'recommendation',
      icon: Lightbulb,
      title: 'Channel Mix Recommendation',
      description: 'Direct bookings showing 18% higher profitability than OTAs. Invest in website optimization and loyalty program.',
      impact: 'High',
      impactColor: 'green',
      action: 'View Strategy'
    }
  ];

  const getIconColor = (type) => {
    const colors = {
      opportunity: 'text-[#4E5840] bg-green-100',
      warning: 'text-amber-600 bg-amber-100',
      success: 'text-[#A57865] bg-[#A57865]/10',
      recommendation: 'text-[#5C9BA4] bg-[#5C9BA4]/15'
    };
    return colors[type] || colors.recommendation;
  };

  const getImpactStyle = (color) => {
    const styles = {
      green: 'bg-green-100 text-[#4E5840] border-[#4E5840]/30',
      amber: 'bg-amber-100 text-amber-700 border-amber-200',
      primary: 'bg-[#A57865]/10 text-[#A57865] border-[#A57865]/30'
    };
    return styles[color] || styles.primary;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-aurora-600 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-semibold">AI Revenue Insights</h2>
        </div>
        <p className="text-white/90 text-sm">
          Real-time recommendations powered by machine learning analysis of your revenue data
        </p>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-neutral-200 hover:shadow transition-shadow duration-200"
            >
              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl ${getIconColor(insight.type)} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {insight.title}
                  </h3>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${getImpactStyle(insight.impactColor)}`}>
                    {insight.impact} Impact
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                {insight.description}
              </p>

              {/* Action Button */}
              <button className="w-full py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg text-sm font-medium transition-colors duration-200">
                {insight.action}
              </button>
            </div>
          );
        })}
      </div>

      {/* AI Stats */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">AI Model Performance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#A57865] mb-1">92%</p>
            <p className="text-xs text-neutral-600">Forecast Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#4E5840] mb-1">$48K</p>
            <p className="text-xs text-neutral-600">Revenue Optimized (30d)</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#5C9BA4] mb-1">156</p>
            <p className="text-xs text-neutral-600">Insights Generated</p>
          </div>
        </div>
      </div>
    </div>
  );
}
