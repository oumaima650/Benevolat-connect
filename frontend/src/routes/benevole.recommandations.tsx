import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import explorerApi, { type ExplorerMission } from '@/services/explorerApi';
import { MissionCard, MissionDetailDialog } from '@/components/explorer/ExplorerMissionCard';

export const Route = createFileRoute('/benevole/recommandations')({
  component: Recommandations,
});

/** Missions recommandées pour le bénévole, triées par score de correspondance décroissant. */
function Recommandations() {
  const { token } = useAuth();
  const [missions, setMissions] = useState<ExplorerMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ExplorerMission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function charger() {
    if (!token) return;
    setLoading(true);
    try {
      setMissions(await explorerApi.recommandations(token));
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement des recommandations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
  }, [token]);

  /** Exécute une action d'inscription puis recharge la liste (le statut de la carte change). */
  async function agir(action: () => Promise<unknown>, succes: string, echec: string) {
    try {
      await action();
      toast.success(succes);
      if (token) setMissions(await explorerApi.recommandations(token));
    } catch (error: any) {
      toast.error(error.message || echec);
    }
  }

  async function handleDetail(missionId: number) {
    if (!token) return;
    setDetailLoading(true);
    try {
      setDetail(await explorerApi.detail(token, missionId));
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement du détail');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Recommandations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les missions qui correspondent le mieux à votre profil, vos domaines et votre ville.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={charger}
          disabled={loading}
          className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl border-2 border-ink" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/30 py-16 text-center">
          <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-ink">Aucune recommandation pour le moment</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complétez votre profil (domaines, ville, compétences) pour recevoir des suggestions personnalisées.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              to="/benevole/profil"
              className="rounded-xl border-2 border-ink bg-mustard px-4 py-2 text-sm font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90"
            >
              Compléter mon profil
            </Link>
            <Link
              to="/benevole/explorer"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-paper px-4 py-2 text-sm font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted"
            >
              <Search className="h-4 w-4" aria-hidden="true" /> Explorer les missions
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {missions.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              {m.score != null && (
                <div className="rounded-xl border-2 border-ink bg-mustard/20 px-3 py-2 text-xs text-ink">
                  <p className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Correspondance : {m.score}%
                  </p>
                  {m.explication && <p className="mt-1 text-muted-foreground">{m.explication}</p>}
                </div>
              )}
              <MissionCard
                mission={m}
                onDetail={() => handleDetail(m.id)}
                onInscrire={() => token && agir(() => explorerApi.inscrire(token, m.id), 'Inscription confirmée !', "Erreur lors de l'inscription")}
                onAnnuler={() => token && agir(() => explorerApi.annuler(token, m.id), 'Inscription annulée', "Erreur lors de l'annulation")}
                onConfirmerRenfort={() => token && agir(() => explorerApi.confirmerRenfort(token, m.id), 'Venue confirmée !', 'Erreur lors de la confirmation')}
                onVoirCertificat={() => {}}
              />
            </div>
          ))}
        </div>
      )}

      <MissionDetailDialog detail={detail} loading={detailLoading} onClose={() => setDetail(null)} />
    </div>
  );
}
