import type { ExplorerMission } from '@/services/explorerApi';

/**
 * Résolution unique « mission + inscription → badge + boutons ».
 *
 * C'est la SEULE fonction qui décide de l'affichage d'action : les composants
 * ne font que rendre le résultat. Toute la vérité métier reste côté serveur
 * (le backend revérifie systématiquement statut, places, chevauchement, RM07…).
 */

export type MissionActionKind =
  | 'INSCRIRE'
  | 'REJOINDRE_LISTE_ATTENTE'
  | 'ANNULER_INSCRIPTION'
  | 'QUITTER_LISTE_ATTENTE'
  | 'CONFIRMER_RENFORT'
  | 'SE_REINSCRIRE'
  | 'SE_CONNECTER'
  | 'CHEVAUCHEMENT';

export type MissionActionTone = 'green' | 'orange' | 'red' | 'gray' | 'blue';

export interface MissionActionButton {
  kind: MissionActionKind;
  label: string;
  /** primary = action principale, danger = annulation, neutral = action secondaire */
  variant: 'primary' | 'danger' | 'neutral';
  disabled?: boolean;
}

export interface MissionAction {
  badge: { label: string; tone: MissionActionTone; confirmed?: boolean };
  /** Information chiffrée sous le badge (places restantes, attente, renforts). */
  detail?: string | null;
  /** Message d'aide affiché dans la carte. */
  message?: string | null;
  buttons: MissionActionButton[];
}

export interface MissionActionContext {
  /** false pour un visiteur non connecté. */
  connecte: boolean;
  /** Rôle de l'utilisateur connecté (BENEVOLE, ASSOCIATION, ADMINISTRATEUR…). */
  role?: string | null;
  /** true pour un administrateur de plateforme. */
  administrateur?: boolean;
}

function pluriel(n: number, singulier: string, plurielMot: string): string {
  return n > 1 ? plurielMot : singulier;
}

const BADGE_PAR_STATUT: Record<string, { label: string; tone: MissionActionTone }> = {
  PUBLIEE: { label: 'Publiée', tone: 'green' },
  SATUREE: { label: 'Saturée', tone: 'orange' },
  RENFORT_URGENT: { label: 'Renfort urgent', tone: 'red' },
};

/** Tonalité (couleur) associée à un statut de mission, alignée sur le badge. */
export function toneForStatut(statut: string): MissionActionTone {
  return BADGE_PAR_STATUT[statut]?.tone ?? 'blue';
}

