const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:8080';

export interface BenevoleProfileApi {
  id?: number;
  email?: string;
  prenom: string;
  nom: string;
  telephone?: string;
  ville: string;
  biographie: string;
  rayonDeplacementKm: number;
  competences: string[];
  photoUrl?: string;
}

async function authFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

export const benevoleApi = {
  async getProfile(token: string): Promise<BenevoleProfileApi> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me`, token);
    if (!res.ok) throw new Error('Erreur lors du chargement du profil.');
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
    if (!res.ok) throw new Error('Erreur lors de la mise à jour du profil.');
    return res.json();
  },
};
