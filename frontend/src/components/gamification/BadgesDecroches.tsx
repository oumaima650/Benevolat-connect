import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { BadgeGamification } from '@/services/benevoleApi';
import { BadgeMedaille } from './BadgeMedaille';

type Props = {
  /** Badges décrochés (les badges non obtenus sont ignorés). */
  badges: BadgeGamification[];
  taille?: number;
  titre?: string;
  /** Message affiché quand aucun badge n'est encore décroché. */
  vide?: string;
};

/** Vitrine des badges décrochés (paliers puis spéciaux, dans l'ordre d'affichage). */
export function BadgesDecroches({ badges, taille = 64, titre = 'Badges décrochés', vide }: Props) {
  const obtenus = badges.filter((b) => b.obtenu);
  return (
    <section>
      <h2 className="mb-3 font-display font-bold text-ink">
        {titre} <span className="text-sm font-semibold text-muted-foreground">({obtenus.length})</span>
      </h2>
      {obtenus.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {vide ?? 'Aucun badge pour le moment : le premier arrive au niveau 5.'}
        </p>
      ) : (
        <TooltipProvider delayDuration={150}>
          <ul className="flex flex-wrap gap-3">
            {obtenus.map((b) => (
              <li key={b.code}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                    >
                      <BadgeMedaille code={b.code} taille={taille} titre={b.nom} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-56 border-2 border-ink bg-paper text-ink shadow-[3px_3px_0_var(--color-ink)]">
                    <p className="font-bold">{b.nom}</p>
                    <p className="text-xs text-muted-foreground">{b.description}</p>
                    {b.dateObtention && (
                      <p className="mt-1 text-xs font-semibold text-emerald">
                        Décroché le {new Date(b.dateObtention).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      )}
    </section>
  );
}
