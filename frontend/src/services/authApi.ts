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
  dateNaissance?: string;
  adresse?: string;
  ville?: string;
  biographie?: string;
  photoUrl?: string;
  rayonDeplacementKm?: number;
  competences?: string[];
  centresInteret?: string[];

  // Champs Association
  nomAssociation?: string;
  description?: string;
  domaine?: string;
  telephone?: string;
  logoUrl?: string;
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

export function errorMessage(e: unknown): string {
  return (e as ApiError)?.message ?? "Une erreur est survenue.";
}
