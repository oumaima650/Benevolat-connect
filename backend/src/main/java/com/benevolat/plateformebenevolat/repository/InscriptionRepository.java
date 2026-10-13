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

    /** Vérifie si le bénévole possède déjà une inscription active (CONFIRMEE ou EN_LISTE_ATTENTE). */
    @Query("SELECT COUNT(i) > 0 FROM Inscription i " +
            "WHERE i.benevole.idUtilisateur = :benevoleId AND i.mission.idMission = :missionId " +
            "AND i.statut IN (:statuts)")
    boolean existsActive(@Param("benevoleId") Long benevoleId,
                         @Param("missionId") Long missionId,
                         @Param("statuts") List<StatutInscription> statuts);
}
