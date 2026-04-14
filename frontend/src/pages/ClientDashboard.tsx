import { useParams } from 'react-router-dom';
import { DollarSign, Users, MousePointer, TrendingUp, RefreshCw, Target, Eye, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useInsights, useSocialInsights, useCampaigns, useSyncTrigger } from '../hooks/useInsights';
import KPICard from '../components/KPICard';
import SpendChart from '../components/SpendChart';
import FollowersChart from '../components/FollowersChart';
import CampaignTable from '../components/CampaignTable';
import DashboardFilters from '../components/DashboardFilters';
import { formatCurrency, formatNumber } from '../lib/utils';
import toast from 'react-hot-toast';

export default function ClientDashboard() {
  const { clientId: paramClientId } = useParams();
  const { user } = useAuthStore();
  const clientId = paramClientId || user?.clientId;
  const client = user?.client;
  const primaryColor = client?.primaryColor || '#6366f1';

  const { data: insightData, isLoading: insightsLoading, refetch } = useInsights(clientId);
  const { data: socialData, isLoading: socialLoading } = useSocialInsights(clientId);
  const { data: campaigns, isLoading: campsLoading } = useCampaigns(clientId);
  const sync = useSyncTrigger();

  const kpis = insightData?.kpis;
  const insights = insightData?.insights || [];

  const handleSync = async () => {
    if (!clientId) return;
    sync.mutate({ clientId }, {
      onSuccess: () => {
        toast.success('Sync started! Data refreshing...');
        setTimeout(() => refetch(), 4000);
      },
    });
  };

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {paramClientId ? 'Client Overview' : client?.name || 'Dashboard'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Campaign & social media performance</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardFilters />
          <button
            onClick={handleSync}
            disabled={sync.isPending}
            className="btn-secondary text-sm py-2"
            id="sync-button"
          >
            <RefreshCw className={`w-4 h-4 ${sync.isPending ? 'animate-spin' : ''}`} />
            {sync.isPending ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Spend"
          value={formatCurrency(kpis?.totalSpend || 0)}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #6366f1, #8b5cf6)"
          loading={insightsLoading}
        />
        <KPICard
          label="Total Leads"
          value={formatNumber(kpis?.totalLeads || 0)}
          icon={<Target className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #10b981, #059669)"
          loading={insightsLoading}
        />
        <KPICard
          label="Avg. ROAS"
          value={`${kpis?.avgROAS?.toFixed(2) || '0.00'}x`}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #f59e0b, #d97706)"
          loading={insightsLoading}
        />
        <KPICard
          label="Avg. CTR"
          value={`${((kpis?.avgCTR || 0) * 100).toFixed(2)}%`}
          icon={<MousePointer className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #ec4899, #db2777)"
          loading={insightsLoading}
        />
        <KPICard
          label="Impressions"
          value={formatNumber(kpis?.totalImpressions || 0)}
          icon={<Eye className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #3b82f6, #2563eb)"
          loading={insightsLoading}
        />
        <KPICard
          label="Clicks"
          value={formatNumber(kpis?.totalClicks || 0)}
          icon={<Zap className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          loading={insightsLoading}
        />
        <KPICard
          label="Avg. CPC"
          value={formatCurrency(kpis?.avgCPC || 0)}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #14b8a6, #0d9488)"
          loading={insightsLoading}
        />
        <KPICard
          label="Total Reach"
          value={formatNumber(kpis?.totalReach || 0)}
          icon={<Users className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(135deg, #f43f5e, #e11d48)"
          loading={insightsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendChart data={insights} primaryColor={primaryColor} loading={insightsLoading} />
        <FollowersChart data={socialData || []} loading={socialLoading} />
      </div>

      {/* Campaign Table */}
      <CampaignTable data={campaigns || []} loading={campsLoading} />
    </div>
  );
}
