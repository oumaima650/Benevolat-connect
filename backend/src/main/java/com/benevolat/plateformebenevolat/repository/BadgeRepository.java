package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findAllByOrderByOrdreAsc();

    boolean existsByCode(String code);
}
