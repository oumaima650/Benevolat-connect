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

    @Query("SELECT DISTINCT m.ville FROM Mission m WHERE m.ville IS NOT NULL AND m.statut NOT IN ('BROUILLON', 'ANNULEE') ORDER BY m.ville")
    List<String> findDistinctVilles();

    @Query("SELECT DISTINCT m.domaine FROM Mission m WHERE m.domaine IS NOT NULL AND m.statut NOT IN ('BROUILLON', 'ANNULEE') ORDER BY m.domaine")
    List<String> findDistinctDomaines();

    @Query("SELECT m FROM Mission m WHERE m.statut NOT IN ('BROUILLON', 'ANNULEE') ORDER BY m.id DESC")
    List<List<Mission>> findPublicMissions();

    @Query("SELECT m FROM Mission m WHERE m.statut NOT IN ('BROUILLON', 'ANNULEE') " +
            "AND (:query IS NULL OR :query = '' OR LOWER(m.titre) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:ville IS NULL OR :ville = '' OR LOWER(m.ville) = LOWER(:ville)) " +
            "AND (:domaine IS NULL OR :domaine = '' OR LOWER(m.domaine) = LOWER(:domaine)) " +
            "ORDER BY m.id DESC")
    List<Mission> searchPublicMissions(@Param("query") String query,
                                      @Param("ville") String ville,
                                      @Param("domaine") String domaine);

    List<Mission> findTop4ByStatutNotInOrderByIdDesc(List<StatutMission> statuts);
}
