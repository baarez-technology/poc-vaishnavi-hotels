import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function OccupancyForecastChart({ forecastData }) {
  // Safety check for empty or undefined data
  if (!forecastData || forecastData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <div className="mb-6">
          <h3 className="text-xl font-sans font-semibold text-neutral-900 mb-1">
            Occupancy Forecast
          </h3>
          <p className="text-sm text-neutral-600">
            Projected room occupancy for the next 14 days
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px] text-neutral-500">
          Loading forecast data...
        </div>
      </div>
    );
  }

  const data = forecastData.slice(0, 14).map(d => ({
    date: d.dateLabel,
    occupancy: d.forecastOccupancy,
    rooms: d.forecastRooms,
    confidence: d.confidence
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-900 mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="text-sm text-neutral-700">
              <span className="font-medium">Occupancy:</span> {data.occupancy}%
            </p>
            <p className="text-sm text-neutral-700">
              <span className="font-medium">Rooms:</span> {data.rooms}
            </p>
            <p className="text-sm text-neutral-500">
              <span className="font-medium">Confidence:</span> {data.confidence}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-neutral-200">
      <div className="mb-6">
        <h3 className="text-xl font-sans font-semibold text-neutral-900 mb-1">
          Occupancy Forecast
        </h3>
        <p className="text-sm text-neutral-600">
          Projected room occupancy for the next 14 days
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <defs>
            <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target 80%', fill: '#f59e0b', fontSize: 12 }} />
          <Bar
            dataKey="occupancy"
            fill="url(#colorOccupancy)"
            radius={[8, 8, 0, 0]}
            name="Occupancy %"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#4E5840]">
            {Math.round(data.reduce((sum, d) => sum + d.occupancy, 0) / data.length)}%
          </p>
          <p className="text-xs text-neutral-600 mt-1">Avg Occupancy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#A57865]">
            {Math.max(...data.map(d => d.occupancy))}%
          </p>
          <p className="text-xs text-neutral-600 mt-1">Peak Day</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral-700">
            {Math.round(data.reduce((sum, d) => sum + d.rooms, 0) / data.length)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">Avg Rooms/Day</p>
        </div>
      </div>
    </div>
  );
}
