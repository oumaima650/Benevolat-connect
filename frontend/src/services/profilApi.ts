import { apiRequest } from "./http";
import type { BadgeGamification } from "./benevoleApi";

/** Profil public d'un bénévole (utilisateur connecté requis). */
export type MissionParticipee = {
  id: number;
  titre: string;
  association: string;
  imageUrl?: string | null;
  description?: string | null;
  dateDebut?: string | null;
};

export type ProfilPublic = {
  id: number;
  prenom: string | null;
  nomInitiale: string | null;
  ville: string | null;
  photoUrl: string | null;
  biographie: string | null;
  competences: string[];
  membreDepuis: string | null;
  niveau: number;
  nomNiveau: string;
  theme: string;
  badges: BadgeGamification[];
  missionsParticipees?: MissionParticipee[];
};

export const getProfilPublic = (benevoleId: number | string) =>
  apiRequest<ProfilPublic>(`/api/profils/benevoles/${benevoleId}`);
