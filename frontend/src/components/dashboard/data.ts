// ── Types ──────────────────────────────────────────────────────────────────

export type MissionStatut =
  | 'PUBLIEE'
  | 'COMPLETE'
  | 'EN_COURS'
  | 'RENFORT_URGENT'
  | 'TERMINEE'
  | 'CLOTUREE'
  | 'ANNULEE'
  | 'BROUILLON';

export interface MissionDash {
  id: string;
  titre: string;
  association: string;
  domaine: string;
  ville: string;
  adresse: string;
  lat: number;
  lng: number;
  dateDebut: string;
  dateFin: string;
  placesTotal: number;
  placesConfirmees: number;
  listeAttente: number;
  statut: MissionStatut;
  competences: string[];
  description?: string;
}

export interface InscriptionBenevole {
  id: string;
  missionId: string;
  missionTitre: string;
  association: string;
  domaine: string;
  dateDebut: string;
  dateFin: string;
  ville: string;
  statut: 'CONFIRMEE' | 'EN_LISTE_ATTENTE' | 'ANNULEE';
  rang?: number;
  dateInscription: string;
}

export interface CertificatDash {
  id: string;
  missionTitre: string;
  association: string;
  dateDelivrance: string;
  codeVerification: string;
}

export interface BadgeDash {
  id: string;
  nom: string;
  description: string;
  icone: string;
  debloque: boolean;
  dateObtention?: string;
}

export interface NotificationDash {
  id: string;
  type: 'CONFIRMATION' | 'PROMOTION' | 'ANNULATION' | 'RAPPEL' | 'RENFORT_URGENT';
  titre: string;
  message: string;
  lu: boolean;
  date: string;
}

export interface BenevoleProfile {
  id: string;
  prenom: string;
  nom: string;
  ville: string;
  bio: string;
  photo?: string;
  competences: string[];
  interets: string[];
  rayonKm: number;
  niveauMissions: number;
}

export interface AssociationProfile {
  id: string;
  nom: string;
  description: string;
  domaine: string;
  ville: string;
  contact: string;
  logo?: string;
  statut: 'EN_ATTENTE' | 'VALIDEE';
}

export interface InscritMission {
  id: string;
  prenom: string;
  nom: string;
  ville: string;
  competences: string[];
  niveau: string;
  badges: string[];
  dateInscription: string;
  statut: 'CONFIRMEE' | 'EN_LISTE_ATTENTE';
  rang?: number;
}

export interface RecoMission extends MissionDash {
  score: number;
  scoreProximite: number;
  scoreAffinite: number;
  scoreBesoin: number;
  explication: string;
  rescueScore?: boolean;
}

// ── Données fictives ───────────────────────────────────────────────────────

export const benevoleProfile: BenevoleProfile = {
  id: 'b1',
  prenom: 'Yasmine',
  nom: 'El Idrissi',
  ville: 'Tétouan',
  bio: "Passionnée de solidarité et d'environnement. Je cherche à m'impliquer dans ma région.",
  competences: ['Cuisine', 'Animation', 'Logistique'],
  interets: ['Solidarité', 'Environnement'],
  rayonKm: 30,
  niveauMissions: 7,
};

