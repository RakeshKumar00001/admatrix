import { create } from 'zustand';
import { subDays } from 'date-fns';

interface FilterState {
  startDate: Date;
  endDate: Date;
  platform: 'ALL' | 'FACEBOOK' | 'INSTAGRAM' | 'GOOGLE';
  campaignId: string | null;
  setDateRange: (start: Date, end: Date) => void;
  setPlatform: (p: FilterState['platform']) => void;
  setCampaign: (id: string | null) => void;
  setPreset: (preset: '7d' | '14d' | '30d' | '90d') => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  startDate: subDays(new Date(), 30),
  endDate: new Date(),
  platform: 'ALL',
  campaignId: null,
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),
  setPlatform: (platform) => set({ platform }),
  setCampaign: (campaignId) => set({ campaignId }),
  setPreset: (preset) => {
    const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }[preset];
    set({ startDate: subDays(new Date(), days), endDate: new Date() });
  },
}));
