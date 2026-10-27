package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Niveau;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NiveauRepository extends JpaRepository<Niveau, Long> {
    Optional<Niveau> findByNom(String nom);

    List<Niveau> findAllByOrderBySeuilMissionsAsc();
}
