package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.NotificationDto;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.AdministrateurRepository;
import com.benevolat.plateformebenevolat.repository.NotificationRepository;
import com.benevolat.plateformebenevolat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * Point d'entrée unique des notifications (F28-F31).
 *
 * Chaque événement crée une notification dans l'application (centre de notifications)
 * puis, si demandé et si l'utilisateur ne l'a pas désactivé, envoie un e-mail à partir
 * d'un template Java (EmailTemplates), après le commit de la transaction et en arrière-plan,
 * pour ne jamais bloquer ni faire échouer l'opération métier (NF07).
 *
 * Les e-mails rédigés par l'IA (rappel 24 h, renfort, résumé hebdomadaire) sont envoyés
 * par les workflows n8n — voir N8nController et le dossier n8n/ à la racine du projet.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AdministrateurRepository administrateurRepository;
    private final EmailService emailService;
    private final EmailTemplates emailTemplates;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'à' HH'h'mm", Locale.FRENCH);

    /** Envois e-mail en arrière-plan (threads virtuels Java 21). */
    private final ExecutorService envois = Executors.newVirtualThreadPerTaskExecutor();

    /** E-mails toujours envoyés, même si l'utilisateur a désactivé les e-mails (compte, validation, annulation). */
    private static final Set<CategorieNotif> NON_DESACTIVABLES =
            EnumSet.of(CategorieNotif.COMPTE, CategorieNotif.VALIDATION, CategorieNotif.MISSION_ANNULEE);

    /* ─── Émission ─────────────────────────────────────────────────────────── */

    /** Notification dans l'application + e-mail. */
    @Transactional
    public void notifier(Utilisateur destinataire, CategorieNotif categorie,
                         String titre, String message, String lien) {
        notifier(destinataire, categorie, titre, message, lien, null, true);
    }

    /** Notification + e-mail avec un encadré récapitulatif (mission, date, lieu…). */
    @Transactional
    public void notifier(Utilisateur destinataire, CategorieNotif categorie,
                         String titre, String message, String lien, Map<String, String> details) {
        notifier(destinataire, categorie, titre, message, lien, details, true);
    }

    /** email = false : notification dans l'application uniquement. */
    @Transactional
    public void notifier(Utilisateur destinataire, CategorieNotif categorie,
                         String titre, String message, String lien, boolean email) {
        notifier(destinataire, categorie, titre, message, lien, null, email);
    }

    @Transactional
    public void notifier(Utilisateur destinataire, CategorieNotif categorie, String titre, String message,
                         String lien, Map<String, String> details, boolean email) {
        if (destinataire == null) return;

        Notification n = new Notification(destinataire, TypeNotif.NOTIF_PUSH, tronquer(titre, 200), message);
        n.setCategorie(categorie);
        n.setLien(lien);
        n = notificationRepository.save(n);

        if (email && emailAutorise(destinataire, categorie)) {
            Long id = n.getIdNotification();
            String to = destinataire.getEmail();
            String nom = nomAffiche(destinataire);
            String html = emailTemplates.render(categorie, nom, titre, message, lien, details);
            apresCommit(() -> envois.execute(() -> envoyer(id, to, titre, html)));
        }
    }

    /** Notifie tous les administrateurs (dans l'application uniquement). */
    @Transactional
    public void notifierAdmins(CategorieNotif categorie, String titre, String message, String lien) {
        administrateurRepository.findAll()
                .forEach(admin -> notifier(admin, categorie, titre, message, lien, false));
    }

    private void envoyer(Long notificationId, String to, String titre, String html) {
        boolean ok = emailService.trySendHtml(to, "CountMeIn — " + titre, html);
        notificationRepository.majStatutEnvoi(notificationId, ok ? StatutEnvoi.ENVOYE : StatutEnvoi.ECHEC);
    }

    /* ─── Centre de notifications (F30) ────────────────────────────────────── */

    @Transactional(readOnly = true)
    public List<NotificationDto> lister(String email) {
        Utilisateur u = charger(email);
        return notificationRepository.findTop100ByUtilisateur_IdUtilisateurOrderByCreatedAtDesc(u.getIdUtilisateur())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long compterNonLues(String email) {
        return notificationRepository.countByUtilisateur_IdUtilisateurAndLueFalse(charger(email).getIdUtilisateur());
    }

    @Transactional
    public void marquerLue(String email, Long id) {
        Notification n = notificationRepository
                .findByIdNotificationAndUtilisateur_IdUtilisateur(id, charger(email).getIdUtilisateur())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable."));
        n.setLue(true);
    }

    @Transactional
    public void marquerToutesLues(String email) {
        notificationRepository.marquerToutesLues(charger(email).getIdUtilisateur());
    }

    @Transactional
    public void supprimer(String email, Long id) {
        Notification n = notificationRepository
                .findByIdNotificationAndUtilisateur_IdUtilisateur(id, charger(email).getIdUtilisateur())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable."));
        notificationRepository.delete(n);
    }

    /* ─── Préférences (F31) ────────────────────────────────────────────────── */

    /** Préférence unique : e-mails activés ou non (Utilisateur.notifEstActive). */
    @Transactional(readOnly = true)
    public Map<String, Object> getPreferences(String email) {
        return Map.of("emailActif", !Boolean.FALSE.equals(charger(email).getNotifEstActive()));
    }

    @Transactional
    public Map<String, Object> majPreferences(String email, boolean emailActif) {
        Utilisateur u = charger(email);
        u.setNotifEstActive(emailActif);
        userRepository.save(u);
        return Map.of("emailActif", emailActif);
    }

    /* ─── Helpers ──────────────────────────────────────────────────────────── */

    private boolean emailAutorise(Utilisateur u, CategorieNotif categorie) {
        return NON_DESACTIVABLES.contains(categorie) || !Boolean.FALSE.equals(u.getNotifEstActive());
    }

    private Utilisateur charger(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(n.getIdNotification(), n.getCategorie().name(), n.getTitre(), n.getMessage(),
                n.getLien(), Boolean.TRUE.equals(n.getLue()), n.getCreatedAt());
    }

    public static String nomAffiche(Utilisateur u) {
        if (u instanceof Benevole b) {
            String p = b.getPrenom() != null ? b.getPrenom() : "";
            return p.isBlank() ? (b.getNom() != null ? b.getNom() : "") : p;
        }
        if (u instanceof Association a) return a.getNom();
        return "Administrateur";
    }

    /** Exécute l'action après le commit (les données sont alors visibles et l'opération est validée). */
    private static void apresCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    private static String tronquer(String s, int max) {
        return s == null ? "" : (s.length() <= max ? s : s.substring(0, max - 1) + "…");
    }

    /** Encadré récapitulatif standard d'une mission (utilisé par les e-mails des bénévoles). */
    public static Map<String, String> detailsMission(Mission m) {
        Map<String, String> d = new LinkedHashMap<>();
        d.put("Mission", m.getTitre());
        if (m.getAssociation() != null) d.put("Association", m.getAssociation().getNom());
        if (m.getDateDebut() != null) d.put("Date", formaterDate(m.getDateDebut()));
        if (m.getAdresse() != null) d.put("Lieu", m.getAdresse());
        return d;
    }

    public static String formaterDate(LocalDateTime date) {
        String txt = date.format(DATE_FMT);
        return Character.toUpperCase(txt.charAt(0)) + txt.substring(1);
    }
}
