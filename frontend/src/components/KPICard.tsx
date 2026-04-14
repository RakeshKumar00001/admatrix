import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBg?: string;
  loading?: boolean;
}

export default function KPICard({ label, value, change, changeLabel, icon, iconBg, loading }: KPICardProps) {
  const isUp = change !== undefined ? change > 0 : null;
  const isFlat = change === 0;

  return (
    <div className="card p-5 hover:border-slate-700 transition-all duration-300 hover:-translate-y-0.5 group animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ background: iconBg || 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {icon}
        </div>
        {change !== undefined && !isFlat && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          )}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
        {isFlat && (
          <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-700/50 text-slate-400">
            <Minus className="w-3 h-3" /> 0%
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="h-8 w-24 bg-slate-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-white mb-1 tabular-nums">{value}</p>
          <p className="text-sm text-slate-400">
            {label}
            {changeLabel && <span className="text-slate-600 ml-1">· {changeLabel}</span>}
          </p>
        </>
      )}
    </div>
  );
}
