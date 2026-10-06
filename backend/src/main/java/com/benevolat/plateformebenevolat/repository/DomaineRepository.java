package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Domaine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DomaineRepository extends JpaRepository<Domaine, Long> {
    Optional<Domaine> findByNom(String nom);
    Optional<Domaine> findByNomIgnoreCase(String nom);
    boolean existsByNomIgnoreCase(String nom);
}

