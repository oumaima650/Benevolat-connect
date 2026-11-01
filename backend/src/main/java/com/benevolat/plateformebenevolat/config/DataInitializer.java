package com.benevolat.plateformebenevolat.config;

import com.benevolat.plateformebenevolat.entity.Badge;
import com.benevolat.plateformebenevolat.entity.Competence;
import com.benevolat.plateformebenevolat.entity.CritereBadge;
import com.benevolat.plateformebenevolat.entity.Domaine;
import com.benevolat.plateformebenevolat.repository.BadgeRepository;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
import com.benevolat.plateformebenevolat.repository.DomaineRepository;
import com.benevolat.plateformebenevolat.service.GamificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.benevolat.plateformebenevolat.entity.TypeBadge.PALIER;
import static com.benevolat.plateformebenevolat.entity.TypeBadge.SPECIAL;

/**
 * Initialiseur de données exécuté au démarrage du serveur backend.
 * Pré-remplit les tables prédéfinies (Competence, Domaine, Badge) si elles sont vides,
 * puis attribue les badges déjà mérités (rattrapage).
 * S'exécute avant DataSeeder (@Order).
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CompetenceRepository competenceRepository;
    private final DomaineRepository domaineRepository;
    private final BadgeRepository badgeRepository;
    private final GamificationService gamificationService;

    @Override
    public void run(String... args) {
        initCompetences();
        initDomaines();
        initBadges();
        gamificationService.rattraperTous();
    }

    private void initCompetences() {
        if (competenceRepository.count() == 0) {
            log.info("Pré-remplissage de la table 'Competence'...");
            List<Competence> competences = List.of(
                new Competence("Informatique & Web", "Technique", "Développement web, maintenance PC, réseaux sociaux"),
                new Competence("Soutien scolaire", "Éducation", "Aide aux devoirs, cours de soutien, alphabétisation"),
                new Competence("Premiers secours (PSC1)", "Santé", "Attestation de formation aux premiers secours"),
                new Competence("Logistique & Transport", "Opérationnel", "Conduite (Permis B/C), gestion de stocks, livraison"),
                new Competence("Animation & Événementiel", "Social", "Animation d'ateliers, organisation de jeux, gestion d'événements"),
                new Competence("Communication & Graphisme", "Créatif", "Rédaction d'articles, création de visuels, réseaux sociaux"),
                new Competence("Comptabilité & Gestion", "Administratif", "Tenue de comptes, gestion budgétaire, secrétariat"),
                new Competence("Cuisine & Restauration", "Manuel", "Préparation de repas collectifs, service en maraude"),
                new Competence("Bricolage & Jardinage", "Manuel", "Réparations, aménagement d'espaces verts, éco-construction"),
                new Competence("Écoute & Soutien moral", "Social", "Accompagnement psychologique, soutien aux personnes isolées"),
                new Competence("Traduction & Langues", "Éducation", "Traduction de documents, interprétariat")
            );
            competenceRepository.saveAll(competences);
            log.info("{} compétences initiales insérées avec succès !", competences.size());
        }
    }

    private void initDomaines() {
        if (domaineRepository.count() == 0) {
            log.info("Pré-remplissage de la table 'Domaine'...");
            List<Domaine> domaines = List.of(
                new Domaine("Écologie & Environnement", "Environnement", "Protection de la nature, recyclage, nettoyages citoyens"),
                new Domaine("Protection Animale", "Environnement", "Refuges pour animaux, sauvetage, soin animalier"),
                new Domaine("Lutte contre la Pauvreté", "Social", "Maraudes, distributions alimentaires, vestiaires solidaires"),
                new Domaine("Enfance & Jeunesse", "Éducation", "Activités ludiques, sorties culturelles, parrainage"),
                new Domaine("Aide aux Personnes Âgées", "Social", "Visites de convivialité, lutte contre l'isolement des séniors"),
                new Domaine("Santé & Handicap", "Santé", "Accompagnement du handicap, soutien aux malades et familles"),
                new Domaine("Culture & Art", "Culture", "Accessibilité culturelle, soutien aux festivals et musées"),
                new Domaine("Sport & Handisport", "Sport", "Promotion du sport inclusif et animations sportives"),
                new Domaine("Droits Humains & Égalité", "Social", "Lutte contre les discriminations, aide aux réfugiés"),
                new Domaine("Éducation pour tous", "Éducation", "Accès au savoir, lutte contre l'illectronisme"),
                new Domaine("Urgence & Catastrophes", "Humanitaire", "Aide d'urgence, gestion de crises et catastrophes naturelles"),
                new Domaine("Insertion Professionnelle", "Social", "Accompagnement à l'emploi, formation et réinsertion")
            );
            domaineRepository.saveAll(domaines);
            log.info("{} domaines initiaux insérés avec succès !", domaines.size());
        }
    }

    /** Badges PALIER (tous les 5 niveaux, avec bannière) et SPECIAL ; ajoute ceux qui manquent. */
    private void initBadges() {
        List<Badge> badges = List.of(
            new Badge("ETINCELLE", "Étincelle", "Atteindre le niveau 5 : tes premières missions ont allumé l'étincelle.",
                PALIER, CritereBadge.NIVEAU, 5, "etincelle", 1),
            new Badge("FLAMME", "Flamme", "Atteindre le niveau 10 : ton engagement brûle d'une belle flamme.",
                PALIER, CritereBadge.NIVEAU, 10, "flamme", 2),
            new Badge("PHARE", "Phare", "Atteindre le niveau 15 : tu guides et inspires les autres bénévoles.",
                PALIER, CritereBadge.NIVEAU, 15, "phare", 3),
            new Badge("ETOILE", "Étoile", "Atteindre le niveau 20 : une étoile de la solidarité.",
                PALIER, CritereBadge.NIVEAU, 20, "etoile", 4),
            new Badge("CONSTELLATION", "Constellation", "Atteindre le niveau 25 : ton impact relie toute une communauté.",
                PALIER, CritereBadge.NIVEAU, 25, "constellation", 5),
            new Badge("LEGENDE", "Légende", "Atteindre le niveau 30 : une légende du bénévolat.",
                PALIER, CritereBadge.NIVEAU, 30, "legende", 6),
            new Badge("RENFORT_DE_CHOC", "Renfort de choc", "Répondre présent à un renfort urgent.",
                SPECIAL, CritereBadge.RENFORT, 1, null, 7),
            new Badge("FIDELE", "Fidèle", "Réaliser 3 missions avec la même association.",
                SPECIAL, CritereBadge.MEME_ASSOCIATION, 3, null, 8),
            new Badge("EXPLORATEUR", "Explorateur", "Réaliser des missions dans 3 domaines différents.",
                SPECIAL, CritereBadge.DOMAINES_DIFFERENTS, 3, null, 9),
            new Badge("SPECIALISTE", "Spécialiste", "Réaliser 5 missions dans un même domaine.",
                SPECIAL, CritereBadge.MEME_DOMAINE, 5, null, 10),
            new Badge("REGULIER", "Régulier", "Réaliser au moins une mission par mois pendant 3 mois d'affilée.",
                SPECIAL, CritereBadge.MOIS_CONSECUTIFS, 3, null, 11)
        );
        List<Badge> manquants = badges.stream().filter(b -> !badgeRepository.existsByCode(b.getCode())).toList();
        if (!manquants.isEmpty()) {
            badgeRepository.saveAll(manquants);
            log.info("{} badge(s) inséré(s) avec succès !", manquants.size());
        }
    }
}
