import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatDateShort, formatNumber } from '../lib/utils';

interface SocialInsight {
  date: string;
  followers: number;
  engagement: number;
  reach: number;
  platform: string;
}

interface FollowersChartProps {
  data: SocialInsight[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl space-y-1">
        <p className="text-xs text-slate-400 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-medium">{formatNumber(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FollowersChart({ data, loading }: FollowersChartProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="h-6 w-40 bg-slate-800 rounded animate-pulse mb-6" />
        <div className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Aggregate by date (merge platforms)
  const byDate = data.reduce((acc: Record<string, any>, item) => {
    const key = formatDateShort(item.date);
    if (!acc[key]) acc[key] = { date: key, followers: 0, engagement: 0, reach: 0 };
    acc[key].followers = Math.max(acc[key].followers, item.followers);
    acc[key].engagement += item.engagement;
    acc[key].reach += item.reach;
    return acc;
  }, {});

  const chartData = Object.values(byDate);

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-white">Social Growth</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="engagGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => formatNumber(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => <span className="text-xs text-slate-400 capitalize">{v}</span>} />
          <Area type="monotone" dataKey="followers" name="Followers" stroke="#6366f1" strokeWidth={2}
            fill="url(#followersGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
          <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#ec4899" strokeWidth={2}
            fill="url(#engagGrad)" dot={false} activeDot={{ r: 4, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
