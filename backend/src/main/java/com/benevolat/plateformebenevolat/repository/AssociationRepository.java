package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Association;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssociationRepository extends JpaRepository<Association, Long> {
}
