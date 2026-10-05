package com.benevolat.plateformebenevolat.config;

import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AssociationRepository associationRepository;
    private final BenevoleRepository benevoleRepository;
    private final MissionRepository missionRepository;
    private final InscriptionRepository inscriptionRepository;
    private final CertificatRepository certificatRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (associationRepository.count() > 0) {
            return; // Data already present
        }

        // 1. Associations
        Association asso1 = associationRepository.save(new Association(
                "Secours Populaire Français",
                "RNA-W751001234",
                "Association caritative venant en aide aux personnes victimes de la précarité et de l'exclusion.",
                "Paris",
                "Solidarité"
        ));

        Association asso2 = associationRepository.save(new Association(
                "Les Restos du Cœur",
                "RNA-W751009876",
                "Distribution de repas gratuits et accompagnement à la réinsertion sociale.",
                "Lyon",
                "Alimentation & Solidarité"
        ));

        Association asso3 = associationRepository.save(new Association(
                "Fondation Protection Nature",
                "RNA-W130005544",
                "Sensibilisation et actions concrètes pour la préservation de la biodiversité.",
                "Marseille",
                "Environnement"
        ));

        Association asso4 = associationRepository.save(new Association(
                "Lire & Grandir",
                "RNA-W590003322",
                "Soutien scolaire et ateliers de lecture auprès des enfants défavorisés.",
                "Lille",
                "Éducation"
        ));

        // 2. Bénévoles
        Benevole b1 = benevoleRepository.save(new Benevole("Dubois", "Thomas", "thomas.dubois@email.com", "Paris", "0611223344"));
        Benevole b2 = benevoleRepository.save(new Benevole("Martin", "Sarah", "sarah.martin@email.com", "Paris", "0622334455"));
        Benevole b3 = benevoleRepository.save(new Benevole("Bernard", "Lucas", "lucas.bernard@email.com", "Lyon", "0633445566"));
        Benevole b4 = benevoleRepository.save(new Benevole("Petit", "Emma", "emma.petit@email.com", "Marseille", "0644556677"));
        Benevole b5 = benevoleRepository.save(new Benevole("Leroy", "Hugo", "hugo.leroy@email.com", "Lille", "0655667788"));
        Benevole b6 = benevoleRepository.save(new Benevole("Roux", "Camille", "camille.roux@email.com", "Nantes", "0666778899"));

        // 3. Missions (10 missions)
        Mission m1 = missionRepository.save(new Mission(
                "Maraude nocturne et distribution alimentaire",
                "Participez à notre maraude hebdomadaire dans le centre de Paris pour distribuer des repas chauds, boissons et kits d'hygiène.",
                "Solidarité",
                "Paris",
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(2),
                5,
                StatutMission.DISPONIBLE,
                "Urgent",
                "/assets/hero-benevoles.jpg",
                asso1
        ));

        Mission m2 = missionRepository.save(new Mission(
                "Collecte alimentaire en supermarché",
                "Accueillez les clients au supermarché pour collecter des denrées non périssables et aider au tri en réserve.",
                "Solidarité",
                "Lyon",
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(6),
                4,
                StatutMission.COMPLET,
                "Équipe",
                "/assets/associations.jpg",
                asso2
        ));

        Mission m3 = missionRepository.save(new Mission(
                "Nettoyage participatif de la plage",
                "Rejoignez-nous pour une matinée éco-citoyenne de ramassage et tri des déchets sur le littoral méditerranéen.",
                "Environnement",
                "Marseille",
                LocalDate.now().plusDays(7),
                LocalDate.now().plusDays(7),
                15,
                StatutMission.DISPONIBLE,
                "Plein air",
                "/assets/hero-benevoles.jpg",
                asso3
        ));

        Mission m4 = missionRepository.save(new Mission(
                "Soutien scolaire et aide aux devoirs",
                "Accompagnez des élèves du primaire au collège pour leurs devoirs après la classe dans notre centre de quartier.",
                "Éducation",
                "Lille",
                LocalDate.now().plusDays(3),
                LocalDate.now().plusDays(30),
                6,
                StatutMission.DISPONIBLE,
                "Hebdomadaire",
                "/assets/associations.jpg",
                asso4
        ));

        missionRepository.save(new Mission(
                "Atelier informatique pour seniors",
                "Aidez les personnes âgées à apprivoiser les outils numériques (démarches en ligne, emails, visioconférence).",
                "Éducation",
                "Paris",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(10),
                3,
                StatutMission.DISPONIBLE,
                "Convivial",
                "/assets/hero-benevoles.jpg",
                asso1
        ));

        missionRepository.save(new Mission(
                "Préparation de paniers repas solides",
                "Tri des arrivages, conditionnement et confection de colis alimentaires distribués aux familles.",
                "Solidarité",
                "Lyon",
                LocalDate.now().plusDays(4),
                LocalDate.now().plusDays(4),
                8,
                StatutMission.DISPONIBLE,
                "Physique",
                "/assets/associations.jpg",
                asso2
        ));

        missionRepository.save(new Mission(
                "Plantation d'arbres en forêt urbaine",
                "Atelier participatif de reforestation pour planter des essences locales et favoriser la biodiversité en ville.",
                "Environnement",
                "Nantes",
                LocalDate.now().plusDays(14),
                LocalDate.now().plusDays(14),
                12,
                StatutMission.DISPONIBLE,
                "Plein air",
                "/assets/hero-benevoles.jpg",
                asso3
        ));

        Mission m8 = missionRepository.save(new Mission(
                "Atelier lecture et conte pour enfants",
                "Animation de temps de lecture à voix haute dans une bibliothèque solidaire.",
                "Culture",
                "Lille",
                LocalDate.now().plusDays(8),
                LocalDate.now().plusDays(8),
                2,
                StatutMission.COMPLET,
                "Enfance",
                "/assets/associations.jpg",
                asso4
        ));

        missionRepository.save(new Mission(
                "Vestiaire solidaire et tri de vêtements",
                "Réception, tri par taille et mise en rayon des vêtements donnés pour les personnes démunies.",
                "Solidarité",
                "Paris",
                LocalDate.now().plusDays(9),
                LocalDate.now().plusDays(9),
                5,
                StatutMission.DISPONIBLE,
                "Intérieur",
                "/assets/hero-benevoles.jpg",
                asso1
        ));

        missionRepository.save(new Mission(
                "Visites de convivialité auprès d'aînés isolés",
                "Partagez un moment d'échange, un jeu de société ou une promenade avec une personne âgée isolée.",
                "Santé",
                "Lyon",
                LocalDate.now().plusDays(12),
                LocalDate.now().plusDays(40),
                4,
                StatutMission.DISPONIBLE,
                "Humain",
                "/assets/associations.jpg",
                asso2
        ));

        // 4. Inscriptions (some confirmed, some on waiting list for full mission m2 & m8)
        // Mission m1 (limit 5): 2 confirmed
        inscriptionRepository.save(new Inscription(b1, m1, StatutInscription.CONFIRMEE, 1));
        inscriptionRepository.save(new Inscription(b2, m1, StatutInscription.CONFIRMEE, 2));

        // Mission m2 (limit 4): 4 confirmed + 2 waiting list
        inscriptionRepository.save(new Inscription(b1, m2, StatutInscription.CONFIRMEE, 1));
        inscriptionRepository.save(new Inscription(b2, m2, StatutInscription.CONFIRMEE, 2));
        inscriptionRepository.save(new Inscription(b3, m2, StatutInscription.CONFIRMEE, 3));
        inscriptionRepository.save(new Inscription(b4, m2, StatutInscription.CONFIRMEE, 4));
        inscriptionRepository.save(new Inscription(b5, m2, StatutInscription.EN_LISTE_ATTENTE, 1));
        inscriptionRepository.save(new Inscription(b6, m2, StatutInscription.EN_LISTE_ATTENTE, 2));

        // Mission m8 (limit 2): 2 confirmed + 1 waiting list
        inscriptionRepository.save(new Inscription(b5, m8, StatutInscription.CONFIRMEE, 1));
        inscriptionRepository.save(new Inscription(b6, m8, StatutInscription.CONFIRMEE, 2));
        inscriptionRepository.save(new Inscription(b3, m8, StatutInscription.EN_LISTE_ATTENTE, 1));

        // 5. Certificats
        certificatRepository.save(new Certificat(
                "CERT-2026-8821",
                LocalDate.now().minusMonths(1),
                18,
                b1,
                m1
        ));

        certificatRepository.save(new Certificat(
                "CERT-2026-9932",
                LocalDate.now().minusMonths(2),
                24,
                b2,
                m2
        ));

        certificatRepository.save(new Certificat(
                "CERT-2026-1104",
                LocalDate.now().minusWeeks(2),
                12,
                b3,
                m3
        ));

        certificatRepository.save(new Certificat(
                "CERT-2026-7745",
                LocalDate.now().minusMonths(3),
                30,
                b4,
                m4
        ));

        System.out.println(">>> [DataSeeder] Initialisation réussie des données démo pour Personne B (Associations, Bénévoles, Missions, Inscriptions, Certificats)");
    }
}
