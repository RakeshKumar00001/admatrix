import { format } from 'date-fns';

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), 'MMM dd');
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    FACEBOOK: '#3b82f6',
    INSTAGRAM: '#ec4899',
    GOOGLE: '#f59e0b',
    WHATSAPP: '#10b981',
  };
  return colors[platform] || '#6366f1';
}

export function getPlatformBadgeClass(platform: string): string {
  const classes: Record<string, string> = {
    FACEBOOK: 'badge-facebook',
    INSTAGRAM: 'badge-instagram',
    GOOGLE: 'badge-google',
  };
  return classes[platform] || 'badge bg-brand-500/15 text-brand-400';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
