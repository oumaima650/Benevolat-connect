const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export interface CertificatVerificationResult {
  valide: boolean;
  codeVerification?: string;
  dateEmission?: string;
  nbHeures?: number;
  benevoleNom?: string;
  benevolePrenom?: string;
  missionTitre?: string;
  associationNom?: string;
  message?: string;
}

export const certificatApi = {
  async verifyCertificat(code: string): Promise<CertificatVerificationResult> {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { valide: false, message: "Veuillez entrer un code de certificat." };
    }

    const res = await fetch(`${API_BASE_URL}/certificates/verify/${encodeURIComponent(cleanCode)}`);
    if (!res.ok) {
      return { valide: false, message: "Erreur serveur lors de la vérification." };
    }

    return res.json();
  },
};

export default certificatApi;
