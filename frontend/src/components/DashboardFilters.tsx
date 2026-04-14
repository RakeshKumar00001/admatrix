import { useFilterStore } from '../store/filterStore';
import { format } from 'date-fns';
import { Calendar, Filter } from 'lucide-react';

const PRESETS = [
  { label: '7D', value: '7d' as const },
  { label: '14D', value: '14d' as const },
  { label: '30D', value: '30d' as const },
  { label: '90D', value: '90d' as const },
];

const PLATFORMS = [
  { label: 'All', value: 'ALL' as const },
  { label: 'Facebook', value: 'FACEBOOK' as const },
  { label: 'Instagram', value: 'INSTAGRAM' as const },
];

export default function DashboardFilters() {
  const { startDate, endDate, platform, setPreset, setPlatform, setDateRange } = useFilterStore();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date presets */}
      <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              format(startDate, 'yyyy-MM-dd') === format(
                new Date(new Date().setDate(new Date().getDate() - { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }[p.value])),
                'yyyy-MM-dd'
              )
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm">
        <Calendar className="w-3.5 h-3.5 text-slate-500" />
        <input
          type="date"
          value={format(startDate, 'yyyy-MM-dd')}
          onChange={(e) => setDateRange(new Date(e.target.value), endDate)}
          className="bg-transparent text-slate-300 text-xs outline-none"
        />
        <span className="text-slate-600">→</span>
        <input
          type="date"
          value={format(endDate, 'yyyy-MM-dd')}
          onChange={(e) => setDateRange(startDate, new Date(e.target.value))}
          className="bg-transparent text-slate-300 text-xs outline-none"
        />
      </div>

      {/* Platform */}
      <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPlatform(p.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              platform === p.value
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
