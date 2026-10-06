// Appels vers l'API d'authentification (backend Spring Boot).
const API_BASE =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8080";

export type ApiError = { message: string; status: number };

export type Role = "BENEVOLE" | "ASSOCIATION" | "ADMIN";

export type RegisterPayload = {
  email: string;
  password: string;
  role: Role;
  recaptchaToken?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Champs Bénévole
  nom?: string;
  prenom?: string;
  telephone?: string;
  dateNaissance?: string;
  adresse?: string;
  ville?: string;
  biographie?: string;
  photoUrl?: string;
  rayonDeplacementKm?: number;
  competences?: string[];

  // Champs Association
  nomAssociation?: string;
  description?: string;
  contact?: string;
  logoUrl?: string;

  // Domaines partagés (IDs) — Bénévole ET Association
  domaineIds?: number[];
};

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw { message: "Impossible de joindre le serveur backend.", status: 0 } satisfies ApiError;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      message: (data as { message?: string }).message ?? "Une erreur est survenue.",
      status: res.status,
    } satisfies ApiError;
  }
  return data as T;
}

export const register = (payload: RegisterPayload) =>
  post<{ success: boolean; message: string; token?: string }>("/api/auth/register", payload);

export const login = (email: string, password: string) =>
  post<{ success: boolean; message: string; token?: string; user?: any }>("/api/auth/login", { email, password });

export const forgotPassword = (email: string) =>
  post<{ success: boolean; message: string }>("/api/auth/forgot-password", { email });

export const resetPassword = (token: string, newPassword: string) =>
  post<{ success: boolean; message: string }>("/api/auth/reset-password", { token, newPassword });

export type CompetenceItem = { id: number; nom: string; categorie?: string; description?: string };
export type DomaineItem = { id: number; nom: string; categorie?: string; description?: string };

const DEFAULT_COMPETENCES: CompetenceItem[] = [
  { id: 1, nom: "Informatique & Web" },
  { id: 2, nom: "Soutien scolaire" },
  { id: 3, nom: "Premiers secours (PSC1)" },
  { id: 4, nom: "Logistique & Transport" },
  { id: 5, nom: "Animation & Événementiel" },
  { id: 6, nom: "Communication & Graphisme" },
  { id: 7, nom: "Comptabilité & Gestion" },
  { id: 8, nom: "Cuisine & Restauration" },
  { id: 9, nom: "Bricolage & Jardinage" },
  { id: 10, nom: "Écoute & Soutien moral" },
  { id: 11, nom: "Traduction & Langues" },
];

const DEFAULT_DOMAINES: DomaineItem[] = [
  { id: 1, nom: "Écologie & Environnement" },
  { id: 2, nom: "Protection Animale" },
  { id: 3, nom: "Lutte contre la Pauvreté" },
  { id: 4, nom: "Enfance & Jeunesse" },
  { id: 5, nom: "Aide aux Personnes Âgées" },
  { id: 6, nom: "Santé & Handicap" },
  { id: 7, nom: "Culture & Art" },
  { id: 8, nom: "Sport & Handisport" },
  { id: 9, nom: "Droits Humains & Égalité" },
  { id: 10, nom: "Éducation pour tous" },
  { id: 11, nom: "Urgence & Catastrophes" },
  { id: 12, nom: "Insertion Professionnelle" },
];

export async function fetchCompetences(): Promise<CompetenceItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/competences`);
    if (!res.ok) return DEFAULT_COMPETENCES;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_COMPETENCES;
  } catch {
    return DEFAULT_COMPETENCES;
  }
}

export async function fetchDomaines(): Promise<DomaineItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/domaines`);
    if (!res.ok) return DEFAULT_DOMAINES;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_DOMAINES;
  } catch {
    return DEFAULT_DOMAINES;
  }
}

export function errorMessage(e: unknown): string {
  return (e as ApiError)?.message ?? "Une erreur est survenue.";
}
