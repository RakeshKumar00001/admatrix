import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { formatCurrency, formatNumber, getPlatformBadgeClass } from '../lib/utils';

interface Campaign {
  campaignId: string;
  campaignName: string;
  platform: string;
  _sum: { spend: number | null; impressions: number | null; clicks: number | null; leads: number | null };
  _avg: { roas: number | null; ctr: number | null };
}

interface CampaignTableProps {
  data: Campaign[];
  loading?: boolean;
}

type SortKey = 'spend' | 'impressions' | 'clicks' | 'roas' | 'ctr' | 'leads';

export default function CampaignTable({ data, loading }: CampaignTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const getVal = (item: Campaign) => {
        switch (sortKey) {
          case 'spend': return item._sum.spend || 0;
          case 'impressions': return item._sum.impressions || 0;
          case 'clicks': return item._sum.clicks || 0;
          case 'leads': return item._sum.leads || 0;
          case 'roas': return item._avg.roas || 0;
          case 'ctr': return item._avg.ctr || 0;
        }
      };
      return sortDir === 'desc' ? getVal(b) - getVal(a) : getVal(a) - getVal(b);
    });
  }, [data, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-brand-400" /> : <ChevronUp className="w-3 h-3 text-brand-400" />;
  };

  const headers: { label: string; key?: SortKey; align?: string }[] = [
    { label: 'Campaign' },
    { label: 'Platform' },
    { label: 'Spend', key: 'spend', align: 'right' },
    { label: 'Impressions', key: 'impressions', align: 'right' },
    { label: 'Clicks', key: 'clicks', align: 'right' },
    { label: 'CTR', key: 'ctr', align: 'right' },
    { label: 'ROAS', key: 'roas', align: 'right' },
    { label: 'Leads', key: 'leads', align: 'right' },
  ];

  return (
    <div className="card animate-fade-in">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Campaign Performance</h3>
        <span className="text-xs text-slate-500">{data?.length || 0} campaigns</span>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {headers.map((h) => (
                  <th key={h.label}
                    className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${h.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {h.key ? (
                      <button onClick={() => handleSort(h.key!)} className="flex items-center gap-1 hover:text-slate-300 transition-colors ml-auto">
                        {h.label} <SortIcon k={h.key} />
                      </button>
                    ) : h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sorted.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate">{row.campaignName}</td>
                  <td className="px-4 py-3">
                    <span className={getPlatformBadgeClass(row.platform)}>{row.platform}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">{formatCurrency(row._sum.spend || 0)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">{formatNumber(row._sum.impressions || 0)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">{formatNumber(row._sum.clicks || 0)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">{((row._avg.ctr || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${(row._avg.roas || 0) >= 3 ? 'text-emerald-400' : (row._avg.roas || 0) >= 1.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {(row._avg.roas || 0).toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">{row._sum.leads || 0}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">No campaign data for selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
