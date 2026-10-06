package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByEmailOrderByExpiryDateDesc(String email);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.email = :email")
    void deleteByEmail(String email);
}
