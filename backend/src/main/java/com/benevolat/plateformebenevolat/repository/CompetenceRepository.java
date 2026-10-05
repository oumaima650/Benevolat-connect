package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Competence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompetenceRepository extends JpaRepository<Competence, Long> {
    Optional<Competence> findByNomIgnoreCase(String nom);
    boolean existsByNomIgnoreCase(String nom);
}
