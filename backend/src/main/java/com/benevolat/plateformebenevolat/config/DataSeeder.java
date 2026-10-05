package com.benevolat.plateformebenevolat.config;

import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AssociationRepository associationRepository;
    private final DomaineRepository domaineRepository;
    private final ImageEvenementRepository imageEvenementRepository;
    private final MissionRepository missionRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (associationRepository.count() > 0) {
            return; // Data already present
        }

        // 1. Domaines
        Domaine dSolidarite = domaineRepository.save(new Domaine("Solidarité"));
        Domaine dEducation = domaineRepository.save(new Domaine("Éducation"));
        Domaine dEnvironnement = domaineRepository.save(new Domaine("Environnement"));
        Domaine dSante = domaineRepository.save(new Domaine("Santé & lien social"));

        // 2. Images Evenement
        ImageEvenement img1 = imageEvenementRepository.save(new ImageEvenement("/assets/hero-benevoles.jpg", "Repas solidaire", "Distribution de repas aux nécessiteux"));
        ImageEvenement img2 = imageEvenementRepository.save(new ImageEvenement("/assets/associations.jpg", "Soutien scolaire", "Accompagnement éducatif"));
        ImageEvenement img3 = imageEvenementRepository.save(new ImageEvenement("/assets/hero-benevoles.jpg", "Nettoyage plage", "Collecte de déchets sur le littoral"));
        ImageEvenement img4 = imageEvenementRepository.save(new ImageEvenement("/assets/associations.jpg", "Reboisement", "Plantation d'arbres"));

        // 3. Associations
        Association asso1 = associationRepository.save(new Association(
                "banque.alimentaire@email.com",
                "secret123",
                "/assets/associations.jpg",
                "Banque Alimentaire Maroc",
                "Collecte et redistribue des denrées alimentaires aux familles en situation de précarité.",
                "Solidarité",
                "Casablanca",
                "+212 5 22 00 11 22"
        ));

        Association asso2 = associationRepository.save(new Association(
                "al.amal@email.com",
                "secret123",
                "/assets/associations.jpg",
                "Association Al Amal",
                "Lutte contre le décrochage scolaire grâce à l'accompagnement personnalisé.",
                "Éducation",
                "Rabat",
                "+212 5 37 10 20 30"
        ));

        Association asso3 = associationRepository.save(new Association(
                "tanger.ecologie@email.com",
                "secret123",
                "/assets/associations.jpg",
                "Tanger Écologie",
                "Protège le littoral du détroit par des actions de nettoyage et de sensibilisation.",
                "Environnement",
                "Tanger",
                "+212 5 39 40 50 60"
        ));

        Association asso4 = associationRepository.save(new Association(
                "lien.generations@email.com",
                "secret123",
                "/assets/associations.jpg",
                "Lien Générations",
                "Rompt l'isolement des personnes âgées en créant des moments de partage.",
                "Santé & lien social",
                "Marrakech",
                "+212 5 24 11 22 33"
        ));

        // 4. Missions
        missionRepository.save(new Mission(
                "Distribution de repas solidaires",
                "Préparation et distribution de repas chauds aux familles du quartier, de 17h à 21h.",
                "Bd Mohammed V, Derb Omar, Casablanca",
                new BigDecimal("33.5928"),
                new BigDecimal("-7.6134"),
                LocalDateTime.now().plusDays(2),
                LocalDateTime.now().plusDays(4),
                10,
                StatutMission.PUBLIEE,
                asso1,
                dSolidarite,
                img1
        ));

        missionRepository.save(new Mission(
                "Soutien scolaire au collège Al Amal",
                "Aide aux devoirs en mathématiques et en français pour des élèves de 3e, deux heures par semaine.",
                "Collège Al Amal, Av. Hassan II, Rabat",
                new BigDecimal("34.0170"),
                new BigDecimal("-6.8320"),
                LocalDateTime.now().plusDays(5),
                LocalDateTime.now().plusDays(30),
                8,
                StatutMission.PUBLIEE,
                asso2,
                dEducation,
                img2
        ));

        missionRepository.save(new Mission(
                "Nettoyage de la plage des Sablettes",
                "Collecte et tri des déchets sur la plage. Gants et sacs fournis.",
                "Plage des Sablettes, Malabata, Tanger",
                new BigDecimal("35.7767"),
                new BigDecimal("-5.7836"),
                LocalDateTime.now().plusDays(7),
                LocalDateTime.now().plusDays(7),
                20,
                StatutMission.PUBLIEE,
                asso3,
                dEnvironnement,
                img3
        ));

        missionRepository.save(new Mission(
                "Accompagnement des personnes âgées",
                "Visites de convivialité et petites sorties avec des résidents d'une maison de retraite.",
                "Résidence Al Wafae, Guéliz, Marrakech",
                new BigDecimal("31.6340"),
                new BigDecimal("-8.0100"),
                LocalDateTime.now().plusDays(10),
                LocalDateTime.now().plusDays(40),
                6,
                StatutMission.PUBLIEE,
                asso4,
                dSante,
                img4
        ));

        System.out.println(">>> [DataSeeder] Initialisation réussie selon le NOUVEAU schéma SQL exact (Domaines, ImageEvenement, Utilisateur/Association, Missions) !");
    }
}
