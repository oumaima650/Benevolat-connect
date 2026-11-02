import { BenevoleInscription, MissionCardBackend } from './missionApi';

const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:8080';

/** Badge PALIER (tous les 5 niveaux, avec bannière) ou SPECIAL (critère d'engagement). */
export interface BadgeGamification {
  code: string;
  nom: string;
  description: string;
  type: 'PALIER' | 'SPECIAL';
  theme: string | null;
  valeurCritere: number;
  /** Valeur actuelle du critère, plafonnée au seuil. */
  progression: number;
  obtenu: boolean;
  dateObtention: string | null;
}

/** Niveau = nombre de missions avec certificat délivré. */
export interface Gamification {
  niveau: number;
  nomNiveau: string;
  prochainNiveauNom: string;
  /** Thème de la bannière de profil (plus haut badge PALIER obtenu, sinon "nouveau"). */
  theme: string;
  palierActuel: BadgeGamification | null;
  prochainPalier: BadgeGamification | null;
  niveauxAvantProchainPalier: number;
  /** Avancement dans la série de 5 niveaux en cours (0-100). */
  progressionPalier: number;
  echelle: { niveau: number; nom: string; atteint: boolean }[];
  badges: BadgeGamification[];
  nouveauxBadges: BadgeGamification[];
}

/** Version courte affichée aux associations et à l'administrateur. */
export interface GamificationResume {
  niveau: number;
  nomNiveau: string;
  theme: string;
  palier: string | null;
}

export interface BenevoleProfileApi {
  id?: number;
  email?: string;
  prenom: string;
  nom: string;
  telephone?: string;
  dateNaissance?: string;
  ville: string;
  biographie: string;
  rayonDeplacementKm: number;
  competences: string[];
  domaineIds?: number[];
  photoUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BenevoleDashboardData {
  prenom: string;
  missionsRealisees: number;
  badgesObtenus: number;
  enListeAttenteCount: number;
  gamification: Gamification;
  prochainesMissions: MissionCardBackend[];
  listeAttente: BenevoleInscription[];
  dernieresNotifications: {
    id: number;
    categorie: string;
    titre: string;
    message: string;
    lien: string | null;
    lue: boolean;
    date: string;
  }[];
  activiteMensuelle: {
    mois: string;
    inscriptions: number;
    certifs: number;
  }[];
  missionsParDomaine: {
    name: string;
    value: number;
    fill: string;
  }[];
}

/** Erreur HTTP portant le code de statut, pour distinguer un JWT invalide (401/403) d'une panne réseau. */
export class ApiHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

async function authFetch(url: string, token: string, options: RequestInit = {}) {
  try {
    return await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur (http://localhost:8080). Vérifiez que le backend Spring est démarré.",
    );
  }
}

export const benevoleApi = {
  async getProfile(token: string): Promise<BenevoleProfileApi> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me`, token);
    if (!res.ok) throw new ApiHttpError('Erreur lors du chargement du profil.', res.status);
    return res.json();
  },

  async updateProfile(
    token: string,
    data: Partial<BenevoleProfileApi>,
  ): Promise<BenevoleProfileApi> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new ApiHttpError('Erreur lors de la mise à jour du profil.', res.status);
    return res.json();
  },

  async getDashboardData(token: string): Promise<BenevoleDashboardData> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me/dashboard`, token);
    if (res.status === 401 || res.status === 403) {
      throw new ApiHttpError(
        'Session invalide ou expirée. Reconnectez-vous pour charger votre tableau de bord.',
        res.status,
      );
    }
    if (!res.ok) {
      throw new ApiHttpError(
        'Erreur lors du chargement des données du tableau de bord.',
        res.status,
      );
    }
    return res.json();
  },

  async getGamification(token: string): Promise<Gamification> {
    const res = await authFetch(`${API_BASE}/api/benevoles/gamification`, token);
    if (!res.ok) throw new ApiHttpError('Erreur lors du chargement des badges.', res.status);
    return res.json();
  },

  /** Les célébrations des nouveaux badges ont été affichées. */
  async marquerBadgesVus(token: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/api/benevoles/gamification/vus`, token, { method: 'POST' });
    if (!res.ok) throw new ApiHttpError('Erreur lors de la mise à jour des badges.', res.status);
  },

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me/password`, token, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiHttpError(
        (data as { message?: string }).message || 'Erreur lors du changement de mot de passe.', res.status);
    }
  },

  /** Désactivation volontaire : annule les inscriptions à venir, e-mail de confirmation. */
  async desactiver(token: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me/desactiver`, token, { method: 'PATCH' });
    if (!res.ok) throw new Error('Impossible de désactiver le compte.');
  },
};
