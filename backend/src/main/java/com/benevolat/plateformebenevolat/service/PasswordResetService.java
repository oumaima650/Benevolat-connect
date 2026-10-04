package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.ForgotPasswordRequest;
import com.benevolat.plateformebenevolat.dto.ResetPasswordRequest;
import com.benevolat.plateformebenevolat.entity.PasswordResetToken;
import com.benevolat.plateformebenevolat.entity.Utilisateur;
import com.benevolat.plateformebenevolat.repository.PasswordResetTokenRepository;
import com.benevolat.plateformebenevolat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service de réinitialisation de mot de passe pour la hiérarchie Utilisateur.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Traite la demande de réinitialisation de mot de passe (génère un token).
     */
    @Transactional
    public boolean processForgotPassword(ForgotPasswordRequest request) {
        String emailClean = request.getEmail().toLowerCase().trim();
        Optional<Utilisateur> userOpt = userRepository.findByEmail(emailClean);

        if (userOpt.isEmpty()) {
            log.warn("Demande de réinitialisation pour email inexistant : {}", emailClean);
            return true;
        }

        Utilisateur user = userOpt.get();

        // Supprimer d'anciens tokens
        tokenRepository.deleteByUtilisateur(user);

        // Créer un nouveau token (valide 24h)
        String tokenStr = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(tokenStr);
        resetToken.setUtilisateur(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));

        tokenRepository.save(resetToken);

        log.info("Token de réinitialisation créé pour {} : {}", emailClean, tokenStr);
        log.info("Lien de réinitialisation : http://localhost:5173/reset-password?token={}", tokenStr);

        return true;
    }

    /**
     * Réinitialise le mot de passe via le token fourni.
     */
    @Transactional
    public boolean resetPassword(ResetPasswordRequest request) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(request.getToken());

        if (tokenOpt.isEmpty()) {
            log.warn("Jeton de réinitialisation invalide : {}", request.getToken());
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();

        if (resetToken.isExpired()) {
            log.warn("Jeton de réinitialisation expiré : {}", request.getToken());
            tokenRepository.delete(resetToken);
            return false;
        }

        Utilisateur user = resetToken.getUtilisateur();
        user.setMotDePasseHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        tokenRepository.delete(resetToken);

        log.info("Mot de passe réinitialisé pour l'utilisateur : {}", user.getEmail());
        return true;
    }
}
