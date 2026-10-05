package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {
    int countByMissionIdAndStatut(Long missionId, StatutInscription statut);
    List<Inscription> findByMissionId(Long missionId);
}
