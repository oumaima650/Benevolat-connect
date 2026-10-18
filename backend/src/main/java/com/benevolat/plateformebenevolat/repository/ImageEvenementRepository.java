package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.ImageEvenement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageEvenementRepository extends JpaRepository<ImageEvenement, Long> {

    List<ImageEvenement> findByMission_IdMissionOrderByDatePublicationDesc(Long missionId);
}
