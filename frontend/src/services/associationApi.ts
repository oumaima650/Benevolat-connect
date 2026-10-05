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
      return await api.get<AssociationBackend[]>("/associations");
    } catch {
      return [];
    }
  },
};

export default associationApi;
