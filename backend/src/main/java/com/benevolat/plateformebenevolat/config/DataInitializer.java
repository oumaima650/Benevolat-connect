package com.benevolat.plateformebenevolat.config;

import com.benevolat.plateformebenevolat.entity.Competence;
import com.benevolat.plateformebenevolat.entity.Domaine;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
import com.benevolat.plateformebenevolat.repository.DomaineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Initialiseur de données exécuté au démarrage du serveur backend.
 * Pré-remplit les tables 'competences' et 'domaines' si elles sont vides.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CompetenceRepository competenceRepository;
    private final DomaineRepository domaineRepository;

    @Override
    public void run(String... args) {
        initCompetences();
        initDomaines();
    }

    private void initCompetences() {
        if (competenceRepository.count() == 0) {
            log.info("Pré-remplissage de la table 'competences'...");
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
            log.info("Pré-remplissage de la table 'domaines'...");
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
}
