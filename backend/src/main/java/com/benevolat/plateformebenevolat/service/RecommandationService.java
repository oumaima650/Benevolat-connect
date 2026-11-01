package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * Recommandations de missions (table ScoreMatching).
 *
 * - IA : Google Gemini note les missions les plus prometteuses (méthode IA).
 * - Formule de secours (méthode FORMULE), sans le domaine :
 *   proximité 40 % · compétences 30 % · besoin de l'association 20 % · fidélité à l'association 10 %.
 *
 * Les scores sont mis en cache 12 h ; ils sont recalculés si le profil change, si de nouvelles missions
 * apparaissent, et chaque nuit. À l'affichage, la formule répond tout de suite et l'IA affine en arrière-plan.
 */
@Service
@Slf4j
public class RecommandationService {

    private static final double RAYON_PAR_DEFAUT_KM = 25;
    private static final int VALIDITE_HEURES = 12;
    private static final int MAX_MISSIONS_IA = 15;

    private final MissionRepository missionRepository;
    private final BenevoleRepository benevoleRepository;
    private final InscriptionRepository inscriptionRepository;
    private final CertificatRepository certificatRepository;
    private final ScoreMatchingRepository scoreMatchingRepository;
    private final MissionPlacesService missionPlacesService;
    private final GeminiService geminiService;
    private final TransactionTemplate nouvelleTransaction;

    private final ExecutorService taches = Executors.newVirtualThreadPerTaskExecutor();
    private final Set<Long> iaEnCours = ConcurrentHashMap.newKeySet();

