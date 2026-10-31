package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.AdminDtos.*;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Espace administrateur : statistiques globales (F34), validation des associations (F39),
 * gestion des comptes (F40) et modération des missions (F41).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private static final Set<StatutMission> STATUTS_ACTIFS = EnumSet.of(
            StatutMission.PUBLIEE, StatutMission.SATUREE, StatutMission.EN_COURS, StatutMission.RENFORT_URGENT);

    private final UserRepository userRepository;
    private final AssociationRepository associationRepository;
    private final AdministrateurRepository administrateurRepository;
    private final MissionRepository missionRepository;
    private final InscriptionRepository inscriptionRepository;
    private final CertificatRepository certificatRepository;
    private final NotificationService notificationService;

    /* ─── Statistiques (F34) ───────────────────────────────────────────────── */

    @Transactional(readOnly = true)
    public Stats getStats() {
        List<Utilisateur> users = userRepository.findAll();
        List<Mission> missions = missionRepository.findAll();
        List<Inscription> inscriptions = inscriptionRepository.findAll();

        List<Benevole> benevoles = users.stream().filter(u -> u instanceof Benevole).map(u -> (Benevole) u).toList();
        List<Association> assos = users.stream().filter(u -> u instanceof Association).map(u -> (Association) u).toList();
        List<Mission> visibles = missions.stream().filter(m -> m.getStatut() != StatutMission.BROUILLON).toList();

        Map<String, Long> parStatut = new LinkedHashMap<>();
        for (StatutMission s : StatutMission.values()) {
            parStatut.put(s.name(), missions.stream().filter(m -> m.getStatut() == s).count());
        }

        return new Stats(
                benevoles.size(),
                assos.size(),
                assos.stream().filter(a -> a.getStatutValidation() == StatutValidation.EN_ATTENTE).count(),
                users.stream().filter(u -> u.getStatut() != StatutUtilisateur.ACTIF).count(),
                visibles.size(),
                missions.stream().filter(m -> STATUTS_ACTIFS.contains(m.getStatut())).count(),
                missions.stream().filter(m -> Boolean.TRUE.equals(m.getEstSignalee())).count(),
                inscriptions.size(),
                inscriptions.stream().filter(i -> i.getStatut() == StatutInscription.CONFIRMEE).count(),
                inscriptions.stream().filter(i -> i.getStatut() == StatutInscription.EN_LISTE_ATTENTE).count(),
                certificatRepository.count(),
                parStatut,
                top(visibles, m -> m.getAssociation() != null ? m.getAssociation().getVille() : null, 8),
                top(visibles, m -> m.getDomaine() != null ? m.getDomaine().getNom() : null, 10),
                top(benevoles, Benevole::getVille, 8),
                parMois(inscriptions.stream().map(Inscription::getDateInscription).toList()),
                parMois(users.stream().map(Utilisateur::getCreatedAt).toList())
        );
    }

    /** Regroupe, compte et garde les n premiers (le reste est cumulé dans « Autres »). */
    private static <T> List<Serie> top(List<T> items, Function<T, String> cle, int n) {
        Map<String, Long> counts = items.stream()
                .map(cle)
                .map(v -> v == null || v.isBlank() ? "Non renseigné" : v.trim())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        List<Map.Entry<String, Long>> tries = counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .toList();
        List<Serie> res = new ArrayList<>(tries.stream().limit(n).map(e -> new Serie(e.getKey(), e.getValue())).toList());
        long autres = tries.stream().skip(n).mapToLong(Map.Entry::getValue).sum();
        if (autres > 0) res.add(new Serie("Autres", autres));
        return res;
    }

    /** Nombre d'éléments par mois sur les 6 derniers mois. */
    private static List<Serie> parMois(List<LocalDateTime> dates) {
        YearMonth courant = YearMonth.now();
        List<Serie> res = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = courant.minusMonths(i);
            long n = dates.stream().filter(Objects::nonNull).filter(d -> YearMonth.from(d).equals(ym)).count();
            String label = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRENCH) + " " + (ym.getYear() % 100);
            res.add(new Serie(label, n));
        }
        return res;
    }

    /* ─── Associations (F39) ───────────────────────────────────────────────── */

    @Transactional(readOnly = true)
    public List<AssociationAdmin> getAssociations(String statut) {
        Map<Long, Long> missionsParAsso = missionRepository.findAll().stream()
                .filter(m -> m.getAssociation() != null)
                .collect(Collectors.groupingBy(m -> m.getAssociation().getIdUtilisateur(), Collectors.counting()));
        return associationRepository.findAll().stream()
                .filter(a -> statut == null || statut.isBlank() || a.getStatutValidation().name().equalsIgnoreCase(statut))
                .sorted(Comparator.comparing(Association::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(a -> new AssociationAdmin(
                        a.getIdUtilisateur(), a.getNom(), a.getEmail(), a.getVille(), a.getContact(),
                        a.getDescription(), a.getPhotoProfil(),
                        a.getDomaines().stream().map(Domaine::getNom).toList(),
                        a.getStatutValidation().name(), a.getMotifRefus(),
                        a.getStatut() != null ? a.getStatut().name() : "ACTIF",
                        missionsParAsso.getOrDefault(a.getIdUtilisateur(), 0L),
                        a.getCreatedAt()))
                .toList();
    }

    public AssociationAdmin validerAssociation(String emailAdmin, Long id) {
        Association a = chargerAssociation(id);
        a.setStatutValidation(StatutValidation.VALIDE);
        a.setMotifRefus(null);
        a.setAdministrateur(chargerAdmin(emailAdmin));
        notificationService.notifier(a, CategorieNotif.VALIDATION,
                "Votre association est validée !",
                "Bonne nouvelle : l'équipe CountMeIn a validé « " + a.getNom()
                        + " ». Vous pouvez maintenant publier vos missions.",
                "/association");
        return trouver(getAssociations(null), id);
    }

    public AssociationAdmin refuserAssociation(String emailAdmin, Long id, String motif) {
        if (motif == null || motif.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le motif du refus est obligatoire.");
        }
        Association a = chargerAssociation(id);
        a.setStatutValidation(StatutValidation.REFUSE);
        a.setMotifRefus(motif.trim());
        a.setAdministrateur(chargerAdmin(emailAdmin));
        notificationService.notifier(a, CategorieNotif.VALIDATION,
                "Votre demande d'inscription a été refusée",
                "L'équipe CountMeIn n'a pas pu valider « " + a.getNom() + " ».\nMotif : " + motif.trim()
                        + "\nVous pouvez compléter votre profil puis nous contacter.",
                "/association/profil");
        return trouver(getAssociations(null), id);
    }

    /* ─── Comptes (F40) ────────────────────────────────────────────────────── */

    @Transactional(readOnly = true)
    public List<UtilisateurAdmin> getUtilisateurs(String role, String q) {
        String recherche = q == null ? "" : q.trim().toLowerCase();
        return userRepository.findAll().stream()
                .filter(u -> role == null || role.isBlank() || u.getRole().name().equalsIgnoreCase(role))
                .map(this::toUtilisateurAdmin)
                .filter(u -> recherche.isEmpty()
                        || u.email().toLowerCase().contains(recherche)
                        || (u.nom() != null && u.nom().toLowerCase().contains(recherche))
                        || (u.ville() != null && u.ville().toLowerCase().contains(recherche)))
                .sorted(Comparator.comparing(UtilisateurAdmin::createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public UtilisateurAdmin changerStatutCompte(String emailAdmin, Long id, boolean suspendre, String motif) {
        Utilisateur u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
        if (u instanceof Administrateur) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un compte administrateur ne peut pas être suspendu.");
        }
        if (u.getEmail().equalsIgnoreCase(emailAdmin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous ne pouvez pas modifier votre propre compte.");
        }
        u.setStatut(suspendre ? StatutUtilisateur.SUSPENDUE : StatutUtilisateur.ACTIF);
        notificationService.notifier(u, CategorieNotif.COMPTE,
                suspendre ? "Votre compte a été suspendu" : "Votre compte a été réactivé",
                suspendre
                        ? "Votre compte CountMeIn a été suspendu par l'équipe de modération."
                                + (motif != null && !motif.isBlank() ? "\nMotif : " + motif.trim() : "")
                                + "\nVos données et votre historique sont conservés."
                        : "Votre compte CountMeIn est de nouveau actif. Vous pouvez vous reconnecter.",
                null);
        return toUtilisateurAdmin(u);
    }

    private UtilisateurAdmin toUtilisateurAdmin(Utilisateur u) {
        String nom = null, ville = null, photo = u.getPhotoProfil(), validation = null;
        if (u instanceof Benevole b) {
            nom = ((b.getPrenom() != null ? b.getPrenom() + " " : "") + (b.getNom() != null ? b.getNom() : "")).trim();
            ville = b.getVille();
            if (b.getPhotoUrl() != null && !b.getPhotoUrl().isBlank()) photo = b.getPhotoUrl();
        } else if (u instanceof Association a) {
            nom = a.getNom();
            ville = a.getVille();
            validation = a.getStatutValidation().name();
        } else {
            nom = "Administrateur";
        }
        return new UtilisateurAdmin(u.getIdUtilisateur(), u.getEmail(), u.getRole().name(), nom, ville, photo,
                u.getStatut() != null ? u.getStatut().name() : "ACTIF", validation, u.getCreatedAt());
    }

    /* ─── Modération des missions (F41) ────────────────────────────────────── */

    @Transactional(readOnly = true)
    public List<MissionAdmin> getMissions(String filtre) {
        Map<Long, Long> inscrits = inscriptionRepository.findAll().stream()
                .filter(i -> i.getStatut() == StatutInscription.CONFIRMEE)
                .collect(Collectors.groupingBy(i -> i.getMission().getIdMission(), Collectors.counting()));
        return missionRepository.findAll().stream()
                .filter(m -> m.getStatut() != StatutMission.BROUILLON)
                .filter(m -> switch (filtre == null ? "" : filtre) {
                    case "signalees" -> Boolean.TRUE.equals(m.getEstSignalee());
                    case "masquees" -> Boolean.TRUE.equals(m.getEstMasquee());
                    default -> true;
                })
                // Signalées d'abord, puis les plus récentes
                .sorted(Comparator.comparing((Mission m) -> !Boolean.TRUE.equals(m.getEstSignalee()))
                        .thenComparing(Mission::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(m -> toMissionAdmin(m, inscrits.getOrDefault(m.getIdMission(), 0L)))
                .toList();
    }

    public MissionAdmin masquerMission(Long id, String motif) {
        Mission m = chargerMission(id);
        m.setEstMasquee(true);
        m.setEstSignalee(false);
        notificationService.notifier(m.getAssociation(), CategorieNotif.MODERATION,
                "Mission masquée par la modération",
                "Votre mission « " + m.getTitre() + " » a été masquée et n'est plus visible du public."
                        + (motif != null && !motif.isBlank() ? "\nMotif : " + motif.trim() : "")
                        + "\nContactez l'équipe CountMeIn pour plus d'informations.",
                "/association/missions");
        return toMissionAdmin(m, compterInscrits(m));
    }

    public MissionAdmin retablirMission(Long id) {
        Mission m = chargerMission(id);
        boolean etaitMasquee = Boolean.TRUE.equals(m.getEstMasquee());
        m.setEstMasquee(false);
        m.setEstSignalee(false);
        m.setMotifSignalement(null);
        if (etaitMasquee) {
            notificationService.notifier(m.getAssociation(), CategorieNotif.MODERATION,
                    "Mission rétablie",
                    "Votre mission « " + m.getTitre() + " » est de nouveau visible du public.",
                    "/association/missions");
        }
        return toMissionAdmin(m, compterInscrits(m));
    }

    /** Signalement d'une mission par un utilisateur connecté (déclenche la modération). */
    public void signalerMission(String emailSignaleur, Long id, String motif) {
        if (motif == null || motif.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Merci d'indiquer le motif du signalement.");
        }
        Mission m = chargerMission(id);
        m.setEstSignalee(true);
        m.setMotifSignalement(motif.trim().length() > 500 ? motif.trim().substring(0, 500) : motif.trim());
        notificationService.notifierAdmins(CategorieNotif.MODERATION,
                "Mission signalée",
                "La mission « " + m.getTitre() + " » (" + m.getAssociation().getNom() + ") a été signalée par "
                        + emailSignaleur + ".\nMotif : " + m.getMotifSignalement(),
                "/admin/missions");
    }

    private MissionAdmin toMissionAdmin(Mission m, long nbInscrits) {
        Association a = m.getAssociation();
        return new MissionAdmin(m.getIdMission(), m.getTitre(), m.getDescription(),
                a != null ? a.getNom() : null, a != null ? a.getIdUtilisateur() : null,
                a != null ? a.getVille() : null,
                m.getDomaine() != null ? m.getDomaine().getNom() : null,
                m.getStatut().name(), Boolean.TRUE.equals(m.getEstSignalee()), m.getMotifSignalement(),
                Boolean.TRUE.equals(m.getEstMasquee()), m.getDateDebut(), m.getDateFin(), nbInscrits, m.getCreatedAt());
    }

    private long compterInscrits(Mission m) {
        return inscriptionRepository.countByMission_IdMissionAndStatut(m.getIdMission(), StatutInscription.CONFIRMEE);
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    private Association chargerAssociation(Long id) {
        return associationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable."));
    }

    private Mission chargerMission(Long id) {
        return missionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable."));
    }

    private Administrateur chargerAdmin(String email) {
        return administrateurRepository.findByEmail(email).orElse(null);
    }

    private static AssociationAdmin trouver(List<AssociationAdmin> liste, Long id) {
        return liste.stream().filter(a -> a.id().equals(id)).findFirst().orElse(null);
    }
}
