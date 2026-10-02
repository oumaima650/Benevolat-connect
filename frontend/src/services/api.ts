/**
 * Service API pour la communication avec le Backend Spring Boot (http://localhost:8080/api)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Fonction générique pour effectuer des requêtes HTTP vers l'API Spring Boot
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// --------------------------------------------------------------------------
// Endpoints API
// --------------------------------------------------------------------------

export const apiService = {
  /**
   * Vérifie la santé du backend (GET /api/health)
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    return fetchApi<{ status: string; message: string }>('/health');
  },

  /**
   * Exemple : Inscription / Création d'un bénévole
   */
  async registerBenevole(data: { nom: string; email: string; ville: string }) {
    return fetchApi('/benevoles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default apiService;
