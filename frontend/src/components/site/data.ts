// Données factices (aucun appel API). Prévues pour être remplacées par le backend :
// remplacer `rechercherMissions` et `verifierCertificat` par des appels réseau.

export type Mission = {
  id: string;
  titre: string;
  ville: string;
  domaine: string;
  placesRestantes: number;
  listeAttente: number;
  association: string;
  date: string; // ISO
  description: string;
};

export const missions: Mission[] = [
  {
    id: "m1",
    titre: "Distribution de repas solidaires",
    ville: "Casablanca",
    domaine: "Solidarité",
    placesRestantes: 4,
    listeAttente: 0,
    association: "Banque Alimentaire Maroc",
    date: "2026-10-18",
    description: "Préparation et distribution de repas chauds aux familles du quartier, de 17h à 21h.",
  },
  {
    id: "m2",
    titre: "Soutien scolaire au collège Al Amal",
    ville: "Rabat",
    domaine: "Éducation",
    placesRestantes: 0,
    listeAttente: 12,
    association: "Association Al Amal",
    date: "2026-10-21",
    description: "Aide aux devoirs en mathématiques et en français pour des élèves de 3e, deux heures par semaine.",
  },
  {
    id: "m3",
    titre: "Nettoyage de la plage des Sablettes",
    ville: "Tanger",
    domaine: "Environnement",
    placesRestantes: 9,
    listeAttente: 0,
    association: "Tanger Écologie",
    date: "2026-10-25",
    description: "Collecte et tri des déchets sur la plage. Gants et sacs fournis.",
  },
  {
    id: "m4",
    titre: "Accompagnement des personnes âgées",
    ville: "Marrakech",
    domaine: "Santé & lien social",
    placesRestantes: 2,
    listeAttente: 5,
    association: "Lien Générations",
    date: "2026-11-02",
    description: "Visites de convivialité et petites sorties avec des résidents d'une maison de retraite.",
  },
  {
    id: "m5",
    titre: "Atelier numérique pour seniors",
    ville: "Casablanca",
    domaine: "Éducation",
    placesRestantes: 3,
    listeAttente: 0,
    association: "Connect'Âge",
    date: "2026-11-08",
    description: "Initier des seniors à l'usage du smartphone et des démarches en ligne.",
  },
  {
    id: "m6",
    titre: "Plantation d'arbres en forêt de Maâmora",
    ville: "Rabat",
    domaine: "Environnement",
    placesRestantes: 15,
    listeAttente: 0,
    association: "Maroc Vert",
    date: "2026-11-15",
    description: "Journée de reboisement en équipe, transport organisé depuis Rabat.",
  },
  {
    id: "m7",
    titre: "Collecte de vêtements d'hiver",
    ville: "Fès",
    domaine: "Solidarité",
    placesRestantes: 0,
    listeAttente: 3,
    association: "Chaleur Humaine",
    date: "2026-11-22",
    description: "Tri et conditionnement des dons de vêtements pour les villages de l'Atlas.",
  },
  {
    id: "m8",
    titre: "Animation à l'hôpital pour enfants",
    ville: "Marrakech",
    domaine: "Santé & lien social",
    placesRestantes: 6,
    listeAttente: 0,
    association: "Sourire d'Enfant",
    date: "2026-11-29",
    description: "Jeux, lecture et ateliers créatifs avec les enfants hospitalisés.",
  },
];

export const villes = Array.from(new Set(missions.map((m) => m.ville))).sort();
export const domaines = Array.from(new Set(missions.map((m) => m.domaine))).sort();

export type FiltresMission = { motCle: string; ville: string; domaine: string };

export function rechercherMissions({ motCle, ville, domaine }: FiltresMission): Mission[] {
  const q = motCle.trim().toLowerCase();
  return missions.filter(
    (m) =>
      (!ville || m.ville === ville) &&
      (!domaine || m.domaine === domaine) &&
      (!q || `${m.titre} ${m.association} ${m.description}`.toLowerCase().includes(q)),
  );
}

export function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export type Certificat = {
  code: string;
  benevole: string;
  mission: string;
  association: string;
  date: string;
  heures: number;
};

const certificats: Certificat[] = [
  { code: "CMI-2026-A7K9", benevole: "Yasmine El Idrissi", mission: "Distribution de repas solidaires", association: "Banque Alimentaire Maroc", date: "2026-09-12", heures: 12 },
  { code: "CMI-2026-B3X1", benevole: "Karim Benali", mission: "Nettoyage de la plage des Sablettes", association: "Tanger Écologie", date: "2026-08-30", heures: 6 },
];

export function verifierCertificat(code: string): Certificat | null {
  const c = code.trim().toUpperCase();
  return certificats.find((x) => x.code === c) ?? null;
}

export const statistiques = [
  { valeur: "1 248", libelle: "missions publiées" },
  { valeur: "8 630", libelle: "bénévoles inscrits" },
  { valeur: "312", libelle: "associations partenaires" },
];

export const etapes = [
  {
    numero: "01",
    titre: "Trouve la mission qui te ressemble",
    texte:
      "Filtre par ville, domaine et disponibilité. La plateforme te recommande les missions les plus proches de ton profil.",
  },
  {
    numero: "02",
    titre: "Inscris-toi en un clic",
    texte:
      "Premier arrivé, premier servi. Si la mission est complète, tu rejoins automatiquement la liste d'attente et tu es prévenu dès qu'une place se libère.",
  },
  {
    numero: "03",
    titre: "Reçois ton certificat",
    texte:
      "À la fin de la mission, l'association valide ta participation et t'envoie un certificat de bénévolat téléchargeable.",
  },
];