export const missions: MissionDash[] = [
  {
    id: 'd1',
    titre: 'Distribution de repas solidaires',
    association: 'Banque Alimentaire Tanger',
    domaine: 'Solidarité',
    ville: 'Tanger',
    adresse: 'Bd Mohammed V, Tanger',
    lat: 35.7595,
    lng: -5.834,
    dateDebut: '2026-09-15',
    dateFin: '2026-09-15',
    placesTotal: 15,
    placesConfirmees: 12,
    listeAttente: 3,
    statut: 'EN_COURS',
    competences: ['Logistique', 'Cuisine'],
    description: 'Aidez-nous à distribuer des repas chauds aux familles dans le besoin chaque weekend.',
  },
  {
    id: 'd2',
    titre: "Plantation d'arbres en forêt de Bouhachem",
    association: 'Vert Maroc',
    domaine: 'Environnement',
    ville: 'Tétouan',
    adresse: 'Forêt Bouhachem, route de Chefchaouen',
    lat: 35.5704,
    lng: -5.3786,
    dateDebut: '2026-10-03',
    dateFin: '2026-10-03',
    placesTotal: 30,
    placesConfirmees: 14,
    listeAttente: 0,
    statut: 'PUBLIEE',
    competences: ['Jardinage', 'Environnement'],
    description: 'Rejoignez-nous pour planter 500 arbres dans la forêt de Bouhachem.',
  },
  {
    id: 'd3',
    titre: 'Soutien scolaire pour lycéens',
    association: 'Association Avenir Rabat',
    domaine: 'Éducation',
    ville: 'Rabat',
    adresse: 'Lycée Ibn Rochd, Agdal, Rabat',
    lat: 33.9716,
    lng: -6.8498,
    dateDebut: '2026-09-20',
    dateFin: '2026-12-20',
    placesTotal: 10,
    placesConfirmees: 10,
    listeAttente: 5,
    statut: 'COMPLETE',
    competences: ['Enseignement', 'Mathématiques', 'Français'],
    description: 'Accompagnez des lycéens en difficulté scolaire pour les préparer au baccalauréat.',
  },
  {
    id: 'd4',
    titre: "Collecte de vêtements d'hiver",
    association: 'Solidarité Nord',
    domaine: 'Solidarité',
    ville: 'Tétouan',
    adresse: 'Centre communautaire Martil, Tétouan',
    lat: 35.6138,
    lng: -5.3646,
    dateDebut: '2026-11-01',
    dateFin: '2026-11-30',
    placesTotal: 8,
    placesConfirmees: 3,
    listeAttente: 12,
    statut: 'RENFORT_URGENT',
    competences: ['Logistique', 'Tri'],
    description: "Collecte urgente de vêtements chauds avant l'hiver pour les familles vulnérables.",
  },
  {
    id: 'd5',
    titre: 'Marathon caritatif de Casablanca',
    association: 'Sport & Solidarité Casa',
    domaine: 'Sport',
    ville: 'Casablanca',
    adresse: 'Corniche de Casablanca, Ain Diab',
    lat: 33.5882,
    lng: -7.6644,
    dateDebut: '2026-05-10',
    dateFin: '2026-05-10',
    placesTotal: 50,
    placesConfirmees: 50,
    listeAttente: 0,
    statut: 'TERMINEE',
    competences: ['Organisation', 'Sécurité'],
    description: 'Organisation du marathon caritatif annuel de Casablanca.',
  },
  {
    id: 'd6',
    titre: 'Journée portes ouvertes culturelle',
    association: 'Médina Patrimoine Fès',
    domaine: 'Culture',
    ville: 'Fès',
    adresse: 'Musée Batha, Fès el-Bali',
    lat: 34.0631,
    lng: -5.0,
    dateDebut: '2026-04-15',
    dateFin: '2026-04-16',
    placesTotal: 20,
    placesConfirmees: 20,
    listeAttente: 0,
    statut: 'CLOTUREE',
    competences: ['Animation', 'Communication'],
    description: 'Accueillez les visiteurs lors des journées portes ouvertes de la médina de Fès.',
  },
  {
    id: 'd7',
    titre: 'Campagne de sensibilisation santé',
    association: 'Santé Pour Tous Tanger',
    domaine: 'Santé',
    ville: 'Tanger',
    adresse: 'Place du Grand Socco, Tanger',
    lat: 35.7769,
    lng: -5.7987,
    dateDebut: '2026-08-05',
    dateFin: '2026-08-05',
    placesTotal: 12,
    placesConfirmees: 8,
    listeAttente: 0,
    statut: 'ANNULEE',
    competences: ['Communication', 'Santé'],
    description: 'Campagne annulée en raison de contraintes logistiques.',
  },
  {
    id: 'd8',
    titre: 'Atelier numérique pour seniors',
    association: 'Association Nour',
    domaine: 'Éducation',
    ville: 'Tétouan',
    adresse: 'Maison des associations, rue Sania, Tétouan',
    lat: 35.5714,
    lng: -5.3749,
    dateDebut: '2026-10-15',
    dateFin: '2026-12-15',
    placesTotal: 6,
    placesConfirmees: 0,
    listeAttente: 0,
    statut: 'BROUILLON',
    competences: ['Informatique', 'Pédagogie'],
    description: 'Initiation aux outils numériques pour les personnes âgées du quartier.',
  },
];

