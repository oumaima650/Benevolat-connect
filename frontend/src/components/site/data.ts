// Données factices (aucun appel API).

export type Mission = {
  id: string;
  titre: string;
  ville: string;
  domaine: string;
  placesRestantes: number;
  listeAttente: number;
};

export const missions: Mission[] = [
  {
    id: "m1",
    titre: "Distribution de repas solidaires",
    ville: "Casablanca",
    domaine: "Solidarité",
    placesRestantes: 4,
    listeAttente: 0,
  },
  {
    id: "m2",
    titre: "Soutien scolaire au collège Al Amal",
    ville: "Rabat",
    domaine: "Éducation",
    placesRestantes: 0,
    listeAttente: 12,
  },
  {
    id: "m3",
    titre: "Nettoyage de la plage des Sablettes",
    ville: "Tanger",
    domaine: "Environnement",
    placesRestantes: 9,
    listeAttente: 0,
  },
  {
    id: "m4",
    titre: "Accompagnement des personnes âgées",
    ville: "Marrakech",
    domaine: "Santé & lien social",
    placesRestantes: 2,
    listeAttente: 5,
  },
];

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
