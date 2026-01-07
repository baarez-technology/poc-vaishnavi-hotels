import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Download, RefreshCw, ChevronDown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import reviewsData from '../../data/dummy/reports/reviews.json';

// Helper function to download CSV
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate CSV content for export
const generateGuestExportCSV = (reviews: any[], ratingBySource: any[], sentimentDist: any[]) => {
  const lines: string[] = [];

  lines.push('=== GUEST EXPERIENCE REPORT ===');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  lines.push('--- Reviews ---');
  lines.push('Date,Source,Guest,Rating,Sentiment');
  reviews.forEach(r => {
    lines.push(`${r.date},${r.source},${r.guest},${r.rating},${r.sentiment}%`);
  });
  lines.push('');

  lines.push('--- Rating by Platform ---');
  lines.push('Platform,Reviews,Avg Rating');
  ratingBySource.forEach(r => {
    lines.push(`${r.name},${r.reviews},${r.avgRating}`);
  });
  lines.push('');

  lines.push('--- Sentiment Distribution ---');
  lines.push('Category,Count');
  sentimentDist.forEach(s => {
    lines.push(`${s.name},${s.value}`);
  });

  return lines.join('\n');
};

const SENTIMENT_COLORS = {
  Positive: '#4E5840',
  Neutral: '#5C9BA4',
  Negative: '#CDB261'
};

const SOURCE_COLORS = ['#A57865', '#5C9BA4', '#4E5840', '#CDB261', '#C8B29D'];

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'ytd', label: 'Year to Date' }
];

