package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Benevole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository JPA pour la gestion des Bénévoles.
 */
@Repository
public interface BenevoleRepository extends JpaRepository<Benevole, Long> {

    Optional<Benevole> findByEmail(String email);
}
