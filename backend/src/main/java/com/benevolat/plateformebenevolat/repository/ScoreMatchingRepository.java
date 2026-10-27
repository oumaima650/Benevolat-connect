package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.ScoreMatching;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScoreMatchingRepository extends JpaRepository<ScoreMatching, Long> {

    @Query("""
            SELECT sm FROM ScoreMatching sm
            JOIN FETCH sm.mission m
            JOIN FETCH m.association a
            JOIN FETCH m.domaine d
            WHERE sm.benevole.idUtilisateur = :benevoleId
              AND m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.PUBLIEE
              AND m.estSignalee = false
              AND a.statut = com.benevolat.plateformebenevolat.entity.StatutUtilisateur.ACTIF
              AND m.dateDebut > :now
              AND NOT EXISTS (
                    SELECT 1 FROM Inscription i
                    WHERE i.benevole.idUtilisateur = :benevoleId
                      AND i.mission.idMission = m.idMission
                      AND i.statut IN (
                            com.benevolat.plateformebenevolat.entity.StatutInscription.CONFIRMEE,
                            com.benevolat.plateformebenevolat.entity.StatutInscription.EN_LISTE_ATTENTE
                      )
              )
              AND NOT EXISTS (
                    SELECT 1 FROM Inscription i2
                    JOIN i2.mission m2
                    WHERE i2.benevole.idUtilisateur = :benevoleId
                      AND i2.statut = com.benevolat.plateformebenevolat.entity.StatutInscription.CONFIRMEE
                      AND m2.dateDebut < m.dateFin
                      AND m2.dateFin > m.dateDebut
              )
            ORDER BY sm.score DESC
            """)
    List<ScoreMatching> findRecommandationsValides(@Param("benevoleId") Long benevoleId,
                                                   @Param("now") LocalDateTime now);
}
