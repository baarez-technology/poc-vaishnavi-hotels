import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Button } from '../ui2/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from '../ui2/Table';

export default function ChannelPerformanceTable({ channelData, summary }) {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-[#4E5840]" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      default:
        return <Minus className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-[#4E5840]';
      case 'down':
        return 'text-rose-600';
      default:
        return 'text-neutral-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-neutral-100">
        <div>
          <h3 className="text-xl font-sans font-semibold text-neutral-900 mb-1">
            Channel Performance
          </h3>
          <p className="text-sm text-neutral-600">
            Revenue breakdown by distribution channel
          </p>
        </div>
        <Button variant="ghost" icon={ExternalLink}>
          View Details
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead align="right">Revenue</TableHead>
            <TableHead align="right">Bookings</TableHead>
            <TableHead align="right">ADR</TableHead>
            <TableHead align="right">Commission</TableHead>
            <TableHead align="right">Net Revenue</TableHead>
            <TableHead align="center">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channelData.map((channel, index) => (
            <TableRow
              key={channel.id}
              className={index === 0 ? 'bg-terra-50/30' : ''}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-terra-500" />
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">
                      {channel.channel}
                    </p>
                    <p className="text-xs text-neutral-500">{channel.percentage}% share</p>
                  </div>
                </div>
              </TableCell>
              <TableCell align="right">
                <span className="font-semibold text-neutral-900">
                  ${channel.revenue.toLocaleString()}
                </span>
              </TableCell>
              <TableCell align="right">
                <span className="text-neutral-700">{channel.bookings}</span>
              </TableCell>
              <TableCell align="right">
                <span className="text-neutral-700">${channel.adr}</span>
              </TableCell>
              <TableCell align="right">
                <span className="text-neutral-700">{channel.commission}%</span>
              </TableCell>
              <TableCell align="right">
                <span className="font-semibold text-sage-600">
                  ${channel.netRevenue.toLocaleString()}
                </span>
              </TableCell>
              <TableCell align="center">
                <div className="flex items-center justify-center gap-2">
                  {getTrendIcon(channel.trend)}
                  <span className={`text-sm font-semibold ${getTrendColor(channel.trend)}`}>
                    {channel.growth > 0 ? '+' : ''}{channel.growth.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-neutral-50 font-semibold">
            <TableCell>
              <span className="font-semibold text-neutral-900">Total</span>
            </TableCell>
            <TableCell align="right">
              <span className="font-semibold text-terra-600">${summary.totalRevenue.toLocaleString()}</span>
            </TableCell>
            <TableCell align="right">
              <span className="font-semibold text-neutral-900">{summary.totalBookings}</span>
            </TableCell>
            <TableCell align="right">
              <span className="text-neutral-500">-</span>
            </TableCell>
            <TableCell align="right">
              <span className="font-semibold text-neutral-900">{summary.avgCommission}%</span>
            </TableCell>
            <TableCell align="right">
              <span className="font-semibold text-sage-600">${summary.totalNetRevenue.toLocaleString()}</span>
            </TableCell>
            <TableCell align="center">
              <span className="text-neutral-500">-</span>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Insights */}
      <div className="p-6 border-t border-neutral-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-sage-50 rounded-xl border border-sage-200">
            <p className="text-xs text-sage-700 font-medium mb-1">Best Performer</p>
            <p className="text-lg font-bold text-sage-900">Direct Booking</p>
            <p className="text-xs text-sage-600 mt-1">0% commission</p>
          </div>
          <div className="p-4 bg-gold-50 rounded-xl border border-gold-200">
            <p className="text-xs text-gold-700 font-medium mb-1">Total Commission</p>
            <p className="text-lg font-bold text-gold-900">
              ${(summary.totalRevenue - summary.totalNetRevenue).toLocaleString()}
            </p>
            <p className="text-xs text-gold-600 mt-1">From all channels</p>
          </div>
          <div className="p-4 bg-terra-50 rounded-xl border border-terra-200">
            <p className="text-xs text-terra-700 font-medium mb-1">Avg Conversion</p>
            <p className="text-lg font-bold text-neutral-900">
              {(channelData.reduce((sum, c) => sum + c.conversionRate, 0) / channelData.length).toFixed(1)}%
            </p>
            <p className="text-xs text-terra-600 mt-1">Across channels</p>
          </div>
        </div>
      </div>
    </div>
  );
}
