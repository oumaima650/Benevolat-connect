package com.benevolat.plateformebenevolat.service;

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
 * - PUBLIEE / SATUREE / RENFORT_URGENT → EN_COURS quand dateDebut est passée
 * - EN_COURS / RENFORT_URGENT          → TERMINEE  quand dateFin est passée
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MissionSchedulerService {

    private final MissionRepository missionRepository;

    /**
     * Toutes les minutes : démarrer les missions dont la date de début est passée.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void demarrerMissions() {
        LocalDateTime now = LocalDateTime.now();

        List<StatutMission> statutsOuverts = List.of(
                StatutMission.PUBLIEE,
                StatutMission.SATUREE,
                StatutMission.RENFORT_URGENT
        );

        int updated = missionRepositorycls
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

        int updated = missionRepository.passerEnTerminee(statutsEnCours, now);
        if (updated > 0) {
            log.info("Scheduler : {} mission(s) passée(s) en TERMINEE", updated);
        }
    }
}
