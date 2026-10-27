package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
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

    @Query("SELECT m FROM Mission m WHERE m.statut NOT IN ('BROUILLON', 'ANNULEE') " +
            "AND (:query IS NULL OR :query = '' OR LOWER(m.titre) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:ville IS NULL OR :ville = '' OR LOWER(m.association.ville) = LOWER(:ville)) " +
            "AND (:domaine IS NULL OR :domaine = '' OR LOWER(m.domaine.nom) = LOWER(:domaine)) " +
            "ORDER BY m.idMission DESC")
    List<Mission> searchPublicMissions(@Param("query") String query,
                                      @Param("ville") String ville,
                                      @Param("domaine") String domaine);

    List<Mission> findTop4ByStatutNotInOrderByIdMissionDesc(List<StatutMission> statuts);

    boolean existsByTitre(String titre);

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

    /** Passe en TERMINEE toutes les missions dont dateFin <= now et statut dans la liste. */
    @Modifying
    @Query("UPDATE Mission m SET m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.TERMINEE " +
           "WHERE m.statut IN :statuts AND m.dateFin <= :now")
    int passerEnTerminee(@Param("statuts") List<StatutMission> statuts, @Param("now") LocalDateTime now);

    @Query(
            value = """
                    SELECT m.idMission FROM Mission m
                    JOIN m.association a
                    JOIN m.domaine d
                    WHERE m.statut IN :statuts
                      AND m.estSignalee = false
                      AND a.statut = com.benevolat.plateformebenevolat.entity.StatutUtilisateur.ACTIF
                      AND (m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.RENFORT_URGENT
                           OR m.dateDebut > :now)
                      AND (:domaineId IS NULL OR d.idDomaine = :domaineId)
                      AND (:domaineNom IS NULL OR LOWER(d.nom) = LOWER(:domaineNom))
                      AND (:ville IS NULL OR LOWER(a.ville) = LOWER(:ville))
                      AND (:dateDebut IS NULL OR m.dateDebut >= :dateDebut)
                      AND (:placesDisponibles = false OR m.nbPlaces > 0)
                      AND (:competenceCount = 0 OR EXISTS (
                            SELECT 1 FROM m.competences c WHERE c.id IN :competenceIds
                      ))
                      AND (:inclureInscrites = true OR NOT EXISTS (
                            SELECT 1 FROM Inscription i
                            WHERE i.mission.idMission = m.idMission
                              AND i.benevole.idUtilisateur = :benevoleId
                              AND i.statut IN ('CONFIRMEE', 'EN_LISTE_ATTENTE')
                      ))
                    ORDER BY CASE WHEN m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.RENFORT_URGENT THEN 0 ELSE 1 END,
                             m.dateDebut ASC
                    """,
            countQuery = """
                    SELECT COUNT(m) FROM Mission m
                    JOIN m.association a
                    JOIN m.domaine d
                    WHERE m.statut IN :statuts
                      AND m.estSignalee = false
                      AND a.statut = com.benevolat.plateformebenevolat.entity.StatutUtilisateur.ACTIF
                      AND (m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.RENFORT_URGENT
                           OR m.dateDebut > :now)
                      AND (:domaineId IS NULL OR d.idDomaine = :domaineId)
                      AND (:domaineNom IS NULL OR LOWER(d.nom) = LOWER(:domaineNom))
                      AND (:ville IS NULL OR LOWER(a.ville) = LOWER(:ville))
                      AND (:dateDebut IS NULL OR m.dateDebut >= :dateDebut)
                      AND (:placesDisponibles = false OR m.nbPlaces > 0)
                      AND (:competenceCount = 0 OR EXISTS (
                            SELECT 1 FROM m.competences c WHERE c.id IN :competenceIds
                      ))
                      AND (:inclureInscrites = true OR NOT EXISTS (
                            SELECT 1 FROM Inscription i
                            WHERE i.mission.idMission = m.idMission
                              AND i.benevole.idUtilisateur = :benevoleId
                              AND i.statut IN ('CONFIRMEE', 'EN_LISTE_ATTENTE')
                      ))
                    """
    )
    Page<Long> findExplorerIds(
            @Param("statuts") List<StatutMission> statuts,
            @Param("now") LocalDateTime now,
            @Param("domaineId") Long domaineId,
            @Param("domaineNom") String domaineNom,
            @Param("ville") String ville,
            @Param("dateDebut") LocalDateTime dateDebut,
            @Param("placesDisponibles") boolean placesDisponibles,
            @Param("competenceCount") long competenceCount,
            @Param("competenceIds") Collection<Long> competenceIds,
            @Param("benevoleId") Long benevoleId,
            @Param("inclureInscrites") boolean inclureInscrites,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT m FROM Mission m
            JOIN FETCH m.association a
            JOIN FETCH m.domaine d
            LEFT JOIN FETCH m.competences
            WHERE m.idMission IN :ids
            """)
    List<Mission> findWithAssociationDomaineCompetences(@Param("ids") Collection<Long> ids);

    @Query("""
            SELECT m FROM Mission m
            JOIN FETCH m.association a
            JOIN FETCH m.domaine d
            WHERE m.statut IN :statuts
              AND m.estSignalee = false
              AND a.statut = com.benevolat.plateformebenevolat.entity.StatutUtilisateur.ACTIF
              AND (m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.RENFORT_URGENT
                   OR m.dateDebut > :now)
              AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
              AND (:domaineId IS NULL OR d.idDomaine = :domaineId)
              AND (:domaineNom IS NULL OR LOWER(d.nom) = LOWER(:domaineNom))
              AND (:dateDebut IS NULL OR m.dateDebut >= :dateDebut)
            ORDER BY CASE WHEN m.statut = com.benevolat.plateformebenevolat.entity.StatutMission.RENFORT_URGENT THEN 0 ELSE 1 END,
                     m.dateDebut ASC
            """)
    List<Mission> findCarteMissions(
            @Param("statuts") List<StatutMission> statuts,
            @Param("now") LocalDateTime now,
            @Param("domaineId") Long domaineId,
            @Param("domaineNom") String domaineNom,
            @Param("dateDebut") LocalDateTime dateDebut
    );
}
