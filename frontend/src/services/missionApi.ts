import type { Mission } from "@/components/site/data";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export interface MissionCardBackend {
  id: number;
  titre: string;
  description: string;
  domaine: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  nbBenevoles: number;
  placesRestantes: number;
  listeAttenteCount: number;
  statut: "DISPONIBLE" | "COMPLET" | "BROUILLON" | "ANNULEE";
  badge?: string;
  imageUrl?: string;
  associationId?: number;
  associationNom?: string;
}

export interface MissionDetailBackend extends MissionCardBackend {
  associationDescription?: string;
  associationRnaSiret?: string;
}

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
    adresse: `${b.ville}, France/Maroc`,
    placesDemandees: b.nbBenevoles || 10,
    placesRestantes: b.placesRestantes,
    listeAttente: b.listeAttenteCount,
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
