import { CalendarDays, Check, MapPin, Users, Wifi, Zap } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formaterDate } from '@/components/dashboard/data';
import {
  resolveMissionAction,
  TONE_CLASSES,
  type MissionActionButton,
  type MissionActionContext,
  type MissionActionKind,
} from '@/components/dashboard/missionAction';
import type { ExplorerMission } from '@/services/explorerApi';

interface MissionExplorerCardProps {
  mission: ExplorerMission;
  context: MissionActionContext;
  /** Affiche le score et l'explication (onglet « Recommandées pour moi »). */
  showScore?: boolean;
  busy?: boolean;
  onAction: (kind: MissionActionKind, mission: ExplorerMission) => void;
  onDetail: (mission: ExplorerMission) => void;
}

export function MissionExplorerCard({
  mission,
  context,
  showScore = false,
  busy = false,
  onAction,
  onDetail,
}: MissionExplorerCardProps) {
  const action = resolveMissionAction(mission, context);
  const urgent = mission.statut === 'RENFORT_URGENT';

  function handleAction(button: MissionActionButton) {
    if (button.disabled) return;
    onAction(button.kind, mission);
  }

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-200 hover:-translate-y-1',
        urgent && 'border-red-400',
      )}
    >
      {urgent && (
        <div className="flex items-center justify-center gap-1.5 bg-red-500 px-4 py-1 text-center text-xs font-bold text-white">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          Renfort urgent
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {mission.associationNom ?? 'Association partenaire'}
            </p>
            <h3 className="mt-1 text-base font-bold leading-tight text-ink">{mission.titre}</h3>
          </div>
          <StatusBadge statut={mission.statut} className="shrink-0" />
        </div>

        {showScore && mission.score != null && (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-mustard px-2.5 py-0.5 text-xs font-bold text-ink">
              Score {mission.score}/100
            </span>
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                mission.methode === 'IA'
                  ? 'border-blue-300 bg-blue-100 text-blue-800'
                  : 'border-gray-300 bg-gray-100 text-gray-700',
              )}
            >
              {mission.methode === 'IA' ? 'IA' : 'Formule'}
            </span>
          </div>
        )}

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            {mission.aDistance ? (
              <>
                <Wifi className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> À distance
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {mission.adresse || mission.associationVille || 'Lieu non précisé'}
              </>
            )}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formaterDate(mission.dateDebut)}
            {mission.dateFin && formaterDate(mission.dateFin) !== formaterDate(mission.dateDebut) && (
              <> → {formaterDate(mission.dateFin)}</>
            )}
          </p>
        </div>

        {mission.domaine && (
          <span className="mt-3 inline-block w-fit rounded-full border border-mustard bg-mustard/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
            {mission.domaine}
          </span>
        )}

        {mission.competences.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mission.competences.map((c) => (
              <span
                key={c}
                className="rounded-full border border-ink/20 bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span
            className={cn(
              'flex items-center gap-1 font-semibold',
              mission.placesRestantes > 0 ? 'text-green-700' : 'text-orange-700',
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {mission.placesRestantes > 0
              ? `${mission.placesRestantes} ${mission.placesRestantes > 1 ? 'places restantes' : 'place restante'}`
              : 'Complet'}
            <span className="font-normal text-muted-foreground">/ {mission.nbPlaces}</span>
          </span>
          <span className="text-muted-foreground">
            {mission.listeAttenteCount} en liste d’attente
          </span>
        </div>

        {/* Badge d'état « bénévole » (prime sur l'état de la mission) */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold',
              TONE_CLASSES[action.badge.tone],
            )}
          >
            {action.badge.confirmed && <Check className="h-3 w-3" aria-hidden="true" />}
            {action.badge.label}
          </span>
          {action.detail && (
            <span className="text-xs text-muted-foreground">{action.detail}</span>
          )}
        </div>

        {action.message && (
          <p className="mt-2 rounded-lg border border-ink/15 bg-muted px-3 py-2 text-xs text-muted-foreground">
            {action.message}
          </p>
        )}

        {showScore && mission.explication && (
          <p className="mt-2 text-xs italic text-ink/80">« {mission.explication} »</p>
        )}

        <div className="mt-auto space-y-2 pt-4">
          {action.buttons.map((button) => (
            <Button
              key={button.kind + button.label}
              size="sm"
              disabled={busy || button.disabled}
              onClick={() => handleAction(button)}
              className={cn(
                'w-full rounded-xl border-2 border-ink font-bold shadow-[3px_3px_0_var(--color-ink)]',
                button.variant === 'danger' && 'bg-paper text-red-700 hover:bg-red-50',
                button.variant === 'neutral' && 'bg-paper text-ink hover:bg-muted',
                button.variant === 'primary' && 'bg-pink text-pink-foreground hover:opacity-90',
                button.disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              {button.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetail(mission)}
            className="w-full rounded-xl border-2 border-ink font-semibold shadow-[2px_2px_0_var(--color-ink)]"
          >
            Voir le détail
          </Button>
        </div>
      </div>
    </article>
  );
}

export default MissionExplorerCard;
