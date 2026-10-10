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
    private final DomaineRepository domaineRepository;
    private final ImageEvenementRepository imageEvenementRepository;
    private final MissionRepository missionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (associationRepository.count() > 0) {
            return; // Données déjà présentes
        }

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
}
