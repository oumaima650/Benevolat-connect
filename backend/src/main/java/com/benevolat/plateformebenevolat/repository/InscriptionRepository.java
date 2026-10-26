package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    /** Récupère l'inscription d'un bénévole pour une mission donnée (tous statuts). */
    Optional<Inscription> findByBenevole_IdUtilisateurAndMission_IdMission(Long benevoleId, Long missionId);

    /** Liste les inscriptions d'un statut donné pour une mission, triées par rang croissant. */
    List<Inscription> findByMission_IdMissionAndStatutOrderByRangAsc(Long missionId, StatutInscription statut);

    /** Liste toutes les inscriptions d'un bénévole, triées par date d'inscription décroissante. */
    List<Inscription> findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(Long benevoleId);

    /** Liste toutes les inscriptions d'une mission, triées par dateInscription. */
    @Query("SELECT i FROM Inscription i JOIN FETCH i.benevole b LEFT JOIN FETCH b.competences " +
           "WHERE i.mission.idMission = :missionId ORDER BY i.statut ASC, i.rang ASC NULLS LAST")
    List<Inscription> findByMission_IdMissionWithBenevole(@Param("missionId") Long missionId);

    /** F29 : inscriptions confirmées à rappeler (mission qui commence dans la fenêtre, rappel non envoyé). */
    @Query("SELECT i FROM Inscription i JOIN FETCH i.mission m JOIN FETCH i.benevole " +
           "WHERE i.statut = com.benevolat.plateformebenevolat.entity.StatutInscription.CONFIRMEE " +
           "AND i.rappelEnvoye = false AND m.dateDebut > :debut AND m.dateDebut <= :fin " +
           "AND m.statut NOT IN (com.benevolat.plateformebenevolat.entity.StatutMission.ANNULEE, " +
           "com.benevolat.plateformebenevolat.entity.StatutMission.BROUILLON)")
    List<Inscription> findARappeler(@Param("debut") java.time.LocalDateTime debut,
                                    @Param("fin") java.time.LocalDateTime fin);

    /** Compte les inscriptions CONFIRMEE pour une mission. */
    long countByMission_IdMissionAndStatut(Long missionId, StatutInscription statut);
    @Query("SELECT COUNT(i) > 0 FROM Inscription i " +
            "WHERE i.benevole.idUtilisateur = :benevoleId AND i.mission.idMission = :missionId " +
            "AND i.statut IN (:statuts)")
    boolean existsActive(@Param("benevoleId") Long benevoleId,
                         @Param("missionId") Long missionId,
                         @Param("statuts") List<StatutInscription> statuts);
}
