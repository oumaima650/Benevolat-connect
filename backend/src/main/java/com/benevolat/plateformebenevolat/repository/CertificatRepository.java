package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Certificat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CertificatRepository extends JpaRepository<Certificat, Long> {

    @Query("""
        SELECT c FROM Certificat c
        JOIN FETCH c.inscription i
        JOIN FETCH i.benevole b
        JOIN FETCH i.mission m
        JOIN FETCH m.association a
        WHERE UPPER(c.codeVerification) = UPPER(:code)
    """)
    Optional<Certificat> findByCodeVerificationIgnoreCase(@Param("code") String code);

    List<Certificat> findByInscription_Mission_IdMission(Long missionId);

    Optional<Certificat> findByInscription_IdInscription(Long inscriptionId);

    List<Certificat> findByInscription_Benevole_IdUtilisateur(Long benevoleId);

    long countByInscription_Benevole_IdUtilisateur(Long benevoleId);

    /** Certificats d'un bénévole avec mission, association et domaine (calcul des badges). */
    @Query("""
        SELECT c FROM Certificat c
        JOIN FETCH c.inscription i
        JOIN FETCH i.mission m
        JOIN FETCH m.association
        LEFT JOIN FETCH m.domaine
        WHERE i.benevole.idUtilisateur = :benevoleId
    """)
    List<Certificat> findAvecMissionByBenevole(@Param("benevoleId") Long benevoleId);

    /** Niveau (nombre de certificats) de plusieurs bénévoles : [idBenevole, nombre]. */
    @Query("""
        SELECT i.benevole.idUtilisateur, COUNT(c) FROM Certificat c
        JOIN c.inscription i
        WHERE i.benevole.idUtilisateur IN :benevoleIds
        GROUP BY i.benevole.idUtilisateur
    """)
    List<Object[]> compterParBenevole(@Param("benevoleIds") Collection<Long> benevoleIds);
}
