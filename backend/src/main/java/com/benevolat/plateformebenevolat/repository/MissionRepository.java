package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {

    @Query("SELECT DISTINCT m.association.ville FROM Mission m WHERE m.association.ville IS NOT NULL AND m.statut NOT IN ('BROUILLON', 'ANNULEE') ORDER BY m.association.ville")
    List<String> findDistinctVilles();

    @Query("SELECT DISTINCT d.nom FROM Domaine d ORDER BY d.nom")
    List<String> findDistinctDomaines();

    @Query("SELECT m FROM Mission m WHERE m.statut NOT IN ('BROUILLON', 'ANNULEE') " +
            "AND (:query IS NULL OR :query = '' OR LOWER(m.titre) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:ville IS NULL OR :ville = '' OR LOWER(m.association.ville) = LOWER(:ville)) " +
            "AND (:domaine IS NULL OR :domaine = '' OR LOWER(m.domaine.nom) = LOWER(:domaine)) " +
            "ORDER BY m.idMission DESC")
    List<Mission> searchPublicMissions(@Param("query") String query,
                                      @Param("ville") String ville,
                                      @Param("domaine") String domaine);

    List<Mission> findTop4ByStatutNotInOrderByIdMissionDesc(List<StatutMission> statuts);

    @Query("SELECT m FROM Mission m WHERE m.titre = :titre AND m.idMission <> :excludeId ORDER BY m.dateDebut DESC")
    List<Mission> findEditionsPrecedentes(@Param("titre") String titre, @Param("excludeId") Long excludeId);

    @Query("SELECT COALESCE(SUM(m.nbPlaces), 0) FROM Mission m WHERE m.statut NOT IN ('BROUILLON', 'ANNULEE')")
    Long sumTotalNbPlaces();
}