export const inscriptionsBenevole: InscriptionBenevole[] = [
  {
    id: 'i1',
    missionId: 'd1',
    missionTitre: 'Distribution de repas solidaires',
    association: 'Banque Alimentaire Tanger',
    domaine: 'Solidarité',
    dateDebut: '2026-09-15',
    dateFin: '2026-09-15',
    ville: 'Tanger',
    statut: 'CONFIRMEE',
    dateInscription: '2026-08-20',
  },
  {
    id: 'i2',
    missionId: 'd2',
    missionTitre: "Plantation d'arbres en forêt de Bouhachem",
    association: 'Vert Maroc',
    domaine: 'Environnement',
    dateDebut: '2026-10-03',
    dateFin: '2026-10-03',
    ville: 'Tétouan',
    statut: 'CONFIRMEE',
    dateInscription: '2026-09-01',
  },
  {
    id: 'i3',
    missionId: 'd3',
    missionTitre: 'Soutien scolaire pour lycéens',
    association: 'Association Avenir Rabat',
    domaine: 'Éducation',
    dateDebut: '2026-09-20',
    dateFin: '2026-12-20',
    ville: 'Rabat',
    statut: 'EN_LISTE_ATTENTE',
    rang: 2,
    dateInscription: '2026-09-05',
  },
  {
    id: 'i4',
    missionId: 'd4',
    missionTitre: "Collecte de vêtements d'hiver",
    association: 'Solidarité Nord',
    domaine: 'Solidarité',
    dateDebut: '2026-11-01',
    dateFin: '2026-11-30',
    ville: 'Tétouan',
    statut: 'EN_LISTE_ATTENTE',
    rang: 5,
    dateInscription: '2026-09-10',
  },
  {
    id: 'i5',
    missionId: 'd7',
    missionTitre: 'Campagne de sensibilisation santé',
    association: 'Santé Pour Tous Tanger',
    domaine: 'Santé',
    dateDebut: '2026-08-05',
    dateFin: '2026-08-05',
    ville: 'Tanger',
    statut: 'ANNULEE',
    dateInscription: '2026-07-15',
  },
];

export const certificats: CertificatDash[] = [
  {
    id: 'c1',
    missionTitre: 'Marathon caritatif de Casablanca',
    association: 'Sport & Solidarité Casa',
    dateDelivrance: '2026-05-15',
    codeVerification: 'CMI-2026-0045',
  },
  {
    id: 'c2',
    missionTitre: 'Journée portes ouvertes culturelle',
    association: 'Médina Patrimoine Fès',
    dateDelivrance: '2026-04-20',
    codeVerification: 'CMI-2026-0032',
  },
  {
    id: 'c3',
    missionTitre: 'Distribution de repas solidaires',
    association: 'Banque Alimentaire Tanger',
    dateDelivrance: '2025-12-10',
    codeVerification: 'CMI-2025-0118',
  },
];