export default function GuestExperienceReport() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const totalReviews = reviewsData.length;
    const avgRating = (
      reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
    ).toFixed(1);
    const avgSentiment = Math.round(
      reviewsData.reduce((sum, r) => sum + (r.sentiment || 0), 0) / totalReviews
    );
    const positiveReviews = reviewsData.filter((r) => r.sentiment >= 70).length;
    const negativeReviews = reviewsData.filter((r) => r.sentiment < 40).length;
    const responseRate = 92;

    return { totalReviews, avgRating, avgSentiment, positiveReviews, negativeReviews, responseRate };
  }, []);

  // Reviews by source for pie chart
  const reviewsBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    reviewsData.forEach((r) => {
      counts[r.source] = (counts[r.source] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: SOURCE_COLORS[index % SOURCE_COLORS.length]
    }));
  }, []);

  const totalSourceReviews = reviewsBySource.reduce((sum, s) => sum + s.value, 0);

  // Sentiment distribution for pie chart
  const sentimentDistribution = useMemo(() => {
    const positive = reviewsData.filter((r) => r.sentiment >= 70).length;
    const neutral = reviewsData.filter((r) => r.sentiment >= 40 && r.sentiment < 70).length;
    const negative = reviewsData.filter((r) => r.sentiment < 40).length;

    return [
      { name: 'Positive', value: positive, color: SENTIMENT_COLORS.Positive },
      { name: 'Neutral', value: neutral, color: SENTIMENT_COLORS.Neutral },
      { name: 'Negative', value: negative, color: SENTIMENT_COLORS.Negative }
    ];
  }, []);

  const totalSentiment = sentimentDistribution.reduce((sum, s) => sum + s.value, 0);

  // Rating by source for bar chart
  const ratingBySource = useMemo(() => {
    const sources: Record<string, { ratings: number[]; count: number }> = {};
    reviewsData.forEach((r) => {
      if (!sources[r.source]) {
        sources[r.source] = { ratings: [], count: 0 };
      }
      sources[r.source].ratings.push(r.rating || 0);
      sources[r.source].count++;
    });

    return Object.entries(sources).map(([source, data]) => ({
      name: source,
      avgRating: parseFloat((data.ratings.reduce((a, b) => a + b, 0) / data.count).toFixed(1)),
      reviews: data.count
    }));
  }, []);

  // Daily sentiment trend
  const sentimentTrend = useMemo(() => {
    const byDate: Record<string, { sentiments: number[]; count: number }> = {};
    reviewsData.forEach((r) => {
      if (!byDate[r.date]) {
        byDate[r.date] = { sentiments: [], count: 0 };
      }
      byDate[r.date].sentiments.push(r.sentiment || 0);
      byDate[r.date].count++;
    });

    return Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        sentiment: Math.round(data.sentiments.reduce((a, b) => a + b, 0) / data.count),
        reviews: data.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  // Export handler
  const handleExport = useCallback(() => {
    const csvContent = generateGuestExportCSV(reviewsData, ratingBySource, sentimentDistribution);
    const filename = `guest_experience_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  }, [ratingBySource, sentimentDistribution]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/reports')}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-neutral-200"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Guest Experience</h1>
              <p className="text-[13px] text-neutral-500">Reviews, ratings, and sentiment analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="h-9 px-4 pr-9 rounded-lg bg-white border border-neutral-200 text-[13px] font-medium text-neutral-700 cursor-pointer flex items-center gap-2 hover:border-neutral-300 transition-colors"
              >
                {DATE_RANGES.find(r => r.value === dateRange)?.label}
                <ChevronDown className={`w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dateDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDateDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50">
                    {DATE_RANGES.map(range => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value);
                          setDateDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                          dateRange === range.value
                            ? 'bg-terra-50 text-terra-600'
                            : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-neutral-200"
            >
              <RefreshCw className="w-4 h-4 text-neutral-500" />
            </button>
            <button
              onClick={handleExport}
              className="h-9 px-4 rounded-lg bg-terra-500 text-white text-[13px] font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Total Reviews</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.totalReviews}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+12% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg Rating</p>
            <p className="text-2xl font-semibold text-neutral-900 flex items-center gap-1">
              {stats.avgRating}
              <Star className="w-5 h-5 fill-gold-400 text-gold-400" />
            </p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+0.3 vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg Sentiment</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.avgSentiment}%</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+5% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Positive Reviews</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.positiveReviews}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+8 vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Negative Reviews</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.negativeReviews}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">-15% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Response Rate</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.responseRate}%</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+3% vs last period</p>
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Trend */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Sentiment Trend</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Average sentiment over time</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    width={40}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium">{payload[0].payload.date}</p>
                            <p>Sentiment: {payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#4E5840"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#4E5840' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ratings by Platform */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Ratings by Platform</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Average rating per channel</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingBySource} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    domain={[0, 5]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    width={80}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p>Rating: {payload[0].value} / 5</p>
                            <p>{payload[0].payload.reviews} reviews</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgRating" fill="#CDB261" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Charts Row 2 - Pie Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reviews by Source */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Reviews by Source</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Distribution by platform</p>

            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reviewsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {reviewsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2.5">
                {reviewsBySource.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[12px] text-neutral-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-neutral-900">{item.value}</span>
                      <span className="text-[10px] text-neutral-400 w-8 text-right">
                        {((item.value / totalSourceReviews) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Sentiment Distribution</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Positive vs Neutral vs Negative</p>

            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sentimentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-3">
                {sentimentDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[13px] text-neutral-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium text-neutral-900">{item.value}</span>
                      <span className="text-[11px] text-neutral-400 w-10 text-right">
                        {((item.value / totalSentiment) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tables Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reviews */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Recent Reviews</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Latest guest feedback</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Date</th>
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Source</th>
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Guest</th>
                    <th className="text-center text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Rating</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsData.slice(0, 8).map((review, index) => (
                    <tr key={index} className="border-b border-neutral-50 last:border-0">
                      <td className="py-3 text-[13px] text-neutral-600">{review.date}</td>
                      <td className="py-3 text-[13px] text-neutral-600">{review.source}</td>
                      <td className="py-3 text-[13px] font-medium text-neutral-900">{review.guest}</td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[13px] text-neutral-900">
                          <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                          {review.rating}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            review.sentiment >= 70
                              ? 'bg-sage-50 text-sage-700'
                              : review.sentiment >= 40
                              ? 'bg-ocean-50 text-ocean-700'
                              : 'bg-gold-50 text-gold-700'
                          }`}
                        >
                          {review.sentiment}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platform Summary */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Platform Summary</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Performance by channel</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Platform</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Reviews</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingBySource.map((platform, index) => (
                    <tr key={index} className="border-b border-neutral-50 last:border-0">
                      <td className="py-3 text-[13px] font-medium text-neutral-900">{platform.name}</td>
                      <td className="py-3 text-[13px] text-neutral-600 text-right">{platform.reviews}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[13px] text-neutral-900">
                          <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                          {platform.avgRating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
