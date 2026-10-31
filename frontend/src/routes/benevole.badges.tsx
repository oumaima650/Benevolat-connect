import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Lock, Sprout, Handshake, Medal, Trophy, Check, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { benevoleApi, type BadgeNiveau, type NiveauInfo } from '@/services/benevoleApi';
import { toast } from 'sonner';

export const Route = createFileRoute('/benevole/badges')({
  component: BadgesNiveau,
});

const PALIERS = [
  { label: 'Débutant', min: 0, max: 4, icone: <Sprout className="h-5 w-5" /> },
  { label: 'Engagé', min: 5, max: 14, icone: <Handshake className="h-5 w-5" /> },
  { label: 'Expert', min: 15, max: 29, icone: <Medal className="h-5 w-5" /> },
  { label: 'Champion', min: 30, max: Infinity, icone: <Trophy className="h-5 w-5" /> },
];

const BADGE_ICONS: Record<string, React.ReactNode> = {
  'PREMIERE_MISSION': <Sprout className="h-10 w-10" />,
  'ENGAGE': <Handshake className="h-10 w-10" />,
  'EXPERT': <Medal className="h-10 w-10" />,
  'CHAMPION': <Trophy className="h-10 w-10" />,
};

function BadgesNiveau() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [niveau, setNiveau] = useState<NiveauInfo | null>(null);
  const [badges, setBadges] = useState<BadgeNiveau[]>([]);

  useEffect(() => {
    if (!token) return;
    async function loadData() {
      setLoading(true);
      try {
        const data = await benevoleApi.getBadgesNiveau(token);
        setNiveau(data.niveau);
        setBadges(data.badges);
      } catch (error: any) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des badges');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!niveau) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">Impossible de charger les données de niveau</p>
      </div>
    );
  }

  const nMissions = niveau.missionsActuelles;
  const niveauActuel = niveau.nom;
  const progressPct = niveau.seuilSuivant
    ? Math.round((nMissions / niveau.seuilSuivant) * 100)
    : 100;
  const palierActuel = PALIERS.find((p) => p.label === niveauActuel) ?? PALIERS[0]!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Badges & niveau</h1>
        <p className="mt-1 text-sm text-muted-foreground">Votre progression et vos récompenses.</p>
      </div>

      {/* Current level card */}
      <div className="rounded-2xl border-2 border-ink bg-mustard p-6 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink">
            {palierActuel.icone}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Niveau actuel</p>
            <h2 className="font-display text-3xl font-black text-ink">{niveauActuel}</h2>
            <p className="text-sm text-ink/70">{nMissions} missions réalisées</p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={progressPct} className="h-3" />
          <p className="mt-1.5 text-sm text-ink/70">
            {nMissions} / {niveau.seuilSuivant || '—'} missions pour atteindre{' '}
            <span className="font-bold text-ink">{niveau.niveauSuivant || 'Niveau maximum'}</span>
          </p>
        </div>
      </div>

      {/* Paliers table */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 className="font-display mb-3 font-bold text-ink">Tableau des paliers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="py-2 pr-4 text-left font-bold text-ink">Niveau</th>
                <th className="py-2 pr-4 text-left font-bold text-ink">Missions requises</th>
                <th className="py-2 text-left font-bold text-ink">Statut</th>
              </tr>
            </thead>
            <tbody>
              {PALIERS.map((p) => {
                const isActuel = niveauActuel === p.label;
                const isAtteint = nMissions >= p.min;
                return (
                  <tr
                    key={p.label}
                    className={`border-b border-ink/10 ${isActuel ? 'bg-mustard/20' : ''}`}
                  >
                    <td className="py-2.5 pr-4 font-semibold text-ink">
                      <span className="mr-2 inline-flex align-middle">{p.icone}</span>
                      {p.label}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {p.max === Infinity ? `${p.min}+ missions` : `${p.min} – ${p.max} missions`}
                    </td>
                    <td className="py-2.5">
                      {isActuel ? (
                        <span className="rounded-full border-2 border-ink bg-mustard px-2.5 py-0.5 text-xs font-bold text-ink">
                          Niveau actuel
                        </span>
                      ) : isAtteint ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          <Check className="h-3 w-3" /> Atteint
                        </span>
                      ) : (
                        <span className="rounded-full border border-ink/20 bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          Verrouillé
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badges grid */}
      <div>
        <h2 className="font-display mb-3 font-bold text-ink">Mes badges</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-ink p-5 text-center shadow-[4px_4px_0_var(--color-ink)] ${b.obtenu ? 'bg-paper' : 'bg-muted opacity-70'
                }`}
            >
              {b.obtenu ? (
                <div className="flex h-12 w-12 items-center justify-center text-ink" aria-label={b.nom}>
                  {BADGE_ICONS[b.code] || <Medal className="h-10 w-10" />}
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              )}
              <div>
                <p className={`text-sm font-bold ${b.obtenu ? 'text-ink' : 'text-muted-foreground'}`}>
                  {b.nom}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{b.description}</p>
                {b.obtenu && b.dateObtention && (
                  <p className="mt-1.5 text-xs font-semibold text-emerald">
                    Obtenu le {new Date(b.dateObtention).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
