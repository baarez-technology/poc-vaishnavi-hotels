import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateRateCalendar, roomTypes, rateCodes, seasonalityFactors, dayOfWeekFactors, specialEvents } from '../data/rms/sampleRateHistory';
import { generatePickupData, calculatePickupMetrics } from '../data/rms/samplePickup';
import { generateCompetitorRates, getCompetitorInsights, checkRateParity, competitors } from '../data/rms/sampleCompetitors';
import { generateForecast, calculateForecastSummary, generateForecastInsights, getHighImpactDays, getOpportunityDays } from '../data/rms/sampleForecast';
import { generateSegmentPerformance, getSegmentComparison, segments } from '../data/rms/sampleSegments';
import { sampleRules, evaluateRule, applyRuleActions, getApplicableRules, calculateRuleBasedRate, getRuleAnalytics } from '../data/rms/sampleRules';

const RMSContext = createContext();

export function useRMS() {
  const context = useContext(RMSContext);
  if (!context) {
    throw new Error('useRMS must be used within RMSProvider');
  }
  return context;
}

const STORAGE_KEY = 'glimmora_rms_data';

export function RMSProvider({ children }) {
  // Core state
  const [rateCalendar, setRateCalendar] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.rateCalendar || generateRateCalendar();
      }
    } catch {}
    return generateRateCalendar();
  });

  const [rules, setRules] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.rules || sampleRules;
      }
    } catch {}
    return sampleRules;
  });

  const [pickup, setPickup] = useState(() => generatePickupData());
  const [competitors, setCompetitors] = useState(() => generateCompetitorRates());
  const [forecast, setForecast] = useState(() => generateForecast());
  const [segmentPerformance, setSegmentPerformance] = useState(() => generateSegmentPerformance());
  const [recommendations, setRecommendations] = useState([]);
  const [lastRecalculation, setLastRecalculation] = useState(new Date().toISOString());

  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const MAX_HISTORY_SIZE = 50;

  // Persist to localStorage
  useEffect(() => {
    const dataToStore = {
      rateCalendar,
      rules,
      lastRecalculation,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  }, [rateCalendar, rules, lastRecalculation]);

  // Generate recommendations on data changes
  useEffect(() => {
    const newRecommendations = generateAIPricingSuggestions();
    setRecommendations(newRecommendations);
  }, [rateCalendar, pickup, competitors, forecast]);

  // ============================================
  // UNDO/REDO FUNCTIONS
  // ============================================

  const addToHistory = useCallback((action, beforeState, afterState) => {
    setHistory(prev => {
      // Remove any history after current index (for redo)
      const newHistory = prev.slice(0, historyIndex + 1);

      // Add new action
      newHistory.push({
        action,
        beforeState,
        afterState,
        timestamp: new Date().toISOString(),
      });

      // Keep history size manageable
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }

      return newHistory;
    });

    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex, MAX_HISTORY_SIZE]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return false;

    const historyItem = history[historyIndex];
    if (!historyItem) return false;

    // Restore previous state
    setRateCalendar(historyItem.beforeState);
    setHistoryIndex(prev => prev - 1);

    return true;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return false;

    const historyItem = history[historyIndex + 1];
    if (!historyItem) return false;

    // Restore next state
    setRateCalendar(historyItem.afterState);
    setHistoryIndex(prev => prev + 1);

    return true;
  }, [history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  // ============================================
  // RATE CALENDAR FUNCTIONS
  // ============================================

  const getRateForDate = useCallback((roomTypeId, date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return rateCalendar[dateStr]?.rooms?.[roomTypeId] || null;
  }, [rateCalendar]);

  const updateRate = useCallback((roomTypeId, date, newRate, reason = 'Manual override') => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    setRateCalendar(prev => {
      // Store current state for undo
      const beforeState = { ...prev };

      const updated = { ...prev };
      if (updated[dateStr]?.rooms?.[roomTypeId]) {
        updated[dateStr] = {
          ...updated[dateStr],
          rooms: {
            ...updated[dateStr].rooms,
            [roomTypeId]: {
              ...updated[dateStr].rooms[roomTypeId],
              dynamicRate: newRate,
              overrideRate: newRate,
              overrideReason: reason,
              rates: {
                ...updated[dateStr].rooms[roomTypeId].rates,
                BAR: newRate,
                OTA: Math.round(newRate * 1.15),
                CORP: Math.round(newRate * 0.80),
              },
            },
          },
        };

        // Add to history
        const action = {
          type: 'updateRate',
          roomTypeId,
          date: dateStr,
          oldRate: prev[dateStr]?.rooms?.[roomTypeId]?.dynamicRate,
          newRate,
          reason,
        };
        addToHistory(action, beforeState, updated);
      }
      return updated;
    });
  }, [addToHistory]);

  const applyRestriction = useCallback((roomTypeId, date, restriction) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    setRateCalendar(prev => {
      const updated = { ...prev };
      if (updated[dateStr]?.rooms?.[roomTypeId]) {
        updated[dateStr] = {
          ...updated[dateStr],
          rooms: {
            ...updated[dateStr].rooms,
            [roomTypeId]: {
              ...updated[dateStr].rooms[roomTypeId],
              restrictions: {
                ...updated[dateStr].rooms[roomTypeId].restrictions,
                ...restriction,
              },
            },
          },
        };
      }
      return updated;
    });
  }, []);

  const applyPromotion = useCallback((roomTypeId, date, promo) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const currentRate = getRateForDate(roomTypeId, dateStr);

    if (currentRate) {
      const discountedRate = Math.round(currentRate.dynamicRate * (1 - promo.discountPercent / 100));
      updateRate(roomTypeId, dateStr, discountedRate, `Promo: ${promo.name}`);
    }
  }, [getRateForDate, updateRate]);

  // ============================================
  // DYNAMIC PRICING ENGINE
  // ============================================

  const calculateDynamicRate = useCallback((roomTypeId, date, inputs = {}) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const dateObj = new Date(dateStr);

    // Get room type base rate
    const roomType = roomTypes.find(r => r.id === roomTypeId);
    if (!roomType) return null;

    const baseRate = roomType.baseRate;

    // Get context data
    const month = dateObj.getMonth() + 1;
    const dayOfWeek = dateObj.getDay();
    const daysOut = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));

    // Factors
    const seasonFactor = seasonalityFactors[month] || 1.0;
    const dowFactor = dayOfWeekFactors[dayOfWeek] || 1.0;

    // Event factor
    const event = specialEvents.find(e => e.date === dateStr);
    const eventFactor = event ? event.factor : 1.0;

    // Occupancy factor (from inputs or calendar)
    const occupancy = inputs.occupancy || rateCalendar[dateStr]?.occupancy || 70;
    let occupancyFactor = 1.0;
    if (occupancy >= 90) occupancyFactor = 1.25;
    else if (occupancy >= 80) occupancyFactor = 1.15;
    else if (occupancy >= 70) occupancyFactor = 1.05;
    else if (occupancy >= 50) occupancyFactor = 0.95;
    else occupancyFactor = 0.85;

    // Lead time factor
    let leadTimeFactor = 1.0;
    if (daysOut <= 1) leadTimeFactor = 1.20;
    else if (daysOut <= 3) leadTimeFactor = 1.10;
    else if (daysOut <= 7) leadTimeFactor = 1.05;
    else if (daysOut <= 14) leadTimeFactor = 1.0;
    else if (daysOut <= 30) leadTimeFactor = 0.95;
    else leadTimeFactor = 0.90;

    // Competitor factor
    const competitorData = competitors[dateStr];
    let competitorFactor = 1.0;
    if (competitorData?.analysis) {
      const gap = competitorData.analysis.rateGapPercent;
      if (gap < -15) competitorFactor = 1.10; // We're much cheaper
      else if (gap < -5) competitorFactor = 1.05;
      else if (gap > 15) competitorFactor = 0.95;
      else if (gap > 5) competitorFactor = 0.98;
    }

    // Pickup/demand factor
    const pickupData = pickup[dateStr];
    let demandFactor = 1.0;
    if (pickupData) {
      if (pickupData.paceStatus === 'strong') demandFactor = 1.12;
      else if (pickupData.paceStatus === 'on-pace') demandFactor = 1.0;
      else if (pickupData.paceStatus === 'slow') demandFactor = 0.92;
      else demandFactor = 0.85;
    }

    // Promo discount (if applicable)
    const promoDiscount = inputs.promoDiscount || 0;

    // Calculate dynamic rate
    const dynamicRate = Math.round(
      baseRate *
      seasonFactor *
      dowFactor *
      eventFactor *
      occupancyFactor *
      leadTimeFactor *
      competitorFactor *
      demandFactor *
      (1 - promoDiscount / 100)
    );

    return {
      baseRate,
      dynamicRate,
      factors: {
        seasonality: seasonFactor,
        dayOfWeek: dowFactor,
        event: eventFactor,
        occupancy: occupancyFactor,
        leadTime: leadTimeFactor,
        competitor: competitorFactor,
        demand: demandFactor,
        promo: 1 - promoDiscount / 100,
      },
      adjustment: dynamicRate - baseRate,
      adjustmentPercent: Math.round(((dynamicRate - baseRate) / baseRate) * 100),
    };
  }, [rateCalendar, competitors, pickup]);

  // ============================================
  // PRICING RULES ENGINE
  // ============================================

  const applyRulesForDate = useCallback((date, roomTypeId = 'ALL') => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const dateObj = new Date(dateStr);
    const daysOut = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));

    const results = [];

    const roomTypesToProcess = roomTypeId === 'ALL'
      ? roomTypes
      : roomTypes.filter(r => r.id === roomTypeId);

    roomTypesToProcess.forEach(room => {
      const calendarData = rateCalendar[dateStr];
      const roomData = calendarData?.rooms?.[room.id];

      if (!roomData) return;

      // Build context for rule evaluation
      const context = {
        roomType: room.id,
        occupancy: calendarData.occupancy,
        pickupPace: pickup[dateStr]?.bookingProgress || 50,
        competitorGap: competitors[dateStr]?.analysis?.rateGapPercent || 0,
        daysOut,
        dayOfWeek: dateObj.getDay(),
        demandLevel: forecast[dateStr]?.demandLevel || 'normal',
        segment: 'direct', // Default segment
        hasEvent: !!calendarData.event,
      };

      const ruleResult = calculateRuleBasedRate(rules, roomData.baseRate, context);

      if (ruleResult.appliedRules.length > 0) {
        results.push({
          roomType: room.id,
          roomTypeName: room.name,
          date: dateStr,
          ...ruleResult,
        });

        // Update the rate calendar with rule-based rate
        if (ruleResult.rate !== roomData.dynamicRate) {
          updateRate(room.id, dateStr, ruleResult.rate, `Rule: ${ruleResult.appliedRules.map(r => r.ruleName).join(', ')}`);
        }
      }
    });

    return results;
  }, [rateCalendar, pickup, competitors, forecast, rules, updateRate]);

  const runAllRules = useCallback(() => {
    const results = [];
    const dates = Object.keys(rateCalendar).slice(0, 90);

    dates.forEach(date => {
      const dateResults = applyRulesForDate(date, 'ALL');
      results.push(...dateResults);
    });

    setLastRecalculation(new Date().toISOString());
    return results;
  }, [rateCalendar, applyRulesForDate]);

  // Rule CRUD operations
  const addRule = useCallback((rule) => {
    const newRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastTriggered: null,
      timesTriggered: 0,
    };
    setRules(prev => [...prev, newRule]);
    return newRule;
  }, []);

  const updateRule = useCallback((ruleId, updates) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates } : r));
  }, []);

  const deleteRule = useCallback((ruleId) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  const toggleRule = useCallback((ruleId) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
  }, []);

  // ============================================
  // FORECAST FUNCTIONS
  // ============================================

  const runForecast = useCallback(() => {
    const newForecast = generateForecast();
    setForecast(newForecast);
    return newForecast;
  }, []);

  const simulateDemandSurge = useCallback((date, multiplier = 1.3) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    setForecast(prev => {
      if (!prev[dateStr]) return prev;

      return {
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          demandIndex: prev[dateStr].demandIndex * multiplier,
          demandLevel: multiplier >= 1.3 ? 'compression' : 'high',
          forecast: {
            ...prev[dateStr].forecast,
            occupancy: Math.min(98, Math.round(prev[dateStr].forecast.occupancy * multiplier)),
            adr: Math.round(prev[dateStr].forecast.adr * multiplier),
          },
        },
      };
    });
  }, []);

  const simulateDemandDrop = useCallback((date, multiplier = 0.7) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    setForecast(prev => {
      if (!prev[dateStr]) return prev;

      return {
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          demandIndex: prev[dateStr].demandIndex * multiplier,
          demandLevel: multiplier <= 0.7 ? 'very_low' : 'low',
          forecast: {
            ...prev[dateStr].forecast,
            occupancy: Math.round(prev[dateStr].forecast.occupancy * multiplier),
            adr: Math.round(prev[dateStr].forecast.adr * multiplier),
          },
        },
      };
    });
  }, []);

  // ============================================
  // PICKUP FUNCTIONS
  // ============================================

  const updatePickup = useCallback(() => {
    const newPickup = generatePickupData();
    setPickup(newPickup);
    return newPickup;
  }, []);

  const calculatePickupByDate = useCallback((date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return pickup[dateStr] || null;
  }, [pickup]);

  const compareToHistorical = useCallback((date) => {
    const pickupData = calculatePickupByDate(date);
    if (!pickupData) return null;

    return {
      vsLastYear: pickupData.comparisons.lastYear,
      vsLastWeek: pickupData.comparisons.lastWeek,
      paceStatus: pickupData.paceStatus,
      alerts: pickupData.alerts,
    };
  }, [calculatePickupByDate]);

  const predictPickup = useCallback((date) => {
    const pickupData = calculatePickupByDate(date);
    if (!pickupData) return null;

    return {
      currentBookings: pickupData.currentBookings,
      predictedFinal: pickupData.predictedFinal,
      remainingToSell: pickupData.remainingToSell,
      confidence: Math.max(50, 95 - (pickupData.daysOut * 0.5)),
    };
  }, [calculatePickupByDate]);

  // ============================================
  // COMPETITOR FUNCTIONS
  // ============================================

  const updateCompetitorRates = useCallback(() => {
    const newCompetitors = generateCompetitorRates(new Date(), rateCalendar);
    setCompetitors(newCompetitors);
    return newCompetitors;
  }, [rateCalendar]);

  const calculateRateParity = useCallback(() => {
    return checkRateParity(competitors);
  }, [competitors]);

  const detectUnderpricing = useCallback(() => {
    const issues = calculateRateParity();
    return issues.filter(i => i.type === 'underpriced');
  }, [calculateRateParity]);

  const detectOverpricing = useCallback(() => {
    const issues = calculateRateParity();
    return issues.filter(i => i.type === 'overpriced');
  }, [calculateRateParity]);

  // ============================================
  // SEGMENT FUNCTIONS
  // ============================================

  const updateSegmentPerformance = useCallback(() => {
    const newPerformance = generateSegmentPerformance();
    setSegmentPerformance(newPerformance);
    return newPerformance;
  }, []);

  const calculateSegmentADR = useCallback((segmentId) => {
    return segmentPerformance[segmentId]?.ytd?.adr || 0;
  }, [segmentPerformance]);

  const calculateSegmentContribution = useCallback((segmentId) => {
    return segmentPerformance[segmentId]?.metrics?.revenueContribution || 0;
  }, [segmentPerformance]);

  // ============================================
  // AI RECOMMENDATIONS ENGINE
  // ============================================

  function generateAIPricingSuggestions() {
    const suggestions = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check next 14 days for opportunities
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const forecastData = forecast[dateStr];
      const pickupData = pickup[dateStr];
      const competitorData = competitors[dateStr];
      const calendarData = rateCalendar[dateStr];

      if (!forecastData || !calendarData) continue;

      // High demand - raise rates
      if (forecastData.demandLevel === 'compression' || forecastData.demandLevel === 'high') {
        const suggestedIncrease = forecastData.demandLevel === 'compression' ? 25 : 15;
        suggestions.push({
          id: `sug_${dateStr}_demand`,
          type: 'rate_increase',
          priority: forecastData.demandLevel === 'compression' ? 'critical' : 'high',
          date: dateStr,
          title: `${forecastData.demandLevel === 'compression' ? 'Compression' : 'High Demand'} Day Detected`,
          message: `${forecastData.event ? forecastData.event.name + ': ' : ''}Expected ${forecastData.forecast.occupancy}% occupancy. Increase rates ${suggestedIncrease}% to maximize revenue.`,
          action: {
            type: 'increase_rate',
            value: suggestedIncrease,
          },
          potentialRevenue: Math.round(suggestedIncrease * 50 * 0.01 * 70),
        });
      }

      // Low pickup - stimulate demand
      if (pickupData?.paceStatus === 'critical' && i <= 7) {
        suggestions.push({
          id: `sug_${dateStr}_pickup`,
          type: 'rate_decrease',
          priority: 'high',
          date: dateStr,
          title: 'Critical Pickup Gap',
          message: `Only ${pickupData.bookingProgress}% booked with ${i} days to go. Activate promotions or reduce rates 10-15%.`,
          action: {
            type: 'decrease_rate',
            value: 12,
          },
          riskAmount: Math.round(pickupData.remainingToSell * 180),
        });
      }

      // Underpriced vs competitors
      if (competitorData?.analysis?.positioning === 'significantly_below') {
        suggestions.push({
          id: `sug_${dateStr}_comp`,
          type: 'rate_increase',
          priority: 'medium',
          date: dateStr,
          title: 'Below Market Rate',
          message: `Your rate is ${Math.abs(competitorData.analysis.rateGapPercent)}% below market average. Potential revenue loss of $${Math.round(Math.abs(competitorData.analysis.rateGap) * 50)}.`,
          action: {
            type: 'increase_rate',
            value: Math.round(Math.abs(competitorData.analysis.rateGapPercent) * 0.6),
          },
          potentialRevenue: Math.round(Math.abs(competitorData.analysis.rateGap) * 50),
        });
      }

      // Event-based suggestion
      if (forecastData.event && i <= 7) {
        const hasMinStay = calendarData.rooms?.STD?.restrictions?.minStay > 1;
        if (!hasMinStay) {
          suggestions.push({
            id: `sug_${dateStr}_event`,
            type: 'restriction',
            priority: 'medium',
            date: dateStr,
            title: 'Apply Event Restrictions',
            message: `${forecastData.event.name} detected. Apply 2-night minimum stay to maximize revenue.`,
            action: {
              type: 'apply_min_stay',
              value: 2,
            },
          });
        }
      }
    }

    // Sort by priority and date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.date) - new Date(b.date);
    });

    return suggestions.slice(0, 10); // Top 10 recommendations
  }

  const applyRecommendation = useCallback((recommendation) => {
    const { date, action } = recommendation;

    switch (action.type) {
      case 'increase_rate':
      case 'decrease_rate':
        roomTypes.forEach(room => {
          const currentRate = getRateForDate(room.id, date);
          if (currentRate) {
            const multiplier = action.type === 'increase_rate'
              ? 1 + action.value / 100
              : 1 - action.value / 100;
            const newRate = Math.round(currentRate.dynamicRate * multiplier);
            updateRate(room.id, date, newRate, `AI Recommendation: ${action.type}`);
          }
        });
        break;

      case 'apply_min_stay':
        roomTypes.forEach(room => {
          applyRestriction(room.id, date, { minStay: action.value });
        });
        break;

      case 'apply_stop_sell':
        roomTypes.forEach(room => {
          applyRestriction(room.id, date, { stopSell: true });
        });
        break;
    }

    // Remove applied recommendation
    setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  }, [getRateForDate, updateRate, applyRestriction]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const forecastSummary = calculateForecastSummary(forecast);
  const forecastInsights = generateForecastInsights(forecast);
  const highImpactDays = getHighImpactDays(forecast);
  const opportunityDays = getOpportunityDays(forecast);
  const pickupMetrics = calculatePickupMetrics(pickup);
  const competitorInsights = getCompetitorInsights(competitors);
  const parityIssues = checkRateParity(competitors);
  const segmentComparison = getSegmentComparison(segmentPerformance);
  const ruleAnalytics = getRuleAnalytics(rules);

  const value = {
    // State
    rateCalendar,
    rules,
    forecast,
    pickup,
    competitors,
    segmentPerformance,
    recommendations,
    lastRecalculation,

    // Static data
    roomTypes,
    rateCodes,
    segments,

    // Undo/Redo
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    history,
    historyIndex,

    // Rate Calendar functions
    getRateForDate,
    updateRate,
    applyRestriction,
    applyPromotion,

    // Dynamic Pricing
    calculateDynamicRate,

    // Rules Engine
    applyRulesForDate,
    runAllRules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,

    // Forecast
    runForecast,
    simulateDemandSurge,
    simulateDemandDrop,
    forecastSummary,
    forecastInsights,
    highImpactDays,
    opportunityDays,

    // Pickup
    updatePickup,
    calculatePickupByDate,
    compareToHistorical,
    predictPickup,
    pickupMetrics,

    // Competitors
    updateCompetitorRates,
    calculateRateParity,
    detectUnderpricing,
    detectOverpricing,
    competitorInsights,
    parityIssues,

    // Segments
    updateSegmentPerformance,
    calculateSegmentADR,
    calculateSegmentContribution,
    segmentComparison,

    // Rules Analytics
    ruleAnalytics,

    // AI Recommendations
    applyRecommendation,
    generateRecommendations: () => {
      const newRecs = generateAIPricingSuggestions();
      setRecommendations(newRecs);
      return newRecs;
    },
  };

  return (
    <RMSContext.Provider value={value}>
      {children}
    </RMSContext.Provider>
  );
}

export default RMSContext;