export function resolveMissionAction(
  mission: ExplorerMission,
  ctx: MissionActionContext,
): MissionAction {
  const badgeStatut = BADGE_PAR_STATUT[mission.statut] ?? { label: mission.statut, tone: 'blue' as const };

  // Association ou administrateur : aucun bouton, on affiche seulement l'état de la mission.
  if (!ctx.connecte || (ctx.role && ctx.role !== 'BENEVOLE') || ctx.administrateur) {
    return {
      badge: badgeStatut,
      detail: mission.aDistance ? 'À distance' : mission.associationVille,
      message: null,
      buttons: ctx.connecte ? [] : [{ kind: 'SE_CONNECTER', label: 'Connectez-vous pour vous inscrire', variant: 'primary' }],
    };
  }

  const statutInscription = mission.inscriptionStatut;
  const rang = mission.rang ?? 0;

  // ── Inscription confirmée ────────────────────────────────────────────────
  if (statutInscription === 'CONFIRMEE') {
    const confirme: MissionAction = {
      badge: { label: 'Inscrit', tone: 'green', confirmed: true },
      detail: mission.aDistance ? 'À distance' : mission.associationVille,
      message: null,
      buttons: [],
    };
    // Sur un renfort urgent, l'annulation n'est pas proposée (elle est refusée par le serveur).
    if (mission.statut !== 'RENFORT_URGENT') {
      confirme.buttons = [
        { kind: 'ANNULER_INSCRIPTION', label: 'Annuler mon inscription', variant: 'danger' },
      ];
    }
    return confirme;
  }

  // ── En liste d'attente ───────────────────────────────────────────────────
  if (statutInscription === 'EN_LISTE_ATTENTE') {
    if (mission.statut === 'RENFORT_URGENT') {
      return {
        badge: { label: `En attente, rang ${rang}`, tone: 'orange' },
        detail: `${mission.nbRenfortDemande ?? 0} ${pluriel(mission.nbRenfortDemande ?? 0, 'bénévole recherché', 'bénévoles recherchés')}`,
        message: 'Le renfort a été renforcé : confirmez votre venue pour être inscrit immédiatement.',
        buttons: [
          { kind: 'CONFIRMER_RENFORT', label: 'Confirmer ma venue', variant: 'primary' },
          { kind: 'QUITTER_LISTE_ATTENTE', label: 'Quitter la liste', variant: 'neutral' },
        ],
      };
    }
    return {
      badge: { label: `En attente, rang ${rang}`, tone: 'orange' },
      detail: `${mission.listeAttenteCount} ${pluriel(mission.listeAttenteCount, 'personne en liste d’attente', 'personnes en liste d’attente')}`,
      message: 'Vous serez prévenu par e-mail dès qu’une place se libère.',
      buttons: [
        { kind: 'QUITTER_LISTE_ATTENTE', label: 'Quitter la liste d’attente', variant: 'danger' },
      ],
    };
  }

  // ── Inscription annulée (réinscription sur la même ligne) ────────────────
  if (statutInscription === 'ANNULEE') {
    const saturée = mission.statut === 'SATUREE';
    return {
      badge: { label: 'Inscription annulée', tone: 'gray' },
      detail: `${mission.placesRestantes} ${pluriel(mission.placesRestantes, 'place restante', 'places restantes')}`,
      message: saturée ? 'La mission est complète : vous rejoindrez la liste d’attente.' : null,
      buttons: [
        mission.chevauche
          ? { kind: 'CHEVAUCHEMENT', label: 'Chevauche une de vos missions', variant: 'primary', disabled: true }
          : {
              kind: 'SE_REINSCRIRE',
              label: saturée ? 'Rejoindre la liste d’attente' : 'Se réinscrire',
              variant: 'primary',
            },
      ],
    };
  }

  // ── Aucune inscription ───────────────────────────────────────────────────
  if (mission.statut === 'SATUREE') {
    const position = mission.listeAttenteCount + 1;
    return {
      badge: { label: 'Saturée', tone: 'orange' },
      detail: `${mission.listeAttenteCount} ${pluriel(mission.listeAttenteCount, 'personne en liste d’attente', 'personnes en liste d’attente')}`,
      message: `Vous serez en position ${position}.`,
      buttons: [
        mission.chevauche
          ? { kind: 'CHEVAUCHEMENT', label: 'Chevauche une de vos missions', variant: 'primary', disabled: true }
          : { kind: 'REJOINDRE_LISTE_ATTENTE', label: 'Rejoindre la liste d’attente', variant: 'primary' },
      ],
    };
  }

  if (mission.statut === 'RENFORT_URGENT') {
    const recherche = mission.nbRenfortDemande ?? 0;
    return {
      badge: { label: 'Renfort urgent', tone: 'red' },
      detail: `${recherche} ${pluriel(recherche, 'bénévole recherché', 'bénévoles recherchés')}`,
      message: 'Inscription immédiate, sans liste d’attente.',
      buttons: [
        mission.chevauche
          ? { kind: 'CHEVAUCHEMENT', label: 'Chevauche une de vos missions', variant: 'primary', disabled: true }
          : { kind: 'INSCRIRE', label: 'Je viens aider', variant: 'primary' },
      ],
    };
  }

  // PUBLIEE (et tout autre statut ouvert)
  return {
    badge: {
      label: `${mission.placesRestantes} ${pluriel(mission.placesRestantes, 'place disponible', 'places disponibles')}`,
      tone: 'green',
    },
    detail: `${mission.placesRestantes} / ${mission.nbPlaces} places`,
    message: null,
    buttons: [
      mission.chevauche
        ? { kind: 'CHEVAUCHEMENT', label: 'Chevauche une de vos missions', variant: 'primary', disabled: true }
        : { kind: 'INSCRIRE', label: 'S’inscrire', variant: 'primary' },
    ],
  };
}

/** Classes Tailwind des pastilles de badge. */
export const TONE_CLASSES: Record<MissionActionTone, string> = {
  green: 'bg-green-100 text-green-800 border-green-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
  red: 'bg-red-100 text-red-800 border-red-300',
  gray: 'bg-gray-100 text-gray-600 border-gray-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
};

/** Couleur des marqueurs sur la carte, alignée sur les badges. */
export const TONE_MARKER_COLORS: Record<MissionActionTone, string> = {
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
  gray: '#9ca3af',
  blue: '#3b82f6',
};
