package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {

    @Query(value = "SELECT * FROM mission WHERE id_mission = :id FOR UPDATE", nativeQuery = true)
    Optional<Mission> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT DISTINCT m.association.ville FROM Mission m WHERE m.association.ville IS NOT NULL AND m.statut NOT IN ('BROUILLON', 'ANNULEE') ORDER BY m.association.ville")
    List<String> findDistinctVilles();

    @Query("SELECT DISTINCT d.nom FROM Domaine d ORDER BY d.nom")
    List<String> findDistinctDomaines();

    @Query("SELECT m FROM Mission m WHERE m.statut NOT IN ('BROUILLON', 'ANNULEE') AND m.estMasquee = false " +
            "AND (:query IS NULL OR :query = '' OR LOWER(m.titre) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:ville IS NULL OR :ville = '' OR LOWER(m.association.ville) = LOWER(:ville)) " +
            "AND (:domaine IS NULL OR :domaine = '' OR LOWER(m.domaine.nom) = LOWER(:domaine)) " +
            "ORDER BY m.idMission DESC")
    List<Mission> searchPublicMissions(@Param("query") String query,
                                      @Param("ville") String ville,
                                      @Param("domaine") String domaine);

    List<Mission> findTop4ByStatutNotInAndEstMasqueeFalseOrderByIdMissionDesc(List<StatutMission> statuts);

    @Query("SELECT m FROM Mission m WHERE m.titre = :titre AND m.idMission <> :excludeId ORDER BY m.dateDebut DESC")
    List<Mission> findEditionsPrecedentes(@Param("titre") String titre, @Param("excludeId") Long excludeId);

    @Query("SELECT COALESCE(SUM(m.nbPlaces), 0) FROM Mission m WHERE m.statut NOT IN ('BROUILLON', 'ANNULEE')")
    Long sumTotalNbPlaces();

    List<Mission> findByAssociationIdUtilisateurOrderByDateDebutDesc(Long associationId);

    /** Passe en EN_COURS toutes les missions dont dateDebut <= now et statut dans la liste. */
    @Modifying
    @Query("UPDATE Mission m SET m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.EN_COURS " +
           "WHERE m.statut IN :statuts AND m.dateDebut <= :now")
    int passerEnCours(@Param("statuts") List<StatutMission> statuts, @Param("now") LocalDateTime now);

    /** Missions qui vont passer en TERMINEE (pour prévenir les associations). */
    List<Mission> findByStatutInAndDateFinLessThanEqual(List<StatutMission> statuts, LocalDateTime now);

    /** Passe en TERMINEE toutes les missions dont dateFin <= now et statut dans la liste. */
    @Modifying
    @Query("UPDATE Mission m SET m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.TERMINEE " +
           "WHERE m.statut IN :statuts AND m.dateFin <= :now")
    int passerEnTerminee(@Param("statuts") List<StatutMission> statuts, @Param("now") LocalDateTime now);
}
