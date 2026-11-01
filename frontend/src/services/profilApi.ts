import { apiRequest } from "./http";
import type { BadgeGamification } from "./benevoleApi";

/** Profil public d'un bénévole (utilisateur connecté requis). */
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
  /** Badges décrochés, dans l'ordre d'affichage. */
  badges: BadgeGamification[];
};

export const getProfilPublic = (benevoleId: number | string) =>
  apiRequest<ProfilPublic>(`/api/profils/benevoles/${benevoleId}`);
