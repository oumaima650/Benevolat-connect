package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.entity.OtpCode;
import com.benevolat.plateformebenevolat.repository.OtpCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

/**
 * Service OTP (One-Time Password) pour la vérification de l'email lors de l'inscription.
 * Génère un code à 6 chiffres valable 10 minutes et l'envoie par email.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpCodeRepository otpRepository;
    private final JavaMailSender mailSender;

    @Value("${otp.expiration.minutes:10}")
    private int expirationMinutes;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    /**
     * Génère et envoie un OTP par email.
     * Si un OTP précédent existe pour cet email, il est supprimé.
     */
    @Transactional
    public void generateAndSendOtp(String email) {
        // Supprimer les anciens OTPs pour cet email
        otpRepository.deleteByEmail(email);

        // Générer code 6 chiffres
        String code = String.format("%06d", new Random().nextInt(1_000_000));

        OtpCode otp = new OtpCode();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setExpiryDate(LocalDateTime.now().plusMinutes(expirationMinutes));
        otp.setUsed(false);
        otpRepository.save(otp);

        // Envoi email si MAIL_USERNAME est configuré
        if (mailFrom != null && !mailFrom.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailFrom);
                message.setTo(email);
                message.setSubject("CountMeIn — Votre code de vérification");
                message.setText("Bonjour,\n\nVotre code de vérification CountMeIn est : " + code
                        + "\n\nCe code est valable " + expirationMinutes + " minutes."
                        + "\n\nSi vous n'avez pas demandé ce code, ignorez cet email."
                        + "\n\n— L'équipe CountMeIn");
                mailSender.send(message);
                log.info("OTP envoyé à : {}", email);
            } catch (Exception e) {
                log.error("Erreur envoi email OTP à {} : {}", email, e.getMessage());
            }
        } else {
            // Mode développement : affichage console
            log.info("==== OTP DEV MODE ==== Code pour {} : {}", email, code);
        }
    }

    /**
     * Vérifie un OTP soumis par l'utilisateur.
     * Marque l'OTP comme utilisé si valide.
     *
     * @return true si l'OTP est valide et non expiré, false sinon.
     */
    @Transactional
    public boolean verifyOtp(String email, String code) {
        Optional<OtpCode> otpOpt = otpRepository.findTopByEmailOrderByExpiryDateDesc(email);

        if (otpOpt.isEmpty()) {
            log.warn("Aucun OTP trouvé pour l'email : {}", email);
            return false;
        }

        OtpCode otp = otpOpt.get();

        if (otp.isUsed()) {
            log.warn("OTP déjà utilisé pour : {}", email);
            return false;
        }

        if (otp.isExpired()) {
            log.warn("OTP expiré pour : {}", email);
            return false;
        }

        if (!otp.getCode().equals(code)) {
            log.warn("Code OTP incorrect pour : {}", email);
            return false;
        }

        otp.setUsed(true);
        otpRepository.save(otp);
        log.info("OTP validé avec succès pour : {}", email);
        return true;
    }
}
