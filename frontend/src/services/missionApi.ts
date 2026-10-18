import type { Mission } from "@/components/site/data";

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8080/api";

export interface MissionCardBackend {
  id: number;
  titre: string;
  description: string;
  domaine: string;
  ville: string;
  adresse?: string;
  dateDebut: string;
  dateFin: string;
  nbPlaces: number;
  nbBenevoles?: number;
  placesRestantes: number;
  listeAttenteCount: number;
  statut: string; // StatutMission backend (PUBLIEE, SATUREE, RENFORT_URGENT, EN_COURS…)
  badge?: string;
  imageUrl?: string;
  associationId?: number;
  associationNom?: string;
}

export interface EditionPrecedenteBackend {
  id: number;
  imageUrl?: string;
  dateDebut?: string;
}

export interface AssociationDetailBackend {
  associationId?: number;
  associationNom?: string;
  associationDescription?: string;
  associationDomaine?: string;
  associationVille?: string;
  associationEmail?: string;
  associationContact?: string;
  associationPhotoProfil?: string;
  editionsPrecedentes?: EditionPrecedenteBackend[];
}

export type MissionDetailBackend = MissionCardBackend & AssociationDetailBackend;

// --------------------------------------------------------------------------
// Inscription à une mission (bénévole connecté)
// --------------------------------------------------------------------------

export type StatutInscription = "CONFIRMEE" | "EN_LISTE_ATTENTE" | "ANNULEE";

export interface InscriptionResponse {
  statutInscription: StatutInscription;
  rang: number | null;
  nbPlaces: number;
  nbPlacesListeAttente: number;
  statutMission: string;
}

export interface InscriptionStatus {
  inscrit: boolean;
  statut?: StatutInscription;
  rang?: number | null;
}

export interface BenevoleInscription {
  idInscription: number;
  missionId: number;
  missionTitre: string;
  association: string | null;
  domaine: string | null;
  ville: string | null;
  dateDebut: string;
  dateFin: string;
  statut: StatutInscription;
  rang: number | null;
  dateInscription: string;
}

export interface BenevoleCertificat {
  certificatId: number;
  inscriptionId: number;
  benevoleId: number;
  benevoleNom: string;
  benevolePrenom: string;
  codeVerification: string;
  urlPdf: string | null;
  dateDelivrance: string;
  missionTitre: string | null;
  associationNom: string | null;
}

/** Helper pour les requêtes authentifiées (Bearer token). */
async function authFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

/** Extrait le message d'erreur du backend (JSON {message} ou fallback). */
async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

export const inscriptionApi = {
  /** Récupère le statut d'inscription du bénévole pour une mission. */
  async getStatus(token: string, missionId: string | number): Promise<InscriptionStatus> {
    const res = await authFetch(`${API_BASE_URL}/benevoles/missions/${missionId}/inscription`, token);
    if (!res.ok) return { inscrit: false };
    return res.json();
  },

  /** Liste toutes les inscriptions du bénévole connecté. */
  async getMesInscriptions(token: string): Promise<BenevoleInscription[]> {
    const res = await authFetch(`${API_BASE_URL}/benevoles/mes-inscriptions`, token);
    if (!res.ok) throw new Error("Erreur lors du chargement des inscriptions.");
    return res.json();
  },

  /** Liste tous les certificats du bénévole connecté. */
  async getMesCertificats(token: string): Promise<BenevoleCertificat[]> {
    const res = await authFetch(`${API_BASE_URL}/benevoles/mes-certificats`, token);
    if (!res.ok) throw new Error("Erreur lors du chargement des certificats.");
    return res.json();
  },

  /** S'inscrire à une mission. */
  async inscrire(token: string, missionId: string | number): Promise<InscriptionResponse> {
    const res = await authFetch(`${API_BASE_URL}/benevoles/missions/${missionId}/inscription`, token, {
      method: "POST",
    });
    if (!res.ok) {
      const msg = await extractErrorMessage(res, "Erreur lors de l'inscription.");
      throw new Error(msg);
    }
    return res.json();
  },

  /** Annuler son inscription à une mission. */
  async annuler(token: string, missionId: string | number): Promise<InscriptionResponse> {
    const res = await authFetch(`${API_BASE_URL}/benevoles/missions/${missionId}/inscription`, token, {
      method: "DELETE",
    });
    if (!res.ok) {
      const msg = await extractErrorMessage(res, "Erreur lors de l'annulation.");
      throw new Error(msg);
    }
    return res.json();
  },
};

