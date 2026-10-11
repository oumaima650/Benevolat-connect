package com.benevolat.plateformebenevolat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service OTP (One-Time Password) stocké en mémoire RAM (ConcurrentHashMap).
 * Délègue l'envoi d'email HTML à EmailService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final EmailService emailService;

    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    @Value("${otp.expiration.minutes:1}")
    private int expirationMinutes;

    private record OtpEntry(String code, LocalDateTime expiryDate) {
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryDate);
        }
    }

    /**
     * Génère et envoie un OTP par email (stocké uniquement en RAM).
     */
    public void generateAndSendOtp(String email) {
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(expirationMinutes);

        otpCache.put(email, new OtpEntry(code, expiryDate));

        if (emailService.isConfigured()) {
            emailService.sendOtp(email, code, expirationMinutes);
        } else {
            log.info("==== OTP DEV MODE ==== Code pour {} : {}", email, code);
        }
    }

    /**
     * Vérifie un OTP depuis le cache en RAM.
     * @param consume si true, supprime l'OTP après validation (usage unique)
     */
    public boolean verifyOtp(String email, String code, boolean consume) {
        OtpEntry entry = otpCache.get(email);

        if (entry == null) {
            log.warn("Aucun OTP en mémoire pour : {}", email);
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

        if (consume) {
            otpCache.remove(email);
        }
        log.info("OTP validé pour : {}", email);
        return true;
    }

    /** Surcharge rétrocompatible qui consomme l'OTP par défaut. */
    public boolean verifyOtp(String email, String code) {
        return verifyOtp(email, code, true);
    }
}
