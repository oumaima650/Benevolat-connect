import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass?: string;
}

export function KpiCard({ label, value, icon: Icon, trend, colorClass = 'text-emerald' }: KpiCardProps) {
  const trendPositive = trend?.startsWith('+');
  const trendNegative = trend?.startsWith('-');

  return (
    <div className="rounded-2xl border-2 border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink',
            colorClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold',
              trendPositive && 'text-green-600',
              trendNegative && 'text-red-600',
              !trendPositive && !trendNegative && 'text-muted-foreground',
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
