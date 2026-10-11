import api from "./api";

export interface AssociationBackend {
  id: number;
  nom: string;
  description: string;
  domaine: string;
  ville: string;
  email: string;
  contact: string;
  photoProfil: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const associationApi = {
  getFeaturedAssociations: async (): Promise<AssociationBackend[]> => {
    try {
      return await api.get<AssociationBackend[]>("/associations");
    } catch {
      return [];
    }
  },
};

export default associationApi;