// Coordonnées approximatives des villes pour l'affichage sur la carte
const COORDONNEES_VILLES: Record<string, { lat: number; lng: number }> = {
  "Casablanca": { lat: 33.5928, lng: -7.6134 },
  "Rabat": { lat: 34.0170, lng: -6.8320 },
  "Tanger": { lat: 35.7767, lng: -5.7836 },
  "Marrakech": { lat: 31.6340, lng: -8.0100 },
  "Lille": { lat: 50.6292, lng: 3.0573 },
  "Paris": { lat: 48.8566, lng: 2.3522 },
  "Lyon": { lat: 45.7640, lng: 4.8357 },
  "Marseille": { lat: 43.2965, lng: 5.3698 },
  "Nantes": { lat: 47.2184, lng: -1.5536 },
  "Fès": { lat: 34.0181, lng: -5.0078 },
};

export function mapBackendToMission(b: MissionCardBackend): Mission {
  const coords = COORDONNEES_VILLES[b.ville] || { lat: 33.5928, lng: -7.6134 };

  const totalPlaces = b.nbPlaces ?? b.nbBenevoles ?? 10;
  const restantes = b.placesRestantes ?? totalPlaces;

  return {
    id: String(b.id),
    titre: b.titre,
    association: b.associationNom || "Association Partenaire",
    associationId: b.associationId ? String(b.associationId) : "asso-1",
    description: b.description,
    domaine: b.domaine,
    ville: b.ville,
    date: b.dateDebut || "2026-10-20",
    dateFin: b.dateFin || "2026-10-25",
    adresse: b.adresse || `${b.ville}, Maroc`,
    placesDemandees: totalPlaces,
    placesRestantes: restantes,
    listeAttente: b.listeAttenteCount ?? 0,
    lat: coords.lat,
    lng: coords.lng,
  };
}

export const missionApi = {
  async getFeaturedMissions(): Promise<Mission[]> {
    const res = await fetch(`${API_BASE_URL}/missions/featured`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des missions à la une.");
    const data: MissionCardBackend[] = await res.json();
    return data.map(mapBackendToMission);
  },

  async searchMissions(params: { q?: string; ville?: string; domaine?: string }): Promise<Mission[]> {
    const url = new URL(`${API_BASE_URL}/missions/search`);
    if (params.q) url.searchParams.set("q", params.q);
    if (params.ville) url.searchParams.set("ville", params.ville);
    if (params.domaine) url.searchParams.set("domaine", params.domaine);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Erreur lors de la recherche des missions.");
    const data: MissionCardBackend[] = await res.json();
    return data.map(mapBackendToMission);
  },

  async getMissionById(id: string | number): Promise<Mission> {
    const res = await fetch(`${API_BASE_URL}/missions/${id}`);
    if (!res.ok) throw new Error("Mission introuvable.");
    const data: MissionDetailBackend = await res.json();
    return mapBackendToMission(data);
  },

  async getMissionDetail(id: string | number): Promise<MissionDetailBackend> {
    const res = await fetch(`${API_BASE_URL}/missions/${id}`);
    if (!res.ok) throw new Error("Mission introuvable.");
    return res.json();
  },

  async getCities(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/missions/cities`);
    if (!res.ok) return [];
    return res.json();
  },

  async getDomaines(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/missions/domaines`);
    if (!res.ok) return [];
    return res.json();
  },
};

export default missionApi;
