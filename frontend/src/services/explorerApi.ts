import type { MissionStatut } from '@/components/dashboard/data';
import { ApiHttpError } from './benevoleApi';

const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:8080';

export type StatutInscription = 'CONFIRMEE' | 'EN_LISTE_ATTENTE' | 'ANNULEE';
export type MethodeScore = 'IA' | 'FORMULE';

/** Mission telle que renvoyée par /api/missions/explorer (le front n'applique aucune règle métier). */
export interface ExplorerMission {
  id: number;
  titre: string;
  description: string | null;
  domaine: string | null;
  domaineId: number | null;
  associationNom: string | null;
  associationVille: string | null;
  associationId: number | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  aDistance: boolean;
  dateDebut: string;
  dateFin: string;
  competences: string[];
  /** Capacité totale (inscrits confirmés + places restantes). */
  nbPlaces: number;
  placesRestantes: number;
  listeAttenteCount: number;
  nbRenfortDemande: number | null;
  statut: MissionStatut;
  imageUrl: string | null;
  inscriptionStatut: StatutInscription | null;
  rang: number | null;
  chevauche: boolean;
  // Présents uniquement sur l'onglet « Recommandées pour moi »
  score?: number | null;
  explication?: string | null;
  methode?: MethodeScore | null;
}

export interface ExplorerPage {
  content: ExplorerMission[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export interface ExplorerStats {
  missionsRealisees: number;
  inscriptionsAVenir: number;
  enListeAttente: number;
  renfortDisponiblePourMoi: boolean;
  recommandations: { nombre: number; meilleurScore: number | null };
  niveau: {
    nom: string;
    missionsActuelles: number;
    seuilSuivant: number | null;
    niveauSuivant: string | null;
  };
  dernierBadge: { code: string; nom: string } | null;
  prochaineMission: {
    idMission: number;
    titre: string;
    dateDebut: string;
    ville: string | null;
  } | null;
}

export interface MissionCarte {
  id: number;
  titre: string;
  latitude: number | null;
  longitude: number | null;
  dateDebut: string;
  placesRestantes: number;
  statut: MissionStatut;
  domaine: string | null;
  ville: string | null;
  inscriptionStatut?: StatutInscription | null;
}

export interface InscriptionResponse {
  statutInscription: StatutInscription;
  rang: number | null;
  nbPlaces: number;
  nbPlacesListeAttente: number;
  statutMission: MissionStatut;
}

export interface ExplorerFilters {
  page?: number;
  domaine?: string;
  ville?: string;
  date?: string;
  competences?: number[];
  placesDisponibles?: boolean;
  inclureInscrites?: boolean;
}

export interface DomaineOption {
  id: number;
  nom: string;
}

export interface CompetenceOption {
  id: number;
  nom: string;
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
      "Impossible de joindre le serveur. Vérifiez que le backend Spring est démarré.",
    );
  }
}

/** Extrait le message d'erreur du backend (JSON {message}) ou renvoie le fallback. */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

async function getJson<T>(path: string, token: string, fallback: string): Promise<T> {
  const res = await authFetch(`${API_BASE}${path}`, token);
  if (!res.ok) {
    const msg = await errorMessage(res, fallback);
    throw new ApiHttpError(msg, res.status);
  }
  return res.json();
}

