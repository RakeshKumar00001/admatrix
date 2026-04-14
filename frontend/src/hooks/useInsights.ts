import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { format } from 'date-fns';
import { useFilterStore } from '../store/filterStore';

export interface Insight {
  id: string;
  date: string;
  campaignId: string;
  campaignName: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'GOOGLE';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  conversions: number;
  leads: number;
  reach: number;
}

export interface KPIs {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalLeads: number;
  totalReach: number;
  avgCTR: number;
  avgCPC: number;
  avgROAS: number;
}

export function useInsights(clientId: string | null | undefined) {
  const { startDate, endDate, platform, campaignId } = useFilterStore();

  return useQuery({
    queryKey: ['insights', clientId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), platform, campaignId],
    queryFn: async () => {
      const params: Record<string, string> = {
        clientId: clientId!,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        platform,
      };
      if (campaignId) params.campaignId = campaignId;
      const { data } = await api.get('/insights', { params });
      return data.data as { insights: Insight[]; kpis: KPIs };
    },
    enabled: !!clientId,
  });
}

export function useSocialInsights(clientId: string | null | undefined) {
  const { startDate, endDate, platform } = useFilterStore();

  return useQuery({
    queryKey: ['social-insights', clientId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), platform],
    queryFn: async () => {
      const { data } = await api.get('/insights/social', {
        params: {
          clientId: clientId!,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          platform: platform !== 'GOOGLE' ? platform : 'ALL',
        },
      });
      return data.data.socialInsights;
    },
    enabled: !!clientId,
  });
}

export function useCampaigns(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['campaigns', clientId],
    queryFn: async () => {
      const { data } = await api.get('/insights/campaigns', { params: { clientId } });
      return data.data.campaigns;
    },
    enabled: !!clientId,
  });
}

export function useSyncTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, type }: { clientId: string; type?: string }) =>
      api.post('/meta/sync', { clientId, type }),
    onSuccess: (_, { clientId }) => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['insights', clientId] });
        qc.invalidateQueries({ queryKey: ['social-insights', clientId] });
      }, 3000);
    },
  });
}
