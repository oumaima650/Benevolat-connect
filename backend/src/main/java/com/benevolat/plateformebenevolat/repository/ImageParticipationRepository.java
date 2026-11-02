package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.ImageParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageParticipationRepository extends JpaRepository<ImageParticipation, Long> {

    List<ImageParticipation> findByInscription_IdInscriptionOrderByDatePublicationDesc(Long inscriptionId);
}