    public RecommandationService(MissionRepository missionRepository, BenevoleRepository benevoleRepository,
                                 InscriptionRepository inscriptionRepository, CertificatRepository certificatRepository,
                                 ScoreMatchingRepository scoreMatchingRepository, MissionPlacesService missionPlacesService,
                                 GeminiService geminiService, PlatformTransactionManager transactionManager) {
        this.missionRepository = missionRepository;
        this.benevoleRepository = benevoleRepository;
        this.inscriptionRepository = inscriptionRepository;
        this.certificatRepository = certificatRepository;
        this.scoreMatchingRepository = scoreMatchingRepository;
        this.missionPlacesService = missionPlacesService;
        this.geminiService = geminiService;
        this.nouvelleTransaction = new TransactionTemplate(transactionManager);
        this.nouvelleTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /* ─── Points d'entrée ──────────────────────────────────────────────────── */

    /**
     * Avant l'affichage : calcule par la formule les scores manquants ou périmés,
     * puis demande à l'IA de les affiner en arrière-plan.
     */
    public void actualiserSiNecessaire(Long benevoleId) {
        Boolean recalcule = nouvelleTransaction.execute(tx -> calculerFormule(benevoleId, false));
        if (Boolean.TRUE.equals(recalcule) && geminiService.actif() && iaEnCours.add(benevoleId)) {
            taches.execute(() -> {
                try {
                    affinerAvecIA(benevoleId);
                } finally {
                    iaEnCours.remove(benevoleId);
                }
            });
        }
    }

    public void actualiserSiNecessaire(String email) {
        benevoleRepository.findByEmail(email).ifPresent(b -> actualiserSiNecessaire(b.getIdUtilisateur()));
    }

    /** Profil modifié (compétences, position, rayon…) : les scores seront recalculés. */
    public void invalider(Long benevoleId) {
        scoreMatchingRepository.supprimerPourBenevole(benevoleId);
    }

    /** Chaque nuit à 3 h : recalcul complet pour les bénévoles actifs (IA à la suite, sans parallélisme). */
    @Scheduled(cron = "0 0 3 * * *")
    public void recalculNocturne() {
        List<Long> ids = benevoleRepository.findAll().stream()
                .filter(b -> b.getStatut() == StatutUtilisateur.ACTIF)
                .map(Benevole::getIdUtilisateur).toList();
        for (Long id : ids) {
            try {
                nouvelleTransaction.executeWithoutResult(tx -> calculerFormule(id, true));
                if (geminiService.actif()) affinerAvecIA(id);
            } catch (Exception e) {
                log.warn("Recommandations du bénévole {} non recalculées : {}", id, e.getMessage());
            }
        }
        log.info("Recommandations recalculées pour {} bénévole(s).", ids.size());
    }

    /* ─── Formule ──────────────────────────────────────────────────────────── */

    /** @return true si des scores ont été (re)calculés */
    private boolean calculerFormule(Long benevoleId, boolean forcer) {
        Benevole b = benevoleRepository.findById(benevoleId).orElse(null);
        if (b == null) return false;
        Contexte ctx = contexte(b);
        if (ctx.candidates().isEmpty()) return false;

        LocalDateTime limite = LocalDateTime.now().minusHours(VALIDITE_HEURES);
        Map<Long, ScoreMatching> existants = scoreMatchingRepository.findByBenevole_IdUtilisateur(benevoleId).stream()
                .collect(Collectors.toMap(s -> s.getMission().getIdMission(), s -> s, (x, y) -> x));

        boolean recalcule = false;
        for (Mission m : ctx.candidates()) {
            ScoreMatching sm = existants.get(m.getIdMission());
            boolean aJour = sm != null && sm.getDateCalcul().isAfter(limite)
                    && (b.getUpdatedAt() == null || sm.getDateCalcul().isAfter(b.getUpdatedAt()));
            if (aJour && !forcer) continue;

            Formule f = formule(b, m, ctx);
            if (sm == null) {
                sm = new ScoreMatching(b, m, f.score(), f.explication(), MethodeScore.FORMULE);
            } else {
                sm.setScore(f.score());
                sm.setExplication(f.explication());
                sm.setMethode(MethodeScore.FORMULE);
                sm.setDateCalcul(LocalDateTime.now());
            }
            scoreMatchingRepository.save(sm);
            recalcule = true;
        }
        return recalcule;
    }

    private record Formule(int score, String explication) {}

    private Formule formule(Benevole b, Mission m, Contexte ctx) {
        List<String> raisons = new ArrayList<>();

        // P — proximité (40 %)
        Double d = distanceKm(coordonnees(m), b);
        double p;
        if (coordonnees(m) == null && (m.getAdresse() == null || m.getAdresse().isBlank())) {
            p = 0.7;
            raisons.add("Mission à distance");
        } else if (d != null) {
            p = Math.max(0, 1 - d / rayon(b));
            if (p > 0) raisons.add("À " + String.format(Locale.FRENCH, "%.1f", d) + " km de chez toi");
        } else {
            boolean memeVille = m.getAssociation().getVille() != null
                    && m.getAssociation().getVille().equalsIgnoreCase(b.getVille());
            p = memeVille ? 0.5 : 0;
            if (memeVille) raisons.add("Dans ta ville");
        }

        // C — compétences (30 %)
        Set<Long> requises = m.getCompetences().stream().map(Competence::getId).collect(Collectors.toSet());
        double c;
        if (requises.isEmpty()) {
            c = 0.5;
        } else {
            long communes = requises.stream().filter(ctx.competences()::contains).count();
            c = (double) communes / requises.size();
            if (communes > 0) raisons.add(communes + "/" + requises.size() + " compétences requises");
        }

        // B — besoin de l'association (20 %)
        double besoin;
        if (m.getStatut() == StatutMission.RENFORT_URGENT) {
            besoin = 1;
            raisons.add("Renfort urgent");
        } else {
            int total = Math.max(1, missionPlacesService.capaciteTotale(m));
            besoin = (double) missionPlacesService.placesRestantes(m) / total;
        }

        // F — fidélité à l'association (10 %)
        boolean connue = ctx.associationsAidees().contains(m.getAssociation().getIdUtilisateur());
        if (connue) raisons.add("Association que tu as déjà aidée");

        int score = (int) Math.round(100 * (0.40 * p + 0.30 * c + 0.20 * besoin + 0.10 * (connue ? 1 : 0)));
        String explication = raisons.isEmpty() ? "Mission ouverte qui a besoin de bénévoles." : String.join(" · ", raisons);
        return new Formule(Math.max(0, Math.min(100, score)), explication);
    }

    /* ─── IA ───────────────────────────────────────────────────────────────── */

    /** Envoie à Gemini les missions les mieux classées par la formule ; garde la formule en cas d'échec. */
    private void affinerAvecIA(Long benevoleId) {
        // 1. Données envoyées à l'IA (lecture seule, sans nom ni e-mail du bénévole)
        record Demande(Map<String, Object> benevole, List<Map<String, Object>> missions) {}
        Demande demande = nouvelleTransaction.execute(tx -> {
            Benevole b = benevoleRepository.findById(benevoleId).orElse(null);
            if (b == null) return null;
            Contexte ctx = contexte(b);
            Set<Long> ouvertes = ctx.candidates().stream().map(Mission::getIdMission).collect(Collectors.toSet());
            List<Mission> meilleures = scoreMatchingRepository.findByBenevole_IdUtilisateur(benevoleId).stream()
                    .filter(s -> ouvertes.contains(s.getMission().getIdMission()))
                    .sorted(Comparator.comparing(ScoreMatching::getScore).reversed())
                    .limit(MAX_MISSIONS_IA)
                    .map(ScoreMatching::getMission)
                    .toList();
            if (meilleures.isEmpty()) return null;

            Map<String, Object> profil = new LinkedHashMap<>();
            profil.put("ville", Objects.toString(b.getVille(), ""));
            profil.put("rayonDeplacementKm", rayon(b));
            profil.put("competences", b.getCompetences().stream().map(Competence::getNom).toList());
            profil.put("biographie", Objects.toString(b.getBiographie(), ""));
            profil.put("associationsDejaAidees", ctx.nomsAssociationsAidees());

            List<Map<String, Object>> missions = new ArrayList<>();
            for (Mission m : meilleures) {
                Map<String, Object> info = new LinkedHashMap<>();
                Double d = distanceKm(coordonnees(m), b);
                info.put("idMission", m.getIdMission());
                info.put("titre", m.getTitre());
                info.put("description", tronquer(m.getDescription(), 400));
                info.put("association", m.getAssociation().getNom());
                info.put("ville", Objects.toString(m.getAssociation().getVille(), ""));
                info.put("aDistance", coordonnees(m) == null && (m.getAdresse() == null || m.getAdresse().isBlank()));
                info.put("distanceKm", d == null ? "inconnue" : Math.round(d * 10) / 10.0);
                info.put("competencesRequises", m.getCompetences().stream().map(Competence::getNom).toList());
                info.put("placesRestantes", missionPlacesService.placesRestantes(m));
                info.put("renfortUrgent", m.getStatut() == StatutMission.RENFORT_URGENT);
                info.put("dateDebut", NotificationService.formaterDate(m.getDateDebut()));
                missions.add(info);
            }
            return new Demande(profil, missions);
        });
        if (demande == null) return;

        // 2. Appel à l'IA hors transaction
        Optional<List<GeminiService.ScoreIA>> scores = geminiService.scorer(demande.benevole(), demande.missions());
        if (scores.isEmpty()) return;

        // 3. Enregistrement (méthode IA)
        nouvelleTransaction.executeWithoutResult(tx -> {
            Map<Long, ScoreMatching> existants = scoreMatchingRepository.findByBenevole_IdUtilisateur(benevoleId).stream()
                    .collect(Collectors.toMap(s -> s.getMission().getIdMission(), s -> s, (x, y) -> x));
            for (GeminiService.ScoreIA ia : scores.get()) {
                ScoreMatching sm = existants.get(ia.idMission());
                if (sm == null) continue;
                sm.setScore(ia.score());
                sm.setExplication(ia.explication());
                sm.setMethode(MethodeScore.IA);
                sm.setDateCalcul(LocalDateTime.now());
            }
        });
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    private record Contexte(List<Mission> candidates, Set<Long> competences,
                            Set<Long> associationsAidees, List<String> nomsAssociationsAidees) {}

    /** Missions recommandables pour ce bénévole et données de son historique. */
    private Contexte contexte(Benevole b) {
        LocalDateTime now = LocalDateTime.now();
        List<Inscription> historique = inscriptionRepository
                .findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(b.getIdUtilisateur());
        Set<Long> dejaInscrit = historique.stream()
                .filter(i -> i.getStatut() == StatutInscription.CONFIRMEE || i.getStatut() == StatutInscription.EN_LISTE_ATTENTE)
                .map(i -> i.getMission().getIdMission()).collect(Collectors.toSet());
        List<Mission> confirmees = historique.stream().filter(i -> i.getStatut() == StatutInscription.CONFIRMEE)
                .map(Inscription::getMission).toList();

        List<Mission> candidates = missionRepository.findAll().stream()
                .filter(m -> m.getStatut() == StatutMission.PUBLIEE || m.getStatut() == StatutMission.RENFORT_URGENT)
                .filter(m -> !Boolean.TRUE.equals(m.getEstMasquee()) && !Boolean.TRUE.equals(m.getEstSignalee()))
                .filter(m -> m.getDateDebut() != null && m.getDateDebut().isAfter(now))
                .filter(m -> m.getAssociation() != null && m.getAssociation().getStatut() == StatutUtilisateur.ACTIF)
                .filter(m -> !dejaInscrit.contains(m.getIdMission()))
                .filter(m -> !chevauche(m, confirmees))   // RM04
                .toList();

        Map<Long, String> aidees = new LinkedHashMap<>();
        certificatRepository.findAvecMissionByBenevole(b.getIdUtilisateur()).forEach(c -> {
            Association a = c.getInscription().getMission().getAssociation();
            aidees.put(a.getIdUtilisateur(), a.getNom());
        });

        return new Contexte(candidates,
                b.getCompetences().stream().map(Competence::getId).collect(Collectors.toSet()),
                aidees.keySet(), new ArrayList<>(aidees.values()));
    }

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

    /** Distance à vol d'oiseau (Haversine) ; null si une position manque. */
    private static Double distanceKm(double[] mission, Benevole b) {
        if (mission == null || b.getLatitude() == null || b.getLongitude() == null) return null;
        double dLat = Math.toRadians(b.getLatitude() - mission[0]);
        double dLon = Math.toRadians(b.getLongitude() - mission[1]);
        double h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(Math.toRadians(mission[0]))
                * Math.cos(Math.toRadians(b.getLatitude())) * Math.pow(Math.sin(dLon / 2), 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    private static String tronquer(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }
}
