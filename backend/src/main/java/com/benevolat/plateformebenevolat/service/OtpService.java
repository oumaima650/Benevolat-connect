package com.benevolat.plateformebenevolat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service OTP (One-Time Password) stocké en mémoire RAM (ConcurrentHashMap).
 * Ne persiste aucun code dans la base de données MySQL.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final JavaMailSender mailSender;

    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    @Value("${otp.expiration.minutes:1}")
    private int expirationMinutes;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    private record OtpEntry(String code, LocalDateTime expiryDate) {
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryDate);
        }
    }

    /**
     * Génère et envoie un OTP par email en le conservant uniquement en mémoire.
     */
    public void generateAndSendOtp(String email) {
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(expirationMinutes);

        // Stockage en mémoire RAM
        otpCache.put(email, new OtpEntry(code, expiryDate));

        if (mailFrom != null && !mailFrom.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailFrom);
                message.setTo(email);
                message.setSubject("CountMeIn — Votre code de vérification");
                message.setText("Bonjour,\n\nVotre code de vérification CountMeIn est : " + code
                        + "\n\nCe code est valable " + expirationMinutes + " minute(s)."
                        + "\n\nSi vous n'avez pas demandé ce code, ignorez cet email."
                        + "\n\n— L'équipe CountMeIn");
                mailSender.send(message);
                log.info("OTP (en mémoire) envoyé à : {}", email);
            } catch (Exception e) {
                log.error("Erreur envoi email OTP à {} : {}", email, e.getMessage());
            }
        } else {
            log.info("==== OTP DEV MODE (En mémoire) ==== Code pour {} : {}", email, code);
        }
    }

    /**
     * Vérifie un OTP depuis le cache en mémoire RAM.
     */
    public boolean verifyOtp(String email, String code) {
        OtpEntry entry = otpCache.get(email);

        if (entry == null) {
            log.warn("Aucun OTP en mémoire pour l'email : {}", email);
            return false;
        }

        if (entry.isExpired()) {
            otpCache.remove(email);
            log.warn("OTP expiré pour : {}", email);
            return false;
        }

        if (!entry.code().equals(code)) {
            log.warn("Code OTP incorrect pour : {}", email);
            return false;
        }

        // OTP valide : on le supprime de la mémoire (consommé)
        otpCache.remove(email);
        log.info("OTP (en mémoire) validé avec succès pour : {}", email);
        return true;
    }
}
