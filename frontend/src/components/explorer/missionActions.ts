import type { ExplorerMission } from '@/services/explorerApi';

export type ActionKind =
  | 'login'
  | 'hidden'
  | 'disabled'
  | 'inscrire'
  | 'attente'
  | 'renfort'
  | 'annuler'
  | 'quitter'
  | 'confirmer-renfort'
  | 'reinscrire'
  | 'reinscrire-attente';

export interface MissionAction {
  kind: ActionKind;
  label: string;
  disabled?: boolean;
}

export interface MissionBadgeView {
  label: string;
  tone: 'green' | 'orange' | 'red' | 'gray';
}

export interface MissionUi {
  badges: MissionBadgeView[];
  extras: string[];
  hint?: string;
  actions: MissionAction[];
}

/**
 * Unique point de vérité UI : badge + boutons à partir de (mission, inscription).
 * Aucune règle métier n'est recalculée ici — uniquement de l'affichage.
 */
export function resolveMissionUi(
  mission: ExplorerMission,
  role?: string | null,
): MissionUi {
  if (!role) {
    return {
      badges: badgesFromMission(mission),
      extras: extrasFromMission(mission),
      actions: [{ kind: 'login', label: 'Connectez-vous pour vous inscrire' }],
    };
  }

  if (role === 'ASSOCIATION' || role === 'ADMIN') {
    return {
      badges: badgesFromMission(mission),
      extras: extrasFromMission(mission),
      actions: [{ kind: 'hidden', label: '' }],
    };
  }

  const statutInsc = mission.inscriptionStatut;
  const missionStatut = mission.statut;

  if (statutInsc === 'CONFIRMEE') {
    const actions: MissionAction[] =
      missionStatut === 'RENFORT_URGENT'
        ? []
        : [{ kind: 'annuler', label: 'Annuler mon inscription' }];
    return {
      badges: [{ label: '✓ Inscrit', tone: 'green' }],
      extras: extrasFromMission(mission),
      actions,
    };
  }

  if (statutInsc === 'EN_LISTE_ATTENTE') {
    if (missionStatut === 'RENFORT_URGENT') {
      const actions: MissionAction[] = [
        mission.chevauche
          ? { kind: 'disabled', label: 'Chevauche une de vos missions', disabled: true }
          : { kind: 'confirmer-renfort', label: 'Confirmer ma venue' },
        { kind: 'quitter', label: 'Quitter la liste' },
      ];
      return {
        badges: [{ label: rangLabel(mission.rang), tone: 'orange' }],
        extras: extrasFromMission(mission),
        actions,
      };
    }
    return {
      badges: [{ label: rangLabel(mission.rang), tone: 'orange' }],
      extras: extrasFromMission(mission),
      hint: 'Vous serez prévenu par e-mail dès qu’une place se libère',
      actions: [{ kind: 'quitter', label: 'Quitter la liste d’attente' }],
    };
  }

  if (statutInsc === 'ANNULEE') {
    return cancelledUi(mission);
  }

  // Non inscrit
  if (mission.chevauche) {
    return {
      badges: badgesFromMission(mission),
      extras: extrasFromMission(mission),
      actions: [{ kind: 'disabled', label: 'Chevauche une de vos missions', disabled: true }],
    };
  }

  if (missionStatut === 'RENFORT_URGENT') {
    return {
      badges: [{ label: '🚨 Renfort urgent', tone: 'red' }],
      extras: [
        `${mission.nbRenfortDemande ?? 0} bénévole${(mission.nbRenfortDemande ?? 0) > 1 ? 's' : ''} recherché${(mission.nbRenfortDemande ?? 0) > 1 ? 's' : ''}`,
      ],
      actions: [{ kind: 'renfort', label: 'Je viens aider' }],
    };
  }

  if (missionStatut === 'SATUREE' || (mission.placesRestantes ?? 0) <= 0) {
    const n = mission.listeAttenteCount ?? 0;
    return {
      badges: [{ label: 'Saturée', tone: 'orange' }],
      extras: [`${n} personne${n > 1 ? 's' : ''} en liste d’attente`],
      hint: `Vous serez en position ${n + 1}`,
      actions: [{ kind: 'attente', label: 'Rejoindre la liste d’attente' }],
    };
  }

  const places = mission.placesRestantes ?? 0;
  return {
    badges: [
      {
        label: `${places} place${places > 1 ? 's' : ''} disponible${places > 1 ? 's' : ''}`,
        tone: 'green',
      },
    ],
    extras: extrasFromMission(mission),
    actions: [{ kind: 'inscrire', label: 'S’inscrire' }],
  };
}

function cancelledUi(mission: ExplorerMission): MissionUi {
  if (mission.chevauche) {
    return {
      badges: [{ label: 'Inscription annulée', tone: 'gray' }],
      extras: extrasFromMission(mission),
      actions: [{ kind: 'disabled', label: 'Chevauche une de vos missions', disabled: true }],
    };
  }
  if (mission.statut === 'RENFORT_URGENT') {
    return {
      badges: [{ label: 'Inscription annulée', tone: 'gray' }],
      extras: extrasFromMission(mission),
      actions: [{ kind: 'renfort', label: 'Je viens aider' }],
    };
  }
  if (mission.statut === 'SATUREE' || (mission.placesRestantes ?? 0) <= 0) {
    return {
      badges: [{ label: 'Inscription annulée', tone: 'gray' }],
      extras: extrasFromMission(mission),
      actions: [{ kind: 'reinscrire-attente', label: 'Rejoindre la liste d’attente' }],
    };
  }
  return {
    badges: [{ label: 'Inscription annulée', tone: 'gray' }],
    extras: extrasFromMission(mission),
    actions: [{ kind: 'reinscrire', label: 'Se réinscrire' }],
  };
}

function badgesFromMission(mission: ExplorerMission): MissionBadgeView[] {
  if (mission.statut === 'RENFORT_URGENT') {
    return [{ label: '🚨 Renfort urgent', tone: 'red' }];
  }
  if (mission.statut === 'SATUREE' || (mission.placesRestantes ?? 0) <= 0) {
    return [{ label: 'Saturée', tone: 'orange' }];
  }
  const places = mission.placesRestantes ?? 0;
  return [
    {
      label: `${places} place${places > 1 ? 's' : ''} disponible${places > 1 ? 's' : ''}`,
      tone: 'green',
    },
  ];
}

function extrasFromMission(mission: ExplorerMission): string[] {
  const extras: string[] = [];
  if (mission.statut === 'RENFORT_URGENT' && (mission.nbRenfortDemande ?? 0) > 0) {
    extras.push(`${mission.nbRenfortDemande} bénévoles recherchés`);
  }
  if ((mission.listeAttenteCount ?? 0) > 0 && mission.statut !== 'RENFORT_URGENT') {
    extras.push(`${mission.listeAttenteCount} en liste d’attente`);
  }
  return extras;
}

function rangLabel(rang?: number | null): string {
  return rang != null ? `En attente, rang ${rang}` : 'En attente';
}

export const badgeToneClass: Record<MissionBadgeView['tone'], string> = {
  green: 'bg-green-100 text-green-800 border-green-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
  red: 'bg-red-100 text-red-800 border-red-300',
  gray: 'bg-gray-100 text-gray-600 border-gray-300',
};
