import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Lock, Check, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { benevoleApi, type BadgeGamification, type Gamification } from '@/services/benevoleApi';
import { BanniereBenevole, themeBanniere } from '@/components/gamification/BanniereBenevole';
import { BadgeMedaille } from '@/components/gamification/BadgeMedaille';
import { BadgesDecroches } from '@/components/gamification/BadgesDecroches';
import { toast } from 'sonner';

export const Route = createFileRoute('/benevole/badges')({
  component: BadgesNiveau,
});

function BadgesNiveau() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Gamification | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    benevoleApi.getGamification(token)
      .then(setData)
      .catch(() => toast.error('Erreur lors du chargement des badges'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">Impossible de charger les données de niveau</p>
      </div>
    );
  }

  const paliers = data.badges.filter((b) => b.type === 'PALIER');
  const speciaux = data.badges.filter((b) => b.type === 'SPECIAL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Badges & niveau</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque mission avec certificat te fait gagner un niveau. Tous les 5 niveaux, un badge débloque une nouvelle bannière de profil.
        </p>
      </div>

      {/* Niveau actuel sur la bannière débloquée */}
      <BanniereBenevole theme={data.theme} niveau={data.niveau} nomNiveau={data.nomNiveau}>
        <h2 className="font-display text-3xl font-black">{data.nomNiveau}</h2>
        <p className="text-sm opacity-80">
          {data.niveau} mission{data.niveau > 1 ? 's' : ''} avec certificat · prochain niveau : {data.prochainNiveauNom}
        </p>
      </BanniereBenevole>

      {/* Vitrine des badges décrochés (comme sur le profil public) */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <BadgesDecroches badges={data.badges} />
      </div>

      {/* Série de 5 niveaux en cours */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display font-bold text-ink">Progression</h2>
          {data.prochainPalier ? (
            <p className="text-sm text-muted-foreground">
              Encore <span className="font-bold text-ink">{data.niveauxAvantProchainPalier} mission{data.niveauxAvantProchainPalier > 1 ? 's' : ''}</span>{' '}
              avant le badge <span className="font-bold text-pink">{data.prochainPalier.nom}</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-emerald">Tous les badges paliers sont débloqués !</p>
          )}
        </div>
        <Progress value={data.progressionPalier} className="h-3" />
        <ol className="mt-4 grid grid-cols-5 gap-2">
          {data.echelle.map((e) => (
            <li
              key={e.niveau}
              className={`rounded-xl border-2 p-2 text-center text-xs ${
                e.atteint ? 'border-ink bg-mustard font-bold text-ink' : 'border-ink/20 bg-muted text-muted-foreground'
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wide opacity-70">Niv. {e.niveau}</span>
              {e.nom}
            </li>
          ))}
        </ol>
      </div>

      {/* Badges paliers et leurs bannières */}
      <div>
        <h2 className="font-display mb-3 font-bold text-ink">Badges paliers & bannières</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paliers.map((b) => <CartePalier key={b.code} badge={b} />)}
        </div>
      </div>

      {/* Badges spéciaux */}
      <div>
        <h2 className="font-display mb-3 font-bold text-ink">Badges spéciaux</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {speciaux.map((b) => <CarteSpecial key={b.code} badge={b} />)}
        </div>
      </div>
    </div>
  );
}

function CartePalier({ badge }: { badge: BadgeGamification }) {
  const t = themeBanniere(badge.theme);
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] ${badge.obtenu ? '' : 'opacity-75'}`}>
      <div className="relative h-16 border-b-2 border-ink" style={{ background: t.fond }}>
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: t.motif }} />
        {!badge.obtenu && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <Lock className="h-5 w-5 text-white" aria-label="Verrouillé" />
          </div>
        )}
      </div>
      <div className="relative space-y-1 p-4 pl-24">
        <BadgeMedaille code={badge.code} taille={68} verrouille={!badge.obtenu} titre={badge.nom} className="absolute -top-8 left-3" />
        <p className="flex items-center gap-2 font-bold text-ink">
          {badge.nom}
          <span className="ml-auto text-xs font-semibold text-muted-foreground">Niv. {badge.valeurCritere}</span>
        </p>
        <p className="text-xs text-muted-foreground">{badge.description}</p>
        <StatutBadge badge={badge} />
      </div>
    </div>
  );
}

function CarteSpecial({ badge }: { badge: BadgeGamification }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-ink p-4 text-center shadow-[4px_4px_0_var(--color-ink)] ${badge.obtenu ? 'bg-paper' : 'bg-muted'}`}>
      <BadgeMedaille code={badge.code} taille={72} verrouille={!badge.obtenu} titre={badge.nom} />
      <p className={`text-sm font-bold ${badge.obtenu ? 'text-ink' : 'text-muted-foreground'}`}>{badge.nom}</p>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
      <StatutBadge badge={badge} />
    </div>
  );
}

function StatutBadge({ badge }: { badge: BadgeGamification }) {
  if (badge.obtenu) {
    return (
      <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald">
        <Check className="h-3 w-3" />
        Obtenu{badge.dateObtention ? ` le ${new Date(badge.dateObtention).toLocaleDateString('fr-FR')}` : ''}
      </p>
    );
  }
  return (
    <div className="w-full">
      <Progress value={(badge.progression / badge.valeurCritere) * 100} className="h-1.5" />
      <p className="mt-1 text-[11px] text-muted-foreground">{badge.progression} / {badge.valeurCritere}</p>
    </div>
  );
}
