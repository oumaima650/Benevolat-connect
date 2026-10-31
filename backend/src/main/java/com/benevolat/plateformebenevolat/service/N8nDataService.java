package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.N8nDtos.*;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import com.benevolat.plateformebenevolat.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Données fournies aux workflows n8n. Toute la logique métier (sélection, filtres, scores) reste
 * dans le backend (RM13) : n8n ne fait que rédiger (IA) et envoyer les e-mails.
 */
@Service
@RequiredArgsConstructor
public class N8nDataService {

    private static final double RAYON_PAR_DEFAUT_KM = 25;
    private static final int MAX_BENEVOLES_RENFORT = 30;
    private static final int MAX_MISSIONS_DIGEST = 3;
    private static final int SCORE_MINIMUM_DIGEST = 40;
    private static final List<StatutInscription> ACTIVES =
            List.of(StatutInscription.CONFIRMEE, StatutInscription.EN_LISTE_ATTENTE);

    private final InscriptionRepository inscriptionRepository;
    private final BenevoleRepository benevoleRepository;
    private final MissionRepository missionRepository;
    private final MissionPlacesService missionPlacesService;
    private final NotificationService notificationService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /* ─── F29 : rappels 24 h ───────────────────────────────────────────────── */

    /** Inscriptions confirmées dont la mission commence dans les 24 h, rappel non envoyé, e-mails activés. */
    @Transactional(readOnly = true)
    public List<Rappel> rappelsAEnvoyer() {
        LocalDateTime now = LocalDateTime.now();
        return inscriptionRepository.findARappeler(now, now.plusHours(24)).stream()
                .filter(i -> !Boolean.FALSE.equals(i.getBenevole().getNotifEstActive()))
                .map(i -> new Rappel(i.getIdInscription(), i.getBenevole().getEmail(),
                        prenom(i.getBenevole()), missionInfo(i.getMission())))
                .toList();
    }

    /** Appelé par n8n après l'envoi : marque le rappel (une seule fois) et crée la notification dans l'app. */
    @Transactional
    public void marquerRappelEnvoye(Long inscriptionId) {
        Inscription i = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscription introuvable."));
        if (Boolean.TRUE.equals(i.getRappelEnvoye())) return;
        i.setRappelEnvoye(true);
        Mission m = i.getMission();
        notificationService.notifier(i.getBenevole(), CategorieNotif.RAPPEL,
                "Rappel : votre mission commence bientôt",
                "La mission « " + m.getTitre() + " » commence "
                        + NotificationService.formaterDate(m.getDateDebut()).toLowerCase(Locale.FRENCH) + ".",
                "/missions/" + m.getIdMission(), false);
    }

    /* ─── Renfort urgent : bénévoles proches à solliciter ──────────────────── */

    @Transactional(readOnly = true)
    public Renfort benevolesPourRenfort(Long missionId) {
        Mission m = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable."));
        double[] coordMission = coordonnees(m);
        String villeMission = m.getAssociation() != null ? m.getAssociation().getVille() : null;
        Set<String> competencesMission = m.getCompetences().stream().map(Competence::getNom).collect(Collectors.toSet());

        List<BenevoleProche> proches = new ArrayList<>();
        for (Benevole b : benevoleRepository.findAll()) {
            if (b.getStatut() != StatutUtilisateur.ACTIF || Boolean.FALSE.equals(b.getNotifEstActive())) continue;
            if (inscriptionRepository.existsActive(b.getIdUtilisateur(), missionId, ACTIVES)) continue;

            Double distance = distanceKm(coordMission, b);
            boolean proche = distance != null
                    ? distance <= rayon(b)
                    : villeMission != null && villeMission.equalsIgnoreCase(b.getVille());
            if (!proche) continue;

            proches.add(new BenevoleProche(b.getIdUtilisateur(), b.getEmail(), prenom(b), b.getVille(),
                    distance == null ? null : arrondir(distance),
                    domaineCorrespond(b, m),
                    b.getCompetences().stream().map(Competence::getNom).filter(competencesMission::contains).toList()));
        }
        // Les plus proches et les plus pertinents d'abord
        proches.sort(Comparator.comparing(BenevoleProche::domaineCorrespond).reversed()
                .thenComparing(BenevoleProche::distanceKm, Comparator.nullsLast(Comparator.naturalOrder())));
        return new Renfort(missionInfo(m), proches.stream().limit(MAX_BENEVOLES_RENFORT).toList());
    }

