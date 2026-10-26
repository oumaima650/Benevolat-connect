package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.entity.CategorieNotif;
import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * F29 : rappel automatique avant chaque mission aux inscrits confirmés (un seul par inscription).
 *
 * - n8n désactivé : le backend envoie tous les rappels 24 h avant (template Java).
 * - n8n activé : le workflow « Rappel 24 h » rédige et envoie les rappels (IA). Le backend ne traite que
 *   les bénévoles qui ont coupé les e-mails (notification dans l'app) et, en secours (NF07),
 *   les rappels encore non envoyés 3 h avant le début (n8n en panne).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RappelService {

    private static final int HEURES_SECOURS_N8N = 3;

    private final InscriptionRepository inscriptionRepository;
    private final NotificationService notificationService;
    private final N8nService n8nService;

    /** Toutes les 15 minutes. */
    @Scheduled(fixedDelay = 15 * 60_000, initialDelay = 60_000)
    @Transactional
    public void envoyerRappels() {
        LocalDateTime now = LocalDateTime.now();
        boolean viaN8n = n8nService.actif();

        List<Inscription> aRappeler = inscriptionRepository.findARappeler(now, now.plusHours(24)).stream()
                .filter(i -> !viaN8n
                        || Boolean.FALSE.equals(i.getBenevole().getNotifEstActive())
                        || !i.getMission().getDateDebut().isAfter(now.plusHours(HEURES_SECOURS_N8N)))
                .toList();

        for (Inscription i : aRappeler) {
            var m = i.getMission();
            notificationService.notifier(i.getBenevole(), CategorieNotif.RAPPEL,
                    "Rappel : votre mission commence bientôt",
                    "La mission « " + m.getTitre() + " » commence "
                            + NotificationService.formaterDate(m.getDateDebut()).toLowerCase(Locale.FRENCH)
                            + ". Merci de prévenir l'association si vous ne pouvez plus venir.",
                    "/missions/" + m.getIdMission(), NotificationService.detailsMission(m));
            i.setRappelEnvoye(true);
        }
        if (!aRappeler.isEmpty()) {
            log.info("Rappels envoyés par le backend : {}{}", aRappeler.size(), viaN8n ? " (secours n8n)" : "");
        }
    }
}
