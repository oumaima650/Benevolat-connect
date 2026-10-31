package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Obtention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ObtentionRepository extends JpaRepository<Obtention, Long> {
    List<Obtention> findByBenevole_IdUtilisateur(Long benevoleId);
    long countByBenevole_IdUtilisateur(Long benevoleId);

    @Query("""
            SELECT o FROM Obtention o
            JOIN FETCH o.badge
            WHERE o.benevole.idUtilisateur = :benevoleId
            ORDER BY o.dateAttribution DESC
            """)
    List<Obtention> findByBenevoleOrderByDateDesc(@Param("benevoleId") Long benevoleId);

    default Optional<Obtention> findDernierBadge(Long benevoleId) {
        List<Obtention> all = findByBenevoleOrderByDateDesc(benevoleId);
        return all.isEmpty() ? Optional.empty() : Optional.of(all.get(0));
    }
}
