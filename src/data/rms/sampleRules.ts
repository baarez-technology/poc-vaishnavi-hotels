// Sample Pricing Rules Data
// Rules engine configuration for dynamic pricing

export const conditionTypes = [
  { id: 'occupancy_above', label: 'Occupancy Above', unit: '%', type: 'number' },
  { id: 'occupancy_below', label: 'Occupancy Below', unit: '%', type: 'number' },
  { id: 'pickup_above', label: 'Pickup Pace Above', unit: '%', type: 'number' },
  { id: 'pickup_below', label: 'Pickup Pace Below', unit: '%', type: 'number' },
  { id: 'competitor_higher', label: 'Competitor Avg Higher By', unit: '%', type: 'number' },
  { id: 'competitor_lower', label: 'Competitor Avg Lower By', unit: '%', type: 'number' },
  { id: 'days_to_arrival', label: 'Days to Arrival', unit: 'days', type: 'range' },
  { id: 'day_of_week', label: 'Day of Week', unit: '', type: 'select', options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  { id: 'demand_level', label: 'Demand Level', unit: '', type: 'select', options: ['compression', 'high', 'normal', 'low', 'very_low'] },
  { id: 'segment', label: 'Segment', unit: '', type: 'select', options: ['corporate', 'ota', 'direct', 'longstay', 'repeat', 'groups'] },
  { id: 'event_active', label: 'Event Active', unit: '', type: 'boolean' },
  { id: 'room_type', label: 'Room Type', unit: '', type: 'select', options: ['STD', 'DLX', 'SUP', 'EXE', 'PRS', 'ALL'] },
];

export const actionTypes = [
  { id: 'increase_percent', label: 'Increase Rate By', unit: '%', type: 'number' },
  { id: 'decrease_percent', label: 'Decrease Rate By', unit: '%', type: 'number' },
  { id: 'set_rate', label: 'Set Rate To', unit: '$', type: 'number' },
  { id: 'set_min_rate', label: 'Set Minimum Rate', unit: '$', type: 'number' },
  { id: 'set_max_rate', label: 'Set Maximum Rate', unit: '$', type: 'number' },
  { id: 'apply_min_stay', label: 'Apply Min Stay', unit: 'nights', type: 'number' },
  { id: 'apply_cta', label: 'Close to Arrival', unit: '', type: 'boolean' },
  { id: 'apply_ctd', label: 'Close to Departure', unit: '', type: 'boolean' },
  { id: 'apply_stop_sell', label: 'Stop Sell', unit: '', type: 'boolean' },
];

// Sample pricing rules
export const sampleRules = [
  {
    id: 'rule_001',
    name: 'High Occupancy Premium',
    description: 'Increase rates when occupancy exceeds 85%',
    priority: 1,
    isActive: true,
    roomTypes: ['ALL'],
    conditions: [
      { type: 'occupancy_above', value: 85 },
    ],
    actions: [
      { type: 'increase_percent', value: 15 },
      { type: 'set_min_rate', value: 199 },
    ],
    createdAt: '2025-01-15',
    lastTriggered: '2025-12-05',
    timesTriggered: 156,
  },
  {
    id: 'rule_002',
    name: 'Compression Day Maximizer',
    description: 'Maximum rates during compression with min stay',
    priority: 1,
    isActive: true,
    roomTypes: ['ALL'],
    conditions: [
      { type: 'occupancy_above', value: 92 },
      { type: 'demand_level', value: 'compression' },
    ],
    actions: [
      { type: 'increase_percent', value: 25 },
      { type: 'apply_min_stay', value: 2 },
      { type: 'apply_cta', value: false },
    ],
    createdAt: '2025-02-10',
    lastTriggered: '2025-12-03',
    timesTriggered: 42,
  },
  {
    id: 'rule_003',
    name: 'Competitor Rate Match',
    description: 'Adjust when significantly below competitor average',
    priority: 2,
    isActive: true,
    roomTypes: ['STD', 'DLX'],
    conditions: [
      { type: 'competitor_higher', value: 15 },
      { type: 'pickup_above', value: 90 },
    ],
    actions: [
      { type: 'increase_percent', value: 12 },
    ],
    createdAt: '2025-03-01',
    lastTriggered: '2025-12-04',
    timesTriggered: 89,
  },
  {
    id: 'rule_004',
    name: 'Last Minute Discount',
    description: 'Reduce rates for unsold inventory within 3 days',
    priority: 3,
    isActive: true,
    roomTypes: ['ALL'],
    conditions: [
      { type: 'days_to_arrival', value: { min: 0, max: 3 } },
      { type: 'occupancy_below', value: 70 },
    ],
    actions: [
      { type: 'decrease_percent', value: 15 },
    ],
    createdAt: '2025-01-20',
    lastTriggered: '2025-12-05',
    timesTriggered: 234,
  },
  {
    id: 'rule_005',
    name: 'Weekend Premium',
    description: 'Apply premium pricing on weekends',
    priority: 2,
    isActive: true,
    roomTypes: ['ALL'],
    conditions: [
      { type: 'day_of_week', value: ['Fri', 'Sat'] },
    ],
    actions: [
      { type: 'increase_percent', value: 18 },
      { type: 'set_min_rate', value: 219 },
    ],
    createdAt: '2025-01-10',
    lastTriggered: '2025-12-06',
    timesTriggered: 412,
  },
  {
    id: 'rule_006',
    name: 'Event Surge Pricing',
    description: 'Maximize rates during events',
    priority: 1,
    isActive: true,
    roomTypes: ['ALL'],
    conditions: [
      { type: 'event_active', value: true },
    ],
    actions: [
      { type: 'increase_percent', value: 20 },
      { type: 'apply_min_stay', value: 2 },
    ],
    createdAt: '2025-02-01',
    lastTriggered: '2025-12-01',
    timesTriggered: 28,
  },
  {
    id: 'rule_007',
    name: 'Slow Pickup Stimulation',
    description: 'Reduce rates when booking pace is slow',
    priority: 3,
    isActive: true,
    roomTypes: ['STD', 'DLX'],
    conditions: [
      { type: 'pickup_below', value: 75 },
      { type: 'days_to_arrival', value: { min: 7, max: 21 } },
    ],
    actions: [
      { type: 'decrease_percent', value: 10 },
    ],
    createdAt: '2025-03-15',
    lastTriggered: '2025-12-02',
    timesTriggered: 167,
  },
  {
    id: 'rule_008',
    name: 'Corporate Rate Protection',
    description: 'Ensure corporate rates stay below BAR',
    priority: 4,
    isActive: true,
    roomTypes: ['ALL'],
    conditions: [
      { type: 'segment', value: 'corporate' },
    ],
    actions: [
      { type: 'set_max_rate', value: 245 },
    ],
    createdAt: '2025-01-05',
    lastTriggered: '2025-12-05',
    timesTriggered: 892,
  },
  {
    id: 'rule_009',
    name: 'Suite Upsell Opportunity',
    description: 'Narrow gap between rooms when suites undersold',
    priority: 3,
    isActive: true,
    roomTypes: ['SUP', 'EXE'],
    conditions: [
      { type: 'occupancy_below', value: 50 },
      { type: 'days_to_arrival', value: { min: 0, max: 14 } },
    ],
    actions: [
      { type: 'decrease_percent', value: 12 },
    ],
    createdAt: '2025-04-01',
    lastTriggered: '2025-12-04',
    timesTriggered: 78,
  },
  {
    id: 'rule_010',
    name: 'Low Demand Floor Protection',
    description: 'Prevent rates from dropping too low',
    priority: 5,
    isActive: true,
    roomTypes: ['ALL'],
    conditions: [
      { type: 'demand_level', value: 'very_low' },
    ],
    actions: [
      { type: 'set_min_rate', value: 149 },
    ],
    createdAt: '2025-02-20',
    lastTriggered: '2025-11-28',
    timesTriggered: 45,
  },
];

// Rule evaluation functions
export function evaluateCondition(condition, context) {
  const { type, value } = condition;

  switch (type) {
    case 'occupancy_above':
      return context.occupancy > value;
    case 'occupancy_below':
      return context.occupancy < value;
    case 'pickup_above':
      return context.pickupPace > value;
    case 'pickup_below':
      return context.pickupPace < value;
    case 'competitor_higher':
      return context.competitorGap > value;
    case 'competitor_lower':
      return context.competitorGap < -value;
    case 'days_to_arrival':
      return context.daysOut >= value.min && context.daysOut <= value.max;
    case 'day_of_week':
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return value.includes(dayNames[context.dayOfWeek]);
    case 'demand_level':
      return context.demandLevel === value;
    case 'segment':
      return context.segment === value;
    case 'event_active':
      return context.hasEvent === value;
    case 'room_type':
      return value === 'ALL' || context.roomType === value;
    default:
      return false;
  }
}

export function evaluateRule(rule, context) {
  // Check if rule applies to this room type
  if (!rule.roomTypes.includes('ALL') && !rule.roomTypes.includes(context.roomType)) {
    return { applies: false, rule };
  }

  // Evaluate all conditions (AND logic)
  const allConditionsMet = rule.conditions.every(cond =>
    evaluateCondition(cond, context)
  );

  return {
    applies: allConditionsMet,
    rule,
    priority: rule.priority,
  };
}

export function applyRuleActions(actions, baseRate) {
  let finalRate = baseRate;
  let restrictions = {};
  let minRate = null;
  let maxRate = null;

  actions.forEach(action => {
    switch (action.type) {
      case 'increase_percent':
        finalRate = Math.round(finalRate * (1 + action.value / 100));
        break;
      case 'decrease_percent':
        finalRate = Math.round(finalRate * (1 - action.value / 100));
        break;
      case 'set_rate':
        finalRate = action.value;
        break;
      case 'set_min_rate':
        minRate = action.value;
        break;
      case 'set_max_rate':
        maxRate = action.value;
        break;
      case 'apply_min_stay':
        restrictions.minStay = action.value;
        break;
      case 'apply_cta':
        restrictions.CTA = action.value;
        break;
      case 'apply_ctd':
        restrictions.CTD = action.value;
        break;
      case 'apply_stop_sell':
        restrictions.stopSell = action.value;
        break;
    }
  });

  // Apply min/max constraints
  if (minRate !== null) finalRate = Math.max(finalRate, minRate);
  if (maxRate !== null) finalRate = Math.min(finalRate, maxRate);

  return { finalRate, restrictions };
}

// Get rules that would apply for a given context
export function getApplicableRules(rules, context) {
  return rules
    .filter(rule => rule.isActive)
    .map(rule => evaluateRule(rule, context))
    .filter(result => result.applies)
    .sort((a, b) => a.priority - b.priority);
}

// Calculate final rate after applying all rules
export function calculateRuleBasedRate(rules, baseRate, context) {
  const applicableRules = getApplicableRules(rules, context);

  if (applicableRules.length === 0) {
    return { rate: baseRate, appliedRules: [], restrictions: {} };
  }

  let currentRate = baseRate;
  let allRestrictions = {};
  const appliedRules = [];

  // Apply rules in priority order
  applicableRules.forEach(result => {
    const { finalRate, restrictions } = applyRuleActions(result.rule.actions, currentRate);
    currentRate = finalRate;
    allRestrictions = { ...allRestrictions, ...restrictions };
    appliedRules.push({
      ruleId: result.rule.id,
      ruleName: result.rule.name,
      adjustment: finalRate - baseRate,
    });
  });

  return {
    rate: currentRate,
    appliedRules,
    restrictions: allRestrictions,
    originalRate: baseRate,
    totalAdjustment: currentRate - baseRate,
    adjustmentPercent: Math.round(((currentRate - baseRate) / baseRate) * 100),
  };
}

// Rule performance analytics
export function getRuleAnalytics(rules) {
  const activeRules = rules.filter(r => r.isActive);
  const totalTriggers = rules.reduce((sum, r) => sum + r.timesTriggered, 0);

  return {
    totalRules: rules.length,
    activeRules: activeRules.length,
    inactiveRules: rules.length - activeRules.length,
    totalTriggers,
    avgTriggersPerRule: Math.round(totalTriggers / rules.length),
    mostTriggered: [...rules].sort((a, b) => b.timesTriggered - a.timesTriggered).slice(0, 5),
    leastTriggered: [...rules].sort((a, b) => a.timesTriggered - b.timesTriggered).slice(0, 5),
    byPriority: {
      1: rules.filter(r => r.priority === 1).length,
      2: rules.filter(r => r.priority === 2).length,
      3: rules.filter(r => r.priority === 3).length,
      4: rules.filter(r => r.priority === 4).length,
      5: rules.filter(r => r.priority === 5).length,
    },
  };
}

export const ruleAnalytics = getRuleAnalytics(sampleRules);

export default sampleRules;
