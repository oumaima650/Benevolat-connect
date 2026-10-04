package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Association;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository JPA pour la gestion des Associations.
 */
@Repository
public interface AssociationRepository extends JpaRepository<Association, Long> {

    Optional<Association> findByEmail(String email);
}
