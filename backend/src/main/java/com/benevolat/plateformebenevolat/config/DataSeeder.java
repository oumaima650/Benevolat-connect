package com.benevolat.plateformebenevolat.config;

import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Données de démonstration (associations, missions, images). S'exécute après DataInitializer.
 * Nécessite DomaineRepository#findByNom et un bean PasswordEncoder.
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AssociationRepository associationRepository;
    private final BenevoleRepository benevoleRepository;
    private final DomaineRepository domaineRepository;
    private final ImageEvenementRepository imageEvenementRepository;
    private final MissionRepository missionRepository;
    private final CompetenceRepository competenceRepository;
    private final PasswordEncoder passwordEncoder;

    /** Identifiants du compte bénévole de démonstration (page /dashboard-login). */
    public static final String DEMO_BENEVOLE_EMAIL = "yasmine@example.ma";
    public static final String DEMO_PASSWORD = "secret123";

    @Override
    @Transactional
    public void run(String... args) {
        // Compte de démonstration toujours vérifié (indépendamment des associations)
        seedBenevoleDemo();

        if (associationRepository.count() == 0) {
            seedAssociationsEtMissions();
        }
        seedExplorerDemo();
    }

    private void seedAssociationsEtMissions() {

        // 1. Domaines (créés par DataInitializer)
        Domaine dPauvrete = domaine("Lutte contre la Pauvreté");
        Domaine dEducation = domaine("Éducation pour tous");
        Domaine dEcologie = domaine("Écologie & Environnement");
        Domaine dAgees = domaine("Aide aux Personnes Âgées");

        // 2. Associations (validées pour pouvoir publier, RM06)
        Association asso1 = creerAssociation("banque.alimentaire@email.com", "Banque Alimentaire Maroc",
                "Collecte et redistribue des denrées alimentaires aux familles en situation de précarité.",
                "Casablanca", "+212 5 22 00 11 22", dPauvrete);
        Association asso2 = creerAssociation("al.amal@email.com", "Association Al Amal",
                "Lutte contre le décrochage scolaire grâce à l'accompagnement personnalisé.",
                "Rabat", "+212 5 37 10 20 30", dEducation);
        Association asso3 = creerAssociation("tanger.ecologie@email.com", "Tanger Écologie",
                "Protège le littoral du détroit par des actions de nettoyage et de sensibilisation.",
                "Tanger", "+212 5 39 40 50 60", dEcologie);
        Association asso4 = creerAssociation("lien.generations@email.com", "Lien Générations",
                "Rompt l'isolement des personnes âgées en créant des moments de partage.",
                "Marrakech", "+212 5 24 11 22 33", dAgees);

        // 3. Missions + image de l'événement
        creerMission(new Mission(
                "Distribution de repas solidaires",
                "Préparation et distribution de repas chauds aux familles du quartier, de 17h à 21h.",
                "Bd Mohammed V, Derb Omar, Casablanca",
                new BigDecimal("33.5928"), new BigDecimal("-7.6134"),
                LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(4),
                10, StatutMission.PUBLIEE, asso1, dPauvrete),
                "/assets/hero-benevoles.jpg", "Repas solidaire", "Distribution de repas aux nécessiteux");

        creerMission(new Mission(
                "Soutien scolaire au collège Al Amal",
                "Aide aux devoirs en mathématiques et en français pour des élèves de 3e, deux heures par semaine.",
                "Collège Al Amal, Av. Hassan II, Rabat",
                new BigDecimal("34.0170"), new BigDecimal("-6.8320"),
                LocalDateTime.now().plusDays(5), LocalDateTime.now().plusDays(30),
                8, StatutMission.PUBLIEE, asso2, dEducation),
                "/assets/associations.jpg", "Soutien scolaire", "Accompagnement éducatif");

        creerMission(new Mission(
                "Nettoyage de la plage des Sablettes",
                "Collecte et tri des déchets sur la plage. Gants et sacs fournis.",
                "Plage des Sablettes, Malabata, Tanger",
                new BigDecimal("35.7767"), new BigDecimal("-5.7836"),
                LocalDateTime.now().plusDays(7), LocalDateTime.now().plusDays(7).plusHours(4),
                20, StatutMission.PUBLIEE, asso3, dEcologie),
                "/assets/hero-benevoles.jpg", "Nettoyage plage", "Collecte de déchets sur le littoral");

        creerMission(new Mission(
                "Accompagnement des personnes âgées",
                "Visites de convivialité et petites sorties avec des résidents d'une maison de retraite.",
                "Résidence Al Wafae, Guéliz, Marrakech",
                new BigDecimal("31.6340"), new BigDecimal("-8.0100"),
                LocalDateTime.now().plusDays(10), LocalDateTime.now().plusDays(40),
                6, StatutMission.PUBLIEE, asso4, dAgees),
                "/assets/associations.jpg", "Visites de convivialité", "Moments de partage avec les résidents");

        System.out.println(">>> [DataSeeder] Données de démonstration insérées (associations, missions, images).");
    }

    private Domaine domaine(String nom) {
        return domaineRepository.findByNom(nom).orElseThrow(() ->
                new IllegalStateException("Domaine introuvable : " + nom + " (DataInitializer doit s'exécuter avant)"));
    }

    /**
     * Crée le compte bénévole de démonstration utilisé par la page /dashboard-login.
     * Sans ce compte, la connexion démo ne peut pas produire de JWT valide.
     */
    private void seedBenevoleDemo() {
        if (benevoleRepository.findByEmail(DEMO_BENEVOLE_EMAIL).isPresent()) {
            return;
        }

        Benevole benevole = new Benevole(DEMO_BENEVOLE_EMAIL, passwordEncoder.encode(DEMO_PASSWORD), null);
        benevole.setNom("El Idrissi");
        benevole.setPrenom("Yasmine");
        benevole.setTelephone("+212 6 61 22 33 44");
        benevole.setVille("Casablanca");
        benevole.setBiographie("Étudiante en informatique, engagée pour l'écologie et l'éducation.");
        benevole.setRayonDeplacementKm(25.0);
        benevole.setLatitude(33.5731);
        benevole.setLongitude(-7.5898);
        benevole.setStatut(StatutUtilisateur.ACTIF);
        benevole.getDomaines().add(domaine("Écologie & Environnement"));
        benevole.getDomaines().add(domaine("Éducation pour tous"));

        benevoleRepository.save(benevole);
        System.out.println(">>> [DataSeeder] Compte bénévole de démonstration créé : " + DEMO_BENEVOLE_EMAIL);
    }

    private Association creerAssociation(String email, String nom, String description, String ville, String contact, Domaine domaine) {
        Association a = new Association(email, passwordEncoder.encode("secret123"), "/assets/associations.jpg",
                nom, description, ville, contact);
        a.setStatutValidation(StatutValidation.VALIDE);
        a.getDomaines().add(domaine);
        return associationRepository.save(a);
    }

    private void creerMission(Mission mission, String urlImage, String titreImage, String descriptionImage) {
        Mission saved = missionRepository.save(mission);
        imageEvenementRepository.save(new ImageEvenement(urlImage, titreImage, descriptionImage, saved));
    }

    /** Missions saturée / renfort + scores de matching pour l'espace Explorer. */
    private void seedExplorerDemo() {
        Benevole yasmine = benevoleRepository.findByEmail(DEMO_BENEVOLE_EMAIL).orElse(null);
        if (yasmine == null || associationRepository.count() == 0) {
            return;
        }

        Association asso1 = associationRepository.findAll().stream()
                .filter(a -> "Casablanca".equals(a.getVille()))
                .findFirst()
                .orElse(associationRepository.findAll().get(0));
        Association asso3 = associationRepository.findAll().stream()
                .filter(a -> "Tanger".equals(a.getVille()))
                .findFirst()
                .orElse(asso1);

        Domaine dPauvrete = domaine("Lutte contre la Pauvreté");
        Domaine dEcologie = domaine("Écologie & Environnement");
        Competence cuisine = competenceRepository.findByNom("Cuisine & Restauration").orElse(null);
        Competence jardinage = competenceRepository.findByNom("Bricolage & Jardinage").orElse(null);
        Competence logistique = competenceRepository.findByNom("Logistique & Transport").orElse(null);

        if (!missionRepository.existsByTitre("Collecte alimentaire d'urgence")) {
            Mission saturee = new Mission(
                    "Collecte alimentaire d'urgence",
                    "Collecte de denrées non périssables. Toutes les places sont prises, liste d'attente ouverte.",
                    "Marché Central, Casablanca",
                    new BigDecimal("33.5950"), new BigDecimal("-7.6180"),
                    LocalDateTime.now().plusDays(4), LocalDateTime.now().plusDays(4).plusHours(5),
                    0, StatutMission.SATUREE, asso1, dPauvrete);
            saturee.setNbPlacesListeAttente(8);
            if (cuisine != null) saturee.getCompetences().add(cuisine);
            if (logistique != null) saturee.getCompetences().add(logistique);
            creerMission(saturee, "/assets/hero-benevoles.jpg", "Collecte alimentaire", "Collecte d'urgence");
        }

        if (!missionRepository.existsByTitre("Renfort nettoyage après tempête")) {
            Mission renfort = new Mission(
                    "Renfort nettoyage après tempête",
                    "Appel à renfort immédiat pour sécuriser le littoral après la tempête.",
                    "Plage Malabata, Tanger",
                    new BigDecimal("35.7882"), new BigDecimal("-5.7200"),
                    LocalDateTime.now().minusHours(2), LocalDateTime.now().plusDays(1),
                    0, StatutMission.RENFORT_URGENT, asso3, dEcologie);
            renfort.setNbRenfortDemande(5);
            if (jardinage != null) renfort.getCompetences().add(jardinage);
            creerMission(renfort, "/assets/hero-benevoles.jpg", "Renfort littoral", "Nettoyage d'urgence");
        }

        if (!missionRepository.existsByTitre("Atelier numérique à distance")) {
            Mission remote = new Mission(
                    "Atelier numérique à distance",
                    "Initiation visio aux outils collaboratifs pour les bénévoles des associations partenaires.",
                    null,
                    null, null,
                    LocalDateTime.now().plusDays(12), LocalDateTime.now().plusDays(12).plusHours(3),
                    15, StatutMission.PUBLIEE, asso1, domaine("Éducation pour tous"));
            Competence info = competenceRepository.findByNom("Informatique & Web").orElse(null);
            if (info != null) remote.getCompetences().add(info);
            creerMission(remote, "/assets/associations.jpg", "Atelier distant", "Formation en ligne");
        }
    }
}
