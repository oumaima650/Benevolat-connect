const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export interface StatistiquesData {
  totalMissions: number;
  totalBenevoles: number;
  totalAssociations: number;
  totalHeuresValidees: number;
}

export const statsApi = {
  async getStatistiques(): Promise<StatistiquesData> {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) {
      throw new Error("Impossible de charger les statistiques.");
    }
    return res.json();
  },
};

export default statsApi;
