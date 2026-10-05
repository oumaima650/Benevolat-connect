// Données factices (aucun appel API). Prévues pour être remplacées par le backend :
import edition1 from "@/assets/edition-1.jpg";
import edition2 from "@/assets/edition-2.jpg";
import edition3 from "@/assets/edition-3.jpg";
import edition4 from "@/assets/edition-4.jpg";
// remplacer `rechercherMissions` et `verifierCertificat` par des appels réseau.

export type Mission = {
  id: string;
  titre: string;
  ville: string;
  domaine: string;
  placesRestantes: number;
  listeAttente: number;
  association: string;
  associationId: string;
  date: string; // ISO — date de début
  dateFin: string; // ISO
  description: string;
  adresse: string;
  placesDemandees: number;
  lat: number;
  lng: number;
};

export type Association = {
  id: string;
  nom: string;
  domaine: string;
  description: string;
  ville: string;
  email: string;
  telephone: string;
  initiales: string;
  galerie: { src: string; legende: string }[];
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
    associationId: "banque-alimentaire",
    date: "2026-10-18",
    dateFin: "2026-10-20",
    adresse: "Bd Mohammed V, Derb Omar, Casablanca",
    placesDemandees: 10,
    lat: 33.5928,
    lng: -7.6134,
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
    associationId: "al-amal",
    date: "2026-10-21",
    dateFin: "2026-12-16",
    adresse: "Collège Al Amal, Av. Hassan II, Rabat",
    placesDemandees: 8,
    lat: 34.017,
    lng: -6.832,
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
    associationId: "tanger-ecologie",
    date: "2026-10-25",
    dateFin: "2026-10-25",
    adresse: "Plage des Sablettes, Malabata, Tanger",
    placesDemandees: 20,
    lat: 35.7767,
    lng: -5.7836,
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
    associationId: "lien-generations",
    date: "2026-11-02",
    dateFin: "2026-11-30",
    adresse: "Résidence Al Wafae, Guéliz, Marrakech",
    placesDemandees: 6,
    lat: 31.634,
    lng: -8.01,
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
    associationId: "connectage",
    date: "2026-11-08",
    dateFin: "2026-11-29",
    adresse: "Maison des jeunes, Maârif, Casablanca",
    placesDemandees: 5,
    lat: 33.5806,
    lng: -7.637,
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
    associationId: "maroc-vert",
    date: "2026-11-15",
    dateFin: "2026-11-15",
    adresse: "Forêt de Maâmora, Salé – Rabat",
    placesDemandees: 30,
    lat: 34.05,
    lng: -6.65,
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
    associationId: "chaleur-humaine",
    date: "2026-11-22",
    dateFin: "2026-11-23",
    adresse: "Entrepôt Chaleur Humaine, Route d'Imouzzer, Fès",
    placesDemandees: 12,
    lat: 34.0181,
    lng: -5.0078,
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
    associationId: "sourire-enfant",
    date: "2026-11-29",
    dateFin: "2026-12-20",
    adresse: "CHU Mohammed VI, Marrakech",
    placesDemandees: 8,
    lat: 31.645,
    lng: -8.02,
    description: "Jeux, lecture et ateliers créatifs avec les enfants hospitalisés.",
  },
];

const g = {
  repas: { src: edition1, legende: "Distribution solidaire — édition 2025" },
  plage: { src: edition2, legende: "Grand nettoyage — édition 2025" },
  ecole: { src: edition3, legende: "Soutien scolaire — édition 2025" },
  arbres: { src: edition4, legende: "Reboisement — édition 2025" },
};

export const associations: Association[] = [
  { id: "banque-alimentaire", nom: "Banque Alimentaire Maroc", domaine: "Solidarité", ville: "Casablanca", initiales: "BA", email: "contact@banquealimentaire.ma", telephone: "+212 5 22 00 11 22", description: "Collecte et redistribue des denrées alimentaires aux familles en situation de précarité depuis 2009.", galerie: [g.repas, g.ecole, g.arbres] },
  { id: "al-amal", nom: "Association Al Amal", domaine: "Éducation", ville: "Rabat", initiales: "AA", email: "bonjour@alamal.ma", telephone: "+212 5 37 10 20 30", description: "Lutte contre le décrochage scolaire grâce à l'accompagnement personnalisé des collégiens.", galerie: [g.ecole, g.repas, g.plage] },
  { id: "tanger-ecologie", nom: "Tanger Écologie", domaine: "Environnement", ville: "Tanger", initiales: "TE", email: "hello@tangerecologie.ma", telephone: "+212 5 39 40 50 60", description: "Protège le littoral du détroit par des actions de nettoyage et de sensibilisation.", galerie: [g.plage, g.arbres, g.repas] },
  { id: "lien-generations", nom: "Lien Générations", domaine: "Santé & lien social", ville: "Marrakech", initiales: "LG", email: "contact@liengenerations.ma", telephone: "+212 5 24 11 22 33", description: "Rompt l'isolement des personnes âgées en créant des moments de partage intergénérationnels.", galerie: [g.repas, g.ecole, g.plage] },
  { id: "connectage", nom: "Connect'Âge", domaine: "Éducation", ville: "Casablanca", initiales: "CÂ", email: "equipe@connectage.ma", telephone: "+212 5 22 33 44 55", description: "Réduit la fracture numérique en formant les seniors aux outils du quotidien.", galerie: [g.ecole, g.repas, g.arbres] },
  { id: "maroc-vert", nom: "Maroc Vert", domaine: "Environnement", ville: "Rabat", initiales: "MV", email: "info@marocvert.ma", telephone: "+212 5 37 66 77 88", description: "Reboise les forêts marocaines et a planté plus de 40 000 arbres avec ses bénévoles.", galerie: [g.arbres, g.plage, g.repas] },
  { id: "chaleur-humaine", nom: "Chaleur Humaine", domaine: "Solidarité", ville: "Fès", initiales: "CH", email: "contact@chaleurhumaine.ma", telephone: "+212 5 35 12 34 56", description: "Achemine vêtements et couvertures vers les villages isolés de l'Atlas chaque hiver.", galerie: [g.repas, g.arbres, g.ecole] },
  { id: "sourire-enfant", nom: "Sourire d'Enfant", domaine: "Santé & lien social", ville: "Marrakech", initiales: "SE", email: "bonjour@sourireenfant.ma", telephone: "+212 5 24 98 76 54", description: "Apporte jeux et animations aux enfants hospitalisés pour égayer leur quotidien.", galerie: [g.ecole, g.repas, g.plage] },
];

export function trouverAssociation(id: string) {
  return associations.find((a) => a.id === id);
}

export function trouverMission(id: string) {
  return missions.find((m) => m.id === id);
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const villes = Array.from(new Set(missions.map((m) => m.ville))).sort();
export const domaines = Array.from(new Set(missions.map((m) => m.domaine))).sort();

export type FiltresMission = { motCle: string; ville: string; domaine: string };

export function rechercherMissions({ motCle, ville, domaine }: FiltresMission): Mission[] {
  const q = motCle.trim().toLowerCase();
  return missions.filter(
    (m) =>
      (!ville || m.ville === ville) &&
      (!domaine || m.domaine === domaine) &&
      (!q || `${m.titre} ${m.association} ${m.description} ${m.adresse}`.toLowerCase().includes(q)),
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
