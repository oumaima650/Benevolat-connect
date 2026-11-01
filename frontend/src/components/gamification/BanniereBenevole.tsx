import type { ReactNode } from 'react';
import { BadgeMedaille } from './BadgeMedaille';

/**
 * Bannières de profil débloquées par les badges PALIER (tous les 5 niveaux).
 * La clé correspond à Badge.theme côté backend ; "nouveau" avant le premier badge.
 */
type ThemeBanniere = {
  label: string;
  fond: string;
  motif: string;
  clair: boolean;
  accent: string;
  /** Code du badge palier qui débloque la bannière (null avant le premier badge). */
  badge: string | null;
};

const etoiles = (couleur: string) =>
  `radial-gradient(circle at 12% 30%, ${couleur} 1.5px, transparent 2px),
   radial-gradient(circle at 78% 22%, ${couleur} 1px, transparent 1.5px),
   radial-gradient(circle at 42% 78%, ${couleur} 1.5px, transparent 2px),
   radial-gradient(circle at 90% 70%, ${couleur} 1px, transparent 1.5px),
   radial-gradient(circle at 62% 45%, ${couleur} 1px, transparent 1.5px)`;

export const THEMES_BANNIERE: Record<string, ThemeBanniere> = {
  nouveau: {
    label: 'Nouveau cœur',
    fond: 'linear-gradient(135deg, #fbf7ef 0%, #f5f0e8 100%)',
    motif: 'radial-gradient(rgba(26,26,26,0.12) 1px, transparent 1px)',
    clair: true,
    accent: '#E96FA3',
    badge: null,
  },
  etincelle: {
    label: 'Étincelle',
    fond: 'linear-gradient(135deg, #f7c948 0%, #ffe08a 100%)',
    motif: etoiles('rgba(255,255,255,0.9)'),
    clair: true,
    accent: '#1a1a1a',
    badge: 'ETINCELLE',
  },
  flamme: {
    label: 'Flamme',
    fond: 'linear-gradient(135deg, #ff8a3d 0%, #e8423f 100%)',
    motif: 'repeating-radial-gradient(circle at 50% 120%, rgba(255,214,102,0.35) 0 12px, transparent 12px 28px)',
    clair: false,
    accent: '#ffd666',
    badge: 'FLAMME',
  },
  phare: {
    label: 'Phare',
    fond: 'linear-gradient(135deg, #1e2a5a 0%, #2f4a8a 100%)',
    motif: 'conic-gradient(from 200deg at 85% 10%, rgba(255,236,153,0.45) 0deg, transparent 25deg, transparent 335deg, rgba(255,236,153,0.45) 360deg)',
    clair: false,
    accent: '#ffec99',
    badge: 'PHARE',
  },
  etoile: {
    label: 'Étoile',
    fond: 'linear-gradient(135deg, #5b3fa0 0%, #b07cd8 60%, #d4a017 100%)',
    motif: etoiles('rgba(255,236,153,0.95)'),
    clair: false,
    accent: '#ffe08a',
    badge: 'ETOILE',
  },
  constellation: {
    label: 'Constellation',
    fond: 'linear-gradient(135deg, #0f1035 0%, #3b1c6e 55%, #6d2a8a 100%)',
    motif: `${etoiles('rgba(255,255,255,0.95)')},
            linear-gradient(115deg, transparent 48%, rgba(255,255,255,0.25) 49%, rgba(255,255,255,0.25) 50%, transparent 51%)`,
    clair: false,
    accent: '#c4b5fd',
    badge: 'CONSTELLATION',
  },
  legende: {
    label: 'Légende',
    fond: 'linear-gradient(135deg, #1a1a1a 0%, #3a2f12 100%)',
    motif: 'repeating-linear-gradient(45deg, rgba(230,180,34,0.18) 0 2px, transparent 2px 14px)',
    clair: false,
    accent: '#e6b422',
    badge: 'LEGENDE',
  },
};

export function themeBanniere(theme: string | null | undefined): ThemeBanniere {
  return THEMES_BANNIERE[theme ?? 'nouveau'] ?? THEMES_BANNIERE['nouveau']!;
}

type BanniereProps = {
  theme: string | null | undefined;
  niveau: number;
  nomNiveau: string;
  /** Contenu principal (nom, salutation…). */
  children?: ReactNode;
  /** Contenu aligné à droite (actions, progression…). */
  aside?: ReactNode;
  taille?: 'lg' | 'md' | 'sm';
  className?: string;
};

/** Bandeau personnalisé selon le dernier badge PALIER obtenu par le bénévole. */
export function BanniereBenevole({ theme, niveau, nomNiveau, children, aside, taille = 'lg', className = '' }: BanniereProps) {
  const t = themeBanniere(theme);
  const hauteur = taille === 'lg' ? 'min-h-40 p-6' : taille === 'md' ? 'min-h-28 p-4' : 'min-h-16 p-3';
  const texte = t.clair ? 'text-ink' : 'text-white';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)] ${hauteur} ${className}`}
      style={{ background: t.fond }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${theme === 'constellation' ? 'animate-pulse' : ''}`}
        style={{ backgroundImage: t.motif, backgroundSize: theme === 'nouveau' ? '14px 14px' : undefined }}
      />
      {t.badge && (
        <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-6 opacity-25">
          <BadgeMedaille code={t.badge} taille={150} />
        </div>
      )}
      <div className={`relative flex flex-wrap items-center justify-between gap-4 ${texte}`}>
        <div className="min-w-0 flex-1">
          <PastilleNiveau theme={theme} niveau={niveau} nomNiveau={nomNiveau} inverse />
          {children && <div className="mt-2">{children}</div>}
        </div>
        {aside && <div className="relative">{aside}</div>}
      </div>
    </div>
  );
}

type PastilleProps = {
  theme: string | null | undefined;
  niveau: number;
  nomNiveau: string;
  /** Sur une bannière : fond clair pour rester lisible. */
  inverse?: boolean;
};

/** Pastille compacte « Niv. 7 · Relais » aux couleurs de la bannière. */
export function PastilleNiveau({ theme, niveau, nomNiveau, inverse = false }: PastilleProps) {
  const t = themeBanniere(theme);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold shadow-[2px_2px_0_var(--color-ink)] ${
        inverse || t.clair ? 'text-ink' : 'text-white'
      }`}
      style={{ background: inverse ? '#fffdf7' : t.fond }}
      title={`Bannière ${t.label}`}
    >
      {t.badge ? (
        <BadgeMedaille code={t.badge} taille={18} titre={t.label} />
      ) : (
        <span aria-hidden className="h-2.5 w-2.5 rounded-full border border-ink" style={{ background: t.accent }} />
      )}
      Niv. {niveau} · {nomNiveau}
    </span>
  );
}
