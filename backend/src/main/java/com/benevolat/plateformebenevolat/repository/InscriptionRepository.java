package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
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

    @Query("""
        SELECT DISTINCT i FROM Inscription i
        JOIN FETCH i.mission m
        LEFT JOIN FETCH m.domaine
        LEFT JOIN FETCH m.association
        WHERE i.benevole.idUtilisateur = :benevoleId
        ORDER BY i.dateInscription DESC
        """)
    List<Inscription> findDashboardInscriptions(@Param("benevoleId") Long benevoleId);

    /** Liste toutes les inscriptions d'une mission, triées par dateInscription. */
    @Query("SELECT i FROM Inscription i JOIN FETCH i.benevole b LEFT JOIN FETCH b.competences " +
           "WHERE i.mission.idMission = :missionId ORDER BY i.statut ASC, i.rang ASC NULLS LAST")
    List<Inscription> findByMission_IdMissionWithBenevole(@Param("missionId") Long missionId);

    /** Compte les inscriptions CONFIRMEE pour une mission. */
    long countByMission_IdMissionAndStatut(Long missionId, StatutInscription statut);
    @Query("SELECT COUNT(i) > 0 FROM Inscription i " +
            "WHERE i.benevole.idUtilisateur = :benevoleId AND i.mission.idMission = :missionId " +
            "AND i.statut IN (:statuts)")
    boolean existsActive(@Param("benevoleId") Long benevoleId,
                         @Param("missionId") Long missionId,
                         @Param("statuts") List<StatutInscription> statuts);

    List<Inscription> findByBenevole_IdUtilisateurAndMission_IdMissionIn(Long benevoleId, Collection<Long> missionIds);

    @Query("""
            SELECT COUNT(i) > 0 FROM Inscription i
            JOIN i.mission m
            WHERE i.benevole.idUtilisateur = :benevoleId
              AND i.statut = com.benevolat.plateformebenevolat.entity.StatutInscription.CONFIRMEE
              AND m.idMission <> :missionId
              AND m.dateDebut < :dateFin
              AND m.dateFin > :dateDebut
            """)
    boolean existsChevauchement(@Param("benevoleId") Long benevoleId,
                                @Param("missionId") Long missionId,
                                @Param("dateDebut") LocalDateTime dateDebut,
                                @Param("dateFin") LocalDateTime dateFin);

    @Query("""
            SELECT COUNT(i) FROM Inscription i
            WHERE i.benevole.idUtilisateur = :benevoleId
              AND i.statut = com.benevolat.plateformebenevolat.entity.StatutInscription.CONFIRMEE
              AND i.mission.statut IN (
                    com.benevolat.plateformebenevolat.entity.StatutMission.PUBLIEE,
                    com.benevolat.plateformebenevolat.entity.StatutMission.SATUREE
              )
              AND i.mission.dateDebut > :now
            """)
    long countInscriptionsAVenir(@Param("benevoleId") Long benevoleId, @Param("now") LocalDateTime now);

    @Query("""
            SELECT COUNT(i) FROM Inscription i
            WHERE i.benevole.idUtilisateur = :benevoleId
              AND i.statut = com.benevolat.plateformebenevolat.entity.StatutInscription.EN_LISTE_ATTENTE
              AND i.mission.statut IN (
                    com.benevolat.plateformebenevolat.entity.StatutMission.PUBLIEE,
                    com.benevolat.plateformebenevolat.entity.StatutMission.SATUREE,
                    com.benevolat.plateformebenevolat.entity.StatutMission.RENFORT_URGENT
              )
            """)
    long countEnListeAttenteExplorer(@Param("benevoleId") Long benevoleId);

    @Query("""
            SELECT COUNT(i) > 0 FROM Inscription i
            WHERE i.benevole.idUtilisateur = :benevoleId
              AND i.statut = com.benevolat.plateformebenevolat.entity.StatutInscription.EN_LISTE_ATTENTE
              AND i.mission.statut = com.benevolat.plateformebenevolat.entity.StatutMission.RENFORT_URGENT
            """)
    boolean existsRenfortEnListeAttente(@Param("benevoleId") Long benevoleId);

    @Query("""
            SELECT i FROM Inscription i
            JOIN FETCH i.mission m
            LEFT JOIN FETCH m.association
            WHERE i.benevole.idUtilisateur = :benevoleId
              AND i.statut = com.benevolat.plateformebenevolat.entity.StatutInscription.CONFIRMEE
              AND m.dateDebut > :now
            ORDER BY m.dateDebut ASC
            """)
    List<Inscription> findProchainesConfirmees(@Param("benevoleId") Long benevoleId,
                                               @Param("now") LocalDateTime now);
}
