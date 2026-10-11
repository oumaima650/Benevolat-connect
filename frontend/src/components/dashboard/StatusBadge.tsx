import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MissionStatut } from './data';

const statutConfig: Record<
  MissionStatut,
  { label: string; className: string; urgent?: boolean }
> = {
  PUBLIEE: {
    label: 'Publiée',
    className: 'bg-green-100 text-green-800 border border-green-300',
  },
  COMPLETE: {
    label: 'Complète',
    className: 'bg-orange-100 text-orange-800 border border-orange-300',
  },
  EN_COURS: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
  RENFORT_URGENT: {
    label: 'Renfort urgent',
    className: 'bg-red-100 text-red-800 border border-red-300',
    urgent: true,
  },
  TERMINEE: {
    label: 'Terminée',
    className: 'bg-gray-100 text-gray-600 border border-gray-300',
  },
  CLOTUREE: {
    label: 'Clôturée',
    className: 'bg-gray-200 text-gray-700 border border-gray-400',
  },
  ANNULEE: {
    label: 'Annulée',
    className: 'bg-red-50 text-red-600 border border-red-200',
  },
  BROUILLON: {
    label: 'Brouillon',
    className: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  },
};

interface StatusBadgeProps {
  statut: MissionStatut;
  className?: string;
}

export function StatusBadge({ statut, className }: StatusBadgeProps) {
  const config = statutConfig[statut];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      {config.urgent && (
        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      {config.label}
    </span>
  );
}
