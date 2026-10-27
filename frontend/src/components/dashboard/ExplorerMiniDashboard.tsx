import { useEffect, useState } from 'react';
import {
  Award,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  Clock,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formaterDate } from '@/components/dashboard/data';
import type { ExplorerStats } from '@/services/explorerApi';

interface ExplorerMiniDashboardProps {
  stats: ExplorerStats | null;
  loading: boolean;
  failed: boolean;
  onShowRecommandations: () => void;
  onShowToutes: () => void;
}

/** Compte à rebours lisible (« dans 3 j », « dans 5 h », « en cours »). */
function compteARebours(dateIso: string): string {
  const cible = new Date(dateIso).getTime();
  if (Number.isNaN(cible)) return '—';
  const diff = cible - Date.now();
  if (diff <= 0) return 'en cours';
  const jours = Math.floor(diff / 86_400_000);
  if (jours >= 1) return `dans ${jours} j`;
  const heures = Math.floor(diff / 3_600_000);
  if (heures >= 1) return `dans ${heures} h`;
  const minutes = Math.max(1, Math.floor(diff / 60_000));
  return `dans ${minutes} min`;
}

function MiniCard({
  label,
  value,
  suffix,
  icon: Icon,
  colorClass,
  alert,
  onClick,
  loading,
  failed,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  icon: typeof CheckCircle;
  colorClass: string;
  alert?: boolean;
  onClick?: () => void;
  loading: boolean;
  failed: boolean;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border-2 border-ink bg-paper p-4 text-left shadow-[4px_4px_0_var(--color-ink)]',
        onClick && 'transition-transform duration-150 hover:-translate-y-1',
      )}
    >
      {alert && (
        <span
          className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500"
          title="Un renfort urgent attend votre confirmation"
          aria-label="Un renfort urgent attend votre confirmation"
        />
      )}
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', colorClass)} aria-hidden="true" />
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-16" />
      ) : (
        <p className="mt-2 font-display text-2xl font-black text-ink">
          {failed || value === null ? '—' : value}
          {!failed && value !== null && suffix && (
            <span className="ml-1 text-sm font-bold text-muted-foreground">{suffix}</span>
          )}
        </p>
      )}
    </Wrapper>
  );
}

export function ExplorerMiniDashboard({
  stats,
  loading,
  failed,
  onShowRecommandations,
  onShowToutes,
}: ExplorerMiniDashboardProps) {
  // « Repliable sur mobile » : les blocs secondaires se replient sous le lg.
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  // Rafraîchit le compte à rebours chaque minute.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const niveau = stats?.niveau;
  const seuilSuivant = niveau?.seuilSuivant ?? null;
  const niveauMax = !loading && !failed && stats != null && seuilSuivant == null;
  const progression =
    niveau && seuilSuivant && seuilSuivant > 0
      ? Math.min(100, Math.round((niveau.missionsActuelles / seuilSuivant) * 100))
      : 0;

  return (
    <section className="space-y-4" aria-label="Mini tableau de bord">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniCard
          label="Missions réalisées"
          value={stats?.missionsRealisees ?? null}
          icon={CheckCircle}
          colorClass="text-emerald"
          loading={loading}
          failed={failed}
        />
        <MiniCard
          label="Inscriptions à venir"
          value={stats?.inscriptionsAVenir ?? null}
          icon={CalendarClock}
          colorClass="text-pink"
          loading={loading}
          failed={failed}
        />
        <MiniCard
          label="En liste d’attente"
          value={stats?.enListeAttente ?? null}
          icon={Clock}
          colorClass="text-mustard"
          alert={Boolean(stats?.renfortDisponiblePourMoi)}
          loading={loading}
          failed={failed}
        />
        <MiniCard
          label="Missions qui me correspondent"
          value={stats?.recommandations.nombre ?? null}
          suffix={
            stats?.recommandations.meilleurScore != null
              ? `· meilleur score ${stats.recommandations.meilleurScore}`
              : undefined
          }
          icon={Sparkles}
          colorClass="text-blue-500"
          onClick={onShowRecommandations}
          loading={loading}
          failed={failed}
        />
      </div>

      <button
        type="button"
        onClick={() => setDetailsOuverts((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-paper py-2 text-xs font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] lg:hidden"
        aria-expanded={detailsOuverts}
      >
        {detailsOuverts ? 'Masquer le niveau et la prochaine mission' : 'Afficher le niveau et la prochaine mission'}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', detailsOuverts && 'rotate-180')} />
      </button>

      <div className={cn('grid gap-4 lg:grid-cols-2', !detailsOuverts && 'hidden lg:grid')}>
        {/* Niveau et badges */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-mustard" aria-hidden="true" />
            <h2 className="font-display font-bold text-ink">Niveau et badges</h2>
            {!loading && !failed && niveau && (
              <span className="ml-auto rounded-full border-2 border-ink bg-mustard px-2.5 py-0.5 text-xs font-bold text-ink">
                {niveau.nom}
              </span>
            )}
          </div>

          {loading ? (
            <>
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-3 h-4 w-2/3" />
            </>
          ) : failed || !niveau ? (
            <p className="mt-3 text-sm text-muted-foreground">—</p>
          ) : (
            <>
              <Progress value={progression} className="mt-4 h-3" />
              <p className="mt-2 text-sm text-muted-foreground">
                {niveauMax ? (
                  <span className="font-bold text-pink">Niveau maximum atteint</span>
                ) : (
                  <>
                    <span className="font-semibold text-ink">
                      {niveau.missionsActuelles} / {seuilSuivant} missions
                    </span>{' '}
                    pour atteindre le niveau{' '}
                    <span className="font-bold text-pink">{niveau.niveauSuivant}</span>
                  </>
                )}
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5 shrink-0 text-emerald" aria-hidden="true" />
                {stats?.dernierBadge
                  ? <>Dernier badge : <span className="font-semibold text-ink">{stats.dernierBadge.nom}</span></>
                  : 'Aucun badge obtenu pour le moment'}
              </p>
            </>
          )}
        </div>

        {/* Prochaine mission */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-pink" aria-hidden="true" />
            <h2 className="font-display font-bold text-ink">Prochaine mission</h2>
          </div>

          {loading ? (
            <>
              <Skeleton className="mt-4 h-4 w-3/4" />
              <Skeleton className="mt-3 h-3 w-1/2" />
            </>
          ) : failed ? (
            <p className="mt-3 text-sm text-muted-foreground">—</p>
          ) : stats?.prochaineMission ? (
            <>
              <p className="mt-3 text-sm font-bold text-ink">{stats.prochaineMission.titre}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formaterDate(stats.prochaineMission.dateDebut)}
                {stats.prochaineMission.ville ? ` · ${stats.prochaineMission.ville}` : ''}
              </p>
              <span className="mt-3 inline-block rounded-full border-2 border-ink bg-mustard px-2.5 py-0.5 text-xs font-bold text-ink">
                {compteARebours(stats.prochaineMission.dateDebut)}
              </span>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">Aucune mission prévue</p>
              <Button
                size="sm"
                onClick={onShowToutes}
                className="mt-3 rounded-xl border-2 border-ink bg-pink text-xs font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
              >
                Explorer les missions
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default ExplorerMiniDashboard;
