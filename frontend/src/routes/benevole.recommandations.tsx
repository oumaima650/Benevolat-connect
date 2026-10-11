import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { MapPin, CalendarDays, Users } from 'lucide-react';
import { ScoreGauge } from '@/components/dashboard/ScoreGauge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { recoMissions, formaterDate } from '@/components/dashboard/data';

export const Route = createFileRoute('/benevole/recommandations')({
  component: Recommandations,
});

function Recommandations() {
  const sorted = [...recoMissions].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Recommandations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Missions triées par compatibilité avec votre profil — proximité, affinité et besoin.
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((m, rank) => {
          const placesRestantes = m.placesTotal - m.placesConfirmees;
          const isComplete = placesRestantes === 0 || m.statut === 'COMPLETE';

          return (
            <article
              key={m.id}
              className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]"
            >
              {/* Fallback banner */}
              {m.rescueScore && (
                <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
                  🔄 Score calculé par formule de secours
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Score gauge */}
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <ScoreGauge score={m.score} size={90} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{rank + 1} recommandé
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{m.association}</p>
                      <h2 className="font-display text-lg font-bold text-ink">{m.titre}</h2>
                    </div>
                    <StatusBadge statut={m.statut} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {m.adresse}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {formaterDate(m.dateDebut)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {placesRestantes > 0 ? `${placesRestantes} places restantes` : 'Complet'}
                    </span>
                  </div>

                  {/* Explanation */}
                  <p className="text-sm italic text-ink/80">"{m.explication}"</p>

                  {/* Score breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">Proximité</span>
                      <Progress value={(m.scoreProximite / 45) * 100} className="h-2 flex-1" />
                      <span className="w-8 text-right text-xs font-semibold text-ink">
                        {m.scoreProximite}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">Affinité</span>
                      <Progress value={(m.scoreAffinite / 35) * 100} className="h-2 flex-1" />
                      <span className="w-8 text-right text-xs font-semibold text-ink">
                        {m.scoreAffinite}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">Besoin</span>
                      <Progress value={(m.scoreBesoin / 20) * 100} className="h-2 flex-1" />
                      <span className="w-8 text-right text-xs font-semibold text-ink">
                        {m.scoreBesoin}%
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() =>
                      isComplete
                        ? toast.info("📋 Ajouté à la liste d'attente")
                        : toast.success('✅ Inscription confirmée !')
                    }
                    className="rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
                  >
                    {isComplete ? "Rejoindre la liste d'attente" : "S'inscrire"}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
