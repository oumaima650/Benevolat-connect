package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.Certificat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificatRepository extends JpaRepository<Certificat, Long> {
    Optional<Certificat> findByCodeVerification(String codeVerification);
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(c.nbHeures), 0) FROM Certificat c")
    long sumTotalHeuresValidees();
}
