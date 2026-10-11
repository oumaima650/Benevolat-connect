package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Certificat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
