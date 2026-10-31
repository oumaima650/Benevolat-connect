package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.entity.CategorieNotif;
import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import com.benevolat.plateformebenevolat.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler qui met à jour automatiquement les statuts des missions selon le temps.
 * - PUBLIEE / SATUREE                  → EN_COURS quand dateDebut est passée
 *   (RENFORT_URGENT reste tel quel tant que le renfort n'est pas comblé)
 * - EN_COURS / RENFORT_URGENT          → TERMINEE  quand dateFin est passée (e-mail à l'association)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MissionSchedulerService {

    private final MissionRepository missionRepository;
    private final MissionPlacesService missionPlacesService;
    private final NotificationService notificationService;

    /**
     * Toutes les minutes : démarrer les missions dont la date de début est passée.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void demarrerMissions() {
        LocalDateTime now = LocalDateTime.now();

        List<StatutMission> statutsOuverts = List.of(
                StatutMission.PUBLIEE,
                StatutMission.SATUREE
        );

        int updated = missionRepository
                .passerEnCours(statutsOuverts, now);
        if (updated > 0) {
            log.info("Scheduler : {} mission(s) passée(s) en EN_COURS", updated);
        }
    }

    /**
     * Toutes les minutes : terminer les missions dont la date de fin est passée.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void terminerMissions() {
        LocalDateTime now = LocalDateTime.now();

        List<StatutMission> statutsEnCours = List.of(
                StatutMission.EN_COURS,
                StatutMission.RENFORT_URGENT
        );

        List<Mission> terminees = missionRepository.findByStatutInAndDateFinLessThanEqual(statutsEnCours, now);
        int updated = missionRepository.passerEnTerminee(statutsEnCours, now);
        if (updated > 0) {
            log.info("Scheduler : {} mission(s) passée(s) en TERMINEE", updated);
        }
        // L'association est invitée à valider les présences et à délivrer les certificats
        terminees.forEach(m -> {
            long participants = missionPlacesService.countConfirmes(m.getIdMission());
            notificationService.notifier(m.getAssociation(), CategorieNotif.CERTIFICAT,
                    "Mission terminée : pensez aux certificats",
                    "La mission « " + m.getTitre() + " » est terminée. Merci pour votre engagement !"
                            + (participants > 0
                                ? "\nValidez la présence de vos " + participants + " participant(s) et délivrez-leur"
                                        + " leur certificat de bénévolat depuis votre espace."
                                : ""),
                    "/association/certificats",
                    NotificationService.detailsMission(m));
        });
    }
}