export const badges: BadgeDash[] = [
  {
    id: 'badge-1',
    nom: 'Première mission',
    description: 'Félicitations pour votre toute première mission accomplie !',
    icone: '🌟',
    debloque: true,
    dateObtention: '2025-03-14',
  },
  {
    id: 'badge-2',
    nom: 'Engagé',
    description: 'Vous avez réalisé 5 missions ou plus.',
    icone: '🤝',
    debloque: true,
    dateObtention: '2025-11-08',
  },
  {
    id: 'badge-3',
    nom: 'Expert',
    description: 'Vous avez réalisé 15 missions ou plus.',
    icone: '🏅',
    debloque: false,
  },
  {
    id: 'badge-4',
    nom: 'Champion',
    description: 'Vous avez réalisé 30 missions ou plus.',
    icone: '🏆',
    debloque: false,
  },
];

export const notifications: NotificationDash[] = [
  {
    id: 'n1',
    type: 'CONFIRMATION',
    titre: 'Inscription confirmée',
    message: "Votre inscription à la mission Plantation d'arbres en forêt de Bouhachem a été confirmée.",
    lu: false,
    date: '2026-09-01T10:30:00',
  },
  {
    id: 'n2',
    type: 'RAPPEL',
    titre: 'Rappel : mission demain',
    message: "N'oubliez pas votre mission Distribution de repas solidaires demain à 9h00 à Tanger.",
    lu: false,
    date: '2026-09-14T18:00:00',
  },
  {
    id: 'n3',
    type: 'RENFORT_URGENT',
    titre: 'Renfort urgent nécessaire',
    message: "La mission Collecte de vêtements d'hiver à Tétouan a besoin de renforts urgents.",
    lu: false,
    date: '2026-09-10T08:15:00',
  },
  {
    id: 'n4',
    type: 'PROMOTION',
    titre: 'Vous avez été promu',
    message: "Une place s'est libérée ! Vous êtes maintenant inscrit(e) à Soutien scolaire pour lycéens.",
    lu: true,
    date: '2026-09-08T14:00:00',
  },
  {
    id: 'n5',
    type: 'ANNULATION',
    titre: 'Mission annulée',
    message: "La mission Campagne de sensibilisation santé a été annulée par l'association.",
    lu: true,
    date: '2026-07-28T11:00:00',
  },
  {
    id: 'n6',
    type: 'CONFIRMATION',
    titre: 'Certificat disponible',
    message: 'Votre certificat pour "Marathon caritatif de Casablanca" est maintenant téléchargeable.',
    lu: true,
    date: '2026-05-15T09:00:00',
  },
  {
    id: 'n7',
    type: 'RAPPEL',
    titre: 'Rappel : mission dans 24h',
    message: "Votre mission Plantation d'arbres commence demain. Pensez à vous préparer.",
    lu: true,
    date: '2026-10-02T09:00:00',
  },
  {
    id: 'n8',
    type: 'RENFORT_URGENT',
    titre: 'Besoin de renforts',
    message: 'Solidarité Nord recherche 5 bénévoles supplémentaires pour la collecte de novembre.',
    lu: false,
    date: '2026-09-12T16:45:00',
  },
];

export const associationProfile: AssociationProfile = {
  id: 'a1',
  nom: 'Association Nour',
  description: 'Aide aux familles vulnérables dans le nord du Maroc.',
  domaine: 'Solidarité',
  ville: 'Tétouan',
  contact: 'contact@nour-asso.ma',
  statut: 'VALIDEE',
};

