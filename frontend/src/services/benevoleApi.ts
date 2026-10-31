const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:8080';

export interface BenevoleProfileApi {
  id?: number;
  email?: string;
  prenom: string;
  nom: string;
  telephone?: string;
  dateNaissance?: string;
  ville: string;
  biographie: string;
  rayonDeplacementKm: number;
  competences: string[];
  domaineIds?: number[];
  photoUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
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

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me/password`, token, {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { message?: string }).message || 'Impossible de modifier le mot de passe.');
    }
  },

  /** Désactivation volontaire : annule les inscriptions à venir, e-mail de confirmation. */
  async desactiver(token: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/api/benevoles/me/desactiver`, token, { method: 'PATCH' });
    if (!res.ok) throw new Error('Impossible de désactiver le compte.');
  },
};
