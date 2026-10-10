import { CalendarDays, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { formaterDate, type MissionDash } from './data';

interface MissionCardDashProps {
  mission: MissionDash;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function MissionCardDash({ mission, onAction, actionLabel, className }: MissionCardDashProps) {
  const urgent = mission.statut === 'RENFORT_URGENT';
  const placesRestantes = mission.placesTotal - mission.placesConfirmees;

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-200 hover:-translate-y-1',
        urgent && 'border-red-400',
        className,
      )}
    >
      {/* Urgent banner */}
      {urgent && (
        <div className="bg-red-500 px-4 py-1 text-center text-xs font-bold text-white">
          🚨 Renfort urgent
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-muted-foreground">{mission.association}</p>
            <h3 className="mt-1 text-base font-bold leading-tight text-ink">{mission.titre}</h3>
          </div>
          <StatusBadge statut={mission.statut} className="shrink-0" />
        </div>

        {/* Meta */}
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {mission.adresse}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formaterDate(mission.dateDebut)}
            {mission.dateDebut !== mission.dateFin && (
              <> → {formaterDate(mission.dateFin)}</>
            )}
          </p>
        </div>

        {/* Domaine tag */}
        <span className="mt-3 inline-block w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {mission.domaine}
        </span>

        {/* Places */}
        <div className="mt-3 flex items-center gap-4 text-xs">
          <span className={cn('flex items-center gap-1 font-semibold', placesRestantes > 0 ? 'text-green-700' : 'text-orange-700')}>
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {placesRestantes > 0
              ? `${placesRestantes} place${placesRestantes > 1 ? 's' : ''} restante${placesRestantes > 1 ? 's' : ''}`
              : 'Complet'}
          </span>
          {mission.listeAttente > 0 && (
            <span className="text-muted-foreground">
              {mission.listeAttente} en attente
            </span>
          )}
        </div>

        {/* Action */}
        {actionLabel && onAction && (
          <Button
            size="sm"
            className="mt-4 w-full"
            onClick={onAction}
            variant={urgent ? 'destructive' : 'default'}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
