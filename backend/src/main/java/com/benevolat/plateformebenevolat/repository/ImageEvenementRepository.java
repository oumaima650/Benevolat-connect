package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.ImageEvenement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageEvenementRepository extends JpaRepository<ImageEvenement, Long> {
}
