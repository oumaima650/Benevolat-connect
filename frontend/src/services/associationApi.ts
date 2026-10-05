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
}

export const associationApi = {
  getFeaturedAssociations: async (): Promise<AssociationBackend[]> => {
    try {
      const response = await api.get<AssociationBackend[]>("/associations");
      return response.data;
    } catch {
      return [];
    }
  },
};

export default associationApi;
