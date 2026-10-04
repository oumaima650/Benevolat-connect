package com.benevolat.plateformebenevolat.repository;

import com.benevolat.plateformebenevolat.entity.PasswordResetToken;
import com.benevolat.plateformebenevolat.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository JPA pour les jetons de réinitialisation de mot de passe.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUtilisateur(Utilisateur utilisateur);
}