export const inscritsMission: InscritMission[] = [
  {
    id: 'im1',
    prenom: 'Karim',
    nom: 'Benjelloun',
    ville: 'Tétouan',
    competences: ['Logistique', 'Animation'],
    niveau: 'Engagé',
    badges: ['Première mission', 'Engagé'],
    dateInscription: '2026-08-18',
    statut: 'CONFIRMEE',
  },
  {
    id: 'im2',
    prenom: 'Nadia',
    nom: 'Alami',
    ville: 'Tanger',
    competences: ['Cuisine', 'Communication'],
    niveau: 'Expert',
    badges: ['Première mission', 'Engagé', 'Expert'],
    dateInscription: '2026-08-19',
    statut: 'CONFIRMEE',
  },
  {
    id: 'im3',
    prenom: 'Hamza',
    nom: 'El Fassi',
    ville: 'Tétouan',
    competences: ['Informatique'],
    niveau: 'Débutant',
    badges: ['Première mission'],
    dateInscription: '2026-08-25',
    statut: 'CONFIRMEE',
  },
  {
    id: 'im4',
    prenom: 'Salma',
    nom: 'Raji',
    ville: 'Chefchaouen',
    competences: ['Jardinage', 'Environnement'],
    niveau: 'Engagé',
    badges: ['Première mission', 'Engagé'],
    dateInscription: '2026-09-01',
    statut: 'EN_LISTE_ATTENTE',
    rang: 1,
  },
  {
    id: 'im5',
    prenom: 'Yasmine',
    nom: 'El Idrissi',
    ville: 'Tétouan',
    competences: ['Cuisine', 'Animation', 'Logistique'],
    niveau: 'Engagé',
    badges: ['Première mission', 'Engagé'],
    dateInscription: '2026-09-05',
    statut: 'EN_LISTE_ATTENTE',
    rang: 2,
  },
  {
    id: 'im6',
    prenom: 'Omar',
    nom: 'Zouaoui',
    ville: 'Martil',
    competences: ['Sécurité', 'Logistique'],
    niveau: 'Débutant',
    badges: [],
    dateInscription: '2026-09-07',
    statut: 'EN_LISTE_ATTENTE',
    rang: 3,
  },
];

export const recoMissions: RecoMission[] = [
  {
    ...missions[1]!, // Plantation d'arbres
    score: 88,
    scoreProximite: 45,
    scoreAffinite: 30,
    scoreBesoin: 13,
    explication: "Cette mission correspond à vos centres d'intérêt (Environnement) et se situe près de chez vous à Tétouan.",
  },
  {
    ...missions[3]!, // Collecte vêtements - RENFORT_URGENT
    score: 82,
    scoreProximite: 40,
    scoreAffinite: 28,
    scoreBesoin: 14,
    explication: 'Besoin urgent de bénévoles. Vos compétences en logistique sont directement utiles.',
  },
  {
    ...missions[7]!, // Atelier numérique
    score: 75,
    scoreProximite: 43,
    scoreAffinite: 22,
    scoreBesoin: 10,
    explication: 'Mission de votre ville (Tétouan) dans un domaine proche de vos intérêts.',
    rescueScore: true,
  },
  {
    ...missions[2]!, // Soutien scolaire
    score: 61,
    scoreProximite: 15,
    scoreAffinite: 35,
    scoreBesoin: 11,
    explication: 'Votre profil polyvalent correspond aux besoins de cette association bien notée.',
    rescueScore: true,
  },
  {
    ...missions[0]!, // Distribution repas
    score: 54,
    scoreProximite: 30,
    scoreAffinite: 18,
    scoreBesoin: 6,
    explication: "Mission active proche de votre rayon d'action, compétences en logistique valorisées.",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function niveauLabel(nMissions: number): string {
  if (nMissions < 5) return 'Débutant';
  if (nMissions < 15) return 'Engagé';
  if (nMissions < 30) return 'Expert';
  return 'Champion';
}

export function prochainNiveau(nMissions: number): { label: string; actuel: number; suivant: number } {
  if (nMissions < 5) return { label: 'Engagé', actuel: nMissions, suivant: 5 };
  if (nMissions < 15) return { label: 'Expert', actuel: nMissions - 5, suivant: 10 };
  if (nMissions < 30) return { label: 'Champion', actuel: nMissions - 15, suivant: 15 };
  return { label: 'Champion', actuel: 30, suivant: 30 };
}

export function formaterDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
