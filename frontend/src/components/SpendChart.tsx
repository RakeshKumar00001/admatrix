import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { formatCurrency, formatDateShort } from '../lib/utils';

interface SpendChartProps {
  data: { date: string; spend: number }[];
  primaryColor?: string;
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function SpendChart({ data, primaryColor = '#6366f1', loading }: SpendChartProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="h-6 w-40 bg-slate-800 rounded animate-pulse mb-6" />
        <div className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Aggregate by date
  const aggregated = data.reduce((acc: Record<string, number>, item) => {
    const key = formatDateShort(item.date);
    acc[key] = (acc[key] || 0) + item.spend;
    return acc;
  }, {});

  const chartData = Object.entries(aggregated).map(([date, spend]) => ({ date, spend }));

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-white">Daily Ad Spend</h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: primaryColor }} />
          Spend
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="spend" stroke={primaryColor} strokeWidth={2.5}
            fill="url(#spendGrad)" dot={false} activeDot={{ r: 5, fill: primaryColor, stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
