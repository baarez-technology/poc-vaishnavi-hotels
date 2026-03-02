import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function MarketSegmentChart({ segmentsData }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-neutral-700">
              <span className="font-medium">Revenue:</span> ₹{data.revenue.toLocaleString()}
            </p>
            <p className="text-sm text-neutral-700">
              <span className="font-medium">Rooms:</span> {data.rooms.toLocaleString()}
            </p>
            <p className="text-sm text-neutral-700">
              <span className="font-medium">ADR:</span> ₹{data.adr}
            </p>
            <p className="text-sm font-semibold text-[#A57865] mt-2">
              {data.percentage}% of total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const totalRevenue = segmentsData.reduce((sum, segment) => sum + segment.revenue, 0);

  return (
    <div className="bg-white rounded-xl p-6 border border-neutral-200">
      <div className="mb-6">
        <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-1">
          Market Segments
        </h3>
        <p className="text-sm text-neutral-600">
          Revenue distribution by customer segment
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={segmentsData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="revenue"
          >
            {segmentsData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with details */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {segmentsData.map((segment) => (
          <div key={segment.id} className="p-4 bg-[#FAF8F6] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm font-semibold text-neutral-900">{segment.name}</span>
            </div>
            <p className="text-xl font-bold text-neutral-900 mb-1">
              ₹{(segment.revenue / 1000).toFixed(0)}K
            </p>
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span>{segment.rooms} rooms</span>
              <span>ADR ₹{segment.adr}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
        <p className="text-sm text-neutral-600 mb-1">Total Revenue</p>
        <p className="text-3xl font-bold text-[#A57865]">
          ₹{(totalRevenue / 1000).toFixed(0)}K
        </p>
      </div>
    </div>
  );
}
