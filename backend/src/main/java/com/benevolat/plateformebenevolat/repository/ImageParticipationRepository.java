package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.ImageParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageParticipationRepository extends JpaRepository<ImageParticipation, Long> {

    List<ImageParticipation> findByInscription_IdInscriptionOrderByDatePublicationDesc(Long inscriptionId);

    /** Toutes les images de participation d'un bénévole, avec mission et association. */
    @org.springframework.data.jpa.repository.Query("""
        SELECT ip FROM ImageParticipation ip
        JOIN FETCH ip.inscription i
        JOIN FETCH i.mission m
        JOIN FETCH m.association a
        WHERE i.benevole.idUtilisateur = :benevoleId
        ORDER BY ip.datePublication DESC
    """)
    List<ImageParticipation> findByBenevoleId(@org.springframework.data.repository.query.Param("benevoleId") Long benevoleId);
}