    /* ─── Résumé hebdomadaire : formule pondérée (F47) ─────────────────────── */

    @Transactional(readOnly = true)
    public List<Digest> resumeHebdomadaire() {
        LocalDateTime now = LocalDateTime.now();

        // Missions ouvertes, visibles, avec des places, d'une association validée
        List<Mission> candidates = missionRepository.findAll().stream()
                .filter(m -> m.getStatut() == StatutMission.PUBLIEE || m.getStatut() == StatutMission.RENFORT_URGENT)
                .filter(m -> !Boolean.TRUE.equals(m.getEstMasquee()))
                .filter(m -> m.getDateDebut() != null && m.getDateDebut().isAfter(now))
                .filter(m -> m.getAssociation() != null
                        && m.getAssociation().getStatutValidation() == StatutValidation.VALIDE)
                .filter(m -> missionPlacesService.placesRestantes(m) > 0)
                .toList();
        if (candidates.isEmpty()) return List.of();

        Map<Long, Integer> totalParMission = new HashMap<>();
        candidates.forEach(m -> totalParMission.put(m.getIdMission(), missionPlacesService.capaciteTotale(m)));

        List<Digest> resultats = new ArrayList<>();
        for (Benevole b : benevoleRepository.findAll()) {
            if (b.getStatut() != StatutUtilisateur.ACTIF || Boolean.FALSE.equals(b.getNotifEstActive())) continue;

            List<Inscription> historique = inscriptionRepository
                    .findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(b.getIdUtilisateur());
            Set<Long> dejaInscrit = historique.stream().filter(i -> ACTIVES.contains(i.getStatut()))
                    .map(i -> i.getMission().getIdMission()).collect(Collectors.toSet());
            List<Mission> confirmees = historique.stream().filter(i -> i.getStatut() == StatutInscription.CONFIRMEE)
                    .map(Inscription::getMission).toList();
            Set<Long> domainesPasses = new HashSet<>(), associationsPassees = new HashSet<>();
            confirmees.stream()
                    .filter(m -> m.getStatut() == StatutMission.TERMINEE || m.getStatut() == StatutMission.CLOTUREE)
                    .forEach(m -> {
                        if (m.getDomaine() != null) domainesPasses.add(m.getDomaine().getIdDomaine());
                        associationsPassees.add(m.getAssociation().getIdUtilisateur());
                    });

            List<Recommandation> recos = new ArrayList<>();
            for (Mission m : candidates) {
                if (dejaInscrit.contains(m.getIdMission())) continue;
                if (chevauche(m, confirmees)) continue;   // RM04

                // P — proximité (45 %)
                Double d = distanceKm(coordonnees(m), b);
                double p;
                if (d != null) p = Math.max(0, 1 - d / rayon(b));
                else p = m.getAssociation().getVille() != null
                        && m.getAssociation().getVille().equalsIgnoreCase(b.getVille()) ? 0.5 : 0;
                // A — affinité (35 %)
                boolean domaineOk = domaineCorrespond(b, m);
                boolean historiqueOk = (m.getDomaine() != null && domainesPasses.contains(m.getDomaine().getIdDomaine()))
                        || associationsPassees.contains(m.getAssociation().getIdUtilisateur());
                double a = (domaineOk ? 0.6 : 0) + (historiqueOk ? 0.4 : 0);
                // B — besoin (20 %)
                int total = Math.max(1, totalParMission.get(m.getIdMission()));
                double besoin = (double) missionPlacesService.placesRestantes(m) / total;

                int score = (int) Math.round(100 * (0.45 * p + 0.35 * a + 0.20 * besoin));
                if (score >= SCORE_MINIMUM_DIGEST) {
                    recos.add(new Recommandation(missionInfo(m), score, d == null ? null : arrondir(d),
                            domaineOk, historiqueOk, (int) Math.round(besoin * 100)));
                }
            }
            if (recos.isEmpty()) continue;
            recos.sort(Comparator.comparingInt(Recommandation::score).reversed());
            resultats.add(new Digest(b.getIdUtilisateur(), b.getEmail(), prenom(b), b.getVille(),
                    b.getDomaines().stream().map(Domaine::getNom).toList(),
                    recos.stream().limit(MAX_MISSIONS_DIGEST).toList()));
        }
        return resultats;
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    private MissionInfo missionInfo(Mission m) {
        Association a = m.getAssociation();
        return new MissionInfo(
                m.getIdMission(), m.getTitre(), m.getDescription(),
                m.getDomaine() != null ? m.getDomaine().getNom() : null,
                a != null ? a.getNom() : null,
                m.getDateDebut() != null ? NotificationService.formaterDate(m.getDateDebut()) : null,
                m.getDateFin() != null ? NotificationService.formaterDate(m.getDateFin()) : null,
                m.getAdresse(),
                a != null ? a.getVille() : null,
                m.getCompetences().stream().map(Competence::getNom).toList(),
                missionPlacesService.placesRestantes(m),
                frontendUrl + "/missions/" + m.getIdMission());
    }

    private static String prenom(Benevole b) {
        return b.getPrenom() != null && !b.getPrenom().isBlank() ? b.getPrenom() : b.getNom();
    }

    private static boolean domaineCorrespond(Benevole b, Mission m) {
        return m.getDomaine() != null && b.getDomaines().stream()
                .anyMatch(d -> d.getIdDomaine().equals(m.getDomaine().getIdDomaine()));
    }

    /** RM04 : la mission chevauche-t-elle une mission où le bénévole est déjà confirmé ? */
    private static boolean chevauche(Mission m, List<Mission> confirmees) {
        return confirmees.stream().anyMatch(c -> c.getDateDebut() != null && c.getDateFin() != null
                && c.getDateDebut().isBefore(m.getDateFin()) && m.getDateDebut().isBefore(c.getDateFin()));
    }

    private static double rayon(Benevole b) {
        return b.getRayonDeplacementKm() != null && b.getRayonDeplacementKm() > 0
                ? b.getRayonDeplacementKm() : RAYON_PAR_DEFAUT_KM;
    }

    /** Coordonnées de la mission, sinon celles de l'association ; null si inconnues. */
    private static double[] coordonnees(Mission m) {
        if (m.getLatitude() != null && m.getLongitude() != null) {
            return new double[]{m.getLatitude().doubleValue(), m.getLongitude().doubleValue()};
        }
        Association a = m.getAssociation();
        if (a != null && a.getLatitude() != null && a.getLongitude() != null) {
            return new double[]{a.getLatitude(), a.getLongitude()};
        }
        return null;
    }

    /** Distance à vol d'oiseau (Haversine) entre la mission et le bénévole ; null si une position manque. */
    private static Double distanceKm(double[] mission, Benevole b) {
        if (mission == null || b.getLatitude() == null || b.getLongitude() == null) return null;
        double dLat = Math.toRadians(b.getLatitude() - mission[0]);
        double dLon = Math.toRadians(b.getLongitude() - mission[1]);
        double h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(Math.toRadians(mission[0]))
                * Math.cos(Math.toRadians(b.getLatitude())) * Math.pow(Math.sin(dLon / 2), 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    private static double arrondir(double km) {
        return Math.round(km * 10) / 10.0;
    }
}
