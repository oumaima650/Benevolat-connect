import { apiRequest } from "./http";

/** Émis par les pages admin après une action, pour rafraîchir les compteurs de la barre latérale. */
export const ADMIN_CHANGED = "countmein:admin-changed";
export function signalerChangementAdmin() {
  window.dispatchEvent(new Event(ADMIN_CHANGED));
}

export type Serie = { label: string; valeur: number };

export type AdminStats = {
  benevoles: number;
  associations: number;
  associationsEnAttente: number;
  comptesSuspendus: number;
  missions: number;
  missionsActives: number;
  missionsSignalees: number;
  inscriptions: number;
  inscriptionsConfirmees: number;
  inscriptionsEnAttente: number;
  certificats: number;
  missionsParStatut: Record<string, number>;
  missionsParVille: Serie[];
  missionsParDomaine: Serie[];
  benevolesParVille: Serie[];
  inscriptionsParMois: Serie[];
  nouveauxUtilisateursParMois: Serie[];
};

export type StatutValidation = "EN_ATTENTE" | "VALIDE" | "REFUSE";

export type AssociationAdmin = {
  id: number;
  nom: string;
  email: string;
  ville: string | null;
  contact: string | null;
  description: string | null;
  logoUrl: string | null;
  domaines: string[];
  statutValidation: StatutValidation;
  motifRefus: string | null;
  statutCompte: string;
  nbMissions: number;
  createdAt: string;
};

export type UtilisateurAdmin = {
  id: number;
  email: string;
  role: "BENEVOLE" | "ASSOCIATION" | "ADMIN";
  nom: string | null;
  ville: string | null;
  photoUrl: string | null;
  statut: "ACTIF" | "SUSPENDUE" | "DESACTIVE";
  statutValidation: StatutValidation | null;
  createdAt: string;
};

export type MissionAdmin = {
  id: number;
  titre: string;
  description: string | null;
  associationNom: string | null;
  associationId: number | null;
  ville: string | null;
  domaine: string | null;
  statut: string;
  estSignalee: boolean;
  motifSignalement: string | null;
  estMasquee: boolean;
  dateDebut: string;
  dateFin: string;
  nbInscrits: number;
  createdAt: string;
};

const patch = <T,>(path: string, body?: unknown) =>
  apiRequest<T>(path, body ? { method: "PATCH", body: JSON.stringify(body) } : { method: "PATCH" });

export const adminApi = {
  stats: () => apiRequest<AdminStats>("/api/admin/stats"),

  associations: (statut?: StatutValidation) =>
    apiRequest<AssociationAdmin[]>(`/api/admin/associations${statut ? `?statut=${statut}` : ""}`),
  validerAssociation: (id: number) => patch<AssociationAdmin>(`/api/admin/associations/${id}/valider`),
  refuserAssociation: (id: number, motif: string) =>
    patch<AssociationAdmin>(`/api/admin/associations/${id}/refuser`, { motif }),

  utilisateurs: (role?: string, q?: string) => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (q) params.set("q", q);
    const qs = params.toString();
    return apiRequest<UtilisateurAdmin[]>(`/api/admin/utilisateurs${qs ? `?${qs}` : ""}`);
  },
  suspendre: (id: number, motif?: string) =>
    patch<UtilisateurAdmin>(`/api/admin/utilisateurs/${id}/suspendre`, { motif: motif ?? "" }),
  reactiver: (id: number) => patch<UtilisateurAdmin>(`/api/admin/utilisateurs/${id}/reactiver`),

  missions: (filtre?: "signalees" | "masquees") =>
    apiRequest<MissionAdmin[]>(`/api/admin/missions${filtre ? `?filtre=${filtre}` : ""}`),
  masquerMission: (id: number, motif?: string) =>
    patch<MissionAdmin>(`/api/admin/missions/${id}/masquer`, { motif: motif ?? "" }),
  retablirMission: (id: number) => patch<MissionAdmin>(`/api/admin/missions/${id}/retablir`),

  /** Signalement d'une mission par un utilisateur connecté (page mission publique). */
  signalerMission: (id: number | string, motif: string) =>
    apiRequest<{ message: string }>(`/api/missions/${id}/signaler`, {
      method: "POST",
      body: JSON.stringify({ motif }),
    }),
};
