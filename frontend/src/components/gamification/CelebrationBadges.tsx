import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { PartyPopper } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { benevoleApi, type BadgeGamification, type Gamification } from '@/services/benevoleApi';
import { BanniereBenevole } from './BanniereBenevole';
import { BadgeMedaille } from './BadgeMedaille';

/** Célébration affichée une seule fois quand le bénévole a débloqué de nouveaux badges. */
export function CelebrationBadges() {
  const { token } = useAuth();
  const [data, setData] = useState<Gamification | null>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    if (!token) return;
    benevoleApi.getGamification(token)
      .then((g) => {
        if (g.nouveauxBadges.length > 0) {
          setData(g);
          setOuvert(true);
        }
      })
      .catch(() => { /* la célébration est facultative */ });
  }, [token]);

  function fermer() {
    setOuvert(false);
    if (token) benevoleApi.marquerBadgesVus(token).catch(() => {});
  }

  if (!data) return null;
  const palier = data.nouveauxBadges.find((b) => b.type === 'PALIER');

  return (
    <Dialog open={ouvert} onOpenChange={(o) => { if (!o) fermer(); }}>
      <DialogContent className="max-w-md rounded-2xl border-2 border-ink shadow-[6px_6px_0_var(--color-ink)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl font-black text-ink">
            <PartyPopper className="h-6 w-6 text-pink" />
            {data.nouveauxBadges.length > 1 ? 'Nouveaux badges !' : 'Nouveau badge !'}
          </DialogTitle>
          <DialogDescription>
            Bravo pour ton engagement : tu es maintenant au niveau {data.niveau} « {data.nomNiveau} ».
          </DialogDescription>
        </DialogHeader>

        {palier && (
          <BanniereBenevole theme={palier.theme} niveau={data.niveau} nomNiveau={data.nomNiveau} taille="md">
            <p className="font-display text-lg font-black">Bannière « {palier.nom} » débloquée</p>
          </BanniereBenevole>
        )}

        <ul className="space-y-2">
          {data.nouveauxBadges.map((b: BadgeGamification) => (
            <li key={b.code} className="flex items-center gap-3 rounded-xl border-2 border-ink bg-paper p-3">
              <BadgeMedaille code={b.code} taille={48} titre={b.nom} />
              <div>
                <p className="font-bold text-ink">{b.nom}</p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <Link
          to="/benevole/badges"
          onClick={fermer}
          className="block rounded-xl border-2 border-ink bg-mustard px-4 py-2.5 text-center text-sm font-bold text-ink shadow-[3px_3px_0_var(--color-ink)]"
        >
          Voir tous mes badges
        </Link>
      </DialogContent>
    </Dialog>
  );
}
