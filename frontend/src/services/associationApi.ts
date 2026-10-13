const API_BASE =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8080";

function getToken(): string | null {
  return localStorage.getItem("countmein_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers ?? {}) },
      credentials: "include",
    });
  } catch {
    throw new Error("Impossible de joindre le serveur backend.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).message ?? `Erreur ${res.status}`);
  }
  return res.json();
}

/* ── Types ── */

export type AssociationProfile = {
  id: number;
  email: string;
  nomAssociation: string;
  description: string;
  ville: string;
  adresse?: string;
  contact: string;
  logoUrl?: string;
  statutValidation: "EN_ATTENTE" | "VALIDE" | "REFUSE";
  statutCompte?: "ACTIF" | "DESACTIVE" | "SUSPENDUE";
  latitude?: number;
  longitude?: number;
  domaineIds: number[];
  domaineNoms: string[];
};

export type MissionDashboard = {
  id: number;
  titre: string;
  description?: string;
  adresse?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
  dateDebut: string;
  dateFin: string;
  nbPlaces: number;
  nbInscritsConfirmes: number;
  nbListeAttente: number;
  nbPlacesRestantes: number;
  statut: string;
  domaineId?: number;
  domaineNom?: string;
  competenceIds: number[];
  competenceNoms: string[];
  associationId?: number;
  associationNom?: string;
  associationLogoUrl?: string;
};

export type MissionFormData = {
  titre: string;
  description?: string | null;
  domaineId: number;
  adresse?: string | null;
  ville?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  dateDebut: string;
  dateFin?: string | null;
  nbPlaces: number;
  competenceIds?: number[] | null;
  statut?: string | null;
};

/* ── API calls ── */

export const getMyProfile = () =>
  request<AssociationProfile>("/api/associations/me");

export const updateMyProfile = (data: Partial<AssociationProfile> & { domaineIds?: number[] }) =>
  request<AssociationProfile>("/api/associations/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ success: boolean; message: string }>("/api/associations/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const toggleAccountStatut = () =>
  request<{ success: boolean; statut: string; message: string }>("/api/associations/me/statut", {
    method: "PATCH",
  });

export const getMyMissions = () =>
  request<MissionDashboard[]>("/api/associations/me/missions");

export const createMission = (data: MissionFormData) =>
  request<MissionDashboard>("/api/associations/me/missions", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateMission = (id: number, data: MissionFormData) =>
  request<MissionDashboard>(`/api/associations/me/missions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const changeMissionStatut = (id: number, statut: string) =>
  request<MissionDashboard>(`/api/associations/me/missions/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });

/* ── Compatibilité avec l'ancien associationApi ── */

export type AssociationBackend = {
  id: number;
  nom: string;
  description?: string;
  domaine?: string;
  ville?: string;
  email?: string;
  contact?: string;
  photoProfil?: string;
  latitude?: number;
  longitude?: number;
};

async function getFeaturedAssociations(): Promise<AssociationBackend[]> {
  try {
    const res = await fetch(`${API_BASE}/api/associations`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const associationApi = { getFeaturedAssociations };
export default associationApi;
