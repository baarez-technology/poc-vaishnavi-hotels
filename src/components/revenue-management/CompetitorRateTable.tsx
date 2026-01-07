import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, RefreshCw, DollarSign, ArrowLeftRight, BarChart3 } from 'lucide-react';
import { useRMS } from '../../context/RMSContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui2/Button';
import { Drawer } from '../ui2/Drawer';

const CompetitorRateTable = ({ dateRange = 14 }) => {
  const { competitors, competitorInsights, parityIssues, updateCompetitorRates } = useRMS();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const tableData = useMemo(() => {
    const today = new Date();
    const data = [];

    for (let i = 0; i < dateRange; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const compData = competitors[dateStr];

      if (compData) {
        data.push({
          date: dateStr,
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          ourRate: compData.ourRate,
          avgMarket: compData.analysis.avgMarketRate,
          minMarket: compData.analysis.minMarketRate,
          maxMarket: compData.analysis.maxMarketRate,
          gap: compData.analysis.rateGap,
          gapPercent: compData.analysis.rateGapPercent,
          positioning: compData.analysis.positioning,
          cheaperThan: compData.analysis.cheaperThan,
          moreExpensiveThan: compData.analysis.moreExpensiveThan,
          recommendation: compData.analysis.recommendation,
          competitors: compData.competitors,
        });
      }
    }

    // Sort data
    data.sort((a, b) => {
      let compareValue;
      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.date) - new Date(b.date);
          break;
        case 'ourRate':
          compareValue = a.ourRate - b.ourRate;
          break;
        case 'gap':
          compareValue = a.gapPercent - b.gapPercent;
          break;
        default:
          compareValue = 0;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return data;
  }, [competitors, dateRange, sortBy, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = tableData.slice(startIndex, endIndex);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateCompetitorRates();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getPositionStyles = (positioning) => {
    switch (positioning) {
      case 'significantly_below':
        return 'bg-sage-100 text-sage-700';
      case 'below_market':
        return 'bg-sage-50 text-sage-600';
      case 'at_market':
        return 'bg-ocean-50 text-ocean-600';
      case 'above_market':
        return 'bg-gold-50 text-gold-600';
      case 'significantly_above':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-neutral-50 text-neutral-600';
    }
  };

  const getGapIndicator = (gapPercent) => {
    if (gapPercent > 5) {
      return <TrendingUp className="w-4 h-4 text-rose-500" />;
    } else if (gapPercent < -5) {
      return <TrendingDown className="w-4 h-4 text-sage-500" />;
    }
    return <Minus className="w-4 h-4 text-neutral-400" />;
  };

  const handleQuickAdjust = (row, adjustType) => {
    setSelectedRow(row);
    setShowAdjustModal(true);
  };

  const handleMatchMarket = (row) => {
    const newRate = row.avgMarket;
    const oldRate = row.ourRate;
    const diff = newRate - oldRate;

    // Navigate to Rate Calendar with pre-filled adjustment
    navigate('/admin/revenue/calendar', {
      state: {
        preselectedDate: row.date,
        suggestedRate: newRate,
        reason: `Match market avg (was $${oldRate}, market avg $${row.avgMarket})`
      }
    });
  };

  const handleMatchLowest = (row) => {
    const newRate = row.minMarket - 5; // Undercut by $5
    navigate('/admin/revenue/calendar', {
      state: {
        preselectedDate: row.date,
        suggestedRate: newRate,
        reason: `Undercut lowest competitor (market min $${row.minMarket})`
      }
    });
  };

  const applyAdjustment = () => {
    if (!selectedRow) return;

    // This would integrate with RMS context to actually update rates
    // For now, navigate to Rate Calendar
    navigate('/admin/revenue/calendar', {
      state: {
        preselectedDate: selectedRow.date,
        currentRate: selectedRow.ourRate,
        marketAvg: selectedRow.avgMarket,
        marketMin: selectedRow.minMarket,
        marketMax: selectedRow.maxMarket,
      }
    });

    setShowAdjustModal(false);
    setSelectedRow(null);
  };

  return (
    <>
    <div className="rounded-[10px] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Competitor Rate Comparison</h3>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
            Next {dateRange} days • Last updated: Just now
          </p>
        </div>
        <Button
          variant="primary"
          icon={RefreshCw}
          onClick={handleRefresh}
          disabled={isRefreshing}
          loading={isRefreshing}
        >
          Refresh Rates
        </Button>
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-neutral-50/50 border-t border-neutral-100">
            <tr>
              <th
                className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors min-w-[160px]"
                onClick={() => handleSort('date')}
              >
                Date
              </th>
              <th
                className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors min-w-[140px]"
                onClick={() => handleSort('ourRate')}
              >
                Our Rate
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-400 min-w-[140px]">
                Market Avg
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-400 min-w-[130px]">
                Cheapest
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-400 min-w-[160px]">
                Most Expensive
              </th>
              <th
                className="px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors min-w-[140px]"
                onClick={() => handleSort('gap')}
              >
                Price Gap
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400 min-w-[200px]">
                Position
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-neutral-400 min-w-[240px]">
                Recommendation
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400 min-w-[180px]">
                Quick Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginatedData.map((row) => (
              <tr
                key={row.date}
                className="bg-white hover:bg-neutral-50/80 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900">{row.displayDate}</p>
                    <p className="text-[11px] text-neutral-400">{row.dayName}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-[15px] font-semibold text-neutral-900">
                  ${row.ourRate}
                </td>
                <td className="px-6 py-4 text-right text-[13px] text-neutral-700">
                  ${row.avgMarket}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[13px] font-medium text-sage-600">${row.minMarket}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[13px] font-medium text-rose-500">${row.maxMarket}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1.5">
                    {getGapIndicator(row.gapPercent)}
                    <span className={`text-[13px] font-bold ${row.gapPercent > 0 ? 'text-rose-500' : row.gapPercent < 0 ? 'text-sage-600' : 'text-neutral-600'}`}>
                      {row.gapPercent > 0 ? '+' : ''}{row.gapPercent}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-md ${getPositionStyles(row.positioning)}`}>
                    {row.positioning?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {row.recommendation.urgency === 'high' ? (
                      <AlertTriangle className="w-4 h-4 text-gold-500 flex-shrink-0" />
                    ) : row.recommendation.action === 'hold' ? (
                      <CheckCircle className="w-4 h-4 text-sage-500 flex-shrink-0" />
                    ) : null}
                    <span className="text-[11px] font-medium text-neutral-600 line-clamp-2">
                      {row.recommendation.message}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    {row.recommendation.action !== 'hold' && (
                      <>
                        <button
                          onClick={() => handleMatchMarket(row)}
                          className="text-[11px] font-semibold text-terra-600 hover:text-terra-700 transition-colors"
                          title="Match market average"
                        >
                          Match Avg
                        </button>
                        {(row.positioning === 'above_market' || row.positioning === 'significantly_above') && (
                          <button
                            onClick={() => handleMatchLowest(row)}
                            className="text-[11px] font-semibold text-sage-600 hover:text-sage-700 transition-colors"
                            title="Undercut lowest competitor by $5"
                          >
                            Undercut
                          </button>
                        )}
                        <button
                          onClick={() => handleQuickAdjust(row)}
                          className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
                          title="Open rate editor"
                        >
                          Adjust
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-white">
          <p className="text-[13px] text-neutral-400 font-medium">
            Showing <span className="font-semibold text-neutral-700">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-neutral-700">{Math.min(endIndex, tableData.length)}</span> of{' '}
            <span className="font-semibold text-neutral-700">{tableData.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
                currentPage === 1
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 text-[13px] font-semibold rounded-lg transition-all ${
                    currentPage === page
                      ? 'bg-terra-500 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Mobile Card View (visible on mobile only) */}
      <div className="md:hidden divide-y divide-neutral-100">
        {paginatedData.map((row) => (
          <div key={row.date} className="p-4 hover:bg-neutral-50 transition-colors">
            {/* Date Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[13px] font-semibold text-neutral-900">{row.displayDate}</p>
                <p className="text-[11px] text-neutral-400">{row.dayName}</p>
              </div>
              <span className={`inline-block px-2 py-1 text-[11px] font-semibold rounded-md ${getPositionStyles(row.positioning)}`}>
                {row.positioning?.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Rate Comparison */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-neutral-50 rounded-lg">
                <p className="text-[10px] text-neutral-400 mb-1">Our Rate</p>
                <p className="text-[15px] font-bold text-neutral-900">${row.ourRate}</p>
              </div>
              <div className="text-center p-2 bg-ocean-50 rounded-lg">
                <p className="text-[10px] text-neutral-400 mb-1">Market Avg</p>
                <p className="text-[15px] font-bold text-ocean-600">${row.avgMarket}</p>
              </div>
              <div className="text-center p-2 bg-neutral-50 rounded-lg">
                <p className="text-[10px] text-neutral-400 mb-1">Gap</p>
                <div className="flex items-center justify-center gap-1">
                  {getGapIndicator(row.gapPercent)}
                  <span className={`text-[13px] font-bold ${row.gapPercent > 0 ? 'text-rose-500' : row.gapPercent < 0 ? 'text-sage-600' : 'text-neutral-600'}`}>
                    {row.gapPercent > 0 ? '+' : ''}{row.gapPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Market Range */}
            <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-3 px-2">
              <span>Min: <span className="font-semibold text-sage-600">${row.minMarket}</span></span>
              <span>Max: <span className="font-semibold text-rose-500">${row.maxMarket}</span></span>
            </div>

            {/* Recommendation */}
            <div className="p-2 bg-gold-50 rounded-lg mb-3">
              <div className="flex items-start gap-2">
                {row.recommendation.urgency === 'high' ? (
                  <AlertTriangle className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                ) : row.recommendation.action === 'hold' ? (
                  <CheckCircle className="w-4 h-4 text-sage-500 flex-shrink-0 mt-0.5" />
                ) : null}
                <p className="text-[11px] text-neutral-700">{row.recommendation.message}</p>
              </div>
            </div>

            {/* Quick Actions */}
            {row.recommendation.action !== 'hold' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleMatchMarket(row)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-medium text-terra-600 bg-terra-50 rounded-lg hover:bg-terra-100 transition-colors"
                  aria-label="Match market average rate"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Match Avg</span>
                </button>
                {(row.positioning === 'above_market' || row.positioning === 'significantly_above') && (
                  <button
                    onClick={() => handleMatchLowest(row)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-medium text-sage-600 bg-sage-50 rounded-lg hover:bg-sage-100 transition-colors"
                    aria-label="Undercut lowest competitor"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Undercut</span>
                  </button>
                )}
                <button
                  onClick={() => handleQuickAdjust(row)}
                  className="px-3 py-2.5 text-[13px] font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                  aria-label="Open rate adjustment options"
                >
                  <DollarSign className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Parity Issues Alert */}
      {parityIssues.length > 0 && (
        <div className="p-4 border-t border-neutral-100 bg-gold-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-gold-800">
                {parityIssues.length} Rate Parity Issues Detected
              </p>
              <p className="text-[11px] text-gold-700 mt-1">
                {parityIssues.filter(i => i.type === 'underpriced').length} underpriced days,{' '}
                {parityIssues.filter(i => i.type === 'overpriced').length} overpriced days.
                Total potential revenue impact: ${parityIssues.reduce((sum, i) => sum + (i.potentialRevenueLoss || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Quick Adjust Drawer */}
      <Drawer
        isOpen={showAdjustModal && selectedRow}
        onClose={() => {
          setShowAdjustModal(false);
          setSelectedRow(null);
        }}
        title={`Adjust Rate — ${selectedRow?.displayDate}`}
        subtitle="Compare and adjust your rate against market positioning"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAdjustModal(false);
                setSelectedRow(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                applyAdjustment();
              }}
            >
              Open Rate Calendar
            </Button>
          </>
        }
      >
        {selectedRow && (
          <div className="space-y-6">
            {/* Current vs Market Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-neutral-50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">Your Rate</p>
                <p className="text-2xl font-bold text-neutral-900">${selectedRow.ourRate}</p>
              </div>
              <div className="p-4 rounded-lg bg-ocean-50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">Market Avg</p>
                <p className="text-2xl font-bold text-ocean-600">${selectedRow.avgMarket}</p>
              </div>
            </div>

            {/* Price Gap */}
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <span className="text-[13px] font-medium text-neutral-600">Price Gap</span>
              <div className="flex items-center gap-2">
                {getGapIndicator(selectedRow.gapPercent)}
                <span className={`text-[15px] font-bold ${
                  selectedRow.gapPercent > 0 ? 'text-rose-500' : selectedRow.gapPercent < 0 ? 'text-sage-600' : 'text-neutral-600'
                }`}>
                  {selectedRow.gapPercent > 0 ? '+' : ''}{selectedRow.gapPercent}%
                </span>
                <span className="text-[11px] text-neutral-400">
                  (${Math.abs(selectedRow.ourRate - selectedRow.avgMarket)})
                </span>
              </div>
            </div>

            {/* Market Range */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
                Market Range
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[11px] text-neutral-400 mb-1">Lowest</p>
                  <p className="text-lg font-bold text-sage-600">${selectedRow.minMarket}</p>
                </div>
                <div className="flex-1 relative h-1.5 rounded-full bg-neutral-100">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sage-300 via-gold-300 to-rose-300" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neutral-900 border-2 border-white shadow-md"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((selectedRow.ourRate - selectedRow.minMarket) / (selectedRow.maxMarket - selectedRow.minMarket)) * 100))}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-neutral-400 mb-1">Highest</p>
                  <p className="text-lg font-bold text-rose-500">${selectedRow.maxMarket}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-100" />

            {/* Quick Adjustments */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
                Quick Adjustments
              </p>
              <div className="space-y-3">
                {/* Match Market Option */}
                <button
                  onClick={() => {
                    handleMatchMarket(selectedRow);
                    setShowAdjustModal(false);
                  }}
                  className="w-full p-4 rounded-lg border border-neutral-200 hover:border-terra-300 hover:bg-terra-50/50 transition-all group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900 group-hover:text-terra-700">Match Market Average</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Set your rate to market average</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-neutral-900">${selectedRow.avgMarket}</p>
                      <p className={`text-[11px] font-medium ${
                        selectedRow.avgMarket > selectedRow.ourRate ? 'text-sage-600' : selectedRow.avgMarket < selectedRow.ourRate ? 'text-rose-500' : 'text-neutral-400'
                      }`}>
                        {selectedRow.avgMarket > selectedRow.ourRate ? '+' : ''}{selectedRow.avgMarket - selectedRow.ourRate !== 0 ? `$${selectedRow.avgMarket - selectedRow.ourRate}` : 'No change'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Undercut Market Option */}
                <button
                  onClick={() => {
                    handleMatchLowest(selectedRow);
                    setShowAdjustModal(false);
                  }}
                  className="w-full p-4 rounded-lg border border-neutral-200 hover:border-sage-300 hover:bg-sage-50/50 transition-all group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900 group-hover:text-sage-700">Undercut Lowest</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">$5 below lowest competitor</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-neutral-900">${selectedRow.minMarket - 5}</p>
                      <p className="text-[11px] font-medium text-sage-600">-$5 below min</p>
                    </div>
                  </div>
                </button>

                {/* Premium Position Option */}
                <button
                  onClick={() => {
                    navigate('/admin/revenue/calendar', {
                      state: {
                        preselectedDate: selectedRow.date,
                        suggestedRate: selectedRow.maxMarket,
                        reason: `Premium position at market high ($${selectedRow.maxMarket})`
                      }
                    });
                    setShowAdjustModal(false);
                  }}
                  className="w-full p-4 rounded-lg border border-neutral-200 hover:border-gold-300 hover:bg-gold-50/50 transition-all group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900 group-hover:text-gold-700">Premium Position</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Match highest competitor</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-neutral-900">${selectedRow.maxMarket}</p>
                      <p className="text-[11px] font-medium text-gold-600">Market high</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

// Competitor Card Component
export const CompetitorCard = ({ competitor, date }) => {
  const { competitors } = useRMS();
  const dateStr = typeof date === 'string' ? date : date?.toISOString().split('T')[0];
  const compData = competitors[dateStr]?.competitors?.[competitor.id];

  if (!compData) return null;

  return (
    <div className="p-5 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-white transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-[13px] font-semibold text-neutral-900">{compData.competitorName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {Array.from({ length: compData.starRating }).map((_, i) => (
                <span key={i} className="text-gold-400 text-[11px]">★</span>
              ))}
            </div>
            <span className="text-[11px] font-medium text-neutral-400 capitalize">{compData.position}</span>
          </div>
        </div>
        <span className={`px-2 py-1 text-[10px] font-semibold rounded-md ${
          compData.availability === 'available' ? 'bg-sage-50 text-sage-700' :
          compData.availability === 'limited' ? 'bg-gold-50 text-gold-700' :
          'bg-rose-50 text-rose-700'
        }`}>
          {compData.availability}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-500">Average Rate</span>
          <span className="text-xl font-bold text-neutral-900">${compData.avgRate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-500">Range</span>
          <span className="text-[13px] font-semibold text-neutral-700">${compData.minRate} - ${compData.maxRate}</span>
        </div>
      </div>

      {/* Rates by Source */}
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">Rates by Channel</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(compData.rates).map(([source, rate]) => (
            <div key={source} className="flex items-center justify-between text-[11px]">
              <span className="capitalize font-medium text-neutral-500">{source}</span>
              <span className="font-bold text-neutral-900">${rate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompetitorRateTable;