export const explorerApi = {
  /** GET /api/missions/explorer — page de missions (10 par page, RENFORT_URGENT en tête). */
  async explorer(token: string, filters: ExplorerFilters = {}): Promise<ExplorerPage> {
    const params = new URLSearchParams();
    params.set('page', String(filters.page ?? 0));
    if (filters.domaine) params.set('domaine', filters.domaine);
    if (filters.ville) params.set('ville', filters.ville);
    if (filters.date) params.set('date', filters.date);
    if (filters.competences?.length) params.set('competences', filters.competences.join(','));
    if (filters.placesDisponibles) params.set('placesDisponibles', 'true');
    if (filters.inclureInscrites) params.set('inclureInscrites', 'true');
    return getJson<ExplorerPage>(
      `/api/missions/explorer?${params.toString()}`,
      token,
      'Erreur lors du chargement des missions.',
    );
  },

  /** GET /api/missions/mes-inscriptions — missions où le bénévole est inscrit. */
  async mesInscriptions(token: string, page: number = 0, statutMission?: string): Promise<ExplorerPage> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (statutMission) params.set('statutMission', statutMission);
    return getJson<ExplorerPage>(
      `/api/missions/mes-inscriptions?${params.toString()}`,
      token,
      'Erreur lors du chargement de vos inscriptions.',
    );
  },

  /** GET /api/missions/mes-inscriptions/terminees — missions terminées du bénévole. */
  async mesInscriptionsTerminees(token: string): Promise<ExplorerMission[]> {
    return getJson<ExplorerMission[]>(
      '/api/missions/mes-inscriptions/terminees',
      token,
      'Erreur lors du chargement de vos missions terminées.',
    );
  },

  /** GET /api/missions/{id} — détail complet (statut d'inscription inclus). */
  async detail(token: string, missionId: number): Promise<ExplorerMission> {
    return getJson<ExplorerMission>(
      `/api/missions/${missionId}`,
      token,
      'Mission introuvable.',
    );
  },

  /** GET /api/missions/recommandations — missions triées par score décroissant. */
  async recommandations(token: string): Promise<ExplorerMission[]> {
    return getJson<ExplorerMission[]>(
      '/api/missions/recommandations',
      token,
      'Erreur lors du chargement des recommandations.',
    );
  },

  /** GET /api/missions/carte — missions géolocalisées (les missions à distance sont exclues). */
  async carte(token: string, filters: { domaine?: string; date?: string } = {}): Promise<MissionCarte[]> {
    const params = new URLSearchParams();
    if (filters.domaine) params.set('domaine', filters.domaine);
    if (filters.date) params.set('date', filters.date);
    const qs = params.toString();
    return getJson<MissionCarte[]>(
      `/api/missions/carte${qs ? `?${qs}` : ''}`,
      token,
      'Erreur lors du chargement de la carte.',
    );
  },

  /** GET /api/benevole/explorer-stats — mini-dashboard. */
  async stats(token: string): Promise<ExplorerStats> {
    return getJson<ExplorerStats>(
      '/api/benevole/explorer-stats',
      token,
      'Erreur lors du chargement du tableau de bord.',
    );
  },

  /** POST /api/missions/{id}/inscription — CONFIRMEE ou EN_LISTE_ATTENTE selon l'état serveur. */
  async inscrire(token: string, missionId: number): Promise<InscriptionResponse> {
    const res = await authFetch(`${API_BASE}/api/missions/${missionId}/inscription`, token, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new ApiHttpError(await errorMessage(res, "Erreur lors de l'inscription."), res.status);
    }
    return res.json();
  },

  /** DELETE /api/missions/{id}/inscription — annulation + promotion automatique. */
  async annuler(token: string, missionId: number): Promise<InscriptionResponse> {
    const res = await authFetch(`${API_BASE}/api/missions/${missionId}/inscription`, token, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new ApiHttpError(await errorMessage(res, "Erreur lors de l'annulation."), res.status);
    }
    return res.json();
  },

  /** POST /api/missions/{id}/inscription/confirmer-renfort — confirmation immédiate. */
  async confirmerRenfort(token: string, missionId: number): Promise<InscriptionResponse> {
    const res = await authFetch(
      `${API_BASE}/api/missions/${missionId}/inscription/confirmer-renfort`,
      token,
      { method: 'POST' },
    );
    if (!res.ok) {
      throw new ApiHttpError(await errorMessage(res, 'Erreur lors de la confirmation.'), res.status);
    }
    return res.json();
  },

  /** Catalogue public des domaines (filtre). */
  async domaines(): Promise<DomaineOption[]> {
    try {
      const res = await fetch(`${API_BASE}/api/domaines`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /** Catalogue public des compétences (filtre). */
  async competences(): Promise<CompetenceOption[]> {
    try {
      const res = await fetch(`${API_BASE}/api/competences`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /** Villes distinctes proposées par les missions publiées. */
  async villes(): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE}/api/missions/cities`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /** GET /api/missions/{id}/certificat — récupérer le certificat d'une mission terminée. */
  async getCertificat(token: string, missionId: number): Promise<{
    codeVerification: string;
    dateDelivrance: string;
    missionTitre: string;
    missionDateDebut: string;
    missionDateFin: string;
    associationNom: string;
  }> {
    return getJson(
      `/api/missions/${missionId}/certificat`,
      token,
      'Certificat non disponible.',
    );
  },
};

export default explorerApi;
